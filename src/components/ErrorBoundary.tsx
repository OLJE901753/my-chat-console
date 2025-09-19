import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please share this with the development team.');
      })
      .catch(() => {
        // Fallback: show error report in alert
        alert(`Error Report (ID: ${errorId}):\n\n${error?.message}\n\nPlease share this with the development team.`);
      });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <Card className="w-full max-w-2xl glass-card border-red-500/30">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-red-400" />
              </div>
              <CardTitle className="text-2xl text-red-400">Something went wrong</CardTitle>
              <CardDescription className="text-gray-400">
                An unexpected error occurred. We're sorry for the inconvenience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Details */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Error Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Error ID:</span>
                    <span className="ml-2 font-mono text-yellow-400">{errorId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Message:</span>
                    <span className="ml-2 text-red-300">{error?.message || 'Unknown error'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Time:</span>
                    <span className="ml-2 text-gray-300">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-lime-600 hover:bg-lime-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="flex-1"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Report Bug
                </Button>
              </div>

              {/* Development Stack Trace */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="bg-gray-800/30 rounded-lg p-4">
                  <summary className="text-sm font-medium text-gray-300 cursor-pointer">
                    Stack Trace (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-40">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        {this.props.children}
      </React.Suspense>
    );
  }
}

export default ErrorBoundary;
