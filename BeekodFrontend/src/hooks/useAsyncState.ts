/**
 * Enhanced Async State Management Hook
 * Prevents race conditions and cleanup issues
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { devLogger } from '../utils/devLogger';

interface AsyncState<T> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
}

interface UseAsyncStateOptions {
    initialData?: any;
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    enableLogging?: boolean;
}

/**
 * Custom hook for safe async state management
 * Automatically handles cleanup and prevents state updates on unmounted components
 */
export function useAsyncState<T = any>(
    asyncFunction: (...args: any[]) => Promise<T>,
    options: UseAsyncStateOptions = {}
) {
    const [state, setState] = useState<AsyncState<T>>({
        data: options.initialData || null,
        error: null,
        isLoading: false,
    });

    const isMountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            // Abort any pending requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const execute = useCallback(
        async (...args: any[]) => {
            // Abort previous request if still pending
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new AbortController
            abortControllerRef.current = new AbortController();

            // Only update state if component is mounted
            if (isMountedRef.current) {
                setState({ data: null, error: null, isLoading: true });
            }

            try {
                const result = await asyncFunction(...args);

                // Only update state if component is still mounted
                if (isMountedRef.current) {
                    setState({ data: result, error: null, isLoading: false });

                    if (options.onSuccess) {
                        options.onSuccess(result);
                    }

                    if (options.enableLogging) {
                        devLogger.success('useAsyncState', 'Data loaded successfully');
                    }
                }

                return result;
            } catch (error) {
                const err = error as Error;

                // Ignore abort errors
                if (err.name === 'AbortError') {
                    if (options.enableLogging) {
                        devLogger.info('useAsyncState', 'Request aborted');
                    }
                    return;
                }

                // Only update state if component is still mounted
                if (isMountedRef.current) {
                    setState({ data: null, error: err, isLoading: false });

                    if (options.onError) {
                        options.onError(err);
                    }

                    if (options.enableLogging) {
                        devLogger.error('useAsyncState', 'Failed to load data', err);
                    }
                }

                throw err;
            }
        },
        [asyncFunction, options]
    );

    const reset = useCallback(() => {
        if (isMountedRef.current) {
            setState({
                data: options.initialData || null,
                error: null,
                isLoading: false,
            });
        }
    }, [options.initialData]);

    return {
        ...state,
        execute,
        reset,
        isIdle: !state.isLoading && !state.data && !state.error,
        isSuccess: !state.isLoading && !!state.data && !state.error,
        isError: !state.isLoading && !!state.error,
    };
}

export default useAsyncState;
