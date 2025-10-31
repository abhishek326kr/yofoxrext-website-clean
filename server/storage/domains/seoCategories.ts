import { db } from '../../db';
import { eq, and, sql, inArray, isNull } from 'drizzle-orm';
import { seoCategories, content, categoryRedirects } from '@shared/schema';
import type { SeoCategory, InsertSeoCategory } from '@shared/schema';

/**
 * SeoCategoryStorage - Handles all SEO category database operations
 */
export class SeoCategoryStorage {
  /**
   * Get all categories in a tree structure
   */
  async getCategoryTree(activeOnly = true): Promise<SeoCategory[]> {
    const conditions = activeOnly ? [eq(seoCategories.isActive, true)] : [];
    
    const allCategories = await db
      .select()
      .from(seoCategories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(seoCategories.sortOrder);
    
    // Build tree structure
    const mainCategories = allCategories.filter(cat => !cat.parentId);
    const categoryTree = mainCategories.map(mainCat => ({
      ...mainCat,
      children: allCategories.filter(subCat => subCat.parentId === mainCat.id)
    }));
    
    return categoryTree;
  }
  
  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<SeoCategory | undefined> {
    const [category] = await db
      .select()
      .from(seoCategories)
      .where(eq(seoCategories.slug, slug))
      .limit(1);
    
    return category;
  }
  
  /**
   * Get category by URL path
   */
  async getCategoryByUrlPath(urlPath: string): Promise<SeoCategory | undefined> {
    const [category] = await db
      .select()
      .from(seoCategories)
      .where(eq(seoCategories.urlPath, urlPath))
      .limit(1);
    
    return category;
  }
  
  /**
   * Get category by old slug (for migration)
   */
  async getCategoryByOldSlug(oldSlug: string): Promise<SeoCategory | undefined> {
    const [category] = await db
      .select()
      .from(seoCategories)
      .where(eq(seoCategories.oldSlug, oldSlug))
      .limit(1);
    
    return category;
  }
  
  /**
   * Update content count for a category
   */
  async updateCategoryContentCount(categoryId: string): Promise<void> {
    // Count content items in this category
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(content)
      .where(eq(content.category, categoryId));
    
    const count = result?.count || 0;
    
    await db
      .update(seoCategories)
      .set({ 
        contentCount: count,
        updatedAt: new Date()
      })
      .where(eq(seoCategories.id, categoryId));
  }
  
  /**
   * Track category page view
   */
  async trackCategoryView(categoryId: string): Promise<void> {
    await db
      .update(seoCategories)
      .set({
        viewCount: sql`${seoCategories.viewCount} + 1`
      })
      .where(eq(seoCategories.id, categoryId));
  }
  
  /**
   * Get or create redirect for old URL
   */
  async getOrCreateRedirect(oldUrl: string, newUrl: string): Promise<void> {
    // Check if redirect exists
    const [existing] = await db
      .select()
      .from(categoryRedirects)
      .where(eq(categoryRedirects.oldUrl, oldUrl))
      .limit(1);
    
    if (!existing) {
      // Create new redirect
      await db.insert(categoryRedirects).values({
        oldUrl,
        newUrl,
        redirectType: 301,
        isActive: true
      });
    }
  }
  
  /**
   * Map old category to new SEO category
   */
  async mapOldCategoryToNew(oldCategory: string): Promise<string | null> {
    // First check if it's already an SEO category ID
    const [existingById] = await db
      .select()
      .from(seoCategories)
      .where(eq(seoCategories.id, oldCategory))
      .limit(1);
    
    if (existingById) {
      return existingById.id;
    }
    
    // Check if it matches an old slug
    const [existingByOldSlug] = await db
      .select()
      .from(seoCategories)
      .where(eq(seoCategories.oldSlug, oldCategory))
      .limit(1);
    
    if (existingByOldSlug) {
      return existingByOldSlug.id;
    }
    
    // Manual mapping for known categories
    const categoryMap: Record<string, string> = {
      'scalping-eas': 'expert-advisors',
      'grid-trading-eas': 'expert-advisors',
      'trend-following-eas': 'expert-advisors',
      'news-trading-eas': 'expert-advisors',
      'breakout-eas': 'expert-advisors',
      'mt4-eas': 'expert-advisors',
      'mt5-eas': 'expert-advisors',
      'ctrader-robots': 'expert-advisors',
      'oscillators-momentum': 'indicators',
      'volume-indicators': 'indicators',
      'sr-tools': 'indicators',
      'template-packs': 'indicators',
      'source-code': 'source-code',
      'trading-strategies': 'strategies',
      'ea-library': 'expert-advisors',
      'ea': 'expert-advisors',
      'indicator': 'indicators'
    };
    
    const mappedSlug = categoryMap[oldCategory.toLowerCase()];
    if (mappedSlug) {
      const [category] = await db
        .select()
        .from(seoCategories)
        .where(eq(seoCategories.slug, mappedSlug))
        .limit(1);
      
      if (category) {
        return category.id;
      }
    }
    
    return null;
  }
  
  /**
   * Migrate content to new category system
   */
  async migrateContentCategories(): Promise<{ migrated: number; failed: number }> {
    // Get all content with old category values
    const allContent = await db.select().from(content);
    
    let migrated = 0;
    let failed = 0;
    
    for (const item of allContent) {
      const newCategoryId = await this.mapOldCategoryToNew(item.category);
      
      if (newCategoryId && newCategoryId !== item.category) {
        try {
          await db
            .update(content)
            .set({ 
              category: newCategoryId,
              updatedAt: new Date()
            })
            .where(eq(content.id, item.id));
          
          migrated++;
        } catch (error) {
          console.error(`Failed to migrate content ${item.id}:`, error);
          failed++;
        }
      } else if (!newCategoryId) {
        console.warn(`No mapping found for category: ${item.category} (content: ${item.id})`);
        failed++;
      }
    }
    
    // Update content counts for all categories
    const categories = await db.select().from(seoCategories);
    for (const category of categories) {
      await this.updateCategoryContentCount(category.id);
    }
    
    return { migrated, failed };
  }
  
  /**
   * Get breadcrumbs for a category
   */
  async getCategoryBreadcrumbs(categoryId: string): Promise<Array<{ name: string; urlPath: string }>> {
    const breadcrumbs: Array<{ name: string; urlPath: string }> = [];
    
    let currentCategory = await db
      .select()
      .from(seoCategories)
      .where(eq(seoCategories.id, categoryId))
      .limit(1)
      .then(res => res[0]);
    
    while (currentCategory) {
      breadcrumbs.unshift({
        name: currentCategory.name,
        urlPath: currentCategory.urlPath
      });
      
      if (currentCategory.parentId) {
        currentCategory = await db
          .select()
          .from(seoCategories)
          .where(eq(seoCategories.id, currentCategory.parentId))
          .limit(1)
          .then(res => res[0]);
      } else {
        break;
      }
    }
    
    return breadcrumbs;
  }
  
  /**
   * Get child categories
   */
  async getChildCategories(parentId: string): Promise<SeoCategory[]> {
    return await db
      .select()
      .from(seoCategories)
      .where(
        and(
          eq(seoCategories.parentId, parentId),
          eq(seoCategories.isActive, true)
        )
      )
      .orderBy(seoCategories.sortOrder);
  }
  
  /**
   * Get popular categories by view count
   */
  async getPopularCategories(limit = 10): Promise<SeoCategory[]> {
    return await db
      .select()
      .from(seoCategories)
      .where(eq(seoCategories.isActive, true))
      .orderBy(sql`${seoCategories.viewCount} DESC`)
      .limit(limit);
  }
}

export const seoCategoryStorage = new SeoCategoryStorage();