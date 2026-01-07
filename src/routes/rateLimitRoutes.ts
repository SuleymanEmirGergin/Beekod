import { Router } from "express";
import { z } from "zod";
import { requireAdminKey } from "../middleware/adminKey.js";
import { query } from "../db.js";
import { logger } from "../logger.js";
import { validateQuery } from "../validation.js";

type RateLimitRow = {
  rate_key: string;
  window_start: string;
  count: number;
};

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

const rateLimitQuerySchema = z
  .object({
    search: z.string().trim().optional(),
    limit: numberLike.optional(),
  })
  .passthrough();

router.get("/rate-limits", requireAdminKey, validateQuery(rateLimitQuerySchema), async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const limitRaw = Number(req.query.limit ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 500) : 50;

  try {
    const params: Array<string | number> = [];
    let sql = "SELECT rate_key, window_start, count FROM rate_limits";
    if (search) {
      sql += " WHERE rate_key LIKE ?";
      params.push(`%${search}%`);
    }
    sql += " ORDER BY window_start DESC LIMIT ?";
    params.push(limit);

    const rows = await query<RateLimitRow[]>(sql, params);
    const items = rows.map((row) => ({
      rateKey: row.rate_key,
      windowStart: row.window_start,
      count: row.count,
    }));
    res.json({ items });
  } catch (error) {
    logger.error("rate_limit.list_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "rate_limit_list_failed" });
  }
});

export { router as rateLimitRouter };
