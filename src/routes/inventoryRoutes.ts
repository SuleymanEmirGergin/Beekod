import { Router } from "express";
import { logger } from "../logger.js";
import { getConsolidatedInventory, updateBulkPrice } from "../services/product/productService.js";
import { requireAdminKey } from "../middleware/adminKey.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";

const router = Router();

// GET /api/inventory/consolidated
router.get("/consolidated", requireAdminKey, async (req, res) => {
    try {
        const result = await getConsolidatedInventory();
        res.handleResult(result);
    } catch (error) {
        logger.error("inventory.consolidated_failed", { err: error });
        res.status(500).json({ error: "inventory_consolidated_failed" });
    }
});

// POST /api/inventory/bulk-update
router.post("/bulk-update", requireAdminKey, requireJsonBody, async (req, res) => {
    const { barcode, price, marketplaces } = req.body;
    if (!barcode || !price) return res.status(400).json({ error: "barcode_and_price_required" });

    try {
        const result = await updateBulkPrice(barcode, price, marketplaces || []);
        res.handleResult(result);
    } catch (error) {
        logger.error("inventory.bulk_update_failed", { err: error });
        res.status(500).json({ error: "inventory_bulk_update_failed" });
    }
});

export { router as inventoryRouter };
