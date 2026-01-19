import { Router } from "express";
import { z } from "zod";
import { ImportProviderFactory } from "../services/providers/ImportProviderFactory.js";
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHelper.js";
import { upsertProduct } from '../services/product/productService.js';
import { logger } from "../logger.js";

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

        // Use Factory Pattern for Live/Mock support
        const provider = ImportProviderFactory.getProvider();
        const draft = await provider.getImportDraft(url);

        return sendSuccessResponse(res, {
            title: draft.title || "Ürün",
            price: draft.price,
            currency: draft.currency || "TRY",
            image: draft.images[0], // Primary image
            images: draft.images,
            snippet: draft.description,
            site: new URL(draft.sourceUrl).hostname,
            sourceUrl: draft.sourceUrl,

            // Auto-filled suggestions
            categoryKey: draft.categorySuggestion?.name,
            categoryId: draft.categorySuggestion?.id,
            attributes: draft.attributes,
            prefillAttributes: draft.attributes,

            needsManualMapping: draft.needsManualMapping,
            variants: draft.variants
        });

    } catch (error: any) {
        logger.error("product_import_preview_failed", { error: error.message, stack: error.stack, url: req.body.url });

        if (error.response && (error.response.status === 403 || error.response.status === 429)) {
            return sendErrorResponse({ res, statusCode: 502, message: "Pazaryeri erişimi engellendi", error: "MARKETPLACE_BLOCK" });
        }

        return sendErrorResponse({ res, statusCode: 500, message: "Önizleme başarısız: " + (error.message || "Unknown"), error: "PREVIEW_FAILED" });
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
