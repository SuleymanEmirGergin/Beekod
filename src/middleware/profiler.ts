import { Request, Response, NextFunction } from "express";
import { logger } from "../logger.js";
import { getQueryCount } from "../lib/context.js";

export const profiler = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const duration = process.hrtime(start);
    const durationMs = (duration[0] * 1000) + (duration[1] / 1e6);
    const queryCount = getQueryCount();

    const logData: any = {
        durationMs,
        queryCount,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        requestId: res.locals?.requestId,
    };

    // Warn on slow requests (> 500ms) or high query count (> 30)
    if (durationMs > 500 || queryCount > 30) {
        logger.warn("request.slow_or_heavy", logData);
    } else {
        // Debug level for all others to reduce noise in prod unless debugging
        logger.debug("request.perf", logData);
    }
  });

  next();
};
