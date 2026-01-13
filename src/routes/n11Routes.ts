import { Router } from "express";
import { n11Service } from "../services/marketplace/n11Service.js";
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHelper.js";
import { logger } from "../logger.js";

const router = Router();

/**
 * GET /api/n11/categories
 * Fetches the full category tree from N11
 */
router.get("/categories", async (req, res) => {
    try {
        if (!n11Service.isConfigured()) {
            return sendErrorResponse({
                res,
                statusCode: 503,
                message: "N11 API yapılandırılmamış. .env dosyasına N11_* değişkenlerini ekleyin.",
                error: "NOT_CONFIGURED"
            });
        }

        const forceRefresh = req.query.refresh === "true";
        const categories = await n11Service.getCategoryTree(forceRefresh);

        return sendSuccessResponse(res, {
            count: categories.length,
            categories
        });
    } catch (error: any) {
        logger.error("n11_routes.categories_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori ağacı alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/n11/categories/search
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

        await n11Service.getCategoryTree();
        const results = n11Service.searchCategories(query);

        return sendSuccessResponse(res, {
            query,
            count: results.length,
            results
        });
    } catch (error: any) {
        logger.error("n11_routes.search_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Arama başarısız: " + error.message,
            error: "SEARCH_FAILED"
        });
    }
});

/**
 * GET /api/n11/categories/:id
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

        await n11Service.getCategoryTree();
        const category = n11Service.getCategoryById(categoryId);

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
        logger.error("n11_routes.get_category_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/n11/categories/:id/attributes
 * Gets category-specific attributes
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

        const attributes = await n11Service.getCategoryAttributes(categoryId);

        return sendSuccessResponse(res, {
            categoryId,
            attributes
        });
    } catch (error: any) {
        logger.error("n11_routes.get_attributes_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kategori özellikleri alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/n11/shipment-packages
 * Fetches shipment packages (orders ready for shipment)
 * Query params: page, size, status
 */
router.get("/shipment-packages", async (req, res) => {
    try {
        if (!n11Service.isConfigured()) {
            return sendErrorResponse({
                res,
                statusCode: 503,
                message: "N11 API yapılandırılmamış.",
                error: "NOT_CONFIGURED"
            });
        }

        const params = {
            page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
            size: req.query.size ? parseInt(String(req.query.size), 10) : undefined,
            status: req.query.status ? String(req.query.status) : undefined
        };

        const data = await n11Service.getShipmentPackages(params);

        return sendSuccessResponse(res, data);
    } catch (error: any) {
        logger.error("n11_routes.shipment_packages_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Kargo paketleri alınamadı: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/n11/products
 * Queries products from N11
 * Query params: page, size, productId, barcode, status
 */
router.get("/products", async (req, res) => {
    try {
        if (!n11Service.isConfigured()) {
            return sendErrorResponse({
                res,
                statusCode: 503,
                message: "N11 API yapılandırılmamış.",
                error: "NOT_CONFIGURED"
            });
        }

        const params = {
            page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
            size: req.query.size ? parseInt(String(req.query.size), 10) : undefined,
            productId: req.query.productId ? String(req.query.productId) : undefined,
            barcode: req.query.barcode ? String(req.query.barcode) : undefined,
            status: req.query.status ? String(req.query.status) : undefined
        };

        const data = await n11Service.queryProducts(params);

        return sendSuccessResponse(res, data);
    } catch (error: any) {
        logger.error("n11_routes.products_failed", { error: error.message });
        return sendErrorResponse({
            res,
            statusCode: 500,
            message: "Ürün sorgusu başarısız: " + error.message,
            error: "FETCH_FAILED"
        });
    }
});

/**
 * GET /api/n11/status
 * Health check for N11 integration
 */
router.get("/status", (req, res) => {
    const configured = n11Service.isConfigured();
    const apiKey = configured ? n11Service.getApiKey() : null;

    return sendSuccessResponse(res, {
        configured,
        apiKey,
        message: configured
            ? "N11 API bağlantısı hazır."
            : "N11 API yapılandırılmamış."
    });
});

export const n11Router = router;
