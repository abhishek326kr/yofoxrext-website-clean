import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { categoryRedirects } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Middleware to handle category URL redirects
 * Checks incoming URLs against redirect mappings and redirects to new SEO-friendly URLs
 */
export async function categoryRedirectMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Only process GET requests for potential redirects
    if (req.method !== 'GET') {
      return next();
    }
    
    // Get the full path including query string
    const fullPath = req.originalUrl;
    const pathOnly = req.path;
    
    // Check if this path needs redirection
    const [redirect] = await db
      .select()
      .from(categoryRedirects)
      .where(
        and(
          eq(categoryRedirects.oldUrl, pathOnly),
          eq(categoryRedirects.isActive, true)
        )
      )
      .limit(1);
    
    if (redirect) {
      // Update hit count and last used timestamp
      await db
        .update(categoryRedirects)
        .set({
          hitCount: sql`${categoryRedirects.hitCount} + 1`,
          lastUsed: new Date()
        })
        .where(eq(categoryRedirects.id, redirect.id));
      
      // Preserve query parameters if any
      const url = new URL(redirect.newUrl, `http://${req.headers.host}`);
      const originalUrl = new URL(fullPath, `http://${req.headers.host}`);
      
      // Copy query parameters from original URL to new URL
      originalUrl.searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      
      // Perform the redirect (301 for permanent, 302 for temporary)
      return res.redirect(redirect.redirectType, url.pathname + url.search);
    }
    
    // Additional pattern matching for dynamic content URLs
    // Handle old content URLs like /content/{type}/{slug} -> /forex-trading/{type}/{slug}
    const contentPatterns = [
      { pattern: /^\/content\/ea\/(.+)$/, replacement: '/forex-trading/expert-advisors/$1' },
      { pattern: /^\/content\/indicator\/(.+)$/, replacement: '/forex-trading/indicators/$1' },
      { pattern: /^\/content\/source_code\/(.+)$/, replacement: '/forex-trading/source-code/$1' },
      { pattern: /^\/marketplace\/([^\/]+)\/(.+)$/, replacement: handleMarketplaceRedirect },
    ];
    
    for (const { pattern, replacement } of contentPatterns) {
      const match = pathOnly.match(pattern);
      if (match) {
        let newPath: string;
        
        if (typeof replacement === 'function') {
          newPath = await replacement(match);
        } else {
          newPath = pathOnly.replace(pattern, replacement);
        }
        
        if (newPath !== pathOnly) {
          // Log this redirect for future inclusion in the database
          console.log(`Dynamic redirect: ${pathOnly} -> ${newPath}`);
          
          // Preserve query parameters
          const url = new URL(newPath, `http://${req.headers.host}`);
          const originalUrl = new URL(fullPath, `http://${req.headers.host}`);
          originalUrl.searchParams.forEach((value, key) => {
            url.searchParams.set(key, value);
          });
          
          return res.redirect(301, url.pathname + url.search);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Category redirect middleware error:', error);
    // Don't break the request flow on redirect errors
    next();
  }
}

/**
 * Handle marketplace category redirects based on old category mappings
 */
async function handleMarketplaceRedirect(match: RegExpMatchArray): Promise<string> {
  const oldCategory = match[1];
  const slug = match[2];
  
  // Map old marketplace categories to new SEO-friendly URLs
  const categoryMap: Record<string, string> = {
    'scalping-eas': '/forex-trading/expert-advisors/',
    'grid-trading-eas': '/forex-trading/expert-advisors/',
    'trend-following-eas': '/forex-trading/expert-advisors/',
    'breakout-eas': '/forex-trading/expert-advisors/',
    'news-trading-eas': '/forex-trading/expert-advisors/',
    'mt4-eas': '/forex-trading/expert-advisors/',
    'mt5-eas': '/forex-trading/expert-advisors/',
    'ctrader-robots': '/forex-trading/expert-advisors/',
    'oscillators-momentum': '/forex-trading/indicators/',
    'volume-indicators': '/forex-trading/indicators/',
    'sr-tools': '/forex-trading/indicators/',
    'template-packs': '/forex-trading/indicators/',
    'source-code': '/forex-trading/source-code/',
    'trading-strategies': '/forex-trading/strategies/',
  };
  
  const newBasePath = categoryMap[oldCategory] || `/marketplace/${oldCategory}/`;
  return `${newBasePath}${slug}`;
}

/**
 * Middleware to track category views for SEO analytics
 */
export async function trackCategoryViews(req: Request, res: Response, next: NextFunction) {
  try {
    // Only track GET requests to category pages
    if (req.method !== 'GET') {
      return next();
    }
    
    const pathSegments = req.path.split('/').filter(Boolean);
    
    // Check if this is a category page (has the URL pattern)
    if (pathSegments.length >= 1) {
      const categoryPaths = [
        '/forex-trading/',
        '/binary-options/',
        '/cryptocurrency-trading/',
        '/online-courses/',
        '/sports-betting/',
        '/casino-poker/',
        '/community/',
        '/free-downloads/'
      ];
      
      const matchedPath = categoryPaths.find(path => req.path.startsWith(path));
      
      if (matchedPath) {
        // Update view count asynchronously (don't wait)
        const updateViews = async () => {
          try {
            const { seoCategories } = await import('@shared/schema');
            await db
              .update(seoCategories)
              .set({
                viewCount: sql`${seoCategories.viewCount} + 1`
              })
              .where(eq(seoCategories.urlPath, matchedPath));
          } catch (err) {
            console.error('Failed to update category view count:', err);
          }
        };
        
        // Run async without blocking the request
        updateViews();
      }
    }
    
    next();
  } catch (error) {
    console.error('Category view tracking error:', error);
    next();
  }
}

export default categoryRedirectMiddleware;