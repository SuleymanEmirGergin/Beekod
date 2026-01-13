import { Router } from "express";
import { z } from "zod";
import { logger } from "../logger.js";
import { requireAdminKey } from "../middleware/adminKey.js";
import { validateQuery } from "../validation.js";
// REMOVED: import { googleSearch } from "../marketplaces/api/googleSearch.js";
import { universalProductSearch } from "../services/search/searchAggregator.js";
import multer from "multer";
import { searchByImage } from "../services/search/imageSearchService.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const router = Router();

const searchQuerySchema = z.object({
  q: z.string().trim().min(2),
  limit: z.coerce.number().min(1).max(20).default(10),
});

// REMOVED: Existing Google Search (Web) route - googleSearch functionality deleted

// New Universal Search (Marketplace Aggregator)
router.get("/search/universal", requireAdminKey, validateQuery(searchQuerySchema), async (req, res) => {
  try {
    const query = req.query.q as string;

    const result = await universalProductSearch(query);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "universal_search_failed" });
  }
});

router.post("/search/image", requireAdminKey, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "no_image_file" });
    }

    const buffer = req.file.buffer;
    const results = await searchByImage(buffer);

    res.json({
      status: "ok",
      results,
    });
  } catch (error) {
    logger.error("search.image_failed", { err: error });
    res.status(500).json({ error: "image_search_failed" });
  }
});

export { router as searchRouter };
