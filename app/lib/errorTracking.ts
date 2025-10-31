// Using simple browser-compatible hash function instead of crypto-js

export interface ErrorContext {
  userId?: string;
  sessionId: string;
  route?: string;
  component?: string;
  props?: any;
  userDescription?: string;
  errorType?: 'resource' | 'websocket' | 'validation' | 'ssr' | 'third-party' | 'performance' | 'cors' | 'csp' | 'upload';
  resourceUrl?: string;
  performanceMetrics?: any;
  validationDetails?: any;
}

export interface BrowserInfo {
  name?: string;
  version?: string;
  os?: string;
  userAgent: string;
  viewport?: {
    width: number;
    height: number;
  };
  screen?: {
    width: number;
    height: number;
  };
}

export interface RequestInfo {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  responseStatus?: number;
  responseText?: string;
}

export interface ErrorEvent {
  fingerprint: string;
  message: string;
  component?: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  stackTrace?: string;
  context: ErrorContext;
  browserInfo: BrowserInfo;
  requestInfo?: RequestInfo;
  userDescription?: string;
  timestamp: number;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errorQueue: ErrorEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private maxRetries = 5;
  private baseDelay = 1000; // 1 second base delay for exponential backoff
  private sessionId: string;
  private enabled = true;
  private interceptors: Set<() => void> = new Set();
  private performanceObserver: PerformanceObserver | null = null;
  private resourceErrorHandler: ((e: Event) => void) | null = null;
  private securityPolicyHandler: ((e: SecurityPolicyViolationEvent) => void) | null = null;
  private socketErrorHandlers: Map<any, () => void> = new Map();

  private constructor() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.sessionId = this.generateSessionId();
      this.loadUnsentErrors();
      this.setupErrorHandlers();
      this.setupConsoleInterception();
      this.setupResourceErrorHandlers();
      this.setupPerformanceObserver();
      this.setupSecurityHandlers();
      this.setupZodErrorHandling();
    } else {
      // Server-side: create minimal instance
      this.sessionId = 'ssr-' + Date.now();
    }
  }

  static getInstance(): ErrorTracker | null {
    // Only create instance in browser environment
    if (typeof window === 'undefined') {
      return null;
    }
    
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(message: string, component?: string, stackTrace?: string): string {
    // Extract top 3 stack frames if available
    const stackFrames = stackTrace?.split('\n').slice(0, 4).join('\n') || '';
    
    // Create a unique fingerprint using message, component, and top stack frames
    const fingerprintData = `${message}|${component || 'unknown'}|${stackFrames}`;
    
    // Simple hash function for browser compatibility
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to hex string
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // Basic browser detection
    let browserName = 'Unknown';
    let browserVersion = '';
    
    if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
      browserVersion = userAgent.match(/Edge\/(\d+\.\d+)/)?.[1] || '';
    }
    
    // Detect OS
    let os = 'Unknown';
    if (platform.indexOf('Win') > -1) os = 'Windows';
    else if (platform.indexOf('Mac') > -1) os = 'MacOS';
    else if (platform.indexOf('Linux') > -1) os = 'Linux';
    else if (platform.indexOf('Android') > -1) os = 'Android';
    else if (platform.indexOf('iOS') > -1) os = 'iOS';
    
    return {
      name: browserName,
      version: browserVersion,
      os,
      userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
      },
    };
  }

  private getCurrentRoute(): string {
    // Try to get route from various sources
    if (typeof window !== 'undefined') {
      // Check for React Router location
      if ((window as any).__reactRouterContext) {
        return (window as any).__reactRouterContext.location.pathname;
      }
      // Fall back to window location
      return window.location.pathname;
    }
    return 'unknown';
  }

  private setupErrorHandlers(): void {
    // Handle window.onerror events
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (this.enabled) {
        this.captureError(
          error || new Error(String(message)),
          {
            component: 'window.onerror',
            source,
            lineno,
            colno,
          },
          'error'
        );
      }
      
      // Call original handler if exists
      if (originalOnError) {
        return originalOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // Handle unhandledrejection events
    window.addEventListener('unhandledrejection', (event) => {
      if (this.enabled) {
        const error = event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason));
        
        this.captureError(
          error,
          {
            component: 'unhandledrejection',
            promise: event.promise,
          },
          'error'
        );
      }
    });

    // Store cleanup function
    this.interceptors.add(() => {
      window.onerror = originalOnError;
    });
  }

  private setupConsoleInterception(): void {
    // Intercept console.error and console.warn
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      if (this.enabled) {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        // Generate stack trace
        const stackTrace = new Error().stack || '';
        
        this.captureError(
          new Error(message),
          {
            component: 'console.error',
            args,
          },
          'error'
        );
      }
      
      // Call original console.error
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (this.enabled) {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        this.captureError(
          new Error(message),
          {
            component: 'console.warn',
            args,
          },
          'warning'
        );
      }
      
      // Call original console.warn
      originalConsoleWarn.apply(console, args);
    };

    // Store cleanup functions
    this.interceptors.add(() => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    });
  }

  public captureError(
    error: Error | string,
    additionalContext?: any,
    severity: 'critical' | 'error' | 'warning' | 'info' = 'error',
    userDescription?: string
  ): void {
    try {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const message = errorObj.message || 'Unknown error';
      const stackTrace = errorObj.stack || '';
      const component = additionalContext?.component || this.extractComponentFromStack(stackTrace);
      
      const errorEvent: ErrorEvent = {
        fingerprint: this.generateFingerprint(message, component, stackTrace),
        message,
        component,
        severity,
        stackTrace,
        context: {
          sessionId: this.sessionId,
          route: this.getCurrentRoute(),
          ...additionalContext,
        },
        browserInfo: this.getBrowserInfo(),
        userDescription,
        timestamp: Date.now(),
      };

      this.queueError(errorEvent);
    } catch (e) {
      // Fail silently to prevent infinite error loops
      console.warn('ErrorTracker failed to capture error:', e);
    }
  }

  public captureAPIError(
    url: string,
    method: string,
    status: number,
    responseText?: string,
    headers?: Record<string, string>
  ): void {
    const message = `API Error: ${method} ${url} returned ${status}`;
    
    const errorEvent: ErrorEvent = {
      fingerprint: this.generateFingerprint(message, 'api', url),
      message,
      component: 'api',
      severity: status >= 500 ? 'critical' : 'error',
      stackTrace: new Error().stack,
      context: {
        sessionId: this.sessionId,
        route: this.getCurrentRoute(),
      },
      browserInfo: this.getBrowserInfo(),
      requestInfo: {
        url,
        method,
        headers,
        responseStatus: status,
        responseText,
      },
      timestamp: Date.now(),
    };

    this.queueError(errorEvent);
  }

  private extractComponentFromStack(stackTrace: string): string | undefined {
    // Try to extract React component name from stack trace
    const componentMatch = stackTrace.match(/at (\w+) \(.*\.(jsx?|tsx?):/);
    return componentMatch?.[1];
  }

  private queueError(errorEvent: ErrorEvent): void {
    this.errorQueue.push(errorEvent);
    
    // Check if we should send immediately (10 errors accumulated)
    if (this.errorQueue.length >= 10) {
      this.sendBatch();
    } else {
      // Otherwise, schedule batch sending
      this.scheduleBatch();
    }
  }

  private scheduleBatch(): void {
    if (this.batchTimer) return;
    
    // Send batch after 5 seconds
    this.batchTimer = setTimeout(() => {
      this.sendBatch();
    }, 5000);
  }

  private async sendBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.errorQueue.length === 0) return;

    const batch = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send errors one by one (API expects single error per request)
      const promises = batch.map(error => this.sendError(error));
      await Promise.allSettled(promises);
      
      // Reset retry count on successful send
      this.retryCount = 0;
      
      // Clear from localStorage
      this.clearStoredErrors();
    } catch (error) {
      // Re-queue errors for retry
      this.errorQueue = [...batch, ...this.errorQueue];
      
      // Store in localStorage for persistence
      this.storeUnsentErrors();
      
      // Implement exponential backoff
      if (this.retryCount < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, this.retryCount);
        this.retryCount++;
        
        setTimeout(() => {
          this.sendBatch();
        }, delay);
      }
    }
  }

  private async sendError(errorEvent: ErrorEvent): Promise<void> {
    const response = await fetch('/api/telemetry/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprint: errorEvent.fingerprint,
        message: errorEvent.message,
        component: errorEvent.component,
        severity: errorEvent.severity,
        stackTrace: errorEvent.stackTrace,
        context: errorEvent.context,
        browserInfo: errorEvent.browserInfo,
        requestInfo: errorEvent.requestInfo,
        userDescription: errorEvent.userDescription,
        sessionId: errorEvent.context.sessionId,
      }),
    });

    if (!response.ok && response.status !== 429) {
      throw new Error(`Failed to send error: ${response.statusText}`);
    }
  }

  private storeUnsentErrors(): void {
    try {
      localStorage.setItem('errorTracker_queue', JSON.stringify(this.errorQueue));
    } catch (e) {
      // Fail silently if localStorage is not available
    }
  }

  private loadUnsentErrors(): void {
    try {
      const stored = localStorage.getItem('errorTracker_queue');
      if (stored) {
        const errors = JSON.parse(stored);
        this.errorQueue = errors;
        localStorage.removeItem('errorTracker_queue');
        
        // Schedule sending of loaded errors
        if (this.errorQueue.length > 0) {
          this.scheduleBatch();
        }
      }
    } catch (e) {
      // Fail silently if localStorage is not available
    }
  }

  private clearStoredErrors(): void {
    try {
      localStorage.removeItem('errorTracker_queue');
    } catch (e) {
      // Fail silently
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getUserId(): string | undefined {
    // This would be set by the app when user logs in
    return (window as any).__errorTrackerUserId;
  }

  public setUserId(userId: string | undefined): void {
    (window as any).__errorTrackerUserId = userId;
  }

  public addUserDescription(description: string): void {
    // Add description to the most recent error
    if (this.errorQueue.length > 0) {
      this.errorQueue[this.errorQueue.length - 1].userDescription = description;
    }
  }

  public forceFlush(): Promise<void> {
    return this.sendBatch();
  }

  public cleanup(): void {
    // Clean up all interceptors
    this.interceptors.forEach(cleanup => cleanup());
    this.interceptors.clear();
    
    // Clean up performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    // Clean up resource error handler
    if (this.resourceErrorHandler) {
      window.removeEventListener('error', this.resourceErrorHandler, true);
      this.resourceErrorHandler = null;
    }
    
    // Clean up security policy handler
    if (this.securityPolicyHandler) {
      window.removeEventListener('securitypolicyviolation', this.securityPolicyHandler);
      this.securityPolicyHandler = null;
    }
    
    // Clear socket error handlers
    this.socketErrorHandlers.clear();
    
    // Clear timers
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Send remaining errors
    this.forceFlush();
  }

  // Method to integrate with fetch API
  public wrapFetch(originalFetch: typeof fetch): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';
      
      try {
        const response = await originalFetch(input, init);
        
        // Capture API errors
        if (!response.ok && response.status >= 400) {
          const responseText = await response.text();
          this.captureAPIError(
            url,
            method,
            response.status,
            responseText,
            Object.fromEntries(response.headers.entries())
          );
          
          // Return a new response with the same text
          return new Response(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
        
        return response;
      } catch (error) {
        // Capture network errors
        this.captureError(
          error as Error,
          {
            component: 'fetch',
            url,
            method,
          },
          'critical'
        );
        throw error;
      }
    };
  }

  // New method: Setup Resource Error Handlers
  private setupResourceErrorHandlers(): void {
    this.resourceErrorHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target instanceof HTMLImageElement || 
          target instanceof HTMLScriptElement || 
          target instanceof HTMLLinkElement) {
        
        const resourceUrl = 
          (target as HTMLImageElement).src || 
          (target as HTMLScriptElement).src || 
          (target as HTMLLinkElement).href;
        
        const resourceType = target.tagName.toLowerCase();
        
        this.captureResourceError(resourceUrl, resourceType, {
          element: target.tagName,
          id: target.id,
          className: target.className,
        });
      }
    };
    
    // Capture resource loading errors (images, scripts, stylesheets)
    window.addEventListener('error', this.resourceErrorHandler, true);
  }

  // New method: Setup Performance Observer
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      // Observe long tasks (>50ms)
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask' && entry.duration > 100) {
            this.capturePerformanceIssue('long-task', {
              duration: entry.duration,
              name: entry.name,
              startTime: entry.startTime,
            });
          }
          
          // Resource timing
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.duration > 3000) { // Resources taking > 3 seconds
              this.capturePerformanceIssue('slow-resource', {
                url: resourceEntry.name,
                duration: resourceEntry.duration,
                transferSize: resourceEntry.transferSize,
                encodedBodySize: resourceEntry.encodedBodySize,
              });
            }
          }
          
          // Navigation timing for slow page loads
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            if (navEntry.loadEventEnd - navEntry.fetchStart > 5000) { // Page load > 5 seconds
              this.capturePerformanceIssue('slow-page-load', {
                loadTime: navEntry.loadEventEnd - navEntry.fetchStart,
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                domInteractive: navEntry.domInteractive - navEntry.fetchStart,
              });
            }
          }
        }
      });
      
      // Observe different performance metrics
      if (this.performanceObserver.observe) {
        // Observe long tasks
        try { this.performanceObserver.observe({ entryTypes: ['longtask'] }); } catch (e) {}
        // Observe resource timing
        try { this.performanceObserver.observe({ entryTypes: ['resource'] }); } catch (e) {}
        // Observe navigation timing
        try { this.performanceObserver.observe({ entryTypes: ['navigation'] }); } catch (e) {}
      }
      
      // Monitor memory usage if available
      if ((performance as any).memory) {
        setInterval(() => {
          const memory = (performance as any).memory;
          const usedMemoryMB = memory.usedJSHeapSize / (1024 * 1024);
          const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
          
          // Alert if using > 90% of available memory
          if (usedMemoryMB / limitMB > 0.9) {
            this.capturePerformanceIssue('high-memory-usage', {
              usedMemoryMB: Math.round(usedMemoryMB),
              limitMB: Math.round(limitMB),
              percentage: Math.round((usedMemoryMB / limitMB) * 100),
            });
          }
        }, 30000); // Check every 30 seconds
      }
    } catch (error) {
      console.warn('Failed to setup performance observer:', error);
    }
  }

  // New method: Setup Security Handlers (CORS & CSP)
  private setupSecurityHandlers(): void {
    // Content Security Policy violations
    this.securityPolicyHandler = (event: SecurityPolicyViolationEvent) => {
      this.captureSecurityViolation('csp', {
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
      });
    };
    
    window.addEventListener('securitypolicyviolation', this.securityPolicyHandler);
  }

  // New method: Setup Zod Error Handling
  private setupZodErrorHandling(): void {
    // This will be called by the application when using Zod
    (window as any).__captureZodError = (error: any, schema: string) => {
      this.captureValidationError(error, schema);
    };
  }

  // New method: Capture Resource Error
  public captureResourceError(url: string, resourceType: string, details?: any): void {
    const message = `Failed to load ${resourceType}: ${url}`;
    
    this.captureError(
      new Error(message),
      {
        component: 'resource-loader',
        errorType: 'resource',
        resourceUrl: url,
        resourceType,
        ...details,
      },
      'error'
    );
  }

  // New method: Capture WebSocket Error
  public captureWebSocketError(error: any, details?: any): void {
    const message = error?.message || 'WebSocket connection error';
    
    this.captureError(
      error instanceof Error ? error : new Error(message),
      {
        component: 'websocket',
        errorType: 'websocket',
        ...details,
      },
      details?.reconnecting ? 'warning' : 'error'
    );
  }

  // New method: Capture Validation Error
  public captureValidationError(error: any, schema: string, details?: any): void {
    let message = 'Validation error';
    let validationDetails: any = {};
    
    // Handle Zod errors
    if (error?.issues) {
      const issues = error.issues.map((issue: any) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      message = `Validation failed in ${schema}: ${issues.map((i: any) => i.message).join(', ')}`;
      validationDetails = { issues, schema };
    } else if (error?.message) {
      message = error.message;
      validationDetails = { schema, error: error.toString() };
    }
    
    this.captureError(
      error instanceof Error ? error : new Error(message),
      {
        component: 'validation',
        errorType: 'validation',
        validationDetails,
        ...details,
      },
      'warning'
    );
  }

  // New method: Capture Performance Issue
  public capturePerformanceIssue(issueType: string, metrics: any): void {
    const message = `Performance issue detected: ${issueType}`;
    
    this.captureError(
      new Error(message),
      {
        component: 'performance',
        errorType: 'performance',
        issueType,
        performanceMetrics: metrics,
      },
      'warning'
    );
  }

  // New method: Capture Security Violation
  public captureSecurityViolation(violationType: string, details: any): void {
    const message = violationType === 'csp' 
      ? `CSP violation: ${details.violatedDirective}`
      : `Security violation: ${violationType}`;
    
    this.captureError(
      new Error(message),
      {
        component: 'security',
        errorType: violationType === 'csp' ? 'csp' : 'cors',
        violationType,
        ...details,
      },
      'error'
    );
  }

  // New method: Hook into Socket.io errors
  public hookSocketErrors(socket: any): void {
    if (!socket || this.socketErrorHandlers.has(socket)) return;
    
    const errorHandler = () => {
      // Socket.io error events
      socket.on('connect_error', (error: any) => {
        this.captureWebSocketError(error, {
          event: 'connect_error',
          socketId: socket.id,
          reconnecting: socket.reconnecting,
        });
      });
      
      socket.on('connect_timeout', () => {
        this.captureWebSocketError(new Error('Socket connection timeout'), {
          event: 'connect_timeout',
          socketId: socket.id,
        });
      });
      
      socket.on('error', (error: any) => {
        this.captureWebSocketError(error, {
          event: 'error',
          socketId: socket.id,
        });
      });
      
      socket.on('reconnect_error', (error: any) => {
        this.captureWebSocketError(error, {
          event: 'reconnect_error',
          socketId: socket.id,
          reconnecting: true,
        });
      });
      
      socket.on('reconnect_failed', () => {
        this.captureWebSocketError(new Error('Socket reconnection failed'), {
          event: 'reconnect_failed',
          socketId: socket.id,
          severity: 'critical',
        });
      });
    };
    
    errorHandler();
    this.socketErrorHandlers.set(socket, errorHandler);
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  const tracker = ErrorTracker.getInstance();
  
  // Wrap global fetch
  const originalFetch = window.fetch;
  window.fetch = tracker.wrapFetch(originalFetch);
}

export default ErrorTracker;