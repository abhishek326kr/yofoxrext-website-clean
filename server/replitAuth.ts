import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import { storage } from "./storage";

// Check if Replit environment is available
export function isReplitEnvironment(): boolean {
  return !!(process.env.REPLIT_DOMAINS && process.env.REPL_ID);
}

// Validate Replit configuration
export function validateReplitConfig(): { valid: boolean; error?: string } {
  if (!process.env.REPLIT_DOMAINS) {
    return { 
      valid: false, 
      error: "REPLIT_DOMAINS environment variable not set. Replit authentication unavailable." 
    };
  }
  
  if (!process.env.REPL_ID) {
    return { 
      valid: false, 
      error: "REPL_ID environment variable not set. Replit authentication unavailable." 
    };
  }
  
  if (!process.env.DATABASE_URL) {
    return {
      valid: false,
      error: "DATABASE_URL not set. Required for session storage."
    };
  }
  
  return { valid: true };
}

const getOidcConfig = memoize(
  async () => {
    if (!isReplitEnvironment()) {
      throw new Error("Cannot get OIDC config: Not in Replit environment");
    }
    
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

async function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
  
  const dbUser = await storage.getUser(user.claims.sub);
  if (dbUser) {
    user.claims.role = dbUser.role;
  }
}

async function upsertUser(claims: any) {
  // Generate username from first/last name or email
  let username = '';
  if (claims["first_name"] || claims["last_name"]) {
    username = `${claims["first_name"] || ''}_${claims["last_name"] || ''}`.trim().replace(/\s+/g, '_').toLowerCase();
  } else if (claims["email"]) {
    username = claims["email"].split('@')[0];
  } else {
    username = `user_${claims["sub"]}`;
  }

  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    username,
  });
}

// Setup Replit authentication - called from flexibleAuth.ts
export async function setupReplitAuth(app: Express) {
  // Validate configuration
  const configCheck = validateReplitConfig();
  if (!configCheck.valid) {
    console.error(`❌ Replit Auth Error: ${configCheck.error}`);
    throw new Error(configCheck.error);
  }

  try {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      await upsertUser(tokens.claims());
      await updateUserSession(user, tokens);
      verified(null, user);
    };

    // Register strategy for each domain
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    for (const domain of domains) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
    }

    // Setup routes
    app.get("/api/login", (req, res, next) => {
      const strategyName = `replitauth:${req.hostname}`;
      
      // Check if strategy exists for this hostname
      if (!domains.includes(req.hostname)) {
        console.error(`No Replit auth strategy for hostname: ${req.hostname}`);
        return res.status(400).json({ 
          error: "Invalid hostname for Replit authentication",
          hostname: req.hostname,
          configured: domains,
        });
      }
      
      passport.authenticate(strategyName, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      const strategyName = `replitauth:${req.hostname}`;
      
      if (!domains.includes(req.hostname)) {
        console.error(`No Replit auth strategy for hostname: ${req.hostname}`);
        return res.status(400).json({ 
          error: "Invalid hostname for Replit authentication" 
        });
      }
      
      passport.authenticate(strategyName, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.post("/api/logout", (req, res) => {
      req.logout(() => {
        // Build logout URL if we have the config
        if (isReplitEnvironment() && config) {
          try {
            const logoutUrl = client.buildEndSessionUrl(config, {
              client_id: process.env.REPL_ID!,
              post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
            }).href;
            res.redirect(logoutUrl);
          } catch (error) {
            console.error("Failed to build logout URL:", error);
            res.redirect("/");
          }
        } else {
          res.redirect("/");
        }
      });
    });
    
    console.log(`✅ Replit OIDC authentication configured for domains: ${domains.join(", ")}`);
  } catch (error: any) {
    console.error("❌ Failed to setup Replit authentication:", error.message);
    throw error;
  }
}

// Replit-specific authentication middleware
export const isAuthenticatedReplit: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: "Session expired" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    await updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    console.error("Token refresh failed:", error);
    return res.status(401).json({ error: "Session expired" });
  }
};