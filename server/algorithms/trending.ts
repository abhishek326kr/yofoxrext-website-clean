import type { ForumThread } from "@shared/schema";

/**
 * Calculate "hot" score using a Reddit-style algorithm
 * Higher scores = more trending
 * 
 * Factors:
 * - Views (lower weight)
 * - Reply count (high weight)
 * - Recency (gravity decay)
 * - Pinned threads get bonus
 */
export function calculateHotScore(thread: ForumThread): number {
  const now = Date.now();
  const createdAt = new Date(thread.createdAt!).getTime();
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);
  
  // Calculate engagement score
  const views = thread.views || 0;
  const replies = thread.replyCount || 0;
  const isPinned = thread.isPinned || false;
  
  // Weighted scoring - FIXED: reply weight from 5 to 1
  const score = (
    views * 0.1 +           // Views have low weight
    replies * 1 +           // Replies weight (FIXED: was 5)
    (isPinned ? 100 : 0)    // Pinned threads get significant boost
  );
  
  // Apply time decay (gravity = 1.8 like Reddit)
  // Add 2 hours to avoid division by zero and reduce extreme bias
  const gravity = 1.8;
  const hotScore = score / Math.pow(ageInHours + 2, gravity);
  
  return hotScore;
}

/**
 * Get cached trending threads
 * Cache lasts 5 minutes to reduce computational load
 */
interface TrendingCache {
  threads: ForumThread[];
  timestamp: number;
}

let cache: TrendingCache = {
  threads: [],
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getTrendingThreads(
  allThreads: ForumThread[],
  limit: number = 10,
  useCache: boolean = true
): ForumThread[] {
  // Return cached if still valid
  if (useCache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.threads.slice(0, limit);
  }
  
  // Calculate hot scores and sort
  const threadsWithScores = allThreads.map((thread) => ({
    ...thread,
    hotScore: calculateHotScore(thread),
  }));
  
  const trending = threadsWithScores
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit);
  
  // Update cache
  if (useCache) {
    cache = {
      threads: trending,
      timestamp: Date.now(),
    };
  }
  
  return trending;
}

/**
 * Clear the trending cache
 * Useful when new threads are created or updated
 */
export function clearTrendingCache(): void {
  cache = {
    threads: [],
    timestamp: 0,
  };
}
