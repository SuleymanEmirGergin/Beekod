import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { query } from "../db.js";
import { logger } from "../logger.js";
import { validateQuery } from "../validation.js";

const router = Router();

const healthQuerySchema = z
  .object({
    format: z.enum(["prom"]).optional(),
  })
  .passthrough();

router.get("/health", validateQuery(healthQuerySchema), async (req, res) => {
  let dbOk = true;
  let storageOk = true;
  const storagePath = path.resolve(config.images.storagePath);

  try {
    await query("SELECT 1");
  } catch (error) {
    dbOk = false;
    logger.error("health.db_failed", { requestId: res.locals?.requestId, err: error });
  }

  try {
    await fsPromises.mkdir(storagePath, { recursive: true });
    await fsPromises.access(storagePath, fs.constants.W_OK);
  } catch (error) {
    storageOk = false;
    logger.error("health.storage_failed", { requestId: res.locals?.requestId, err: error });
  }

  const ok = dbOk && storageOk;
  const status = ok ? "ok" : "degraded";
  const wantsProm = req.query.format === "prom" || req.headers.accept?.includes("text/plain");

  if (wantsProm) {
    const lines = [
      "# HELP beekod_health_status Overall health status (1=ok, 0=degraded).",
      "# TYPE beekod_health_status gauge",
      `beekod_health_status ${ok ? 1 : 0}`,
      "# HELP beekod_health_component Health status by component (1=ok, 0=error).",
      "# TYPE beekod_health_component gauge",
      `beekod_health_component{component="db"} ${dbOk ? 1 : 0}`,
      `beekod_health_component{component="storage"} ${storageOk ? 1 : 0}`,
    ];
    return res
      .status(ok ? 200 : 503)
      .type("text/plain")
      .send(`${lines.join("\n")}\n`);
  }

  return res.status(ok ? 200 : 503).json({
    status,
    db: dbOk ? "ok" : "error",
    storage: storageOk ? "ok" : "error",
    storagePath,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export { router as healthRouter };
