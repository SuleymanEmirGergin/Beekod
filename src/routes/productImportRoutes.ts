import { Router } from "express";
import { z } from "zod";
import { googleSearchService } from "../services/search/googleSearchService.js";
import { scrapeProductFromUrl } from "../services/productScraper.js";
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHelper.js";
import { upsertProduct } from '../services/product/productService.js';
import { logger } from "../logger.js";
import fs from "fs/promises";
import path from "path";

const router = Router();

// POST /api/product-import/preview
// Fetches and returns product preview from a URL
const PreviewSchema = z.object({
    url: z.string().url()
});

router.post("/preview", async (req, res) => {
    try {
        const { url } = PreviewSchema.parse(req.body);

        // SSRF koruması - internal IP'leri blokla
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("10.") ||
            hostname.startsWith("172.16.") ||
            hostname === "::1" ||
            hostname === "0.0.0.0"
        ) {
            return sendErrorResponse({ res, statusCode: 400, message: "Geçersiz URL", error: "SSRF_BLOCKED" });
        }

        const scraped = await scrapeProductFromUrl(url);
        if (!scraped) {
            return sendErrorResponse({ res, statusCode: 404, message: "Ürün bilgileri çekilemedi", error: "SCRAPE_FAILED" });
        }

        const details = {
            title: scraped.name,
            description: scraped.description,
            price: scraped.price,
            currency: scraped.currency,
            image: scraped.imageUrl,
            category: scraped.category,
            attributes: scraped.attributes,
            barcode: scraped.barcode,
            snippet: scraped.description
        };

        // --- NEW: Attribute Mapping & Normalization ---
        try {
            const mappingsPath = path.resolve(process.cwd(), "data/marketplace-mappings.json");
            const mappingsData = await fs.readFile(mappingsPath, "utf-8");
            const mappings = JSON.parse(mappingsData);

            // 1. Identify Provider (e.g. Trendyol)
            let providerKey = null;
            for (const [key, config] of Object.entries(mappings) as any) {
                if (config.domains.some((d: string) => urlObj.hostname.includes(d))) {
                    providerKey = key;
                    break;
                }
            }

            if (providerKey && details.attributes) {
                const config = mappings[providerKey];
                const normalizedAttributes: Record<string, string> = {};

                // 2. Normalize Attributes
                for (const [rawKey, rawValue] of Object.entries(details.attributes)) {
                    let finalKey = rawKey;

                    // Check synonyms
                    if (config.attributeSynonyms) {
                        for (const [canonicalKey, synonyms] of Object.entries(config.attributeSynonyms)) {
                            // @ts-ignore
                            if (synonyms.some(s => s.toLowerCase() === rawKey.toLowerCase())) {
                                finalKey = canonicalKey;
                                break;
                            }
                        }
                    }

                    // 3. Normalize Values
                    let finalValue = String(rawValue);
                    if (config.valueNormalizers && config.valueNormalizers[finalKey]) {
                        const normType = config.valueNormalizers[finalKey];
                        if (normType === "gb") {
                            finalValue = finalValue.replace(/gb|gigabyte/gi, "").trim() + " GB";
                        } else if (normType === "inch") {
                            finalValue = finalValue.replace(/inch|inç|"/gi, "").trim() + " inç";
                        } else if (normType === "number") {
                            finalValue = finalValue.replace(/[^0-9]/g, "");
                        }
                    }

                    normalizedAttributes[finalKey] = finalValue;
                }

                // 4. Description Template
                if (config.descriptionTemplate && config.descriptionTemplate.appendBulletsFromAttributes) {
                    let bullets = "\n\n<ul>";
                    const order = config.descriptionTemplate.bulletOrder || Object.keys(normalizedAttributes);

                    // Add ordered items first
                    order.forEach((key: string) => {
                        if (normalizedAttributes[key]) {
                            bullets += `<li><strong>${key}:</strong> ${normalizedAttributes[key]}</li>`;
                        }
                    });

                    bullets += "</ul>";
                    details.snippet = (details.snippet || "") + bullets;
                }

                details.attributes = normalizedAttributes;
            }
        } catch (err) {
            logger.warn("marketplace_mapping_failed", { err });
        }
        // ----------------------------------------------

        return sendSuccessResponse(res, {
            title: details.title || "Ürün",
            price: details.price,
            currency: details.currency || "TRY",
            image: details.image,
            snippet: details.snippet,
            site: urlObj.hostname,
            sourceUrl: url,
            categoryKey: details.category, // Mapped category
            attributes: details.attributes,
            prefillAttributes: details.attributes // ✅ Requested by user
        });
    } catch (error: any) {
        logger.error("product_import_preview_failed", { error: error.message, stack: error.stack, url: req.body.url });

        if (error.response && (error.response.status === 403 || error.response.status === 429)) {
            return sendErrorResponse({ res, statusCode: 502, message: "Pazaryeri erişimi engellendi", error: "MARKETPLACE_BLOCK" });
        }

        return sendErrorResponse({ res, statusCode: 500, message: "Önizleme başarısız", error: "PREVIEW_FAILED" });
    }
});

// POST /api/product-import/import
// Imports a product from external URL with snapshot data
const ImportSchema = z.object({
    sourceUrl: z.string().url(),
    title: z.string().min(1),
    category: z.string().optional(),
    price: z.preprocess((val) => (typeof val === 'string' ? Number(val.replace(',', '.')) : val), z.number()).optional(),
    currency: z.string().optional(),
    stock: z.preprocess((val) => Number(val), z.number().int().nonnegative()).optional(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional()
});

router.post("/import", async (req, res) => {
    logger.info("product_import_request", { payload: req.body });
    try {
        const data = ImportSchema.parse(req.body);
        const urlObj = new URL(data.sourceUrl);

        // Barcode yoksa otomatik generate et (WEB- prefix ile)
        const barcode = data.barcode || `WEB-${Date.now()}`;

        // Ürün oluştur - yeni alanlar eklenecek (Phase 4'te schema update)
        const product = await upsertProduct({
            barcode,
            name: data.title,
            category: data.category,
            price: data.price || 0,
            stock: data.stock || 0,
            currency: data.currency || "TRY",
            description: data.description,
            imageUrl: data.imageUrl,
            images: data.imageUrl ? [data.imageUrl] : undefined,
            // Yeni alanlar (schema update sonrası aktif olacak)
            sourceUrl: data.sourceUrl,
            sourceSite: urlObj.hostname,
            snapshotPrice: data.price,
            snapshotCurrency: data.currency,
            snapshotAt: new Date()
        } as any); // Type assertion - schema update sonrası kaldırılacak

        return sendSuccessResponse(res, { product });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            logger.warn("product_import_validation_failed", { errors: error.errors, body: req.body });
            return sendErrorResponse({ res, statusCode: 400, message: "Doğrulama başarısız (" + error.errors[0]?.message + ")", error: "INVALID_DATA" });
        }

        logger.error("product_import_failed", { error: error.message, code: error.code, stack: error.stack });

        if (error.code && error.code.startsWith('ER_')) {
            return sendErrorResponse({ res, statusCode: 500, message: "Veritabanı Hatası (" + error.code + ")", error: "DB_ERROR" });
        }

        return sendErrorResponse({ res, statusCode: 500, message: "İçe aktarma başarısız: " + (error.message || "Bilinmeyen hata"), error: "IMPORT_FAILED" });
    }
});

export default router;
