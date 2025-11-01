import { db } from '../db';
import { seoScans, seoIssues, seoMetrics } from '../../shared/schema';
import { SEO_ISSUE_TAXONOMY, getIssueDefinition } from './seo-taxonomy';
import * as cheerio from 'cheerio';
import { eq } from 'drizzle-orm';

export interface ScanOptions {
  scanType: 'full' | 'delta' | 'single-page';
  urls?: string[];
  triggeredBy: 'cron' | 'manual' | 'post-publish';
}

export interface SeoCheckResult {
  issueType: string;
  pageUrl: string;
  pageTitle?: string;
  description: string;
  metadata?: Record<string, any>;
}

class SeoScanner {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  }

  /**
   * Start a new SEO scan
   */
  async startScan(options: ScanOptions): Promise<string> {
    const [scan] = await db.insert(seoScans).values({
      scanType: options.scanType,
      triggeredBy: options.triggeredBy,
      status: 'running',
      metadata: { urlList: options.urls },
    }).returning();

    this.runScan(scan.id, options).catch(console.error);

    return scan.id;
  }

  /**
   * Run the actual scan
   */
  private async runScan(scanId: string, options: ScanOptions): Promise<void> {
    try {
      const urls = options.urls || await this.getUrlsToScan(options.scanType);
      
      let totalIssues = 0;
      const allIssues: SeoCheckResult[] = [];

      for (const url of urls) {
        const issues = await this.scanUrl(url);
        allIssues.push(...issues);
        
        for (const issue of issues) {
          const definition = getIssueDefinition(issue.issueType);
          if (!definition) continue;

          await db.insert(seoIssues).values({
            scanId,
            category: definition.category,
            issueType: issue.issueType,
            severity: definition.severity,
            status: 'active',
            pageUrl: issue.pageUrl,
            pageTitle: issue.pageTitle,
            description: issue.description,
            autoFixable: definition.autoFixable,
            metadata: issue.metadata,
          });

          totalIssues++;
        }
      }

      await db.update(seoScans)
        .set({
          status: 'completed',
          pagesScanned: urls.length,
          issuesFound: totalIssues,
          completedAt: new Date(),
        })
        .where(eq(seoScans.id, scanId));

      await this.calculateMetrics(allIssues);

    } catch (error) {
      console.error('SEO scan failed:', error);
      await db.update(seoScans)
        .set({ status: 'failed', completedAt: new Date() })
        .where(eq(seoScans.id, scanId));
    }
  }

  /**
   * Get list of URLs to scan
   */
  private async getUrlsToScan(scanType: 'full' | 'delta' | 'single-page'): Promise<string[]> {
    return [
      `${this.baseUrl}/`,
      `${this.baseUrl}/forum`,
      `${this.baseUrl}/marketplace`,
      `${this.baseUrl}/brokers`,
      `${this.baseUrl}/about`,
    ];
  }

  /**
   * Scan a single URL for SEO issues
   */
  private async scanUrl(url: string): Promise<SeoCheckResult[]> {
    const issues: SeoCheckResult[] = [];

    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('title').text();

      const metaDesc = $('meta[name="description"]').attr('content');
      if (!metaDesc || metaDesc.trim() === '') {
        issues.push({
          issueType: 'missing_meta_description',
          pageUrl: url,
          pageTitle: title,
          description: 'Page is missing meta description tag',
        });
      }

      if (!title || title.trim() === '') {
        issues.push({
          issueType: 'missing_title',
          pageUrl: url,
          description: 'Page is missing title tag',
        });
      }

      const canonical = $('link[rel="canonical"]').attr('href');
      if (!canonical) {
        issues.push({
          issueType: 'missing_canonical',
          pageUrl: url,
          pageTitle: title,
          description: 'Page is missing canonical URL',
          metadata: { suggestion: url },
        });
      }

      const h1Count = $('h1').length;
      if (h1Count === 0) {
        issues.push({
          issueType: 'missing_h1',
          pageUrl: url,
          pageTitle: title,
          description: 'Page is missing H1 tag',
        });
      } else if (h1Count > 1) {
        issues.push({
          issueType: 'multiple_h1',
          pageUrl: url,
          pageTitle: title,
          description: `Page has ${h1Count} H1 tags (should have only one)`,
        });
      }

      $('img').each((_, img) => {
        const alt = $(img).attr('alt');
        const src = $(img).attr('src');
        if (!alt || alt.trim() === '') {
          issues.push({
            issueType: 'missing_image_alt',
            pageUrl: url,
            pageTitle: title,
            description: `Image missing alt text: ${src}`,
            metadata: { imageSrc: src },
          });
        }
      });

      const viewport = $('meta[name="viewport"]').attr('content');
      if (!viewport) {
        issues.push({
          issueType: 'no_mobile_viewport',
          pageUrl: url,
          pageTitle: title,
          description: 'Page is missing mobile viewport meta tag',
        });
      }

      const jsonLd = $('script[type="application/ld+json"]').length;
      if (jsonLd === 0) {
        issues.push({
          issueType: 'missing_structured_data',
          pageUrl: url,
          pageTitle: title,
          description: 'Page is missing Schema.org structured data',
        });
      }

    } catch (error) {
      console.error(`Failed to scan URL ${url}:`, error);
    }

    return issues;
  }

  /**
   * Calculate SEO metrics and store them
   */
  private async calculateMetrics(issues: SeoCheckResult[]): Promise<void> {
    const criticalCount = issues.filter(i => {
      const def = getIssueDefinition(i.issueType);
      return def?.severity === 'critical';
    }).length;

    const highCount = issues.filter(i => {
      const def = getIssueDefinition(i.issueType);
      return def?.severity === 'high';
    }).length;

    const mediumCount = issues.filter(i => {
      const def = getIssueDefinition(i.issueType);
      return def?.severity === 'medium';
    }).length;

    const lowCount = issues.filter(i => {
      const def = getIssueDefinition(i.issueType);
      return def?.severity === 'low';
    }).length;

    const overallScore = Math.max(0, 100 - (criticalCount * 15) - (highCount * 7) - (mediumCount * 3) - (lowCount * 1));
    
    await db.insert(seoMetrics).values({
      overallScore,
      technicalScore: Math.max(0, 100 - (criticalCount * 10)),
      contentScore: Math.max(0, 100 - (highCount * 8)),
      performanceScore: 80,
      totalIssues: issues.length,
      criticalIssues: criticalCount,
      highIssues: highCount,
      mediumIssues: mediumCount,
      lowIssues: lowCount,
    });
  }
}

export const seoScanner = new SeoScanner();
