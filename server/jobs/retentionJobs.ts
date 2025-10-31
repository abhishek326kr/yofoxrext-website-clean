import cron from "node-cron";
import { db } from "../db.js";
import { unlockMaturedVaults, extendVaultUnlockForInactiveUsers } from "../services/vaultService.js";
import { updateRetentionMetrics } from "../services/loyaltyService.js";
import { checkAndAwardBadges } from "../services/badgeService.js";
import { users, abandonmentEmails, aiNudges } from "../../shared/schema.js";
import { eq, and, lt, or, isNull, desc } from "drizzle-orm";

/**
 * Initialize all retention-related cron jobs
 * 
 * Note: These jobs are commented out by default for performance reasons.
 * Uncomment specific jobs as needed based on your retention strategy.
 */
export function initRetentionJobs() {
  console.log('[RETENTION JOBS] Initializing retention cron jobs...');
  
  // Job 1: Daily vault unlock at 2 AM
  // Unlocks vault bonuses that have reached their 30-day maturity date
  cron.schedule("0 2 * * *", async () => {
    console.log('[RETENTION JOBS] Running daily vault unlock job...');
    try {
      const unlockedCount = await unlockMaturedVaults();
      console.log(`[RETENTION JOBS] Vault unlock job completed: ${unlockedCount} vaults unlocked`);
    } catch (error) {
      console.error('[RETENTION JOBS] Error in vault unlock job:', error);
    }
  });
  
  // Job 2: Weekly vault extension for inactive users (Sunday at 3 AM)
  // Extends vault unlock dates by 7 days for users inactive in the last 7 days
  cron.schedule("0 3 * * 0", async () => {
    console.log('[RETENTION JOBS] Running weekly inactive user vault extension job...');
    try {
      const extendedCount = await extendVaultUnlockForInactiveUsers();
      console.log(`[RETENTION JOBS] Vault extension job completed: ${extendedCount} users affected`);
    } catch (error) {
      console.error('[RETENTION JOBS] Error in vault extension job:', error);
    }
  });
  
  // Job 3: Daily retention metrics calculation (disabled by default)
  // Uncomment to enable daily recalculation of all user retention metrics
  /*
  cron.schedule("0 4 * * *", async () => {
    console.log('[RETENTION JOBS] Running daily retention metrics calculation...');
    try {
      const allUsers = await db.select({ id: users.id }).from(users);
      let updated = 0;
      
      for (const user of allUsers) {
        await updateRetentionMetrics(user.id);
        updated++;
      }
      
      console.log(`[RETENTION JOBS] Retention metrics calculation completed: ${updated} users updated`);
    } catch (error) {
      console.error('[RETENTION JOBS] Error in retention metrics calculation:', error);
    }
  });
  */
  
  // Job 4: Daily badge auto-award (disabled by default)
  // Uncomment to enable daily automatic badge checking for all users
  /*
  cron.schedule("0 5 * * *", async () => {
    console.log('[RETENTION JOBS] Running daily badge auto-award job...');
    try {
      const allUsers = await db.select({ id: users.id }).from(users);
      let badgesAwarded = 0;
      
      for (const user of allUsers) {
        const badges = await checkAndAwardBadges(user.id);
        badgesAwarded += badges.length;
      }
      
      console.log(`[RETENTION JOBS] Badge auto-award job completed: ${badgesAwarded} badges awarded`);
    } catch (error) {
      console.error('[RETENTION JOBS] Error in badge auto-award job:', error);
    }
  });
  */
  
  // Job 5: Daily abandonment email scheduler (disabled by default)
  // Uncomment to enable automatic abandonment email scheduling
  /*
  cron.schedule("0 6 * * *", async () => {
    console.log('[RETENTION JOBS] Running abandonment email scheduler...');
    try {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      
      // Find users inactive for 2, 5, or 10 days
      const inactiveUsers = await db.select({ 
        id: users.id, 
        email: users.email,
        lastActive: users.lastActive 
      })
      .from(users)
      .where(
        or(
          and(
            lt(users.lastActive, twoDaysAgo),
            gte(users.lastActive, fiveDaysAgo)
          ),
          and(
            lt(users.lastActive, fiveDaysAgo),
            gte(users.lastActive, tenDaysAgo)
          ),
          lt(users.lastActive, tenDaysAgo)
        )
      );
      
      let scheduled = 0;
      
      for (const user of inactiveUsers) {
        const daysSinceActive = Math.floor((now.getTime() - (user.lastActive?.getTime() || 0)) / (24 * 60 * 60 * 1000));
        let emailType: string | null = null;
        
        if (daysSinceActive === 2) emailType = "day_2";
        else if (daysSinceActive === 5) emailType = "day_5";
        else if (daysSinceActive === 10) emailType = "day_10";
        
        if (emailType) {
          // Check if email already scheduled
          const existing = await db.select()
            .from(abandonmentEmails)
            .where(
              and(
                eq(abandonmentEmails.userId, user.id),
                eq(abandonmentEmails.emailType, emailType),
                eq(abandonmentEmails.status, "pending")
              )
            )
            .limit(1);
          
          if (existing.length === 0) {
            await db.insert(abandonmentEmails).values({
              userId: user.id,
              emailType,
              scheduledFor: new Date(),
              status: "pending"
            });
            scheduled++;
          }
        }
      }
      
      console.log(`[RETENTION JOBS] Abandonment email scheduler completed: ${scheduled} emails scheduled`);
    } catch (error) {
      console.error('[RETENTION JOBS] Error in abandonment email scheduler:', error);
    }
  });
  */
  
  // Job 6: Daily AI nudge generation (disabled by default)
  // Uncomment to enable automatic AI nudge generation for inactive users
  /*
  cron.schedule("0 7 * * *", async () => {
    console.log('[RETENTION JOBS] Running AI nudge generation job...');
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      // Find users inactive for 3+ days who don't have recent nudges
      const inactiveUsers = await db.select({ 
        id: users.id,
        username: users.username
      })
      .from(users)
      .where(
        or(
          isNull(users.lastActive),
          lt(users.lastActive, threeDaysAgo)
        )
      );
      
      let nudgesCreated = 0;
      
      for (const user of inactiveUsers) {
        // Check if user has dismissed nudge in last 7 days
        const recentNudge = await db.select()
          .from(aiNudges)
          .where(
            and(
              eq(aiNudges.userId, user.id),
              gte(aiNudges.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            )
          )
          .orderBy(desc(aiNudges.createdAt))
          .limit(1);
        
        if (recentNudge.length === 0) {
          // Generate personalized nudge
          const nudgeMessages = [
            {
              type: "post_in_category",
              message: "Share your trading insights! The community would love to hear your perspective on recent market trends.",
              url: "/forum/new-thread"
            },
            {
              type: "reply_to_thread",
              message: "There are new discussions in your favorite categories. Join the conversation!",
              url: "/forum"
            },
            {
              type: "upload_content",
              message: "Got trading strategies to share? Upload content and earn coins when others find it valuable.",
              url: "/content/upload"
            }
          ];
          
          const randomNudge = nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)];
          
          await db.insert(aiNudges).values({
            userId: user.id,
            nudgeType: randomNudge.type,
            message: randomNudge.message,
            actionUrl: randomNudge.url,
            priority: "medium"
          });
          
          nudgesCreated++;
        }
      }
      
      console.log(`[RETENTION JOBS] AI nudge generation completed: ${nudgesCreated} nudges created`);
    } catch (error) {
      console.error('[RETENTION JOBS] Error in AI nudge generation:', error);
    }
  });
  */
  
  console.log('[RETENTION JOBS] Retention cron jobs initialized successfully');
  console.log('[RETENTION JOBS] Active jobs: vault unlock (daily 2 AM), vault extension (weekly Sunday 3 AM)');
  console.log('[RETENTION JOBS] Note: Additional jobs are commented out for performance. Uncomment as needed.');
}

/**
 * Manually trigger retention metrics update for a specific user
 * Useful for testing or immediate updates after significant user actions
 */
export async function triggerRetentionUpdate(userId: string) {
  console.log(`[RETENTION JOBS] Manually triggering retention update for user ${userId}`);
  
  try {
    await updateRetentionMetrics(userId);
    const badges = await checkAndAwardBadges(userId);
    
    console.log(`[RETENTION JOBS] Retention update completed for user ${userId}: ${badges.length} badges awarded`);
    
    return {
      success: true,
      badgesAwarded: badges.length
    };
  } catch (error) {
    console.error(`[RETENTION JOBS] Error updating retention for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Manually trigger vault unlock job
 * Useful for testing or immediate unlocks
 */
export async function triggerVaultUnlock() {
  console.log('[RETENTION JOBS] Manually triggering vault unlock...');
  
  try {
    const unlockedCount = await unlockMaturedVaults();
    console.log(`[RETENTION JOBS] Vault unlock completed: ${unlockedCount} vaults unlocked`);
    
    return {
      success: true,
      unlockedCount
    };
  } catch (error) {
    console.error('[RETENTION JOBS] Error in vault unlock:', error);
    throw error;
  }
}

/**
 * Manually trigger vault extension for inactive users
 * Useful for testing or immediate extensions
 */
export async function triggerVaultExtension() {
  console.log('[RETENTION JOBS] Manually triggering vault extension...');
  
  try {
    const extendedCount = await extendVaultUnlockForInactiveUsers();
    console.log(`[RETENTION JOBS] Vault extension completed: ${extendedCount} users affected`);
    
    return {
      success: true,
      extendedCount
    };
  } catch (error) {
    console.error('[RETENTION JOBS] Error in vault extension:', error);
    throw error;
  }
}
