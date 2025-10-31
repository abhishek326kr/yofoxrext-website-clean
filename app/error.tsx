'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import ErrorTracker from '@/lib/errorTracking';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to error tracking service
    const tracker = ErrorTracker.getInstance();
    if (tracker) {
      tracker.captureError(
        error,
        {
          component: 'NextJS Error Boundary',
          errorType: 'ssr',
          digest: error.digest,
        },
        'critical'
      );
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-2xl">Something went wrong!</CardTitle>
              <CardDescription>
                An error occurred while rendering this page. The error has been logged.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                <strong>Error:</strong> {error.message}
                {error.digest && (
                  <div className="mt-2">
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={reset}
              className="flex items-center gap-2"
              data-testid="button-try-again"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
              data-testid="button-go-home"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}