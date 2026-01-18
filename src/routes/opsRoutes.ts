import { Router } from "express";
import { requireAdminKey } from "../middleware/adminKey.js";
import { getJobStats } from "../services/jobQueue.js";
import { cacheMetrics } from "../services/cache/metrics.js";
import { pool } from "../db.js";
import { logger } from "../logger.js";

const router = Router();

router.get("/inspect", requireAdminKey, async (req, res) => {
  try {
    const [queueStats, cacheStats] = await Promise.all([
      getJobStats(),
      cacheMetrics.getStats(),
    ]);

    // DB Pool Stats (mysql2 pool doesn't expose robust stats easily in all versions,
    // but we can infer active connections if we tracked them, or check pool object properties if available)
    // pool.pool.config.connectionLimit
    // Unfortunately, mysql2 pool stats are internal. We might need to wrap the pool to track this properly.
    // For now, we return basic config limits.
    const dbStats = {
      // @ts-ignore - inspecting internal pool state if possible or just config
      free: (pool as any).pool?._freeConnections?.length ?? "unknown",
      // @ts-ignore
      active: (pool as any).pool?._allConnections?.length ?? "unknown",
      limit: config.db.pool.connectionLimit
    };

    // Heuristic Health Score
    // 0 = Dead, 1 = Degraded, 2 = Healthy
    let healthScore = 2;
    const issues: string[] = [];

    if (queueStats.total > 1000 && queueStats.byStatus.queued > 500) {
        healthScore = 1;
        issues.push("queue_backlog_high");
    }

    if (dbStats.active !== "unknown" && Number(dbStats.active) >= config.db.pool.connectionLimit) {
        healthScore = 1;
        issues.push("db_pool_saturated");
    }

    res.json({
      status: "ok",
      health: {
          score: healthScore, // 2=Good, 1=Warning, 0=Critical
          label: healthScore === 2 ? "Healthy" : "Degraded",
          issues
      },
      timestamp: new Date().toISOString(),
      queue: queueStats,
      cache: cacheStats,
      db: dbStats,
      process: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
      }
    });
  } catch (error) {
    logger.error("ops.inspect_failed", { err: error });
    res.status(500).json({ error: "Inspection failed" });
  }
});

import { config } from "../config.js";

export { router as opsRouter };
