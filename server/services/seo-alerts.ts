import nodemailer from 'nodemailer';
import { db } from '../db';
import { seoIssues, seoAlertHistory, users } from '../../shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

// HTML escape function to prevent XSS in emails
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Truncate text to a max length
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Create SMTP transporter with Hostinger configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Base email template wrapper with YoForex branding
function createEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header with gradient -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">YoForex</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">SEO Monitoring System</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
            © 2025 YoForex. All rights reserved.
          </p>
          <p style="margin: 0;">
            <a href="${process.env.BASE_URL}/admin/seo-marketing" style="color: #2563eb; font-size: 12px; text-decoration: none;">SEO Dashboard</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get admin email addresses for SEO alerts
 * For now, hardcoded admin email - can be extended to query from database later
 */
async function getAdminEmails(): Promise<string[]> {
  // Option 1: Use hardcoded admin email from env
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM_EMAIL;
  if (adminEmail) {
    return [adminEmail];
  }

  // Option 2: Query database for admin users with email
  try {
    const admins = await db.select({ email: users.email })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(5);
    
    return admins.map(a => a.email).filter((email): email is string => !!email);
  } catch (error) {
    console.error('[SEO ALERTS] Error fetching admin emails:', error);
    return [];
  }
}

/**
 * Check if an alert has been sent within the deduplication window (24 hours)
 */
async function hasRecentAlert(issueId: string, notificationType: 'critical_alert' | 'high_priority_digest'): Promise<boolean> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentAlerts = await db.select()
      .from(seoAlertHistory)
      .where(
        and(
          eq(seoAlertHistory.issueId, issueId),
          eq(seoAlertHistory.notificationType, notificationType),
          gte(seoAlertHistory.sentAt, twentyFourHoursAgo)
        )
      )
      .limit(1);

    return recentAlerts.length > 0;
  } catch (error) {
    console.error('[SEO ALERTS] Error checking recent alerts:', error);
    return false;
  }
}

/**
 * Record a sent alert in the history for deduplication
 */
async function recordAlertHistory(
  issueId: string | null,
  notificationType: 'critical_alert' | 'high_priority_digest',
  recipients: string[],
  subject: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await db.insert(seoAlertHistory).values({
      issueId,
      notificationType,
      recipients,
      emailSubject: subject,
      metadata,
    });
    console.log(`[SEO ALERTS] Alert history recorded: ${notificationType}`);
  } catch (error) {
    console.error('[SEO ALERTS] Error recording alert history:', error);
  }
}

/**
 * TASK 10a & 10c: Send immediate email alert for critical SEO issues
 * Template: Critical alert with issue details and auto-fix suggestion
 */
export async function sendCriticalSeoAlert(
  issueId: string,
  issueType: string,
  pageUrl: string,
  pageTitle: string | null,
  description: string,
  autoFixable: boolean,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    // Check deduplication - don't send if already sent within 24 hours
    const hasRecent = await hasRecentAlert(issueId, 'critical_alert');
    if (hasRecent) {
      console.log(`[SEO ALERTS] Skipping critical alert for issue ${issueId} - already sent within 24 hours`);
      return false;
    }

    // Get admin email addresses
    const recipients = await getAdminEmails();
    if (recipients.length === 0) {
      console.error('[SEO ALERTS] No admin emails found - cannot send critical alert');
      return false;
    }

    // Prepare safe values for email
    const safeIssueType = escapeHtml(issueType.replace(/_/g, ' '));
    const safePageUrl = escapeHtml(pageUrl);
    const safePageTitle = pageTitle ? escapeHtml(pageTitle) : 'Untitled Page';
    const safeDescription = escapeHtml(description);
    const suggestion = metadata?.suggestion ? escapeHtml(metadata.suggestion) : null;

    // Build email content
    const content = `
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
        <h2 style="color: #dc2626; margin: 0 0 8px 0; font-size: 20px;">🚨 Critical SEO Issue Detected</h2>
        <p style="color: #991b1b; margin: 0; font-size: 14px;">Immediate attention required</p>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 18px;">Issue Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;"><strong>Issue Type:</strong></td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px;">${safeIssueType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Page:</strong></td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px;">${safePageTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>URL:</strong></td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px;"><a href="${safePageUrl}" style="color: #2563eb; text-decoration: none;">${truncate(safePageUrl, 60)}</a></td>
          </tr>
        </table>
      </div>

      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.6;"><strong>Description:</strong> ${safeDescription}</p>
      </div>

      ${autoFixable && suggestion ? `
        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="color: #1e40af; margin: 0 0 8px 0; font-size: 14px;"><strong>💡 Auto-Fix Available</strong></p>
          <p style="color: #1e3a8a; margin: 0; font-size: 14px;">${suggestion}</p>
        </div>
      ` : ''}

      <div style="margin-top: 32px; text-align: center;">
        <a href="${process.env.BASE_URL}/admin/seo-marketing" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View SEO Dashboard</a>
      </div>

      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.5;">
          <strong>Impact:</strong> Critical SEO issues can significantly affect search engine rankings and organic traffic. Please review and resolve this issue as soon as possible.
        </p>
      </div>
    `;

    const subject = `🚨 Critical SEO Issue: ${truncate(safeIssueType, 50)} on ${safePageTitle}`;
    const html = createEmailTemplate(content);

    // Send email to all admin recipients
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex SEO Monitor'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: recipients.join(', '),
      subject,
      html
    });

    // Record alert in history
    await recordAlertHistory(issueId, 'critical_alert', recipients, subject, {
      issueType,
      pageUrl,
      severity: 'critical',
    });

    console.log(`[SEO ALERTS] Critical alert sent successfully to ${recipients.length} recipient(s)`);
    return true;
  } catch (error) {
    console.error('[SEO ALERTS] Error sending critical alert:', error);
    return false;
  }
}

/**
 * TASK 10a & 10c: Send hourly digest email for high-priority SEO issues
 * Template: Digest of all high-priority issues from the last hour
 */
export async function sendHighPriorityDigest(): Promise<boolean> {
  try {
    // Get high-priority issues from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const highPriorityIssues = await db.select()
      .from(seoIssues)
      .where(
        and(
          eq(seoIssues.severity, 'high'),
          eq(seoIssues.status, 'active'),
          gte(seoIssues.createdAt, oneHourAgo)
        )
      )
      .orderBy(desc(seoIssues.createdAt))
      .limit(50);

    // Skip if no issues found
    if (highPriorityIssues.length === 0) {
      console.log('[SEO ALERTS] No high-priority issues in the last hour - skipping digest');
      return false;
    }

    // Get admin email addresses
    const recipients = await getAdminEmails();
    if (recipients.length === 0) {
      console.error('[SEO ALERTS] No admin emails found - cannot send digest');
      return false;
    }

    // Build issue list HTML
    const issueListHtml = highPriorityIssues.map((issue, index) => {
      const safeIssueType = escapeHtml(issue.issueType.replace(/_/g, ' '));
      const safePageTitle = issue.pageTitle ? escapeHtml(issue.pageTitle) : 'Untitled Page';
      const safePageUrl = escapeHtml(issue.pageUrl);
      const safeDescription = escapeHtml(truncate(issue.description, 120));

      return `
        <div style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'}; padding: 16px; margin-bottom: 12px; border-radius: 6px; border-left: 3px solid #f59e0b;">
          <div style="margin-bottom: 8px;">
            <span style="background: #fbbf24; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">High Priority</span>
            <span style="color: #111827; font-weight: bold; font-size: 15px; margin-left: 8px;">${safeIssueType}</span>
          </div>
          <p style="color: #374151; margin: 8px 0; font-size: 14px;"><strong>Page:</strong> ${safePageTitle}</p>
          <p style="color: #6b7280; margin: 8px 0; font-size: 13px;">${safeDescription}</p>
          <p style="margin: 8px 0 0 0;"><a href="${safePageUrl}" style="color: #2563eb; font-size: 12px; text-decoration: none;">View Page →</a></p>
        </div>
      `;
    }).join('');

    // Count auto-fixable issues
    const autoFixableCount = highPriorityIssues.filter(i => i.autoFixable).length;

    // Build email content
    const content = `
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; margin-bottom: 24px; border-radius: 8px; text-align: center;">
        <h2 style="color: white; margin: 0 0 8px 0; font-size: 24px;">📊 SEO Health Digest</h2>
        <p style="color: #fef3c7; margin: 0; font-size: 14px;">High-Priority Issues - Last Hour</p>
      </div>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <p style="color: #92400e; margin: 0; font-size: 32px; font-weight: bold;">${highPriorityIssues.length}</p>
            <p style="color: #78350f; margin: 4px 0 0 0; font-size: 14px;">Total Issues</p>
          </div>
          <div>
            <p style="color: #92400e; margin: 0; font-size: 32px; font-weight: bold;">${autoFixableCount}</p>
            <p style="color: #78350f; margin: 4px 0 0 0; font-size: 14px;">Auto-Fixable</p>
          </div>
        </div>
      </div>

      <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px;">Issues Detected</h3>
      ${issueListHtml}

      <div style="margin-top: 32px; text-align: center;">
        <a href="${process.env.BASE_URL}/admin/seo-marketing" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Full SEO Dashboard</a>
      </div>

      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.5;">
          This is an automated hourly digest of high-priority SEO issues. You're receiving this because you're an administrator of YoForex.
        </p>
      </div>
    `;

    const subject = `📊 SEO Health Digest - ${highPriorityIssues.length} High-Priority Issue${highPriorityIssues.length !== 1 ? 's' : ''}`;
    const html = createEmailTemplate(content);

    // Send email to all admin recipients
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex SEO Monitor'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: recipients.join(', '),
      subject,
      html
    });

    // Record alert in history (no specific issueId for digest)
    await recordAlertHistory(null, 'high_priority_digest', recipients, subject, {
      issueCount: highPriorityIssues.length,
      autoFixableCount,
      timeRange: 'last_hour',
    });

    console.log(`[SEO ALERTS] High-priority digest sent successfully - ${highPriorityIssues.length} issues`);
    return true;
  } catch (error) {
    console.error('[SEO ALERTS] Error sending high-priority digest:', error);
    return false;
  }
}
