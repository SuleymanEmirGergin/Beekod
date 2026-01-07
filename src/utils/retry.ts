import { logger } from "../logger.js";

interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
  onRetry?: (error: any, attempt: number) => void;
}

/**
 * Retries a promise-returning function with exponential backoff.
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const minTimeout = options.minTimeout ?? 1000;
  const maxTimeout = options.maxTimeout ?? 10000;
  const factor = options.factor ?? 2;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      if (attempt > retries) {
        throw error;
      }

      // Check if error is retryable (optional logic could be added here)
      // For now, we assume all errors in this context might be transient

      const delay = Math.min(minTimeout * Math.pow(factor, attempt - 1), maxTimeout);

      if (options.onRetry) {
        options.onRetry(error, attempt);
      } else {
        logger.warn("retry.attempt", {
          attempt,
          delay,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
