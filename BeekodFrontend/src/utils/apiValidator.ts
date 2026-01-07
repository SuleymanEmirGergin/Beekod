/**
 * API Path Validator
 * Detects and prevents common API path errors like duplicate /api/ prefixes
 */

interface PathValidationResult {
    isValid: boolean;
    correctedPath?: string;
    warning?: string;
}

/**
 * Validates API paths and corrects common mistakes
 */
export function validateApiPath(path: string): PathValidationResult {
    // Check for duplicate /api/ prefix
    const duplicateApiRegex = /\/api\/api\//gi;

    if (duplicateApiRegex.test(path)) {
        const correctedPath = path.replace(duplicateApiRegex, '/api/');
        return {
            isValid: false,
            correctedPath,
            warning: `⚠️ [API Path Validator] Duplicate /api/ prefix detected in "${path}". Auto-corrected to "${correctedPath}"`
        };
    }

    // Check for triple or more /api/ prefixes (edge case)
    const tripleApiRegex = /\/api\/api\/api\//gi;
    if (tripleApiRegex.test(path)) {
        const correctedPath = path.replace(/\/api\/+/gi, '/api/');
        return {
            isValid: false,
            correctedPath,
            warning: `⚠️ [API Path Validator] Multiple /api/ prefixes detected in "${path}". Auto-corrected to "${correctedPath}"`
        };
    }

    return { isValid: true };
}

/**
 * Logs validation warnings in development mode with color coding
 */
export function logPathWarning(warning: string, isDevelopment: boolean = import.meta.env.DEV): void {
    if (!isDevelopment) return;

    console.warn(
        '%c[API Path Validator]%c ' + warning,
        'color: #FF6B6B; font-weight: bold; background: #FFF3CD; padding: 2px 4px; border-radius: 3px;',
        'color: #856404;'
    );
}

/**
 * Main validation function with automatic correction
 */
export function validateAndCorrectPath(path: string): string {
    const result = validateApiPath(path);

    if (!result.isValid && result.warning) {
        logPathWarning(result.warning);
        return result.correctedPath || path;
    }

    return path;
}
