import { db } from '../../db';
import { seoOverrides } from '../../../shared/schema';
import type { SeoIssue } from '../../../shared/schema';
import type { FixResult } from './canonical-fix';

function generateTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url, 'http://localhost');
    const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
    
    if (pathParts.length === 0) {
      return 'YoForex - Forex Trading Community';
    }

    const lastPart = pathParts[pathParts.length - 1];
    const titlePart = lastPart
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `${titlePart} | YoForex`;
  } catch {
    return 'YoForex - Forex Trading Community';
  }
}

function generateMetaDescription(url: string, issueType: string): string {
  try {
    const urlObj = new URL(url, 'http://localhost');
    const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
    
    if (pathParts.length === 0) {
      return 'Join YoForex, the premier forex trading community. Share strategies, learn from experts, and grow your trading skills.';
    }

    const section = pathParts[0];
    const templates: Record<string, string> = {
      forum: 'Join the discussion on YoForex forum. Share your forex trading experiences, strategies, and learn from our community.',
      marketplace: 'Explore forex trading tools, EAs, and indicators on YoForex marketplace. Find quality resources to improve your trading.',
      brokers: 'Compare and review forex brokers on YoForex. Read real user experiences and make informed decisions.',
      ea: 'Discover expert advisors and automated trading solutions on YoForex. Enhance your trading with proven tools.',
    };

    return templates[section] || `Explore ${section} on YoForex - Your trusted forex trading community and resource hub.`;
  } catch {
    return 'YoForex - Forex trading community, tools, and resources for traders worldwide.';
  }
}

export async function fixMeta(issue: SeoIssue): Promise<FixResult> {
  try {
    const before = {
      pageUrl: issue.pageUrl,
      title: issue.issueType.includes('title') ? null : undefined,
      metaDescription: issue.issueType.includes('description') ? null : undefined,
      issueType: issue.issueType,
    };

    const overrideData: any = {
      pageUrl: issue.pageUrl,
      appliedBy: 'system',
      active: true,
    };

    if (issue.issueType === 'missing_title' || issue.issueType === 'duplicate_title') {
      const baseTitle = generateTitleFromUrl(issue.pageUrl);
      if (issue.issueType === 'duplicate_title') {
        const timestamp = new Date().toISOString().split('T')[0];
        overrideData.title = `${baseTitle} - ${timestamp}`;
      } else {
        overrideData.title = baseTitle;
      }
    }

    if (issue.issueType === 'missing_meta_description' || issue.issueType === 'duplicate_meta_description') {
      const baseDescription = generateMetaDescription(issue.pageUrl, issue.issueType);
      if (issue.issueType === 'duplicate_meta_description') {
        overrideData.metaDescription = `${baseDescription} Page: ${issue.pageUrl}`;
      } else {
        overrideData.metaDescription = baseDescription;
      }
    }

    await db.insert(seoOverrides).values(overrideData);

    const after = {
      pageUrl: issue.pageUrl,
      title: overrideData.title,
      metaDescription: overrideData.metaDescription,
      appliedVia: 'seo_overrides',
    };

    return {
      success: true,
      before,
      after,
    };
  } catch (error) {
    return {
      success: false,
      before: { pageUrl: issue.pageUrl },
      after: {},
      error: error instanceof Error ? error.message : 'Failed to apply meta fix',
    };
  }
}
