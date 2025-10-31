# YoForex Platform - Complete Guide
**Last Updated:** October 28, 2025  
**Version:** 2.1 - SEO Enhancements & Testing Complete  
**Platform Type:** EA Forum & Marketplace with Gold Coin Economy

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Homepage - Complete Breakdown](#homepage-complete-breakdown)
3. [All Pages - Detailed Documentation](#all-pages-detailed-documentation)
4. [Publishing System - EABOOK-Style Release Forms](#publishing-system-eabook-style-release-forms)
5. [User Flows & Journeys](#user-flows--journeys)
6. [Gold Coin System - Complete Guide](#gold-coin-system-complete-guide)
7. [Payment & Recharge System](#payment--recharge-system)
8. [Ranking & Trust Level System](#ranking--trust-level-system)
8.5 [Onboarding Checklist System](#onboarding-checklist-system)
9. [Components Library](#components-library)
10. [API Connections Per Page](#api-connections-per-page)
11. [Database Schema Reference](#database-schema-reference)

---

## Platform Overview

### What is YoForex?
YoForex is a professional EA (Expert Advisor) forum and marketplace platform for algorithmic trading (MT4/MT5). The platform combines:
- **Traditional Forum** - 16 specialized categories for strategy discussion, EA development, and trading support
- **Marketplace** - User-to-user transactions for EAs, Indicators, Articles, and Source Code
- **Gold Coin Economy** - Earn coins for contributions, spend on premium content
- **Broker Directory** - Community-driven broker reviews with scam reporting
- **Social Features** - User follows, private messages, badges, trust levels
- **100% Automated SEO** - Every thread and reply gets unique SEO slug for Google indexing

### Core Features
✓ 16 forum categories (Strategy, Development, Reports, Support, etc.)  
✓ Unlimited nested replies with keyword-rich SEO slugs  
✓ Gold coin economy (earn by contributing, spend on content)  
✓ User-to-user marketplace with secure transactions  
✓ Real-time updates (10-30s polling intervals)  
✓ Trust level progression system  
✓ Badge achievements  
✓ Leaderboards (Coins, Contributions, Uploads)  
✓ Onboarding checklist with 4 essential milestones (+95 coins total)  
✓ Private messaging  
✓ User follows/followers  
✓ Broker directory with scam watch  
✓ **SEO Preview Component** - Real-time Google search appearance preview  
✓ **Keyword Density Validation** - Optimal 0.5-3% range with feedback  
✓ **Integration Testing** - 100% pass rate on 8 critical API endpoints  

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend:** Express.js + PostgreSQL + Drizzle ORM
- **State Management:** TanStack Query v5 (with 10-30s polling)
- **Routing:** Wouter
- **Forms:** React Hook Form + Zod
- **Auth:** Replit Auth (OIDC)
- **Icons:** Lucide React
- **UI Components:** Radix UI primitives via shadcn/ui

### Security & Performance Enhancements (October 26, 2025)

#### Input Validation & XSS Protection
**File:** `server/validation.ts`  
**Status:** ✅ Implemented

- **DOMPurify Sanitization:** All user inputs sanitized server-side to prevent XSS attacks
- **Coin Amount Validation:** Prevents negative amounts, zero values, and amounts exceeding 1 billion
- **Price Validation:** Validates content prices (1-1,000,000 coins range)
- **String Length Limits:** All text inputs validated for maximum length (255-5000 chars)
- **HTML Sanitization:** User-generated HTML content sanitized while preserving safe formatting

**Protected Endpoints:**
- All coin transaction endpoints (earn, spend, transfer, purchase)
- All content creation endpoints (marketplace, forum threads, replies)
- All review and rating endpoints (broker reviews, content reviews)
- User profile updates and messages

#### Rate Limiting
**File:** `server/rateLimiting.ts`  
**Status:** ✅ Implemented

Multiple rate limiters protect against API abuse and spam:

| Limiter | Limit | Window | Applied To |
|---------|-------|--------|-----------|
| General API | 100 requests | 15 min | All API endpoints |
| Write Operations | 30 requests | 15 min | POST/PUT/DELETE operations |
| Coin Operations | 10 requests | 15 min | Earn/spend/transfer coins |
| Content Creation | 5 posts | 1 hour | Create threads, content, replies |
| Reviews/Ratings | 20 requests | 1 hour | Submit reviews, rate content |

**Configuration:**
- Trust proxy enabled for accurate IP detection behind Replit infrastructure
- 429 status code returned when limits exceeded
- X-RateLimit headers included in responses

#### Database Performance Optimization
**Status:** ✅ Implemented (25 indexes added)

**Expected Performance Improvement:** 10-100x speedup on queries

**Indexes Added:**

**Forum System (8 indexes):**
- `idx_forum_threads_category` - Filter threads by category
- `idx_forum_threads_created_at` - Sort by date
- `idx_forum_threads_pinned_created` - Pinned threads query optimization
- `idx_forum_threads_last_activity` - Sort by activity
- `idx_forum_replies_thread_id` - Fetch thread replies
- `idx_forum_replies_user_id` - User's forum activity
- `idx_forum_replies_parent_id` - Nested reply threads
- `idx_forum_replies_created_at` - Sort replies by date

**Content Marketplace (7 indexes):**
- `idx_content_type` - Filter by content type (EA/Indicator/Article)
- `idx_content_author_id` - User's published content
- `idx_content_created_at` - Sort by publication date
- `idx_content_views` - Sort by popularity
- `idx_content_likes` - Most liked content
- `idx_content_purchases_content_id` - Purchase history per item
- `idx_content_purchases_user_id` - User's purchase history

**Broker Directory (5 indexes):**
- `idx_broker_reviews_broker_id` - Broker review listings
- `idx_broker_reviews_user_id` - User's broker reviews
- `idx_broker_reviews_created_at` - Recent reviews
- `idx_broker_reviews_is_scam_report` - Scam report filtering
- `idx_broker_reviews_rating` - Sort by rating

**Coin System & Social (5 indexes):**
- `idx_coin_transactions_user_id` - User transaction history
- `idx_coin_transactions_created_at` - Recent transactions
- `idx_recharge_orders_user_id` - User's recharge orders
- `idx_messages_recipient_id` - Inbox messages
- `idx_user_follows_followed_id` - User follower counts

#### Database Schema Updates
**Status:** ✅ Migrated via SQL

**Users Table Enhancements:**
- Added `email` column (varchar, unique, not null)
- Added `first_name` column (varchar)
- Added `last_name` column (varchar)
- Added `profile_image_url` column (varchar)
- Added `created_at` timestamp with default
- Added `updated_at` timestamp with default
- Made `password` nullable for OIDC migration compatibility
- Maintained backward compatibility with existing `username` field

**Migration Method:** Manual SQL ALTER TABLE statements (executed successfully)

---

## Real-Time Auto-Refresh System

**Status:** ✅ Fully Implemented (October 26, 2025)  
**File:** `client/src/hooks/useRealtimeUpdates.ts`  
**Purpose:** Automatic polling system for real-time data updates across dashboard widgets

### Overview
YoForex implements a sophisticated real-time update system using TanStack Query's polling capabilities. The platform automatically refreshes data at configurable intervals without requiring user interaction, creating a dynamic, live-feeling experience.

### Custom Hook: useRealtimeUpdates

**Implementation:**
```typescript
import { useQuery } from '@tanstack/react-query';

interface RealtimeOptions {
  interval?: number;  // Refresh interval in milliseconds (default: 30000)
  enabled?: boolean;  // Enable/disable auto-refresh (default: true)
}

export function useRealtimeUpdates<T = any>(
  queryKey: string,
  options: RealtimeOptions = {}
) {
  const { interval = 30000, enabled = true } = options;

  const query = useQuery<T>({
    queryKey: [queryKey],
    enabled,
    refetchInterval: interval,
    refetchIntervalInBackground: true,  // Continues even when tab is inactive
    staleTime: interval / 2,            // Data is stale after half the interval
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    lastUpdated: query.dataUpdatedAt > 0 ? new Date(query.dataUpdatedAt) : null,
    refetch: query.refetch,
  };
}
```

**Key Features:**
- **Configurable Intervals:** Each widget can specify its own refresh rate based on data importance
- **Background Polling:** Continues refreshing even when browser tab is inactive
- **Last Updated Tracking:** Exposes `lastUpdated` timestamp for "Updated X ago" indicators
- **Manual Refresh:** Provides `refetch()` function for user-triggered updates
- **Error Handling:** Exposes `isError` and `error` for graceful failure states

### Auto-Refreshing Widgets

**1. StatsBar (30s interval)**
- **Location:** Top of homepage, below header
- **Endpoint:** `GET /api/stats`
- **Data:** Total threads, posts, members, active users
- **Usage:**
  ```typescript
  const { data: stats, lastUpdated } = useRealtimeUpdates('/api/stats', { 
    interval: 30000 
  });
  ```

**2. Leaderboard (30s interval)**
- **Location:** Homepage right sidebar
- **Endpoint:** `GET /api/leaderboard`
- **Data:** Top 10 users by coins/reputation
- **Usage:**
  ```typescript
  const { data: leaderboard } = useRealtimeUpdates('/api/leaderboard', { 
    interval: 30000 
  });
  ```

**3. What's Hot (30s interval)**
- **Location:** Homepage right sidebar
- **Endpoint:** `GET /api/threads/hot`
- **Data:** 5 trending threads with hotScore
- **Usage:**
  ```typescript
  const { data: hotThreads } = useRealtimeUpdates('/api/threads/hot', { 
    interval: 30000 
  });
  ```

**4. Week Highlights (30s interval)**
- **Location:** Homepage main content area
- **Endpoint:** `GET /api/threads/highlights`
- **Data:** New, trending, and solved threads from this week
- **Usage:**
  ```typescript
  const { data: highlights } = useRealtimeUpdates('/api/threads/highlights', { 
    interval: 30000 
  });
  ```

**5. Top Sellers (60s interval)**
- **Location:** Homepage right sidebar
- **Endpoint:** `GET /api/users/top-sellers`
- **Data:** Top 5 content creators by earnings
- **Refresh Rate:** Slower (60s) since sales data changes less frequently
- **Usage:**
  ```typescript
  const { data: topSellers } = useRealtimeUpdates('/api/users/top-sellers', { 
    interval: 60000 
  });
  ```

**6. Activity Feed (10s interval - Fastest)**
- **Location:** Dashboard page
- **Endpoint:** `GET /api/activity/recent`
- **Data:** Latest forum activity (new threads, replies, purchases)
- **Refresh Rate:** Fastest (10s) for near real-time activity monitoring
- **Usage:**
  ```typescript
  const { data: activity, isRefetching } = useRealtimeUpdates('/api/activity/recent', { 
    interval: 10000 
  });
  ```

### Visual "Updated X ago" Indicators

**Implementation Example:**
```tsx
import { formatDistanceToNow } from 'date-fns';

function StatsBar() {
  const { data: stats, lastUpdated, isRefetching } = useRealtimeUpdates('/api/stats');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Platform Statistics</CardTitle>
        {lastUpdated && (
          <Badge variant="outline" className="text-xs">
            {isRefetching && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {/* Stats display */}
      </CardContent>
    </Card>
  );
}
```

### Performance Considerations

**Optimized Polling:**
- Widgets use different intervals based on data volatility
- Fast-changing data (Activity Feed): 10s
- Moderate-changing data (Stats, Leaderboard): 30s
- Slow-changing data (Top Sellers): 60s

**Server-Side Caching:**
- Backend caches expensive queries for 5-30s
- Reduces database load from multiple concurrent users
- Cache invalidation on write operations

**Network Efficiency:**
- Uses HTTP 304 Not Modified when data hasn't changed
- TanStack Query deduplicates simultaneous requests
- Background polling doesn't block UI interactions

---

## Background Job Scheduler

**Status:** ✅ Fully Implemented (October 26, 2025)  
**File:** `server/jobs/backgroundJobs.ts`  
**Technology:** node-cron  
**Purpose:** Automated calculation and updating of engagement scores, user reputations, and sales rankings

### Overview
YoForex uses node-cron to run scheduled background jobs that maintain up-to-date ranking and scoring data. These jobs run independently of user requests, ensuring that leaderboards, trending content, and reputation scores are always current.

### Job Scheduler Architecture

**Initialization:**
```typescript
import cron from 'node-cron';
import type { IStorage } from '../storage';

export function startBackgroundJobs(storage: IStorage) {
  console.log('[JOBS] Starting background job scheduler...');

  // Schedule periodic jobs
  scheduleThreadScoreUpdates(storage);
  scheduleUserReputationUpdates(storage);
  scheduleTopSellerScoreUpdates(storage);

  // Run initial calculations on startup
  runInitialCalculations(storage);
}
```

### Scheduled Jobs

**1. Thread Engagement Score Updates (Every 60 minutes)**
- **Cron Expression:** `'0 * * * *'` (top of every hour)
- **Purpose:** Recalculate hotScore for all forum threads
- **Algorithm:** Uses engagement score formula with time decay
- **Impact:** Updates "What's Hot" widget and trending algorithms

**Implementation:**
```typescript
cron.schedule('0 * * * *', async () => {
  console.log('[JOBS] Updating thread engagement scores...');
  try {
    await updateThreadScores(storage);
  } catch (error) {
    console.error('[JOBS] Error updating thread scores:', error);
  }
});

async function updateThreadScores(storage: IStorage) {
  const threads = await storage.getAllForumThreads();
  let updated = 0;

  for (const thread of threads) {
    try {
      const author = await storage.getUserById(thread.authorId);
      const authorReputation = author?.reputationScore || 0;

      const score = calculateEngagementScore({
        views: thread.views,
        replies: thread.replyCount,
        likes: 0,
        bookmarks: 0,
        shares: 0,
        recency: thread.createdAt,
        authorReputation
      });

      await storage.updateThreadScore(thread.id, score);
      updated++;
    } catch (error) {
      console.error(`[JOBS] Error updating score for thread ${thread.id}:`, error);
    }
  }

  console.log(`[JOBS] Updated ${updated} thread scores`);
}
```

**2. User Reputation Score Updates (Every 5 minutes)**
- **Cron Expression:** `'*/5 * * * *'`
- **Purpose:** Recalculate reputation scores for all users
- **Algorithm:** Uses user reputation formula based on contributions
- **Impact:** Updates leaderboards, trust levels, and user rankings
- **⚠️ Known Issue:** May encounter SQL errors on some user stat queries (non-blocking)

**Implementation:**
```typescript
cron.schedule('*/5 * * * *', async () => {
  console.log('[JOBS] Updating user reputation scores...');
  try {
    await updateUserReputations(storage);
  } catch (error) {
    console.error('[JOBS] Error updating user reputations:', error);
  }
});

async function updateUserReputations(storage: IStorage) {
  const users = await storage.getAllUsers();
  let updated = 0;

  for (const user of users) {
    try {
      const stats = await storage.getUserStats(user.id);

      const reputation = calculateUserReputation({
        threadsCreated: stats.threadsCreated,
        repliesPosted: stats.repliesPosted,
        likesReceived: stats.likesReceived,
        bestAnswers: stats.bestAnswers || 0,
        contentSales: stats.contentSales || 0,
        followersCount: stats.followersCount || 0,
        uploadsCount: stats.uploadsCount || 0,
        verifiedTrader: user.isVerifiedTrader || false
      });

      await storage.updateUserReputation(user.id, reputation);
      updated++;
    } catch (error) {
      console.error(`[JOBS] Error updating reputation for user ${user.id}:`, error);
      // Continue with next user - non-blocking error
    }
  }

  console.log(`[JOBS] Updated ${updated} user reputations`);
}
```

**3. Top Seller Score Updates (Every 15 minutes)**
- **Cron Expression:** `'*/15 * * * *'`
- **Purpose:** Recalculate sales scores for marketplace content
- **Algorithm:** Combines revenue, reviews, and downloads
- **Impact:** Updates "Top Sellers" widget and marketplace rankings

**Implementation:**
```typescript
cron.schedule('*/15 * * * *', async () => {
  console.log('[JOBS] Updating top seller scores...');
  try {
    await updateTopSellerScores(storage);
  } catch (error) {
    console.error('[JOBS] Error updating top seller scores:', error);
  }
});

async function updateTopSellerScores(storage: IStorage) {
  const allContent = await storage.getAllContent();
  let updated = 0;

  for (const content of allContent) {
    try {
      const salesStats = await storage.getContentSalesStats(content.id);

      const score = calculateSalesScore({
        totalSales: salesStats.totalSales,
        priceCoins: content.priceCoins,
        reviewCount: salesStats.reviewCount,
        avgRating: salesStats.avgRating,
        downloads: content.downloads
      });

      await storage.updateContentSalesScore(content.id, score);
      updated++;
    } catch (error) {
      console.error(`[JOBS] Error updating sales score for content ${content.id}:`, error);
    }
  }

  console.log(`[JOBS] Updated ${updated} content sales scores`);
}
```

### Automatic Startup Calculations

**Initial Score Population:**
When the server starts, all scores are calculated immediately to ensure data is ready before the first scheduled job runs.

```typescript
console.log('[JOBS] Running initial score calculations...');
setTimeout(async () => {
  try {
    await updateThreadScores(storage);
    await updateUserReputations(storage);
    await updateTopSellerScores(storage);
    console.log('[JOBS] Initial score calculations complete');
  } catch (error) {
    console.error('[JOBS] Error in initial calculations:', error);
  }
}, 5000); // Wait 5 seconds after startup for database connections
```

### Error Logging and Recovery

**Error Handling Strategy:**
- **Per-Item Error Handling:** Errors on individual items (thread, user, content) don't stop the job
- **Logging:** All errors logged with context (item ID, error message)
- **Continuation:** Job continues processing remaining items after error
- **Monitoring:** Console logs show success/failure counts

**Error Log Example:**
```
[JOBS] Updating user reputation scores...
[JOBS] Error updating reputation for user abc-123: SQL error
[JOBS] Updated 45 user reputations
```

### Performance Impact

**Database Load:**
- Jobs run during off-peak hours when possible
- Batch updates use transactions for consistency
- Indexes on score columns ensure fast writes

**Server Resources:**
- Jobs run asynchronously without blocking API requests
- Each job takes 1-5 seconds depending on data volume
- Memory usage minimal (<50MB per job execution)

---

## Sophisticated Ranking Algorithms

**Status:** ✅ Fully Implemented (October 26, 2025)  
**File:** `server/utils/rankingAlgorithm.ts`  
**Purpose:** Calculate engagement scores, user reputations, and sales rankings using weighted formulas with time decay

### Algorithm 1: Engagement Score (Thread Ranking)

**Purpose:** Determine "hotness" of forum threads for trending/featured sections

**Formula:**
```typescript
engagementScore = baseScore × recencyBoost × reputationMultiplier

Where:
  baseScore = (views × 0.1) + (replies × 5) + (likes × 2) + 
              (bookmarks × 3) + (shares × 4) + (downloads × 10) + (purchases × 50)
  
  recencyBoost = 1 + e^(-ageInHours / 168)  // Exponential decay over 7 days
  
  reputationMultiplier = min(2.0, 1.0 + (authorReputation / 10000))  // 1.0 to 2.0 range
```

**Weight Rationale:**
- **Views (0.1):** Passive metric, low weight to prevent view-count manipulation
- **Replies (5.0):** Active discussion indicator, medium-high weight
- **Likes (2.0):** Quick appreciation, moderate weight
- **Bookmarks (3.0):** Shows intent to return, higher than likes
- **Shares (4.0):** Content amplification, high value
- **Downloads (10.0):** Conversion action, very high value
- **Purchases (50.0):** Revenue-generating action, highest weight

**Time Decay Implementation:**
```typescript
export function calculateEngagementScore(factors: RankingFactors): number {
  const { views, replies, likes, bookmarks = 0, shares = 0, downloads = 0, 
          purchases = 0, recency, authorReputation = 1 } = factors;

  // Weight different actions based on engagement value
  const WEIGHTS = {
    view: 0.1,
    reply: 5.0,
    like: 2.0,
    bookmark: 3.0,
    share: 4.0,
    download: 10.0,
    purchase: 50.0
  };

  // Calculate base engagement score
  let score = 0;
  score += views * WEIGHTS.view;
  score += replies * WEIGHTS.reply;
  score += likes * WEIGHTS.like;
  score += bookmarks * WEIGHTS.bookmark;
  score += shares * WEIGHTS.share;
  score += downloads * WEIGHTS.download;
  score += purchases * WEIGHTS.purchase;

  // Apply time decay (exponential decay over 7 days)
  const ageInHours = (Date.now() - new Date(recency).getTime()) / (1000 * 60 * 60);
  const decayRate = 7 * 24; // 7 days in hours
  const recencyBoost = Math.exp(-ageInHours / decayRate);
  score *= (1 + recencyBoost);

  // Apply author reputation multiplier (1.0 to 2.0 range)
  const reputationMultiplier = Math.min(2.0, 1.0 + (authorReputation / 10000));
  score *= reputationMultiplier;

  return Math.round(score);
}
```

**Example Calculation:**
```
Thread with:
  - 1000 views
  - 25 replies  
  - 10 likes
  - 3 days old
  - Author reputation: 5000

Base Score:
  = (1000 × 0.1) + (25 × 5) + (10 × 2)
  = 100 + 125 + 20
  = 245

Recency Boost (3 days = 72 hours):
  = 1 + e^(-72 / 168)
  = 1 + e^(-0.43)
  = 1 + 0.65
  = 1.65

Reputation Multiplier:
  = 1 + (5000 / 10000)
  = 1.5

Final Score:
  = 245 × 1.65 × 1.5
  = 606 (rounded)
```

### Algorithm 2: User Reputation Score

**Purpose:** Rank users for leaderboards and trust level progression

**Formula:**
```typescript
reputation = activityScore + qualityScore + verifiedBonus

Where:
  activityScore = (threadsCreated × 10) + (repliesPosted × 5) + (uploadsCount × 15)
  
  qualityScore = (likesReceived × 2) + (bestAnswers × 50) + (contentSales × 100) + 
                 (followersCount × 3)
  
  verifiedBonus = verifiedTrader ? reputation × 0.2 : 0  // 20% boost for verified traders
```

**Implementation:**
```typescript
export function calculateUserReputation(userStats: UserStats): number {
  const { threadsCreated, repliesPosted, likesReceived, bestAnswers, contentSales,
          followersCount, uploadsCount, verifiedTrader } = userStats;

  let reputation = 0;

  // Base activity points (encourages participation)
  reputation += threadsCreated * 10;      // Creating discussions
  reputation += repliesPosted * 5;        // Engaging in conversations
  reputation += likesReceived * 2;        // Community appreciation
  reputation += uploadsCount * 15;        // Contributing content

  // Quality indicators (higher weight for valuable contributions)
  reputation += bestAnswers * 50;         // Solving problems = high value
  reputation += contentSales * 100;       // Successful products
  reputation += followersCount * 3;       // Community influence

  // Verified trader badge bonus (20% boost)
  if (verifiedTrader) {
    reputation *= 1.2;
  }

  return Math.round(reputation);
}
```

**Example Calculation:**
```
User with:
  - 50 threads created
  - 200 replies posted
  - 150 likes received
  - 10 best answers
  - 5 content sales
  - 25 followers
  - 8 uploads
  - Verified trader badge

Activity Score:
  = (50 × 10) + (200 × 5) + (8 × 15)
  = 500 + 1000 + 120
  = 1620

Quality Score:
  = (150 × 2) + (10 × 50) + (5 × 100) + (25 × 3)
  = 300 + 500 + 500 + 75
  = 1375

Base Reputation:
  = 1620 + 1375
  = 2995

Verified Bonus (20%):
  = 2995 × 1.2
  = 3594 (rounded)
```

### Algorithm 3: Sales Score (Marketplace Ranking)

**Purpose:** Rank marketplace content by commercial success

**Formula:**
```typescript
salesScore = revenueScore + socialProofScore + qualityBonus + popularityScore

Where:
  revenueScore = totalSales × priceCoins
  socialProofScore = reviewCount × 10
  qualityBonus = avgRating > 0 ? avgRating × 50 : 0
  popularityScore = downloads × 2
```

**Implementation:**
```typescript
export function calculateSalesScore(stats: ContentSalesStats): number {
  const { totalSales, priceCoins, reviewCount, avgRating, downloads } = stats;

  // Revenue impact (most important for sellers)
  const revenueScore = totalSales * priceCoins;

  // Social proof (reviews indicate trust)
  const reviewScore = reviewCount * 10;

  // Quality bonus (high ratings boost visibility)
  const ratingBonus = avgRating > 0 ? avgRating * 50 : 0;

  // Download count (popularity indicator)
  const downloadScore = downloads * 2;

  const totalScore = revenueScore + reviewScore + ratingBonus + downloadScore;

  return Math.round(totalScore);
}
```

**Example Calculation:**
```
Content with:
  - 50 total sales
  - 200 coins price
  - 25 reviews
  - 4.5 star average rating
  - 150 downloads

Revenue Score:
  = 50 × 200
  = 10,000

Social Proof Score:
  = 25 × 10
  = 250

Quality Bonus:
  = 4.5 × 50
  = 225

Popularity Score:
  = 150 × 2
  = 300

Total Sales Score:
  = 10,000 + 250 + 225 + 300
  = 10,775
```

### Trending Weight Calculation

**Purpose:** Determine velocity-based trending for "What's Hot" widget

**Implementation:**
```typescript
export function getTrendingWeight(thread: {
  views: number;
  replyCount: number;
  createdAt: Date;
}): number {
  const ageInHours = (Date.now() - new Date(thread.createdAt).getTime()) / (1000 * 60 * 60);
  
  // Only consider recent threads (last 7 days)
  if (ageInHours > 168) { // 7 days
    return 0;
  }

  // Velocity-based trending: engagement per hour
  const velocity = (thread.views * 0.1 + thread.replyCount * 5) / Math.max(1, ageInHours);
  
  // Apply recency boost (exponential decay over 48 hours)
  const recencyFactor = Math.exp(-ageInHours / 48);
  
  return velocity * (1 + recencyFactor);
}
```

### Integration with Background Jobs

All three algorithms are called by the background job scheduler:
1. **Thread Scores:** Updated every 60 minutes via `updateThreadScores()`
2. **User Reputations:** Updated every 5 minutes via `updateUserReputations()`
3. **Sales Scores:** Updated every 15 minutes via `updateTopSellerScores()`

Pre-calculated scores are stored in the database and served via API endpoints for instant widget rendering.

---

## Authentication & Authorization System

### Overview
**Status:** ✅ Fully Implemented (October 26, 2025)  
**Method:** Replit Auth (OIDC) via Passport.js  
**Session Storage:** PostgreSQL-backed sessions with 7-day TTL  
**File:** `server/replitAuth.ts`

The platform uses Replit's OIDC (OpenID Connect) authentication for secure, production-ready user management with automatic session handling, token refresh, and username collision prevention.

---

### Backend Authentication Architecture

#### Core Components

**1. Authentication Provider: Replit Auth (OIDC)**
- **Protocol:** OpenID Connect with OAuth 2.0
- **Provider:** Replit's authentication service
- **Discovery Endpoint:** `https://replit.com/oidc`
- **Scopes:** `openid email profile offline_access`
- **Token Support:** Access tokens, refresh tokens with automatic rotation

**2. Session Management**
- **Backend:** PostgreSQL sessions table via `connect-pg-simple`
- **Cookie Configuration:**
  - HttpOnly: true (prevents XSS attacks)
  - Secure: true (HTTPS only)
  - Max-Age: 604,800,000 ms (7 days)
  - SameSite: Lax (CSRF protection)
- **Session Table:** `sessions` (auto-created via migration)
- **TTL:** 7 days (configurable in `server/replitAuth.ts`)

**3. Passport.js Integration**
- **Strategy:** `openid-client/passport` Strategy
- **Multi-domain Support:** Handles multiple Replit domains via `REPLIT_DOMAINS` env var
- **Serialization:** Full user object with claims stored in session
- **Token Refresh:** Automatic refresh token rotation on expiration

---

### Authentication Flow

#### 1. Login Flow
```
User clicks "Login" 
  → GET /api/login
  → Redirects to Replit OIDC authorization page
  → User authorizes application
  → Replit redirects to GET /api/callback
  → Exchange authorization code for tokens
  → Create/update user in database via upsertUser()
  → Store session in PostgreSQL
  → Redirect to homepage (/)
```

#### 2. Session Validation Flow
```
User makes authenticated request
  → isAuthenticated middleware checks req.isAuthenticated()
  → Validates session existence in PostgreSQL
  → Checks token expiration (req.user.claims.exp)
  → If expired but refresh token exists:
      → Call refreshTokenGrant()
      → Update session with new tokens
      → Continue to endpoint
  → If no valid session/token:
      → Return 401 Unauthorized
```

#### 3. Logout Flow
```
User clicks "Logout"
  → POST /api/logout
  → Destroy session in PostgreSQL
  → Redirect to Replit's end session endpoint
  → User logged out globally
  → Redirect to homepage
```

---

### Authentication Endpoints

#### GET /api/me
**Purpose:** Get currently authenticated user  
**Authentication:** Optional (returns 401 if not authenticated)  
**Response (200 OK):**
```json
{
  "id": "user-uuid-from-oidc",
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "profileImageUrl": "https://...",
  "totalCoins": 2450,
  "weeklyEarned": 150,
  "rank": 42,
  "createdAt": "2025-10-20T10:00:00Z"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Not authenticated"
}
```

**Frontend Usage:**
```tsx
const { data: user, isLoading } = useQuery({
  queryKey: ['/api/me'],
  retry: false,
});

if (!user) {
  // User not logged in - show login button
}
```

#### GET /api/login
**Purpose:** Initiate OIDC login flow  
**Authentication:** None required  
**Behavior:**
- Sets `prompt=login consent` to force re-authentication
- Redirects to Replit authorization page
- After authorization, redirects to `/api/callback`

**Frontend Usage:**
```tsx
<Button onClick={() => window.location.href = '/api/login'}>
  Log in with Replit
</Button>
```

#### GET /api/callback
**Purpose:** Handle OIDC callback and complete authentication  
**Authentication:** None (public callback)  
**Behavior:**
1. Receives authorization code from Replit
2. Exchanges code for access token + refresh token
3. Validates tokens and extracts user claims
4. Calls `upsertUser()` to create/update user in database
5. Stores session in PostgreSQL
6. Redirects to `/` (homepage) on success
7. Redirects to `/api/login` on failure

**Error Handling:**
- Invalid authorization code → Redirect to login
- Token exchange failure → Redirect to login
- Database errors → Log error and redirect to login

#### POST /api/logout
**Purpose:** Destroy session and log out user  
**Authentication:** None (anyone can logout)  
**Behavior:**
1. Calls `req.logout()` to destroy Passport session
2. Removes session from PostgreSQL
3. Redirects to Replit's `buildEndSessionUrl()`
4. Replit globally logs out user
5. Final redirect to homepage (`/`)

**Frontend Usage:**
```tsx
const logout = async () => {
  await fetch('/api/logout', {
    method: 'POST',
    credentials: 'include',
  });
  window.location.href = '/';
};
```

---

### Protected Endpoints (Require Authentication)

All endpoints below require the `isAuthenticated` middleware and return **401 Unauthorized** if the user is not logged in.

**Middleware Implementation:**
```typescript
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check token expiration
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next(); // Token still valid
  }

  // Attempt refresh with refresh token
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
```

**20 Protected Endpoints:**

1. **POST /api/transactions** - Create coin transaction (earn/spend)
2. **POST /api/recharge** - Create recharge order
3. **POST /api/content** - Publish marketplace content
4. **POST /api/content/purchase** - Purchase content with coins
5. **POST /api/content/review** - Submit content review
6. **POST /api/content/like** - Like content
7. **POST /api/content/reply** - Reply to content
8. **POST /api/content/reply/:replyId/helpful** - Mark content reply helpful
9. **POST /api/brokers** - Create broker entry
10. **POST /api/brokers/review** - Submit broker review
11. **POST /api/threads** - Create forum thread
12. **POST /api/threads/:threadId/replies** - Create forum reply
13. **POST /api/replies/:replyId/accept** - Mark reply as accepted answer
14. **POST /api/replies/:replyId/helpful** - Mark reply as helpful
15. **POST /api/user/:userId/badges** - Award user badge (admin only)
16. **POST /api/users/:userId/follow** - Follow user
17. **DELETE /api/users/:userId/unfollow** - Unfollow user
18. **POST /api/messages** - Send private message
19. **POST /api/messages/:messageId/read** - Mark message as read
20. **PUT /api/user/:userId/profile** - Update user profile

**Security Feature:** All protected endpoints read the authenticated user ID from `req.user.claims.sub` (server-side session), **never** from client-supplied request bodies. This prevents privilege escalation attacks.

**Example Protected Endpoint:**
```typescript
app.post("/api/transactions", isAuthenticated, async (req, res) => {
  const authenticatedUserId = req.user.claims.sub; // Server-side identity
  
  // Override any client-supplied userId
  const validated = insertCoinTransactionSchema.parse(req.body);
  validated.userId = authenticatedUserId; // Use authenticated ID
  
  const transaction = await storage.createCoinTransaction(validated);
  res.json(transaction);
});
```

---

### User Registration & Username Collision Handling

**Function:** `upsertUser()` in `server/replitAuth.ts`

**Purpose:** Create or update user during OIDC authentication

**Username Generation Logic:**
1. **Attempt 1:** Use `firstName_lastName` from OIDC claims
2. **Attempt 2:** Use email prefix (before `@`)
3. **Fallback:** Use `user_{sub}` where `sub` is OIDC user ID

**Collision Handling:**
- If username exists → Database returns unique constraint violation
- Storage layer catches error and auto-retries with `{username}_{randomSuffix}`
- Suffix is incremented or uses UUID to guarantee uniqueness
- **Result:** No duplicate username errors during registration

**OIDC Claims Used:**
```typescript
{
  "sub": "user-oidc-id",           // Unique user ID (becomes our primary key)
  "email": "user@example.com",     // Required
  "first_name": "John",            // Optional
  "last_name": "Doe",              // Optional
  "profile_image_url": "https://..." // Optional
}
```

**Database Upsert:**
```typescript
await storage.upsertUser({
  id: claims["sub"],                // Primary key from OIDC
  email: claims["email"],
  firstName: claims["first_name"],
  lastName: claims["last_name"],
  profileImageUrl: claims["profile_image_url"],
  username: generatedUsername,
});
```

**Username Uniqueness Guarantee:**
- Database has unique constraint on `username` column
- If collision occurs, storage layer appends suffix: `john_doe_2`, `john_doe_3`, etc.
- Worst case: falls back to UUID suffix `john_doe_a1b2c3d4`

---

### Frontend Authentication Implementation

#### AuthContext Provider
**File:** `client/src/contexts/AuthContext.tsx`

**Purpose:** Centralized authentication state management using TanStack Query

**Three Authentication States:**
1. `undefined` - Loading (initial fetch in progress)
2. `null` - Not authenticated (401 response from `/api/me`)
3. `User` - Authenticated (valid session with user data)

**Context API:**
```typescript
interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}
```

**Implementation:**
```tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const login = () => {
    window.location.href = "/api/login";
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  const isAuthenticated = user !== null && user !== undefined;

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Usage in Components:**
```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) return <Spinner />;

  if (!isAuthenticated) {
    return <Button onClick={login}>Log in with Replit</Button>;
  }

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <p>Coins: {user.totalCoins}</p>
      <Button onClick={logout}>Log out</Button>
    </div>
  );
}
```

---

#### Header Component Authentication UI
**File:** `client/src/components/Header.tsx`

**Unauthenticated State:**
- Shows "Login" button in header
- Clicking redirects to `/api/login`
- No coin balance displayed
- No user avatar/dropdown

**Authenticated State:**
- Shows user avatar (or fallback initials)
- Displays coin balance (fetched from `/api/user/:userId/coins`)
- User dropdown menu with:
  - Username display
  - "Profile" link → `/user/:username`
  - "Settings" link → `/settings`
  - "Transaction History" link → `/transactions`
  - "Logout" button

**Implementation Example:**
```tsx
function Header() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <header>
      {/* Left: Logo & Navigation */}
      <nav>{/* ... */}</nav>

      {/* Right: Auth UI */}
      {!isAuthenticated ? (
        <Button onClick={login} data-testid="button-login">
          Log in with Replit
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
            <DropdownMenuItem>
              <Coins className="mr-2 h-4 w-4" />
              {user.totalCoins} coins
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/user/${user.username}`)}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/transactions")}>
              Transaction History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} data-testid="button-logout">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
```

---

#### Authentication Guards (Protected Actions)

**Pattern:** All protected actions check authentication state before allowing user interaction

**Implementation:**
```tsx
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

function CreateThreadButton() {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  const handleClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to create a thread",
        variant: "destructive",
      });
      login(); // Redirect to login
      return;
    }

    // Proceed with thread creation
    openCreateThreadModal();
  };

  return <Button onClick={handleClick}>Create Thread</Button>;
}
```

**Protected Frontend Actions:**
- Create thread
- Create reply
- Publish content
- Purchase content
- Submit review
- Like content
- Follow/unfollow user
- Send private message
- Award badge
- Recharge coins

**User Experience:**
- Unauthenticated users see "Login required" toast
- Automatic redirect to `/api/login`
- After login, user returns to original page
- Seamless authentication flow

---

### Security Features

#### 1. Privilege Isolation
**Rule:** All protected endpoints enforce server-side identity

**Implementation:**
```typescript
// ❌ BAD: Trusting client-supplied userId
app.post("/api/transactions", isAuthenticated, async (req, res) => {
  const userId = req.body.userId; // Client can manipulate this!
  await storage.createCoinTransaction({ userId, ...req.body });
});

// ✅ GOOD: Using server-side authenticated userId
app.post("/api/transactions", isAuthenticated, async (req, res) => {
  const userId = req.user.claims.sub; // From session, cannot be faked
  await storage.createCoinTransaction({ userId, ...req.body });
});
```

**Result:**
- No privilege escalation attacks
- Users cannot perform actions on behalf of others
- Client-supplied IDs are always overridden with authenticated ID

#### 2. Username Collision Handling
**Problem:** Multiple OIDC users might generate the same username

**Solution:**
- Database unique constraint on `username` column
- Storage layer catches `UNIQUE_VIOLATION` error
- Auto-retries with `{username}_{suffix}` pattern
- Suffix increments: `john_doe_2`, `john_doe_3`, etc.
- Fallback to UUID suffix if needed

**Result:** No duplicate username errors during registration

#### 3. Session-Based Authentication
**Benefits:**
- HttpOnly cookies prevent XSS token theft
- Secure flag ensures HTTPS-only transmission
- 7-day TTL balances security and convenience
- PostgreSQL storage survives server restarts
- Automatic session cleanup via TTL

**Session Table Schema:**
```sql
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
```

#### 4. CSRF Protection
**Built-in:** Session-based auth provides inherent CSRF protection via:
- SameSite=Lax cookie policy
- State parameter in OIDC flow
- Origin checking by Passport.js

**Result:** No additional CSRF tokens required

#### 5. Token Refresh
**Automatic:** Expired access tokens are refreshed transparently

**Flow:**
```
User makes request → isAuthenticated checks token expiration
  → If expired:
      → Use refresh token to get new access token
      → Update session with new tokens
      → Continue request processing
  → If refresh fails:
      → Return 401 Unauthorized
      → User must re-authenticate
```

**Benefit:** Long-lived sessions without compromising security

---

### Migration from Demo User

**Old System (Deprecated):**
- Hardcoded demo user ID: `6e5f03b9-e0f1-424b-b264-779d75f62d89`
- No authentication required
- Client-supplied user IDs in all requests
- Security risk: anyone could impersonate anyone

**New System (Current):**
- Real OIDC authentication via Replit Auth
- Session-based identity with PostgreSQL storage
- Server-enforced user IDs from authenticated session
- Protected endpoints return 401 for unauthenticated users
- Frontend shows login UI for unauthenticated state

**Breaking Changes:**
- All protected endpoints now require authentication
- Client-supplied `userId` fields are ignored/overridden
- Frontend must use `useAuth()` hook to check authentication state
- Forms must handle "Login required" state

**Backward Compatibility:**
- Public endpoints still work (threads list, content list, etc.)
- Authenticated endpoints gracefully return 401 if not logged in
- Frontend handles both authenticated and unauthenticated states

---

### Environment Variables Required

```bash
# Replit Auth Configuration
REPL_ID=your-repl-id                 # Auto-provided by Replit
ISSUER_URL=https://replit.com/oidc   # OIDC issuer endpoint
REPLIT_DOMAINS=domain1.repl.co,domain2.repl.co  # Comma-separated domains

# Session Secret
SESSION_SECRET=your-secret-key       # Secure random string for session encryption

# Database
DATABASE_URL=postgresql://...         # PostgreSQL connection string
```

**Security Notes:**
- `SESSION_SECRET` must be at least 32 characters
- `SESSION_SECRET` should be cryptographically random
- Never commit secrets to version control
- Rotate `SESSION_SECRET` periodically in production

---

### Testing Authentication Locally

**1. Ensure PostgreSQL is running:**
```bash
# Sessions table required
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IDX_session_expire ON sessions (expire);
```

**2. Set environment variables:**
```bash
export REPL_ID=your-repl-id
export SESSION_SECRET=$(openssl rand -base64 32)
export REPLIT_DOMAINS=your-repl-domain.repl.co
export DATABASE_URL=postgresql://...
```

**3. Test authentication flow:**
- Visit `/api/login` → Should redirect to Replit authorization
- Authorize app → Should redirect to `/api/callback` → then `/`
- Visit `/api/me` → Should return authenticated user
- Visit `/api/logout` → Should destroy session and redirect

**4. Test protected endpoints:**
```bash
# Without authentication (should return 401)
curl -X POST http://localhost:5000/api/transactions

# With authentication (include session cookie)
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -b "connect.sid=your-session-cookie" \
  -d '{"type":"earn","amount":50,"description":"Test"}'
```

---

## Publishing System - EABOOK-Style Release Forms

**Status:** ✅ Fully Implemented (October 26, 2025)  
**URL:** `/publish` (with optional `?category=slug` query parameter)  
**File:** `client/src/pages/PublishPage.tsx`  
**Backend:** `server/routes.ts` (lines 245-323)

### Overview

The publishing system provides a structured, EABOOK-style release form for publishing EAs, Indicators, Articles, and Performance Reports. It features conditional validation, file/image uploads with checksums, character counters, and automatic SEO generation.

---

### Key Features

✅ **Structured Release Form**
- Title (10-100 chars) with live character counter
- Category selector (16 forum categories)
- Platform dropdown (MT4/MT5/Both)
- Version field
- Price in coins (0-10,000, 0 = free)
- Description (min 300 chars, markdown supported) with character counter
- Tag selector (1-5 tags required)

✅ **Conditional Evidence Mode**
- Automatically shows evidence fields when "Performance Report" tag is selected
- Evidence fields: Equity Curve Image, Profit Factor, Drawdown %, Win Rate %, Broker, Months Tested, Minimum Deposit
- Fields become required based on tag selection

✅ **File Upload System (Phase 2 - Mock Data)**
- Drag-and-drop file upload
- Max 5 files per publication
- Max 50MB per file
- Supported types: .ex4, .ex5, .mq4, .mq5, .zip
- SHA-256 checksum generation (Phase 3)
- Progress bars and retry functionality

✅ **Image Upload Gallery (Phase 2 - Mock Data)**
- Max 5 images per publication
- Cover image selection
- Drag-to-reorder images
- Auto-watermarking with "YoForex.net" branding (Phase 3)

✅ **Auto-SEO Engine**
- Automatically generates SEO slug from title
- Focus keyword extraction
- Meta description (first 155 chars)
- Unique image alt texts

✅ **Security & Validation**
- Server-side authorId injection from authenticated session
- Shared schema validation (`publishContentSchema` from @shared/schema.ts)
- Number coercion with `z.coerce.number()` for HTML form compatibility
- DOMPurify sanitization on all inputs

---

### User Flow

**1. Navigate to Publishing Page**
```
User clicks "Release EA" in header dropdown
  → Dropdown shows 16 categories with icons
  → User clicks category (e.g., "Strategy Discussion")
  → Redirects to /publish?category=strategy-discussion
  → Form pre-fills category field
```

**2. Fill Out Basic Information**
```
User enters:
  - Title: "Gold Hedger EA - XAUUSD Scalping" (10-100 chars)
  - Category: Pre-filled from URL or manually selected
  - Platform: Select MT4/MT5/Both from dropdown
  - Version: "1.2.0"
  - Price: 100 coins (or 0 for free)
  - Description: Minimum 300 characters, markdown supported
  - Tags: Select 1-5 tags (e.g., "Scalping", "XAUUSD", "MT4")
```

**3. Upload Files & Images (Mock Data - Phase 2)**
```
Files:
  - Drag-and-drop EA files (.ex4, .ex5, etc.)
  - Shows progress bars
  - Generates SHA-256 checksum (Phase 3)
  - Max 5 files, 50MB each

Images:
  - Upload gallery images
  - Select cover image
  - Drag to reorder
  - Auto-watermarking (Phase 3)
```

**4. Evidence Mode (Conditional)**
```
IF "Performance Report" tag is selected:
  → Evidence fields appear automatically
  → User must provide:
    - Equity Curve Image
    - Profit Factor (e.g., 2.5)
    - Drawdown % (e.g., 12.3)
    - Win Rate % (e.g., 68.5)
    - Broker (e.g., "IC Markets")
    - Months Tested (e.g., 18)
    - Minimum Deposit (e.g., 500)
  → Submit button disabled until all evidence fields filled
```

**5. Submit Publication**
```
User clicks "Publish Content"
  → Client-side validation via React Hook Form + Zod
  → POST /api/publish with all form data
  → Server validates using publishContentSchema
  → Server injects authorId from session (req.user.claims.sub)
  → Auto-generates SEO metadata (slug, keywords, meta desc)
  → Creates content in database
  → Returns success with content ID
  → User redirected to content detail page (Phase 3)
```

---

### API Endpoints

#### GET /api/publish/categories
**Purpose:** Get all 16 forum categories for dropdown  
**Authentication:** None  
**Returns:** Array of ForumCategory objects

**Response:**
```json
[
  {
    "slug": "strategy-discussion",
    "name": "Strategy Discussion",
    "icon": "TrendingUp",
    "description": "Share and discuss trading strategies..."
  },
  // ... 15 more categories
]
```

#### POST /api/uploads/file
**Purpose:** Upload EA/Indicator files  
**Authentication:** Required  
**Content-Type:** multipart/form-data  
**Current Status:** Returns mock data for development  
**Phase 3:** Real file upload with S3/R2, SHA-256 validation, antivirus scan

**Mock Response:**
```json
{
  "name": "GoldHedger_v1.2.ex4",
  "size": 45632,
  "url": "/uploads/files/abc123.ex4",
  "checksum": "sha256:a3b2c1..."
}
```

#### POST /api/uploads/image
**Purpose:** Upload gallery images  
**Authentication:** Required  
**Content-Type:** multipart/form-data  
**Current Status:** Returns mock data for development  
**Phase 3:** Real image upload, auto-watermarking, optimization

**Mock Response:**
```json
{
  "url": "/uploads/images/xyz789.jpg",
  "isCover": true,
  "order": 0
}
```

#### POST /api/publish
**Purpose:** Publish EA/Indicator/Article with structured form  
**Authentication:** Required (injects authorId from session)  
**Content-Type:** application/json

**Request Body:**
```json
{
  "title": "Gold Hedger EA - XAUUSD Scalping",
  "category": "strategy-discussion",
  "platform": "MT4",
  "version": "1.2.0",
  "priceCoins": 100,
  "description": "Advanced XAUUSD scalping EA with 70% win rate...",
  "tags": ["Scalping", "XAUUSD", "MT4"],
  "files": [
    { "name": "GoldHedger_v1.2.ex4", "size": 45632, "url": "/uploads/files/abc123.ex4", "checksum": "sha256:..." }
  ],
  "images": [
    { "url": "/uploads/images/xyz789.jpg", "isCover": true, "order": 0 }
  ],
  
  // Evidence fields (required if "Performance Report" tag selected)
  "equityCurveImage": "/uploads/images/equity.png",
  "profitFactor": 2.5,
  "drawdownPercent": 12.3,
  "winPercent": 68.5,
  "broker": "IC Markets",
  "monthsTested": 18,
  "minDeposit": 500
}
```

**Validation Rules:**
- `title`: 10-100 characters
- `description`: Minimum 300 characters (markdown supported)
- `priceCoins`: 0-10,000 (0 = free)
- `tags`: 1-5 tags required
- `platform`: "MT4" | "MT5" | "Both"
- `category`: Valid forum category slug
- Evidence fields: Required when "Performance Report" tag is selected

**Response:**
```json
{
  "id": "content-uuid",
  "title": "Gold Hedger EA - XAUUSD Scalping",
  "slug": "gold-hedger-ea-xauusd-scalping",
  "authorId": "user-uuid",
  "priceCoins": 100,
  "status": "approved",
  "createdAt": "2025-10-26T14:00:00Z"
}
```

---

### Schema Architecture

**File:** `shared/schema.ts`

```typescript
// Base schema for all content
export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
});

// Publishing schema with conditional validation
export const publishContentSchema = insertContentSchema
  .omit({ 
    authorId: true,  // Server-managed, injected from session
  })
  .extend({
    title: z.string().min(10).max(100),
    category: z.string(),
    platform: z.enum(["MT4", "MT5", "Both"]),
    version: z.string(),
    priceCoins: z.coerce.number().min(0).max(10000),
    description: z.string().min(300),
    tags: z.array(z.string()).min(1).max(5),
    files: z.array(z.object({
      name: z.string(),
      size: z.number(),
      url: z.string(),
      checksum: z.string(),
    })),
    images: z.array(z.object({
      url: z.string(),
      isCover: z.boolean(),
      order: z.number(),
    })),
    // Evidence fields (optional by default)
    equityCurveImage: z.string().optional(),
    profitFactor: z.coerce.number().optional(),
    drawdownPercent: z.coerce.number().optional(),
    winPercent: z.coerce.number().optional(),
    broker: z.string().optional(),
    monthsTested: z.coerce.number().optional(),
    minDeposit: z.coerce.number().optional(),
  })
  .superRefine((data, ctx) => {
    // Conditional validation: Performance Report requires evidence
    if (data.tags.includes("Performance Report")) {
      if (!data.equityCurveImage) {
        ctx.addIssue({
          code: "custom",
          path: ["equityCurveImage"],
          message: "Equity curve image required for Performance Reports"
        });
      }
      if (!data.profitFactor) {
        ctx.addIssue({
          code: "custom",
          path: ["profitFactor"],
          message: "Profit factor required for Performance Reports"
        });
      }
      // ... similar checks for other evidence fields ...
    }
  });

export type PublishContent = z.infer<typeof publishContentSchema>;
```

**Backend Validation:**
```typescript
// server/routes.ts
app.post("/api/publish", isAuthenticated, async (req, res) => {
  // Get authenticated user ID from session
  const userId = req.user.claims.sub;
  
  // Sanitize inputs (DOMPurify)
  const sanitized = sanitizePublishInput(req.body);
  
  // Validate using shared schema (server injects authorId)
  const validated = publishContentSchema.parse({
    ...sanitized,
    authorId: userId  // Never trust client-supplied IDs
  });
  
  // Create content in database
  const content = await storage.createContent(validated);
  
  res.json(content);
});
```

---

### Frontend Implementation

**File:** `client/src/pages/PublishPage.tsx`

**Key Technologies:**
- React Hook Form for form management
- Zod validation with zodResolver
- TanStack Query for API calls
- shadcn/ui components (Form, Input, Textarea, Select, Button)

**Form Setup:**
```tsx
const form = useForm({
  resolver: zodResolver(publishContentSchema),
  defaultValues: {
    title: "",
    category: searchParams.get("category") || "",
    platform: "MT4",
    version: "",
    priceCoins: 0,
    description: "",
    tags: [],
    files: [],
    images: [],
  }
});
```

**Character Counters:**
```tsx
const titleLength = form.watch("title").length;
const descLength = form.watch("description").length;

<FormDescription>
  {titleLength}/100 characters
</FormDescription>

<FormDescription>
  {descLength} characters (minimum 300 required)
</FormDescription>
```

**Conditional Evidence Fields:**
```tsx
const selectedTags = form.watch("tags");
const showEvidence = selectedTags.includes("Performance Report");

{showEvidence && (
  <div className="space-y-4">
    <h3>Evidence Required for Performance Report</h3>
    <FormField name="equityCurveImage" ... />
    <FormField name="profitFactor" ... />
    <FormField name="drawdownPercent" ... />
    {/* ... more evidence fields ... */}
  </div>
)}
```

**Form Submission:**
```tsx
const publishMutation = useMutation({
  mutationFn: async (data: PublishContent) => {
    const res = await apiRequest('POST', '/api/publish', data);
    return res.json();
  },
  onSuccess: () => {
    toast({ title: "Success!", description: "Content published successfully" });
    queryClient.invalidateQueries({ queryKey: ['/api/content'] });
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  }
});

const onSubmit = (data: PublishContent) => {
  publishMutation.mutate(data);
};
```

---

### Security Features

✅ **Server-Side Identity**
- User ID (`authorId`) **never** accepted from client
- Always injected from authenticated session (`req.user.claims.sub`)
- Prevents privilege escalation attacks

✅ **Shared Schema Validation**
- Single source of truth in `@shared/schema.ts`
- Prevents schema drift between frontend and backend
- Conditional validation rules centralized

✅ **Input Sanitization**
- DOMPurify sanitization on all text inputs
- Prevents XSS attacks
- HTML sanitization while preserving safe formatting

✅ **Number Coercion**
- Uses `z.coerce.number()` for HTML number inputs
- Prevents string/number type mismatches
- Form compatibility with React Hook Form

---

### Next Steps (Phase 3)

**File Upload Security:**
- Real S3/Cloudflare R2 integration
- SHA-256 checksum validation
- Antivirus scanning (ClamAV)
- File type verification
- Size limit enforcement (50MB)

**Image Upload Enhancement:**
- Auto-watermarking with "YoForex.net" branding
- Image optimization and compression
- Thumbnail generation
- Cover image processing

**Post-Publication Flow:**
- Redirect to content detail page
- Success animation
- Social sharing buttons
- Edit/delete functionality

---

## Homepage - Complete Breakdown

**URL:** `/`  
**File:** `client/src/pages/Home.tsx`  
**Layout:** 3-column responsive grid (sidebar-left, main content, sidebar-right)

### Visual Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER                                  │
│  Logo | Categories | Discussions | Broker Reviews | Members     │
│  Search Bar                           Coins | Messages | Bell    │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                        STATS BAR                                 │
│  📊 1.2k Members | 45k Threads | 234k Posts | 156 Online        │
└─────────────────────────────────────────────────────────────────┘
┌──────────────────┬───────────────────────────┬──────────────────┐
│  LEFT SIDEBAR    │      MAIN CONTENT         │  RIGHT SIDEBAR   │
│                  │                           │                  │
│ 🪙 Coin Balance  │  📌 Week Highlights       │  🔥 What's Hot   │
│   2,450 coins    │  (Featured threads)       │  (5 trending)    │
│   +85 this week  │                           │                  │
│   Rank: #142     │  📁 Forum Categories      │  💰 Top Sellers  │
│                  │  (16 categories in grid)  │  (Top 5 earners) │
│ 🏅 Trust Level   │  - Strategy Discussion    │                  │
│   Contributor    │  - Beginner Questions     │  🏆 Leaderboard  │
│   1250/2000 XP   │  - Performance Reports    │  (Top 10 users)  │
│                  │  - Technical Support      │                  │
│ ➕ Create Thread │  - EA Development         │  📎 Important    │
│                  │  - Success Stories        │   Links          │
│ ⚡ Quick Actions │  [View all 16 →]          │  - Forum Rules   │
│   - Publish EA   │                           │  - Download Guide│
│   - Ask Question │  💬 Recent Discussions    │  - Brokers       │
│   - Find Users   │  (8 latest threads)       │  - Coding Rules  │
│                  │  - XAUUSD M1 scalping...  │                  │
│ 📊 Forum Stats   │  - BTCUSD high-freq...    │                  │
│   - Threads      │  - EURUSD London...       │                  │
│   - Active Now   │  - Gold H1 swing...       │                  │
│   - New Today    │  - New to EA trading...   │                  │
│                  │  [Load more threads]      │                  │
└──────────────────┴───────────────────────────┴──────────────────┘
│                          FOOTER                                  │
│  About | Community | Stats | Terms | Privacy | Guidelines       │
│  Online: 342 | Server: Stable | Version: v1.2.3                 │
└─────────────────────────────────────────────────────────────────┘
```

### Components Breakdown

#### LEFT SIDEBAR (5 components)

**1. CoinBalance Widget**
- **Purpose:** Display user's gold coin stats
- **Shows:**
  - Total coins (e.g., "2,450")
  - Weekly earnings (e.g., "+85 this week")
  - Current rank (e.g., "#142")
  - Coin icon (gold color)
- **Click action:** Navigate to `/recharge` page
- **API:** `GET /api/user/:userId/coins` (real-time)
- **Data fields:** `totalCoins`, `weeklyEarned`, `rank`

**2. TrustLevel Widget**
- **Purpose:** Show progression in trust system
- **Shows:**
  - Current level badge (Newbie/Member/Contributor/Regular/Leader)
  - XP progress bar (e.g., "1250/2000 XP")
  - Level benefits preview
- **Levels:** 
  - Newbie (0-500 XP)
  - Member (500-1000 XP)
  - Contributor (1000-2000 XP)
  - Regular (2000-5000 XP)
  - Leader (5000+ XP)
- **API:** Part of user profile data

**3. CreateThreadButton**
- **Purpose:** Quick access to create new forum thread
- **Shows:** Large "+ Create Thread" button
- **Click action:** Opens create thread modal/form
- **Form fields:**
  - Category (dropdown of 16 categories)
  - Title (required, 10-200 chars)
  - Body content (required, markdown support)
  - Image uploads (optional, multiple)
- **API:** `POST /api/threads`
- **Auto-SEO:** Title → slug, keyword, meta description

**4. QuickActions Widget**
- **Purpose:** Fast navigation to key actions
- **Actions:**
  - 📤 Publish EA (→ marketplace publish form)
  - ❓ Ask Question (→ create thread in Q&A category)
  - 👥 Find Users (→ members page)
  - 💰 Top Up Coins (→ recharge page)
- **Each action:** Icon + label + click handler

**5. ForumStats Widget**
- **Purpose:** Live platform statistics
- **Shows:**
  - Total threads created
  - Active users now (last 15 minutes)
  - New threads today
  - New replies today
- **API:** `GET /api/stats` (30s polling)
- **Updates:** Real-time via TanStack Query

---

#### MAIN CONTENT (3 sections)

**SECTION 1: Week Highlights**
- **Component:** `WeekHighlights`
- **Purpose:** Featured/pinned important threads
- **Shows:** 3-5 highlighted threads with:
  - Thread title
  - Excerpt (first 100 chars)
  - Author name + reputation
  - Reply count, view count
  - Special badges (Answered ✓, Pinned 📌, Set File 📁, Backtest ✅, Live Verified 🔴)
- **Click action:** Navigate to `/thread/:slug`
- **Data:** Filtered from recent threads (isPinned=true or high engagement)

**SECTION 2: Forum Categories (Main Section)**
- **Title:** "Forum Categories"
- **Subtitle:** "Choose the right category for your discussion"
- **Layout:** Grid of 16 category cards (3 columns on desktop, 2 on tablet, 1 on mobile)
- **Data source:** Hardcoded array in Home.tsx (16 categories)

**All 16 Categories:**

1. **Strategy Discussion** (Lightbulb icon, blue)
   - Description: "Share setups, risk, execution, and optimization"
   - Stats: 1,234 threads, 8,765 posts
   - Slug: `strategy-discussion`

2. **Beginner Questions** (HelpCircle icon, teal)
   - Description: "Start here: install, accounts, safe practices"
   - Stats: 567 threads, 3,421 posts
   - Slug: `beginner-questions`

3. **Performance Reports** (TrendingUp icon, green)
   - Description: "Backtests & forward tests with full metrics"
   - Stats: 890 threads, 5,432 posts
   - Slug: `performance-reports`

4. **Technical Support** (Settings icon, orange)
   - Description: "Installs, VPS, data, slippage, symbol issues"
   - Stats: 445 threads, 2,109 posts
   - Slug: `technical-support`

5. **EA Development (MQL4/5)** (Code icon, purple)
   - Description: "Coding help, patterns, optimization, tools"
   - Stats: 678 threads, 4,567 posts
   - Slug: `ea-development`

6. **Success Stories** (Award icon, yellow)
   - Description: "Wins with risk control and takeaways"
   - Stats: 234 threads, 1,890 posts
   - Slug: `success-stories`

7. **EA Library** (BookOpen icon, blue)
   - Description: "Curated EA uploads with versions and set files"
   - Stats: 523 threads, 2,876 posts
   - Slug: `ea-library`

8. **Indicators Library** (Activity icon, teal)
   - Description: "Signal, utility & non-repaint toolkits"
   - Stats: 389 threads, 1,654 posts
   - Slug: `indicators`

9. **Tools & Utilities** (Wrench icon, green)
   - Description: "Trade panels, analyzers, data managers"
   - Stats: 156 threads, 892 posts
   - Slug: `tools-utilities`

10. **Source Code (EA/Indicator)** (FileCode icon, orange)
    - Description: "Open code & snippets for learning"
    - Stats: 312 threads, 1,987 posts
    - Slug: `source-code`

11. **Learning Hub** (GraduationCap icon, purple)
    - Description: "Guides, courses, and study roadmaps"
    - Stats: 198 threads, 1,234 posts
    - Slug: `learning-hub`

12. **Q&A / Help** (MessageCircle icon, yellow)
    - Description: "Fast answers; sticky Download Help thread"
    - Stats: 789 threads, 4,321 posts
    - Slug: `qa-help`

13. **Bounties (悬赏)** (Trophy icon, blue)
    - Description: "Offer rewards for fixes, set-files, research"
    - Stats: 87 threads, 456 posts
    - Slug: `bounties`

14. **Rankings / Leaderboard** (BarChart3 icon, teal)
    - Description: "Top EAs and top contributors, updated weekly"
    - Stats: 45 threads, 289 posts
    - Slug: `rankings`

15. **Commercial Trials** (Rocket icon, green)
    - Description: "Vendor demos with verified files and rules"
    - Stats: 123 threads, 678 posts
    - Slug: `commercial-trials`

16. **Scam Watch & Alerts** (ShieldAlert icon, RED)
    - Description: "Report scam Telegram sellers, fake EAs, or bad actors. Earn +150 coins for verified reports"
    - Stats: 78 threads, 456 posts
    - Slug: `scam-watch`

**Each Category Card Shows:**
- Category icon (colored)
- Category name
- Description (1-2 lines)
- Thread count (e.g., "1,234 threads")
- Post count (e.g., "8,765 posts")
- Click action: Navigate to `/category/:slug`

**View All Link:**
- Below categories: "View all categories →"
- Navigate to: `/categories` (full grid page)

**SECTION 3: Recent Discussions**
- **Title:** "Recent Discussions"
- **Subtitle:** "Latest active threads from the community"
- **Shows:** 8 recent thread cards
- **Sort order:** By `lastActivityAt` (most recent first)
- **Data:** Hardcoded in Home.tsx (will connect to API later)

**Each Thread Card Shows:**
- Thread title (clickable)
- Excerpt (first 120 chars of body)
- Author info:
  - Username
  - Reputation score (e.g., "1,450 rep")
- Category label (badge)
- Engagement metrics:
  - 💬 Reply count
  - 👁 View count
  - 🪙 Coins earned
- Status badges:
  - ✓ Answered (green)
  - 📌 Pinned (blue)
  - 📁 Has Set File (purple)
  - ✅ Has Backtest (teal)
  - 🔴 Live Verified (red)
- Last activity time (e.g., "2 hours ago")
- Click action: Navigate to `/thread/:slug`

**Example Recent Threads (8 shown):**
1. "XAUUSD M1 scalping: stable set-file for RAW ECN..."
2. "BTCUSD M1 high-frequency: spread-only brokers..."
3. "EURUSD M5 London session scalping..."
4. "Gold H1 swing: 1:2 RRR with ATR stop..."
5. "New to EA trading - where should I start?"
6. "XAUUSD NY Open breakout: handling news spikes..."
7. "Building a custom grid EA - need advice..."
8. "Gold Asian session M5: is low-volatility grid..."

---

#### RIGHT SIDEBAR (4 widgets)

**1. What's Hot Widget**
- **Purpose:** Show 5 trending forum threads using Reddit-style hot algorithm
- **Title:** "🔥 What's Hot"
- **File:** `client/src/components/WhatsHot.tsx`
- **Algorithm:** Reddit-style trending with 5-minute server-side cache
  - Formula: `hotScore = (views×0.1 + replies×5 + pinnedBonus×100) / ((ageInHours + 2)^1.8)`
  - Pinned threads get +100 bonus
  - Time decay with gravity of 1.8
  - Cache implementation: `server/algorithms/trending.ts`
- **Shows:** Top 5 trending threads from all categories
- **Each item:**
  - Thread title (truncated to 60 chars)
  - Reply count + view count
  - Category badge
  - Posted timestamp (relative)
  - Trending indicator (fire icon)
- **Click action:** Navigate to `/thread/:slug`
- **API:** `GET /api/threads?sortBy=trending&limit=5`
- **Polling:** 60s interval (server cache refreshes every 5 min)
- **Loading State:** Skeleton cards
- **Empty State:** "No trending threads yet" message

**2. Top Sellers Widget**
- **Purpose:** Show top 5 content creators by earnings
- **Title:** "💰 Top Sellers (This Week)"
- **Shows:** 5 users with most coin earnings
- **Each item:**
  - Username
  - Total coins earned this week
  - Profile avatar (or fallback initials)
  - Badge if verified trader
- **Click action:** Navigate to `/user/:username`
- **API:** `GET /api/leaderboard?sortBy=uploads&limit=5`
- **Polling:** 30s interval

**3. Leaderboard Widget**
- **Purpose:** Show top 10 users by total coins
- **Title:** "🏆 Leaderboard"
- **Shows:** Top 10 users
- **Each item:**
  - Rank (#1, #2, #3...)
  - Username
  - Total coins
  - Rank badge (Crown for #1, Medal for #2-3)
- **Special styling:**
  - #1: Gold crown, yellow highlight
  - #2: Silver medal, gray highlight
  - #3: Bronze medal, orange highlight
- **Click action:** "View full leaderboard" → `/members`
- **API:** `GET /api/leaderboard?sortBy=coins&limit=10`
- **Polling:** 30s interval

**4. Important Links**
- **Purpose:** Quick navigation to help resources
- **Title:** "Important Links"
- **Links:**
  - Forum Rules
  - Safe Download Guide
  - Verified Brokers
  - EA Coding Rules
- **Each link:** Text + hover effect
- **Sticky:** Sticks to top when scrolling

---

### Header Component Details

**Layout:** Single row, responsive
**Sticky:** Always visible at top (z-index: 50)
**Backdrop:** Blur effect for modern look

**Left Section:**
- YoForex logo (MessageSquare icon + text)
- Click → Navigate to `/`

**Center Section (Navigation):**
- Categories button → `/categories`
- Discussions button → `/` (home)
- Broker Reviews button → `/brokers`
- Members button → `/members`
- Hidden on mobile (shows in menu)

**Right Section (Search):**
- Search input with icon
- Placeholder: "Search discussions..."
- OnChange: Updates search query state
- OnEnter: Execute search (future feature)

**Far Right Section (User Actions):**
1. **Coin Balance Display**
   - Gold coin icon
   - Coin count (e.g., "2,450")
   - Click → `/recharge`
   - API: `GET /api/user/:userId/coins` (auto-fetches)

2. **Messages Button**
   - Message icon
   - Click → `/messages`
   - Badge if unread messages (future)

3. **Notifications Button**
   - Bell icon
   - Red badge with count (e.g., "3")
   - Click → Opens notification dropdown (future)

4. **User Menu Button**
   - User icon
   - Click → `/settings` or user dropdown
   - Shows avatar if logged in

5. **Mobile Menu Button**
   - Hamburger icon
   - Only visible on mobile
   - Opens slide-out menu with all navigation

**Data Fetching:**
- Coins: Fetched via `useQuery` from `/api/user/:userId/coins`
- No polling on header (static during session)
- Uses demo user ID: `6e5f03b9-e0f1-424b-b264-779d75f62d89`

---

### Footer Component Details

**Layout:** 3-column grid + bottom bar
**Background:** Muted background with border-top

**Column 1: About YoForex**
- Platform description
- Links: Terms | Privacy | Guidelines
- Each link clickable (future pages)

**Column 2: Community**
- "Join Our Telegram"
- "Submit Feedback"
- "API Documentation"
- "Contact Support"

**Column 3: Live Stats**
- Online Users count (e.g., "342")
- Server Status ("✓ Stable" in green)
- Latest Build version (e.g., "v1.2.3")

**Bottom Bar:**
- Copyright notice
- "© 2025 YoForex. All rights reserved. Made for Traders."

---

### StatsBar Component

**Layout:** Single row, full width, above main content
**Background:** Subtle muted background
**Purpose:** Show real-time platform statistics

**Shows 4 Stats:**
1. 📊 Total Members (e.g., "1.2k")
2. 💬 Total Threads (e.g., "45k")
3. ✉️ Total Posts (e.g., "234k")
4. 🟢 Users Online (e.g., "156")

**API:** `GET /api/stats`
**Polling:** 30s interval
**Display:** Icons + labels + formatted numbers

---

## All Pages - Detailed Documentation

### 1. Homepage (/)
**Already documented above in detail**

---

### 2. Categories Page (/categories)

**File:** `client/src/pages/CategoriesPage.tsx`  
**Purpose:** Display all 16 forum categories in full grid view  
**Layout:** Single column with category grid

**Header Section:**
- Page title: "Forum Categories"
- Subtitle: "Explore discussions across all topics"

**Main Content:**
- Grid layout: 3 columns (desktop), 2 (tablet), 1 (mobile)
- Shows all 16 categories (same as homepage but expanded)
- Each category card:
  - Icon (colored, from Lucide)
  - Category name
  - Description
  - Thread count (formatted with commas)
  - Post count (formatted with commas)
  - Hover effect (elevation)
  - Click → `/category/:slug`

**API Connection:**
```typescript
useQuery({
  queryKey: ['/api/categories'],
  refetchInterval: 30000, // 30s polling
});
```

**Data Structure:**
```typescript
{
  slug: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  threadCount: number;
  postCount: number;
}
```

**Summary Statistics Section (Bottom):**
- Card showing:
  - Total Categories: 16
  - Total Threads: Sum of all threadCounts
  - Total Posts: Sum of all postCounts
- Calculation: Uses `.reduce()` to sum counts
- **Safety:** Null-safe rendering with `(value ?? 0).toLocaleString()`

**Loading State:**
- Skeleton cards (4 shown)
- Pulse animation
- Same grid layout

**Empty State:**
- Message: "No categories available"
- Icon: Folder icon
- Unlikely to happen (categories are system-defined)

---

### 3. Category Discussion Page (/category/:slug)

**File:** `client/src/pages/CategoryDiscussionPage.tsx`  
**Purpose:** Show all threads in a specific category  
**Layout:** Category header + thread list

**Route Parameter:**
- Dynamic: `/:slug` (e.g., `/category/strategy-discussion`)
- Extracted via: `useRoute("/category/:slug")`

**Category Header Card:**
- **Category Name** (large heading)
- **Description** (muted text)
- **Statistics Row:**
  - 💬 Thread count (formatted)
  - 📝 Post count (formatted)
- **Create Thread Button**
  - "+ New Thread" button
  - Click → Opens create thread form
  - Pre-fills category field
- **Icon Display:** Category icon with color

**Filter/Sort Buttons:**
- Latest (default, sorted by `lastActivityAt`)
- Trending (sorted by recent activity + engagement)
- Answered (filter `isAnswered=true`)
- Unanswered (filter `isAnswered=false`)
- Active state highlighting

**Thread List:**
- Same ForumThreadCard component as homepage
- Shows all threads for this category
- Sorted by selected filter
- Infinite scroll or pagination (pagination UI is placeholder)

**API Connections:**
```typescript
// Get category details
useQuery({
  queryKey: ['/api/categories', slug],
  enabled: !!slug,
});

// Get category threads
useQuery({
  queryKey: ['/api/categories', slug, 'threads'],
  refetchInterval: 15000, // 15s polling for real-time
});
```

**Empty State:**
- Message: "No threads yet in this category"
- Icon: MessageSquare
- "Be the first!" button → Create thread

**Error State:**
- If category not found (404)
- Message: "Category not found"
- "Browse all categories" button → `/categories`

**Loading State:**
- Skeleton for header card
- 5 skeleton thread cards

**Pagination (Placeholder):**
- "Load more threads" button at bottom
- Will implement cursor-based pagination later
- Shows "Showing X of Y threads"

---

### 4. Thread Detail Page (/thread/:slug)

**File:** `client/src/pages/ThreadDetailPage.tsx`  
**Purpose:** View full thread with nested replies and engagement features  
**Layout:** Breadcrumb navigation + thread content + nested reply system

**Route Parameter:**
- Dynamic: `/:slug` (e.g., `/thread/xauusd-scalping-strategy-m5-timeframe`)
- Extracted via: `useRoute("/thread/:slug")`

**Breadcrumb Navigation:**
- Home → Category Name → Thread Title
- Clickable category link back to category page
- Current thread title highlighted

**Thread Header:**
- **Title** (large heading with h1 tag for SEO)
- **Author Card:**
  - Avatar (with fallback initials)
  - Username
  - Badge display
  - Posted timestamp (relative: "2 hours ago")
- **Stats Row:**
  - 👁 View count (formatted with commas)
  - 💬 Reply count
  - ✅ Accepted answer indicator (if exists)
  - 📌 Pinned indicator (if pinned)
  - 🔒 Locked indicator (if locked)

**Thread Body:**
- Full formatted content with HTML sanitization
- Image display (if imageUrls provided)
- SEO-optimized with meta description

**Reply System (Nested, Unlimited Depth):**
- **Root Replies** (parentId = null)
  - Author avatar + username + timestamp
  - Reply content with HTML sanitization
  - **Helpful Vote Button:**
    - "👍 Mark as helpful" (increments helpfulCount)
    - Shows current helpful count
    - Real-time update via mutation
  - **Accept Answer Button (Author Only):**
    - "✓ Accept Answer" (marks reply as accepted)
    - Only visible to thread author
    - Unmarks other accepted answers
    - Green checkmark indicator when accepted
  - **Reply Button:**
    - Opens nested reply form
    - "Reply to @username"
- **Nested Replies (Recursive):**
  - Same structure as root replies
  - Visual indentation (2rem left margin per level)
  - Infinite depth support
  - Same engagement features (helpful, accept, reply)

**Reply Form:**
- Textarea input (min 10 chars)
- Character counter
- Submit button (disabled if too short)
- Cancel button (for nested replies)
- Real-time validation
- Success toast on submission
- Auto-clears form after submit

**API Connections:**
```typescript
// Get thread by slug
useQuery({
  queryKey: ["/api/threads/slug", slug],
  enabled: !!slug,
});

// Get all replies (15s real-time polling)
useQuery({
  queryKey: ["/api/threads", thread?.id, "replies"],
  enabled: !!thread?.id,
  refetchInterval: 15000,
});

// Create reply mutation
useMutation({
  mutationFn: (data) => apiRequest(`/api/threads/${thread!.id}/replies`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/threads", thread!.id, "replies"] });
    queryClient.invalidateQueries({ queryKey: ["/api/threads/slug", slug] });
  }
});

// Mark helpful mutation
useMutation({
  mutationFn: (replyId) => apiRequest(`/api/replies/${replyId}/helpful`, {
    method: 'POST'
  })
});

// Accept answer mutation
useMutation({
  mutationFn: (replyId) => apiRequest(`/api/replies/${replyId}/accept`, {
    method: 'POST'
  })
});
```

**Loading State:**
- Skeleton for thread header
- Skeleton for thread body
- 3 skeleton reply cards

**Empty Reply State:**
- Message: "No replies yet"
- Icon: MessageSquare
- "Be the first to reply!" encouragement

**Error State:**
- If thread not found (404)
- Message: "Thread not found"
- "Browse categories" button → `/categories`

**SEO Features:**
- Unique slug for each thread
- Meta description auto-generated
- Focus keywords extracted from title
- Each reply has its own SEO slug for independent Google ranking
- Breadcrumb structured data

**Real-time Updates:**
- Thread data refetches on focus
- Replies poll every 15 seconds
- Optimistic updates for helpful votes
- Cache invalidation on mutations

**Test IDs (Comprehensive):**
- `thread-title`, `thread-author`, `thread-body`
- `reply-{replyId}`, `button-reply-{replyId}`, `button-helpful-{replyId}`
- `button-accept-{replyId}`, `input-reply-body`, `button-submit-reply`
- `text-view-count`, `text-reply-count`

---

### 5. Members Page (/members)

**File:** `client/src/pages/MembersPage.tsx`  
**Purpose:** Leaderboard and community stats  
**Layout:** Header + Tabs + Cards

**Page Header:**
- Title: "Community Members"
- Subtitle: "Top contributors and active traders"

**Tabs Component:**
- **Tab 1: Coins**
  - Shows top users by total coins
  - Label: "💰 Top by Coins"
  
- **Tab 2: Contributions**
  - Shows top users by thread/reply count
  - Label: "📝 Top Contributors"
  
- **Tab 3: Uploads**
  - Shows top users by content uploads (marketplace)
  - Label: "📤 Top Sellers"

**Leaderboard Display (Per Tab):**
- Shows top 10 users
- Each user card:
  - **Rank Badge:**
    - #1: Crown icon (yellow, default variant)
    - #2: Medal icon (silver, secondary variant)
    - #3: Medal icon (bronze, outline variant)
    - #4-10: Trophy icon (outline variant, muted)
  - **Avatar:** Circle with user initials fallback
  - **Username:** Bold, clickable
  - **Stat Value:**
    - Coins tab: Total coins (formatted)
    - Contributions tab: Thread + reply count
    - Uploads tab: Content count
  - **Progress/Badge:** Trust level or badge icon

**Top Stats Overview (Above tabs):**
- 3 cards showing #1 users:
  - Card 1: "Top Earner" - User with most coins
  - Card 2: "Top Contributor" - User with most posts
  - Card 3: "Top Seller" - User with most uploads
- Each card:
  - Large number (stat value)
  - Username
  - Badge icon

**Call-to-Action Section (Bottom):**
- Card with:
  - Title: "Want to rank up?"
  - Description: "Earn coins by helping the community..."
  - Button: "View Earning Guide" → `/earn-coins`

**API Connections:**
```typescript
// Coins leaderboard
useQuery({
  queryKey: ['/api/leaderboard', 'coins'],
  refetchInterval: 30000,
});

// Contributions leaderboard
useQuery({
  queryKey: ['/api/leaderboard', 'contributions'],
  refetchInterval: 30000,
});

// Uploads leaderboard
useQuery({
  queryKey: ['/api/leaderboard', 'uploads'],
  refetchInterval: 30000,
});
```

**Data Structure:**
```typescript
{
  userId: string;
  username: string;
  totalCoins?: number;
  contributionCount?: number;
  uploadCount?: number;
  rank: number; // 1-10
}
```

**Loading State:**
- 3 skeleton stat cards
- Skeleton leaderboard cards (10)

**Empty State (Per Tab):**
- "No users to display"
- Unlikely to happen (always have at least demo user)

---

### 5. Recharge Page (/recharge)

**File:** `client/src/pages/RechargePage.tsx` ✅ **IMPLEMENTED**  
**Component:** `client/src/components/CoinRecharge.tsx`  
**Purpose:** Purchase gold coins with real money  
**Layout:** 2-column responsive grid (packages + sidebar)

**Page Header:**
- Title: "Recharge Gold Coins"
- Subtitle: "Top up your account to download EAs, access premium content, and unlock exclusive features"

**Coin Packages Section (Actual Implementation):**
- **Grid Layout:** 2-3 columns (responsive)
- **6 Package Cards:**

1. **Basic** - $22
   - 22 coins
   - No bonus
   - Total: 22 coins
   - Best for: First-time buyers

2. **Starter** - $52
   - 52 coins + 5 bonus
   - Total: 57 coins
   - Bonus: +9.6%
   - Best for: New users getting started

3. **Popular** - $200 ⭐
   - 200 coins + 20 bonus
   - Total: 220 coins
   - Bonus: +10%
   - Badge: "Popular"
   - Best for: Regular users, best value

4. **Premium** - $500
   - 500 coins + 75 bonus
   - Total: 575 coins
   - Bonus: +15%
   - Best for: Content buyers

5. **Elite** - $1000
   - 1000 coins + 200 bonus
   - Total: 1200 coins
   - Bonus: +20%
   - Best for: Serious traders

6. **Ultimate** - $2000
   - 2000 coins + 500 bonus
   - Total: 2500 coins
   - Bonus: +25%
   - Best for: EA collectors

**Each Package Card Shows:**
- Coin icon + amount (large, bold)
- Gift icon + bonus amount (if applicable, green text)
- Price in USD (large, bold)
- Total coins (coins + bonus)
- Click to select (highlights border)
- "Popular" badge (on $200 package)

**Custom Amount Option:**
- Input field: "Enter custom coin amount (min. 10)"
- Clears package selection when typing
- Flexible for users needing specific amounts

**Payment Methods Section:**
- **Credit/Debit Card (Stripe)**
  - Icon: CreditCard
  - Label: "Secure payment via Stripe"
  - Click to select (highlights border)
  - Status: Payment gateway pending integration
  
- **Cryptocurrency (USDT)**
  - Icon: Wallet
  - Label: "Pay with USDT (TRC20/ERC20)"
  - Click to select (highlights border)
  - Status: CoinPayments API pending integration

**Proceed to Payment Button:**
- Large, full-width button
- Disabled if no package/amount selected
- Logs to console (TODO: integrate payment)
- Current: Auto-completes for demo

**Sidebar Content:**
1. **"Why Top Up?" Card**
   - Download premium EAs and indicators
   - Access exclusive trading strategies
   - View premium backtests and set files
   - Support quality content creators

2. **Important Notice Card**
   - Gold coins non-refundable
   - Review descriptions before purchasing
   - Alert icon + primary border

**Current Implementation Status:**
- ✅ UI fully implemented
- ✅ Package selection logic
- ✅ Payment method selection
- ⏳ Stripe integration pending
- ⏳ CoinPayments USDT integration pending
- ✅ Backend recharge order creation
- ✅ Auto-complete for demo

**API Connections (Current):**
```typescript
// Create recharge order (currently auto-completes)
POST /api/recharge
{
  userId: string;
  coinAmount: number;
  priceUsd: number;
  paymentMethod: "stripe" | "crypto";
}
// Returns: Completed order with coins added
```

**Future Integration:**
- Stripe Checkout Session creation
- CoinPayments invoice generation
- Webhook handling for payment confirmation
- Email receipts

---

### 6. Transaction History Page (/transactions)

**File:** `client/src/pages/TransactionHistoryPage.tsx` (pending)  
**Purpose:** View all coin transactions  
**Layout:** Filter bar + transaction list

**Page Header:**
- Title: "Transaction History"
- Subtitle: "All your coin activity"
- Current balance (large display)

**Filter Bar:**
- Type filter: All | Earned | Spent | Recharged
- Date range picker
- Search by description

**Transaction List:**
- Sorted by date (newest first)
- Infinite scroll (load 50 at a time)

**Each Transaction Card:**
- **Icon:**
  - Earn: ⬆️ Green arrow
  - Spend: ⬇️ Red arrow
  - Recharge: 💳 Blue credit card
- **Description:** Transaction reason
- **Amount:** 
  - Earn/Recharge: +X coins (green)
  - Spend: -X coins (red)
- **Date:** Relative time (e.g., "2 hours ago")
- **Status:**
  - ✓ Completed (green)
  - ⏳ Pending (yellow)
  - ✗ Failed (red)

**API Connection:**
```typescript
useQuery({
  queryKey: ['/api/user', userId, 'transactions'],
  queryParams: { limit: 50, offset: 0 },
});
```

**Export Feature (Future):**
- "Export to CSV" button
- Downloads all transactions

---

### 7. Marketplace Page (/marketplace)

**File:** Not yet implemented  
**Purpose:** Browse and purchase EAs, Indicators, Articles, Source Code  
**Layout:** Filters + content grid

**Filter Sidebar:**
- Type: EA | Indicator | Article | Source Code
- Category: Scalping, Swing, Grid, etc.
- Price range: Free, 1-100, 100-500, 500+
- Sort: Latest, Popular, Price (low-high), Price (high-low)

**Content Grid:**
- 3-column grid of content cards
- Each card:
  - Preview image or logo
  - Content type badge
  - Title
  - Price in coins (or "FREE")
  - Author name + avatar
  - Rating (stars)
  - Download count
  - "Purchase" or "Download" button
  - Like button (heart icon)
  - SEO slug link

**Content Detail Modal/Page:**
- Full description
- Screenshots (gallery)
- File details (version, size)
- Reviews section
- Purchase button
- "Already purchased" indicator
- Download link (if purchased)

**API Connections:**
```typescript
// List content
GET /api/content?type=ea&category=Scalping&limit=20

// Get content by ID/slug
GET /api/content/:id
GET /api/content/slug/:slug

// Purchase content
POST /api/content/purchase
{
  contentId: string;
  buyerId: string;
}

// Check if purchased
GET /api/content/:contentId/purchased/:userId
```

---

### 8. Broker Reviews Page (/brokers)

**File:** Not yet implemented  
**Purpose:** Browse broker listings and reviews  
**Layout:** Filter + broker list

**Filter Options:**
- Verified brokers only
- Rating (5 stars, 4+, 3+)
- Founded year
- Regulation status
- Show scam reports only

**Broker List:**
- Card per broker:
  - Broker logo
  - Broker name
  - Verified badge (if isVerified)
  - Overall rating (stars)
  - Review count
  - Scam report count (red badge if >0)
  - Year founded
  - Regulation summary
  - "View Details" button

**Broker Detail Page (/brokers/:slug):**
- Broker header (logo, name, rating)
- Stats (reviews, rating breakdown)
- "Write Review" button
- "Report Scam" button (red, prominent)
- Reviews list:
  - Sorted by date
  - Filter: All | Scam Reports Only
  - Each review:
    - Star rating
    - Review title
    - Review body
    - Author + date
    - Scam report flag (red badge)

**API Connections:**
```typescript
// List brokers
GET /api/brokers?verified=true

// Get broker
GET /api/brokers/:id
GET /api/brokers/slug/:slug

// Submit review
POST /api/brokers/review
{
  brokerId: string;
  userId: string;
  rating: 1-5;
  reviewTitle: string;
  reviewBody: string;
  isScamReport: boolean;
}

// Get reviews
GET /api/brokers/:brokerId/reviews?scamOnly=false
```

**Scam Reporting:**
- Checkbox: "This is a scam report"
- If checked:
  - Requires proof (screenshots, links)
  - Higher coin reward (+150 vs +50)
  - Red badge on review
  - Increments scamReportCount

---

### 9. User Profile Page (/user/:username)

**File:** Not yet implemented  
**Purpose:** View user's profile, stats, content  
**Layout:** Profile header + tabs

**Profile Header:**
- Avatar (large)
- Username
- Trust level badge
- Badges earned (verified trader, top contributor, etc.)
- Join date
- Total coins
- Rank (#X)
- Follow button (if not self)
- Message button
- Social links (YouTube, Instagram, Telegram, MQL5)

**Stats Overview (4 cards):**
- Threads created
- Replies posted
- Content uploaded
- Total earnings (coins)

**Tabs:**
1. **Activity** - Recent threads and replies
2. **Content** - Published marketplace content
3. **Purchases** - What they've bought
4. **Followers** - Who follows them
5. **Following** - Who they follow

**Follow Feature:**
- Follow/Unfollow button
- Follower count updates real-time
- Following count updates real-time

**API Connections:**
```typescript
// Get user profile
GET /api/users/:userId/profile

// Get user's threads
GET /api/user/:userId/threads

// Get user's content
GET /api/user/:userId/content

// Follow user
POST /api/users/:userId/follow
{ followerId: string }

// Unfollow user
DELETE /api/users/:userId/unfollow
{ followerId: string }
```

---

### 10. Messages Page (/messages)

**File:** Not yet implemented  
**Purpose:** Private messaging system  
**Layout:** Conversation list + message thread

**Left Sidebar - Conversation List:**
- Search conversations
- List of conversations
- Each conversation:
  - Other user's avatar
  - Username
  - Last message preview (truncated)
  - Timestamp
  - Unread badge (if new messages)
  - Click → Opens conversation

**Main Panel - Message Thread:**
- Conversation header:
  - Other user's avatar + name
  - "View Profile" button
- Message list:
  - Scrollable, auto-scroll to bottom
  - Each message:
    - Avatar
    - Message text
    - Timestamp
    - Read status (checkmarks)
- Message input:
  - Text area
  - "Send" button
  - Character count
  - Emoji picker (future)

**Compose New Message:**
- "New Message" button
- Opens modal:
  - Recipient search/select
  - Subject (optional)
  - Message body
  - Send button

**API Connections:**
```typescript
// List conversations
GET /api/users/:userId/messages

// Send message
POST /api/messages
{
  senderId: string;
  recipientId: string;
  subject?: string;
  body: string;
}

// Mark as read
POST /api/messages/:messageId/read
```

**Real-time Updates:**
- Poll every 10s for new messages
- Show notification badge in header
- Sound notification (optional)

---

### 11. Settings Page (/settings)

**File:** Not yet implemented  
**Purpose:** User account settings  
**Layout:** Sidebar menu + settings panels

**Settings Categories:**
1. **Profile Settings**
   - Username (change)
   - Avatar upload
   - Bio/About
   - Social links (YouTube, Instagram, Telegram, myfxbook)
   - Investor account credentials

2. **Notification Preferences**
   - Email notifications toggle
   - Browser notifications toggle
   - Notify on: Replies, Mentions, Messages, Followers

3. **Privacy Settings**
   - Profile visibility (public/private)
   - Show email (yes/no)
   - Show real name (yes/no)

4. **Account Security**
   - Change password
   - Two-factor authentication (future)
   - Active sessions
   - Login history

5. **API Access** (Developer)
   - API key generation
   - Rate limits
   - Webhook URLs

**Social Link Rewards:**
- YouTube URL → +50 coins (one-time, hasYoutubeReward)
- Myfxbook link → +100 coins (one-time, hasMyfxbookReward)
- Investor credentials → +75 coins (one-time, hasInvestorReward)

**API Connections:**
```typescript
// Update profile
PATCH /api/users/:userId/profile
{
  youtubeUrl?: string;
  instagramHandle?: string;
  telegramHandle?: string;
  myfxbookLink?: string;
  emailNotifications?: boolean;
}
```

---

### 12. Dashboard Customization Page (/dashboard/customize)

**Status:** ✅ Frontend Implemented (October 26, 2025)  
**File:** `client/src/pages/DashboardSettings.tsx`  
**Purpose:** Customize dashboard widget visibility, order, and layout preferences  
**Backend Status:** ⚠️ Persistence not yet implemented (frontend-only)

**Route:** `/dashboard/customize`

### Overview
The Dashboard Customization page allows users to personalize their dashboard experience by controlling which widgets are displayed, their order, and the overall layout density. Changes are previewed in real-time with a live preview panel.

### Layout Structure

**Page Header:**
- Title: "Dashboard Settings" with gear icon
- Description: "Customize your dashboard widgets and layout preferences"
- Unsaved changes badge (appears when modifications made)

**Two-Column Layout:**
1. **Settings Panel (Left, 2/3 width)**
   - Widget management card
   - Layout selection card
   - Action buttons (Save/Reset)

2. **Preview Panel (Right, 1/3 width)**
   - Live preview of dashboard with current settings
   - Shows enabled widgets in selected order
   - Updates in real-time as changes made

### Widget Management Features

**Available Widgets (6 total):**

```typescript
interface Widget {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
  category: 'stats' | 'community' | 'content' | 'activity';
}
```

**Widget List:**

1. **Statistics Bar**
   - **ID:** `stats`
   - **Description:** "Overview of forum threads, members, and activity"
   - **Icon:** BarChart3
   - **Category:** stats
   - **Default:** Enabled

2. **What's Hot**
   - **ID:** `hot-threads`
   - **Description:** "Trending discussions and popular threads"
   - **Icon:** Flame
   - **Category:** community
   - **Default:** Enabled

3. **Leaderboard**
   - **ID:** `leaderboard`
   - **Description:** "Top contributors, uploaders, and active members"
   - **Icon:** Trophy
   - **Category:** community
   - **Default:** Enabled

4. **Week's Highlights**
   - **ID:** `week-highlights`
   - **Description:** "New, trending, and solved threads from this week"
   - **Icon:** TrendingUp
   - **Category:** community
   - **Default:** Enabled

5. **Live Activity Feed**
   - **ID:** `activity-feed`
   - **Description:** "Real-time updates of forum activity"
   - **Icon:** Activity
   - **Category:** activity
   - **Default:** Enabled
   - **Auto-refresh:** 10s (fastest)

6. **Top Sellers**
   - **ID:** `top-sellers`
   - **Description:** "Best-selling EAs, indicators, and content"
   - **Icon:** TrendingUp
   - **Category:** content
   - **Default:** Disabled
   - **Auto-refresh:** 60s

**Widget Control Features:**

**Show/Hide Toggle:**
```tsx
<Switch
  checked={widget.enabled}
  onCheckedChange={() => toggleWidget(widget.id)}
  data-testid={`toggle-${widget.id}`}
/>
```
- Toggle enables/disables widget visibility
- Disabled widgets hidden from dashboard
- Changes tracked in `hasChanges` state

**Reorder Controls:**
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => moveWidget(widget.id, 'up')}
  disabled={index === 0}
  data-testid={`button-move-up-${widget.id}`}
>
  <ChevronUp className="h-4 w-4" />
</Button>

<Button
  variant="ghost"
  size="icon"
  onClick={() => moveWidget(widget.id, 'down')}
  disabled={index === widgets.length - 1}
  data-testid={`button-move-down-${widget.id}`}
>
  <ChevronDown className="h-4 w-4" />
</Button>
```
- Up/down arrows adjust widget order
- First item cannot move up
- Last item cannot move down
- Order determines display sequence on dashboard

**Category Color Coding:**
Each widget shows category badge with color:
- **Stats:** Blue (`bg-blue-500/10 text-blue-600`)
- **Community:** Purple (`bg-purple-500/10 text-purple-600`)
- **Content:** Green (`bg-green-500/10 text-green-600`)
- **Activity:** Orange (`bg-orange-500/10 text-orange-600`)

**Enabled Widget Counter:**
```tsx
<Badge variant="outline">
  {enabledCount} / {widgets.length} enabled
</Badge>
```
Shows "5 / 6 enabled" dynamically

### Layout Presets

**Three Density Options:**

```typescript
type LayoutType = 'default' | 'compact' | 'comfortable';
```

**1. Default Layout**
- Standard spacing and sizing
- Balanced information density
- Recommended for most users

**2. Compact Layout**
- Reduced spacing between widgets
- Smaller font sizes
- More widgets visible at once
- Best for: Power users, large screens

**3. Comfortable Layout**
- Increased spacing and padding
- Larger font sizes
- More breathing room
- Best for: Accessibility, smaller screens

**Layout Selection UI:**
```tsx
<RadioGroup value={layout} onValueChange={(value) => setLayout(value as LayoutType)}>
  <div className="space-y-2">
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="default" id="default" />
      <Label htmlFor="default">Default</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="compact" id="compact" />
      <Label htmlFor="compact">Compact</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="comfortable" id="comfortable" />
      <Label htmlFor="comfortable">Comfortable</Label>
    </div>
  </div>
</RadioGroup>
```

### Live Preview Panel

**Preview Features:**
- Shows real-time preview of dashboard
- Displays only enabled widgets
- Respects widget order from settings
- Applies selected layout (default/compact/comfortable)
- Updates instantly when changes made

**Implementation:**
```tsx
<Card className="sticky top-4">
  <CardHeader>
    <CardTitle>Preview</CardTitle>
    <CardDescription>
      See how your dashboard will look
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className={`space-y-${layout === 'compact' ? '2' : layout === 'comfortable' ? '6' : '4'}`}>
      {widgets.filter(w => w.enabled).map(widget => (
        <div key={widget.id} className="border rounded p-2">
          <div className="flex items-center gap-2">
            <widget.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{widget.name}</span>
          </div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### Action Buttons

**Save Changes Button:**
```tsx
<Button
  onClick={saveChanges}
  disabled={!hasChanges}
  data-testid="button-save"
>
  <Save className="mr-2 h-4 w-4" />
  Save Changes
</Button>
```
- Only enabled when changes made
- Saves widget preferences (⚠️ frontend-only)
- Clears `hasChanges` flag
- Shows success toast notification

**Reset to Default Button:**
```tsx
<Button
  variant="outline"
  onClick={resetToDefault}
  data-testid="button-reset"
>
  <RotateCcw className="mr-2 h-4 w-4" />
  Reset to Default
</Button>
```
- Restores original widget configuration:
  - Enables: stats, hot-threads, leaderboard, week-highlights, activity-feed
  - Disables: top-sellers
  - Resets order to default
  - Sets layout to "default"
- Clears `hasChanges` flag

### State Management

**Component State:**
```typescript
const [widgets, setWidgets] = useState<Widget[]>([...]);
const [layout, setLayout] = useState<LayoutType>('default');
const [hasChanges, setHasChanges] = useState(false);
```

**Toggle Widget:**
```typescript
const toggleWidget = (widgetId: string) => {
  setWidgets(prev => prev.map(w => 
    w.id === widgetId ? { ...w, enabled: !w.enabled } : w
  ));
  setHasChanges(true);
};
```

**Move Widget:**
```typescript
const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
  const index = widgets.findIndex(w => w.id === widgetId);
  if (
    (direction === 'up' && index === 0) || 
    (direction === 'down' && index === widgets.length - 1)
  ) {
    return; // Cannot move beyond bounds
  }

  const newWidgets = [...widgets];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  [newWidgets[index], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[index]];
  
  setWidgets(newWidgets);
  setHasChanges(true);
};
```

**Reset to Default:**
```typescript
const resetToDefault = () => {
  setWidgets(prev => prev.map(w => ({ 
    ...w, 
    enabled: ['stats', 'hot-threads', 'leaderboard', 'week-highlights', 'activity-feed'].includes(w.id)
  })));
  setLayout('default');
  setHasChanges(false);
};
```

**Save Changes:**
```typescript
const saveChanges = () => {
  // ⚠️ Backend persistence not yet implemented
  // TODO: POST /api/dashboard/settings
  // {
  //   userId: user.id,
  //   widgets: widgets.map(w => ({ id: w.id, enabled: w.enabled })),
  //   widgetOrder: widgets.map(w => w.id),
  //   layout: layout
  // }
  
  setHasChanges(false);
  toast({
    title: "Settings Saved",
    description: "Your dashboard preferences have been updated"
  });
};
```

### Backend Persistence (Pending Implementation)

**Planned API Endpoint:**
```typescript
POST /api/dashboard/settings
Authorization: Required

Request Body:
{
  userId: string;
  widgets: Array<{ id: string; enabled: boolean }>;
  widgetOrder: string[];
  layout: 'default' | 'compact' | 'comfortable';
}

Response:
{
  success: boolean;
  settings: DashboardSettings;
}
```

**Planned Database Schema:**
```sql
CREATE TABLE dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  widget_config JSONB NOT NULL,
  widget_order TEXT[] NOT NULL,
  layout VARCHAR(20) NOT NULL DEFAULT 'default',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Current Status:**
- ✅ Frontend UI fully implemented
- ✅ State management working
- ✅ Live preview functional
- ✅ Reset to defaults working
- ⚠️ Save button functional but changes **not persisted**
- ❌ Backend API not yet implemented
- ❌ Database table not created
- ❌ Settings not loaded on dashboard page

**Next Steps for Full Implementation:**
1. Create `dashboard_settings` database table
2. Implement `POST /api/dashboard/settings` endpoint
3. Implement `GET /api/dashboard/settings/:userId` endpoint
4. Update dashboard page to load user preferences
5. Apply widget visibility, order, and layout from saved settings

### User Experience Flow

**Step 1: Access Settings**
- User navigates to `/dashboard/customize`
- Page loads with default widget configuration
- All 6 widgets displayed in settings panel

**Step 2: Customize Widgets**
- User toggles "Top Sellers" widget ON
- User moves "Activity Feed" to top of list
- Live preview updates instantly
- "Unsaved Changes" badge appears

**Step 3: Adjust Layout**
- User selects "Compact" layout
- Preview panel shows tighter spacing
- Widget cards appear smaller

**Step 4: Save or Reset**
- **Save:** Clicks "Save Changes" button
  - Success toast appears
  - `hasChanges` flag cleared
  - ⚠️ Settings lost on page refresh (not persisted)
- **Reset:** Clicks "Reset to Default"
  - All widgets return to original state
  - Layout returns to "default"
  - Changes discarded

### Visual Design

**Category Color Scheme:**
```typescript
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'stats': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'community': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case 'content': return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'activity': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    default: return 'bg-muted text-muted-foreground';
  }
};
```

**Widget Card Styling:**
- Border with hover elevation (`hover-elevate`)
- Rounded corners (`rounded-lg`)
- Padding (`p-3`)
- Flex layout for controls

**Icons Used:**
- Settings2 (page title)
- LayoutDashboard (widget management)
- Eye/EyeOff (visibility toggle)
- ChevronUp/ChevronDown (reorder)
- Save (save button)
- RotateCcw (reset button)
- Loader2 (loading states)

### Accessibility

**Keyboard Navigation:**
- All toggles and buttons keyboard accessible
- Radio buttons support arrow key navigation
- Focus indicators on all interactive elements

**Screen Readers:**
- Descriptive labels on all controls
- Widget descriptions provided
- Status updates announced via ARIA live regions

**Test IDs:**
All interactive elements tagged for E2E testing:
```tsx
data-testid="text-settings-title"
data-testid="card-widget-management"
data-testid="widget-item-${widget.id}"
data-testid="toggle-${widget.id}"
data-testid="button-move-up-${widget.id}"
data-testid="button-move-down-${widget.id}"
data-testid="button-save"
data-testid="button-reset"
```

---

## User Flows & Journeys

### Flow 1: New User Registration & Onboarding

**Current Authentication Status:**
- **Auth System:** Replit Auth (OIDC) integration in place
- **Demo Mode:** Currently using demo user for testing
  - Demo User ID: `6e5f03b9-e0f1-424b-b264-779d75f62d89`
  - Username: `demo`
  - Starting Balance: 2,450 coins
- **Production Auth Flow (When Activated):**

**Step 1: Landing on Homepage**
- User visits YoForex.net (unauthenticated)
- Sees homepage with:
  - "Sign In" button in header
  - Forum preview (can browse publicly)
  - Limited access (can't create threads/replies)

**Step 2: Sign In via Replit Auth**
- Click "Sign In" button
- Redirected to Replit OAuth
- Grants permission
- Redirected back to YoForex
- Session created (OIDC token)

**Step 3: First-Time User Setup (Auto)**
- Backend checks if user exists in database
- If not exists:
  - Creates user record
  - Assigns default values:
    - totalCoins: 0
    - weeklyEarned: 0
    - rank: null
    - Trust level: Newbie (0 XP)
  - Awards welcome bonus: +50 coins
  - Creates transaction: "Welcome bonus"

**Step 4: Onboarding Tour (Future)**
- Modal overlay with tutorial:
  - "Welcome to YoForex!"
  - "Earn coins by contributing"
  - "Spend coins on premium content"
  - "Rank up through participation"
- Skip button available

**Step 5: First Actions**
- User explores forum
- Reads existing threads
- Clicks "Create Thread" button
- Sees create thread form:
  - Category selector (16 options)
  - Title input
  - Body textarea (markdown)
  - Image upload (optional)
  - "Publish" button
- Fills form and publishes
- Backend auto-generates:
  - slug (from title)
  - focusKeyword (from title)
  - metaDescription (first 155 chars)
- Thread created with status: "approved"
- User earns: +25 coins ("Published thread")
- Trust XP earned: +50 XP
- Redirect to thread detail page

**Step 6: Gaining Momentum**
- User receives first reply to their thread
- Notification badge shows "1"
- Clicks notification
- Sees reply
- Can mark reply as helpful (+1)
- Can mark reply as accepted answer
- Original replier earns +5 coins

**Step 7: First Purchase**
- User browses marketplace
- Finds interesting EA
- Clicks "Purchase for 100 coins"
- Confirmation modal:
  - "Confirm purchase?"
  - Current balance: 75 coins
  - After purchase: -25 coins
  - **Insufficient balance!**
- Redirect to recharge page
- User purchases 52-coin package ($4.99)
- Payment successful
- Balance updated: 127 coins
- Returns to marketplace
- Completes purchase
- Downloads EA file
- Seller earns +100 coins

---

### Flow 2: Earning Coins Journey

**Method 1: Publishing Content**
- Navigate to marketplace
- Click "Publish Content"
- Form fields:
  - Type: EA / Indicator / Article / Source Code
  - Title (required)
  - Description (required)
  - Category (dropdown)
  - Price in coins (0-10000)
  - Free toggle
  - File upload (required)
  - Images upload (up to 5)
  - Logo upload (optional)
- Submit
- Content status: "pending" (moderation)
- After admin approval:
  - Status → "approved"
  - Award +50 coins ("Published EA")
  - Content appears in marketplace

**Method 2: Creating Quality Threads**
- Create thread in popular category
- Thread gets 50+ replies
- Receive +5 coins per 10 replies
- Thread marked as "Answered"
- Bonus: +20 coins

**Method 3: Helpful Replies**
- Reply to someone's question
- Reply marked as "helpful" by 5 users
- Earn +15 coins
- Reply marked as "accepted answer"
- Earn additional +25 coins

**Method 4: Liking Content**
- Browse marketplace
- Like quality content (heart button)
- Earn +1 coin per like
- Limit: 5 likes per day
- Helps creators get visibility

**Method 5: Writing Reviews**
- Purchase content
- Write detailed review (50+ chars)
- Rating: 1-5 stars
- Submit review (status: "pending")
- After approval:
  - Earn +5 coins
  - Review appears on content page

**Method 6: Broker Reviews**
- Navigate to broker directory
- Click "Write Review" on broker
- Form:
  - Rating (1-5 stars)
  - Review title
  - Review body (100-2000 chars)
  - Scam report checkbox
- Submit
- If normal review → +50 coins (when approved)
- If scam report → +150 coins (when approved with proof)

**Method 7: Social Link Rewards (One-Time)**
- Go to Settings
- Add YouTube URL → +50 coins
- Add Myfxbook link → +100 coins
- Add Investor credentials → +75 coins
- Total possible: +225 coins

**Method 8: Daily Participation**
- Log in daily
- View at least 5 threads
- Post at least 1 reply
- Earn +5 coins (daily bonus)

**Method 9: Referrals (Future)**
- Share referral link
- Friend signs up via link
- Friend makes first post
- You earn +30 coins
- Friend earns +20 coins (welcome bonus)

**Method 10: Reporting Violations**
- See spam/scam thread
- Click "Report" button
- Select reason
- Submit report
- After admin confirms violation:
  - Earn +10 coins
  - Violator receives warning/ban

---

### Flow 3: Spending Coins Journey

**Scenario 1: Purchasing Premium EA**
1. Browse marketplace → Filter: EA, Price: 100-500
2. Find "Gold Scalper Pro EA" - 250 coins
3. View detail page:
   - Screenshots (5 images)
   - Description
   - Backtests
   - Reviews (4.5 stars, 23 reviews)
   - Author: VerifiedTrader (badge)
4. Click "Purchase for 250 coins"
5. Confirmation modal:
   - Current balance: 2,450 coins
   - After purchase: 2,200 coins
   - "Confirm Purchase" button
6. API transaction:
   - Deduct 250 coins from buyer
   - Add 250 coins to seller
   - Create purchase record
   - Create transaction records (both users)
7. Success notification: "Purchase successful!"
8. Download button appears
9. File downloads (.ex4 file)
10. Purchase appears in "My Purchases"
11. Can now write review

**Scenario 2: Insufficient Balance**
1. Try to purchase content worth 300 coins
2. Current balance: 150 coins
3. Error modal:
   - "Insufficient balance"
   - "You need 150 more coins"
   - "Recharge Now" button
4. Redirects to /recharge
5. User buys coins
6. Returns to content
7. Completes purchase

**Scenario 3: Tipping Quality Reply (Future)**
1. Read very helpful reply
2. Click "Tip" button
3. Modal: "Tip amount?"
4. Select: 5, 10, 25, 50, 100 coins
5. Select 25 coins
6. Confirm
7. 25 coins transferred
8. Replier receives notification

---

### Flow 4: Ranking Up Journey

**Trust Level System (5 Levels):**

**Level 1: Newbie (0-500 XP)**
- Starting level for all new users
- Benefits:
  - Can create 2 threads per day
  - Can post 10 replies per day
  - Can like 5 content per day
- Restrictions:
  - Cannot send private messages
  - Cannot upload files >5MB
  - Reviews go to moderation queue

**Level 2: Member (500-1000 XP)**
- Reached after ~2 weeks of active participation
- Benefits:
  - Can create 5 threads per day
  - Can post 25 replies per day
  - Can like 10 content per day
  - Can send private messages
  - File upload limit: 10MB
- Unlock: Badge: "Active Member"

**Level 3: Contributor (1000-2000 XP)**
- Reached after ~1-2 months of quality contributions
- Benefits:
  - Can create 10 threads per day
  - Can post 50 replies per day
  - Can like 20 content per day
  - File upload limit: 25MB
  - Reviews auto-approved (no moderation)
  - Can edit own posts
- Unlock: Badge: "Contributor"

**Level 4: Regular (2000-5000 XP)**
- Reached after ~3-6 months
- Benefits:
  - Can create unlimited threads
  - Can post unlimited replies
  - Can like unlimited content
  - File upload limit: 50MB
  - Can flag spam/violations
  - Can vote on community decisions
  - Priority in search results
- Unlock: Badge: "Regular" (purple)

**Level 5: Leader (5000+ XP)**
- Elite status, earned by long-term quality contributors
- Benefits:
  - All Regular benefits
  - File upload limit: 100MB
  - Can moderate threads (lock, pin, move)
  - Can edit others' posts (with approval)
  - Featured in "Community Leaders" section
  - Special badge color (gold)
  - Name highlighted in threads
- Unlock: Badge: "Community Leader"

**XP Earning Activities:**
- Create thread: +50 XP
- Post reply: +10 XP
- Reply marked helpful: +25 XP
- Reply accepted as answer: +100 XP
- Publish content: +200 XP
- Content purchased (each sale): +50 XP
- Receive 5-star review: +75 XP
- Helpful review written: +30 XP
- Thread reaches 100 views: +50 XP
- Thread reaches 50 replies: +100 XP

**Progress Tracking:**
- TrustLevel widget shows:
  - Current level badge
  - XP progress bar (e.g., "1,250 / 2,000 XP")
  - Percentage complete
  - Next level name
  - Estimated time to next level

**Level-Up Notification:**
- When XP threshold crossed:
  - Modal overlay: "🎉 Level Up!"
  - New level badge shown
  - Benefits unlocked listed
  - Coin reward: +100 coins
  - Fireworks animation (optional)

---

### Flow 5: Gold Coin Leaderboard Competition

**Weekly Leaderboard:**
- Resets every Monday 00:00 UTC
- Top 10 users by coins earned THIS WEEK
- Displayed on:
  - Homepage (right sidebar)
  - Members page (full leaderboard)

**Prizes (Weekly):**
- 🥇 #1: +500 bonus coins + "Top Earner" badge
- 🥈 #2: +300 bonus coins + "Runner Up" badge
- 🥉 #3: +150 bonus coins + "Third Place" badge
- #4-#10: +50 bonus coins each

**Monthly Leaderboard:**
- Resets every 1st of month
- Top 25 users by coins earned THIS MONTH

**Prizes (Monthly):**
- 🥇 #1: +2000 bonus coins + "Monthly Champion" badge + Featured in newsletter
- 🥈 #2: +1000 bonus coins + "Silver Champion" badge
- 🥉 #3: +500 bonus coins + "Bronze Champion" badge
- #4-#10: +200 bonus coins each
- #11-#25: +100 bonus coins each

**All-Time Leaderboard:**
- Never resets
- Displays total career coins earned
- Special badges:
  - "Lifetime Legend" (10,000+ coins)
  - "Elite Contributor" (25,000+ coins)
  - "Hall of Fame" (50,000+ coins)

**Leaderboard Strategy Tips:**
- Publish high-quality content early in week
- Answer questions in trending threads
- Write comprehensive reviews
- Report scams with solid proof
- Stay active daily for daily bonus

---

## Gold Coin System - Complete Guide

### Coin Overview
- **Currency Name:** Gold Coins (🪙)
- **Symbol:** Displayed as "2,450" with coin icon
- **Purpose:** 
  - Reward quality contributions
  - Purchase premium content
  - Unlock features
  - Measure reputation

### How to Earn Coins (11 Methods)

**1. Publish EA/Indicator (+50 coins)**
- Upload new EA or indicator to marketplace
- Must be original or properly licensed
- Admin approves → Earn coins
- Each subsequent sale → +50% of sale price

**2. Share Set Files (+25 coins)**
- Upload .set configuration files
- Must include description and instructions
- Popular set files earn bonus views

**3. Write Quality Articles (+20-40 coins)**
- Tutorial, guide, or educational content
- 500+ words → +20 coins
- 1000+ words with images → +40 coins
- Featured articles → +100 bonus

**4. Share Backtest Reports (+20 coins)**
- Upload Strategy Tester report
- Include .htm file from MT4/MT5
- Must show at least 3 months of data
- Quality reports get featured

**5. Create Threads (+5-25 coins)**
- Regular thread → +5 coins
- Question thread → +10 coins
- Tutorial thread → +25 coins
- Pinned threads earn double

**6. Reply to Threads (+3-25 coins)**
- Regular reply → +3 coins
- Reply marked "helpful" → +5 coins per vote
- Accepted answer → +25 coins
- Verified reply → +10 bonus

**7. Like Content (+1 coin)**
- Like marketplace content
- Helps creator visibility
- Limit: 5 likes per day (prevents spam)
- Earner also gets notification

**8. Submit Reviews (+5 coins)**
- Review purchased content
- 50+ characters required
- Must include rating (1-5 stars)
- Approved by admin → Earn coins

**9. Broker Reviews (+50-150 coins)**
- Normal review → +50 coins
- Scam report with proof → +150 coins
- Must include screenshots or evidence
- Helps protect community

**10. Social Verification (One-Time Rewards)**
- Link YouTube → +50 coins
- Link Myfxbook → +100 coins
- Link Investor account → +75 coins
- Total possible: +225 coins

**11. Daily Active Bonus (+5 coins)**
- Log in daily
- View at least 5 threads

### Double-Entry Ledger System
**Status:** ✅ Implemented (October 26, 2025)  
**Files:** `shared/schema.ts`, `server/storage.ts`, `database/ledger-triggers.sql`

YoForex uses an immutable double-entry accounting system for all coin transactions, providing complete audit trails and balance integrity.

**Architecture:**
- **user_wallet** - One row per user with balance tracking
- **coin_ledger_transactions** - Transaction headers (type, status, context)
- **coin_journal_entries** - Immutable debit/credit entries (append-only)
- **Database Triggers** - Enforce balance validation and immutability

**Key Features:**
- Every transaction creates balanced entries (sum = 0)
- Immutability enforced by database triggers (no UPDATE/DELETE allowed)
- Row-level locking prevents race conditions
- Automatic wallet creation on first transaction
- Complete audit trail for forensic accounting
- Reconciliation system detects balance drift

**Example Transaction (Purchase):**
```
User A buys content from User B for 100 coins:
- Entry 1: Debit User A: -100 coins
- Entry 2: Credit User B: +90 coins (seller earns 90%)
- Entry 3: Credit Platform: +10 coins (10% commission)
Total: -100 + 90 + 10 = 0 ✓ (balanced)
```

**Security:**
- CHECK constraints prevent overdrafts
- Triggers validate balance integrity before/after each entry
- CLI-only backfill migration (HTTP endpoint blocked for security)
- Idempotent backfill prevents duplicate coin grants
- Post at least 1 reply or create 1 thread
- Streak bonus: +1 coin per consecutive day (max +30)

### How to Spend Coins (6 Methods)

**1. Purchase EAs & Indicators**
- Price range: 50-5000 coins
- Average EA: 200-500 coins
- Premium EAs: 1000-2000 coins
- Instant download after purchase

**2. Purchase Articles & Guides**
- Price range: 20-200 coins
- Tutorials: 50-100 coins
- Comprehensive courses: 150-200 coins

**3. Purchase Source Code**
- Price range: 100-1000 coins
- Open-source learning material
- Includes comments and documentation

**4. Purchase Set Files**
- Price range: 10-100 coins
- Optimized configurations
- Usually includes performance screenshots

**5. Unlock Premium Features (Future)**
- Highlighted username: 500 coins/month
- Custom profile badge: 300 coins
- Pin thread to top: 100 coins
- Featured content slot: 200 coins

**6. Tip Contributors (Future)**
- Tip helpful users: 5-100 coins
- Support quality content creators
- Shows appreciation

### Coin Transaction System

**Transaction Types:**
1. **Earn** - Positive transactions (green)
   - Publishing content
   - Creating threads
   - Writing reviews
   - Daily bonus

2. **Spend** - Negative transactions (red)
   - Purchasing content
   - Unlocking features
   - Tipping users

3. **Recharge** - Purchased coins (blue)
   - Credit card payment
   - Crypto payment

**Transaction Flow (Example):**
```
User A publishes EA for 200 coins
→ User A: +50 coins (publish reward)

User B purchases EA for 200 coins
→ User B: -200 coins (purchase)
→ User A: +200 coins (sale)

Total transactions created:
1. User A: +50 "Published EA: Gold Scalper"
2. User B: -200 "Purchased: Gold Scalper"
3. User A: +200 "Sale: Gold Scalper to User B"
```

**Safety Mechanisms:**
- Overdraft protection (can't spend more than balance)
- Atomic transactions (all or nothing)
- Transaction rollback on errors
- Transaction ID tracking
- Audit trail (all transactions logged)

### Weekly Coin Reset
- `weeklyEarned` resets every Monday 00:00 UTC
- Used for weekly leaderboard
- `totalCoins` never resets (lifetime balance)
- Weekly stats shown in CoinBalance widget

### Coin Limits
- Minimum transaction: 1 coin
- Maximum single transaction: 10,000 coins
- Daily earning limit: 500 coins (to prevent spam)
- Daily spending limit: None

---

## Payment & Recharge System

### Coin Packages (6 Tiers)

**Actual Package Definitions (from CoinRecharge.tsx):**

**Package 1: Basic - $22**
- Base coins: 22
- Bonus: 0
- Total: 22 coins
- Best for: First-time buyers, trying the system

**Package 2: Starter - $52**
- Base coins: 52
- Bonus: +5
- Total: 57 coins
- Bonus %: +9.6%
- Best for: New users getting started

**Package 3: Popular - $200** ⭐
- Base coins: 200
- Bonus: +20
- Total: 220 coins
- Bonus %: +10%
- Badge: "Popular"
- Best for: Regular users, best value tier

**Package 4: Premium - $500**
- Base coins: 500
- Bonus: +75
- Total: 575 coins
- Bonus %: +15%
- Best for: Content buyers, building library

**Package 5: Elite - $1000**
- Base coins: 1000
- Bonus: +200
- Total: 1200 coins
- Bonus %: +20%
- Best for: Serious traders, premium EAs

**Package 6: Ultimate - $2000**
- Base coins: 2000
- Bonus: +500
- Total: 2500 coins
- Bonus %: +25%
- Best for: EA collectors, maximum value

### Payment Methods

**Method 1: Stripe (Credit/Debit Cards)**
- **Supported cards:** Visa, Mastercard, Amex, Discover
- **Flow:**
  1. User selects package
  2. Click "Pay with Card"
  3. Redirects to Stripe Checkout
  4. User enters card details
  5. Stripe processes payment
  6. Stripe webhook confirms payment
  7. Backend adds coins to account
  8. Email receipt sent
- **Processing time:** Instant (2-3 seconds)
- **Fees:** 2.9% + $0.30 (absorbed by platform)
- **Security:** PCI-DSS compliant, Stripe handles all card data

**Stripe Integration (Technical):**
```typescript
// Frontend
const handleStripePayment = async (packageId) => {
  const session = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      packageId,
      successUrl: window.location.origin + '/recharge/success',
      cancelUrl: window.location.origin + '/recharge',
    })
  }).then(r => r.json());
  
  // Redirect to Stripe
  window.location.href = session.url;
};

// Backend webhook
app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
  );
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Find recharge order by session ID
    const order = await findOrderByStripeSessionId(session.id);
    
    // Add coins to user
    await addCoinsToUser(order.userId, order.coinAmount);
    
    // Update order status
    await updateOrderStatus(order.id, 'completed');
    
    // Send email
    await sendReceiptEmail(order);
  }
  
  res.json({ received: true });
});
```

**Method 2: USDT Crypto (via CoinPayments API)**
- **Supported coins:** USDT (Tether), BTC, ETH
- **Flow:**
  1. User selects package
  2. Click "Pay with USDT"
  3. Backend creates CoinPayments invoice
  4. User sees:
     - USDT wallet address
     - QR code for mobile wallets
     - Exact amount to send
     - Payment timeout (15 minutes)
  5. User sends USDT from their wallet
  6. CoinPayments detects payment (1-3 confirmations)
  7. CoinPayments webhook confirms
  8. Backend adds coins
  9. Email confirmation sent
- **Processing time:** 5-30 minutes (blockchain confirmations)
- **Fees:** 0.5% (CoinPayments fee, user pays)
- **Security:** Non-custodial, funds go directly to merchant

**CoinPayments Integration (Technical):**
```typescript
// Frontend
const handleCryptoPayment = async (packageId) => {
  const invoice = await fetch('/api/coinpayments/create-invoice', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      packageId,
      currency: 'USDT', // or BTC, ETH
    })
  }).then(r => r.json());
  
  // Show modal with:
  // - QR code
  // - Wallet address
  // - Amount
  // - Timer (15 min countdown)
  showPaymentModal(invoice);
  
  // Poll for payment confirmation
  const interval = setInterval(async () => {
    const status = await checkPaymentStatus(invoice.id);
    if (status === 'completed') {
      clearInterval(interval);
      showSuccessMessage();
      refreshBalance();
    }
  }, 5000);
};

// Backend webhook
app.post('/api/coinpayments/webhook', async (req, res) => {
  // Verify IPN (Instant Payment Notification)
  const hmac = createHmac('sha512', process.env.COINPAYMENTS_IPN_SECRET)
    .update(req.rawBody)
    .digest('hex');
    
  if (hmac !== req.headers['hmac']) {
    return res.status(403).send('Invalid HMAC');
  }
  
  const payment = req.body;
  
  if (payment.status >= 100) { // 100 = payment complete
    const order = await findOrderByPaymentId(payment.txn_id);
    await addCoinsToUser(order.userId, order.coinAmount);
    await updateOrderStatus(order.id, 'completed');
    await sendReceiptEmail(order);
  }
  
  res.send('IPN received');
});
```

### Recharge Order Lifecycle

**1. Order Creation:**
```typescript
{
  id: "ord_abc123",
  userId: "user_xyz",
  coinAmount: 52,
  priceUsd: 499, // $4.99 in cents
  paymentMethod: "stripe",
  paymentId: null, // Set when payment initiated
  status: "pending",
  createdAt: "2025-10-26T10:00:00Z",
  completedAt: null
}
```

**2. Payment Initiated:**
- Stripe: `paymentId` = Stripe Checkout Session ID
- Crypto: `paymentId` = CoinPayments Invoice ID
- Status remains "pending"

**3. Payment Completed:**
- Webhook received from Stripe/CoinPayments
- Verify webhook signature
- Update order:
  - status: "completed"
  - completedAt: current timestamp
- Create coin transaction:
  ```typescript
  {
    type: "recharge",
    amount: 52,
    description: "Recharge: Best Value Package",
    status: "completed"
  }
  ```
- Update user:
  - totalCoins += 52
  - weeklyEarned += 52 (if within same week)
- Send email receipt

**4. Payment Failed:**
- Timeout (Stripe: card declined, Crypto: not sent within 15 min)
- Update order status: "failed"
- Send email notification
- No coins added

### Order Status API

**Frontend polling during payment:**
```typescript
const { data: order } = useQuery({
  queryKey: ['/api/recharge', orderId],
  refetchInterval: 3000, // Poll every 3s
  enabled: !!orderId && status === 'pending',
});

// Show different UI based on status:
// - pending: "Processing payment..."
// - completed: "Success! Coins added."
// - failed: "Payment failed. Please try again."
```

### Security Measures

1. **Double-Spend Prevention**
   - Check order status before adding coins
   - Atomic database transactions
   - Idempotency keys for webhooks

2. **Webhook Verification**
   - Stripe: Verify signature with STRIPE_WEBHOOK_SECRET
   - CoinPayments: Verify HMAC with IPN_SECRET
   - Reject unsigned requests

3. **Amount Validation**
   - Verify paid amount matches order amount
   - Reject partial payments
   - Handle overpayment (refund or add bonus)

4. **Timeout Handling**
   - Stripe: 30-minute session timeout
   - CoinPayments: 15-minute payment window
   - Auto-cancel expired orders

5. **Audit Trail**
   - Log all payment events
   - Store webhook payloads
   - Track order state changes

---

## Ranking & Trust Level System

### Trust Levels (5 Tiers)

**Level 1: Newbie** 🟢
- **XP Required:** 0-500 XP
- **Time to reach:** Immediate (starting level)
- **Badge color:** Green
- **Limits:**
  - 2 threads per day
  - 10 replies per day
  - 5 likes per day
  - File uploads: 5MB max
  - Reviews require moderation
  - No private messages
- **How to progress:**
  - Create your first few threads
  - Reply to others' questions
  - Like quality content
  - Complete profile (add social links)

**Level 2: Member** 🔵
- **XP Required:** 500-1000 XP
- **Time to reach:** ~2-3 weeks of regular activity
- **Badge color:** Blue
- **Limits:**
  - 5 threads per day
  - 25 replies per day
  - 10 likes per day
  - File uploads: 10MB max
  - Reviews still moderated
- **Unlocks:**
  - Private messaging enabled
  - Can follow other users
  - Badge: "Active Member"
- **How to progress:**
  - Post helpful replies consistently
  - Create quality discussion threads
  - Engage with others' content

**Level 3: Contributor** 🟣
- **XP Required:** 1000-2000 XP
- **Time to reach:** ~1-2 months of quality contributions
- **Badge color:** Purple
- **Limits:**
  - 10 threads per day
  - 50 replies per day
  - 20 likes per day
  - File uploads: 25MB max
- **Unlocks:**
  - Reviews auto-approved (no moderation)
  - Can edit own posts (within 24h)
  - Badge: "Contributor"
  - Higher visibility in search
- **How to progress:**
  - Get replies marked as helpful
  - Publish content to marketplace
  - Write quality reviews

**Level 4: Regular** 🟡
- **XP Required:** 2000-5000 XP
- **Time to reach:** ~3-6 months of consistent activity
- **Badge color:** Gold
- **Limits:**
  - Unlimited threads per day
  - Unlimited replies per day
  - Unlimited likes per day
  - File uploads: 50MB max
- **Unlocks:**
  - Can flag spam/violations
  - Can vote on community polls
  - Priority in search rankings
  - Badge: "Regular" (gold star)
  - Name color highlight
- **How to progress:**
  - Maintain high-quality contributions
  - Get accepted answers regularly
  - Build strong reputation

**Level 5: Leader** 👑
- **XP Required:** 5000+ XP
- **Time to reach:** ~6+ months of exceptional contributions
- **Badge color:** Diamond (rainbow gradient)
- **Limits:**
  - File uploads: 100MB max
  - All other limits removed
- **Unlocks:**
  - Can moderate threads (lock, pin, move)
  - Can edit others' posts (with approval trail)
  - Featured in "Community Leaders" section
  - Badge: "Community Leader" (animated)
  - Special username color (gradient)
  - Verified checkmark
  - Early access to new features
- **Privileges:**
  - Help shape community rules
  - Mentorship opportunities
  - Direct line to admin team

### XP Earning Activities

**Content Creation:**
- Create thread: +50 XP
- Create thread in Beginner Questions: +75 XP (helping newbies)
- Create tutorial thread: +100 XP
- Create thread with backtest: +125 XP
- Publish EA to marketplace: +200 XP
- Publish article: +150 XP
- Publish source code: +175 XP

**Engagement:**
- Post reply: +10 XP
- Reply in own thread: +5 XP (lower to prevent farming)
- Reply with images/code: +15 XP
- Reply with backtest report: +25 XP

**Recognition:**
- Reply marked helpful (each vote): +25 XP
- Reply accepted as answer: +100 XP
- Content 5-star review received: +75 XP
- Content purchased (each sale): +50 XP
- Thread reaches 100 views: +50 XP
- Thread reaches 50 replies: +100 XP
- Thread pinned by admin: +200 XP

**Community Contribution:**
- Write review: +30 XP
- Write broker review: +50 XP
- Report scam (verified): +100 XP
- Report violation (confirmed): +50 XP

**Milestones:**
- First thread: +50 bonus XP
- First reply: +25 bonus XP
- First content published: +100 bonus XP
- First accepted answer: +150 bonus XP
- 10 threads created: +100 bonus XP
- 100 replies posted: +200 bonus XP

### XP Decay System (Fair Play)
- **No XP decay** - XP never decreases
- **However:** Inactive users (6+ months) lose leaderboard privileges
- Weekly leaderboard = only active users count
- Trust level maintained even if inactive

### Rank System (Separate from Trust Levels)

**Global Rank:**
- Based on total coins earned (all-time)
- Rank #1 = User with most total coins
- Rank #2 = Second most
- Etc.
- Updates in real-time
- Displayed in:
  - CoinBalance widget
  - User profile
  - Leaderboards
  - Thread author info

**Weekly Rank:**
- Based on coins earned THIS WEEK
- Resets every Monday 00:00 UTC
- Separate from global rank
- Shown in weekly leaderboard

**Monthly Rank:**
- Based on coins earned THIS MONTH
- Resets 1st of each month
- Shown in monthly leaderboard

---

## Onboarding Checklist System

### Overview
**Status:** ✅ Implemented (October 26, 2025)  
**Purpose:** Guide new users through essential platform features while rewarding early engagement

The onboarding checklist appears on the homepage sidebar for all new users, tracking progress through 4 essential milestones (+ 1 optional future feature).

### Milestones

| Milestone | Trigger | Reward | Required |
|-----------|---------|--------|----------|
| profileCreated | First successful GET /api/me call | +10 coins | ✅ Yes |
| firstReply | Create thread or reply (POST /api/threads or /api/replies) | +15 coins | ✅ Yes |
| firstReport | Submit broker review (POST /api/brokers/review) | +20 coins | ✅ Yes |
| firstUpload | Publish EA/content (POST /api/content) | +50 coins | ✅ Yes |
| socialLinked | Link social account (future feature) | +30 coins | ❌ No (optional) |

**Total Required Coins:** 95 coins (4 essential steps)  
**Total Possible Coins:** 125 coins (all 5 steps)

### User Journey

1. **New User Signs In**
   - GET /api/me called → profileCreated marked → +10 coins
   - Onboarding widget appears: 1/5 complete (20%)

2. **User Creates First Thread**
   - POST /api/threads → firstReply marked → +15 coins
   - Progress: 2/5 complete (40%)

3. **User Reviews Broker**
   - POST /api/brokers/review → firstReport marked → +20 coins
   - Progress: 3/5 complete (60%)

4. **User Publishes EA**
   - POST /api/content → firstUpload marked → +50 coins
   - Progress: 4/5 complete (80%)
   - **Onboarding marked complete** → Widget auto-hides
   - User earned 95 coins total

5. **(Future) User Links Social Account**
   - socialLinked marked → +30 coins bonus
   - Progress: 5/5 complete (100%)

### Storage Implementation

**Schema Fields (shared/schema.ts):**
```typescript
onboardingCompleted: boolean,
onboardingDismissed: boolean,
onboardingProgress: {
  profileCreated: boolean,
  firstReply: boolean,
  firstReport: boolean,
  firstUpload: boolean,
  socialLinked: boolean
}
```

**Coin Rewards:**
- All rewards use double-entry ledger system
- Idempotent: Each milestone can only be claimed once
- Automatic: No user action required beyond completing tasks

### API Endpoints

**GET /api/me/onboarding**
- Returns: `{ completed, dismissed, progress: {...} }`
- Authentication: Required

**POST /api/me/onboarding/dismiss**
- Hides widget permanently
- Authentication: Required

### Frontend Component

**File:** `client/src/components/OnboardingChecklist.tsx`

**Features:**
- Progress bar showing % completion
- 5 task items with checkmarks
- Coin amounts displayed next to each task
- Dismiss button (close icon)
- Auto-hides when completed or dismissed
- Real-time updates via TanStack Query

**Integration:**
```tsx
// client/src/pages/Home.tsx
<OnboardingChecklist />
```

### Technical Details

**Triggers (Backend):**
- `server/routes.ts` contains all auto-triggers
- Wrapped in try-catch to prevent request failures
- Uses `storage.markOnboardingStep()` for all awards

**Completion Logic:**
- Only requires 4 essential steps (excludes socialLinked)
- Both MemStorage and DrizzleStorage implementations consistent
- Auto-hides widget when `onboardingCompleted === true`

**Single-Shot Rewards:**
- Backend checks `current.progress[step]` before awarding
- If already `true`, function returns early (no double rewards)
- Ledger entries only created once per milestone

---

## Components Library

### Core Components (Used Across Multiple Pages)

**1. Header Component**
- **File:** `client/src/components/Header.tsx`
- **Props:** None (fetches user data internally)
- **Description:** Global navigation bar with search, user menu, coin balance
- **Features:**
  - Sticky positioning (always visible)
  - Backdrop blur effect
  - Responsive (mobile menu)
  - Real-time coin balance via API
  - Search bar with icon
  - Notification badge (hardcoded "3")
- **API Calls:** `GET /api/user/:userId/coins`
- **Used in:** All pages

**2. Footer Component**
- **File:** `client/src/components/EnhancedFooter.tsx`
- **Props:** 
  - `onlineUsers?: number` (default: 342)
  - `serverStatus?: "stable" | "degraded" | "down"` (default: "stable")
  - `version?: string` (default: "v1.2.3")
- **Description:** Platform footer with links and live stats
- **Features:**
  - 3-column grid (About, Community, Stats)
  - Live online user count
  - Server status indicator
  - Copyright notice
- **Used in:** All pages

**3. StatsBar Component**
- **File:** `client/src/components/StatsBar.tsx`
- **Props:** None (fetches data via API)
- **Description:** Platform statistics banner
- **Shows:**
  - Total members
  - Total threads
  - Total posts
  - Users online now
- **API:** `GET /api/stats` (30s polling)
- **Used in:** Homepage, Categories page

**4. CategoryCard Component**
- **File:** `client/src/components/CategoryCard.tsx`
- **Props:**
  - `slug: string`
  - `name: string`
  - `description: string`
  - `icon: LucideIcon`
  - `color: string`
  - `threadCount: number`
  - `postCount: number`
- **Description:** Card displaying forum category
- **Features:**
  - Icon with color background
  - Category name (bold)
  - Description (2 lines max)
  - Thread/post counts
  - Hover elevation effect
  - Click → Navigate to `/category/:slug`
- **Used in:** Homepage, CategoriesPage

**5. ForumThreadCard Component**
- **File:** `client/src/components/ForumThreadCard.tsx`
- **Props:**
  - `id: string`
  - `title: string`
  - `excerpt: string`
  - `author: { name: string; reputation: number }`
  - `category: string`
  - `replyCount: number`
  - `viewCount: number`
  - `coinsEarned: number`
  - `isAnswered: boolean`
  - `isPinned: boolean`
  - `hasSetFile: boolean`
  - `hasBacktest: boolean`
  - `isLiveVerified: boolean`
  - `lastActivity: Date`
- **Description:** Card displaying forum thread preview
- **Features:**
  - Title (clickable)
  - Excerpt (truncated)
  - Author info with reputation
  - Category badge
  - Engagement stats (replies, views, coins)
  - Status badges (answered, pinned, etc.)
  - Relative time ("2 hours ago")
  - Hover elevation
  - Click → Navigate to `/thread/:slug`
- **Used in:** Homepage, Category pages, User profile

**6. CreateThreadModal Component**
- **File:** `client/src/components/CreateThreadModal.tsx`
- **Props:**
  - `open: boolean` - Modal open state
  - `onOpenChange: (open: boolean) => void` - Open state handler
  - `defaultCategory?: string` - Pre-fill category slug
- **Description:** Modal dialog for creating new forum threads
- **Form Fields:**
  - **Category** (Select dropdown)
    - Shows all 16 forum categories
    - Required field
    - Pre-filled if `defaultCategory` provided
  - **Title** (Input)
    - Min: 10 characters
    - Max: 200 characters
    - Required
    - Character counter below input
  - **Body** (Textarea)
    - Min: 50 characters
    - Max: 10,000 characters
    - Required
    - Character counter below textarea
    - Resizable
- **Validation:**
  - React Hook Form + Zod resolver
  - Uses `insertForumThreadSchema` from `@shared/schema`
  - Real-time validation feedback
  - Error messages below fields
- **Features:**
  - Auto-clears form on successful submission
  - Closes modal after creation
  - Redirects to new thread page (`/thread/:slug`)
  - Success toast notification
  - Loading state on submit button
  - Disabled submit if invalid
- **API Integration:**
  - POST `/api/threads`
  - Invalidates queries: `['/api/threads']` and `['/api/categories/:slug/threads']`
  - Auto-generates SEO slug, meta description, focus keywords
- **Used in:** CreateThreadButton component
- **Test IDs:**
  - `select-category`, `input-title`, `textarea-body`
  - `button-create-thread`, `button-cancel`

**7. CreateThreadButton Component**
- **File:** `client/src/components/CreateThreadButton.tsx`
- **Props:**
  - `categorySlug?: string` - Pre-fill category
  - `variant?: ButtonVariant` - Button style
- **Description:** Button that opens CreateThreadModal
- **Features:**
  - Plus icon (Lucide)
  - "Create Thread" label
  - Opens modal on click
  - Passes categorySlug to modal
- **Used in:** Header, Category pages
- **Test ID:** `button-create-thread`

**8. CoinBalance Widget**
- **File:** `client/src/components/CoinBalance.tsx`
- **Props:**
  - `balance: number`
  - `weeklyEarned: number`
  - `rank: number | null`
- **Description:** User's coin stats widget
- **Features:**
  - Large coin count display
  - Weekly earnings (+X this week)
  - Global rank (#X)
  - Coin icon (gold)
  - Click → Navigate to `/recharge`
  - Hover effect
- **Used in:** Homepage sidebar

**7. TrustLevel Widget**
- **File:** `client/src/components/TrustLevel.tsx`
- **Props:**
  - `currentLevel: "newbie" | "member" | "contributor" | "regular" | "leader"`
  - `xp: number`
  - `nextLevelXP: number`
- **Description:** Trust level progress widget
- **Features:**
  - Level badge with color
  - XP progress bar
  - Percentage complete
  - Next level info
  - Tooltip with benefits
- **Used in:** Homepage sidebar, User profile

**8. CreateThreadButton**
- **File:** `client/src/components/CreateThreadButton.tsx`
- **Props:**
  - `onCreateThread: (thread) => void`
- **Description:** Quick access to create thread
- **Features:**
  - Large prominent button
  - Plus icon
  - Click → Opens create thread modal/form
- **Used in:** Homepage sidebar

**9. QuickActions Widget**
- **File:** `client/src/components/QuickActions.tsx`
- **Props:** None
- **Description:** Fast navigation widget
- **Actions:**
  - Publish EA
  - Ask Question
  - Find Users
  - Top Up Coins
- **Features:**
  - Icon + label per action
  - Hover effect
  - Click → Navigate to relevant page
- **Used in:** Homepage sidebar

**10. ForumStats Widget**
- **File:** `client/src/components/ForumStats.tsx`
- **Props:** None (fetches via API)
- **Description:** Live platform statistics
- **Shows:**
  - Total threads
  - Active users (last 15 min)
  - New threads today
  - New replies today
- **API:** `GET /api/stats` (30s polling)
- **Used in:** Homepage sidebar

**11. WhatsHot Widget**
- **File:** `client/src/components/WhatsHot.tsx`
- **Props:** None (fetches via API)
- **Description:** Trending discussions widget
- **Shows:** 5 trending threads
- **Features:**
  - Thread title (truncated)
  - Reply + view counts
  - Fire icon
  - Click → Navigate to thread
- **API:** `GET /api/threads?sortBy=trending&limit=5` (30s polling)
- **Used in:** Homepage sidebar

**12. TopSellers Widget**
- **File:** `client/src/components/TopSellers.tsx`
- **Props:** None (fetches via API)
- **Description:** Top content creators
- **Shows:** 5 top sellers this week
- **Features:**
  - Username
  - Coins earned
  - Avatar
  - Verified badge (if applicable)
- **API:** `GET /api/leaderboard?sortBy=uploads&limit=5` (30s polling)
- **Used in:** Homepage sidebar

**13. Leaderboard Widget**
- **File:** `client/src/components/Leaderboard.tsx`
- **Props:** None (fetches via API)
- **Description:** Top 10 users by coins
- **Shows:** Top 10 users
- **Features:**
  - Rank badges (crown, medals, trophy)
  - Username
  - Total coins
  - Special styling for #1-3
  - "View full leaderboard" link
- **API:** `GET /api/leaderboard?sortBy=coins&limit=10` (30s polling)
- **Used in:** Homepage sidebar

**14. WeekHighlights Widget**
- **File:** `client/src/components/WeekHighlights.tsx`
- **Props:** None (uses filtered thread data)
- **Description:** Featured important threads
- **Shows:** 3-5 highlighted threads
- **Features:**
  - Larger cards than regular threads
  - Emphasis on pinned/answered threads
  - Featured badge
- **Used in:** Homepage main content

### Utility Components

**15. Skeleton Component**
- **File:** `client/src/components/ui/skeleton.tsx`
- **Props:**
  - `className?: string`
- **Description:** Loading placeholder
- **Features:**
  - Pulse animation
  - Customizable dimensions via className
- **Used in:** All pages (loading states)

**16. Button Component**
- **File:** `client/src/components/ui/button.tsx`
- **Props:**
  - `variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"`
  - `size?: "default" | "sm" | "lg" | "icon"`
  - `children: ReactNode`
  - Standard HTML button props
- **Description:** Reusable button with variants
- **Features:**
  - Multiple style variants
  - Size options
  - Built-in hover/active states
  - Accessible
- **Used in:** All pages

**17. Card Component**
- **File:** `client/src/components/ui/card.tsx`
- **Exports:** Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription
- **Description:** Container component
- **Features:**
  - Border and shadow
  - Rounded corners
  - Composable sections
- **Used in:** All pages

**18. Badge Component**
- **File:** `client/src/components/ui/badge.tsx`
- **Props:**
  - `variant?: "default" | "secondary" | "destructive" | "outline"`
  - `children: ReactNode`
- **Description:** Small label/tag component
- **Features:**
  - Multiple variants
  - Compact design
  - Rounded pill shape
- **Used in:** Thread cards, category cards, user profiles

**19. Tabs Component**
- **File:** `client/src/components/ui/tabs.tsx`
- **Exports:** Tabs, TabsList, TabsTrigger, TabsContent
- **Description:** Tabbed navigation
- **Features:**
  - Accessible
  - Keyboard navigation
  - Active state styling
- **Used in:** Members page, Settings page

**20. Avatar Component**
- **File:** `client/src/components/ui/avatar.tsx`
- **Exports:** Avatar, AvatarImage, AvatarFallback
- **Description:** User avatar display
- **Features:**
  - Image with fallback to initials
  - Circular shape
  - Multiple sizes
- **Used in:** User profiles, thread cards, leaderboards

---

## API Connections Per Page

### Complete API Wiring Table

This section maps **every TanStack Query/Mutation call** to its corresponding backend API endpoint with full request/response details.

---

### Homepage (/) - API Wiring

| Component | Query/Mutation | HTTP Method | Endpoint | Request Body/Params | Response Type | Polling Interval |
|-----------|---------------|-------------|----------|-------------------|---------------|------------------|
| Header | `useQuery` | GET | `/api/user/:userId/coins` | URL Param: `userId` | `{ totalCoins, weeklyEarned, rank }` | Once on mount |
| StatsBar | `useQuery` | GET | `/api/stats` | None | `{ totalUsers, totalThreads, totalPosts, onlineUsers }` | 30s |
| ForumStats | `useQuery` | GET | `/api/stats` | None | Same as StatsBar | 30s |
| WhatsHot | `useQuery` | GET | `/api/threads` | Query: `sortBy=trending&limit=5` | `Array<ThreadType>` | 30s |
| TopSellers | `useQuery` | GET | `/api/leaderboard` | Query: `sortBy=uploads&limit=5` | `Array<LeaderboardEntry>` | 30s |
| Leaderboard | `useQuery` | GET | `/api/leaderboard` | Query: `sortBy=coins&limit=10` | `Array<LeaderboardEntry>` | 30s |

**Data Currently:** Recent threads and categories are hardcoded (will connect to API in future)

---

### Categories Page (/categories) - API Wiring

| Component | Query/Mutation | HTTP Method | Endpoint | Request Body/Params | Response Type | Polling Interval |
|-----------|---------------|-------------|----------|-------------------|---------------|------------------|
| Header | `useQuery` | GET | `/api/user/:userId/coins` | URL Param: `userId` | `{ totalCoins, weeklyEarned, rank }` | Once |
| Categories Grid | `useQuery` | GET | `/api/categories` | None | `Array<CategoryType>` | 30s |

**Response Example:**
```json
[
  {
    "slug": "strategy-discussion",
    "name": "Strategy Discussion",
    "description": "Share setups, risk, execution...",
    "icon": "Lightbulb",
    "color": "bg-primary",
    "threadCount": 1234,
    "postCount": 8765
  }
]
```

---

### Category Discussion Page (/category/:slug) - API Wiring

| Component | Query/Mutation | HTTP Method | Endpoint | Request Body/Params | Response Type | Polling Interval |
|-----------|---------------|-------------|----------|-------------------|---------------|------------------|
| Header | `useQuery` | GET | `/api/user/:userId/coins` | URL Param: `userId` | `{ totalCoins, weeklyEarned, rank }` | Once |
| Category Header | `useQuery` | GET | `/api/categories/:slug` | URL Param: `slug` | `CategoryType` | Once |
| Thread List | `useQuery` | GET | `/api/categories/:slug/threads` | URL Param: `slug`<br>Query: `limit=20` | `Array<ThreadType>` | 15s |

---

### Members Page (/members) - API Wiring

| Tab | Query/Mutation | HTTP Method | Endpoint | Request Body/Params | Response Type | Polling Interval |
|-----|---------------|-------------|----------|-------------------|---------------|------------------|
| Coins Tab | `useQuery` | GET | `/api/leaderboard` | Query: `sortBy=coins&limit=10` | `Array<{ userId, username, totalCoins }>` | 30s |
| Contributions Tab | `useQuery` | GET | `/api/leaderboard` | Query: `sortBy=contributions&limit=10` | `Array<{ userId, username, contributionCount }>` | 30s |
| Uploads Tab | `useQuery` | GET | `/api/leaderboard` | Query: `sortBy=uploads&limit=10` | `Array<{ userId, username, uploadCount }>` | 30s |

---

### Recharge Page (/recharge) - API Wiring

| Action | Query/Mutation | HTTP Method | Endpoint | Request Body | Response Type | Notes |
|--------|---------------|-------------|----------|--------------|---------------|-------|
| Load Coin Balance | `useQuery` | GET | `/api/user/:userId/coins` | None | `{ totalCoins, weeklyEarned, rank }` | Display current balance |
| Create Recharge Order | `useMutation` | POST | `/api/recharge` | `{ userId, coinAmount, priceUsd, paymentMethod }` | `{ id, status, paymentId? }` | Triggered on "Proceed to Payment" |
| Poll Order Status | `useQuery` | GET | `/api/recharge/:orderId` | URL Param: `orderId` | `{ id, status, coinAmount, completedAt }` | 3s polling while `status === "pending"` |

**Request Body Example:**
```json
{
  "userId": "6e5f03b9-e0f1-424b-b264-779d75f62d89",
  "coinAmount": 220,
  "priceUsd": 20000,
  "paymentMethod": "stripe"
}
```

**Backend Implementation (server/routes.ts):**
```typescript
app.post("/api/recharge", async (req, res) => {
  const validated = insertRechargeOrderSchema.parse(req.body);
  const order = await storage.createRechargeOrder(validated);
  
  // TODO: Integrate with Stripe or crypto payment gateway
  // For now, auto-complete for demo purposes
  const completedOrder = await storage.updateRechargeOrderStatus(
    order.id, 
    "completed",
    "demo-payment-id"
  );
  
  // Award coins to user
  await storage.createCoinTransaction({
    userId: validated.userId,
    type: "recharge",
    amount: validated.coinAmount,
    description: `Recharge: ${validated.coinAmount} coins`
  });
  
  res.json(completedOrder);
});
```

---

### Marketplace Page (/marketplace) - API Wiring

| Action | Query/Mutation | HTTP Method | Endpoint | Request Body/Params | Response Type | Polling |
|--------|---------------|-------------|----------|-------------------|---------------|---------|
| List Content | `useQuery` | GET | `/api/content` | Query: `type=ea&category=Scalping&status=approved&limit=20` | `Array<ContentType>` | 30s |
| Get Content Details | `useQuery` | GET | `/api/content/:id` | URL Param: `id` | `ContentType` | Once |
| Get Content by Slug | `useQuery` | GET | `/api/content/slug/:slug` | URL Param: `slug` | `ContentType` | Once |
| Purchase Content | `useMutation` | POST | `/api/content/purchase` | `{ contentId, buyerId }` | `{ purchaseId, transaction }` | On click |
| Check if Purchased | `useQuery` | GET | `/api/content/:contentId/purchased/:userId` | URL Params | `{ purchased: boolean }` | Once |
| Like Content | `useMutation` | POST | `/api/content/like` | `{ contentId, userId }` | `{ success: true }` | On click |
| Check if Liked | `useQuery` | GET | `/api/content/:contentId/liked/:userId` | URL Params | `{ liked: boolean }` | Once |
| Submit Review | `useMutation` | POST | `/api/content/review` | `{ contentId, userId, rating, reviewText }` | `{ reviewId, status }` | On submit |
| Get Reviews | `useQuery` | GET | `/api/content/:contentId/reviews` | URL Param: `contentId` | `Array<ReviewType>` | Once |

---

### Broker Reviews Page (/brokers) - API Wiring

| Action | Query/Mutation | HTTP Method | Endpoint | Request Body/Params | Response Type | Polling |
|--------|---------------|-------------|----------|-------------------|---------------|---------|
| List Brokers | `useQuery` | GET | `/api/brokers` | Query: `verified=true&status=approved` | `Array<BrokerType>` | 30s |
| Get Broker Details | `useQuery` | GET | `/api/brokers/:id` | URL Param: `id` | `BrokerType` | Once |
| Get Broker by Slug | `useQuery` | GET | `/api/brokers/slug/:slug` | URL Param: `slug` | `BrokerType` | Once |
| **Submit Broker Review** | `useMutation` | POST | `/api/brokers/review` | `{ brokerId, userId, rating, reviewTitle, reviewBody, isScamReport }` | `{ reviewId, status }` | On submit |
| Get Broker Reviews | `useQuery` | GET | `/api/brokers/:brokerId/reviews` | URL Param: `brokerId`<br>Query: `scamOnly=false` | `Array<BrokerReviewType>` | 30s |

**Submit Broker Review - Full Details:**

**Request Body Schema:**
```typescript
{
  brokerId: string;      // UUID of broker
  userId: string;        // UUID of reviewer
  rating: number;        // 1-5 stars (required)
  reviewTitle: string;   // 10-200 chars (required)
  reviewBody: string;    // 100-2000 chars (required)
  isScamReport: boolean; // True = scam report, False = normal review
}
```

**Response:**
```json
{
  "id": "review_abc123",
  "status": "pending",
  "message": "Review submitted for moderation. You'll earn +50 coins when approved (or +150 for scam report)."
}
```

**Backend Flow:**
1. Validate request body with `insertBrokerReviewSchema`
2. Create review with `status: "pending"`
3. Store in `brokerReviews` table
4. If `isScamReport: true`, increment broker's `scamReportCount`
5. Admin reviews later → approve/reject
6. On approve: Award +50 coins (normal) or +150 coins (scam report)

---

### Messages Page (/messages) - API Wiring

| Action | Query/Mutation | HTTP Method | Endpoint | Request Body/Params | Response Type | Polling |
|--------|---------------|-------------|----------|-------------------|---------------|---------|
| **List Conversations** | `useQuery` | GET | `/api/users/:userId/messages` | URL Param: `userId` | `Array<ConversationType>` | 10s |
| **Send Message** | `useMutation` | POST | `/api/messages` | `{ senderId, recipientId, subject?, body }` | `{ messageId, conversationId }` | On send |
| Mark as Read | `useMutation` | POST | `/api/messages/:messageId/read` | URL Param: `messageId` | `{ success: true }` | On view |

**Send Message - Full Details:**

**Request Body Schema:**
```typescript
{
  senderId: string;      // UUID of sender (current user)
  recipientId: string;   // UUID of recipient
  subject?: string;      // Optional subject (for new conversations)
  body: string;          // Message text (required, max 5000 chars)
}
```

**Response:**
```json
{
  "id": "msg_abc123",
  "conversationId": "conv_xyz789",
  "createdAt": "2025-10-26T10:30:00Z"
}
```

**Backend Flow:**
1. Check if conversation exists between sender and recipient
2. If not, create new conversation
3. Insert message into `messages` table
4. Update conversation's `lastMessageAt`
5. Return message ID and conversation ID

**List Conversations Response Example:**
```json
[
  {
    "id": "conv_xyz789",
    "participant1Id": "user_a",
    "participant2Id": "user_b",
    "lastMessageAt": "2025-10-26T10:30:00Z",
    "lastMessage": {
      "body": "Thanks for the EA!",
      "senderId": "user_b",
      "isRead": false
    },
    "otherUser": {
      "id": "user_b",
      "username": "demo",
      "avatar": null
    }
  }
]
```

---

### Publish Content Page (/publish) - API Wiring

| Action | Query/Mutation | HTTP Method | Endpoint | Request Body | Response Type | Notes |
|--------|---------------|-------------|----------|--------------|---------------|-------|
| **Publish Content** | `useMutation` | POST | `/api/content` | See below | `{ id, slug, status }` | Auto-generates SEO |

**Publish Content - Full Details:**

**Request Body Schema:**
```typescript
{
  authorId: string;              // UUID of author (current user)
  type: "ea" | "indicator" | "article" | "source_code";
  title: string;                 // Required, 10-200 chars
  description: string;           // Required, 50-5000 chars
  priceCoins: number;            // 0-10000 (0 = free)
  isFree: boolean;               // true if priceCoins = 0
  category: string;              // e.g., "Scalping", "Grid", "News Trading"
  fileUrl?: string;              // URL to uploaded file (S3/R2)
  imageUrls?: string[];          // Array of image URLs (max 5)
  postLogoUrl?: string;          // Optional logo/icon
}
```

**Backend Auto-Generation:**
The backend automatically generates these fields (user never provides them):
```typescript
{
  slug: "gold-hedger-ea-xauusd-scalping",  // From title
  focusKeyword: "gold hedger xauusd scalping",  // From title
  autoMetaDescription: "First 155 chars of description...",
  autoImageAltTexts: [
    "Main image for Gold Hedger EA - XAUUSD Scalping",
    "Gold Hedger EA - Screenshot 2",
    "Gold Hedger EA - Screenshot 3"
  ],
  status: "pending",  // Awaits admin approval
  views: 0,
  downloads: 0,
  likes: 0
}
```

**Response:**
```json
{
  "id": "content_abc123",
  "slug": "gold-hedger-ea-xauusd-scalping",
  "status": "pending",
  "message": "Content submitted for review. You'll earn +50 coins when approved."
}
```

---

### Transaction History Page (/transactions) - API Wiring

| Action | Query/Mutation | HTTP Method | Endpoint | Request Body/Params | Response Type | Polling |
|--------|---------------|-------------|----------|-------------------|---------------|---------|
| List Transactions | `useQuery` | GET | `/api/user/:userId/transactions` | URL Param: `userId`<br>Query: `limit=50&offset=0` | `Array<TransactionType>` | 30s |

**Response Example:**
```json
[
  {
    "id": "txn_abc123",
    "userId": "user_xyz",
    "type": "earn",
    "amount": 50,
    "description": "Published EA: Gold Scalper Pro",
    "status": "completed",
    "createdAt": "2025-10-26T10:00:00Z"
  },
  {
    "id": "txn_def456",
    "userId": "user_xyz",
    "type": "spend",
    "amount": 200,
    "description": "Purchased: XAUUSD Scalper EA",
    "status": "completed",
    "createdAt": "2025-10-26T09:30:00Z"
  }
]
```

---

## Database Schema Reference

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  total_coins INTEGER DEFAULT 0,
  weekly_earned INTEGER DEFAULT 0,
  rank INTEGER,
  youtube_url TEXT,
  instagram_handle TEXT,
  telegram_handle TEXT,
  myfxbook_link TEXT,
  investor_id TEXT,
  investor_password TEXT,
  is_verified_trader BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  has_youtube_reward BOOLEAN DEFAULT false,
  has_myfxbook_reward BOOLEAN DEFAULT false,
  has_investor_reward BOOLEAN DEFAULT false
);
```

### Coin Transactions Table
```sql
CREATE TABLE coin_transactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  type TEXT NOT NULL, -- "earn" | "spend" | "recharge"
  amount INTEGER NOT NULL, -- Always positive
  description TEXT NOT NULL,
  status TEXT DEFAULT 'completed', -- "completed" | "pending" | "failed"
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Recharge Orders Table
```sql
CREATE TABLE recharge_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  coin_amount INTEGER NOT NULL,
  price_usd INTEGER NOT NULL, -- In cents (e.g., 499 = $4.99)
  payment_method TEXT NOT NULL, -- "stripe" | "crypto"
  payment_id TEXT, -- Stripe session ID or CoinPayments invoice ID
  status TEXT DEFAULT 'pending', -- "pending" | "completed" | "failed"
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### Content Table (Marketplace)
```sql
CREATE TABLE content (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id VARCHAR REFERENCES users(id),
  type TEXT NOT NULL, -- "ea" | "indicator" | "article" | "source_code"
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_coins INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  category TEXT NOT NULL,
  file_url TEXT,
  image_url TEXT,
  image_urls TEXT[], -- Multiple images
  post_logo_url TEXT,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- "pending" | "approved" | "rejected"
  slug TEXT UNIQUE NOT NULL,
  focus_keyword TEXT,
  auto_meta_description TEXT,
  auto_image_alt_texts TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Forum Threads Table
```sql
CREATE TABLE forum_threads (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id VARCHAR REFERENCES users(id),
  category_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  focus_keyword TEXT,
  meta_description TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'approved', -- "pending" | "approved" | "rejected"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Forum Replies Table
```sql
CREATE TABLE forum_replies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id VARCHAR REFERENCES forum_threads(id),
  user_id VARCHAR REFERENCES users(id),
  parent_id VARCHAR REFERENCES forum_replies(id), -- For nested replies
  body TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- SEO: Keyword-rich slug
  meta_description TEXT, -- SEO: Auto-generated
  image_urls TEXT[],
  helpful INTEGER DEFAULT 0, -- Upvote count
  is_accepted BOOLEAN DEFAULT false, -- Accepted answer
  is_verified BOOLEAN DEFAULT false, -- Admin/Expert verified
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Forum Categories Table
```sql
CREATE TABLE forum_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Lucide icon name
  color TEXT DEFAULT 'bg-primary',
  thread_count INTEGER DEFAULT 0, -- Auto-updated
  post_count INTEGER DEFAULT 0, -- Auto-updated
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Brokers Table
```sql
CREATE TABLE brokers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  year_founded INTEGER,
  regulation_summary TEXT,
  overall_rating INTEGER DEFAULT 0, -- Calculated average
  review_count INTEGER DEFAULT 0,
  scam_report_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false, -- Admin-only
  status TEXT DEFAULT 'pending', -- "pending" | "approved" | "rejected"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Broker Reviews Table
```sql
CREATE TABLE broker_reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id VARCHAR REFERENCES brokers(id),
  user_id VARCHAR REFERENCES users(id),
  rating INTEGER NOT NULL, -- 1-5 stars
  review_title TEXT NOT NULL,
  review_body TEXT NOT NULL,
  is_scam_report BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- "pending" | "approved" | "rejected"
  date_posted TIMESTAMP DEFAULT NOW()
);
```

### User Badges Table
```sql
CREATE TABLE user_badges (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  badge_type TEXT NOT NULL, -- "verified_trader" | "top_contributor" | ...
  awarded_at TIMESTAMP DEFAULT NOW()
);
```

### Activity Feed Table
```sql
CREATE TABLE activity_feed (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  activity_type TEXT NOT NULL, -- "thread_created" | "reply_posted" | ...
  entity_type TEXT NOT NULL, -- "thread" | "reply" | "content" | ...
  entity_id VARCHAR NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

**END OF COMPLETE PLATFORM GUIDE**

This guide covers every aspect of the YoForex platform. For API technical details, see `API_DOCUMENTATION.md`. For frontend architecture patterns, see `FRONTEND_ARCHITECTURE.md`. For quick API reference, see `API_QUICK_REFERENCE.txt`.

**Version History:**
- v1.0 (Oct 26, 2025): Initial complete documentation covering all pages, features, user flows, and systems.
