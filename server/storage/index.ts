/**
 * Orchestrated Storage - Modular storage implementation
 * 
 * This orchestrator delegates high-traffic operations to specialized domain modules
 * while maintaining backward compatibility by falling back to DrizzleStorage for
 * unmigrated methods.
 * 
 * Architecture:
 * - UserStorage: User CRUD, auth, profiles, badges, follows, activity
 * - ForumStorage: Threads, replies, categories
 * - ContentStorage: Content, purchases, reviews, likes
 * - DrizzleStorage: Fallback for all other operations
 */

import { DrizzleStorage } from '../storage';
import { UserStorage } from './domains/users';
import { ForumStorage } from './domains/forum';
import { ContentStorage } from './domains/content';
import type { IStorage } from '../storage';
import type {
  User,
  InsertUser,
  UpsertUser,
  UserFollow,
  InsertUserFollow,
  UserBadge,
  ActivityFeed,
  InsertActivityFeed,
  ForumThread,
  InsertForumThread,
  ForumReply,
  InsertForumReply,
  ForumCategory,
  Content,
  InsertContent,
  ContentPurchase,
  ContentReview,
  InsertContentReview,
  ContentLike,
  InsertContentLike,
  ContentReply,
  InsertContentReply
} from '@shared/schema';

class OrchestratedStorageBase {
  private users: UserStorage;
  private forum: ForumStorage;
  private content: ContentStorage;
  public fallback: DrizzleStorage;

  constructor() {
    this.users = new UserStorage();
    this.forum = new ForumStorage();
    this.content = new ContentStorage();
    this.fallback = new DrizzleStorage();
  }

  // ============================================================================
  // USER DOMAIN - Delegated to UserStorage
  // ============================================================================
  
  async getUser(id: string): Promise<User | undefined> {
    return this.users.getUser(id);
  }

  async getUserByUsername(username: string): Promise<any> {
    return this.users.getUserByUsername(username);
  }

  async getUserThreads(userId: string): Promise<ForumThread[]> {
    return this.users.getUserThreads(userId);
  }

  async createUser(user: InsertUser | UpsertUser): Promise<User> {
    return this.users.createUser(user);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    return this.users.upsertUser(user);
  }

  async updateUserCoins(userId: string, coins: number): Promise<User | undefined> {
    return this.users.updateUserCoins(userId, coins);
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User | undefined> {
    return this.users.updateUserProfile(userId, data);
  }

  async recordActivity(userId: string, minutes: number): Promise<{coinsEarned: number, totalMinutes: number}> {
    return this.users.recordActivity(userId, minutes);
  }

  async getTodayActivity(userId: string): Promise<{activeMinutes: number, coinsEarned: number} | null> {
    return this.users.getTodayActivity(userId);
  }

  async checkCanPostJournal(userId: string): Promise<boolean> {
    return this.users.checkCanPostJournal(userId);
  }

  async markJournalPosted(userId: string): Promise<void> {
    return this.users.markJournalPosted(userId);
  }

  async createUserFollow(data: InsertUserFollow): Promise<UserFollow> {
    return this.users.createUserFollow(data);
  }

  async deleteUserFollow(followerId: string, followingId: string): Promise<void> {
    return this.users.deleteUserFollow(followerId, followingId);
  }

  async getFollow(followerId: string, followingId: string): Promise<UserFollow | null> {
    return this.users.getFollow(followerId, followingId);
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    return this.users.getUserFollowers(userId);
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    return this.users.getUserFollowing(userId);
  }

  async checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.users.checkIfFollowing(followerId, followingId);
  }

  async createUserBadge(userId: string, badgeType: string): Promise<UserBadge> {
    return this.users.createUserBadge(userId, badgeType);
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.users.getUserBadges(userId);
  }

  async hasUserBadge(userId: string, badgeType: string): Promise<boolean> {
    return this.users.hasUserBadge(userId, badgeType);
  }

  async createActivity(insertActivity: InsertActivityFeed): Promise<ActivityFeed> {
    return this.users.createActivity(insertActivity);
  }

  async getRecentActivity(limit = 50): Promise<ActivityFeed[]> {
    return this.users.getRecentActivity(limit);
  }

  async getUserActivity(userId: string, limit = 50): Promise<ActivityFeed[]> {
    return this.users.getUserActivity(userId, limit);
  }

  async getLeaderboard(type: "coins" | "contributions" | "uploads", limit = 10): Promise<User[]> {
    return this.users.getLeaderboard(type, limit);
  }

  async getTopUsersByCoins(limit: number) {
    return this.users.getTopUsersByCoins(limit);
  }

  async getTopContributors(limit: number) {
    return this.users.getTopContributors(limit);
  }

  async getTopSellers(limit: number) {
    return this.users.getTopSellers(limit);
  }

  // ============================================================================
  // FORUM DOMAIN - Delegated to ForumStorage
  // ============================================================================

  async createForumThread(thread: InsertForumThread, authorId: string): Promise<ForumThread> {
    return this.forum.createForumThread(thread, authorId);
  }

  async getForumThreadById(id: string): Promise<ForumThread | undefined> {
    return this.forum.getForumThreadById(id);
  }

  async getForumThreadBySlug(slug: string): Promise<ForumThread | undefined> {
    return this.forum.getForumThreadBySlug(slug);
  }

  async listForumThreads(filters?: { categorySlug?: string; status?: string; isPinned?: boolean; limit?: number }): Promise<ForumThread[]> {
    return this.forum.listForumThreads(filters);
  }

  async updateForumThreadReplyCount(threadId: string, increment: number): Promise<void> {
    return this.forum.updateForumThreadReplyCount(threadId, increment);
  }

  async updateForumThreadActivity(threadId: string): Promise<void> {
    return this.forum.updateForumThreadActivity(threadId);
  }

  async createForumReply(reply: InsertForumReply): Promise<ForumReply> {
    return this.forum.createForumReply(reply);
  }

  async listForumReplies(threadId: string): Promise<ForumReply[]> {
    return this.forum.listForumReplies(threadId);
  }

  async markReplyAsAccepted(replyId: string): Promise<ForumReply | null> {
    return this.forum.markReplyAsAccepted(replyId);
  }

  async markReplyAsHelpful(replyId: string): Promise<ForumReply | null> {
    return this.forum.markReplyAsHelpful(replyId);
  }

  async listForumCategories(): Promise<ForumCategory[]> {
    return this.forum.listForumCategories();
  }

  async getForumCategoryBySlug(slug: string): Promise<ForumCategory | undefined> {
    return this.forum.getForumCategoryBySlug(slug);
  }

  async updateCategoryStats(categorySlug: string): Promise<void> {
    return this.forum.updateCategoryStats(categorySlug);
  }

  // ============================================================================
  // CONTENT DOMAIN - Delegated to ContentStorage
  // ============================================================================

  async createContent(insertContent: InsertContent): Promise<Content> {
    return this.content.createContent(insertContent);
  }

  async getContent(id: string): Promise<Content | undefined> {
    return this.content.getContent(id);
  }

  async getContentBySlug(slug: string): Promise<Content | undefined> {
    return this.content.getContentBySlug(slug);
  }

  async getAllContent(filters?: { type?: string; category?: string; status?: string }): Promise<Content[]> {
    return this.content.getAllContent(filters);
  }

  async getUserContent(userId: string): Promise<Content[]> {
    return this.content.getUserContent(userId);
  }

  async updateContentViews(contentId: string): Promise<void> {
    return this.content.updateContentViews(contentId);
  }

  async updateContentDownloads(contentId: string): Promise<void> {
    return this.content.updateContentDownloads(contentId);
  }

  async purchaseContent(contentId: string, buyerId: string): Promise<ContentPurchase> {
    // Content storage needs access to wallet methods from fallback
    return this.content.purchaseContent(
      contentId, 
      buyerId,
      this.fallback.getUserWallet.bind(this.fallback),
      this.fallback.beginLedgerTransaction.bind(this.fallback)
    );
  }

  async getUserPurchases(userId: string): Promise<ContentPurchase[]> {
    return this.content.getUserPurchases(userId);
  }

  async hasPurchased(userId: string, contentId: string): Promise<boolean> {
    return this.content.hasPurchased(userId, contentId);
  }

  async createReview(review: InsertContentReview): Promise<ContentReview> {
    return this.content.createReview(review);
  }

  async getContentReviews(contentId: string): Promise<ContentReview[]> {
    return this.content.getContentReviews(contentId);
  }

  async getUserReviewCount(userId: string): Promise<number> {
    // Content storage handles content reviews, fallback handles broker reviews
    const contentReviewCount = await this.content.getUserReviewCount(userId);
    const totalReviewCount = await this.fallback.getUserReviewCount(userId);
    return totalReviewCount; // Fallback already includes both
  }

  async likeContent(like: InsertContentLike): Promise<ContentLike | null> {
    return this.content.likeContent(like);
  }

  async hasLiked(userId: string, contentId: string): Promise<boolean> {
    return this.content.hasLiked(userId, contentId);
  }

  async createReply(reply: InsertContentReply): Promise<ContentReply> {
    return this.content.createReply(reply);
  }

  async getContentReplies(contentId: string): Promise<ContentReply[]> {
    return this.content.getContentReplies(contentId);
  }

  async updateReplyHelpful(replyId: string): Promise<void> {
    return this.content.updateReplyHelpful(replyId);
  }
}

/**
 * Creates an orchestrated storage instance with automatic fallback delegation.
 * 
 * This function wraps OrchestratedStorageBase in a JavaScript Proxy that:
 * 1. First checks if a method exists on the orchestrator (migrated to domain modules)
 * 2. If not found, automatically delegates to DrizzleStorage fallback
 * 3. Logs which methods are being delegated for monitoring migration progress
 * 
 * This ensures ALL IStorage methods work, even if not explicitly implemented.
 */
const createOrchestratedStorage = (): IStorage => {
  const base = new OrchestratedStorageBase();
  
  return new Proxy(base as any, {
    get(target, prop: string) {
      // If the method exists on the orchestrator, use it
      if (prop in target && typeof (target as any)[prop] === 'function') {
        return (target as any)[prop].bind(target);
      }
      
      // Otherwise, delegate to DrizzleStorage fallback
      if (prop in target.fallback && typeof (target.fallback as any)[prop] === 'function') {
        console.log(`[STORAGE] Delegating unmigrated method '${prop}' to DrizzleStorage`);
        return (target.fallback as any)[prop].bind(target.fallback);
      }
      
      // Return the property as-is (for non-methods)
      return (target as any)[prop];
    }
  }) as IStorage;
};

// Export a single instance (singleton pattern with Proxy delegation)
export const storage = createOrchestratedStorage();
export default storage;
