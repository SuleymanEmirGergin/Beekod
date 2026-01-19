import { Router } from "express";
import { z } from "zod";
import { ImportProviderFactory } from "../services/providers/ImportProviderFactory.js";
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHelper.js";
import { logger } from "../logger.js";
import { ImportError } from "../errors/ImportErrors.js";

const router = Router();

// POST /api/product-import/preview
// Fetches and returns product preview from a URL
const PreviewSchema = z.object({
    url: z.string().url()
});

router.post("/preview", async (req, res) => {
    const traceId = (req as any).traceId || `req-${Date.now()}`;
    try {
        const { url } = PreviewSchema.parse(req.body);

        // SSRF protection
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
        logger.info("preview.start", { traceId, url });

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
        logger.error("product_import_preview_failed", { traceId, error: error.message, stack: error.stack, url: req.body.url });

        if (error instanceof ImportError) {
            return sendErrorResponse({ res, statusCode: error.statusCode, message: error.message, error: error.code });
        }

        if (error.response && (error.response.status === 403 || error.response.status === 429)) {
            return sendErrorResponse({ res, statusCode: 502, message: "Pazaryeri erişimi engellendi", error: "MARKETPLACE_BLOCK" });
        }

        return sendErrorResponse({ res, statusCode: 500, message: "Önizleme başarısız: " + (error.message || "Unknown"), error: "PREVIEW_FAILED" });
    }
});

// POST /api/product-import/import
// Imports a product using the provider pipeline (supports options for overrides)
const ImportSchema = z.object({
    sourceUrl: z.string().url(),
    providerId: z.enum(["shopify", "woocommerce"]).optional(),

    // Optional overrides from UI edit
    title: z.string().optional(),
    category: z.string().optional(), // Maps to categorySuggestion.name
    price: z.preprocess((val) => (typeof val === 'string' ? Number(val.replace(',', '.')) : val), z.number()).optional(),
    currency: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    attributes: z.record(z.string()).optional()
});

router.post("/import", async (req, res) => {
    const traceId = (req as any).traceId || `req-${Date.now()}`;
    logger.info("product_import_request", { traceId, payload: req.body });

    try {
        const data = ImportSchema.parse(req.body);

        // Transform schema to ImportDraft options
        const options = {
            title: data.title,
            price: data.price,
            currency: data.currency,
            description: data.description,
            images: data.imageUrl ? [data.imageUrl] : undefined,
            attributes: data.attributes,
            categorySuggestion: data.category ? { name: data.category, id: "manual", confidence: 1, source: "manual" as const } : undefined
        };

        const provider = ImportProviderFactory.getProvider();
        const result = await provider.importProduct(data.sourceUrl, data.providerId, options);

        if (!result.success) {
            return sendErrorResponse({
                res,
                statusCode: 500,
                message: result.error || "İçe aktarma başarısız",
                error: "IMPORT_FAILED"
            });
        }

        return sendSuccessResponse(res, {
            product: {
                localId: result.localId,
                name: result.productName,
                provider: result.provider
            },
            editUrl: result.editUrl
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            logger.warn("product_import_validation_failed", { traceId, errors: error.errors });
            return sendErrorResponse({ res, statusCode: 400, message: "Doğrulama başarısız (" + error.errors[0]?.message + ")", error: "INVALID_DATA" });
        }

        logger.error("product_import_failed", { traceId, error: error.message, stack: error.stack });

        return sendErrorResponse({ res, statusCode: 500, message: "İçe aktarma başarısız: " + (error.message || "Bilinmeyen hata"), error: "IMPORT_FAILED" });
    }
});

export default router;
