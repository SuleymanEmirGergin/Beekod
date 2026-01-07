import { Router } from "express";
import { ciceksepetiService } from "../services/ciceksepetiService.js";
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHelper.js";
import { logger } from "../logger.js";

const router = Router();

// =============================================================
// CATEGORY ROUTES
// =============================================================

router.get("/categories", async (req, res) => {
    try {
        if (!ciceksepetiService.isConfigured()) {
            return sendErrorResponse({
                res,
                statusCode: 503,
                message: "Çiçeksepeti API yapılandırılmamış. .env dosyasına CICEKSEPETI_* değişkenlerini ekleyin.",
                error: "NOT_CONFIGURED"
            });
        }

        const forceRefresh = req.query.refresh === "true";
        const categories = await ciceksepetiService.getCategories(forceRefresh);

        return sendSuccessResponse(res, {
            count: categories.length,
            categories
        });
    } catch (error: any) {
        logger.error("ciceksepeti_routes.categories_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori listesi alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

router.get("/categories/search", async (req, res) => {
    try {
        const query = String(req.query.q || "");

        if (!query || query.length < 2) {
            return sendErrorResponse({
                res,
                statusCode: 400,
                message: "Arama sorgusu en az 2 karakter olmalıdır.",
                error: "INVALID_QUERY"
            });
        }

        await ciceksepetiService.getCategories();
        const results = ciceksepetiService.searchCategories(query);

        return sendSuccessResponse(res, {
            query,
            count: results.length,
            results
        });
    } catch (error: any) {
        logger.error("ciceksepeti_routes.search_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Arama başarısız: " + error.message,
            error: "SEARCH_FAILED"
        });
    }
});

router.get("/categories/:id", async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id, 10);

        if (isNaN(categoryId)) {
            return sendErrorResponse({
                res,
                statusCode: 400,
                message: "Geçersiz kategori ID'si.",
                error: "INVALID_ID"
            });
        }

        await ciceksepetiService.getCategories();
        const category = ciceksepetiService.getCategoryById(categoryId);

        if (!category) {
            return sendErrorResponse({
                res,
                statusCode: 404,
                message: "Kategori bulunamadı.",
                error: "NOT_FOUND"
            });
        }

        return sendSuccessResponse(res, { category });
    } catch (error: any) {
        logger.error("ciceksepeti_routes.get_category_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

router.get("/categories/:id/attributes", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const attributes = await ciceksepetiService.getCategoryAttributes(categoryId);

        return sendSuccessResponse(res, {
            categoryId,
            attributes
        });
    } catch (error: any) {
        logger.error("ciceksepeti_routes.get_attributes_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori özellikleri alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

// =============================================================
// PRODUCT ROUTES
// =============================================================

router.get("/products", async (req, res) => {
    try {
        const params = {
            page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
            pageSize: req.query.pageSize ? parseInt(String(req.query.pageSize), 10) : undefined
        };
        const data = await ciceksepetiService.getProducts(params);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        logger.error("ciceksepeti_routes.products_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Ürünler alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

router.get("/products/batch-status/:batchId", async (req, res) => {
    try {
        const data = await ciceksepetiService.getBatchStatus(req.params.batchId);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        logger.error("ciceksepeti_routes.batch_status_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Batch durumu alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

// =============================================================
// STATUS ROUTE
// =============================================================

router.get("/status", (req, res) => {
    const configured = ciceksepetiService.isConfigured();
    const apiKey = configured ? ciceksepetiService.getApiKeyPrefix() : null;

    return sendSuccessResponse(res, {
        configured,
        apiKey,
        message: configured
            ? "Çiçeksepeti API bağlantısı hazır."
            : "Çiçeksepeti API yapılandırılmamış."
    });
});

export const ciceksepetiRouter = router;
