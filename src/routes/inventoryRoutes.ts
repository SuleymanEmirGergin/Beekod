import { Router } from "express";
import { logger } from "../logger.js";
import { getAllProducts } from "../services/productService.js";
import { requireAdminKey } from "../middleware/adminKey.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";

const router = Router();

// GET /api/inventory/consolidated
router.get("/consolidated", requireAdminKey, async (req, res) => {
    try {
        const products = await getAllProducts(5000); // Fetch all products

        // Map to the format expected by MarketplaceInventoryScreen
        const inventory = products.map((p) => ({
            barcode: p.barcode,
            title: p.name,
            totalStock: p.stock,
            minPrice: p.price,
            maxPrice: p.price, // For now, simple price. In future, fetch range from marketplaces.
            marketplaces: ["TY", "HB", "N11"], // Dummy marketplaces or real ones if available in DB
            image: p.images?.[0] || p.imageUrl || ""
        }));

        res.json({ status: "ok", inventory });
    } catch (error) {
        logger.error("inventory.consolidated_failed", { err: error });
        res.status(500).json({ error: "inventory_consolidated_failed" });
    }
});

// POST /api/inventory/bulk-update
router.post("/bulk-update", requireAdminKey, requireJsonBody, async (req, res) => {
    // Placeholder for future implementation
    res.json({ status: "ok" });
});

export { router as inventoryRouter };
