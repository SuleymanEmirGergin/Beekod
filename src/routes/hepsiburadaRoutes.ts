import { Router } from "express";
import { hepsiburadaService } from "../services/marketplace/hepsiburadaService.js";
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHelper.js";
import { logger } from "../logger.js";

const router = Router();

/**
 * GET /api/hepsiburada/categories
 * Fetches all categories from Hepsiburada
 * Query params: leaf, status, available, version, page, size, refresh
 */
router.get("/categories", async (req, res) => {
    try {
        if (!hepsiburadaService.isConfigured()) {
            return sendErrorResponse({
                res,
                statusCode: 503,
                message: "Hepsiburada API yapılandırılmamış. .env dosyasına HB_* değişkenlerini ekleyin.",
                error: "NOT_CONFIGURED"
            });
        }

        const forceRefresh = req.query.refresh === "true";
        const params = {
            leaf: req.query.leaf === "false" ? false : true,
            status: req.query.status ? String(req.query.status) : "ACTIVE",
            available: req.query.available === "false" ? false : true,
            version: req.query.version ? parseInt(String(req.query.version), 10) : 1,
            page: req.query.page ? parseInt(String(req.query.page), 10) : 0,
            size: req.query.size ? parseInt(String(req.query.size), 10) : 1000
        };

        const categories = await hepsiburadaService.getAllCategories(params, forceRefresh);

        return sendSuccessResponse(res, {
            count: categories.length,
            categories
        });
    } catch (error: any) {
        logger.error("hepsiburada_routes.categories_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori listesi alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/hepsiburada/categories/search
 * Searches categories by name
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

        await hepsiburadaService.getAllCategories();
        const results = hepsiburadaService.searchCategories(query);

        return sendSuccessResponse(res, {
            query,
            count: results.length,
            results
        });
    } catch (error: any) {
        logger.error("hepsiburada_routes.search_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Arama başarısız: " + error.message,
            error: "SEARCH_FAILED"
        });
    }
});

/**
 * GET /api/hepsiburada/categories/:id
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

        await hepsiburadaService.getAllCategories();
        const category = hepsiburadaService.getCategoryById(categoryId);

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
        logger.error("hepsiburada_routes.get_category_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/hepsiburada/categories/:id/attributes
 * Gets category-specific attributes
 * Query params: version (default: 2)
 */
router.get("/categories/:id/attributes", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const version = req.query.version ? parseInt(String(req.query.version), 10) : 2;

        const attributes = await hepsiburadaService.getCategoryAttributes(categoryId, version);

        return sendSuccessResponse(res, {
            categoryId,
            attributes
        });
    } catch (error: any) {
        logger.error("hepsiburada_routes.get_attributes_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori özellikleri alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/hepsiburada/categories/:categoryId/attributes/:attributeId/values
 * Gets attribute values for a specific attribute
 * Query params: version, page, size
 */
router.get("/categories/:categoryId/attributes/:attributeId/values", async (req, res) => {
    try {
        const { categoryId, attributeId } = req.params;
        const params = {
            version: req.query.version ? parseInt(String(req.query.version), 10) : 5,
            page: req.query.page ? parseInt(String(req.query.page), 10) : 0,
            size: req.query.size ? parseInt(String(req.query.size), 10) : 1000
        };

        const values = await hepsiburadaService.getAttributeValues(categoryId, attributeId, params);

        return sendSuccessResponse(res, {
            categoryId,
            attributeId,
            values
        });
    } catch (error: any) {
        logger.error("hepsiburada_routes.get_attribute_values_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Özellik değerleri alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

// =============================================================
// TICKET API ROUTES
// =============================================================

router.get("/tickets/status/:trackingId", async (req, res) => {
    try {
        const params = {
            page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
            size: req.query.size ? parseInt(String(req.query.size), 10) : undefined
        };
        const data = await hepsiburadaService.getTicketStatus(req.params.trackingId, params);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/products/hbsku/:hbSku", async (req, res) => {
    try {
        const data = await hepsiburadaService.getProductByHbSku(req.params.hbSku);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// LISTING EXTERNAL ROUTES
// =============================================================

router.get("/buybox-orders", async (req, res) => {
    try {
        const data = await hepsiburadaService.getBuyboxOrders();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/commissions", async (req, res) => {
    try {
        const data = await hepsiburadaService.getCommissions();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/listings", async (req, res) => {
    try {
        const params = {
            offset: req.query.offset ? parseInt(String(req.query.offset), 10) : 0,
            limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 10
        };
        const data = await hepsiburadaService.getListings(params);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/inventory-uploads/:id", async (req, res) => {
    try {
        const data = await hepsiburadaService.getInventoryUpload(req.params.id);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/stock-uploads/:id", async (req, res) => {
    try {
        const data = await hepsiburadaService.getStockUpload(req.params.id);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/price-uploads/:id", async (req, res) => {
    try {
        const data = await hepsiburadaService.getPriceUpload(req.params.id);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/shipping-info-uploads/:id", async (req, res) => {
    try {
        const data = await hepsiburadaService.getShippingInfoUpload(req.params.id);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/additional-info-uploads/:id", async (req, res) => {
    try {
        const data = await hepsiburadaService.getAdditionalInfoUpload(req.params.id);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// SHIPPING EXTERNAL ROUTES
// =============================================================

router.get("/cargo-firms", async (req, res) => {
    try {
        const data = await hepsiburadaService.getCargoFirms();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/shipping-profiles", async (req, res) => {
    try {
        const data = await hepsiburadaService.getShippingProfiles();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// OMS EXTERNAL ROUTES (Orders & Packages)
// =============================================================

router.get("/orders", async (req, res) => {
    try {
        const data = await hepsiburadaService.getOrders();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/orders/cancelled", async (req, res) => {
    try {
        const data = await hepsiburadaService.getCancelledOrders();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/orders/payment-awaiting", async (req, res) => {
    try {
        const data = await hepsiburadaService.getPaymentAwaitingOrders();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/packages", async (req, res) => {
    try {
        const data = await hepsiburadaService.getPackages();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/packages/delivered", async (req, res) => {
    try {
        const data = await hepsiburadaService.getDeliveredPackages();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/packages/shipped", async (req, res) => {
    try {
        const data = await hepsiburadaService.getShippedPackages();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/packages/missing-invoice", async (req, res) => {
    try {
        const data = await hepsiburadaService.getMissingInvoicePackages();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/packages/unpacked", async (req, res) => {
    try {
        const data = await hepsiburadaService.getUnpackedPackages();
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/delivery/changeable-cargo/:orderLineId", async (req, res) => {
    try {
        const data = await hepsiburadaService.getChangeableCargoCompanies(req.params.orderLineId);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/packages/:packageNumber/changeable-cargo", async (req, res) => {
    try {
        const data = await hepsiburadaService.getPackageChangeableCargoCompanies(req.params.packageNumber);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

router.get("/lineitems/:lineItemId/packageable-with", async (req, res) => {
    try {
        const data = await hepsiburadaService.getPackageableWith(req.params.lineItemId);
        return sendSuccessResponse(res, data);
    } catch (error: any) {
        return sendErrorResponse({ res, statusCode: 500, message: error.message, error: "FETCH_FAILED" });
    }
});

// =============================================================
// STATUS ROUTE
// =============================================================

router.get("/status", (req, res) => {
    const configured = hepsiburadaService.isConfigured();
    const merchantId = configured ? hepsiburadaService.getMerchantId() : null;

    return sendSuccessResponse(res, {
        configured,
        merchantId,
        message: configured
            ? "Hepsiburada API bağlantısı hazır."
            : "Hepsiburada API yapılandırılmamış."
    });
});

export const hepsiburadaRouter = router;
