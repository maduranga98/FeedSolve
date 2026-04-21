import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { captureErrorBoundary } from '../../lib/monitoring';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Log to Sentry
    captureErrorBoundary(error, errorInfo);

    if (window.__VITALS_DATA__ === undefined) {
      window.__VITALS_DATA__ = [];
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB] px-4">
            <div className="max-w-md text-center">
              <AlertTriangle className="w-16 h-16 text-[#E74C3C] mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">
                Something went wrong
              </h1>
              <p className="text-[#6B7B8D] mb-6">
                {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="primary"
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Go to Dashboard
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-8 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-[#6B7B8D]">
                    Error Details (Dev Only)
                  </summary>
                  <pre className="mt-4 p-4 bg-[#E8E8E8] rounded overflow-auto text-xs text-[#1E3A5F]">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

declare global {
  interface Window {
    __VITALS_DATA__?: any[];
  }
}
