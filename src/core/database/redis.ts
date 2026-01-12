/**
 * Redis Client
 * @module core/database/redis
 */

import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST?.trim() || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");
const redisPassword = process.env.REDIS_PASSWORD?.trim();
const redisPrefix = process.env.REDIS_PREFIX?.trim() || "beekod";

export type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connecting: Promise<RedisClient | null> | null = null;

/**
 * Get the Redis key prefix
 */
export function getRedisPrefix(): string {
  return redisPrefix;
}

/**
 * Get Redis connection configuration
 */
export function getRedisConfig() {
  return {
    host: redisHost,
    port: redisPort,
    hasPassword: Boolean(redisPassword),
    prefix: redisPrefix,
  };
}

/**
 * Get or create Redis client
 * Returns null if Redis is not available (non-production only)
 */
export async function getRedisClient(
  logger?: { 
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
  }
): Promise<RedisClient | null> {
  // ⚠️ PRODUCTION: Redis password zorunlu!
  if (process.env.NODE_ENV === "production" && !redisPassword) {
    const errorMsg = "REDIS_PASSWORD is required in production!";
    logger?.error("redis.config_error", { message: errorMsg });
    throw new Error("REDIS_PASSWORD is required in production mode");
  }

  if (client) {
    return client;
  }

  if (!connecting) {
    const config: Parameters<typeof createClient>[0] = {
      socket: {
        host: redisHost,
        port: redisPort,
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger?.error("redis.max_retries", { retries });
            return new Error("Redis max retries exceeded");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    };

    // Password varsa ekle
    if (redisPassword) {
      config.password = redisPassword;
    }

    client = createClient(config);

    client.on("error", (error) => {
      logger?.error("redis.error", { err: error instanceof Error ? error.message : String(error) });
    });

    client.on("connect", () => {
      logger?.info("redis.connected", { host: redisHost, port: redisPort });
    });

    client.on("reconnecting", () => {
      logger?.warn("redis.reconnecting", { host: redisHost, port: redisPort });
    });

    connecting = client
      .connect()
      .then(() => {
        logger?.info("redis.ready", { prefix: redisPrefix });
        return client;
      })
      .catch((error) => {
        logger?.error("redis.connect_failed", {
          err: error instanceof Error ? error.message : String(error),
          host: redisHost,
          port: redisPort,
        });
        client = null;

        // Production'da Redis bağlantısı kritik!
        if (process.env.NODE_ENV === "production") {
          throw error;
        }

        return null;
      });
  }

  return connecting;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    connecting = null;
  }
}
