import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import passport from "passport";
import { storage } from "./storage";

// Determine authentication type from environment
export function getAuthType(): "replit" | "local" | "disabled" {
  const authType = process.env.AUTH_TYPE?.toLowerCase();
  
  // If explicitly set, use that
  if (authType === "replit" || authType === "local" || authType === "disabled") {
    return authType;
  }
  
  // Auto-detect based on environment
  if (process.env.REPLIT_DOMAINS) {
    return "replit";
  }
  
  // Default to local auth for non-Replit environments
  return "local";
}

// Session configuration that works for all environments
export function getSession() {
  const sessionTtl = parseInt(process.env.SESSION_TTL || String(7 * 24 * 60 * 60 * 1000)); // Default 1 week
  const pgStore = connectPg(session);
  
  // Use standard PostgreSQL session store configuration
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
    // Don't use Neon-specific features
    pruneSessionInterval: false, // Disable automatic pruning for compatibility
  });
  
  // Determine if we should use secure cookies based on environment
  const isProduction = process.env.NODE_ENV === "production";
  const forceSecureCookies = process.env.FORCE_SECURE_COOKIES === "true";
  const isHTTPS = process.env.USE_HTTPS === "true" || process.env.SSL_ENABLED === "true";
  
  // Only use secure cookies if:
  // 1. Explicitly forced via env var, OR
  // 2. In production AND using HTTPS, OR  
  // 3. On Replit (always HTTPS)
  const secureCookies = forceSecureCookies || (isProduction && isHTTPS) || !!process.env.REPLIT_DOMAINS;
  
  return session({
    secret: process.env.SESSION_SECRET || generateDefaultSecret(),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: secureCookies,
      maxAge: sessionTtl,
      sameSite: secureCookies ? "lax" : "lax", // Use lax for better compatibility
    },
    name: "yoforex.sid", // Custom session name to avoid conflicts
  });
}

// Generate a default secret for development (warning logged)
function generateDefaultSecret(): string {
  const defaultSecret = "default-dev-secret-change-in-production";
  console.warn("⚠️  WARNING: Using default session secret. Set SESSION_SECRET env var in production!");
  return defaultSecret;
}

// Main authentication setup
export async function setupAuth(app: Express) {
  const authType = getAuthType();
  
  console.log(`🔐 Setting up authentication: ${authType.toUpperCase()}`);
  
  // Always setup session and passport
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Setup serialization (same for all auth types)
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
  
  switch (authType) {
    case "replit":
      const { setupReplitAuth } = await import("./replitAuth");
      await setupReplitAuth(app);
      break;
      
    case "local":
      const { setupLocalAuth } = await import("./localAuth");
      await setupLocalAuth(app);
      break;
      
    case "disabled":
      console.warn("⚠️  Authentication is DISABLED - all requests will be unauthenticated");
      setupDisabledAuth(app);
      break;
      
    default:
      throw new Error(`Unknown auth type: ${authType}`);
  }
  
  console.log(`✅ Authentication setup complete (${authType})`);
}

// Setup routes for disabled authentication (development/testing only)
function setupDisabledAuth(app: Express) {
  app.get("/api/login", (req, res) => {
    res.status(503).json({ 
      error: "Authentication is disabled",
      message: "Set AUTH_TYPE environment variable to 'local' or 'replit'" 
    });
  });
  
  app.post("/api/logout", (req, res) => {
    res.json({ message: "Authentication is disabled" });
  });
  
  app.get("/api/callback", (req, res) => {
    res.status(503).json({ error: "Authentication is disabled" });
  });
}

// Flexible authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authType = getAuthType();
  
  // If auth is disabled, reject all authenticated requests
  if (authType === "disabled") {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Authentication is currently disabled. Enable it by setting AUTH_TYPE." 
    });
  }
  
  // For Replit auth, use the original flow with token refresh
  if (authType === "replit") {
    const { isAuthenticatedReplit } = await import("./replitAuth");
    return isAuthenticatedReplit(req, res, next);
  }
  
  // For local auth, use standard passport authentication check
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Check session expiry for local auth
  const user = req.user as any;
  if (user.sessionExpiry && new Date() > new Date(user.sessionExpiry)) {
    req.logout(() => {});
    return res.status(401).json({ error: "Session expired" });
  }
  
  next();
};

// Optional authentication middleware (doesn't fail if not authenticated)
export const optionalAuth: RequestHandler = async (req, res, next) => {
  const authType = getAuthType();
  
  if (authType === "disabled" || !req.isAuthenticated()) {
    // Continue without authentication
    return next();
  }
  
  // Try to authenticate but don't fail if it doesn't work
  if (authType === "replit") {
    const { isAuthenticatedReplit } = await import("./replitAuth");
    isAuthenticatedReplit(req, res, () => next());
  } else {
    next();
  }
};

// Helper to get current user from request
export function getCurrentUser(req: Request): any | null {
  if (!req.isAuthenticated()) {
    return null;
  }
  
  const authType = getAuthType();
  const user = req.user as any;
  
  if (authType === "replit") {
    return user?.claims || null;
  }
  
  return user || null;
}

// Helper to get user ID from request
export function getUserId(req: Request): string | null {
  const user = getCurrentUser(req);
  
  if (!user) {
    return null;
  }
  
  // For Replit auth, ID is in claims.sub
  if (user.sub) {
    return user.sub;
  }
  
  // For local auth, ID is directly on user object
  return user.id || null;
}