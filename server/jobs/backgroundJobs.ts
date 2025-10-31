import cron from 'node-cron';
import type { IStorage } from '../storage';
import { calculateEngagementScore, calculateUserReputation, calculateSalesScore } from '../utils/rankingAlgorithm';
import { startEmailQueueProcessor } from '../services/emailQueue';

export function startBackgroundJobs(storage: IStorage) {
  console.log('[JOBS] Background jobs DISABLED for performance optimization');
  console.log('[JOBS] No background jobs running - reducing CPU/memory usage');
  
  // Start Email Queue Processor
  console.log('[EMAIL QUEUE] Starting email queue processor...');
  startEmailQueueProcessor();
  console.log('[EMAIL QUEUE] Email queue processor started successfully');
  
  // Sitemap Generation Job - Runs every 24 hours (ENABLED)
  cron.schedule('0 2 * * *', async () => { // Runs at 2 AM daily
    try {
      console.log('[SITEMAP JOB] Starting automated sitemap generation...');
      
      const { SitemapGenerator } = await import('../services/sitemap-generator.js');
      const { SitemapSubmissionService } = await import('../services/sitemap-submission.js');
      const { sitemapLogs } = await import('@shared/schema');
      const { db } = await import('../db');
      
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000';
      const generator = new SitemapGenerator(baseUrl);
      const submissionService = new SitemapSubmissionService(baseUrl);

      // Generate sitemap
      const { xml, urlCount } = await generator.generateSitemap();

      // Save to public directory
      const fs = await import('fs/promises');
      const path = await import('path');
      const publicDir = path.join(process.cwd(), 'public');
      await fs.mkdir(publicDir, { recursive: true });
      await fs.writeFile(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');

      // Log generation
      await db.insert(sitemapLogs).values({
        action: 'generate',
        status: 'success',
        urlCount,
        submittedTo: null,
      });

      console.log(`[SITEMAP JOB] Generated sitemap with ${urlCount} URLs`);

      // Submit to search engines
      const sitemapUrl = `${baseUrl}/sitemap.xml`;
      const allUrls = xml.match(/<loc>(.*?)<\/loc>/g)?.map(loc => 
        loc.replace('<loc>', '').replace('</loc>', '')
      ) || [];

      // Submit to IndexNow
      const indexNowResult = await submissionService.submitToIndexNow(allUrls);
      console.log('[SITEMAP JOB] IndexNow submission:', indexNowResult.success ? 'Success' : indexNowResult.error);

      // Ping Google
      const googleResult = await submissionService.pingGoogle(sitemapUrl);
      console.log('[SITEMAP JOB] Google ping:', googleResult.success ? 'Success' : googleResult.error);

      console.log('[SITEMAP JOB] Completed successfully');
    } catch (error: any) {
      console.error('[SITEMAP JOB] Error during automated generation:', error);
      
      // Log error
      try {
        const { sitemapLogs } = await import('@shared/schema');
        const { db } = await import('../db');
        await db.insert(sitemapLogs).values({
          action: 'generate',
          status: 'error',
          urlCount: null,
          submittedTo: null,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (logError) {
        console.error('[SITEMAP JOB] Failed to log error:', logError);
      }
    }
  });

  console.log('[JOBS] Sitemap generation scheduled (runs daily at 2 AM)');
  
  // NOTE: All other background jobs are disabled to improve performance
  // To re-enable, uncomment the cron schedules below:
  
  // Update thread engagement scores every 60 minutes
  // cron.schedule('0 * * * *', async () => {
  //   console.log('[JOBS] Updating thread engagement scores...');
  //   try {
  //     await updateThreadScores(storage);
  //   } catch (error) {
  //     console.error('[JOBS] Error updating thread scores:', error);
  //   }
  // });

  // Update user reputation scores every 5 minutes
  // cron.schedule('*_/5 * * * *', async () => {
  //   console.log('[JOBS] Updating user reputation scores...');
  //   try {
  //     await updateUserReputations(storage);
  //   } catch (error) {
  //     console.error('[JOBS] Error updating user reputations:', error);
  //   }
  // });

  // Update top seller scores every 15 minutes
  // cron.schedule('*_/15 * * * *', async () => {
  //   console.log('[JOBS] Updating top seller scores...');
  //   try {
  //     await updateTopSellerScores(storage);
  //   } catch (error) {
  //     console.error('[JOBS] Error updating top seller scores:', error);
  //   }
  // });

  // Initial calculation on startup
  // setTimeout(async () => {
  //   try {
  //     await updateThreadScores(storage);
  //     await updateUserReputations(storage);
  //     await updateTopSellerScores(storage);
  //     console.log('[JOBS] Initial score calculations complete');
  //   } catch (error) {
  //     console.error('[JOBS] Error in initial calculations:', error);
  //   }
  // }, 5000);
}

async function updateThreadScores(storage: IStorage) {
  // Get all forum threads
  const threads = await storage.getAllForumThreads();
  let updated = 0;

  for (const thread of threads) {
    try {
      // Get author reputation
      const author = await storage.getUserById(thread.authorId);
      const authorReputation = author?.reputationScore || 0;

      // Calculate engagement score
      const score = calculateEngagementScore({
        views: thread.views,
        replies: thread.replyCount,
        helpfulVotes: thread.helpfulVotes || 0,
        bookmarks: thread.bookmarkCount || 0,
        shares: thread.shareCount || 0,
        recency: thread.createdAt,
        authorReputation
      });

      // Update thread score
      await storage.updateThreadScore(thread.id, score);
      updated++;
    } catch (error) {
      console.error(`[JOBS] Error updating score for thread ${thread.id}:`, error);
    }
  }

  console.log(`[JOBS] Updated ${updated} thread scores`);
}

async function updateUserReputations(storage: IStorage) {
  // Get all users
  const users = await storage.getAllUsers();
  let updated = 0;

  for (const user of users) {
    try {
      // Get user statistics
      const stats = await storage.getUserStats(user.id);

      // Calculate reputation score
      const reputation = calculateUserReputation({
        threadsCreated: stats.threadsCreated,
        repliesPosted: stats.repliesPosted,
        helpfulVotes: stats.helpfulVotes,
        bestAnswers: stats.bestAnswers || 0,
        contentSales: stats.contentSales || 0,
        followersCount: stats.followersCount || 0,
        uploadsCount: stats.uploadsCount || 0,
        verifiedTrader: user.isVerifiedTrader || false
      });

      // Update user reputation
      await storage.updateUserReputation(user.id, reputation);
      updated++;
    } catch (error) {
      console.error(`[JOBS] Error updating reputation for user ${user.id}:`, error);
    }
  }

  console.log(`[JOBS] Updated ${updated} user reputations`);
}

async function updateTopSellerScores(storage: IStorage) {
  // Get all content (EAs, Indicators, etc.)
  const allContent = await storage.getAllContent();
  let updated = 0;

  for (const content of allContent) {
    try {
      // Get sales statistics
      const salesStats = await storage.getContentSalesStats(content.id);

      // Calculate sales score
      const score = calculateSalesScore({
        totalSales: salesStats.totalSales,
        priceCoins: content.priceCoins,
        reviewCount: salesStats.reviewCount,
        avgRating: salesStats.avgRating,
        downloads: content.downloads
      });

      // Update content sales score
      await storage.updateContentSalesScore(content.id, score);
      updated++;
    } catch (error) {
      console.error(`[JOBS] Error updating sales score for content ${content.id}:`, error);
    }
  }

  console.log(`[JOBS] Updated ${updated} content sales scores`);
}
