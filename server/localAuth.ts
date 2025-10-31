import { Strategy as LocalStrategy } from "passport-local";
import passport from "passport";
import type { Express } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and dashes"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
  email: z.string().email("Invalid email address").optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
});

// Hash password with bcrypt
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Verify password with bcrypt
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Setup local authentication strategy
export async function setupLocalAuth(app: Express) {
  // Configure passport local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          // Find user by username or email
          let [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);
          
          if (!user) {
            // Also check by email if username not found
            const [userByEmail] = await db
              .select()
              .from(users)
              .where(eq(users.email, username))
              .limit(1);
            
            if (!userByEmail) {
              return done(null, false, { message: "Invalid username or password" });
            }
            
            // Found by email, continue with that user
            user = userByEmail;
          }
          
          // Check if user has a password (for backward compatibility with Replit-only users)
          if (!user.password) {
            return done(null, false, { 
              message: "This account uses Replit authentication. Please use the Replit login." 
            });
          }
          
          // Verify password
          const isValidPassword = await verifyPassword(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid username or password" });
          }
          
          // Check if account is banned or suspended
          if (user.status === "banned") {
            return done(null, false, { message: "Account has been banned" });
          }
          
          if (user.status === "suspended" && user.suspendedUntil) {
            const now = new Date();
            if (now < user.suspendedUntil) {
              return done(null, false, { 
                message: `Account is suspended until ${user.suspendedUntil.toLocaleString()}` 
              });
            }
            
            // Suspension expired, update status
            await db
              .update(users)
              .set({ status: "active", suspendedUntil: null })
              .where(eq(users.id, user.id));
          }
          
          // Update last active timestamp
          await db
            .update(users)
            .set({ lastActive: new Date() })
            .where(eq(users.id, user.id));
          
          // Return user object for session
          const sessionUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            role: user.role,
            sessionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          };
          
          return done(null, sessionUser);
        } catch (error) {
          console.error("[LOCAL AUTH] Login error:", error);
          return done(error);
        }
      }
    )
  );
  
  // Login endpoint
  app.post("/api/login", async (req, res, next) => {
    try {
      // Validate input
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid input",
          details: validation.error.errors 
        });
      }
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          console.error("[LOCAL AUTH] Authentication error:", err);
          return res.status(500).json({ error: "Authentication failed" });
        }
        
        if (!user) {
          return res.status(401).json({ 
            error: info?.message || "Invalid credentials" 
          });
        }
        
        req.logIn(user, (err) => {
          if (err) {
            console.error("[LOCAL AUTH] Session error:", err);
            return res.status(500).json({ error: "Failed to create session" });
          }
          
          // Return user info (without sensitive data)
          res.json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              role: user.role,
            },
          });
        });
      })(req, res, next);
    } catch (error: any) {
      console.error("[LOCAL AUTH] Login endpoint error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
  
  // Register endpoint (optional - can be disabled in production)
  if (process.env.ALLOW_REGISTRATION !== "false") {
    app.post("/api/register", async (req, res) => {
      try {
        // Validate input
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ 
            error: "Invalid input",
            details: validation.error.errors 
          });
        }
        
        const { username, password, email, firstName, lastName } = validation.data;
        
        // Check if username already exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
        
        if (existingUser) {
          return res.status(409).json({ error: "Username already exists" });
        }
        
        // Check if email already exists (if provided)
        if (email) {
          const [existingEmail] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          
          if (existingEmail) {
            return res.status(409).json({ error: "Email already registered" });
          }
        }
        
        // Hash password
        const hashedPassword = await hashPassword(password);
        
        // Create user
        const [newUser] = await db
          .insert(users)
          .values({
            username,
            password: hashedPassword,
            email: email || null,
            firstName: firstName || null,
            lastName: lastName || null,
            role: "member",
            status: "active",
            totalCoins: 50, // Welcome bonus
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        // Auto-login after registration
        const sessionUser = {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profileImageUrl: newUser.profileImageUrl,
          role: newUser.role,
          sessionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
        
        req.logIn(sessionUser, (err) => {
          if (err) {
            console.error("[LOCAL AUTH] Auto-login error:", err);
            // Registration succeeded but auto-login failed
            return res.json({
              success: true,
              message: "Registration successful. Please login.",
            });
          }
          
          res.json({
            success: true,
            message: "Registration successful",
            user: {
              id: newUser.id,
              username: newUser.username,
              email: newUser.email,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              role: newUser.role,
            },
          });
        });
      } catch (error: any) {
        console.error("[LOCAL AUTH] Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
      }
    });
  }
  
  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("[LOCAL AUTH] Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      
      // Clear session cookie
      req.session.destroy((err) => {
        if (err) {
          console.error("[LOCAL AUTH] Session destroy error:", err);
        }
        
        res.clearCookie("yoforex.sid");
        res.json({ success: true, message: "Logged out successfully" });
      });
    });
  });
  
  // Password reset endpoint (optional)
  if (process.env.ENABLE_PASSWORD_RESET === "true") {
    app.post("/api/reset-password", async (req, res) => {
      // TODO: Implement password reset with email verification
      res.status(501).json({ 
        error: "Password reset not yet implemented",
        message: "Please contact support for password reset" 
      });
    });
  }
  
  // Change password endpoint (for authenticated users)
  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }
      
      const user = req.user as any;
      
      // Get user with password from database
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      
      if (!dbUser || !dbUser.password) {
        return res.status(400).json({ error: "Cannot change password for this account type" });
      }
      
      // Verify current password
      const isValid = await verifyPassword(currentPassword, dbUser.password);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error: any) {
      console.error("[LOCAL AUTH] Password change error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  
  console.log("✅ Local authentication configured");
  if (process.env.ALLOW_REGISTRATION !== "false") {
    console.log("📝 User registration is ENABLED at /api/register");
  }
  if (process.env.ENABLE_PASSWORD_RESET === "true") {
    console.log("🔑 Password reset is ENABLED at /api/reset-password");
  }
}