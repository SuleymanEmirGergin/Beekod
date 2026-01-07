import { createClient } from "redis";
import { logger } from "./logger.js";

const redisUrl = process.env.REDIS_URL?.trim() ?? "";
const redisPrefix = process.env.REDIS_PREFIX?.trim() || "beekod";

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connecting: Promise<RedisClient | null> | null = null;

export function getRedisPrefix() {
  return redisPrefix;
}

export async function getRedisClient(): Promise<RedisClient | null> {
  if (!redisUrl) {
    return null;
  }
  if (client) {
    return client;
  }
  if (!connecting) {
    client = createClient({ url: redisUrl });
    client.on("error", (error) => {
      logger.warn("redis.error", { err: error instanceof Error ? error.message : String(error) });
    });
    connecting = client
      .connect()
      .then(() => client)
      .catch((error) => {
        logger.warn("redis.connect_failed", { err: error instanceof Error ? error.message : String(error) });
        client = null;
        return null;
      });
  }
  return connecting;
}
