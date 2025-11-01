import { writeFileSync } from 'fs';
import type { SeoIssue } from '../../../shared/schema';
import type { FixResult } from './canonical-fix';

export async function fixRobots(issue: SeoIssue): Promise<FixResult> {
  try {
    const before = {
      pageUrl: issue.pageUrl,
      issueType: issue.issueType,
      status: 'missing_robots_txt',
    };

    const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://yoforex.com/sitemap.xml

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_next/

# Allow crawling of public content
Allow: /forum/
Allow: /marketplace/
Allow: /brokers/
`;

    writeFileSync('public/robots.txt', robotsTxt, 'utf-8');
    
    const after = {
      pageUrl: issue.pageUrl,
      robots: 'generated',
      location: 'public/robots.txt',
    };

    return {
      success: true,
      before,
      after,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate robots.txt',
      before: { robots: 'missing' },
      after: { robots: 'failed' },
    };
  }
}
