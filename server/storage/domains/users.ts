import { db } from '../../db';
import { eq, sql, and, desc, asc, count, or, gt, gte, lte, ilike, lt, ne, isNotNull, isNull } from 'drizzle-orm';
import { 
  users, 
  profiles,
  userFollows,
  userBadges,
  userActivity,
  forumThreads,
  forumReplies,
  userWallet,
  contentPurchases,
  activityFeed,
  content,
  coinTransactions
} from '@shared/schema';
import type { 
  User, 
  InsertUser, 
  UpsertUser, 
  UserFollow, 
  InsertUserFollow,
  UserBadge,
  InsertUserBadge,
  ActivityFeed,
  InsertActivityFeed,
  ForumThread
} from '@shared/schema';
import { calculateUserLevel, randomUUID } from '../utils';

/**
 * UserStorage - Handles all user-related database operations
 * Extracted from DrizzleStorage to reduce monolith complexity
 */
export class UserStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) return null;
    
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    
    return { ...user, profile };
  }

  async getUserThreads(userId: string): Promise<ForumThread[]> {
    return await db.select().from(forumThreads).where(eq(forumThreads.authorId, userId)).orderBy(desc(forumThreads.createdAt));
  }

  async createUser(insertUser: InsertUser | UpsertUser): Promise<User> {
    // Determine if this is OIDC or traditional auth
    const isOIDC = 'email' in insertUser && insertUser.email !== undefined;
    
    const values = isOIDC 
      ? {
          // OIDC user
          id: (insertUser as UpsertUser).id,
          username: (insertUser as UpsertUser).email || 'user',
          email: (insertUser as UpsertUser).email,
          firstName: (insertUser as UpsertUser).firstName,
          lastName: (insertUser as UpsertUser).lastName,
          profileImageUrl: (insertUser as UpsertUser).profileImageUrl,
        }
      : {
          // Traditional user
          username: (insertUser as InsertUser).username,
          password: (insertUser as InsertUser).password,
          email: (insertUser as InsertUser).email || null,
          firstName: (insertUser as InsertUser).firstName || null,
          lastName: (insertUser as InsertUser).lastName || null,
          profileImageUrl: (insertUser as InsertUser).profileImageUrl || null,
        };
    
    const [user] = await db.insert(users).values(values).returning();
    return user;
  }

  async upsertUser(upsertUser: UpsertUser): Promise<User> {
    if (!upsertUser.id) {
      throw new Error("UpsertUser must have an id");
    }
    
    const existingUser = await this.getUser(upsertUser.id);
    
    if (existingUser) {
      // Update existing user (don't change username to avoid conflicts)
      const [updatedUser] = await db
        .update(users)
        .set({
          email: upsertUser.email ?? existingUser.email,
          firstName: upsertUser.firstName ?? existingUser.firstName,
          lastName: upsertUser.lastName ?? existingUser.lastName,
          profileImageUrl: upsertUser.profileImageUrl ?? existingUser.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, upsertUser.id))
        .returning();
      return updatedUser;
    } else {
      // Create new user with collision-safe username
      let username = upsertUser.username || 'user';
      let attempt = 0;
      let finalUsername = username;
      
      // Check for username collisions and append suffix if needed
      while (await this.getUserByUsername(finalUsername)) {
        attempt++;
        finalUsername = `${username}_${attempt}`;
        if (attempt > 100) {
          // Fallback to UUID-based username to guarantee uniqueness
          finalUsername = `user_${upsertUser.id.substring(0, 8)}`;
          break;
        }
      }
      
      return this.createUser({
        ...upsertUser,
        username: finalUsername,
      });
    }
  }

  async updateUserCoins(userId: string, coins: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        totalCoins: sql`${users.totalCoins} + ${coins}`,
        level: sql`FLOOR((${users.totalCoins} + ${coins}) / 1000)`
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createUserFollow(data: InsertUserFollow): Promise<UserFollow> {
    const [userFollow] = await db.insert(userFollows).values({
      followerId: data.followerId,
      followingId: data.followingId,
    }).returning();
    return userFollow;
  }

  async deleteUserFollow(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );
  }

  async getFollow(followerId: string, followingId: string): Promise<UserFollow | null> {
    const [follow] = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );
    return follow || null;
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    const follows = await db
      .select()
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));
    
    const followerIds = follows.map((f) => f.followerId);
    if (followerIds.length === 0) return [];
    
    return await db
      .select()
      .from(users)
      .where(sql`${users.id} IN ${followerIds}`);
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    const follows = await db
      .select()
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
    
    const followingIds = follows.map((f) => f.followingId);
    if (followingIds.length === 0) return [];
    
    return await db
      .select()
      .from(users)
      .where(sql`${users.id} IN ${followingIds}`);
  }

  async checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      )
      .limit(1);
    
    return !!follow;
  }

  async createUserBadge(userId: string, badgeType: string): Promise<UserBadge> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const hasBadge = await this.hasUserBadge(userId, badgeType);
    if (hasBadge) throw new Error("User already has this badge");
    
    const [badge] = await db.insert(userBadges).values({
      userId,
      badgeType: badgeType as "verified_trader" | "top_contributor" | "ea_expert" | "helpful_member" | "early_adopter",
    }).returning();
    
    await this.createActivity({
      userId,
      activityType: "badge_earned",
      entityType: "badge",
      entityId: badge.id,
      title: `Earned badge: ${badgeType.replace(/_/g, ' ')}`,
    });
    
    return badge;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.awardedAt));
  }

  async hasUserBadge(userId: string, badgeType: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userBadges)
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeType, badgeType as any)
      ))
      .limit(1);
    return !!result;
  }

  async createActivity(insertActivity: InsertActivityFeed): Promise<ActivityFeed> {
    const user = await this.getUser(insertActivity.userId);
    if (!user) throw new Error("User not found");
    
    const [activity] = await db.insert(activityFeed).values({
      userId: insertActivity.userId,
      activityType: insertActivity.activityType as "thread_created" | "reply_posted" | "content_published" | "purchase_made" | "review_posted" | "badge_earned",
      entityType: insertActivity.entityType as "thread" | "reply" | "content" | "purchase" | "review" | "badge",
      entityId: insertActivity.entityId,
      title: insertActivity.title,
      description: insertActivity.description || null,
    }).returning();
    
    return activity;
  }

  async getRecentActivity(limit = 50): Promise<ActivityFeed[]> {
    return await db
      .select()
      .from(activityFeed)
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit);
  }

  async getUserActivity(userId: string, limit = 50): Promise<ActivityFeed[]> {
    return await db
      .select()
      .from(activityFeed)
      .where(eq(activityFeed.userId, userId))
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit);
  }

  async getLeaderboard(type: "coins" | "contributions" | "uploads", limit = 10): Promise<User[]> {
    if (type === "coins") {
      return await db
        .select()
        .from(users)
        .orderBy(desc(users.totalCoins))
        .limit(limit);
    }
    
    if (type === "contributions") {
      const allUsers = await db.select().from(users);
      const userContributions = new Map<string, number>();
      
      allUsers.forEach(u => userContributions.set(u.id, 0));
      
      const threads = await db.select().from(forumThreads);
      const replies = await db.select().from(forumReplies);
      
      threads.forEach(t => {
        userContributions.set(t.authorId, (userContributions.get(t.authorId) || 0) + 1);
      });
      replies.forEach(r => {
        userContributions.set(r.userId, (userContributions.get(r.userId) || 0) + 1);
      });
      
      return allUsers
        .sort((a, b) => (userContributions.get(b.id) || 0) - (userContributions.get(a.id) || 0))
        .slice(0, limit);
    }
    
    if (type === "uploads") {
      const allUsers = await db.select().from(users);
      const userUploads = new Map<string, number>();
      
      allUsers.forEach(u => userUploads.set(u.id, 0));
      
      const contents = await db.select().from(content);
      contents.forEach(c => {
        userUploads.set(c.authorId, (userUploads.get(c.authorId) || 0) + 1);
      });
      
      return allUsers
        .sort((a, b) => (userUploads.get(b.id) || 0) - (userUploads.get(a.id) || 0))
        .slice(0, limit);
    }
    
    return [];
  }

  async getTopUsersByCoins(limit: number) {
    const results = await db
      .select({
        userId: userWallet.userId,
        username: users.username,
        balance: userWallet.balance,
      })
      .from(userWallet)
      .innerJoin(users, eq(userWallet.userId, users.id))
      .orderBy(desc(userWallet.balance))
      .limit(limit);

    return results.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async getTopContributors(limit: number) {
    const results = await db
      .select({
        userId: forumReplies.userId,
        username: users.username,
        helpfulCount: sql<number>`count(case when ${forumReplies.helpful} > 0 then 1 end)`,
        acceptedCount: sql<number>`count(case when ${forumReplies.isAccepted} then 1 end)`,
      })
      .from(forumReplies)
      .innerJoin(users, eq(forumReplies.userId, users.id))
      .groupBy(forumReplies.userId, users.username)
      .orderBy(desc(sql`count(case when ${forumReplies.helpful} > 0 then 1 end) + count(case when ${forumReplies.isAccepted} then 1 end)`))
      .limit(limit);

    return results.map((r, index) => ({
      ...r,
      totalContributions: r.helpfulCount + r.acceptedCount,
      rank: index + 1,
    }));
  }

  async getTopSellers(limit: number) {
    const results = await db
      .select({
        userId: contentPurchases.sellerId,
        username: users.username,
        totalRevenue: sql<number>`sum(${contentPurchases.priceCoins})`,
        salesCount: sql<number>`count(*)`,
      })
      .from(contentPurchases)
      .innerJoin(users, eq(contentPurchases.sellerId, users.id))
      .where(gt(contentPurchases.priceCoins, 0))
      .groupBy(contentPurchases.sellerId, users.username)
      .orderBy(desc(sql`sum(${contentPurchases.priceCoins})`))
      .limit(limit);

    return results.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async recordActivity(userId: string, minutes: number): Promise<{coinsEarned: number, totalMinutes: number}> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get or create today's activity record
    let [activity] = await db
      .select()
      .from(userActivity)
      .where(and(
        eq(userActivity.userId, userId),
        eq(userActivity.date, today)
      ))
      .limit(1);

    // Calculate coins to award (0.5 coins per 5 minutes, max 50 coins/day)
    const newMinutes = (activity?.activeMinutes || 0) + minutes;
    const maxMinutes = 500; // 500 minutes = 50 coins max (0.5 coins per 5 minutes)
    const cappedMinutes = Math.min(newMinutes, maxMinutes);
    // Formula: 0.5 coins per 5 minutes = minutes / 10
    const totalCoinsEarned = cappedMinutes / 10;
    const previousCoins = activity?.coinsEarned || 0;
    const newCoins = totalCoinsEarned - previousCoins;

    if (activity) {
      // Update existing record
      await db.update(userActivity)
        .set({
          activeMinutes: cappedMinutes,
          coinsEarned: totalCoinsEarned,
          lastActivityAt: new Date()
        })
        .where(eq(userActivity.id, activity.id));
    } else {
      // Create new record
      await db.insert(userActivity).values({
        userId,
        date: today,
        activeMinutes: minutes,
        coinsEarned: totalCoinsEarned,
        lastActivityAt: new Date()
      });
    }

    // Award coins if any new coins earned
    if (newCoins > 0) {
      await db.update(users)
        .set({ 
          totalCoins: sql`${users.totalCoins} + ${newCoins}`,
          level: sql`FLOOR((${users.totalCoins} + ${newCoins}) / 1000)`
        })
        .where(eq(users.id, userId));

      await db.insert(coinTransactions).values({
        userId,
        type: 'earn',
        amount: newCoins,
        description: `Active engagement reward (${minutes} minutes)`,
        status: 'completed'
      });
    }

    return {
      coinsEarned: newCoins,
      totalMinutes: cappedMinutes
    };
  }

  async getTodayActivity(userId: string): Promise<{activeMinutes: number, coinsEarned: number} | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const [activity] = await db
      .select()
      .from(userActivity)
      .where(and(
        eq(userActivity.userId, userId),
        eq(userActivity.date, today)
      ))
      .limit(1);

    return activity ? {
      activeMinutes: activity.activeMinutes,
      coinsEarned: activity.coinsEarned
    } : null;
  }

  async checkCanPostJournal(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    const today = new Date().toISOString().split('T')[0];
    const lastPost = user.lastJournalPost;
    
    return !lastPost || lastPost !== today;
  }

  async markJournalPosted(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await db.update(users)
      .set({ lastJournalPost: today })
      .where(eq(users.id, userId));
  }
}
