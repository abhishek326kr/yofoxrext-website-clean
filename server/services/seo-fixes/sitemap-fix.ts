import { writeFileSync } from 'fs';
import { db } from '../../db';
import { forumThreads, content, brokers } from '../../../shared/schema';
import type { SeoIssue } from '../../../shared/schema';
import type { FixResult } from './canonical-fix';

export async function fixSitemap(issue: SeoIssue): Promise<FixResult> {
  try {
    const before = {
      pageUrl: issue.pageUrl,
      issueType: issue.issueType,
      status: 'sitemap_missing',
    };

    // Fetch all public URLs from database
    const threads = await db.select({ slug: forumThreads.slug }).from(forumThreads);
    const contentItems = await db.select({ slug: content.slug }).from(content);
    const brokerItems = await db.select({ slug: brokers.slug }).from(brokers);
    
    // Generate sitemap XML
    const urls = [
      { loc: 'https://yoforex.com/', priority: '1.0' },
      { loc: 'https://yoforex.com/forum', priority: '0.9' },
      { loc: 'https://yoforex.com/marketplace', priority: '0.9' },
      { loc: 'https://yoforex.com/brokers', priority: '0.9' },
      ...threads.map(t => ({ loc: `https://yoforex.com/forum/${t.slug}`, priority: '0.7' })),
      ...contentItems.map(c => ({ loc: `https://yoforex.com/marketplace/${c.slug}`, priority: '0.8' })),
      ...brokerItems.map(b => ({ loc: `https://yoforex.com/brokers/${b.slug}`, priority: '0.6' })),
    ];
    
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`).join('\n')}
</urlset>`;
    
    // Write to public/sitemap.xml
    writeFileSync('public/sitemap.xml', sitemapXml, 'utf-8');
    
    const after = {
      pageUrl: issue.pageUrl,
      sitemap: 'generated',
      urlCount: urls.length,
      location: 'public/sitemap.xml',
    };

    return {
      success: true,
      before,
      after,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate sitemap',
      before: { sitemap: 'missing' },
      after: { sitemap: 'failed' },
    };
  }
}
