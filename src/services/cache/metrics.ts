import { queue } from "../queue/index.js";
import { logger } from "../../logger.js";

// Keep in-memory stats for immediate visibility, though less persistent than Redis
const metrics = {
  hits: 0,
  misses: 0,
  keysRead: 0,
  keysWritten: 0,
};

export const cacheMetrics = {
  recordHit() {
    metrics.hits++;
    metrics.keysRead++;
  },

  recordMiss() {
    metrics.misses++;
    metrics.keysRead++;
  },

  recordWrite() {
    metrics.keysWritten++;
  },

  async getStats() {
    let memoryUsage = 0;
    let redisInfo = {};

    try {
      const client = await queue.client;
      const info = await client.info("memory");
      const match = info.match(/used_memory:(\d+)/);
      if (match) {
        memoryUsage = parseInt(match[1], 10);
      }
      redisInfo = { used_memory_bytes: memoryUsage };
    } catch (error) {
      logger.warn("cache_metrics.redis_info_failed", { error });
    }

    const total = metrics.hits + metrics.misses;
    const hitRate = total > 0 ? (metrics.hits / total) * 100 : 0;

    return {
      hits: metrics.hits,
      misses: metrics.misses,
      hitRate: parseFloat(hitRate.toFixed(2)),
      writes: metrics.keysWritten,
      redis: redisInfo,
    };
  },
};
