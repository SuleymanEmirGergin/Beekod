import { createClient } from 'redis';
import { logger } from '../logger.js';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined,
});

// Error handling
redisClient.on('error', (err) => {
  logger.error('redis.connection_error', { error: err });
});

// Connect to Redis
let isConnected = false;

export async function connectRedis() {
  if (isConnected) return;

  try {
    await redisClient.connect();
    isConnected = true;
    logger.info('redis.connected');
  } catch (error) {
    logger.error('redis.connect_failed', { error });
    // Continue without Redis if connection fails
  }
}

/**
 * Get cached data
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!isConnected) return null;

  try {
    const data = await redisClient.get(key);
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
export async function setCache(key: string, value: any, ttl: number = 300): Promise<boolean> {
  if (!isConnected) return false;

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
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
  if (!isConnected) return false;

  try {
    await redisClient.del(key);
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
  if (!isConnected) return false;

  try {
    await redisClient.flushDb();
    logger.info('redis.cache_cleared');
    return true;
  } catch (error) {
    logger.error('redis.clear_failed', { error });
    return false;
  }
}

/**
 * Cache middleware for Express routes
 */
export function cacheMiddleware(ttl: number = 300) {
  return async (req: any, res: any, next: any) => {
    if (!isConnected) return next();

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
    res.json = function (data: any) {
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

export { redisClient };
