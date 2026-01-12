import { createClient } from "redis";
import { logger } from "./logger.js";

const redisHost = process.env.REDIS_HOST?.trim() || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");
const redisPassword = process.env.REDIS_PASSWORD?.trim();
const redisPrefix = process.env.REDIS_PREFIX?.trim() || "beekod";

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connecting: Promise<RedisClient | null> | null = null;

export function getRedisPrefix() {
  return redisPrefix;
}

export async function getRedisClient(): Promise<RedisClient | null> {
  // ⚠️ PRODUCTION: Redis password zorunlu!
  if (process.env.NODE_ENV === 'production' && !redisPassword) {
    logger.error("redis.config_error", { message: "REDIS_PASSWORD is required in production!" });
    throw new Error("REDIS_PASSWORD is required in production mode");
  }

  if (client) {
    return client;
  }
  
  if (!connecting) {
    const config: any = {
      socket: {
        host: redisHost,
        port: redisPort,
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger.error("redis.max_retries", { retries });
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
      logger.error("redis.error", { err: error instanceof Error ? error.message : String(error) });
    });

    client.on("connect", () => {
      logger.info("redis.connected", { host: redisHost, port: redisPort });
    });

    client.on("reconnecting", () => {
      logger.warn("redis.reconnecting", { host: redisHost, port: redisPort });
    });

    connecting = client
      .connect()
      .then(() => {
        logger.info("redis.ready", { prefix: redisPrefix });
        return client;
      })
      .catch((error) => {
        logger.error("redis.connect_failed", { 
          err: error instanceof Error ? error.message : String(error),
          host: redisHost,
          port: redisPort
        });
        client = null;
        
        // Production'da Redis bağlantısı kritik!
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
        
        return null;
      });
  }
  
  return connecting;
}
