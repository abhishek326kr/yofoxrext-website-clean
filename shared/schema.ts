import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, index, jsonb, json, check, uniqueIndex, numeric, serial, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - REQUIRED for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table - Merged Replit Auth + YoForex fields
export const users = pgTable("users", {
  // Core identity field (NEVER change this type - breaking change)
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Legacy fields (kept for backward compatibility, will be deprecated)
  username: text("username").notNull().unique(),
  password: text("password"), // DEPRECATED - use password_hash instead
  
  // New Authentication System fields
  email: varchar("email").unique(), // Nullable for backward compatibility with existing users
  password_hash: varchar("password_hash"), // For email/password authentication (nullable)
  google_uid: varchar("google_uid").unique(), // For Google OAuth (nullable)
  auth_provider: varchar("auth_provider", { length: 20 }).default("replit"), // 'email', 'google', 'replit'
  is_email_verified: boolean("is_email_verified").default(false),
  last_login_at: timestamp("last_login_at"),
  
  // Replit Auth fields (kept for backward compatibility during migration)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  location: varchar("location", { length: 100 }),
  
  // YoForex-specific fields (preserved from original)
  totalCoins: integer("total_coins").notNull().default(0),
  weeklyEarned: integer("weekly_earned").notNull().default(0),
  rank: integer("rank"),
  youtubeUrl: text("youtube_url"),
  instagramHandle: text("instagram_handle"),
  telegramHandle: text("telegram_handle"),
  myfxbookLink: text("myfxbook_link"),
  investorId: text("investor_id"),
  investorPassword: text("investor_password"),
  isVerifiedTrader: boolean("is_verified_trader").notNull().default(false),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  hasYoutubeReward: boolean("has_youtube_reward").notNull().default(false),
  hasMyfxbookReward: boolean("has_myfxbook_reward").notNull().default(false),
  hasInvestorReward: boolean("has_investor_reward").notNull().default(false),
  
  // Badges & Achievements
  badges: text("badges").array().default(sql`'{}'::text[]`),
  
  // Onboarding System
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingDismissed: boolean("onboarding_dismissed").default(false),
  onboardingProgress: json("onboarding_progress").default({
    profilePicture: false,  // 10 coins - Upload profile picture
    firstReply: false,       // 5 coins - Post first reply
    twoReviews: false,       // 6 coins - Submit 2 reviews
    firstThread: false,      // 10 coins - Create first thread
    firstPublish: false,     // 30 coins - Publish EA/content
    fiftyFollowers: false,   // 200 coins - Get 50 followers
  }),
  
  // Ranking system
  reputationScore: integer("reputation_score").notNull().default(0),
  lastReputationUpdate: timestamp("last_reputation_update"),
  
  // Daily Earning system
  lastJournalPost: date("last_journal_post"),
  
  // User level system
  level: integer("level").default(0).notNull(),
  
  // Admin Management fields
  role: varchar("role", { length: 20 }).notNull().default("member"), // member, moderator, admin
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, suspended, banned
  suspendedUntil: timestamp("suspended_until"), // When suspension ends
  bannedAt: timestamp("banned_at"), // When user was banned
  bannedBy: varchar("banned_by"), // Admin ID who banned the user
  lastActive: timestamp("last_active").defaultNow(), // Last activity timestamp for online tracking
  
  // Email Queue System fields
  timezone: varchar("timezone", { length: 50 }).default("UTC"), // User's timezone for smart email scheduling
  lastActivityTime: timestamp("last_activity_time"), // Track user activity patterns for smart scheduling
  emailBounceCount: integer("email_bounce_count").notNull().default(0), // Track bounce count for auto-unsubscribe
  lastEmailSentAt: timestamp("last_email_sent_at"), // For rate limiting
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  usernameIdx: index("idx_users_username").on(table.username),
  emailIdx: index("idx_users_email").on(table.email),
  googleUidIdx: index("idx_users_google_uid").on(table.google_uid),
  authProviderIdx: index("idx_users_auth_provider").on(table.auth_provider),
  reputationIdx: index("idx_users_reputation").on(table.reputationScore),
  levelIdx: index("idx_users_level").on(table.level),
  coinsIdx: index("idx_users_coins").on(table.totalCoins),
  roleIdx: index("idx_users_role").on(table.role), // Index for admin filters
  statusIdx: index("idx_users_status").on(table.status), // Index for admin filters
  lastActiveIdx: index("idx_users_last_active").on(table.lastActive), // Index for online users query
  coinsCheck: check("chk_user_coins_nonnegative", sql`${table.totalCoins} >= 0`),
}));

export const userActivity = pgTable("user_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  activeMinutes: integer("active_minutes").notNull().default(0),
  coinsEarned: integer("coins_earned").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userDateIdx: uniqueIndex("idx_user_activity_user_date").on(table.userId, table.date),
}));

export const coinTransactions = pgTable("coin_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull().$type<"earn" | "spend" | "recharge">(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().$type<"completed" | "pending" | "failed">().default("completed"),
  botId: varchar("bot_id"), // References bot if transaction was from bot activity (nullable)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_coin_transactions_user_id").on(table.userId),
  botIdIdx: index("idx_coin_transactions_bot_id").on(table.botId),
}));

export const rechargeOrders = pgTable("recharge_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  coinAmount: integer("coin_amount").notNull(),
  priceUsd: integer("price_usd").notNull(),
  paymentMethod: text("payment_method").notNull().$type<"stripe" | "crypto">(),
  paymentId: text("payment_id"),
  status: text("status").notNull().$type<"pending" | "completed" | "failed">().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userIdIdx: index("idx_recharge_orders_user_id").on(table.userId),
}));

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  plan: text("plan").notNull().$type<"monthly" | "quarterly" | "yearly">(),
  priceUsd: integer("price_usd").notNull(),
  paymentMethod: text("payment_method").notNull().$type<"stripe" | "paypal" | "crypto" | "other">(),
  paymentId: text("payment_id"),
  status: text("status").notNull().$type<"active" | "cancelled" | "expired" | "paused">(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").notNull().default(true),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_subscriptions_user_id").on(table.userId),
  statusIdx: index("idx_subscriptions_status").on(table.status),
  statusEndDateIdx: index("idx_subscriptions_status_end_date").on(table.status, table.endDate),
}));

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  
  // Withdrawal Method Flexibility - method field with default 'crypto' for backward compatibility
  method: text("method").$type<"crypto" | "paypal" | "bank" | "other">().default("crypto"),
  paymentReference: text("payment_reference"), // For fiat payment confirmations
  
  // Crypto fields - now NULLABLE for backward compatibility with fiat withdrawals
  cryptoType: text("crypto_type").$type<"BTC" | "ETH">(),
  walletAddress: text("wallet_address").notNull(),
  exchangeRate: numeric("exchange_rate", { precision: 20, scale: 8 }),
  cryptoAmount: numeric("crypto_amount", { precision: 20, scale: 8 }),
  
  // Extended status enum to include 'approved' and 'rejected'
  status: text("status").notNull().$type<"pending" | "approved" | "rejected" | "processing" | "completed" | "failed" | "cancelled">().default("pending"),
  
  processingFee: integer("processing_fee").notNull(),
  transactionHash: text("transaction_hash"),
  adminNotes: text("admin_notes"),
  
  // Admin Workflow Tracking Fields (all nullable for backward compatibility)
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  completedBy: varchar("completed_by").references(() => users.id),
  
  // Revenue Tracking Field (for finance reporting)
  amountUsd: numeric("amount_usd", { precision: 10, scale: 2 }),
  
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_withdrawal_requests_user_id").on(table.userId),
  statusIdx: index("idx_withdrawal_requests_status").on(table.status),
  methodIdx: index("idx_withdrawal_requests_method").on(table.method),
  approvedByIdx: index("idx_withdrawal_requests_approved_by").on(table.approvedBy),
  statusMethodIdx: index("idx_withdrawal_requests_status_method").on(table.status, table.method),
  amountCheck: check("chk_withdrawal_amount_min", sql`${table.amount} >= 1000`),
}));

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull().$type<"bug" | "feature" | "improvement" | "other">(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  email: text("email"),
  status: text("status").notNull().$type<"new" | "in_progress" | "resolved" | "closed">().default("new"),
  priority: text("priority").$type<"low" | "medium" | "high" | "urgent">().default("medium"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_feedback_user_id").on(table.userId),
  statusIdx: index("idx_feedback_status").on(table.status),
  typeIdx: index("idx_feedback_type").on(table.type),
}));

export const content = pgTable("content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
  type: text("type").notNull().$type<"ea" | "indicator" | "article" | "source_code">(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priceCoins: integer("price_coins").notNull().default(0),
  isFree: boolean("is_free").notNull().default(true),
  category: text("category").notNull(),
  
  // Publishing flow fields
  platform: text("platform").$type<"MT4" | "MT5" | "Both">(),
  version: text("version"),
  tags: text("tags").array(),
  files: jsonb("files").$type<Array<{name: string; size: number; url: string; checksum: string}>>(),
  images: jsonb("images").$type<Array<{url: string; isCover: boolean; order: number}>>(),
  
  // Optional fields
  brokerCompat: text("broker_compat").array(),
  minDeposit: integer("min_deposit"),
  hedging: boolean("hedging"),
  changelog: text("changelog"),
  license: text("license"),
  
  // Evidence fields (for Performance Reports)
  equityCurveImage: text("equity_curve_image"),
  profitFactor: integer("profit_factor"),
  drawdownPercent: integer("drawdown_percent"),
  winPercent: integer("win_percent"),
  broker: text("broker"),
  monthsTested: integer("months_tested"),
  
  // Legacy fields
  fileUrl: text("file_url"),
  imageUrl: text("image_url"),
  imageUrls: text("image_urls").array(),
  postLogoUrl: text("post_logo_url"),
  views: integer("views").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  averageRating: integer("average_rating"),
  reviewCount: integer("review_count").notNull().default(0),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("pending"),
  slug: text("slug").notNull().unique(),
  focusKeyword: text("focus_keyword"),
  autoMetaDescription: text("auto_meta_description"),
  autoImageAltTexts: text("auto_image_alt_texts").array(),
  metaTitle: text("meta_title"),
  metaKeywords: text("meta_keywords"),
  
  // Ranking system
  salesScore: integer("sales_score").notNull().default(0),
  lastSalesUpdate: timestamp("last_sales_update"),
  
  // Marketplace moderation fields
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  featured: boolean("featured").notNull().default(false),
  featuredUntil: timestamp("featured_until"),
  deletedAt: timestamp("deleted_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  authorIdIdx: index("idx_content_author_id").on(table.authorId),
  statusIdx: index("idx_content_status").on(table.status),
  categoryIdx: index("idx_content_category").on(table.category),
  slugIdx: index("idx_content_slug").on(table.slug),
  salesScoreIdx: index("idx_content_sales_score").on(table.salesScore),
  featuredIdx: index("idx_content_featured").on(table.featured),
  deletedAtIdx: index("idx_content_deleted_at").on(table.deletedAt),
}));

export const contentPurchases = pgTable("content_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => content.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  priceCoins: integer("price_coins").notNull(),
  transactionId: varchar("transaction_id").notNull().references(() => coinTransactions.id),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
}, (table) => ({
  buyerIdIdx: index("idx_content_purchases_user_id").on(table.buyerId),
  contentIdIdx: index("idx_content_purchases_content_id").on(table.contentId),
}));

export const contentReviews = pgTable("content_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => content.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review").notNull(),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("pending"),
  rewardGiven: boolean("reward_given").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueContentUserReview: uniqueIndex("idx_content_reviews_unique_content_user").on(table.contentId, table.userId),
}));

export const contentLikes = pgTable("content_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => content.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_content_likes_user_id").on(table.userId),
  uniqueContentUserLike: uniqueIndex("idx_content_likes_unique_content_user").on(table.contentId, table.userId),
}));

export const contentReplies = pgTable("content_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => content.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  parentId: varchar("parent_id").references((): any => contentReplies.id),
  body: text("body").notNull(),
  rating: integer("rating"),
  imageUrls: text("image_urls").array(),
  helpful: integer("helpful").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const brokers = pgTable("brokers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  yearFounded: integer("year_founded"),
  regulation: text("regulation"),
  regulationSummary: text("regulation_summary"),
  platform: text("platform"),
  spreadType: text("spread_type"),
  minSpread: numeric("min_spread", { precision: 10, scale: 2 }),
  overallRating: integer("overall_rating").default(0),
  reviewCount: integer("review_count").notNull().default(0),
  scamReportCount: integer("scam_report_count").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("pending"),
  
  // Admin Moderation Fields
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  scamWarning: boolean("scam_warning").notNull().default(false),
  scamWarningReason: text("scam_warning_reason"),
  deletedAt: timestamp("deleted_at"),
  
  // Missing Trading Info (from specification)
  country: text("country"),
  minDeposit: text("min_deposit"),
  leverage: text("leverage"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  slugIdx: index("idx_brokers_slug").on(table.slug),
  statusIdx: index("idx_brokers_status").on(table.status),
  regulationIdx: index("idx_brokers_regulation").on(table.regulation),
  platformIdx: index("idx_brokers_platform").on(table.platform),
  verifiedIdx: index("idx_brokers_verified").on(table.isVerified),
  scamWarningIdx: index("idx_brokers_scam_warning").on(table.scamWarning),
  deletedAtIdx: index("idx_brokers_deleted_at").on(table.deletedAt),
  countryIdx: index("idx_brokers_country").on(table.country),
}));

export const brokerReviews = pgTable("broker_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brokerId: varchar("broker_id").notNull().references(() => brokers.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  reviewTitle: text("review_title").notNull(),
  reviewBody: text("review_body").notNull(),
  isScamReport: boolean("is_scam_report").notNull().default(false),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("pending"),
  
  // Admin Moderation Fields
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  // Scam Report Severity (only for isScamReport=true)
  scamSeverity: text("scam_severity").$type<"low" | "medium" | "high" | "critical">(),
  
  datePosted: timestamp("date_posted").notNull().defaultNow(),
}, (table) => ({
  brokerIdIdx: index("idx_broker_reviews_broker_id").on(table.brokerId),
  uniqueBrokerUserReview: uniqueIndex("idx_broker_reviews_unique_broker_user").on(table.brokerId, table.userId),
  severityIdx: index("idx_broker_reviews_severity").on(table.scamSeverity),
}));

export const userFollows = pgTable("user_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  followerIdIdx: index("idx_user_follows_follower_id").on(table.followerId),
  uniqueFollowerFollowing: uniqueIndex("idx_user_follows_unique_follower_following").on(table.followerId, table.followingId),
}));

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  conversationIdIdx: index("idx_messages_conversation_id").on(table.conversationId),
  senderIdIdx: index("idx_messages_sender_id").on(table.senderId),
  recipientIdIdx: index("idx_messages_recipient_id").on(table.recipientId),
  createdAtIdx: index("idx_messages_created_at").on(table.createdAt),
  isReadIdx: index("idx_messages_is_read").on(table.isRead),
}));

// Message Reactions
export const messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  messageUserIdx: index("message_reactions_msg_user_idx").on(table.messageId, table.userId),
}));

// Notifications system
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull().$type<"reply" | "like" | "follow" | "purchase" | "badge" | "system">(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_notifications_user_id").on(table.userId),
  isReadIdx: index("idx_notifications_is_read").on(table.isRead),
  createdAtIdx: index("idx_notifications_created_at").on(table.createdAt),
}));

// Forum Threads (separate from marketplace content)
export const forumThreads = pgTable("forum_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
  categorySlug: text("category_slug").notNull(),
  subcategorySlug: text("subcategory_slug"), // Sub-category if applicable
  title: text("title").notNull(),
  body: text("body").notNull(),
  slug: text("slug").notNull().unique(),
  focusKeyword: text("focus_keyword"),
  metaDescription: text("meta_description"),
  metaTitle: text("meta_title"),
  metaKeywords: text("meta_keywords"),
  
  // Enhanced SEO & Thread Type
  threadType: text("thread_type").notNull().$type<"question" | "discussion" | "review" | "journal" | "guide" | "program_sharing">().default("discussion"),
  seoExcerpt: text("seo_excerpt"), // 120-160 chars, optional
  primaryKeyword: text("primary_keyword"), // 1-6 words, optional
  language: text("language").notNull().default("en"),
  
  // Trading Metadata (stored as arrays for multi-select)
  instruments: text("instruments").array().default(sql`'{}'::text[]`), // XAUUSD, EURUSD, etc.
  timeframes: text("timeframes").array().default(sql`'{}'::text[]`), // M1, M5, H1, etc.
  strategies: text("strategies").array().default(sql`'{}'::text[]`), // scalping, swing, etc.
  platform: text("platform"), // MT4, MT5, cTrader, TradingView, Other
  broker: text("broker"), // Free text broker name
  riskNote: text("risk_note"), // Optional risk management note
  hashtags: text("hashtags").array().default(sql`'{}'::text[]`), // Social hashtags
  
  // Review-specific fields (only for threadType=review)
  reviewTarget: text("review_target"), // EA/Indicator/Broker name
  reviewVersion: text("review_version"),
  reviewRating: integer("review_rating"), // 1-5 stars
  reviewPros: text("review_pros").array(),
  reviewCons: text("review_cons").array(),
  
  // Question-specific fields (only for threadType=question)
  questionSummary: text("question_summary"), // "What do you want solved?"
  acceptedAnswerId: varchar("accepted_answer_id"), // Reference to accepted reply
  
  // Attachments
  attachmentUrls: text("attachment_urls").array().default(sql`'{}'::text[]`),
  
  // Status & Moderation
  isPinned: boolean("is_pinned").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  isSolved: boolean("is_solved").notNull().default(false),
  views: integer("views").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("approved"),
  
  // Ranking system
  engagementScore: integer("engagement_score").notNull().default(0),
  lastScoreUpdate: timestamp("last_score_update"),
  helpfulVotes: integer("helpful_votes").notNull().default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  categorySlugIdx: index("idx_forum_threads_category").on(table.categorySlug),
  subcategorySlugIdx: index("idx_forum_threads_subcategory").on(table.subcategorySlug),
  threadTypeIdx: index("idx_forum_threads_type").on(table.threadType),
  statusIdx: index("idx_forum_threads_status").on(table.status),
  isPinnedIdx: index("idx_forum_threads_pinned").on(table.isPinned),
  engagementScoreIdx: index("idx_forum_threads_engagement").on(table.engagementScore),
  lastActivityAtIdx: index("idx_forum_threads_last_activity").on(table.lastActivityAt),
  slugIdx: index("idx_forum_threads_slug").on(table.slug),
  helpfulVotesIdx: index("idx_forum_threads_helpful_votes").on(table.helpfulVotes),
}));

// Forum Thread Replies (with SEO for each reply)
export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => forumThreads.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  parentId: varchar("parent_id").references((): any => forumReplies.id),
  body: text("body").notNull(),
  slug: text("slug").notNull().unique(), // SEO: Each reply gets unique slug for Google indexing
  metaDescription: text("meta_description"), // SEO: Auto-generated from body
  imageUrls: text("image_urls").array(),
  helpful: integer("helpful").notNull().default(0),
  helpfulVotes: integer("helpful_votes").notNull().default(0),
  isAccepted: boolean("is_accepted").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Moderation fields
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("approved"),
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
}, (table) => ({
  threadIdIdx: index("idx_forum_replies_thread_id").on(table.threadId),
  createdAtIdx: index("idx_forum_replies_created_at").on(table.createdAt),
  slugIdx: index("idx_forum_replies_slug").on(table.slug),
  helpfulVotesIdx: index("idx_forum_replies_helpful_votes").on(table.helpfulVotes),
  statusIdx: index("idx_forum_replies_status").on(table.status),
}));

// Forum Categories with dynamic stats and hierarchical support
export const forumCategories = pgTable("forum_categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Icon name from lucide-react
  color: text("color").notNull().default("bg-primary"),
  parentSlug: text("parent_slug"), // For subcategories: references parent category slug
  threadCount: integer("thread_count").notNull().default(0),
  postCount: integer("post_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  parentSlugIdx: index("idx_forum_categories_parent_slug").on(table.parentSlug),
}));

// SEO-Optimized Categories for Marketplace Content
export const seoCategories = pgTable("seo_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // URL-friendly slug (e.g., "forex-trading", "expert-advisors")
  name: text("name").notNull(), // Display name (e.g., "Forex Trading", "Expert Advisors")
  urlPath: text("url_path").notNull().unique(), // Full URL path (e.g., "/forex-trading/expert-advisors/")
  parentId: varchar("parent_id").references((): any => seoCategories.id),
  categoryType: text("category_type").notNull().$type<"main" | "sub" | "leaf">().default("main"),
  oldSlug: text("old_slug"), // For mapping from old category names
  
  // SEO Fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  h1Title: text("h1_title"), // Custom H1 for category pages
  
  // Display Settings
  icon: text("icon").notNull().default("Folder"), // Lucide icon name
  color: text("color").notNull().default("bg-primary"),
  sortOrder: integer("sort_order").notNull().default(0),
  showInMenu: boolean("show_in_menu").notNull().default(true),
  showInSidebar: boolean("show_in_sidebar").notNull().default(true),
  
  // Stats
  contentCount: integer("content_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  slugIdx: index("idx_seo_categories_slug").on(table.slug),
  urlPathIdx: index("idx_seo_categories_url_path").on(table.urlPath),
  parentIdIdx: index("idx_seo_categories_parent_id").on(table.parentId),
  oldSlugIdx: index("idx_seo_categories_old_slug").on(table.oldSlug),
}));

// Category URL Redirects for SEO preservation
export const categoryRedirects = pgTable("category_redirects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  oldUrl: text("old_url").notNull().unique(),
  newUrl: text("new_url").notNull(),
  redirectType: integer("redirect_type").notNull().default(301), // 301 for permanent, 302 for temporary
  hitCount: integer("hit_count").notNull().default(0),
  lastUsed: timestamp("last_used"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  oldUrlIdx: index("idx_category_redirects_old_url").on(table.oldUrl),
  isActiveIdx: index("idx_category_redirects_active").on(table.isActive),
}));

// User Badges & Trust Levels
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeType: text("badge_type").notNull().$type<"verified_trader" | "top_contributor" | "ea_expert" | "helpful_member" | "early_adopter">(),
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
});

// Activity Feed for real-time updates
export const activityFeed = pgTable("activity_feed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull().$type<"thread_created" | "reply_posted" | "content_published" | "purchase_made" | "review_posted" | "badge_earned">(),
  entityType: text("entity_type").notNull().$type<"thread" | "reply" | "content" | "purchase" | "review" | "badge">(),
  entityId: varchar("entity_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_activity_feed_user_id").on(table.userId),
}));

// Double-Entry Ledger Tables (Immutable Accounting System)

// User Wallet - One row per user
export const userWallet = pgTable("user_wallet", {
  walletId: varchar("wallet_id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  balance: integer("balance").notNull().default(0),
  availableBalance: integer("available_balance").notNull().default(0),
  status: text("status").notNull().default("active"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: uniqueIndex("idx_user_wallet_user_id").on(table.userId),
  statusIdx: index("idx_user_wallet_status").on(table.status),
}));

// Coin Ledger Transactions - Header for grouped entries
export const coinLedgerTransactions = pgTable("coin_ledger_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  context: json("context").$type<Record<string, any>>(),
  externalRef: text("external_ref"),
  initiatorUserId: varchar("initiator_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  status: text("status").notNull().default("pending"),
}, (table) => ({
  typeIdx: index("idx_ledger_tx_type").on(table.type),
  statusIdx: index("idx_ledger_tx_status").on(table.status),
  initiatorIdx: index("idx_ledger_tx_initiator").on(table.initiatorUserId),
}));

// Coin Journal Entries - Immutable debit/credit entries
export const coinJournalEntries = pgTable("coin_journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ledgerTransactionId: varchar("ledger_transaction_id").notNull()
    .references(() => coinLedgerTransactions.id),
  walletId: varchar("wallet_id").notNull().references(() => userWallet.walletId),
  direction: text("direction").notNull(),
  amount: integer("amount").notNull(),
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  ledgerTxIdx: index("idx_journal_ledger_tx").on(table.ledgerTransactionId),
  walletIdx: index("idx_journal_wallet").on(table.walletId),
  createdAtIdx: index("idx_journal_created_at").on(table.createdAt),
  amountCheck: check("chk_amount_positive", sql`${table.amount} > 0`),
}));

// Ledger Reconciliation Runs - Audit trail
export const ledgerReconciliationRuns = pgTable("ledger_reconciliation_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull(),
  driftCount: integer("drift_count").notNull().default(0),
  maxDelta: integer("max_delta").notNull().default(0),
  report: json("report").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Dashboard Preferences - User customization
export const dashboardPreferences = pgTable("dashboard_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  widgetOrder: text("widget_order").array().notNull(),
  enabledWidgets: text("enabled_widgets").array().notNull(),
  layoutType: text("layout_type").notNull().$type<"default" | "compact" | "comfortable">().default("default"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_dashboard_preferences_user_id").on(table.userId),
}));

// Daily Activity Tracking - To enforce daily limits
export const dailyActivityLimits = pgTable("daily_activity_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityDate: timestamp("activity_date").notNull().defaultNow(),
  repliesCount: integer("replies_count").notNull().default(0),
  reportsCount: integer("reports_count").notNull().default(0),
  backtestsCount: integer("backtests_count").notNull().default(0),
  lastCheckinAt: timestamp("last_checkin_at"),
  consecutiveDays: integer("consecutive_days").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userDateIdx: uniqueIndex("idx_daily_activity_user_date").on(table.userId, table.activityDate),
  userIdIdx: index("idx_daily_activity_user_id").on(table.userId),
}));

// Referral System - Track referrals and commissions
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id),
  referralCode: varchar("referral_code", { length: 50 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  totalEarnings: integer("total_earnings").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  referrerIdx: index("idx_referrals_referrer_id").on(table.referrerId),
  referredIdx: uniqueIndex("idx_referrals_referred_user_id").on(table.referredUserId),
  referralCodeIdx: index("idx_referrals_code").on(table.referralCode),
}));

// Goals table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  goalType: varchar("goal_type", { length: 50 }).notNull(),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").notNull().default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_goals_user_id").on(table.userId),
}));

// Achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  requirement: integer("requirement").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  slugIdx: index("idx_achievements_slug").on(table.slug),
}));

// User Achievements table
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  progress: integer("progress").notNull().default(0),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_user_achievements_user_id").on(table.userId),
  achievementIdIdx: index("idx_user_achievements_achievement_id").on(table.achievementId),
}));

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).default("marketing"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  budget: integer("budget"),
  discountPercent: integer("discount_percent"),
  discountCode: varchar("discount_code", { length: 50 }).unique(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  uses: integer("uses").notNull().default(0),
  revenue: integer("revenue").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_campaigns_user_id").on(table.userId),
  discountCodeIdx: index("idx_campaigns_discount_code").on(table.discountCode),
}));

// Dashboard Settings table
export const dashboardSettings = pgTable("dashboard_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  layout: json("layout"),
  theme: varchar("theme", { length: 20 }).default("light"),
  autoRefresh: boolean("auto_refresh").default(true),
  refreshInterval: integer("refresh_interval").default(30),
  favorites: json("favorites"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: uniqueIndex("idx_dashboard_settings_user_id").on(table.userId),
}));

// Profiles table
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  coverPhoto: text("cover_photo"),
  bio: text("bio"),
  tradingLevel: varchar("trading_level", { length: 50 }),
  tradingStyle: json("trading_style"),
  tradingPlatform: json("trading_platform"),
  tradingSince: date("trading_since"),
  specialties: json("specialties"),
  telegram: varchar("telegram", { length: 100 }),
  discord: varchar("discord", { length: 100 }),
  twitter: varchar("twitter", { length: 100 }),
  youtube: varchar("youtube", { length: 200 }),
  tradingview: varchar("tradingview", { length: 200 }),
  website: varchar("website", { length: 200 }),
  profileLayout: varchar("profile_layout", { length: 20 }).default("professional"),
  customSlug: varchar("custom_slug", { length: 100 }).unique(),
  isPublic: boolean("is_public").default(true),
  isPremium: boolean("is_premium").default(false),
  brandColors: json("brand_colors"),
  showRevenue: boolean("show_revenue").default(true),
  showSales: boolean("show_sales").default(true),
  showFollowers: boolean("show_followers").default(true),
  showActivity: boolean("show_activity").default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: uniqueIndex("idx_profiles_user_id").on(table.userId),
  customSlugIdx: index("idx_profiles_custom_slug").on(table.customSlug),
}));

// User Settings table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  notificationPreferences: json("notification_preferences"),
  privacySettings: json("privacy_settings"),
  displaySettings: json("display_settings"),
  communicationSettings: json("communication_settings"),
  publishingDefaults: json("publishing_defaults"),
  advancedSettings: json("advanced_settings"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: uniqueIndex("idx_user_settings_user_id").on(table.userId),
}));

// ============================================================================
// ADMIN DASHBOARD TABLES (20 tables for ultimate admin experience)
// ============================================================================

// 1. Admin Actions - Log all admin operations
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  actionType: varchar("action_type").notNull(),
  targetType: varchar("target_type").notNull(),
  targetId: varchar("target_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  adminIdIdx: index("idx_admin_actions_admin_id").on(table.adminId),
  actionTypeIdx: index("idx_admin_actions_action_type").on(table.actionType),
  targetTypeIdx: index("idx_admin_actions_target_type").on(table.targetType),
  createdAtIdx: index("idx_admin_actions_created_at").on(table.createdAt),
}));

// 2. Moderation Queue - Content pending review
export const moderationQueue = pgTable("moderation_queue", {
  id: serial("id").primaryKey(),
  contentType: varchar("content_type").notNull(),
  contentId: varchar("content_id").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("pending"),
  priorityScore: integer("priority_score").notNull().default(0),
  spamScore: numeric("spam_score", { precision: 3, scale: 2 }),
  sentimentScore: numeric("sentiment_score", { precision: 3, scale: 2 }),
  flaggedReasons: text("flagged_reasons").array().default(sql`'{}'::text[]`),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("idx_moderation_queue_status").on(table.status),
  priorityScoreIdx: index("idx_moderation_queue_priority_score").on(table.priorityScore),
  createdAtIdx: index("idx_moderation_queue_created_at").on(table.createdAt),
}));

// 3. Reported Content - User-reported violations
export const reportedContent = pgTable("reported_content", {
  id: serial("id").primaryKey(),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  contentType: varchar("content_type").notNull(),
  contentId: varchar("content_id").notNull(),
  reportReason: varchar("report_reason").notNull(),
  description: text("description").notNull(),
  status: varchar("status").notNull().default("pending"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  actionTaken: varchar("action_taken"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => ({
  statusIdx: index("idx_reported_content_status").on(table.status),
  contentTypeIdx: index("idx_reported_content_content_type").on(table.contentType),
  reporterIdIdx: index("idx_reported_content_reporter_id").on(table.reporterId),
  createdAtIdx: index("idx_reported_content_created_at").on(table.createdAt),
}));

// 4. System Settings - Platform configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  settingKeyIdx: index("idx_system_settings_setting_key").on(table.settingKey),
  categoryIdx: index("idx_system_settings_category").on(table.category),
}));

// 5. Support Tickets - Customer support system
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: varchar("subject").notNull(),
  description: text("description").notNull(),
  status: varchar("status").notNull().default("open"),
  priority: varchar("priority").notNull().default("medium"),
  category: varchar("category").notNull(),
  assignedTo: varchar("assigned_to").references(() => users.id),
  replies: jsonb("replies").default(sql`'[]'::jsonb`),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => ({
  statusIdx: index("idx_support_tickets_status").on(table.status),
  priorityIdx: index("idx_support_tickets_priority").on(table.priority),
  userIdIdx: index("idx_support_tickets_user_id").on(table.userId),
  assignedToIdx: index("idx_support_tickets_assigned_to").on(table.assignedTo),
  createdAtIdx: index("idx_support_tickets_created_at").on(table.createdAt),
}));

// 6. Announcements - Platform-wide announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type").notNull().default("info"),
  targetAudience: varchar("target_audience").notNull().default("all"),
  segmentId: integer("segment_id"),
  displayType: varchar("display_type").notNull().default("banner"),
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  views: integer("views").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
}, (table) => ({
  isActiveIdx: index("idx_announcements_is_active").on(table.isActive),
  targetAudienceIdx: index("idx_announcements_target_audience").on(table.targetAudience),
  startDateIdx: index("idx_announcements_start_date").on(table.startDate),
  endDateIdx: index("idx_announcements_end_date").on(table.endDate),
}));

// 7. IP Bans - IP address banning
export const ipBans = pgTable("ip_bans", {
  id: serial("id").primaryKey(),
  ipAddress: varchar("ip_address").notNull().unique(),
  reason: text("reason").notNull(),
  banType: varchar("ban_type").notNull().default("permanent"),
  expiresAt: timestamp("expires_at"),
  bannedBy: varchar("banned_by").notNull().references(() => users.id),
  bannedAt: timestamp("banned_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  ipAddressIdx: index("idx_ip_bans_ip_address").on(table.ipAddress),
  isActiveIdx: index("idx_ip_bans_is_active").on(table.isActive),
  expiresAtIdx: index("idx_ip_bans_expires_at").on(table.expiresAt),
}));

// 8. Admin Roles - Admin permission system
export const adminRoles = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  role: varchar("role").notNull(),
  permissions: jsonb("permissions").notNull(),
  grantedBy: varchar("granted_by").notNull().references(() => users.id),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_admin_roles_user_id").on(table.userId),
  roleIdx: index("idx_admin_roles_role").on(table.role),
}));

// 10. User Segments - User segmentation for targeting
export const userSegments = pgTable("user_segments", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  rules: jsonb("rules").notNull(),
  userCount: integer("user_count").notNull().default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  nameIdx: index("idx_user_segments_name").on(table.name),
  createdAtIdx: index("idx_user_segments_created_at").on(table.createdAt),
}));

// 11. Automation Rules - Automation workflows
export const automationRules = pgTable("automation_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  triggerType: varchar("trigger_type").notNull(),
  triggerConfig: jsonb("trigger_config").notNull(),
  actionType: varchar("action_type").notNull(),
  actionConfig: jsonb("action_config").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  executionCount: integer("execution_count").notNull().default(0),
  lastExecuted: timestamp("last_executed"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  triggerTypeIdx: index("idx_automation_rules_trigger_type").on(table.triggerType),
  isActiveIdx: index("idx_automation_rules_is_active").on(table.isActive),
  createdAtIdx: index("idx_automation_rules_created_at").on(table.createdAt),
}));

// 12. A/B Tests - A/B testing experiments
export const abTests = pgTable("ab_tests", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  variants: jsonb("variants").default(sql`'[]'::jsonb`),
  trafficAllocation: jsonb("traffic_allocation").notNull(),
  status: varchar("status").notNull().default("draft"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  winnerVariant: varchar("winner_variant"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("idx_ab_tests_status").on(table.status),
  startDateIdx: index("idx_ab_tests_start_date").on(table.startDate),
  endDateIdx: index("idx_ab_tests_end_date").on(table.endDate),
}));

// 13. Feature Flags - Feature toggle system
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  flagKey: varchar("flag_key").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(false),
  rolloutPercentage: integer("rollout_percentage").notNull().default(0),
  targetUsers: text("target_users").array().default(sql`'{}'::text[]`),
  targetSegments: integer("target_segments").array().default(sql`'{}'::integer[]`),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  flagKeyIdx: index("idx_feature_flags_flag_key").on(table.flagKey),
  isEnabledIdx: index("idx_feature_flags_is_enabled").on(table.isEnabled),
}));

// 14. API Keys - API key management
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  name: varchar("name").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  permissions: text("permissions").array().default(sql`'{}'::text[]`),
  rateLimit: integer("rate_limit").notNull().default(60),
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  keyIdx: index("idx_api_keys_key").on(table.key),
  userIdIdx: index("idx_api_keys_user_id").on(table.userId),
  isActiveIdx: index("idx_api_keys_is_active").on(table.isActive),
}));

// 15. Webhooks - Webhook configurations
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  url: varchar("url").notNull(),
  events: text("events").array().default(sql`'{}'::text[]`),
  secret: varchar("secret").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastTriggered: timestamp("last_triggered"),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),
}, (table) => ({
  isActiveIdx: index("idx_webhooks_is_active").on(table.isActive),
  createdAtIdx: index("idx_webhooks_created_at").on(table.createdAt),
}));

// 16. Scheduled Jobs - Cron job management
export const scheduledJobs = pgTable("scheduled_jobs", {
  id: serial("id").primaryKey(),
  jobKey: varchar("job_key").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  schedule: varchar("schedule").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  lastStatus: varchar("last_status"),
  lastError: text("last_error"),
  executionCount: integer("execution_count").notNull().default(0),
}, (table) => ({
  jobKeyIdx: index("idx_scheduled_jobs_job_key").on(table.jobKey),
  isActiveIdx: index("idx_scheduled_jobs_is_active").on(table.isActive),
  nextRunIdx: index("idx_scheduled_jobs_next_run").on(table.nextRun),
}));

// 17. Performance Metrics - Performance tracking
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  metricType: varchar("metric_type").notNull(),
  metricName: varchar("metric_name").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit").notNull(),
  metadata: jsonb("metadata"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
}, (table) => ({
  metricTypeIdx: index("idx_performance_metrics_metric_type").on(table.metricType),
  metricNameIdx: index("idx_performance_metrics_metric_name").on(table.metricName),
  recordedAtIdx: index("idx_performance_metrics_recorded_at").on(table.recordedAt),
}));

// 18. Security Events - Security event logging
export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type").notNull(),
  severity: varchar("severity").notNull(),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: varchar("ip_address").notNull(),
  details: jsonb("details").notNull(),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  eventTypeIdx: index("idx_security_events_event_type").on(table.eventType),
  severityIdx: index("idx_security_events_severity").on(table.severity),
  isResolvedIdx: index("idx_security_events_is_resolved").on(table.isResolved),
  createdAtIdx: index("idx_security_events_created_at").on(table.createdAt),
}));

// 19. Media Library - Central media storage
export const mediaLibrary = pgTable("media_library", {
  id: serial("id").primaryKey(),
  filename: varchar("filename").notNull(),
  originalFilename: varchar("original_filename").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  altText: varchar("alt_text"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  usageCount: integer("usage_count").notNull().default(0),
}, (table) => ({
  uploadedByIdx: index("idx_media_library_uploaded_by").on(table.uploadedBy),
  mimeTypeIdx: index("idx_media_library_mime_type").on(table.mimeType),
  uploadedAtIdx: index("idx_media_library_uploaded_at").on(table.uploadedAt),
}));

// 20. Content Revisions - Version control for content
export const contentRevisions = pgTable("content_revisions", {
  id: serial("id").primaryKey(),
  contentType: varchar("content_type").notNull(),
  contentId: varchar("content_id").notNull(),
  revisionNumber: integer("revision_number").notNull(),
  data: jsonb("data").notNull(),
  changedFields: text("changed_fields").array().default(sql`'{}'::text[]`),
  changedBy: varchar("changed_by").notNull().references(() => users.id),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  contentTypeIdx: index("idx_content_revisions_content_type").on(table.contentType),
  contentIdIdx: index("idx_content_revisions_content_id").on(table.contentId),
  revisionNumberIdx: index("idx_content_revisions_revision_number").on(table.revisionNumber),
  createdAtIdx: index("idx_content_revisions_created_at").on(table.createdAt),
}));

// ========================================
// CLIENT DASHBOARD TABLES
// ========================================

// Trading Journal - Track user trades and performance
export const tradingJournalEntries = pgTable("trading_journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tradingPair: varchar("trading_pair").notNull(),
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 20, scale: 8 }),
  positionSize: decimal("position_size", { precision: 20, scale: 8 }).notNull(),
  positionType: varchar("position_type").notNull().$type<"long" | "short">(),
  entryDate: timestamp("entry_date").notNull(),
  exitDate: timestamp("exit_date"),
  profitLoss: decimal("profit_loss", { precision: 20, scale: 8 }),
  profitLossPercent: decimal("profit_loss_percent", { precision: 10, scale: 4 }),
  strategy: varchar("strategy"),
  notes: text("notes"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  screenshotUrls: text("screenshot_urls").array().default(sql`'{}'::text[]`),
  broker: varchar("broker"),
  status: varchar("status").notNull().default("open").$type<"open" | "closed">(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_trading_journal_user_id").on(table.userId),
  statusIdx: index("idx_trading_journal_status").on(table.status),
  entryDateIdx: index("idx_trading_journal_entry_date").on(table.entryDate),
  tradingPairIdx: index("idx_trading_journal_trading_pair").on(table.tradingPair),
}));

// Watchlists - User custom symbol lists
export const watchlists = pgTable("watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  symbols: text("symbols").array().default(sql`'{}'::text[]`),
  isDefault: boolean("is_default").notNull().default(false),
  color: varchar("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_watchlists_user_id").on(table.userId),
  isDefaultIdx: index("idx_watchlists_is_default").on(table.isDefault),
}));

// Price Alerts - Real-time price notifications
export const priceAlerts = pgTable("price_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: varchar("symbol").notNull(),
  targetPrice: decimal("target_price", { precision: 20, scale: 8 }).notNull(),
  condition: varchar("condition").notNull().$type<"above" | "below" | "equals">(),
  isActive: boolean("is_active").notNull().default(true),
  isTriggered: boolean("is_triggered").notNull().default(false),
  triggeredAt: timestamp("triggered_at"),
  notificationMethod: varchar("notification_method").notNull().default("in_app").$type<"in_app" | "email" | "push" | "all">(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_price_alerts_user_id").on(table.userId),
  symbolIdx: index("idx_price_alerts_symbol").on(table.symbol),
  isActiveIdx: index("idx_price_alerts_is_active").on(table.isActive),
  isTriggeredIdx: index("idx_price_alerts_is_triggered").on(table.isTriggered),
}));

// Saved Searches - Quick access to frequent searches
export const savedSearches = pgTable("saved_searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  query: text("query").notNull(),
  filters: jsonb("filters"),
  category: varchar("category").$type<"content" | "threads" | "users" | "brokers" | "all">(),
  useCount: integer("use_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_saved_searches_user_id").on(table.userId),
  categoryIdx: index("idx_saved_searches_category").on(table.category),
}));

// Chat Rooms - Group discussions and channels
export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  roomType: varchar("room_type").notNull().$type<"public" | "private" | "trading_pair" | "strategy">(),
  category: varchar("category"),
  memberCount: integer("member_count").notNull().default(0),
  messageCount: integer("message_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  roomTypeIdx: index("idx_chat_rooms_room_type").on(table.roomType),
  categoryIdx: index("idx_chat_rooms_category").on(table.category),
  isActiveIdx: index("idx_chat_rooms_is_active").on(table.isActive),
  lastMessageAtIdx: index("idx_chat_rooms_last_message_at").on(table.lastMessageAt),
}));

// Chat Room Members - Track room membership
export const chatRoomMembers = pgTable("chat_room_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role").notNull().default("member").$type<"admin" | "moderator" | "member">(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  lastReadAt: timestamp("last_read_at"),
  isMuted: boolean("is_muted").notNull().default(false),
}, (table) => ({
  roomIdIdx: index("idx_chat_room_members_room_id").on(table.roomId),
  userIdIdx: index("idx_chat_room_members_user_id").on(table.userId),
  roomUserIdx: index("idx_chat_room_members_room_user").on(table.roomId, table.userId),
}));

// Chat Room Messages - Real-time messaging
export const chatRoomMessages = pgTable("chat_room_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: varchar("message_type").notNull().default("text").$type<"text" | "image" | "file" | "system">(),
  attachmentUrl: text("attachment_url"),
  replyToId: varchar("reply_to_id"),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
  reactions: jsonb("reactions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  roomIdIdx: index("idx_chat_room_messages_room_id").on(table.roomId),
  userIdIdx: index("idx_chat_room_messages_user_id").on(table.userId),
  createdAtIdx: index("idx_chat_room_messages_created_at").on(table.createdAt),
}));

// Dashboard Widgets - User dashboard customization
export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  widgetType: varchar("widget_type").notNull().$type<"kpi_cards" | "activity_feed" | "trading_journal" | "leaderboard" | "market_ticker" | "watchlist" | "portfolio" | "chat" | "achievements" | "news_feed" | "learning_progress" | "quick_actions">(),
  position: jsonb("position").notNull(),
  size: jsonb("size").notNull(),
  settings: jsonb("settings"),
  isVisible: boolean("is_visible").notNull().default(true),
  layoutName: varchar("layout_name").notNull().default("default"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_dashboard_widgets_user_id").on(table.userId),
  layoutNameIdx: index("idx_dashboard_widgets_layout_name").on(table.layoutName),
  widgetTypeIdx: index("idx_dashboard_widgets_widget_type").on(table.widgetType),
}));

// User Dashboard Layouts - Save multiple dashboard configurations
export const dashboardLayouts = pgTable("dashboard_layouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  layoutType: varchar("layout_type").notNull().default("trader").$type<"trader" | "publisher" | "learner" | "custom">(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_dashboard_layouts_user_id").on(table.userId),
  isDefaultIdx: index("idx_dashboard_layouts_is_default").on(table.isDefault),
}));

// Upsert User schema for Replit Auth (OIDC)
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;

// Insert User schema for traditional auth (username/password)
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  totalCoins: true,
  weeklyEarned: true,
  rank: true,
  youtubeUrl: true,
  instagramHandle: true,
  telegramHandle: true,
  myfxbookLink: true,
  investorId: true,
  investorPassword: true,
  isVerifiedTrader: true,
  emailNotifications: true,
  hasYoutubeReward: true,
  hasMyfxbookReward: true,
  hasInvestorReward: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertCoinTransactionSchema = createInsertSchema(coinTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertRechargeOrderSchema = createInsertSchema(rechargeOrders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  rejectedAt: true,
}).extend({
  amount: z.number().min(1000, "Minimum withdrawal is 1000 coins"),
  method: z.enum(["crypto", "paypal", "bank", "other"]).optional(),
  cryptoType: z.enum(["BTC", "ETH"]).optional(),
  walletAddress: z.string().min(26, "Invalid wallet address").max(100, "Invalid wallet address"),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  priority: true,
  adminNotes: true,
}).extend({
  type: z.enum(["bug", "feature", "improvement", "other"]),
  subject: z.string().min(10, "Subject must be at least 10 characters").max(200, "Subject must be at most 200 characters"),
  message: z.string().min(50, "Message must be at least 50 characters").max(5000, "Message must be at most 5000 characters"),
  email: z.string().email("Invalid email format").optional(),
});
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

// EA Category Options for multi-select
export const EA_CATEGORY_OPTIONS = [
  "Expert Advisor type",
  "Martingale type", 
  "Grid",
  "Arbitrage",
  "Hedging",
  "Scalping",
  "News",
  "Trend",
  "Level trading",
  "Neural networks",
  "Multicurrency"
] as const;

export type EACategoryOption = typeof EA_CATEGORY_OPTIONS[number];

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  downloads: true,
  likes: true,
  status: true,
}).extend({
  title: z.string().min(10).max(120),
  description: z.string().min(300), // Will contain HTML for rich text
  priceCoins: z.number().min(0).max(10000), // Allow free content (0 coins), EA-specific min enforced in publishContentSchema
  platform: z.enum(["MT4", "MT5", "Both"]).optional(),
  version: z.string().optional(),
  // Tags now includes categories + custom categories (max 5 category selections + other tags)
  tags: z.array(z.string()).max(13).optional(), // Max 5 categories + 8 other tags
  files: z.array(z.object({
    name: z.string(),
    size: z.number(),
    url: z.string(),
    checksum: z.string(),
  })).min(1, "At least 1 file is required").optional(),
  images: z.array(z.object({
    url: z.string(),
    isCover: z.boolean(),
    order: z.number(),
  })).min(1, "At least 1 image is required").optional(),
  brokerCompat: z.array(z.string()).optional(),
  minDeposit: z.number().optional(),
  hedging: z.boolean().optional(),
  changelog: z.string().optional(),
  license: z.string().optional(),
  // Evidence fields (conditionally required based on tags)
  equityCurveImage: z.string().optional(),
  profitFactor: z.number().optional(),
  drawdownPercent: z.number().optional(),
  winPercent: z.number().optional(),
  broker: z.string().optional(),
  monthsTested: z.number().optional(),
  
  // Auto-generated SEO fields (optional, can be provided or generated)
  slug: z.string().optional(),
  focusKeyword: z.string().optional(),
  autoMetaDescription: z.string().optional(),
  autoImageAltTexts: z.array(z.string()).optional(),
});

export const insertContentPurchaseSchema = createInsertSchema(contentPurchases).omit({
  id: true,
  purchasedAt: true,
  sellerId: true,
  transactionId: true,
  priceCoins: true,
});

export const insertContentReviewSchema = createInsertSchema(contentReviews).omit({
  id: true,
  createdAt: true,
  status: true,
  rewardGiven: true,
}).extend({
  rating: z.number().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  review: z.string().min(100, "Review must be at least 100 characters").max(1000, "Review must be at most 1000 characters"),
});

export const insertContentLikeSchema = createInsertSchema(contentLikes).omit({
  id: true,
  createdAt: true,
});

export const insertContentReplySchema = createInsertSchema(contentReplies).omit({
  id: true,
  createdAt: true,
  helpful: true,
  isVerified: true,
}).extend({
  body: z.string().min(10).max(5000),
  rating: z.number().min(1).max(5).optional(),
});

export const insertBrokerSchema = createInsertSchema(brokers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  overallRating: true,
  reviewCount: true,
  scamReportCount: true,
  status: true,
  isVerified: true,
});

export const insertBrokerReviewSchema = createInsertSchema(brokerReviews).omit({
  id: true,
  datePosted: true,
  status: true,
}).extend({
  rating: z.number().min(1).max(5),
  reviewTitle: z.string().min(10).max(200),
  reviewBody: z.string().min(100).max(2000),
});

export const insertUserFollowSchema = createInsertSchema(userFollows).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
}).extend({
  body: z.string().min(1).max(5000),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
}).extend({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
});

export const updateUserProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional().or(z.literal("")),
  location: z.string().max(100).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  instagramHandle: z.string().min(1).max(50).optional().or(z.literal("")),
  telegramHandle: z.string().min(1).max(50).optional().or(z.literal("")),
  myfxbookLink: z.string().url().optional().or(z.literal("")),
  investorId: z.string().optional().or(z.literal("")),
  investorPassword: z.string().optional().or(z.literal("")),
  emailNotifications: z.boolean().optional(),
});

// User types already defined above near upsertUserSchema
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InsertCoinTransaction = z.infer<typeof insertCoinTransactionSchema>;
export type RechargeOrder = typeof rechargeOrders.$inferSelect;
export type InsertRechargeOrder = z.infer<typeof insertRechargeOrderSchema>;
export type SelectSubscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type SelectWithdrawalRequest = typeof withdrawalRequests.$inferSelect; // Alias for consistency
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type ContentPurchase = typeof contentPurchases.$inferSelect;
export type InsertContentPurchase = z.infer<typeof insertContentPurchaseSchema>;
export type ContentReview = typeof contentReviews.$inferSelect;
export type InsertContentReview = z.infer<typeof insertContentReviewSchema>;
export type ContentLike = typeof contentLikes.$inferSelect;
export type InsertContentLike = z.infer<typeof insertContentLikeSchema>;
export type ContentReply = typeof contentReplies.$inferSelect;
export type InsertContentReply = z.infer<typeof insertContentReplySchema>;
export type Broker = typeof brokers.$inferSelect;
export type InsertBroker = z.infer<typeof insertBrokerSchema>;
export type BrokerReview = typeof brokerReviews.$inferSelect;
export type InsertBrokerReview = z.infer<typeof insertBrokerReviewSchema>;
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
});
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export const insertForumThreadSchema = createInsertSchema(forumThreads).omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  replyCount: true,
  likeCount: true,
  bookmarkCount: true,
  shareCount: true,
  lastActivityAt: true,
  status: true,
  lastScoreUpdate: true,
  acceptedAnswerId: true,
}).extend({
  // Core fields with proper validation
  title: z.string()
    .min(15, "Title must be at least 15 characters")
    .max(90, "Title must not exceed 90 characters")
    .refine(
      (val) => {
        const upperCount = (val.match(/[A-Z]/g) || []).length;
        const letterCount = (val.match(/[a-zA-Z]/g) || []).length;
        return letterCount === 0 || upperCount / letterCount < 0.5;
      },
      { message: "Let's tone this down a bit so more folks read it" }
    ),
  body: z.string()
    .min(150, "A little more context helps people reply. Two more sentences?")
    .max(50000, "Body is too long"),
  categorySlug: z.string().min(1),
  subcategorySlug: z.string().optional(),
  
  // Thread type and language
  threadType: z.enum(["question", "discussion", "review", "journal", "guide", "program_sharing"]).default("discussion"),
  language: z.string().default("en"),
  
  // Optional SEO fields
  seoExcerpt: z.string().optional().or(z.literal("")),
  primaryKeyword: z.string().optional().or(z.literal("")),
  
  // Trading metadata (optional multi-select)
  instruments: z.array(z.string()).optional().default([]),
  timeframes: z.array(z.string()).optional().default([]),
  strategies: z.array(z.string()).optional().default([]),
  platform: z.string().optional(),
  broker: z.string().max(40).optional(),
  riskNote: z.string().max(500).optional(),
  hashtags: z.array(z.string()).max(10, "Maximum 10 hashtags").optional().default([]),
  
  // Review-specific fields (conditional)
  reviewTarget: z.string().optional(),
  reviewVersion: z.string().optional(),
  reviewRating: z.number().int().min(1).max(5).optional(),
  reviewPros: z.array(z.string()).optional().default([]),
  reviewCons: z.array(z.string()).optional().default([]),
  
  // Question-specific fields (conditional)
  questionSummary: z.string().max(200).optional(),
  
  // Attachments
  attachmentUrls: z.array(z.string()).optional().default([]),
  
  // Status flags
  isPinned: z.boolean().optional().default(false),
  isLocked: z.boolean().optional().default(false),
  isSolved: z.boolean().optional().default(false),
  
  // Auto-generated SEO fields (optional, can be provided or generated)
  slug: z.string().optional(),
  focusKeyword: z.string().optional(),
  metaDescription: z.string().optional(),
  
  // Ranking field (optional, defaults to 0 if not provided)
  engagementScore: z.number().optional(),
});

export const insertForumReplySchema = createInsertSchema(forumReplies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpful: true,
  isAccepted: true,
  isVerified: true,
  slug: true,
  metaDescription: true,
}).extend({
  body: z.string().min(10).max(10000),
});

export const insertForumCategorySchema = createInsertSchema(forumCategories).omit({
  threadCount: true,
  postCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
});

export const insertSeoCategorySchema = createInsertSchema(seoCategories).omit({
  id: true,
  contentCount: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  urlPath: z.string().min(1).max(255),
});

export const insertCategoryRedirectSchema = createInsertSchema(categoryRedirects).omit({
  id: true,
  hitCount: true,
  lastUsed: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  awardedAt: true,
});

export const insertActivityFeedSchema = createInsertSchema(activityFeed).omit({
  id: true,
  createdAt: true,
}).extend({
  title: z.string().min(1).max(300),
  description: z.string().max(500).optional(),
});

export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertForumThread = z.infer<typeof insertForumThreadSchema>;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;
export type SeoCategory = typeof seoCategories.$inferSelect;
export type InsertSeoCategory = z.infer<typeof insertSeoCategorySchema>;
export type CategoryRedirect = typeof categoryRedirects.$inferSelect;
export type InsertCategoryRedirect = z.infer<typeof insertCategoryRedirectSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type ActivityFeed = typeof activityFeed.$inferSelect;
export type InsertActivityFeed = z.infer<typeof insertActivityFeedSchema>;

// Double-Entry Ledger schemas
export const insertUserWalletSchema = createInsertSchema(userWallet).omit({ walletId: true, updatedAt: true });
export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;
export type UserWallet = typeof userWallet.$inferSelect;

export const insertCoinLedgerTransactionSchema = createInsertSchema(coinLedgerTransactions)
  .omit({ id: true, createdAt: true, closedAt: true });
export type InsertCoinLedgerTransaction = z.infer<typeof insertCoinLedgerTransactionSchema>;
export type CoinLedgerTransaction = typeof coinLedgerTransactions.$inferSelect;

export const insertCoinJournalEntrySchema = createInsertSchema(coinJournalEntries)
  .omit({ id: true, createdAt: true });
export type InsertCoinJournalEntry = z.infer<typeof insertCoinJournalEntrySchema>;
export type CoinJournalEntry = typeof coinJournalEntries.$inferSelect;

export const insertLedgerReconciliationRunSchema = createInsertSchema(ledgerReconciliationRuns)
  .omit({ id: true, createdAt: true, completedAt: true });
export type InsertLedgerReconciliationRun = z.infer<typeof insertLedgerReconciliationRunSchema>;
export type LedgerReconciliationRun = typeof ledgerReconciliationRuns.$inferSelect;

// Dashboard Preferences schemas
export const insertDashboardPreferencesSchema = createInsertSchema(dashboardPreferences)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDashboardPreferences = z.infer<typeof insertDashboardPreferencesSchema>;
export type DashboardPreferences = typeof dashboardPreferences.$inferSelect;

// Publish-specific validation schema with conditional evidence fields and category validation
export const publishContentSchema = insertContentSchema.superRefine((data, ctx) => {
  // EA-specific validations
  if (data.type === 'ea') {
    // Enforce minimum price of 20 coins for EA content
    if (data.priceCoins !== undefined && data.priceCoins !== null && data.priceCoins < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EA content must have a minimum price of 20 gold coins",
        path: ["priceCoins"],
      });
    }
    
    // Require tags array for EA content
    if (!data.tags || data.tags.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least 1 category must be selected for EA content",
        path: ["tags"],
      });
    } else {
      // Validate category count (1-5 from EA_CATEGORY_OPTIONS)
      const categoryTags = data.tags.filter(tag => 
        EA_CATEGORY_OPTIONS.includes(tag as EACategoryOption) || tag.startsWith('Custom:')
      );
      
      if (categoryTags.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least 1 category must be selected for EA content",
          path: ["tags"],
        });
      }
      
      if (categoryTags.length > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Maximum 5 categories allowed (currently " + categoryTags.length + " selected)",
          path: ["tags"],
        });
      }
    }
  }
  
  // Check if "Performance Report" tag is included
  const hasPerformanceReportTag = data.tags?.includes("Performance Report");
  
  if (hasPerformanceReportTag) {
    // Require evidence fields when Performance Report tag is present
    if (!data.equityCurveImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Equity curve image is required for Performance Reports",
        path: ["equityCurveImage"],
      });
    }
    if (!data.profitFactor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Profit Factor is required for Performance Reports",
        path: ["profitFactor"],
      });
    }
    if (!data.drawdownPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Drawdown % is required for Performance Reports",
        path: ["drawdownPercent"],
      });
    }
    if (!data.winPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Win % is required for Performance Reports",
        path: ["winPercent"],
      });
    }
    if (!data.broker) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Broker name is required for Performance Reports",
        path: ["broker"],
      });
    }
    if (!data.monthsTested) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Months Tested is required for Performance Reports",
        path: ["monthsTested"],
      });
    }
  }
  
  return data;
});

export type PublishContent = z.infer<typeof publishContentSchema>;

// Badge System Constants (matches database schema)
export const BADGE_TYPES = {
  VERIFIED_TRADER: 'verified_trader',
  TOP_CONTRIBUTOR: 'top_contributor',
  EA_EXPERT: 'ea_expert',
  HELPFUL_MEMBER: 'helpful_member',
  EARLY_ADOPTER: 'early_adopter',
} as const;

export type BadgeType = typeof BADGE_TYPES[keyof typeof BADGE_TYPES];

export const BADGE_METADATA: Record<BadgeType, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  [BADGE_TYPES.VERIFIED_TRADER]: {
    name: 'Verified Trader',
    description: 'Linked and verified trading account',
    icon: 'ShieldCheck',
    color: 'text-blue-500',
  },
  [BADGE_TYPES.TOP_CONTRIBUTOR]: {
    name: 'Top Contributor',
    description: 'Top 10 on contributor leaderboard',
    icon: 'Star',
    color: 'text-yellow-500',
  },
  [BADGE_TYPES.EA_EXPERT]: {
    name: 'EA Expert',
    description: 'Published 5+ Expert Advisors',
    icon: 'Award',
    color: 'text-purple-500',
  },
  [BADGE_TYPES.HELPFUL_MEMBER]: {
    name: 'Helpful Member',
    description: '50+ helpful replies',
    icon: 'Heart',
    color: 'text-red-500',
  },
  [BADGE_TYPES.EARLY_ADOPTER]: {
    name: 'Early Adopter',
    description: 'Joined in the first month',
    icon: 'Zap',
    color: 'text-orange-500',
  },
};

// Daily Activity Limits types
export type DailyActivityLimit = typeof dailyActivityLimits.$inferSelect;
export type InsertDailyActivityLimit = typeof dailyActivityLimits.$inferInsert;

// Referral types
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

// Goals types
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// Achievements types
export type Achievement = typeof achievements.$inferSelect;

// User Achievements types
export type UserAchievement = typeof userAchievements.$inferSelect;

// Campaigns types
export type Campaign = typeof campaigns.$inferSelect;

// Dashboard Settings types
export type DashboardSettings = typeof dashboardSettings.$inferSelect;

// Profiles types
export type Profile = typeof profiles.$inferSelect;

// User Settings types
export type UserSettings = typeof userSettings.$inferSelect;

// ============================================================================
// ADMIN DASHBOARD SCHEMAS AND TYPES (20 new admin tables)
// ============================================================================

// 1. Admin Actions
export const insertAdminActionSchema = createInsertSchema(adminActions).omit({ id: true, createdAt: true });
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type AdminAction = typeof adminActions.$inferSelect;

// 2. Moderation Queue
export const insertModerationQueueSchema = createInsertSchema(moderationQueue).omit({ id: true, createdAt: true });
export type InsertModerationQueue = z.infer<typeof insertModerationQueueSchema>;
export type ModerationQueue = typeof moderationQueue.$inferSelect;

// 3. Reported Content
export const insertReportedContentSchema = createInsertSchema(reportedContent).omit({ id: true, createdAt: true });
export type InsertReportedContent = z.infer<typeof insertReportedContentSchema>;
export type ReportedContent = typeof reportedContent.$inferSelect;

// 4. System Settings
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ id: true, updatedAt: true });
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// 5. Support Tickets
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

// 6. Announcements
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true, views: true, clicks: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

// 7. IP Bans
export const insertIpBanSchema = createInsertSchema(ipBans).omit({ id: true, bannedAt: true });
export type InsertIpBan = z.infer<typeof insertIpBanSchema>;
export type IpBan = typeof ipBans.$inferSelect;

// 8. Admin Roles
export const insertAdminRoleSchema = createInsertSchema(adminRoles).omit({ id: true, grantedAt: true });
export type InsertAdminRole = z.infer<typeof insertAdminRoleSchema>;
export type AdminRole = typeof adminRoles.$inferSelect;

// 10. User Segments
export const insertUserSegmentSchema = createInsertSchema(userSegments).omit({ id: true, createdAt: true, updatedAt: true, userCount: true });
export type InsertUserSegment = z.infer<typeof insertUserSegmentSchema>;
export type UserSegment = typeof userSegments.$inferSelect;

// 11. Automation Rules
export const insertAutomationRuleSchema = createInsertSchema(automationRules).omit({ id: true, createdAt: true, executionCount: true, lastExecuted: true });
export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>;
export type AutomationRule = typeof automationRules.$inferSelect;

// 12. A/B Tests
export const insertAbTestSchema = createInsertSchema(abTests).omit({ id: true, createdAt: true });
export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
export type AbTest = typeof abTests.$inferSelect;

// 13. Feature Flags
export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;

// 14. API Keys
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, lastUsed: true });
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// 15. Webhooks
export const insertWebhookSchema = createInsertSchema(webhooks).omit({ id: true, createdAt: true, lastTriggered: true, successCount: true, failureCount: true });
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;

// 16. Scheduled Jobs
export const insertScheduledJobSchema = createInsertSchema(scheduledJobs).omit({ id: true, lastRun: true, nextRun: true, lastStatus: true, lastError: true, executionCount: true });
export type InsertScheduledJob = z.infer<typeof insertScheduledJobSchema>;
export type ScheduledJob = typeof scheduledJobs.$inferSelect;

// 17. Performance Metrics
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({ id: true, recordedAt: true });
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;

// 18. Security Events
export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({ id: true, createdAt: true });
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;

// 19. Media Library
export const insertMediaLibrarySchema = createInsertSchema(mediaLibrary).omit({ id: true, uploadedAt: true, usageCount: true });
export type InsertMediaLibrary = z.infer<typeof insertMediaLibrarySchema>;
export type MediaLibrary = typeof mediaLibrary.$inferSelect;

// 20. Content Revisions
export const insertContentRevisionSchema = createInsertSchema(contentRevisions).omit({ id: true, createdAt: true });
export type InsertContentRevision = z.infer<typeof insertContentRevisionSchema>;
export type ContentRevision = typeof contentRevisions.$inferSelect;

// User Activity types (Daily Earning system)
export const insertUserActivitySchema = createInsertSchema(userActivity).omit({ id: true, createdAt: true });
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivity.$inferSelect;


//=================================================================
// SITEMAP LOGS
// Tracks sitemap generation, submission to search engines, and errors
//=================================================================

export const sitemapLogs = pgTable('sitemap_logs', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 50 }).notNull(), // 'generate', 'submit_google', 'submit_indexnow'
  status: varchar('status', { length: 20 }).notNull(), // 'success', 'error', 'pending'
  urlCount: integer('url_count'), // Number of URLs in sitemap
  submittedTo: varchar('submitted_to', { length: 100 }), // 'google', 'bing', 'yandex', null for generation
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'), // Additional data (API responses, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type SitemapLog = typeof sitemapLogs.$inferSelect;
export type InsertSitemapLog = typeof sitemapLogs.$inferInsert;

export const insertSitemapLogSchema = createInsertSchema(sitemapLogs).omit({
  id: true,
  createdAt: true,
});

//=================================================================
// MODERATION TYPES - Phase 2
// Type definitions for Content Moderation Admin Dashboard
//=================================================================

export type ModerationQueueItem = {
  id: string;
  type: "thread" | "reply";
  threadId?: string;
  title?: string;
  preview: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
    reputation: number;
  };
  submittedAt: Date;
  wordCount: number;
  hasLinks: boolean;
  hasImages: boolean;
  categorySlug?: string;
  threadTitle?: string;
  status: "pending" | "approved" | "rejected";
};

export type ReportedContentSummary = {
  contentId: string;
  contentType: "thread" | "reply";
  titleOrPreview: string;
  reportCount: number;
  reportReasons: string[];
  reporters: Array<{ id: string; username: string }>;
  firstReportedAt: Date;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  latestAction: string | null;
  status: "pending" | "resolved" | "dismissed";
};

export type ContentDetails = {
  id: string;
  type: "thread" | "reply";
  title?: string;
  body: string;
  attachments: string[];
  author: User;
  authorRecentPosts: Array<{ id: string; title?: string; body: string; createdAt: Date; type: string }>;
  authorWarnings: Array<{ actionType: string; details: any; createdAt: Date }>;
  threadContext?: { id: string; title: string; categorySlug: string };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    wordCount: number;
    hasLinks: boolean;
    hasImages: boolean;
  };
};

export type ReportDetails = {
  id: number;
  contentId: string;
  contentType: "thread" | "reply";
  content: {
    title?: string;
    body: string;
    author: {
      id: string;
      username: string;
      reputation: number;
    };
  };
  reports: Array<{
    id: number;
    reporter: {
      id: string;
      username: string;
    };
    reason: string;
    description: string;
    createdAt: Date;
  }>;
  status: string;
  availableActions: string[];
};

export type ModerationActionLog = {
  id: number;
  action: string;
  contentId: string | null;
  contentType: string | null;
  moderator: {
    id: string;
    username: string;
  };
  reason: string | null;
  timestamp: Date;
  metadata: any;
};

// ============================================================================
// CLIENT DASHBOARD SCHEMAS AND TYPES (New client dashboard tables)
// ============================================================================

// Trading Journal Entries
export const insertTradingJournalEntrySchema = createInsertSchema(tradingJournalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tradingPair: z.string().min(1, "Trading pair is required"),
  entryPrice: z.string().min(1, "Entry price is required"),
  positionSize: z.string().min(1, "Position size is required"),
  positionType: z.enum(["long", "short"]),
  entryDate: z.date().or(z.string()),
  exitDate: z.date().or(z.string()).optional(),
});
export type InsertTradingJournalEntry = z.infer<typeof insertTradingJournalEntrySchema>;
export type TradingJournalEntry = typeof tradingJournalEntries.$inferSelect;

// Watchlists
export const insertWatchlistSchema = createInsertSchema(watchlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Watchlist name is required").max(100),
  symbols: z.array(z.string()).default([]),
});
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlists.$inferSelect;

// Price Alerts
export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isTriggered: true,
  triggeredAt: true,
}).extend({
  symbol: z.string().min(1, "Symbol is required"),
  targetPrice: z.string().min(1, "Target price is required"),
  condition: z.enum(["above", "below", "equals"]),
});
export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;
export type PriceAlert = typeof priceAlerts.$inferSelect;

// Saved Searches
export const insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
  useCount: true,
  lastUsedAt: true,
}).extend({
  name: z.string().min(1, "Search name is required").max(100),
  query: z.string().min(1, "Search query is required"),
});
export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
export type SavedSearch = typeof savedSearches.$inferSelect;

// Chat Rooms
export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  memberCount: true,
  messageCount: true,
  lastMessageAt: true,
}).extend({
  name: z.string().min(1, "Room name is required").max(100),
  roomType: z.enum(["public", "private", "trading_pair", "strategy"]),
});
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;

// Chat Room Members
export const insertChatRoomMemberSchema = createInsertSchema(chatRoomMembers).omit({
  id: true,
  joinedAt: true,
});
export type InsertChatRoomMember = z.infer<typeof insertChatRoomMemberSchema>;
export type ChatRoomMember = typeof chatRoomMembers.$inferSelect;

// Chat Room Messages
export const insertChatRoomMessageSchema = createInsertSchema(chatRoomMessages).omit({
  id: true,
  createdAt: true,
  editedAt: true,
  deletedAt: true,
}).extend({
  content: z.string().min(1, "Message content is required").max(2000),
});
export type InsertChatRoomMessage = z.infer<typeof insertChatRoomMessageSchema>;
export type ChatRoomMessage = typeof chatRoomMessages.$inferSelect;

// Dashboard Widgets
export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;

// Dashboard Layouts
export const insertDashboardLayoutSchema = createInsertSchema(dashboardLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Layout name is required").max(100),
});
export type InsertDashboardLayout = z.infer<typeof insertDashboardLayoutSchema>;
export type DashboardLayout = typeof dashboardLayouts.$inferSelect;

// ============================================================================
// EMAIL NOTIFICATION SYSTEM TABLES
// ============================================================================

// Email Templates - Reusable email templates with placeholders
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // e.g., "comment_notification", "like_notification"
  category: text("category").notNull().$type<"social" | "coins" | "content" | "engagement" | "marketplace" | "account" | "moderation">(),
  name: text("name").notNull(), // Display name for admin
  subject: text("subject").notNull(), // Email subject template (can include variables like {{username}})
  htmlTemplate: text("html_template").notNull(), // HTML email template with placeholders
  textTemplate: text("text_template").notNull(), // Plain text version
  variables: jsonb("variables").$type<Array<{name: string; type: string; required: boolean}>>(), // List of required variables and their types
  enabled: boolean("enabled").notNull().default(true), // Whether template is active
  version: integer("version").notNull().default(1), // For template versioning
  lastModifiedBy: varchar("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  keyIdx: uniqueIndex("idx_email_templates_key").on(table.key),
  categoryIdx: index("idx_email_templates_category").on(table.category),
  enabledIdx: index("idx_email_templates_enabled").on(table.enabled),
}));

// Email Notifications - Track sent/queued email notifications
export const emailNotifications = pgTable("email_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateKey: text("template_key").notNull().references(() => emailTemplates.key),
  recipientEmail: text("recipient_email").notNull(), // Email address to send to
  subject: text("subject").notNull(), // Rendered subject
  payload: jsonb("payload").$type<Record<string, any>>(), // Variables used to render template
  status: text("status").notNull().$type<"queued" | "sent" | "failed" | "bounced">().default("queued"),
  error: text("error"), // Error message if failed
  providerMessageId: text("provider_message_id"), // ID from email provider
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  openCount: integer("open_count").notNull().default(0), // Track number of times email was opened
  clickCount: integer("click_count").notNull().default(0), // Track number of link clicks
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_email_notifications_user_id").on(table.userId),
  statusIdx: index("idx_email_notifications_status").on(table.status),
  createdAtIdx: index("idx_email_notifications_created_at").on(table.createdAt),
  templateKeyIdx: index("idx_email_notifications_template_key").on(table.templateKey),
  statusCreatedAtIdx: index("idx_email_notifications_status_created").on(table.status, table.createdAt),
}));

// Email Preferences - User email notification preferences
export const emailPreferences = pgTable("email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  socialInteractions: boolean("social_interactions").notNull().default(true), // Likes, comments, follows etc
  coinTransactions: boolean("coin_transactions").notNull().default(true), // Coin activities
  contentUpdates: boolean("content_updates").notNull().default(true), // Content approvals, milestones
  engagementDigest: boolean("engagement_digest").notNull().default(true), // Weekly summaries, trending
  marketplaceActivities: boolean("marketplace_activities").notNull().default(true), // Sales, reviews
  accountSecurity: boolean("account_security").notNull().default(true), // Login alerts, password changes
  moderationNotices: boolean("moderation_notices").notNull().default(true), // Warnings, content removal
  digestFrequency: text("digest_frequency").notNull().$type<"instant" | "daily" | "weekly">().default("instant"),
  muteUntil: timestamp("mute_until"), // Temporarily mute all emails
  unsubscribedAt: timestamp("unsubscribed_at"), // If fully unsubscribed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: uniqueIndex("idx_email_preferences_user_id").on(table.userId),
  unsubscribedIdx: index("idx_email_preferences_unsubscribed").on(table.unsubscribedAt),
  muteUntilIdx: index("idx_email_preferences_mute_until").on(table.muteUntil),
}));

// Unsubscribe Tokens - Secure tokens for one-click unsubscribe
export const unsubscribeTokens = pgTable("unsubscribe_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenHash: text("token_hash").notNull().unique(), // Hashed token for security
  userId: varchar("user_id").notNull().references(() => users.id),
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at"),
  usedFromIp: text("used_from_ip"), // IP address that used token
  reason: text("reason"), // Optional reason for unsubscribing
  notificationId: varchar("notification_id"), // Optional link to email notification
  feedback: text("feedback"), // Optional user feedback on unsubscribe
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tokenHashIdx: uniqueIndex("idx_unsubscribe_tokens_hash").on(table.tokenHash),
  userIdIdx: index("idx_unsubscribe_tokens_user_id").on(table.userId),
  expiresAtIdx: index("idx_unsubscribe_tokens_expires_at").on(table.expiresAt),
  usedIdx: index("idx_unsubscribe_tokens_used").on(table.used),
}));

// Password Reset Tokens - Secure tokens for password reset flow
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  consumed: boolean("consumed").notNull().default(false),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tokenHashIdx: uniqueIndex("idx_password_reset_tokens_hash").on(table.tokenHash),
  userIdIdx: index("idx_password_reset_tokens_user_id").on(table.userId),
  expiresAtIdx: index("idx_password_reset_tokens_expires_at").on(table.expiresAt),
  consumedIdx: index("idx_password_reset_tokens_consumed").on(table.consumed),
}));

// Email Events - Track email interactions (opens, clicks, bounces)
export const emailEvents = pgTable("email_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notificationId: varchar("notification_id").notNull().references(() => emailNotifications.id),
  eventType: text("event_type").notNull().$type<"send" | "delivery" | "open" | "click" | "bounce" | "complaint" | "unsubscribe">(),
  providerEventId: text("provider_event_id"), // Event ID from provider
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional event data (link clicked, bounce reason etc)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  notificationIdIdx: index("idx_email_events_notification_id").on(table.notificationId),
  eventTypeIdx: index("idx_email_events_event_type").on(table.eventType),
  occurredAtIdx: index("idx_email_events_occurred_at").on(table.occurredAt),
  notificationEventIdx: index("idx_email_events_notification_event").on(table.notificationId, table.eventType),
}));

// ============================================================================
// EMAIL NOTIFICATION SYSTEM SCHEMAS AND TYPES
// ============================================================================

// Email Templates
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
}).extend({
  key: z.string().min(1, "Template key is required").regex(/^[a-z_]+$/, "Key must be lowercase with underscores"),
  name: z.string().min(1, "Template name is required").max(200),
  subject: z.string().min(1, "Subject template is required"),
  htmlTemplate: z.string().min(1, "HTML template is required"),
  textTemplate: z.string().min(1, "Text template is required"),
  category: z.enum(["social", "coins", "content", "engagement", "marketplace", "account", "moderation"]),
});
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// Email Notifications
export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  openedAt: true,
  clickedAt: true,
  retryCount: true,
  error: true,
  providerMessageId: true,
}).extend({
  recipientEmail: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(500),
  status: z.enum(["queued", "sent", "failed", "bounced"]).optional(),
});
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;

// Email Preferences
export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  unsubscribedAt: true,
}).extend({
  digestFrequency: z.enum(["instant", "daily", "weekly"]),
  socialInteractions: z.boolean(),
  coinTransactions: z.boolean(),
  contentUpdates: z.boolean(),
  engagementDigest: z.boolean(),
  marketplaceActivities: z.boolean(),
  accountSecurity: z.boolean(),
  moderationNotices: z.boolean(),
});
export type InsertEmailPreferences = z.infer<typeof insertEmailPreferencesSchema>;
export type EmailPreferences = typeof emailPreferences.$inferSelect;

// Unsubscribe Tokens
export const insertUnsubscribeTokenSchema = createInsertSchema(unsubscribeTokens).omit({
  id: true,
  createdAt: true,
  used: true,
  usedAt: true,
  usedFromIp: true,
}).extend({
  tokenHash: z.string().min(64, "Token hash must be 64 characters"),
  expiresAt: z.date(),
});
export type InsertUnsubscribeToken = z.infer<typeof insertUnsubscribeTokenSchema>;
export type UnsubscribeToken = typeof unsubscribeTokens.$inferSelect;

// Password Reset Tokens
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
  consumed: true,
  consumedAt: true,
}).extend({
  tokenHash: z.string().min(1, "Token hash is required"),
  expiresAt: z.date(),
});
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Email Events
export const insertEmailEventSchema = createInsertSchema(emailEvents).omit({
  id: true,
  createdAt: true,
  occurredAt: true,
}).extend({
  eventType: z.enum(["send", "delivery", "open", "click", "bounce", "complaint", "unsubscribe"]),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
});
export type InsertEmailEvent = z.infer<typeof insertEmailEventSchema>;
export type EmailEvent = typeof emailEvents.$inferSelect;

// ============================================================================
// RETENTION DASHBOARD SYSTEM TABLES
// ============================================================================

// Retention Metrics - Track user retention status and loyalty tier
export const retentionMetrics = pgTable("retention_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  activeDays: integer("active_days").notNull().default(0),
  loyaltyTier: varchar("loyalty_tier").$type<"new" | "committed" | "elite">().notNull().default("new"),
  feeRate: numeric("fee_rate", { precision: 5, scale: 4 }).notNull().default("0.07"),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_retention_metrics_user_id").on(table.userId),
  tierIdx: index("idx_retention_metrics_tier").on(table.loyaltyTier),
}));

// Vault Coins - Track 10% vault bonuses with 30-day unlock
export const vaultCoins = pgTable("vault_coins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  earnedFrom: varchar("earned_from").notNull(),
  sourceId: varchar("source_id"),
  unlockAt: timestamp("unlock_at").notNull(),
  status: varchar("status").$type<"locked" | "unlocked" | "claimed">().notNull().default("locked"),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_vault_coins_user_id").on(table.userId),
  statusIdx: index("idx_vault_coins_status").on(table.status),
  unlockAtIdx: index("idx_vault_coins_unlock_at").on(table.unlockAt),
}));

// Loyalty Tiers - Static configuration table for tier benefits
export const loyaltyTiers = pgTable("loyalty_tiers", {
  tier: varchar("tier").$type<"new" | "committed" | "elite">().primaryKey(),
  minActiveDays: integer("min_active_days").notNull(),
  feeRate: numeric("fee_rate", { precision: 5, scale: 4 }).notNull(),
  benefits: jsonb("benefits").notNull(),
  displayName: varchar("display_name").notNull(),
  displayColor: varchar("display_color").notNull(),
});

// Retention Badges - User badge achievements
export const retentionBadges = pgTable("retention_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeType: varchar("badge_type").notNull(),
  badgeName: varchar("badge_name").notNull(),
  badgeDescription: text("badge_description"),
  coinReward: integer("coin_reward").notNull().default(0),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  claimed: boolean("claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
}, (table) => ({
  userIdIdx: index("idx_retention_badges_user_id").on(table.userId),
  typeIdx: index("idx_retention_badges_type").on(table.badgeType),
  unlockedAtIdx: index("idx_retention_badges_unlocked_at").on(table.unlockedAt),
}));

// AI Nudges - AI-generated engagement suggestions
export const aiNudges = pgTable("ai_nudges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  nudgeType: varchar("nudge_type").notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url"),
  priority: varchar("priority").$type<"low" | "medium" | "high">().notNull().default("low"),
  dismissed: boolean("dismissed").notNull().default(false),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_ai_nudges_user_id").on(table.userId),
  dismissedIdx: index("idx_ai_nudges_dismissed").on(table.dismissed),
}));

// Abandonment Emails - Scheduled re-engagement emails
export const abandonmentEmails = pgTable("abandonment_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emailType: varchar("email_type").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: varchar("status").$type<"pending" | "sent" | "failed" | "cancelled">().notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_abandonment_emails_user_id").on(table.userId),
  statusIdx: index("idx_abandonment_emails_status").on(table.status),
  scheduledForIdx: index("idx_abandonment_emails_scheduled").on(table.scheduledFor),
}));

// Earnings Sources - Aggregated earnings data for pie chart
export const earningsSources = pgTable("earnings_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  source: varchar("source").notNull(),
  amount: integer("amount").notNull().default(0),
  transactionCount: integer("transaction_count").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_earnings_sources_user_id").on(table.userId),
  userSourceIdx: index("idx_earnings_sources_user_source").on(table.userId, table.source),
}));

// Activity Heatmap - Hourly activity patterns for heatmap visualization
export const activityHeatmap = pgTable("activity_heatmap", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hour: integer("hour").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  actionCount: integer("action_count").notNull().default(0),
  lastActionAt: timestamp("last_action_at"),
}, (table) => ({
  userIdIdx: index("idx_activity_heatmap_user_id").on(table.userId),
  userHourDayIdx: index("idx_activity_heatmap_user_hour_day").on(table.userId, table.hour, table.dayOfWeek),
}));

// ============================================================================
// RETENTION DASHBOARD SYSTEM SCHEMAS AND TYPES
// ============================================================================

// Retention Metrics
export const insertRetentionMetricsSchema = createInsertSchema(retentionMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string().uuid(),
  activeDays: z.number().int().min(0),
  loyaltyTier: z.enum(["new", "committed", "elite"]),
  feeRate: z.string().regex(/^\d+\.\d{4}$/),
});
export type InsertRetentionMetrics = z.infer<typeof insertRetentionMetricsSchema>;
export type RetentionMetrics = typeof retentionMetrics.$inferSelect;

// Vault Coins
export const insertVaultCoinsSchema = createInsertSchema(vaultCoins).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string().uuid(),
  amount: z.number().int().positive(),
  earnedFrom: z.string().min(1),
  sourceId: z.string().optional(),
  unlockAt: z.date(),
  status: z.enum(["locked", "unlocked", "claimed"]).optional(),
});
export type InsertVaultCoins = z.infer<typeof insertVaultCoinsSchema>;
export type VaultCoins = typeof vaultCoins.$inferSelect;

// Loyalty Tiers
export const insertLoyaltyTiersSchema = createInsertSchema(loyaltyTiers).extend({
  tier: z.enum(["new", "committed", "elite"]),
  minActiveDays: z.number().int().min(0),
  feeRate: z.string().regex(/^\d+\.\d{4}$/),
  displayName: z.string().min(1),
  displayColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
export type InsertLoyaltyTiers = z.infer<typeof insertLoyaltyTiersSchema>;
export type LoyaltyTiers = typeof loyaltyTiers.$inferSelect;

// Retention Badges
export const insertRetentionBadgesSchema = createInsertSchema(retentionBadges).omit({
  id: true,
  unlockedAt: true,
  claimed: true,
  claimedAt: true,
}).extend({
  userId: z.string().uuid(),
  badgeType: z.string().min(1),
  badgeName: z.string().min(1),
  badgeDescription: z.string().optional(),
  coinReward: z.number().int().min(0),
});
export type InsertRetentionBadges = z.infer<typeof insertRetentionBadgesSchema>;
export type RetentionBadges = typeof retentionBadges.$inferSelect;

// AI Nudges
export const insertAiNudgesSchema = createInsertSchema(aiNudges).omit({
  id: true,
  createdAt: true,
  dismissed: true,
  dismissedAt: true,
}).extend({
  userId: z.string().uuid(),
  nudgeType: z.string().min(1),
  message: z.string().min(1),
  actionUrl: z.string().url().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});
export type InsertAiNudges = z.infer<typeof insertAiNudgesSchema>;
export type AiNudges = typeof aiNudges.$inferSelect;

// Abandonment Emails
export const insertAbandonmentEmailsSchema = createInsertSchema(abandonmentEmails).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  errorMessage: true,
}).extend({
  userId: z.string().uuid(),
  emailType: z.string().min(1),
  scheduledFor: z.date(),
  status: z.enum(["pending", "sent", "failed", "cancelled"]).optional(),
});
export type InsertAbandonmentEmails = z.infer<typeof insertAbandonmentEmailsSchema>;
export type AbandonmentEmails = typeof abandonmentEmails.$inferSelect;

// Earnings Sources
export const insertEarningsSourcesSchema = createInsertSchema(earningsSources).omit({
  id: true,
  lastUpdated: true,
}).extend({
  userId: z.string().uuid(),
  source: z.string().min(1),
  amount: z.number().int().min(0).optional(),
  transactionCount: z.number().int().min(0).optional(),
});
export type InsertEarningsSources = z.infer<typeof insertEarningsSourcesSchema>;
export type EarningsSources = typeof earningsSources.$inferSelect;

// Activity Heatmap
export const insertActivityHeatmapSchema = createInsertSchema(activityHeatmap).omit({
  id: true,
}).extend({
  userId: z.string().uuid(),
  hour: z.number().int().min(0).max(23),
  dayOfWeek: z.number().int().min(0).max(6),
  actionCount: z.number().int().min(0).optional(),
});
export type InsertActivityHeatmap = z.infer<typeof insertActivityHeatmapSchema>;
export type ActivityHeatmap = typeof activityHeatmap.$inferSelect;

// ============================================================================
// BOT SYSTEM TABLES
// ============================================================================

// Bots - AI-controlled user profiles for engagement
export const bots = pgTable("bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url"),
  purpose: varchar("purpose").$type<"engagement" | "marketplace" | "referral">().notNull(),
  trustLevel: integer("trust_level").notNull().default(2), // 2-5
  isActive: boolean("is_active").notNull().default(false),
  personaProfile: jsonb("persona_profile").$type<{
    timezone?: string;
    favoritePairs?: string[];
    tradingStyle?: string;
  }>(),
  activityCaps: jsonb("activity_caps").$type<{
    dailyLikes: number;
    dailyFollows: number;
    dailyPurchases: number;
    dailyUnlocks: number;
  }>().default({
    dailyLikes: 10,
    dailyFollows: 3,
    dailyPurchases: 2,
    dailyUnlocks: 5
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  usernameIdx: index("idx_bots_username").on(table.username),
  purposeIdx: index("idx_bots_purpose").on(table.purpose),
  activeIdx: index("idx_bots_active").on(table.isActive),
}));

// Bot Actions - Track all bot activities for analytics and audit
export const botActions = pgTable("bot_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().references(() => bots.id, { onDelete: "cascade" }),
  actionType: varchar("action_type").$type<"like" | "follow" | "purchase" | "referral" | "unlock">().notNull(),
  targetType: varchar("target_type").$type<"thread" | "content" | "user" | "reply">(),
  targetId: varchar("target_id"),
  coinDelta: integer("coin_delta").notNull().default(0),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  retentionWeight: integer("retention_weight").notNull().default(0), // 0-5 boost to retention score
  executedAt: timestamp("executed_at").notNull().defaultNow(),
}, (table) => ({
  botIdIdx: index("idx_bot_actions_bot_id").on(table.botId),
  actionTypeIdx: index("idx_bot_actions_action_type").on(table.actionType),
  targetIdx: index("idx_bot_actions_target").on(table.targetType, table.targetId),
  executedAtIdx: index("idx_bot_actions_executed_at").on(table.executedAt),
}));

// Admin Treasury - Central coin bank for bot economy
export const adminTreasury = pgTable("admin_treasury", {
  id: serial("id").primaryKey(),
  balance: integer("balance").notNull().default(100000), // Start with 100k coins
  dailyCap: integer("daily_cap").notNull().default(500),
  auditLog: jsonb("audit_log").$type<Array<{
    timestamp: string;
    action: string;
    amount: number;
    reason: string;
    adminId?: string;
    balanceBefore: number;
    balanceAfter: number;
  }>>().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Bot Economy Settings - Global configuration for bot behavior
export const botEconomySettings = pgTable("bot_economy_settings", {
  id: serial("id").primaryKey(),
  walletCapDefault: integer("wallet_cap_default").notNull().default(199),
  walletCapOverrides: jsonb("wallet_cap_overrides").$type<Record<string, number>>().default({}), // userId -> custom cap
  aggressionLevel: integer("aggression_level").notNull().default(5), // 1-10 scale
  referralModeEnabled: boolean("referral_mode_enabled").notNull().default(false),
  botPurchasesEnabled: boolean("bot_purchases_enabled").notNull().default(true),
  botUnlocksEnabled: boolean("bot_unlocks_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// ERROR TRACKING SYSTEM TABLES
// ============================================================================

// Error Groups - Groups similar errors together based on fingerprint
export const errorGroups = pgTable("error_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fingerprint: varchar("fingerprint", { length: 64 }).notNull().unique(), // SHA256 hash
  message: text("message").notNull(),
  component: varchar("component", { length: 255 }), // Component or file where error occurred
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  occurrenceCount: integer("occurrence_count").notNull().default(1),
  severity: varchar("severity", { length: 20 }).notNull().$type<"critical" | "error" | "warning" | "info">().default("error"),
  status: varchar("status", { length: 20 }).notNull().$type<"active" | "resolved" | "solved">().default("active"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  metadata: jsonb("metadata").$type<{
    browser?: string;
    os?: string;
    url?: string;
    method?: string;
    statusCode?: number;
    userAgent?: string;
    environment?: string;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  fingerprintIdx: index("idx_error_groups_fingerprint").on(table.fingerprint),
  severityIdx: index("idx_error_groups_severity").on(table.severity),
  statusIdx: index("idx_error_groups_status").on(table.status),
  lastSeenIdx: index("idx_error_groups_last_seen").on(table.lastSeen),
  occurrenceCountIdx: index("idx_error_groups_occurrence_count").on(table.occurrenceCount),
}));

// Error Events - Individual error occurrences
export const errorEvents = pgTable("error_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => errorGroups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id", { length: 100 }),
  stackTrace: text("stack_trace"),
  context: jsonb("context").$type<{
    componentStack?: string;
    props?: any;
    state?: any;
    route?: string;
    action?: string;
    payload?: any;
    customData?: any;
  }>(),
  browserInfo: jsonb("browser_info").$type<{
    name?: string;
    version?: string;
    os?: string;
    platform?: string;
    mobile?: boolean;
    viewport?: { width: number; height: number };
    screen?: { width: number; height: number };
    language?: string;
    cookiesEnabled?: boolean;
    onlineStatus?: boolean;
    doNotTrack?: boolean;
  }>(),
  requestInfo: jsonb("request_info").$type<{
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: any;
    ip?: string;
    referrer?: string;
    responseStatus?: number;
    responseTime?: number;
  }>(),
  userDescription: text("user_description"), // Optional user-provided description
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  groupIdIdx: index("idx_error_events_group_id").on(table.groupId),
  userIdIdx: index("idx_error_events_user_id").on(table.userId),
  createdAtIdx: index("idx_error_events_created_at").on(table.createdAt),
  sessionIdIdx: index("idx_error_events_session_id").on(table.sessionId),
}));

// Error Status Changes - Audit trail for error status changes
export const errorStatusChanges = pgTable("error_status_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  errorGroupId: varchar("error_group_id").notNull().references(() => errorGroups.id, { onDelete: "cascade" }),
  changedBy: varchar("changed_by").notNull().references(() => users.id),
  oldStatus: varchar("old_status", { length: 20 }).notNull().$type<"active" | "resolved" | "solved">(),
  newStatus: varchar("new_status", { length: 20 }).notNull().$type<"active" | "resolved" | "solved">(),
  reason: text("reason"),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
}, (table) => ({
  errorGroupIdIdx: index("idx_error_status_changes_error_group_id").on(table.errorGroupId),
  changedByIdx: index("idx_error_status_changes_changed_by").on(table.changedBy),
  changedAtIdx: index("idx_error_status_changes_changed_at").on(table.changedAt),
}));

// ============================================================================
// BOT SYSTEM SCHEMAS AND TYPES
// ============================================================================

// Bots
export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  username: z.string().min(3).max(50).regex(/^@?[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(100),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  purpose: z.enum(["engagement", "marketplace", "referral"]),
  trustLevel: z.number().int().min(2).max(5),
  isActive: z.boolean().optional(),
});
export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof bots.$inferSelect;

// Bot Actions
export const insertBotActionSchema = createInsertSchema(botActions).omit({
  id: true,
  executedAt: true,
}).extend({
  botId: z.string().uuid(),
  actionType: z.enum(["like", "follow", "purchase", "referral", "unlock"]),
  targetType: z.enum(["thread", "content", "user", "reply"]).optional(),
  targetId: z.string().optional(),
  coinDelta: z.number().int(),
  retentionWeight: z.number().int().min(0).max(5).optional(),
});
export type InsertBotAction = z.infer<typeof insertBotActionSchema>;
export type BotAction = typeof botActions.$inferSelect;

// Admin Treasury
export type AdminTreasury = typeof adminTreasury.$inferSelect;

// Bot Economy Settings
export type BotEconomySettings = typeof botEconomySettings.$inferSelect;

// ============================================================================
// ERROR TRACKING SYSTEM SCHEMAS AND TYPES
// ============================================================================

// Error Groups
export const insertErrorGroupSchema = createInsertSchema(errorGroups).omit({
  id: true,
  firstSeen: true,
  lastSeen: true,
  occurrenceCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  fingerprint: z.string().length(64), // SHA256 hash
  message: z.string().min(1),
  component: z.string().optional(),
  severity: z.enum(["critical", "error", "warning", "info"]).default("error"),
  status: z.enum(["active", "resolved", "solved"]).default("active"),
});
export type InsertErrorGroup = z.infer<typeof insertErrorGroupSchema>;
export type ErrorGroup = typeof errorGroups.$inferSelect;

// Error Events
export const insertErrorEventSchema = createInsertSchema(errorEvents).omit({
  id: true,
  createdAt: true,
}).extend({
  groupId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().max(100).optional(),
  stackTrace: z.string().optional(),
  userDescription: z.string().optional(),
});
export type InsertErrorEvent = z.infer<typeof insertErrorEventSchema>;
export type ErrorEvent = typeof errorEvents.$inferSelect;

// Error Status Changes
export const insertErrorStatusChangeSchema = createInsertSchema(errorStatusChanges).omit({
  id: true,
  changedAt: true,
}).extend({
  errorGroupId: z.string().uuid(),
  changedBy: z.string().uuid(),
  oldStatus: z.enum(["active", "resolved", "solved"]),
  newStatus: z.enum(["active", "resolved", "solved"]),
  reason: z.string().optional(),
});
export type InsertErrorStatusChange = z.infer<typeof insertErrorStatusChangeSchema>;
export type ErrorStatusChange = typeof errorStatusChanges.$inferSelect;

// ============================================================================
// SEO MONITORING SYSTEM TABLES
// ============================================================================

// SEO Scans
export const seoScans = pgTable("seo_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scanType: varchar("scan_type", { length: 20 }).notNull().$type<"full" | "delta" | "single-page">(),
  status: varchar("status", { length: 20 }).notNull().$type<"running" | "completed" | "failed">().default("running"),
  pagesScanned: integer("pages_scanned").notNull().default(0),
  issuesFound: integer("issues_found").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  triggeredBy: varchar("triggered_by", { length: 20 }).notNull().$type<"cron" | "manual" | "post-publish">(),
  metadata: jsonb("metadata").$type<{
    urlList?: string[];
    filters?: Record<string, any>;
    options?: Record<string, any>;
  }>(),
}, (table) => ({
  statusIdx: index("idx_seo_scans_status").on(table.status),
  startedAtIdx: index("idx_seo_scans_started_at").on(table.startedAt),
}));

// SEO Issues
export const seoIssues = pgTable("seo_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scanId: varchar("scan_id").notNull().references(() => seoScans.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 20 }).notNull().$type<"technical" | "content" | "performance">(),
  issueType: varchar("issue_type", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().$type<"critical" | "high" | "medium" | "low">(),
  status: varchar("status", { length: 20 }).notNull().$type<"active" | "fixed" | "ignored">().default("active"),
  pageUrl: text("page_url").notNull(),
  pageTitle: text("page_title"),
  description: text("description").notNull(),
  autoFixable: boolean("auto_fixable").notNull().default(false),
  fixedAt: timestamp("fixed_at"),
  fixedBy: varchar("fixed_by"),
  metadata: jsonb("metadata").$type<{
    suggestion?: string;
    oldValue?: string;
    newValue?: string;
    context?: Record<string, any>;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  scanIdIdx: index("idx_seo_issues_scan_id").on(table.scanId),
  categoryIdx: index("idx_seo_issues_category").on(table.category),
  severityIdx: index("idx_seo_issues_severity").on(table.severity),
  statusIdx: index("idx_seo_issues_status").on(table.status),
  pageUrlIdx: index("idx_seo_issues_page_url").on(table.pageUrl),
  createdAtIdx: index("idx_seo_issues_created_at").on(table.createdAt),
}));

// SEO Fixes
export const seoFixes = pgTable("seo_fixes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").notNull().references(() => seoIssues.id, { onDelete: "cascade" }),
  fixType: varchar("fix_type", { length: 20 }).notNull().$type<"auto" | "ai-generated" | "manual">(),
  action: varchar("action", { length: 100 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  appliedBy: varchar("applied_by").notNull(),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  beforePayload: text("before_payload"),
  afterPayload: text("after_payload"),
  fixMethod: varchar("fix_method", { length: 50 }).default("auto").notNull(),
  rollbackedAt: timestamp("rollbacked_at"),
  rollbackedBy: varchar("rollbacked_by", { length: 36 }),
}, (table) => ({
  issueIdIdx: index("idx_seo_fixes_issue_id").on(table.issueId),
  appliedAtIdx: index("idx_seo_fixes_applied_at").on(table.appliedAt),
}));

// SEO Metrics
export const seoMetrics = pgTable("seo_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  overallScore: integer("overall_score").notNull().default(0),
  technicalScore: integer("technical_score").notNull().default(0),
  contentScore: integer("content_score").notNull().default(0),
  performanceScore: integer("performance_score").notNull().default(0),
  totalIssues: integer("total_issues").notNull().default(0),
  criticalIssues: integer("critical_issues").notNull().default(0),
  highIssues: integer("high_issues").notNull().default(0),
  mediumIssues: integer("medium_issues").notNull().default(0),
  lowIssues: integer("low_issues").notNull().default(0),
  metadata: jsonb("metadata").$type<{
    topIssues?: string[];
    improvements?: string[];
    regressions?: string[];
  }>(),
}, (table) => ({
  recordedAtIdx: index("idx_seo_metrics_recorded_at").on(table.recordedAt),
  overallScoreIdx: index("idx_seo_metrics_overall_score").on(table.overallScore),
}));

// SEO Performance Metrics - PageSpeed Insights data with time-series tracking
export const seoPerformanceMetrics = pgTable("seo_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageUrl: varchar("page_url", { length: 1000 }).notNull(),
  strategy: varchar("strategy", { length: 10 }).notNull().$type<"mobile" | "desktop">(),
  performanceScore: integer("performance_score").notNull(), // 0-100
  seoScore: integer("seo_score").notNull(), // 0-100
  accessibilityScore: integer("accessibility_score").notNull(), // 0-100
  bestPracticesScore: integer("best_practices_score").notNull(), // 0-100
  pwaScore: integer("pwa_score"), // 0-100, optional
  scanId: varchar("scan_id").references(() => seoScans.id, { onDelete: "set null" }),
  fetchTime: timestamp("fetch_time").notNull().defaultNow(),
  metadata: jsonb("metadata").$type<{
    finalUrl?: string; // URL after redirects
    lighthouseVersion?: string;
    userAgent?: string;
    fetchDuration?: number;
    rawData?: any; // Full Lighthouse result
  }>(),
}, (table) => ({
  pageUrlIdx: index("idx_seo_perf_page_url").on(table.pageUrl),
  fetchTimeIdx: index("idx_seo_perf_fetch_time").on(table.fetchTime),
  strategyIdx: index("idx_seo_perf_strategy").on(table.strategy),
  scanIdIdx: index("idx_seo_perf_scan_id").on(table.scanId),
}));

// SEO Overrides - Database-driven SEO field overrides
export const seoOverrides = pgTable("seo_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageUrl: varchar("page_url", { length: 1000 }).notNull(),
  canonical: varchar("canonical", { length: 1000 }),
  title: varchar("title", { length: 200 }),
  metaDescription: text("meta_description"),
  robotsMeta: varchar("robots_meta", { length: 100 }),
  viewport: varchar("viewport", { length: 200 }),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  appliedBy: varchar("applied_by", { length: 36 }),
  active: boolean("active").default(true).notNull(),
}, (table) => ({
  pageUrlIdx: index("seo_overrides_page_url_idx").on(table.pageUrl),
  activeIdx: index("seo_overrides_active_idx").on(table.active),
}));

// SEO Fix Jobs - AI-generated fix jobs with approval workflow
export const seoFixJobs = pgTable("seo_fix_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").references(() => seoIssues.id, { onDelete: "cascade" }),
  fixType: varchar("fix_type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  aiModel: varchar("ai_model", { length: 100 }),
  prompt: text("prompt"),
  aiResponse: text("ai_response"),
  generatedContent: text("generated_content"),
  metadata: jsonb("metadata").$type<{
    pageUrl?: string;
    issueType?: string;
    issueDetails?: any;
    queuedAt?: string;
    error?: string;
    failedAt?: string;
  }>(),
  humanReviewedBy: varchar("human_reviewed_by", { length: 36 }),
  humanReviewedAt: timestamp("human_reviewed_at"),
  humanFeedback: text("human_feedback"),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  statusIdx: index("seo_fix_jobs_status_idx").on(table.status),
  issueIdIdx: index("seo_fix_jobs_issue_id_idx").on(table.issueId),
}));

// SEO Scan History - Track last scan time per URL for delta scans
export const seoScanHistory = pgTable("seo_scan_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: varchar("url", { length: 1000 }).notNull(),
  lastScanAt: timestamp("last_scan_at").notNull().defaultNow(),
  lastScannedBy: varchar("last_scanned_by", { length: 20 }).notNull().$type<"cron" | "manual" | "post-publish">(),
  scanId: varchar("scan_id").references(() => seoScans.id, { onDelete: "set null" }),
  issuesFound: integer("issues_found").notNull().default(0),
  metadata: jsonb("metadata").$type<{
    scanDuration?: number;
    scanStatus?: string;
    errorMessage?: string;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  urlIdx: uniqueIndex("idx_seo_scan_history_url").on(table.url),
  lastScanAtIdx: index("idx_seo_scan_history_last_scan_at").on(table.lastScanAt),
  scanIdIdx: index("idx_seo_scan_history_scan_id").on(table.scanId),
}));

// SEO Alert History - Track sent alerts for deduplication
export const seoAlertHistory = pgTable("seo_alert_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").references(() => seoIssues.id, { onDelete: "cascade" }),
  notificationType: varchar("notification_type", { length: 50 }).notNull().$type<"critical_alert" | "high_priority_digest">(),
  recipients: text("recipients").array().notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  emailSubject: text("email_subject").notNull(),
  metadata: jsonb("metadata").$type<{
    issueType?: string;
    pageUrl?: string;
    severity?: string;
    issueCount?: number;
  }>(),
}, (table) => ({
  issueIdIdx: index("idx_seo_alert_history_issue_id").on(table.issueId),
  notificationTypeIdx: index("idx_seo_alert_history_notification_type").on(table.notificationType),
  sentAtIdx: index("idx_seo_alert_history_sent_at").on(table.sentAt),
  issueIdSentAtIdx: index("idx_seo_alert_history_issue_sent").on(table.issueId, table.sentAt),
}));

// ============================================================================
// SEO MONITORING SYSTEM SCHEMAS AND TYPES
// ============================================================================

// SEO Scans
export const insertSeoScanSchema = createInsertSchema(seoScans).omit({
  id: true,
  pagesScanned: true,
  issuesFound: true,
  startedAt: true,
  completedAt: true,
}).extend({
  scanType: z.enum(["full", "delta", "single-page"]),
  triggeredBy: z.enum(["cron", "manual", "post-publish"]),
});
export type InsertSeoScan = z.infer<typeof insertSeoScanSchema>;
export type SeoScan = typeof seoScans.$inferSelect;

// SEO Issues
export const insertSeoIssueSchema = createInsertSchema(seoIssues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  fixedAt: true,
}).extend({
  scanId: z.string().uuid(),
  category: z.enum(["technical", "content", "performance"]),
  issueType: z.string().min(1).max(100),
  severity: z.enum(["critical", "high", "medium", "low"]),
  status: z.enum(["active", "fixed", "ignored"]).default("active"),
  pageUrl: z.string().url(),
  description: z.string().min(1),
  autoFixable: z.boolean().default(false),
});
export type InsertSeoIssue = z.infer<typeof insertSeoIssueSchema>;
export type SeoIssue = typeof seoIssues.$inferSelect;

// SEO Fixes
export const insertSeoFixSchema = createInsertSchema(seoFixes).omit({
  id: true,
  appliedAt: true,
}).extend({
  issueId: z.string().uuid(),
  fixType: z.enum(["auto", "ai-generated", "manual"]),
  action: z.string().min(1).max(100),
  appliedBy: z.string().min(1),
  success: z.boolean().default(true),
});
export type InsertSeoFix = z.infer<typeof insertSeoFixSchema>;
export type SeoFix = typeof seoFixes.$inferSelect;

// SEO Metrics
export const insertSeoMetricSchema = createInsertSchema(seoMetrics).omit({
  id: true,
  recordedAt: true,
}).extend({
  overallScore: z.number().int().min(0).max(100),
  technicalScore: z.number().int().min(0).max(100),
  contentScore: z.number().int().min(0).max(100),
  performanceScore: z.number().int().min(0).max(100),
  totalIssues: z.number().int().min(0),
  criticalIssues: z.number().int().min(0),
  highIssues: z.number().int().min(0),
  mediumIssues: z.number().int().min(0),
  lowIssues: z.number().int().min(0),
});
export type InsertSeoMetric = z.infer<typeof insertSeoMetricSchema>;
export type SeoMetric = typeof seoMetrics.$inferSelect;

// SEO Performance Metrics
export const insertSeoPerformanceMetricSchema = createInsertSchema(seoPerformanceMetrics).omit({
  id: true,
  fetchTime: true,
}).extend({
  pageUrl: z.string().url().max(1000),
  strategy: z.enum(["mobile", "desktop"]),
  performanceScore: z.number().int().min(0).max(100),
  seoScore: z.number().int().min(0).max(100),
  accessibilityScore: z.number().int().min(0).max(100),
  bestPracticesScore: z.number().int().min(0).max(100),
  pwaScore: z.number().int().min(0).max(100).optional(),
  scanId: z.string().uuid().optional(),
});
export type InsertSeoPerformanceMetric = z.infer<typeof insertSeoPerformanceMetricSchema>;
export type SeoPerformanceMetric = typeof seoPerformanceMetrics.$inferSelect;

// SEO Overrides
export const insertSeoOverrideSchema = createInsertSchema(seoOverrides).omit({
  id: true,
  appliedAt: true,
}).extend({
  pageUrl: z.string().min(1).max(1000),
  canonical: z.string().max(1000).optional(),
  title: z.string().max(200).optional(),
  metaDescription: z.string().optional(),
  robotsMeta: z.string().max(100).optional(),
  viewport: z.string().max(200).optional(),
  appliedBy: z.string().max(36).optional(),
  active: z.boolean().default(true),
});
export type InsertSeoOverride = z.infer<typeof insertSeoOverrideSchema>;
export type SeoOverride = typeof seoOverrides.$inferSelect;

// SEO Fix Jobs
export const insertSeoFixJobSchema = createInsertSchema(seoFixJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  approvedAt: true,
}).extend({
  issueId: z.string().uuid().optional(),
  fixType: z.string().min(1).max(100),
  status: z.string().max(50).default("pending"),
  aiPrompt: z.string().optional(),
  aiResponse: z.string().optional(),
  humanApprovalStatus: z.string().max(50).optional(),
  approvedBy: z.string().max(36).optional(),
  error: z.string().optional(),
});
export type InsertSeoFixJob = z.infer<typeof insertSeoFixJobSchema>;
export type SeoFixJob = typeof seoFixJobs.$inferSelect;

// SEO Scan History
export const insertSeoScanHistorySchema = createInsertSchema(seoScanHistory).omit({
  id: true,
  lastScanAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  url: z.string().min(1).max(1000),
  lastScannedBy: z.enum(["cron", "manual", "post-publish"]),
  scanId: z.string().uuid().optional(),
  issuesFound: z.number().int().min(0).default(0),
});
export type InsertSeoScanHistory = z.infer<typeof insertSeoScanHistorySchema>;
export type SeoScanHistory = typeof seoScanHistory.$inferSelect;

// SEO Alert History
export const insertSeoAlertHistorySchema = createInsertSchema(seoAlertHistory).omit({
  id: true,
  sentAt: true,
}).extend({
  issueId: z.string().uuid().optional(),
  notificationType: z.enum(["critical_alert", "high_priority_digest"]),
  recipients: z.array(z.string().email()),
  emailSubject: z.string().min(1),
});
export type InsertSeoAlertHistory = z.infer<typeof insertSeoAlertHistorySchema>;
export type SeoAlertHistory = typeof seoAlertHistory.$inferSelect;
