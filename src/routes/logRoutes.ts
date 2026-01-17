import { Router } from "express";
import { z } from "zod";
import { requireAdminKey } from "../middleware/adminKey.js";
import { logger } from "../logger.js";
import { getLogs } from "../services/logService.js";
import { validateQuery } from "../validation/middleware.js";

const router = Router();

const numberLike = z.preprocess((value) => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    return Number(trimmed);
  }
  return value;
}, z.number().finite());

const logQuerySchema = z
  .object({
    limit: numberLike.optional(),
  })
  .passthrough();

router.get("/logs", requireAdminKey, validateQuery(logQuerySchema), async (req, res) => {
  const limitRaw = Number(req.query.limit ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
  try {
    const items = await getLogs(limit);
    res.json({ items });
  } catch (error) {
    logger.error("logs.read_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "log_read_failed" });
  }
});

export { router as logRouter };
