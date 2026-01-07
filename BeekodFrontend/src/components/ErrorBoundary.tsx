import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UI ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Bir şeyler ters gitti</h2>
          <p className="text-sm text-gray-600 mt-2">
            Uygulama beklenmedik bir hatayla karşılaştı. Sayfayı yenileyerek devam edebilirsin.
          </p>
          {this.state.message && (
            <p className="text-xs text-gray-400 mt-2 truncate">{this.state.message}</p>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F5B800] text-gray-900 text-sm font-medium hover:bg-[#E5A800] transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }
}
