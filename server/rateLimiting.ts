import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Rate Limiting Configuration
 * 
 * Protects API endpoints from abuse and spam attacks by limiting
 * the number of requests per IP address within a time window.
 */

/**
 * General API rate limiter - applies to all API endpoints
 * 500 requests per 15 minutes per IP
 * Increased limit for better development experience and normal user browsing
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window (increased from 100 for better UX)
  message: {
    error: "Too many requests, please try again later",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many requests from this IP, please try again later",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Stricter rate limiter for write operations (POST, PUT, PATCH, DELETE)
 * 30 requests per 15 minutes per IP
 */
export const writeOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: {
    error: "Too many write operations, please slow down",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many write operations from this IP, please slow down",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Very strict rate limiter for coin-related operations
 * 10 requests per 15 minutes per IP
 */
export const coinOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    error: "Too many coin operations, please wait before trying again",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many coin operations from this IP, please wait before trying again",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Authentication rate limiter (for future auth endpoints)
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: "Too many authentication attempts, please try again later",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many authentication attempts from this IP, please try again later",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Content creation rate limiter
 * 5 posts per hour per IP
 */
export const contentCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per window
  message: {
    error: "Too many content submissions, please wait before posting again",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "You can only create 5 posts per hour. Please wait before posting again",
      retryAfter: "1 hour",
    });
  },
});

/**
 * Review/Reply rate limiter
 * 20 reviews/replies per hour per IP
 */
export const reviewReplyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per window
  message: {
    error: "Too many reviews/replies, please slow down",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "You can only post 20 reviews/replies per hour. Please slow down",
      retryAfter: "1 hour",
    });
  },
});

/**
 * Admin operations rate limiter
 * 200 requests per hour per admin user
 * More lenient than regular operations for admins who need to perform bulk actions
 */
export const adminOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // 200 requests per window
  message: {
    error: "Too many admin operations, please slow down",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many admin operations. Please slow down",
      retryAfter: "1 hour",
    });
  },
});

/**
 * Activity tracking rate limiter
 * 1 request per minute to prevent coin farming abuse
 * This prevents rapid-fire requests from malicious scripts
 */
export const activityTrackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 request per minute
  message: {
    error: "Activity tracking is rate limited. Please wait before sending another heartbeat.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many activity tracking requests. Please wait 1 minute between heartbeats.",
      retryAfter: "1 minute",
    });
  },
});
