import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { devLogger } from '../../utils/devLogger';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallbackUI?: (error: Error, resetError: () => void) => ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    componentName?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Logs error information and displays a fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const componentName = this.props.componentName || 'Unknown Component';

        // Log to development console
        devLogger.error(
            `Error Boundary [${componentName}]`,
            error.message,
            {
                error,
                componentStack: errorInfo.componentStack,
                errorInfo
            }
        );

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Update state with error info
        this.setState({
            errorInfo,
        });

        // In production, you might want to send this to an error reporting service
        if (!import.meta.env.DEV) {
            // Example: Sentry.captureException(error, { extra: errorInfo });
            console.error('Production Error:', error, errorInfo);
        }
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback UI if provided
            if (this.props.fallbackUI) {
                return this.props.fallbackUI(this.state.error, this.resetError);
            }

            // Default fallback UI
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                        {/* Error Icon */}
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        {/* Error Title */}
                        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                            Bir Şeyler Ters Gitti
                        </h2>

                        {/* Error Message */}
                        <p className="text-sm text-gray-600 text-center mb-6">
                            {this.props.componentName
                                ? `${this.props.componentName} yüklenirken bir hata oluştu.`
                                : 'Sayfa yüklenirken beklenmeyen bir hata oluştu.'}
                        </p>

                        {/* Development Mode: Show Error Details */}
                        {import.meta.env.DEV && (
                            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-xs font-mono text-red-900 mb-2 font-bold">
                                    {this.state.error.name}: {this.state.error.message}
                                </p>
                                {this.state.errorInfo?.componentStack && (
                                    <details className="mt-2">
                                        <summary className="text-xs text-red-700 cursor-pointer hover:text-red-900">
                                            Component Stack
                                        </summary>
                                        <pre className="text-xs text-red-800 mt-2 overflow-auto max-h-32 whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={this.resetError}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tekrar Dene
                            </button>
                            <button
                                onClick={() => (window.location.href = '/')}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Ana Sayfa
                            </button>
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-gray-500 text-center mt-4">
                            Sorun devam ederse lütfen destek ekibiyle iletişime geçin.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Lightweight Error Boundary for inline components
 * Shows a compact error message instead of full-page fallback
 */
export class InlineErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        devLogger.error(
            `Inline Error Boundary [${this.props.componentName || 'Component'}]`,
            error.message,
            { error, errorInfo }
        );

        this.setState({ errorInfo });

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    resetError = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallbackUI) {
                return this.props.fallbackUI(this.state.error, this.resetError);
            }

            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-red-900 mb-1">
                                Yüklenemedi
                            </h3>
                            <p className="text-xs text-red-700 mb-2">
                                {this.state.error.message}
                            </p>
                            <button
                                onClick={this.resetError}
                                className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Tekrar Dene
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
