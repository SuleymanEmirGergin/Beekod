import { Locale } from "../types.js";

export type Intent =
  | "price.set"
  | "price.increase"
  | "price.decrease"
  | "stock.set"
  | "stock.increase"
  | "stock.decrease"
  | "product.add"
  | "marketplace.add"
  | "marketplace.activate"
  | "marketplace.deactivate"
  | "marketplace.list"
  | "marketplace.price.set"
  | "marketplace.stock.set"
  | "marketplace.price.increase"
  | "marketplace.price.decrease"
  | "marketplace.stock.increase"
  | "marketplace.stock.decrease"
  | "marketplace.sync"
  | "marketplace.configured.list"
  | "marketplace.batch.result"
  | "marketplace.bulk"
  | "cargo.list"
  | "competitor.list"
  | "content.seo"
  | "content.social"
  | "content.translate.en"
  | "content.translate.tr"
  | "image.process"
  | "image.inspect"
  | "image.search"
  | "visual.search"
  | "web.search"
  | "pricing.recommend"
  | "report.sales"
  | "report.top_products"
  | "report.advice"
  | "cache.reset"
  | "sync.confirm"
  | "product.info"
  | "help"
  | "batch.price.update"
  | "batch.stock.update"
  | "stock.alert.list"
  | "network.stock.query"
  | "user.preferences.set"
  | "search"
  | "search.product"
  | "search.select"
  | "product.import"
  | "unknown";

export type ParsedMessage = {
  intent: Intent;
  barcode?: string;
  amount?: number;
  percent?: number;
  selectionIndex?: number; // For search.select intent (0-based)
  text?: string;
  query?: string;
  productName?: string;
  title?: string;
  price?: number;
  stock?: number;
  currency?: string;
  marketplace?: string;
  status?: "active" | "inactive";
  bulk?: boolean;
  category?: string;
  tone?: string;
  period?: "this_month" | "last_month" | "this_week" | "last_week";
  profile?: string;
  searchQuery?: string;
  searchLimit?: number;
  batchRequestId?: string;
  locale: Locale;
  missing: string[];
};

const EN_HINTS = [
  /\bprice\b/i,
  /\bstock\b/i,
  /\bincrease\b/i,
  /\bdecrease\b/i,
  /\bproduct\b/i,
  /\bsearch\b/i,
  /\bhelp\b/i,
  /\bmarketplace\b/i,
  /\b(hello|hi|what|is|the|how|please|thank|thanks|advice|suggest|suggestion|strategy)\b/i,
];

const TR_HINTS = [
  /\b(merhaba|selam|gunaydin|iyi\s+gunler|nasil|nasilsin|lutfen|yardim|urun|fiyat|stok|barkod|pazaryeri|satis|rapor)\b/i,
];

const DE_HINTS = [
  /\b(hallo|guten|morgen|tag|hilfe|produkt|preis|bestand|lager|markt|suche|bericht|erhoehen|verringern)\b/i,
  /\bpreis\b/i,
  /\bbestand\b/i,
];

const FR_HINTS = [
  /\b(bonjour|salut|aide|produit|prix|stock|marche|recherche|rapport|augmenter|diminuer)\b/i,
  /\bprix\b/i,
];

const ES_HINTS = [
  /\b(hola|buenos|dias|ayuda|producto|precio|stock|mercado|buscar|busqueda|informe|aumentar|disminuir)\b/i,
  /\bprecio\b/i,
  /\bexistencias\b/i,
];

// Reduced to characters unique to Turkish
const LOCALE_TURKISH_CHAR_PATTERN = /[ğış]/i;

function normalizeLocaleInput(message: string) {
  return message
    .normalize("NFD")
    .replace(/\u0131/g, "i")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const DOCS_HINTS = /\b(dokuman(?:tasyon)?|documentation|docs|api)\b/i;

const SEARCH_LIMIT_PATTERNS = [
  /\b(?:ilk|top|first)\s+(\d{1,2})\b/i,
  /\b(\d{1,2})\s*(?:sonuc|tane|adet|result|results)\b/i,
  /\b(?:sonuc|results)\s*(\d{1,2})\b/i,
];

const SEARCH_VERB_PATTERNS = [
  /(?:bul|bulsana|bulsan|bulur\s+musun|bulabilir\s+misin)/i,
  /(?:ara|arasana|ara\s+bak)/i,
  /(?:bak|baksana|bakabilir\s+misin|bakar\s+misin)/i,
];

const WEB_SEARCH_HINTS =
  /\b(internet|internette|internetten|web|google|online|trendyol|n11|hepsiburada|pttavm|pazarama|amazon|link|fiyat|fiyati|ne\s*kadar|nereden|satin\s*al)\b/i;

// Web sinyal tespiti - bu kelimeleri iceren sorgular web'e yonlendirilir
function hasWebSignals(q: string): boolean {
  const s = q.toLowerCase();
  return /(fiyat|trendyol|n11|hepsiburada|pttavm|pazarama|amazon|link|internet|web|google|online|satin|nereden|ne\s*kadar)/.test(s);
}

// Inventory sinyal tespiti - bu kelimeleri iceren sorgular envanterden aranir
function hasInventorySignals(q: string): boolean {
  const s = q.toLowerCase();
  return /(stok|barkod|barcode|kategori|satis|ciro|kritik|envanter|liste|depo|adet|miktar|kalan)/.test(s);
}

const MARKETPLACE_ALIASES: Record<string, string> = {
  trendyol: "Trendyol",
  hepsiburada: "Hepsiburada",
  amazon: "Amazon",
  hb: "Hepsiburada",
};

const WORD_NUMBERS: Record<string, number> = {
  bir: 1,
  iki: 2,
  uc: 3,
  dort: 4,
  bes: 5,
  alti: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
  on: 10,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export function detectLocale(message: string): Locale {
  const trimmed = message.trim();
  if (!trimmed) return "tr";

  if (LOCALE_TURKISH_CHAR_PATTERN.test(trimmed)) return "tr";

  const normalized = normalizeLocaleInput(message);

  const scores = { tr: 0, en: 0, de: 0, fr: 0, es: 0, ar: 0 };

  const countMatches = (text: string, hints: RegExp[]) =>
    hints.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);

  scores.en = countMatches(normalized, EN_HINTS);
  scores.tr = countMatches(normalized, TR_HINTS);
  scores.de = countMatches(normalized, DE_HINTS);
  scores.fr = countMatches(normalized, FR_HINTS);
  scores.es = countMatches(normalized, ES_HINTS);
  scores.ar = normalized.match(/[\u0600-\u06FF]/) ? 10 : 0; // Simple detection for Arabic script

  let maxScore = 0;
  let bestLocale: Locale = "tr";

  (Object.keys(scores) as Locale[]).forEach((loc) => {
    if (scores[loc] > maxScore) {
      maxScore = scores[loc];
      bestLocale = loc;
    }
  });


  if (maxScore === 0) return "tr";
  return bestLocale;
}

function normalizeInput(message: string) {
  return message
    .normalize("NFD")
    .replace(/\u0131/g, "i") // ı -> i
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isLikelyBarcode(value: string) {
  return /\d/.test(value);
}

function extractBarcode(normalized: string) {
  const patterns = [
    /([a-z0-9-]+)\s+(?:barkod\w*|barcode\w*|code)/,
    /(?:barkod\w*|barcode\w*|code)\s*[:#]?\s*([a-z0-9-]+)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const candidate = match[1];
    if (!candidate || !isLikelyBarcode(candidate)) continue;
    return candidate;
  }

  const tokens = normalized.split(/[^a-z0-9-]+/).filter(Boolean);
  const fallback = tokens.find((token) => /[a-z]/.test(token) && /\d/.test(token));
  return fallback && isLikelyBarcode(fallback) ? fallback : undefined;
}

function extractBatchRequestId(message: string) {
  const patterns = [
    /batch-requests\/([a-z0-9-]+)/i,
    /batchrequestid\s*[:#=]?\s*([a-z0-9-]+)/i,
    /batch\s*request\s*(?:id)?\s*[:#=]?\s*([a-z0-9-]+)/i,
    /batch\s*id\s*[:#=]?\s*([a-z0-9-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  const normalized = normalizeInput(message);
  const normalizedPatterns = [
    /toplu\s*(?:islem|istek)\s*(?:id)?\s*[:#=]?\s*([a-z0-9-]+)/i,
    /batch\s*sonuc\s*[:#=]?\s*([a-z0-9-]+)/i,
    /batch\s*durum\s*[:#=]?\s*([a-z0-9-]+)/i,
  ];
  for (const pattern of normalizedPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function extractMarketplace(message: string) {
  const normalized = message.toLowerCase();
  for (const [key, value] of Object.entries(MARKETPLACE_ALIASES)) {
    // Relaxed regex to allow suffixes (e.g. Trendyola, Amazonu)
    const pattern = new RegExp(`\\b${key}`, "i");
    if (pattern.test(normalized)) return value;
  }
  const allPattern =
    /\b(tum\s+pazaryerleri|pazaryerleri|all\s+marketplaces|marketplaces|alle\s+markt|tous\s+marche|todos\s+mercados)\b/i;
  if (allPattern.test(normalized)) return "ALL";
  return undefined;
}

function extractTitle(message: string) {
  const match = message.match(/(?:urun|product|title|baslik|name|produkt|produit|producto)\s*[:\-]\s*([^,]+)/i);
  if (!match) return undefined;
  let value = match[1].trim();
  value = value.replace(/\b(fiyat|stok|price|stock|preis|prix|precio)\b.*$/i, "").trim();
  return value || undefined;
}

function extractLabeledPrice(message: string) {
  const match = message.match(/(?:fiyat|price|preis|prix|precio)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  if (!match) return undefined;
  return Number(match[1].replace(",", "."));
}

function extractLabeledStock(message: string) {
  const match = message.match(/(?:stok|stock|bestand|lager|existencias)\s*[:=]?\s*(\d+)/i);
  if (!match) return undefined;
  return Number(match[1]);
}

function extractCurrency(message: string) {
  if (/\btry\b|\btl\b/i.test(message)) return "TRY";
  if (/\busd\b/i.test(message)) return "USD";
  if (/\beur\b/i.test(message)) return "EUR";
  return undefined;
}

function extractStatus(message: string) {
  if (/\bpasif|inactive|deactivate|disabled|inactif|inactivo\b/i.test(message)) return "inactive";
  if (/\baktif|active|activate|enabled|actif|activo\b/i.test(message)) return "active";
  return undefined;
}

function extractAmount(normalized: string, barcode?: string) {
  const matches = [...normalized.matchAll(/\d+(?:[.,]\d+)?/g)];
  const barcodeLower = barcode?.toLowerCase();

  for (const match of matches) {
    const value = match[0];
    const start = match.index ?? 0;
    const end = start + value.length;
    const before = normalized[start - 1] ?? " ";
    const after = normalized[end] ?? " ";
    const windowStart = Math.max(0, start - 10);
    const window = normalized.slice(windowStart, end + 10);

    if (barcodeLower && value === barcodeLower) continue;
    if (/[a-z]/.test(before) || /[a-z]/.test(after)) continue;
    if (/barkod|barcode/.test(window)) continue;

    return Number(value.replace(",", "."));
  }

  for (const [word, value] of Object.entries(WORD_NUMBERS)) {
    const regex = new RegExp(`\\b${word}\\b`);
    if (regex.test(normalized)) return value;
  }

  return undefined;
}

function extractPercent(normalized: string) {
  const direct = normalized.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (direct) return Number(direct[1].replace(",", "."));
  const inverse = normalized.match(/%\s*(\d+(?:[.,]\d+)?)/);
  if (inverse) return Number(inverse[1].replace(",", "."));
  const trailing = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:percent|yuzde|prozent|pourcent|porciento)/);
  if (trailing) return Number(trailing[1].replace(",", "."));
  return undefined;
}

function extractText(message: string) {
  const quoteMatch = message.match(/"([^"]+)"/) ?? message.match(/'([^']+)'/);
  if (quoteMatch) return quoteMatch[1].trim();

  const colonIndex = message.lastIndexOf(":");
  if (colonIndex !== -1 && colonIndex < message.length - 1) {
    return message.slice(colonIndex + 1).trim();
  }

  const dashIndex = message.lastIndexOf("-");
  if (dashIndex !== -1 && dashIndex < message.length - 1) {
    return message.slice(dashIndex + 1).trim();
  }

  return undefined;
}

function extractProductName(message: string) {
  const labeled = extractText(message);
  if (labeled) {
    const cleaned = labeled.replace(/\b(fiyat|stok|price|stock|rakip|competitor)\b.*$/i, "").trim();
    return cleaned || labeled;
  }
  const match = message.match(
    /(?:urun|ürün|product|produkt|produit|producto)(?:\s+|:)(.+?)(?:\s*(?:[,.]\s*)?(?:fiyat|stok|price|stock|rakip|competitor)\b|$)/i,
  );
  if (match) return match[1].trim();
  return undefined;
}

function extractNameFromFor(message: string) {
  const match = message.match(/(.+?)\s+(?:icin|i\u00e7in|for|fuer|pour|para)\b/i);
  if (!match) return undefined;
  let value = match[1].trim();
  value = value.replace(/^(?:bu|su|bir|the|a|an|das|ein|le|la|el|un)\s+/i, "");
  value = value.replace(/^(?:urun|u\u00fcr\u00fcn|product|produkt|produit|producto)\b\s*/i, "");
  const normalized = value.toLowerCase();
  if (!value || value.length < 3) return undefined;

  const blocked = [
    "seo",
    "aciklama",
    "description",
    "sosyal",
    "social",
    "post",
    "fiyat",
    "price",
    "stok",
    "stock",
    "barkod",
    "barcode",
  ];
  if (blocked.some((word) => normalized.includes(word))) return undefined;

  return value;
}

function extractCategory(message: string) {
  const match = message.match(/(?:kategori|category|kategorie|categorie|categoria)\s*[:\-]?\s*([^\n\r,]+)/i);
  if (!match) return undefined;
  return match[1].trim();
}

function extractTone(message: string) {
  const labeled = message.match(/(?:ton|tone)\s*[:\-]?\s*([a-z0-9_-]+)/i);
  if (labeled) return labeled[1].trim();
  if (/\bpremium|lux|luks|elite\b/i.test(message)) return "premium";
  if (/\bcasual|samimi|gunluk|daily\b/i.test(message)) return "casual";
  if (/\benerjik|energetic|dinamik|dynamic\b/i.test(message)) return "energetic";
  return undefined;
}

function extractProfile(message: string) {
  const match = message.match(/(?:profile|profil)\s*[:=]\s*([a-z0-9_-]+)/i);
  if (!match) return undefined;
  return match[1].trim();
}

function extractSearchQuery(message: string) {
  const cleanedMessage = message.trim();
  if (/\bsite\s*[:=]/i.test(message)) return message.trim();
  return undefined;
}

function extractImageSearchText(message: string) {
  return undefined;
}

export function parseMessage(message: string, localeHint?: Locale): ParsedMessage {
  const locale = localeHint ?? detectLocale(message);
  const normalized = normalizeInput(message);
  let marketplace = extractMarketplace(message);
  const title = extractTitle(message);
  const labeledPrice = extractLabeledPrice(message);
  const labeledStock = extractLabeledStock(message);
  const currency = extractCurrency(message);
  const barcode = extractBarcode(normalized);
  let selectionIndex: number | undefined = undefined; // For search.select intent
  let amount = extractAmount(normalized, barcode);

  const isPrice = /fiyat|price|preis|prix|precio|try|tl|usd|eur|dolar|euro/.test(normalized);
  const isStock = /stok|sto[gğ]|stock|bestand|lager|existencias|inventario/.test(normalized);
  const isCompetitor = /rakip|competitor|konkurrenz|concurrent|competencia/.test(normalized);

  const isIncrease = /artir|yukselt|zam|increase|raise|up|erhohen|augmenter|aumentar|subir/.test(normalized);
  const isDecrease = /azalt|dusur|indir|decrease|lower|down|reduce|verringern|diminuer|disminuir|bajar/.test(
    normalized,
  );

  const wantsHelp = /^(yardim|help|komutlar|hilfe|aide|ayuda)$/i.test(normalized.trim());
  const wantsSyncConfirm = /^(evet|hayir|yes|no|ja|nein|oui|non|si|tamam|ok|okay|olur)$/i.test(normalized.trim());
  const wantsAdvice =
    /^(tavsiye|oneri|advice|suggest|suggestion|strateji|strategy|empfehlung|conseil|recomendacion)(\s|$)/i.test(
      normalized,
    );
  const wantsPrefs = /^\/myprefs\b/i.test(normalized);
  const wantsCacheReset = /^\/(cache-reset|flush-cache)\b/i.test(normalized);

  // Network stock query - "kimde var", "başka kim satıyor", "who has", "من عنده"
  const wantsNetworkStockQuery =
    /\b(kimde\s+var|başka\s+kim|kim\s+satıyor|kim\s+satıyor|toptancı\s+ara|bayi\s+ara|network\s+sorgula|network\s+stock)\b/i.test(normalized) ||
    /\b(who\s+has|which\s+wholesaler|find\s+wholesaler|network\s+query)\b/i.test(normalized) ||
    /\b(من\s+عنده|أين\s+يوجد|البائع|التاجر)\b/i.test(normalized);

  let intent: Intent = "unknown";
  let productName: string | undefined;
  const missing: string[] = [];

  const wantsAllMarketplaces = /\b((tum|tüm)\s+)?pazaryerler/i.test(normalized);
  if (!marketplace && wantsAllMarketplaces) {
    marketplace = "ALL";
  }

  const wantsMarketplaceAdd =
    (Boolean(marketplace) || wantsAllMarketplaces) &&
    /\b(ekle|listele|listing|add|register|yayina\s+al)\b/i.test(normalized);

  // Contextual Import: "Bu ürünü ekle", "Bunu ekle", "Add this product"
  const wantsContextImport = /\b(bu\s+urunu|bu\s+ürünü|bunu|şunu|sunu|this\s+product|this\s+one|it)\s+(ekle|add|import|alıver|al|getir)/i.test(normalized);

  const wantsMarketplaceConfiguredList =
    /\bpazaryer/.test(normalized) &&
    /\b(hazir|hazirlik|ayar|bagli|konfigurasyon|config)\b/.test(normalized) &&
    /\b(goster|gostersene|listele|liste|hangi|hangiler|show|list)\b/.test(normalized);

  const wantsMarketplaceList =
    /\bpazaryer/.test(normalized) &&
    /\b(listele|liste|show|list)\b/.test(normalized) &&
    !wantsMarketplaceConfiguredList;

  const hasAddKeyword = /\b(ekle|olustur|kaydet|add|create|save|insert)\b/i.test(normalized);
  const hasProductKeyword = /\b(barkod|barcode|urun|ürün|product|item)\b/i.test(normalized);
  const isExplicitProductAdd = hasAddKeyword && hasProductKeyword && !wantsMarketplaceAdd && !wantsNetworkStockQuery && !wantsMarketplaceConfiguredList;

  // DEBUG
  console.log("🔍 NLP Debug:", {
    hasAddKeyword,
    hasProductKeyword,
    wantsMarketplaceAdd,
    isExplicitProductAdd,
    normalized: normalized.substring(0, 100)
  });

  if (wantsContextImport) {
    intent = "product.import";
    productName = extractProductName(message) ?? extractNameFromFor(message);
  } else if (isExplicitProductAdd) {
    intent = "product.add";
    productName = extractProductName(message) ?? extractNameFromFor(message) ?? extractText(message);
  } else if (wantsSyncConfirm) {
    intent = "sync.confirm";
  } else if (wantsPrefs) {
    intent = "user.preferences.set";
  } else if (wantsCacheReset) {
    intent = "cache.reset";
  } else if (wantsAdvice) {
    intent = "report.advice";
  } else if (wantsHelp) {
    intent = "help";
  } else if (wantsNetworkStockQuery) {
    intent = "network.stock.query";
  } else if (wantsMarketplaceConfiguredList) {
    intent = "marketplace.configured.list";
  } else if (wantsMarketplaceList) {
    intent = "marketplace.list";
  } else if (wantsMarketplaceAdd) {
    intent = "marketplace.add";
    productName = title ?? extractProductName(message) ?? extractNameFromFor(message);
  } else if (isCompetitor) {
    intent = "competitor.list";

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
  }

  // Import Intent Detection
  const isImportArg = /\b(import|iÃ§eri|aktar|al|getir|fetch|clone)\b/i.test(normalized);
  const hasUrl = /https?:\/\/[^\s]+/.test(message);

  if (isImportArg && hasUrl) {
    intent = "product.import";
    // Extract URL as text
    const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      productName = urlMatch[0]; // Reuse text/productName field for URL
    }
  } else if (intent === "unknown") {
    // Check normal search verbs
    const hasSearchVerb = SEARCH_VERB_PATTERNS.some((pattern) => pattern.test(normalized));
    if (hasSearchVerb) {
      const cleaned = message
        .replace(SEARCH_VERB_PATTERNS[0], "")
        .replace(SEARCH_VERB_PATTERNS[1], "")
        .replace(SEARCH_VERB_PATTERNS[2], "")
        .replace(/\b(urun|ürün|product|item)\b/gi, "")
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

    // Visual Search Detection
    const isVisualSearch = /\b(gorsel|resim|foto|image|visual|photo|pic)\b/i.test(normalized) &&
      /\b(ara|bul|bak|search|find|lookup)\b/i.test(normalized);

    if (isVisualSearch) {
      intent = "image.search";
      const candidate = message.replace(/\b(gorsel|resim|foto|image|visual|photo|pic|ara|bul|bak|search|find|lookup)\b/gi, "").trim();
      productName = candidate || productName;
    }



    // Check if message looks like a simple product search
    // Also check for "Barkod: 8681234567890" format
    const isBarcodeQuery = /^barkod\s*[:#]\s*[a-z0-9-]+/i.test(message.trim()) || /^barcode\s*[:#]\s*[a-z0-9-]+/i.test(message.trim());
    const isSimpleProductQuery =
      !isPrice &&
      !isStock &&
      !isCompetitor &&
      !wantsNetworkStockQuery &&
      normalized.length > 2 &&
      normalized.length < 50 &&
      !/\b(merhaba|selam|hello|hi|nasil|how|what|why|neden|niye|kimde|who|where|nerede)\b/i.test(normalized) &&
      !/\?/.test(normalized);

    // Check for Search Selection (e.g. "1", "2.yi seç", "birinci")
    // Should be checked before general numeric/amount extraction if valid
    const selectionMatch =
      message.match(/^(\d{1,2})$/) || // Exact number "1"
      message.match(/^(\d{1,2})[\.,]?(?:ci|cu|cı|uncu|inci|st|nd|rd|th)?\s*(?:sec|seç|ekle|add|al|getir|import)/i) || // "1.yi seç"
      message.match(/^(birinci|ikinci|ucuncu|dorduncu|besinci|altinci|yedinci|sekizinci|dokuzuncu|onuncu)\s*(?:sec|seç|ekle|add)?/i); // "birinciyi"

    if (selectionMatch && intent === "unknown") {
      if (selectionMatch[1]) {
        // Numeric match
        const num = parseInt(selectionMatch[1]);
        if (!isNaN(num) && num >= 1 && num <= 10) {
          selectionIndex = num - 1;
        } else {
          // Text match conversion
          const ordinal = selectionMatch[1].toLowerCase();
          const map: Record<string, number> = {
            "birinci": 0, "ikinci": 1, "ucuncu": 2, "dorduncu": 3, "besinci": 4,
            "altinci": 5, "yedinci": 6, "sekizinci": 7, "dokuzuncu": 8, "onuncu": 9
          };
          if (map[ordinal] !== undefined) selectionIndex = map[ordinal];
        }
      }

      if (selectionIndex !== undefined && selectionIndex >= 0) {
        intent = "search.select";
      }
    }

    if (isBarcodeQuery && barcode) {
      intent = "product.info";
    } else if (isSimpleProductQuery && intent !== "web.search") {
      // Check if it looks more like a web search (bul, ara) vs inventory query (stok, kategori)
      const looksLikeWebSearch = /\b(bul|ara|fiyat|nereden|nerede|satin|satın)\b/i.test(normalized);
      const looksLikeInventory = hasInventorySignals(normalized);

      if (looksLikeWebSearch && !looksLikeInventory) {
        intent = "web.search";
      } else {
        intent = "product.info";
      }
      if (!productName) {
        const candidate = extractProductName(message) || extractNameFromFor(message);
        productName = candidate ?? message.trim();
      }
    }
  }

  // Batch Intent Refinement
  // --- Explicit Intent Overrides for Common Queries ---
  // Must run AFTER initial detection to override generic 'stock.set' for 'critical stock'
  const isCriticalStockQuery = /\b(kritik|azalan|low)\s*(?:stok|stock)/i.test(normalized);
  if (isCriticalStockQuery) {
    intent = "stock.alert.list";
  }

  const isTopSellersQuery = /\b(en\s*cok|en\s*çok|top|best)\s*(?:satan|selling|sellers)/i.test(normalized);
  if (isTopSellersQuery) {
    intent = "report.top_products";
    if (!amount) amount = 5; // Default amount
  }

  const isPricingOptimizationQuery = /\b(fiyat|fiyatlarimi|price)\s*(?:optimize|analiz|oneri|tavsiye|iyilestir)/i.test(normalized);
  if (isPricingOptimizationQuery) {
    intent = "pricing.recommend";
  }

  // Batch Intent Refinement
  const category = extractCategory(message);
  // Removed \b at the end to allow suffixes like "urunlerin"
  const targetAll =
    /\b(tum|tüm|all|tous|todos|alle|butun)\b/i.test(normalized) && /\b(urun|product|item)/i.test(normalized);

  if (targetAll || category) {
    if (intent === "price.increase" || intent === "price.decrease" || intent === "price.set") {
      intent = "batch.price.update";
    } else if (intent === "stock.increase" || intent === "stock.decrease" || intent === "stock.set") {
      intent = "batch.stock.update";
    }
  }


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
    query: intent === "web.search" ? productName : undefined,
    title: title ?? productName,
    price: Number.isFinite(labeledPrice) ? labeledPrice : undefined,
    stock: Number.isFinite(labeledStock) ? labeledStock : undefined,
    currency,
    marketplace,
    locale,
    missing,
    selectionIndex
  };
}
