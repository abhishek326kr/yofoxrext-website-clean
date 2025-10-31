interface RankingFactors {
  views: number;
  replies: number;
  helpfulVotes: number;
  bookmarks?: number;
  shares?: number;
  downloads?: number;
  purchases?: number;
  recency: Date;
  authorReputation?: number;
}

interface UserStats {
  threadsCreated: number;
  repliesPosted: number;
  helpfulVotes: number;
  bestAnswers: number;
  contentSales: number;
  followersCount: number;
  uploadsCount: number;
  verifiedTrader: boolean;
}

interface ContentSalesStats {
  totalSales: number;
  priceCoins: number;
  reviewCount: number;
  avgRating: number;
  downloads: number;
}

/**
 * Calculate engagement score for forum threads
 * Higher score = higher ranking in "What's Hot"
 */
export function calculateEngagementScore(factors: RankingFactors): number {
  const {
    views,
    replies,
    helpfulVotes,
    bookmarks = 0,
    shares = 0,
    downloads = 0,
    purchases = 0,
    recency,
    authorReputation = 1
  } = factors;

  // Weight different actions based on engagement value
  const WEIGHTS = {
    view: 0.1,        // Low weight - passive viewing
    reply: 1.0,       // Active discussion (FIXED: was 5.0)
    helpfulVote: 2.0, // Medium weight - quality indicator
    bookmark: 3.0,    // Higher than like - shows intent to return
    share: 4.0,       // High weight - content amplification
    download: 10.0,   // Very high - conversion action
    purchase: 50.0    // Highest - direct revenue impact
  };

  // Calculate base engagement score
  let score = 0;
  score += views * WEIGHTS.view;
  score += replies * WEIGHTS.reply;
  score += helpfulVotes * WEIGHTS.helpfulVote;
  score += bookmarks * WEIGHTS.bookmark;
  score += shares * WEIGHTS.share;
  score += downloads * WEIGHTS.download;
  score += purchases * WEIGHTS.purchase;

  // Apply time decay (exponential decay over 7 days)
  // Newer content gets a boost, older content gradually fades
  const ageInHours = (Date.now() - new Date(recency).getTime()) / (1000 * 60 * 60);
  const decayRate = 7 * 24; // 7 days in hours
  const recencyBoost = Math.exp(-ageInHours / decayRate);
  score *= (1 + recencyBoost);

  // Apply author reputation multiplier (1.0 to 2.0 range)
  // High-reputation authors get a small boost
  const reputationMultiplier = Math.min(2.0, 1.0 + (authorReputation / 10000));
  score *= reputationMultiplier;

  return Math.round(score);
}

/**
 * Calculate user reputation score for leaderboard
 * Rewards quality contributions and helpful behavior
 */
export function calculateUserReputation(userStats: UserStats): number {
  const {
    threadsCreated,
    repliesPosted,
    helpfulVotes,
    bestAnswers,
    contentSales,
    followersCount,
    uploadsCount,
    verifiedTrader
  } = userStats;

  let reputation = 0;

  // Base activity points (encourages participation) - FIXED coefficients
  reputation += threadsCreated * 1;       // Creating discussions (FIXED: was 10)
  reputation += repliesPosted * 0.5;      // Engaging in conversations (FIXED: was 5)
  reputation += helpfulVotes * 2;         // Helpful votes - quality indicator
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

/**
 * Calculate sales score for marketplace content (EAs, Indicators)
 * Combines revenue, popularity, and quality
 */
export function calculateSalesScore(stats: ContentSalesStats): number {
  const {
    totalSales,
    priceCoins,
    reviewCount,
    avgRating,
    downloads
  } = stats;

  // Revenue impact (most important for sellers) - FIXED: added 0.1 multiplier
  const revenueScore = totalSales * priceCoins * 0.1;

  // Social proof (reviews indicate trust)
  const reviewScore = reviewCount * 10;

  // Quality bonus (high ratings boost visibility)
  const ratingBonus = avgRating > 0 ? avgRating * 50 : 0;

  // Download count (popularity indicator)
  const downloadScore = downloads * 2;

  const totalScore = revenueScore + reviewScore + ratingBonus + downloadScore;

  return Math.round(totalScore);
}

/**
 * Get trending threads (What's Hot algorithm)
 * Returns threads with highest engagement in recent period
 */
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
  
  // Apply recency boost (exponential decay)
  const recencyFactor = Math.exp(-ageInHours / 48); // Decay over 48 hours
  
  return velocity * (1 + recencyFactor);
}
