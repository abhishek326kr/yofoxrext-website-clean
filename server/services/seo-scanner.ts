import { db } from '../db';
import { seoScans, seoIssues, seoMetrics, seoScanHistory } from '../../shared/schema';
import { SEO_ISSUE_TAXONOMY, getIssueDefinition } from './seo-taxonomy';
import * as cheerio from 'cheerio';
import { eq, gte, and } from 'drizzle-orm';

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
  private scanMutex: boolean = false;
  private retryAttempts: Map<string, number> = new Map();
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  }

  /**
   * Check if a scan is currently running
   */
  isScanRunning(): boolean {
    return this.scanMutex;
  }

  /**
   * Acquire scan mutex lock
   */
  private acquireScanLock(): boolean {
    if (this.scanMutex) {
      console.log('[SEO SCANNER] Scan already in progress, mutex lock denied');
      return false;
    }
    this.scanMutex = true;
    console.log('[SEO SCANNER] Scan mutex lock acquired');
    return true;
  }

  /**
   * Release scan mutex lock
   */
  private releaseScanLock(): void {
    this.scanMutex = false;
    console.log('[SEO SCANNER] Scan mutex lock released');
  }

  /**
   * Start a new SEO scan
   */
  async startScan(options: ScanOptions): Promise<string | null> {
    if (!this.acquireScanLock()) {
      console.log('[SEO SCANNER] Cannot start scan - another scan is in progress');
      return null;
    }

    try {
      const [scan] = await db.insert(seoScans).values({
        scanType: options.scanType,
        triggeredBy: options.triggeredBy,
        status: 'running',
        metadata: { urlList: options.urls },
      }).returning();

      this.runScanWithRetry(scan.id, options).catch(console.error);

      return scan.id;
    } catch (error) {
      this.releaseScanLock();
      console.error('[SEO SCANNER] Failed to start scan:', error);
      throw error;
    }
  }

  /**
   * Run scan with exponential backoff retry logic
   */
  private async runScanWithRetry(scanId: string, options: ScanOptions, attemptNumber: number = 1): Promise<void> {
    try {
      await this.runScan(scanId, options);
      this.retryAttempts.delete(scanId);
    } catch (error) {
      console.error(`[SEO SCANNER] Scan attempt ${attemptNumber} failed:`, error);
      
      if (attemptNumber < this.MAX_RETRY_ATTEMPTS) {
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attemptNumber - 1);
        console.log(`[SEO SCANNER] Retrying scan in ${delay}ms (attempt ${attemptNumber + 1}/${this.MAX_RETRY_ATTEMPTS})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.runScanWithRetry(scanId, options, attemptNumber + 1);
      } else {
        console.error(`[SEO SCANNER] Scan failed after ${this.MAX_RETRY_ATTEMPTS} attempts`);
        await db.update(seoScans)
          .set({ status: 'failed', completedAt: new Date() })
          .where(eq(seoScans.id, scanId));
        throw error;
      }
    }
  }

  /**
   * Run the actual scan
   */
  private async runScan(scanId: string, options: ScanOptions): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`[SEO SCANNER] Starting ${options.scanType} scan (ID: ${scanId})`);
      const urls = options.urls || await this.getUrlsToScan(options.scanType);
      
      console.log(`[SEO SCANNER] Scanning ${urls.length} URLs`);
      let totalIssues = 0;
      const allIssues: SeoCheckResult[] = [];

      for (const url of urls) {
        const urlStartTime = Date.now();
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
        
        await this.recordScanHistory(url, scanId, options.triggeredBy, issues.length, Date.now() - urlStartTime);
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
      
      const duration = Date.now() - startTime;
      console.log(`[SEO SCANNER] Scan completed successfully in ${duration}ms - Scanned ${urls.length} URLs, found ${totalIssues} issues`);

    } catch (error) {
      console.error('[SEO SCANNER] Scan failed:', error);
      await db.update(seoScans)
        .set({ status: 'failed', completedAt: new Date() })
        .where(eq(seoScans.id, scanId));
      throw error;
    } finally {
      this.releaseScanLock();
    }
  }

  /**
   * Record scan history for a URL
   */
  private async recordScanHistory(
    url: string,
    scanId: string,
    triggeredBy: 'cron' | 'manual' | 'post-publish',
    issuesFound: number,
    scanDuration: number
  ): Promise<void> {
    try {
      const existing = await db.select()
        .from(seoScanHistory)
        .where(eq(seoScanHistory.url, url))
        .limit(1);

      const now = new Date();

      if (existing.length > 0) {
        await db.update(seoScanHistory)
          .set({
            lastScanAt: now,
            lastScannedBy: triggeredBy,
            scanId,
            issuesFound,
            metadata: {
              scanDuration,
              scanStatus: 'completed',
            },
            updatedAt: now,
          })
          .where(eq(seoScanHistory.url, url));
      } else {
        await db.insert(seoScanHistory).values({
          url,
          lastScanAt: now,
          lastScannedBy: triggeredBy,
          scanId,
          issuesFound,
          metadata: {
            scanDuration,
            scanStatus: 'completed',
          },
        });
      }
    } catch (error) {
      console.error(`[SEO SCANNER] Failed to record scan history for ${url}:`, error);
    }
  }

  /**
   * Get list of URLs to scan
   */
  private async getUrlsToScan(scanType: 'full' | 'delta' | 'single-page'): Promise<string[]> {
    const allUrls = [
      `${this.baseUrl}/`,
      `${this.baseUrl}/discussions`,
      `${this.baseUrl}/marketplace`,
      `${this.baseUrl}/brokers`,
      `${this.baseUrl}/categories`,
      `${this.baseUrl}/members`,
      `${this.baseUrl}/leaderboard`,
    ];

    if (scanType === 'full' || scanType === 'single-page') {
      return allUrls;
    }

    if (scanType === 'delta') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const urlsToScan: string[] = [];
      
      for (const url of allUrls) {
        const history = await db.select()
          .from(seoScanHistory)
          .where(
            and(
              eq(seoScanHistory.url, url),
              gte(seoScanHistory.lastScanAt, oneHourAgo)
            )
          )
          .limit(1);

        if (history.length === 0) {
          urlsToScan.push(url);
        }
      }

      console.log(`[SEO SCANNER] Delta scan: ${urlsToScan.length}/${allUrls.length} URLs need scanning`);
      
      if (urlsToScan.length === 0) {
        console.log('[SEO SCANNER] Delta scan: All URLs recently scanned, skipping');
      }
      
      return urlsToScan;
    }

    return allUrls;
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
