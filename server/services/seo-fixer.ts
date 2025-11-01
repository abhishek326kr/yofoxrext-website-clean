import { db } from '../db';
import { seoIssues } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import type { SeoIssue } from '../../shared/schema';
import {
  fixCanonical,
  fixMeta,
  fixViewport,
  fixSitemap,
  fixRobots,
  type FixResult,
} from './seo-fixes';

export class SeoFixOrchestrator {
  async getIssueById(issueId: string): Promise<SeoIssue | undefined> {
    const [issue] = await db
      .select()
      .from(seoIssues)
      .where(eq(seoIssues.id, issueId))
      .limit(1);
    
    return issue;
  }

  async fixIssue(issueId: string): Promise<FixResult> {
    const issue = await this.getIssueById(issueId);
    
    if (!issue) {
      return {
        success: false,
        before: {},
        after: {},
        error: 'Issue not found',
      };
    }

    switch (issue.issueType) {
      case 'missing_canonical':
        return await fixCanonical(issue);
      
      case 'missing_meta_description':
      case 'missing_title':
      case 'duplicate_meta_description':
      case 'duplicate_title':
        return await fixMeta(issue);
      
      case 'no_mobile_viewport':
      case 'missing_mobile_viewport':
        return await fixViewport(issue);
      
      case 'sitemap_error':
        return await fixSitemap(issue);
      
      case 'missing_robots_txt':
        return await fixRobots(issue);
      
      default:
        return {
          success: false,
          before: { issueType: issue.issueType },
          after: {},
          error: `No auto-fix available for issue type: ${issue.issueType}`,
        };
    }
  }

  async fixMultiple(issueIds: string[]): Promise<FixResult[]> {
    const results: FixResult[] = [];
    
    for (const id of issueIds) {
      const result = await this.fixIssue(id);
      results.push(result);
    }
    
    return results;
  }
}

export const seoFixOrchestrator = new SeoFixOrchestrator();
