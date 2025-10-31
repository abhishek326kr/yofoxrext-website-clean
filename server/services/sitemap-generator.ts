import { db } from '../db';
import { forumCategories, forumThreads, content, users, brokers } from '@shared/schema';
import { sql } from 'drizzle-orm';

interface SitemapUrl {
  loc: string;
  lastmod: string; // YYYY-MM-DD format
}

export class SitemapGenerator {
  private baseUrl: string;

  constructor(baseUrl: string) {
    // Remove trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Generate complete sitemap XML with all pages
   */
  async generateSitemap(): Promise<{ xml: string; urlCount: number }> {
    const urls: SitemapUrl[] = [];

    // 1. Homepage
    urls.push({
      loc: this.baseUrl,
      lastmod: new Date().toISOString().split('T')[0],
    });

    // 2. Static pages
    const staticPages = [
      '/discussions',
      '/marketplace',
      '/brokers',
      '/members',
    ];
    staticPages.forEach(page => {
      urls.push({
        loc: `${this.baseUrl}${page}`,
        lastmod: new Date().toISOString().split('T')[0],
      });
    });

    // 3. Forum categories (with hierarchical paths)
    const categories = await db.select().from(forumCategories);
    for (const category of categories) {
      const categoryPath = await this.getCategoryPath(category.slug);
      urls.push({
        loc: `${this.baseUrl}/category/${categoryPath}`,
        lastmod: category.updatedAt 
          ? new Date(category.updatedAt).toISOString().split('T')[0]
          : new Date(category.createdAt).toISOString().split('T')[0],
      });
    }

    // 4. Forum threads (with hierarchical category paths)
    const threads = await db
      .select({
        slug: forumThreads.slug,
        categorySlug: forumThreads.categorySlug,
        updatedAt: forumThreads.updatedAt,
        createdAt: forumThreads.createdAt,
      })
      .from(forumThreads);

    for (const thread of threads) {
      const categoryPath = await this.getCategoryPath(thread.categorySlug);
      urls.push({
        loc: `${this.baseUrl}/category/${categoryPath}/${thread.slug}`,
        lastmod: thread.updatedAt
          ? new Date(thread.updatedAt).toISOString().split('T')[0]
          : new Date(thread.createdAt).toISOString().split('T')[0],
      });
    }

    // 5. Marketplace content
    const contentItems = await db
      .select({
        slug: content.slug,
        category: content.category,
        updatedAt: content.updatedAt,
        createdAt: content.createdAt,
      })
      .from(content);

    for (const item of contentItems) {
      const categoryPath = await this.getCategoryPath(item.category);
      urls.push({
        loc: `${this.baseUrl}/category/${categoryPath}/${item.slug}`,
        lastmod: item.updatedAt
          ? new Date(item.updatedAt).toISOString().split('T')[0]
          : new Date(item.createdAt).toISOString().split('T')[0],
      });
    }

    // 6. User profiles
    const userProfiles = await db
      .select({
        username: users.username,
      })
      .from(users);

    for (const user of userProfiles) {
      urls.push({
        loc: `${this.baseUrl}/user/${user.username}`,
        lastmod: new Date().toISOString().split('T')[0],
      });
    }

    // 7. Broker profiles
    const brokerProfiles = await db
      .select({
        slug: brokers.slug,
        updatedAt: brokers.updatedAt,
        createdAt: brokers.createdAt,
      })
      .from(brokers);

    for (const broker of brokerProfiles) {
      urls.push({
        loc: `${this.baseUrl}/brokers/${broker.slug}`,
        lastmod: broker.updatedAt
          ? new Date(broker.updatedAt).toISOString().split('T')[0]
          : new Date(broker.createdAt).toISOString().split('T')[0],
      });
    }

    // Generate XML
    const xml = this.generateXML(urls);

    return {
      xml,
      urlCount: urls.length,
    };
  }

  /**
   * Get full hierarchical category path
   */
  private async getCategoryPath(categorySlug: string): Promise<string> {
    const path: string[] = [];
    let currentSlug: string | null = categorySlug;
    const visited = new Set<string>();

    while (currentSlug && !visited.has(currentSlug)) {
      visited.add(currentSlug);

      const [category] = await db
        .select()
        .from(forumCategories)
        .where(sql`${forumCategories.slug} = ${currentSlug}`)
        .limit(1);

      if (!category) break;

      path.unshift(category.slug);
      currentSlug = category.parentSlug;
    }

    return path.join('/');
  }

  /**
   * Generate XML sitemap following 2025 standards
   * Uses only <loc> and <lastmod> tags (changefreq and priority are ignored by Google/Bing)
   */
  private generateXML(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const url of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
