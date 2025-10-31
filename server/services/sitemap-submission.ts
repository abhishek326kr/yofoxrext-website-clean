import { db } from '../db';
import { sitemapLogs } from '@shared/schema';

/**
 * Sitemap Submission Service
 * Handles submission to Google Search Console (via robots.txt + manual),
 * Bing IndexNow, and other search engines
 */
export class SitemapSubmissionService {
  private baseUrl: string;
  private indexNowKey: string | null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.indexNowKey = process.env.INDEXNOW_API_KEY || null;
  }

  /**
   * Submit sitemap to IndexNow (Bing, Yandex instant notification)
   * This notifies search engines immediately about sitemap changes
   */
  async submitToIndexNow(urls: string[]): Promise<{ success: boolean; error?: string }> {
    if (!this.indexNowKey) {
      const message = 'IndexNow API key not configured (set INDEXNOW_API_KEY env variable)';
      await this.logSubmission('submit_indexnow', 'error', null, 'bing,yandex', message);
      return { success: false, error: message };
    }

    try {
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: new URL(this.baseUrl).hostname,
          key: this.indexNowKey,
          keyLocation: `${this.baseUrl}/${this.indexNowKey}.txt`,
          urlList: urls.slice(0, 10000), // IndexNow supports up to 10,000 URLs per request
        }),
      });

      if (response.ok || response.status === 202) {
        await this.logSubmission('submit_indexnow', 'success', urls.length, 'bing,yandex');
        return { success: true };
      } else {
        const errorText = await response.text();
        await this.logSubmission('submit_indexnow', 'error', null, 'bing,yandex', errorText);
        return { success: false, error: `IndexNow API error: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logSubmission('submit_indexnow', 'error', null, 'bing,yandex', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Ping Google about sitemap update
   * Note: Google prefers sitemap in robots.txt, but this provides immediate notification
   */
  async pingGoogle(sitemapUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const response = await fetch(pingUrl);

      if (response.ok) {
        await this.logSubmission('submit_google', 'success', null, 'google');
        return { success: true };
      } else {
        const errorText = await response.text();
        await this.logSubmission('submit_google', 'error', null, 'google', errorText);
        return { success: false, error: `Google ping error: ${response.status}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logSubmission('submit_google', 'error', null, 'google', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Log submission attempt to database
   */
  private async logSubmission(
    action: string,
    status: string,
    urlCount: number | null,
    submittedTo: string,
    errorMessage?: string
  ) {
    try {
      await db.insert(sitemapLogs).values({
        action,
        status,
        urlCount,
        submittedTo,
        errorMessage: errorMessage || null,
      });
    } catch (error) {
      console.error('[Sitemap Submission] Failed to log submission:', error);
    }
  }
}
