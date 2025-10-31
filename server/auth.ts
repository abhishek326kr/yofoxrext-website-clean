import type { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { db } from "./db.js";
import { users } from "../shared/schema.js";
import { eq, or } from "drizzle-orm";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK for Google OAuth
let firebaseApp: admin.app.App | null = null;

function initializeFirebase() {
  if (firebaseApp) return firebaseApp;
  
  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.warn("⚠️  GOOGLE_SERVICE_ACCOUNT_KEY not found - Google OAuth will be disabled");
      return null;
    }
    
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log("✅ Firebase Admin SDK initialized");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    return null;
  }
}

// Export function to check if Firebase is initialized
export function isFirebaseInitialized(): boolean {
  return firebaseApp !== null;
}

// Setup Email/Password authentication with Passport Local Strategy
export function setupEmailAuth() {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          // Find user by email
          const userResults = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          const user = userResults[0];

          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Check if user has a password hash (email auth)
          if (!user.password_hash) {
            return done(null, false, { 
              message: "This account uses a different login method. Please use Google Sign-In." 
            });
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password_hash);

          if (!isValidPassword) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Check if account is banned or suspended
          if (user.status === "banned") {
            return done(null, false, { message: "This account has been banned" });
          }

          if (user.status === "suspended" && user.suspendedUntil) {
            const now = new Date();
            if (now < user.suspendedUntil) {
              return done(null, false, { 
                message: `This account is suspended until ${user.suspendedUntil.toLocaleDateString()}` 
              });
            } else {
              // Auto-unsuspend if suspension period has passed
              await db
                .update(users)
                .set({ status: "active", suspendedUntil: null })
                .where(eq(users.id, user.id));
              user.status = "active";
            }
          }

          // Update last login
          await db
            .update(users)
            .set({ last_login_at: new Date() })
            .where(eq(users.id, user.id));

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    const user = userResults[0];

    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Helper: Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper: Verify Google ID token and get user info
export async function verifyGoogleToken(idToken: string) {
  const firebase = initializeFirebase();
  
  if (!firebase) {
    throw new Error("Firebase Admin SDK not initialized");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
  } catch (error: any) {
    throw new Error(`Invalid Google ID token: ${error.message}`);
  }
}

// Helper: Find or create user from Google OAuth
export async function findOrCreateGoogleUser(googleUser: {
  uid: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}) {
  if (!googleUser.email) {
    throw new Error("Email is required for Google authentication");
  }

  // Check if user exists with this Google UID
  let userResults = await db
    .select()
    .from(users)
    .where(eq(users.google_uid, googleUser.uid))
    .limit(1);

  let user = userResults[0];

  if (user) {
    // Update last login
    await db
      .update(users)
      .set({ last_login_at: new Date() })
      .where(eq(users.id, user.id));

    return user;
  }

  // Check if user exists with this email (from different auth method)
  userResults = await db
    .select()
    .from(users)
    .where(eq(users.email, googleUser.email))
    .limit(1);

  user = userResults[0];

  if (user) {
    // Link Google account to existing user
    await db
      .update(users)
      .set({
        google_uid: googleUser.uid,
        auth_provider: "google",
        is_email_verified: googleUser.emailVerified,
        profileImageUrl: googleUser.picture,
        last_login_at: new Date(),
      })
      .where(eq(users.id, user.id));

    // Fetch updated user
    userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return userResults[0];
  }

  // Create new user
  const nameParts = googleUser.name?.split(" ") || [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const username = googleUser.email.split("@")[0];

  const newUserResults = await db
    .insert(users)
    .values({
      email: googleUser.email,
      google_uid: googleUser.uid,
      auth_provider: "google",
      is_email_verified: googleUser.emailVerified,
      username: `${username}_${Date.now()}`, // Ensure unique username
      firstName,
      lastName,
      profileImageUrl: googleUser.picture,
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

  return newUserResults[0];
}

// Middleware: Check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  next();
}

// Middleware: Check if user has specific role
export function hasRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user as any;

    if (!user.role || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: "You don't have permission to access this resource" 
      });
    }

    next();
  };
}

// Middleware: Admin only
export const isAdmin = hasRole("admin");

// Middleware: Admin or Moderator
export const isModeratorOrAdmin = hasRole("admin", "moderator");

// Initialize Firebase on module load
initializeFirebase();
