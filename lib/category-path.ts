/**
 * Category Path Utilities
 * Handles hierarchical URL generation for YoForex content
 * 
 * Transforms flat category slugs into full hierarchical paths:
 * "xauusd-scalping" → "trading-strategies/scalping-m1-m15/xauusd-scalping"
 */

import { db } from '../server/db';
import { forumCategories, type ForumThread, type Content } from '@shared/schema';
import { eq } from 'drizzle-orm';

// In-memory cache for category paths (5 minute TTL)
const pathCache = new Map<string, { path: string; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Build full category path by walking up the hierarchy
 * 
 * @param categorySlug - The leaf category slug (e.g., "xauusd-scalping")
 * @returns Full path (e.g., "trading-strategies/scalping-m1-m15/xauusd-scalping")
 * 
 * @example
 * const path = await getCategoryPath("xauusd-scalping");
 * // Returns: "trading-strategies/scalping-m1-m15/xauusd-scalping"
 */
export async function getCategoryPath(categorySlug: string): Promise<string> {
  // Check cache first
  const cached = pathCache.get(categorySlug);
  if (cached && cached.expiry > Date.now()) {
    return cached.path;
  }
  
  const path: string[] = [];
  let currentSlug: string | null = categorySlug;
  const visited = new Set<string>(); // Prevent infinite loops
  
  // Walk up the parent chain
  while (currentSlug && !visited.has(currentSlug)) {
    visited.add(currentSlug);
    
    const [category] = await db
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.slug, currentSlug))
      .limit(1);
    
    if (!category) break;
    
    path.unshift(category.slug); // Add to beginning
    currentSlug = category.parentSlug;
  }
  
  const fullPath = path.join('/');
  
  // Cache the result
  pathCache.set(categorySlug, {
    path: fullPath,
    expiry: Date.now() + CACHE_TTL,
  });
  
  return fullPath;
}

/**
 * Get category object from full hierarchical path
 * 
 * @param path - Full category path (e.g., "trading-strategies/scalping-m1-m15")
 * @returns Category object or null if not found
 * 
 * @example
 * const category = await getCategoryByPath("trading-strategies/scalping-m1-m15");
 * // Returns: { slug: "scalping-m1-m15", name: "Scalping Strategies (M1–M15)", ... }
 */
export async function getCategoryByPath(path: string) {
  const slugs = path.split('/');
  const targetSlug = slugs[slugs.length - 1]; // Last segment is the actual category
  
  const [category] = await db
    .select()
    .from(forumCategories)
    .where(eq(forumCategories.slug, targetSlug))
    .limit(1);
  
  return category || null;
}

/**
 * Build full hierarchical URL for a forum thread
 * 
 * @param thread - Forum thread object with categorySlug
 * @returns Full URL path
 * 
 * @example
 * const url = await getThreadUrl(thread);
 * // Returns: "/category/trading-strategies/scalping-m1-m15/thread-slug"
 */
export async function getThreadUrl(thread: Pick<ForumThread, 'categorySlug' | 'slug'>): Promise<string> {
  const categoryPath = await getCategoryPath(thread.categorySlug);
  return `/category/${categoryPath}/${thread.slug}`;
}

/**
 * Build full hierarchical URL for marketplace content
 * 
 * @param content - Content object with category
 * @returns Full URL path
 * 
 * @example
 * const url = await getContentUrl(content);
 * // Returns: "/category/ea-library/scalping-eas/gold-scalper-pro"
 */
export async function getContentUrl(content: Pick<Content, 'category' | 'slug'>): Promise<string> {
  const categoryPath = await getCategoryPath(content.category);
  return `/category/${categoryPath}/${content.slug}`;
}

/**
 * Build URL for broker profile
 * For now, brokers use a simpler structure: /brokers/[slug]
 * Can be extended later to: /brokers/[type]/[slug]
 * 
 * @param brokerSlug - Broker slug
 * @returns Broker URL path
 */
export function getBrokerUrl(brokerSlug: string): string {
  return `/brokers/${brokerSlug}`;
}

/**
 * Build URL for category browsing page
 * 
 * @param categorySlug - Category slug
 * @returns Category browsing URL
 * 
 * @example
 * const url = await getCategoryUrl("scalping-m1-m15");
 * // Returns: "/category/trading-strategies/scalping-m1-m15"
 */
export async function getCategoryUrl(categorySlug: string): Promise<string> {
  const categoryPath = await getCategoryPath(categorySlug);
  return `/category/${categoryPath}`;
}

/**
 * Clear the category path cache
 * Useful after bulk category updates
 */
export function clearCategoryPathCache() {
  pathCache.clear();
}

/**
 * Parse a hierarchical URL path into components
 * 
 * @param urlPath - Full URL path (e.g., "/category/trading-strategies/scalping/thread-slug")
 * @returns Parsed components
 * 
 * @example
 * const parsed = parseHierarchicalUrl("/category/trading-strategies/scalping-m1-m15/my-thread");
 * // Returns: {
 * //   categoryPath: "trading-strategies/scalping-m1-m15",
 * //   contentSlug: "my-thread",
 * //   isCategory: false
 * // }
 */
export function parseHierarchicalUrl(urlPath: string): {
  categoryPath: string;
  contentSlug: string | null;
  isCategory: boolean;
} {
  // Remove leading /category/ prefix
  const cleanPath = urlPath.replace(/^\/category\//, '');
  const segments = cleanPath.split('/');
  
  // If only one segment, it's a root category
  if (segments.length === 1) {
    return {
      categoryPath: segments[0],
      contentSlug: null,
      isCategory: true,
    };
  }
  
  // Last segment could be content or subcategory - caller must determine
  const contentSlug = segments[segments.length - 1];
  const categoryPath = segments.slice(0, -1).join('/');
  
  return {
    categoryPath,
    contentSlug,
    isCategory: false, // Assume content, caller should verify
  };
}
