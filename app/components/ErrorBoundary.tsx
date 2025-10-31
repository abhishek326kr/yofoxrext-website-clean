'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Send } from 'lucide-react';
import ErrorTracker from '@/lib/errorTracking';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  userDescription: string;
  reportSent: boolean;
  sending: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorTracker: ErrorTracker;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      userDescription: '',
      reportSent: false,
      sending: false,
    };

    this.errorTracker = ErrorTracker.getInstance();
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      userDescription: '',
      reportSent: false,
      sending: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to our error tracking system
    this.errorTracker.captureError(
      error,
      {
        component: errorInfo.componentStack,
        props: this.props,
        errorBoundary: true,
      },
      'critical'
    );

    // Update state with error details
    this.setState({
      errorInfo,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    this.setState({ userDescription: e.target.value });
  };

  handleReport = async (): Promise<void> => {
    this.setState({ sending: true });

    try {
      // Add user description to the error
      if (this.state.userDescription) {
        this.errorTracker.addUserDescription(this.state.userDescription);
      }

      // Force send the error batch
      await this.errorTracker.forceFlush();

      this.setState({
        reportSent: true,
        sending: false,
      });

      // Auto-reload after 3 seconds
      setTimeout(() => {
        this.handleReload();
      }, 3000);
    } catch (error) {
      console.error('Failed to send error report:', error);
      this.setState({ sending: false });
    }
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      userDescription: '',
      reportSent: false,
      sending: false,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
          <Card className="max-w-2xl w-full" data-testid="error-boundary-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Something went wrong</CardTitle>
                  <CardDescription>
                    An unexpected error occurred. The error has been logged automatically.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <Bug className="h-4 w-4" />
                  <AlertDescription className="font-mono text-sm">
                    <strong>Error:</strong> {this.state.error.message}
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold">
                          Component Stack
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Report form */}
              {!this.state.reportSent && (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="error-description"
                      className="block text-sm font-medium mb-2"
                    >
                      Help us understand what happened (optional)
                    </label>
                    <Textarea
                      id="error-description"
                      data-testid="input-error-description"
                      placeholder="What were you trying to do when this error occurred?"
                      value={this.state.userDescription}
                      onChange={this.handleDescriptionChange}
                      className="min-h-[100px]"
                      disabled={this.state.sending || this.state.reportSent}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={this.handleReport}
                      disabled={this.state.sending || this.state.reportSent}
                      className="flex-1"
                      data-testid="button-report-error"
                    >
                      {this.state.sending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending Report...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Report
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={this.handleReload}
                      variant="outline"
                      data-testid="button-reload-page"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reload Page
                    </Button>
                  </div>
                </div>
              )}

              {/* Success message */}
              {this.state.reportSent && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <AlertDescription className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    Thank you for your report! The page will reload automatically in a few seconds...
                  </AlertDescription>
                </Alert>
              )}

              {/* Alternative actions */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  You can also try these options:
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.history.back()}
                    data-testid="button-go-back"
                  >
                    Go Back
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => (window.location.href = '/')}
                    data-testid="button-go-home"
                  >
                    Go to Home
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={this.handleReset}
                    data-testid="button-try-again"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;