import { Router } from "express";
import { z } from "zod";
import { logger } from "../logger.js";
import { getMarketplaceListings } from "../services/marketplaceStore.js";
import { validateParams } from "../validation.js";

const router = Router();

const competitorParamsSchema = z.object({
  barcode: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.toLowerCase()),
});

router.get("/competitors/:barcode", validateParams(competitorParamsSchema), async (req, res) => {
  const barcode = req.params.barcode;
  try {
    const items = await getMarketplaceListings(barcode);
    res.json({ barcode, items });
  } catch (error) {
    logger.error("competitors.load_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "marketplace_load_failed" });
  }
});

export { router as competitorRouter };
