import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';

// Server-side error context
export interface ServerErrorContext {
  userId?: string;
  requestId: string;
  method: string;
  path: string;
  query?: any;
  body?: any;
  headers?: Record<string, string>;
  ip?: string;
  userAgent?: string;
  errorType?: 'validation' | 'third-party' | 'upload' | 'database' | 'internal';
  serviceName?: string;
}

// Server error event
export interface ServerErrorEvent {
  fingerprint: string;
  message: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  stackTrace?: string;
  context: ServerErrorContext;
  timestamp: number;
}

class ServerErrorTracker {
  private static instance: ServerErrorTracker;
  private errorQueue: ServerErrorEvent[] = [];

  static getInstance(): ServerErrorTracker {
    if (!ServerErrorTracker.instance) {
      ServerErrorTracker.instance = new ServerErrorTracker();
    }
    return ServerErrorTracker.instance;
  }

  private generateFingerprint(message: string, context: ServerErrorContext): string {
    const fingerprintData = `${message}|${context.method}|${context.path}|${context.errorType}`;
    return crypto.createHash('sha256').update(fingerprintData).digest('hex').substring(0, 16);
  }

  public captureError(
    error: Error | string,
    context: ServerErrorContext,
    severity: 'critical' | 'error' | 'warning' | 'info' = 'error'
  ): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const message = errorObj.message || 'Unknown server error';
    
    const errorEvent: ServerErrorEvent = {
      fingerprint: this.generateFingerprint(message, context),
      message,
      severity,
      stackTrace: errorObj.stack,
      context,
      timestamp: Date.now(),
    };

    this.errorQueue.push(errorEvent);
    
    // Log to console for debugging
    console.error(`[Server Error] ${severity.toUpperCase()}: ${message}`, {
      fingerprint: errorEvent.fingerprint,
      context: context,
    });
    
    // TODO: Send to error storage/monitoring service
    // For now, just maintain in-memory queue
    if (this.errorQueue.length > 100) {
      this.errorQueue.shift(); // Remove oldest error
    }
  }

  public captureValidationError(error: z.ZodError, schema: string, req: Request): void {
    const issues = error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    
    const message = `Validation failed in ${schema}: ${issues.map(i => i.message).join(', ')}`;
    
    this.captureError(
      new Error(message),
      {
        requestId: (req as any).requestId || crypto.randomUUID(),
        method: req.method,
        path: req.path,
        body: req.body,
        errorType: 'validation',
        serviceName: schema,
        userId: (req as any).user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
      'warning'
    );
  }

  public captureThirdPartyError(error: Error, serviceName: string, req?: Request): void {
    const context: ServerErrorContext = {
      requestId: crypto.randomUUID(),
      method: req?.method || 'INTERNAL',
      path: req?.path || 'unknown',
      errorType: 'third-party',
      serviceName,
      userId: req ? (req as any).user?.id : undefined,
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
    };

    this.captureError(
      error,
      context,
      serviceName.includes('email') || serviceName.includes('firebase') ? 'error' : 'warning'
    );
  }

  public captureUploadError(error: Error, req: Request, fileInfo?: any): void {
    this.captureError(
      error,
      {
        requestId: (req as any).requestId || crypto.randomUUID(),
        method: req.method,
        path: req.path,
        body: fileInfo || { files: (req as any).files },
        errorType: 'upload',
        serviceName: 'multer',
        userId: (req as any).user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
      'error'
    );
  }

  public getErrors(): ServerErrorEvent[] {
    return [...this.errorQueue];
  }

  public clearErrors(): void {
    this.errorQueue = [];
  }
}

// Middleware to capture errors
export const errorTrackingMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const tracker = ServerErrorTracker.getInstance();
  
  // Determine error type and capture accordingly
  if (err.name === 'ZodError') {
    tracker.captureValidationError(err, req.path, req);
  } else if (err.name === 'MulterError') {
    tracker.captureUploadError(err, req);
  } else {
    // General server error
    tracker.captureError(
      err,
      {
        requestId: (req as any).requestId || crypto.randomUUID(),
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        errorType: 'internal',
        userId: (req as any).user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
      err.status >= 500 ? 'critical' : 'error'
    );
  }
  
  next(err);
};

// Wrapper for Zod parse operations
export function safeZodParse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  schemaName: string,
  req?: Request
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const tracker = ServerErrorTracker.getInstance();
      if (req) {
        tracker.captureValidationError(error, schemaName, req);
      } else {
        // Capture without request context
        tracker.captureError(
          new Error(`Validation failed in ${schemaName}: ${error.message}`),
          {
            requestId: crypto.randomUUID(),
            method: 'INTERNAL',
            path: 'unknown',
            errorType: 'validation',
            serviceName: schemaName,
          },
          'warning'
        );
      }
      return { success: false, error };
    }
    throw error;
  }
}

// Wrapper for third-party service calls
export async function safeServiceCall<T>(
  serviceName: string,
  operation: () => Promise<T>,
  req?: Request
): Promise<T> {
  const tracker = ServerErrorTracker.getInstance();
  
  try {
    return await operation();
  } catch (error) {
    tracker.captureThirdPartyError(error as Error, serviceName, req);
    throw error;
  }
}

// Export the singleton instance
export const serverErrorTracker = ServerErrorTracker.getInstance();

// Helper to wrap Multer middleware
export function wrapMulterMiddleware(multerMiddleware: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, (err: any) => {
      if (err) {
        const tracker = ServerErrorTracker.getInstance();
        tracker.captureUploadError(err, req);
      }
      next(err);
    });
  };
}