import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import passport from "passport";

// Session configuration for email/password and Google OAuth
export function getSession() {
  const sessionTtl = parseInt(process.env.SESSION_TTL || String(7 * 24 * 60 * 60 * 1000)); // Default 1 week
  const pgStore = connectPg(session);
  
  // Use standard PostgreSQL session store configuration
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
    pruneSessionInterval: false, // Disable automatic pruning for compatibility
  });
  
  // Determine if we should use secure cookies based on environment
  const isProduction = process.env.NODE_ENV === "production";
  const forceSecureCookies = process.env.FORCE_SECURE_COOKIES === "true";
  const isHTTPS = process.env.USE_HTTPS === "true" || process.env.SSL_ENABLED === "true";
  
  // In development, we need secure: true for sameSite: "none" to work
  // In production, use secure cookies based on HTTPS
  const secureCookies = forceSecureCookies || (isProduction && isHTTPS) || !isProduction;
  
  // For cross-origin requests (Next.js on 5000, Express on 3001), we need sameSite: "none"
  // In production with a single domain, we can use "lax" for better security
  const sameSiteValue = isProduction && !process.env.CROSS_ORIGIN_COOKIES ? "lax" : "none";
  
  console.log(`🍪 Cookie config: secure=${secureCookies}, sameSite=${sameSiteValue}, httpOnly=true`);
  
  return session({
    secret: process.env.SESSION_SECRET || generateDefaultSecret(),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: secureCookies, // Must be true when sameSite is "none"
      maxAge: sessionTtl,
      sameSite: sameSiteValue as any, // "none" allows cross-origin cookies
      domain: process.env.COOKIE_DOMAIN || undefined, // Allow setting a specific domain if needed
      path: "/", // Make cookie available for all paths
    },
    name: "yoforex.sid",
  });
}

// Generate a default secret for development (warning logged)
function generateDefaultSecret(): string {
  const defaultSecret = "default-dev-secret-change-in-production";
  console.warn("⚠️  WARNING: Using default session secret. Set SESSION_SECRET env var in production!");
  return defaultSecret;
}

// Main authentication setup - email/password and Google OAuth only
export async function setupAuth(app: Express) {
  console.log(`🔐 Setting up authentication system with email/password and Google OAuth`);
  
  // Setup session and passport
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Setup email/password authentication
  const { setupEmailAuth } = await import("./auth.js");
  setupEmailAuth();
  
  console.log(`✅ Authentication setup complete`);
}

// Standard authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Check session expiry
  const user = req.user as any;
  if (user.sessionExpiry && new Date() > new Date(user.sessionExpiry)) {
    req.logout(() => {});
    return res.status(401).json({ error: "Session expired" });
  }
  
  next();
};

// Optional authentication middleware (doesn't fail if not authenticated)
export const optionalAuth: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  next();
};

// Helper to get current user from request
export function getCurrentUser(req: Request): any | null {
  if (!req.isAuthenticated()) {
    return null;
  }
  
  return req.user || null;
}

// Helper to get user ID from request
export function getUserId(req: Request): string | null {
  const user = getCurrentUser(req);
  
  if (!user) {
    return null;
  }
  
  return user.id || null;
}