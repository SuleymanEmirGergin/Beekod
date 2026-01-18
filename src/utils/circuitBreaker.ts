import { logger } from "../logger.js";

interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time in ms before attempting to close
}

enum CircuitState {
  CLOSED, // Normal operation
  OPEN,   // Failing, blocking requests
  HALF_OPEN // Testing recovery
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private nextAttempt: number = 0;
  private options: CircuitBreakerOptions;
  private name: string;

  constructor(name: string, options: CircuitBreakerOptions = { failureThreshold: 5, resetTimeout: 30000 }) {
    this.name = name;
    this.options = options;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() > this.nextAttempt) {
        this.state = CircuitState.HALF_OPEN;
        logger.warn("circuit_breaker.half_open", { name: this.name });
      } else {
        throw new Error(`CircuitBreaker '${this.name}' is OPEN. Request blocked.`);
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
        logger.info("circuit_breaker.closed", { name: this.name });
    }
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(error: any) {
    this.failures++;
    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
      logger.error("circuit_breaker.opened", { name: this.name, failures: this.failures, resetIn: this.options.resetTimeout, lastError: error.message });
    }
  }
}
