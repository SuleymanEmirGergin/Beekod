
import { logger } from "../logger.js";

type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeoutMs: number;
}

export class CircuitBreaker {
    private state: CircuitBreakerState = "CLOSED";
    private failureCount = 0;
    private lastFailureTime = 0;
    private readonly failureThreshold: number;
    private readonly resetTimeoutMs: number;
    private readonly name: string;

    constructor(name: string, options: CircuitBreakerOptions = { failureThreshold: 3, resetTimeoutMs: 30000 }) {
        this.name = name;
        this.failureThreshold = options.failureThreshold;
        this.resetTimeoutMs = options.resetTimeoutMs;
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === "OPEN") {
            if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
                this.state = "HALF_OPEN";
                logger.info("circuit_breaker.half_open", { name: this.name });
            } else {
                throw new Error(`CircuitBreaker '${this.name}' is OPEN`);
            }
        }

        try {
            const result = await fn();
            if (this.state === "HALF_OPEN") {
                this.reset();
            }
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    private recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        logger.warn("circuit_breaker.failure", { name: this.name, count: this.failureCount });

        if (this.failureCount >= this.failureThreshold) {
            this.state = "OPEN";
            logger.error("circuit_breaker.open", { name: this.name });
        }
    }

    private reset() {
        this.state = "CLOSED";
        this.failureCount = 0;
        logger.info("circuit_breaker.closed", { name: this.name });
    }
}
