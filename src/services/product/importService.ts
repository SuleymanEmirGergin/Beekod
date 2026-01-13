import path from "path";
import ExcelJS from "exceljs";
import { upsertProduct } from "./productService.js";
import { scrapeProductFromUrl } from "../productScraper.js";
import { rewriteProductContent, generateHtmlSpecTable, OptimizedContent } from "../ai/productRewriter.js";
import { getAllIntegrations } from "../marketplace/integrationService.js";
import { ShopifyConnector } from "../connectors/shopifyConnector.js";
import { WooConnector } from "../connectors/wooConnector.js";
import { logger } from "../../logger.js";

/**
 * Ürün içe aktarma servislerinin (Dosya ve URL) birleştirilmiş hali.
 */

// --- FILE IMPORT TYPES & UTILS ---

export type ProductImportRow = {
  barcode: string;
  name: string;
  price: number;
  stock: number;
  currency: string;
};

export type ProductImportError = {
  row: number;
  reason: string;
  barcode?: string;
  name?: string;
};

export type ProductImportResult = {
  total: number;
  imported: number;
  skipped: number;
  errors: ProductImportError[];
};

const HEADER_ALIASES: Record<string, keyof ProductImportRow> = {
  barcode: "barcode",
  barkod: "barcode",
  name: "name",
  urun: "name",
  product: "name",
  title: "name",
  baslik: "name",
  price: "price",
  fiyat: "price",
  stock: "stock",
  stok: "stock",
  currency: "currency",
  para: "currency",
  parabirimi: "currency",
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function cellToString(value: ExcelJS.CellValue) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
    if ("formula" in value && "result" in value) return value.result == null ? "" : String(value.result);
    if ("hyperlink" in value && typeof value.text === "string") return value.text;
  }
  return String(value);
}

function buildHeaderMap(worksheet: ExcelJS.Worksheet) {
  const map: Partial<Record<keyof ProductImportRow, number>> = {};
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, column) => {
    const raw = cellToString(cell.value);
    const normalized = normalizeHeader(raw);
    const alias = HEADER_ALIASES[normalized];
    if (alias) map[alias] = column;
  });
  return map;
}

function readText(worksheet: ExcelJS.Worksheet, rowNumber: number, column?: number) {
  if (!column) return "";
  const cell = worksheet.getRow(rowNumber).getCell(column);
  return cellToString(cell.value).trim();
}

function readNumber(worksheet: ExcelJS.Worksheet, rowNumber: number, column?: number) {
  if (!column) return null;
  const cell = worksheet.getRow(rowNumber).getCell(column);
  const raw = cellToString(cell.value).trim();
  if (!raw) return null;
  const num = Number(raw.replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

// --- FILE IMPORT LOGIC ---

export async function importProductsFromFile(filePath: string): Promise<ProductImportResult> {
  const ext = path.extname(filePath).toLowerCase();
  const workbook = new ExcelJS.Workbook();

  if (ext === ".csv") {
    await workbook.csv.readFile(filePath);
  } else if (ext === ".xlsx") {
    await workbook.xlsx.readFile(filePath);
  } else {
    throw new Error(`Desteklenmeyen dosya formatı: ${ext}`);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { total: 0, imported: 0, skipped: 0, errors: [] };

  const headerMap = buildHeaderMap(worksheet);
  const rows: Array<{ rowNumber: number; data: ProductImportRow }> = [];
  const errors: ProductImportError[] = [];
  const seen = new Set<string>();

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const barcode = readText(worksheet, rowNumber, headerMap.barcode);
    const name = readText(worksheet, rowNumber, headerMap.name);
    if (!barcode && !name) continue;
    if (!barcode || !name) {
      errors.push({ row: rowNumber, reason: "missing_required", barcode, name });
      continue;
    }
    const normalizedBarcode = barcode.toLowerCase();
    if (seen.has(normalizedBarcode)) {
      errors.push({ row: rowNumber, reason: "duplicate_barcode", barcode, name });
      continue;
    }
    seen.add(normalizedBarcode);
    const price = readNumber(worksheet, rowNumber, headerMap.price);
    const stockRaw = readNumber(worksheet, rowNumber, headerMap.stock);
    if (price == null || stockRaw == null) {
      errors.push({
        row: rowNumber,
        reason: price == null && stockRaw == null ? "missing_price_stock" : price == null ? "missing_price" : "missing_stock",
        barcode,
        name,
      });
      continue;
    }
    const stock = Math.trunc(stockRaw);
    if (price < 0 || stock < 0) {
      errors.push({ row: rowNumber, reason: "invalid_values", barcode, name });
      continue;
    }
    const currency = readText(worksheet, rowNumber, headerMap.currency) || "TRY";
    rows.push({
      rowNumber,
      data: {
        barcode: normalizedBarcode,
        name,
        price,
        stock,
        currency: currency.toUpperCase(),
      },
    });
  }

  let imported = 0;
  for (const row of rows) {
    await upsertProduct(row.data);
    imported += 1;
  }

  return {
    total: rows.length + errors.length,
    imported,
    skipped: errors.length,
    errors: errors.slice(0, 10),
  };
}

// --- URL IMPORT TYPES ---

export type UrlImportResult = {
    success: boolean;
    provider: string | "none";
    productName: string;
    editUrl?: string;
    localId?: string;
    aiImageInsight?: string;
    aiMarketInsight?: string;
    socialPosts?: OptimizedContent['socialPosts'];
    error?: string;
};

// --- URL IMPORT LOGIC ---

export async function importProductFromUrl(url: string, providerId?: "shopify" | "woocommerce"): Promise<UrlImportResult> {
    logger.info("import.url_start", { url, providerId });

    const scraped = await scrapeProductFromUrl(url);
    if (!scraped) {
        return { success: false, provider: providerId || "none", productName: "", error: "Pazaryerinden ürün verisi çekilemedi." };
    }

    const optimized = await rewriteProductContent(scraped);
    const specTable = generateHtmlSpecTable(scraped.attributes as Record<string, string> || {});

    let finalDescription = `${optimized.description}`;
    if (optimized.insights) {
        finalDescription += `\n\n<div style="background: #e3f2fd; border-left: 5px solid #2196f3; padding: 15px; margin: 20px 0;">
            <strong>💡 Müşteri Deneyimi Analizi (AI):</strong><br/>${optimized.insights}</div>`;
    }
    if (scraped.rating) {
        finalDescription += `\n\n<div style="color: #fbc02d; font-size: 18px; margin-bottom: 10px;">
            ${'★'.repeat(Math.round(scraped.rating))}${'☆'.repeat(5 - Math.round(scraped.rating))} 
            <span style="color: #666; font-size: 14px;">(${scraped.rating}/5)</span></div>`;
    }
    finalDescription += `\n\n${specTable}`;

    let aiImageInsight = "";
    let aiMarketInsight = "";
    try {
        const { getPriceSuggestion } = await import("../pricingService.js");
        const suggestion = await getPriceSuggestion(scraped.barcode || "");
        if (suggestion) aiMarketInsight = suggestion.reason;

        let imageBuffer = Buffer.from([]);
        let imgMime = "image/jpeg";
        if (scraped.imageUrl) {
            try {
                const imgRes = await fetch(scraped.imageUrl);
                if (imgRes.ok) {
                    imageBuffer = Buffer.from(await imgRes.arrayBuffer());
                    imgMime = imgRes.headers.get("content-type") || "image/jpeg";
                }
            } catch { }
        }

        const { analyzeImage } = await import("../ai/geminiClient.js");
        aiImageInsight = await analyzeImage({
            prompt: "Bu bir e-ticaret ürünü görseli. Profesyonelliğini tek cümlede değerlendir.",
            buffer: imageBuffer,
            mimeType: imgMime,
        }) || "";
    } catch (aiErr) {
        logger.warn("import.ai_insights_failed", { aiErr });
    }

    let localProduct = null;
    try {
        const upsertResult = await upsertProduct({
            barcode: scraped.barcode || `IMP${Date.now()}`,
            name: optimized.title,
            description: finalDescription,
            category: optimized.suggestedCategory || scraped.category || "Genel",
            price: scraped.price || 0,
            stock: scraped.stock || 50,
            currency: scraped.currency || "TRY",
            imageUrl: scraped.imageUrl,
            brand: scraped.category,
            sourceUrl: url,
            sourceSite: new URL(url).hostname,
        });
        if (upsertResult.ok) {
            localProduct = upsertResult.value;
        } else {
            logger.error("import.local_db_failed", { err: upsertResult.error });
        }
    } catch (dbErr) {
        logger.error("import.local_db_exception", { dbErr });
    }

    const integrations = await getAllIntegrations();
    let targetProvider = providerId;
    if (!targetProvider) {
        const supported = integrations.find(i => i.connected && (i.providerId === "shopify" || i.providerId === "woocommerce"));
        if (supported) targetProvider = supported.providerId as "shopify" | "woocommerce";
    }

    const integration = targetProvider ? integrations.find(i => i.providerId === targetProvider) : null;
    if (!integration || !integration.connected) {
        return {
            success: true,
            provider: targetProvider || "none",
            productName: optimized.title,
            localId: localProduct?.barcode,
            error: targetProvider
                ? `Envantere kaydedildi ancak ${targetProvider} bağlantısı olmadığı için mağazaya yüklenemedi.`
                : `Envantere kaydedildi. Mağaza bağlantısı bulunamadığı için sadece yerel envantere eklendi.`
        };
    }

    const finalProviderId = targetProvider!;
    try {
        let storeResult: { id: string; editUrl: string };
        const storeProduct = {
            ...scraped,
            name: optimized.title,
            description: finalDescription,
            category: optimized.suggestedCategory || scraped.category || "General"
        };

        if (finalProviderId === "shopify") {
            const connector = new ShopifyConnector(integration.config);
            storeResult = await connector.createProductDraft(storeProduct);
        } else {
            const connector = new WooConnector(integration.config);
            storeResult = await connector.createProductDraft(storeProduct);
        }

        return {
            success: true,
            provider: finalProviderId,
            productName: optimized.title,
            editUrl: storeResult.editUrl,
            localId: localProduct?.barcode,
            aiImageInsight,
            aiMarketInsight,
            socialPosts: optimized.socialPosts
        };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error("import.connector_error", { err });
        return {
            success: true,
            provider: finalProviderId,
            productName: optimized.title,
            localId: localProduct?.barcode,
            aiImageInsight,
            aiMarketInsight,
            socialPosts: optimized.socialPosts,
            error: `Envantere kaydedildi ancak mağazaya yüklenirken hata oluştu: ${msg}`
        };
    }
}
