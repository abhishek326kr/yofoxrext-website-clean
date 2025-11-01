import { db } from '../../db';
import { seoOverrides } from '../../../shared/schema';
import type { SeoIssue } from '../../../shared/schema';
import type { FixResult } from './canonical-fix';

export async function fixViewport(issue: SeoIssue): Promise<FixResult> {
  try {
    const before = {
      pageUrl: issue.pageUrl,
      viewport: null,
      issueType: issue.issueType,
    };

    const viewportContent = 'width=device-width, initial-scale=1';

    await db.insert(seoOverrides).values({
      pageUrl: issue.pageUrl,
      viewport: viewportContent,
      appliedBy: 'system',
      active: true,
    });

    const after = {
      pageUrl: issue.pageUrl,
      viewport: viewportContent,
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
      error: error instanceof Error ? error.message : 'Failed to apply viewport fix',
    };
  }
}
