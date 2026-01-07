/**
 * Null Safety Helper Utilities
 * Prevents common null/undefined errors across the application
 */

/**
 * Safely converts any value to a string
 * @param value - Any value that needs to be converted to string
 * @param defaultValue - Default value if input is null/undefined
 * @returns Safe string representation
 */
export function safeString(value: any, defaultValue: string = ''): string {
    if (value === null || value === undefined) {
        return defaultValue;
    }
    return String(value);
}

/**
 * Safely gets a nested property from an object
 * @param obj - Source object
 * @param path - Dot-separated path (e.g., 'user.profile.name')
 * @param defaultValue - Default value if path doesn't exist
 * @returns The value at path or defaultValue
 */
export function safeGet<T = any>(obj: any, path: string, defaultValue?: T): T {
    if (!obj || typeof obj !== 'object') {
        return defaultValue as T;
    }

    const keys = path.split('.');
    let result: any = obj;

    for (const key of keys) {
        if (result === null || result === undefined || typeof result !== 'object') {
            return defaultValue as T;
        }
        result = result[key];
    }

    return result !== undefined ? result : (defaultValue as T);
}

/**
 * Safely parses JSON with fallback
 * @param jsonString - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or defaultValue
 */
export function safeJsonParse<T = any>(jsonString: string | null | undefined, defaultValue: T): T {
    if (!jsonString) {
        return defaultValue;
    }

    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.warn('[Safe JSON Parse] Failed to parse:', jsonString, error);
        return defaultValue;
    }
}

/**
 * Safely accesses array elements
 * @param array - Source array
 * @param index - Index to access
 * @param defaultValue - Default value if index is out of bounds
 * @returns Element at index or defaultValue
 */
export function safeArrayGet<T>(array: T[] | null | undefined, index: number, defaultValue?: T): T | undefined {
    if (!Array.isArray(array) || index < 0 || index >= array.length) {
        return defaultValue;
    }
    return array[index];
}

/**
 * Safely replaces text in a string
 * @param text - Source text
 * @param searchValue - Pattern to search for
 * @param replaceValue - Replacement value
 * @returns Replaced string or empty string if input is null/undefined
 */
export function safeReplace(
    text: string | null | undefined,
    searchValue: string | RegExp,
    replaceValue: string
): string {
    if (!text) {
        return '';
    }
    return text.replace(searchValue, replaceValue);
}

/**
 * Safely calls a function if it exists
 * @param fn - Function to call
 * @param args - Arguments to pass
 * @returns Function result or undefined
 */
export function safeCall<T = any>(fn: ((...args: any[]) => T) | null | undefined, ...args: any[]): T | undefined {
    if (typeof fn === 'function') {
        try {
            return fn(...args);
        } catch (error) {
            console.error('[Safe Call] Function execution failed:', error);
            return undefined;
        }
    }
    return undefined;
}

/**
 * Safely trims a string
 * @param value - String to trim
 * @returns Trimmed string or empty string
 */
export function safeTrim(value: string | null | undefined): string {
    return (value ?? '').trim();
}

/**
 * Safely checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns true if empty, false otherwise
 */
export function isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}
