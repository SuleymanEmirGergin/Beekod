/**
 * Development Logger
 * Provides color-coded console warnings and errors for development mode
 */

type LogLevel = 'error' | 'warning' | 'info' | 'success';

interface LogStyle {
    badge: string;
    text: string;
    icon: string;
}

const LOG_STYLES: Record<LogLevel, LogStyle> = {
    error: {
        badge: 'color: white; font-weight: bold; background: #DC2626; padding: 2px 6px; border-radius: 3px;',
        text: 'color: #991B1B;',
        icon: '🔴'
    },
    warning: {
        badge: 'color: #92400E; font-weight: bold; background: #FCD34D; padding: 2px 6px; border-radius: 3px;',
        text: 'color: #92400E;',
        icon: '🟡'
    },
    info: {
        badge: 'color: white; font-weight: bold; background: #2563EB; padding: 2px 6px; border-radius: 3px;',
        text: 'color: #1E40AF;',
        icon: '🔵'
    },
    success: {
        badge: 'color: white; font-weight: bold; background: #16A34A; padding: 2px 6px; border-radius: 3px;',
        text: 'color: #15803D;',
        icon: '🟢'
    }
};

class DevLogger {
    private isDevelopment: boolean;

    constructor() {
        this.isDevelopment = import.meta.env.DEV;
    }

    /**
     * Logs a message with specified level
     */
    private log(level: LogLevel, category: string, message: string, data?: any): void {
        if (!this.isDevelopment) return;

        const style = LOG_STYLES[level];
        const timestamp = new Date().toLocaleTimeString('tr-TR');

        console.log(
            `%c${style.icon} ${category}%c ${message}`,
            style.badge,
            style.text
        );

        if (data !== undefined) {
            console.log('%cData:', 'color: #6B7280; font-weight: bold;', data);
        }

        console.log('%c' + timestamp, 'color: #9CA3AF; font-size: 10px;');
    }

    /**
     * Logs an error
     */
    error(category: string, message: string, error?: any): void {
        this.log('error', category, message, error);

        // Also log the stack trace if available
        if (error?.stack && this.isDevelopment) {
            console.error(error.stack);
        }
    }

    /**
     * Logs a warning
     */
    warning(category: string, message: string, data?: any): void {
        this.log('warning', category, message, data);
    }

    /**
     * Logs an info message
     */
    info(category: string, message: string, data?: any): void {
        this.log('info', category, message, data);
    }

    /**
     * Logs a success message
     */
    success(category: string, message: string, data?: any): void {
        this.log('success', category, message, data);
    }

    /**
     * Logs API errors with detailed information
     */
    apiError(endpoint: string, error: any): void {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;
        const message = error?.response?.data?.message || error?.message;

        this.error(
            'API Error',
            `Failed to ${error?.config?.method?.toUpperCase() || 'call'} ${endpoint}`,
            {
                status,
                statusText,
                message,
                endpoint,
                fullError: error
            }
        );
    }

    /**
     * Logs deprecated feature usage
     */
    deprecated(feature: string, alternative?: string): void {
        const message = alternative
            ? `"${feature}" is deprecated. Use "${alternative}" instead.`
            : `"${feature}" is deprecated and will be removed in a future version.`;

        this.warning('Deprecated', message);
    }

    /**
     * Logs performance metrics
     */
    performance(label: string, duration: number): void {
        const color = duration < 100 ? 'success' : duration < 500 ? 'warning' : 'error';
        this.log(color, 'Performance', `${label} took ${duration}ms`);
    }
}

// Export singleton instance
export const devLogger = new DevLogger();

// Export for type-specific imports
export default devLogger;
