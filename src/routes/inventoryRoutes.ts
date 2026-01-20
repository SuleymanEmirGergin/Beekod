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
    const { barcode, price, marketplaces, stock } = req.body;
    if (!barcode || !price) return res.status(400).json({ error: "barcode_and_price_required" });

    // Use Enqueue Sync instead of direct sync
    try {
        const { enqueueSyncJob } = await import("../services/queue/syncProducer.js");
        const { getProductByBarcode, upsertProduct } = await import("../services/product/productService.js");

        // 1. Update local product first (including price/stock)
        // This ensures the sync worker sees the latest data if it re-fetches,
        // although we pass price/stock in payload too.
        await upsertProduct({
            barcode,
            price: Number(price),
            stock: stock !== undefined ? Number(stock) : undefined,
            // Pass other required fields if creating new, but bulk-update implies existing
            name: "", // Will be ignored if exists or fail validation if strict
            currency: "TRY"
        });

        // 2. Enqueue Sync Job
        const jobId = await enqueueSyncJob({
            barcode,
            price: Number(price),
            stock: stock !== undefined ? Number(stock) : undefined,
            targets: marketplaces || ["all"],
            traceId: (req as any).traceId
        });

        res.json({ success: true, jobId, message: "Sync job enqueued" });
    } catch (error) {
        logger.error("inventory.bulk_update_failed", { err: error });
        res.status(500).json({ error: "inventory_bulk_update_failed" });
    }
});

export { router as inventoryRouter };
