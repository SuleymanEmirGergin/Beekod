import { Router } from "express";
import { requireAdminKey } from "../middleware/adminKey.js";
import { resetMarketplaceCache } from "../services/marketplaceStore.js";
import { resetSalesCache } from "../services/salesStore.js";

const router = Router();

router.post("/cache/marketplace/reset", requireAdminKey, (_req, res) => {
  resetMarketplaceCache();
  res.json({ status: "ok" });
});

router.post("/cache/sales/reset", requireAdminKey, (_req, res) => {
  resetSalesCache();
  res.json({ status: "ok" });
});

router.post("/cache/reset", requireAdminKey, (_req, res) => {
  resetMarketplaceCache();
  resetSalesCache();
  res.json({ status: "ok" });
});

export { router as cacheRouter };
