import { db } from '../db.js';
import { aiNudges, activityFeed } from '../../shared/schema.js';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

interface NudgeRule {
  type: string;
  condition: (userId: string) => Promise<boolean>;
  message: (data?: any) => string;
  actionUrl: (data?: any) => string;
  priority: 'low' | 'medium' | 'high';
}

const NUDGE_RULES: NudgeRule[] = [
  {
    type: 'post_in_category',
    condition: async (userId) => {
      // User hasn't posted in 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentPosts = await db.select()
        .from(activityFeed)
        .where(
          and(
            eq(activityFeed.userId, userId),
            eq(activityFeed.activityType, 'thread_created'),
            gte(activityFeed.createdAt, sevenDaysAgo)
          )
        );
      
      return recentPosts.length === 0;
    },
    message: (data) => `Post in ${data?.categoryName || 'your favorite category'} - high engagement right now!`,
    actionUrl: (data) => `/category/${data?.categorySlug || 'general'}`,
    priority: 'medium'
  },
  {
    type: 'reply_to_thread',
    condition: async (userId) => {
      // User hasn't replied in 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const recentReplies = await db.select()
        .from(activityFeed)
        .where(
          and(
            eq(activityFeed.userId, userId),
            eq(activityFeed.activityType, 'reply_posted'),
            gte(activityFeed.createdAt, threeDaysAgo)
          )
        );
      
      return recentReplies.length === 0;
    },
    message: () => "There are 5 trending threads waiting for your expert opinion!",
    actionUrl: () => "/hot",
    priority: 'low'
  },
  {
    type: 'upload_content',
    condition: async (userId) => {
      // User has never uploaded content
      const uploads = await db.select()
        .from(activityFeed)
        .where(
          and(
            eq(activityFeed.userId, userId),
            eq(activityFeed.activityType, 'content_published')
          )
        );
      
      return uploads.length === 0;
    },
    message: () => "Share your first EA and earn 100+ coins! Marketplace is hot 🔥",
    actionUrl: () => "/publish",
    priority: 'high'
  }
];

export async function generateAINudges(userId: string) {
  // Delete old dismissed nudges (30+ days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  await db.delete(aiNudges)
    .where(
      and(
        eq(aiNudges.userId, userId),
        eq(aiNudges.dismissed, true),
        lte(aiNudges.dismissedAt, thirtyDaysAgo)
      )
    );

  // Check each rule
  for (const rule of NUDGE_RULES) {
    const shouldNudge = await rule.condition(userId);
    
    if (shouldNudge) {
      // Check if we already have this nudge
      const existing = await db.select()
        .from(aiNudges)
        .where(
          and(
            eq(aiNudges.userId, userId),
            eq(aiNudges.nudgeType, rule.type),
            eq(aiNudges.dismissed, false)
          )
        )
        .limit(1);
      
      if (existing.length === 0) {
        // Create new nudge
        await db.insert(aiNudges).values({
          userId,
          nudgeType: rule.type,
          message: rule.message(),
          actionUrl: rule.actionUrl(),
          priority: rule.priority
        });
      }
    }
  }
}
