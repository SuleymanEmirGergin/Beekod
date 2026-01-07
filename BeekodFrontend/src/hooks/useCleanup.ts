/**
 * Memory Leak Prevention Hook
 * Provides cleanup patterns for useEffect
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for automatic cleanup of async operations
 */
export function useCleanup() {
    const cleanupFunctionsRef = useRef<Array<() => void>>([]);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Registers a cleanup function
     */
    const registerCleanup = useCallback((cleanupFn: () => void) => {
        cleanupFunctionsRef.current.push(cleanupFn);
    }, []);

    /**
     * Gets an AbortSignal for fetch requests
     */
    const getAbortSignal = useCallback((): AbortSignal => {
        if (!abortControllerRef.current) {
            abortControllerRef.current = new AbortController();
        }
        return abortControllerRef.current.signal;
    }, []);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            // Abort any pending requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Run all registered cleanup functions
            cleanupFunctionsRef.current.forEach((cleanup) => {
                try {
                    cleanup();
                } catch (error) {
                    console.error('Cleanup error:', error);
                }
            });

            // Clear the array
            cleanupFunctionsRef.current = [];
        };
    }, []);

    return {
        registerCleanup,
        getAbortSignal,
    };
}

/**
 * Hook for safe interval management
 */
export function useSafeInterval(
    callback: () => void,
    delay: number | null
): void {
    const savedCallbackRef = useRef(callback);

    // Remember the latest callback
    useEffect(() => {
        savedCallbackRef.current = callback;
    }, [callback]);

    // Set up the interval
    useEffect(() => {
        if (delay === null) {
            return;
        }

        const id = setInterval(() => savedCallbackRef.current(), delay);

        return () => clearInterval(id);
    }, [delay]);
}

/**
 * Hook for safe timeout management
 */
export function useSafeTimeout(
    callback: () => void,
    delay: number | null
): void {
    const savedCallbackRef = useRef(callback);

    // Remember the latest callback
    useEffect(() => {
        savedCallbackRef.current = callback;
    }, [callback]);

    // Set up the timeout
    useEffect(() => {
        if (delay === null) {
            return;
        }

        const id = setTimeout(() => savedCallbackRef.current(), delay);

        return () => clearTimeout(id);
    }, [delay]);
}

/**
 * Hook for safe event listener management
 */
export function useEventListener<K extends keyof WindowEventMap>(
    eventName: K,
    handler: (event: WindowEventMap[K]) => void,
    element: Window | HTMLElement = window
): void {
    const savedHandlerRef = useRef(handler);

    // Remember the latest handler
    useEffect(() => {
        savedHandlerRef.current = handler;
    }, [handler]);

    // Set up event listener
    useEffect(() => {
        const isSupported = element && element.addEventListener;
        if (!isSupported) return;

        const eventListener = (event: Event) =>
            savedHandlerRef.current(event as WindowEventMap[K]);

        element.addEventListener(eventName, eventListener);

        return () => {
            element.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element]);
}

export default useCleanup;
