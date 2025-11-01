import type { SeoIssue } from '../../../shared/schema';
import { db } from '../../db';
import { seoFixJobs } from '../../../shared/schema';

export async function canHandle(issue: SeoIssue): boolean {
  const aiFixTypes = [
    'missing_meta_description',
    'poor_meta_description',
    'duplicate_meta_description',
    'missing_image_alt',
    'missing_h1',
    'duplicate_h1',
  ];
  return aiFixTypes.includes(issue.issueType);
}

export async function fix(issue: SeoIssue) {
  const [job] = await db.insert(seoFixJobs).values({
    issueId: issue.id,
    fixType: `ai_${issue.issueType}`,
    status: 'pending',
    metadata: {
      pageUrl: issue.pageUrl,
      issueType: issue.issueType,
      issueDetails: issue.metadata,
      queuedAt: new Date().toISOString(),
    },
  }).returning();

  return {
    success: true,
    message: `AI fix job created: ${job.id}. Processing asynchronously...`,
    async: true,
    jobId: job.id,
    before: {},
    after: { jobStatus: 'pending' },
  };
}
