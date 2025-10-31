import { db } from '../db.js';
import { retentionBadges, forumReplies, vaultCoins, users, forumThreads, contentPurchases } from '../../shared/schema.js';
import { and, eq, sql, gte } from 'drizzle-orm';

/**
 * Badge configuration
 * Define all available badges, their thresholds, rewards, and descriptions
 */
export const BADGE_CONFIG = {
  forum_guardian: {
    threshold: 50,
    name: "Forum Guardian",
    reward: 100,
    description: "Posted 50+ helpful replies"
  },
  vault_master: {
    threshold: 1000,
    name: "Vault Master",
    reward: 200,
    description: "Unlocked 1,000+ vault coins"
  },
  early_bird: {
    threshold: 100,
    name: "Early Bird",
    reward: 50,
    description: "Posted 100+ times before 9 AM"
  },
  discussion_starter: {
    threshold: 10,
    name: "Discussion Starter",
    reward: 75,
    description: "Created 10+ popular threads"
  },
  marketplace_pro: {
    threshold: 5,
    name: "Marketplace Pro",
    reward: 150,
    description: "Made 5+ sales in marketplace"
  },
  community_champion: {
    threshold: 100,
    name: "Community Champion",
    reward: 300,
    description: "Contributed 100+ times across the platform"
  }
} as const;

export type BadgeType = keyof typeof BADGE_CONFIG;

/**
 * Check all badge criteria for a user and award new badges
 * @param userId - User ID to check
 */
export async function checkAndAwardBadges(userId: string) {
  console.log(`[BADGES] Checking badge eligibility for user ${userId}`);
  
  const badgesAwarded: string[] = [];
  
  // Check Forum Guardian: 50+ replies
  const replyCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(forumReplies)
    .where(eq(forumReplies.userId, userId));
  
  if ((replyCount[0]?.count || 0) >= 50) {
    const awarded = await awardBadgeIfNew(userId, "forum_guardian");
    if (awarded) badgesAwarded.push("forum_guardian");
  }
  
  // Check Vault Master: 1000+ unlocked vault coins
  const vaultTotal = await db.select({ total: sql<number>`COALESCE(SUM(${vaultCoins.amount}), 0)` })
    .from(vaultCoins)
    .where(
      and(
        eq(vaultCoins.userId, userId),
        eq(vaultCoins.status, "unlocked")
      )
    );
  
  if ((vaultTotal[0]?.total || 0) >= 1000) {
    const awarded = await awardBadgeIfNew(userId, "vault_master");
    if (awarded) badgesAwarded.push("vault_master");
  }
  
  // Check Early Bird: 100+ posts before 9 AM
  const earlyPostCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(forumReplies)
    .where(
      and(
        eq(forumReplies.userId, userId),
        sql`EXTRACT(HOUR FROM ${forumReplies.createdAt}) < 9`
      )
    );
  
  if ((earlyPostCount[0]?.count || 0) >= 100) {
    const awarded = await awardBadgeIfNew(userId, "early_bird");
    if (awarded) badgesAwarded.push("early_bird");
  }
  
  // Check Discussion Starter: 10+ threads
  const threadCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(forumThreads)
    .where(eq(forumThreads.authorId, userId));
  
  if ((threadCount[0]?.count || 0) >= 10) {
    const awarded = await awardBadgeIfNew(userId, "discussion_starter");
    if (awarded) badgesAwarded.push("discussion_starter");
  }
  
  // Check Marketplace Pro: 5+ sales
  const salesCount = await db.select({ count: sql<number>`COUNT(DISTINCT ${contentPurchases.sellerId})` })
    .from(contentPurchases)
    .where(eq(contentPurchases.sellerId, userId));
  
  if ((salesCount[0]?.count || 0) >= 5) {
    const awarded = await awardBadgeIfNew(userId, "marketplace_pro");
    if (awarded) badgesAwarded.push("marketplace_pro");
  }
  
  // Check Community Champion: 100+ total contributions (threads + replies)
  const totalContributions = (threadCount[0]?.count || 0) + (replyCount[0]?.count || 0);
  
  if (totalContributions >= 100) {
    const awarded = await awardBadgeIfNew(userId, "community_champion");
    if (awarded) badgesAwarded.push("community_champion");
  }
  
  console.log(`[BADGES] Awarded ${badgesAwarded.length} new badges:`, badgesAwarded);
  
  return badgesAwarded;
}

/**
 * Award a badge to a user if they don't already have it
 * @param userId - User ID
 * @param badgeType - Type of badge to award
 * @returns true if badge was awarded, false if user already has it
 */
async function awardBadgeIfNew(userId: string, badgeType: BadgeType): Promise<boolean> {
  // Check if user already has this badge
  const existing = await db.select().from(retentionBadges)
    .where(
      and(
        eq(retentionBadges.userId, userId),
        eq(retentionBadges.badgeType, badgeType)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    return false; // Badge already exists
  }
  
  const config = BADGE_CONFIG[badgeType];
  
  // Create the badge
  await db.insert(retentionBadges).values({
    userId,
    badgeType,
    badgeName: config.name,
    badgeDescription: config.description,
    coinReward: config.reward
  });
  
  // Award coins to user
  await db.update(users)
    .set({ 
      totalCoins: sql`${users.totalCoins} + ${config.reward}`
    })
    .where(eq(users.id, userId));
  
  console.log(`[BADGES] Awarded '${config.name}' badge to user ${userId} (+${config.reward} coins)`);
  
  return true;
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(userId: string) {
  return await db.select().from(retentionBadges)
    .where(eq(retentionBadges.userId, userId))
    .orderBy(retentionBadges.unlockedAt);
}

/**
 * Get badge progress for a user
 * Shows how close they are to unlocking each badge
 */
export async function getBadgeProgress(userId: string) {
  // Get user's current badges
  const userBadges = await getUserBadges(userId);
  const earnedBadgeTypes = new Set(userBadges.map(b => b.badgeType));
  
  // Get counts for each metric
  const replyCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(forumReplies)
    .where(eq(forumReplies.userId, userId));
  
  const vaultTotal = await db.select({ total: sql<number>`COALESCE(SUM(${vaultCoins.amount}), 0)` })
    .from(vaultCoins)
    .where(
      and(
        eq(vaultCoins.userId, userId),
        eq(vaultCoins.status, "unlocked")
      )
    );
  
  const earlyPostCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(forumReplies)
    .where(
      and(
        eq(forumReplies.userId, userId),
        sql`EXTRACT(HOUR FROM ${forumReplies.createdAt}) < 9`
      )
    );
  
  const threadCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(forumThreads)
    .where(eq(forumThreads.authorId, userId));
  
  const salesCount = await db.select({ count: sql<number>`COUNT(DISTINCT ${contentPurchases.sellerId})` })
    .from(contentPurchases)
    .where(eq(contentPurchases.sellerId, userId));
  
  const totalContributions = (threadCount[0]?.count || 0) + (replyCount[0]?.count || 0);
  
  // Build progress object
  const progress = {
    forum_guardian: {
      ...BADGE_CONFIG.forum_guardian,
      current: replyCount[0]?.count || 0,
      earned: earnedBadgeTypes.has('forum_guardian'),
      progress: Math.min(100, ((replyCount[0]?.count || 0) / 50) * 100)
    },
    vault_master: {
      ...BADGE_CONFIG.vault_master,
      current: vaultTotal[0]?.total || 0,
      earned: earnedBadgeTypes.has('vault_master'),
      progress: Math.min(100, ((vaultTotal[0]?.total || 0) / 1000) * 100)
    },
    early_bird: {
      ...BADGE_CONFIG.early_bird,
      current: earlyPostCount[0]?.count || 0,
      earned: earnedBadgeTypes.has('early_bird'),
      progress: Math.min(100, ((earlyPostCount[0]?.count || 0) / 100) * 100)
    },
    discussion_starter: {
      ...BADGE_CONFIG.discussion_starter,
      current: threadCount[0]?.count || 0,
      earned: earnedBadgeTypes.has('discussion_starter'),
      progress: Math.min(100, ((threadCount[0]?.count || 0) / 10) * 100)
    },
    marketplace_pro: {
      ...BADGE_CONFIG.marketplace_pro,
      current: salesCount[0]?.count || 0,
      earned: earnedBadgeTypes.has('marketplace_pro'),
      progress: Math.min(100, ((salesCount[0]?.count || 0) / 5) * 100)
    },
    community_champion: {
      ...BADGE_CONFIG.community_champion,
      current: totalContributions,
      earned: earnedBadgeTypes.has('community_champion'),
      progress: Math.min(100, (totalContributions / 100) * 100)
    }
  };
  
  return progress;
}

/**
 * Claim a badge reward (mark as claimed and add coins)
 * Note: Coins are already added when badge is unlocked, this just marks as claimed
 */
export async function claimBadge(userId: string, badgeId: string) {
  const result = await db.update(retentionBadges)
    .set({ 
      claimed: true,
      claimedAt: new Date()
    })
    .where(
      and(
        eq(retentionBadges.id, badgeId),
        eq(retentionBadges.userId, userId),
        eq(retentionBadges.claimed, false)
      )
    )
    .returning();
  
  if (result.length === 0) {
    throw new Error('Badge not found or already claimed');
  }
  
  return result[0];
}
