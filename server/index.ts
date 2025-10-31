import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { generalApiLimiter } from "./rateLimiting";
import { storage } from "./storage";
import { startBackgroundJobs } from "./jobs/backgroundJobs";
import { setupSecurityHeaders } from "./middleware/securityHeaders";
import { categoryRedirectMiddleware, trackCategoryViews } from "./middleware/categoryRedirects";
import { initializeDashboardWebSocket } from "./services/dashboardWebSocket";

const app = express();

// Trust first proxy - required for correct rate limiting behind load balancers/proxies
app.set("trust proxy", 1);

// Apply security headers to all requests (before CORS)
setupSecurityHeaders(app);

// Apply category redirect middleware early in the stack
app.use(categoryRedirectMiddleware);
app.use(trackCategoryViews);

// Body parsing middleware MUST come before session middleware
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

// Configure CORS for cross-origin requests with credentials
// CORS must come AFTER body parsing but can be before or after sessions
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (e.g., mobile apps, Postman, same-origin)
    if (!origin) return callback(null, true);
    
    // In development, be more permissive with origins
    if (process.env.NODE_ENV !== "production") {
      const allowedPatterns = [
        /^https?:\/\/localhost:\d+$/,        // Any localhost port
        /^https?:\/\/127\.0\.0\.1:\d+$/,     // Any 127.0.0.1 port
        /^https?:\/\/0\.0\.0\.0:\d+$/,       // Any 0.0.0.0 port
        /^https?:\/\/.*\.replit\.dev$/,      // Any Replit dev domain (multi-level)
        /^https?:\/\/.*\.repl\.co$/,         // Any Replit co domain (multi-level)
        /^https?:\/\/.*\.replit\.app$/,      // Any Replit app domain (multi-level)
        /^https?:\/\/.*\.repl\.run$/,        // Any Replit run domain (multi-level)
      ];
      
      // Check if origin matches any pattern
      const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
      
      if (isAllowed) {
        return callback(null, true);
      }
      
      // Log for debugging CORS issues
      console.log('CORS: Origin not allowed in development:', origin);
    }
    
    // In production, use environment variable or allow common domains
    const allowedProductionOrigins = [
      'https://yoforex.net',
      'https://www.yoforex.net',
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];
    
    if (allowedProductionOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For production Replit domains (multi-level subdomains)
    if (/^https?:\/\/.*\.replit\.app$/.test(origin)) {
      return callback(null, true);
    }
    
    // Log and deny
    console.log('CORS: Origin not allowed:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // Cache preflight requests for 24 hours
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

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

// Initialize the server with proper async handling
async function initializeServer() {
  try {
    // Session middleware MUST be set up BEFORE routes
    // Import and setup authentication middleware first
    const { setupAuth } = await import('./flexibleAuth');
    await setupAuth(app);
    
    // Setup local authentication (includes password reset endpoints)
    const { setupLocalAuth } = await import('./localAuth');
    await setupLocalAuth(app);
    
    const expressApp = await registerRoutes(app);
    
    // Add error handling middleware AFTER routes
    expressApp.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // React SPA removed - Next.js runs separately on port 3000
    // Express server now only serves API endpoints
    log("Express server running API-only mode (React SPA archived)");

    // Create HTTP server and initialize WebSocket
    const httpServer = createServer(expressApp);
    const io = initializeDashboardWebSocket(httpServer);
    log("WebSocket server initialized on /ws/dashboard");

    // Express API server runs on port 3001 (internal)
    // Next.js frontend runs on port 5000 (user-facing, required by Replit)
    const port = parseInt(process.env.API_PORT || '3001', 10);
    
    // Start the server only after all setup is complete
    httpServer.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port} with WebSocket support`);
      
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

    return httpServer;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start the server with proper error handling
initializeServer().catch((error) => {
  console.error('Fatal server initialization error:', error);
  process.exit(1);
});
