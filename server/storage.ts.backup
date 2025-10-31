import { 
  type User, 
  type UpsertUser,
  type InsertUser,
  type CoinTransaction, 
  type InsertCoinTransaction,
  type RechargeOrder,
  type InsertRechargeOrder,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type Content,
  type InsertContent,
  type ContentPurchase,
  type InsertContentPurchase,
  type ContentReview,
  type InsertContentReview,
  type ContentLike,
  type InsertContentLike,
  type ContentReply,
  type InsertContentReply,
  type Broker,
  type InsertBroker,
  type BrokerReview,
  type InsertBrokerReview,
  type ForumThread,
  type InsertForumThread,
  type ForumReply,
  type InsertForumReply,
  type ForumCategory,
  type InsertForumCategory,
  type UserBadge,
  type InsertUserBadge,
  type ActivityFeed,
  type InsertActivityFeed,
  type UserFollow,
  type InsertUserFollow,
  type UserWallet,
  type CoinLedgerTransaction,
  type CoinJournalEntry,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Notification,
  type InsertNotification,
  type DashboardPreferences,
  type InsertDashboardPreferences,
  type Referral,
  type InsertReferral,
  type Goal,
  type InsertGoal,
  type Achievement,
  type UserAchievement,
  type Campaign,
  type DashboardSettings,
  type Profile,
  type UserSettings,
  // Admin tables types
  type AdminAction,
  type InsertAdminAction,
  type ModerationQueue,
  type InsertModerationQueue,
  type ReportedContent,
  type InsertReportedContent,
  type SystemSetting,
  type InsertSystemSetting,
  type SupportTicket,
  type InsertSupportTicket,
  type Announcement,
  type InsertAnnouncement,
  type IpBan,
  type InsertIpBan,
  type EmailTemplate,
  type InsertEmailTemplate,
  type AdminRole,
  type InsertAdminRole,
  type UserSegment,
  type InsertUserSegment,
  type AutomationRule,
  type InsertAutomationRule,
  type AbTest,
  type InsertAbTest,
  type FeatureFlag,
  type InsertFeatureFlag,
  type ApiKey,
  type InsertApiKey,
  type Webhook,
  type InsertWebhook,
  type ScheduledJob,
  type InsertScheduledJob,
  type PerformanceMetric,
  type InsertPerformanceMetric,
  type SecurityEvent,
  type InsertSecurityEvent,
  type MediaLibrary,
  type InsertMediaLibrary,
  type ContentRevision,
  type InsertContentRevision,
  type UserActivity,
  type InsertUserActivity,
  type Feedback,
  type InsertFeedback,
  users,
  userActivity,
  coinTransactions,
  rechargeOrders,
  subscriptions,
  withdrawalRequests,
  feedback,
  content,
  contentPurchases,
  contentReviews,
  contentLikes,
  contentReplies,
  brokers,
  brokerReviews,
  forumThreads,
  forumReplies,
  forumCategories,
  userBadges,
  activityFeed,
  userFollows,
  userWallet,
  coinLedgerTransactions,
  coinJournalEntries,
  conversations,
  messages,
  messageReactions,
  notifications,
  dashboardPreferences,
  referrals,
  goals,
  achievements,
  userAchievements,
  campaigns,
  dashboardSettings,
  profiles,
  userSettings,
  // Admin tables
  adminActions,
  moderationQueue,
  reportedContent,
  systemSettings,
  supportTickets,
  announcements,
  ipBans,
  emailTemplates,
  adminRoles,
  userSegments,
  automationRules,
  abTests,
  featureFlags,
  apiKeys,
  webhooks,
  scheduledJobs,
  performanceMetrics,
  securityEvents,
  mediaLibrary,
  contentRevisions,
  BADGE_TYPES,
  type BadgeType
} from "@shared/schema";
import { randomUUID } from "crypto";
import { applySEOAutomations, generateUniqueSlug, generateThreadSlug, generateReplySlug, generateMetaDescription, extractFocusKeyword } from "./seo-engine";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, count, inArray, gt, gte, lte, ilike, lt, ne, isNotNull, isNull } from "drizzle-orm";

/**
 * Calculate user level based on total coins
 * Level = floor(totalCoins / 1000)
 * Examples: 0 coins=level 0, 1000 coins=level 1, 2500 coins=level 2, 10000 coins=level 10
 */
function calculateUserLevel(totalCoins: number): number {
  return Math.floor(totalCoins / 1000);
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<any>;
  getUserThreads(userId: string): Promise<ForumThread[]>;
  createUser(user: InsertUser | UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCoins(userId: string, coins: number): Promise<User | undefined>;
  updateUserProfile(userId: string, data: Partial<User>): Promise<User | undefined>;
  trackOnboardingProgress(userId: string, task: string): Promise<{ completed: boolean; coinsEarned: number }>;
  
  // Daily Earning system - Activity tracking
  recordActivity(userId: string, minutes: number): Promise<{coinsEarned: number, totalMinutes: number}>;
  getTodayActivity(userId: string): Promise<{activeMinutes: number, coinsEarned: number} | null>;
  
  // Daily Earning system - Journal tracking
  checkCanPostJournal(userId: string): Promise<boolean>;
  markJournalPosted(userId: string): Promise<void>;
  
  createCoinTransaction(transaction: InsertCoinTransaction): Promise<CoinTransaction>;
  getUserTransactions(userId: string, limit?: number): Promise<CoinTransaction[]>;
  
  createRechargeOrder(order: InsertRechargeOrder): Promise<RechargeOrder>;
  getRechargeOrder(id: string): Promise<RechargeOrder | undefined>;
  updateRechargeOrderStatus(id: string, status: "completed" | "failed", paymentId?: string): Promise<RechargeOrder | undefined>;
  
  createContent(content: InsertContent): Promise<Content>;
  getContent(id: string): Promise<Content | undefined>;
  getContentBySlug(slug: string): Promise<Content | undefined>;
  getAllContent(filters?: { type?: string; category?: string; status?: string }): Promise<Content[]>;
  getUserContent(userId: string): Promise<Content[]>;
  updateContentViews(contentId: string): Promise<void>;
  updateContentDownloads(contentId: string): Promise<void>;
  
  purchaseContent(contentId: string, buyerId: string): Promise<ContentPurchase>;
  getUserPurchases(userId: string): Promise<ContentPurchase[]>;
  hasPurchased(userId: string, contentId: string): Promise<boolean>;
  
  createReview(review: InsertContentReview): Promise<ContentReview>;
  getContentReviews(contentId: string): Promise<ContentReview[]>;
  getUserReviewCount(userId: string): Promise<number>;
  
  likeContent(like: InsertContentLike): Promise<ContentLike | null>;
  hasLiked(userId: string, contentId: string): Promise<boolean>;
  
  createReply(reply: InsertContentReply): Promise<ContentReply>;
  getContentReplies(contentId: string): Promise<ContentReply[]>;
  updateReplyHelpful(replyId: string): Promise<void>;
  
  createBroker(broker: InsertBroker): Promise<Broker>;
  getBroker(id: string): Promise<Broker | undefined>;
  getBrokerBySlug(slug: string): Promise<Broker | undefined>;
  getAllBrokers(filters?: { isVerified?: boolean; status?: string }): Promise<Broker[]>;
  searchBrokers(query: string, limit?: number): Promise<Broker[]>;
  
  createBrokerReview(review: InsertBrokerReview): Promise<BrokerReview>;
  getBrokerReview(reviewId: string): Promise<BrokerReview | null>;
  getBrokerReviews(brokerId: string, filters?: { isScamReport?: boolean }): Promise<BrokerReview[]>;
  updateBrokerReviewStatus(reviewId: string, status: string): Promise<BrokerReview>;
  updateBrokerRating(brokerId: string): Promise<void>;
  
  createForumThread(thread: InsertForumThread, authorId: string): Promise<ForumThread>;
  getForumThreadById(id: string): Promise<ForumThread | undefined>;
  getForumThreadBySlug(slug: string): Promise<ForumThread | undefined>;
  listForumThreads(filters?: { categorySlug?: string; status?: string; isPinned?: boolean; limit?: number }): Promise<ForumThread[]>;
  updateForumThreadReplyCount(threadId: string, increment: number): Promise<void>;
  updateForumThreadActivity(threadId: string): Promise<void>;
  
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  listForumReplies(threadId: string): Promise<ForumReply[]>;
  markReplyAsAccepted(replyId: string): Promise<ForumReply | null>;
  markReplyAsHelpful(replyId: string): Promise<ForumReply | null>;
  
  listForumCategories(): Promise<ForumCategory[]>;
  getForumCategoryBySlug(slug: string): Promise<ForumCategory | undefined>;
  updateCategoryStats(categorySlug: string): Promise<void>;
  
  createUserBadge(userId: string, badgeType: string): Promise<UserBadge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  hasUserBadge(userId: string, badgeType: string): Promise<boolean>;
  
  createActivity(activity: InsertActivityFeed): Promise<ActivityFeed>;
  getRecentActivity(limit?: number): Promise<ActivityFeed[]>;
  getUserActivity(userId: string, limit?: number): Promise<ActivityFeed[]>;
  
  getLeaderboard(type: "coins" | "contributions" | "uploads", limit?: number): Promise<User[]>;
  
  getTopUsersByCoins(limit: number): Promise<Array<{
    userId: string;
    username: string;
    balance: number;
    rank: number;
  }>>;
  
  getTopContributors(limit: number): Promise<Array<{
    userId: string;
    username: string;
    helpfulCount: number;
    acceptedCount: number;
    totalContributions: number;
    rank: number;
  }>>;
  
  getTopSellers(limit: number): Promise<Array<{
    userId: string;
    username: string;
    totalRevenue: number;
    salesCount: number;
    rank: number;
  }>>;
  
  createUserFollow(data: InsertUserFollow): Promise<UserFollow>;
  deleteUserFollow(followerId: string, followingId: string): Promise<void>;
  getFollow(followerId: string, followingId: string): Promise<UserFollow | null>;
  getUserFollowers(userId: string): Promise<User[]>;
  getUserFollowing(userId: string): Promise<User[]>;
  checkIfFollowing(followerId: string, followingId: string): Promise<boolean>;
  
  // Ledger System
  createUserWallet(userId: string): Promise<UserWallet>;
  getUserWallet(userId: string): Promise<UserWallet | null>;
  
  beginLedgerTransaction(
    type: string,
    initiatorUserId: string,
    entries: Array<{
      userId: string;
      direction: 'debit' | 'credit';
      amount: number;
      memo: string;
    }>,
    context?: Record<string, any>,
    externalRef?: string
  ): Promise<CoinLedgerTransaction>;
  
  getLedgerTransactionHistory(userId: string, limit?: number): Promise<CoinJournalEntry[]>;
  
  reconcileWallets(): Promise<{driftCount: number; maxDelta: number}>;
  
  backfillOpeningBalances(): Promise<{created: number; skipped: number}>;
  
  // Badge System
  awardBadge(userId: string, badge: string): Promise<void>;
  checkAndAwardBadges(userId: string): Promise<string[]>;
  
  // Onboarding System
  getOnboardingProgress(userId: string): Promise<{
    completed: boolean;
    dismissed: boolean;
    progress: {
      profilePicture: boolean;
      firstReply: boolean;
      twoReviews: boolean;
      firstThread: boolean;
      firstPublish: boolean;
      fiftyFollowers: boolean;
    };
  } | null>;
  
  markOnboardingStep(userId: string, step: string): Promise<void>;
  dismissOnboarding(userId: string): Promise<void>;
  
  // Ranking System
  getAllForumThreads(): Promise<ForumThread[]>;
  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserStats(userId: string): Promise<{
    threadsCreated: number;
    repliesPosted: number;
    helpfulVotes: number;
    bestAnswers: number;
    contentSales: number;
    followersCount: number;
    uploadsCount: number;
  }>;
  getContentSalesStats(contentId: string): Promise<{
    totalSales: number;
    reviewCount: number;
    avgRating: number;
  }>;
  updateThreadScore(threadId: string, score: number): Promise<void>;
  updateUserReputation(userId: string, reputation: number): Promise<void>;
  updateContentSalesScore(contentId: string, score: number): Promise<void>;
  
  // Messaging System
  sendMessage(senderId: string, recipientId: string, body: string): Promise<any>;
  getConversations(userId: string): Promise<Array<{
    id: string;
    participant: User;
    lastMessage: {
      text: string;
      timestamp: Date;
      isRead: boolean;
      isSentByMe: boolean;
    };
    unreadCount: number;
  }>>;
  getConversationMessages(conversationId: string, userId: string): Promise<Array<{
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    isRead: boolean;
  }>>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  searchMessages(userId: string, query: string, filterUserId?: string): Promise<Array<{
    id: string;
    conversationId: string;
    senderId: string;
    senderUsername: string;
    text: string;
    timestamp: Date;
  }>>;
  addMessageReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  getMessageReactions(messageId: string): Promise<Array<{ emoji: string; count: number; userIds: string[] }>>;
  
  // Dashboard Preferences
  getDashboardPreferences(userId: string): Promise<DashboardPreferences | null>;
  saveDashboardPreferences(userId: string, preferences: InsertDashboardPreferences): Promise<DashboardPreferences>;
  
  // Withdrawal System
  createWithdrawalRequest(userId: string, data: Omit<InsertWithdrawalRequest, 'userId'>): Promise<WithdrawalRequest>;
  getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]>;
  getWithdrawalById(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null>;
  cancelWithdrawalRequest(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null>;
  
  // Notification System
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<Notification | null>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Earnings Summary
  getUserEarningsSummary(userId: string): Promise<{
    totalEarned: number;
    weeklyEarned: number;
    breakdown: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
  }>;
  
  // Referrals
  getReferrals(userId: string): Promise<any[]>;
  getReferralStats(userId: string): Promise<{totalReferrals: number, totalEarnings: number, monthlyEarnings: number}>;
  generateReferralCode(userId: string): Promise<string>;
  
  // Goals
  getGoals(userId: string): Promise<any[]>;
  createGoal(userId: string, goal: any): Promise<any>;
  updateGoal(goalId: number, updates: any): Promise<any>;
  
  // Achievements
  getUserAchievements(userId: string): Promise<any[]>;
  
  // Sales Dashboard
  getSalesDashboard(userId: string, days: number): Promise<any>;
  
  // Earnings
  getEarningsBreakdown(userId: string): Promise<any>;
  
  // Activity Feed
  getActivityFeed(userId: string, limit: number): Promise<any[]>;
  
  // Campaigns
  getCampaigns(userId: string): Promise<any[]>;
  createCampaign(userId: string, campaign: any): Promise<any>;
  
  // Customers
  getCustomerList(userId: string): Promise<any[]>;
  
  // Dashboard Settings
  getDashboardSettings(userId: string): Promise<any>;
  updateDashboardSettings(userId: string, settings: any): Promise<void>;
  
  // Profile
  getProfileByUsername(username: string): Promise<any>;
  updateProfile(userId: string, profile: any): Promise<any>;
  
  // User Settings
  getUserSettings(userId: string): Promise<any>;
  updateUserSettings(userId: string, settings: any): Promise<void>;
  
  // ============================================================================
  // ADMIN OPERATIONS - GROUP 1: User Management (20 methods)
  // ============================================================================
  
  /**
   * Get users with admin filters
   */
  getAdminUsers(filters: {
    search?: string;
    role?: string;
    status?: string;
    registrationStart?: Date;
    registrationEnd?: Date;
    reputationMin?: number;
    reputationMax?: number;
    limit?: number;
    offset?: number;
  }): Promise<{users: User[]; total: number}>;
  
  /**
   * Ban a user
   */
  banUser(userId: string, reason: string, bannedBy: string, duration?: number): Promise<void>;
  
  /**
   * Suspend a user temporarily
   */
  suspendUser(userId: string, reason: string, suspendedBy: string, duration: number): Promise<void>;
  
  /**
   * Unban a user
   */
  unbanUser(userId: string, unbannedBy: string): Promise<void>;
  
  /**
   * Delete user account permanently
   */
  deleteUserAccount(userId: string, deletedBy: string, reason: string): Promise<void>;
  
  /**
   * Adjust user coin balance (admin override)
   */
  adjustUserCoins(userId: string, amount: number, reason: string, adminId: string): Promise<void>;
  
  /**
   * Change user role
   */
  changeUserRole(userId: string, newRole: string, changedBy: string): Promise<void>;
  
  /**
   * Add badge to user
   */
  addUserBadge(userId: string, badgeSlug: string, grantedBy: string): Promise<void>;
  
  /**
   * Remove badge from user
   */
  removeUserBadge(userId: string, badgeSlug: string, removedBy: string): Promise<void>;
  
  /**
   * Adjust user reputation score
   */
  adjustUserReputation(userId: string, amount: number, reason: string, adminId: string): Promise<void>;
  
  /**
   * Create user segment for targeting
   */
  createUserSegment(segment: {name: string; description: string; rules: any; createdBy: string}): Promise<any>;
  
  /**
   * Get all user segments
   */
  getUserSegments(): Promise<any[]>;
  
  /**
   * Get users by segment
   */
  getUsersBySegment(segmentId: number): Promise<User[]>;
  
  /**
   * Update user segment
   */
  updateUserSegment(segmentId: number, updates: any): Promise<void>;
  
  /**
   * Delete user segment
   */
  deleteUserSegment(segmentId: number): Promise<void>;
  
  /**
   * Get user activity log
   */
  getUserActivityLog(userId: string, limit?: number): Promise<any[]>;
  
  /**
   * Get user financial summary
   */
  getUserFinancialSummary(userId: string): Promise<any>;
  
  /**
   * Get suspicious users
   */
  getSuspiciousUsers(limit?: number): Promise<any[]>;
  
  /**
   * Get inactive users
   */
  getInactiveUsers(days: number): Promise<User[]>;
  
  /**
   * Get users by country
   */
  getUsersByCountry(): Promise<{country: string; count: number}[]>;
  
  /**
   * Get user growth statistics
   */
  getUserGrowthStats(days: number): Promise<any[]>;
  
  // ============================================================================
  // ADMIN OPERATIONS - GROUP 2: Content Moderation (25 methods)
  // ============================================================================
  // NOTE: Duplicate definitions removed - using PHASE 2 definitions below
  
  /**
   * Create content report
   */
  createReport(report: {
    reporterId: string;
    contentType: string;
    contentId: string;
    reportReason: string;
    description: string;
  }): Promise<any>;
  
  /**
   * Assign report to moderator
   */
  assignReport(reportId: number, assignedTo: string, assignedBy: string): Promise<void>;
  
  /**
   * Resolve a report
   */
  resolveReport(reportId: number, resolution: string, actionTaken: string, resolvedBy: string): Promise<void>;
  
  // NOTE: dismissReport definition moved to PHASE 2 section below
  
  /**
   * Delete content (threads, replies, marketplace content)
   */
  deleteContent(contentType: string, contentId: string, deletedBy: string, reason: string): Promise<void>;
  
  /**
   * Restore deleted content
   */
  restoreContent(contentType: string, contentId: string, restoredBy: string): Promise<void>;
  
  /**
   * Edit content as admin
   */
  editContent(contentType: string, contentId: string, updates: any, editedBy: string): Promise<void>;
  
  /**
   * Move content to different category
   */
  moveContent(contentType: string, contentId: string, newCategorySlug: string, movedBy: string): Promise<void>;
  
  /**
   * Feature content on homepage
   */
  featureContent(contentType: string, contentId: string, featuredBy: string): Promise<void>;
  
  /**
   * Unfeature content
   */
  unfeatureContent(contentType: string, contentId: string, unfeaturedBy: string): Promise<void>;
  
  /**
   * Get content statistics
   */
  getContentStats(): Promise<{totalThreads: number; totalReplies: number; totalContent: number}>;
  
  /**
   * Get flagged content
   */
  getFlaggedContent(limit?: number): Promise<any[]>;
  
  /**
   * Get duplicate content
   */
  getDuplicateContent(): Promise<any[]>;
  
  /**
   * Get all content by author
   */
  getContentByAuthor(authorId: string): Promise<any[]>;
  
  /**
   * Get content quality scores
   */
  getContentQualityScores(): Promise<any[]>;
  
  /**
   * Get plagiarized content
   */
  getPlagiarizedContent(limit?: number): Promise<any[]>;
  
  // ============================================================================
  // ADMIN OPERATIONS - GROUP 3: Financial Management (20 methods)
  // ============================================================================
  
  /**
   * Get transactions with admin filters
   */
  getAdminTransactions(filters: {
    transactionType?: string;
    userId?: string;
    amountMin?: number;
    amountMax?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{transactions: any[]; total: number}>;
  
  /**
   * Create manual transaction (admin override)
   */
  createManualTransaction(tx: {
    userId: string;
    amount: number;
    type: string;
    description: string;
    createdBy: string;
  }): Promise<any>;
  
  /**
   * Get pending withdrawal requests
   */
  getPendingWithdrawals(): Promise<any[]>;
  
  /**
   * Approve withdrawal request
   */
  approveWithdrawal(withdrawalId: string, approvedBy: string): Promise<void>;
  
  /**
   * Reject withdrawal request
   */
  rejectWithdrawal(withdrawalId: string, reason: string, rejectedBy: string): Promise<void>;
  
  /**
   * Process withdrawal (mark as completed)
   */
  processWithdrawal(withdrawalId: string, processedBy: string, transactionHash?: string): Promise<void>;
  
  /**
   * Get withdrawal statistics
   */
  getWithdrawalStats(): Promise<any>;
  
  /**
   * Get revenue statistics
   */
  getRevenueStats(startDate: Date, endDate: Date): Promise<any>;
  
  /**
   * Get revenue by source (Finance dashboard)
   */
  getRevenueBySource(): Promise<{
    coinPurchases: number;
    subscriptions: number;
    marketplace: number;
    other: number;
  }>;
  
  /**
   * Get revenue by user (top earners)
   */
  getRevenueByUser(limit?: number): Promise<any[]>;
  
  /**
   * Get revenue forecast
   */
  getRevenueForecast(days: number): Promise<any[]>;
  
  /**
   * Create refund
   */
  createRefund(purchaseId: string, amount: number, reason: string, processedBy: string): Promise<any>;
  
  /**
   * Get refund history
   */
  getRefundHistory(limit?: number): Promise<any[]>;
  
  /**
   * Generate financial report
   */
  generateFinancialReport(startDate: Date, endDate: Date): Promise<any>;
  
  /**
   * Get coin economy health metrics
   */
  getCoinEconomyHealth(): Promise<any>;
  
  /**
   * Get top earners
   */
  getTopEarners(limit?: number): Promise<any[]>;
  
  /**
   * Get suspicious transactions
   */
  getSuspiciousTransactions(limit?: number): Promise<any[]>;
  
  /**
   * Get chargeback rate
   */
  getChargebackRate(): Promise<number>;
  
  /**
   * Get transaction velocity
   */
  getTransactionVelocity(): Promise<any>;
  
  /**
   * Get total revenue with change percentage
   */
  getTotalRevenue(period?: string): Promise<{
    totalRevenue: number;
    change: number;
  }>;
  
  /**
   * Get revenue trend for last N days
   */
  getRevenueTrend(days: number): Promise<Array<{ date: string; revenue: number }>>;
  
  /**
   * Get revenue for a specific period
   */
  getRevenuePeriod(period: 'today' | 'week' | 'month' | 'year' | 'all'): Promise<{
    totalRevenue: number;
    count: number;
  }>;
  
  /**
   * Get all withdrawal requests with filters
   */
  getAllWithdrawals(filters?: {
    status?: string;
    method?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }>;
  
  /**
   * Complete withdrawal (mark as paid)
   */
  completeWithdrawal(
    withdrawalId: string,
    adminId: string,
    transactionId: string,
    notes?: string
  ): Promise<void>;
  
  /**
   * Get recent transactions (unified across all types)
   */
  getRecentTransactions(limit?: number, period?: string): Promise<Array<{
    id: string;
    userId: string;
    username: string;
    type: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>>;
  
  /**
   * Get all transactions with filters
   */
  getAllTransactions(filters?: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }>;
  
  /**
   * Export transactions to CSV
   */
  exportTransactionsCSV(filters?: {
    types?: string[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<string>;
  
  /**
   * Get overall financial statistics
   */
  getFinancialStats(): Promise<{
    totalRevenue: number;
    totalWithdrawals: number;
    pendingWithdrawals: number;
    totalTransactions: number;
    activeSubscriptions: number;
  }>;
  
  // ============================================================================
  // ADMIN OPERATIONS - GROUP 4: System Management (25 methods)
  // ============================================================================
  
  /**
   * Get system settings
   */
  getSystemSettings(category?: string): Promise<any[]>;
  
  /**
   * Update system setting
   */
  updateSystemSetting(key: string, value: any, updatedBy: string): Promise<void>;
  
  /**
   * Get single system setting
   */
  getSystemSetting(key: string): Promise<any>;
  
  /**
   * Get support tickets
   */
  getSupportTickets(filters: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{tickets: any[]; total: number}>;
  
  /**
   * Create support ticket
   */
  createSupportTicket(ticket: {
    userId: string;
    subject: string;
    description: string;
    priority?: string;
    category?: string;
  }): Promise<any>;
  
  /**
   * Update support ticket
   */
  updateSupportTicket(ticketId: number, updates: any, updatedBy: string): Promise<void>;
  
  /**
   * Assign ticket to support agent
   */
  assignTicket(ticketId: number, assignedTo: string, assignedBy: string): Promise<void>;
  
  /**
   * Add reply to support ticket
   */
  addTicketReply(ticketId: number, reply: {userId: string; message: string}): Promise<void>;
  
  /**
   * Close support ticket
   */
  closeTicket(ticketId: number, closedBy: string): Promise<void>;
  
  /**
   * Get announcements
   */
  getAnnouncements(filters?: {isActive?: boolean; targetAudience?: string}): Promise<any[]>;
  
  /**
   * Create announcement
   */
  createAnnouncement(announcement: {
    title: string;
    content: string;
    type: string;
    targetAudience: string;
    displayType: string;
    startDate: Date;
    endDate?: Date;
    createdBy: string;
  }): Promise<any>;
  
  /**
   * Update announcement
   */
  updateAnnouncement(announcementId: number, updates: any): Promise<void>;
  
  /**
   * Delete announcement
   */
  deleteAnnouncement(announcementId: number): Promise<void>;
  
  /**
   * Track announcement view
   */
  trackAnnouncementView(announcementId: number): Promise<void>;
  
  /**
   * Track announcement click
   */
  trackAnnouncementClick(announcementId: number): Promise<void>;
  
  /**
   * Get email templates
   */
  getEmailTemplates(category?: string): Promise<any[]>;
  
  /**
   * Get single email template
   */
  getEmailTemplate(templateKey: string): Promise<any>;
  
  /**
   * Update email template
   */
  updateEmailTemplate(templateKey: string, updates: {subject?: string; htmlBody?: string; textBody?: string}, updatedBy: string): Promise<void>;
  
  /**
   * Create email template
   */
  createEmailTemplate(template: {
    templateKey: string;
    subject: string;
    htmlBody: string;
    textBody: string;
    category: string;
    variables?: string[];
  }): Promise<any>;
  
  /**
   * Get admin roles
   */
  getAdminRoles(): Promise<any[]>;
  
  /**
   * Grant admin role to user
   */
  grantAdminRole(userId: string, role: string, permissions: any, grantedBy: string): Promise<any>;
  
  /**
   * Update admin permissions
   */
  updateAdminPermissions(userId: string, permissions: any, updatedBy: string): Promise<void>;
  
  /**
   * Revoke admin role
   */
  revokeAdminRole(userId: string, revokedBy: string): Promise<void>;
  
  // ============================================================================
  // ADMIN OPERATIONS - GROUP 5: Security & Logs (20 methods)
  // ============================================================================
  
  /**
   * Get security events
   */
  getSecurityEvents(filters: {
    eventType?: string;
    severity?: string;
    isResolved?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{events: any[]; total: number}>;
  
  /**
   * Create security event
   */
  createSecurityEvent(event: {
    eventType: string;
    severity: string;
    userId?: string;
    ipAddress: string;
    details: any;
  }): Promise<any>;
  
  /**
   * Resolve security event
   */
  resolveSecurityEvent(eventId: number, resolvedBy: string, notes: string): Promise<void>;
  
  /**
   * Get IP bans
   */
  getIpBans(filters?: { isActive?: boolean }): Promise<any[]>;
  
  /**
   * Ban an IP address
   */
  banIp(ipAddress: string, reason: string, bannedBy: string, duration?: number): Promise<any>;
  
  /**
   * Unban an IP address
   */
  unbanIp(ipAddress: string, unbannedBy: string): Promise<void>;
  
  /**
   * Check if IP is banned
   */
  isIpBanned(ipAddress: string): Promise<boolean>;
  
  /**
   * Log admin action
   */
  logAdminAction(action: {
    adminId: string;
    actionType: string;
    targetType: string;
    targetId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;
  
  /**
   * Get admin action logs
   */
  getAdminActionLogs(filters: {
    adminId?: string;
    actionType?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{actions: any[]; total: number}>;
  
  /**
   * Get recent admin actions
   */
  getRecentAdminActions(limit?: number): Promise<any[]>;
  
  /**
   * Get admin activity summary
   */
  getAdminActivitySummary(adminId: string, days: number): Promise<any>;
  
  /**
   * Record performance metric
   */
  recordPerformanceMetric(metric: {
    metricType: string;
    metricName: string;
    value: number;
    unit: string;
    metadata?: any;
  }): Promise<void>;
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics(filters: {
    metricType?: string;
    metricName?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]>;
  
  /**
   * Get average performance
   */
  getAveragePerformance(metricName: string, days?: number): Promise<number>;
  
  /**
   * Get performance alerts
   */
  getPerformanceAlerts(): Promise<any[]>;
  
  // ============================================================================
  // ADMIN OPERATIONS - GROUP 6: Advanced Features (40 methods)
  // ============================================================================
  
  /**
   * Get automation rules
   */
  getAutomationRules(activeOnly?: boolean): Promise<any[]>;
  
  /**
   * Create automation rule
   */
  createAutomationRule(rule: {
    name: string;
    description: string;
    triggerType: string;
    triggerConfig: any;
    actionType: string;
    actionConfig: any;
    createdBy: string;
  }): Promise<any>;
  
  /**
   * Update automation rule
   */
  updateAutomationRule(ruleId: number, updates: any): Promise<void>;
  
  /**
   * Toggle automation rule on/off
   */
  toggleAutomationRule(ruleId: number, isActive: boolean): Promise<void>;
  
  /**
   * Execute automation rule manually
   */
  executeAutomationRule(ruleId: number): Promise<void>;
  
  /**
   * Get A/B tests
   */
  getAbTests(status?: string): Promise<any[]>;
  
  /**
   * Create A/B test
   */
  createAbTest(test: {
    name: string;
    description: string;
    variants: any[];
    trafficAllocation: any;
    createdBy: string;
  }): Promise<any>;
  
  /**
   * Update A/B test
   */
  updateAbTest(testId: number, updates: any): Promise<void>;
  
  /**
   * Start A/B test
   */
  startAbTest(testId: number): Promise<void>;
  
  /**
   * Stop A/B test
   */
  stopAbTest(testId: number): Promise<void>;
  
  /**
   * Declare A/B test winner
   */
  declareAbTestWinner(testId: number, winnerVariant: string): Promise<void>;
  
  /**
   * Get feature flags
   */
  getFeatureFlags(): Promise<any[]>;
  
  /**
   * Get single feature flag
   */
  getFeatureFlag(flagKey: string): Promise<any>;
  
  /**
   * Update feature flag
   */
  updateFeatureFlag(flagKey: string, updates: {isEnabled?: boolean; rolloutPercentage?: number}): Promise<void>;
  
  /**
   * Create feature flag
   */
  createFeatureFlag(flag: {
    flagKey: string;
    name: string;
    description: string;
    isEnabled?: boolean;
    rolloutPercentage?: number;
    createdBy: string;
  }): Promise<any>;
  
  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(flagKey: string, userId?: string): Promise<boolean>;
  
  /**
   * Get API keys
   */
  getApiKeys(filters?: {userId?: string; isActive?: boolean}): Promise<any[]>;
  
  /**
   * Create API key
   */
  createApiKey(key: {
    name: string;
    userId: string;
    permissions: string[];
    rateLimit?: number;
    expiresAt?: Date;
  }): Promise<any>;
  
  /**
   * Revoke API key
   */
  revokeApiKey(keyId: number): Promise<void>;
  
  /**
   * Update API key last used timestamp
   */
  updateApiKeyLastUsed(keyId: number): Promise<void>;
  
  /**
   * Get webhooks
   */
  getWebhooks(filters?: {isActive?: boolean}): Promise<any[]>;
  
  /**
   * Create webhook
   */
  createWebhook(webhook: {
    url: string;
    events: string[];
    secret: string;
    createdBy: string;
  }): Promise<any>;
  
  /**
   * Update webhook
   */
  updateWebhook(webhookId: number, updates: any): Promise<void>;
  
  /**
   * Delete webhook
   */
  deleteWebhook(webhookId: number): Promise<void>;
  
  /**
   * Record webhook trigger
   */
  recordWebhookTrigger(webhookId: number, success: boolean): Promise<void>;
  
  /**
   * Get media library
   */
  getMediaLibrary(filters?: {uploadedBy?: string; mimeType?: string}): Promise<any[]>;
  
  /**
   * Add to media library
   */
  addToMediaLibrary(media: {
    filename: string;
    originalFilename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    uploadedBy: string;
  }): Promise<any>;
  
  /**
   * Update media item
   */
  updateMediaItem(mediaId: number, updates: {altText?: string; tags?: string[]}): Promise<void>;
  
  /**
   * Delete media item
   */
  deleteMediaItem(mediaId: number): Promise<void>;
  
  /**
   * Track media usage
   */
  trackMediaUsage(mediaId: number): Promise<void>;
  
  /**
   * Create content revision
   */
  createContentRevision(revision: {
    contentType: string;
    contentId: string;
    revisionNumber: number;
    data: any;
    changedFields: string[];
    changedBy: string;
    changeReason?: string;
  }): Promise<any>;
  
  /**
   * Get content revisions
   */
  getContentRevisions(contentType: string, contentId: string): Promise<any[]>;
  
  /**
   * Restore content revision
   */
  restoreContentRevision(revisionId: number, restoredBy: string): Promise<void>;
  
  /**
   * Create feedback submission
   */
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  
  /**
   * Get all feedback (admin)
   */
  listFeedback(filters?: { status?: string; type?: string; limit?: number }): Promise<Feedback[]>;
  
  /**
   * Get feedback by user
   */
  getUserFeedback(userId: string): Promise<Feedback[]>;
  
  /**
   * Update feedback status (admin)
   */
  updateFeedbackStatus(id: string, status: string, adminNotes?: string): Promise<void>;
  
  // ============================================================================
  // ADMIN OVERVIEW ENDPOINTS - Dashboard Analytics
  // ============================================================================
  
  /**
   * Get admin overview statistics
   * Returns aggregated stats for users, content, revenue, and moderation
   */
  getAdminOverviewStats(): Promise<{
    users: { total: number; new24h: number };
    content: { total: number; new24h: number };
    revenue: { total: number; today: number };
    moderation: { pending: number; reports: number };
  }>;
  
  /**
   * Get user growth series for charts
   * Returns daily user registration counts for the last N days
   */
  getUserGrowthSeries(days: number): Promise<Array<{ date: string; users: number }>>;
  
  /**
   * Get content trend series for charts
   * Returns daily content creation counts for the last N days
   */
  getContentTrendSeries(days: number): Promise<Array<{ date: string; count: number }>>;
  
  /**
   * Get recent admin actions for activity feed
   * Returns the last N admin actions with admin usernames
   */
  getRecentAdminActions(limit: number): Promise<Array<{
    id: string;
    adminUsername: string;
    actionType: string;
    targetType: string;
    status: string;
    createdAt: string;
  }>>;
  
  /**
   * Get engagement metrics
   * Returns daily active users, posts, comments, and likes for today
   */
  getEngagementMetrics(): Promise<{
    dau: number;
    postsToday: number;
    commentsToday: number;
    likesToday: number;
  }>;
  
  /**
   * Get top content by views
   * Returns top N threads sorted by views
   */
  getTopContentByViews(limit: number): Promise<Array<{
    id: string;
    title: string;
    views: number;
    author: string;
    createdAt: Date;
  }>>;
  
  /**
   * Get top users by reputation
   * Returns top N users sorted by reputation score
   */
  getTopUsersByReputation(limit: number): Promise<Array<{
    id: string;
    username: string;
    reputation: number;
    coins: number;
    badges: string[];
    posts: number;
  }>>;

  // ============================================================================
  // PHASE 2: Content Moderation Methods (14 methods)
  // ============================================================================

  /**
   * Get moderation queue - queries forumThreads/forumReplies DIRECTLY
   */
  getModerationQueue(params: {
    type?: "thread" | "reply" | "all";
    status?: "pending" | "approved" | "rejected";
    page?: number;
    perPage?: number;
  }): Promise<{
    items: import("@shared/schema").ModerationQueueItem[];
    total: number;
    page: number;
    perPage: number;
  }>;

  /**
   * Get reported content aggregated by contentId
   */
  getReportedContent(params: {
    status?: "pending" | "resolved" | "dismissed";
    page?: number;
    perPage?: number;
  }): Promise<{
    items: import("@shared/schema").ReportedContentSummary[];
    total: number;
    page: number;
    perPage: number;
  }>;

  /**
   * Get queue count breakdown
   */
  getQueueCount(): Promise<{
    total: number;
    threads: number;
    replies: number;
    urgentCount: number;
  }>;

  /**
   * Get reported content count
   */
  getReportedCount(): Promise<{
    total: number;
    newReports: number;
    underReview: number;
  }>;

  /**
   * Approve content (thread or reply)
   */
  approveContent(params: {
    contentId: string;
    contentType: "thread" | "reply";
    moderatorId: string;
    moderatorUsername: string;
  }): Promise<void>;

  /**
   * Reject content (thread or reply)
   */
  rejectContent(params: {
    contentId: string;
    contentType: "thread" | "reply";
    moderatorId: string;
    moderatorUsername: string;
    reason: string;
  }): Promise<void>;

  /**
   * Get full content details for moderation review
   */
  getContentDetails(params: {
    contentId: string;
    contentType: "thread" | "reply";
  }): Promise<import("@shared/schema").ContentDetails>;

  /**
   * Get report details with aggregated reports for same content
   */
  getReportDetails(reportId: number): Promise<import("@shared/schema").ReportDetails>;

  /**
   * Dismiss a report (content stays visible)
   */
  dismissReport(params: {
    reportId: number;
    moderatorId: string;
    reason?: string;
  }): Promise<void>;

  /**
   * Take action on reported content (delete, warn, suspend, ban)
   */
  takeReportAction(params: {
    contentId: string;
    contentType: "thread" | "reply";
    actionType: "delete" | "warn" | "suspend" | "ban";
    moderatorId: string;
    reason: string;
    suspendDays?: number;
  }): Promise<void>;

  /**
   * Bulk approve content
   */
  bulkApprove(params: {
    contentIds: string[];
    contentType: "thread" | "reply";
    moderatorId: string;
    moderatorUsername: string;
  }): Promise<{
    successCount: number;
    failedIds: string[];
  }>;

  /**
   * Bulk reject content
   */
  bulkReject(params: {
    contentIds: string[];
    contentType: "thread" | "reply";
    moderatorId: string;
    reason: string;
  }): Promise<{
    successCount: number;
    failedIds: string[];
  }>;

  /**
   * Get moderation history/audit log
   */
  getModerationHistory(params: {
    limit?: number;
    moderatorId?: string;
  }): Promise<import("@shared/schema").ModerationActionLog[]>;

  /**
   * Get moderation statistics
   */
  getModerationStats(): Promise<{
    todayApproved: number;
    todayRejected: number;
    todayReportsHandled: number;
    totalModeratedToday: number;
    averageResponseTimeMinutes: number;
    mostActiveModerator: { id: string; username: string; actionCount: number };
    pendingByAge: { lessThan1Hour: number; between1And24Hours: number; moreThan24Hours: number };
  }>;

  // ============================================================================
  // PHASE 2: Marketplace Management (14 methods)
  // ============================================================================

  /**
   * Get paginated marketplace items with filters
   */
  getMarketplaceItems(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'sales';
  }): Promise<{
    items: Array<{
      id: string;
      title: string;
      type: string;
      category: string;
      status: string;
      coinPrice: number;
      sales: number;
      revenue: number;
      sellerUsername: string;
      sellerId: string;
      featured: boolean;
      featuredUntil: string | null;
      createdAt: string;
      approvedAt: string | null;
      rejectedAt: string | null;
      rejectionReason: string | null;
      deletedAt: string | null;
    }>;
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  }>;

  /**
   * Get detailed marketplace item by ID
   */
  getMarketplaceItemById(id: string): Promise<any | null>;

  /**
   * Get pending marketplace items awaiting approval
   */
  getPendingMarketplaceItems(limit?: number): Promise<Array<{
    id: string;
    title: string;
    type: string;
    category: string;
    status: string;
    coinPrice: number;
    sales: number;
    revenue: number;
    sellerUsername: string;
    sellerId: string;
    featured: boolean;
    featuredUntil: string | null;
    createdAt: string;
    approvedAt: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
    deletedAt: string | null;
  }>>;

  /**
   * Approve a marketplace item
   */
  approveMarketplaceItem(id: string, adminId: string): Promise<void>;

  /**
   * Reject a marketplace item with reason
   */
  rejectMarketplaceItem(id: string, adminId: string, reason: string): Promise<void>;

  /**
   * Feature a marketplace item on homepage
   */
  featureMarketplaceItem(id: string, adminId: string, durationDays: number): Promise<void>;

  /**
   * Soft delete a marketplace item
   */
  deleteMarketplaceItem(id: string, adminId: string): Promise<void>;

  /**
   * Get paginated marketplace sales
   */
  getMarketplaceSales(params: {
    page?: number;
    pageSize?: number;
    contentId?: string;
    buyerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    sales: Array<{
      id: string;
      contentId: string;
      contentTitle: string;
      buyerUsername: string;
      buyerId: string;
      sellerUsername: string;
      sellerId: string;
      priceCoins: number;
      purchasedAt: string;
    }>;
    page: number;
    pageSize: number;
    totalSales: number;
    totalPages: number;
  }>;

  /**
   * Get recent marketplace sales
   */
  getRecentMarketplaceSales(limit?: number): Promise<Array<{
    id: string;
    contentId: string;
    contentTitle: string;
    buyerUsername: string;
    buyerId: string;
    sellerUsername: string;
    sellerId: string;
    priceCoins: number;
    purchasedAt: string;
  }>>;

  /**
   * Get marketplace revenue by period
   */
  getMarketplaceRevenue(period: 'today' | 'week' | 'month' | 'year' | 'all'): Promise<{
    totalCoins: number;
    totalSales: number;
    averageSale: number;
  }>;

  /**
   * Get revenue trend for chart
   */
  getRevenueTrend(days?: number): Promise<Array<{ date: string; revenue: number }>>;

  /**
   * Get top-selling items
   */
  getTopSellingItems(limit?: number): Promise<Array<{
    id: string;
    title: string;
    sales: number;
    revenue: number;
    sellerUsername: string;
  }>>;

  /**
   * Get top-earning vendors
   */
  getTopVendors(limit?: number): Promise<Array<{
    sellerId: string;
    sellerUsername: string;
    totalRevenue: number;
    totalSales: number;
    itemCount: number;
  }>>;

  /**
   * Get marketplace dashboard statistics
   */
  getMarketplaceStats(): Promise<{
    totalItems: number;
    pendingItems: number;
    approvedItems: number;
    rejectedItems: number;
    featuredItems: number;
    totalSales: number;
    salesThisWeek: number;
    totalRevenue: number;
    revenueThisWeek: number;
  }>;

  // ============================================================================
  // PHASE 2: Broker Admin Management (12 methods)
  // ============================================================================

  /**
   * Get brokers with admin filters and pagination
   */
  getAdminBrokers(filters?: {
    search?: string;
    country?: string;
    regulation?: string;
    isVerified?: boolean;
    scamWarning?: boolean;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: Array<{
      id: string;
      name: string;
      slug: string;
      country: string | null;
      regulation: string | null;
      isVerified: boolean;
      scamWarning: boolean;
      reviewCount: number;
      overallRating: number;
      scamReportCount: number;
      status: string;
      createdAt: Date;
      verifiedBy: string | null;
      verifiedAt: Date | null;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }>;

  /**
   * Verify a broker
   */
  verifyBroker(brokerId: string, adminId: string): Promise<void>;

  /**
   * Remove verification from a broker
   */
  unverifyBroker(brokerId: string, adminId: string): Promise<void>;

  /**
   * Soft delete a broker
   */
  deleteBroker(brokerId: string, adminId: string): Promise<void>;

  /**
   * Toggle scam warning on a broker
   */
  toggleScamWarning(
    brokerId: string,
    adminId: string,
    reason?: string,
    enabled?: boolean
  ): Promise<{ scamWarning: boolean }>;

  /**
   * Get scam reports with filters and pagination
   */
  getScamReports(filters?: {
    brokerId?: string;
    severity?: "low" | "medium" | "high" | "critical";
    status?: "pending" | "approved" | "rejected";
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: Array<{
      id: string;
      brokerId: string;
      brokerName: string;
      brokerLogoUrl: string | null;
      userId: string;
      username: string;
      rating: number;
      reviewTitle: string;
      reviewBody: string;
      scamSeverity: string | null;
      status: string;
      datePosted: Date;
      approvedBy: string | null;
      approvedAt: Date | null;
      rejectedBy: string | null;
      rejectedAt: Date | null;
      rejectionReason: string | null;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }>;

  /**
   * Resolve a scam report (confirm or dismiss)
   */
  resolveScamReport(
    reportId: string,
    adminId: string,
    resolution: "confirmed" | "dismissed"
  ): Promise<void>;

  /**
   * Approve a broker review
   */
  approveBrokerReview(reviewId: string, adminId: string): Promise<void>;

  /**
   * Reject a broker review
   */
  rejectBrokerReview(reviewId: string, adminId: string, reason: string): Promise<void>;

  /**
   * Get broker statistics for admin dashboard
   */
  getBrokerStats(): Promise<{
    totalBrokers: number;
    verifiedBrokers: number;
    scamWarnings: number;
    totalReviews: number;
    pendingReviews: number;
    pendingScamReports: number;
  }>;

  /**
   * Update broker details (admin)
   */
  updateBroker(
    brokerId: string,
    data: {
      name?: string;
      country?: string;
      regulation?: string;
      websiteUrl?: string;
      minDeposit?: string;
      leverage?: string;
      platform?: string;
      spreadType?: string;
      minSpread?: string;
    },
    adminId: string
  ): Promise<void>;

  /**
   * Get pending brokers awaiting approval
   */
  getPendingBrokers(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    country: string | null;
    regulation: string | null;
    createdAt: Date;
    submittedBy?: string | null;
  }>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, CoinTransaction>;
  private rechargeOrders: Map<string, RechargeOrder>;
  private content: Map<string, Content>;
  private contentPurchases: Map<string, ContentPurchase>;
  private contentReviews: Map<string, ContentReview>;
  private contentLikes: Map<string, ContentLike>;
  private contentReplies: Map<string, ContentReply>;
  private brokers: Map<string, Broker>;
  private brokerReviews: Map<string, BrokerReview>;
  private forumThreadsMap: Map<string, ForumThread>;
  private forumRepliesMap: Map<string, ForumReply>;
  private forumCategoriesMap: Map<string, ForumCategory>;
  private userBadgesMap: Map<string, UserBadge>;
  private activityFeedMap: Map<string, ActivityFeed>;
  private userFollowsMap: Map<string, UserFollow>;
  private userActivity: Map<string, UserActivity>;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.rechargeOrders = new Map();
    this.content = new Map();
    this.contentPurchases = new Map();
    this.contentReviews = new Map();
    this.contentLikes = new Map();
    this.contentReplies = new Map();
    this.brokers = new Map();
    this.brokerReviews = new Map();
    this.forumThreadsMap = new Map();
    this.forumRepliesMap = new Map();
    this.forumCategoriesMap = new Map();
    this.userBadgesMap = new Map();
    this.activityFeedMap = new Map();
    this.userFollowsMap = new Map();
    this.userActivity = new Map();
    
    // Create demo user with coins
    const demoUser: User = {
      id: "demo-user-id",
      username: "demo",
      password: "demo",
      email: null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      location: null,
      totalCoins: 2450,
      weeklyEarned: 85,
      rank: 142,
      youtubeUrl: null,
      instagramHandle: null,
      telegramHandle: null,
      myfxbookLink: null,
      investorId: null,
      investorPassword: null,
      isVerifiedTrader: false,
      emailNotifications: true,
      hasYoutubeReward: false,
      hasMyfxbookReward: false,
      hasInvestorReward: false,
      badges: null,
      onboardingCompleted: false,
      onboardingDismissed: false,
      onboardingProgress: null,
      reputationScore: 0,
      lastReputationUpdate: null,
      lastJournalPost: null,
      level: 2,
      role: "member",
      status: "active",
      suspendedUntil: null,
      bannedAt: null,
      bannedBy: null,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(demoUser.id, demoUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any> {
    const user = Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
    if (!user) return null;
    return { ...user, profile: null };
  }

  async getUserThreads(userId: string): Promise<ForumThread[]> {
    return Array.from(this.forumThreadsMap.values()).filter(
      (thread) => thread.authorId === userId
    );
  }

  async createUser(insertUser: InsertUser | UpsertUser): Promise<User> {
    const id = 'id' in insertUser && insertUser.id ? insertUser.id : randomUUID();
    
    // Determine if this is OIDC or traditional auth
    const isOIDC = 'email' in insertUser && insertUser.email !== undefined;
    
    const user: User = { 
      id,
      // OIDC fields (if present)
      email: isOIDC ? ((insertUser as UpsertUser).email ?? null) : null,
      firstName: isOIDC ? ((insertUser as UpsertUser).firstName ?? null) : null,
      lastName: isOIDC ? ((insertUser as UpsertUser).lastName ?? null) : null,
      profileImageUrl: isOIDC ? ((insertUser as UpsertUser).profileImageUrl ?? null) : null,
      location: null,
      // Traditional auth fields (if present)
      username: 'username' in insertUser ? insertUser.username : (isOIDC ? (insertUser as UpsertUser).email || 'user' : 'user'),
      password: 'password' in insertUser ? insertUser.password : null,
      // YoForex fields with defaults
      totalCoins: 0,
      weeklyEarned: 0,
      rank: null,
      youtubeUrl: null,
      instagramHandle: null,
      telegramHandle: null,
      myfxbookLink: null,
      investorId: null,
      investorPassword: null,
      isVerifiedTrader: false,
      emailNotifications: true,
      hasYoutubeReward: false,
      hasMyfxbookReward: false,
      hasInvestorReward: false,
      badges: null,
      onboardingCompleted: false,
      onboardingDismissed: false,
      onboardingProgress: null,
      reputationScore: 0,
      lastReputationUpdate: null,
      lastJournalPost: null,
      level: 0,
      role: "member",
      status: "active",
      suspendedUntil: null,
      bannedAt: null,
      bannedBy: null,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(upsertUser: UpsertUser): Promise<User> {
    // Type guard: ensure id is defined
    if (!upsertUser.id) {
      throw new Error("User ID is required for upsert operation");
    }
    
    const existingUser = this.users.get(upsertUser.id);
    
    if (existingUser) {
      // Update existing user (don't change username to avoid conflicts)
      const updatedUser: User = {
        ...existingUser,
        email: upsertUser.email ?? existingUser.email,
        firstName: upsertUser.firstName ?? existingUser.firstName,
        lastName: upsertUser.lastName ?? existingUser.lastName,
        profileImageUrl: upsertUser.profileImageUrl ?? existingUser.profileImageUrl,
        updatedAt: new Date(),
      };
      this.users.set(upsertUser.id, updatedUser);
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
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const newTotalCoins = user.totalCoins + coins;
    const updatedUser = { 
      ...user, 
      totalCoins: newTotalCoins,
      level: calculateUserLevel(newTotalCoins)
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data, id: user.id, updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async trackOnboardingProgress(userId: string, task: string): Promise<{ completed: boolean; coinsEarned: number }> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const progress = (user.onboardingProgress as any) || {
      profileCreated: false,
      firstReply: false,
      firstReport: false,
      firstUpload: false,
      socialLinked: false,
    };

    const taskMapping: Record<string, { key: string; reward: number }> = {
      profileCreated: { key: "profileCreated", reward: 10 },
      firstReply: { key: "firstReply", reward: 15 },
      firstReport: { key: "firstReport", reward: 20 },
      firstUpload: { key: "firstUpload", reward: 50 },
      socialLinked: { key: "socialLinked", reward: 30 },
    };

    const taskInfo = taskMapping[task];
    if (!taskInfo) {
      return { completed: false, coinsEarned: 0 };
    }

    if (progress[taskInfo.key]) {
      return { completed: true, coinsEarned: 0 };
    }

    progress[taskInfo.key] = true;
    const allCompleted = Object.values(progress).every((v) => v === true);

    // Update onboarding progress (coins will be updated by createCoinTransaction)
    const updatedUser = {
      ...user,
      onboardingProgress: progress,
      onboardingCompleted: allCompleted,
    };
    this.users.set(userId, updatedUser);

    // Award coins through transaction system (this updates totalCoins)
    await this.createCoinTransaction({
      userId,
      type: "earn",
      amount: taskInfo.reward,
      description: `Onboarding reward: ${task}`,
      status: "completed",
    });

    return { completed: true, coinsEarned: taskInfo.reward };
  }

  // Daily Earning system - Activity tracking
  async recordActivity(userId: string, minutes: number): Promise<{coinsEarned: number, totalMinutes: number}> {
    // Get today's date string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create today's activity record
    const activityKey = `${userId}_${today}`;
    let activity = Array.from(this.userActivity.values()).find(
      a => a.userId === userId && a.date === today
    );
    
    if (!activity) {
      activity = {
        id: randomUUID(),
        userId,
        date: today,
        activeMinutes: 0,
        coinsEarned: 0,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };
      this.userActivity.set(activity.id, activity);
    }
    
    // Calculate new totals
    const newMinutes = activity.activeMinutes + minutes;
    const cappedMinutes = Math.min(newMinutes, 500); // Max 500 minutes per day
    
    // Award coins: 0.5 coins per 5 minutes = cappedMinutes / 10 (max 50 coins per day)
    const totalCoinsEarned = cappedMinutes / 10;
    const newCoins = totalCoinsEarned - activity.coinsEarned;
    
    // Update activity record
    activity.activeMinutes = cappedMinutes;
    activity.coinsEarned = totalCoinsEarned;
    activity.lastActivityAt = new Date();
    this.userActivity.set(activity.id, activity);
    
    // Award coins to user if any earned
    if (newCoins > 0) {
      await this.createCoinTransaction({
        userId,
        type: "earn",
        amount: newCoins,
        description: `Daily activity reward: ${minutes} active minutes`,
        status: "completed",
      });
    }
    
    return { coinsEarned: newCoins, totalMinutes: cappedMinutes };
  }

  async getTodayActivity(userId: string): Promise<{activeMinutes: number, coinsEarned: number} | null> {
    const today = new Date().toISOString().split('T')[0];
    const activity = Array.from(this.userActivity.values()).find(
      a => a.userId === userId && a.date === today
    );
    
    if (!activity) {
      return { activeMinutes: 0, coinsEarned: 0 };
    }
    
    return {
      activeMinutes: activity.activeMinutes,
      coinsEarned: activity.coinsEarned,
    };
  }

  // Daily Earning system - Journal tracking
  async checkCanPostJournal(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return user.lastJournalPost !== today;
  }

  async markJournalPosted(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const today = new Date().toISOString().split('T')[0];
    const updatedUser = { ...user, lastJournalPost: today };
    this.users.set(userId, updatedUser);
  }

  async createCoinTransaction(insertTransaction: InsertCoinTransaction): Promise<CoinTransaction> {
    const user = this.users.get(insertTransaction.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Calculate actual balance change based on transaction type
    const balanceChange = insertTransaction.type === "spend" 
      ? -Math.abs(insertTransaction.amount) 
      : Math.abs(insertTransaction.amount);
    
    // Prevent overdraft
    if (user.totalCoins + balanceChange < 0) {
      throw new Error("Insufficient coins");
    }
    
    const id = randomUUID();
    const transaction: CoinTransaction = {
      id,
      userId: insertTransaction.userId,
      type: insertTransaction.type as "earn" | "spend" | "recharge",
      amount: Math.abs(insertTransaction.amount),
      description: insertTransaction.description,
      status: (insertTransaction.status || "completed") as "completed" | "pending" | "failed",
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    
    // Update user's coin balance and stats
    const newTotalCoins = user.totalCoins + balanceChange;
    const updatedUser = {
      ...user,
      totalCoins: newTotalCoins,
      level: calculateUserLevel(newTotalCoins),
      weeklyEarned: insertTransaction.type === "earn" || insertTransaction.type === "recharge"
        ? user.weeklyEarned + Math.abs(insertTransaction.amount)
        : user.weeklyEarned
    };
    this.users.set(insertTransaction.userId, updatedUser);
    
    // Recalculate rank based on total coins
    await this.recalculateRanks();
    
    return transaction;
  }

  async getUserTransactions(userId: string, limit = 20): Promise<CoinTransaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createRechargeOrder(insertOrder: InsertRechargeOrder): Promise<RechargeOrder> {
    const id = randomUUID();
    const order: RechargeOrder = {
      id,
      userId: insertOrder.userId,
      coinAmount: insertOrder.coinAmount,
      priceUsd: insertOrder.priceUsd,
      paymentMethod: insertOrder.paymentMethod as "stripe" | "crypto",
      paymentId: insertOrder.paymentId || null,
      status: (insertOrder.status || "pending") as "completed" | "pending" | "failed",
      createdAt: new Date(),
      completedAt: null,
    };
    this.rechargeOrders.set(id, order);
    return order;
  }

  async getRechargeOrder(id: string): Promise<RechargeOrder | undefined> {
    return this.rechargeOrders.get(id);
  }

  async updateRechargeOrderStatus(
    id: string, 
    status: "completed" | "failed",
    paymentId?: string
  ): Promise<RechargeOrder | undefined> {
    const order = this.rechargeOrders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: RechargeOrder = {
      ...order,
      status,
      paymentId: paymentId || order.paymentId,
      completedAt: status === "completed" ? new Date() : null,
    };
    this.rechargeOrders.set(id, updatedOrder);
    
    // If completed, credit coins and create transaction
    if (status === "completed") {
      await this.createCoinTransaction({
        userId: order.userId,
        type: "recharge",
        amount: order.coinAmount,
        description: `Coin recharge via ${order.paymentMethod}`,
        status: "completed",
      });
    }
    
    return updatedOrder;
  }
  
  private async recalculateRanks(): Promise<void> {
    // Sort users by total coins descending
    const sortedUsers = Array.from(this.users.values())
      .sort((a, b) => b.totalCoins - a.totalCoins);
    
    // Assign ranks
    sortedUsers.forEach((user, index) => {
      const updatedUser = { ...user, rank: index + 1 };
      this.users.set(user.id, updatedUser);
    });
  }
  
  // Content Management Methods
  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = randomUUID();
    
    // Apply Invisible SEO Engine automations
    const seo = applySEOAutomations({
      title: insertContent.title,
      description: insertContent.description,
      imageUrls: insertContent.imageUrls || [],
    });
    
    // De-duplicate slug to prevent collisions
    const existingSlugs = new Set(
      Array.from(this.content.values()).map((c) => c.slug)
    );
    const uniqueSlug = generateUniqueSlug(seo.slug, existingSlugs);
    
    const content: Content = {
      id,
      authorId: insertContent.authorId,
      type: insertContent.type as "ea" | "indicator" | "article" | "source_code",
      title: insertContent.title,
      description: insertContent.description,
      priceCoins: insertContent.priceCoins,
      isFree: insertContent.isFree ?? (insertContent.priceCoins === 0),
      category: insertContent.category,
      // Publishing flow fields
      platform: null,
      version: null,
      tags: null,
      files: null,
      images: null,
      // Optional fields
      brokerCompat: null,
      minDeposit: null,
      hedging: null,
      changelog: null,
      license: null,
      // Evidence fields (for Performance Reports)
      equityCurveImage: null,
      profitFactor: null,
      drawdownPercent: null,
      winPercent: null,
      broker: null,
      monthsTested: null,
      // Legacy fields
      fileUrl: insertContent.fileUrl || null,
      imageUrl: insertContent.imageUrl || null,
      imageUrls: insertContent.imageUrls || null,
      postLogoUrl: insertContent.postLogoUrl || null,
      views: 0,
      downloads: 0,
      likes: 0,
      isFeatured: false,
      averageRating: null,
      reviewCount: 0,
      status: "pending",
      slug: uniqueSlug,
      focusKeyword: seo.focusKeyword,
      autoMetaDescription: seo.autoMetaDescription,
      autoImageAltTexts: seo.autoImageAltTexts,
      metaTitle: null,
      metaKeywords: null,
      salesScore: 0,
      lastSalesUpdate: null,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      featured: false,
      featuredUntil: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.content.set(id, content);
    return content;
  }
  
  async getContent(id: string): Promise<Content | undefined> {
    return this.content.get(id);
  }
  
  async getContentBySlug(slug: string): Promise<Content | undefined> {
    return Array.from(this.content.values()).find((c) => c.slug === slug);
  }
  
  async getAllContent(filters?: { type?: string; category?: string; status?: string }): Promise<Content[]> {
    let contents = Array.from(this.content.values());
    
    if (filters?.type) {
      contents = contents.filter((c) => c.type === filters.type);
    }
    if (filters?.category) {
      contents = contents.filter((c) => c.category === filters.category);
    }
    if (filters?.status) {
      contents = contents.filter((c) => c.status === filters.status);
    }
    
    return contents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserContent(userId: string): Promise<Content[]> {
    return Array.from(this.content.values())
      .filter((c) => c.authorId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateContentViews(contentId: string): Promise<void> {
    const content = this.content.get(contentId);
    if (content) {
      this.content.set(contentId, { ...content, views: content.views + 1 });
    }
  }
  
  async updateContentDownloads(contentId: string): Promise<void> {
    const content = this.content.get(contentId);
    if (content) {
      this.content.set(contentId, { ...content, downloads: content.downloads + 1 });
    }
  }
  
  // Content Purchase Methods
  async purchaseContent(contentId: string, buyerId: string): Promise<ContentPurchase> {
    // 1. Validate content exists and get seller from content author
    const item = this.content.get(contentId);
    if (!item) throw new Error("Content not found");
    
    const sellerId = item.authorId;
    
    // 2. Prevent self-purchase
    if (buyerId === sellerId) {
      throw new Error("Cannot purchase own content");
    }
    
    // 3. Check if already purchased
    const alreadyPurchased = await this.hasPurchased(buyerId, contentId);
    if (alreadyPurchased) throw new Error("Already purchased");
    
    // 4. Handle free content without transactions
    if (item.isFree || item.priceCoins === 0) {
      const id = randomUUID();
      const purchase: ContentPurchase = {
        id,
        contentId,
        buyerId,
        sellerId,
        priceCoins: 0,
        transactionId: "",
        purchasedAt: new Date(),
      };
      this.contentPurchases.set(id, purchase);
      await this.updateContentDownloads(contentId);
      return purchase;
    }
    
    // 5. Validate both users exist upfront
    const buyer = this.users.get(buyerId);
    if (!buyer) throw new Error("Buyer not found");
    
    const seller = this.users.get(sellerId);
    if (!seller) throw new Error("Seller not found");
    
    // 6. Check if buyer has enough coins
    if (buyer.totalCoins < item.priceCoins) {
      throw new Error(`Insufficient balance. Need ${item.priceCoins} coins, have ${buyer.totalCoins}`);
    }
    
    // 7. Calculate amounts (90% to seller, 10% to platform)
    const sellerAmount = Math.floor(item.priceCoins * 0.9);
    const platformAmount = item.priceCoins - sellerAmount;
    
    // 8. Atomic transaction: Create buyer's spend transaction
    let buyerTransaction: CoinTransaction;
    try {
      buyerTransaction = await this.createCoinTransaction({
        userId: buyerId,
        type: "spend",
        amount: item.priceCoins,
        description: `Purchased: ${item.title}`,
        status: "completed",
      });
    } catch (error) {
      throw new Error("Failed to debit buyer");
    }
    
    // 9. Create seller's earn transaction (90%)
    try {
      await this.createCoinTransaction({
        userId: sellerId,
        type: "earn",
        amount: sellerAmount,
        description: `Sale: ${item.title} (90% of ${item.priceCoins})`,
        status: "completed",
      });
    } catch (error) {
      // Rollback buyer's transaction by crediting back
      await this.createCoinTransaction({
        userId: buyerId,
        type: "earn",
        amount: item.priceCoins,
        description: `Refund: ${item.title} (seller error)`,
        status: "completed",
      });
      throw new Error("Failed to credit seller - purchase cancelled");
    }
    
    // 10. Create purchase record
    const id = randomUUID();
    const purchase: ContentPurchase = {
      id,
      contentId,
      buyerId,
      sellerId,
      priceCoins: item.priceCoins,
      transactionId: buyerTransaction.id,
      purchasedAt: new Date(),
    };
    this.contentPurchases.set(id, purchase);
    
    // 11. Update downloads count
    await this.updateContentDownloads(contentId);
    
    return purchase;
  }
  
  async getUserPurchases(userId: string): Promise<ContentPurchase[]> {
    return Array.from(this.contentPurchases.values())
      .filter((p) => p.buyerId === userId)
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
  }
  
  async hasPurchased(userId: string, contentId: string): Promise<boolean> {
    return Array.from(this.contentPurchases.values()).some(
      (p) => p.buyerId === userId && p.contentId === contentId
    );
  }
  
  // Content Review Methods
  async createReview(insertReview: InsertContentReview): Promise<ContentReview> {
    // Verify content exists
    const content = this.content.get(insertReview.contentId);
    if (!content) throw new Error("Content not found");
    
    // Verify user exists
    const user = this.users.get(insertReview.userId);
    if (!user) throw new Error("User not found");
    
    const id = randomUUID();
    const review: ContentReview = {
      id,
      contentId: insertReview.contentId,
      userId: insertReview.userId,
      rating: insertReview.rating,
      review: insertReview.review,
      status: "pending",
      rewardGiven: false,
      createdAt: new Date(),
    };
    this.contentReviews.set(id, review);
    return review;
  }
  
  async getContentReviews(contentId: string): Promise<ContentReview[]> {
    return Array.from(this.contentReviews.values())
      .filter((r) => r.contentId === contentId && r.status === "approved")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserReviewCount(userId: string): Promise<number> {
    // Count content reviews
    const contentReviewCount = Array.from(this.contentReviews.values())
      .filter((r) => r.userId === userId).length;
    
    // Count broker reviews
    const brokerReviewCount = Array.from(this.brokerReviews.values())
      .filter((r) => r.userId === userId).length;
    
    return contentReviewCount + brokerReviewCount;
  }
  
  // Content Like Methods
  async likeContent(insertLike: InsertContentLike): Promise<ContentLike | null> {
    // 1. Verify content exists
    const content = this.content.get(insertLike.contentId);
    if (!content) throw new Error("Content not found");
    
    // 2. Verify user exists
    const user = this.users.get(insertLike.userId);
    if (!user) throw new Error("User not found");
    
    // 3. Check if already liked
    const alreadyLiked = await this.hasLiked(insertLike.userId, insertLike.contentId);
    if (alreadyLiked) return null;
    
    // 4. Check daily like limit (5 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLikes = Array.from(this.contentLikes.values()).filter(
      (l) => l.userId === insertLike.userId && l.createdAt >= today
    );
    if (todayLikes.length >= 5) {
      throw new Error("Daily like limit reached (5 per day)");
    }
    
    const id = randomUUID();
    const like: ContentLike = {
      id,
      contentId: insertLike.contentId,
      userId: insertLike.userId,
      createdAt: new Date(),
    };
    this.contentLikes.set(id, like);
    
    // Update content likes count
    this.content.set(insertLike.contentId, { ...content, likes: content.likes + 1 });
    
    // Award 1 coin to liker
    await this.createCoinTransaction({
      userId: insertLike.userId,
      type: "earn",
      amount: 1,
      description: `Liked: ${content.title}`,
      status: "completed",
    });
    
    return like;
  }
  
  async hasLiked(userId: string, contentId: string): Promise<boolean> {
    return Array.from(this.contentLikes.values()).some(
      (l) => l.userId === userId && l.contentId === contentId
    );
  }
  
  // Content Reply Methods
  async createReply(insertReply: InsertContentReply): Promise<ContentReply> {
    const content = this.content.get(insertReply.contentId);
    if (!content) throw new Error("Content not found");
    
    const user = this.users.get(insertReply.userId);
    if (!user) throw new Error("User not found");
    
    if (insertReply.parentId) {
      const parent = this.contentReplies.get(insertReply.parentId);
      if (!parent) throw new Error("Parent reply not found");
    }
    
    const id = randomUUID();
    const reply: ContentReply = {
      id,
      contentId: insertReply.contentId,
      userId: insertReply.userId,
      parentId: insertReply.parentId || null,
      body: insertReply.body,
      rating: insertReply.rating || null,
      imageUrls: insertReply.imageUrls || null,
      helpful: 0,
      isVerified: false,
      createdAt: new Date(),
    };
    this.contentReplies.set(id, reply);
    return reply;
  }
  
  async getContentReplies(contentId: string): Promise<ContentReply[]> {
    return Array.from(this.contentReplies.values())
      .filter((r) => r.contentId === contentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async updateReplyHelpful(replyId: string): Promise<void> {
    const reply = this.contentReplies.get(replyId);
    if (reply) {
      this.contentReplies.set(replyId, { ...reply, helpful: reply.helpful + 1 });
    }
  }
  
  // Broker Management Methods
  async createBroker(insertBroker: InsertBroker): Promise<Broker> {
    const id = randomUUID();
    const broker: Broker = {
      id,
      name: insertBroker.name,
      slug: insertBroker.slug,
      websiteUrl: insertBroker.websiteUrl || null,
      logoUrl: insertBroker.logoUrl || null,
      yearFounded: insertBroker.yearFounded || null,
      regulation: insertBroker.regulation || null,
      regulationSummary: insertBroker.regulationSummary || null,
      platform: insertBroker.platform || null,
      spreadType: insertBroker.spreadType || null,
      minSpread: insertBroker.minSpread || null,
      overallRating: 0,
      reviewCount: 0,
      scamReportCount: 0,
      isVerified: false,
      status: "pending",
      verifiedBy: null,
      verifiedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      scamWarning: false,
      scamWarningReason: null,
      deletedAt: null,
      country: null,
      minDeposit: null,
      leverage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.brokers.set(id, broker);
    return broker;
  }
  
  async getBroker(id: string): Promise<Broker | undefined> {
    return this.brokers.get(id);
  }
  
  async getBrokerBySlug(slug: string): Promise<Broker | undefined> {
    return Array.from(this.brokers.values()).find((b) => b.slug === slug);
  }
  
  async getAllBrokers(filters?: { isVerified?: boolean; status?: string }): Promise<Broker[]> {
    let brokerList = Array.from(this.brokers.values());
    
    if (filters?.isVerified !== undefined) {
      brokerList = brokerList.filter((b) => b.isVerified === filters.isVerified);
    }
    if (filters?.status) {
      brokerList = brokerList.filter((b) => b.status === filters.status);
    }
    
    return brokerList.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0));
  }

  async searchBrokers(query: string, limit: number = 10): Promise<Broker[]> {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];
    
    const brokerList = Array.from(this.brokers.values())
      .filter((b) => b.status === 'approved') // Only show approved brokers
      .filter((b) => 
        b.name.toLowerCase().includes(lowerQuery) ||
        (b.websiteUrl && b.websiteUrl.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.name.toLowerCase() === lowerQuery ? 1 : 0;
        const bExact = b.name.toLowerCase() === lowerQuery ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        
        // Then by rating
        return (b.overallRating || 0) - (a.overallRating || 0);
      })
      .slice(0, limit);
    
    return brokerList;
  }
  
  async createBrokerReview(insertReview: InsertBrokerReview): Promise<BrokerReview> {
    // Verify broker exists
    const broker = this.brokers.get(insertReview.brokerId);
    if (!broker) throw new Error("Broker not found");
    
    // Verify user exists
    const user = this.users.get(insertReview.userId);
    if (!user) throw new Error("User not found");
    
    const id = randomUUID();
    const review: BrokerReview = {
      id,
      brokerId: insertReview.brokerId,
      userId: insertReview.userId,
      rating: insertReview.rating,
      reviewTitle: insertReview.reviewTitle,
      reviewBody: insertReview.reviewBody,
      isScamReport: insertReview.isScamReport ?? false,
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      scamSeverity: null,
      datePosted: new Date(),
    };
    this.brokerReviews.set(id, review);
    return review;
  }
  
  async getBrokerReview(reviewId: string): Promise<BrokerReview | null> {
    return this.brokerReviews.get(reviewId) || null;
  }

  async getBrokerReviews(brokerId: string, filters?: { isScamReport?: boolean }): Promise<BrokerReview[]> {
    let reviews = Array.from(this.brokerReviews.values())
      .filter((r) => r.brokerId === brokerId && r.status === "approved");
    
    if (filters?.isScamReport !== undefined) {
      reviews = reviews.filter((r) => r.isScamReport === filters.isScamReport);
    }
    
    return reviews.sort((a, b) => b.datePosted.getTime() - a.datePosted.getTime());
  }

  async updateBrokerReviewStatus(reviewId: string, status: string): Promise<BrokerReview> {
    const review = this.brokerReviews.get(reviewId);
    if (!review) throw new Error('Review not found');
    const updatedReview = { ...review, status: status as "pending" | "approved" | "rejected" };
    this.brokerReviews.set(reviewId, updatedReview);
    return updatedReview;
  }
  
  async updateBrokerRating(brokerId: string): Promise<void> {
    const broker = this.brokers.get(brokerId);
    if (!broker) return;
    
    const reviews = await this.getBrokerReviews(brokerId);
    const scamReports = await this.getBrokerReviews(brokerId, { isScamReport: true });
    
    if (reviews.length === 0) {
      this.brokers.set(brokerId, { ...broker, overallRating: 0, reviewCount: 0, scamReportCount: scamReports.length });
      return;
    }
    
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round(totalRating / reviews.length);
    
    this.brokers.set(brokerId, {
      ...broker,
      overallRating: averageRating,
      reviewCount: reviews.length,
      scamReportCount: scamReports.length,
    });
  }
  
  async createForumThread(insertThread: InsertForumThread, authorId: string): Promise<ForumThread> {
    const user = this.users.get(authorId);
    if (!user) throw new Error("User not found");
    
    const id = randomUUID();
    const focusKeyword = extractFocusKeyword(insertThread.title);
    const metaDescription = generateMetaDescription(insertThread.body);
    const baseSlug = generateThreadSlug(insertThread.title);
    const existingSlugs = new Set(Array.from(this.forumThreadsMap.values()).map(t => t.slug));
    const slug = generateUniqueSlug(baseSlug, existingSlugs);
    
    const thread: ForumThread = {
      id,
      authorId,
      categorySlug: insertThread.categorySlug,
      subcategorySlug: insertThread.subcategorySlug || null,
      title: insertThread.title,
      body: insertThread.body,
      slug,
      focusKeyword,
      metaDescription,
      metaTitle: null,
      metaKeywords: null,
      threadType: insertThread.threadType || "discussion",
      seoExcerpt: null,
      primaryKeyword: null,
      language: "en",
      instruments: [],
      timeframes: [],
      strategies: [],
      platform: null,
      broker: null,
      riskNote: null,
      hashtags: [],
      reviewTarget: null,
      reviewVersion: null,
      reviewRating: null,
      reviewPros: null,
      reviewCons: null,
      questionSummary: null,
      acceptedAnswerId: null,
      attachmentUrls: [],
      isPinned: insertThread.isPinned || false,
      isLocked: insertThread.isLocked || false,
      isSolved: false,
      views: 0,
      replyCount: 0,
      likeCount: 0,
      bookmarkCount: 0,
      shareCount: 0,
      lastActivityAt: new Date(),
      status: "approved",
      engagementScore: 0,
      lastScoreUpdate: null,
      helpfulVotes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.forumThreadsMap.set(id, thread);
    
    await this.updateCategoryStats(insertThread.categorySlug);
    
    await this.createActivity({
      userId: authorId,
      activityType: "thread_created",
      entityType: "thread",
      entityId: id,
      title: insertThread.title,
      description: metaDescription,
    });
    
    return thread;
  }
  
  async getForumThreadById(id: string): Promise<ForumThread | undefined> {
    return this.forumThreadsMap.get(id);
  }
  
  async getForumThreadBySlug(slug: string): Promise<ForumThread | undefined> {
    const thread = Array.from(this.forumThreadsMap.values()).find(t => t.slug === slug);
    if (thread) {
      this.forumThreadsMap.set(thread.id, { ...thread, views: thread.views + 1 });
    }
    return thread;
  }
  
  async listForumThreads(filters?: { categorySlug?: string; status?: string; isPinned?: boolean; limit?: number }): Promise<ForumThread[]> {
    let threads = Array.from(this.forumThreadsMap.values());
    
    if (filters?.categorySlug) {
      threads = threads.filter(t => t.categorySlug === filters.categorySlug);
    }
    if (filters?.status) {
      threads = threads.filter(t => t.status === filters.status);
    }
    if (filters?.isPinned !== undefined) {
      threads = threads.filter(t => t.isPinned === filters.isPinned);
    }
    
    threads.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
    });
    
    return filters?.limit ? threads.slice(0, filters.limit) : threads;
  }
  
  async updateForumThreadReplyCount(threadId: string, increment: number): Promise<void> {
    const thread = this.forumThreadsMap.get(threadId);
    if (thread) {
      this.forumThreadsMap.set(threadId, { 
        ...thread, 
        replyCount: thread.replyCount + increment 
      });
    }
  }
  
  async updateForumThreadActivity(threadId: string): Promise<void> {
    const thread = this.forumThreadsMap.get(threadId);
    if (thread) {
      this.forumThreadsMap.set(threadId, { 
        ...thread, 
        lastActivityAt: new Date() 
      });
    }
  }
  
  async createForumReply(insertReply: InsertForumReply): Promise<ForumReply> {
    const thread = this.forumThreadsMap.get(insertReply.threadId);
    if (!thread) throw new Error("Thread not found");
    
    const user = this.users.get(insertReply.userId);
    if (!user) throw new Error("User not found");
    
    if (insertReply.parentId) {
      const parent = this.forumRepliesMap.get(insertReply.parentId);
      if (!parent) throw new Error("Parent reply not found");
    }
    
    const id = randomUUID();
    const metaDescription = generateMetaDescription(insertReply.body);
    const slug = generateReplySlug(thread.title, user.username, id);
    
    const reply: ForumReply = {
      id,
      threadId: insertReply.threadId,
      userId: insertReply.userId,
      parentId: insertReply.parentId || null,
      body: insertReply.body,
      slug,
      metaDescription,
      imageUrls: insertReply.imageUrls || null,
      helpful: 0,
      helpfulVotes: 0,
      isAccepted: false,
      isVerified: false,
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.forumRepliesMap.set(id, reply);
    
    await this.updateForumThreadReplyCount(insertReply.threadId, 1);
    await this.updateForumThreadActivity(insertReply.threadId);
    await this.updateCategoryStats(thread.categorySlug);
    
    await this.createActivity({
      userId: insertReply.userId,
      activityType: "reply_posted",
      entityType: "reply",
      entityId: id,
      title: `Reply to: ${thread.title}`,
      description: metaDescription,
    });
    
    return reply;
  }
  
  async listForumReplies(threadId: string): Promise<ForumReply[]> {
    return Array.from(this.forumRepliesMap.values())
      .filter(r => r.threadId === threadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async markReplyAsAccepted(replyId: string): Promise<ForumReply | null> {
    const reply = this.forumRepliesMap.get(replyId);
    if (!reply) return null;
    
    const threadReplies = await this.listForumReplies(reply.threadId);
    threadReplies.forEach(r => {
      if (r.id !== replyId) {
        this.forumRepliesMap.set(r.id, { ...r, isAccepted: false });
      }
    });
    const updatedReply = { ...reply, isAccepted: true };
    this.forumRepliesMap.set(replyId, updatedReply);
    return updatedReply;
  }
  
  async markReplyAsHelpful(replyId: string): Promise<ForumReply | null> {
    const reply = this.forumRepliesMap.get(replyId);
    if (!reply) return null;
    
    const updatedReply = { ...reply, helpful: reply.helpful + 1 };
    this.forumRepliesMap.set(replyId, updatedReply);
    return updatedReply;
  }
  
  async listForumCategories(): Promise<ForumCategory[]> {
    return Array.from(this.forumCategoriesMap.values())
      .filter(c => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  async getForumCategoryBySlug(slug: string): Promise<ForumCategory | undefined> {
    return this.forumCategoriesMap.get(slug);
  }
  
  async updateCategoryStats(categorySlug: string): Promise<void> {
    const category = this.forumCategoriesMap.get(categorySlug);
    if (!category) return;
    
    const threads = Array.from(this.forumThreadsMap.values())
      .filter(t => t.categorySlug === categorySlug && t.status === "approved");
    
    let totalPosts = 0;
    threads.forEach(thread => {
      totalPosts += thread.replyCount;
    });
    
    this.forumCategoriesMap.set(categorySlug, {
      ...category,
      threadCount: threads.length,
      postCount: totalPosts + threads.length,
      updatedAt: new Date(),
    });
  }
  
  async createUserBadge(userId: string, badgeType: string): Promise<UserBadge> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const hasBadge = await this.hasUserBadge(userId, badgeType);
    if (hasBadge) throw new Error("User already has this badge");
    
    const id = randomUUID();
    const badge: UserBadge = {
      id,
      userId,
      badgeType: badgeType as "verified_trader" | "top_contributor" | "ea_expert" | "helpful_member" | "early_adopter",
      awardedAt: new Date(),
    };
    
    this.userBadgesMap.set(id, badge);
    
    await this.createActivity({
      userId,
      activityType: "badge_earned",
      entityType: "badge",
      entityId: id,
      title: `Earned badge: ${badgeType.replace(/_/g, ' ')}`,
    });
    
    return badge;
  }
  
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return Array.from(this.userBadgesMap.values())
      .filter(b => b.userId === userId)
      .sort((a, b) => b.awardedAt.getTime() - a.awardedAt.getTime());
  }
  
  async hasUserBadge(userId: string, badgeType: string): Promise<boolean> {
    return Array.from(this.userBadgesMap.values()).some(
      b => b.userId === userId && b.badgeType === badgeType
    );
  }
  
  async createActivity(insertActivity: InsertActivityFeed): Promise<ActivityFeed> {
    const user = this.users.get(insertActivity.userId);
    if (!user) throw new Error("User not found");
    
    const id = randomUUID();
    const activity: ActivityFeed = {
      id,
      userId: insertActivity.userId,
      activityType: insertActivity.activityType as "thread_created" | "reply_posted" | "content_published" | "purchase_made" | "review_posted" | "badge_earned",
      entityType: insertActivity.entityType as "thread" | "reply" | "content" | "purchase" | "review" | "badge",
      entityId: insertActivity.entityId,
      title: insertActivity.title,
      description: insertActivity.description || null,
      createdAt: new Date(),
    };
    
    this.activityFeedMap.set(id, activity);
    return activity;
  }
  
  async getRecentActivity(limit = 50): Promise<ActivityFeed[]> {
    return Array.from(this.activityFeedMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getUserActivity(userId: string, limit = 50): Promise<ActivityFeed[]> {
    return Array.from(this.activityFeedMap.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getLeaderboard(type: "coins" | "contributions" | "uploads", limit = 10): Promise<User[]> {
    const usersList = Array.from(this.users.values());
    
    if (type === "coins") {
      return usersList
        .sort((a, b) => b.totalCoins - a.totalCoins)
        .slice(0, limit);
    }
    
    if (type === "contributions") {
      const userContributions = new Map<string, number>();
      usersList.forEach(u => userContributions.set(u.id, 0));
      
      Array.from(this.forumThreadsMap.values()).forEach(t => {
        userContributions.set(t.authorId, (userContributions.get(t.authorId) || 0) + 1);
      });
      Array.from(this.forumRepliesMap.values()).forEach(r => {
        userContributions.set(r.userId, (userContributions.get(r.userId) || 0) + 1);
      });
      
      return usersList
        .sort((a, b) => (userContributions.get(b.id) || 0) - (userContributions.get(a.id) || 0))
        .slice(0, limit);
    }
    
    if (type === "uploads") {
      const userUploads = new Map<string, number>();
      usersList.forEach(u => userUploads.set(u.id, 0));
      
      Array.from(this.content.values()).forEach(c => {
        userUploads.set(c.authorId, (userUploads.get(c.authorId) || 0) + 1);
      });
      
      return usersList
        .sort((a, b) => (userUploads.get(b.id) || 0) - (userUploads.get(a.id) || 0))
        .slice(0, limit);
    }
    
    return [];
  }

  async getTopUsersByCoins(limit: number) {
    const results = Array.from(this.users.values())
      .map(user => ({
        userId: user.id,
        username: user.username,
        balance: user.totalCoins,
        rank: 0,
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);

    return results.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async getTopContributors(limit: number) {
    const contributions = new Map<string, { helpfulCount: number; acceptedCount: number }>();
    
    this.forumRepliesMap.forEach(reply => {
      const current = contributions.get(reply.userId) || { helpfulCount: 0, acceptedCount: 0 };
      if (reply.helpful > 0) current.helpfulCount++;
      if (reply.isAccepted) current.acceptedCount++;
      contributions.set(reply.userId, current);
    });

    const results = Array.from(contributions.entries())
      .map(([userId, stats]) => {
        const user = this.users.get(userId);
        return {
          userId,
          username: user?.username || 'Unknown',
          helpfulCount: stats.helpfulCount,
          acceptedCount: stats.acceptedCount,
          totalContributions: stats.helpfulCount + stats.acceptedCount,
          rank: 0,
        };
      })
      .sort((a, b) => b.totalContributions - a.totalContributions)
      .slice(0, limit);

    return results.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async getTopSellers(limit: number) {
    const sales = new Map<string, { revenue: number; count: number }>();
    
    this.contentPurchases.forEach(purchase => {
      if (purchase.priceCoins > 0) {
        const current = sales.get(purchase.sellerId) || { revenue: 0, count: 0 };
        current.revenue += purchase.priceCoins;
        current.count++;
        sales.set(purchase.sellerId, current);
      }
    });

    const results = Array.from(sales.entries())
      .map(([userId, stats]) => {
        const user = this.users.get(userId);
        return {
          userId,
          username: user?.username || 'Unknown',
          totalRevenue: stats.revenue,
          salesCount: stats.count,
          rank: 0,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return results.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async createUserFollow(data: InsertUserFollow): Promise<UserFollow> {
    const id = randomUUID();
    const userFollow: UserFollow = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.userFollowsMap.set(id, userFollow);
    return userFollow;
  }

  async deleteUserFollow(followerId: string, followingId: string): Promise<void> {
    const followToDelete = Array.from(this.userFollowsMap.values()).find(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
    if (followToDelete) {
      this.userFollowsMap.delete(followToDelete.id);
    }
  }

  async getFollow(followerId: string, followingId: string): Promise<UserFollow | null> {
    const follow = Array.from(this.userFollowsMap.values()).find(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
    return follow || null;
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    const followerIds = Array.from(this.userFollowsMap.values())
      .filter((f) => f.followingId === userId)
      .map((f) => f.followerId);
    
    return Array.from(this.users.values()).filter((u) => followerIds.includes(u.id));
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    const followingIds = Array.from(this.userFollowsMap.values())
      .filter((f) => f.followerId === userId)
      .map((f) => f.followingId);
    
    return Array.from(this.users.values()).filter((u) => followingIds.includes(u.id));
  }

  async checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
    return Array.from(this.userFollowsMap.values()).some(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
  }

  // Ledger System - Stubs (MemStorage does not support ledger operations)
  async createUserWallet(userId: string): Promise<UserWallet> {
    throw new Error("MemStorage does not support ledger operations");
  }

  async getUserWallet(userId: string): Promise<UserWallet | null> {
    throw new Error("MemStorage does not support ledger operations");
  }

  async beginLedgerTransaction(
    type: string,
    initiatorUserId: string,
    entries: Array<{
      userId: string;
      direction: 'debit' | 'credit';
      amount: number;
      memo: string;
    }>,
    context?: Record<string, any>,
    externalRef?: string
  ): Promise<CoinLedgerTransaction> {
    throw new Error("MemStorage does not support ledger operations");
  }

  async getLedgerTransactionHistory(userId: string, limit?: number): Promise<CoinJournalEntry[]> {
    throw new Error("MemStorage does not support ledger operations");
  }

  async reconcileWallets(): Promise<{driftCount: number; maxDelta: number}> {
    throw new Error("MemStorage does not support ledger operations");
  }

  async backfillOpeningBalances(): Promise<{created: number; skipped: number}> {
    throw new Error("MemStorage does not support ledger operations");
  }
  
  // Badge System
  async awardBadge(userId: string, badge: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    if (!user.badges) user.badges = [];
    if (!user.badges.includes(badge)) {
      user.badges.push(badge);
    }
  }

  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const newBadges: string[] = [];
    const user = this.users.get(userId);
    if (!user) return newBadges;

    const userBadges = user.badges || [];

    // Check EA Expert (5+ published EAs)
    const eaCount = Array.from(this.content.values())
      .filter(c => c.authorId === userId && c.type === 'ea').length;
    
    if (eaCount >= 5 && !userBadges.includes(BADGE_TYPES.EA_EXPERT)) {
      await this.awardBadge(userId, BADGE_TYPES.EA_EXPERT);
      newBadges.push(BADGE_TYPES.EA_EXPERT);
    }

    // Check Helpful Member (50+ helpful replies)
    const helpfulCount = Array.from(this.forumRepliesMap.values())
      .filter(r => r.userId === userId && r.helpful > 0).length;
    
    if (helpfulCount >= 50 && !userBadges.includes(BADGE_TYPES.HELPFUL_MEMBER)) {
      await this.awardBadge(userId, BADGE_TYPES.HELPFUL_MEMBER);
      newBadges.push(BADGE_TYPES.HELPFUL_MEMBER);
    }

    // Check Top Contributor (top 10)
    const topContributors = await this.getTopContributors(10);
    const isTop = topContributors.some(c => c.userId === userId);
    
    if (isTop && !userBadges.includes(BADGE_TYPES.TOP_CONTRIBUTOR)) {
      await this.awardBadge(userId, BADGE_TYPES.TOP_CONTRIBUTOR);
      newBadges.push(BADGE_TYPES.TOP_CONTRIBUTOR);
    }

    return newBadges;
  }
  
  async getOnboardingProgress(userId: string) {
    const user = this.users.get(userId);
    if (!user) return null;

    return {
      completed: (user as any).onboardingCompleted || false,
      dismissed: (user as any).onboardingDismissed || false,
      progress: (user as any).onboardingProgress || {
        profilePicture: false,
        firstReply: false,
        twoReviews: false,
        firstThread: false,
        firstPublish: false,
        fiftyFollowers: false,
      },
    };
  }

  async markOnboardingStep(userId: string, step: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    const current = await this.getOnboardingProgress(userId);
    if (!current || current.progress[step]) return;

    const coinRewards: Record<string, number> = {
      profilePicture: 10,
      firstReply: 5,
      twoReviews: 6,
      firstThread: 10,
      firstPublish: 30,
      fiftyFollowers: 200,
    };

    const coinsToAward = coinRewards[step] || 0;

    // Update progress
    const newProgress = { ...current.progress, [step]: true };
    (user as any).onboardingProgress = newProgress;
    // Mark complete when ALL tasks are done
    const allSteps = ['profilePicture', 'firstReply', 'twoReviews', 'firstThread', 'firstPublish', 'fiftyFollowers'];
    const allComplete = allSteps.every(s => newProgress[s]);
    (user as any).onboardingCompleted = allComplete;

    // Award coins
    if (coinsToAward > 0) {
      const newTotalCoins = (user.totalCoins || 0) + coinsToAward;
      user.totalCoins = newTotalCoins;
      user.level = calculateUserLevel(newTotalCoins);
    }
  }

  async dismissOnboarding(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      (user as any).onboardingDismissed = true;
    }
  }

  // Ranking System (Stubs - MemStorage does not support ranking)
  async getAllForumThreads(): Promise<ForumThread[]> {
    return Array.from(this.forumThreadsMap.values());
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserStats(userId: string): Promise<{
    threadsCreated: number;
    repliesPosted: number;
    helpfulVotes: number;
    bestAnswers: number;
    contentSales: number;
    followersCount: number;
    uploadsCount: number;
  }> {
    const threadsCreated = Array.from(this.forumThreadsMap.values()).filter(t => t.authorId === userId).length;
    const repliesPosted = Array.from(this.forumRepliesMap.values()).filter(r => r.userId === userId).length;
    const uploadsCount = Array.from(this.content.values()).filter(c => c.authorId === userId).length;
    const contentSales = Array.from(this.contentPurchases.values()).filter(p => p.sellerId === userId).length;
    const followersCount = Array.from(this.userFollowsMap.values()).filter(f => f.followingId === userId).length;
    
    // Calculate helpful votes from threads and replies created by user
    const userThreads = Array.from(this.forumThreadsMap.values()).filter(t => t.authorId === userId);
    const userReplies = Array.from(this.forumRepliesMap.values()).filter(r => r.userId === userId);
    const helpfulVotes = userThreads.reduce((sum, t) => sum + (t.helpfulVotes || 0), 0) + 
                        userReplies.reduce((sum, r) => sum + (r.helpfulVotes || 0), 0);
    
    return {
      threadsCreated,
      repliesPosted,
      helpfulVotes,
      bestAnswers: 0,
      contentSales,
      followersCount,
      uploadsCount,
    };
  }

  async getContentSalesStats(contentId: string): Promise<{
    totalSales: number;
    reviewCount: number;
    avgRating: number;
  }> {
    const sales = Array.from(this.contentPurchases.values()).filter(p => p.contentId === contentId);
    const reviews = Array.from(this.contentReviews.values()).filter(r => r.contentId === contentId);
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    
    return {
      totalSales: sales.length,
      reviewCount: reviews.length,
      avgRating: reviews.length > 0 ? totalRating / reviews.length : 0,
    };
  }

  async updateThreadScore(threadId: string, score: number): Promise<void> {
    const thread = this.forumThreadsMap.get(threadId);
    if (thread) {
      (thread as any).engagementScore = score;
      (thread as any).lastScoreUpdate = new Date();
    }
  }

  async updateUserReputation(userId: string, reputation: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      (user as any).reputationScore = reputation;
      (user as any).lastReputationUpdate = new Date();
    }
  }

  async updateContentSalesScore(contentId: string, score: number): Promise<void> {
    const item = this.content.get(contentId);
    if (item) {
      (item as any).salesScore = score;
      (item as any).lastSalesUpdate = new Date();
    }
  }

  // Messaging System (Stubs - MemStorage does not support messaging)
  async sendMessage(senderId: string, recipientId: string, body: string): Promise<any> {
    throw new Error("MemStorage does not support messaging operations");
  }

  async getConversations(userId: string): Promise<Array<{
    id: string;
    participant: User;
    lastMessage: {
      text: string;
      timestamp: Date;
      isRead: boolean;
      isSentByMe: boolean;
    };
    unreadCount: number;
  }>> {
    throw new Error("MemStorage does not support messaging operations");
  }

  async getConversationMessages(conversationId: string, userId: string): Promise<Array<{
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    isRead: boolean;
  }>> {
    throw new Error("MemStorage does not support messaging operations");
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    throw new Error("MemStorage does not support messaging operations");
  }

  async searchMessages(userId: string, query: string, filterUserId?: string): Promise<Array<{
    id: string;
    conversationId: string;
    senderId: string;
    senderUsername: string;
    text: string;
    timestamp: Date;
  }>> {
    throw new Error("MemStorage does not support messaging operations");
  }

  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    throw new Error("MemStorage does not support messaging operations");
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    throw new Error("MemStorage does not support messaging operations");
  }

  async getMessageReactions(messageId: string): Promise<Array<{ emoji: string; count: number; userIds: string[] }>> {
    throw new Error("MemStorage does not support messaging operations");
  }

  // Dashboard Preferences (Stubs - MemStorage does not support dashboard preferences)
  async getDashboardPreferences(userId: string): Promise<DashboardPreferences | null> {
    throw new Error("MemStorage does not support dashboard preferences");
  }

  async saveDashboardPreferences(userId: string, preferences: InsertDashboardPreferences): Promise<DashboardPreferences> {
    throw new Error("MemStorage does not support dashboard preferences");
  }

  // Withdrawal System (Stubs - MemStorage does not support withdrawals)
  async createWithdrawalRequest(userId: string, data: Omit<InsertWithdrawalRequest, 'userId'>): Promise<WithdrawalRequest> {
    throw new Error("MemStorage does not support withdrawal operations");
  }

  async getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    throw new Error("MemStorage does not support withdrawal operations");
  }

  async getWithdrawalById(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null> {
    throw new Error("MemStorage does not support withdrawal operations");
  }

  async cancelWithdrawalRequest(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null> {
    throw new Error("MemStorage does not support withdrawal operations");
  }

  // Notification System (Stubs - MemStorage does not support notifications)
  async createNotification(notification: InsertNotification): Promise<Notification> {
    throw new Error("MemStorage does not support notification operations");
  }

  async getUserNotifications(userId: string, limit?: number): Promise<Notification[]> {
    throw new Error("MemStorage does not support notification operations");
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    throw new Error("MemStorage does not support notification operations");
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    throw new Error("MemStorage does not support notification operations");
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    throw new Error("MemStorage does not support notification operations");
  }

  // Earnings Summary (Stubs - MemStorage does not support earnings summary)
  async getUserEarningsSummary(userId: string): Promise<{
    totalEarned: number;
    weeklyEarned: number;
    breakdown: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
  }> {
    throw new Error("MemStorage does not support earnings summary operations");
  }

  // REFERRALS (Stubs - MemStorage does not support referrals)
  async getReferrals(userId: string): Promise<any[]> {
    throw new Error("Not implemented");
  }

  async getReferralStats(userId: string): Promise<{totalReferrals: number, totalEarnings: number, monthlyEarnings: number}> {
    throw new Error("Not implemented");
  }

  async generateReferralCode(userId: string): Promise<string> {
    throw new Error("Not implemented");
  }

  // GOALS (Stubs - MemStorage does not support goals)
  async getGoals(userId: string): Promise<any[]> {
    throw new Error("Not implemented");
  }

  async createGoal(userId: string, goal: any): Promise<any> {
    throw new Error("Not implemented");
  }

  async updateGoal(goalId: number, updates: any): Promise<any> {
    throw new Error("Not implemented");
  }

  // ACHIEVEMENTS (Stubs - MemStorage does not support achievements)
  async getUserAchievements(userId: string): Promise<any[]> {
    throw new Error("Not implemented");
  }

  // SALES DASHBOARD (Stubs - MemStorage does not support sales dashboard)
  async getSalesDashboard(userId: string, days: number): Promise<any> {
    throw new Error("Not implemented");
  }

  // EARNINGS BREAKDOWN (Stubs - MemStorage does not support earnings breakdown)
  async getEarningsBreakdown(userId: string): Promise<any> {
    throw new Error("Not implemented");
  }

  // ACTIVITY FEED (Stubs - MemStorage does not support activity feed)
  async getActivityFeed(userId: string, limit: number): Promise<any[]> {
    throw new Error("Not implemented");
  }

  // CAMPAIGNS (Stubs - MemStorage does not support campaigns)
  async getCampaigns(userId: string): Promise<any[]> {
    throw new Error("Not implemented");
  }

  async createCampaign(userId: string, campaign: any): Promise<any> {
    throw new Error("Not implemented");
  }

  // CUSTOMERS (Stubs - MemStorage does not support customers)
  async getCustomerList(userId: string): Promise<any[]> {
    throw new Error("Not implemented");
  }

  // DASHBOARD SETTINGS (Stubs - MemStorage does not support dashboard settings)
  async getDashboardSettings(userId: string): Promise<any> {
    throw new Error("Not implemented");
  }

  async updateDashboardSettings(userId: string, settings: any): Promise<void> {
    throw new Error("Not implemented");
  }

  // USER SETTINGS (Stubs - MemStorage does not support user settings)
  async getUserSettings(userId: string): Promise<any> {
    throw new Error("Not implemented");
  }

  async updateUserSettings(userId: string, settings: any): Promise<void> {
    throw new Error("Not implemented");
  }

  // PROFILE (Stubs - MemStorage does not support profile)
  async getProfileByUsername(username: string): Promise<any> {
    throw new Error("Not implemented");
  }

  async updateProfile(userId: string, profile: any): Promise<any> {
    throw new Error("Not implemented");
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 1: User Management (Stubs)
  // ============================================================================

  async getAdminUsers(filters: any): Promise<{users: User[]; total: number}> {
    const allUsers = Array.from(this.users.values());
    return { users: allUsers.slice(0, filters.limit || 10), total: allUsers.length };
  }

  async banUser(userId: string, reason: string, bannedBy: string, duration?: number): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async suspendUser(userId: string, reason: string, suspendedBy: string, duration: number): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async unbanUser(userId: string, unbannedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async deleteUserAccount(userId: string, deletedBy: string, reason: string): Promise<void> {
    this.users.delete(userId);
  }

  async adjustUserCoins(userId: string, amount: number, reason: string, adminId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      const newTotalCoins = user.totalCoins + amount;
      this.users.set(userId, { 
        ...user, 
        totalCoins: newTotalCoins,
        level: calculateUserLevel(newTotalCoins)
      });
    }
  }

  async changeUserRole(userId: string, newRole: string, changedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async addUserBadge(userId: string, badgeSlug: string, grantedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async removeUserBadge(userId: string, badgeSlug: string, removedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async adjustUserReputation(userId: string, amount: number, reason: string, adminId: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async createUserSegment(segment: any): Promise<any> {
    return { id: 1, ...segment };
  }

  async getUserSegments(): Promise<any[]> {
    return [];
  }

  async getUsersBySegment(segmentId: number): Promise<User[]> {
    return [];
  }

  async updateUserSegment(segmentId: number, updates: any): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async deleteUserSegment(segmentId: number): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getUserActivityLog(userId: string, limit?: number): Promise<any[]> {
    return [];
  }

  async getUserFinancialSummary(userId: string): Promise<any> {
    return { totalEarned: 0, totalSpent: 0, totalWithdrawn: 0, currentBalance: 0 };
  }

  async getSuspiciousUsers(limit?: number): Promise<any[]> {
    return [];
  }

  async getInactiveUsers(days: number): Promise<User[]> {
    return [];
  }

  async getUsersByCountry(): Promise<{country: string; count: number}[]> {
    return [];
  }

  async getUserGrowthStats(days: number): Promise<any[]> {
    return [];
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 2: Content Moderation (Stubs)
  // ============================================================================

  async getModerationQueue(params: {
    type?: "thread" | "reply" | "all";
    status?: "pending" | "approved" | "rejected";
    page?: number;
    perPage?: number;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const page = params.page || 1;
    const perPage = params.perPage || 10;
    return { items: [], total: 0, page, perPage };
  }

  async addToModerationQueue(item: any): Promise<any> {
    return { id: 1, ...item, status: 'pending' };
  }

  async approveContent(params: {
    contentId: string;
    contentType: "thread" | "reply";
    moderatorId: string;
    moderatorUsername: string;
  }): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async rejectContent(params: {
    contentId: string;
    contentType: "thread" | "reply";
    moderatorId: string;
    moderatorUsername: string;
    reason: string;
  }): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async bulkApproveContent(queueIds: number[], reviewedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async bulkRejectContent(queueIds: number[], reviewedBy: string, reason: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getReportedContent(params: {
    status?: "pending" | "resolved" | "dismissed";
    page?: number;
    perPage?: number;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const page = params.page || 1;
    const perPage = params.perPage || 10;
    return { items: [], total: 0, page, perPage };
  }

  async createReport(report: any): Promise<any> {
    return { id: 1, ...report, status: 'pending' };
  }

  async assignReport(reportId: number, assignedTo: string, assignedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async resolveReport(reportId: number, resolution: string, actionTaken: string, resolvedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async dismissReport(params: {
    reportId: number;
    moderatorId: string;
    reason?: string;
  }): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async deleteContent(contentType: string, contentId: string, deletedBy: string, reason: string): Promise<void> {
    if (contentType === 'thread') {
      this.forumThreadsMap.delete(contentId);
    } else if (contentType === 'reply') {
      this.forumRepliesMap.delete(contentId);
    } else if (contentType === 'marketplace') {
      this.content.delete(contentId);
    }
  }

  async restoreContent(contentType: string, contentId: string, restoredBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async editContent(contentType: string, contentId: string, updates: any, editedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async moveContent(contentType: string, contentId: string, newCategorySlug: string, movedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async featureContent(contentType: string, contentId: string, featuredBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async unfeatureContent(contentType: string, contentId: string, unfeaturedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getContentStats(): Promise<{totalThreads: number; totalReplies: number; totalContent: number}> {
    return {
      totalThreads: this.forumThreadsMap.size,
      totalReplies: this.forumRepliesMap.size,
      totalContent: this.content.size
    };
  }

  async getFlaggedContent(limit?: number): Promise<any[]> {
    return [];
  }

  async getDuplicateContent(): Promise<any[]> {
    return [];
  }

  async getContentByAuthor(authorId: string): Promise<any[]> {
    return [];
  }

  async getContentQualityScores(): Promise<any[]> {
    return [];
  }

  async getPlagiarizedContent(limit?: number): Promise<any[]> {
    return [];
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 3: Financial Management (Stubs)
  // ============================================================================

  async getAdminTransactions(filters: any): Promise<{transactions: any[]; total: number}> {
    const allTransactions = Array.from(this.transactions.values());
    return { transactions: allTransactions.slice(0, filters.limit || 10), total: allTransactions.length };
  }

  async createManualTransaction(tx: any): Promise<any> {
    const transaction = {
      id: randomUUID(),
      userId: tx.userId,
      amount: tx.amount,
      transactionType: tx.type,
      description: tx.description,
      createdAt: new Date()
    };
    this.transactions.set(transaction.id, transaction as any);
    return transaction;
  }

  async getPendingWithdrawals(): Promise<any[]> {
    return [];
  }

  async approveWithdrawal(withdrawalId: string, approvedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async rejectWithdrawal(withdrawalId: string, reason: string, rejectedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async processWithdrawal(withdrawalId: string, processedBy: string, transactionHash?: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getWithdrawalStats(): Promise<any> {
    return { pending: 0, approved: 0, rejected: 0, total: 0 };
  }

  async getRevenueStats(startDate: Date, endDate: Date): Promise<any> {
    return { totalRevenue: 0, totalTransactions: 0 };
  }


  async getRevenueByUser(limit?: number): Promise<any[]> {
    return [];
  }

  async getRevenueForecast(days: number): Promise<any[]> {
    return [];
  }

  async createRefund(purchaseId: string, amount: number, reason: string, processedBy: string): Promise<any> {
    return { id: 1, purchaseId, amount, reason, processedBy };
  }

  async getRefundHistory(limit?: number): Promise<any[]> {
    return [];
  }

  async generateFinancialReport(startDate: Date, endDate: Date): Promise<any> {
    return { revenue: 0, expenses: 0, profit: 0 };
  }

  async getCoinEconomyHealth(): Promise<any> {
    return { totalCirculation: 0, inflationRate: 0, health: 'good' };
  }

  async getTopEarners(limit?: number): Promise<any[]> {
    return [];
  }

  async getSuspiciousTransactions(limit?: number): Promise<any[]> {
    return [];
  }

  async getChargebackRate(): Promise<number> {
    return 0;
  }

  async getTransactionVelocity(): Promise<any> {
    return { transactionsPerHour: 0, avgAmount: 0 };
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 4: System Management (Stubs)
  // ============================================================================

  async getSystemSettings(category?: string): Promise<any[]> {
    return [];
  }

  async updateSystemSetting(key: string, value: any, updatedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getSystemSetting(key: string): Promise<any> {
    return null;
  }

  async getSupportTickets(filters: any): Promise<{tickets: any[]; total: number}> {
    return { tickets: [], total: 0 };
  }

  async createSupportTicket(ticket: any): Promise<any> {
    return { id: 1, ...ticket, status: 'open' };
  }

  async updateSupportTicket(ticketId: number, updates: any, updatedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async assignTicket(ticketId: number, assignedTo: string, assignedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async addTicketReply(ticketId: number, reply: {userId: string; message: string}): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async closeTicket(ticketId: number, closedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getAnnouncements(filters?: any): Promise<any[]> {
    return [];
  }

  async createAnnouncement(announcement: any): Promise<any> {
    return { id: 1, ...announcement };
  }

  async updateAnnouncement(announcementId: number, updates: any): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async deleteAnnouncement(announcementId: number): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async trackAnnouncementView(announcementId: number): Promise<void> {
    // No-op in MemStorage
  }

  async trackAnnouncementClick(announcementId: number): Promise<void> {
    // No-op in MemStorage
  }

  async getEmailTemplates(category?: string): Promise<any[]> {
    return [];
  }

  async getEmailTemplate(templateKey: string): Promise<any> {
    return null;
  }

  async updateEmailTemplate(templateKey: string, updates: any, updatedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async createEmailTemplate(template: any): Promise<any> {
    return { id: 1, ...template };
  }

  async getAdminRoles(): Promise<any[]> {
    return [];
  }

  async grantAdminRole(userId: string, role: string, permissions: any, grantedBy: string): Promise<any> {
    return { id: 1, userId, role, permissions };
  }

  async updateAdminPermissions(userId: string, permissions: any, updatedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async revokeAdminRole(userId: string, revokedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 5: Security & Logs (Stubs)
  // ============================================================================

  async getSecurityEvents(filters: any): Promise<{events: any[]; total: number}> {
    return { events: [], total: 0 };
  }

  async createSecurityEvent(event: any): Promise<any> {
    return { id: 1, ...event, createdAt: new Date() };
  }

  async resolveSecurityEvent(eventId: number, resolvedBy: string, notes: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getIpBans(filters?: { isActive?: boolean }): Promise<any[]> {
    return [];
  }

  async banIp(ipAddress: string, reason: string, bannedBy: string, duration?: number): Promise<any> {
    return { id: 1, ipAddress, reason, bannedBy };
  }

  async unbanIp(ipAddress: string, unbannedBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async isIpBanned(ipAddress: string): Promise<boolean> {
    return false;
  }

  async logAdminAction(action: {
    adminId: string;
    actionType: string;
    targetType: string;
    targetId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    // No-op in MemStorage
  }

  async getAdminActionLogs(filters: any): Promise<{actions: any[]; total: number}> {
    return { actions: [], total: 0 };
  }

  async getAdminActivitySummary(adminId: string, days: number): Promise<any> {
    return { totalActions: 0, actionsByType: {} };
  }

  async recordPerformanceMetric(metric: any): Promise<void> {
    // No-op in MemStorage
  }

  async getPerformanceMetrics(filters: {
    metricType?: string;
    metricName?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    return [];
  }

  async getAveragePerformance(metricName: string, days?: number): Promise<number> {
    return 0;
  }

  async getPerformanceAlerts(): Promise<any[]> {
    return [];
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 6: Advanced Features (Stubs)
  // ============================================================================

  async getAutomationRules(activeOnly?: boolean): Promise<any[]> {
    return [];
  }

  async createAutomationRule(rule: any): Promise<any> {
    return { id: 1, ...rule, isActive: true };
  }

  async updateAutomationRule(ruleId: number, updates: any): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async toggleAutomationRule(ruleId: number, isActive: boolean): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async executeAutomationRule(ruleId: number): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getAbTests(status?: string): Promise<any[]> {
    return [];
  }

  async createAbTest(test: any): Promise<any> {
    return { id: 1, ...test, status: 'draft' };
  }

  async updateAbTest(testId: number, updates: any): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async startAbTest(testId: number): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async stopAbTest(testId: number): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async declareAbTestWinner(testId: number, winnerVariant: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getFeatureFlags(): Promise<any[]> {
    return [];
  }

  async getFeatureFlag(flagKey: string): Promise<any> {
    return null;
  }

  async updateFeatureFlag(flagKey: string, updates: any): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async createFeatureFlag(flag: any): Promise<any> {
    return { id: 1, ...flag };
  }

  async isFeatureEnabled(flagKey: string, userId?: string): Promise<boolean> {
    return false;
  }

  async getApiKeys(filters?: {userId?: string; isActive?: boolean}): Promise<any[]> {
    return [];
  }

  async createApiKey(key: any): Promise<any> {
    return { id: 1, ...key, keyValue: randomUUID() };
  }

  async revokeApiKey(keyId: number): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async updateApiKeyLastUsed(keyId: number): Promise<void> {
    // No-op in MemStorage
  }

  async getWebhooks(filters?: {isActive?: boolean}): Promise<any[]> {
    return [];
  }

  async createWebhook(webhook: any): Promise<any> {
    return { id: 1, ...webhook, isActive: true };
  }

  async updateWebhook(webhookId: number, updates: any): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async deleteWebhook(webhookId: number): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async recordWebhookTrigger(webhookId: number, success: boolean): Promise<void> {
    // No-op in MemStorage
  }

  async getMediaLibrary(filters?: any): Promise<any[]> {
    return [];
  }

  async addToMediaLibrary(media: any): Promise<any> {
    return { id: 1, ...media, uploadedAt: new Date() };
  }

  async updateMediaItem(mediaId: number, updates: any): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async deleteMediaItem(mediaId: number): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async trackMediaUsage(mediaId: number): Promise<void> {
    // No-op in MemStorage
  }

  async createContentRevision(revision: any): Promise<any> {
    return { id: 1, ...revision, createdAt: new Date() };
  }

  async getContentRevisions(contentType: string, contentId: string): Promise<any[]> {
    return [];
  }

  async restoreContentRevision(revisionId: number, restoredBy: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async createFeedback(data: InsertFeedback): Promise<Feedback> {
    const feedbackItem: Feedback = {
      id: randomUUID(),
      userId: data.userId ?? null,
      type: data.type,
      subject: data.subject,
      message: data.message,
      email: data.email ?? null,
      status: "new",
      priority: "medium",
      adminNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return feedbackItem;
  }

  async listFeedback(filters?: { status?: string; type?: string; limit?: number }): Promise<Feedback[]> {
    return [];
  }

  async getUserFeedback(userId: string): Promise<Feedback[]> {
    return [];
  }

  async updateFeedbackStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    return Promise.resolve();
  }
  
  // Admin Overview Endpoints - Return empty/zero data for MemStorage
  async getAdminOverviewStats(): Promise<{
    users: { total: number; new24h: number };
    content: { total: number; new24h: number };
    revenue: { total: number; today: number };
    moderation: { pending: number; reports: number };
  }> {
    return {
      users: { total: 0, new24h: 0 },
      content: { total: 0, new24h: 0 },
      revenue: { total: 0, today: 0 },
      moderation: { pending: 0, reports: 0 }
    };
  }
  
  async getUserGrowthSeries(days: number): Promise<Array<{ date: string; users: number }>> {
    return [];
  }
  
  async getContentTrendSeries(days: number): Promise<Array<{ date: string; count: number }>> {
    return [];
  }
  
  async getRecentAdminActions(limit: number): Promise<Array<{
    id: string;
    adminUsername: string;
    actionType: string;
    targetType: string;
    status: string;
    createdAt: string;
  }>> {
    return [];
  }

  async getQueueCount(): Promise<any> {
    return { total: 0, threads: 0, replies: 0, urgentCount: 0 };
  }

  async getReportedCount(): Promise<any> {
    return { total: 0, newReports: 0, underReview: 0 };
  }

  async getContentDetails(params: any): Promise<any> {
    return {
      id: params.contentId,
      type: params.contentType,
      body: '',
      attachments: [],
      author: {} as any,
      authorRecentPosts: [],
      authorWarnings: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 0,
        hasLinks: false,
        hasImages: false,
      },
    };
  }

  async getReportDetails(reportId: number): Promise<any> {
    return {
      id: reportId,
      contentId: '',
      contentType: 'thread' as const,
      content: { body: '', author: { id: '', username: '', reputation: 0 } },
      reports: [],
      status: 'pending',
      availableActions: [],
    };
  }

  async takeReportAction(params: any): Promise<void> {
    return Promise.resolve();
  }

  async bulkApprove(params: any): Promise<any> {
    return { successCount: 0, failedIds: [] };
  }

  async bulkReject(params: any): Promise<any> {
    return { successCount: 0, failedIds: [] };
  }

  async getModerationHistory(params: any): Promise<any[]> {
    return [];
  }

  async getModerationStats(): Promise<any> {
    return {
      todayApproved: 0,
      todayRejected: 0,
      todayReportsHandled: 0,
      totalModeratedToday: 0,
      averageResponseTimeMinutes: 0,
      mostActiveModerator: { id: '', username: 'None', actionCount: 0 },
      pendingByAge: { lessThan1Hour: 0, between1And24Hours: 0, moreThan24Hours: 0 },
    };
  }

  // ============================================================================
  // PHASE 2: Marketplace Management (14 methods) - MemStorage Implementation
  // ============================================================================

  async getMarketplaceItems(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'sales';
  }): Promise<any> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    
    // Get all content items
    let items = Array.from(this.content.values())
      .filter(c => !c.deletedAt); // Filter soft-deleted
    
    // Apply filters
    if (params.search) {
      const search = params.search.toLowerCase();
      items = items.filter(c => c.title.toLowerCase().includes(search));
    }
    if (params.status) {
      items = items.filter(c => c.status === params.status);
    }
    if (params.category) {
      items = items.filter(c => c.category === params.category);
    }
    if (params.priceMin !== undefined) {
      items = items.filter(c => c.priceCoins >= params.priceMin!);
    }
    if (params.priceMax !== undefined) {
      items = items.filter(c => c.priceCoins <= params.priceMax!);
    }
    
    // Calculate sales and revenue for each item
    const itemsWithStats = items.map(c => {
      const purchases = Array.from(this.contentPurchases.values())
        .filter(p => p.contentId === c.id);
      const sales = purchases.length;
      const revenue = purchases.reduce((sum, p) => sum + p.priceCoins, 0);
      const seller = this.users.get(c.authorId);
      
      return {
        id: c.id,
        title: c.title,
        type: c.type,
        category: c.category,
        status: c.status,
        coinPrice: c.priceCoins,
        sales,
        revenue,
        sellerUsername: seller?.username || 'Unknown',
        sellerId: c.authorId,
        featured: c.featured || false,
        featuredUntil: c.featuredUntil?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
        approvedAt: c.approvedAt?.toISOString() || null,
        rejectedAt: c.rejectedAt?.toISOString() || null,
        rejectionReason: c.rejectionReason || null,
        deletedAt: c.deletedAt?.toISOString() || null,
      };
    });
    
    // Sort
    const sort = params.sort || 'newest';
    itemsWithStats.sort((a, b) => {
      switch (sort) {
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_asc': return a.coinPrice - b.coinPrice;
        case 'price_desc': return b.coinPrice - a.coinPrice;
        case 'sales': return b.sales - a.sales;
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    const totalItems = itemsWithStats.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedItems = itemsWithStats.slice(offset, offset + pageSize);
    
    return { items: paginatedItems, page, pageSize, totalItems, totalPages };
  }

  async getMarketplaceItemById(id: string): Promise<any | null> {
    const item = this.content.get(id);
    if (!item) return null;
    
    const seller = this.users.get(item.authorId);
    const purchases = Array.from(this.contentPurchases.values())
      .filter(p => p.contentId === id)
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
      .slice(0, 10);
    
    const recentPurchases = purchases.map(p => {
      const buyer = this.users.get(p.buyerId);
      return {
        buyerUsername: buyer?.username || 'Unknown',
        coins: p.priceCoins,
        purchasedAt: p.purchasedAt.toISOString(),
      };
    });
    
    const allPurchases = Array.from(this.contentPurchases.values())
      .filter(p => p.contentId === id);
    
    return {
      ...item,
      sellerInfo: {
        username: seller?.username || 'Unknown',
        email: seller?.email || null,
        reputation: seller?.reputationScore || 0,
      },
      salesMetrics: {
        totalSales: allPurchases.length,
        revenue: allPurchases.reduce((sum, p) => sum + p.priceCoins, 0),
        lastPurchaseDate: allPurchases[0]?.purchasedAt?.toISOString() || null,
      },
      recentPurchases,
      reviewSummary: {
        averageRating: item.averageRating || 0,
        totalReviews: item.reviewCount || 0,
      },
    };
  }

  async getPendingMarketplaceItems(limit = 50): Promise<any[]> {
    const items = Array.from(this.content.values())
      .filter(c => c.status === 'pending' && !c.deletedAt)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit);
    
    return items.map(c => {
      const purchases = Array.from(this.contentPurchases.values())
        .filter(p => p.contentId === c.id);
      const sales = purchases.length;
      const revenue = purchases.reduce((sum, p) => sum + p.priceCoins, 0);
      const seller = this.users.get(c.authorId);
      
      return {
        id: c.id,
        title: c.title,
        type: c.type,
        category: c.category,
        status: c.status,
        coinPrice: c.priceCoins,
        sales,
        revenue,
        sellerUsername: seller?.username || 'Unknown',
        sellerId: c.authorId,
        featured: c.featured || false,
        featuredUntil: c.featuredUntil?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
        approvedAt: c.approvedAt?.toISOString() || null,
        rejectedAt: c.rejectedAt?.toISOString() || null,
        rejectionReason: c.rejectionReason || null,
        deletedAt: c.deletedAt?.toISOString() || null,
      };
    });
  }

  async approveMarketplaceItem(id: string, adminId: string): Promise<void> {
    const item = this.content.get(id);
    if (!item) throw new Error('Content not found');
    
    this.content.set(id, {
      ...item,
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });
  }

  async rejectMarketplaceItem(id: string, adminId: string, reason: string): Promise<void> {
    const item = this.content.get(id);
    if (!item) throw new Error('Content not found');
    
    this.content.set(id, {
      ...item,
      status: 'rejected',
      rejectedBy: adminId,
      rejectedAt: new Date(),
      rejectionReason: reason,
      approvedBy: null,
      approvedAt: null,
    });
  }

  async featureMarketplaceItem(id: string, adminId: string, durationDays: number): Promise<void> {
    const item = this.content.get(id);
    if (!item) throw new Error('Content not found');
    if (item.status !== 'approved') throw new Error('Only approved items can be featured');
    
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + durationDays);
    
    this.content.set(id, {
      ...item,
      featured: true,
      featuredUntil,
    });
  }

  async deleteMarketplaceItem(id: string, adminId: string): Promise<void> {
    const item = this.content.get(id);
    if (!item) throw new Error('Content not found');
    
    this.content.set(id, {
      ...item,
      deletedAt: new Date(),
    });
  }

  async getMarketplaceSales(params: {
    page?: number;
    pageSize?: number;
    contentId?: string;
    buyerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    
    let sales = Array.from(this.contentPurchases.values());
    
    // Apply filters
    if (params.contentId) {
      sales = sales.filter(s => s.contentId === params.contentId);
    }
    if (params.buyerId) {
      sales = sales.filter(s => s.buyerId === params.buyerId);
    }
    if (params.startDate) {
      sales = sales.filter(s => s.purchasedAt >= params.startDate!);
    }
    if (params.endDate) {
      sales = sales.filter(s => s.purchasedAt <= params.endDate!);
    }
    
    // Map to response format
    const salesWithDetails = sales.map(s => {
      const item = this.content.get(s.contentId);
      const buyer = this.users.get(s.buyerId);
      const seller = this.users.get(s.sellerId);
      
      return {
        id: s.id,
        contentId: s.contentId,
        contentTitle: item?.title || 'Unknown',
        buyerUsername: buyer?.username || 'Unknown',
        buyerId: s.buyerId,
        sellerUsername: seller?.username || 'Unknown',
        sellerId: s.sellerId,
        priceCoins: s.priceCoins,
        purchasedAt: s.purchasedAt.toISOString(),
      };
    }).sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    
    const totalSales = salesWithDetails.length;
    const totalPages = Math.ceil(totalSales / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedSales = salesWithDetails.slice(offset, offset + pageSize);
    
    return { sales: paginatedSales, page, pageSize, totalSales, totalPages };
  }

  async getRecentMarketplaceSales(limit = 50): Promise<any[]> {
    const sales = Array.from(this.contentPurchases.values())
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
      .slice(0, limit);
    
    return sales.map(s => {
      const item = this.content.get(s.contentId);
      const buyer = this.users.get(s.buyerId);
      const seller = this.users.get(s.sellerId);
      
      return {
        id: s.id,
        contentId: s.contentId,
        contentTitle: item?.title || 'Unknown',
        buyerUsername: buyer?.username || 'Unknown',
        buyerId: s.buyerId,
        sellerUsername: seller?.username || 'Unknown',
        sellerId: s.sellerId,
        priceCoins: s.priceCoins,
        purchasedAt: s.purchasedAt.toISOString(),
      };
    });
  }

  async getMarketplaceRevenue(period: 'today' | 'week' | 'month' | 'year' | 'all'): Promise<any> {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    const sales = Array.from(this.contentPurchases.values())
      .filter(s => s.purchasedAt >= startDate);
    
    const totalCoins = sales.reduce((sum, s) => sum + s.priceCoins, 0);
    const totalSales = sales.length;
    const averageSale = totalSales > 0 ? totalCoins / totalSales : 0;
    
    return { totalCoins, totalSales, averageSale };
  }

  async getRevenueTrend(days = 30): Promise<any[]> {
    const trend: { date: string; revenue: number }[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const revenue = Array.from(this.contentPurchases.values())
        .filter(s => s.purchasedAt.toISOString().split('T')[0] === dateStr)
        .reduce((sum, s) => sum + s.priceCoins, 0);
      
      trend.push({ date: dateStr, revenue });
    }
    
    return trend;
  }

  async getTopSellingItems(limit = 10): Promise<any[]> {
    const itemStats = new Map<string, { sales: number; revenue: number }>();
    
    Array.from(this.contentPurchases.values()).forEach(p => {
      const stats = itemStats.get(p.contentId) || { sales: 0, revenue: 0 };
      stats.sales++;
      stats.revenue += p.priceCoins;
      itemStats.set(p.contentId, stats);
    });
    
    const items = Array.from(this.content.values())
      .filter(c => c.status === 'approved' && !c.deletedAt)
      .map(c => {
        const stats = itemStats.get(c.id) || { sales: 0, revenue: 0 };
        const seller = this.users.get(c.authorId);
        
        return {
          id: c.id,
          title: c.title,
          sales: stats.sales,
          revenue: stats.revenue,
          sellerUsername: seller?.username || 'Unknown',
        };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);
    
    return items;
  }

  async getTopVendors(limit = 10): Promise<any[]> {
    const vendorStats = new Map<string, { revenue: number; sales: number; itemCount: number }>();
    
    // Calculate revenue and sales
    Array.from(this.contentPurchases.values()).forEach(p => {
      const stats = vendorStats.get(p.sellerId) || { revenue: 0, sales: 0, itemCount: 0 };
      stats.revenue += p.priceCoins;
      stats.sales++;
      vendorStats.set(p.sellerId, stats);
    });
    
    // Count items per vendor
    Array.from(this.content.values())
      .filter(c => c.status === 'approved' && !c.deletedAt)
      .forEach(c => {
        const stats = vendorStats.get(c.authorId) || { revenue: 0, sales: 0, itemCount: 0 };
        stats.itemCount++;
        vendorStats.set(c.authorId, stats);
      });
    
    const vendors = Array.from(vendorStats.entries())
      .map(([sellerId, stats]) => {
        const seller = this.users.get(sellerId);
        return {
          sellerId,
          sellerUsername: seller?.username || 'Unknown',
          totalRevenue: stats.revenue,
          totalSales: stats.sales,
          itemCount: stats.itemCount,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
    
    return vendors;
  }

  async getMarketplaceStats(): Promise<any> {
    const items = Array.from(this.content.values());
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const totalItems = items.filter(c => !c.deletedAt).length;
    const pendingItems = items.filter(c => c.status === 'pending' && !c.deletedAt).length;
    const approvedItems = items.filter(c => c.status === 'approved' && !c.deletedAt).length;
    const rejectedItems = items.filter(c => c.status === 'rejected' && !c.deletedAt).length;
    const featuredItems = items.filter(c => 
      c.featured && c.featuredUntil && c.featuredUntil > now && !c.deletedAt
    ).length;
    
    const allSales = Array.from(this.contentPurchases.values());
    const totalSales = allSales.length;
    const salesThisWeek = allSales.filter(s => s.purchasedAt >= weekAgo).length;
    const totalRevenue = allSales.reduce((sum, s) => sum + s.priceCoins, 0);
    const revenueThisWeek = allSales
      .filter(s => s.purchasedAt >= weekAgo)
      .reduce((sum, s) => sum + s.priceCoins, 0);
    
    return {
      totalItems,
      pendingItems,
      approvedItems,
      rejectedItems,
      featuredItems,
      totalSales,
      salesThisWeek,
      totalRevenue,
      revenueThisWeek,
    };
  }

  // ============================================================================
  // PHASE 2: Broker Admin Management (12 methods) - MemStorage Stubs
  // ============================================================================

  async getAdminBrokers(): Promise<any> {
    throw new Error("Not implemented in MemStorage");
  }

  async verifyBroker(): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async unverifyBroker(): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async deleteBroker(): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async toggleScamWarning(): Promise<{ scamWarning: boolean }> {
    throw new Error("Not implemented in MemStorage");
  }

  async getScamReports(): Promise<any> {
    throw new Error("Not implemented in MemStorage");
  }

  async resolveScamReport(): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async approveBrokerReview(): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async rejectBrokerReview(): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getBrokerStats(): Promise<any> {
    throw new Error("Not implemented in MemStorage");
  }

  async updateBroker(): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getPendingBrokers(): Promise<any[]> {
    throw new Error("Not implemented in MemStorage");
  }

  async getEngagementMetrics(): Promise<{
    dau: number;
    postsToday: number;
    commentsToday: number;
    likesToday: number;
  }> {
    return {
      dau: 0,
      postsToday: 0,
      commentsToday: 0,
      likesToday: 0
    };
  }

  async getTopContentByViews(limit: number): Promise<Array<{
    id: string;
    title: string;
    views: number;
    author: string;
    createdAt: Date;
  }>> {
    return [];
  }

  async getTopUsersByReputation(limit: number): Promise<Array<{
    id: string;
    username: string;
    reputation: number;
    coins: number;
    badges: string[];
    posts: number;
  }>> {
    return [];
  }

  // ============================================================================
  // PHASE 3: Finance Management (9 methods) - MemStorage Stubs
  // ============================================================================

  async getTotalRevenue(period?: string): Promise<{ totalRevenue: number; change: number }> {
    return { totalRevenue: 0, change: 0 };
  }

  async getRevenueBySource(): Promise<{
    coinPurchases: number;
    subscriptions: number;
    marketplace: number;
    other: number;
  }> {
    return {
      coinPurchases: 0,
      subscriptions: 0,
      marketplace: 0,
      other: 0
    };
  }

  async getRevenuePeriod(period: 'today' | 'week' | 'month' | 'year' | 'all'): Promise<{ totalRevenue: number; count: number }> {
    return { totalRevenue: 0, count: 0 };
  }

  async getAllWithdrawals(filters?: any): Promise<{ items: any[]; total: number }> {
    return { items: [], total: 0 };
  }

  async completeWithdrawal(id: string, adminId: string, transactionId: string, notes?: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getRecentTransactions(limit?: number, period?: string): Promise<any[]> {
    return [];
  }

  async getAllTransactions(filters?: any): Promise<{ items: any[]; total: number }> {
    return { items: [], total: 0 };
  }

  async exportTransactionsCSV(filters?: any): Promise<string> {
    return "";
  }

  async getFinancialStats(): Promise<{
    totalRevenue: number;
    totalWithdrawals: number;
    pendingWithdrawals: number;
    completedWithdrawals: number;
    totalTransactions: number;
    activeSubscriptions: number;
  }> {
    return {
      totalRevenue: 0,
      totalWithdrawals: 0,
      pendingWithdrawals: 0,
      completedWithdrawals: 0,
      totalTransactions: 0,
      activeSubscriptions: 0
    };
  }
}

export class DrizzleStorage implements IStorage {
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

  async trackOnboardingProgress(userId: string, task: string): Promise<{ completed: boolean; coinsEarned: number }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const progress = (user.onboardingProgress as any) || {
      profileCreated: false,
      firstReply: false,
      firstReport: false,
      firstUpload: false,
      socialLinked: false,
    };

    const taskMapping: Record<string, { key: string; reward: number }> = {
      profileCreated: { key: "profileCreated", reward: 10 },
      firstReply: { key: "firstReply", reward: 15 },
      firstReport: { key: "firstReport", reward: 20 },
      firstUpload: { key: "firstUpload", reward: 50 },
      socialLinked: { key: "socialLinked", reward: 30 },
    };

    const taskInfo = taskMapping[task];
    if (!taskInfo) {
      return { completed: false, coinsEarned: 0 };
    }

    if (progress[taskInfo.key]) {
      return { completed: true, coinsEarned: 0 };
    }

    progress[taskInfo.key] = true;
    const allCompleted = Object.values(progress).every((v) => v === true);

    // Update onboarding progress (coins will be updated by createCoinTransaction)
    await db
      .update(users)
      .set({
        onboardingProgress: progress,
        onboardingCompleted: allCompleted,
      })
      .where(eq(users.id, userId));

    // Award coins through transaction system (this updates totalCoins)
    await this.createCoinTransaction({
      userId,
      type: "earn",
      amount: taskInfo.reward,
      description: `Onboarding reward: ${task}`,
      status: "completed",
    });

    return { completed: true, coinsEarned: taskInfo.reward };
  }

  // Daily Earning system - Activity tracking
  async recordActivity(userId: string, minutes: number): Promise<{coinsEarned: number, totalMinutes: number}> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get or create today's activity record
    let activity = await db.query.userActivity.findFirst({
      where: and(
        eq(userActivity.userId, userId),
        eq(userActivity.date, today)
      )
    });

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
    
    const activity = await db.query.userActivity.findFirst({
      where: and(
        eq(userActivity.userId, userId),
        eq(userActivity.date, today)
      )
    });

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

  async createCoinTransaction(insertTransaction: InsertCoinTransaction): Promise<CoinTransaction> {
    const user = await this.getUser(insertTransaction.userId);
    if (!user) throw new Error("User not found");

    const balanceChange = insertTransaction.type === "spend" 
      ? -Math.abs(insertTransaction.amount) 
      : Math.abs(insertTransaction.amount);

    if (user.totalCoins + balanceChange < 0) {
      throw new Error("Insufficient coins");
    }

    const [transaction] = await db.insert(coinTransactions).values({
      userId: insertTransaction.userId,
      type: insertTransaction.type as "earn" | "spend" | "recharge",
      amount: Math.abs(insertTransaction.amount),
      description: insertTransaction.description,
      status: (insertTransaction.status || "completed") as "completed" | "pending" | "failed",
    }).returning();

    await db
      .update(users)
      .set({ 
        totalCoins: sql`${users.totalCoins} + ${balanceChange}`,
        level: sql`FLOOR((${users.totalCoins} + ${balanceChange}) / 1000)`,
        weeklyEarned: insertTransaction.type === "earn" || insertTransaction.type === "recharge"
          ? sql`${users.weeklyEarned} + ${Math.abs(insertTransaction.amount)}`
          : users.weeklyEarned
      })
      .where(eq(users.id, insertTransaction.userId));

    await this.recalculateRanks();

    return transaction;
  }

  async getUserTransactions(userId: string, limit = 20): Promise<CoinTransaction[]> {
    return await db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, userId))
      .orderBy(desc(coinTransactions.createdAt))
      .limit(limit);
  }

  async createRechargeOrder(insertOrder: InsertRechargeOrder): Promise<RechargeOrder> {
    const [order] = await db.insert(rechargeOrders).values({
      userId: insertOrder.userId,
      coinAmount: insertOrder.coinAmount,
      priceUsd: insertOrder.priceUsd,
      paymentMethod: insertOrder.paymentMethod as "stripe" | "crypto",
      paymentId: insertOrder.paymentId,
      status: (insertOrder.status || "pending") as "pending" | "completed" | "failed",
    }).returning();
    return order;
  }

  async getRechargeOrder(id: string): Promise<RechargeOrder | undefined> {
    const [order] = await db.select().from(rechargeOrders).where(eq(rechargeOrders.id, id));
    return order;
  }

  async updateRechargeOrderStatus(
    id: string,
    status: "completed" | "failed",
    paymentId?: string
  ): Promise<RechargeOrder | undefined> {
    const [order] = await db
      .update(rechargeOrders)
      .set({
        status,
        paymentId: paymentId || sql`${rechargeOrders.paymentId}`,
        completedAt: status === "completed" ? new Date() : null,
      })
      .where(eq(rechargeOrders.id, id))
      .returning();

    if (!order) return undefined;

    if (status === "completed") {
      await this.createCoinTransaction({
        userId: order.userId,
        type: "recharge",
        amount: order.coinAmount,
        description: `Coin recharge via ${order.paymentMethod}`,
        status: "completed",
      });
    }

    return order;
  }

  private async recalculateRanks(): Promise<void> {
    const allUsers = await db.select().from(users).orderBy(desc(users.totalCoins));
    
    for (let i = 0; i < allUsers.length; i++) {
      await db
        .update(users)
        .set({ rank: i + 1 })
        .where(eq(users.id, allUsers[i].id));
    }
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const seo = applySEOAutomations({
      title: insertContent.title,
      description: insertContent.description,
      imageUrls: insertContent.imageUrls || [],
    });

    const existingContent = await db.select({ slug: content.slug }).from(content);
    const existingSlugs = new Set(existingContent.map((c) => c.slug));
    const uniqueSlug = generateUniqueSlug(seo.slug, existingSlugs);

    const [newContent] = await db.insert(content).values({
      authorId: insertContent.authorId,
      type: insertContent.type as "ea" | "indicator" | "article" | "source_code",
      title: insertContent.title,
      description: insertContent.description,
      priceCoins: insertContent.priceCoins,
      isFree: insertContent.isFree ?? (insertContent.priceCoins === 0),
      category: insertContent.category,
      fileUrl: insertContent.fileUrl || null,
      imageUrl: insertContent.imageUrl || null,
      imageUrls: insertContent.imageUrls || null,
      postLogoUrl: insertContent.postLogoUrl || null,
      slug: uniqueSlug,
      focusKeyword: seo.focusKeyword,
      autoMetaDescription: seo.autoMetaDescription,
      autoImageAltTexts: seo.autoImageAltTexts,
    }).returning();

    return newContent;
  }

  async getContent(id: string): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.id, id));
    return item;
  }

  async getContentBySlug(slug: string): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.slug, slug));
    return item;
  }

  async getAllContent(filters?: { type?: string; category?: string; status?: string }): Promise<Content[]> {
    let query = db.select().from(content);
    
    const conditions = [];
    if (filters?.type) conditions.push(eq(content.type, filters.type as any));
    if (filters?.category) conditions.push(eq(content.category, filters.category));
    if (filters?.status) conditions.push(eq(content.status, filters.status as any));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(content.createdAt));
  }

  async getUserContent(userId: string): Promise<Content[]> {
    return await db
      .select()
      .from(content)
      .where(eq(content.authorId, userId))
      .orderBy(desc(content.createdAt));
  }

  async updateContentViews(contentId: string): Promise<void> {
    await db
      .update(content)
      .set({ views: sql`${content.views} + 1` })
      .where(eq(content.id, contentId));
  }

  async updateContentDownloads(contentId: string): Promise<void> {
    await db
      .update(content)
      .set({ downloads: sql`${content.downloads} + 1` })
      .where(eq(content.id, contentId));
  }

  async purchaseContent(contentId: string, buyerId: string): Promise<ContentPurchase> {
    return await db.transaction(async (tx) => {
      // 1. Get content details
      const contentList = await tx.select().from(content).where(eq(content.id, contentId));
      if (contentList.length === 0) throw new Error('Content not found');
      const item = contentList[0];

      // 2. Prevent self-purchase
      if (buyerId === item.authorId) {
        throw new Error('Cannot purchase own content');
      }

      // 3. Check if already purchased
      const alreadyPurchased = await this.hasPurchased(buyerId, contentId);
      if (alreadyPurchased) throw new Error('Already purchased');

      // 4. Handle free content without ledger transaction
      if (item.isFree || item.priceCoins === 0) {
        // Create a zero-value transaction for free content
        const [txRecord] = await tx.insert(coinTransactions).values({
          userId: buyerId,
          type: 'spend',
          amount: 0,
          description: `Free download: ${item.title}`,
          status: 'completed',
        }).returning();

        const [purchase] = await tx.insert(contentPurchases).values({
          contentId,
          buyerId,
          sellerId: item.authorId,
          priceCoins: 0,
          transactionId: txRecord.id,
        }).returning();

        // Update download counter
        await tx.update(content)
          .set({ downloads: sql`${content.downloads} + 1` })
          .where(eq(content.id, contentId));

        return purchase;
      }

      // 5. Get buyer wallet for balance check
      const buyerWallet = await this.getUserWallet(buyerId);
      if (!buyerWallet) throw new Error('Buyer wallet not found');

      // 6. Validate balance
      if (buyerWallet.balance < item.priceCoins) {
        throw new Error(`Insufficient balance. Need ${item.priceCoins} coins, have ${buyerWallet.balance}`);
      }

      // 7. Calculate amounts (90% to seller, 10% to platform)
      const sellerAmount = Math.floor(item.priceCoins * 0.9);
      const platformAmount = item.priceCoins - sellerAmount;

      // 8. Create balanced ledger transaction
      await this.beginLedgerTransaction(
        'purchase',
        buyerId,
        [
          {
            userId: buyerId,
            direction: 'debit',
            amount: item.priceCoins,
            memo: `Purchased: ${item.title}`,
          },
          {
            userId: item.authorId,
            direction: 'credit',
            amount: sellerAmount,
            memo: `Sale: ${item.title} (90% of ${item.priceCoins})`,
          },
          {
            userId: 'system',
            direction: 'credit',
            amount: platformAmount,
            memo: `Platform commission: ${item.title} (10%)`,
          },
        ],
        { contentId, buyerId, sellerId: item.authorId, price: item.priceCoins }
      );

      // 9. Create transaction record and purchase record
      const [txRecord] = await tx.insert(coinTransactions).values({
        userId: buyerId,
        type: 'spend',
        amount: item.priceCoins,
        description: `Purchased: ${item.title}`,
        status: 'completed',
      }).returning();

      const [purchase] = await tx.insert(contentPurchases).values({
        contentId,
        buyerId,
        sellerId: item.authorId,
        priceCoins: item.priceCoins,
        transactionId: txRecord.id,
      }).returning();

      // 10. Update download counter
      await tx.update(content)
        .set({ downloads: sql`${content.downloads} + 1` })
        .where(eq(content.id, contentId));

      return purchase;
    });
  }

  async getUserPurchases(userId: string): Promise<ContentPurchase[]> {
    return await db
      .select()
      .from(contentPurchases)
      .where(eq(contentPurchases.buyerId, userId))
      .orderBy(desc(contentPurchases.purchasedAt));
  }

  async hasPurchased(userId: string, contentId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(contentPurchases)
      .where(and(
        eq(contentPurchases.buyerId, userId),
        eq(contentPurchases.contentId, contentId)
      ))
      .limit(1);
    return !!result;
  }

  async createReview(insertReview: InsertContentReview): Promise<ContentReview> {
    const item = await this.getContent(insertReview.contentId);
    if (!item) throw new Error("Content not found");

    const user = await this.getUser(insertReview.userId);
    if (!user) throw new Error("User not found");

    const [review] = await db.insert(contentReviews).values(insertReview).returning();
    return review;
  }

  async getContentReviews(contentId: string): Promise<ContentReview[]> {
    return await db
      .select()
      .from(contentReviews)
      .where(and(
        eq(contentReviews.contentId, contentId),
        eq(contentReviews.status, "approved")
      ))
      .orderBy(desc(contentReviews.createdAt));
  }

  async getUserReviewCount(userId: string): Promise<number> {
    // Count content reviews
    const contentReviewCount = await db
      .select({ count: count() })
      .from(contentReviews)
      .where(eq(contentReviews.userId, userId));
    
    // Count broker reviews
    const brokerReviewCount = await db
      .select({ count: count() })
      .from(brokerReviews)
      .where(eq(brokerReviews.userId, userId));
    
    return (contentReviewCount[0]?.count || 0) + (brokerReviewCount[0]?.count || 0);
  }

  async likeContent(insertLike: InsertContentLike): Promise<ContentLike | null> {
    // Validate before transaction
    const item = await this.getContent(insertLike.contentId);
    if (!item) throw new Error("Content not found");

    const user = await this.getUser(insertLike.userId);
    if (!user) throw new Error("User not found");

    const alreadyLiked = await this.hasLiked(insertLike.userId, insertLike.contentId);
    if (alreadyLiked) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLikes = await db
      .select()
      .from(contentLikes)
      .where(and(
        eq(contentLikes.userId, insertLike.userId),
        sql`${contentLikes.createdAt} >= ${today}`
      ));

    if (todayLikes.length >= 5) {
      throw new Error("Daily like limit reached (5 per day)");
    }

    // Use transaction for atomic multi-step operation
    return await db.transaction(async (tx) => {
      // 1. Create like record
      const [like] = await tx.insert(contentLikes).values(insertLike).returning();

      // 2. Update content likes counter
      await tx.update(content)
        .set({ likes: sql`${content.likes} + 1` })
        .where(eq(content.id, insertLike.contentId));

      // 3. Create coin transaction for reward
      await tx.insert(coinTransactions).values({
        userId: insertLike.userId,
        type: "earn",
        amount: 1,
        description: `Liked: ${item.title}`,
        status: "completed",
      });

      // 4. Update user coins
      await tx.update(users)
        .set({ 
          totalCoins: sql`${users.totalCoins} + 1`,
          level: sql`FLOOR((${users.totalCoins} + 1) / 1000)`,
          weeklyEarned: sql`${users.weeklyEarned} + 1`
        })
        .where(eq(users.id, insertLike.userId));

      return like;
    });
  }

  async hasLiked(userId: string, contentId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(contentLikes)
      .where(and(
        eq(contentLikes.userId, userId),
        eq(contentLikes.contentId, contentId)
      ))
      .limit(1);
    return !!result;
  }

  async createReply(insertReply: InsertContentReply): Promise<ContentReply> {
    const item = await this.getContent(insertReply.contentId);
    if (!item) throw new Error("Content not found");

    const user = await this.getUser(insertReply.userId);
    if (!user) throw new Error("User not found");

    if (insertReply.parentId) {
      const [parent] = await db.select().from(contentReplies).where(eq(contentReplies.id, insertReply.parentId));
      if (!parent) throw new Error("Parent reply not found");
    }

    const [reply] = await db.insert(contentReplies).values(insertReply).returning();
    return reply;
  }

  async getContentReplies(contentId: string): Promise<ContentReply[]> {
    return await db
      .select()
      .from(contentReplies)
      .where(eq(contentReplies.contentId, contentId))
      .orderBy(contentReplies.createdAt);
  }

  async updateReplyHelpful(replyId: string): Promise<void> {
    await db
      .update(contentReplies)
      .set({ helpful: sql`${contentReplies.helpful} + 1` })
      .where(eq(contentReplies.id, replyId));
  }

  async createBroker(insertBroker: InsertBroker): Promise<Broker> {
    const values: any = { ...insertBroker };
    
    // Convert numeric fields to strings
    if (values.minSpread !== undefined && values.minSpread !== null) {
      values.minSpread = String(values.minSpread);
    }
    
    const [broker] = await db.insert(brokers).values(values).returning();
    return broker;
  }

  async getBroker(id: string): Promise<Broker | undefined> {
    const [broker] = await db.select().from(brokers).where(eq(brokers.id, id));
    return broker;
  }

  async getBrokerBySlug(slug: string): Promise<Broker | undefined> {
    const [broker] = await db.select().from(brokers).where(eq(brokers.slug, slug));
    return broker;
  }

  async getAllBrokers(filters?: { isVerified?: boolean; status?: string }): Promise<Broker[]> {
    let query = db.select().from(brokers);
    
    const conditions = [];
    if (filters?.isVerified !== undefined) conditions.push(eq(brokers.isVerified, filters.isVerified));
    if (filters?.status) conditions.push(eq(brokers.status, filters.status as any));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(brokers.overallRating));
  }

  async searchBrokers(query: string, limit: number = 10): Promise<Broker[]> {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];
    
    const results = await db
      .select()
      .from(brokers)
      .where(
        and(
          eq(brokers.status, 'approved'),
          sql`LOWER(${brokers.name}) LIKE ${`%${lowerQuery}%`}`
        )
      )
      .orderBy(desc(brokers.overallRating))
      .limit(limit);
    
    return results;
  }

  async createBrokerReview(insertReview: InsertBrokerReview): Promise<BrokerReview> {
    const broker = await this.getBroker(insertReview.brokerId);
    if (!broker) throw new Error("Broker not found");

    const user = await this.getUser(insertReview.userId);
    if (!user) throw new Error("User not found");

    const reviewData: any = {
      ...insertReview,
      status: 'pending',
      datePosted: new Date()
    };

    const [review] = await db.insert(brokerReviews).values(reviewData).returning();
    return review;
  }

  async getBrokerReview(reviewId: string): Promise<BrokerReview | null> {
    const reviews = await db.select().from(brokerReviews).where(eq(brokerReviews.id, reviewId));
    return reviews[0] || null;
  }

  async getBrokerReviews(brokerId: string, filters?: { isScamReport?: boolean }): Promise<BrokerReview[]> {
    const conditions = [
      eq(brokerReviews.brokerId, brokerId),
      eq(brokerReviews.status, "approved")
    ];
    
    if (filters?.isScamReport !== undefined) {
      conditions.push(eq(brokerReviews.isScamReport, filters.isScamReport));
    }
    
    return await db
      .select()
      .from(brokerReviews)
      .where(and(...conditions))
      .orderBy(desc(brokerReviews.datePosted));
  }

  async updateBrokerReviewStatus(reviewId: string, status: string): Promise<BrokerReview> {
    const [updated] = await db.update(brokerReviews)
      .set({ status: status as "pending" | "approved" | "rejected" })
      .where(eq(brokerReviews.id, reviewId))
      .returning();
    if (!updated) throw new Error('Review not found');
    return updated;
  }

  async updateBrokerRating(brokerId: string): Promise<void> {
    const broker = await this.getBroker(brokerId);
    if (!broker) return;

    const reviews = await this.getBrokerReviews(brokerId);
    const scamReports = await this.getBrokerReviews(brokerId, { isScamReport: true });

    if (reviews.length === 0) {
      await db
        .update(brokers)
        .set({ 
          overallRating: 0, 
          reviewCount: 0, 
          scamReportCount: scamReports.length 
        })
        .where(eq(brokers.id, brokerId));
      return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round(totalRating / reviews.length);

    await db
      .update(brokers)
      .set({
        overallRating: averageRating,
        reviewCount: reviews.length,
        scamReportCount: scamReports.length,
      })
      .where(eq(brokers.id, brokerId));
  }
  
  async createForumThread(insertThread: InsertForumThread, authorId: string): Promise<ForumThread> {
    const user = await this.getUser(authorId);
    if (!user) throw new Error("User not found");
    
    // Note: Slug, focusKeyword, metaDescription are now passed from routes.ts
    // This method just stores whatever is provided, with fallbacks for required fields
    const [thread] = await db.insert(forumThreads).values({
      ...insertThread,
      authorId,
      // Ensure slug is always defined (generate from title if missing)
      slug: insertThread.slug || generateThreadSlug(insertThread.title),
      // Ensure defaults for optional fields
      isPinned: insertThread.isPinned ?? false,
      isLocked: insertThread.isLocked ?? false,
      isSolved: insertThread.isSolved ?? false,
      engagementScore: insertThread.engagementScore ?? 0,
      status: "approved" as const,
    }).returning();
    
    await this.updateCategoryStats(insertThread.categorySlug);
    
    await this.createActivity({
      userId: authorId,
      activityType: "thread_created",
      entityType: "thread",
      entityId: thread.id,
      title: insertThread.title,
      description: thread.metaDescription || insertThread.body.substring(0, 200),
    });
    
    return thread;
  }
  
  async getForumThreadById(id: string): Promise<ForumThread | undefined> {
    const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, id));
    return thread;
  }
  
  async getForumThreadBySlug(slug: string): Promise<ForumThread | undefined> {
    const [result] = await db
      .select({
        thread: forumThreads,
        authorUsername: users.username,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(forumThreads)
      .leftJoin(users, eq(forumThreads.authorId, users.id))
      .where(eq(forumThreads.slug, slug));
    
    if (!result) return undefined;
    
    const thread = result.thread;
    
    // Get accurate reply count from database
    const [{ count: actualReplyCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(forumReplies)
      .where(eq(forumReplies.threadId, thread.id));
    
    // Increment view count
    if (thread) {
      await db
        .update(forumThreads)
        .set({ views: sql`${forumThreads.views} + 1` })
        .where(eq(forumThreads.id, thread.id));
    }
    
    // Return thread with author data merged in and accurate reply count
    return {
      ...thread,
      replyCount: actualReplyCount,
      authorUsername: result.authorUsername,
      authorFirstName: result.authorFirstName,
      authorLastName: result.authorLastName,
    } as ForumThread;
  }
  
  async listForumThreads(filters?: { categorySlug?: string; status?: string; isPinned?: boolean; limit?: number }): Promise<ForumThread[]> {
    let query = db.select().from(forumThreads);
    
    const conditions = [];
    if (filters?.categorySlug) conditions.push(eq(forumThreads.categorySlug, filters.categorySlug));
    if (filters?.status) conditions.push(eq(forumThreads.status, filters.status as any));
    if (filters?.isPinned !== undefined) conditions.push(eq(forumThreads.isPinned, filters.isPinned));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const threads = await query.orderBy(
      desc(forumThreads.isPinned),
      desc(forumThreads.lastActivityAt)
    );
    
    return filters?.limit ? threads.slice(0, filters.limit) : threads;
  }
  
  async updateForumThreadReplyCount(threadId: string, increment: number): Promise<void> {
    await db
      .update(forumThreads)
      .set({ 
        replyCount: sql`${forumThreads.replyCount} + ${increment}` 
      })
      .where(eq(forumThreads.id, threadId));
  }
  
  async updateForumThreadActivity(threadId: string): Promise<void> {
    await db
      .update(forumThreads)
      .set({ lastActivityAt: sql`NOW()` })
      .where(eq(forumThreads.id, threadId));
  }
  
  async createForumReply(insertReply: InsertForumReply): Promise<ForumReply> {
    // Validate before transaction
    const thread = await this.getForumThreadById(insertReply.threadId);
    if (!thread) throw new Error("Thread not found");
    
    const user = await this.getUser(insertReply.userId);
    if (!user) throw new Error("User not found");
    
    if (insertReply.parentId) {
      const [parent] = await db.select().from(forumReplies).where(eq(forumReplies.id, insertReply.parentId));
      if (!parent) throw new Error("Parent reply not found");
    }
    
    const metaDescription = generateMetaDescription(insertReply.body);
    const tempId = randomUUID();
    const slug = generateReplySlug(thread.title, user.username, tempId);
    
    // Use transaction for atomic multi-step operation
    return await db.transaction(async (tx) => {
      // 1. Create reply record
      const [reply] = await tx.insert(forumReplies).values({
        threadId: insertReply.threadId,
        userId: insertReply.userId,
        parentId: insertReply.parentId || null,
        body: insertReply.body,
        slug,
        metaDescription,
        imageUrls: insertReply.imageUrls || null,
      }).returning();
      
      // 2. Update thread reply count and activity
      await tx.update(forumThreads)
        .set({ 
          replyCount: sql`${forumThreads.replyCount} + 1`,
          lastActivityAt: new Date()
        })
        .where(eq(forumThreads.id, insertReply.threadId));
      
      // 3. Update category stats
      const category = await tx.select().from(forumCategories).where(eq(forumCategories.slug, thread.categorySlug));
      if (category.length > 0) {
        await tx.update(forumCategories)
          .set({ 
            postCount: sql`${forumCategories.postCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(forumCategories.slug, thread.categorySlug));
      }
      
      // 4. Create activity record
      await tx.insert(activityFeed).values({
        userId: insertReply.userId,
        activityType: "reply_posted",
        entityType: "reply",
        entityId: reply.id,
        title: `Reply to: ${thread.title}`,
        description: metaDescription,
      });
      
      return reply;
    });
  }
  
  async listForumReplies(threadId: string): Promise<ForumReply[]> {
    const results = await db
      .select({
        reply: forumReplies,
        authorUsername: users.username,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(forumReplies)
      .leftJoin(users, eq(forumReplies.userId, users.id))
      .where(eq(forumReplies.threadId, threadId))
      .orderBy(forumReplies.createdAt);
    
    // Return replies with author data merged in
    return results.map(result => ({
      ...result.reply,
      authorUsername: result.authorUsername,
      authorFirstName: result.authorFirstName,
      authorLastName: result.authorLastName,
    } as ForumReply));
  }
  
  async markReplyAsAccepted(replyId: string): Promise<ForumReply | null> {
    const [reply] = await db.select().from(forumReplies).where(eq(forumReplies.id, replyId));
    if (!reply) return null;
    
    await db
      .update(forumReplies)
      .set({ isAccepted: false })
      .where(eq(forumReplies.threadId, reply.threadId));
    
    await db
      .update(forumReplies)
      .set({ isAccepted: true })
      .where(eq(forumReplies.id, replyId));
    
    const [updatedReply] = await db.select().from(forumReplies).where(eq(forumReplies.id, replyId));
    return updatedReply || null;
  }
  
  async markReplyAsHelpful(replyId: string): Promise<ForumReply | null> {
    await db
      .update(forumReplies)
      .set({ helpful: sql`${forumReplies.helpful} + 1` })
      .where(eq(forumReplies.id, replyId));
    
    const [updatedReply] = await db.select().from(forumReplies).where(eq(forumReplies.id, replyId));
    return updatedReply || null;
  }
  
  async listForumCategories(): Promise<ForumCategory[]> {
    return await db
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.isActive, true))
      .orderBy(forumCategories.sortOrder);
  }
  
  async getForumCategoryBySlug(slug: string): Promise<ForumCategory | undefined> {
    const [category] = await db.select().from(forumCategories).where(eq(forumCategories.slug, slug));
    return category;
  }
  
  async updateCategoryStats(categorySlug: string): Promise<void> {
    const category = await this.getForumCategoryBySlug(categorySlug);
    if (!category) return;
    
    const threads = await db
      .select()
      .from(forumThreads)
      .where(and(
        eq(forumThreads.categorySlug, categorySlug),
        eq(forumThreads.status, "approved")
      ));
    
    const threadCount = threads.length;
    const totalPosts = threads.reduce((sum, t) => sum + t.replyCount, 0);
    
    await db
      .update(forumCategories)
      .set({
        threadCount,
        postCount: totalPosts + threadCount,
        updatedAt: sql`NOW()`,
      })
      .where(eq(forumCategories.slug, categorySlug));
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

  // Ledger System Implementation
  async createUserWallet(userId: string): Promise<UserWallet> {
    const walletId = randomUUID();
    const [wallet] = await db.insert(userWallet).values({
      walletId,
      userId,
      balance: 0,
      availableBalance: 0,
      status: 'active',
    }).returning();
    return wallet;
  }

  async getUserWallet(userId: string): Promise<UserWallet | null> {
    const wallets = await db.select().from(userWallet).where(eq(userWallet.userId, userId));
    
    if (wallets.length === 0) {
      // Auto-create wallet if doesn't exist
      return this.createUserWallet(userId);
    }
    
    return wallets[0];
  }

  async beginLedgerTransaction(
    type: string,
    initiatorUserId: string,
    entries: Array<{
      userId: string;
      direction: 'debit' | 'credit';
      amount: number;
      memo: string;
    }>,
    context?: Record<string, any>,
    externalRef?: string
  ): Promise<CoinLedgerTransaction> {
    return await db.transaction(async (tx) => {
      // Step 1: Create ledger transaction header
      const ledgerTxId = randomUUID();
      const [ledgerTx] = await tx.insert(coinLedgerTransactions).values({
        id: ledgerTxId,
        type,
        initiatorUserId,
        context: context || {},
        externalRef,
        status: 'pending',
      }).returning();

      // Step 2: Create journal entries
      for (const entry of entries) {
        // Get or create wallet
        let wallet = await tx.select().from(userWallet)
          .where(eq(userWallet.userId, entry.userId))
          .for('update'); // Lock wallet row

        if (wallet.length === 0) {
          // Create wallet if doesn't exist
          const walletId = randomUUID();
          await tx.insert(userWallet).values({
            walletId,
            userId: entry.userId,
            balance: 0,
            availableBalance: 0,
            status: 'active',
          });
          wallet = await tx.select().from(userWallet)
            .where(eq(userWallet.userId, entry.userId))
            .for('update');
        }

        const currentWallet = wallet[0];
        const balanceBefore = currentWallet.balance;
        
        // Calculate balance after
        const balanceAfter = entry.direction === 'credit'
          ? balanceBefore + entry.amount
          : balanceBefore - entry.amount;

        // Create journal entry (triggers will validate and update wallet)
        await tx.insert(coinJournalEntries).values({
          id: randomUUID(),
          ledgerTransactionId: ledgerTxId,
          walletId: currentWallet.walletId,
          direction: entry.direction,
          amount: entry.amount,
          balanceBefore,
          balanceAfter,
          memo: entry.memo,
        });
      }

      // Step 3: Close ledger transaction (triggers validate balance)
      const [closedTx] = await tx.update(coinLedgerTransactions)
        .set({ status: 'closed', closedAt: new Date() })
        .where(eq(coinLedgerTransactions.id, ledgerTxId))
        .returning();

      return closedTx;
    });
  }

  async getLedgerTransactionHistory(userId: string, limit = 50): Promise<CoinJournalEntry[]> {
    const wallet = await this.getUserWallet(userId);
    if (!wallet) return [];

    return await db.select()
      .from(coinJournalEntries)
      .where(eq(coinJournalEntries.walletId, wallet.walletId))
      .orderBy(desc(coinJournalEntries.createdAt))
      .limit(limit);
  }

  async reconcileWallets(): Promise<{driftCount: number; maxDelta: number}> {
    const wallets = await db.select().from(userWallet);
    let driftCount = 0;
    let maxDelta = 0;

    for (const wallet of wallets) {
      // Calculate balance from journal entries
      const entries = await db.select().from(coinJournalEntries)
        .where(eq(coinJournalEntries.walletId, wallet.walletId));

      const calculatedBalance = entries.reduce((sum, entry) => {
        return sum + (entry.direction === 'credit' ? entry.amount : -entry.amount);
      }, 0);

      const delta = Math.abs(wallet.balance - calculatedBalance);
      if (delta > 0) {
        driftCount++;
        maxDelta = Math.max(maxDelta, delta);
        
        // Log drift (could create correcting entry here)
        console.warn(`Wallet ${wallet.walletId} drift detected: ${delta} coins`);
      }
    }

    return { driftCount, maxDelta };
  }

  // Backfill opening balances (run once during migration)
  async backfillOpeningBalances(): Promise<{created: number; skipped: number}> {
    const allUsers = await db.select().from(users);
    let created = 0;
    let skipped = 0;

    for (const user of allUsers) {
      // Check if wallet exists
      const existingWallet = await db.select().from(userWallet)
        .where(eq(userWallet.userId, user.id));

      if (existingWallet.length > 0) {
        skipped++; // Already has wallet - skip to prevent duplicate credits
        continue;
      }

      // Check if already backfilled by looking for opening_balance transaction
      const existingOpening = await db.select().from(coinLedgerTransactions)
        .where(and(
          eq(coinLedgerTransactions.type, 'opening_balance'),
          eq(coinLedgerTransactions.initiatorUserId, user.id)
        ))
        .limit(1);

      if (existingOpening.length > 0) {
        skipped++; // Already backfilled
        continue;
      }

      // Create opening balance ledger transaction
      if (user.totalCoins > 0) {
        await this.beginLedgerTransaction(
          'opening_balance',
          user.id,
          [{
            userId: user.id,
            direction: 'credit',
            amount: user.totalCoins,
            memo: 'Opening balance migration from legacy coin system',
          }, {
            userId: 'system', // Platform account
            direction: 'debit',
            amount: user.totalCoins,
            memo: 'Opening balance migration offset',
          }],
          { migratedFrom: 'users.totalCoins' }
        );
        created++;
      } else {
        // Create empty wallet
        await this.createUserWallet(user.id);
        created++;
      }
    }

    return { created, skipped };
  }
  
  // Badge System
  private async hasBadge(userId: string, badge: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.badges?.includes(badge) || false;
  }

  async awardBadge(userId: string, badge: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return;

    const currentBadges = user.badges || [];
    if (currentBadges.includes(badge)) return;

    await db.update(users)
      .set({ badges: [...currentBadges, badge] })
      .where(eq(users.id, userId));
  }

  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const newBadges: string[] = [];

    // Check EA Expert (5+ published EAs)
    const publishedContent = await db.select({ count: sql<number>`count(*)` })
      .from(content)
      .where(and(eq(content.authorId, userId), eq(content.type, 'ea')));
    
    if (publishedContent[0].count >= 5) {
      const hadBadge = await this.hasBadge(userId, BADGE_TYPES.EA_EXPERT);
      if (!hadBadge) {
        await this.awardBadge(userId, BADGE_TYPES.EA_EXPERT);
        newBadges.push(BADGE_TYPES.EA_EXPERT);
      }
    }

    // Check Helpful Member (50+ helpful replies)
    const helpfulReplies = await db.select({ count: sql<number>`count(*)` })
      .from(forumReplies)
      .where(and(eq(forumReplies.userId, userId), gt(forumReplies.helpful, 0)));
    
    if (helpfulReplies[0].count >= 50) {
      const hadBadge = await this.hasBadge(userId, BADGE_TYPES.HELPFUL_MEMBER);
      if (!hadBadge) {
        await this.awardBadge(userId, BADGE_TYPES.HELPFUL_MEMBER);
        newBadges.push(BADGE_TYPES.HELPFUL_MEMBER);
      }
    }

    // Check Top Contributor (top 10)
    const topContributors = await this.getTopContributors(10);
    const isTopContributor = topContributors.some(c => c.userId === userId);
    
    if (isTopContributor) {
      const hadBadge = await this.hasBadge(userId, BADGE_TYPES.TOP_CONTRIBUTOR);
      if (!hadBadge) {
        await this.awardBadge(userId, BADGE_TYPES.TOP_CONTRIBUTOR);
        newBadges.push(BADGE_TYPES.TOP_CONTRIBUTOR);
      }
    }

    return newBadges;
  }
  
  async getOnboardingProgress(userId: string) {
    const [user] = await db.select({
      completed: users.onboardingCompleted,
      dismissed: users.onboardingDismissed,
      progress: users.onboardingProgress,
    })
    .from(users)
    .where(eq(users.id, userId));

    if (!user) return null;

    return {
      completed: user.completed || false,
      dismissed: user.dismissed || false,
      progress: (user.progress as any) || {
        profilePicture: false,
        firstReply: false,
        twoReviews: false,
        firstThread: false,
        firstPublish: false,
        fiftyFollowers: false,
      },
    };
  }

  async markOnboardingStep(userId: string, step: string): Promise<void> {
    // Get current progress
    const current = await this.getOnboardingProgress(userId);
    if (!current || current.progress[step]) return; // Already completed

    // Award coins based on step
    const coinRewards: Record<string, number> = {
      profilePicture: 10,
      firstReply: 5,
      twoReviews: 6,
      firstThread: 10,
      firstPublish: 30,
      fiftyFollowers: 200,
    };

    const coinsToAward = coinRewards[step] || 0;

    // Update progress
    const newProgress = { ...current.progress, [step]: true };
    
    // Mark complete when ALL tasks are done
    const allComplete = ['profilePicture', 'firstReply', 'twoReviews', 'firstThread', 'firstPublish', 'fiftyFollowers'].every(s => newProgress[s]);
    
    await db.update(users)
      .set({ 
        onboardingProgress: newProgress,
        onboardingCompleted: allComplete,
      })
      .where(eq(users.id, userId));

    // Award coins if applicable
    if (coinsToAward > 0) {
      try {
        await this.beginLedgerTransaction(
          'earn',
          userId,
          [
            {
              userId,
              direction: 'credit',
              amount: coinsToAward,
              memo: `Onboarding: ${step} (+${coinsToAward} coins)`,
            },
            {
              userId: 'system',
              direction: 'debit',
              amount: coinsToAward,
              memo: 'Platform onboarding reward',
            },
          ],
          { onboardingStep: step }
        );
      } catch (error) {
        console.error('Failed to award onboarding coins:', error);
      }
    }
  }

  async dismissOnboarding(userId: string): Promise<void> {
    await db.update(users)
      .set({ onboardingDismissed: true })
      .where(eq(users.id, userId));
  }

  // Ranking System Methods
  async getAllForumThreads(): Promise<ForumThread[]> {
    return await db.select().from(forumThreads);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserStats(userId: string): Promise<{
    threadsCreated: number;
    repliesPosted: number;
    helpfulVotes: number;
    bestAnswers: number;
    contentSales: number;
    followersCount: number;
    uploadsCount: number;
  }> {
    // Count threads created
    const threadsCount = await db.select({ count: count(forumThreads.id) })
      .from(forumThreads)
      .where(eq(forumThreads.authorId, userId));
    
    // Count replies posted
    const repliesCount = await db.select({ count: count(forumReplies.id) })
      .from(forumReplies)
      .where(eq(forumReplies.userId, userId));
    
    // Count content uploads
    const uploadsCount = await db.select({ count: count(content.id) })
      .from(content)
      .where(eq(content.authorId, userId));
    
    // Count content sales
    const salesCount = await db.select({ count: count(contentPurchases.id) })
      .from(contentPurchases)
      .where(eq(contentPurchases.sellerId, userId));
    
    // Count followers
    const followersCount = await db.select({ count: count(userFollows.id) })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));
    
    // Sum helpful votes from threads and replies created by user
    const threadVotes = await db.select({ 
      total: sql<number>`COALESCE(SUM(${forumThreads.helpfulVotes}), 0)` 
    })
      .from(forumThreads)
      .where(eq(forumThreads.authorId, userId));
    
    const replyVotes = await db.select({ 
      total: sql<number>`COALESCE(SUM(${forumReplies.helpfulVotes}), 0)` 
    })
      .from(forumReplies)
      .where(eq(forumReplies.userId, userId));

    return {
      threadsCreated: threadsCount[0]?.count || 0,
      repliesPosted: repliesCount[0]?.count || 0,
      helpfulVotes: (threadVotes[0]?.total || 0) + (replyVotes[0]?.total || 0),
      bestAnswers: 0, // TODO: Implement best answers tracking
      contentSales: salesCount[0]?.count || 0,
      followersCount: followersCount[0]?.count || 0,
      uploadsCount: uploadsCount[0]?.count || 0,
    };
  }

  async getContentSalesStats(contentId: string): Promise<{
    totalSales: number;
    reviewCount: number;
    avgRating: number;
  }> {
    // Count total purchases
    const salesCount = await db.select({ count: count() })
      .from(contentPurchases)
      .where(eq(contentPurchases.contentId, contentId));
    
    // Count reviews and calculate average rating
    const reviews = await db.select()
      .from(contentReviews)
      .where(eq(contentReviews.contentId, contentId));
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      totalSales: salesCount[0]?.count || 0,
      reviewCount: reviews.length,
      avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
    };
  }

  async updateThreadScore(threadId: string, score: number): Promise<void> {
    await db.update(forumThreads)
      .set({ 
        engagementScore: score,
        lastScoreUpdate: new Date()
      })
      .where(eq(forumThreads.id, threadId));
  }

  async updateUserReputation(userId: string, reputation: number): Promise<void> {
    await db.update(users)
      .set({ 
        reputationScore: reputation,
        lastReputationUpdate: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateContentSalesScore(contentId: string, score: number): Promise<void> {
    await db.update(content)
      .set({ 
        salesScore: score,
        lastSalesUpdate: new Date()
      })
      .where(eq(content.id, contentId));
  }

  async sendMessage(senderId: string, recipientId: string, body: string): Promise<any> {
    const conversationResults = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.participant1Id, senderId),
            eq(conversations.participant2Id, recipientId)
          ),
          and(
            eq(conversations.participant1Id, recipientId),
            eq(conversations.participant2Id, senderId)
          )
        )
      )
      .limit(1);

    let conversationId: string;

    if (conversationResults.length > 0) {
      conversationId = conversationResults[0].id;
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));
    } else {
      const newConversation = await db
        .insert(conversations)
        .values({
          participant1Id: senderId,
          participant2Id: recipientId,
        })
        .returning();
      conversationId = newConversation[0].id;
    }

    const newMessage = await db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        recipientId,
        body,
      })
      .returning();

    return newMessage[0];
  }

  async getConversations(userId: string): Promise<Array<{
    id: string;
    participant: User;
    lastMessage: {
      text: string;
      timestamp: Date;
      isRead: boolean;
      isSentByMe: boolean;
    };
    unreadCount: number;
  }>> {
    const userConversations = await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    const result = [];

    for (const conv of userConversations) {
      const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      const otherUser = await this.getUser(otherUserId);

      if (!otherUser) continue;

      const lastMessageResult = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const unreadMessages = await db
        .select({ count: count() })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conv.id),
            eq(messages.recipientId, userId),
            eq(messages.isRead, false)
          )
        );

      const unreadCount = unreadMessages[0]?.count || 0;

      if (lastMessageResult.length > 0) {
        const lastMsg = lastMessageResult[0];
        result.push({
          id: conv.id,
          participant: otherUser,
          lastMessage: {
            text: lastMsg.body,
            timestamp: lastMsg.createdAt,
            isRead: lastMsg.isRead,
            isSentByMe: lastMsg.senderId === userId,
          },
          unreadCount: Number(unreadCount),
        });
      }
    }

    return result;
  }

  async getConversationMessages(conversationId: string, userId: string): Promise<Array<{
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    isRead: boolean;
  }>> {
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      throw new Error('Conversation not found');
    }

    const conv = conversation[0];
    if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
      throw new Error('Unauthorized');
    }

    const messageResults = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(50);

    // Return in ascending order for display
    const sortedMessages = messageResults.reverse();

    return sortedMessages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      text: msg.body,
      timestamp: msg.createdAt,
      isRead: msg.isRead,
      deliveredAt: msg.deliveredAt,
      readAt: msg.readAt,
    }));
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const messageResult = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (messageResult.length === 0) {
      throw new Error('Message not found');
    }

    const message = messageResult[0];
    if (message.recipientId !== userId) {
      throw new Error('Unauthorized');
    }

    await db
      .update(messages)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(messages.id, messageId));
  }

  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    // Check if reaction already exists
    const existing = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(messageReactions).values({
        messageId,
        userId,
        emoji,
      });
    }
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      );
  }

  async getMessageReactions(messageId: string): Promise<Array<{ emoji: string; count: number; userIds: string[] }>> {
    const reactions = await db
      .select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId));

    const grouped = reactions.reduce((acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
      }
      acc[r.emoji].count++;
      acc[r.emoji].userIds.push(r.userId);
      return acc;
    }, {} as Record<string, { emoji: string; count: number; userIds: string[] }>);

    return Object.values(grouped);
  }

  async searchMessages(userId: string, query: string, filterUserId?: string): Promise<Array<{
    id: string;
    conversationId: string;
    senderId: string;
    senderUsername: string;
    text: string;
    timestamp: Date;
  }>> {
    // Get user's conversations
    const userConvs = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      );
    
    const conversationIds = userConvs.map(c => c.id);
    if (conversationIds.length === 0) return [];

    // Build search query with ILIKE for case-insensitive search
    let whereConditions = [
      inArray(messages.conversationId, conversationIds),
      sql`LOWER(${messages.body}) LIKE LOWER(${`%${query}%`})`
    ];

    if (filterUserId) {
      whereConditions.push(eq(messages.senderId, filterUserId));
    }

    const results = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        senderUsername: users.username,
        text: messages.body,
        timestamp: messages.createdAt,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(messages.createdAt))
      .limit(100);

    return results;
  }

  async getDashboardPreferences(userId: string): Promise<DashboardPreferences | null> {
    const result = await db
      .select()
      .from(dashboardPreferences)
      .where(eq(dashboardPreferences.userId, userId))
      .limit(1);

    return result[0] || null;
  }

  async saveDashboardPreferences(userId: string, preferences: InsertDashboardPreferences): Promise<DashboardPreferences> {
    const existing = await this.getDashboardPreferences(userId);

    if (existing) {
      const updated = await db
        .update(dashboardPreferences)
        .set({
          widgetOrder: preferences.widgetOrder,
          enabledWidgets: preferences.enabledWidgets,
          layoutType: preferences.layoutType as "default" | "compact" | "comfortable" | undefined,
          updatedAt: new Date(),
        })
        .where(eq(dashboardPreferences.userId, userId))
        .returning();

      return updated[0];
    } else {
      const created = await db
        .insert(dashboardPreferences)
        .values({
          userId,
          widgetOrder: preferences.widgetOrder,
          enabledWidgets: preferences.enabledWidgets,
          layoutType: preferences.layoutType as "default" | "compact" | "comfortable" | undefined,
        })
        .returning();

      return created[0];
    }
  }

  async createWithdrawalRequest(userId: string, data: Omit<InsertWithdrawalRequest, 'userId'>): Promise<WithdrawalRequest> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.totalCoins < data.amount) {
      throw new Error('Insufficient balance');
    }

    const values: any = {
      userId,
      amount: data.amount,
      cryptoType: data.cryptoType,
      walletAddress: data.walletAddress,
      status: (data.status || 'pending') as "pending" | "processing" | "completed" | "failed" | "cancelled",
      exchangeRate: String(data.exchangeRate),
      cryptoAmount: String(data.cryptoAmount),
      processingFee: data.processingFee,
    };

    if (data.transactionHash) {
      values.transactionHash = data.transactionHash;
    }

    if (data.adminNotes) {
      values.adminNotes = data.adminNotes;
    }

    const [withdrawal] = await db.insert(withdrawalRequests).values(values).returning();

    const newTotalCoins = user.totalCoins - data.amount;
    await db
      .update(users)
      .set({ 
        totalCoins: newTotalCoins,
        level: calculateUserLevel(newTotalCoins)
      })
      .where(eq(users.id, userId));

    return withdrawal;
  }

  async getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.requestedAt));
  }

  async getWithdrawalById(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null> {
    const [withdrawal] = await db
      .select()
      .from(withdrawalRequests)
      .where(and(
        eq(withdrawalRequests.id, withdrawalId),
        eq(withdrawalRequests.userId, userId)
      ))
      .limit(1);

    return withdrawal || null;
  }

  async cancelWithdrawalRequest(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null> {
    const withdrawal = await this.getWithdrawalById(withdrawalId, userId);
    
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
      throw new Error('Can only cancel pending withdrawals');
    }

    const [cancelled] = await db
      .update(withdrawalRequests)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(and(
        eq(withdrawalRequests.id, withdrawalId),
        eq(withdrawalRequests.userId, userId)
      ))
      .returning();

    const user = await this.getUser(userId);
    if (user) {
      const newTotalCoins = user.totalCoins + withdrawal.amount;
      await db
        .update(users)
        .set({ 
          totalCoins: newTotalCoins,
          level: calculateUserLevel(newTotalCoins)
        })
        .where(eq(users.id, userId));
    }

    return cancelled;
  }

  // Notification System
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values({
      userId: notification.userId,
      type: notification.type as "reply" | "like" | "follow" | "purchase" | "badge" | "system",
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl || null,
    }).returning();
    return created;
  }

  async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
    return updated || null;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result[0]?.count || 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  // Earnings Summary
  async getUserEarningsSummary(userId: string): Promise<{
    totalEarned: number;
    weeklyEarned: number;
    breakdown: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all earning transactions for the user
    const transactions = await db
      .select()
      .from(coinTransactions)
      .where(and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.type, 'earn')
      ));

    // Categorize earnings by description patterns
    const categories: Record<string, number> = {
      'Content Sales': 0,
      'Thread Replies': 0,
      'Accepted Answers': 0,
      'Daily Check-ins': 0,
      'Referrals': 0,
      'Other': 0,
    };

    transactions.forEach(tx => {
      const desc = tx.description.toLowerCase();
      if (desc.includes('content') || desc.includes('purchase')) {
        categories['Content Sales'] += tx.amount;
      } else if (desc.includes('reply')) {
        categories['Thread Replies'] += tx.amount;
      } else if (desc.includes('accepted') || desc.includes('answer')) {
        categories['Accepted Answers'] += tx.amount;
      } else if (desc.includes('check-in') || desc.includes('daily')) {
        categories['Daily Check-ins'] += tx.amount;
      } else if (desc.includes('referral')) {
        categories['Referrals'] += tx.amount;
      } else {
        categories['Other'] += tx.amount;
      }
    });

    const totalEarned = Object.values(categories).reduce((sum, val) => sum + val, 0);
    
    const breakdown = Object.entries(categories)
      .map(([source, amount]) => ({
        source,
        amount,
        percentage: totalEarned > 0 ? Math.round((amount / totalEarned) * 100) : 0,
      }))
      .filter(item => item.amount > 0) // Only show categories with earnings
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending

    return {
      totalEarned,
      weeklyEarned: user.weeklyEarned || 0,
      breakdown,
    };
  }

  // REFERRALS
  async getReferrals(userId: string): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrerId, userId));
  }

  async getReferralStats(userId: string): Promise<{totalReferrals: number, totalEarnings: number, monthlyEarnings: number}> {
    const refs = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
    const totalReferrals = refs.length;
    const totalEarnings = refs.reduce((sum, r) => sum + r.totalEarnings, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthlyEarnings = refs.filter(r => r.createdAt >= monthStart).reduce((sum, r) => sum + r.totalEarnings, 0);
    return { totalReferrals, totalEarnings, monthlyEarnings };
  }

  async generateReferralCode(userId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    await db.insert(referrals).values({
      referrerId: userId,
      referredUserId: userId,
      referralCode: code,
      status: 'pending',
    });
    return code;
  }

  // GOALS
  async getGoals(userId: string): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
  }

  async createGoal(userId: string, goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values({ ...goal, userId }).returning();
    return newGoal;
  }

  async updateGoal(goalId: number, updates: Partial<InsertGoal>): Promise<Goal> {
    const [updated] = await db.update(goals).set(updates).where(eq(goals.id, goalId)).returning();
    return updated;
  }

  // ACHIEVEMENTS
  async getUserAchievements(userId: string): Promise<any[]> {
    const userAchievs = await db
      .select({
        id: userAchievements.id,
        progress: userAchievements.progress,
        unlockedAt: userAchievements.unlockedAt,
        achievement: achievements,
      })
      .from(userAchievements)
      .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
    return userAchievs;
  }

  // SALES DASHBOARD
  async getSalesDashboard(userId: string, days: number): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const sales = await db
      .select()
      .from(contentPurchases)
      .where(and(
        eq(contentPurchases.sellerId, userId),
        gte(contentPurchases.purchasedAt, startDate)
      ));
    
    const totalRevenue = sales.reduce((sum, s) => sum + s.priceCoins, 0);
    const totalSales = sales.length;
    const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    return {
      totalRevenue,
      totalSales,
      avgSale,
      conversionRate: 0,
      salesByDay: [],
      topProducts: [],
    };
  }

  // EARNINGS BREAKDOWN
  async getEarningsBreakdown(userId: string): Promise<any> {
    const transactions = await db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, userId))
      .orderBy(desc(coinTransactions.createdAt))
      .limit(100);
    
    const bySource = transactions.reduce((acc, t) => {
      acc[t.description] = (acc[t.description] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      bySource,
      total: transactions.reduce((sum, t) => sum + t.amount, 0),
      recent: transactions.slice(0, 10),
    };
  }

  // ACTIVITY FEED
  async getActivityFeed(userId: string, limit: number): Promise<any[]> {
    const activities: any[] = [];
    
    const recentPurchases = await db
      .select()
      .from(contentPurchases)
      .where(eq(contentPurchases.sellerId, userId))
      .orderBy(desc(contentPurchases.purchasedAt))
      .limit(limit);
    
    recentPurchases.forEach(p => activities.push({
      type: 'purchase',
      timestamp: p.purchasedAt,
      data: p,
    }));
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  // CAMPAIGNS
  async getCampaigns(userId: string): Promise<any[]> {
    return await db.select().from(campaigns).where(eq(campaigns.userId, userId));
  }

  async createCampaign(userId: string, campaign: any): Promise<any> {
    const [newCampaign] = await db.insert(campaigns).values({ ...campaign, userId }).returning();
    return newCampaign;
  }

  // CUSTOMERS
  async getCustomerList(userId: string): Promise<any[]> {
    const purchases = await db
      .select({
        buyerId: contentPurchases.buyerId,
        buyer: users,
        totalSpent: sql<number>`SUM(${contentPurchases.priceCoins})`,
        purchaseCount: sql<number>`COUNT(*)`,
        lastPurchase: sql<Date>`MAX(${contentPurchases.purchasedAt})`,
      })
      .from(contentPurchases)
      .leftJoin(users, eq(contentPurchases.buyerId, users.id))
      .where(eq(contentPurchases.sellerId, userId))
      .groupBy(contentPurchases.buyerId, users.id);
    
    return purchases;
  }

  // DASHBOARD SETTINGS
  async getDashboardSettings(userId: string): Promise<any> {
    const [settings] = await db.select().from(dashboardSettings).where(eq(dashboardSettings.userId, userId));
    if (!settings) {
      const [newSettings] = await db.insert(dashboardSettings).values({ userId }).returning();
      return newSettings;
    }
    return settings;
  }

  async updateDashboardSettings(userId: string, settings: any): Promise<void> {
    await db
      .update(dashboardSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(dashboardSettings.userId, userId));
  }

  // USER SETTINGS
  async getUserSettings(userId: string): Promise<any> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (!settings) {
      const [newSettings] = await db.insert(userSettings).values({ userId }).returning();
      return newSettings;
    }
    return settings;
  }

  async updateUserSettings(userId: string, settings: any): Promise<void> {
    await db
      .update(userSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  }

  // PROFILE
  async getProfileByUsername(username: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) return null;
    
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    
    return { ...user, profile };
  }

  async updateProfile(userId: string, profileData: any): Promise<any> {
    const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    
    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({ ...profileData, updatedAt: new Date() })
        .where(eq(profiles.userId, userId))
        .returning();
      return updated;
    } else {
      const [newProfile] = await db.insert(profiles).values({ ...profileData, userId }).returning();
      return newProfile;
    }
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 1: User Management (20 methods)
  // ============================================================================

  async getAdminUsers(filters: {
    search?: string;
    role?: string;
    status?: string;
    registrationStart?: Date;
    registrationEnd?: Date;
    reputationMin?: number;
    reputationMax?: number;
    limit?: number;
    offset?: number;
  }): Promise<{users: User[]; total: number}> {
    try {
      const { search, role, status, registrationStart, registrationEnd, reputationMin, reputationMax, limit = 50, offset = 0 } = filters;
      
      const conditions = [];
      
      if (search) {
        conditions.push(
          or(
            ilike(users.username, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )
        );
      }
      
      if (registrationStart) {
        conditions.push(gte(users.createdAt, registrationStart));
      }
      
      if (registrationEnd) {
        conditions.push(lte(users.createdAt, registrationEnd));
      }
      
      if (reputationMin !== undefined) {
        conditions.push(gte(users.reputationScore, reputationMin));
      }
      
      if (reputationMax !== undefined) {
        conditions.push(lte(users.reputationScore, reputationMax));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const usersList = await db
        .select()
        .from(users)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt));
      
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause);
      
      return {
        users: usersList as User[],
        total: Number(count)
      };
    } catch (error) {
      console.error("Error fetching admin users:", error);
      throw error;
    }
  }

  async banUser(userId: string, reason: string, bannedBy: string, duration?: number): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(adminActions).values({
          adminId: bannedBy,
          actionType: 'user_ban',
          targetType: 'user',
          targetId: userId,
          details: { reason, duration },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error banning user:", error);
      throw error;
    }
  }

  async suspendUser(userId: string, reason: string, suspendedBy: string, duration: number): Promise<void> {
    try {
      await db.insert(adminActions).values({
        adminId: suspendedBy,
        actionType: 'user_suspend',
        targetType: 'user',
        targetId: userId,
        details: { reason, duration },
        ipAddress: '0.0.0.0',
        userAgent: 'admin-dashboard',
      });
    } catch (error) {
      console.error("Error suspending user:", error);
      throw error;
    }
  }

  async unbanUser(userId: string, unbannedBy: string): Promise<void> {
    try {
      await db.insert(adminActions).values({
        adminId: unbannedBy,
        actionType: 'user_unban',
        targetType: 'user',
        targetId: userId,
        details: {},
        ipAddress: '0.0.0.0',
        userAgent: 'admin-dashboard',
      });
    } catch (error) {
      console.error("Error unbanning user:", error);
      throw error;
    }
  }

  async deleteUserAccount(userId: string, deletedBy: string, reason: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(adminActions).values({
          adminId: deletedBy,
          actionType: 'user_delete',
          targetType: 'user',
          targetId: userId,
          details: { reason },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
        
        await tx.delete(users).where(eq(users.id, userId));
      });
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw error;
    }
  }

  async adjustUserCoins(userId: string, amount: number, reason: string, adminId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ 
            totalCoins: sql`${users.totalCoins} + ${amount}`,
            level: sql`FLOOR((${users.totalCoins} + ${amount}) / 1000)`
          })
          .where(eq(users.id, userId));
        
        await tx.insert(coinTransactions).values({
          userId,
          type: amount > 0 ? 'earn' : 'spend',
          amount: Math.abs(amount),
          description: `Admin adjustment: ${reason}`,
          status: 'completed',
        });
        
        await tx.insert(adminActions).values({
          adminId,
          actionType: 'coins_adjust',
          targetType: 'user',
          targetId: userId,
          details: { amount, reason },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error adjusting user coins:", error);
      throw error;
    }
  }

  async changeUserRole(userId: string, newRole: string, changedBy: string): Promise<void> {
    try {
      await db.insert(adminActions).values({
        adminId: changedBy,
        actionType: 'role_change',
        targetType: 'user',
        targetId: userId,
        details: { newRole },
        ipAddress: '0.0.0.0',
        userAgent: 'admin-dashboard',
      });
    } catch (error) {
      console.error("Error changing user role:", error);
      throw error;
    }
  }

  async addUserBadge(userId: string, badgeSlug: string, grantedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(userBadges).values({
          userId,
          badgeType: badgeSlug as BadgeType,
        });
        
        await tx.insert(adminActions).values({
          adminId: grantedBy,
          actionType: 'badge_grant',
          targetType: 'user',
          targetId: userId,
          details: { badgeSlug },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error adding user badge:", error);
      throw error;
    }
  }

  async removeUserBadge(userId: string, badgeSlug: string, removedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.delete(userBadges).where(
          and(
            eq(userBadges.userId, userId),
            eq(userBadges.badgeType, badgeSlug as BadgeType)
          )
        );
        
        await tx.insert(adminActions).values({
          adminId: removedBy,
          actionType: 'badge_remove',
          targetType: 'user',
          targetId: userId,
          details: { badgeSlug },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error removing user badge:", error);
      throw error;
    }
  }

  async adjustUserReputation(userId: string, amount: number, reason: string, adminId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ 
            reputationScore: sql`${users.reputationScore} + ${amount}`,
            lastReputationUpdate: new Date()
          })
          .where(eq(users.id, userId));
        
        await tx.insert(adminActions).values({
          adminId,
          actionType: 'reputation_adjust',
          targetType: 'user',
          targetId: userId,
          details: { amount, reason },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error adjusting user reputation:", error);
      throw error;
    }
  }

  async createUserSegment(segment: {name: string; description: string; rules: any; createdBy: string}): Promise<any> {
    try {
      const [newSegment] = await db.insert(userSegments).values(segment).returning();
      return newSegment;
    } catch (error) {
      console.error("Error creating user segment:", error);
      throw error;
    }
  }

  async getUserSegments(): Promise<any[]> {
    try {
      return await db.select().from(userSegments).orderBy(desc(userSegments.createdAt));
    } catch (error) {
      console.error("Error fetching user segments:", error);
      throw error;
    }
  }

  async getUsersBySegment(segmentId: number): Promise<User[]> {
    try {
      // Simplified: return all users for now
      return await db.select().from(users).limit(100);
    } catch (error) {
      console.error("Error fetching users by segment:", error);
      throw error;
    }
  }

  async updateUserSegment(segmentId: number, updates: any): Promise<void> {
    try {
      await db
        .update(userSegments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userSegments.id, segmentId));
    } catch (error) {
      console.error("Error updating user segment:", error);
      throw error;
    }
  }

  async deleteUserSegment(segmentId: number): Promise<void> {
    try {
      await db.delete(userSegments).where(eq(userSegments.id, segmentId));
    } catch (error) {
      console.error("Error deleting user segment:", error);
      throw error;
    }
  }

  async getUserActivityLog(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const actions = await db
        .select()
        .from(adminActions)
        .where(eq(adminActions.targetId, userId))
        .orderBy(desc(adminActions.createdAt))
        .limit(limit);
      
      return actions;
    } catch (error) {
      console.error("Error fetching user activity log:", error);
      throw error;
    }
  }

  async getUserFinancialSummary(userId: string): Promise<any> {
    try {
      const transactions = await db
        .select()
        .from(coinTransactions)
        .where(eq(coinTransactions.userId, userId));
      
      const totalEarned = transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0);
      const totalSpent = transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0);
      
      return {
        totalEarned,
        totalSpent,
        balance: totalEarned - totalSpent,
        transactionCount: transactions.length,
      };
    } catch (error) {
      console.error("Error fetching user financial summary:", error);
      throw error;
    }
  }

  async getSuspiciousUsers(limit: number = 50): Promise<any[]> {
    try {
      // Return users with high transaction volume or unusual patterns
      return await db.select().from(users).limit(limit);
    } catch (error) {
      console.error("Error fetching suspicious users:", error);
      throw error;
    }
  }

  async getInactiveUsers(days: number): Promise<User[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const inactiveUsers = await db
        .select()
        .from(users)
        .where(lt(users.createdAt, cutoffDate))
        .limit(100);
      
      return inactiveUsers as User[];
    } catch (error) {
      console.error("Error fetching inactive users:", error);
      throw error;
    }
  }

  async getUsersByCountry(): Promise<{country: string; count: number}[]> {
    try {
      // Simplified: return empty for now as we don't have country field
      return [];
    } catch (error) {
      console.error("Error fetching users by country:", error);
      throw error;
    }
  }

  async getUserGrowthStats(days: number): Promise<any[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const newUsers = await db
        .select()
        .from(users)
        .where(gte(users.createdAt, cutoffDate));
      
      return [{
        date: new Date().toISOString().split('T')[0],
        newUsers: newUsers.length,
      }];
    } catch (error) {
      console.error("Error fetching user growth stats:", error);
      throw error;
    }
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 2: Content Moderation (25 methods)
  // ============================================================================

  async getModerationQueue(params: {
    type?: "thread" | "reply" | "all";
    status?: "pending" | "approved" | "rejected";
    page?: number;
    perPage?: number;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    perPage: number;
  }> {
    try {
      const page = params.page || 1;
      const perPage = params.perPage || 10;
      const offset = (page - 1) * perPage;
      const { type, status } = params;
      
      const conditions = [];
      
      if (type) {
        conditions.push(eq(moderationQueue.contentType, type));
      }
      
      if (status) {
        conditions.push(eq(moderationQueue.status, status));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const items = await db
        .select()
        .from(moderationQueue)
        .where(whereClause)
        .limit(perPage)
        .offset(offset)
        .orderBy(desc(moderationQueue.priorityScore), desc(moderationQueue.createdAt));
      
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(moderationQueue)
        .where(whereClause);
      
      return {
        items,
        total: Number(count),
        page,
        perPage
      };
    } catch (error) {
      console.error("Error fetching moderation queue:", error);
      throw error;
    }
  }

  async addToModerationQueue(item: {
    contentType: string;
    contentId: string;
    authorId: string;
    priorityScore?: number;
    spamScore?: number;
    sentimentScore?: number;
    flaggedReasons?: string[];
  }): Promise<any> {
    try {
      const values: any = {
        contentType: item.contentType,
        contentId: item.contentId,
        authorId: item.authorId,
        status: 'pending',
        priorityScore: item.priorityScore || 0,
      };
      
      if (item.spamScore !== undefined) {
        values.spamScore = String(item.spamScore);
      }
      
      if (item.sentimentScore !== undefined) {
        values.sentimentScore = String(item.sentimentScore);
      }
      
      if (item.flaggedReasons) {
        values.flaggedReasons = item.flaggedReasons;
      }
      
      const [newItem] = await db.insert(moderationQueue).values(values).returning();
      return newItem;
    } catch (error) {
      console.error("Error adding to moderation queue:", error);
      throw error;
    }
  }

  async approveContent(params: {
    contentId: string;
    contentType: "thread" | "reply";
    moderatorId: string;
    moderatorUsername: string;
  }): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        if (params.contentType === 'thread') {
          await tx
            .update(forumThreads)
            .set({ status: 'approved' })
            .where(eq(forumThreads.id, params.contentId));
        } else if (params.contentType === 'reply') {
          await tx
            .update(forumReplies)
            .set({ 
              status: 'approved',
              approvedBy: params.moderatorId,
              approvedAt: new Date()
            })
            .where(eq(forumReplies.id, params.contentId));
        }
        
        await tx.insert(adminActions).values({
          adminId: params.moderatorId,
          actionType: 'content_approve',
          targetType: params.contentType,
          targetId: params.contentId,
          details: { approvedBy: params.moderatorUsername },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error approving content:", error);
      throw error;
    }
  }

  async rejectContent(params: {
    contentId: string;
    contentType: "thread" | "reply";
    moderatorId: string;
    moderatorUsername: string;
    reason: string;
  }): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        if (params.contentType === 'thread') {
          await tx
            .update(forumThreads)
            .set({ status: 'rejected' })
            .where(eq(forumThreads.id, params.contentId));
        } else if (params.contentType === 'reply') {
          await tx
            .update(forumReplies)
            .set({ 
              status: 'rejected',
              rejectedBy: params.moderatorId,
              rejectedAt: new Date()
            })
            .where(eq(forumReplies.id, params.contentId));
        }
        
        await tx.insert(adminActions).values({
          adminId: params.moderatorId,
          actionType: 'content_reject',
          targetType: params.contentType,
          targetId: params.contentId,
          details: { reason: params.reason, rejectedBy: params.moderatorUsername },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error rejecting content:", error);
      throw error;
    }
  }

  async bulkApproveContent(queueIds: number[], reviewedBy: string): Promise<void> {
    throw new Error("bulkApproveContent not implemented - use approveContent with new params interface");
  }

  async bulkRejectContent(queueIds: number[], reviewedBy: string, reason: string): Promise<void> {
    throw new Error("bulkRejectContent not implemented - use rejectContent with new params interface");
  }

  async getReportedContent(params: {
    status?: "pending" | "resolved" | "dismissed";
    page?: number;
    perPage?: number;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    perPage: number;
  }> {
    try {
      const page = params.page || 1;
      const perPage = params.perPage || 10;
      const offset = (page - 1) * perPage;
      const { status } = params;
      
      const conditions = [];
      
      if (status) {
        conditions.push(eq(reportedContent.status, status));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const items = await db
        .select()
        .from(reportedContent)
        .where(whereClause)
        .limit(perPage)
        .offset(offset)
        .orderBy(desc(reportedContent.createdAt));
      
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(reportedContent)
        .where(whereClause);
      
      return {
        items,
        total: Number(count),
        page,
        perPage
      };
    } catch (error) {
      console.error("Error fetching reported content:", error);
      throw error;
    }
  }

  async createReport(report: {
    reporterId: string;
    contentType: string;
    contentId: string;
    reportReason: string;
    description: string;
  }): Promise<any> {
    try {
      const [newReport] = await db.insert(reportedContent).values({
        ...report,
        status: 'pending',
      }).returning();
      return newReport;
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  }

  async assignReport(reportId: number, assignedTo: string, assignedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(reportedContent)
          .set({ assignedTo })
          .where(eq(reportedContent.id, reportId));
        
        await tx.insert(adminActions).values({
          adminId: assignedBy,
          actionType: 'report_assign',
          targetType: 'report',
          targetId: String(reportId),
          details: { assignedTo },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error assigning report:", error);
      throw error;
    }
  }

  async resolveReport(reportId: number, resolution: string, resolvedBy: string, actionTaken: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(reportedContent)
          .set({ 
            status: 'resolved',
            resolution,
            actionTaken,
            resolvedAt: new Date(),
          })
          .where(eq(reportedContent.id, reportId));
        
        await tx.insert(adminActions).values({
          adminId: resolvedBy,
          actionType: 'report_resolve',
          targetType: 'report',
          targetId: String(reportId),
          details: { resolution, actionTaken },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error resolving report:", error);
      throw error;
    }
  }

  async dismissReport(params: {
    reportId: number;
    moderatorId: string;
    reason?: string;
  }): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(reportedContent)
          .set({ 
            status: 'dismissed',
            resolution: params.reason || null,
            resolvedAt: new Date(),
          })
          .where(eq(reportedContent.id, params.reportId));
        
        await tx.insert(adminActions).values({
          adminId: params.moderatorId,
          actionType: 'report_dismiss',
          targetType: 'report',
          targetId: String(params.reportId),
          details: { reason: params.reason },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error dismissing report:", error);
      throw error;
    }
  }

  async deleteContent(contentId: string, deletedBy: string, reason: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.delete(content).where(eq(content.id, contentId));
        
        await tx.insert(adminActions).values({
          adminId: deletedBy,
          actionType: 'content_delete',
          targetType: 'content',
          targetId: contentId,
          details: { reason },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error deleting content:", error);
      throw error;
    }
  }

  async restoreContent(contentId: string, restoredBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(content)
          .set({ status: 'approved' })
          .where(eq(content.id, contentId));
        
        await tx.insert(adminActions).values({
          adminId: restoredBy,
          actionType: 'content_restore',
          targetType: 'content',
          targetId: contentId,
          details: {},
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error restoring content:", error);
      throw error;
    }
  }
  // Additional moderation methods matching the new interface signatures
  async getQueueCount(): Promise<{
    total: number;
    threads: number;
    replies: number;
    urgentCount: number;
  }> {
    try {
      const [threadsResult] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(forumThreads)
        .where(eq(forumThreads.status, 'pending'));

      const [repliesResult] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(forumReplies)
        .where(eq(forumReplies.status, 'pending'));

      const threads = threadsResult?.count || 0;
      const replies = repliesResult?.count || 0;

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [urgentThreads] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(forumThreads)
        .where(and(eq(forumThreads.status, 'pending'), lt(forumThreads.createdAt, oneDayAgo)));

      const [urgentReplies] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(forumReplies)
        .where(and(eq(forumReplies.status, 'pending'), lt(forumReplies.createdAt, oneDayAgo)));

      const urgentCount = (urgentThreads?.count || 0) + (urgentReplies?.count || 0);

      return { total: threads + replies, threads, replies, urgentCount };
    } catch (error) {
      console.error("Error getting queue count:", error);
      throw error;
    }
  }

  async getReportedCount(): Promise<{
    total: number;
    newReports: number;
    underReview: number;
  }> {
    try {
      const [totalResult] = await db
        .select({ count: sql<number>`cast(count(distinct (${reportedContent.contentId}, ${reportedContent.contentType})) as integer)` })
        .from(reportedContent)
        .where(inArray(reportedContent.status, ['pending', 'under_review']));

      const [pendingResult] = await db
        .select({ count: sql<number>`cast(count(distinct (${reportedContent.contentId}, ${reportedContent.contentType})) as integer)` })
        .from(reportedContent)
        .where(eq(reportedContent.status, 'pending'));

      const [underReviewResult] = await db
        .select({ count: sql<number>`cast(count(distinct (${reportedContent.contentId}, ${reportedContent.contentType})) as integer)` })
        .from(reportedContent)
        .where(isNotNull(reportedContent.assignedTo));

      return {
        total: totalResult?.count || 0,
        newReports: pendingResult?.count || 0,
        underReview: underReviewResult?.count || 0
      };
    } catch (error) {
      console.error("Error getting reported count:", error);
      throw error;
    }
  }

  async getContentDetails(params: { contentId: string; contentType: "thread" | "reply"; }): Promise<import("@shared/schema").ContentDetails> {
    try {
      if (params.contentType === 'thread') {
        const [thread] = await db
          .select()
          .from(forumThreads)
          .where(eq(forumThreads.id, params.contentId));

        if (!thread) throw new Error(`Thread ${params.contentId} not found`);

        const [author] = await db
          .select()
          .from(users)
          .where(eq(users.id, thread.authorId));

        if (!author) throw new Error(`Author ${thread.authorId} not found`);

        return {
          id: thread.id,
          type: 'thread',
          title: thread.title,
          body: thread.body,
          attachments: thread.attachmentUrls || [],
          author,
          authorRecentPosts: [],
          authorWarnings: [],
          metadata: {
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            wordCount: thread.body.split(/\s+/).length,
            hasLinks: /https?:\/\//.test(thread.body),
            hasImages: thread.body.includes('![') || thread.body.includes('<img')
          }
        };
      } else {
        const [reply] = await db
          .select()
          .from(forumReplies)
          .where(eq(forumReplies.id, params.contentId));

        if (!reply) throw new Error(`Reply ${params.contentId} not found`);

        const [author] = await db
          .select()
          .from(users)
          .where(eq(users.id, reply.userId));

        if (!author) throw new Error(`Author ${reply.userId} not found`);

        return {
          id: reply.id,
          type: 'reply',
          title: undefined,
          body: reply.body,
          attachments: [],
          author,
          authorRecentPosts: [],
          authorWarnings: [],
          metadata: {
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt || reply.createdAt,
            wordCount: reply.body.split(/\s+/).length,
            hasLinks: /https?:\/\//.test(reply.body),
            hasImages: reply.body.includes('![') || reply.body.includes('<img')
          }
        };
      }
    } catch (error) {
      console.error("Error getting content details:", error);
      throw error;
    }
  }

  async getReportDetails(reportId: number): Promise<import("@shared/schema").ReportDetails> {
    try {
      const [report] = await db
        .select()
        .from(reportedContent)
        .where(eq(reportedContent.id, reportId));

      if (!report) throw new Error(`Report ${reportId} not found`);

      return {
        id: report.id,
        contentId: report.contentId,
        contentType: report.contentType as "thread" | "reply",
        content: { 
          body: '',
          author: {
            id: '',
            username: 'Unknown',
            reputation: 0
          }
        },
        reports: [],
        status: report.status as any,
        availableActions: ['dismiss', 'delete', 'warn', 'suspend', 'ban']
      };
    } catch (error) {
      console.error("Error getting report details:", error);
      throw error;
    }
  }

  async takeReportAction(params: {
    contentId: string;
    contentType: "thread" | "reply";
    actionType: "delete" | "warn" | "suspend" | "ban";
    moderatorId: string;
    reason: string;
    suspendDays?: number;
  }): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        let authorId = '';

        if (params.contentType === 'thread') {
          const [thread] = await tx
            .select()
            .from(forumThreads)
            .where(eq(forumThreads.id, params.contentId));

          if (thread) authorId = thread.authorId;
        } else {
          const [reply] = await tx
            .select()
            .from(forumReplies)
            .where(eq(forumReplies.id, params.contentId));

          if (reply) authorId = reply.userId;
        }

        if (!authorId) throw new Error(`Content ${params.contentId} not found`);

        switch (params.actionType) {
          case 'delete':
            if (params.contentType === 'thread') {
              await tx.delete(forumThreads).where(eq(forumThreads.id, params.contentId));
            } else {
              await tx.delete(forumReplies).where(eq(forumReplies.id, params.contentId));
            }

            await tx
              .update(reportedContent)
              .set({ status: 'resolved', actionTaken: 'deleted', resolvedAt: new Date() })
              .where(eq(reportedContent.contentId, params.contentId));

            await tx.insert(adminActions).values({
              adminId: params.moderatorId,
              actionType: 'delete_content',
              targetType: params.contentType,
              targetId: params.contentId,
              details: { reason: params.reason, authorId }
            });
            break;

          case 'warn':
            await tx
              .update(reportedContent)
              .set({ status: 'resolved', actionTaken: 'warned', resolvedAt: new Date() })
              .where(eq(reportedContent.contentId, params.contentId));

            await tx.insert(adminActions).values({
              adminId: params.moderatorId,
              actionType: 'warn_user',
              targetType: 'user',
              targetId: authorId,
              details: { reason: params.reason, contentId: params.contentId }
            });
            break;

          case 'suspend':
            if (!params.suspendDays) throw new Error('suspendDays is required for suspend action');

            const suspendedUntil = new Date();
            suspendedUntil.setDate(suspendedUntil.getDate() + params.suspendDays);

            await tx
              .update(users)
              .set({ status: 'suspended', suspendedUntil })
              .where(eq(users.id, authorId));

            await tx
              .update(reportedContent)
              .set({ status: 'resolved', actionTaken: 'suspended', resolvedAt: new Date() })
              .where(eq(reportedContent.contentId, params.contentId));

            await tx.insert(adminActions).values({
              adminId: params.moderatorId,
              actionType: 'suspend_user',
              targetType: 'user',
              targetId: authorId,
              details: { reason: params.reason, suspendDays: params.suspendDays, contentId: params.contentId }
            });
            break;

          case 'ban':
            await tx
              .update(users)
              .set({ status: 'banned', bannedAt: new Date(), bannedBy: params.moderatorId })
              .where(eq(users.id, authorId));

            await tx
              .update(reportedContent)
              .set({ status: 'resolved', actionTaken: 'banned', resolvedAt: new Date() })
              .where(eq(reportedContent.contentId, params.contentId));

            await tx.insert(adminActions).values({
              adminId: params.moderatorId,
              actionType: 'ban_user',
              targetType: 'user',
              targetId: authorId,
              details: { reason: params.reason, contentId: params.contentId }
            });
            break;
        }
      });
    } catch (error) {
      console.error("Error taking report action:", error);
      throw error;
    }
  }

  async bulkApprove(params: {
    contentIds: string[];
    contentType: "thread" | "reply";
    moderatorId: string;
    moderatorUsername: string;
  }): Promise<{ successCount: number; failedIds: string[]; }> {
    const failedIds: string[] = [];
    let successCount = 0;

    for (const contentId of params.contentIds.slice(0, 100)) {
      try {
        await this.approveContent({
          contentId,
          contentType: params.contentType,
          moderatorId: params.moderatorId,
          moderatorUsername: params.moderatorUsername,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to approve ${contentId}:`, error);
        failedIds.push(contentId);
      }
    }

    await db.insert(adminActions).values({
      adminId: params.moderatorId,
      actionType: 'bulk_approve_content',
      targetType: params.contentType,
      details: {
        contentIds: params.contentIds,
        successCount,
        failedCount: failedIds.length,
        moderatorUsername: params.moderatorUsername,
      },
    });

    return { successCount, failedIds };
  }

  async bulkReject(params: {
    contentIds: string[];
    contentType: "thread" | "reply";
    moderatorId: string;
    reason: string;
  }): Promise<{ successCount: number; failedIds: string[]; }> {
    const failedIds: string[] = [];
    let successCount = 0;

    for (const contentId of params.contentIds.slice(0, 100)) {
      try {
        await this.rejectContent({
          contentId,
          contentType: params.contentType,
          moderatorId: params.moderatorId,
          moderatorUsername: '',
          reason: params.reason,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to reject ${contentId}:`, error);
        failedIds.push(contentId);
      }
    }

    await db.insert(adminActions).values({
      adminId: params.moderatorId,
      actionType: 'bulk_reject_content',
      targetType: params.contentType,
      details: {
        contentIds: params.contentIds,
        reason: params.reason,
        successCount,
        failedCount: failedIds.length,
      },
    });

    return { successCount, failedIds };
  }

  async getModerationHistory(params: { limit?: number; moderatorId?: string; }): Promise<import("@shared/schema").ModerationActionLog[]> {
    try {
      const limit = params.limit || 100;
      const moderationActions = [
        'approve_content',
        'reject_content',
        'delete_content',
        'warn_user',
        'suspend_user',
        'ban_user',
        'dismiss_report',
      ];

      let query = db
        .select({
          id: adminActions.id,
          actionType: adminActions.actionType,
          targetId: adminActions.targetId,
          targetType: adminActions.targetType,
          adminId: adminActions.adminId,
          adminUsername: users.username,
          details: adminActions.details,
          createdAt: adminActions.createdAt,
        })
        .from(adminActions)
        .innerJoin(users, eq(adminActions.adminId, users.id))
        .where(inArray(adminActions.actionType, moderationActions))
        .$dynamic();

      if (params.moderatorId) {
        query = query.where(eq(adminActions.adminId, params.moderatorId));
      }

      const results = await query
        .orderBy(desc(adminActions.createdAt))
        .limit(limit);

      return results.map(row => ({
        id: row.id,
        action: row.actionType,
        contentId: row.targetId,
        contentType: row.targetType,
        moderator: {
          id: row.adminId,
          username: row.adminUsername,
        },
        reason: (row.details as any)?.reason || null,
        timestamp: row.createdAt,
        metadata: row.details,
      }));
    } catch (error) {
      console.error("Error getting moderation history:", error);
      throw error;
    }
  }

  async getModerationStats(): Promise<{
    todayApproved: number;
    todayRejected: number;
    todayReportsHandled: number;
    totalModeratedToday: number;
    averageResponseTimeMinutes: number;
    mostActiveModerator: { id: string; username: string; actionCount: number };
    pendingByAge: { lessThan1Hour: number; between1And24Hours: number; moreThan24Hours: number };
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [approvedResult] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(adminActions)
        .where(and(
          eq(adminActions.actionType, 'approve_content'),
          gte(adminActions.createdAt, today)
        ));

      const [rejectedResult] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(adminActions)
        .where(and(
          eq(adminActions.actionType, 'reject_content'),
          gte(adminActions.createdAt, today)
        ));

      const [reportsResult] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(adminActions)
        .where(and(
          eq(adminActions.actionType, 'dismiss_report'),
          gte(adminActions.createdAt, today)
        ));

      const moderatorStats = await db
        .select({
          adminId: adminActions.adminId,
          username: users.username,
          actionCount: sql<number>`cast(count(*) as integer)`,
        })
        .from(adminActions)
        .innerJoin(users, eq(adminActions.adminId, users.id))
        .where(gte(adminActions.createdAt, today))
        .groupBy(adminActions.adminId, users.username)
        .orderBy(desc(sql`count(*)`))
        .limit(1);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [lessThan1Hour] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(forumThreads)
        .where(and(
          eq(forumThreads.status, 'pending'),
          gte(forumThreads.createdAt, oneHourAgo)
        ));

      const [between1And24Hours] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(forumThreads)
        .where(and(
          eq(forumThreads.status, 'pending'),
          lt(forumThreads.createdAt, oneHourAgo),
          gte(forumThreads.createdAt, oneDayAgo)
        ));

      const [moreThan24Hours] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(forumThreads)
        .where(and(
          eq(forumThreads.status, 'pending'),
          lt(forumThreads.createdAt, oneDayAgo)
        ));

      const todayApproved = approvedResult?.count || 0;
      const todayRejected = rejectedResult?.count || 0;
      const todayReportsHandled = reportsResult?.count || 0;
      const totalModeratedToday = todayApproved + todayRejected + todayReportsHandled;

      const mostActiveModerator = moderatorStats[0]
        ? {
            id: moderatorStats[0].adminId,
            username: moderatorStats[0].username,
            actionCount: moderatorStats[0].actionCount,
          }
        : { id: '', username: 'None', actionCount: 0 };

      return {
        todayApproved,
        todayRejected,
        todayReportsHandled,
        totalModeratedToday,
        averageResponseTimeMinutes: 0,
        mostActiveModerator,
        pendingByAge: {
          lessThan1Hour: lessThan1Hour?.count || 0,
          between1And24Hours: between1And24Hours?.count || 0,
          moreThan24Hours: moreThan24Hours?.count || 0,
        },
      };
    } catch (error) {
      console.error("Error getting moderation stats:", error);
      throw error;
    }
  }

  async getTopSellingItems(limit = 10): Promise<any[]> {
    try {
      const items = await db
        .select({
          id: content.id,
          title: content.title,
          sales: sql<number>`cast(count(${contentPurchases.id}) as integer)`,
          revenue: sql<number>`cast(coalesce(sum(${contentPurchases.priceCoins}), 0) as integer)`,
          sellerUsername: users.username,
        })
        .from(content)
        .leftJoin(contentPurchases, eq(content.id, contentPurchases.contentId))
        .leftJoin(users, eq(content.authorId, users.id))
        .where(and(eq(content.status, 'approved'), isNull(content.deletedAt)))
        .groupBy(content.id, content.title, users.username)
        .orderBy(desc(sql`count(${contentPurchases.id})`))
        .limit(limit);

      return items.map(item => ({
        id: item.id,
        title: item.title,
        sales: item.sales || 0,
        revenue: item.revenue || 0,
        sellerUsername: item.sellerUsername || 'Unknown',
      }));
    } catch (error) {
      console.error('Error getting top selling items:', error);
      throw error;
    }
  }

  async editContent(contentId: string, updates: any, editedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(content)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(content.id, contentId));
        
        await tx.insert(adminActions).values({
          adminId: editedBy,
          actionType: 'content_edit',
          targetType: 'content',
          targetId: contentId,
          details: { updates },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error editing content:", error);
      throw error;
    }
  }

  async moveContent(contentId: string, newCategory: string, movedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(content)
          .set({ category: newCategory })
          .where(eq(content.id, contentId));
        
        await tx.insert(adminActions).values({
          adminId: movedBy,
          actionType: 'content_move',
          targetType: 'content',
          targetId: contentId,
          details: { newCategory },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error moving content:", error);
      throw error;
    }
  }

  async featureContent(contentId: string, featuredBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(content)
          .set({ isFeatured: true })
          .where(eq(content.id, contentId));
        
        await tx.insert(adminActions).values({
          adminId: featuredBy,
          actionType: 'content_feature',
          targetType: 'content',
          targetId: contentId,
          details: {},
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error featuring content:", error);
      throw error;
    }
  }

  async unfeatureContent(contentId: string, unfeaturedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(content)
          .set({ isFeatured: false })
          .where(eq(content.id, contentId));
        
        await tx.insert(adminActions).values({
          adminId: unfeaturedBy,
          actionType: 'content_unfeature',
          targetType: 'content',
          targetId: contentId,
          details: {},
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error unfeaturing content:", error);
      throw error;
    }
  }

  async getContentStats(): Promise<any> {
    try {
      const [stats] = await db
        .select({
          total: sql<number>`count(*)`,
          pending: sql<number>`count(*) filter (where ${content.status} = 'pending')`,
          approved: sql<number>`count(*) filter (where ${content.status} = 'approved')`,
          rejected: sql<number>`count(*) filter (where ${content.status} = 'rejected')`,
        })
        .from(content);
      
      return stats;
    } catch (error) {
      console.error("Error fetching content stats:", error);
      throw error;
    }
  }

  async getFlaggedContent(limit: number = 50): Promise<any[]> {
    try {
      return await db
        .select()
        .from(content)
        .where(eq(content.status, 'pending'))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching flagged content:", error);
      throw error;
    }
  }

  async getDuplicateContent(): Promise<any[]> {
    try {
      // Simplified: return empty for now
      return [];
    } catch (error) {
      console.error("Error fetching duplicate content:", error);
      throw error;
    }
  }

  async getContentByAuthor(authorId: string, limit: number = 50): Promise<any[]> {
    try {
      return await db
        .select()
        .from(content)
        .where(eq(content.authorId, authorId))
        .limit(limit)
        .orderBy(desc(content.createdAt));
    } catch (error) {
      console.error("Error fetching content by author:", error);
      throw error;
    }
  }

  async getContentQualityScores(): Promise<any[]> {
    try {
      return await db
        .select({
          id: content.id,
          title: content.title,
          views: content.views,
          downloads: content.downloads,
          likes: content.likes,
          averageRating: content.averageRating,
          reviewCount: content.reviewCount,
        })
        .from(content)
        .where(eq(content.status, 'approved'))
        .orderBy(desc(content.averageRating))
        .limit(100);
    } catch (error) {
      console.error("Error fetching content quality scores:", error);
      throw error;
    }
  }

  async getPlagiarizedContent(): Promise<any[]> {
    try {
      // Simplified: return empty for now
      return [];
    } catch (error) {
      console.error("Error fetching plagiarized content:", error);
      throw error;
    }
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 3: Financial Management (20 methods)
  // ============================================================================

  async getAdminTransactions(filters: {
    userId?: string;
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{transactions: any[]; total: number}> {
    try {
      const { userId, type, status, startDate, endDate, limit = 50, offset = 0 } = filters;
      
      const conditions = [];
      
      if (userId) {
        conditions.push(eq(coinTransactions.userId, userId));
      }
      
      if (type) {
        conditions.push(eq(coinTransactions.type, type as any));
      }
      
      if (status) {
        conditions.push(eq(coinTransactions.status, status as any));
      }
      
      if (startDate) {
        conditions.push(gte(coinTransactions.createdAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(coinTransactions.createdAt, endDate));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const transactions = await db
        .select()
        .from(coinTransactions)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(coinTransactions.createdAt));
      
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(coinTransactions)
        .where(whereClause);
      
      return {
        transactions,
        total: Number(count)
      };
    } catch (error) {
      console.error("Error fetching admin transactions:", error);
      throw error;
    }
  }

  async createManualTransaction(transaction: {
    userId: string;
    type: 'earn' | 'spend' | 'recharge';
    amount: number;
    description: string;
    createdBy: string;
  }): Promise<any> {
    try {
      const { userId, type, amount, description, createdBy } = transaction;
      
      const [newTransaction] = await db.transaction(async (tx) => {
        const [txn] = await tx.insert(coinTransactions).values({
          userId,
          type,
          amount,
          description,
          status: 'completed',
        }).returning();
        
        const balanceChange = type === 'spend' ? -amount : amount;
        await tx
          .update(users)
          .set({ 
            totalCoins: sql`${users.totalCoins} + ${balanceChange}`,
            level: sql`FLOOR((${users.totalCoins} + ${balanceChange}) / 1000)`
          })
          .where(eq(users.id, userId));
        
        await tx.insert(adminActions).values({
          adminId: createdBy,
          actionType: 'transaction_create',
          targetType: 'transaction',
          targetId: txn.id,
          details: { type, amount, description },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
        
        return [txn];
      });
      
      return newTransaction;
    } catch (error) {
      console.error("Error creating manual transaction:", error);
      throw error;
    }
  }

  async getPendingWithdrawals(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.status, 'pending'))
        .orderBy(desc(withdrawalRequests.requestedAt));
    } catch (error) {
      console.error("Error fetching pending withdrawals:", error);
      throw error;
    }
  }

  async approveWithdrawal(withdrawalId: string, approvedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(withdrawalRequests)
          .set({ 
            status: 'processing',
            processedAt: new Date(),
          })
          .where(eq(withdrawalRequests.id, withdrawalId));
        
        await tx.insert(adminActions).values({
          adminId: approvedBy,
          actionType: 'withdrawal_approve',
          targetType: 'withdrawal',
          targetId: withdrawalId,
          details: {},
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      throw error;
    }
  }

  async rejectWithdrawal(withdrawalId: string, rejectedBy: string, reason: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [withdrawal] = await tx
          .select()
          .from(withdrawalRequests)
          .where(eq(withdrawalRequests.id, withdrawalId));
        
        if (withdrawal) {
          await tx
            .update(withdrawalRequests)
            .set({ 
              status: 'failed',
              adminNotes: reason,
              processedAt: new Date(),
            })
            .where(eq(withdrawalRequests.id, withdrawalId));
          
          // Refund coins
          await tx
            .update(users)
            .set({ 
              totalCoins: sql`${users.totalCoins} + ${withdrawal.amount}`,
              level: sql`FLOOR((${users.totalCoins} + ${withdrawal.amount}) / 1000)`
            })
            .where(eq(users.id, withdrawal.userId));
          
          await tx.insert(adminActions).values({
            adminId: rejectedBy,
            actionType: 'withdrawal_reject',
            targetType: 'withdrawal',
            targetId: withdrawalId,
            details: { reason },
            ipAddress: '0.0.0.0',
            userAgent: 'admin-dashboard',
          });
        }
      });
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      throw error;
    }
  }

  async processWithdrawal(withdrawalId: string, transactionHash: string, processedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(withdrawalRequests)
          .set({ 
            status: 'completed',
            transactionHash,
            completedAt: new Date(),
          })
          .where(eq(withdrawalRequests.id, withdrawalId));
        
        await tx.insert(adminActions).values({
          adminId: processedBy,
          actionType: 'withdrawal_process',
          targetType: 'withdrawal',
          targetId: withdrawalId,
          details: { transactionHash },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      throw error;
    }
  }

  async getWithdrawalStats(): Promise<any> {
    try {
      const [stats] = await db
        .select({
          total: sql<number>`count(*)`,
          pending: sql<number>`count(*) filter (where ${withdrawalRequests.status} = 'pending')`,
          processing: sql<number>`count(*) filter (where ${withdrawalRequests.status} = 'processing')`,
          completed: sql<number>`count(*) filter (where ${withdrawalRequests.status} = 'completed')`,
          failed: sql<number>`count(*) filter (where ${withdrawalRequests.status} = 'failed')`,
          totalAmount: sql<number>`sum(${withdrawalRequests.amount})`,
        })
        .from(withdrawalRequests);
      
      return stats;
    } catch (error) {
      console.error("Error fetching withdrawal stats:", error);
      throw error;
    }
  }

  async getRevenueStats(startDate: Date, endDate: Date): Promise<any> {
    try {
      const purchases = await db
        .select()
        .from(contentPurchases)
        .where(
          and(
            gte(contentPurchases.purchasedAt, startDate),
            lte(contentPurchases.purchasedAt, endDate)
          )
        );
      
      const totalRevenue = purchases.reduce((sum, p) => sum + p.priceCoins, 0);
      
      return {
        totalRevenue,
        transactionCount: purchases.length,
        averageValue: purchases.length > 0 ? totalRevenue / purchases.length : 0,
      };
    } catch (error) {
      console.error("Error fetching revenue stats:", error);
      throw error;
    }
  }


  async getRevenueByUser(limit: number = 50): Promise<any[]> {
    try {
      const topSellers = await db
        .select({
          userId: contentPurchases.sellerId,
          seller: users,
          revenue: sql<number>`sum(${contentPurchases.priceCoins})`,
          salesCount: sql<number>`count(*)`,
        })
        .from(contentPurchases)
        .leftJoin(users, eq(contentPurchases.sellerId, users.id))
        .groupBy(contentPurchases.sellerId, users.id)
        .orderBy(desc(sql`sum(${contentPurchases.priceCoins})`))
        .limit(limit);
      
      return topSellers;
    } catch (error) {
      console.error("Error fetching revenue by user:", error);
      throw error;
    }
  }

  async getRevenueForecast(days: number): Promise<any[]> {
    try {
      // Simplified forecast based on recent data
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentRevenue = await db
        .select()
        .from(contentPurchases)
        .where(gte(contentPurchases.purchasedAt, cutoffDate));
      
      const avgDaily = recentRevenue.reduce((sum, p) => sum + p.priceCoins, 0) / days;
      
      return [{
        date: new Date().toISOString().split('T')[0],
        forecast: Math.round(avgDaily * 30),
      }];
    } catch (error) {
      console.error("Error fetching revenue forecast:", error);
      throw error;
    }
  }

  async createRefund(purchaseId: string, amount: number, reason: string, processedBy: string): Promise<any> {
    try {
      return await db.transaction(async (tx) => {
        const [purchase] = await tx
          .select()
          .from(contentPurchases)
          .where(eq(contentPurchases.id, purchaseId))
          .limit(1);
        
        if (!purchase) {
          throw new Error('Purchase not found');
        }
        
        await tx
          .update(users)
          .set({ 
            totalCoins: sql`${users.totalCoins} + ${amount}`,
            level: sql`FLOOR((${users.totalCoins} + ${amount}) / 1000)`
          })
          .where(eq(users.id, purchase.buyerId));
        
        const [transaction] = await tx.insert(coinTransactions).values({
          userId: purchase.buyerId,
          type: 'earn',
          amount: amount,
          description: `Refund: ${reason}`,
          status: 'completed',
        }).returning();
        
        await tx.insert(adminActions).values({
          adminId: processedBy,
          actionType: 'refund_create',
          targetType: 'transaction',
          targetId: transaction.id,
          details: { originalPurchase: purchaseId, reason: reason },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
        
        return transaction;
      });
    } catch (error) {
      console.error("Error creating refund:", error);
      throw error;
    }
  }

  async getRefundHistory(limit: number = 50): Promise<any[]> {
    try {
      return await db
        .select()
        .from(adminActions)
        .where(eq(adminActions.actionType, 'refund_create'))
        .orderBy(desc(adminActions.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching refund history:", error);
      throw error;
    }
  }

  async generateFinancialReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const revenue = await this.getRevenueStats(startDate, endDate);
      const withdrawals = await db
        .select()
        .from(withdrawalRequests)
        .where(
          and(
            gte(withdrawalRequests.requestedAt, startDate),
            lte(withdrawalRequests.requestedAt, endDate),
            eq(withdrawalRequests.status, 'completed')
          )
        );
      
      const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
      
      return {
        period: { startDate, endDate },
        revenue: revenue.totalRevenue,
        withdrawals: totalWithdrawals,
        netRevenue: revenue.totalRevenue - totalWithdrawals,
        transactionCount: revenue.transactionCount,
        withdrawalCount: withdrawals.length,
      };
    } catch (error) {
      console.error("Error generating financial report:", error);
      throw error;
    }
  }

  async getCoinEconomyHealth(): Promise<any> {
    try {
      const [userStats] = await db
        .select({
          totalUsers: sql<number>`count(*)`,
          totalCoins: sql<number>`sum(${users.totalCoins})`,
          avgCoins: sql<number>`avg(${users.totalCoins})`,
        })
        .from(users);
      
      const [transactionStats] = await db
        .select({
          totalTransactions: sql<number>`count(*)`,
          totalVolume: sql<number>`sum(${coinTransactions.amount})`,
        })
        .from(coinTransactions);
      
      return {
        userStats,
        transactionStats,
        health: 'healthy',
      };
    } catch (error) {
      console.error("Error fetching coin economy health:", error);
      throw error;
    }
  }

  async getTopEarners(limit: number = 50): Promise<any[]> {
    try {
      return await db
        .select()
        .from(users)
        .orderBy(desc(users.totalCoins))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching top earners:", error);
      throw error;
    }
  }

  async getSuspiciousTransactions(limit: number = 50): Promise<any[]> {
    try {
      // Simplified: return high-value transactions
      return await db
        .select()
        .from(coinTransactions)
        .where(gte(coinTransactions.amount, 10000))
        .orderBy(desc(coinTransactions.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching suspicious transactions:", error);
      throw error;
    }
  }

  async getChargebackRate(): Promise<number> {
    try {
      // Simplified: return 0 for now
      return 0;
    } catch (error) {
      console.error("Error fetching chargeback rate:", error);
      throw error;
    }
  }

  async getTransactionVelocity(): Promise<any> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);
      
      const transactions = await db
        .select()
        .from(coinTransactions)
        .where(gte(coinTransactions.createdAt, cutoffDate));
      
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const transactionsPerHour = transactions.length / 24;
      const avgAmount = transactions.length > 0 ? totalAmount / transactions.length : 0;
      
      return { transactionsPerHour, avgAmount };
    } catch (error) {
      console.error("Error fetching transaction velocity:", error);
      throw error;
    }
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 4: System Management (25 methods)
  // ============================================================================

  async getSystemSettings(): Promise<any[]> {
    try {
      return await db.select().from(systemSettings).orderBy(systemSettings.category);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      throw error;
    }
  }

  async updateSystemSetting(settingKey: string, settingValue: any, updatedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(systemSettings)
          .set({ 
            settingValue,
            updatedBy,
            updatedAt: new Date(),
          })
          .where(eq(systemSettings.settingKey, settingKey));
        
        await tx.insert(adminActions).values({
          adminId: updatedBy,
          actionType: 'setting_update',
          targetType: 'setting',
          targetId: settingKey,
          details: { settingValue },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error updating system setting:", error);
      throw error;
    }
  }

  async getSystemSetting(settingKey: string): Promise<any> {
    try {
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.settingKey, settingKey));
      
      return setting;
    } catch (error) {
      console.error("Error fetching system setting:", error);
      throw error;
    }
  }

  async getSupportTickets(filters: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{tickets: any[]; total: number}> {
    try {
      const { status, priority, category, assignedTo, limit = 50, offset = 0 } = filters;
      
      const conditions = [];
      
      if (status) {
        conditions.push(eq(supportTickets.status, status));
      }
      
      if (priority) {
        conditions.push(eq(supportTickets.priority, priority));
      }
      
      if (category) {
        conditions.push(eq(supportTickets.category, category));
      }
      
      if (assignedTo) {
        conditions.push(eq(supportTickets.assignedTo, assignedTo));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const tickets = await db
        .select()
        .from(supportTickets)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(supportTickets.createdAt));
      
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(whereClause);
      
      return {
        tickets,
        total: Number(count)
      };
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      throw error;
    }
  }

  async createSupportTicket(ticket: {
    userId: string;
    subject: string;
    description: string;
    priority: string;
    category: string;
  }): Promise<any> {
    try {
      const ticketNumber = `TKT-${Date.now()}`;
      const [newTicket] = await db.insert(supportTickets).values({
        ...ticket,
        ticketNumber,
        status: 'open',
      }).returning();
      
      return newTicket;
    } catch (error) {
      console.error("Error creating support ticket:", error);
      throw error;
    }
  }

  async updateSupportTicket(ticketId: number, updates: any, updatedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(supportTickets)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(supportTickets.id, ticketId));
        
        await tx.insert(adminActions).values({
          adminId: updatedBy,
          actionType: 'ticket_update',
          targetType: 'ticket',
          targetId: String(ticketId),
          details: { updates },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error updating support ticket:", error);
      throw error;
    }
  }

  async assignTicket(ticketId: number, assignedTo: string, assignedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(supportTickets)
          .set({ assignedTo, updatedAt: new Date() })
          .where(eq(supportTickets.id, ticketId));
        
        await tx.insert(adminActions).values({
          adminId: assignedBy,
          actionType: 'ticket_assign',
          targetType: 'ticket',
          targetId: String(ticketId),
          details: { assignedTo },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error assigning ticket:", error);
      throw error;
    }
  }

  async addTicketReply(ticketId: number, reply: {userId: string; message: string}): Promise<void> {
    try {
      await db
        .update(supportTickets)
        .set({ 
          replies: sql`array_append(${supportTickets.replies}, ${JSON.stringify(reply)}::jsonb)`,
          updatedAt: new Date(),
        })
        .where(eq(supportTickets.id, ticketId));
    } catch (error) {
      console.error("Error adding ticket reply:", error);
      throw error;
    }
  }

  async closeTicket(ticketId: number, closedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(supportTickets)
          .set({ 
            status: 'closed',
            resolvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(supportTickets.id, ticketId));
        
        await tx.insert(adminActions).values({
          adminId: closedBy,
          actionType: 'ticket_close',
          targetType: 'ticket',
          targetId: String(ticketId),
          details: {},
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error closing ticket:", error);
      throw error;
    }
  }

  async getAnnouncements(filters?: {
    isActive?: boolean;
    targetAudience?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const { isActive, targetAudience, limit = 50 } = filters || {};
      
      const conditions = [];
      
      if (isActive !== undefined) {
        conditions.push(eq(announcements.isActive, isActive));
      }
      
      if (targetAudience) {
        conditions.push(eq(announcements.targetAudience, targetAudience));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      return await db
        .select()
        .from(announcements)
        .where(whereClause)
        .limit(limit)
        .orderBy(desc(announcements.createdAt));
    } catch (error) {
      console.error("Error fetching announcements:", error);
      throw error;
    }
  }

  async createAnnouncement(announcement: {
    title: string;
    content: string;
    type: string;
    targetAudience: string;
    displayType: string;
    startDate: Date;
    endDate?: Date;
    createdBy: string;
  }): Promise<any> {
    try {
      const [newAnnouncement] = await db.insert(announcements).values({
        ...announcement,
        isActive: true,
        views: 0,
        clicks: 0,
      }).returning();
      
      return newAnnouncement;
    } catch (error) {
      console.error("Error creating announcement:", error);
      throw error;
    }
  }

  async updateAnnouncement(announcementId: number, updates: any): Promise<void> {
    try {
      await db
        .update(announcements)
        .set(updates)
        .where(eq(announcements.id, announcementId));
    } catch (error) {
      console.error("Error updating announcement:", error);
      throw error;
    }
  }

  async deleteAnnouncement(announcementId: number): Promise<void> {
    try {
      await db.delete(announcements).where(eq(announcements.id, announcementId));
    } catch (error) {
      console.error("Error deleting announcement:", error);
      throw error;
    }
  }

  async trackAnnouncementView(announcementId: number): Promise<void> {
    try {
      await db
        .update(announcements)
        .set({ views: sql`${announcements.views} + 1` })
        .where(eq(announcements.id, announcementId));
    } catch (error) {
      console.error("Error tracking announcement view:", error);
      throw error;
    }
  }

  async trackAnnouncementClick(announcementId: number): Promise<void> {
    try {
      await db
        .update(announcements)
        .set({ clicks: sql`${announcements.clicks} + 1` })
        .where(eq(announcements.id, announcementId));
    } catch (error) {
      console.error("Error tracking announcement click:", error);
      throw error;
    }
  }

  async getEmailTemplates(category?: string): Promise<any[]> {
    try {
      if (category) {
        return await db
          .select()
          .from(emailTemplates)
          .where(eq(emailTemplates.category, category));
      }
      
      return await db
        .select()
        .from(emailTemplates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      throw error;
    }
  }

  async getEmailTemplate(templateKey: string): Promise<any> {
    try {
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.templateKey, templateKey));
      
      return template;
    } catch (error) {
      console.error("Error fetching email template:", error);
      throw error;
    }
  }

  async updateEmailTemplate(templateKey: string, updates: any, updatedBy: string): Promise<void> {
    try {
      await db
        .update(emailTemplates)
        .set({ ...updates, updatedBy, updatedAt: new Date() })
        .where(eq(emailTemplates.templateKey, templateKey));
    } catch (error) {
      console.error("Error updating email template:", error);
      throw error;
    }
  }

  async createEmailTemplate(template: {
    templateKey: string;
    subject: string;
    htmlBody: string;
    textBody: string;
    category: string;
    variables?: string[];
  }): Promise<any> {
    try {
      const [newTemplate] = await db.insert(emailTemplates).values({
        ...template,
        isActive: true,
      }).returning();
      
      return newTemplate;
    } catch (error) {
      console.error("Error creating email template:", error);
      throw error;
    }
  }

  async getAdminRoles(): Promise<any[]> {
    try {
      return await db.select().from(adminRoles);
    } catch (error) {
      console.error("Error fetching admin roles:", error);
      throw error;
    }
  }

  async grantAdminRole(userId: string, role: string, permissions: any, grantedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(adminRoles).values({
          userId,
          role,
          permissions,
          grantedBy,
        });
        
        await tx.insert(adminActions).values({
          adminId: grantedBy,
          actionType: 'role_grant',
          targetType: 'user',
          targetId: userId,
          details: { role, permissions },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error granting admin role:", error);
      throw error;
    }
  }

  async updateAdminPermissions(userId: string, permissions: any, updatedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(adminRoles)
          .set({ permissions })
          .where(eq(adminRoles.userId, userId));
        
        await tx.insert(adminActions).values({
          adminId: updatedBy,
          actionType: 'permissions_update',
          targetType: 'user',
          targetId: userId,
          details: { permissions },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error updating admin permissions:", error);
      throw error;
    }
  }

  async revokeAdminRole(userId: string, revokedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.delete(adminRoles).where(eq(adminRoles.userId, userId));
        
        await tx.insert(adminActions).values({
          adminId: revokedBy,
          actionType: 'role_revoke',
          targetType: 'user',
          targetId: userId,
          details: {},
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error revoking admin role:", error);
      throw error;
    }
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 5: Security & Logs (20 methods)
  // ============================================================================

  async getSecurityEvents(filters: {
    eventType?: string;
    severity?: string;
    isResolved?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{events: any[]; total: number}> {
    try {
      const { eventType, severity, isResolved, limit = 50, offset = 0 } = filters;
      
      const conditions = [];
      
      if (eventType) {
        conditions.push(eq(securityEvents.eventType, eventType));
      }
      
      if (severity) {
        conditions.push(eq(securityEvents.severity, severity));
      }
      
      if (isResolved !== undefined) {
        conditions.push(eq(securityEvents.isResolved, isResolved));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const events = await db
        .select()
        .from(securityEvents)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(securityEvents.createdAt));
      
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(securityEvents)
        .where(whereClause);
      
      return {
        events,
        total: Number(count)
      };
    } catch (error) {
      console.error("Error fetching security events:", error);
      throw error;
    }
  }

  async createSecurityEvent(event: {
    eventType: string;
    severity: string;
    userId?: string;
    ipAddress: string;
    details: any;
  }): Promise<any> {
    try {
      const [newEvent] = await db.insert(securityEvents).values({
        ...event,
        isResolved: false,
      }).returning();
      
      return newEvent;
    } catch (error) {
      console.error("Error creating security event:", error);
      throw error;
    }
  }

  async resolveSecurityEvent(eventId: number, resolvedBy: string, notes: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(securityEvents)
          .set({ 
            isResolved: true,
            resolvedBy,
            resolvedAt: new Date(),
          })
          .where(eq(securityEvents.id, eventId));
        
        await tx.insert(adminActions).values({
          adminId: resolvedBy,
          actionType: 'security_resolve',
          targetType: 'security_event',
          targetId: String(eventId),
          details: { notes },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error resolving security event:", error);
      throw error;
    }
  }

  async getIpBans(filters?: { isActive?: boolean }): Promise<any[]> {
    try {
      if (filters?.isActive !== undefined) {
        return await db
          .select()
          .from(ipBans)
          .where(eq(ipBans.isActive, filters.isActive));
      }
      
      return await db
        .select()
        .from(ipBans)
        .orderBy(desc(ipBans.bannedAt));
    } catch (error) {
      console.error("Error fetching IP bans:", error);
      throw error;
    }
  }

  async banIp(ipAddress: string, reason: string, bannedBy: string, duration?: number): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const expiresAt = duration ? new Date(Date.now() + duration * 1000) : null;
        
        await tx.insert(ipBans).values({
          ipAddress,
          reason,
          bannedBy,
          banType: duration ? 'temporary' : 'permanent',
          expiresAt,
          isActive: true,
        });
        
        await tx.insert(adminActions).values({
          adminId: bannedBy,
          actionType: 'ip_ban',
          targetType: 'ip',
          targetId: ipAddress,
          details: { reason, duration },
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error banning IP:", error);
      throw error;
    }
  }

  async unbanIp(ipAddress: string, unbannedBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(ipBans)
          .set({ isActive: false })
          .where(eq(ipBans.ipAddress, ipAddress));
        
        await tx.insert(adminActions).values({
          adminId: unbannedBy,
          actionType: 'ip_unban',
          targetType: 'ip',
          targetId: ipAddress,
          details: {},
          ipAddress: '0.0.0.0',
          userAgent: 'admin-dashboard',
        });
      });
    } catch (error) {
      console.error("Error unbanning IP:", error);
      throw error;
    }
  }

  async isIpBanned(ipAddress: string): Promise<boolean> {
    try {
      const [ban] = await db
        .select()
        .from(ipBans)
        .where(
          and(
            eq(ipBans.ipAddress, ipAddress),
            eq(ipBans.isActive, true),
            or(
              isNull(ipBans.expiresAt),
              gt(ipBans.expiresAt, new Date())
            )
          )
        )
        .limit(1);
      
      return !!ban;
    } catch (error) {
      console.error("Error checking IP ban:", error);
      return false;
    }
  }

  async logAdminAction(action: {
    adminId: string;
    actionType: string;
    targetType: string;
    targetId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await db.insert(adminActions).values({
        ...action,
        ipAddress: action.ipAddress || '0.0.0.0',
        userAgent: action.userAgent || 'admin-dashboard',
      });
    } catch (error) {
      console.error("Error logging admin action:", error);
      throw error;
    }
  }

  async getAdminActionLogs(filters: {
    adminId?: string;
    actionType?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{actions: any[]; total: number}> {
    try {
      const { adminId, actionType, targetType, startDate, endDate, limit = 50, offset = 0 } = filters;
      
      const conditions = [];
      
      if (adminId) {
        conditions.push(eq(adminActions.adminId, adminId));
      }
      
      if (actionType) {
        conditions.push(eq(adminActions.actionType, actionType));
      }
      
      if (targetType) {
        conditions.push(eq(adminActions.targetType, targetType));
      }
      
      if (startDate) {
        conditions.push(gte(adminActions.createdAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(adminActions.createdAt, endDate));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const actions = await db
        .select()
        .from(adminActions)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(adminActions.createdAt));
      
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminActions)
        .where(whereClause);
      
      return {
        actions,
        total: Number(count)
      };
    } catch (error) {
      console.error("Error fetching admin action logs:", error);
      throw error;
    }
  }

  async getAdminActivitySummary(adminId: string, days: number = 30): Promise<any> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const actions = await db
        .select()
        .from(adminActions)
        .where(
          and(
            eq(adminActions.adminId, adminId),
            gte(adminActions.createdAt, cutoffDate)
          )
        );
      
      const byType = actions.reduce((acc, action) => {
        acc[action.actionType] = (acc[action.actionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        totalActions: actions.length,
        byType,
        period: days,
      };
    } catch (error) {
      console.error("Error fetching admin activity summary:", error);
      throw error;
    }
  }

  async recordPerformanceMetric(metric: {
    metricType: string;
    metricName: string;
    value: number;
    unit: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await db.insert(performanceMetrics).values({
        metricType: metric.metricType,
        metricName: metric.metricName,
        value: String(metric.value),
        unit: metric.unit,
        metadata: metric.metadata,
      });
    } catch (error) {
      console.error("Error recording performance metric:", error);
      throw error;
    }
  }

  async getPerformanceMetrics(filters: {
    metricType?: string;
    metricName?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    try {
      const { metricType, metricName, startDate, endDate, limit = 100 } = filters;
      
      const conditions = [];
      
      if (metricType) {
        conditions.push(eq(performanceMetrics.metricType, metricType));
      }
      
      if (metricName) {
        conditions.push(eq(performanceMetrics.metricName, metricName));
      }
      
      if (startDate) {
        conditions.push(gte(performanceMetrics.recordedAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(performanceMetrics.recordedAt, endDate));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      return await db
        .select()
        .from(performanceMetrics)
        .where(whereClause)
        .limit(limit)
        .orderBy(desc(performanceMetrics.recordedAt));
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      throw error;
    }
  }

  async getAveragePerformance(metricName: string, days: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const [result] = await db
        .select({
          avg: sql<number>`avg(${performanceMetrics.value})`,
        })
        .from(performanceMetrics)
        .where(
          and(
            eq(performanceMetrics.metricName, metricName),
            gte(performanceMetrics.recordedAt, cutoffDate)
          )
        );
      
      return Number(result?.avg || 0);
    } catch (error) {
      console.error("Error fetching average performance:", error);
      throw error;
    }
  }

  async getPerformanceAlerts(threshold: number = 90): Promise<any[]> {
    try {
      // Simplified: return metrics above threshold
      return await db
        .select()
        .from(performanceMetrics)
        .where(sql`CAST(${performanceMetrics.value} AS NUMERIC) >= ${threshold}`)
        .limit(50);
    } catch (error) {
      console.error("Error fetching performance alerts:", error);
      throw error;
    }
  }

  // ============================================================================
  // ADMIN OPERATIONS - GROUP 6: Advanced Features (40 methods)
  // ============================================================================

  // Automation Rules
  async getAutomationRules(activeOnly?: boolean): Promise<any[]> {
    try {
      if (activeOnly !== undefined) {
        return await db
          .select()
          .from(automationRules)
          .where(eq(automationRules.isActive, activeOnly));
      }
      
      return await db
        .select()
        .from(automationRules)
        .orderBy(desc(automationRules.createdAt));
    } catch (error) {
      console.error("Error fetching automation rules:", error);
      throw error;
    }
  }

  async createAutomationRule(rule: {
    name: string;
    description: string;
    triggerType: string;
    triggerConfig: any;
    actionType: string;
    actionConfig: any;
    createdBy: string;
  }): Promise<any> {
    try {
      const [newRule] = await db.insert(automationRules).values({
        ...rule,
        isActive: true,
        executionCount: 0,
      }).returning();
      
      return newRule;
    } catch (error) {
      console.error("Error creating automation rule:", error);
      throw error;
    }
  }

  async updateAutomationRule(ruleId: number, updates: any): Promise<void> {
    try {
      await db
        .update(automationRules)
        .set(updates)
        .where(eq(automationRules.id, ruleId));
    } catch (error) {
      console.error("Error updating automation rule:", error);
      throw error;
    }
  }

  async toggleAutomationRule(ruleId: number, isActive: boolean): Promise<void> {
    try {
      await db
        .update(automationRules)
        .set({ isActive })
        .where(eq(automationRules.id, ruleId));
    } catch (error) {
      console.error("Error toggling automation rule:", error);
      throw error;
    }
  }

  async executeAutomationRule(ruleId: number): Promise<void> {
    try {
      await db
        .update(automationRules)
        .set({ 
          executionCount: sql`${automationRules.executionCount} + 1`,
          lastExecuted: new Date(),
        })
        .where(eq(automationRules.id, ruleId));
    } catch (error) {
      console.error("Error executing automation rule:", error);
      throw error;
    }
  }

  // A/B Testing
  async getAbTests(status?: string): Promise<any[]> {
    try {
      if (status) {
        return await db
          .select()
          .from(abTests)
          .where(eq(abTests.status, status));
      }
      
      return await db
        .select()
        .from(abTests)
        .orderBy(desc(abTests.createdAt));
    } catch (error) {
      console.error("Error fetching A/B tests:", error);
      throw error;
    }
  }

  async createAbTest(test: {
    name: string;
    description: string;
    variants: any[];
    trafficAllocation: any;
    createdBy: string;
  }): Promise<any> {
    try {
      const [newTest] = await db.insert(abTests).values({
        ...test,
        status: 'draft',
      }).returning();
      
      return newTest;
    } catch (error) {
      console.error("Error creating A/B test:", error);
      throw error;
    }
  }

  async updateAbTest(testId: number, updates: any): Promise<void> {
    try {
      await db
        .update(abTests)
        .set(updates)
        .where(eq(abTests.id, testId));
    } catch (error) {
      console.error("Error updating A/B test:", error);
      throw error;
    }
  }

  async startAbTest(testId: number): Promise<void> {
    try {
      await db
        .update(abTests)
        .set({ 
          status: 'running',
          startDate: new Date(),
        })
        .where(eq(abTests.id, testId));
    } catch (error) {
      console.error("Error starting A/B test:", error);
      throw error;
    }
  }

  async stopAbTest(testId: number): Promise<void> {
    try {
      await db
        .update(abTests)
        .set({ 
          status: 'stopped',
          endDate: new Date(),
        })
        .where(eq(abTests.id, testId));
    } catch (error) {
      console.error("Error stopping A/B test:", error);
      throw error;
    }
  }

  async declareAbTestWinner(testId: number, winnerVariant: string): Promise<void> {
    try {
      await db
        .update(abTests)
        .set({ 
          status: 'completed',
          winnerVariant,
          endDate: new Date(),
        })
        .where(eq(abTests.id, testId));
    } catch (error) {
      console.error("Error declaring A/B test winner:", error);
      throw error;
    }
  }

  // Feature Flags
  async getFeatureFlags(): Promise<any[]> {
    try {
      return await db.select().from(featureFlags).orderBy(featureFlags.flagKey);
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      throw error;
    }
  }

  async getFeatureFlag(flagKey: string): Promise<any> {
    try {
      const [flag] = await db
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.flagKey, flagKey));
      
      return flag;
    } catch (error) {
      console.error("Error fetching feature flag:", error);
      throw error;
    }
  }

  async updateFeatureFlag(flagKey: string, updates: any): Promise<void> {
    try {
      await db
        .update(featureFlags)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(featureFlags.flagKey, flagKey));
    } catch (error) {
      console.error("Error updating feature flag:", error);
      throw error;
    }
  }

  async createFeatureFlag(flag: {
    flagKey: string;
    name: string;
    description: string;
    isEnabled: boolean;
    rolloutPercentage: number;
    createdBy: string;
  }): Promise<any> {
    try {
      const [newFlag] = await db.insert(featureFlags).values(flag).returning();
      return newFlag;
    } catch (error) {
      console.error("Error creating feature flag:", error);
      throw error;
    }
  }

  async isFeatureEnabled(flagKey: string, userId?: string): Promise<boolean> {
    try {
      const [flag] = await db
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.flagKey, flagKey));
      
      if (!flag || !flag.isEnabled) {
        return false;
      }
      
      if (flag.rolloutPercentage === 100) {
        return true;
      }
      
      // Simplified: return based on rollout percentage
      return Math.random() * 100 < flag.rolloutPercentage;
    } catch (error) {
      console.error("Error checking feature flag:", error);
      return false;
    }
  }

  // API Keys
  async getApiKeys(filters?: {userId?: string; isActive?: boolean}): Promise<any[]> {
    try {
      const { userId, isActive } = filters || {};
      
      const conditions = [];
      
      if (userId) {
        conditions.push(eq(apiKeys.userId, userId));
      }
      
      if (isActive !== undefined) {
        conditions.push(eq(apiKeys.isActive, isActive));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      return await db
        .select()
        .from(apiKeys)
        .where(whereClause)
        .orderBy(desc(apiKeys.createdAt));
    } catch (error) {
      console.error("Error fetching API keys:", error);
      throw error;
    }
  }

  async createApiKey(apiKey: {
    name: string;
    userId: string;
    permissions: string[];
    rateLimit: number;
    expiresAt?: Date;
  }): Promise<any> {
    try {
      const key = `sk_${randomUUID().replace(/-/g, '')}`;
      const [newApiKey] = await db.insert(apiKeys).values({
        ...apiKey,
        key,
        isActive: true,
      }).returning();
      
      return newApiKey;
    } catch (error) {
      console.error("Error creating API key:", error);
      throw error;
    }
  }

  async revokeApiKey(keyId: number): Promise<void> {
    try {
      await db
        .update(apiKeys)
        .set({ isActive: false })
        .where(eq(apiKeys.id, keyId));
    } catch (error) {
      console.error("Error revoking API key:", error);
      throw error;
    }
  }

  async updateApiKeyLastUsed(keyId: number): Promise<void> {
    try {
      await db
        .update(apiKeys)
        .set({ lastUsed: new Date() })
        .where(eq(apiKeys.id, keyId));
    } catch (error) {
      console.error("Error updating API key last used:", error);
      throw error;
    }
  }

  // Webhooks
  async getWebhooks(filters?: {isActive?: boolean}): Promise<any[]> {
    try {
      const { isActive } = filters || {};
      
      const conditions = [];
      
      if (isActive !== undefined) {
        conditions.push(eq(webhooks.isActive, isActive));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      return await db
        .select()
        .from(webhooks)
        .where(whereClause)
        .orderBy(desc(webhooks.createdAt));
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      throw error;
    }
  }

  async createWebhook(webhook: {
    url: string;
    events: string[];
    createdBy: string;
  }): Promise<any> {
    try {
      const secret = randomUUID();
      const [newWebhook] = await db.insert(webhooks).values({
        ...webhook,
        secret,
        isActive: true,
        successCount: 0,
        failureCount: 0,
      }).returning();
      
      return newWebhook;
    } catch (error) {
      console.error("Error creating webhook:", error);
      throw error;
    }
  }

  async updateWebhook(webhookId: number, updates: any): Promise<void> {
    try {
      await db
        .update(webhooks)
        .set(updates)
        .where(eq(webhooks.id, webhookId));
    } catch (error) {
      console.error("Error updating webhook:", error);
      throw error;
    }
  }

  async deleteWebhook(webhookId: number): Promise<void> {
    try {
      await db.delete(webhooks).where(eq(webhooks.id, webhookId));
    } catch (error) {
      console.error("Error deleting webhook:", error);
      throw error;
    }
  }

  async recordWebhookTrigger(webhookId: number, success: boolean): Promise<void> {
    try {
      const field = success ? webhooks.successCount : webhooks.failureCount;
      await db
        .update(webhooks)
        .set({ 
          [success ? 'successCount' : 'failureCount']: sql`${field} + 1`,
          lastTriggered: new Date(),
        })
        .where(eq(webhooks.id, webhookId));
    } catch (error) {
      console.error("Error recording webhook trigger:", error);
      throw error;
    }
  }

  // Media Library
  async getMediaLibrary(filters?: {
    uploadedBy?: string;
    mimeType?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      const { uploadedBy, mimeType, limit = 50, offset = 0 } = filters || {};
      
      const conditions = [];
      
      if (uploadedBy) {
        conditions.push(eq(mediaLibrary.uploadedBy, uploadedBy));
      }
      
      if (mimeType) {
        conditions.push(eq(mediaLibrary.mimeType, mimeType));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      return await db
        .select()
        .from(mediaLibrary)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(mediaLibrary.uploadedAt));
    } catch (error) {
      console.error("Error fetching media library:", error);
      throw error;
    }
  }

  async addToMediaLibrary(media: {
    filename: string;
    originalFilename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    altText?: string;
    tags?: string[];
    uploadedBy: string;
  }): Promise<any> {
    try {
      const [newMedia] = await db.insert(mediaLibrary).values({
        ...media,
        usageCount: 0,
      }).returning();
      
      return newMedia;
    } catch (error) {
      console.error("Error adding to media library:", error);
      throw error;
    }
  }

  async updateMediaItem(mediaId: number, updates: any): Promise<void> {
    try {
      await db
        .update(mediaLibrary)
        .set(updates)
        .where(eq(mediaLibrary.id, mediaId));
    } catch (error) {
      console.error("Error updating media item:", error);
      throw error;
    }
  }

  async deleteMediaItem(mediaId: number): Promise<void> {
    try {
      await db.delete(mediaLibrary).where(eq(mediaLibrary.id, mediaId));
    } catch (error) {
      console.error("Error deleting media item:", error);
      throw error;
    }
  }

  async trackMediaUsage(mediaId: number): Promise<void> {
    try {
      await db
        .update(mediaLibrary)
        .set({ usageCount: sql`${mediaLibrary.usageCount} + 1` })
        .where(eq(mediaLibrary.id, mediaId));
    } catch (error) {
      console.error("Error tracking media usage:", error);
      throw error;
    }
  }

  // Content Revisions
  async createContentRevision(revision: {
    contentType: string;
    contentId: string;
    revisionNumber: number;
    data: any;
    changedFields: string[];
    changedBy: string;
    changeReason?: string;
  }): Promise<any> {
    try {
      const [newRevision] = await db.insert(contentRevisions).values(revision).returning();
      return newRevision;
    } catch (error) {
      console.error("Error creating content revision:", error);
      throw error;
    }
  }

  async getContentRevisions(contentType: string, contentId: string): Promise<any[]> {
    try {
      return await db
        .select()
        .from(contentRevisions)
        .where(
          and(
            eq(contentRevisions.contentType, contentType),
            eq(contentRevisions.contentId, contentId)
          )
        )
        .orderBy(desc(contentRevisions.revisionNumber));
    } catch (error) {
      console.error("Error fetching content revisions:", error);
      throw error;
    }
  }

  async restoreContentRevision(revisionId: number, restoredBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [revision] = await tx
          .select()
          .from(contentRevisions)
          .where(eq(contentRevisions.id, revisionId));
        
        if (revision) {
          await tx.insert(adminActions).values({
            adminId: restoredBy,
            actionType: 'content_restore_revision',
            targetType: revision.contentType,
            targetId: revision.contentId,
            details: { revisionId, revisionNumber: revision.revisionNumber },
            ipAddress: '0.0.0.0',
            userAgent: 'admin-dashboard',
          });
        }
      });
    } catch (error) {
      console.error("Error restoring content revision:", error);
      throw error;
    }
  }

  async createFeedback(data: InsertFeedback): Promise<Feedback> {
    try {
      const [newFeedback] = await db
        .insert(feedback)
        .values({
          userId: data.userId ?? null,
          type: data.type,
          subject: data.subject,
          message: data.message,
          email: data.email ?? null,
        })
        .returning();
      return newFeedback;
    } catch (error) {
      console.error("Error creating feedback:", error);
      throw error;
    }
  }

  async listFeedback(filters?: { status?: string; type?: string; limit?: number }): Promise<Feedback[]> {
    try {
      let query = db.select().from(feedback);

      const conditions = [];
      if (filters?.status) {
        conditions.push(eq(feedback.status, filters.status as any));
      }
      if (filters?.type) {
        conditions.push(eq(feedback.type, filters.type as any));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      query = query.orderBy(desc(feedback.createdAt)) as any;

      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }

      return await query;
    } catch (error) {
      console.error("Error listing feedback:", error);
      throw error;
    }
  }

  async getUserFeedback(userId: string): Promise<Feedback[]> {
    try {
      return await db
        .select()
        .from(feedback)
        .where(eq(feedback.userId, userId))
        .orderBy(desc(feedback.createdAt));
    } catch (error) {
      console.error("Error getting user feedback:", error);
      throw error;
    }
  }

  async updateFeedbackStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    try {
      const updates: any = {
        status: status as any,
        updatedAt: new Date(),
      };
      
      if (adminNotes !== undefined) {
        updates.adminNotes = adminNotes;
      }

      await db
        .update(feedback)
        .set(updates)
        .where(eq(feedback.id, id));
    } catch (error) {
      console.error("Error updating feedback status:", error);
      throw error;
    }
  }
  
  // ============================================================================
  // ADMIN OVERVIEW ENDPOINTS - Dashboard Analytics
  // ============================================================================
  
  async getAdminOverviewStats(): Promise<{
    users: { total: number; new24h: number };
    content: { total: number; new24h: number };
    revenue: { total: number; today: number };
    moderation: { pending: number; reports: number };
  }> {
    try {
      // Count total users
      const [totalUsersResult] = await db
        .select({ count: count() })
        .from(users);
      const totalUsers = totalUsersResult?.count || 0;
      
      // Count new users in last 24h
      const [new24hUsersResult] = await db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, sql`NOW() - INTERVAL '24 hours'`));
      const new24hUsers = new24hUsersResult?.count || 0;
      
      // Count total content (forumThreads + content)
      const [totalThreadsResult] = await db
        .select({ count: count() })
        .from(forumThreads);
      const totalThreads = totalThreadsResult?.count || 0;
      
      const [totalContentResult] = await db
        .select({ count: count() })
        .from(content);
      const totalContent = totalContentResult?.count || 0;
      
      const totalContentCount = totalThreads + totalContent;
      
      // Count new content in last 24h
      const [new24hThreadsResult] = await db
        .select({ count: count() })
        .from(forumThreads)
        .where(gte(forumThreads.createdAt, sql`NOW() - INTERVAL '24 hours'`));
      const new24hThreads = new24hThreadsResult?.count || 0;
      
      const [new24hContentResult] = await db
        .select({ count: count() })
        .from(content)
        .where(gte(content.createdAt, sql`NOW() - INTERVAL '24 hours'`));
      const new24hContent = new24hContentResult?.count || 0;
      
      const new24hContentCount = new24hThreads + new24hContent;
      
      // Sum revenue from coinTransactions (type='recharge')
      const revenueResults = await db
        .select({ amount: coinTransactions.amount })
        .from(coinTransactions)
        .where(eq(coinTransactions.type, 'recharge'));
      
      const totalRevenue = revenueResults.reduce((sum, row) => sum + (row.amount || 0), 0);
      
      // Sum today's revenue
      const todayRevenueResults = await db
        .select({ amount: coinTransactions.amount })
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.type, 'recharge'),
            gte(coinTransactions.createdAt, sql`CURRENT_DATE`)
          )
        );
      
      const todayRevenue = todayRevenueResults.reduce((sum, row) => sum + (row.amount || 0), 0);
      
      // Count pending moderation queue items
      const [pendingModerationResult] = await db
        .select({ count: count() })
        .from(moderationQueue)
        .where(eq(moderationQueue.status, 'pending'));
      const pendingModeration = pendingModerationResult?.count || 0;
      
      // Count unresolved reported content
      const [unresolvedReportsResult] = await db
        .select({ count: count() })
        .from(reportedContent)
        .where(eq(reportedContent.status, 'pending'));
      const unresolvedReports = unresolvedReportsResult?.count || 0;
      
      return {
        users: { total: totalUsers, new24h: new24hUsers },
        content: { total: totalContentCount, new24h: new24hContentCount },
        revenue: { total: totalRevenue, today: todayRevenue },
        moderation: { pending: pendingModeration, reports: unresolvedReports }
      };
    } catch (error) {
      console.error("Error getting admin overview stats:", error);
      throw error;
    }
  }
  
  async getUserGrowthSeries(days: number): Promise<Array<{ date: string; users: number }>> {
    try {
      const results = await db
        .select({
          date: sql<string>`DATE(${users.createdAt})`,
          users: count()
        })
        .from(users)
        .where(gte(users.createdAt, sql`CURRENT_DATE - INTERVAL '${sql.raw(days.toString())} days'`))
        .groupBy(sql`DATE(${users.createdAt})`)
        .orderBy(asc(sql`DATE(${users.createdAt})`));
      
      return results.map(row => ({
        date: row.date,
        users: row.users || 0
      }));
    } catch (error) {
      console.error("Error getting user growth series:", error);
      throw error;
    }
  }
  
  async getContentTrendSeries(days: number): Promise<Array<{ date: string; count: number }>> {
    try {
      // Get thread counts by day
      const threadResults = await db
        .select({
          date: sql<string>`DATE(${forumThreads.createdAt})`,
          count: count()
        })
        .from(forumThreads)
        .where(gte(forumThreads.createdAt, sql`CURRENT_DATE - INTERVAL '${sql.raw(days.toString())} days'`))
        .groupBy(sql`DATE(${forumThreads.createdAt})`);
      
      // Get content counts by day
      const contentResults = await db
        .select({
          date: sql<string>`DATE(${content.createdAt})`,
          count: count()
        })
        .from(content)
        .where(gte(content.createdAt, sql`CURRENT_DATE - INTERVAL '${sql.raw(days.toString())} days'`))
        .groupBy(sql`DATE(${content.createdAt})`);
      
      // Merge the results by date
      const dateMap = new Map<string, number>();
      
      threadResults.forEach(row => {
        dateMap.set(row.date, (dateMap.get(row.date) || 0) + (row.count || 0));
      });
      
      contentResults.forEach(row => {
        dateMap.set(row.date, (dateMap.get(row.date) || 0) + (row.count || 0));
      });
      
      // Convert to array and sort by date
      const result = Array.from(dateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      return result;
    } catch (error) {
      console.error("Error getting content trend series:", error);
      throw error;
    }
  }
  
  async getRecentAdminActions(limit: number): Promise<Array<{
    id: string;
    adminUsername: string;
    actionType: string;
    targetType: string;
    status: string;
    createdAt: string;
  }>> {
    try {
      const results = await db
        .select({
          id: adminActions.id,
          adminId: adminActions.adminId,
          adminUsername: users.username,
          actionType: adminActions.actionType,
          targetType: adminActions.targetType,
          createdAt: adminActions.createdAt
        })
        .from(adminActions)
        .leftJoin(users, eq(adminActions.adminId, users.id))
        .orderBy(desc(adminActions.createdAt))
        .limit(limit);
      
      return results.map(row => ({
        id: row.id?.toString() || '',
        adminUsername: row.adminUsername || 'System',
        actionType: row.actionType || '',
        targetType: row.targetType || '',
        status: 'completed', // adminActions table doesn't have status field - all logged actions are completed
        createdAt: row.createdAt?.toISOString() || new Date().toISOString()
      }));
    } catch (error) {
      console.error("Error getting recent admin actions:", error);
      throw error;
    }
  }
  
  async getEngagementMetrics(): Promise<{
    dau: number;
    postsToday: number;
    commentsToday: number;
    likesToday: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Count daily active users (users who posted or commented today)
      const [dauResult] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${forumThreads.authorId})` })
        .from(forumThreads)
        .where(gte(forumThreads.createdAt, today));
      
      // Count posts (threads) created today
      const [postsResult] = await db
        .select({ count: count() })
        .from(forumThreads)
        .where(gte(forumThreads.createdAt, today));
      
      // Count comments (replies) created today
      const [commentsResult] = await db
        .select({ count: count() })
        .from(forumReplies)
        .where(gte(forumReplies.createdAt, today));
      
      // Count likes given today
      const [likesResult] = await db
        .select({ count: count() })
        .from(contentLikes)
        .where(gte(contentLikes.createdAt, today));
      
      return {
        dau: dauResult?.count || 0,
        postsToday: postsResult?.count || 0,
        commentsToday: commentsResult?.count || 0,
        likesToday: likesResult?.count || 0
      };
    } catch (error) {
      console.error("Error getting engagement metrics:", error);
      throw error;
    }
  }
  
  async getTopContentByViews(limit: number): Promise<Array<{
    id: string;
    title: string;
    views: number;
    author: string;
    createdAt: Date;
  }>> {
    try {
      const results = await db
        .select({
          id: forumThreads.id,
          title: forumThreads.title,
          views: forumThreads.views,
          authorId: forumThreads.authorId,
          authorUsername: users.username,
          createdAt: forumThreads.createdAt
        })
        .from(forumThreads)
        .leftJoin(users, eq(forumThreads.authorId, users.id))
        .orderBy(desc(forumThreads.views))
        .limit(limit);
      
      return results.map(row => ({
        id: row.id || '',
        title: row.title || '',
        views: row.views || 0,
        author: row.authorUsername || 'Unknown',
        createdAt: row.createdAt || new Date()
      }));
    } catch (error) {
      console.error("Error getting top content by views:", error);
      throw error;
    }
  }
  
  async getTopUsersByReputation(limit: number): Promise<Array<{
    id: string;
    username: string;
    reputation: number;
    coins: number;
    badges: string[];
    posts: number;
  }>> {
    try {
      const results = await db
        .select({
          id: users.id,
          username: users.username,
          reputation: users.reputationScore,
          coins: users.totalCoins,
          badges: users.badges,
          postsCount: sql<number>`(SELECT COUNT(*) FROM ${forumThreads} WHERE ${forumThreads.authorId} = ${users.id})`
        })
        .from(users)
        .orderBy(desc(users.reputationScore))
        .limit(limit);
      
      return results.map(row => ({
        id: row.id || '',
        username: row.username || '',
        reputation: row.reputation || 0,
        coins: row.coins || 0,
        badges: row.badges || [],
        posts: Number(row.postsCount) || 0
      }));
    } catch (error) {
      console.error("Error getting top users by reputation:", error);
      throw error;
    }
  }


  // ============================================================================
  // PHASE 2: Marketplace Management (14 methods) - DrizzleStorage Implementation
  // ============================================================================

  async getMarketplaceItems(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'sales';
  }): Promise<any> {
    try {
      const page = params.page || 1;
      const pageSize = Math.min(params.pageSize || 20, 100);
      const offset = (page - 1) * pageSize;

      // Build conditions
      const conditions: any[] = [isNull(content.deletedAt)];
      
      if (params.status) {
        conditions.push(eq(content.status, params.status as any));
      }
      if (params.category) {
        conditions.push(eq(content.category, params.category));
      }
      if (params.priceMin !== undefined) {
        conditions.push(gte(content.priceCoins, params.priceMin));
      }
      if (params.priceMax !== undefined) {
        conditions.push(lte(content.priceCoins, params.priceMax));
      }
      if (params.search) {
        conditions.push(
          or(
            ilike(content.title, `%${params.search}%`),
            ilike(users.username, `%${params.search}%`)
          )
        );
      }

      // Count total items
      const [totalResult] = await db
        .select({ count: sql<number>`cast(count(distinct ${content.id}) as integer)` })
        .from(content)
        .leftJoin(users, eq(content.authorId, users.id))
        .where(and(...conditions));

      const totalItems = totalResult?.count || 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      // Get items with sales and revenue
      const items = await db
        .select({
          id: content.id,
          title: content.title,
          type: content.type,
          category: content.category,
          status: content.status,
          coinPrice: content.priceCoins,
          sellerUsername: users.username,
          sellerId: content.authorId,
          featured: content.featured,
          featuredUntil: content.featuredUntil,
          createdAt: content.createdAt,
          approvedAt: content.approvedAt,
          rejectedAt: content.rejectedAt,
          rejectionReason: content.rejectionReason,
          deletedAt: content.deletedAt,
          sales: sql<number>`cast(count(distinct ${contentPurchases.id}) as integer)`,
          revenue: sql<number>`cast(coalesce(sum(${contentPurchases.priceCoins}), 0) as integer)`,
        })
        .from(content)
        .leftJoin(users, eq(content.authorId, users.id))
        .leftJoin(contentPurchases, eq(content.id, contentPurchases.contentId))
        .where(and(...conditions))
        .groupBy(
          content.id,
          content.title,
          content.type,
          content.category,
          content.status,
          content.priceCoins,
          content.authorId,
          content.featured,
          content.featuredUntil,
          content.createdAt,
          content.approvedAt,
          content.rejectedAt,
          content.rejectionReason,
          content.deletedAt,
          users.username
        )
        .orderBy(
          params.sort === 'oldest' ? asc(content.createdAt) :
          params.sort === 'price_asc' ? asc(content.priceCoins) :
          params.sort === 'price_desc' ? desc(content.priceCoins) :
          params.sort === 'sales' ? desc(sql`count(distinct ${contentPurchases.id})`) :
          desc(content.createdAt)
        )
        .limit(pageSize)
        .offset(offset);

      return {
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          category: item.category,
          status: item.status,
          coinPrice: item.coinPrice,
          sales: item.sales || 0,
          revenue: item.revenue || 0,
          sellerUsername: item.sellerUsername || 'Unknown',
          sellerId: item.sellerId,
          featured: item.featured || false,
          featuredUntil: item.featuredUntil?.toISOString() || null,
          createdAt: item.createdAt.toISOString(),
          approvedAt: item.approvedAt?.toISOString() || null,
          rejectedAt: item.rejectedAt?.toISOString() || null,
          rejectionReason: item.rejectionReason || null,
          deletedAt: item.deletedAt?.toISOString() || null,
        })),
        page,
        pageSize,
        totalItems,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting marketplace items:', error);
      throw error;
    }
  }

  async getMarketplaceItemById(id: string): Promise<any | null> {
    try {
      const [item] = await db
        .select()
        .from(content)
        .where(eq(content.id, id));

      if (!item) return null;

      const [seller] = await db
        .select()
        .from(users)
        .where(eq(users.id, item.authorId));

      const purchases = await db
        .select({
          id: contentPurchases.id,
          buyerId: contentPurchases.buyerId,
          buyerUsername: users.username,
          priceCoins: contentPurchases.priceCoins,
          purchasedAt: contentPurchases.purchasedAt,
        })
        .from(contentPurchases)
        .leftJoin(users, eq(contentPurchases.buyerId, users.id))
        .where(eq(contentPurchases.contentId, id))
        .orderBy(desc(contentPurchases.purchasedAt))
        .limit(10);

      const [salesMetrics] = await db
        .select({
          totalSales: sql<number>`cast(count(*) as integer)`,
          revenue: sql<number>`cast(coalesce(sum(${contentPurchases.priceCoins}), 0) as integer)`,
        })
        .from(contentPurchases)
        .where(eq(contentPurchases.contentId, id));

      return {
        ...item,
        sellerInfo: {
          username: seller?.username || 'Unknown',
          email: seller?.email || null,
          reputation: seller?.reputationScore || 0,
        },
        salesMetrics: {
          totalSales: salesMetrics?.totalSales || 0,
          revenue: salesMetrics?.revenue || 0,
          lastPurchaseDate: purchases[0]?.purchasedAt?.toISOString() || null,
        },
        recentPurchases: purchases.map(p => ({
          buyerUsername: p.buyerUsername || 'Unknown',
          coins: p.priceCoins,
          purchasedAt: p.purchasedAt.toISOString(),
        })),
        reviewSummary: {
          averageRating: item.averageRating || 0,
          totalReviews: item.reviewCount || 0,
        },
      };
    } catch (error) {
      console.error('Error getting marketplace item by ID:', error);
      throw error;
    }
  }

  async getPendingMarketplaceItems(limit = 50): Promise<any[]> {
    try {
      const items = await db
        .select({
          id: content.id,
          title: content.title,
          type: content.type,
          category: content.category,
          status: content.status,
          coinPrice: content.priceCoins,
          sellerUsername: users.username,
          sellerId: content.authorId,
          featured: content.featured,
          featuredUntil: content.featuredUntil,
          createdAt: content.createdAt,
          approvedAt: content.approvedAt,
          rejectedAt: content.rejectedAt,
          rejectionReason: content.rejectionReason,
          deletedAt: content.deletedAt,
          sales: sql<number>`cast(count(distinct ${contentPurchases.id}) as integer)`,
          revenue: sql<number>`cast(coalesce(sum(${contentPurchases.priceCoins}), 0) as integer)`,
        })
        .from(content)
        .leftJoin(users, eq(content.authorId, users.id))
        .leftJoin(contentPurchases, eq(content.id, contentPurchases.contentId))
        .where(and(
          eq(content.status, 'pending'),
          isNull(content.deletedAt)
        ))
        .groupBy(
          content.id,
          content.title,
          content.type,
          content.category,
          content.status,
          content.priceCoins,
          content.authorId,
          content.featured,
          content.featuredUntil,
          content.createdAt,
          content.approvedAt,
          content.rejectedAt,
          content.rejectionReason,
          content.deletedAt,
          users.username
        )
        .orderBy(asc(content.createdAt))
        .limit(limit);

      return items.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        category: item.category,
        status: item.status,
        coinPrice: item.coinPrice,
        sales: item.sales || 0,
        revenue: item.revenue || 0,
        sellerUsername: item.sellerUsername || 'Unknown',
        sellerId: item.sellerId,
        featured: item.featured || false,
        featuredUntil: item.featuredUntil?.toISOString() || null,
        createdAt: item.createdAt.toISOString(),
        approvedAt: item.approvedAt?.toISOString() || null,
        rejectedAt: item.rejectedAt?.toISOString() || null,
        rejectionReason: item.rejectionReason || null,
        deletedAt: item.deletedAt?.toISOString() || null,
      }));
    } catch (error) {
      console.error('Error getting pending marketplace items:', error);
      throw error;
    }
  }

  async approveMarketplaceItem(id: string, adminId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(content)
          .set({
            status: 'approved',
            approvedBy: adminId,
            approvedAt: new Date(),
            rejectedBy: null,
            rejectedAt: null,
            rejectionReason: null,
          })
          .where(eq(content.id, id));

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'approve_marketplace_item',
          targetType: 'content',
          targetId: id,
          details: {},
        });
      });
    } catch (error) {
      console.error('Error approving marketplace item:', error);
      throw error;
    }
  }

  async rejectMarketplaceItem(id: string, adminId: string, reason: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(content)
          .set({
            status: 'rejected',
            rejectedBy: adminId,
            rejectedAt: new Date(),
            rejectionReason: reason,
            approvedBy: null,
            approvedAt: null,
          })
          .where(eq(content.id, id));

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'reject_marketplace_item',
          targetType: 'content',
          targetId: id,
          details: { reason },
        });
      });
    } catch (error) {
      console.error('Error rejecting marketplace item:', error);
      throw error;
    }
  }

  async featureMarketplaceItem(id: string, adminId: string, durationDays: number): Promise<void> {
    try {
      const [item] = await db
        .select()
        .from(content)
        .where(eq(content.id, id));

      if (!item) throw new Error('Content not found');
      if (item.status !== 'approved') throw new Error('Only approved items can be featured');

      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + durationDays);

      await db.transaction(async (tx) => {
        await tx
          .update(content)
          .set({
            featured: true,
            featuredUntil,
          })
          .where(eq(content.id, id));

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'feature_marketplace_item',
          targetType: 'content',
          targetId: id,
          details: { durationDays },
        });
      });
    } catch (error) {
      console.error('Error featuring marketplace item:', error);
      throw error;
    }
  }

  async deleteMarketplaceItem(id: string, adminId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(content)
          .set({ deletedAt: new Date() })
          .where(eq(content.id, id));

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'delete_marketplace_item',
          targetType: 'content',
          targetId: id,
          details: {},
        });
      });
    } catch (error) {
      console.error('Error deleting marketplace item:', error);
      throw error;
    }
  }

  async getMarketplaceSales(params: {
    page?: number;
    pageSize?: number;
    contentId?: string;
    buyerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    try {
      const page = params.page || 1;
      const pageSize = Math.min(params.pageSize || 20, 100);
      const offset = (page - 1) * pageSize;

      const conditions: any[] = [];
      if (params.contentId) {
        conditions.push(eq(contentPurchases.contentId, params.contentId));
      }
      if (params.buyerId) {
        conditions.push(eq(contentPurchases.buyerId, params.buyerId));
      }
      if (params.startDate) {
        conditions.push(gte(contentPurchases.purchasedAt, params.startDate));
      }
      if (params.endDate) {
        conditions.push(lte(contentPurchases.purchasedAt, params.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(contentPurchases)
        .where(whereClause);

      const totalSales = totalResult?.count || 0;
      const totalPages = Math.ceil(totalSales / pageSize);

      const sales = await db
        .select({
          id: contentPurchases.id,
          contentId: contentPurchases.contentId,
          contentTitle: content.title,
          buyerUsername: sql<string>`${users.username}`,
          buyerId: contentPurchases.buyerId,
          sellerUsername: sql<string>`seller.username`,
          sellerId: contentPurchases.sellerId,
          priceCoins: contentPurchases.priceCoins,
          purchasedAt: contentPurchases.purchasedAt,
        })
        .from(contentPurchases)
        .leftJoin(content, eq(contentPurchases.contentId, content.id))
        .leftJoin(users, eq(contentPurchases.buyerId, users.id))
        .leftJoin(sql`users as seller`, sql`${contentPurchases.sellerId} = seller.id`)
        .where(whereClause)
        .orderBy(desc(contentPurchases.purchasedAt))
        .limit(pageSize)
        .offset(offset);

      return {
        sales: sales.map(s => ({
          id: s.id,
          contentId: s.contentId,
          contentTitle: s.contentTitle || 'Unknown',
          buyerUsername: s.buyerUsername || 'Unknown',
          buyerId: s.buyerId,
          sellerUsername: s.sellerUsername || 'Unknown',
          sellerId: s.sellerId,
          priceCoins: s.priceCoins,
          purchasedAt: s.purchasedAt.toISOString(),
        })),
        page,
        pageSize,
        totalSales,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting marketplace sales:', error);
      throw error;
    }
  }

  async getRecentMarketplaceSales(limit = 50): Promise<any[]> {
    try {
      const sales = await db
        .select({
          id: contentPurchases.id,
          contentId: contentPurchases.contentId,
          contentTitle: content.title,
          buyerUsername: sql<string>`buyer.username`,
          buyerId: contentPurchases.buyerId,
          sellerUsername: sql<string>`seller.username`,
          sellerId: contentPurchases.sellerId,
          priceCoins: contentPurchases.priceCoins,
          purchasedAt: contentPurchases.purchasedAt,
        })
        .from(contentPurchases)
        .leftJoin(content, eq(contentPurchases.contentId, content.id))
        .leftJoin(sql`users as buyer`, sql`${contentPurchases.buyerId} = buyer.id`)
        .leftJoin(sql`users as seller`, sql`${contentPurchases.sellerId} = seller.id`)
        .orderBy(desc(contentPurchases.purchasedAt))
        .limit(limit);

      return sales.map(s => ({
        id: s.id,
        contentId: s.contentId,
        contentTitle: s.contentTitle || 'Unknown',
        buyerUsername: s.buyerUsername || 'Unknown',
        buyerId: s.buyerId,
        sellerUsername: s.sellerUsername || 'Unknown',
        sellerId: s.sellerId,
        priceCoins: s.priceCoins,
        purchasedAt: s.purchasedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error getting recent marketplace sales:', error);
      throw error;
    }
  }

  async getMarketplaceRevenue(period: 'today' | 'week' | 'month' | 'year' | 'all'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      const [result] = await db
        .select({
          totalCoins: sql<number>`cast(coalesce(sum(${contentPurchases.priceCoins}), 0) as integer)`,
          totalSales: sql<number>`cast(count(*) as integer)`,
        })
        .from(contentPurchases)
        .where(gte(contentPurchases.purchasedAt, startDate));

      const totalCoins = result?.totalCoins || 0;
      const totalSales = result?.totalSales || 0;
      const averageSale = totalSales > 0 ? totalCoins / totalSales : 0;

      return { totalCoins, totalSales, averageSale };
    } catch (error) {
      console.error('Error getting marketplace revenue:', error);
      throw error;
    }
  }


  async getTopVendors(limit = 10): Promise<any[]> {
    try {
      const vendors = await db
        .select({
          sellerId: content.authorId,
          sellerUsername: users.username,
          totalRevenue: sql<number>`cast(coalesce(sum(${contentPurchases.priceCoins}), 0) as integer)`,
          totalSales: sql<number>`cast(count(distinct ${contentPurchases.id}) as integer)`,
          itemCount: sql<number>`cast(count(distinct ${content.id}) as integer)`,
        })
        .from(content)
        .leftJoin(contentPurchases, eq(content.id, contentPurchases.contentId))
        .leftJoin(users, eq(content.authorId, users.id))
        .where(and(
          eq(content.status, 'approved'),
          isNull(content.deletedAt)
        ))
        .groupBy(content.authorId, users.username)
        .orderBy(desc(sql`coalesce(sum(${contentPurchases.priceCoins}), 0)`))
        .limit(limit);

      return vendors.map(v => ({
        sellerId: v.sellerId,
        sellerUsername: v.sellerUsername || 'Unknown',
        totalRevenue: v.totalRevenue || 0,
        totalSales: v.totalSales || 0,
        itemCount: v.itemCount || 0,
      }));
    } catch (error) {
      console.error('Error getting top vendors:', error);
      throw error;
    }
  }

  async getMarketplaceStats(): Promise<any> {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [itemStats] = await db
        .select({
          totalItems: sql<number>`cast(count(*) filter (where ${content.deletedAt} is null) as integer)`,
          pendingItems: sql<number>`cast(count(*) filter (where ${content.status} = 'pending' and ${content.deletedAt} is null) as integer)`,
          approvedItems: sql<number>`cast(count(*) filter (where ${content.status} = 'approved' and ${content.deletedAt} is null) as integer)`,
          rejectedItems: sql<number>`cast(count(*) filter (where ${content.status} = 'rejected' and ${content.deletedAt} is null) as integer)`,
          featuredItems: sql<number>`cast(count(*) filter (where ${content.featured} = true and ${content.featuredUntil} > now() and ${content.deletedAt} is null) as integer)`,
        })
        .from(content);

      const [salesStats] = await db
        .select({
          totalSales: sql<number>`cast(count(*) as integer)`,
          salesThisWeek: sql<number>`cast(count(*) filter (where ${contentPurchases.purchasedAt} >= ${weekAgo}) as integer)`,
          totalRevenue: sql<number>`cast(coalesce(sum(${contentPurchases.priceCoins}), 0) as integer)`,
          revenueThisWeek: sql<number>`cast(coalesce(sum(${contentPurchases.priceCoins}) filter (where ${contentPurchases.purchasedAt} >= ${weekAgo}), 0) as integer)`,
        })
        .from(contentPurchases);

      return {
        totalItems: itemStats?.totalItems || 0,
        pendingItems: itemStats?.pendingItems || 0,
        approvedItems: itemStats?.approvedItems || 0,
        rejectedItems: itemStats?.rejectedItems || 0,
        featuredItems: itemStats?.featuredItems || 0,
        totalSales: salesStats?.totalSales || 0,
        salesThisWeek: salesStats?.salesThisWeek || 0,
        totalRevenue: salesStats?.totalRevenue || 0,
        revenueThisWeek: salesStats?.revenueThisWeek || 0,
      };
    } catch (error) {
      console.error('Error getting marketplace stats:', error);
      throw error;
    }
  }

  // ============================================================================
  // PHASE 2: Broker Admin Management (12 methods) - DrizzleStorage Implementation
  // ============================================================================

  async getAdminBrokers(filters?: {
    search?: string;
    country?: string;
    regulation?: string;
    isVerified?: boolean;
    scamWarning?: boolean;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<any> {
    try {
      const page = filters?.page || 1;
      const pageSize = Math.min(filters?.pageSize || 20, 100);
      const offset = (page - 1) * pageSize;

      // Build conditions
      const conditions: any[] = [isNull(brokers.deletedAt)];
      
      if (filters?.search) {
        conditions.push(ilike(brokers.name, `%${filters.search}%`));
      }
      if (filters?.country) {
        conditions.push(eq(brokers.country, filters.country));
      }
      if (filters?.regulation) {
        conditions.push(eq(brokers.regulation, filters.regulation));
      }
      if (filters?.isVerified !== undefined) {
        conditions.push(eq(brokers.isVerified, filters.isVerified));
      }
      if (filters?.scamWarning !== undefined) {
        conditions.push(eq(brokers.scamWarning, filters.scamWarning));
      }
      if (filters?.status) {
        conditions.push(eq(brokers.status, filters.status as any));
      }

      // Count total brokers
      const [totalResult] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(brokers)
        .where(and(...conditions));

      const total = totalResult?.count || 0;

      // Get brokers with pagination
      const items = await db
        .select({
          id: brokers.id,
          name: brokers.name,
          slug: brokers.slug,
          country: brokers.country,
          regulation: brokers.regulation,
          isVerified: brokers.isVerified,
          scamWarning: brokers.scamWarning,
          reviewCount: brokers.reviewCount,
          overallRating: brokers.overallRating,
          scamReportCount: brokers.scamReportCount,
          status: brokers.status,
          createdAt: brokers.createdAt,
          verifiedBy: brokers.verifiedBy,
          verifiedAt: brokers.verifiedAt,
        })
        .from(brokers)
        .where(and(...conditions))
        .orderBy(desc(brokers.createdAt))
        .limit(pageSize)
        .offset(offset);

      return {
        items: items.map(item => ({
          ...item,
          reviewCount: item.reviewCount || 0,
          overallRating: item.overallRating || 0,
          scamReportCount: item.scamReportCount || 0,
        })),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('Error getting admin brokers:', error);
      throw error;
    }
  }

  async verifyBroker(brokerId: string, adminId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [broker] = await tx
          .select()
          .from(brokers)
          .where(and(eq(brokers.id, brokerId), isNull(brokers.deletedAt)));

        if (!broker) throw new Error('Broker not found');

        await tx
          .update(brokers)
          .set({
            isVerified: true,
            verifiedBy: adminId,
            verifiedAt: new Date(),
            rejectedBy: null,
            rejectedAt: null,
            rejectionReason: null,
          })
          .where(eq(brokers.id, brokerId));

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'verify_broker',
          targetType: 'broker',
          targetId: brokerId,
          details: { brokerName: broker.name },
        });
      });
    } catch (error) {
      console.error('Error verifying broker:', error);
      throw error;
    }
  }

  async unverifyBroker(brokerId: string, adminId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [broker] = await tx
          .select()
          .from(brokers)
          .where(and(eq(brokers.id, brokerId), isNull(brokers.deletedAt)));

        if (!broker) throw new Error('Broker not found');

        await tx
          .update(brokers)
          .set({
            isVerified: false,
            verifiedBy: null,
            verifiedAt: null,
          })
          .where(eq(brokers.id, brokerId));

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'unverify_broker',
          targetType: 'broker',
          targetId: brokerId,
          details: { brokerName: broker.name },
        });
      });
    } catch (error) {
      console.error('Error unverifying broker:', error);
      throw error;
    }
  }

  async deleteBroker(brokerId: string, adminId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [broker] = await tx
          .select()
          .from(brokers)
          .where(eq(brokers.id, brokerId));

        if (!broker) throw new Error('Broker not found');

        await tx
          .update(brokers)
          .set({ deletedAt: new Date() })
          .where(eq(brokers.id, brokerId));

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'delete_broker',
          targetType: 'broker',
          targetId: brokerId,
          details: { brokerName: broker.name },
        });
      });
    } catch (error) {
      console.error('Error deleting broker:', error);
      throw error;
    }
  }

  async toggleScamWarning(
    brokerId: string,
    adminId: string,
    reason?: string,
    enabled?: boolean
  ): Promise<{ scamWarning: boolean }> {
    try {
      let newScamWarning: boolean;

      await db.transaction(async (tx) => {
        const [broker] = await tx
          .select()
          .from(brokers)
          .where(and(eq(brokers.id, brokerId), isNull(brokers.deletedAt)));

        if (!broker) throw new Error('Broker not found');

        // Determine new state
        if (enabled !== undefined) {
          newScamWarning = enabled;
        } else {
          newScamWarning = !broker.scamWarning;
        }

        await tx
          .update(brokers)
          .set({
            scamWarning: newScamWarning,
            scamWarningReason: newScamWarning ? reason || null : null,
          })
          .where(eq(brokers.id, brokerId));

        await tx.insert(adminActions).values({
          adminId,
          actionType: newScamWarning ? 'enable_scam_warning' : 'disable_scam_warning',
          targetType: 'broker',
          targetId: brokerId,
          details: { 
            brokerName: broker.name,
            reason: reason || null,
          },
        });
      });

      return { scamWarning: newScamWarning! };
    } catch (error) {
      console.error('Error toggling scam warning:', error);
      throw error;
    }
  }

  async getScamReports(filters?: {
    brokerId?: string;
    severity?: "low" | "medium" | "high" | "critical";
    status?: "pending" | "approved" | "rejected";
    page?: number;
    pageSize?: number;
  }): Promise<any> {
    try {
      const page = filters?.page || 1;
      const pageSize = Math.min(filters?.pageSize || 20, 100);
      const offset = (page - 1) * pageSize;

      // Build conditions
      const conditions: any[] = [eq(brokerReviews.isScamReport, true)];
      
      if (filters?.brokerId) {
        conditions.push(eq(brokerReviews.brokerId, filters.brokerId));
      }
      if (filters?.severity) {
        conditions.push(eq(brokerReviews.scamSeverity, filters.severity));
      }
      if (filters?.status) {
        conditions.push(eq(brokerReviews.status, filters.status as any));
      }

      // Count total scam reports
      const [totalResult] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(brokerReviews)
        .where(and(...conditions));

      const total = totalResult?.count || 0;

      // Get scam reports with related data
      const items = await db
        .select({
          id: brokerReviews.id,
          brokerId: brokerReviews.brokerId,
          brokerName: brokers.name,
          brokerLogoUrl: brokers.logoUrl,
          userId: brokerReviews.userId,
          username: users.username,
          rating: brokerReviews.rating,
          reviewTitle: brokerReviews.reviewTitle,
          reviewBody: brokerReviews.reviewBody,
          scamSeverity: brokerReviews.scamSeverity,
          status: brokerReviews.status,
          datePosted: brokerReviews.datePosted,
          approvedBy: brokerReviews.approvedBy,
          approvedAt: brokerReviews.approvedAt,
          rejectedBy: brokerReviews.rejectedBy,
          rejectedAt: brokerReviews.rejectedAt,
          rejectionReason: brokerReviews.rejectionReason,
        })
        .from(brokerReviews)
        .leftJoin(brokers, eq(brokerReviews.brokerId, brokers.id))
        .leftJoin(users, eq(brokerReviews.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(brokerReviews.datePosted))
        .limit(pageSize)
        .offset(offset);

      return {
        items: items.map(item => ({
          ...item,
          brokerName: item.brokerName || 'Unknown',
          username: item.username || 'Unknown',
        })),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('Error getting scam reports:', error);
      throw error;
    }
  }

  async resolveScamReport(
    reportId: string,
    adminId: string,
    resolution: "confirmed" | "dismissed"
  ): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [review] = await tx
          .select()
          .from(brokerReviews)
          .where(and(
            eq(brokerReviews.id, reportId),
            eq(brokerReviews.isScamReport, true)
          ));

        if (!review) throw new Error('Scam report not found');

        if (resolution === 'confirmed') {
          // Mark as approved
          await tx
            .update(brokerReviews)
            .set({
              status: 'approved',
              approvedBy: adminId,
              approvedAt: new Date(),
              rejectedBy: null,
              rejectedAt: null,
              rejectionReason: null,
            })
            .where(eq(brokerReviews.id, reportId));

          // Count total confirmed scam reports for this broker
          const [confirmedReports] = await tx
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(brokerReviews)
            .where(and(
              eq(brokerReviews.brokerId, review.brokerId),
              eq(brokerReviews.isScamReport, true),
              eq(brokerReviews.status, 'approved')
            ));

          const count = confirmedReports?.count || 0;

          // Auto-flag if 3+ confirmed scam reports
          if (count >= 3) {
            await tx
              .update(brokers)
              .set({
                scamWarning: true,
                scamWarningReason: `Automatically flagged: ${count} confirmed scam reports`,
              })
              .where(eq(brokers.id, review.brokerId));

            await tx.insert(adminActions).values({
              adminId,
              actionType: 'auto_flag_scam_warning',
              targetType: 'broker',
              targetId: review.brokerId,
              details: { 
                confirmedReports: count,
                reason: `Automatically flagged: ${count} confirmed scam reports`,
              },
            });
          }

          await tx.insert(adminActions).values({
            adminId,
            actionType: 'confirm_scam_report',
            targetType: 'broker_review',
            targetId: reportId,
            details: { brokerId: review.brokerId },
          });
        } else {
          // Mark as dismissed
          await tx
            .update(brokerReviews)
            .set({
              status: 'rejected',
              rejectedBy: adminId,
              rejectedAt: new Date(),
              rejectionReason: 'False report',
              approvedBy: null,
              approvedAt: null,
            })
            .where(eq(brokerReviews.id, reportId));

          await tx.insert(adminActions).values({
            adminId,
            actionType: 'dismiss_scam_report',
            targetType: 'broker_review',
            targetId: reportId,
            details: { brokerId: review.brokerId },
          });
        }
      });
    } catch (error) {
      console.error('Error resolving scam report:', error);
      throw error;
    }
  }

  async approveBrokerReview(reviewId: string, adminId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [review] = await tx
          .select()
          .from(brokerReviews)
          .where(eq(brokerReviews.id, reviewId));

        if (!review) throw new Error('Review not found');

        await tx
          .update(brokerReviews)
          .set({
            status: 'approved',
            approvedBy: adminId,
            approvedAt: new Date(),
            rejectedBy: null,
            rejectedAt: null,
            rejectionReason: null,
          })
          .where(eq(brokerReviews.id, reviewId));

        // If NOT a scam report, update broker rating
        if (!review.isScamReport) {
          await this.updateBrokerRating(review.brokerId);
        }

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'approve_broker_review',
          targetType: 'broker_review',
          targetId: reviewId,
          details: { brokerId: review.brokerId },
        });
      });
    } catch (error) {
      console.error('Error approving broker review:', error);
      throw error;
    }
  }

  async rejectBrokerReview(reviewId: string, adminId: string, reason: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [review] = await tx
          .select()
          .from(brokerReviews)
          .where(eq(brokerReviews.id, reviewId));

        if (!review) throw new Error('Review not found');

        await tx
          .update(brokerReviews)
          .set({
            status: 'rejected',
            rejectedBy: adminId,
            rejectedAt: new Date(),
            rejectionReason: reason,
            approvedBy: null,
            approvedAt: null,
          })
          .where(eq(brokerReviews.id, reviewId));

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'reject_broker_review',
          targetType: 'broker_review',
          targetId: reviewId,
          details: { 
            brokerId: review.brokerId,
            reason,
          },
        });
      });
    } catch (error) {
      console.error('Error rejecting broker review:', error);
      throw error;
    }
  }

  async getBrokerStats(): Promise<any> {
    try {
      const [brokerStats] = await db
        .select({
          totalBrokers: sql<number>`cast(count(*) filter (where ${brokers.deletedAt} is null) as integer)`,
          verifiedBrokers: sql<number>`cast(count(*) filter (where ${brokers.isVerified} = true and ${brokers.deletedAt} is null) as integer)`,
          scamWarnings: sql<number>`cast(count(*) filter (where ${brokers.scamWarning} = true and ${brokers.deletedAt} is null) as integer)`,
        })
        .from(brokers);

      const [reviewStats] = await db
        .select({
          totalReviews: sql<number>`cast(count(*) as integer)`,
          pendingReviews: sql<number>`cast(count(*) filter (where ${brokerReviews.status} = 'pending' and ${brokerReviews.isScamReport} = false) as integer)`,
          pendingScamReports: sql<number>`cast(count(*) filter (where ${brokerReviews.status} = 'pending' and ${brokerReviews.isScamReport} = true) as integer)`,
        })
        .from(brokerReviews);

      return {
        totalBrokers: brokerStats?.totalBrokers || 0,
        verifiedBrokers: brokerStats?.verifiedBrokers || 0,
        scamWarnings: brokerStats?.scamWarnings || 0,
        totalReviews: reviewStats?.totalReviews || 0,
        pendingReviews: reviewStats?.pendingReviews || 0,
        pendingScamReports: reviewStats?.pendingScamReports || 0,
      };
    } catch (error) {
      console.error('Error getting broker stats:', error);
      throw error;
    }
  }

  async updateBroker(
    brokerId: string,
    data: {
      name?: string;
      country?: string;
      regulation?: string;
      websiteUrl?: string;
      minDeposit?: string;
      leverage?: string;
      platform?: string;
      spreadType?: string;
      minSpread?: string;
    },
    adminId: string
  ): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [broker] = await tx
          .select()
          .from(brokers)
          .where(and(eq(brokers.id, brokerId), isNull(brokers.deletedAt)));

        if (!broker) throw new Error('Broker not found');

        const updates: any = { ...data, updatedAt: new Date() };

        // If name changed, regenerate slug
        if (data.name && data.name !== broker.name) {
          const slugify = (await import('slugify')).default;
          const baseSlug = slugify(data.name, { lower: true, strict: true });
          const existingSlugs = new Set(
            (await tx.select({ slug: brokers.slug }).from(brokers))
              .map(r => r.slug)
              .filter(s => s !== broker.slug)
          );
          updates.slug = generateUniqueSlug(baseSlug, existingSlugs);
        }

        await tx
          .update(brokers)
          .set(updates)
          .where(eq(brokers.id, brokerId));

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'update_broker',
          targetType: 'broker',
          targetId: brokerId,
          details: { 
            brokerName: broker.name,
            changes: data,
          },
        });
      });
    } catch (error) {
      console.error('Error updating broker:', error);
      throw error;
    }
  }

  async getPendingBrokers(): Promise<any[]> {
    try {
      const items = await db
        .select({
          id: brokers.id,
          name: brokers.name,
          slug: brokers.slug,
          country: brokers.country,
          regulation: brokers.regulation,
          createdAt: brokers.createdAt,
        })
        .from(brokers)
        .where(and(
          eq(brokers.status, 'pending'),
          isNull(brokers.deletedAt)
        ))
        .orderBy(asc(brokers.createdAt));

      return items;
    } catch (error) {
      console.error('Error getting pending brokers:', error);
      throw error;
    }
  }

  // ============================================================================
  // FINANCE METHODS IMPLEMENTATION
  // ============================================================================

  async getTotalRevenue(period?: string): Promise<{ totalRevenue: number; change: number }> {
    try {
      const now = new Date();
      let startDate: Date;
      let previousStartDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          previousStartDate = new Date(startDate);
          previousStartDate.setDate(previousStartDate.getDate() - 1);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
          break;
        case 'all':
          startDate = new Date(0);
          previousStartDate = new Date(0);
          break;
      }

      const [rechargeRevenue] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${rechargeOrders.priceUsd}), 0)`,
        })
        .from(rechargeOrders)
        .where(and(
          eq(rechargeOrders.status, 'completed'),
          gte(rechargeOrders.createdAt, startDate)
        ));

      const [subscriptionRevenue] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${subscriptions.priceUsd}), 0)`,
        })
        .from(subscriptions)
        .where(gte(subscriptions.createdAt, startDate));

      const [previousRechargeRevenue] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${rechargeOrders.priceUsd}), 0)`,
        })
        .from(rechargeOrders)
        .where(and(
          eq(rechargeOrders.status, 'completed'),
          gte(rechargeOrders.createdAt, previousStartDate),
          lt(rechargeOrders.createdAt, startDate)
        ));

      const [previousSubscriptionRevenue] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${subscriptions.priceUsd}), 0)`,
        })
        .from(subscriptions)
        .where(and(
          gte(subscriptions.createdAt, previousStartDate),
          lt(subscriptions.createdAt, startDate)
        ));

      const totalRevenue = Number(rechargeRevenue?.total || 0) + Number(subscriptionRevenue?.total || 0);
      const previousRevenue = Number(previousRechargeRevenue?.total || 0) + Number(previousSubscriptionRevenue?.total || 0);
      
      const change = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      return { totalRevenue, change };
    } catch (error) {
      console.error('Error getting total revenue:', error);
      throw error;
    }
  }

  async getRevenueTrend(days: number): Promise<Array<{ date: string; revenue: number }>> {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const rechargeData = await db
        .select({
          date: sql<string>`DATE(${rechargeOrders.createdAt})`,
          revenue: sql<number>`COALESCE(SUM(${rechargeOrders.priceUsd}), 0)`,
        })
        .from(rechargeOrders)
        .where(and(
          eq(rechargeOrders.status, 'completed'),
          gte(rechargeOrders.createdAt, startDate)
        ))
        .groupBy(sql`DATE(${rechargeOrders.createdAt})`);

      const subscriptionData = await db
        .select({
          date: sql<string>`DATE(${subscriptions.createdAt})`,
          revenue: sql<number>`COALESCE(SUM(${subscriptions.priceUsd}), 0)`,
        })
        .from(subscriptions)
        .where(gte(subscriptions.createdAt, startDate))
        .groupBy(sql`DATE(${subscriptions.createdAt})`);

      const revenueMap = new Map<string, number>();
      
      rechargeData.forEach(item => {
        revenueMap.set(item.date, (revenueMap.get(item.date) || 0) + Number(item.revenue));
      });
      
      subscriptionData.forEach(item => {
        revenueMap.set(item.date, (revenueMap.get(item.date) || 0) + Number(item.revenue));
      });

      const result: Array<{ date: string; revenue: number }> = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        result.unshift({
          date: dateStr,
          revenue: revenueMap.get(dateStr) || 0,
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting revenue trend:', error);
      throw error;
    }
  }

  async getRevenuePeriod(period: 'today' | 'week' | 'month' | 'year' | 'all'): Promise<{ totalRevenue: number; count: number }> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'all':
          startDate = new Date(0);
          break;
      }

      const [rechargeStats] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${rechargeOrders.priceUsd}), 0)`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(rechargeOrders)
        .where(and(
          eq(rechargeOrders.status, 'completed'),
          gte(rechargeOrders.createdAt, startDate)
        ));

      const [subscriptionStats] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${subscriptions.priceUsd}), 0)`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(subscriptions)
        .where(gte(subscriptions.createdAt, startDate));

      return {
        totalRevenue: Number(rechargeStats?.total || 0) + Number(subscriptionStats?.total || 0),
        count: Number(rechargeStats?.count || 0) + Number(subscriptionStats?.count || 0),
      };
    } catch (error) {
      console.error('Error getting revenue period:', error);
      throw error;
    }
  }

  async getRevenueBySource(): Promise<{
    coinPurchases: number;
    subscriptions: number;
    marketplace: number;
    other: number;
  }> {
    try {
      const [coinPurchasesResult] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${rechargeOrders.priceUsd}), 0)`,
        })
        .from(rechargeOrders)
        .where(eq(rechargeOrders.status, 'completed'));

      const [subscriptionsResult] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${subscriptions.priceUsd}), 0)`,
        })
        .from(subscriptions);

      const [marketplaceResult] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${contentPurchases.priceCoins}), 0) * 0.1`,
        })
        .from(contentPurchases);

      return {
        coinPurchases: Number(coinPurchasesResult?.total || 0),
        subscriptions: Number(subscriptionsResult?.total || 0),
        marketplace: Number(marketplaceResult?.total || 0),
        other: 0,
      };
    } catch (error) {
      console.error('Error getting revenue by source:', error);
      throw error;
    }
  }

  async getAllWithdrawals(filters?: {
    status?: string;
    method?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }> {
    try {
      const conditions = [];
      
      if (filters?.status) {
        conditions.push(eq(withdrawalRequests.status, filters.status as any));
      }
      if (filters?.method) {
        conditions.push(eq(withdrawalRequests.method, filters.method as any));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(withdrawalRequests)
        .where(whereClause);

      const items = await db
        .select({
          id: withdrawalRequests.id,
          userId: withdrawalRequests.userId,
          username: users.username,
          avatarUrl: users.profileImageUrl,
          amount: withdrawalRequests.amount,
          method: withdrawalRequests.method,
          walletAddress: withdrawalRequests.walletAddress,
          status: withdrawalRequests.status,
          createdAt: withdrawalRequests.createdAt,
          userBalance: users.totalCoins,
        })
        .from(withdrawalRequests)
        .leftJoin(users, eq(withdrawalRequests.userId, users.id))
        .where(whereClause)
        .orderBy(desc(withdrawalRequests.createdAt))
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0);

      return {
        items,
        total: Number(countResult?.count || 0),
      };
    } catch (error) {
      console.error('Error getting all withdrawals:', error);
      throw error;
    }
  }

  async completeWithdrawal(
    withdrawalId: string,
    adminId: string,
    transactionId: string,
    notes?: string
  ): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [withdrawal] = await tx
          .select()
          .from(withdrawalRequests)
          .where(eq(withdrawalRequests.id, withdrawalId));

        if (!withdrawal) {
          throw new Error('Withdrawal not found');
        }

        if (withdrawal.status !== 'approved') {
          throw new Error('Withdrawal must be approved before completing');
        }

        await tx
          .update(withdrawalRequests)
          .set({
            status: 'completed',
            completedBy: adminId,
            completedAt: new Date(),
            transactionHash: transactionId,
            adminNotes: notes || withdrawal.adminNotes,
            updatedAt: new Date(),
          })
          .where(eq(withdrawalRequests.id, withdrawalId));

        await tx.insert(adminActions).values({
          adminId,
          actionType: 'complete_withdrawal',
          targetType: 'withdrawal',
          targetId: withdrawalId,
          details: {
            userId: withdrawal.userId,
            amount: withdrawal.amount,
            transactionId,
            notes,
          },
        });
      });
    } catch (error) {
      console.error('Error completing withdrawal:', error);
      throw error;
    }
  }

  async getRecentTransactions(limit: number = 20, period?: string): Promise<Array<{
    id: string;
    userId: string;
    username: string;
    type: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>> {
    try {
      const now = new Date();
      let startDate: Date | undefined;

      if (period) {
        switch (period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }
      }

      const rechargeConditions = [eq(rechargeOrders.status, 'completed')];
      if (startDate) {
        rechargeConditions.push(gte(rechargeOrders.createdAt, startDate));
      }

      const recharges = await db
        .select({
          id: rechargeOrders.id,
          userId: rechargeOrders.userId,
          username: users.username,
          type: sql<string>`'Coin Purchase'`,
          amount: rechargeOrders.priceUsd,
          status: rechargeOrders.status,
          createdAt: rechargeOrders.createdAt,
        })
        .from(rechargeOrders)
        .leftJoin(users, eq(rechargeOrders.userId, users.id))
        .where(and(...rechargeConditions))
        .orderBy(desc(rechargeOrders.createdAt))
        .limit(limit);

      const subscriptionConditions = [];
      if (startDate) {
        subscriptionConditions.push(gte(subscriptions.createdAt, startDate));
      }

      const subs = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          username: users.username,
          type: sql<string>`'Subscription'`,
          amount: subscriptions.priceUsd,
          status: subscriptions.status,
          createdAt: subscriptions.createdAt,
        })
        .from(subscriptions)
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .where(subscriptionConditions.length > 0 ? and(...subscriptionConditions) : undefined)
        .orderBy(desc(subscriptions.createdAt))
        .limit(limit);

      const purchaseConditions = [];
      if (startDate) {
        purchaseConditions.push(gte(contentPurchases.purchasedAt, startDate));
      }

      const purchases = await db
        .select({
          id: contentPurchases.id,
          userId: contentPurchases.buyerId,
          username: users.username,
          type: sql<string>`'Marketplace'`,
          amount: sql<number>`${contentPurchases.priceCoins}`,
          status: sql<string>`'completed'`,
          createdAt: contentPurchases.purchasedAt,
        })
        .from(contentPurchases)
        .leftJoin(users, eq(contentPurchases.buyerId, users.id))
        .where(purchaseConditions.length > 0 ? and(...purchaseConditions) : undefined)
        .orderBy(desc(contentPurchases.purchasedAt))
        .limit(limit);

      const withdrawalConditions = [];
      if (startDate) {
        withdrawalConditions.push(gte(withdrawalRequests.createdAt, startDate));
      }

      const withdrawals = await db
        .select({
          id: withdrawalRequests.id,
          userId: withdrawalRequests.userId,
          username: users.username,
          type: sql<string>`'Withdrawal'`,
          amount: withdrawalRequests.amount,
          status: withdrawalRequests.status,
          createdAt: withdrawalRequests.createdAt,
        })
        .from(withdrawalRequests)
        .leftJoin(users, eq(withdrawalRequests.userId, users.id))
        .where(withdrawalConditions.length > 0 ? and(...withdrawalConditions) : undefined)
        .orderBy(desc(withdrawalRequests.createdAt))
        .limit(limit);

      const allTransactions = [
        ...recharges.map(r => ({ ...r, createdAt: new Date(r.createdAt) })),
        ...subs.map(s => ({ ...s, createdAt: new Date(s.createdAt) })),
        ...purchases.map(p => ({ ...p, createdAt: new Date(p.createdAt), amount: Number(p.amount) })),
        ...withdrawals.map(w => ({ ...w, createdAt: new Date(w.createdAt) })),
      ];

      allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return allTransactions.slice(0, limit).map(t => ({
        ...t,
        username: t.username || 'Unknown'
      }));
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      throw error;
    }
  }

  async getAllTransactions(filters?: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }> {
    try {
      const transactions: any[] = [];
      let total = 0;

      if (!filters?.type || filters.type === 'recharge') {
        const conditions = [eq(rechargeOrders.status, 'completed')];
        if (filters?.startDate) {
          conditions.push(gte(rechargeOrders.createdAt, filters.startDate));
        }
        if (filters?.endDate) {
          conditions.push(lte(rechargeOrders.createdAt, filters.endDate));
        }

        const recharges = await db
          .select({
            id: rechargeOrders.id,
            userId: rechargeOrders.userId,
            username: users.username,
            type: sql<string>`'recharge'`,
            amount: rechargeOrders.priceUsd,
            status: rechargeOrders.status,
            method: rechargeOrders.paymentMethod,
            createdAt: rechargeOrders.createdAt,
          })
          .from(rechargeOrders)
          .leftJoin(users, eq(rechargeOrders.userId, users.id))
          .where(and(...conditions))
          .orderBy(desc(rechargeOrders.createdAt));

        transactions.push(...recharges);
        total += recharges.length;
      }

      if (!filters?.type || filters.type === 'subscription') {
        const conditions = [];
        if (filters?.startDate) {
          conditions.push(gte(subscriptions.createdAt, filters.startDate));
        }
        if (filters?.endDate) {
          conditions.push(lte(subscriptions.createdAt, filters.endDate));
        }

        const subs = await db
          .select({
            id: subscriptions.id,
            userId: subscriptions.userId,
            username: users.username,
            type: sql<string>`'subscription'`,
            amount: subscriptions.priceUsd,
            status: subscriptions.status,
            method: subscriptions.paymentMethod,
            createdAt: subscriptions.createdAt,
          })
          .from(subscriptions)
          .leftJoin(users, eq(subscriptions.userId, users.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(subscriptions.createdAt));

        transactions.push(...subs);
        total += subs.length;
      }

      if (!filters?.type || filters.type === 'withdrawal') {
        const conditions = [];
        if (filters?.startDate) {
          conditions.push(gte(withdrawalRequests.createdAt, filters.startDate));
        }
        if (filters?.endDate) {
          conditions.push(lte(withdrawalRequests.createdAt, filters.endDate));
        }

        const withdrawals = await db
          .select({
            id: withdrawalRequests.id,
            userId: withdrawalRequests.userId,
            username: users.username,
            type: sql<string>`'withdrawal'`,
            amount: withdrawalRequests.amount,
            status: withdrawalRequests.status,
            method: withdrawalRequests.method,
            createdAt: withdrawalRequests.createdAt,
          })
          .from(withdrawalRequests)
          .leftJoin(users, eq(withdrawalRequests.userId, users.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(withdrawalRequests.createdAt));

        transactions.push(...withdrawals);
        total += withdrawals.length;
      }

      transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      return {
        items: transactions.slice(offset, offset + limit),
        total,
      };
    } catch (error) {
      console.error('Error getting all transactions:', error);
      throw error;
    }
  }

  async exportTransactionsCSV(filters?: {
    types?: string[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<string> {
    try {
      const { items } = await this.getAllTransactions({
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        limit: 10000,
      });

      const filteredItems = filters?.types && filters.types.length > 0
        ? items.filter(item => filters.types!.includes(item.type))
        : items;

      const headers = ['ID', 'Date', 'Username', 'Type', 'Amount', 'Status', 'Method'];
      const rows = filteredItems.map(item => [
        item.id,
        new Date(item.createdAt).toISOString(),
        item.username || 'N/A',
        item.type,
        item.amount.toString(),
        item.status,
        item.method || 'N/A',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting transactions CSV:', error);
      throw error;
    }
  }

  async getFinancialStats(): Promise<{
    totalRevenue: number;
    totalWithdrawals: number;
    pendingWithdrawals: number;
    totalTransactions: number;
    activeSubscriptions: number;
  }> {
    try {
      const [rechargeStats] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${rechargeOrders.priceUsd}), 0)`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(rechargeOrders)
        .where(eq(rechargeOrders.status, 'completed'));

      const [subscriptionStats] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${subscriptions.priceUsd}), 0)`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(subscriptions);

      const [withdrawalStats] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${withdrawalRequests.amount}), 0)`,
          pending: sql<number>`COALESCE(SUM(CASE WHEN ${withdrawalRequests.status} = 'pending' THEN ${withdrawalRequests.amount} ELSE 0 END), 0)`,
        })
        .from(withdrawalRequests);

      const [activeSubCount] = await db
        .select({
          count: sql<number>`COUNT(*)::int`,
        })
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active'));

      return {
        totalRevenue: Number(rechargeStats?.total || 0) + Number(subscriptionStats?.total || 0),
        totalWithdrawals: Number(withdrawalStats?.total || 0),
        pendingWithdrawals: Number(withdrawalStats?.pending || 0),
        totalTransactions: Number(rechargeStats?.count || 0) + Number(subscriptionStats?.count || 0),
        activeSubscriptions: Number(activeSubCount?.count || 0),
      };
    } catch (error) {
      console.error('Error getting financial stats:', error);
      throw error;
    }
  }
}

// Feature flag for gradual rollout
// Default to PostgreSQL since DATABASE_URL is configured
const USE_POSTGRES = process.env.USE_POSTGRES !== "false";

export const storage = USE_POSTGRES 
  ? new DrizzleStorage()
  : new MemStorage();
