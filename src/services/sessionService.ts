import { logger } from "../logger.js";

interface SyncContext {
  barcode: string;
  price: number;
  stock?: number;
  timestamp: number;
}

// In-memory session storage
// For production, use Redis or similar persistent store
const sessions = new Map<string, SyncContext>();

// Cleanup interval: remove expired sessions every minute
setInterval(() => {
  const now = Date.now();
  const TTL = 5 * 60 * 1000; // 5 minutes

  for (const [key, value] of sessions.entries()) {
    if (now - value.timestamp > TTL) {
      sessions.delete(key);
      logger.debug("session.expired", { requestId: key });
    }
  }
}, 60 * 1000);

/**
 * Store pending sync context for a request
 * @param requestId - Unique request identifier
 * @param context - Sync context (barcode, price, stock)
 */
export function setPendingSync(requestId: string, context: Omit<SyncContext, "timestamp">): void {
  sessions.set(requestId, {
    ...context,
    timestamp: Date.now(),
  });
  logger.info("session.sync_pending", { requestId, barcode: context.barcode });
}

/**
 * Retrieve pending sync context
 * @param requestId - Request identifier
 * @returns Sync context or null if expired/not found
 */
export function getPendingSync(requestId: string): SyncContext | null {
  const ctx = sessions.get(requestId);

  if (!ctx) {
    return null;
  }

  // Check TTL (5 minutes)
  const TTL = 5 * 60 * 1000;
  if (Date.now() - ctx.timestamp > TTL) {
    sessions.delete(requestId);
    logger.debug("session.expired_on_get", { requestId });
    return null;
  }

  return ctx;
}

/**
 * Clear pending sync context
 * @param requestId - Request identifier
 */
export function clearPendingSync(requestId: string): void {
  const existed = sessions.delete(requestId);
  if (existed) {
    logger.debug("session.cleared", { requestId });
  }
}

/**
 * Get session stats (for monitoring)
 */
export function getSessionStats() {
  return {
    activeCount: sessions.size,
    sessions: Array.from(sessions.entries()).map(([id, ctx]) => ({
      requestId: id,
      barcode: ctx.barcode,
      age: Date.now() - ctx.timestamp,
    })),
  };
}
