import { db } from '../db.js';
import { retentionMetrics, loyaltyTiers, activityFeed } from '../../shared/schema.js';
import { and, eq, gte, sql } from 'drizzle-orm';

/**
 * Calculate user's loyalty tier based on active days in last 90 days
 * @param userId - User ID
 * @returns The calculated tier: "new", "committed", or "elite"
 */
export async function calculateLoyaltyTier(userId: string): Promise<"new" | "committed" | "elite"> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  // Count unique active days from activity_feed in last 90 days
  const result = await db.select({
    activeDays: sql<number>`COUNT(DISTINCT DATE(${activityFeed.createdAt}))`
  })
  .from(activityFeed)
  .where(
    and(
      eq(activityFeed.userId, userId),
      gte(activityFeed.createdAt, ninetyDaysAgo)
    )
  );
  
  const activeDays = result[0]?.activeDays || 0;
  
  console.log(`[LOYALTY] User ${userId} has ${activeDays} active days in last 90 days`);
  
  // Determine tier based on active days
  if (activeDays >= 90) return "elite";
  if (activeDays >= 22) return "committed";
  return "new";
}

/**
 * Update retention metrics for a user
 * This should be called whenever user performs significant activity
 * @param userId - User ID
 */
export async function updateRetentionMetrics(userId: string) {
  console.log(`[LOYALTY] Updating retention metrics for user ${userId}`);
  
  const tier = await calculateLoyaltyTier(userId);
  
  // Get tier configuration
  const tierConfig = await db.select().from(loyaltyTiers)
    .where(eq(loyaltyTiers.tier, tier))
    .limit(1);
  
  const feeRate = tierConfig[0]?.feeRate || "0.0700";
  
  // Calculate active days in last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const activeDaysResult = await db.select({
    count: sql<number>`COUNT(DISTINCT DATE(${activityFeed.createdAt}))`
  })
  .from(activityFeed)
  .where(
    and(
      eq(activityFeed.userId, userId),
      gte(activityFeed.createdAt, ninetyDaysAgo)
    )
  );
  
  const activeDays = activeDaysResult[0]?.count || 0;
  
  // Upsert retention metrics
  await db.insert(retentionMetrics)
    .values({
      userId,
      activeDays,
      loyaltyTier: tier,
      feeRate,
      lastActivityAt: new Date()
    })
    .onConflictDoUpdate({
      target: retentionMetrics.userId,
      set: {
        activeDays,
        loyaltyTier: tier,
        feeRate,
        lastActivityAt: new Date(),
        updatedAt: new Date()
      }
    });
  
  console.log(`[LOYALTY] User ${userId} updated to tier '${tier}' with ${activeDays} active days`);
  
  return { tier, activeDays, feeRate };
}

/**
 * Get retention metrics for a user
 * Creates default metrics if they don't exist
 */
export async function getRetentionMetrics(userId: string) {
  let metrics = await db.select().from(retentionMetrics)
    .where(eq(retentionMetrics.userId, userId))
    .limit(1);
  
  if (metrics.length === 0) {
    // Create default metrics for new user
    await updateRetentionMetrics(userId);
    metrics = await db.select().from(retentionMetrics)
      .where(eq(retentionMetrics.userId, userId))
      .limit(1);
  }
  
  return metrics[0];
}

/**
 * Get all tier configurations
 */
export async function getAllTiers() {
  return await db.select().from(loyaltyTiers);
}

/**
 * Get tier benefits for a specific tier
 */
export async function getTierBenefits(tier: "new" | "committed" | "elite") {
  const result = await db.select().from(loyaltyTiers)
    .where(eq(loyaltyTiers.tier, tier))
    .limit(1);
  
  return result[0];
}

/**
 * Calculate days until next tier
 */
export async function getDaysUntilNextTier(userId: string): Promise<{
  currentTier: string;
  nextTier: string | null;
  daysUntilNext: number | null;
  currentActiveDays: number;
}> {
  const metrics = await getRetentionMetrics(userId);
  const currentTier = metrics.loyaltyTier;
  const currentActiveDays = metrics.activeDays;
  
  const tiers = await getAllTiers();
  const sortedTiers = tiers.sort((a, b) => a.minActiveDays - b.minActiveDays);
  
  // Find next tier
  const currentTierIndex = sortedTiers.findIndex(t => t.tier === currentTier);
  const nextTier = currentTierIndex < sortedTiers.length - 1 
    ? sortedTiers[currentTierIndex + 1] 
    : null;
  
  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      daysUntilNext: null,
      currentActiveDays
    };
  }
  
  const daysUntilNext = nextTier.minActiveDays - currentActiveDays;
  
  return {
    currentTier,
    nextTier: nextTier.tier,
    daysUntilNext: Math.max(0, daysUntilNext),
    currentActiveDays
  };
}

/**
 * Get fee rate for a user based on their tier
 */
export async function getUserFeeRate(userId: string): Promise<string> {
  const metrics = await getRetentionMetrics(userId);
  return metrics.feeRate;
}
