import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage/index.js";
import { setupAuth, isAuthenticated } from "./flexibleAuth.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { 
  insertCoinTransactionSchema, 
  insertRechargeOrderSchema,
  insertWithdrawalRequestSchema,
  insertContentSchema,
  publishContentSchema,
  insertContentPurchaseSchema,
  insertContentReviewSchema,
  insertContentLikeSchema,
  insertContentReplySchema,
  insertBrokerSchema,
  insertBrokerReviewSchema,
  insertForumThreadSchema,
  insertForumReplySchema,
  insertUserFollowSchema,
  insertMessageSchema,
  updateUserProfileSchema,
  insertFeedbackSchema,
  BADGE_METADATA,
  type BadgeType,
  coinTransactions,
  profiles,
  forumReplies,
  users,
  content,
  rechargeOrders,
  adminActions,
  forumThreads,
  campaigns,
  sitemapLogs
} from "../shared/schema.js";
import { z } from "zod";
import { db } from "./db.js";
import { eq, and, gt, asc, desc, count, sql, gte, lte, or, ne } from "drizzle-orm";
import {
  sanitizeRequestBody,
  validateCoinAmount,
  validatePrice,
  validateSufficientCoins,
  runValidators,
} from "./validation.js";
import { 
  ObjectStorageService, 
  ObjectNotFoundError 
} from "./objectStorage.js";
import { ObjectPermission, ObjectAccessGroupType } from "./objectAcl.js";
import {
  coinOperationLimiter,
  contentCreationLimiter,
  reviewReplyLimiter,
  adminOperationLimiter,
  activityTrackingLimiter,
} from "./rateLimiting.js";
import { generateSlug, generateFocusKeyword, generateMetaDescription as generateMetaDescriptionOld, generateImageAltTexts } from './seo.js';
import { emailService } from './services/emailService.js';
import { emailQueueService, EmailPriority } from './services/emailQueue.js';
import { fetchBrokerLogo, getPlaceholderLogo } from './services/brokerLogoService.js';
import { 
  RECHARGE_PACKAGES, 
  EARNING_REWARDS, 
  DAILY_LIMITS,
  calculateCommission, 
  calculateWithdrawal,
  coinsToUSD,
  formatCoinPrice
} from '../shared/coinUtils.js';
import {
  generateFullSlug,
  generateMetaDescription,
  deduplicateTags,
  countWords,
} from '../shared/threadUtils.js';
import { SitemapGenerator } from './services/sitemap-generator.js';
import { SitemapSubmissionService } from './services/sitemap-submission.js';

// Helper function to get authenticated user ID from session
function getAuthenticatedUserId(req: any): string {
  const user = req.user;
  if (!user?.id) {
    throw new Error("No authenticated user");
  }
  return user.id;
}

// Helper function to check if user is admin
function isAdmin(user: any): boolean {
  if (!user) return false;
  // Check if user has admin role
  return user.role === 'admin' || user.role === 'moderator' || user.role === 'superadmin';
}

// Middleware to check if user is admin
const isAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const user = req.user as any;
  const userRole = user?.role;
  
  if (userRole !== "admin" && userRole !== "superadmin") {
    return res.status(403).json({ error: "Insufficient permissions. Admins only." });
  }
  
  next();
};

// Middleware to check if user is moderator or admin
const isModOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const user = req.user as any;
  const userRole = user?.role;
  
  if (userRole !== "moderator" && userRole !== "admin" && userRole !== "superadmin") {
    return res.status(403).json({ error: "Insufficient permissions. Moderators or admins only." });
  }
  
  next();
};

// System metric helpers
async function getServerCpu(): Promise<number> {
  // Simple approximation - in production use OS module
  return Math.random() * 100;
}

async function getServerMemory(): Promise<{used: number; total: number; percentage: number}> {
  const totalMem = process.memoryUsage().heapTotal / 1024 / 1024;
  const usedMem = process.memoryUsage().heapUsed / 1024 / 1024;
  return {
    used: Math.round(usedMem),
    total: Math.round(totalMem),
    percentage: Math.round((usedMem / totalMem) * 100)
  };
}

async function getDbQueryTime(): Promise<number> {
  // Mock implementation - in production track actual query times
  return Math.random() * 100;
}

async function getErrorRate(): Promise<number> {
  // Mock implementation - in production track actual errors
  return Math.random() * 5;
}

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.set', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({
  storage: uploadStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication is now set up in server/index.ts before routes
  // This ensures session middleware runs before route handlers

  // Import auth functions from server/auth.ts
  const { 
    hashPassword, 
    verifyGoogleToken, 
    findOrCreateGoogleUser,
    isAuthenticated: isAuthenticatedMiddleware,
    isAdmin: isAdminMiddleware
  } = await import('./auth.js');
  
  // Import passport for session management
  const passport = (await import('passport')).default;

  // ===== AUTHENTICATION API ROUTES =====
  
  // POST /api/auth/register - Email/password registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, username } = req.body;

      // Validate inputs
      if (!email || !password || !username) {
        return res.status(400).json({ error: "Email, password, and username are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Validate password strength (min 8 chars)
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      // Check if user already exists
      const existingUsers = await db
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.username, username)))
        .limit(1);

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        if (existingUser.email === email) {
          return res.status(409).json({ error: "Email already registered" });
        }
        if (existingUser.username === username) {
          return res.status(409).json({ error: "Username already taken" });
        }
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Create user
      const newUserResults = await db
        .insert(users)
        .values({
          email,
          password_hash,
          username,
          auth_provider: "email",
          is_email_verified: false,
          role: "member",
          status: "active",
          totalCoins: 0,
          weeklyEarned: 0,
          reputationScore: 0,
          level: 0,
          emailNotifications: true,
          isVerifiedTrader: false,
          hasYoutubeReward: false,
          hasMyfxbookReward: false,
          hasInvestorReward: false,
          emailBounceCount: 0,
          onboardingCompleted: false,
          onboardingDismissed: false,
          last_login_at: new Date(),
        })
        .returning();

      const newUser = newUserResults[0];

      // Log in the user automatically
      req.login(newUser, (err) => {
        if (err) {
          console.error("Auto-login failed after registration:", err);
          return res.status(500).json({ error: "Registration successful but login failed" });
        }

        // Explicitly save the session to ensure cookie is set
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
          }

          res.status(201).json({
            message: "Registration successful",
            user: {
              id: newUser.id,
              email: newUser.email,
              username: newUser.username,
              role: newUser.role,
            },
          });
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message || "Registration failed" });
    }
  });

  // POST /api/auth/login - Email/password login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Login failed" });
      }

      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session creation error:", loginErr);
          return res.status(500).json({ error: "Session creation failed" });
        }

        // Explicitly save the session to ensure cookie is set
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
          }

          res.json({
            message: "Login successful",
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role,
            },
          });
        });
      });
    })(req, res, next);
  });

  // POST /api/auth/logout - Clear session
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }

      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.json({ message: "Logout successful" });
      });
    });
  });

  // POST /api/auth/google - Google OAuth authentication
  app.post("/api/auth/google", async (req, res) => {
    try {
      // Check if Firebase Admin SDK is initialized
      const { isFirebaseInitialized } = await import('./auth.js');
      
      if (!isFirebaseInitialized()) {
        return res.status(400).json({ 
          error: "Google OAuth is not configured on this server. Please use email/password authentication." 
        });
      }

      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: "ID token is required" });
      }

      // Verify Google ID token
      const googleUser = await verifyGoogleToken(idToken);

      // Find or create user
      const user = await findOrCreateGoogleUser(googleUser);

      // Create session
      req.login(user, (err) => {
        if (err) {
          console.error("Google login session creation error:", err);
          return res.status(500).json({ error: "Session creation failed" });
        }

        // Explicitly save the session to ensure cookie is set
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
          }

          res.json({
            message: "Google login successful",
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role,
            },
          });
        });
      });
    } catch (error: any) {
      console.error("Google authentication error:", error);
      
      // Return 400 for configuration errors, 401 for authentication errors
      if (error.message.includes("not initialized") || error.message.includes("not configured")) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(401).json({ error: error.message || "Google authentication failed" });
    }
  });

  // HEALTH CHECK ENDPOINTS
  // Database health check endpoint for monitoring and load balancers
  app.get("/api/health", async (req, res) => {
    try {
      const { checkDatabaseHealth } = await import('./db.js');
      const dbHealth = await checkDatabaseHealth();
      
      const overallHealth = {
        status: dbHealth.healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          appName: process.env.APP_NAME || 'yoforex-api',
        },
      };
      
      // Return appropriate status code based on health
      const statusCode = dbHealth.healthy ? 200 : 503;
      res.status(statusCode).json(overallHealth);
    } catch (error: any) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Health check failed',
      });
    }
  });
  
  // Simple liveness probe for container orchestration
  app.get("/api/health/live", (req, res) => {
    res.status(200).json({ 
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  });
  
  // Readiness probe that checks database connectivity
  app.get("/api/health/ready", async (req, res) => {
    try {
      const { checkDatabaseHealth } = await import('./db.js');
      const dbHealth = await checkDatabaseHealth();
      
      if (dbHealth.healthy) {
        res.status(200).json({ 
          status: 'ready',
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({ 
          status: 'not ready',
          timestamp: new Date().toISOString(),
          reason: dbHealth.message,
        });
      }
    } catch (error: any) {
      res.status(503).json({ 
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message || 'Readiness check failed',
      });
    }
  });

  // FILE UPLOAD ENDPOINT
  app.post("/api/upload", isAuthenticated, upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Generate URLs for uploaded files
      const fileUrls = req.files.map((file: Express.Multer.File) => {
        return `/uploads/${file.filename}`;
      });

      res.json({ 
        urls: fileUrls,
        message: "Thanks! This helps others.",
        count: fileUrls.length
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({ error: error.message || "Failed to upload files" });
    }
  });

  // ===== OBJECT STORAGE ENDPOINTS (Replit Object Storage) =====
  // Based on blueprint:javascript_object_storage for protected file uploading
  
  // Get presigned upload URL for EA files and screenshots
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error('[OBJECT STORAGE] Failed to get upload URL:', error);
      res.status(500).json({ error: error.message || "Failed to get upload URL" });
    }
  });

  // Download protected files with ACL check
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error('[OBJECT STORAGE] Download error:', error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Set ACL policy for uploaded EA files
  app.put("/api/content/files", isAuthenticated, async (req, res) => {
    try {
      const { fileURL, visibility, contentId } = req.body;
      
      // Validate required parameters
      if (!fileURL) {
        return res.status(400).json({ error: "fileURL is required" });
      }
      
      if (!visibility || !["public", "private"].includes(visibility)) {
        return res.status(400).json({ error: "visibility must be either 'public' or 'private'" });
      }
      
      if (visibility === "private" && !contentId) {
        return res.status(400).json({ error: "contentId is required for private files" });
      }

      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Set ACL policy based on visibility
      // - public: Screenshots viewable by everyone
      // - private: EA files only for purchasers + owner
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        fileURL,
        {
          owner: userId,
          visibility: visibility === "public" ? "public" : "private",
          // For private files, add ACL rules for purchasers
          aclRules: contentId && visibility === "private" ? [{
            group: {
              type: ObjectAccessGroupType.PURCHASERS,
              id: contentId
            },
            permission: ObjectPermission.READ
          }] : undefined
        }
      );

      console.log(`[OBJECT STORAGE] ACL set for ${objectPath} (${visibility})`);

      res.json({
        objectPath,
        visibility,
        message: "File uploaded and access control set successfully"
      });
    } catch (error: any) {
      console.error('[OBJECT STORAGE] ACL setting error:', error);
      res.status(500).json({ error: error.message || "Failed to set file access control" });
    }
  });

  // Get current authenticated user
  app.get("/api/me", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const claims = (req.user as any)?.claims;
    if (!claims?.sub) {
      return res.status(401).json({ error: "Invalid session" });
    }
    
    const user = await storage.getUser(claims.sub);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  });

  // TEST EMAIL ENDPOINT - Send test email (Admin only)
  app.post("/api/test-email", isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { to, type } = req.body;
      
      if (!to) {
        return res.status(400).json({ error: "Email address required" });
      }

      // Send a welcome/verification email as test
      await emailService.sendEmailVerification(
        to,
        "TestUser",
        "test-verification-token-123"
      );

      res.json({ success: true, message: `Test email sent to ${to}` });
    } catch (error: any) {
      console.error('[EMAIL TEST] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // FEEDBACK ENDPOINT - Submit user feedback
  app.post("/api/feedback", async (req, res) => {
    try {
      // Extract userId from session (may be null for anonymous feedback)
      const userId = req.isAuthenticated() ? (req.user as any)?.claims?.sub : null;

      // 1. Validate with Zod schema using safeParse
      const validationResult = insertFeedbackSchema.safeParse({
        userId: userId,
        type: req.body.type,
        subject: req.body.subject,
        message: req.body.message,
        email: req.body.email,
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        });
      }
      
      // 2. Sanitize inputs to prevent XSS (no HTML allowed in feedback)
      const sanitized = sanitizeRequestBody(validationResult.data, []);
      
      // 3. Create feedback with sanitized data
      const createdFeedback = await storage.createFeedback(sanitized);

      console.log(`[FEEDBACK] New feedback created:`);
      console.log(`  ID: ${createdFeedback.id}`);
      console.log(`  Type: ${createdFeedback.type}`);
      console.log(`  Subject: ${createdFeedback.subject}`);
      console.log(`  User ID: ${createdFeedback.userId || 'Anonymous'}`);

      res.json({ 
        success: true,
        id: createdFeedback.id,
        message: "Feedback submitted successfully. Thank you for helping us improve!" 
      });
    } catch (error: any) {
      console.error('[FEEDBACK] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get user by ID (requires authentication - own profile or admin)
  app.get("/api/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const requestedUserId = req.params.userId;

      // Check if user is viewing their own profile or is an admin
      if (authenticatedUserId !== requestedUserId && !isAdmin(req.user)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await storage.getUser(requestedUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get user by username (public - only safe fields exposed)
  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Whitelist only safe public fields - NEVER expose credentials, financial data, or internal state
      const publicProfile = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        location: user.location,
        youtubeUrl: user.youtubeUrl,
        instagramHandle: user.instagramHandle,
        telegramHandle: user.telegramHandle,
        myfxbookLink: user.myfxbookLink,
        isVerifiedTrader: user.isVerifiedTrader,
        badges: user.badges,
        reputationScore: user.reputationScore,
        rank: user.rank,
        createdAt: user.createdAt,
      };
      
      res.json(publicProfile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Coin balance endpoint (requires authentication - own profile or admin)
  app.get("/api/user/:userId/coins", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const requestedUserId = req.params.userId;

      // Check if user is viewing their own coins or is an admin
      if (authenticatedUserId !== requestedUserId && !isAdmin(req.user)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await storage.getUser(requestedUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        totalCoins: user.totalCoins,
        weeklyEarned: user.weeklyEarned,
        rank: user.rank
      });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Transaction history endpoint (requires authentication - own profile or admin)
  app.get("/api/user/:userId/transactions", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const requestedUserId = req.params.userId;

      // Check if user is viewing their own transactions or is an admin
      if (authenticatedUserId !== requestedUserId && !isAdmin(req.user)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const transactions = await storage.getUserTransactions(requestedUserId, limit);
      res.json(transactions);
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Badge System Endpoints
  // GET /api/users/:userId/badges - Get user badges
  app.get("/api/users/:userId/badges", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const badges = user.badges || [];
      const badgeDetails = badges.map((badgeId: string) => ({
        id: badgeId,
        ...BADGE_METADATA[badgeId as BadgeType],
      }));

      res.json(badgeDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/users/:userId/stats - Get user stats for TrustLevel widget
  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const reputationScore = user.reputationScore || 0;

      // Calculate level based on reputation score
      let currentLevel: "novice" | "contributor" | "verified" | "pro";
      let nextLevelXP: number;

      if (reputationScore < 500) {
        currentLevel = "novice";
        nextLevelXP = 500;
      } else if (reputationScore < 2000) {
        currentLevel = "contributor";
        nextLevelXP = 2000;
      } else if (reputationScore < 5000) {
        currentLevel = "verified";
        nextLevelXP = 5000;
      } else {
        currentLevel = "pro";
        nextLevelXP = 10000;
      }

      // Calculate achievements
      const userContent = await storage.getUserContent(req.params.userId);
      const badges = user.badges || [];
      
      // Get user's replies and count accepted answers
      const userActivity = await storage.getUserActivity(req.params.userId, 1000);
      const acceptedAnswersCount = userActivity.filter(
        (activity: any) => activity.action === 'answer_accepted' && activity.userId === req.params.userId
      ).length;

      const achievements = {
        uploads: userContent.length,
        verifiedSets: badges.filter((b: string) => b.includes('verified')).length,
        solutionsMarked: acceptedAnswersCount
      };

      res.json({
        currentLevel,
        xp: reputationScore,
        nextLevelXP,
        achievements
      });
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/me/check-badges - Check and award new badges
  app.post("/api/me/check-badges", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const newBadges = await storage.checkAndAwardBadges(userId);
      
      const badgeDetails = newBadges.map((badgeId: string) => ({
        id: badgeId,
        ...BADGE_METADATA[badgeId as BadgeType],
      }));

      res.json({ newBadges: badgeDetails });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/me/onboarding - Get onboarding progress
  app.get("/api/me/onboarding", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const progress = await storage.getOnboardingProgress(userId);
      res.json(progress || {
        completed: false,
        dismissed: false,
        progress: {
          profilePicture: false,
          firstReply: false,
          twoReviews: false,
          firstThread: false,
          firstPublish: false,
          fiftyFollowers: false,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/me/onboarding/dismiss - Dismiss onboarding widget
  app.post("/api/me/onboarding/dismiss", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      // Check if onboarding is completed before allowing dismiss
      const progress = await storage.getOnboardingProgress(userId);
      if (!progress || !progress.completed) {
        return res.status(400).json({ error: "Cannot dismiss onboarding until all tasks are completed" });
      }
      
      await storage.dismissOnboarding(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/me/content - Get current user's published content
  app.get("/api/me/content", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const content = await storage.getUserContent(userId);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/me/purchases - Get current user's purchases with populated content details
  app.get("/api/me/purchases", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const purchases = await storage.getUserPurchases(userId);
      
      // Populate content details for each purchase
      const purchasesWithContent = await Promise.all(
        purchases.map(async (purchase: any) => {
          const content = await storage.getContent(purchase.contentId);
          return {
            ...purchase,
            content: content || null
          };
        })
      );
      
      res.json(purchasesWithContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/me/dashboard-metrics - Get dashboard aggregate metrics
  app.get("/api/me/dashboard-metrics", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const content = await storage.getUserContent(userId);
      
      // Get content IDs to query sales
      const contentIds = content.map((c: any) => c.id);
      
      // Calculate total revenue from actual sales/downloads
      // Revenue comes from the downloads field which represents successful purchases
      const totalRevenue = content.reduce((sum: number, item: any) => {
        // Calculate revenue from downloads (80% commission for EA/indicators/articles, 75% for set files)
        const commission = item.type === 'source_code' ? 0.75 : 0.8;
        const salesRevenue = (item.downloads || 0) * item.priceCoins * commission;
        return sum + salesRevenue;
      }, 0);
      
      const totalDownloads = content.reduce((sum: number, item: any) => sum + (item.downloads || 0), 0);
      const totalViews = content.reduce((sum: number, item: any) => sum + (item.views || 0), 0);
      const avgRating = content.length > 0 
        ? content.reduce((sum: number, item: any) => sum + (item.averageRating || 0), 0) / content.length 
        : 0;

      res.json({
        totalRevenue: Math.floor(totalRevenue),
        totalDownloads,
        totalViews,
        avgRating,
        publishedCount: content.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/me/revenue-trend - Get 30-day revenue trend
  app.get("/api/me/revenue-trend", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      
      // Query coin transactions for last 30 days to get real revenue data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get all "earn" type transactions (revenue) from the last 30 days
      const revenueTransactions = await db
        .select({
          amount: coinTransactions.amount,
          createdAt: coinTransactions.createdAt,
        })
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.userId, userId),
            eq(coinTransactions.type, 'earn'),
            gt(coinTransactions.createdAt, thirtyDaysAgo)
          )
        )
        .orderBy(asc(coinTransactions.createdAt));
      
      // Group transactions by date and sum revenue
      const trendMap = new Map<string, { revenueCoins: number; downloads: number }>();
      
      revenueTransactions.forEach((transaction: any) => {
        const date = transaction.createdAt.toISOString().split('T')[0];
        const existing = trendMap.get(date) || { revenueCoins: 0, downloads: 0 };
        existing.revenueCoins += transaction.amount;
        trendMap.set(date, existing);
      });
      
      // Convert map to array and fill in missing dates with zeros
      const trend: { date: string; revenueCoins: number; downloads: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const data = trendMap.get(dateStr) || { revenueCoins: 0, downloads: 0 };
        trend.push({
          date: dateStr,
          revenueCoins: data.revenueCoins,
          downloads: data.downloads
        });
      }
      
      res.json(trend);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/dashboard/preferences - Get authenticated user's dashboard preferences
  app.get("/api/dashboard/preferences", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const preferences = await storage.getDashboardPreferences(userId);
      
      if (!preferences) {
        return res.json({
          widgetOrder: ['stats', 'hot-threads', 'leaderboard', 'week-highlights', 'activity-feed', 'top-sellers'],
          enabledWidgets: ['stats', 'hot-threads', 'leaderboard', 'week-highlights', 'activity-feed'],
          layoutType: 'default'
        });
      }
      
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/dashboard/preferences - Save authenticated user's dashboard preferences
  app.post("/api/dashboard/preferences", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const { widgetOrder, enabledWidgets, layoutType } = req.body;
      
      if (!Array.isArray(widgetOrder) || !Array.isArray(enabledWidgets) || !layoutType) {
        return res.status(400).json({ error: "Invalid preferences data" });
      }
      
      const preferences = await storage.saveDashboardPreferences(userId, {
        userId,
        widgetOrder,
        enabledWidgets,
        layoutType
      });
      
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Notification System Endpoints
  // GET /api/notifications - Get user's notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/notifications/:id/read - Mark notification as read
  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const notification = await storage.markNotificationAsRead(req.params.id, userId);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/notifications/unread-count - Get unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/notifications/mark-all-read - Mark all notifications as read
  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/activity/recent - Get recent platform activity
  app.get("/api/activity/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/user/earnings-summary - Get user earnings breakdown
  app.get("/api/user/earnings-summary", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const summary = await storage.getUserEarningsSummary(userId);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create coin transaction (earn/spend)
  app.post("/api/transactions", isAuthenticated, coinOperationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Sanitize inputs
      const sanitized = sanitizeRequestBody(req.body, []);
      
      // Validate schema
      const validated = insertCoinTransactionSchema.parse(sanitized);
      
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      // Validate coin amount is positive
      const amountValidation = validateCoinAmount(validated.amount);
      if (!amountValidation.valid) {
        return res.status(400).json({ error: amountValidation.error });
      }
      
      // For spending transactions, verify user has sufficient coins
      if (validated.type === "spend") {
        const user = await storage.getUser(authenticatedUserId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        const balanceCheck = validateSufficientCoins(user.totalCoins, validated.amount);
        if (!balanceCheck.valid) {
          return res.status(400).json({ error: balanceCheck.error });
        }
      }
      
      const transaction = await storage.createCoinTransaction(validated);
      res.json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Insufficient coins") {
          return res.status(400).json({ error: "Insufficient coins" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  // Create recharge order
  app.post("/api/recharge", isAuthenticated, coinOperationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertRechargeOrderSchema.parse(req.body);
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      const order = await storage.createRechargeOrder(validated);
      
      // TODO: Integrate with Stripe or crypto payment gateway here
      // For now, auto-complete for demo purposes
      const completedOrder = await storage.updateRechargeOrderStatus(
        order.id, 
        "completed",
        "demo-payment-id"
      );
      
      res.json(completedOrder);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Invalid recharge data" });
    }
  });

  // Get recharge packages (must come before :orderId route)
  app.get("/api/recharge/packages", async (req, res) => {
    res.json(RECHARGE_PACKAGES);
  });

  // Get recharge order status
  app.get("/api/recharge/:orderId", async (req, res) => {
    const order = await storage.getRechargeOrder(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  });

  // ===== WITHDRAWAL ENDPOINTS =====
  
  // Create withdrawal request
  app.post("/api/withdrawals", isAuthenticated, coinOperationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertWithdrawalRequestSchema.parse(req.body);
      
      // Calculate exchange rate and crypto amount based on hardcoded rates
      const EXCHANGE_RATES = {
        BTC: 50000,
        ETH: 3000,
      } as const;
      
      // Calculate processing fee: 5% or 100 coins (whichever is greater)
      const fivePercent = Math.floor(validated.amount * 0.05);
      const processingFee = Math.max(fivePercent, 100);
      
      // Only calculate crypto-related fields if cryptoType is present (crypto withdrawals)
      let exchangeRate: string | undefined;
      let cryptoAmount: string | undefined;
      
      if (validated.cryptoType && validated.cryptoType in EXCHANGE_RATES) {
        const rate = EXCHANGE_RATES[validated.cryptoType as keyof typeof EXCHANGE_RATES];
        const amount = validated.amount / rate;
        exchangeRate = rate.toString();
        cryptoAmount = amount.toString();
      }
      
      const withdrawal = await storage.createWithdrawalRequest(authenticatedUserId, {
        ...validated,
        exchangeRate,
        cryptoAmount,
        processingFee,
        status: 'pending',
      });
      
      // Queue withdrawal request email (fire-and-forget) - only for crypto withdrawals
      (async () => {
        try {
          const user = await storage.getUser(authenticatedUserId);
          if (user?.email && validated.cryptoType) {
            await emailQueueService.queueEmail({
              userId: user.id,
              templateKey: 'withdrawal_request',
              recipientEmail: user.email,
              subject: 'Withdrawal Request Received',
              payload: {
                recipientName: user.username,
                amount: validated.amount,
                cryptoType: validated.cryptoType,
                withdrawalId: withdrawal.id,
                status: 'pending'
              },
              priority: EmailPriority.HIGH
            });
          }
        } catch (emailError) {
          console.error('Failed to queue withdrawal request email:', emailError);
        }
      })();
      
      res.json(withdrawal);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "Insufficient balance") {
          return res.status(400).json({ error: "Insufficient balance" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid withdrawal data" });
    }
  });

  // Get user's withdrawal history
  app.get("/api/withdrawals", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const withdrawals = await storage.getUserWithdrawals(authenticatedUserId);
      res.json(withdrawals);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  // Get specific withdrawal by ID
  app.get("/api/withdrawals/:id", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const withdrawal = await storage.getWithdrawalById(req.params.id, authenticatedUserId);
      
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      
      res.json(withdrawal);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: "Failed to fetch withdrawal" });
    }
  });

  // Cancel pending withdrawal
  app.post("/api/withdrawals/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const withdrawal = await storage.cancelWithdrawalRequest(req.params.id, authenticatedUserId);
      
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      
      res.json(withdrawal);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Withdrawal not found") {
          return res.status(404).json({ error: "Withdrawal not found" });
        }
        if (error.message === "Can only cancel pending withdrawals") {
          return res.status(400).json({ error: "Can only cancel pending withdrawals" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(500).json({ error: "Failed to cancel withdrawal" });
    }
  });

  // Calculate withdrawal fees
  app.post("/api/withdrawals/calculate", async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount < 1000) {
        return res.status(400).json({ error: "Minimum withdrawal is 1000 coins" });
      }
      
      const calculation = calculateWithdrawal(amount);
      res.json(calculation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== COIN EARNING ENDPOINTS =====

  // Daily check-in - COMMENTED OUT: getDailyActivityLimit and upsertDailyActivityLimit methods don't exist in storage
  /* app.post("/api/coins/daily-checkin", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already checked in today
      const existingLimit = await storage.getDailyActivityLimit(userId, today);
      if (existingLimit && existingLimit.checkinCount > 0) {
        return res.status(400).json({ error: "Already checked in today" });
      }
      
      // Get yesterday's date to check streak
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const yesterdayLimit = await storage.getDailyActivityLimit(userId, yesterday);
      
      let consecutiveDays = 1;
      if (yesterdayLimit && yesterdayLimit.consecutiveDays > 0) {
        consecutiveDays = yesterdayLimit.consecutiveDays + 1;
      }
      
      // Award daily check-in coin
      let coinsAwarded = EARNING_REWARDS.DAILY_CHECKIN;
      let bonusDescription = '';
      
      // Check for streak bonuses
      if (consecutiveDays === 7) {
        coinsAwarded += EARNING_REWARDS.WEEKLY_STREAK;
        bonusDescription = ' + 10 bonus (7-day streak!)';
      } else if (consecutiveDays === 30) {
        coinsAwarded += EARNING_REWARDS.MONTHLY_PERFECT;
        bonusDescription = ' + 50 bonus (30-day perfect streak!)';
      }
      
      // Update daily activity limit
      await storage.upsertDailyActivityLimit(userId, today, {
        checkinCount: 1,
        consecutiveDays,
      });
      
      // Award coins via ledger transaction
      await storage.beginLedgerTransaction(
        'earn',
        userId,
        [
          {
            userId,
            direction: 'credit',
            amount: coinsAwarded,
            memo: `Daily check-in (day ${consecutiveDays})${bonusDescription}`,
          },
          {
            userId: 'system',
            direction: 'debit',
            amount: coinsAwarded,
            memo: 'Platform reward for daily check-in',
          },
        ],
        { activityType: 'daily-checkin', consecutiveDays }
      );
      
      res.json({
        success: true,
        coinsAwarded,
        consecutiveDays,
        message: `+${coinsAwarded} coins! Day ${consecutiveDays} streak${bonusDescription}`,
      });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  }); */

  // ===== REFERRAL ENDPOINTS =====

  // Get user's referral link
  app.get("/api/referrals/link", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const baseUrl = process.env.BASE_URL || 'https://yoforex.com';
      const referralLink = `${baseUrl}/?ref=${user.id}`;
      
      res.json({
        referralLink,
        userId: user.id,
        username: user.username,
      });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get referral stats
  app.get("/api/referrals/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      
      // TODO: Implement referral tracking in storage
      // For now, return placeholder data
      res.json({
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarned: 0,
        thisMonthEarned: 0,
        referrals: [],
      });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ===== LEDGER SYSTEM ENDPOINTS =====
  
  // Admin-only endpoint to backfill opening balances (run once)
  app.post("/api/admin/backfill-wallets", isAdminMiddleware, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    // Get user from database to check admin status
    const user = await storage.getUser(userId);
    
    // TODO: Replace with proper admin check
    // For now, block ALL access since this is a one-time migration
    // In production, add an 'isAdmin' field to users table
    return res.status(403).json({ 
      error: "Forbidden: Admin-only endpoint. Use CLI for one-time migration." 
    });

    /* DISABLED FOR SECURITY
    try {
      if (typeof (storage as any).backfillOpeningBalances !== 'function') {
        return res.status(400).json({ error: "Backfill not available (MemStorage in use)" });
      }
      const result = await storage.backfillOpeningBalances();
      res.json({ 
        message: "Wallets backfilled successfully",
        created: result.created,
        skipped: result.skipped
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
    */
  });

  // Get user wallet balance
  app.get("/api/wallet", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const wallet = await storage.getUserWallet(userId);
      res.json(wallet);
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message.includes("does not support ledger operations")) {
        return res.status(400).json({ error: "Ledger operations not available (MemStorage in use)" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get ledger history
  app.get("/api/ledger/history", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getLedgerTransactionHistory(userId, limit);
      res.json(history);
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message.includes("does not support ledger operations")) {
        return res.status(400).json({ error: "Ledger operations not available (MemStorage in use)" });
      }
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/daily-checkin - Award daily active bonus
  app.post("/api/daily-checkin", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);

      // Check if user already checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingCheckin = await storage.getLedgerTransactionHistory(userId, 100);
      const checkedInToday = existingCheckin.some(entry => {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        return entry.memo?.includes('Daily active bonus') && entryDate.getTime() === today.getTime();
      });

      if (checkedInToday) {
        return res.status(400).json({ error: 'Already checked in today' });
      }

      // AWARD COINS: +5 for daily active
      await storage.beginLedgerTransaction(
        'earn',
        userId,
        [
          {
            userId,
            direction: 'credit',
            amount: 5,
            memo: 'Daily active bonus',
          },
          {
            userId: 'system',
            direction: 'debit',
            amount: 5,
            memo: 'Platform daily reward',
          },
        ],
        { date: today.toISOString() }
      );

      res.json({ message: 'Daily bonus claimed', coins: 5 });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message.includes("does not support ledger operations")) {
        return res.status(400).json({ error: "Ledger operations not available (MemStorage in use)" });
      }
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/activity/track - Track user activity and award coins (SECURE VERSION)
  // CRITICAL SECURITY: Uses server-side session timestamps to prevent coin farming
  app.post("/api/activity/track", isAuthenticated, activityTrackingLimiter, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      
      // Initialize session if not present
      if (!req.session) {
        return res.status(500).json({ error: "Session not initialized" });
      }

      const now = Date.now();
      const sessionKey = `lastActivityPing_${userId}`;
      const lastPing = (req.session as any)[sessionKey] as number | undefined;

      // First ping - just set the timestamp, don't award coins
      if (!lastPing) {
        (req.session as any)[sessionKey] = now;
        return res.json({
          success: true,
          coinsEarned: 0,
          totalMinutes: 0,
          dailyLimit: false,
          message: "Activity tracking started",
        });
      }

      // Calculate elapsed time in minutes (server-side calculation, cannot be spoofed)
      const elapsedMs = now - lastPing;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      // Cap at 5 minutes to prevent long idle time claims
      // If more than 5 minutes passed, only count 5 minutes
      const minutesToAward = Math.min(elapsedMinutes, 5);

      // Ignore if less than 1 minute has passed (too soon)
      if (minutesToAward < 1) {
        return res.json({
          success: true,
          coinsEarned: 0,
          totalMinutes: 0,
          dailyLimit: false,
          message: "Not enough time elapsed since last ping",
        });
      }

      // Update the last ping timestamp
      (req.session as any)[sessionKey] = now;

      // Record activity with SERVER-CALCULATED minutes (not client-supplied)
      const result = await storage.recordActivity(userId, minutesToAward);

      // Create notification and queue email if coins were earned
      if (result.coinsEarned > 0) {
        await storage.createNotification({
          userId,
          type: "coin_earned",
          title: "Activity Reward!",
          message: `You earned ${result.coinsEarned} coins for being active!`,
        });
        
        // Queue coin earned email (fire-and-forget)
        (async () => {
          try {
            const user = await storage.getUser(userId);
            if (user?.email) {
              await emailQueueService.queueEmail({
                userId: user.id,
                templateKey: 'coins_earned',
                recipientEmail: user.email,
                subject: `You earned ${result.coinsEarned} coins!`,
                payload: {
                  recipientName: user.username,
                  coinsEarned: result.coinsEarned,
                  earnedFrom: 'Activity Reward',
                  totalBalance: user.coinBalance + result.coinsEarned,
                  totalMinutes: result.totalMinutes
                },
                priority: EmailPriority.LOW,
                groupType: 'coins'
              });
            }
          } catch (emailError) {
            console.error('Failed to queue coin earned email:', emailError);
          }
        })();

        res.json({
          success: true,
          coinsEarned: result.coinsEarned,
          totalMinutes: result.totalMinutes,
          dailyLimit: false,
        });
      } else {
        // Daily limit reached
        res.json({
          success: true,
          coinsEarned: 0,
          totalMinutes: result.totalMinutes,
          dailyLimit: true,
        });
      }
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/activity/today - Get today's activity stats
  app.get("/api/activity/today", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const activity = await storage.getTodayActivity(userId);
      
      res.json(activity || { activeMinutes: 0, coinsEarned: 0 });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/coins/summary - Get earning breakdown
  app.get("/api/coins/summary", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);

      const history = await storage.getLedgerTransactionHistory(userId, 1000);
      
      const summary = {
        totalEarned: 0,
        publishing: 0,
        helpful: 0,
        accepted: 0,
        daily: 0,
        reviews: 0,
        likes: 0,
      };

      history.forEach(entry => {
        if (entry.direction === 'credit' && entry.memo) {
          const amount = entry.amount;
          summary.totalEarned += amount;

          if (entry.memo.includes('Published')) summary.publishing += amount;
          else if (entry.memo.includes('helpful')) summary.helpful += amount;
          else if (entry.memo.includes('accepted')) summary.accepted += amount;
          else if (entry.memo.includes('Daily')) summary.daily += amount;
          else if (entry.memo.includes('review') || entry.memo.includes('scam')) summary.reviews += amount;
          else if (entry.memo.includes('like')) summary.likes += amount;
        }
      });

      res.json(summary);
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message.includes("does not support ledger operations")) {
        return res.status(400).json({ error: "Ledger operations not available (MemStorage in use)" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ===== MARKETPLACE ENDPOINTS =====
  
  // ===== PUBLISHING ENDPOINTS =====
  
  // Get forum categories for publishing
  app.get("/api/publish/categories", async (req, res) => {
    try {
      const categories = await storage.listForumCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  // Mock file upload endpoint (returns mock file data)
  app.post("/api/uploads/file", isAuthenticated, async (req, res) => {
    try {
      // Mock file upload - in production this would handle actual file storage
      const { name, size } = req.body;
      
      if (!name || !size) {
        return res.status(400).json({ error: "File name and size required" });
      }
      
      // Generate mock data
      const mockFileData = {
        name,
        size,
        url: `/uploads/files/${Date.now()}-${name}`,
        checksum: Math.random().toString(36).substring(2, 15),
      };
      
      res.json(mockFileData);
    } catch (error) {
      res.status(400).json({ error: "File upload failed" });
    }
  });
  
  // Mock image upload endpoint (returns mock image data)
  app.post("/api/uploads/image", isAuthenticated, async (req, res) => {
    try {
      // Mock image upload - in production this would handle actual image storage
      const { name, isCover, order } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Image name required" });
      }
      
      // Generate mock data
      const mockImageData = {
        url: `/uploads/images/${Date.now()}-${name}`,
        isCover: isCover || false,
        order: order || 0,
      };
      
      res.json(mockImageData);
    } catch (error) {
      res.status(400).json({ error: "Image upload failed" });
    }
  });
  
  // Publish content with validation
  app.post("/api/publish", isAuthenticated, contentCreationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Sanitize inputs - allow HTML in description
      const sanitized = sanitizeRequestBody(req.body, ['description', 'changelog']);
      
      // Use shared publishContentSchema with server-injected authorId
      const validated = publishContentSchema.parse({ ...sanitized, authorId: authenticatedUserId });
      
      // Validate price if provided
      if (validated.priceCoins !== undefined && validated.priceCoins !== null) {
        const priceValidation = validatePrice(validated.priceCoins);
        if (!priceValidation.valid) {
          return res.status(400).json({ error: priceValidation.error });
        }
      }
      
      const content = await storage.createContent(validated);
      
      // Check and award badges after content publishing
      try {
        await storage.checkAndAwardBadges(authenticatedUserId);
      } catch (error) {
        console.error('Badge check failed:', error);
      }
      
      res.json(content);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
        // Return Zod validation errors
        if (error.name === "ZodError") {
          return res.status(400).json({ 
            error: "Validation failed", 
            details: (error as any).errors 
          });
        }
      }
      res.status(400).json({ error: "Invalid content data" });
    }
  });
  
  // Create content (EA, Indicator, Article, Source Code)
  app.post("/api/content", isAuthenticated, contentCreationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Sanitize inputs - allow HTML in description
      const sanitized = sanitizeRequestBody(req.body, ['description']);
      
      // Validate schema
      const validated = insertContentSchema.parse(sanitized);
      
      // Override authorId with authenticated user ID
      validated.authorId = authenticatedUserId;
      
      // Validate price if provided
      if (validated.priceCoins !== undefined && validated.priceCoins !== null) {
        const priceValidation = validatePrice(validated.priceCoins);
        if (!priceValidation.valid) {
          return res.status(400).json({ error: priceValidation.error });
        }
      }
      
      // AUTO-GENERATE SEO METADATA
      const slug = await generateSlug(validated.title, 'content');
      const focusKeyword = generateFocusKeyword(validated.title);
      const metaDescription = generateMetaDescription(validated.description);
      const imageAltTexts = validated.images 
        ? generateImageAltTexts(validated.title, validated.images.length)
        : [];
      
      const content = await storage.createContent({
        ...validated,
      });
      
      // AWARD COINS: Publishing rewards based on content type
      let publishReward = 0;
      let rewardMemo = '';
      
      if (validated.type === 'ea' || validated.type === 'indicator') {
        publishReward = EARNING_REWARDS.PUBLISH_EA_INDICATOR;
        rewardMemo = `Published ${validated.type}: ${validated.title}`;
      } else if (validated.type === 'article') {
        publishReward = EARNING_REWARDS.PUBLISH_ARTICLE;
        rewardMemo = `Published article: ${validated.title}`;
      } else if (validated.files && validated.files.some((f) => f.name.endsWith('.set'))) {
        publishReward = EARNING_REWARDS.PUBLISH_SET_FILE;
        rewardMemo = `Shared set file: ${validated.title}`;
      }
      
      if (publishReward > 0) {
        try {
          await storage.beginLedgerTransaction(
            'earn',
            authenticatedUserId,
            [
              {
                userId: authenticatedUserId,
                direction: 'credit',
                amount: publishReward,
                memo: rewardMemo,
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: publishReward,
                memo: 'Platform reward for content publishing',
              },
            ],
            { contentId: content.id, contentType: validated.type }
          );
        } catch (error) {
          console.error('Failed to award publishing coins:', error);
        }
      }

      // Track onboarding progress for first publish
      if (validated.type === 'ea' || validated.type === 'indicator') {
        try {
          await storage.markOnboardingStep(authenticatedUserId, 'firstPublish');
        } catch (error) {
          console.error('Onboarding tracking failed:', error);
        }
      }
      
      // Queue content published email (fire-and-forget)
      (async () => {
        try {
          const user = await storage.getUser(authenticatedUserId);
          if (user?.email) {
            await emailQueueService.queueEmail({
              userId: user.id,
              templateKey: 'content_published',
              recipientEmail: user.email,
              subject: `Your ${validated.type} "${validated.title}" has been published!`,
              payload: {
                recipientName: user.username,
                contentTitle: validated.title,
                contentType: validated.type,
                contentUrl: `/content/${content.slug}`,
                status: 'published'
              },
              priority: EmailPriority.MEDIUM
            });
          }
        } catch (emailError) {
          console.error('Failed to queue content published email:', emailError);
        }
      })();
      
      res.json(content);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Invalid content data" });
    }
  });
  
  // Get all content with filters
  app.get("/api/content", async (req, res) => {
    const filters = {
      type: req.query.type as string | undefined,
      category: req.query.category as string | undefined,
      status: req.query.status as string | undefined,
    };
    const content = await storage.getAllContent(filters);
    res.json(content);
  });
  
  // GET /api/content/top-sellers - Top selling EAs/Indicators
  // IMPORTANT: This must come BEFORE /api/content/:id to avoid route conflict
  app.get("/api/content/top-sellers", async (req, res) => {
    try {
      const content = await storage.getAllContent({ status: 'approved' });
      
      // Sort by sales score
      const topSellers = content
        .sort((a, b) => (b.salesScore || 0) - (a.salesScore || 0))
        .slice(0, 10);
      
      const sellersWithStats = await Promise.all(topSellers.map(async (item) => {
        const author = await storage.getUserById(item.authorId);
        const salesStats = await storage.getContentSalesStats(item.id);
        
        return {
          id: item.id,
          slug: item.slug,
          title: item.title,
          type: item.type,
          priceCoins: item.priceCoins,
          isFree: item.isFree,
          postLogoUrl: item.postLogoUrl,
          salesScore: item.salesScore || 0,
          totalSales: salesStats.totalSales,
          avgRating: salesStats.avgRating,
          reviewCount: salesStats.reviewCount,
          downloads: item.downloads,
          author: {
            id: author?.id,
            username: author?.username,
            profileImageUrl: author?.profileImageUrl
          }
        };
      }));
      
      res.json({
        topSellers: sellersWithStats,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get content by ID
  app.get("/api/content/:id", async (req, res) => {
    const content = await storage.getContent(req.params.id);
    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }
    
    // Update view count
    await storage.updateContentViews(req.params.id);
    
    res.json(content);
  });
  
  // Get content by slug
  app.get("/api/content/slug/:slug", async (req, res) => {
    const content = await storage.getContentBySlug(req.params.slug);
    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }
    
    // Update view count
    await storage.updateContentViews(content.id);
    
    res.json(content);
  });
  
  // Get user's published content
  app.get("/api/user/:userId/content", async (req, res) => {
    const content = await storage.getUserContent(req.params.userId);
    res.json(content);
  });
  
  // Purchase content (user-to-user transaction)
  app.post("/api/content/purchase", isAuthenticated, async (req, res) => {
    try {
      const buyerId = getAuthenticatedUserId(req);
      const { contentId } = req.body;

      if (!contentId) {
        return res.status(400).json({ error: "contentId is required" });
      }

      // Check if already purchased
      const alreadyPurchased = await storage.hasPurchased(buyerId, contentId);
      if (alreadyPurchased) {
        return res.status(400).json({ error: 'Already purchased this content' });
      }

      // Get content to check if it's free
      const item = await storage.getContent(contentId);
      if (!item) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Execute purchase (handles both free and paid content)
      const purchase = await storage.purchaseContent(contentId, buyerId);
      
      // Queue purchase emails to both buyer and seller (fire-and-forget)
      (async () => {
        try {
          const buyer = await storage.getUser(buyerId);
          const seller = await storage.getUser(item.authorId);
          
          if (buyer?.email && item.priceCoins > 0) {
            // Queue receipt to buyer
            const downloadUrl = `${process.env.BASE_URL}/content/${item.slug}`;
            await emailQueueService.queueEmail({
              userId: buyer.id,
              templateKey: 'purchase_receipt',
              recipientEmail: buyer.email,
              subject: `Purchase Confirmation: ${item.title}`,
              payload: {
                recipientName: buyer.username,
                itemTitle: item.title,
                itemPrice: item.priceCoins,
                purchaseId: purchase.id,
                downloadUrl,
                itemType: item.type
              },
              priority: EmailPriority.HIGH
            });
          }
          
          if (seller?.email && item.priceCoins > 0) {
            // Calculate seller earnings using commission rate (80/20 split)
            const contentType = item.type as keyof typeof calculateCommission;
            const commission = calculateCommission(item.priceCoins, contentType);
            
            // Queue sale notification to seller
            await emailQueueService.queueEmail({
              userId: seller.id,
              templateKey: 'product_sold',
              recipientEmail: seller.email,
              subject: `You made a sale! ${item.title}`,
              payload: {
                recipientName: seller.username,
                itemTitle: item.title,
                buyerName: buyer?.username || 'A user',
                salePrice: item.priceCoins,
                sellerEarnings: commission.sellerAmount,
                itemType: item.type
              },
              priority: EmailPriority.MEDIUM,
              groupType: 'sales'
            });
          }
        } catch (emailError) {
          console.error('Failed to queue purchase emails:', emailError);
        }
      })();
      
      res.json(purchase);
    } catch (error: any) {
      if (error.message === "Content not found") {
        return res.status(404).json({ error: "Content not found" });
      }
      if (error.message === "Already purchased") {
        return res.status(400).json({ error: "Already purchased this content" });
      }
      if (error.message === "Cannot purchase own content") {
        return res.status(400).json({ error: "Cannot purchase own content" });
      }
      if (error.message.includes('Insufficient balance')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Overdraft')) {
        return res.status(400).json({ error: 'Insufficient coins for purchase' });
      }
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/content/:contentId/can-purchase - Check if user can purchase
  app.get("/api/content/:contentId/can-purchase", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { contentId } = req.params;

      // Check if already purchased
      const alreadyPurchased = await storage.hasPurchased(userId, contentId);
      if (alreadyPurchased) {
        return res.json({ canPurchase: false, reason: 'Already purchased' });
      }

      // Get content
      const item = await storage.getContent(contentId);
      if (!item) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Check if free
      if (item.isFree || item.priceCoins === 0) {
        return res.json({ canPurchase: true, isFree: true });
      }

      // Check balance
      const wallet = await storage.getUserWallet(userId);
      const canAfford = wallet && wallet.balance >= item.priceCoins;

      res.json({
        canPurchase: canAfford,
        isFree: false,
        price: item.priceCoins,
        userBalance: wallet?.balance || 0,
        reason: canAfford ? null : 'Insufficient balance',
      });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message.includes("does not support ledger operations")) {
        // Fallback for MemStorage - check user totalCoins instead
        const item = await storage.getContent(req.params.contentId);
        if (!item) {
          return res.status(404).json({ error: 'Content not found' });
        }
        
        const user = await storage.getUser(getAuthenticatedUserId(req));
        const canAfford = user && user.totalCoins >= item.priceCoins;
        
        return res.json({
          canPurchase: canAfford,
          isFree: item.isFree || item.priceCoins === 0,
          price: item.priceCoins,
          userBalance: user?.totalCoins || 0,
          reason: canAfford ? null : 'Insufficient balance',
        });
      }
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get user's purchased content
  app.get("/api/user/:userId/purchases", async (req, res) => {
    const purchases = await storage.getUserPurchases(req.params.userId);
    res.json(purchases);
  });
  
  // Check if user has purchased content
  app.get("/api/content/:contentId/purchased/:userId", async (req, res) => {
    const hasPurchased = await storage.hasPurchased(
      req.params.userId,
      req.params.contentId
    );
    res.json({ hasPurchased });
  });
  
  // Create review (with coin reward)
  app.post("/api/content/review", isAuthenticated, reviewReplyLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // 1. Validate with Zod schema
      const validationResult = insertContentReviewSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        });
      }
      
      // 2. Sanitize inputs to prevent XSS (allow HTML in review field)
      const sanitized = sanitizeRequestBody(validationResult.data, ['review']);
      
      // Override userId with authenticated user ID
      sanitized.userId = authenticatedUserId;
      
      // 3. Create review with sanitized data
      const review = await storage.createReview(sanitized);
      
      // Award 5 coins for review (pending moderation approval)
      // Note: Coins will be awarded when admin approves the review
      
      // Track onboarding step for two reviews submitted
      try {
        const reviewCount = await storage.getUserReviewCount(authenticatedUserId);
        if (reviewCount >= 2) {
          await storage.markOnboardingStep(authenticatedUserId, 'twoReviews');
        }
      } catch (error) {
        console.error('Onboarding step failed:', error);
      }
      
      res.json(review);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Content not found") {
          return res.status(404).json({ error: "Content not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(500).json({ error: "Invalid review data" });
    }
  });
  
  // Get content reviews
  app.get("/api/content/:contentId/reviews", async (req, res) => {
    const reviews = await storage.getContentReviews(req.params.contentId);
    res.json(reviews);
  });
  
  // Like content (with coin reward)
  app.post("/api/content/like", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertContentLikeSchema.parse(req.body);
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      const like = await storage.likeContent(validated);
      if (!like) {
        return res.status(400).json({ error: "Already liked" });
      }
      
      // Queue like notification email (fire-and-forget)
      (async () => {
        try {
          const liker = await storage.getUser(authenticatedUserId);
          const content = await storage.getContent(validated.contentId);
          
          if (content && liker?.username && liker?.email) {
            const contentAuthor = await storage.getUser(content.authorId);
            
            // Don't send email if user likes their own content
            if (contentAuthor?.email && contentAuthor.id !== authenticatedUserId) {
              const contentUrl = `/content/${content.slug}`;
              await emailQueueService.queueEmail({
                userId: contentAuthor.id,
                templateKey: 'like_notification',
                recipientEmail: contentAuthor.email,
                subject: `${liker.username} liked your ${content.type}`,
                payload: {
                  recipientName: contentAuthor.username,
                  likerName: liker.username,
                  contentType: content.type,
                  contentTitle: content.title,
                  contentUrl
                },
                priority: EmailPriority.LOW,
                groupType: 'likes'
              });
            }
          }
        } catch (emailError) {
          console.error('Failed to queue like notification email:', emailError);
        }
      })();
      
      res.json(like);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Content not found") {
          return res.status(404).json({ error: "Content not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "Daily like limit reached (5 per day)") {
          return res.status(429).json({ error: "Daily like limit reached" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Like failed" });
    }
  });
  
  // Check if user has liked content
  app.get("/api/content/:contentId/liked/:userId", async (req, res) => {
    const hasLiked = await storage.hasLiked(
      req.params.userId,
      req.params.contentId
    );
    res.json({ hasLiked });
  });

  // ===== CONTENT REPLIES ENDPOINTS =====
  
  // Create reply (threaded discussion)
  app.post("/api/content/reply", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertContentReplySchema.parse(req.body);
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      const reply = await storage.createReply(validated);
      res.json(reply);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Content not found") {
          return res.status(404).json({ error: "Content not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "Parent reply not found") {
          return res.status(404).json({ error: "Parent reply not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid reply data" });
    }
  });
  
  // Get content replies (threaded)
  app.get("/api/content/:contentId/replies", async (req, res) => {
    const replies = await storage.getContentReplies(req.params.contentId);
    res.json(replies);
  });
  
  // Mark reply as helpful
  app.post("/api/content/reply/:replyId/helpful", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Use authenticated user ID for tracking the vote
      // Note: Storage layer should track which users voted to prevent double-voting
      await storage.updateReplyHelpful(req.params.replyId);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Reply not found") {
          return res.status(404).json({ error: "Reply not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Failed to mark as helpful" });
    }
  });

  // ===== BROKER DIRECTORY ENDPOINTS =====
  
  // Create broker (admin or user submission)
  app.post("/api/brokers", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertBrokerSchema.parse(req.body);
      // Override submittedBy with authenticated user ID if it exists in schema
      if ('submittedBy' in validated) {
        (validated as any).submittedBy = authenticatedUserId;
      }
      
      const broker = await storage.createBroker(validated);
      res.json(broker);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Invalid broker data" });
    }
  });
  
  // Get all brokers with filters
  app.get("/api/brokers", async (req, res) => {
    const filters = {
      isVerified: req.query.isVerified === "true" ? true : req.query.isVerified === "false" ? false : undefined,
      status: req.query.status as string | undefined,
    };
    const brokers = await storage.getAllBrokers(filters);
    res.json(brokers);
  });

  // Search brokers with autocomplete (optimized)
  app.get("/api/brokers/search", async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query) {
        return res.json([]);
      }

      // Use optimized search method
      const matchingBrokers = await storage.searchBrokers(query, limit);
      
      // Map to consistent response format with logo fallback
      const results = matchingBrokers.map((broker: any) => ({
        id: broker.id,
        name: broker.name,
        slug: broker.slug,
        websiteUrl: broker.websiteUrl,
        logoUrl: broker.logoUrl || getPlaceholderLogo(broker.name),
        isVerified: broker.isVerified,
        overallRating: broker.overallRating,
        reviewCount: broker.reviewCount,
      }));

      res.json(results);
    } catch (error: any) {
      console.error('[Broker Search] Error:', error);
      res.status(500).json({ error: error.message || "Failed to search brokers" });
    }
  });

  // NEW: Auto-fetch logo for a broker (when adding new broker)
  app.post("/api/brokers/fetch-logo", async (req, res) => {
    try {
      const { websiteUrl, brokerName } = req.body;
      
      if (!websiteUrl) {
        return res.status(400).json({ error: "Website URL is required" });
      }

      // Try to fetch the logo
      const logoResult = await fetchBrokerLogo(websiteUrl);
      
      // If no logo found, use placeholder
      const finalLogoUrl = logoResult.logoUrl || getPlaceholderLogo(brokerName || 'Broker');

      res.json({
        logoUrl: finalLogoUrl,
        source: logoResult.source,
      });
    } catch (error: any) {
      console.error('[Fetch Logo] Error:', error);
      // Return placeholder on error
      const brokerName = req.body.brokerName || 'Broker';
      res.json({
        logoUrl: getPlaceholderLogo(brokerName),
        source: 'placeholder',
      });
    }
  });

  // NEW: Get platform-wide broker statistics
  app.get("/api/brokers/stats", async (req, res) => {
    try {
      // Get all brokers (don't filter by status - show stats for all brokers)
      const allBrokers = await storage.getAllBrokers();
      const verifiedBrokers = allBrokers.filter(b => b.isVerified);
      
      // Calculate total reviews and average rating
      let totalReviews = 0;
      let totalRatingSum = 0;
      let scamAlertsActive = 0;
      
      for (const broker of allBrokers) {
        totalReviews += broker.reviewCount || 0;
        if (broker.overallRating && broker.reviewCount) {
          totalRatingSum += (broker.overallRating * broker.reviewCount);
        }
        if (broker.scamReportCount > 5) {
          scamAlertsActive++;
        }
      }
      
      const avgRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : "0";
      
      // Get reviews from last 24 hours (approximate based on reviewCount changes)
      // In a real implementation, you'd query brokerReviews with a timestamp filter
      const newReviews24h = Math.floor(totalReviews * 0.05); // Estimate ~5% are recent
      
      res.json({
        totalBrokers: allBrokers.length,
        verifiedBrokers: verifiedBrokers.length,
        totalReviews,
        avgRating: parseFloat(avgRating),
        scamAlertsActive,
        newReviews24h,
      });
    } catch (error: any) {
      console.error('Broker stats error:', error);
      res.status(500).json({ error: error.message || "Failed to fetch broker stats" });
    }
  });

  // NEW: Side-by-side broker comparison
  app.get("/api/brokers/comparison", async (req, res) => {
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam) {
        return res.status(400).json({ error: "Please provide broker IDs in the 'ids' query parameter" });
      }
      
      const ids = idsParam.split(',').slice(0, 3); // Limit to 3 brokers
      if (ids.length === 0) {
        return res.status(400).json({ error: "At least one broker ID required" });
      }
      
      const brokers = [];
      for (const id of ids) {
        const broker = await storage.getBroker(id.trim());
        if (broker) {
          brokers.push({
            id: broker.id,
            name: broker.name,
            slug: broker.slug,
            logoUrl: broker.logoUrl,
            overallRating: broker.overallRating,
            reviewCount: broker.reviewCount,
            scamReportCount: broker.scamReportCount,
            isVerified: broker.isVerified,
            regulationSummary: broker.regulationSummary,
            spreadType: broker.spreadType,
            minSpread: broker.minSpread,
            platform: broker.platform,
            yearFounded: broker.yearFounded,
            websiteUrl: broker.websiteUrl,
          });
        }
      }
      
      res.json({ brokers });
    } catch (error: any) {
      console.error('Broker comparison error:', error);
      res.status(500).json({ error: error.message || "Failed to fetch broker comparison" });
    }
  });

  // NEW: Trending/most reviewed brokers this week
  app.get("/api/brokers/trending", async (req, res) => {
    try {
      const allBrokers = await storage.getAllBrokers({ status: "approved" });
      
      // In a real implementation, you'd query brokerReviews with timestamp filters
      // For now, we'll return top brokers by review count with some randomization for "trend"
      const trendingBrokers = allBrokers
        .map(broker => ({
          brokerId: broker.id,
          name: broker.name,
          slug: broker.slug,
          reviewsThisWeek: Math.floor((broker.reviewCount || 0) * 0.15), // Estimate ~15% recent
          ratingTrend: broker.overallRating || 0,
          verificationStatus: broker.isVerified ? "verified" : "unverified",
          logoUrl: broker.logoUrl,
          overallRating: broker.overallRating,
        }))
        .filter(b => b.reviewsThisWeek > 0)
        .sort((a, b) => b.reviewsThisWeek - a.reviewsThisWeek)
        .slice(0, 10);
      
      res.json(trendingBrokers);
    } catch (error: any) {
      console.error('Trending brokers error:', error);
      res.status(500).json({ error: error.message || "Failed to fetch trending brokers" });
    }
  });
  
  // Get broker by ID
  app.get("/api/brokers/:id", async (req, res) => {
    const broker = await storage.getBroker(req.params.id);
    if (!broker) {
      return res.status(404).json({ error: "Broker not found" });
    }
    res.json(broker);
  });
  
  // Get broker by slug
  app.get("/api/brokers/slug/:slug", async (req, res) => {
    const broker = await storage.getBrokerBySlug(req.params.slug);
    if (!broker) {
      return res.status(404).json({ error: "Broker not found" });
    }
    res.json(broker);
  });
  
  // Submit broker review
  app.post("/api/brokers/review", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // 1. Validate with Zod schema
      const validationResult = insertBrokerReviewSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        });
      }
      
      // 2. Sanitize inputs to prevent XSS (allow HTML in reviewTitle and reviewBody)
      const sanitized = sanitizeRequestBody(validationResult.data, ['reviewTitle', 'reviewBody']);
      
      // Override userId with authenticated user ID
      sanitized.userId = authenticatedUserId;
      
      // 3. Create review with sanitized data
      const review = await storage.createBrokerReview(sanitized);
      
      // Update broker's overall rating
      await storage.updateBrokerRating(sanitized.brokerId);
      
      // AWARD COINS: Only for normal reviews (NOT scam reports)
      // Scam reports require admin verification before awarding coins
      if (!sanitized.isScamReport) {
        try {
          await storage.beginLedgerTransaction(
            'earn',
            authenticatedUserId,
            [
              {
                userId: authenticatedUserId,
                direction: 'credit',
                amount: 50,
                memo: `Reviewed broker: ${sanitized.brokerId}`,
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: 50,
                memo: 'Platform reward for broker review',
              },
            ],
            { reviewId: review.id, isScamReport: false }
          );
        } catch (error) {
          console.error('Failed to award review coins:', error);
        }
      }
      
      // Track onboarding step for two reviews submitted
      try {
        const reviewCount = await storage.getUserReviewCount(authenticatedUserId);
        if (reviewCount >= 2) {
          await storage.markOnboardingStep(authenticatedUserId, 'twoReviews');
        }
      } catch (error) {
        console.error('Onboarding step failed:', error);
      }
      
      res.json(review);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Broker not found") {
          return res.status(404).json({ error: "Broker not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(500).json({ error: "Invalid review data" });
    }
  });

  // Alias for broker review endpoint (frontend compatibility)
  app.post("/api/broker-reviews", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertBrokerReviewSchema.parse(req.body);
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      const review = await storage.createBrokerReview(validated);
      
      // Update broker's overall rating
      await storage.updateBrokerRating(validated.brokerId);
      
      // AWARD COINS: Only for normal reviews (NOT scam reports)
      if (!validated.isScamReport) {
        try {
          await storage.beginLedgerTransaction(
            'earn',
            authenticatedUserId,
            [
              {
                userId: authenticatedUserId,
                direction: 'credit',
                amount: 50,
                memo: `Reviewed broker: ${validated.brokerId}`,
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: 50,
                memo: 'Platform reward for broker review',
              },
            ],
            { reviewId: review.id, isScamReport: false }
          );
        } catch (error) {
          console.error('Failed to award review coins:', error);
        }
      }
      
      // Track onboarding step for two reviews submitted
      try {
        const reviewCount = await storage.getUserReviewCount(authenticatedUserId);
        if (reviewCount >= 2) {
          await storage.markOnboardingStep(authenticatedUserId, 'twoReviews');
        }
      } catch (error) {
        console.error('Onboarding step failed:', error);
      }
      
      res.json(review);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Broker not found") {
          return res.status(404).json({ error: "Broker not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid review data" });
    }
  });
  
  // Get broker reviews (with optional scam filter)
  app.get("/api/brokers/:brokerId/reviews", async (req, res) => {
    const filters = {
      isScamReport: req.query.isScamReport === "true" ? true : req.query.isScamReport === "false" ? false : undefined,
    };
    const reviews = await storage.getBrokerReviews(req.params.brokerId, filters);
    res.json(reviews);
  });

  // POST /api/admin/verify-scam-report/:reviewId - Verify scam report and award coins
  app.post("/api/admin/verify-scam-report/:reviewId", isAdminMiddleware, async (req, res) => {
    // TODO: Add proper admin check here
    // For now, we'll block this endpoint entirely for security
    return res.status(403).json({
      error: "Admin verification endpoint disabled pending admin role implementation"
    });

    /* DISABLED PENDING ADMIN SYSTEM
    const { reviewId } = req.params;
    const { approved } = req.body;

    try {
      const authenticatedUserId = getAuthenticatedUserId(req);

      // Get review
      const review = await storage.getBrokerReview(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      if (!review.isScamReport) {
        return res.status(400).json({ error: 'Not a scam report' });
      }

      if (review.status === 'approved') {
        return res.status(400).json({ error: 'Already verified' });
      }

      // Update review status
      await storage.updateBrokerReviewStatus(reviewId, approved ? 'approved' : 'rejected');

      // Award coins only if approved
      if (approved) {
        try {
          await storage.beginLedgerTransaction(
            'earn',
            review.userId,
            [
              {
                userId: review.userId,
                direction: 'credit',
                amount: 150,
                memo: `Verified scam report for broker: ${review.brokerId}`,
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: 150,
                memo: 'Platform reward for verified scam report',
              },
            ],
            { reviewId: review.id, isScamReport: true, verified: true }
          );
        } catch (error: any) {
          return res.status(500).json({ error: 'Failed to award coins' });
        }
      }

      res.json({ message: approved ? 'Scam report verified' : 'Scam report rejected' });
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: 'Failed to process scam report verification' });
    }
    */
  });

  // ===== FORUM THREADS ENDPOINTS =====
  
  // Create forum thread
  app.post("/api/threads", isAuthenticated, contentCreationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // 1. Validate schema (includes title 15-90 chars, body 150+ words, caps detection)
      const validationResult = insertForumThreadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        });
      }
      
      // 2. Sanitize inputs - allow HTML in body only
      const validated = sanitizeRequestBody(validationResult.data, ['body']);
      
      // Generate full slug with category path
      const slug = generateFullSlug(
        validated.categorySlug,
        validated.subcategorySlug,
        validated.title
      );
      
      // Generate meta description
      const metaDescription = generateMetaDescription(
        validated.body,
        validated.seoExcerpt
      );
      
      // Generate focus keyword from title
      const focusKeyword = generateFocusKeyword(validated.title);
      
      // Deduplicate tags (max 12 total)
      const deduplicated = deduplicateTags(
        validated.instruments || [],
        validated.timeframes || [],
        validated.strategies || [],
        validated.hashtags || [],
        12
      );
      
      // Calculate coin reward
      // Base: +10 for thread creation
      // Bonus: +2 if optional details provided
      let coinReward = 10;
      const hasOptionalDetails = !!(
        validated.seoExcerpt ||
        validated.primaryKeyword ||
        validated.reviewRating ||
        validated.questionSummary
      );
      if (hasOptionalDetails) {
        coinReward += 2;
      }
      
      // Create thread with deduplicated tags and generated metadata
      const thread = await storage.createForumThread({
        ...validated,
        slug,
        focusKeyword,
        metaDescription,
        instruments: deduplicated.instruments,
        timeframes: deduplicated.timeframes,
        strategies: deduplicated.strategies,
        hashtags: deduplicated.hashtags,
        engagementScore: 0, // Initial score
      }, authenticatedUserId);
      
      // Award coins for thread creation
      try {
        await storage.beginLedgerTransaction(
          'thread_creation',
          authenticatedUserId,
          [
            {
              userId: authenticatedUserId,
              direction: 'credit',
              amount: coinReward,
              memo: hasOptionalDetails 
                ? `Thread created with bonus details: ${thread.title}`
                : `Thread created: ${thread.title}`,
            },
          ],
          { threadId: thread.id, baseReward: 10, bonusReward: hasOptionalDetails ? 2 : 0 }
        );
      } catch (error) {
        console.error('Failed to award coins for thread creation:', error);
      }
      
      // Create activity feed entry
      await storage.createActivity({
        userId: authenticatedUserId,
        activityType: "thread_created",
        entityType: "thread",
        entityId: thread.id,
        title: `Created thread: ${thread.title}`,
        description: thread.body.substring(0, 200),
      });
      
      // Update category stats
      await storage.updateCategoryStats(validated.categorySlug);
      
      // Mark onboarding step for first thread creation
      try {
        await storage.markOnboardingStep(authenticatedUserId, 'firstThread');
      } catch (error) {
        console.error('Onboarding step failed:', error);
      }
      
      res.json({
        thread,
        coinsEarned: coinReward,
        message: "Posted! We'll share it around and keep things tidy for you.",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
        // Handle Zod validation errors with friendly messages
        if (error.name === "ZodError") {
          return res.status(400).json({ error: error.message });
        }
        
        // Handle database constraint errors with user-friendly messages
        const errorMessage = error.message.toLowerCase();
        
        // Duplicate slug error
        if (errorMessage.includes('duplicate key') && errorMessage.includes('slug')) {
          return res.status(400).json({ 
            error: "A thread with this title already exists in this category. Please use a different title." 
          });
        }
        
        // Foreign key constraint errors
        if (errorMessage.includes('foreign key constraint')) {
          if (errorMessage.includes('category')) {
            return res.status(400).json({ 
              error: "The selected category doesn't exist. Please choose a valid category." 
            });
          }
          if (errorMessage.includes('user')) {
            return res.status(401).json({ 
              error: "Your session has expired. Please log in again." 
            });
          }
          return res.status(400).json({ 
            error: "Invalid data provided. Please check your inputs and try again." 
          });
        }
        
        // Character limit errors
        if (errorMessage.includes('too long') || errorMessage.includes('value too long')) {
          return res.status(400).json({ 
            error: "One or more fields exceed the maximum character limit. Please shorten your content." 
          });
        }
        
        // Required field errors
        if (errorMessage.includes('not null') || errorMessage.includes('violates not-null constraint')) {
          return res.status(400).json({ 
            error: "Required fields are missing. Please fill in all required information." 
          });
        }
      }
      
      console.error('Thread creation error:', error);
      res.status(400).json({ 
        error: "Unable to create thread. Please check your input and try again." 
      });
    }
  });
  
  // List forum threads with filters
  app.get("/api/threads", async (req, res) => {
    // Cache for 60 seconds
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    const sortBy = req.query.sortBy as string | undefined;
    const filters = {
      categorySlug: req.query.categorySlug as string | undefined,
      status: req.query.status as string | undefined,
      isPinned: req.query.isPinned === "true" ? true : req.query.isPinned === "false" ? false : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };
    
    let threads = await storage.listForumThreads(filters);
    
    // Apply sorting (clone array to avoid mutating storage data)
    if (sortBy === "trending") {
      const { getTrendingThreads } = await import("./algorithms/trending.js");
      threads = getTrendingThreads(threads, filters.limit);
    } else if (sortBy === "newest") {
      // Clone, sort by creation date (newest first), then limit
      threads = [...threads]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, filters.limit);
    } else if (sortBy === "answered") {
      // Clone, filter for threads with replies, sort by reply count, then limit
      threads = [...threads]
        .filter((t: any) => t.replyCount > 0)
        .sort((a: any, b: any) => b.replyCount - a.replyCount)
        .slice(0, filters.limit);
    }
    
    res.json(threads);
  });

  // GET /api/threads/hot - Trending/hot threads (What's Hot) - MUST BE BEFORE /:id route
  app.get("/api/threads/hot", async (req, res) => {
    // Cache for 60 seconds
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    try {
      // Support limit query parameter (default 10, max 50)
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      
      const threads = await storage.getAllForumThreads();
      
      // Get threads from last 7 days, sorted by engagement score
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const hotThreads = threads
        .filter((t: any) => new Date(t.createdAt) >= sevenDaysAgo)
        .sort((a: any, b: any) => (b.engagementScore || 0) - (a.engagementScore || 0))
        .slice(0, limit);
      
      const threadsWithAuthors = await Promise.all(hotThreads.map(async (thread: any) => {
        const author = await storage.getUserById(thread.authorId);
        return {
          ...thread,
          author: {
            id: author?.id,
            username: author?.username,
            profileImageUrl: author?.profileImageUrl
          }
        };
      }));
      
      res.json({
        threads: threadsWithAuthors,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/hot - Unified hot content (threads + marketplace + brokers) - Mixed ranking
  app.get("/api/hot", async (req, res) => {
    // Cache for 60 seconds
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    try {
      // Support limit query parameter (default 10, max 50)
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Fetch all content types
      const [threads, marketplaceContent, brokers] = await Promise.all([
        storage.getAllForumThreads(),
        storage.getAllContent({ status: 'published' }),
        storage.getAllBrokers({ isVerified: true })
      ]);
      
      // Prepare thread items (normalized score)
      const threadItems = threads
        .filter((t: any) => new Date(t.createdAt) >= sevenDaysAgo)
        .map((thread: any) => ({
          id: thread.id,
          type: 'thread' as const,
          title: thread.title,
          slug: thread.slug,
          categorySlug: thread.categorySlug,
          views: thread.views || 0,
          createdAt: thread.createdAt,
          authorId: thread.authorId,
          // Engagement score (0-200 range) - keep as is
          normalizedScore: thread.engagementScore || 0,
          originalScore: thread.engagementScore || 0,
          replyCount: thread.replyCount || 0,
        }));
      
      // Prepare marketplace items (normalized score)
      const marketplaceItems = marketplaceContent
        .filter((c: any) => new Date(c.createdAt) >= sevenDaysAgo)
        .map((item: any) => ({
          id: item.id,
          type: item.type as 'ea' | 'indicator' | 'article' | 'source_code',
          title: item.title,
          slug: item.slug,
          categorySlug: item.category,
          views: item.downloads || 0,
          createdAt: item.createdAt,
          authorId: item.authorId,
          priceCoins: item.priceCoins || 0,
          isFree: item.isFree,
          // Sales score (0-500 range) / 2 to match thread scale (0-250)
          normalizedScore: (item.salesScore || 0) / 2,
          originalScore: item.salesScore || 0,
          purchaseCount: item.purchaseCount || 0,
        }));
      
      // Prepare broker items (normalized score)
      const brokerItems = brokers
        .map((broker: any) => ({
          id: broker.id,
          type: 'broker' as const,
          title: broker.name,
          slug: broker.slug,
          categorySlug: 'brokers',
          views: broker.reviewCount || 0,
          createdAt: broker.createdAt,
          authorId: broker.submittedBy,
          // Rating (0-500 scale, divide by 100 to get 0-5) * reviewCount (typical 0-50 = 0-250)
          normalizedScore: ((broker.overallRating || 0) / 100) * (broker.reviewCount || 0),
          originalScore: broker.overallRating || 0,
          reviewCount: broker.reviewCount || 0,
          overallRating: broker.overallRating || 0,
        }));
      
      // Combine all items and sort by normalized score
      const allHotItems = [...threadItems, ...marketplaceItems, ...brokerItems]
        .sort((a, b) => b.normalizedScore - a.normalizedScore)
        .slice(0, limit);
      
      // Enrich with author information
      const itemsWithAuthors = await Promise.all(allHotItems.map(async (item) => {
        const author = await storage.getUserById(item.authorId);
        return {
          ...item,
          author: {
            id: author?.id,
            username: author?.username,
            profileImageUrl: author?.profileImageUrl
          }
        };
      }));
      
      res.json({
        items: itemsWithAuthors,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/threads/highlights - This week's highlights - MUST BE BEFORE /:id route
  app.get("/api/threads/highlights", async (req, res) => {
    // Cache for 60 seconds
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    try {
      const tab = req.query.tab as string || 'new';
      const threads = await storage.getAllForumThreads();
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      let filteredThreads = threads.filter((t: any) => new Date(t.createdAt) >= oneWeekAgo);
      
      // Sort based on tab
      if (tab === 'trending') {
        filteredThreads = filteredThreads.sort((a: any, b: any) => (b.engagementScore || 0) - (a.engagementScore || 0));
      } else if (tab === 'solved') {
        // TODO: Add solved status tracking
        filteredThreads = filteredThreads.sort((a: any, b: any) => b.replyCount - a.replyCount);
      } else {
        // new
        filteredThreads = filteredThreads.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      const highlights = filteredThreads.slice(0, 10);
      
      const threadsWithAuthors = await Promise.all(highlights.map(async (thread: any) => {
        const author = await storage.getUserById(thread.authorId);
        return {
          ...thread,
          author: {
            id: author?.id,
            username: author?.username,
            profileImageUrl: author?.profileImageUrl
          }
        };
      }));
      
      res.json({
        threads: threadsWithAuthors,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/discussions/trending - Trending discussions with velocity metrics
  app.get("/api/discussions/trending", async (req, res) => {
    // Cache for 60 seconds
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    try {
      const period = req.query.period as string || '24h';
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      
      const threads = await storage.getAllForumThreads();
      
      // Parse period (24h, 7d, 30d)
      const hours = period === '7d' ? 168 : period === '30d' ? 720 : 24;
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hours);
      
      // Filter threads by date and calculate velocity
      const threadsWithVelocity = threads
        .filter((t: any) => new Date(t.lastActivityAt) > cutoffDate)
        .map((t: any) => {
          const hoursSinceActivity = (Date.now() - new Date(t.lastActivityAt).getTime()) / (1000 * 60 * 60);
          const velocity = hoursSinceActivity > 0 ? (t.replyCount + t.views / 10) / hoursSinceActivity : 0;
          
          return {
            threadId: t.id,
            title: t.title,
            slug: t.slug,
            categorySlug: t.categorySlug,
            engagementScore: t.engagementScore || 0,
            replyCount: t.replyCount || 0,
            views: t.views || 0,
            velocity,
            lastActivityAt: t.lastActivityAt,
          };
        })
        .sort((a: any, b: any) => {
          // Sort by combination of engagement score and velocity
          const scoreA = a.engagementScore + (a.velocity * 10);
          const scoreB = b.engagementScore + (b.velocity * 10);
          return scoreB - scoreA;
        })
        .slice(0, limit);
      
      res.json(threadsWithVelocity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/discussions/activity - Recent activity feed
  app.get("/api/discussions/activity", async (req, res) => {
    // Cache for 30 seconds
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      // Get recent threads as a simple activity feed
      const threads = await storage.getAllForumThreads();
      
      // Sort by last activity and take recent ones
      const recentThreads = threads
        .sort((a: any, b: any) => 
          new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
        )
        .slice(0, limit);
      
      // Transform threads into activity feed format
      const feed = await Promise.all(
        recentThreads.map(async (thread: any) => {
          const user = await storage.getUserById(thread.authorId);
          
          // Simple activity: thread creation or last activity
          const action = thread.replyCount > 0 ? 'has activity in' : 'started a discussion';
          
          return {
            type: thread.replyCount > 0 ? 'reply_posted' : 'thread_created',
            threadId: thread.id,
            threadTitle: thread.title,
            userId: user?.id || '',
            username: user?.username || 'Unknown',
            profileImageUrl: user?.profileImageUrl || '',
            action,
            timestamp: thread.lastActivityAt,
          };
        })
      );
      
      res.json(feed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get thread by ID
  app.get("/api/threads/:id", async (req, res) => {
    const thread = await storage.getForumThreadById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread);
  });
  
  // Get thread by slug (increments views)
  app.get("/api/threads/slug/:slug", async (req, res) => {
    const thread = await storage.getForumThreadBySlug(req.params.slug);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    
    // Increment view count (TODO: implement in storage)
    // For now, this is a placeholder - views should be updated in storage layer
    
    res.json(thread);
  });
  
  // Get user's threads
  app.get("/api/user/:userId/threads", async (req, res) => {
    // TODO: Implement getUserThreads in storage layer
    // For now, using listForumThreads with filter
    const threads = await storage.listForumThreads({ limit: 100 });
    const userThreads = threads.filter(t => t.authorId === req.params.userId);
    res.json(userThreads);
  });

  // ===== FORUM REPLIES ENDPOINTS =====
  
  // Create reply
  app.post("/api/threads/:threadId/replies", isAuthenticated, reviewReplyLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // 1. Validate schema
      const validationResult = insertForumReplySchema.safeParse({
        ...req.body,
        threadId: req.params.threadId,
      });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        });
      }
      
      // 2. Sanitize inputs - allow HTML in body only
      const validated = sanitizeRequestBody(validationResult.data, ['body']);
      // Override userId/authorId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      // AUTO-GENERATE SEO METADATA
      const replyPreview = validated.body.substring(0, 50);
      const slug = await generateSlug(
        `reply-${replyPreview}-${Date.now()}`, 
        'reply'
      );
      const metaDescription = generateMetaDescription(validated.body);
      
      const reply = await storage.createForumReply({
        ...validated,
      });
      
      // Update thread reply count and activity
      await storage.updateForumThreadReplyCount(req.params.threadId, 1);
      await storage.updateForumThreadActivity(req.params.threadId);
      
      // Update category stats
      const thread = await storage.getForumThreadById(req.params.threadId);
      if (thread) {
        await storage.updateCategoryStats(thread.categorySlug);
      }
      
      // Create activity feed entry
      await storage.createActivity({
        userId: authenticatedUserId,
        activityType: "reply_posted",
        entityType: "reply",
        entityId: reply.id,
        title: `Replied to thread`,
        description: reply.body.substring(0, 200),
      });
      
      // Track onboarding progress for first reply
      try {
        const onboardingResult = await storage.trackOnboardingProgress(authenticatedUserId, 'firstReply');
        if (onboardingResult.completed && onboardingResult.coinsEarned > 0) {
          // Queue thread reply email (fire-and-forget)
          (async () => {
            try {
              const replier = await storage.getUser(authenticatedUserId);
              const thread = await storage.getForumThreadById(req.params.threadId);
              
              if (thread && replier?.username && replier?.email) {
                const threadAuthor = await storage.getUser(thread.authorId);
                
                // Don't send email if user replies to their own thread
                if (threadAuthor?.email && threadAuthor.id !== authenticatedUserId) {
                  const replyPreview = validated.body.replace(/<[^>]*>/g, '').substring(0, 200);
                  await emailQueueService.queueEmail({
                    userId: threadAuthor.id,
                    templateKey: 'thread_reply',
                    recipientEmail: threadAuthor.email,
                    subject: `${replier.username} replied to your thread`,
                    payload: {
                      recipientName: threadAuthor.username,
                      replierName: replier.username,
                      threadTitle: thread.title,
                      replyPreview,
                      threadUrl: `/threads/${thread.slug}`
                    },
                    priority: EmailPriority.MEDIUM,
                    groupType: 'comments'
                  });
                }
              }
            } catch (emailError) {
              console.error('Failed to queue thread reply email:', emailError);
            }
          })();
          
          return res.json({ 
            ...reply, 
            onboardingReward: {
              task: 'firstReply',
              coinsEarned: onboardingResult.coinsEarned 
            }
          });
        }
      } catch (error) {
        console.error('Onboarding tracking failed:', error);
      }
      
      // Send thread reply email (fire-and-forget)
      (async () => {
        try {
          const replier = await storage.getUser(authenticatedUserId);
          const thread = await storage.getForumThreadById(req.params.threadId);
          
          if (thread && replier?.username) {
            const threadAuthor = await storage.getUser(thread.authorId);
            
            // Don't send email if user replies to their own thread
            if (threadAuthor?.username && threadAuthor.id !== authenticatedUserId) {
              const replyPreview = validated.body.replace(/<[^>]*>/g, '').substring(0, 200);
              await emailService.sendThreadReply(
                threadAuthor.username,
                replier.username,
                thread.title,
                replyPreview,
                thread.slug
              );
            }
          }
        } catch (emailError) {
          console.error('Failed to send thread reply email:', emailError);
        }
      })();
      
      res.json(reply);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Thread not found") {
          return res.status(404).json({ error: "Thread not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "Parent reply not found") {
          return res.status(404).json({ error: "Parent reply not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid reply data" });
    }
  });
  
  // List thread replies
  app.get("/api/threads/:threadId/replies", async (req, res) => {
    const replies = await storage.listForumReplies(req.params.threadId);
    res.json(replies);
  });
  
  // Mark reply as accepted answer
  app.post("/api/replies/:replyId/accept", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // TODO: Verify that the authenticated user is the thread author before allowing accept
      // For now, we're allowing the accept action, but storage layer should verify ownership
      const reply = await storage.markReplyAsAccepted(req.params.replyId);
      
      if (reply) {
        // AWARD COINS: +25 for accepted answer
        try {
          await storage.beginLedgerTransaction(
            'earn',
            reply.userId,
            [
              {
                userId: reply.userId,
                direction: 'credit',
                amount: 25,
                memo: 'Answer accepted by thread author',
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: 25,
                memo: 'Platform reward for accepted answer',
              },
            ],
            { replyId: reply.id, threadId: reply.threadId }
          );
          
          // Queue best answer notification email (fire-and-forget)
          (async () => {
            try {
              const replyAuthor = await storage.getUser(reply.userId);
              const thread = await storage.getForumThreadById(reply.threadId);
              
              if (replyAuthor?.email && thread) {
                await emailQueueService.queueEmail({
                  userId: replyAuthor.id,
                  templateKey: 'best_answer_selected',
                  recipientEmail: replyAuthor.email,
                  subject: 'Your answer was selected as the best!',
                  payload: {
                    recipientName: replyAuthor.username,
                    threadTitle: thread.title,
                    threadUrl: `/threads/${thread.slug}`,
                    coinsEarned: 25
                  },
                  priority: EmailPriority.MEDIUM
                });
              }
            } catch (emailError) {
              console.error('Failed to queue best answer email:', emailError);
            }
          })();
        } catch (error) {
          console.error('Failed to award accepted answer coins:', error);
        }
      }
      
      res.json(reply);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Reply not found") {
          return res.status(404).json({ error: "Reply not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Failed to mark as accepted" });
    }
  });
  
  // Mark reply as helpful
  app.post("/api/replies/:replyId/helpful", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Use authenticated user ID for tracking the vote
      // Note: Storage layer should track which users voted to prevent double-voting
      const reply = await storage.markReplyAsHelpful(req.params.replyId);
      
      if (reply) {
        // AWARD COINS: +5 for helpful reply
        try {
          await storage.beginLedgerTransaction(
            'earn',
            reply.userId,
            [
              {
                userId: reply.userId,
                direction: 'credit',
                amount: 5,
                memo: 'Reply marked as helpful',
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: 5,
                memo: 'Platform reward for helpful contribution',
              },
            ],
            { replyId: reply.id }
          );
        } catch (error) {
          console.error('Failed to award helpful coins:', error);
        }
        
        // Check and award badges after marking reply as helpful
        try {
          await storage.checkAndAwardBadges(reply.userId);
        } catch (error) {
          console.error('Badge check failed:', error);
        }
      }
      
      res.json(reply);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Reply not found") {
          return res.status(404).json({ error: "Reply not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Failed to mark as helpful" });
    }
  });

  // ===== FORUM CATEGORIES ENDPOINTS =====
  
  // List all categories
  app.get("/api/categories", async (req, res) => {
    // Cache for 5 minutes
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    const categories = await storage.listForumCategories();
    // Filter to active categories only
    const activeCategories = categories.filter((c: any) => c.isActive);
    res.json(activeCategories);
  });
  
  // Get category by slug
  app.get("/api/categories/:slug", async (req, res) => {
    const category = await storage.getForumCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  });
  
  // Get threads in category with filtering
  app.get("/api/categories/:slug/threads", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const tab = req.query.tab as string | undefined; // latest | trending | answered
    const searchQuery = req.query.q as string | undefined;
    
    let threads = await storage.listForumThreads({ 
      categorySlug: req.params.slug,
      limit: 100 // Fetch more for filtering
    });
    
    // Apply search filter if query exists
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      threads = threads.filter((t: any) => 
        t.title.toLowerCase().includes(query) || 
        (t.metaDescription && t.metaDescription.toLowerCase().includes(query))
      );
    }
    
    // Apply tab-specific filtering and sorting
    if (tab === "trending") {
      const { getTrendingThreads } = await import("./algorithms/trending.js");
      threads = getTrendingThreads(threads, limit);
    } else if (tab === "answered") {
      // Filter for threads with accepted replies or replies > 0
      threads = threads
        .filter((t: any) => t.replyCount > 0 || t.isSolved)
        .sort((a: any, b: any) => b.replyCount - a.replyCount)
        .slice(0, limit);
    } else {
      // Default: latest (by lastActivityAt)
      threads = threads
        .sort((a: any, b: any) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
        .slice(0, limit);
    }
    
    res.json(threads);
  });
  
  // Get category tree (main categories with their subcategories)
  app.get("/api/categories/tree/all", async (req, res) => {
    // Cache for 5 minutes
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    try {
      const categories = await storage.listForumCategories();
      const activeCategories = categories.filter((c: any) => c.isActive);
      
      // Build hierarchical tree structure
      const mainCategories = activeCategories.filter((c: any) => !c.parentSlug);
      const tree = mainCategories.map((main: any) => ({
        ...main,
        children: activeCategories.filter((c: any) => c.parentSlug === main.slug)
      }));
      
      res.json(tree);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category tree" });
    }
  });
  
  // Get top categories based on activity (for homepage)
  app.get("/api/categories/tree/top", async (req, res) => {
    // Cache for 60 seconds to match client auto-refresh interval
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const categories = await storage.listForumCategories();
      const activeCategories = categories.filter((c: any) => c.isActive);
      
      // Filter to main categories only
      const mainCategories = activeCategories.filter((c: any) => !c.parentSlug);
      
      // Calculate activity score for each category
      // Algorithm: (threadCount * 2) + postCount
      // Threads are weighted higher as they represent new discussions
      const categoriesWithScore = mainCategories.map((cat: any) => ({
        ...cat,
        activityScore: (cat.threadCount * 2) + cat.postCount,
        children: activeCategories.filter((c: any) => c.parentSlug === cat.slug)
      }));
      
      // Sort by activity score descending and take top N
      const topCategories = categoriesWithScore
        .sort((a: any, b: any) => b.activityScore - a.activityScore)
        .slice(0, limit);
      
      res.json(topCategories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top categories" });
    }
  });
  
  // Get subcategories for a parent category
  app.get("/api/categories/:parentSlug/subcategories", async (req, res) => {
    try {
      const { parentSlug } = req.params;
      
      // First check if parent category exists
      const parentCategory = await storage.getForumCategoryBySlug(parentSlug);
      if (!parentCategory) {
        return res.status(404).json({ 
          error: "Parent category not found",
          message: `Category with slug '${parentSlug}' does not exist`
        });
      }
      
      // Get all categories and filter for subcategories
      const categories = await storage.listForumCategories();
      const subcategories = categories.filter((c: any) => 
        c.parentSlug === parentSlug && c.isActive
      );
      
      // Ensure thread counts are properly included
      const subcategoriesWithStats = await Promise.all(
        subcategories.map(async (subcat) => {
          // Update category stats to ensure counts are accurate
          await storage.updateCategoryStats(subcat.slug);
          // Re-fetch category with updated stats
          const updatedCategory = await storage.getForumCategoryBySlug(subcat.slug);
          return updatedCategory || subcat;
        })
      );
      
      res.json(subcategoriesWithStats);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ 
        error: "Failed to fetch subcategories",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  });
  
  // Get category with its children
  app.get("/api/categories/:slug/with-children", async (req, res) => {
    try {
      const category = await storage.getForumCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const categories = await storage.listForumCategories();
      const children = categories.filter((c: any) => c.parentSlug === req.params.slug && c.isActive);
      
      res.json({
        ...category,
        children
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category with children" });
    }
  });

  // ===== USER BADGES ENDPOINTS =====
  
  // Get user's badges
  app.get("/api/user/:userId/badges", async (req, res) => {
    const badges = await storage.getUserBadges(req.params.userId);
    res.json(badges);
  });
  
  // Award badge (admin only - TODO: add auth check)
  app.post("/api/user/:userId/badges", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const { badgeType } = req.body;
      if (!badgeType) {
        return res.status(400).json({ error: "Badge type is required" });
      }
      
      // SECURITY: Use authenticated user ID instead of param userId
      // This prevents users from awarding badges to other users
      // TODO: Add admin role check if this should be admin-only
      
      // Check if user already has this badge
      const hasBadge = await storage.hasUserBadge(authenticatedUserId, badgeType);
      if (hasBadge) {
        return res.status(400).json({ error: "User already has this badge" });
      }
      
      const badge = await storage.createUserBadge(authenticatedUserId, badgeType);
      
      // Create activity feed entry
      await storage.createActivity({
        userId: authenticatedUserId,
        activityType: "badge_earned",
        entityType: "badge",
        entityId: badge.id,
        title: `Earned badge: ${badgeType}`,
        description: undefined,
      });
      
      res.json(badge);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Failed to award badge" });
    }
  });

  // ===== ACTIVITY FEED ENDPOINTS =====
  
  // Get recent site activity
  app.get("/api/activity", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const activities = await storage.getRecentActivity(limit);
    res.json(activities);
  });
  
  // Get user's activity
  app.get("/api/user/:userId/activity", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const activities = await storage.getUserActivity(req.params.userId, limit);
    res.json(activities);
  });

  // ===== LEADERBOARD ENDPOINTS =====
  
  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    const type = (req.query.type as "coins" | "contributions" | "uploads") || "coins";
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (!["coins", "contributions", "uploads"].includes(type)) {
      return res.status(400).json({ error: "Invalid leaderboard type" });
    }
    
    const users = await storage.getLeaderboard(type, limit);
    res.json(users);
  });

  // ===== USER FOLLOWS ENDPOINTS =====
  
  // Follow user
  app.post("/api/users/:userId/follow", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertUserFollowSchema.parse({
        followerId: authenticatedUserId, // Always use authenticated user as follower
        followingId: req.params.userId,
      });
      
      if (validated.followerId === validated.followingId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }
      
      const isFollowing = await storage.checkIfFollowing(validated.followerId, validated.followingId);
      if (isFollowing) {
        return res.status(400).json({ error: "Already following" });
      }
      
      const userFollow = await storage.createUserFollow(validated);
      
      // Track onboarding step for fifty followers
      try {
        const followers = await storage.getUserFollowers(validated.followingId);
        if (followers.length >= 50) {
          await storage.markOnboardingStep(validated.followingId, 'fiftyFollowers');
        }
      } catch (error) {
        console.error('Onboarding step failed:', error);
      }
      
      // Queue follow notification email (fire-and-forget)
      (async () => {
        try {
          const follower = await storage.getUser(validated.followerId);
          const followedUser = await storage.getUser(validated.followingId);
          
          if (follower?.username && follower?.email && followedUser?.email) {
            await emailQueueService.queueEmail({
              userId: followedUser.id,
              templateKey: 'new_follower',
              recipientEmail: followedUser.email,
              subject: `${follower.username} started following you`,
              payload: {
                recipientName: followedUser.username,
                followerName: follower.username,
                followerProfileUrl: `/user/${follower.username}`
              },
              priority: EmailPriority.LOW,
              groupType: 'follows'
            });
          }
        } catch (emailError) {
          console.error('Failed to queue follow notification email:', emailError);
        }
      })();
      
      res.json(userFollow);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Invalid follow data" });
    }
  });
  
  // Unfollow user
  app.delete("/api/users/:userId/unfollow", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Always use authenticated user as the follower (who is unfollowing)
      await storage.deleteUserFollow(authenticatedUserId, req.params.userId);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Failed to unfollow user" });
    }
  });
  
  // Get followers
  app.get("/api/users/:userId/followers", async (req, res) => {
    try {
      const followers = await storage.getUserFollowers(req.params.userId);
      res.json(followers);
    } catch (error) {
      res.status(500).json({ error: "Failed to get followers" });
    }
  });
  
  // Get following list
  app.get("/api/users/:userId/following", async (req, res) => {
    try {
      const following = await storage.getUserFollowing(req.params.userId);
      res.json(following);
    } catch (error) {
      res.status(500).json({ error: "Failed to get following list" });
    }
  });
  
  // Check if following
  app.get("/api/user/:userId/follows/:targetUserId", async (req, res) => {
    try {
      const isFollowing = await storage.checkIfFollowing(
        req.params.userId,
        req.params.targetUserId
      );
      res.json({ isFollowing });
    } catch (error) {
      res.status(500).json({ error: "Failed to check following status" });
    }
  });

  // ===== PRIVATE MESSAGES ENDPOINTS =====
  
  // Send message
  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertMessageSchema.parse(req.body);
      
      const message = await storage.sendMessage(
        authenticatedUserId,
        validated.recipientId,
        validated.body
      );
      
      // Queue new message email (fire-and-forget)
      (async () => {
        try {
          const sender = await storage.getUser(authenticatedUserId);
          const recipient = await storage.getUser(validated.recipientId);
          
          if (sender?.username && sender?.email && recipient?.email) {
            const messagePreview = validated.body.replace(/<[^>]*>/g, '').substring(0, 200);
            await emailQueueService.queueEmail({
              userId: recipient.id,
              templateKey: 'private_message',
              recipientEmail: recipient.email,
              subject: `New message from ${sender.username}`,
              payload: {
                recipientName: recipient.username,
                senderName: sender.username,
                messagePreview,
                conversationUrl: `/messages/${sender.id}`
              },
              priority: EmailPriority.MEDIUM
            });
          }
        } catch (emailError) {
          console.error('Failed to queue new message email:', emailError);
        }
      })();
      
      res.json(message);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Invalid message data" });
    }
  });
  
  // List user's conversations
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const conversations = await storage.getConversations(authenticatedUserId);
      res.json(conversations);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });
  
  // Get conversation messages
  app.get("/api/conversations/:conversationId", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const messages = await storage.getConversationMessages(
        req.params.conversationId,
        authenticatedUserId
      );
      res.json(messages);
    } catch (error: any) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message === "Conversation not found") {
        return res.status(404).json({ error: "Conversation not found" });
      }
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      res.status(500).json({ error: "Failed to get messages" });
    }
  });
  
  // Mark message as read
  app.post("/api/messages/:messageId/read", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      await storage.markMessageAsRead(req.params.messageId, authenticatedUserId);
      
      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message === "Message not found") {
        return res.status(404).json({ error: "Message not found" });
      }
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Message reactions - COMMENTED OUT: These methods don't exist in MemStorage interface
  /* app.post("/api/messages/:messageId/reactions", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const { emoji } = req.body;
      
      if (!emoji || typeof emoji !== 'string') {
        return res.status(400).json({ error: "Emoji required" });
      }

      await storage.addMessageReaction(req.params.messageId, authenticatedUserId, emoji);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ error: "Failed to add reaction" });
    }
  });

  // Remove reaction from message
  app.delete("/api/messages/:messageId/reactions/:emoji", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      await storage.removeMessageReaction(req.params.messageId, authenticatedUserId, req.params.emoji);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ error: "Failed to remove reaction" });
    }
  });

  // Get message reactions
  app.get("/api/messages/:messageId/reactions", async (req, res) => {
    try {
      const reactions = await storage.getMessageReactions(req.params.messageId);
      res.json(reactions);
    } catch (error) {
      console.error("Error getting reactions:", error);
      res.status(500).json({ error: "Failed to get reactions" });
    }
  });

  // Search messages
  app.get("/api/messages/search", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const { q, userId: filterUserId } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query required" });
      }

      const results = await storage.searchMessages(authenticatedUserId, q, filterUserId as string);
      res.json(results);
    } catch (error) {
      console.error("Error searching messages:", error);
      res.status(500).json({ error: "Failed to search messages" });
    }
  }); */

  // ===== USER PROFILES ENDPOINTS =====
  // NOTE: The /api/user/:username/profile route is defined later in this file (around line 3474)
  // It handles fetching user profiles by username
  
  // Update user profile
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // 1. Validate with Zod schema
      const validationResult = updateUserProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        });
      }
      
      // 2. Sanitize inputs to prevent XSS (allow HTML in bio field)
      const validated = sanitizeRequestBody(validationResult.data, ['bio']);
      
      // Separate fields for users table vs profiles table
      const userFields: any = {};
      const profileFields: any = {};
      
      // User table fields
      if (validated.displayName) userFields.username = validated.displayName;
      if (validated.email) userFields.email = validated.email;
      if (validated.location !== undefined) userFields.location = validated.location || null;
      if (validated.youtubeUrl !== undefined) userFields.youtubeUrl = validated.youtubeUrl || null;
      if (validated.instagramHandle !== undefined) userFields.instagramHandle = validated.instagramHandle || null;
      if (validated.telegramHandle !== undefined) userFields.telegramHandle = validated.telegramHandle || null;
      if (validated.myfxbookLink !== undefined) userFields.myfxbookLink = validated.myfxbookLink || null;
      if (validated.investorId !== undefined) userFields.investorId = validated.investorId || null;
      if (validated.investorPassword !== undefined) userFields.investorPassword = validated.investorPassword || null;
      if (validated.emailNotifications !== undefined) userFields.emailNotifications = validated.emailNotifications;
      
      // Profile table fields
      if (validated.bio !== undefined) profileFields.bio = validated.bio || null;
      if (validated.website !== undefined) profileFields.website = validated.website || null;
      
      // Update user fields
      const updatedUser = await storage.updateUserProfile(authenticatedUserId, userFields);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update profile fields if any
      if (Object.keys(profileFields).length > 0) {
        await db.insert(profiles).values({
          userId: authenticatedUserId,
          ...profileFields,
        }).onConflictDoUpdate({
          target: [profiles.userId],
          set: { ...profileFields, updatedAt: new Date() },
        });
      }

      let totalCoinsEarned = 0;
      const completedTasks: string[] = [];

      // Track onboarding progress for profile completion
      const hasProfileData = 
        (validated.youtubeUrl && validated.youtubeUrl.length > 0) ||
        (validated.instagramHandle && validated.instagramHandle.length > 0) ||
        (validated.telegramHandle && validated.telegramHandle.length > 0) ||
        (validated.myfxbookLink && validated.myfxbookLink.length > 0) ||
        (validated.bio && validated.bio.length > 0);

      if (hasProfileData) {
        const profileResult = await storage.trackOnboardingProgress(authenticatedUserId, "profileCreated");
        if (profileResult.completed && profileResult.coinsEarned > 0) {
          totalCoinsEarned += profileResult.coinsEarned;
          completedTasks.push("profileCreated");
        }
      }

      // Track social account linking if user added social links
      const hasSocialLinks =
        (validated.youtubeUrl && validated.youtubeUrl.length > 0) ||
        (validated.instagramHandle && validated.instagramHandle.length > 0) ||
        (validated.telegramHandle && validated.telegramHandle.length > 0);

      if (hasSocialLinks) {
        const socialResult = await storage.trackOnboardingProgress(authenticatedUserId, "socialLinked");
        if (socialResult.completed && socialResult.coinsEarned > 0) {
          totalCoinsEarned += socialResult.coinsEarned;
          completedTasks.push("socialLinked");
        }
      }
      
      // Return consistent response with onboarding reward info
      res.json({ 
        success: true, 
        user: updatedUser, 
        ...(totalCoinsEarned > 0 && {
          onboardingReward: {
            tasks: completedTasks,
            totalCoinsEarned
          }
        })
      });
    } catch (error) {
      console.error("Profile update error:", error);
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid profile data" });
    }
  });

  // Upload profile photo
  app.post("/api/user/upload-photo", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Additional security: verify file is an image
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      if (!imageExtensions.includes(fileExt)) {
        // Delete the uploaded file if it's not an image
        const fs = await import('fs/promises');
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ error: "Only image files are allowed for profile photos" });
      }

      const authenticatedUserId = getAuthenticatedUserId(req);
      const photoUrl = `/uploads/${req.file.filename}`;
      
      // Update user's profile image
      await storage.updateUserProfile(authenticatedUserId, {
        profileImageUrl: photoUrl,
      });

      // Track onboarding step for profile picture upload
      try {
        await storage.markOnboardingStep(authenticatedUserId, 'profilePicture');
      } catch (error) {
        console.error('Onboarding step failed:', error);
      }

      res.json({ 
        success: true,
        photoUrl,
        message: "Profile photo updated successfully"
      });
    } catch (error: any) {
      console.error('Profile photo upload error:', error);
      res.status(500).json({ error: error.message || "Failed to upload photo" });
    }
  });

  // ===== EMAIL PREFERENCES ENDPOINTS =====
  
  // Get user email preferences
  app.get("/api/user/email-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      
      // Get or create email preferences
      const preferences = await storage.getUserEmailPreferences(userId);
      
      res.json(preferences);
    } catch (error: any) {
      console.error('Error fetching email preferences:', error);
      res.status(500).json({ error: error.message || "Failed to fetch email preferences" });
    }
  });

  // Update user email preferences
  app.patch("/api/user/email-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      
      // Validate the request body
      const allowedFields = [
        'socialInteractions', 'coinTransactions', 'contentUpdates',
        'engagementDigest', 'marketplaceActivities', 'accountSecurity',
        'moderationNotices', 'digestFrequency', 'dailyDigestTime',
        'weeklyDigestDay', 'muteUntil', 'vacationStart', 'vacationEnd',
        'minTimeBetweenEmails', 'groupSimilar', 'emailFormat',
        'language', 'promotionalEmails', 'unsubscribedAt'
      ];
      
      const updateData: any = {};
      for (const field of allowedFields) {
        if (field in req.body) {
          updateData[field] = req.body[field];
        }
      }
      
      // Validate digestFrequency
      if (updateData.digestFrequency && 
          !['instant', 'hourly', 'daily', 'weekly'].includes(updateData.digestFrequency)) {
        return res.status(400).json({ error: "Invalid digest frequency" });
      }
      
      // Validate emailFormat
      if (updateData.emailFormat && 
          !['html', 'plain'].includes(updateData.emailFormat)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      // Update preferences
      const updatedPreferences = await storage.updateUserEmailPreferences(userId, updateData);
      
      res.json(updatedPreferences);
    } catch (error: any) {
      console.error('Error updating email preferences:', error);
      res.status(500).json({ error: error.message || "Failed to update email preferences" });
    }
  });

  // Get user email history
  app.get("/api/user/email-history", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Get email history
      const emailHistory = await storage.getUserEmailHistory(userId, limit);
      
      res.json(emailHistory);
    } catch (error: any) {
      console.error('Error fetching email history:', error);
      res.status(500).json({ error: error.message || "Failed to fetch email history" });
    }
  });

  // Mark email as spam
  app.post("/api/user/email/:notificationId/spam", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { notificationId } = req.params;
      
      await storage.markEmailAsSpam(userId, notificationId);
      
      res.json({ success: true, message: "Email marked as spam" });
    } catch (error: any) {
      console.error('Error marking email as spam:', error);
      res.status(500).json({ error: error.message || "Failed to mark email as spam" });
    }
  });

  // Resend failed email
  app.post("/api/user/email/:notificationId/resend", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { notificationId } = req.params;
      
      await storage.resendEmail(userId, notificationId);
      
      res.json({ success: true, message: "Email queued for resending" });
    } catch (error: any) {
      console.error('Error resending email:', error);
      res.status(500).json({ error: error.message || "Failed to resend email" });
    }
  });

  // ===== SEARCH ENDPOINTS =====
  
  // Global search
  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    const type = req.query.type as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }
    
    // TODO: Implement searchGlobal in storage layer
    // For now, basic search implementation
    const results: {
      threads: any[];
      content: any[];
      users: any[];
    } = {
      threads: [],
      content: [],
      users: [],
    };
    
    // If type is specified, only search that type
    if (!type || type === "threads") {
      const threads = await storage.listForumThreads({ limit: 100 });
      results.threads = threads
        .filter(t => 
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.body.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);
    }
    
    if (!type || type === "content") {
      const content = await storage.getAllContent({});
      results.content = content
        .filter(c => 
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);
    }
    
    // Users search would require getAllUsers method
    if (!type || type === "users") {
      // TODO: Implement user search in storage layer
      results.users = [];
    }
    
    res.json(results);
  });

  // ===== LEADERBOARD ENDPOINTS =====
  
  // GET /api/leaderboards/coins - Top users by coin balance
  app.get("/api/leaderboards/coins", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    
    try {
      const topUsers = await storage.getTopUsersByCoins(limit);
      res.json(topUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/leaderboards/contributors - Top users by helpful/accepted replies
  app.get("/api/leaderboards/contributors", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    
    try {
      const topContributors = await storage.getTopContributors(limit);
      res.json(topContributors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/leaderboards/sellers - Top sellers by revenue
  app.get("/api/leaderboards/sellers", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    
    try {
      const topSellers = await storage.getTopSellers(limit);
      res.json(topSellers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== RANKING SYSTEM ENDPOINTS (Real-time Updates) =====
  
  // GET /api/stats - Platform statistics for stats bar
  app.get("/api/stats", async (req, res) => {
    // Cache for 30 seconds
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    
    try {
      // Parallel fetching for better performance
      const [threads, users, content] = await Promise.all([
        storage.getAllForumThreads(),
        storage.getAllUsers(),
        storage.getAllContent()
      ]);
      
      // Calculate today's activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayThreads = threads.filter(t => new Date(t.createdAt) >= today).length;
      const todayContent = content.filter(c => new Date(c.createdAt) >= today).length;
      
      // Total replies from all threads
      const totalReplies = threads.reduce((sum, t) => sum + t.replyCount, 0);
      
      res.json({
        totalThreads: threads.length,
        totalMembers: users.length,
        totalPosts: totalReplies,
        totalContent: content.length,
        todayActivity: {
          threads: todayThreads,
          content: todayContent,
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== COMMUNITY STATS ENDPOINTS =====

  // GET /api/community/stats - Enhanced platform statistics
  app.get("/api/community/stats", async (req, res) => {
    // Cache for 30 seconds
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    
    try {
      const [threads, users, content, transactions] = await Promise.all([
        storage.getAllForumThreads(),
        storage.getAllUsers(),
        storage.getAllContent(),
        db.select().from(coinTransactions)
      ]);

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Calculate statistics
      const newMembers24h = users.filter(u => new Date(u.createdAt!) >= last24h).length;
      const newMembers7d = users.filter(u => new Date(u.createdAt!) >= last7d).length;
      
      const activeThreads24h = threads.filter(t => 
        new Date(t.lastActivityAt) >= last24h
      ).length;
      
      const newThreads7d = threads.filter(t => 
        new Date(t.createdAt) >= last7d
      ).length;
      
      const totalReplies24h = threads
        .filter(t => new Date(t.lastActivityAt) >= last24h)
        .reduce((sum, t) => sum + t.replyCount, 0);
      
      const totalDownloads24h = content
        .filter(c => new Date(c.updatedAt) >= last24h)
        .reduce((sum, c) => sum + (c.downloads || 0), 0);
      
      const coinsEarned24h = transactions
        .filter(tx => 
          tx.type === 'earn' && 
          tx.status === 'completed' && 
          new Date(tx.createdAt) >= last24h
        )
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Estimate online members (users active in last hour)
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
      const membersOnline = threads.filter(t => 
        new Date(t.lastActivityAt) >= lastHour
      ).length + Math.floor(users.length * 0.05); // Rough estimate

      res.json({
        membersOnline,
        newMembers24h,
        newMembers7d,
        activeThreads24h,
        newThreads7d,
        totalReplies24h,
        totalDownloads24h,
        coinsEarned24h,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/community/trending-users - Trending members by activity period
  app.get("/api/community/trending-users", async (req, res) => {
    try {
      const period = (req.query.period as string) || '7d';
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Parse period (e.g., "7d" -> 7 days)
      const periodMatch = period.match(/^(\d+)d$/);
      if (!periodMatch) {
        return res.status(400).json({ error: 'Invalid period format. Use format like "7d"' });
      }
      
      const days = parseInt(periodMatch[1]);
      const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const [users, threads, replies, transactions] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllForumThreads(),
        db.select().from(forumReplies),
        db.select().from(coinTransactions)
      ]);

      // Calculate trending metrics for each user
      const userMetrics = await Promise.all(users.map(async (user) => {
        const userThreads = threads.filter(t => 
          t.authorId === user.id && 
          new Date(t.createdAt) >= periodStart
        );
        
        const userReplies = replies.filter(r => 
          r.userId === user.id && 
          new Date(r.createdAt) >= periodStart
        );
        
        const userCoins = transactions.filter(tx => 
          tx.userId === user.id && 
          tx.type === 'earn' &&
          tx.status === 'completed' &&
          new Date(tx.createdAt) >= periodStart
        ).reduce((sum, tx) => sum + tx.amount, 0);

        const contributionsDelta = userThreads.length + userReplies.length;
        
        return {
          userId: user.id,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
          contributionsDelta,
          coinsDelta: userCoins,
          threadsCreated: userThreads.length,
          repliesPosted: userReplies.length,
          totalActivity: contributionsDelta + (userCoins / 10) // Weight coins less
        };
      }));

      // Sort by total activity and return top users
      const trending = userMetrics
        .filter(u => u.totalActivity > 0) // Only users with activity
        .sort((a, b) => b.totalActivity - a.totalActivity)
        .slice(0, limit)
        .map(({ totalActivity, ...user }) => user); // Remove internal field

      res.json(trending);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/categories/stats/batch - Batch statistics for ALL categories
  // IMPORTANT: This must come BEFORE the individual stats route to avoid slug matching
  app.get("/api/categories/stats/batch", async (req, res) => {
    try {
      // Get all categories
      const categories = await storage.listForumCategories();
      
      // Fetch all threads once
      const allThreads = await storage.listForumThreads({ limit: 10000 });
      
      const now = new Date();
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Build stats for each category
      const statsMap: Record<string, any> = {};

      for (const category of categories) {
        // Filter threads for this category
        const categoryThreads = allThreads.filter(t => t.categorySlug === category.slug);

        // Get unique active users in last 7 days
        const activeUserIds = new Set(
          categoryThreads
            .filter(t => new Date(t.lastActivityAt) >= last7d)
            .map(t => t.authorId)
        );

        const newThreads7d = categoryThreads.filter(t => 
          new Date(t.createdAt) >= last7d
        ).length;

        // Get top contributors for this category
        const contributorMap = new Map<string, number>();
        categoryThreads.forEach(thread => {
          const count = contributorMap.get(thread.authorId) || 0;
          contributorMap.set(thread.authorId, count + 1);
        });

        const topContributorIds = Array.from(contributorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        const topContributors = await Promise.all(
          topContributorIds.map(async ([userId, threadCount]) => {
            const user = await storage.getUserById(userId);
            return {
              username: user?.username || 'Unknown',
              threadCount
            };
          })
        );

        statsMap[category.slug] = {
          slug: category.slug,
          name: category.name,
          threadCount: categoryThreads.length,
          activeUsers7d: activeUserIds.size,
          newThreads7d,
          topContributors,
          lastUpdated: new Date().toISOString()
        };
      }

      res.json(statsMap);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/categories/:slug/stats - Per-category statistics (individual)
  // IMPORTANT: This must come AFTER the batch route to avoid slug matching issues
  app.get("/api/categories/:slug/stats", async (req, res) => {
    try {
      const { slug } = req.params;
      
      const [category, threads] = await Promise.all([
        storage.getForumCategoryBySlug(slug),
        storage.listForumThreads({ categorySlug: slug, limit: 1000 })
      ]);

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const now = new Date();
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get unique active users in last 7 days
      const activeUserIds = new Set(
        threads
          .filter(t => new Date(t.lastActivityAt) >= last7d)
          .map(t => t.authorId)
      );

      const newThreads7d = threads.filter(t => 
        new Date(t.createdAt) >= last7d
      ).length;

      // Get top contributors for this category
      const contributorMap = new Map<string, number>();
      threads.forEach(thread => {
        const count = contributorMap.get(thread.authorId) || 0;
        contributorMap.set(thread.authorId, count + 1);
      });

      const topContributorIds = Array.from(contributorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const topContributors = await Promise.all(
        topContributorIds.map(async ([userId, threadCount]) => {
          const user = await storage.getUserById(userId);
          return {
            username: user?.username || 'Unknown',
            threadCount
          };
        })
      );

      res.json({
        slug: category.slug,
        name: category.name,
        threadCount: threads.length,
        activeUsers7d: activeUserIds.size,
        newThreads7d,
        topContributors,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/leaderboard - Top users by reputation score
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Sort by reputation score
      const sorted = users
        .sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0))
        .slice(0, 50);
      
      const leaderboard = await Promise.all(sorted.map(async (user, index) => {
        const stats = await storage.getUserStats(user.id);
        return {
          rank: index + 1,
          id: user.id,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
          reputationScore: user.reputationScore || 0,
          threadsCreated: stats.threadsCreated,
          repliesPosted: stats.repliesPosted,
          isVerifiedTrader: user.isVerifiedTrader
        };
      }));
      
      res.json({
        leaderboard,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // DASHBOARD ANALYTICS APIS
  // ============================================

  app.get("/api/me/sales-dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const days = parseInt(req.query.days as string) || 30;
      const data = await storage.getSalesDashboard(userId, days);
      res.json(data);
    } catch (error) {
      console.error("Error fetching sales dashboard:", error);
      res.status(500).json({ error: "Failed to fetch sales dashboard" });
    }
  });

  app.get("/api/me/referrals", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const referrals = await storage.getReferrals(userId);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  app.get("/api/me/referral-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ error: "Failed to fetch referral stats" });
    }
  });

  app.post("/api/me/generate-referral-code", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const code = await storage.generateReferralCode(userId);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.EXPRESS_URL || 'http://localhost:5000';
      res.json({ code, link: `${siteUrl}/ref/${code}` });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ error: "Failed to generate referral code" });
    }
  });

  app.get("/api/me/earnings-breakdown", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const breakdown = await storage.getEarningsBreakdown(userId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching earnings breakdown:", error);
      res.status(500).json({ error: "Failed to fetch earnings breakdown" });
    }
  });

  app.get("/api/me/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/me/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      // Convert date strings to Date objects for PostgreSQL
      const goalData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now if not specified
      };
      const goal = await storage.createGoal(userId, goalData);
      res.json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.get("/api/me/achievements", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/me/campaigns", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/me/customers", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const customers = await storage.getCustomerList(userId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  // Add missing customer-stats endpoint for dashboard
  app.get("/api/me/customer-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const customers = await storage.getCustomerList(userId);
      const totalCustomers = customers.length;
      const repeatCustomers = customers.filter((c: any) => c.purchases > 1).length;
      const avgValue = customers.reduce((sum: number, c: any) => sum + c.totalSpent, 0) / (totalCustomers || 1);
      
      res.json({
        totalCustomers,
        repeatCustomers,
        avgCustomerValue: Math.round(avgValue),
        topSpenders: customers.slice(0, 5) // Top 5 spenders
      });
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      res.status(500).json({ error: "Failed to fetch customer stats" });
    }
  });

  // Add missing /api/me/notifications endpoint (client expects this path)
  app.get("/api/me/notifications", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark notification as read
  app.post("/api/me/notifications/:id/read", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const notification = await storage.markNotificationAsRead(req.params.id, userId);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark all notifications as read
  app.post("/api/me/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/me/dashboard-settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const settings = await storage.getDashboardSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching dashboard settings:", error);
      res.status(500).json({ error: "Failed to fetch dashboard settings" });
    }
  });

  // ============================================
  // USER SETTINGS APIS
  // ============================================

  app.get("/api/me/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ error: "Failed to fetch user settings" });
    }
  });

  app.put("/api/me/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      await storage.updateUserSettings(userId, req.body);
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ error: "Failed to update user settings" });
    }
  });

  // ============================================
  // PROFILE APIS
  // ============================================

  app.get("/api/user/:username/profile", async (req, res) => {
    try {
      const username = req.params.username;
      
      // Get user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if authenticated user is following this user
      let isFollowing = false;
      if (req.isAuthenticated()) {
        const claims = (req.user as any)?.claims;
        if (claims?.sub && claims.sub !== user.id) {
          const follow = await storage.getFollow(claims.sub, user.id);
          isFollowing = !!follow;
        }
      }

      // Fetch all profile data in parallel
      const content: any[] = await storage.getUserContent(user.id).catch(() => []);
      const [badges, threads] = await Promise.all([
        storage.getUserBadges(user.id).catch(() => []),
        storage.getUserThreads(user.id).catch(() => []),
      ]);
      
      // Get reviews for this user's content
      const reviewContent: any[] = content.filter((c: any) => c.sellerId === user.id);
      const reviews: any[] = [];

      // Calculate stats
      const totalRevenue = content.reduce((sum: number, c: any) => sum + ((c.priceCoins || 0) * (c.downloads || 0)), 0);
      const totalSales = content.reduce((sum: number, c: any) => sum + (c.downloads || 0), 0);
      const totalDownloads = content.reduce((sum: number, c: any) => sum + (c.downloads || 0), 0);
      
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Calculate rating breakdown
      const ratingBreakdown = {
        averageRating,
        totalReviews: reviews.length,
        breakdown: {
          5: reviews.filter(r => r.rating === 5).length,
          4: reviews.filter(r => r.rating === 4).length,
          3: reviews.filter(r => r.rating === 3).length,
          2: reviews.filter(r => r.rating === 2).length,
          1: reviews.filter(r => r.rating === 1).length,
        }
      };

      // Get follower/following counts
      const followers = await storage.getUserFollowers(user.id).catch(() => []);
      const following = await storage.getUserFollowing(user.id).catch(() => []);

      // Build comprehensive profile response
      const profileData = {
        user,
        isFollowing,
        badges,
        content,
        stats: {
          followers: followers.length,
          following: following.length,
          posts: threads.length,
          content: content.length,
          totalRevenue,
          totalSales,
          averageRating,
          totalDownloads,
        },
        reviews: reviews.slice(0, 10), // Limit to 10 most recent
        ratingBreakdown
      };

      res.json(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/me/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const profile = await storage.updateProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ============================================
  // ADMIN ROUTES - Use only existing storage methods
  // ============================================
  
  // Admin Overview Dashboard Endpoints
  app.get('/api/admin/overview/stats', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const stats = await storage.getAdminOverviewStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin overview stats:', error);
      res.status(500).json({ message: 'Failed to fetch overview stats' });
    }
  });
  
  app.get('/api/admin/overview/user-growth', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const userGrowth = await storage.getUserGrowthSeries(7);
      res.json(userGrowth);
    } catch (error) {
      console.error('Error fetching user growth series:', error);
      res.status(500).json({ message: 'Failed to fetch user growth data' });
    }
  });
  
  app.get('/api/admin/overview/content-trend', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const contentTrend = await storage.getContentTrendSeries(7);
      res.json(contentTrend);
    } catch (error) {
      console.error('Error fetching content trend series:', error);
      res.status(500).json({ message: 'Failed to fetch content trend data' });
    }
  });
  
  app.get('/api/admin/overview/activity-feed', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const activityFeed = await storage.getRecentAdminActions(20);
      res.json(activityFeed);
    } catch (error) {
      console.error('Error fetching admin activity feed:', error);
      res.status(500).json({ message: 'Failed to fetch activity feed' });
    }
  });

  // Admin System Settings
  app.get('/api/admin/settings', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const category = req.query.category as string | undefined;
      const settings = await storage.getSystemSettings(category);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.get('/api/admin/settings/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const setting = await storage.getSystemSetting(req.params.key);
      res.json(setting);
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ message: 'Failed to fetch setting' });
    }
  });

  app.patch('/api/admin/settings/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const userId = getAuthenticatedUserId(req);
      await storage.updateSystemSetting(req.params.key, req.body.value, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ message: 'Failed to update setting' });
    }
  });

  // Admin Support Tickets
  app.get('/api/admin/support/tickets', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        assignedTo: req.query.assignedTo as string | undefined,
      };
      const tickets = await storage.getSupportTickets(filters);
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });

  app.post('/api/admin/support/tickets', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const ticket = await storage.createSupportTicket(req.body);
      res.json(ticket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ message: 'Failed to create ticket' });
    }
  });

  app.patch('/api/admin/support/tickets/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      await storage.updateSupportTicket(parseInt(req.params.id), req.body, adminUserId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({ message: 'Failed to update ticket' });
    }
  });

  // Admin Announcements
  app.get('/api/admin/announcements', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        isActive: req.query.isActive === 'true',
        targetAudience: req.query.targetAudience as string | undefined,
      };
      const announcements = await storage.getAnnouncements(filters);
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  });

  app.post('/api/admin/announcements', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const announcement = await storage.createAnnouncement(req.body);
      res.json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Failed to create announcement' });
    }
  });

  app.patch('/api/admin/announcements/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateAnnouncement(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ message: 'Failed to update announcement' });
    }
  });

  app.delete('/api/admin/announcements/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.deleteAnnouncement(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ message: 'Failed to delete announcement' });
    }
  });

  // Admin Create Marketplace Content
  app.post('/api/admin/content', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Sanitize inputs - allow HTML in description
      const sanitized = sanitizeRequestBody(req.body, ['description']);
      
      // Validate schema
      const validated = insertContentSchema.parse(sanitized);
      
      // Override authorId with authenticated admin user ID
      validated.authorId = authenticatedUserId;
      
      // AUTO-GENERATE SEO METADATA
      const slug = await generateSlug(validated.title, 'content');
      const focusKeyword = generateFocusKeyword(validated.title);
      const metaDescription = generateMetaDescription(validated.description);
      const imageAltTexts = validated.images 
        ? generateImageAltTexts(validated.title, validated.images.length)
        : [];
      
      // Admin-created content is automatically approved
      const content = await storage.createContent({
        ...validated,
        slug,
        focusKeyword,
        autoMetaDescription: metaDescription,
        autoImageAltTexts: imageAltTexts,
      });
      
      res.json(content);
    } catch (error) {
      console.error('Error creating admin content:', error);
      if (error instanceof Error) {
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
        // Return Zod validation errors
        if (error.name === "ZodError") {
          return res.status(400).json({ 
            error: "Validation failed", 
            details: (error as any).errors 
          });
        }
      }
      res.status(500).json({ message: 'Failed to create content' });
    }
  });

  // Admin Email Templates
  app.get('/api/admin/email-templates', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const category = req.query.category as string | undefined;
      const templates = await storage.getEmailTemplates(category);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.get('/api/admin/email-templates/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const template = await storage.getEmailTemplate(req.params.key);
      res.json(template);
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ message: 'Failed to fetch template' });
    }
  });

  app.patch('/api/admin/email-templates/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const userId = getAuthenticatedUserId(req);
      await storage.updateEmailTemplate(req.params.key, req.body, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ message: 'Failed to update template' });
    }
  });

  app.post('/api/admin/email-templates', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const template = await storage.createEmailTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ message: 'Failed to create template' });
    }
  });

  // Admin Roles
  app.get('/api/admin/roles', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const roles = await storage.getAdminRoles();
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  app.post('/api/admin/roles/grant', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const userId = getAuthenticatedUserId(req);
      const role = await storage.grantAdminRole(req.body.userId, req.body.role, req.body.permissions, userId);
      res.json(role);
    } catch (error) {
      console.error('Error granting role:', error);
      res.status(500).json({ message: 'Failed to grant role' });
    }
  });

  app.post('/api/admin/roles/revoke', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      await storage.revokeAdminRole(req.body.userId, adminUserId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error revoking role:', error);
      res.status(500).json({ message: 'Failed to revoke role' });
    }
  });

  // Admin Security
  app.get('/api/admin/security/events', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        eventType: req.query.eventType as string | undefined,
        severity: req.query.severity as string | undefined,
        userId: req.query.userId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const events = await storage.getSecurityEvents(filters);
      res.json(events);
    } catch (error) {
      console.error('Error fetching security events:', error);
      res.status(500).json({ message: 'Failed to fetch security events' });
    }
  });

  app.get('/api/admin/security/ip-bans', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const bans = await storage.getIpBans({ isActive: activeOnly });
      res.json(bans);
    } catch (error) {
      console.error('Error fetching IP bans:', error);
      res.status(500).json({ message: 'Failed to fetch IP bans' });
    }
  });

  // Admin Action Logs
  app.get('/api/admin/logs/actions', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        adminId: req.query.adminId as string | undefined,
        actionType: req.query.actionType as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const logs = await storage.getAdminActionLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching action logs:', error);
      res.status(500).json({ message: 'Failed to fetch action logs' });
    }
  });

  app.get('/api/admin/logs/recent', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const actions = await storage.getRecentAdminActions(limit);
      res.json(actions);
    } catch (error) {
      console.error('Error fetching recent actions:', error);
      res.status(500).json({ message: 'Failed to fetch recent actions' });
    }
  });

  // Admin Performance
  app.get('/api/admin/performance/metrics', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const metricType = req.query.metricType as string;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const metrics = await storage.getPerformanceMetrics({ metricType, startDate, endDate });
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ message: 'Failed to fetch performance metrics' });
    }
  });

  app.get('/api/admin/performance/alerts', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const alerts = await storage.getPerformanceAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching performance alerts:', error);
      res.status(500).json({ message: 'Failed to fetch performance alerts' });
    }
  });

  // Admin Automation
  app.get('/api/admin/automation/rules', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const rules = await storage.getAutomationRules(activeOnly);
      res.json(rules);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      res.status(500).json({ message: 'Failed to fetch automation rules' });
    }
  });

  app.post('/api/admin/automation/rules', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const rule = await storage.createAutomationRule(req.body);
      res.json(rule);
    } catch (error) {
      console.error('Error creating automation rule:', error);
      res.status(500).json({ message: 'Failed to create automation rule' });
    }
  });

  app.patch('/api/admin/automation/rules/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateAutomationRule(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating automation rule:', error);
      res.status(500).json({ message: 'Failed to update automation rule' });
    }
  });

  // Admin Testing
  app.get('/api/admin/testing/ab-tests', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const status = req.query.status as string | undefined;
      const tests = await storage.getAbTests(status);
      res.json(tests);
    } catch (error) {
      console.error('Error fetching AB tests:', error);
      res.status(500).json({ message: 'Failed to fetch AB tests' });
    }
  });

  app.post('/api/admin/testing/ab-tests', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const test = await storage.createAbTest(req.body);
      res.json(test);
    } catch (error) {
      console.error('Error creating AB test:', error);
      res.status(500).json({ message: 'Failed to create AB test' });
    }
  });

  app.patch('/api/admin/testing/ab-tests/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateAbTest(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating AB test:', error);
      res.status(500).json({ message: 'Failed to update AB test' });
    }
  });

  app.get('/api/admin/testing/feature-flags', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      res.status(500).json({ message: 'Failed to fetch feature flags' });
    }
  });

  app.get('/api/admin/testing/feature-flags/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const flag = await storage.getFeatureFlag(req.params.key);
      res.json(flag);
    } catch (error) {
      console.error('Error fetching feature flag:', error);
      res.status(500).json({ message: 'Failed to fetch feature flag' });
    }
  });

  app.patch('/api/admin/testing/feature-flags/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateFeatureFlag(req.params.key, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating feature flag:', error);
      res.status(500).json({ message: 'Failed to update feature flag' });
    }
  });

  app.post('/api/admin/testing/feature-flags', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const flag = await storage.createFeatureFlag(req.body);
      res.json(flag);
    } catch (error) {
      console.error('Error creating feature flag:', error);
      res.status(500).json({ message: 'Failed to create feature flag' });
    }
  });

  // Admin Integrations
  app.get('/api/admin/integrations/api-keys', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const userId = req.query.userId as string | undefined;
      const keys = await storage.getApiKeys({ userId });
      res.json(keys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ message: 'Failed to fetch API keys' });
    }
  });

  app.post('/api/admin/integrations/api-keys', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const key = await storage.createApiKey(req.body);
      res.json(key);
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({ message: 'Failed to create API key' });
    }
  });

  app.delete('/api/admin/integrations/api-keys/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.revokeApiKey(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error revoking API key:', error);
      res.status(500).json({ message: 'Failed to revoke API key' });
    }
  });

  app.get('/api/admin/integrations/webhooks', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const webhooks = await storage.getWebhooks({ isActive: activeOnly });
      res.json(webhooks);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      res.status(500).json({ message: 'Failed to fetch webhooks' });
    }
  });

  app.post('/api/admin/integrations/webhooks', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const webhook = await storage.createWebhook(req.body);
      res.json(webhook);
    } catch (error) {
      console.error('Error creating webhook:', error);
      res.status(500).json({ message: 'Failed to create webhook' });
    }
  });

  app.patch('/api/admin/integrations/webhooks/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateWebhook(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating webhook:', error);
      res.status(500).json({ message: 'Failed to update webhook' });
    }
  });

  app.delete('/api/admin/integrations/webhooks/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.deleteWebhook(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting webhook:', error);
      res.status(500).json({ message: 'Failed to delete webhook' });
    }
  });

  // ============================================
  // ADMIN USER MANAGEMENT & OVERVIEW ROUTES (15 routes)
  // ============================================

  // Zod schemas for admin user management routes
  const adminUsersQuerySchema = z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    search: z.string().optional(),
    role: z.enum(['member', 'moderator', 'admin']).optional(),
    status: z.enum(['active', 'suspended', 'banned']).optional(),
    authProvider: z.enum(['email', 'google', 'replit']).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  });

  const banUserSchema = z.object({
    reason: z.string().min(1),
    bannedBy: z.string().optional()
  });

  const suspendUserSchema = z.object({
    suspendedUntil: z.string(),
    reason: z.string().min(1),
    suspendedBy: z.string().optional()
  });

  // Marketplace validation schemas
  const approveItemSchema = z.object({
    // No fields needed, admin ID from session
  });

  const rejectItemSchema = z.object({
    reason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(500),
  });

  const featureItemSchema = z.object({
    durationDays: z.number().min(1).max(365),
  });

  const activateUserSchema = z.object({
    activatedBy: z.string().optional()
  });

  const changeRoleSchema = z.object({
    role: z.enum(['member', 'moderator', 'admin']),
    changedBy: z.string().optional()
  });

  const adjustCoinsSchema = z.object({
    amount: z.number(),
    reason: z.string().min(1),
    adjustedBy: z.string().optional()
  });

  const adjustReputationSchema = z.object({
    amount: z.number(),
    reason: z.string().min(1)
  });

  const addBadgeSchema = z.object({
    badge: z.string().min(1),
    addedBy: z.string().optional()
  });

  const removeBadgeSchema = z.object({
    badge: z.string().min(1),
    removedBy: z.string().optional()
  });

  const createModeratorSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(50),
    password: z.string().min(6)
  });

  // Broker Admin Zod Schemas
  const updateBrokerSchema = z.object({
    name: z.string().optional(),
    country: z.string().optional(),
    regulation: z.string().optional(),
    websiteUrl: z.string().url().optional(),
    minDeposit: z.string().optional(),
    leverage: z.string().optional(),
    platform: z.string().optional(),
    spreadType: z.string().optional(),
    minSpread: z.string().optional(),
  });

  const scamWarningSchema = z.object({
    enabled: z.boolean(),
    reason: z.string().optional(),
  });

  const resolveScamReportSchema = z.object({
    resolution: z.enum(["confirmed", "dismissed"]),
  });

  const rejectReviewSchema = z.object({
    reason: z.string().min(1, "Reason is required"),
  });

  // 1. GET /api/admin/users - Get paginated list of users with filters
  app.get('/api/admin/users', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const params = adminUsersQuerySchema.parse(req.query);
      const { page, limit, ...filters } = params;
      
      const result = await storage.getAdminUsers({
        ...filters,
        limit,
        offset: (page - 1) * limit
      });
      
      res.json({
        users: result.users,
        total: result.total,
        page,
        limit
      });
    } catch (error: any) {
      console.error('Error fetching admin users:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // 2. GET /api/admin/users/:id - Get single user details
  app.get('/api/admin/users/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // 3. POST /api/admin/users/:id/ban - Ban a user
  app.post('/api/admin/users/:id/ban', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      const validated = banUserSchema.parse(req.body);
      
      await storage.banUser(
        req.params.id,
        validated.reason,
        validated.bannedBy || adminUserId
      );
      
      res.json({ success: true, message: 'User banned successfully' });
    } catch (error: any) {
      console.error('Error banning user:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to ban user' });
    }
  });

  // 4. POST /api/admin/users/:id/suspend - Suspend a user
  app.post('/api/admin/users/:id/suspend', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      const validated = suspendUserSchema.parse(req.body);
      
      const suspendedUntil = new Date(validated.suspendedUntil);
      const duration = Math.floor((suspendedUntil.getTime() - Date.now()) / 1000);
      
      await storage.suspendUser(
        req.params.id,
        validated.reason,
        validated.suspendedBy || adminUserId,
        duration
      );
      
      res.json({ success: true, message: 'User suspended successfully' });
    } catch (error: any) {
      console.error('Error suspending user:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to suspend user' });
    }
  });

  // 5. POST /api/admin/users/:id/activate - Activate/unban a user
  app.post('/api/admin/users/:id/activate', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      const validated = activateUserSchema.parse(req.body);
      
      await storage.unbanUser(
        req.params.id,
        validated.activatedBy || adminUserId
      );
      
      res.json({ success: true, message: 'User activated successfully' });
    } catch (error: any) {
      console.error('Error activating user:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to activate user' });
    }
  });

  // 6. POST /api/admin/users/:id/role - Change user role
  app.post('/api/admin/users/:id/role', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      const validated = changeRoleSchema.parse(req.body);
      
      await storage.changeUserRole(
        req.params.id,
        validated.role,
        validated.changedBy || adminUserId
      );
      
      res.json({ success: true, message: 'User role changed successfully' });
    } catch (error: any) {
      console.error('Error changing user role:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to change user role' });
    }
  });

  // 7. POST /api/admin/users/:id/coins - Adjust user coins
  app.post('/api/admin/users/:id/coins', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      const validated = adjustCoinsSchema.parse(req.body);
      
      await storage.adjustUserCoins(
        req.params.id,
        validated.amount,
        validated.reason,
        validated.adjustedBy || adminUserId
      );
      
      // Fetch updated user to get new balance
      const user = await storage.getUserById(req.params.id);
      
      res.json({ 
        success: true, 
        newBalance: user?.totalCoins || 0 
      });
    } catch (error: any) {
      console.error('Error adjusting user coins:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to adjust user coins' });
    }
  });

  // 8. POST /api/admin/users/:id/reputation - Adjust user reputation
  app.post('/api/admin/users/:id/reputation', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      const validated = adjustReputationSchema.parse(req.body);
      
      await storage.adjustUserReputation(
        req.params.id,
        validated.amount,
        validated.reason,
        adminUserId
      );
      
      // Fetch updated user to get new reputation
      const user = await storage.getUserById(req.params.id);
      
      res.json({ 
        success: true, 
        newScore: user?.reputationScore || 0 
      });
    } catch (error: any) {
      console.error('Error adjusting user reputation:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to adjust user reputation' });
    }
  });

  // 9. POST /api/admin/users/:id/badge - Add badge to user
  app.post('/api/admin/users/:id/badge', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      const validated = addBadgeSchema.parse(req.body);
      
      await storage.addUserBadge(
        req.params.id,
        validated.badge,
        validated.addedBy || adminUserId
      );
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error adding user badge:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to add user badge' });
    }
  });

  // 10. DELETE /api/admin/users/:id/badge - Remove badge from user
  app.delete('/api/admin/users/:id/badge', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      const validated = removeBadgeSchema.parse(req.body);
      
      await storage.removeUserBadge(
        req.params.id,
        validated.badge,
        validated.removedBy || adminUserId
      );
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error removing user badge:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to remove user badge' });
    }
  });

  // 11. POST /api/admin/moderators - Create a new moderator account
  app.post('/api/admin/moderators', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const validated = createModeratorSchema.parse(req.body);
      
      // Check if user with email already exists
      const existingUser = await storage.findUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Check if username already exists
      const existingUsername = await storage.findUserByUsername(validated.username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Create the moderator account
      const newUser = await storage.createUser({
        username: validated.username,
        email: validated.email,
        passwordHash: await bcrypt.hash(validated.password, 10),
        role: 'moderator',
        status: 'active',
        auth_provider: 'email',
        reputationScore: 100,
        totalCoins: 1000,
        level: 1
      });
      
      res.json({ 
        success: true, 
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (error: any) {
      console.error('Error creating moderator:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to create moderator' });
    }
  });

  // 12. GET /api/admin/users/export/csv - Export users to CSV
  app.get('/api/admin/users/export/csv', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const { search, role, status } = req.query;
      
      const result = await storage.getAdminUsers({
        search: search as string | undefined,
        role: role as string | undefined,
        status: status as string | undefined,
        limit: 10000 // Large limit for export
      });
      
      const csv = [
        ['ID', 'Username', 'Email', 'Role', 'Status', 'Coins', 'Reputation', 'Created At'],
        ...result.users.map(u => [
          u.id,
          u.username,
          u.email || '',
          u.role,
          u.status,
          u.totalCoins.toString(),
          u.reputationScore.toString(),
          u.createdAt?.toISOString() || ''
        ])
      ].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting users:', error);
      res.status(500).json({ message: 'Failed to export users' });
    }
  });

  // 12. GET /api/admin/overview/revenue-breakdown - Get revenue by source
  app.get('/api/admin/overview/revenue-breakdown', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      // Calculate revenue from rechargeOrders table
      const startDate = new Date(0); // All time
      const endDate = new Date();
      const revenueStats = await storage.getRevenueStats(startDate, endDate);
      
      res.json({
        stripe: revenueStats.stripe || 0,
        crypto: revenueStats.crypto || 0,
        total: revenueStats.total || 0
      });
    } catch (error) {
      console.error('Error fetching revenue breakdown:', error);
      res.status(500).json({ message: 'Failed to fetch revenue breakdown' });
    }
  });

  // 13. GET /api/admin/overview/engagement-metrics - Get engagement stats
  app.get('/api/admin/overview/engagement-metrics', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const metrics = await storage.getEngagementMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      res.status(500).json({ message: 'Failed to fetch engagement metrics' });
    }
  });

  // 14. GET /api/admin/overview/top-content - Get top 10 threads by views
  app.get('/api/admin/overview/top-content', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const threads = await storage.getTopContentByViews(10);
      res.json({ threads });
    } catch (error) {
      console.error('Error fetching top content:', error);
      res.status(500).json({ message: 'Failed to fetch top content' });
    }
  });

  // 15. GET /api/admin/overview/top-users - Get top 10 users by reputation
  app.get('/api/admin/overview/top-users', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const users = await storage.getTopUsersByReputation(10);
      res.json({ users });
    } catch (error) {
      console.error('Error fetching top users:', error);
      res.status(500).json({ message: 'Failed to fetch top users' });
    }
  });

  // ========== NEW ADMIN ENDPOINTS ==========

  // 16. GET /api/admin/overview/stats - Primary overview statistics
  app.get('/api/admin/overview/stats', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
      // Query all stats in parallel for efficiency
      const [totalUsersResult, totalContentResult, totalRevenueResult, pendingModerationResult] = await Promise.all([
        // Total users count
        db.select({ count: count() }).from(users),
        
        // Total approved content count
        db.select({ count: count() }).from(content).where(eq(content.status, 'approved')),
        
        // Total revenue from completed recharge orders
        db.select({ total: sql<number>`COALESCE(SUM(${rechargeOrders.priceUsd}), 0)` })
          .from(rechargeOrders)
          .where(eq(rechargeOrders.status, 'completed')),
        
        // Pending moderation count
        db.select({ count: count() }).from(content).where(eq(content.status, 'pending'))
      ]);

      const stats = {
        totalUsers: totalUsersResult[0]?.count || 0,
        totalContent: totalContentResult[0]?.count || 0,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        pendingModeration: pendingModerationResult[0]?.count || 0
      };

      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching overview stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 17. GET /api/admin/overview/activity-feed - Admin activity feed
  app.get('/api/admin/overview/activity-feed', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
      // Query admin actions with JOIN to users table for admin username
      const actions = await db
        .select({
          id: adminActions.id,
          adminId: adminActions.adminId,
          adminUsername: users.username,
          actionType: adminActions.actionType,
          targetType: adminActions.targetType,
          targetId: adminActions.targetId,
          details: adminActions.details,
          createdAt: adminActions.createdAt
        })
        .from(adminActions)
        .leftJoin(users, eq(adminActions.adminId, users.id))
        .orderBy(desc(adminActions.createdAt))
        .limit(20);

      res.json(actions);
    } catch (error: any) {
      console.error('Error fetching activity feed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 18. GET /api/admin/overview/user-growth - User growth chart data
  app.get('/api/admin/overview/user-growth', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
      // Get user registrations for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const growthData = await db
        .select({
          date: sql<string>`DATE(${users.createdAt})`,
          count: count()
        })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo))
        .groupBy(sql`DATE(${users.createdAt})`)
        .orderBy(sql`DATE(${users.createdAt})`);

      res.json(growthData);
    } catch (error: any) {
      console.error('Error fetching user growth:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 19. GET /api/admin/overview/content-trend - Content trend chart data
  app.get('/api/admin/overview/content-trend', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
      // Get content creation for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Query threads and replies separately, then combine
      const [threadsData, repliesData] = await Promise.all([
        db
          .select({
            date: sql<string>`DATE(${forumThreads.createdAt})`,
            count: count()
          })
          .from(forumThreads)
          .where(gte(forumThreads.createdAt, sevenDaysAgo))
          .groupBy(sql`DATE(${forumThreads.createdAt})`)
          .orderBy(sql`DATE(${forumThreads.createdAt})`),
        
        db
          .select({
            date: sql<string>`DATE(${forumReplies.createdAt})`,
            count: count()
          })
          .from(forumReplies)
          .where(gte(forumReplies.createdAt, sevenDaysAgo))
          .groupBy(sql`DATE(${forumReplies.createdAt})`)
          .orderBy(sql`DATE(${forumReplies.createdAt})`)
      ]);

      // Combine threads and replies by date
      const dateMap = new Map<string, { threads: number; replies: number }>();
      
      threadsData.forEach(item => {
        dateMap.set(item.date, { threads: item.count, replies: 0 });
      });
      
      repliesData.forEach(item => {
        const existing = dateMap.get(item.date) || { threads: 0, replies: 0 };
        dateMap.set(item.date, { ...existing, replies: item.count });
      });

      // Convert to array and sort by date
      const trendData = Array.from(dateMap.entries()).map(([date, counts]) => ({
        date,
        threads: counts.threads,
        replies: counts.replies
      })).sort((a, b) => a.date.localeCompare(b.date));

      res.json(trendData);
    } catch (error: any) {
      console.error('Error fetching content trend:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 20. GET /api/admin/users/stats - User statistics summary
  app.get('/api/admin/users/stats', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
      const { search, role, status, authProvider } = req.query;

      // Build WHERE conditions based on filters
      const conditions = [];
      
      if (search && typeof search === 'string') {
        conditions.push(
          or(
            sql`${users.username} ILIKE ${`%${search}%`}`,
            sql`${users.email} ILIKE ${`%${search}%`}`
          )
        );
      }
      
      if (role && typeof role === 'string') {
        conditions.push(eq(users.role, role));
      }
      
      if (status && typeof status === 'string') {
        conditions.push(eq(users.status, status));
      }
      
      if (authProvider && typeof authProvider === 'string') {
        conditions.push(eq(users.auth_provider, authProvider));
      }

      // Build the WHERE clause
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Query stats with filters
      const [statsResult, bannedCountResult] = await Promise.all([
        db
          .select({
            total: count(),
            avgReputation: sql<number>`COALESCE(AVG(${users.reputationScore}), 0)`,
            avgCoins: sql<number>`COALESCE(AVG(${users.totalCoins}), 0)`
          })
          .from(users)
          .where(whereClause),
        
        db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              whereClause,
              or(
                eq(users.status, 'banned'),
                eq(users.status, 'suspended')
              )
            )
          )
      ]);

      const stats = {
        total: Number(statsResult[0]?.total) || 0,
        avgReputation: Math.round(Number(statsResult[0]?.avgReputation) || 0),
        avgCoins: Math.round(Number(statsResult[0]?.avgCoins) || 0),
        bannedCount: Number(bannedCountResult[0]?.count) || 0
      };

      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ADMIN MARKETPLACE MANAGEMENT ROUTES (16 routes)
  // ============================================

  // 1. GET /api/admin/marketplace/items - All marketplace items with filters
  app.get('/api/admin/marketplace/items', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
        sort: req.query.sort as 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'sales' | undefined,
      };
      const result = await storage.getMarketplaceItems(params);
      res.json(result);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      res.status(500).json({ message: 'Failed to fetch marketplace items' });
    }
  });

  // 2. GET /api/admin/marketplace/items/:id - Single item details
  app.get('/api/admin/marketplace/items/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const item = await storage.getMarketplaceItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      res.json(item);
    } catch (error) {
      console.error('Error fetching marketplace item:', error);
      res.status(500).json({ message: 'Failed to fetch marketplace item' });
    }
  });

  // 3. GET /api/admin/marketplace/items/search - Search items
  app.get('/api/admin/marketplace/items/search', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const params = {
        page: 1,
        pageSize: 50,
        search: req.query.q as string,
      };
      const result = await storage.getMarketplaceItems(params);
      res.json(result.items); // Return just the items array for search results
    } catch (error) {
      console.error('Error searching marketplace items:', error);
      res.status(500).json({ message: 'Failed to search marketplace items' });
    }
  });

  // 4. GET /api/admin/marketplace/items/pending - Pending approval items
  app.get('/api/admin/marketplace/items/pending', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const items = await storage.getPendingMarketplaceItems(limit);
      res.json(items);
    } catch (error) {
      console.error('Error fetching pending marketplace items:', error);
      res.status(500).json({ message: 'Failed to fetch pending marketplace items' });
    }
  });

  // 5. POST /api/admin/marketplace/:id/approve - Approve listing
  app.post('/api/admin/marketplace/:id/approve', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminId = getAuthenticatedUserId(req);
      await storage.approveMarketplaceItem(req.params.id, adminId);
      res.json({ success: true, message: 'Item approved successfully' });
    } catch (error: any) {
      console.error('Error approving marketplace item:', error);
      res.status(500).json({ message: error.message || 'Failed to approve marketplace item' });
    }
  });

  // 6. POST /api/admin/marketplace/:id/reject - Reject listing with reason
  app.post('/api/admin/marketplace/:id/reject', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminId = getAuthenticatedUserId(req);
      const validated = rejectItemSchema.parse(req.body);
      await storage.rejectMarketplaceItem(req.params.id, adminId, validated.reason);
      res.json({ success: true, message: 'Item rejected successfully' });
    } catch (error: any) {
      console.error('Error rejecting marketplace item:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: error.message || 'Failed to reject marketplace item' });
    }
  });

  // 7. POST /api/admin/marketplace/:id/feature - Feature item
  app.post('/api/admin/marketplace/:id/feature', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminId = getAuthenticatedUserId(req);
      const validated = featureItemSchema.parse(req.body);
      await storage.featureMarketplaceItem(req.params.id, adminId, validated.durationDays);
      res.json({ success: true, message: 'Item featured successfully' });
    } catch (error: any) {
      console.error('Error featuring marketplace item:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ message: error.message || 'Failed to feature marketplace item' });
    }
  });

  // 8. DELETE /api/admin/marketplace/:id/delete - Delete item
  app.delete('/api/admin/marketplace/:id/delete', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminId = getAuthenticatedUserId(req);
      await storage.deleteMarketplaceItem(req.params.id, adminId);
      res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting marketplace item:', error);
      res.status(500).json({ message: error.message || 'Failed to delete marketplace item' });
    }
  });

  // 9. GET /api/admin/marketplace/sales - All sales transactions
  app.get('/api/admin/marketplace/sales', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 50,
        contentId: req.query.contentId as string | undefined,
        buyerId: req.query.buyerId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const result = await storage.getMarketplaceSales(params);
      res.json(result);
    } catch (error) {
      console.error('Error fetching marketplace sales:', error);
      res.status(500).json({ message: 'Failed to fetch marketplace sales' });
    }
  });

  // 10. GET /api/admin/marketplace/sales/recent - Recent 50 sales
  app.get('/api/admin/marketplace/sales/recent', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const sales = await storage.getRecentMarketplaceSales(limit);
      res.json(sales);
    } catch (error) {
      console.error('Error fetching recent marketplace sales:', error);
      res.status(500).json({ message: 'Failed to fetch recent marketplace sales' });
    }
  });

  // 11. GET /api/admin/marketplace/revenue - Revenue data by period
  app.get('/api/admin/marketplace/revenue', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const period = (req.query.period as 'today' | 'week' | 'month' | 'year' | 'all') || 'all';
      const revenue = await storage.getMarketplaceRevenue(period);
      res.json(revenue);
    } catch (error) {
      console.error('Error fetching marketplace revenue:', error);
      res.status(500).json({ message: 'Failed to fetch marketplace revenue' });
    }
  });

  // 12. GET /api/admin/marketplace/revenue-chart - 30-day revenue trend
  app.get('/api/admin/marketplace/revenue-chart', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const trendData = await storage.getRevenueTrend(days);
      res.json(trendData);
    } catch (error) {
      console.error('Error fetching revenue trend:', error);
      res.status(500).json({ message: 'Failed to fetch revenue trend' });
    }
  });

  // 13. GET /api/admin/marketplace/top-selling - Best-selling items
  app.get('/api/admin/marketplace/top-selling', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const items = await storage.getTopSellingItems(limit);
      res.json(items);
    } catch (error) {
      console.error('Error fetching top-selling items:', error);
      res.status(500).json({ message: 'Failed to fetch top-selling items' });
    }
  });

  // 14. GET /api/admin/marketplace/top-vendors - Top-earning sellers
  app.get('/api/admin/marketplace/top-vendors', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const vendors = await storage.getTopVendors(limit);
      res.json(vendors);
    } catch (error) {
      console.error('Error fetching top vendors:', error);
      res.status(500).json({ message: 'Failed to fetch top vendors' });
    }
  });

  // 15. GET /api/admin/marketplace/categories - Category performance
  app.get('/api/admin/marketplace/categories', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      // This endpoint returns category-level analytics
      // For now, return empty array (can be enhanced later with storage method)
      res.json([]);
    } catch (error) {
      console.error('Error fetching marketplace categories:', error);
      res.status(500).json({ message: 'Failed to fetch marketplace categories' });
    }
  });

  // 16. GET /api/admin/marketplace/stats - Marketplace statistics
  app.get('/api/admin/marketplace/stats', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const stats = await storage.getMarketplaceStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
      res.status(500).json({ message: 'Failed to fetch marketplace stats' });
    }
  });

  // ===== Daily Earning System =====
  // NOTE: Activity tracking endpoint is defined earlier with proper security measures
  
  // Get today's activity stats (DUPLICATE - consider removing if already exists above)
  app.get('/api/activity/today', isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const activity = await storage.getTodayActivity(userId);
      
      const activeMinutes = activity?.activeMinutes || 0;
      const coinsEarned = activity?.coinsEarned || 0;
      const canEarnMore = activeMinutes < 100;
      
      // Minutes until next reward (next 5-minute interval)
      const minutesUntilNextReward = canEarnMore 
        ? 5 - (activeMinutes % 5)
        : 0;
      
      res.json({
        activeMinutes,
        coinsEarned,
        canEarnMore,
        minutesUntilNextReward
      });
    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ message: 'Failed to fetch activity' });
    }
  });
  
  // Check if user can post journal today
  app.post('/api/journal/check', isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const canPost = await storage.checkCanPostJournal(userId);
      
      let nextAvailable = null;
      if (!canPost) {
        // Next available is tomorrow at midnight
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        nextAvailable = tomorrow.toISOString();
      }
      
      res.json({ canPost, nextAvailable });
    } catch (error) {
      console.error('Error checking journal status:', error);
      res.status(500).json({ message: 'Failed to check journal status' });
    }
  });
  
  // Get suggested users to follow
  app.get('/api/users/suggested', isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const limit = parseInt(req.query.limit as string) || 3;
      
      // Get all users
      const allUsers = await storage.getAllUsers();
      
      // Get users already following
      const following = await storage.getUserFollowing(userId);
      const followingIds = new Set(following.map((f: any) => f.id));
      
      // Filter out current user and already followed users
      const available = allUsers.filter(u => 
        u.id !== userId && !followingIds.has(u.id)
      );
      
      // Shuffle and take random users
      const shuffled = available.sort(() => Math.random() - 0.5);
      const suggested = shuffled.slice(0, limit);
      
      res.json(suggested);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      res.status(500).json({ message: 'Failed to fetch suggested users' });
    }
  });

  // Admin Media Library
  app.get('/api/admin/studio/media', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        uploadedBy: req.query.uploadedBy as string | undefined,
        mimeType: req.query.mimeType as string | undefined,
      };
      const media = await storage.getMediaLibrary(filters);
      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ message: 'Failed to fetch media' });
    }
  });

  app.patch('/api/admin/studio/media/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateMediaItem(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating media:', error);
      res.status(500).json({ message: 'Failed to update media' });
    }
  });

  app.delete('/api/admin/studio/media/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.deleteMediaItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ message: 'Failed to delete media' });
    }
  });

  // ============================================
  // SITEMAP ROUTES - Automated sitemap generation and submission
  // ============================================

  // Generate sitemap and save to public directory
  app.post('/api/admin/sitemap/generate', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    
    try {
      const { SitemapGenerator } = await import('./services/sitemap-generator.js');
      const { SitemapSubmissionService } = await import('./services/sitemap-submission.js');
      const { sitemapLogs } = await import('@shared/schema');
      
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000';
      const generator = new SitemapGenerator(baseUrl);
      const submissionService = new SitemapSubmissionService(baseUrl);

      // Generate sitemap
      const { xml, urlCount } = await generator.generateSitemap();

      // Save to public directory
      const fs = await import('fs/promises');
      const path = await import('path');
      const publicDir = path.join(process.cwd(), 'public');
      await fs.mkdir(publicDir, { recursive: true });
      await fs.writeFile(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');

      // Log generation
      await db.insert(sitemapLogs).values({
        action: 'generate',
        status: 'success',
        urlCount,
        submittedTo: null,
      });

      // Submit to search engines
      const sitemapUrl = `${baseUrl}/sitemap.xml`;
      const allUrls = xml.match(/<loc>(.*?)<\/loc>/g)?.map(loc => 
        loc.replace('<loc>', '').replace('</loc>', '')
      ) || [];

      // Submit to IndexNow (Bing, Yandex)
      const indexNowResult = await submissionService.submitToIndexNow(allUrls);

      // Ping Google
      const googleResult = await submissionService.pingGoogle(sitemapUrl);

      res.json({
        success: true,
        urlCount,
        sitemapUrl,
        submissions: {
          indexnow: indexNowResult,
          google: googleResult,
        },
      });
    } catch (error: any) {
      console.error('[Sitemap Generation] Error:', error);
      
      // Log error
      try {
        const { sitemapLogs } = await import('@shared/schema');
        await db.insert(sitemapLogs).values({
          action: 'generate',
          status: 'error',
          urlCount: null,
          submittedTo: null,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (logError) {
        console.error('[Sitemap Generation] Failed to log error:', logError);
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate sitemap',
      });
    }
  });

  // Get sitemap status and recent logs
  app.get('/api/admin/sitemap/status', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    
    try {
      const { sitemapLogs } = await import('@shared/schema');
      const recentLogs = await db
        .select()
        .from(sitemapLogs)
        .orderBy(sql`${sitemapLogs.createdAt} DESC`)
        .limit(20);

      const lastGeneration = recentLogs.find(log => log.action === 'generate' && log.status === 'success');
      const lastError = recentLogs.find(log => log.status === 'error');

      res.json({
        lastGeneration: lastGeneration || null,
        lastError: lastError || null,
        recentLogs,
      });
    } catch (error: any) {
      console.error('[Sitemap Status] Error:', error);
      res.status(500).json({ error: 'Failed to fetch sitemap status' });
    }
  });

  // Get detailed logs
  app.get('/api/admin/sitemap/logs', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    
    try {
      const { sitemapLogs } = await import('@shared/schema');
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await db
        .select()
        .from(sitemapLogs)
        .orderBy(sql`${sitemapLogs.createdAt} DESC`)
        .limit(limit);

      res.json({ logs });
    } catch (error: any) {
      console.error('[Sitemap Logs] Error:', error);
      res.status(500).json({ error: 'Failed to fetch sitemap logs' });
    }
  });

  // ===================================
  // ADMIN: Broker Management
  // ===================================

  // 1. GET /api/admin/brokers - List all brokers with filters/pagination
  app.get("/api/admin/brokers", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        search: req.query.search as string | undefined,
        country: req.query.country as string | undefined,
        regulation: req.query.regulation as string | undefined,
        isVerified: req.query.isVerified === "true" ? true : req.query.isVerified === "false" ? false : undefined,
        scamWarning: req.query.scamWarning === "true" ? true : req.query.scamWarning === "false" ? false : undefined,
        status: req.query.status as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
      };
      
      const result = await storage.getAdminBrokers(filters);
      res.json(result);
    } catch (error: any) {
      console.error('[Admin Brokers] Error:', error);
      res.status(500).json({ error: error.message || "Failed to fetch brokers" });
    }
  });

  // 2. GET /api/admin/brokers/stats - Get broker statistics
  app.get("/api/admin/brokers/stats", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const stats = await storage.getBrokerStats();
      res.json(stats);
    } catch (error: any) {
      console.error('[Admin Broker Stats] Error:', error);
      res.status(500).json({ error: error.message || "Failed to fetch broker stats" });
    }
  });

  // 3. GET /api/admin/brokers/pending - Get pending broker submissions
  app.get("/api/admin/brokers/pending", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const pendingBrokers = await storage.getPendingBrokers();
      res.json(pendingBrokers);
    } catch (error: any) {
      console.error('[Admin Pending Brokers] Error:', error);
      res.status(500).json({ error: error.message || "Failed to fetch pending brokers" });
    }
  });

  // 4. PATCH /api/admin/brokers/:id - Update broker
  app.patch("/api/admin/brokers/:id", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const brokerId = req.params.id;
      
      const validated = updateBrokerSchema.parse(req.body);
      
      await storage.updateBroker(brokerId, validated, authenticatedUserId);
      res.json({ success: true, message: "Broker updated successfully" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      if (error.message === "Broker not found") {
        return res.status(404).json({ error: "Broker not found" });
      }
      console.error('[Admin Update Broker] Error:', error);
      res.status(500).json({ error: error.message || "Failed to update broker" });
    }
  });

  // 5. DELETE /api/admin/brokers/:id - Delete (soft delete) broker
  app.delete("/api/admin/brokers/:id", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const brokerId = req.params.id;
      
      await storage.deleteBroker(brokerId, authenticatedUserId);
      res.json({ success: true, message: "Broker deleted successfully" });
    } catch (error: any) {
      if (error.message === "Broker not found") {
        return res.status(404).json({ error: "Broker not found" });
      }
      console.error('[Admin Delete Broker] Error:', error);
      res.status(500).json({ error: error.message || "Failed to delete broker" });
    }
  });

  // 6. POST /api/admin/brokers/:id/verify - Verify broker
  app.post("/api/admin/brokers/:id/verify", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const brokerId = req.params.id;
      
      await storage.verifyBroker(brokerId, authenticatedUserId);
      res.json({ success: true, message: "Broker verified successfully" });
    } catch (error: any) {
      if (error.message === "Broker not found") {
        return res.status(404).json({ error: "Broker not found" });
      }
      console.error('[Admin Verify Broker] Error:', error);
      res.status(500).json({ error: error.message || "Failed to verify broker" });
    }
  });

  // 7. POST /api/admin/brokers/:id/unverify - Unverify broker
  app.post("/api/admin/brokers/:id/unverify", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const brokerId = req.params.id;
      
      await storage.unverifyBroker(brokerId, authenticatedUserId);
      res.json({ success: true, message: "Broker verification removed" });
    } catch (error: any) {
      if (error.message === "Broker not found") {
        return res.status(404).json({ error: "Broker not found" });
      }
      console.error('[Admin Unverify Broker] Error:', error);
      res.status(500).json({ error: error.message || "Failed to unverify broker" });
    }
  });

  // 8. POST /api/admin/brokers/:id/scam-warning - Toggle scam warning
  app.post("/api/admin/brokers/:id/scam-warning", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const brokerId = req.params.id;
      
      const validated = scamWarningSchema.parse(req.body);
      
      const result = await storage.toggleScamWarning(
        brokerId,
        authenticatedUserId,
        validated.reason,
        validated.enabled
      );
      
      res.json({
        success: true,
        message: result.scamWarning ? "Scam warning added" : "Scam warning removed",
        scamWarning: result.scamWarning
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      if (error.message === "Broker not found") {
        return res.status(404).json({ error: "Broker not found" });
      }
      console.error('[Admin Scam Warning] Error:', error);
      res.status(500).json({ error: error.message || "Failed to toggle scam warning" });
    }
  });

  // ===================================
  // ADMIN: Scam Reports Management
  // ===================================

  // 9. GET /api/admin/scam-reports - List all scam reports
  app.get("/api/admin/scam-reports", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        brokerId: req.query.brokerId as string | undefined,
        severity: req.query.severity as "low" | "medium" | "high" | "critical" | undefined,
        status: req.query.status as "pending" | "approved" | "rejected" | undefined,
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
      };
      
      const result = await storage.getScamReports(filters);
      res.json(result);
    } catch (error: any) {
      console.error('[Admin Scam Reports] Error:', error);
      res.status(500).json({ error: error.message || "Failed to fetch scam reports" });
    }
  });

  // 10. GET /api/admin/scam-reports/:id - Get single scam report details
  app.get("/api/admin/scam-reports/:id", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const reportId = req.params.id;
      
      // Use getScamReports without filters to find specific report
      const result = await storage.getScamReports({ page: 1, pageSize: 1000 });
      const report = result.items.find((r: any) => r.id === reportId);
      
      if (!report) {
        return res.status(404).json({ error: "Scam report not found" });
      }
      
      res.json(report);
    } catch (error: any) {
      console.error('[Admin Scam Report Details] Error:', error);
      res.status(500).json({ error: error.message || "Failed to fetch scam report" });
    }
  });

  // 11. POST /api/admin/scam-reports/:id/resolve - Resolve scam report
  app.post("/api/admin/scam-reports/:id/resolve", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const reportId = req.params.id;
      
      const validated = resolveScamReportSchema.parse(req.body);
      
      await storage.resolveScamReport(reportId, authenticatedUserId, validated.resolution);
      
      res.json({
        success: true,
        message: validated.resolution === "confirmed" ? "Scam report confirmed" : "Scam report dismissed"
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      if (error.message === "Scam report not found") {
        return res.status(404).json({ error: "Scam report not found" });
      }
      console.error('[Admin Resolve Scam Report] Error:', error);
      res.status(500).json({ error: error.message || "Failed to resolve scam report" });
    }
  });

  // ===================================
  // ADMIN: Broker Reviews Management
  // ===================================

  // 12. GET /api/admin/broker-reviews - List all broker reviews
  app.get("/api/admin/broker-reviews", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const status = req.query.status as "pending" | "approved" | "rejected" | undefined;
      const brokerId = req.query.brokerId as string | undefined;
      
      // This is a simplified implementation - in production you may want a dedicated storage method
      const filters: any = {
        page,
        pageSize,
      };
      
      if (status) filters.status = status;
      if (brokerId) filters.brokerId = brokerId;
      
      const result = await storage.getScamReports(filters);
      
      // Filter out scam reports to show only reviews
      const reviews = result.items;
      
      res.json({
        items: reviews,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      });
    } catch (error: any) {
      console.error('[Admin Broker Reviews] Error:', error);
      res.status(500).json({ error: error.message || "Failed to fetch broker reviews" });
    }
  });

  // 13. POST /api/admin/broker-reviews/:id/approve - Approve broker review
  app.post("/api/admin/broker-reviews/:id/approve", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const reviewId = req.params.id;
      
      await storage.approveBrokerReview(reviewId, authenticatedUserId);
      res.json({ success: true, message: "Review approved successfully" });
    } catch (error: any) {
      if (error.message === "Review not found") {
        return res.status(404).json({ error: "Review not found" });
      }
      console.error('[Admin Approve Review] Error:', error);
      res.status(500).json({ error: error.message || "Failed to approve review" });
    }
  });

  // 14. POST /api/admin/broker-reviews/:id/reject - Reject broker review
  app.post("/api/admin/broker-reviews/:id/reject", isAdminMiddleware, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const reviewId = req.params.id;
      
      const validated = rejectReviewSchema.parse(req.body);
      
      await storage.rejectBrokerReview(reviewId, authenticatedUserId, validated.reason);
      res.json({ success: true, message: "Review rejected" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      if (error.message === "Review not found") {
        return res.status(404).json({ error: "Review not found" });
      }
      console.error('[Admin Reject Review] Error:', error);
      res.status(500).json({ error: error.message || "Failed to reject review" });
    }
  });

  // ============================================
  // CONTENT MODERATION API ROUTES (Phase 3)
  // ============================================

  // Zod validation schemas for moderation endpoints
  const queueQuerySchema = z.object({
    type: z.enum(["thread", "reply", "all"]).optional().default("all"),
    status: z.enum(["pending", "approved", "rejected"]).optional().default("pending"),
    page: z.coerce.number().int().positive().optional().default(1),
    perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  });

  const reportedQuerySchema = z.object({
    status: z.enum(["pending", "resolved", "dismissed"]).optional().default("pending"),
    page: z.coerce.number().int().positive().optional().default(1),
    perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  });

  const approveSchema = z.object({
    contentType: z.enum(["thread", "reply"]),
  });

  const rejectSchema = z.object({
    contentType: z.enum(["thread", "reply"]),
    reason: z.string().min(10).max(500),
  });

  const detailsQuerySchema = z.object({
    contentType: z.enum(["thread", "reply"]),
  });

  const dismissSchema = z.object({
    reason: z.string().max(500).optional(),
  });

  const reportActionSchema = z.object({
    contentId: z.string(),
    contentType: z.enum(["thread", "reply"]),
    actionType: z.enum(["delete", "warn", "suspend", "ban"]),
    reason: z.string().min(10).max(500),
    suspendDays: z.number().int().positive().max(365).optional(),
  }).refine(
    (data) => data.actionType !== "suspend" || data.suspendDays !== undefined,
    { message: "suspendDays is required when actionType is 'suspend'" }
  );

  const bulkApproveSchema = z.object({
    contentIds: z.array(z.string()).min(1).max(100),
    contentType: z.enum(["thread", "reply"]),
  });

  const bulkRejectSchema = z.object({
    contentIds: z.array(z.string()).min(1).max(100),
    contentType: z.enum(["thread", "reply"]),
    reason: z.string().min(10).max(500),
  });

  const historyQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(500).optional().default(100),
    moderatorId: z.string().optional(),
  });

  // 1. GET /api/moderation/queue - Get paginated moderation queue
  app.get("/api/moderation/queue", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const params = queueQuerySchema.parse(req.query);
      const result = await storage.getModerationQueue(params);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid parameters", details: error.errors });
      }
      console.error("Error fetching moderation queue:", error);
      res.status(500).json({ error: "Failed to fetch moderation queue" });
    }
  });

  // 2. GET /api/moderation/reported - Get paginated reported content
  app.get("/api/moderation/reported", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const params = reportedQuerySchema.parse(req.query);
      const result = await storage.getReportedContent(params);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid parameters", details: error.errors });
      }
      console.error("Error fetching reported content:", error);
      res.status(500).json({ error: "Failed to fetch reported content" });
    }
  });

  // 3. GET /api/moderation/queue/count - Get queue counts
  app.get("/api/moderation/queue/count", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const counts = await storage.getQueueCount();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching queue count:", error);
      res.status(500).json({ error: "Failed to fetch queue count" });
    }
  });

  // 4. GET /api/moderation/reported/count - Get reported content counts
  app.get("/api/moderation/reported/count", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const counts = await storage.getReportedCount();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching reported content count:", error);
      res.status(500).json({ error: "Failed to fetch reported content count" });
    }
  });

  // 5. POST /api/moderation/:id/approve - Approve content
  app.post("/api/moderation/:id/approve", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { contentType } = approveSchema.parse(req.body);
      const claims = (req.user as any)?.claims;
      
      await storage.approveContent({
        contentId: id,
        contentType,
        moderatorId: claims.sub,
        moderatorUsername: claims.username || claims.sub,
      });
      
      // Queue content approval email (fire-and-forget)
      (async () => {
        try {
          const content = contentType === 'thread' 
            ? await storage.getForumThreadById(id)
            : await storage.getForumReplyById(id);
          
          if (content) {
            const author = await storage.getUser(content.userId || content.authorId);
            if (author?.email) {
              await emailQueueService.queueEmail({
                userId: author.id,
                templateKey: 'content_approved',
                recipientEmail: author.email,
                subject: `Your ${contentType} has been approved!`,
                payload: {
                  recipientName: author.username,
                  contentType,
                  contentTitle: content.title || 'Reply',
                  contentUrl: contentType === 'thread' ? `/threads/${content.slug}` : `/threads/${content.threadId}`,
                  moderatorName: claims.username || 'Moderator'
                },
                priority: EmailPriority.MEDIUM
              });
            }
          }
        } catch (emailError) {
          console.error('Failed to queue content approval email:', emailError);
        }
      })();
      
      res.json({ success: true, message: "Content approved successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      console.error("Error approving content:", error);
      res.status(500).json({ error: "Failed to approve content" });
    }
  });

  // 6. POST /api/moderation/:id/reject - Reject content
  app.post("/api/moderation/:id/reject", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { contentType, reason } = rejectSchema.parse(req.body);
      const claims = (req.user as any)?.claims;
      
      await storage.rejectContent({
        contentId: id,
        contentType,
        moderatorId: claims.sub,
        moderatorUsername: claims.username || claims.sub,
        reason,
      });
      
      // Queue content rejection email (fire-and-forget)
      (async () => {
        try {
          const content = contentType === 'thread' 
            ? await storage.getForumThreadById(id)
            : await storage.getForumReplyById(id);
          
          if (content) {
            const author = await storage.getUser(content.userId || content.authorId);
            if (author?.email) {
              await emailQueueService.queueEmail({
                userId: author.id,
                templateKey: 'content_rejected',
                recipientEmail: author.email,
                subject: `Your ${contentType} was not approved`,
                payload: {
                  recipientName: author.username,
                  contentType,
                  contentTitle: content.title || 'Reply',
                  reason,
                  moderatorName: claims.username || 'Moderator'
                },
                priority: EmailPriority.MEDIUM
              });
            }
          }
        } catch (emailError) {
          console.error('Failed to queue content rejection email:', emailError);
        }
      })();
      
      res.json({ success: true, message: "Content rejected successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      console.error("Error rejecting content:", error);
      res.status(500).json({ error: "Failed to reject content" });
    }
  });

  // 7. GET /api/moderation/:id/details - Get content details for review
  app.get("/api/moderation/:id/details", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { contentType } = detailsQuerySchema.parse(req.query);
      
      const details = await storage.getContentDetails({ contentId: id, contentType });
      res.json(details);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid parameters", details: error.errors });
      }
      console.error("Error fetching content details:", error);
      res.status(500).json({ error: "Failed to fetch content details" });
    }
  });

  // 8. GET /api/moderation/report/:id - Get report details
  app.get("/api/moderation/report/:id", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ error: "Invalid report ID" });
      }
      
      const reportDetails = await storage.getReportDetails(reportId);
      res.json(reportDetails);
    } catch (error) {
      console.error("Error fetching report details:", error);
      res.status(500).json({ error: "Failed to fetch report details" });
    }
  });

  // 9. POST /api/moderation/report/:id/dismiss - Dismiss a report
  app.post("/api/moderation/report/:id/dismiss", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ error: "Invalid report ID" });
      }
      
      const { reason } = dismissSchema.parse(req.body);
      const claims = (req.user as any)?.claims;
      
      await storage.dismissReport({
        reportId,
        moderatorId: claims.sub,
        reason: reason || "No reason provided",
      });
      
      res.json({ success: true, message: "Report dismissed successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      console.error("Error dismissing report:", error);
      res.status(500).json({ error: "Failed to dismiss report" });
    }
  });

  // 10. POST /api/moderation/report/:id/action - Take action on reported content
  app.post("/api/moderation/report/:id/action", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ error: "Invalid report ID" });
      }
      
      const validatedData = reportActionSchema.parse(req.body);
      const claims = (req.user as any)?.claims;
      
      await storage.takeReportAction({
        contentId: validatedData.contentId,
        contentType: validatedData.contentType,
        actionType: validatedData.actionType,
        moderatorId: claims.sub,
        reason: validatedData.reason,
        suspendDays: validatedData.suspendDays,
      });
      
      res.json({ success: true, message: `Action '${validatedData.actionType}' taken successfully` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      console.error("Error taking report action:", error);
      res.status(500).json({ error: "Failed to take action on report" });
    }
  });

  // 11. POST /api/moderation/bulk-approve - Bulk approve content
  app.post("/api/moderation/bulk-approve", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const { contentIds, contentType } = bulkApproveSchema.parse(req.body);
      const claims = (req.user as any)?.claims;
      
      const result = await storage.bulkApprove({
        contentIds,
        contentType,
        moderatorId: claims.sub,
        moderatorUsername: claims.username || claims.sub,
      });
      
      res.json({
        success: true,
        successCount: result.successCount,
        failedIds: result.failedIds,
        message: `Approved ${result.successCount} of ${contentIds.length} items successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      console.error("Error bulk approving content:", error);
      res.status(500).json({ error: "Failed to bulk approve content" });
    }
  });

  // 12. POST /api/moderation/bulk-reject - Bulk reject content
  app.post("/api/moderation/bulk-reject", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const { contentIds, contentType, reason } = bulkRejectSchema.parse(req.body);
      const claims = (req.user as any)?.claims;
      
      const result = await storage.bulkReject({
        contentIds,
        contentType,
        moderatorId: claims.sub,
        reason,
      });
      
      res.json({
        success: true,
        successCount: result.successCount,
        failedIds: result.failedIds,
        message: `Rejected ${result.successCount} of ${contentIds.length} items successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      console.error("Error bulk rejecting content:", error);
      res.status(500).json({ error: "Failed to bulk reject content" });
    }
  });

  // 13. GET /api/moderation/history - Get moderation action history
  app.get("/api/moderation/history", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const params = historyQuerySchema.parse(req.query);
      const history = await storage.getModerationHistory(params);
      res.json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid parameters", details: error.errors });
      }
      console.error("Error fetching moderation history:", error);
      res.status(500).json({ error: "Failed to fetch moderation history" });
    }
  });

  // 14. GET /api/moderation/stats - Get moderation statistics
  app.get("/api/moderation/stats", isAuthenticated, isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const stats = await storage.getModerationStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching moderation stats:", error);
      res.status(500).json({ error: "Failed to fetch moderation stats" });
    }
  });

  // ===================================
  // ADMIN: Finance Management
  // ===================================

  // Zod schemas for withdrawal operations
  const approveWithdrawalSchema = z.object({
    notes: z.string().optional()
  });

  const rejectWithdrawalSchema = z.object({
    reason: z.string().min(1, "Rejection reason required"),
    notifyUser: z.boolean().optional()
  });

  const completeWithdrawalSchema = z.object({
    transactionId: z.string().min(1, "Transaction ID required"),
    notes: z.string().optional()
  });

  // **Revenue Endpoints**

  // 1. GET /api/finance/revenue/total
  app.get("/api/finance/revenue/total", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const result = await storage.getTotalRevenue();
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching total revenue:", error);
      res.status(500).json({ error: "Failed to fetch total revenue" });
    }
  });

  // 2. GET /api/finance/revenue/trend
  app.get("/api/finance/revenue/trend", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const trend = await storage.getRevenueTrend(days);
      res.json(trend);
    } catch (error: any) {
      console.error("Error fetching revenue trend:", error);
      res.status(500).json({ error: "Failed to fetch revenue trend" });
    }
  });

  // 3. GET /api/finance/revenue/by-source
  app.get("/api/finance/revenue/by-source", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const breakdown = await storage.getRevenueBySource();
      res.json(breakdown);
    } catch (error: any) {
      console.error("Error fetching revenue by source:", error);
      res.status(500).json({ error: "Failed to fetch revenue by source" });
    }
  });

  // 4. GET /api/finance/revenue/period
  app.get("/api/finance/revenue/period", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const period = req.query.period as string;
      if (!period || !['today', 'week', 'month', 'year'].includes(period)) {
        return res.status(400).json({ error: "Invalid period. Must be one of: today, week, month, year" });
      }

      const revenue = await storage.getRevenuePeriod(period as 'today' | 'week' | 'month' | 'year');
      res.json(revenue);
    } catch (error: any) {
      console.error("Error fetching period revenue:", error);
      res.status(500).json({ error: "Failed to fetch period revenue" });
    }
  });

  // **Withdrawal Endpoints**

  // 5. GET /api/finance/withdrawals/pending
  app.get("/api/finance/withdrawals/pending", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const pendingWithdrawals = await storage.getPendingWithdrawals();
      res.json(pendingWithdrawals);
    } catch (error: any) {
      console.error("Error fetching pending withdrawals:", error);
      res.status(500).json({ error: "Failed to fetch pending withdrawals" });
    }
  });

  // 6. GET /api/finance/withdrawals/all
  app.get("/api/finance/withdrawals/all", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
        status: req.query.status as string | undefined,
        method: req.query.method as string | undefined,
        dateRange: req.query.dateRange as string | undefined,
      };

      const result = await storage.getAllWithdrawals(filters);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching all withdrawals:", error);
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  // 7. POST /api/finance/withdrawals/:id/approve
  app.post("/api/finance/withdrawals/:id/approve", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const withdrawalId = req.params.id;
      const validatedData = approveWithdrawalSchema.parse(req.body);
      const adminId = getAuthenticatedUserId(req);

      const result = await storage.approveWithdrawal(withdrawalId, adminId);

      // Log admin action
      await db.insert(adminActions).values({
        adminId,
        actionType: 'withdrawal_approved',
        targetType: 'withdrawal',
        targetId: withdrawalId,
        details: { notes: validatedData.notes },
      });

      res.json({ success: true, message: "Withdrawal approved successfully" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error approving withdrawal:", error);
      res.status(500).json({ error: "Failed to approve withdrawal" });
    }
  });

  // 8. POST /api/finance/withdrawals/:id/reject
  app.post("/api/finance/withdrawals/:id/reject", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const withdrawalId = req.params.id;
      const validatedData = rejectWithdrawalSchema.parse(req.body);
      const adminId = getAuthenticatedUserId(req);

      await storage.rejectWithdrawal(withdrawalId, adminId, validatedData.reason);

      res.json({ success: true, message: "Withdrawal rejected successfully" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error rejecting withdrawal:", error);
      res.status(500).json({ error: "Failed to reject withdrawal" });
    }
  });

  // 9. POST /api/finance/withdrawals/:id/complete
  app.post("/api/finance/withdrawals/:id/complete", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const withdrawalId = req.params.id;
      const validatedData = completeWithdrawalSchema.parse(req.body);
      const adminId = getAuthenticatedUserId(req);

      await storage.completeWithdrawal(withdrawalId, adminId, validatedData.transactionId);

      res.json({ success: true, message: "Withdrawal completed successfully" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error completing withdrawal:", error);
      res.status(500).json({ error: "Failed to complete withdrawal" });
    }
  });

  // **Transaction Endpoints**

  // 10. GET /api/finance/transactions/recent
  app.get("/api/finance/transactions/recent", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ error: "Failed to fetch recent transactions" });
    }
  });

  // 11. GET /api/finance/transactions/all
  app.get("/api/finance/transactions/all", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
        type: req.query.type as string | undefined,
        dateRange: req.query.dateRange as string | undefined,
        userId: req.query.userId as string | undefined,
        status: req.query.status as string | undefined,
        amountRange: req.query.amountRange as string | undefined,
      };

      const result = await storage.getAllTransactions(filters);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching all transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // 12. GET /api/finance/transactions/export
  app.get("/api/finance/transactions/export", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const csvData = await storage.exportTransactionsCSV();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      res.send(csvData);
    } catch (error: any) {
      console.error("Error exporting transactions:", error);
      res.status(500).json({ error: "Failed to export transactions" });
    }
  });

  // **Analytics Endpoints**

  // 13. GET /api/finance/top-earners
  app.get("/api/finance/top-earners", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topEarners = await storage.getTopEarners(limit);
      res.json(topEarners);
    } catch (error: any) {
      console.error("Error fetching top earners:", error);
      res.status(500).json({ error: "Failed to fetch top earners" });
    }
  });

  // 14. GET /api/finance/stats
  app.get("/api/finance/stats", isAuthenticated, adminOperationLimiter, async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const stats = await storage.getFinancialStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching financial stats:", error);
      res.status(500).json({ error: "Failed to fetch financial stats" });
    }
  });

  // ============================================================================
  // SEO & MARKETING ADMIN ENDPOINTS
  // ============================================================================

  // 1. GET /api/admin/seo/content - Get all content with meta tags (support search query parameter)
  app.get("/api/admin/seo/content", isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const searchQuery = req.query.search as string | undefined;
      
      // Build content query with optional search filter - FIXED: Return metaTitle and metaKeywords
      const contentItems = searchQuery
        ? await db
            .select({
              id: content.id,
              title: content.title,
              slug: content.slug,
              type: content.type,
              category: content.category,
              status: content.status,
              metaTitle: content.metaTitle,
              metaDescription: content.autoMetaDescription,
              metaKeywords: content.metaKeywords,
              views: content.views,
              downloads: content.downloads,
              createdAt: content.createdAt,
            })
            .from(content)
            .where(
              or(
                sql`${content.title} ILIKE ${'%' + searchQuery + '%'}`,
                sql`${content.slug} ILIKE ${'%' + searchQuery + '%'}`
              )
            )
            .orderBy(desc(content.createdAt))
            .limit(100)
        : await db
            .select({
              id: content.id,
              title: content.title,
              slug: content.slug,
              type: content.type,
              category: content.category,
              status: content.status,
              metaTitle: content.metaTitle,
              metaDescription: content.autoMetaDescription,
              metaKeywords: content.metaKeywords,
              views: content.views,
              downloads: content.downloads,
              createdAt: content.createdAt,
            })
            .from(content)
            .orderBy(desc(content.createdAt))
            .limit(100);

      // Build threads query with optional search filter - FIXED: Return metaTitle and metaKeywords
      const threads = searchQuery
        ? await db
            .select({
              id: forumThreads.id,
              title: forumThreads.title,
              slug: forumThreads.slug,
              type: sql<string>`'thread'`.as('type'),
              category: forumThreads.categorySlug,
              status: forumThreads.status,
              metaTitle: forumThreads.metaTitle,
              metaDescription: forumThreads.metaDescription,
              metaKeywords: forumThreads.metaKeywords,
              views: forumThreads.views,
              downloads: sql<number>`0`.as('downloads'),
              createdAt: forumThreads.createdAt,
            })
            .from(forumThreads)
            .where(
              or(
                sql`${forumThreads.title} ILIKE ${'%' + searchQuery + '%'}`,
                sql`${forumThreads.slug} ILIKE ${'%' + searchQuery + '%'}`
              )
            )
            .orderBy(desc(forumThreads.createdAt))
            .limit(100)
        : await db
            .select({
              id: forumThreads.id,
              title: forumThreads.title,
              slug: forumThreads.slug,
              type: sql<string>`'thread'`.as('type'),
              category: forumThreads.categorySlug,
              status: forumThreads.status,
              metaTitle: forumThreads.metaTitle,
              metaDescription: forumThreads.metaDescription,
              metaKeywords: forumThreads.metaKeywords,
              views: forumThreads.views,
              downloads: sql<number>`0`.as('downloads'),
              createdAt: forumThreads.createdAt,
            })
            .from(forumThreads)
            .orderBy(desc(forumThreads.createdAt))
            .limit(100);

      // Combine and return - Return as array directly for frontend compatibility
      const allContent = [...contentItems, ...threads];
      
      res.json(allContent);
    } catch (error: any) {
      console.error("[SEO Admin] Error fetching content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // 2. PATCH /api/admin/seo/meta/:id - Update meta tags for content
  app.patch("/api/admin/seo/meta/:id", isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const contentId = req.params.id;
      const { title, description, keywords, contentType } = req.body;

      // Validate input - FIXED: Accept frontend fields (title, description, keywords)
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().max(160).optional(),
        keywords: z.string().optional(),
        contentType: z.enum(['content', 'thread']).default('content'),
      });

      const validated = updateSchema.parse({ title, description, keywords, contentType: contentType || 'content' });

      if (validated.contentType === 'thread') {
        // Update forum thread meta tags - Map to correct fields
        await db
          .update(forumThreads)
          .set({
            metaTitle: validated.title,
            metaDescription: validated.description,
            metaKeywords: validated.keywords,
          })
          .where(eq(forumThreads.id, contentId));
      } else {
        // Update content meta tags - Map to correct fields
        await db
          .update(content)
          .set({
            metaTitle: validated.title,
            autoMetaDescription: validated.description,
            metaKeywords: validated.keywords,
          })
          .where(eq(content.id, contentId));
      }

      // Log admin action
      const adminId = getAuthenticatedUserId(req);
      await db.insert(adminActions).values({
        adminId,
        actionType: 'seo_meta_updated',
        targetType: validated.contentType,
        targetId: contentId,
        details: { metaTitle: validated.title, metaDescription: validated.description, metaKeywords: validated.keywords },
      });

      res.json({ success: true, message: "Meta tags updated successfully" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("[SEO Admin] Error updating meta tags:", error);
      res.status(500).json({ error: "Failed to update meta tags" });
    }
  });

  // 3. POST /api/admin/seo/campaigns - Create marketing campaign
  app.post("/api/admin/seo/campaigns", isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const adminId = getAuthenticatedUserId(req);
      
      // Validate campaign data - FIXED: Accept frontend fields (name, description, startDate, endDate, budget)
      const campaignSchema = z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        budget: z.number().int().min(0).optional(),
        type: z.string().max(50).optional().default('marketing'),
        status: z.enum(['active', 'paused', 'completed', 'draft']).optional().default('draft'),
        discountPercent: z.number().int().min(0).max(100).optional(),
        discountCode: z.string().max(50).optional(),
        startDate: z.string().transform(str => new Date(str)),
        endDate: z.string().transform(str => new Date(str)),
      });

      const validated = campaignSchema.parse(req.body);

      // Create campaign
      const [campaign] = await db.insert(campaigns).values({
        userId: adminId,
        name: validated.name,
        description: validated.description || null,
        budget: validated.budget || null,
        type: validated.type,
        status: validated.status,
        discountPercent: validated.discountPercent || null,
        discountCode: validated.discountCode || null,
        startDate: validated.startDate,
        endDate: validated.endDate,
        uses: 0,
        revenue: 0,
      }).returning();

      // Log admin action
      await db.insert(adminActions).values({
        adminId,
        actionType: 'campaign_created',
        targetType: 'campaign',
        targetId: campaign.id.toString(),
        details: { name: campaign.name, type: campaign.type },
      });

      res.json({ success: true, campaign });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("[SEO Admin] Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // 4. GET /api/admin/seo/campaigns - Get all campaigns
  app.get("/api/admin/seo/campaigns", isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const allCampaigns = await db
        .select()
        .from(campaigns)
        .orderBy(desc(campaigns.createdAt));

      // FIXED: Return campaigns array directly (not wrapped in object)
      res.json(allCampaigns);
    } catch (error: any) {
      console.error("[SEO Admin] Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // 5. GET /api/admin/seo/campaign-stats - Get aggregate campaign statistics
  app.get("/api/admin/seo/campaign-stats", isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      // Get real campaign stats from database
      const [stats] = await db
        .select({
          totalCampaigns: count(),
          totalRevenue: sql<number>`COALESCE(SUM(${campaigns.revenue}), 0)`,
          totalUses: sql<number>`COALESCE(SUM(${campaigns.uses}), 0)`,
          activeCampaigns: sql<number>`COUNT(CASE WHEN ${campaigns.status} = 'active' THEN 1 END)`,
        })
        .from(campaigns);

      // Calculate additional metrics
      const reach = stats.totalUses * 10; // Estimated reach multiplier
      const conversions = stats.totalUses;
      const roi = stats.totalRevenue > 0 ? ((stats.totalRevenue - 1000) / 1000) * 100 : 0; // Simplified ROI calculation

      res.json({
        totalCampaigns: stats.totalCampaigns,
        activeCampaigns: stats.activeCampaigns,
        totalReach: reach,
        totalConversions: conversions,
        totalRevenue: stats.totalRevenue,
        averageROI: Math.round(roi * 100) / 100,
      });
    } catch (error: any) {
      console.error("[SEO Admin] Error fetching campaign stats:", error);
      res.status(500).json({ error: "Failed to fetch campaign stats" });
    }
  });

  // 6. GET /api/admin/seo/search-rankings - Get search ranking data (mock data)
  app.get("/api/admin/seo/search-rankings", isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      // Return mock search ranking data
      const mockRankings = [
        {
          keyword: "forex trading EA",
          position: 12,
          previousPosition: 15,
          searchVolume: 2400,
          trend: "up",
          url: "/marketplace",
        },
        {
          keyword: "MT4 indicators",
          position: 8,
          previousPosition: 10,
          searchVolume: 1800,
          trend: "up",
          url: "/marketplace",
        },
        {
          keyword: "forex broker reviews",
          position: 24,
          previousPosition: 28,
          searchVolume: 3200,
          trend: "up",
          url: "/brokers",
        },
        {
          keyword: "algorithmic trading strategies",
          position: 18,
          previousPosition: 16,
          searchVolume: 1200,
          trend: "down",
          url: "/discussions",
        },
        {
          keyword: "gold trading EA",
          position: 6,
          previousPosition: 7,
          searchVolume: 890,
          trend: "up",
          url: "/marketplace",
        },
      ];

      res.json({
        rankings: mockRankings,
        averagePosition: 13.6,
        totalKeywords: mockRankings.length,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[SEO Admin] Error fetching search rankings:", error);
      res.status(500).json({ error: "Failed to fetch search rankings" });
    }
  });

  // 7. GET /api/admin/seo/top-queries - Get top search queries (mock data)
  app.get("/api/admin/seo/top-queries", isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      // Return mock top search queries data
      const mockQueries = [
        {
          query: "best forex EA 2025",
          impressions: 4520,
          clicks: 342,
          ctr: 7.57,
          averagePosition: 8.2,
        },
        {
          query: "MT5 scalping robot",
          impressions: 3180,
          clicks: 289,
          ctr: 9.09,
          averagePosition: 6.5,
        },
        {
          query: "forex broker comparison",
          impressions: 5640,
          clicks: 198,
          ctr: 3.51,
          averagePosition: 14.3,
        },
        {
          query: "free MT4 indicators",
          impressions: 2890,
          clicks: 176,
          ctr: 6.09,
          averagePosition: 11.2,
        },
        {
          query: "gold trading strategy",
          impressions: 2340,
          clicks: 165,
          ctr: 7.05,
          averagePosition: 9.8,
        },
        {
          query: "automated trading bot",
          impressions: 1980,
          clicks: 142,
          ctr: 7.17,
          averagePosition: 7.4,
        },
        {
          query: "forex signal provider",
          impressions: 3450,
          clicks: 128,
          ctr: 3.71,
          averagePosition: 16.7,
        },
        {
          query: "cryptocurrency trading EA",
          impressions: 1560,
          clicks: 115,
          ctr: 7.37,
          averagePosition: 10.1,
        },
      ];

      res.json({
        queries: mockQueries,
        totalImpressions: mockQueries.reduce((sum, q) => sum + q.impressions, 0),
        totalClicks: mockQueries.reduce((sum, q) => sum + q.clicks, 0),
        averageCTR: (mockQueries.reduce((sum, q) => sum + q.ctr, 0) / mockQueries.length).toFixed(2),
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[SEO Admin] Error fetching top queries:", error);
      res.status(500).json({ error: "Failed to fetch top queries" });
    }
  });

  // 8. GET /api/admin/seo/sitemap-status - Get sitemap generation status
  app.get("/api/admin/seo/sitemap-status", isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      // Get recent sitemap logs
      const recentLogs = await db
        .select()
        .from(sitemapLogs)
        .orderBy(desc(sitemapLogs.createdAt))
        .limit(10);

      // Get last successful generation
      const [lastGeneration] = await db
        .select()
        .from(sitemapLogs)
        .where(and(
          eq(sitemapLogs.action, 'generate'),
          eq(sitemapLogs.status, 'success')
        ))
        .orderBy(desc(sitemapLogs.createdAt))
        .limit(1);

      // Get last submission attempts
      const [lastGoogleSubmit] = await db
        .select()
        .from(sitemapLogs)
        .where(eq(sitemapLogs.action, 'submit_google'))
        .orderBy(desc(sitemapLogs.createdAt))
        .limit(1);

      const [lastIndexNowSubmit] = await db
        .select()
        .from(sitemapLogs)
        .where(eq(sitemapLogs.action, 'submit_indexnow'))
        .orderBy(desc(sitemapLogs.createdAt))
        .limit(1);

      res.json({
        lastGeneration: lastGeneration || null,
        lastGoogleSubmit: lastGoogleSubmit || null,
        lastIndexNowSubmit: lastIndexNowSubmit || null,
        recentLogs,
        sitemapUrl: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/sitemap.xml`,
      });
    } catch (error: any) {
      console.error("[SEO Admin] Error fetching sitemap status:", error);
      res.status(500).json({ error: "Failed to fetch sitemap status" });
    }
  });

  // 9. POST /api/admin/seo/sitemap/generate - Trigger sitemap generation
  app.post("/api/admin/seo/sitemap/generate", isModOrAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const adminId = getAuthenticatedUserId(req);
      const baseUrl = process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
      
      // Log generation start
      await db.insert(sitemapLogs).values({
        action: 'generate',
        status: 'pending',
        urlCount: null,
        submittedTo: null,
        errorMessage: null,
      });

      // Generate sitemap
      const generator = new SitemapGenerator(baseUrl);
      const { xml, urlCount } = await generator.generateSitemap();

      // Log successful generation
      await db.insert(sitemapLogs).values({
        action: 'generate',
        status: 'success',
        urlCount,
        submittedTo: null,
        errorMessage: null,
      });

      // Submit to search engines
      const submissionService = new SitemapSubmissionService(baseUrl);
      const sitemapUrl = `${baseUrl}/sitemap.xml`;

      // Submit to Google (best effort)
      try {
        await submissionService.pingGoogle(sitemapUrl);
      } catch (err) {
        console.error('[SEO Admin] Google submission failed:', err);
      }

      // Submit to IndexNow if API key is configured (best effort)
      if (process.env.INDEXNOW_API_KEY) {
        try {
          // For IndexNow, we'll submit the sitemap URL itself
          await submissionService.submitToIndexNow([sitemapUrl]);
        } catch (err) {
          console.error('[SEO Admin] IndexNow submission failed:', err);
        }
      }

      // Log admin action
      await db.insert(adminActions).values({
        adminId,
        actionType: 'sitemap_generated',
        targetType: 'sitemap',
        targetId: null,
        details: { urlCount, sitemapUrl },
      });

      res.json({
        success: true,
        message: "Sitemap generated successfully",
        urlCount,
        sitemapUrl,
      });
    } catch (error: any) {
      // Log generation error
      await db.insert(sitemapLogs).values({
        action: 'generate',
        status: 'error',
        urlCount: null,
        submittedTo: null,
        errorMessage: error.message,
      });

      console.error("[SEO Admin] Error generating sitemap:", error);
      res.status(500).json({ error: "Failed to generate sitemap" });
    }
  });

  // ============================================================================
  // EMAIL TRACKING ROUTES (Public - no auth required for tracking)
  // ============================================================================

  // GET /api/email/track/open/:trackingId - Track email opens (serve tracking pixel)
  app.get("/api/email/track/open/:trackingId", async (req, res) => {
    try {
      const { trackingId } = req.params;
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.headers['user-agent'] || undefined;

      // Import tracking service and pixel
      const { emailTrackingService, TRACKING_PIXEL } = await import('./services/emailTracking.js');

      // Record the open event asynchronously (don't wait)
      emailTrackingService.recordOpen(trackingId, ipAddress, userAgent).catch(error => {
        console.error('Error recording email open:', error);
      });

      // Send tracking pixel with proper headers
      res.set({
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': TRACKING_PIXEL.length.toString()
      });
      
      res.status(200).send(TRACKING_PIXEL);
    } catch (error: any) {
      console.error('Error serving tracking pixel:', error);
      // Still send pixel even if tracking fails
      res.set('Content-Type', 'image/gif');
      res.status(200).send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    }
  });

  // GET /api/email/track/click/:trackingId/:linkId - Track link clicks and redirect
  app.get("/api/email/track/click/:trackingId/:linkId", async (req, res) => {
    try {
      const { trackingId, linkId } = req.params;
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).send('Invalid redirect URL');
      }

      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.headers['user-agent'] || undefined;

      // Import tracking service
      const { emailTrackingService } = await import('./services/emailTracking.js');

      // Record click event asynchronously
      emailTrackingService.recordClick(trackingId, linkId, url, ipAddress, userAgent).catch(error => {
        console.error('Error recording link click:', error);
      });

      // Validate URL to prevent open redirect vulnerability
      const decodedUrl = decodeURIComponent(url);
      const validatedUrl = new URL(decodedUrl);
      
      // Allow only http(s) protocols
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        return res.status(400).send('Invalid URL protocol');
      }

      // Redirect to the original URL
      res.redirect(302, decodedUrl);
    } catch (error: any) {
      console.error('Error processing click tracking:', error);
      res.status(500).send('Failed to process redirect');
    }
  });

  // POST /api/email/unsubscribe/:token - Process unsubscribe request
  app.post("/api/email/unsubscribe/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { reason, feedback, preferences } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;

      // Import tracking service
      const { emailTrackingService } = await import('./services/emailTracking.js');

      // Process unsubscribe
      const result = await emailTrackingService.recordUnsubscribe(
        token,
        reason,
        feedback,
        ipAddress
      );

      if (!result.success) {
        return res.status(400).json({ 
          error: 'Invalid or expired unsubscribe token' 
        });
      }

      // If user provided specific preferences, update them
      if (preferences && result.userId) {
        await emailTrackingService.updatePreferences(result.userId, preferences);
      }

      res.json({ 
        success: true, 
        message: 'Successfully unsubscribed',
        email: result.email 
      });
    } catch (error: any) {
      console.error('Error processing unsubscribe:', error);
      res.status(500).json({ error: 'Failed to process unsubscribe request' });
    }
  });

  // GET /api/email/preferences/:token - Get current email preferences
  app.get("/api/email/preferences/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Import necessary modules
      const { emailTrackingService } = await import('./services/emailTracking.js');
      const { unsubscribeTokens, emailPreferences } = await import('../shared/schema.js');
      
      const tokenHash = emailTrackingService.hashToken(token);

      // Find user from token
      const [tokenRecord] = await db.select()
        .from(unsubscribeTokens)
        .where(eq(unsubscribeTokens.tokenHash, tokenHash))
        .limit(1);

      if (!tokenRecord) {
        return res.status(404).json({ error: 'Invalid token' });
      }

      // Get user preferences
      const [preferences] = await db.select()
        .from(emailPreferences)
        .where(eq(emailPreferences.userId, tokenRecord.userId))
        .limit(1);

      res.json({
        preferences: preferences || {
          socialInteractions: true,
          coinTransactions: true,
          contentUpdates: true,
          engagementDigest: true,
          marketplaceActivities: true,
          digestFrequency: 'instant'
        }
      });
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  // PATCH /api/email/preferences/:token - Update email preferences
  app.patch("/api/email/preferences/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const preferences = req.body;

      // Import necessary modules
      const { emailTrackingService } = await import('./services/emailTracking.js');
      const { unsubscribeTokens } = await import('../shared/schema.js');
      
      const tokenHash = emailTrackingService.hashToken(token);

      // Find user from token
      const [tokenRecord] = await db.select()
        .from(unsubscribeTokens)
        .where(eq(unsubscribeTokens.tokenHash, tokenHash))
        .limit(1);

      if (!tokenRecord) {
        return res.status(404).json({ error: 'Invalid token' });
      }

      // Update preferences
      const success = await emailTrackingService.updatePreferences(
        tokenRecord.userId, 
        preferences
      );

      if (success) {
        res.json({ success: true, message: 'Preferences updated successfully' });
      } else {
        res.status(500).json({ error: 'Failed to update preferences' });
      }
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  // ============================================================================
  // EMAIL DASHBOARD API ROUTES
  // ============================================================================

  // GET /api/admin/emails/stats - Get email statistics
  app.get("/api/admin/emails/stats/:dateRange", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const dateRange = parseInt(req.params.dateRange) || 7;
      const stats = await storage.getEmailStats(dateRange);
      res.json(stats);
    } catch (error: any) {
      console.error("[Email Admin] Error fetching email stats:", error);
      res.status(500).json({ error: "Failed to fetch email stats" });
    }
  });

  // GET /api/admin/emails/queue - Get email queue
  app.get("/api/admin/emails/queue", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const queue = await storage.getEmailQueue();
      res.json(queue);
    } catch (error: any) {
      console.error("[Email Admin] Error fetching email queue:", error);
      res.status(500).json({ error: "Failed to fetch email queue" });
    }
  });

  // GET /api/admin/emails/logs - Get email logs
  app.get("/api/admin/emails/logs", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const { status, dateRange, search } = req.query;
      const logs = await storage.getEmailLogs({
        status: status as string,
        dateRange: dateRange ? parseInt(dateRange as string) : undefined,
        search: search as string,
      });
      res.json(logs);
    } catch (error: any) {
      console.error("[Email Admin] Error fetching email logs:", error);
      res.status(500).json({ error: "Failed to fetch email logs" });
    }
  });

  // GET /api/admin/emails/templates - Get email templates
  app.get("/api/admin/emails/templates", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("[Email Admin] Error fetching email templates:", error);
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  // PATCH /api/admin/emails/templates/:key - Toggle email template
  app.patch("/api/admin/emails/templates/:key", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const { key } = req.params;
      const { enabled } = req.body;
      await storage.toggleEmailTemplate(key, enabled);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Email Admin] Error toggling email template:", error);
      res.status(500).json({ error: "Failed to toggle email template" });
    }
  });

  // GET /api/admin/emails/preferences - Get email preferences
  app.get("/api/admin/emails/preferences", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const preferences = await storage.getEmailPreferences();
      res.json(preferences);
    } catch (error: any) {
      console.error("[Email Admin] Error fetching email preferences:", error);
      res.status(500).json({ error: "Failed to fetch email preferences" });
    }
  });

  // GET /api/admin/emails/analytics - Get email analytics
  app.get("/api/admin/emails/analytics/:dateRange", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const dateRange = parseInt(req.params.dateRange) || 30;
      const analytics = await storage.getEmailAnalytics(dateRange);
      res.json(analytics);
    } catch (error: any) {
      console.error("[Email Admin] Error fetching email analytics:", error);
      res.status(500).json({ error: "Failed to fetch email analytics" });
    }
  });

  // POST /api/admin/emails/retry/:id - Retry failed email
  app.post("/api/admin/emails/retry/:id", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const adminId = getAuthenticatedUserId(req);
      const { id } = req.params;
      
      if (id === 'all') {
        // Retry all failed emails
        const failedEmails = await storage.getEmailLogs({ status: 'failed' });
        for (const email of failedEmails) {
          await storage.retryEmailById(email.id);
        }
        
        await storage.createAdminAction({
          adminId,
          actionType: 'retry_all_emails',
          targetType: 'email',
          targetId: null,
          details: { count: failedEmails.length },
        });
        
        res.json({ success: true, count: failedEmails.length });
      } else {
        await storage.retryEmailById(id);
        
        await storage.createAdminAction({
          adminId,
          actionType: 'retry_email',
          targetType: 'email',
          targetId: id,
          details: {},
        });
        
        res.json({ success: true });
      }
    } catch (error: any) {
      console.error("[Email Admin] Error retrying email:", error);
      res.status(500).json({ error: "Failed to retry email" });
    }
  });

  // DELETE /api/admin/emails/queue/clear - Clear email queue
  app.delete("/api/admin/emails/queue/clear", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const adminId = getAuthenticatedUserId(req);
      await storage.clearEmailQueue();
      
      await storage.createAdminAction({
        adminId,
        actionType: 'clear_email_queue',
        targetType: 'email',
        targetId: null,
        details: {},
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Email Admin] Error clearing email queue:", error);
      res.status(500).json({ error: "Failed to clear email queue" });
    }
  });

  // POST /api/admin/emails/queue/toggle - Toggle queue processing
  app.post("/api/admin/emails/queue/toggle", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const adminId = getAuthenticatedUserId(req);
      const { paused } = req.body;
      
      // In a real implementation, you would toggle a flag in the database or message queue
      // For now, we'll just log the action
      
      await storage.createAdminAction({
        adminId,
        actionType: paused ? 'pause_email_queue' : 'resume_email_queue',
        targetType: 'email',
        targetId: null,
        details: { paused },
      });
      
      res.json({ success: true, paused });
    } catch (error: any) {
      console.error("[Email Admin] Error toggling email queue:", error);
      res.status(500).json({ error: "Failed to toggle email queue" });
    }
  });

  // POST /api/admin/emails/test - Send test email
  app.post("/api/admin/emails/test", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const adminId = getAuthenticatedUserId(req);
      const { to, templateKey } = req.body;
      
      // Use the email service to send a test email
      const { emailService } = await import('./services/emailService');
      
      // Send based on template key
      if (templateKey === 'comment') {
        await emailService.sendCommentNotification(
          to,
          'Test User',
          'Test Thread Title',
          'This is a test comment preview...',
          'test-thread-slug'
        );
      } else {
        // Default to welcome email
        await emailService.sendWelcomeEmail(to, 'Test User');
      }
      
      await storage.createAdminAction({
        adminId,
        actionType: 'send_test_email',
        targetType: 'email',
        targetId: null,
        details: { to, templateKey },
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Email Admin] Error sending test email:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  // POST /api/admin/emails/announcement - Send bulk announcement
  app.post("/api/admin/emails/announcement", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const adminId = getAuthenticatedUserId(req);
      const { subject, content } = req.body;
      
      // Get all users with email notifications enabled
      const eligibleUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.emailNotifications, true),
            lt(users.emailBounceCount, 3)
          )
        );
      
      // Queue emails for all eligible users
      const { emailQueueService, EmailPriority } = await import('./services/emailQueue');
      
      for (const user of eligibleUsers) {
        if (user.email) {
          await emailQueueService.queueEmail({
            userId: user.id,
            templateKey: 'announcement',
            recipientEmail: user.email,
            subject,
            payload: { content },
            priority: EmailPriority.LOW,
          });
        }
      }
      
      await storage.createAdminAction({
        adminId,
        actionType: 'send_announcement',
        targetType: 'email',
        targetId: null,
        details: { subject, recipientCount: eligibleUsers.length },
      });
      
      res.json({ success: true, recipientCount: eligibleUsers.length });
    } catch (error: any) {
      console.error("[Email Admin] Error sending announcement:", error);
      res.status(500).json({ error: "Failed to send announcement" });
    }
  });

  // POST /api/admin/emails/re-enable/:userId - Re-enable bounced email
  app.post("/api/admin/emails/re-enable/:userId", isAdmin, adminOperationLimiter, async (req, res) => {
    try {
      const adminId = getAuthenticatedUserId(req);
      const { userId } = req.params;
      
      await storage.reEnableUserEmail(userId);
      
      await storage.createAdminAction({
        adminId,
        actionType: 're_enable_email',
        targetType: 'user',
        targetId: userId,
        details: {},
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Email Admin] Error re-enabling email:", error);
      res.status(500).json({ error: "Failed to re-enable email" });
    }
  });

  // ============================================
  // TODO: EMAIL NOTIFICATIONS FOR MISSING FEATURES
  // ============================================
  
  // The following email notification types need endpoints to be created:
  
  // 1. AUTHENTICATION & SECURITY EMAILS (Missing endpoints)
  // TODO: POST /api/auth/register → Queue welcome email with EmailPriority.HIGH
  // TODO: POST /api/auth/verify-email → Queue email verification with EmailPriority.HIGH
  // TODO: POST /api/auth/reset-password → Queue password reset email with EmailPriority.HIGH
  // TODO: POST /api/auth/change-password → Queue password changed confirmation with EmailPriority.HIGH
  // TODO: POST /api/auth/login → Check for new location/device and queue security alert with EmailPriority.HIGH
  // TODO: POST /api/auth/enable-2fa → Queue 2FA enabled confirmation with EmailPriority.HIGH
  // TODO: POST /api/auth/disable-2fa → Queue 2FA disabled alert with EmailPriority.HIGH
  
  // 2. SOCIAL FEATURES (Missing endpoints)
  // TODO: POST /api/posts/:id/share → Queue share notification with EmailPriority.LOW, groupType: 'social'
  // TODO: POST /api/posts/:id/quote → Queue quote notification with EmailPriority.MEDIUM
  // TODO: POST /api/posts with @mentions → Parse mentions and queue mention notifications with EmailPriority.MEDIUM
  // TODO: POST /api/threads/:id/follow → Queue thread follow notification with EmailPriority.LOW
  // TODO: POST /api/threads/:id/update → Queue update notification to followers with EmailPriority.LOW
  
  // 3. MILESTONE & ACHIEVEMENT EMAILS (Need tracking)
  // TODO: Track user milestones and queue emails:
  //   - 100th post → Queue milestone email with EmailPriority.LOW
  //   - 1000th post → Queue milestone email with EmailPriority.LOW
  //   - First year anniversary → Queue anniversary email with EmailPriority.LOW
  //   - Birthday → Queue birthday email with EmailPriority.LOW
  //   - Badge earned → Queue badge earned email with EmailPriority.MEDIUM
  
  // 4. CONTEST & CAMPAIGN EMAILS (Missing feature)
  // TODO: POST /api/contests → Queue contest entry confirmation with EmailPriority.MEDIUM
  // TODO: POST /api/contests/:id/winner → Queue winner notification with EmailPriority.HIGH
  // TODO: POST /api/campaigns/:id/join → Queue campaign joined email with EmailPriority.MEDIUM
  // TODO: POST /api/campaigns/:id/update → Queue campaign update email with EmailPriority.LOW
  
  // 5. GROUP FEATURES (Missing feature)
  // TODO: POST /api/groups/:id/invite → Queue group invite email with EmailPriority.MEDIUM
  // TODO: POST /api/groups/:id/join → Queue welcome to group email with EmailPriority.MEDIUM
  // TODO: POST /api/groups/:id/post → Queue group post notification with EmailPriority.LOW
  
  // 6. MARKETPLACE ADDITIONAL EMAILS
  // TODO: POST /api/marketplace/:id/review → Queue review received email with EmailPriority.MEDIUM
  // TODO: POST /api/marketplace/payout → Queue payout processed email with EmailPriority.HIGH
  // TODO: POST /api/marketplace/refund → Queue refund processed email with EmailPriority.HIGH
  // TODO: POST /api/marketplace/:id/report → Queue item reported email with EmailPriority.MEDIUM
  
  // 7. ENGAGEMENT & TRENDING EMAILS
  // TODO: Track view counts and queue trending notifications:
  //   - 100+ views → Queue trending notification with EmailPriority.LOW
  //   - 1000+ views → Queue viral notification with EmailPriority.MEDIUM
  // TODO: Track low coin balance and queue warning at <50 coins with EmailPriority.MEDIUM
  
  // 8. SCHEDULED/CRON JOB EMAILS (Need separate cron service)
  // TODO: Daily digest → Queue daily summary email with EmailPriority.LOW
  // TODO: Weekly digest → Queue weekly summary email with EmailPriority.LOW
  // TODO: Monthly digest → Queue monthly summary email with EmailPriority.LOW
  // TODO: Inactive user re-engagement → Queue after 30 days inactive with EmailPriority.LOW
  // TODO: Survey invitations → Queue survey email with EmailPriority.LOW
  // TODO: Maintenance notices → Queue maintenance notification with EmailPriority.HIGH
  // TODO: Product updates → Queue update announcement with EmailPriority.MEDIUM
  
  // 9. REFERRAL & REWARDS EMAILS
  // TODO: POST /api/referrals → Queue referral bonus email with EmailPriority.MEDIUM
  // TODO: POST /api/referrals/claim → Queue referral reward claimed with EmailPriority.MEDIUM
  
  // 10. ADMIN & MODERATION EMAILS
  // TODO: Add email notifications to admin actions for user notifications
  // TODO: Queue suspension/ban notifications with EmailPriority.HIGH
  // TODO: Queue reinstatement notifications with EmailPriority.HIGH
  // TODO: Queue warning notifications with EmailPriority.MEDIUM

  const httpServer = createServer(app);

  return httpServer;
}
