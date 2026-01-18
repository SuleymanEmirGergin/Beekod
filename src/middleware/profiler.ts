import { Request, Response, NextFunction } from "express";
import { logger } from "../logger.js";

export const profiler = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const duration = process.hrtime(start);
    const durationMs = (duration[0] * 1000) + (duration[1] / 1e6);

    const logData: any = {
        durationMs,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        requestId: res.locals?.requestId,
    };

    // Warn on slow requests (> 500ms)
    if (durationMs > 500) {
        logger.warn("request.slow", logData);
    } else {
        // Debug level for all others to reduce noise in prod unless debugging
        logger.debug("request.perf", logData);
    }
  });

  next();
};
