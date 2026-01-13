import { getRedisClient, getRedisPrefix } from "../../redis.js";
import { logger } from "../../logger.js";

/**
 * Get cached data
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  if (!client) return null;

  // Ensure prefix consistency if not handled by client config (redis.ts prefix logic is manual)
  const prefixedKey = `${getRedisPrefix()}:${key}`;

  try {
    const data = await client.get(prefixedKey);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (error) {
    logger.error('redis.get_failed', { key, error });
    return null;
  }
}

/**
 * Set cache with TTL (in seconds)
 */
export async function setCache(key: string, value: unknown, ttl: number = 300): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  const prefixedKey = `${getRedisPrefix()}:${key}`;

  try {
    await client.set(prefixedKey, JSON.stringify(value), { EX: ttl });
    return true;
  } catch (error) {
    logger.error('redis.set_failed', { key, error });
    return false;
  }
}

/**
 * Delete cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  const prefixedKey = `${getRedisPrefix()}:${key}`;

  try {
    await client.del(prefixedKey);
    return true;
  } catch (error) {
    logger.error('redis.delete_failed', { key, error });
    return false;
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearCache(): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  try {
    // Ideally scan and delete only with prefix, but flushDb clears everything
    // Use FlushDB with caution if sharing Redis instance
    // For now, logging warning
    logger.warn('redis.clearing_all_cache');
    await client.flushDb();
    return true;
  } catch (error) {
    logger.error('redis.clear_failed', { error });
    return false;
  }
}
import type { Request, Response, NextFunction } from 'express';

/**
 * Cache middleware for Express routes
 */
export function cacheMiddleware(ttl: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await getCache(key);
      if (cached) {
        logger.info('redis.cache_hit', { url: req.originalUrl });
        return res.json(cached);
      }
    } catch (error) {
      logger.error('redis.middleware_error', { error });
    }

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache response
    res.json = function (data: unknown) {
      setCache(key, data, ttl).catch((err) => {
        logger.error('redis.cache_set_failed', { key, error: err });
      });
      return originalJson(data);
    };

    next();
  };
}

// Export cache object for backward compatibility
export const cache = {
  get: getCache,
  set: setCache,
  delete: deleteCache,
  clear: clearCache,
};

