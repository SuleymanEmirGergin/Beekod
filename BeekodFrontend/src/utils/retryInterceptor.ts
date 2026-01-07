/**
 * Automatic Retry Logic for Failed Requests
 * Handles transient network errors with exponential backoff
 */

import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { devLogger } from './devLogger';

interface RetryConfig {
    maxRetries: number;
    retryDelay: number;
    retryableStatuses: number[];
    retryableMethods: string[];
}

const DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second base delay
    retryableStatuses: [408, 429, 500, 502, 503, 504], // Request Timeout, Too Many Requests, Server Errors
    retryableMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'], // Safe methods
};

/**
 * Calculates exponential backoff delay
 */
function getRetryDelay(retryCount: number, baseDelay: number): number {
    return Math.min(baseDelay * Math.pow(2, retryCount), 10000); // Max 10 seconds
}

/**
 * Determines if a request should be retried
 */
function shouldRetry(
    error: AxiosError,
    config: InternalAxiosRequestConfig & { _retryCount?: number },
    retryConfig: RetryConfig
): boolean {
    const retryCount = config._retryCount || 0;

    // Don't retry if max retries exceeded
    if (retryCount >= retryConfig.maxRetries) {
        return false;
    }

    // Don't retry if method is not retryable
    if (config.method && !retryConfig.retryableMethods.includes(config.method.toUpperCase())) {
        return false;
    }

    // Retry on network errors
    if (!error.response) {
        return true;
    }

    // Retry on specific status codes
    if (error.response.status && retryConfig.retryableStatuses.includes(error.response.status)) {
        return true;
    }

    return false;
}

/**
 * Adds retry logic to axios instance
 */
export function addRetryInterceptor(
    axiosInstance: AxiosInstance,
    customConfig?: Partial<RetryConfig>
): void {
    const config = { ...DEFAULT_CONFIG, ...customConfig };

    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

            if (!originalRequest) {
                return Promise.reject(error);
            }

            // Initialize retry count
            if (!originalRequest._retryCount) {
                originalRequest._retryCount = 0;
            }

            // Check if we should retry
            if (!shouldRetry(error, originalRequest, config)) {
                devLogger.error(
                    'Request Failed',
                    `${originalRequest.method?.toUpperCase()} ${originalRequest.url} failed after ${originalRequest._retryCount} retries`,
                    error
                );
                return Promise.reject(error);
            }

            // Increment retry count
            originalRequest._retryCount += 1;

            // Calculate delay with exponential backoff
            const delay = getRetryDelay(originalRequest._retryCount, config.retryDelay);

            // Log retry attempt
            devLogger.warning(
                'Retrying Request',
                `${originalRequest.method?.toUpperCase()} ${originalRequest.url} (Attempt ${originalRequest._retryCount}/${config.maxRetries})`,
                { delay, error: error.message }
            );

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, delay));

            // Retry the request
            return axiosInstance(originalRequest);
        }
    );
}

export default addRetryInterceptor;
