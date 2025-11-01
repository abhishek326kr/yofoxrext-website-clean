import { db } from '../../db';
import { seoOverrides, seoIssues } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import type { SeoIssue } from '../../../shared/schema';

export interface FixResult {
  success: boolean;
  before: any;
  after: any;
  error?: string;
}

export async function fixCanonical(issue: SeoIssue): Promise<FixResult> {
  try {
    const before = {
      pageUrl: issue.pageUrl,
      canonical: null,
      issueType: issue.issueType,
    };

    const canonicalUrl = `https://yoforex.com${issue.pageUrl}`;

    await db.insert(seoOverrides).values({
      pageUrl: issue.pageUrl,
      canonical: canonicalUrl,
      appliedBy: 'system',
      active: true,
    });

    const after = {
      pageUrl: issue.pageUrl,
      canonical: canonicalUrl,
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
      error: error instanceof Error ? error.message : 'Failed to apply canonical fix',
    };
  }
}
