/**
 * Google PageSpeed Insights API Integration
 * Provides performance, SEO, and accessibility metrics
 */

interface PageSpeedScore {
  performance: number; // 0-100
  seo: number; // 0-100
  accessibility: number; // 0-100
  bestPractices: number; // 0-100
  pwa?: number; // 0-100 (optional)
}

interface PageSpeedResult {
  url: string;
  strategy: 'mobile' | 'desktop';
  scores: PageSpeedScore;
  fetchTime: number; // Timestamp
  rawData?: any; // Full Lighthouse result
}

interface PageSpeedCache {
  [key: string]: {
    result: PageSpeedResult;
    expiresAt: number;
  };
}

const PAGESPEED_API_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const cache: PageSpeedCache = {};

/**
 * Check if PageSpeed API is available
 */
export function isPageSpeedAvailable(): boolean {
  return !!process.env.PAGESPEED_API_KEY;
}

/**
 * Get cache key for URL and strategy
 */
function getCacheKey(url: string, strategy: 'mobile' | 'desktop'): string {
  return `${url}|${strategy}`;
}

/**
 * Get cached result if available and not expired
 */
function getCachedResult(url: string, strategy: 'mobile' | 'desktop'): PageSpeedResult | null {
  const key = getCacheKey(url, strategy);
  const cached = cache[key];
  
  if (!cached) {
    return null;
  }
  
  if (Date.now() > cached.expiresAt) {
    delete cache[key];
    return null;
  }
  
  return cached.result;
}

/**
 * Cache a PageSpeed result
 */
function cacheResult(result: PageSpeedResult): void {
  const key = getCacheKey(result.url, result.strategy);
  cache[key] = {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}

/**
 * Fetch PageSpeed metrics from Google API
 */
export async function fetchPageSpeedMetrics(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<PageSpeedResult | null> {
  // Check if API is available
  if (!isPageSpeedAvailable()) {
    console.warn('[PageSpeed] API key not configured - skipping PageSpeed analysis');
    return null;
  }
  
  // Check cache first
  const cached = getCachedResult(url, strategy);
  if (cached) {
    console.log(`[PageSpeed] Cache hit for ${url} (${strategy})`);
    return cached;
  }
  
  // Build API request
  const apiKey = process.env.PAGESPEED_API_KEY!;
  const categories = ['performance', 'seo', 'accessibility', 'best-practices'];
  const params = new URLSearchParams({
    url,
    key: apiKey,
    strategy,
  });
  
  // Add category parameters (can be repeated)
  categories.forEach(category => {
    params.append('category', category);
  });
  
  const requestUrl = `${PAGESPEED_API_ENDPOINT}?${params.toString()}`;
  
  try {
    console.log(`[PageSpeed] Fetching metrics for ${url} (${strategy})...`);
    
    const response = await fetch(requestUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PageSpeed] API error ${response.status}:`, errorText);
      return null;
    }
    
    const data = await response.json();
    
    // Extract scores from Lighthouse result
    const lighthouseCategories = data.lighthouseResult?.categories;
    if (!lighthouseCategories) {
      console.error('[PageSpeed] No categories in response:', data);
      return null;
    }
    
    const result: PageSpeedResult = {
      url: data.id || url, // Final URL after redirects
      strategy,
      scores: {
        performance: Math.round((lighthouseCategories.performance?.score || 0) * 100),
        seo: Math.round((lighthouseCategories.seo?.score || 0) * 100),
        accessibility: Math.round((lighthouseCategories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((lighthouseCategories['best-practices']?.score || 0) * 100),
        pwa: lighthouseCategories.pwa ? Math.round(lighthouseCategories.pwa.score * 100) : undefined,
      },
      fetchTime: Date.now(),
      rawData: data.lighthouseResult, // Store full result for detailed analysis
    };
    
    // Cache the result
    cacheResult(result);
    
    console.log(`[PageSpeed] Success for ${url}:`, result.scores);
    return result;
    
  } catch (error) {
    console.error(`[PageSpeed] Fetch error for ${url}:`, error);
    return null;
  }
}

/**
 * Fetch metrics for multiple URLs in sequence (with delay to respect rate limits)
 */
export async function fetchPageSpeedMetricsBatch(
  urls: string[],
  strategy: 'mobile' | 'desktop' = 'mobile',
  delayMs: number = 1000 // Delay between requests to avoid rate limiting
): Promise<Map<string, PageSpeedResult | null>> {
  const results = new Map<string, PageSpeedResult | null>();
  
  for (const url of urls) {
    const result = await fetchPageSpeedMetrics(url, strategy);
    results.set(url, result);
    
    // Delay before next request
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearPageSpeedCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
  console.log('[PageSpeed] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getPageSpeedCacheStats() {
  const now = Date.now();
  const entries = Object.entries(cache);
  
  return {
    total: entries.length,
    expired: entries.filter(([_, v]) => now > v.expiresAt).length,
    valid: entries.filter(([_, v]) => now <= v.expiresAt).length,
  };
}
