import crypto from 'crypto';
import { db } from '../db';
import { 
  emailNotifications, 
  emailEvents,
  emailPreferences,
  unsubscribeTokens,
  users,
  type EmailNotification,
  type InsertEmailEvent,
  type InsertUnsubscribeToken
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

// Configuration
const CONFIG = {
  BASE_URL: process.env.BASE_URL || 'https://yoforex.com',
  TRACKING_DOMAIN: process.env.TRACKING_DOMAIN || process.env.BASE_URL || 'https://yoforex.com',
  PIXEL_CACHE_CONTROL: 'no-store, no-cache, must-revalidate, proxy-revalidate',
  LINK_EXPIRY_DAYS: 30,
};

// 1x1 transparent GIF (base64 encoded)
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * Email Tracking Service - Comprehensive tracking for email opens, clicks, and unsubscribes
 */
export const emailTrackingService = {
  /**
   * 1. Generate unique tracking ID for each email
   */
  generateTrackingId(): string {
    return crypto.randomBytes(16).toString('hex');
  },

  /**
   * 2. Generate unique unsubscribe token
   */
  generateUnsubscribeToken(): string {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * 3. Hash token for secure storage
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * 4. Insert tracking pixel into HTML email content
   */
  insertTrackingPixel(htmlContent: string, trackingId: string): string {
    const pixelUrl = `${CONFIG.TRACKING_DOMAIN}/api/email/track/open/${trackingId}`;
    const pixelHtml = `
      <img src="${pixelUrl}" 
           alt="" 
           width="1" 
           height="1" 
           style="display:block;width:1px;height:1px;border:0;opacity:0;position:absolute;" 
           loading="eager" />
    `;
    
    // Insert pixel before closing body tag if exists, otherwise append
    const bodyCloseIndex = htmlContent.lastIndexOf('</body>');
    if (bodyCloseIndex > -1) {
      return htmlContent.slice(0, bodyCloseIndex) + pixelHtml + htmlContent.slice(bodyCloseIndex);
    }
    return htmlContent + pixelHtml;
  },

  /**
   * 5. Wrap trackable links in email content
   */
  wrapTrackableLinks(htmlContent: string, trackingId: string): string {
    // Track mapping of link IDs to URLs
    const linkMap = new Map<string, string>();
    let linkCounter = 0;

    // Regular expression to match href attributes
    const hrefRegex = /href=["']([^"']+)["']/gi;
    
    const wrappedContent = htmlContent.replace(hrefRegex, (match, url) => {
      // Skip certain URLs from tracking
      if (
        url.startsWith('#') || 
        url.startsWith('mailto:') || 
        url.startsWith('tel:') ||
        url.includes('/unsubscribe') || // Don't double-track unsubscribe links
        url.includes('/api/email/track') // Don't track existing tracking links
      ) {
        return match;
      }

      // Generate link ID
      linkCounter++;
      const linkId = crypto.randomBytes(8).toString('hex');
      linkMap.set(linkId, url);

      // Create tracked URL
      const trackedUrl = `${CONFIG.TRACKING_DOMAIN}/api/email/track/click/${trackingId}/${linkId}?url=${encodeURIComponent(url)}`;
      
      return `href="${trackedUrl}"`;
    });

    return wrappedContent;
  },

  /**
   * 6. Add unsubscribe link to email content
   */
  addUnsubscribeLink(htmlContent: string, unsubscribeToken: string, recipientEmail: string): string {
    const unsubscribeUrl = `${CONFIG.BASE_URL}/unsubscribe/${unsubscribeToken}`;
    const unsubscribeHtml = `
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">
          Not interested in these emails? 
          <a href="${unsubscribeUrl}" style="color: #2563eb; text-decoration: underline;">Unsubscribe</a>
          or 
          <a href="${CONFIG.BASE_URL}/settings/notifications" style="color: #2563eb; text-decoration: underline;">Manage Preferences</a>
        </p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #9ca3af;">
          This email was sent to ${recipientEmail}
        </p>
      </div>
    `;

    // Insert before footer or closing body tag
    const footerIndex = htmlContent.indexOf('<!-- Footer -->');
    if (footerIndex > -1) {
      return htmlContent.slice(0, footerIndex) + unsubscribeHtml + htmlContent.slice(footerIndex);
    }

    const bodyCloseIndex = htmlContent.lastIndexOf('</div></body>');
    if (bodyCloseIndex > -1) {
      return htmlContent.slice(0, bodyCloseIndex) + unsubscribeHtml + htmlContent.slice(bodyCloseIndex);
    }

    return htmlContent + unsubscribeHtml;
  },

  /**
   * 7. Record email open event
   */
  async recordOpen(trackingId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      // Find the email notification by tracking ID
      const [notification] = await db.select()
        .from(emailNotifications)
        .where(eq(emailNotifications.id, trackingId))
        .limit(1);

      if (!notification) {
        console.error(`Tracking ID not found: ${trackingId}`);
        return;
      }

      // Update open count and timestamp
      await db.update(emailNotifications)
        .set({
          openedAt: notification.openedAt || new Date(),
          openCount: (notification.openCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(emailNotifications.id, trackingId));

      // Record open event
      await db.insert(emailEvents).values({
        notificationId: trackingId,
        eventType: 'open',
        ipAddress,
        userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
          openCount: (notification.openCount || 0) + 1
        }
      });

      console.log(`Email opened: ${trackingId}, count: ${(notification.openCount || 0) + 1}`);
    } catch (error) {
      console.error('Error recording email open:', error);
    }
  },

  /**
   * 8. Record link click event
   */
  async recordClick(
    trackingId: string, 
    linkId: string, 
    url: string,
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    try {
      // Find the email notification
      const [notification] = await db.select()
        .from(emailNotifications)
        .where(eq(emailNotifications.id, trackingId))
        .limit(1);

      if (!notification) {
        console.error(`Tracking ID not found: ${trackingId}`);
        return;
      }

      // Update click count and timestamp
      await db.update(emailNotifications)
        .set({
          clickedAt: notification.clickedAt || new Date(),
          clickCount: (notification.clickCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(emailNotifications.id, trackingId));

      // Record click event with link details
      await db.insert(emailEvents).values({
        notificationId: trackingId,
        eventType: 'click',
        ipAddress,
        userAgent,
        metadata: {
          linkId,
          url,
          timestamp: new Date().toISOString(),
          clickCount: (notification.clickCount || 0) + 1
        }
      });

      console.log(`Link clicked: ${trackingId}, link: ${linkId}, url: ${url}`);
    } catch (error) {
      console.error('Error recording link click:', error);
    }
  },

  /**
   * 9. Record unsubscribe event
   */
  async recordUnsubscribe(
    token: string,
    reason?: string,
    feedback?: string,
    ipAddress?: string
  ): Promise<{ success: boolean; userId?: string; email?: string }> {
    try {
      const tokenHash = this.hashToken(token);
      
      // Find and validate token
      const [tokenRecord] = await db.select()
        .from(unsubscribeTokens)
        .where(and(
          eq(unsubscribeTokens.tokenHash, tokenHash),
          eq(unsubscribeTokens.used, false)
        ))
        .limit(1);

      if (!tokenRecord) {
        return { success: false };
      }

      // Check if token is expired (30 days)
      const expiryDate = new Date(tokenRecord.createdAt);
      expiryDate.setDate(expiryDate.getDate() + CONFIG.LINK_EXPIRY_DAYS);
      if (new Date() > expiryDate) {
        return { success: false };
      }

      // Mark token as used
      await db.update(unsubscribeTokens)
        .set({
          used: true,
          usedAt: new Date(),
          usedFromIp: ipAddress,
          reason,
          feedback
        })
        .where(eq(unsubscribeTokens.id, tokenRecord.id));

      // Update user email preferences
      await db.update(users)
        .set({
          emailNotifications: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, tokenRecord.userId));

      // Update email preferences table
      await db.update(emailPreferences)
        .set({
          socialInteractions: false,
          coinTransactions: false,
          contentUpdates: false,
          engagementDigest: false,
          marketplaceActivities: false,
          unsubscribedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(emailPreferences.userId, tokenRecord.userId));

      // Record unsubscribe event
      if (tokenRecord.notificationId) {
        await db.insert(emailEvents).values({
          notificationId: tokenRecord.notificationId,
          eventType: 'unsubscribe',
          ipAddress,
          metadata: {
            reason,
            feedback,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Get user email for confirmation
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, tokenRecord.userId))
        .limit(1);

      console.log(`User unsubscribed: ${tokenRecord.userId}`);
      return { 
        success: true, 
        userId: tokenRecord.userId,
        email: user?.email || undefined
      };
    } catch (error) {
      console.error('Error processing unsubscribe:', error);
      return { success: false };
    }
  },

  /**
   * 10. Update email preferences for specific categories
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<{
      socialInteractions: boolean;
      coinTransactions: boolean;
      contentUpdates: boolean;
      engagementDigest: boolean;
      marketplaceActivities: boolean;
      digestFrequency: 'instant' | 'daily' | 'weekly';
    }>
  ): Promise<boolean> {
    try {
      // Check if preferences exist
      const [existing] = await db.select()
        .from(emailPreferences)
        .where(eq(emailPreferences.userId, userId))
        .limit(1);

      if (existing) {
        // Update existing preferences
        await db.update(emailPreferences)
          .set({
            ...preferences,
            updatedAt: new Date()
          })
          .where(eq(emailPreferences.userId, userId));
      } else {
        // Create new preferences
        await db.insert(emailPreferences).values({
          userId,
          ...preferences
        });
      }

      // Update main user flag if all categories are disabled
      const allDisabled = preferences.socialInteractions === false &&
                         preferences.coinTransactions === false &&
                         preferences.contentUpdates === false &&
                         preferences.engagementDigest === false &&
                         preferences.marketplaceActivities === false;

      if (allDisabled) {
        await db.update(users)
          .set({ 
            emailNotifications: false,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
      }

      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  },

  /**
   * 11. Get tracking statistics for an email
   */
  async getTrackingStats(notificationId: string): Promise<{
    sent: boolean;
    opened: boolean;
    clicked: boolean;
    unsubscribed: boolean;
    openCount: number;
    clickCount: number;
    firstOpenedAt?: Date;
    firstClickedAt?: Date;
    links: Array<{ url: string; clicks: number }>;
  }> {
    try {
      // Get notification details
      const [notification] = await db.select()
        .from(emailNotifications)
        .where(eq(emailNotifications.id, notificationId))
        .limit(1);

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Get all events for this notification
      const events = await db.select()
        .from(emailEvents)
        .where(eq(emailEvents.notificationId, notificationId));

      // Analyze events
      const stats = {
        sent: notification.status === 'sent',
        opened: notification.openCount > 0,
        clicked: notification.clickCount > 0,
        unsubscribed: events.some(e => e.eventType === 'unsubscribe'),
        openCount: notification.openCount || 0,
        clickCount: notification.clickCount || 0,
        firstOpenedAt: notification.openedAt || undefined,
        firstClickedAt: notification.clickedAt || undefined,
        links: [] as Array<{ url: string; clicks: number }>
      };

      // Aggregate link clicks
      const linkClicks = new Map<string, number>();
      events
        .filter(e => e.eventType === 'click' && e.metadata?.url)
        .forEach(e => {
          if (e.metadata?.url) {
            const url = e.metadata.url as string;
            linkClicks.set(url, (linkClicks.get(url) || 0) + 1);
          }
        });

      stats.links = Array.from(linkClicks.entries())
        .map(([url, clicks]) => ({ url, clicks }))
        .sort((a, b) => b.clicks - a.clicks);

      return stats;
    } catch (error) {
      console.error('Error getting tracking stats:', error);
      throw error;
    }
  },

  /**
   * 12. Get campaign statistics
   */
  async getCampaignStats(
    templateKey?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalUnsubscribed: number;
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
  }> {
    try {
      // Build where conditions
      const conditions = [eq(emailNotifications.status, 'sent')];
      if (templateKey) {
        conditions.push(eq(emailNotifications.templateKey, templateKey));
      }

      const [result] = await db.select({
        count: sql<number>`count(*)`,
        openSum: sql<number>`sum(${emailNotifications.openCount})`,
        clickSum: sql<number>`sum(${emailNotifications.clickCount})`,
        openedCount: sql<number>`count(case when ${emailNotifications.openCount} > 0 then 1 end)`,
        clickedCount: sql<number>`count(case when ${emailNotifications.clickCount} > 0 then 1 end)`
      })
      .from(emailNotifications)
      .where(and(...conditions));

      // Count unsubscribes
      const [unsubscribeResult] = await db.select({
        count: sql<number>`count(distinct ${emailEvents.notificationId})`
      })
      .from(emailEvents)
      .where(eq(emailEvents.eventType, 'unsubscribe'));

      const totalSent = Number(result?.count || 0);
      const totalOpened = Number(result?.openedCount || 0);
      const totalClicked = Number(result?.clickedCount || 0);
      const totalUnsubscribed = Number(unsubscribeResult?.count || 0);

      return {
        totalSent,
        totalOpened,
        totalClicked,
        totalUnsubscribed,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        unsubscribeRate: totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting campaign stats:', error);
      throw error;
    }
  },

  /**
   * 13. Clean up expired tracking data (GDPR compliance)
   */
  async cleanupExpiredData(daysToKeep: number = 90): Promise<{
    deletedEvents: number;
    deletedTokens: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Delete old email events
      const deletedEvents = await db.delete(emailEvents)
        .where(sql`${emailEvents.createdAt} < ${cutoffDate}`);

      // Delete old unused unsubscribe tokens
      const deletedTokens = await db.delete(unsubscribeTokens)
        .where(and(
          eq(unsubscribeTokens.used, false),
          sql`${unsubscribeTokens.createdAt} < ${cutoffDate}`
        ));

      console.log(`Cleaned up ${deletedEvents} events and ${deletedTokens} tokens older than ${daysToKeep} days`);
      
      return {
        deletedEvents: deletedEvents.rowCount || 0,
        deletedTokens: deletedTokens.rowCount || 0
      };
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
      throw error;
    }
  }
};

// Export pixel buffer for direct use in routes
export { TRACKING_PIXEL };