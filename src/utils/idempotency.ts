import { queue } from "../services/queue/index.js";
import { logger } from "../logger.js";

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

export const idempotency = {
  /**
   * Generates a key for idempotency check
   */
  generateKey(scope: string, id: string): string {
    return `idempotency:${scope}:${id}`;
  },

  /**
   * Checks if an operation has been processed recently.
   * If not, sets the key with a TTL.
   * @returns true if already processed, false if new (and now locked)
   */
  async checkAndLock(scope: string, id: string, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<boolean> {
    const key = this.generateKey(scope, id);
    try {
      const client = await queue.client;
      const set = await client.set(key, "1", "NX", "EX", ttlSeconds);
      if (!set) {
        logger.debug("idempotency.locked", { scope, id });
        return true; // Already processed/locked
      }
      return false; // New operation, lock acquired
    } catch (error) {
      logger.error("idempotency.check_failed", { scope, id, error });
      // Fail open: if Redis is down, allow processing to avoid permanent blockage,
      // though this risks duplication.
      return false;
    }
  },

  /**
   * Release a lock early (e.g. if processing failed)
   */
  async release(scope: string, id: string): Promise<void> {
    const key = this.generateKey(scope, id);
    try {
      const client = await queue.client;
      await client.del(key);
    } catch (error) {
      logger.warn("idempotency.release_failed", { scope, id, error });
    }
  }
};
