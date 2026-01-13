import { Router } from "express";
import { trendyolService } from "../services/marketplace/trendyolService.js";
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHelper.js";
import { logger } from "../logger.js";

const router = Router();

/**
 * GET /api/trendyol/categories
 * Fetches the full category tree from Trendyol
 * Query params:
 *   - refresh: "true" to force cache refresh
 */
router.get("/categories", async (req, res) => {
    try {
        if (!trendyolService.isConfigured()) {
            return sendErrorResponse({
                res,
                statusCode: 503,
                message: "Trendyol API yapılandırılmamış. .env dosyasına TRENDYOL_* değişkenlerini ekleyin.",
                error: "NOT_CONFIGURED"
            });
        }

        const forceRefresh = req.query.refresh === "true";
        const categories = await trendyolService.getCategoryTree(forceRefresh);

        return sendSuccessResponse(res, {
            count: categories.length,
            categories
        });
    } catch (error: any) {
        logger.error("trendyol_routes.categories_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori ağacı alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/trendyol/categories/search
 * Searches categories by name
 * Query params:
 *   - q: search query
 */
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

        // Ensure categories are loaded
        await trendyolService.getCategoryTree();

        const results = trendyolService.searchCategories(query);

        return sendSuccessResponse(res, {
            query,
            count: results.length,
            results
        });
    } catch (error: any) {
        logger.error("trendyol_routes.search_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Arama başarısız: " + error.message,
            error: "SEARCH_FAILED"
        });
    }
});

/**
 * GET /api/trendyol/categories/:id
 * Gets a single category by ID
 */
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

        // Ensure categories are loaded
        await trendyolService.getCategoryTree();

        const category = trendyolService.getCategoryById(categoryId);

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
        logger.error("trendyol_routes.get_category_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/trendyol/categories/:id/attributes
 * Gets category-specific attributes required for product listing
 */
router.get("/categories/:id/attributes", async (req, res) => {
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

        const attributes = await trendyolService.getCategoryAttributes(categoryId);

        return sendSuccessResponse(res, {
            categoryId,
            attributes
        });
    } catch (error: any) {
        logger.error("trendyol_routes.get_attributes_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori özellikleri alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/trendyol/categories/:categoryId/attributes/:attributeId/values
 * Gets attribute values for a specific attribute in a category
 */
router.get("/categories/:categoryId/attributes/:attributeId/values", async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId, 10);
        const attributeId = parseInt(req.params.attributeId, 10);

        if (isNaN(categoryId) || isNaN(attributeId)) {
            return sendErrorResponse({
                res,
                statusCode: 400,
                message: "Geçersiz kategori veya özellik ID'si.",
                error: "INVALID_ID"
            });
        }

        const values = await trendyolService.getAttributeValues(categoryId, attributeId);

        return sendSuccessResponse(res, {
            categoryId,
            attributeId,
            values
        });
    } catch (error: any) {
        logger.error("trendyol_routes.get_attribute_values_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Özellik değerleri alınamadı: " + error.message,
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
            size: req.query.size ? parseInt(String(req.query.size), 10) : undefined,
            barcode: req.query.barcode ? String(req.query.barcode) : undefined,
            approved: req.query.approved !== undefined ? req.query.approved === "true" : undefined
        };
        const data = await trendyolService.getProducts(params);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/products/unapproved", async (req, res) => {
    try {
        const params = {
            page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
            size: req.query.size ? parseInt(String(req.query.size), 10) : undefined
        };
        const data = await trendyolService.getUnapprovedProducts(params);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/product", async (req, res) => {
    try {
        const barcode = String(req.query.barcode || "");
        if (!barcode) return sendErrorResponse({ res, statusCode: 400, message: "Barkod gerekli.", error: "MISSING_BARCODE" });
        const data = await trendyolService.getProduct(barcode);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// ORDER ROUTES
// =============================================================

router.get("/orders", async (req, res) => {
    try {
        const params = {
            status: req.query.status ? String(req.query.status) : undefined,
            startDate: req.query.startDate ? parseInt(String(req.query.startDate), 10) : undefined,
            endDate: req.query.endDate ? parseInt(String(req.query.endDate), 10) : undefined,
            page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
            size: req.query.size ? parseInt(String(req.query.size), 10) : undefined
        };
        const data = await trendyolService.getOrders(params);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// CLAIMS ROUTES
// =============================================================

router.get("/claims", async (req, res) => {
    try {
        const params = {
            page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
            size: req.query.size ? parseInt(String(req.query.size), 10) : undefined
        };
        const data = await trendyolService.getClaims(params);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/claims/items/:claimItemsId/audit", async (req, res) => {
    try {
        const data = await trendyolService.getClaimAudits(req.params.claimItemsId);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/claims/issue-reasons", async (req, res) => {
    try {
        const data = await trendyolService.getClaimIssueReasons();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// QUESTIONS (QnA) ROUTES
// =============================================================

router.get("/questions", async (req, res) => {
    try {
        const params = {
            startDate: req.query.startDate ? parseInt(String(req.query.startDate), 10) : undefined,
            endDate: req.query.endDate ? parseInt(String(req.query.endDate), 10) : undefined,
            status: req.query.status ? String(req.query.status) : undefined,
            page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
            size: req.query.size ? parseInt(String(req.query.size), 10) : undefined
        };
        const data = await trendyolService.getQuestions(params);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// SUPPLIER & ADDRESS ROUTES
// =============================================================

router.get("/addresses", async (req, res) => {
    try {
        const data = await trendyolService.getSupplierAddresses();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// WEBHOOK ROUTES
// =============================================================

router.get("/webhooks", async (req, res) => {
    try {
        const data = await trendyolService.getWebhooks();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// COMPENSATION ROUTES
// =============================================================

router.get("/compensation/tickets", async (req, res) => {
    try {
        const params = {
            page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
            size: req.query.size ? parseInt(String(req.query.size), 10) : undefined
        };
        const data = await trendyolService.getCompensationTickets(params);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// CARGO & LABEL ROUTES
// =============================================================

router.get("/common-label/:cargoTrackingNumber", async (req, res) => {
    try {
        const data = await trendyolService.getCommonLabel(req.params.cargoTrackingNumber);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// LOCATION ROUTES
// =============================================================

router.get("/locations/cities/:cityCode/districts", async (req, res) => {
    try {
        const data = await trendyolService.getDistricts(req.params.cityCode);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/locations/cities/:cityCode/districts/:districtCode/neighborhoods", async (req, res) => {
    try {
        const data = await trendyolService.getNeighborhoods(req.params.cityCode, req.params.districtCode);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// STATUS ROUTE
// =============================================================

router.get("/status", (req, res) => {
    const configured = trendyolService.isConfigured();
    const sellerId = configured ? trendyolService.getSellerId() : null;

    return sendSuccessResponse(res, {
        configured,
        sellerId,
        message: configured
            ? "Trendyol API bağlantısı hazır."
            : "Trendyol API yapılandırılmamış."
    });
});

export const trendyolRouter = router;
