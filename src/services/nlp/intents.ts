import { Intent, ParsedMessage } from "./types.js";
import { Locale } from "../../types.js";
import {
  normalizeInput,
  extractMarketplace,
  extractTitle,
  extractProductName,
  extractNameFromFor,
  extractLabeledPrice,
  extractLabeledStock,
  extractCurrency,
  extractBarcode,
  extractAmount,
  extractPercent,
  extractCategory,
  extractBatchRequestId,
} from "./extractors.js";
import { detectLocale } from "./locales.js";

const DOCS_HINTS = /\b(dokuman(?:tasyon)?|documentation|docs|api)\b/i;

const SEARCH_VERB_PATTERNS = [
  /(?:bul|bulsana|bulsan|bulur\s+musun|bulabilir\s+misin)/i,
  /(?:ara|arasana|ara\s+bak)/i,
  /(?:bak|baksana|bakabilir\s+misin|bakar\s+misin)/i,
];

const WEB_SEARCH_HINTS =
  /\b(internet|internette|internetten|web|google|online|ara\u015ftir|ara\u015ftirma|ara\u015ftirip)\b/i;

export function determineIntent(message: string, localeHint?: Locale): ParsedMessage {
  const locale = localeHint ?? detectLocale(message);
  const normalized = normalizeInput(message);

  let marketplace = extractMarketplace(message);
  const title = extractTitle(message);
  const labeledPrice = extractLabeledPrice(message);
  const labeledStock = extractLabeledStock(message);
  const currency = extractCurrency(message);
  const barcode = extractBarcode(normalized);
  const batchRequestId = extractBatchRequestId(message);
  const category = extractCategory(message);

  const isPrice = /fiyat|price|preis|prix|precio/.test(normalized) || !!currency;
  const isStock = /stok|sto[gğ]|stock|bestand|lager|existencias|inventario/.test(normalized);
  const isCompetitor = /rakip|competitor|konkurrenz|concurrent|competencia/.test(normalized);

  const isIncrease = /artir|yukselt|zam|increase|raise|up|erhohen|augmenter|aumentar|subir/.test(normalized);
  const isDecrease = /azalt|dusur|indir|decrease|lower|down|reduce|verringern|diminuer|disminuir|bajar/.test(
    normalized,
  );

  // Expanded help hints
  const wantsHelp = /^(yardim|help|hilfe|aide|ayuda|komutlar|commands|menu(?:\s+list)?)$/i.test(normalized.trim());

  const wantsSyncConfirm = /^(evet|hayir|yes|no|ja|nein|oui|non|si|tamam|ok|okay|olur)$/i.test(normalized.trim());
  const wantsAdvice =
    /^(tavsiye|oneri|advice|suggest|suggestion|strateji|strategy|empfehlung|conseil|recomendacion)(\s|$)/i.test(
      normalized,
    );

  let intent: Intent = "unknown";
  let productName: string | undefined;
  const missing: string[] = [];

  const wantsAllMarketplaces = /\b((tum|tüm)\s+)?pazaryerler/i.test(normalized);
  if (!marketplace && wantsAllMarketplaces) {
    marketplace = "ALL";
  }

  // Check for Batch operations context
  // Allow suffixes for product keywords (e.g. urunler, urunlerin, products)
  const isAllProducts =
    /\b(tum|tüm|all|her|bütün|hepsi)\b/i.test(normalized) && /\b(urun|ürün|product|produkt|produit)/i.test(normalized);
  const isBatchOperation = isAllProducts || !!category;

  const wantsMarketplaceAdd =
    (Boolean(marketplace) || wantsAllMarketplaces) && /\b(ekle|listing|add|register|yayina\s+al)\b/i.test(normalized);

  // Specific check for listing marketplaces (without 'add' context)
  const wantsMarketplaceList =
    (/\b(listele|liste|list|goster|show)\b/i.test(normalized) &&
      /\bpazaryer/i.test(normalized) &&
      !/\b(ekle|add)\b/i.test(normalized)) ||
    (marketplace === "ALL" && /\b(listele|list)\b/i.test(normalized) && !/\b(ekle|add)\b/i.test(normalized));

  const wantsMarketplaceConfiguredList =
    /\bpazaryer/.test(normalized) &&
    /\b(hazir|hazirlik|ayar|bagli|konfigurasyon|config)\b/.test(normalized) &&
    /\b(goster|gostersene|listele|liste|hangi|hangiler|show|list)\b/.test(normalized);

  if (batchRequestId) {
    intent = "marketplace.batch.result";
  } else if (wantsSyncConfirm) {
    intent = "sync.confirm";
  } else if (wantsAdvice) {
    intent = "report.advice";
  } else if (wantsHelp) {
    intent = "help";
  } else if (wantsMarketplaceConfiguredList) {
    intent = "marketplace.configured.list";
  } else if (wantsMarketplaceList) {
    intent = "marketplace.list";
  } else if (wantsMarketplaceAdd) {
    intent = "marketplace.add";
    productName = title ?? extractProductName(message) ?? extractNameFromFor(message);
  } else if (isCompetitor) {
    intent = "competitor.list";
  } else if (isBatchOperation && isPrice) {
    intent = "batch.price.update";
  } else if (isBatchOperation && isStock) {
    intent = "batch.stock.update";
  } else if (isPrice && isIncrease) {
    intent = "price.increase";
  } else if (isPrice && isDecrease) {
    intent = "price.decrease";
  } else if (isPrice) {
    intent = "price.set";
  } else if (isStock && isIncrease) {
    intent = "stock.increase";
  } else if (isStock && isDecrease) {
    intent = "stock.decrease";
  } else if (isStock) {
    intent = "stock.set";
  } else {
    const hasSearchVerb = SEARCH_VERB_PATTERNS.some((pattern) => pattern.test(normalized));
    if (hasSearchVerb) {
      const cleaned = message
        .replace(SEARCH_VERB_PATTERNS[0], "")
        .replace(SEARCH_VERB_PATTERNS[1], "")
        .replace(SEARCH_VERB_PATTERNS[2], "")
        .replace(/\b(urun|OrOn|product|item)\b/gi, "")
        .trim();

      const candidate = cleaned || extractProductName(message) || extractNameFromFor(message);
      if (candidate) {
        if (WEB_SEARCH_HINTS.test(normalized)) {
          intent = "web.search";
          productName = candidate.trim();
        } else {
          intent = "product.info";
          productName = candidate.trim();
        }
      }
    }

    // Check if message looks like a simple product search
    const isSimpleProductQuery =
      !isPrice &&
      !isStock &&
      !isCompetitor &&
      normalized.length > 2 &&
      normalized.length < 50 &&
      !/\b(merhaba|selam|hello|hi|nasil|how|what|why|neden|niye|kimde|who|where|nerede)\b/i.test(normalized) &&
      !/\?/.test(normalized);

    if (isSimpleProductQuery && intent !== "web.search") {
      intent = "product.info";
      if (!productName) {
        const candidate = extractProductName(message) || extractNameFromFor(message);
        productName = candidate ?? message.trim();
      }
    }
  }

  const amount = extractAmount(normalized, barcode);
  const percent = extractPercent(normalized);

  if (intent === "marketplace.add") {
    if (!barcode) missing.push("barcode");
    if (!Number.isFinite(labeledPrice)) missing.push("price");
    if (!Number.isFinite(labeledStock)) missing.push("stock");
  }

  return {
    intent,
    barcode,
    amount,
    percent,
    productName,
    text: productName,
    title: title ?? productName,
    price: Number.isFinite(labeledPrice) ? labeledPrice : undefined,
    stock: Number.isFinite(labeledStock) ? labeledStock : undefined,
    currency,
    marketplace,
    locale,
    missing,
    batchRequestId,
    category,
  };
}
