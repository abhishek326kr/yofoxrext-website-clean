import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { storage } from '../storage';

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

  public async captureError(
    error: Error | string,
    context: ServerErrorContext,
    severity: 'critical' | 'error' | 'warning' | 'info' = 'error'
  ): Promise<void> {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const message = errorObj.message || 'Unknown server error';
    
    const fingerprint = this.generateFingerprint(message, context);
    
    // Log to console for debugging
    console.error(`[Server Error] ${severity.toUpperCase()}: ${message}`, {
      fingerprint: fingerprint,
      context: context,
    });
    
    // Save to database
    try {
      await storage.createErrorEvent({
        fingerprint,
        message,
        component: `backend:${context.method}:${context.path}`,
        severity,
        userId: context.userId,
        sessionId: context.requestId, // Using requestId as sessionId
        stackTrace: errorObj.stack,
        context: {
          errorType: context.errorType,
          serviceName: context.serviceName,
          timestamp: new Date().toISOString(),
        },
        browserInfo: context.userAgent ? {
          userAgent: context.userAgent,
        } : undefined,
        requestInfo: {
          method: context.method,
          path: context.path,
          query: context.query,
          body: context.body,
          headers: context.headers,
          ip: context.ip,
        },
        userDescription: undefined, // Not applicable for backend errors
      });
    } catch (dbError) {
      // Log the database save error but don't crash
      console.error('[Error Tracking] Failed to save error to database:', {
        originalError: message,
        dbError: dbError instanceof Error ? dbError.message : String(dbError),
        fingerprint,
      });
    }
  }

  public async captureValidationError(error: z.ZodError, schema: string, req: Request): Promise<void> {
    const issues = error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    
    const message = `Validation failed in ${schema}: ${issues.map(i => i.message).join(', ')}`;
    
    await this.captureError(
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

  public async captureThirdPartyError(error: Error, serviceName: string, req?: Request): Promise<void> {
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

    await this.captureError(
      error,
      context,
      serviceName.includes('email') || serviceName.includes('firebase') ? 'error' : 'warning'
    );
  }

  public async captureUploadError(error: Error, req: Request, fileInfo?: any): Promise<void> {
    await this.captureError(
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

}

// Middleware to capture errors
export const errorTrackingMiddleware = async (err: any, req: Request, res: Response, next: NextFunction) => {
  const tracker = ServerErrorTracker.getInstance();
  
  try {
    // Determine error type and capture accordingly
    if (err.name === 'ZodError') {
      await tracker.captureValidationError(err, req.path, req);
    } else if (err.name === 'MulterError') {
      await tracker.captureUploadError(err, req);
    } else {
      // General server error
      await tracker.captureError(
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
  } catch (trackingError) {
    // If error tracking itself fails, log it but continue
    console.error('[Error Tracking Middleware] Failed to track error:', trackingError);
  }
  
  next(err);
};

// Wrapper for Zod parse operations
export async function safeZodParse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  schemaName: string,
  req?: Request
): Promise<{ success: true; data: T } | { success: false; error: z.ZodError }> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const tracker = ServerErrorTracker.getInstance();
      try {
        if (req) {
          await tracker.captureValidationError(error, schemaName, req);
        } else {
          // Capture without request context
          await tracker.captureError(
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
      } catch (trackingError) {
        // If error tracking fails, log it but continue
        console.error('[safeZodParse] Failed to track validation error:', trackingError);
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
    try {
      await tracker.captureThirdPartyError(error as Error, serviceName, req);
    } catch (trackingError) {
      // If error tracking fails, log it but continue
      console.error('[safeServiceCall] Failed to track third-party error:', trackingError);
    }
    throw error;
  }
}

// Export the singleton instance
export const serverErrorTracker = ServerErrorTracker.getInstance();

// Helper to wrap Multer middleware
export function wrapMulterMiddleware(multerMiddleware: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, async (err: any) => {
      if (err) {
        const tracker = ServerErrorTracker.getInstance();
        try {
          await tracker.captureUploadError(err, req);
        } catch (trackingError) {
          // If error tracking fails, log it but continue
          console.error('[wrapMulterMiddleware] Failed to track upload error:', trackingError);
        }
      }
      next(err);
    });
  };
}