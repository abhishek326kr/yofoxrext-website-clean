import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { generalApiLimiter } from "./rateLimiting";
import { storage } from "./storage";
import { startBackgroundJobs } from "./jobs/backgroundJobs";
import { setupSecurityHeaders } from "./middleware/securityHeaders";
import { categoryRedirectMiddleware, trackCategoryViews } from "./middleware/categoryRedirects";

const app = express();

// Trust first proxy - required for correct rate limiting behind load balancers/proxies
app.set("trust proxy", 1);

// Apply security headers to all requests
setupSecurityHeaders(app);

// Apply category redirect middleware early in the stack
app.use(categoryRedirectMiddleware);
app.use(trackCategoryViews);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Apply general rate limiting to all API routes
app.use("/api/", generalApiLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // React SPA removed - Next.js runs separately on port 3000
  // Express server now only serves API endpoints
  log("Express server running API-only mode (React SPA archived)");

  // Express API server runs on port 3001 (internal)
  // Next.js frontend runs on port 5000 (user-facing, required by Replit)
  const port = parseInt(process.env.API_PORT || '3001', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Defer background jobs if needed for health checks
    if (process.env.DEFER_BACKGROUND_JOBS === 'true') {
      log('Deferring background jobs for 5 seconds to allow health checks to pass...');
      setTimeout(() => {
        log('Starting background jobs after deferment period');
        startBackgroundJobs(storage);
      }, 5000); // Start after 5 seconds
    } else {
      // Start background jobs immediately
      startBackgroundJobs(storage);
    }
  });
})();
