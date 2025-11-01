'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ErrorTracker from '@/lib/errorTracking';
import {
  AlertTriangle,
  Bug,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  Zap,
  Server,
  Image,
  Wifi,
  Shield,
  Upload,
  Activity,
  Database,
  Lock,
  WifiOff,
} from 'lucide-react';

export default function ErrorTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [errorTracker, setErrorTracker] = useState<any>(null);
  
  useEffect(() => {
    // Only instantiate ErrorTracker on the client side
    if (typeof window !== 'undefined') {
      setErrorTracker(ErrorTracker.getInstance());
    }
  }, []);

  const addResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${result}`]);
  };

  const testJavaScriptError = () => {
    if (!errorTracker) {
      addResult('⚠ Error tracker not initialized');
      return;
    }
    try {
      addResult('Testing JavaScript Error...');
      throw new Error('Test JavaScript error from test page');
    } catch (error) {
      errorTracker.captureError(error as Error, { test: true, type: 'javascript' }, 'error');
      addResult('✓ JavaScript error captured');
    }
  };

  const testPromiseRejection = () => {
    addResult('Testing Promise Rejection...');
    
    // Create unhandled rejection
    new Promise((_, reject) => {
      reject(new Error('Test unhandled promise rejection'));
    });
    
    setTimeout(() => {
      addResult('✓ Promise rejection should be captured');
    }, 100);
  };

  const testConsoleError = () => {
    addResult('Testing Console Error...');
    console.error('Test console error', { data: 'test data' });
    addResult('✓ Console error captured');
  };

  const testConsoleWarn = () => {
    addResult('Testing Console Warning...');
    console.warn('Test console warning', { warning: 'test warning' });
    addResult('✓ Console warning captured');
  };

  const testAPIError = async () => {
    addResult('Testing API Error...');
    
    try {
      const response = await fetch('/api/test-nonexistent-endpoint');
      if (!response.ok) {
        addResult(`✓ API error captured (404)`);
      }
    } catch (error) {
      addResult('✓ Network error captured');
    }
  };

  const testCriticalError = () => {
    addResult('Testing Critical Error...');
    errorTracker.captureError(
      new Error('Test critical error - system failure'),
      { test: true, type: 'critical' },
      'critical',
      'This is a test critical error with user description'
    );
    addResult('✓ Critical error captured with user description');
  };

  const testWarning = () => {
    addResult('Testing Warning...');
    errorTracker.captureError(
      'Test warning message',
      { test: true, type: 'warning' },
      'warning'
    );
    addResult('✓ Warning captured');
  };

  const testInfo = () => {
    addResult('Testing Info Message...');
    errorTracker.captureError(
      'Test info message',
      { test: true, type: 'info' },
      'info'
    );
    addResult('✓ Info message captured');
  };

  const testBatchErrors = () => {
    addResult('Testing Batch Error Sending (10 errors)...');
    
    for (let i = 0; i < 10; i++) {
      errorTracker.captureError(
        new Error(`Batch test error #${i + 1}`),
        { test: true, type: 'batch', index: i },
        'error'
      );
    }
    
    addResult('✓ 10 errors queued - should trigger immediate batch send');
  };

  const testComponentError = () => {
    addResult('Testing Component Error (will crash component)...');
    
    // This will trigger the error boundary
    throw new Error('Test component crash - ErrorBoundary should catch this');
  };

  const forceFlushErrors = async () => {
    addResult('Forcing flush of error queue...');
    await errorTracker.forceFlush();
    addResult('✓ Error queue flushed');
  };

  const testBackendError = async () => {
    addResult('Testing Backend Error...');
    
    try {
      const response = await fetch('/api/test-backend-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'error' }),
      });
      
      if (!response.ok) {
        addResult(`✓ Backend error triggered (${response.status})`);
      }
    } catch (error) {
      addResult('✓ Backend error request failed as expected');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // New test functions for missing error types

  const testResourceLoadError = () => {
    addResult('Testing Resource Load Error...');
    
    // Create a broken image element
    const img = document.createElement('img');
    img.src = 'https://invalid-domain-12345.com/broken-image.jpg';
    img.style.display = 'none';
    document.body.appendChild(img);
    
    // Create a broken script
    const script = document.createElement('script');
    script.src = 'https://invalid-domain-12345.com/broken-script.js';
    document.body.appendChild(script);
    
    // Create a broken stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://invalid-domain-12345.com/broken-style.css';
    document.head.appendChild(link);
    
    setTimeout(() => {
      // Clean up
      document.body.removeChild(img);
      document.body.removeChild(script);
      document.head.removeChild(link);
      addResult('✓ Resource loading errors should be captured (check console)');
    }, 1000);
  };

  const testWebSocketError = () => {
    addResult('Testing WebSocket Error...');
    
    // Simulate WebSocket error
    if (errorTracker && errorTracker.captureWebSocketError) {
      errorTracker.captureWebSocketError(
        new Error('Test WebSocket connection failed'),
        {
          event: 'connection_failed',
          url: 'ws://invalid-socket-server.com',
          reconnecting: true
        }
      );
      addResult('✓ WebSocket error captured');
    } else {
      addResult('⚠ WebSocket error tracking not available');
    }
  };

  const testValidationError = () => {
    addResult('Testing Validation Error (Zod)...');
    
    // Simulate Zod validation error
    const mockZodError = {
      issues: [
        {
          path: ['email'],
          message: 'Invalid email format',
          code: 'invalid_string'
        },
        {
          path: ['age'],
          message: 'Must be at least 18',
          code: 'too_small'
        }
      ]
    };
    
    if (errorTracker && errorTracker.captureValidationError) {
      errorTracker.captureValidationError(mockZodError, 'UserRegistrationSchema');
      addResult('✓ Validation error captured');
    } else {
      // Fallback to window method if available
      if ((window as any).__captureZodError) {
        (window as any).__captureZodError(mockZodError, 'UserRegistrationSchema');
        addResult('✓ Validation error captured via window method');
      } else {
        addResult('⚠ Validation error tracking not available');
      }
    }
  };

  const testPerformanceIssue = () => {
    addResult('Testing Performance Issue...');
    
    // Simulate slow operation
    if (errorTracker && errorTracker.capturePerformanceIssue) {
      errorTracker.capturePerformanceIssue('slow-resource', {
        url: 'https://example.com/large-file.js',
        duration: 5234,
        transferSize: 1024000,
        encodedBodySize: 512000
      });
      
      errorTracker.capturePerformanceIssue('high-memory-usage', {
        usedMemoryMB: 900,
        limitMB: 1000,
        percentage: 90
      });
      
      addResult('✓ Performance issues captured');
    } else {
      addResult('⚠ Performance issue tracking not available');
    }
  };

  const testSecurityViolation = () => {
    addResult('Testing Security Violation (CSP/CORS)...');
    
    // Test CSP violation
    if (errorTracker && errorTracker.captureSecurityViolation) {
      errorTracker.captureSecurityViolation('csp', {
        violatedDirective: 'script-src',
        blockedURI: 'https://evil-script.com/malware.js',
        sourceFile: 'https://example.com/page.html',
        lineNumber: 42,
        columnNumber: 15
      });
      
      // Test CORS error
      errorTracker.captureSecurityViolation('cors', {
        url: 'https://api.external.com/data',
        origin: window.location.origin,
        error: 'Cross-Origin Request Blocked'
      });
      
      addResult('✓ Security violations captured');
    } else {
      addResult('⚠ Security violation tracking not available');
    }
  };

  const testThirdPartyError = async () => {
    addResult('Testing Third-Party Service Error...');
    
    // Simulate Firebase error
    const firebaseError = new Error('Firebase authentication failed: Invalid API key');
    firebaseError.name = 'FirebaseError';
    
    if (errorTracker) {
      errorTracker.captureError(
        firebaseError,
        {
          errorType: 'third-party',
          service: 'firebase',
          operation: 'signInWithGoogle'
        },
        'error'
      );
      addResult('✓ Third-party service error captured');
    } else {
      addResult('⚠ Error tracker not available');
    }
  };

  const testUploadError = async () => {
    addResult('Testing File Upload Error...');
    
    try {
      // Create a large fake file (simulating file too large)
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large-file.txt', {
        type: 'text/plain'
      });
      
      const formData = new FormData();
      formData.append('file', largeFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        addResult(`✓ Upload error captured (${response.status})`);
      } else {
        addResult('✓ Upload succeeded (no error to capture)');
      }
    } catch (error) {
      addResult('✓ Upload error captured in catch block');
    }
  };

  const testSSRError = () => {
    addResult('Testing SSR/Next.js Error...');
    
    // This would typically be caught by error.tsx in production
    if (errorTracker) {
      errorTracker.captureError(
        new Error('Next.js SSR Error: Failed to fetch data in getServerSideProps'),
        {
          errorType: 'ssr',
          page: '/test-page',
          phase: 'getServerSideProps'
        },
        'critical'
      );
      addResult('✓ SSR error captured');
    } else {
      addResult('⚠ Error tracker not available');
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Error Tracking Test Page
          </CardTitle>
          <CardDescription>
            Test various error scenarios to verify the error tracking system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This page intentionally triggers errors for testing. 
              Check the Admin Dashboard → Error Monitoring section to see captured errors.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Frontend Error Tests</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={testJavaScriptError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-js-error"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  JavaScript Error
                </Button>
                
                <Button
                  onClick={testPromiseRejection}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-promise"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Promise Rejection
                </Button>
                
                <Button
                  onClick={testConsoleError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-console-error"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Console Error
                </Button>
                
                <Button
                  onClick={testConsoleWarn}
                  variant="outline"
                  className="justify-start"
                  data-testid="button-test-console-warn"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Console Warning
                </Button>
                
                <Button
                  onClick={testAPIError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-api-error"
                >
                  <Server className="mr-2 h-4 w-4" />
                  API Error (404)
                </Button>
                
                <Button
                  onClick={testComponentError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-component-error"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Component Crash
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Severity Level Tests</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={testCriticalError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-critical"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Critical Error
                </Button>
                
                <Button
                  onClick={testWarning}
                  variant="secondary"
                  className="justify-start"
                  data-testid="button-test-warning"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Warning
                </Button>
                
                <Button
                  onClick={testInfo}
                  variant="outline"
                  className="justify-start"
                  data-testid="button-test-info"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Info Message
                </Button>
                
                <Button
                  onClick={testBatchErrors}
                  variant="default"
                  className="justify-start"
                  data-testid="button-test-batch"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Batch (10 errors)
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Backend & Utility</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={testBackendError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-backend"
                >
                  <Server className="mr-2 h-4 w-4" />
                  Backend Error
                </Button>
                
                <Button
                  onClick={forceFlushErrors}
                  variant="default"
                  className="justify-start"
                  data-testid="button-force-flush"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Force Flush Queue
                </Button>
                
                <Button
                  onClick={clearResults}
                  variant="outline"
                  className="justify-start"
                  data-testid="button-clear-results"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Clear Results
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">NEW: Enhanced Error Types</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={testResourceLoadError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-resource-error"
                >
                  <Image className="mr-2 h-4 w-4" />
                  Resource Load Error
                </Button>
                
                <Button
                  onClick={testWebSocketError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-websocket-error"
                >
                  <WifiOff className="mr-2 h-4 w-4" />
                  WebSocket Error
                </Button>
                
                <Button
                  onClick={testValidationError}
                  variant="secondary"
                  className="justify-start"
                  data-testid="button-test-validation-error"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Validation Error (Zod)
                </Button>
                
                <Button
                  onClick={testPerformanceIssue}
                  variant="secondary"
                  className="justify-start"
                  data-testid="button-test-performance"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Performance Issue
                </Button>
                
                <Button
                  onClick={testSecurityViolation}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-security"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Security Violation
                </Button>
                
                <Button
                  onClick={testThirdPartyError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-third-party"
                >
                  <Wifi className="mr-2 h-4 w-4" />
                  Third-Party Error
                </Button>
                
                <Button
                  onClick={testUploadError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-upload"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  File Upload Error
                </Button>
                
                <Button
                  onClick={testSSRError}
                  variant="destructive"
                  className="justify-start"
                  data-testid="button-test-ssr"
                >
                  <Server className="mr-2 h-4 w-4" />
                  SSR/Next.js Error
                </Button>
              </div>
            </div>

            {testResults.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-sm space-y-1">
                    {testResults.map((result, index) => (
                      <div key={index} data-testid={`text-result-${index}`}>
                        {result}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>How to verify:</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1">
                  <li>Click the test buttons above to trigger errors</li>
                  <li>Go to Admin Dashboard → Error Monitoring</li>
                  <li>You should see the errors appear in the error groups table</li>
                  <li>Click on an error group to see details and individual events</li>
                  <li>Try changing error statuses (resolved/solved)</li>
                  <li>Check the Analytics tab for error statistics</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}