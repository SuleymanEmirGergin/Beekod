import path from "path";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { requireAdminKey } from "../middleware/adminKey.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { validateBody, validateQuery } from "../validation/middleware.js";
import { exportSalesCsv } from "../services/product/exportService.js";
import {
  clearSalesRecords,
  getSalesRecords,
  insertSalesRecords,
  loadSalesFromFile,
  resetSalesCache,
} from "../services/salesStore.js";

const router = Router();

router.use(requireJsonBody);

const salesImportSchema = z.object({
  path: z.string().trim().optional(),
  mode: z.enum(["append", "replace"]).optional(),
});

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

const salesExportQuerySchema = z
  .object({
    limit: numberLike.optional(),
  })
  .passthrough();

router.post("/sales/import", requireAdminKey, validateBody(salesImportSchema), async (req, res) => {
  const requestedPath = req.body.path?.trim() ?? "";
  const filePath = requestedPath ? path.resolve(requestedPath) : path.resolve(config.data.salesPath);
  const mode = req.body.mode ?? "append";
  try {
    const records = await loadSalesFromFile(filePath);
    if (mode === "replace") {
      await clearSalesRecords();
      resetSalesCache();
    }
    const inserted = await insertSalesRecords(records);
    res.json({
      status: "ok",
      path: filePath,
      mode,
      total: records.length,
      imported: inserted,
    });
  } catch (error) {
    logger.error("sales.import_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "sales_import_failed" });
  }
});

router.get("/sales/export", requireAdminKey, validateQuery(salesExportQuerySchema), async (req, res) => {
  const limitRaw = Number(req.query.limit ?? 2000);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 10000) : 2000;
  try {
    const records = await getSalesRecords();
    const slice = records.slice(0, limit);
    const csv = exportSalesCsv(slice);
    res
      .status(200)
      .type("text/csv")
      .setHeader("Content-Disposition", `attachment; filename="sales-${Date.now()}.csv"`)
      .send(csv);
  } catch (error) {
    logger.error("sales.export_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "sales_export_failed" });
  }
});

export { router as salesRouter };
