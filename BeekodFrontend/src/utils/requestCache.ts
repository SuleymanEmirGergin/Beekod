/**
 * Request Deduplication Cache
 * Prevents duplicate API requests from being sent simultaneously
 */

import { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { devLogger } from './devLogger';

interface PendingRequest {
    promise: Promise<AxiosResponse>;
    timestamp: number;
}

class RequestCache {
    private cache: Map<string, PendingRequest> = new Map();
    private readonly cacheTTL: number = 5000; // 5 seconds

    /**
     * Generates a unique key for a request
     */
    private generateKey(config: InternalAxiosRequestConfig): string {
        const { method, url, params, data } = config;
        return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
    }

    /**
     * Checks if a request is already pending
     */
    has(config: InternalAxiosRequestConfig): boolean {
        const key = this.generateKey(config);
        const pending = this.cache.get(key);

        if (!pending) return false;

        // Remove expired entries
        if (Date.now() - pending.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Gets a pending request promise
     */
    get(config: InternalAxiosRequestConfig): Promise<AxiosResponse> | undefined {
        const key = this.generateKey(config);
        return this.cache.get(key)?.promise;
    }

    /**
     * Adds a pending request to cache
     */
    set(config: InternalAxiosRequestConfig, promise: Promise<AxiosResponse>): void {
        const key = this.generateKey(config);
        this.cache.set(key, {
            promise,
            timestamp: Date.now(),
        });

        // Auto-cleanup after completion
        promise.finally(() => {
            setTimeout(() => this.cache.delete(key), 100);
        });
    }

    /**
     * Clears the entire cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Gets cache size
     */
    size(): number {
        return this.cache.size;
    }
}

const requestCache = new RequestCache();

/**
 * Adds request deduplication to axios instance
 */
export function addDeduplicationInterceptor(axiosInstance: AxiosInstance): void {
    // Request interceptor
    axiosInstance.interceptors.request.use(
        (config) => {
            // Skip deduplication for non-GET requests by default
            // (can be customized with config.headers['X-Deduplicate'])
            const shouldDeduplicate =
                config.method?.toUpperCase() === 'GET' ||
                config.headers?.['X-Deduplicate'] === 'true';

            if (!shouldDeduplicate) {
                return config;
            }

            // Check if request is already pending
            if (requestCache.has(config)) {
                devLogger.info(
                    'Request Deduplicated',
                    `Reusing pending request: ${config.method?.toUpperCase()} ${config.url}`
                );

                // Return existing promise
                const pendingPromise = requestCache.get(config);
                if (pendingPromise) {
                    // Cancel this request and return the cached one
                    throw {
                        __CANCEL__: true,
                        promise: pendingPromise,
                    };
                }
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            // Handle deduplicated requests
            if (error?.__CANCEL__ && error?.promise) {
                return error.promise;
            }
            return Promise.reject(error);
        }
    );
}

/**
 * Wrap axios request to enable deduplication
 */
export function wrapWithDeduplication<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    config: InternalAxiosRequestConfig
): Promise<AxiosResponse<T>> {
    if (requestCache.has(config)) {
        const cached = requestCache.get(config);
        if (cached) return cached as Promise<AxiosResponse<T>>;
    }

    const promise = requestFn();
    requestCache.set(config, promise as Promise<AxiosResponse>);

    return promise;
}

export { requestCache };
export default addDeduplicationInterceptor;
