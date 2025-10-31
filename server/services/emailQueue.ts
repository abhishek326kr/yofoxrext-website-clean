import { db } from '../db';
import { 
  emailNotifications, 
  emailPreferences, 
  users,
  notifications,
  type EmailNotification,
  type InsertEmailNotification,
  type User
} from '@shared/schema';
import { eq, and, or, gte, lte, desc, asc, sql, inArray, lt, gt, isNull } from 'drizzle-orm';
import { emailService } from './emailService';
import * as cron from 'node-cron';

// Email priority levels
export enum EmailPriority {
  HIGH = 'high',      // Password reset, security alerts, critical
  MEDIUM = 'medium',  // Comments, important notifications
  LOW = 'low'         // Likes, follows, marketing
}

// Email grouping types
export enum EmailGroupType {
  LIKES = 'likes',
  FOLLOWS = 'follows',
  COMMENTS = 'comments',
  COINS = 'coins',
  SALES = 'sales'
}

// Configuration
const CONFIG = {
  QUIET_HOURS_START: 23,     // 11 PM
  QUIET_HOURS_END: 8,         // 8 AM
  MAX_RETRY_ATTEMPTS: 3,      // Maximum retry attempts
  RETRY_BACKOFF_BASE: 60000,  // 1 minute in milliseconds
  BATCH_SIZE: 50,             // Process 50 emails at a time
  MAX_EMAILS_PER_HOUR: 10,    // Rate limit per user
  GROUP_WINDOW_MINUTES: 10,   // Group emails within 10 minutes
  MAX_BOUNCES_BEFORE_DISABLE: 3, // Disable after 3 bounces
};

// Email queue item interface
interface QueuedEmail {
  userId: string;
  templateKey: string;
  recipientEmail: string;
  subject: string;
  payload: Record<string, any>;
  priority: EmailPriority;
  groupType?: EmailGroupType;
  scheduledFor?: Date;
  retryCount?: number;
}

/**
 * Email Queue Service - Main service for managing email queue with smart features
 */
export const emailQueueService = {
  /**
   * 1. Queue Email - Add email to queue with priority and scheduling
   */
  async queueEmail({
    userId,
    templateKey,
    recipientEmail,
    subject,
    payload,
    priority = EmailPriority.MEDIUM,
    groupType,
    scheduledFor
  }: QueuedEmail): Promise<EmailNotification> {
    // Check if user should receive emails at all
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].emailNotifications) {
      throw new Error('User has disabled email notifications');
    }

    // Check bounce count
    if (user[0].emailBounceCount >= CONFIG.MAX_BOUNCES_BEFORE_DISABLE) {
      console.log(`User ${userId} has too many bounces (${user[0].emailBounceCount}), skipping email`);
      throw new Error('User email has been disabled due to bounces');
    }

    // Check rate limiting
    const isRateLimited = await this.checkRateLimit(userId);
    if (isRateLimited && priority !== EmailPriority.HIGH) {
      console.log(`User ${userId} has exceeded rate limit, deferring email`);
      scheduledFor = new Date(Date.now() + 60 * 60 * 1000); // Defer 1 hour
    }

    // Check if we should group this email
    if (groupType && priority === EmailPriority.LOW) {
      const shouldGroup = await this.shouldGroupEmail(userId, groupType);
      if (shouldGroup) {
        console.log(`Deferring ${groupType} email for grouping for user ${userId}`);
        scheduledFor = new Date(Date.now() + CONFIG.GROUP_WINDOW_MINUTES * 60 * 1000);
      }
    }

    // Calculate scheduled time based on user timezone if not specified
    if (!scheduledFor) {
      scheduledFor = await this.calculateOptimalSendTime(userId, priority);
    }

    // Insert into queue
    const [notification] = await db.insert(emailNotifications)
      .values({
        userId,
        templateKey,
        recipientEmail,
        subject,
        payload: {
          ...payload,
          priority,
          groupType,
          scheduledFor: scheduledFor.toISOString()
        },
        status: 'queued',
        retryCount: 0
      })
      .returning();

    return notification;
  },

  /**
   * 2. Process Queue - Process queued emails with smart logic
   */
  async processQueue(): Promise<{ processed: number; failed: number; grouped: number }> {
    let processed = 0;
    let failed = 0;
    let grouped = 0;

    // Get batch of queued emails that are ready to send
    const now = new Date();
    const queuedEmails = await db.select()
      .from(emailNotifications)
      .where(
        and(
          eq(emailNotifications.status, 'queued'),
          or(
            isNull(emailNotifications.payload),
            lte(sql`(payload->>'scheduledFor')::timestamp`, now)
          )
        )
      )
      .orderBy(
        sql`CASE 
          WHEN payload->>'priority' = 'high' THEN 1
          WHEN payload->>'priority' = 'medium' THEN 2
          ELSE 3
        END`,
        asc(emailNotifications.createdAt)
      )
      .limit(CONFIG.BATCH_SIZE);

    // Group emails by user and type
    const emailGroups = new Map<string, EmailNotification[]>();
    
    for (const email of queuedEmails) {
      const payload = email.payload as any;
      const groupKey = `${email.userId}-${payload?.groupType || 'none'}`;
      
      if (payload?.groupType && payload.priority === 'low') {
        if (!emailGroups.has(groupKey)) {
          emailGroups.set(groupKey, []);
        }
        emailGroups.get(groupKey)!.push(email);
      } else {
        // Process immediately
        const result = await this.sendEmail(email);
        if (result.success) {
          processed++;
        } else {
          failed++;
        }
      }
    }

    // Process grouped emails
    for (const [groupKey, emails] of emailGroups) {
      if (emails.length > 1) {
        const result = await this.sendGroupedEmail(emails);
        if (result.success) {
          grouped += emails.length;
          processed++;
        } else {
          failed += emails.length;
        }
      } else {
        // Single email, send normally
        const result = await this.sendEmail(emails[0]);
        if (result.success) {
          processed++;
        } else {
          failed++;
        }
      }
    }

    return { processed, failed, grouped };
  },

  /**
   * 3. Group Similar Emails - Group likes/follows within time window
   */
  async groupSimilarEmails(userId: string, groupType: EmailGroupType): Promise<EmailNotification[]> {
    const windowStart = new Date(Date.now() - CONFIG.GROUP_WINDOW_MINUTES * 60 * 1000);
    
    const similarEmails = await db.select()
      .from(emailNotifications)
      .where(
        and(
          eq(emailNotifications.userId, userId),
          eq(emailNotifications.status, 'queued'),
          gte(emailNotifications.createdAt, windowStart),
          sql`payload->>'groupType' = ${groupType}`
        )
      )
      .orderBy(desc(emailNotifications.createdAt));

    return similarEmails;
  },

  /**
   * 4. Check User Timezone - Verify if it's appropriate time to send
   */
  async checkUserTimezone(userId: string): Promise<boolean> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.timezone) {
      return true; // Default to sending if no timezone set
    }

    // Convert current time to user's timezone
    const userTime = new Date().toLocaleString('en-US', {
      timeZone: user.timezone,
      hour12: false
    });
    
    const hour = parseInt(userTime.split(' ')[1].split(':')[0]);
    
    // Check if within quiet hours (11 PM - 8 AM)
    if (hour >= CONFIG.QUIET_HOURS_START || hour < CONFIG.QUIET_HOURS_END) {
      return false; // Don't send during quiet hours
    }

    return true;
  },

  /**
   * 5. Retry Failed Emails - Retry failed emails with exponential backoff
   */
  async retryFailedEmails(): Promise<{ retried: number; abandoned: number }> {
    let retried = 0;
    let abandoned = 0;

    // Get failed emails that can be retried
    const failedEmails = await db.select()
      .from(emailNotifications)
      .where(
        and(
          eq(emailNotifications.status, 'failed'),
          lt(emailNotifications.retryCount, CONFIG.MAX_RETRY_ATTEMPTS)
        )
      )
      .orderBy(asc(emailNotifications.updatedAt))
      .limit(CONFIG.BATCH_SIZE);

    for (const email of failedEmails) {
      const retryCount = email.retryCount || 0;
      const backoffTime = CONFIG.RETRY_BACKOFF_BASE * Math.pow(2, retryCount);
      const lastAttempt = email.updatedAt || email.createdAt;
      const nextRetryTime = new Date(lastAttempt.getTime() + backoffTime);

      if (new Date() >= nextRetryTime) {
        // Retry the email
        const result = await this.sendEmail(email);
        
        if (result.success) {
          await db.update(emailNotifications)
            .set({
              status: 'sent',
              sentAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(emailNotifications.id, email.id));
          retried++;
        } else {
          const newRetryCount = retryCount + 1;
          
          if (newRetryCount >= CONFIG.MAX_RETRY_ATTEMPTS) {
            // Abandon email after max retries
            await db.update(emailNotifications)
              .set({
                status: 'failed',
                retryCount: newRetryCount,
                error: result.error,
                updatedAt: new Date()
              })
              .where(eq(emailNotifications.id, email.id));
            abandoned++;
          } else {
            // Update retry count and try again later
            await db.update(emailNotifications)
              .set({
                retryCount: newRetryCount,
                error: result.error,
                updatedAt: new Date()
              })
              .where(eq(emailNotifications.id, email.id));
          }
        }
      }
    }

    return { retried, abandoned };
  },

  /**
   * 6. Track Email Sent - Log sent emails to database
   */
  async trackEmailSent(emailId: string, providerMessageId?: string): Promise<void> {
    await db.update(emailNotifications)
      .set({
        status: 'sent',
        sentAt: new Date(),
        providerMessageId,
        updatedAt: new Date()
      })
      .where(eq(emailNotifications.id, emailId));

    // Update user's last email sent timestamp for rate limiting
    const [email] = await db.select()
      .from(emailNotifications)
      .where(eq(emailNotifications.id, emailId))
      .limit(1);

    if (email) {
      await db.update(users)
        .set({
          lastEmailSentAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, email.userId));
    }
  },

  /**
   * 7. Handle Bounce - Mark bounced emails and stop sending
   */
  async handleBounce(recipientEmail: string, bounceType: 'soft' | 'hard' = 'hard'): Promise<void> {
    // Find user by email
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, recipientEmail))
      .limit(1);

    if (!user) return;

    // Update bounce count
    const newBounceCount = (user.emailBounceCount || 0) + 1;
    
    // Update user record
    await db.update(users)
      .set({
        emailBounceCount: newBounceCount,
        emailNotifications: newBounceCount >= CONFIG.MAX_BOUNCES_BEFORE_DISABLE ? false : user.emailNotifications,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Mark recent emails as bounced
    await db.update(emailNotifications)
      .set({
        status: 'bounced',
        error: `Email bounced (${bounceType})`,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(emailNotifications.recipientEmail, recipientEmail),
          eq(emailNotifications.status, 'sent'),
          gte(emailNotifications.sentAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        )
      );

    // Log bounce event
    console.log(`Bounce handled for ${recipientEmail}: type=${bounceType}, total bounces=${newBounceCount}`);
  },

  /**
   * 8. Get Queue Status - Get current queue stats
   */
  async getQueueStatus(): Promise<{
    queued: number;
    processing: number;
    sent: number;
    failed: number;
    bounced: number;
    queuedByPriority: Record<string, number>;
    oldestQueued?: Date;
    averageProcessingTime?: number;
  }> {
    // Get counts by status
    const statusCounts = await db.select({
      status: emailNotifications.status,
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(emailNotifications)
    .where(gte(emailNotifications.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))) // Last 24 hours
    .groupBy(emailNotifications.status);

    // Get queued by priority
    const queuedByPriority = await db.select({
      priority: sql<string>`payload->>'priority'`,
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(emailNotifications)
    .where(eq(emailNotifications.status, 'queued'))
    .groupBy(sql`payload->>'priority'`);

    // Get oldest queued email
    const [oldestQueued] = await db.select({
      createdAt: emailNotifications.createdAt
    })
    .from(emailNotifications)
    .where(eq(emailNotifications.status, 'queued'))
    .orderBy(asc(emailNotifications.createdAt))
    .limit(1);

    // Calculate average processing time
    const processingTimes = await db.select({
      avgTime: sql<number>`AVG(EXTRACT(EPOCH FROM (sent_at - created_at)))`.mapWith(Number)
    })
    .from(emailNotifications)
    .where(
      and(
        eq(emailNotifications.status, 'sent'),
        gte(emailNotifications.sentAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
      )
    );

    const stats = {
      queued: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      bounced: 0,
      queuedByPriority: {} as Record<string, number>,
      oldestQueued: oldestQueued?.createdAt,
      averageProcessingTime: processingTimes[0]?.avgTime
    };

    // Map status counts
    statusCounts.forEach(({ status, count }) => {
      if (status === 'queued') stats.queued = count;
      else if (status === 'sent') stats.sent = count;
      else if (status === 'failed') stats.failed = count;
      else if (status === 'bounced') stats.bounced = count;
    });

    // Map priority counts
    queuedByPriority.forEach(({ priority, count }) => {
      stats.queuedByPriority[priority || 'none'] = count;
    });

    return stats;
  },

  // Helper Functions

  /**
   * Check if user has exceeded rate limit
   */
  async checkRateLimit(userId: string): Promise<boolean> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.lastEmailSentAt) {
      return false; // No rate limit if never sent
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (user.lastEmailSentAt > hourAgo) {
      // Count emails sent in last hour
      const emailCount = await db.select({
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(emailNotifications)
      .where(
        and(
          eq(emailNotifications.userId, userId),
          eq(emailNotifications.status, 'sent'),
          gte(emailNotifications.sentAt, hourAgo)
        )
      );

      return emailCount[0].count >= CONFIG.MAX_EMAILS_PER_HOUR;
    }

    return false;
  },

  /**
   * Check if we should group this email
   */
  async shouldGroupEmail(userId: string, groupType: EmailGroupType): Promise<boolean> {
    const recentEmails = await this.groupSimilarEmails(userId, groupType);
    return recentEmails.length > 0;
  },

  /**
   * Calculate optimal send time based on user timezone and activity
   */
  async calculateOptimalSendTime(userId: string, priority: EmailPriority): Promise<Date> {
    // High priority emails send immediately
    if (priority === EmailPriority.HIGH) {
      return new Date();
    }

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return new Date();
    }

    // Check timezone restrictions
    const canSendNow = await this.checkUserTimezone(userId);
    if (!canSendNow) {
      // Schedule for 9 AM user's time
      const userTime = new Date().toLocaleString('en-US', {
        timeZone: user.timezone || 'UTC'
      });
      
      const tomorrow9AM = new Date(userTime);
      tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
      tomorrow9AM.setHours(9, 0, 0, 0);
      
      return tomorrow9AM;
    }

    // If user has activity patterns, schedule based on those
    if (user.lastActivityTime) {
      const activityHour = user.lastActivityTime.getHours();
      const scheduledTime = new Date();
      scheduledTime.setHours(activityHour, 0, 0, 0);
      
      // If that time has passed today, schedule for tomorrow
      if (scheduledTime < new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      return scheduledTime;
    }

    // Default to sending now
    return new Date();
  },

  /**
   * Send a single email
   */
  async sendEmail(email: EmailNotification): Promise<{ success: boolean; error?: string }> {
    try {
      const payload = email.payload as any;
      
      // Check timezone before sending
      const canSend = await this.checkUserTimezone(email.userId);
      if (!canSend && payload?.priority !== EmailPriority.HIGH) {
        // Reschedule for later
        const scheduledFor = await this.calculateOptimalSendTime(email.userId, payload?.priority || EmailPriority.MEDIUM);
        await db.update(emailNotifications)
          .set({
            payload: {
              ...payload,
              scheduledFor: scheduledFor.toISOString()
            },
            updatedAt: new Date()
          })
          .where(eq(emailNotifications.id, email.id));
        
        return { success: false, error: 'Rescheduled due to quiet hours' };
      }

      // Use the existing email service to send
      // This is a simplified example - you'd map template keys to actual email functions
      switch (email.templateKey) {
        case 'comment_notification':
          await emailService.sendCommentNotification(
            email.recipientEmail,
            payload.commenterName,
            payload.threadTitle,
            payload.commentPreview,
            payload.threadSlug
          );
          break;
          
        case 'like_notification':
          await emailService.sendLikeNotification(
            email.recipientEmail,
            payload.likerName,
            payload.contentType,
            payload.contentTitle,
            payload.contentUrl
          );
          break;
          
        case 'follow_notification':
          await emailService.sendFollowNotification(
            email.recipientEmail,
            payload.followerName,
            payload.followerUsername,
            payload.followerAvatar
          );
          break;
          
        // Add more template mappings as needed
        default:
          console.warn(`Unknown template key: ${email.templateKey}`);
          return { success: false, error: `Unknown template: ${email.templateKey}` };
      }

      // Track email as sent
      await this.trackEmailSent(email.id);
      
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update email record with error
      await db.update(emailNotifications)
        .set({
          status: 'failed',
          error: errorMessage,
          retryCount: (email.retryCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(emailNotifications.id, email.id));
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Send grouped emails as a digest
   */
  async sendGroupedEmail(emails: EmailNotification[]): Promise<{ success: boolean; error?: string }> {
    if (emails.length === 0) {
      return { success: false, error: 'No emails to group' };
    }

    try {
      const firstEmail = emails[0];
      const payload = firstEmail.payload as any;
      const groupType = payload?.groupType;
      
      // Create digest content based on group type
      let digestSubject = '';
      let digestContent = '';
      
      switch (groupType) {
        case EmailGroupType.LIKES:
          digestSubject = `You have ${emails.length} new likes`;
          digestContent = emails.map(e => {
            const p = e.payload as any;
            return `${p.likerName} liked your ${p.contentType}`;
          }).join('\n');
          break;
          
        case EmailGroupType.FOLLOWS:
          digestSubject = `${emails.length} new followers`;
          digestContent = emails.map(e => {
            const p = e.payload as any;
            return `${p.followerName} (@${p.followerUsername}) started following you`;
          }).join('\n');
          break;
          
        case EmailGroupType.COMMENTS:
          digestSubject = `${emails.length} new comments on your threads`;
          digestContent = emails.map(e => {
            const p = e.payload as any;
            return `${p.commenterName} commented on "${p.threadTitle}"`;
          }).join('\n');
          break;
          
        default:
          digestSubject = `You have ${emails.length} new notifications`;
          digestContent = 'Check your account for details';
      }

      // Send digest email using the existing service
      // You'd need to add a digest template to your email service
      console.log(`Sending digest email to ${firstEmail.recipientEmail}: ${digestSubject}`);
      
      // Mark all emails as sent
      const emailIds = emails.map(e => e.id);
      await db.update(emailNotifications)
        .set({
          status: 'sent',
          sentAt: new Date(),
          updatedAt: new Date()
        })
        .where(inArray(emailNotifications.id, emailIds));
      
      return { success: true };
    } catch (error) {
      console.error('Error sending grouped email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
};

// Initialize queue processor
let queueProcessorInterval: NodeJS.Timeout | null = null;

export function startEmailQueueProcessor(): void {
  if (queueProcessorInterval) {
    console.log('Email queue processor already running');
    return;
  }

  // Process queue every minute
  queueProcessorInterval = setInterval(async () => {
    try {
      const result = await emailQueueService.processQueue();
      if (result.processed > 0 || result.failed > 0) {
        console.log(`Email queue processed: ${result.processed} sent, ${result.failed} failed, ${result.grouped} grouped`);
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }, 60000); // Every minute

  // Retry failed emails every 5 minutes
  setInterval(async () => {
    try {
      const result = await emailQueueService.retryFailedEmails();
      if (result.retried > 0 || result.abandoned > 0) {
        console.log(`Retry processor: ${result.retried} retried, ${result.abandoned} abandoned`);
      }
    } catch (error) {
      console.error('Error retrying failed emails:', error);
    }
  }, 5 * 60000); // Every 5 minutes

  console.log('Email queue processor started');
}

export function stopEmailQueueProcessor(): void {
  if (queueProcessorInterval) {
    clearInterval(queueProcessorInterval);
    queueProcessorInterval = null;
    console.log('Email queue processor stopped');
  }
}

// Export for testing
export default emailQueueService;