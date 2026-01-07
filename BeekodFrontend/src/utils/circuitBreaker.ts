/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by temporarily disabling failing endpoints
 */

import { devLogger } from './devLogger';

enum CircuitState {
    CLOSED = 'CLOSED',     // Normal operation
    OPEN = 'OPEN',         // Circuit tripped, rejecting requests
    HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    monitoringPeriod: number;
}

interface CircuitMetrics {
    failures: number;
    successes: number;
    consecutiveSuccesses: number;
    lastFailureTime?: number;
    state: CircuitState;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,      // Open circuit after 5 failures
    successThreshold: 2,      // Close circuit after 2 successes in HALF_OPEN
    timeout: 30000,           // 30 seconds before trying again
    monitoringPeriod: 60000,  // 1 minute monitoring window
};

class CircuitBreaker {
    private circuits: Map<string, CircuitMetrics> = new Map();
    private config: CircuitBreakerConfig;

    constructor(config?: Partial<CircuitBreakerConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Generates a circuit key for an endpoint
     */
    private getKey(endpoint: string): string {
        return endpoint;
    }

    /**
     * Gets or initializes circuit metrics
     */
    private getMetrics(endpoint: string): CircuitMetrics {
        const key = this.getKey(endpoint);

        if (!this.circuits.has(key)) {
            this.circuits.set(key, {
                failures: 0,
                successes: 0,
                consecutiveSuccesses: 0,
                state: CircuitState.CLOSED,
            });
        }

        return this.circuits.get(key)!;
    }

    /**
     * Checks if circuit should open
     */
    private shouldOpen(metrics: CircuitMetrics): boolean {
        return metrics.failures >= this.config.failureThreshold;
    }

    /**
     * Checks if circuit should try half-open
     */
    private shouldAttemptReset(metrics: CircuitMetrics): boolean {
        if (metrics.state !== CircuitState.OPEN) return false;
        if (!metrics.lastFailureTime) return false;

        const elapsed = Date.now() - metrics.lastFailureTime;
        return elapsed >= this.config.timeout;
    }

    /**
     * Checks if circuit should close
     */
    private shouldClose(metrics: CircuitMetrics): boolean {
        return (
            metrics.state === CircuitState.HALF_OPEN &&
            metrics.consecutiveSuccesses >= this.config.successThreshold
        );
    }

    /**
     * Determines if a request can proceed
     */
    canProceed(endpoint: string): boolean {
        const metrics = this.getMetrics(endpoint);

        // If circuit is open, check if we should try half-open
        if (metrics.state === CircuitState.OPEN) {
            if (this.shouldAttemptReset(metrics)) {
                metrics.state = CircuitState.HALF_OPEN;
                devLogger.info(
                    'Circuit Breaker',
                    `${endpoint} entering HALF_OPEN state`,
                    { failures: metrics.failures }
                );
                return true;
            }

            devLogger.warning(
                'Circuit Breaker',
                `${endpoint} is OPEN, request blocked`,
                {
                    failures: metrics.failures,
                    lastFailure: metrics.lastFailureTime
                }
            );
            return false;
        }

        return true;
    }

    /**
     * Records a successful request
     */
    recordSuccess(endpoint: string): void {
        const metrics = this.getMetrics(endpoint);

        metrics.successes++;
        metrics.consecutiveSuccesses++;

        // Reset failure count on success in HALF_OPEN
        if (metrics.state === CircuitState.HALF_OPEN) {
            metrics.failures = 0;
        }

        // Close circuit if threshold met
        if (this.shouldClose(metrics)) {
            metrics.state = CircuitState.CLOSED;
            metrics.failures = 0;
            metrics.consecutiveSuccesses = 0;

            devLogger.success(
                'Circuit Breaker',
                `${endpoint} circuit CLOSED, service recovered`,
                { successes: metrics.successes }
            );
        }
    }

    /**
     * Records a failed request
     */
    recordFailure(endpoint: string): void {
        const metrics = this.getMetrics(endpoint);

        metrics.failures++;
        metrics.consecutiveSuccesses = 0;
        metrics.lastFailureTime = Date.now();

        // Open circuit if threshold exceeded
        if (this.shouldOpen(metrics)) {
            metrics.state = CircuitState.OPEN;

            devLogger.error(
                'Circuit Breaker',
                `${endpoint} circuit OPENED due to failures`,
                {
                    failures: metrics.failures,
                    threshold: this.config.failureThreshold
                }
            );
        }

        // Revert to OPEN if failure in HALF_OPEN
        if (metrics.state === CircuitState.HALF_OPEN) {
            metrics.state = CircuitState.OPEN;

            devLogger.warning(
                'Circuit Breaker',
                `${endpoint} failed in HALF_OPEN, reverting to OPEN`,
                { failures: metrics.failures }
            );
        }
    }

    /**
     * Gets current state of a circuit
     */
    getState(endpoint: string): CircuitState {
        return this.getMetrics(endpoint).state;
    }

    /**
     * Manually resets a circuit
     */
    reset(endpoint: string): void {
        const key = this.getKey(endpoint);
        this.circuits.delete(key);
        devLogger.info('Circuit Breaker', `${endpoint} circuit manually reset`);
    }

    /**
     * Gets metrics for monitoring
     */
    getMetricsSnapshot(): Record<string, CircuitMetrics> {
        const snapshot: Record<string, CircuitMetrics> = {};
        this.circuits.forEach((metrics, key) => {
            snapshot[key] = { ...metrics };
        });
        return snapshot;
    }
}

// Export singleton instance
export const circuitBreaker = new CircuitBreaker();

/**
 * Wraps a function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
    endpoint: string,
    fn: () => Promise<T>
): Promise<T> {
    if (!circuitBreaker.canProceed(endpoint)) {
        throw new Error(`Circuit breaker is OPEN for ${endpoint}`);
    }

    try {
        const result = await fn();
        circuitBreaker.recordSuccess(endpoint);
        return result;
    } catch (error) {
        circuitBreaker.recordFailure(endpoint);
        throw error;
    }
}

export { CircuitState, CircuitBreaker };
export default circuitBreaker;
