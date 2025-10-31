import nodemailer from 'nodemailer';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { emailNotifications, unsubscribeTokens, users } from '../../shared/schema';
import { emailTrackingService } from './emailTracking';

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
  secure: true, // Use SSL/TLS for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Base email template wrapper with YoForex branding (with tracking support)
async function createEmailTemplate(
  content: string, 
  options?: {
    recipientEmail?: string;
    userId?: string;
    templateKey?: string;
    subject?: string;
  }
): Promise<{ html: string; trackingId?: string; unsubscribeToken?: string }> {
  let finalHtml = `
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
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Your Forex Trading Community</p>
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
            <a href="${process.env.BASE_URL}/settings/notifications" style="color: #2563eb; font-size: 12px; text-decoration: none;">Email Preferences</a>
            <span style="color: #d1d5db; margin: 0 8px;">|</span>
            <a href="${process.env.BASE_URL}/unsubscribe" style="color: #2563eb; font-size: 12px; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  let trackingId: string | undefined;
  let unsubscribeToken: string | undefined;

  // Add tracking if userId is provided
  if (options?.userId && options?.recipientEmail) {
    try {
      // Generate tracking ID
      trackingId = emailTrackingService.generateTrackingId();
      
      // Generate and store unsubscribe token
      unsubscribeToken = emailTrackingService.generateUnsubscribeToken();
      const tokenHash = emailTrackingService.hashToken(unsubscribeToken);
      
      // Store unsubscribe token in database
      await db.insert(unsubscribeTokens).values({
        userId: options.userId,
        tokenHash,
        notificationId: trackingId
      });

      // Create email notification record with tracking ID
      await db.insert(emailNotifications).values({
        id: trackingId, // Use tracking ID as notification ID
        userId: options.userId,
        templateKey: options.templateKey || 'default',
        recipientEmail: options.recipientEmail,
        subject: options.subject || 'YoForex Notification',
        payload: {},
        status: 'queued'
      });

      // Add tracking pixel
      finalHtml = emailTrackingService.insertTrackingPixel(finalHtml, trackingId);

      // Wrap trackable links
      finalHtml = emailTrackingService.wrapTrackableLinks(finalHtml, trackingId);

      // Add unsubscribe link with token
      finalHtml = emailTrackingService.addUnsubscribeLink(finalHtml, unsubscribeToken, options.recipientEmail);

      console.log(`Email prepared with tracking for user ${options.userId}, tracking ID: ${trackingId}`);
    } catch (error) {
      console.error('Error adding email tracking:', error);
      // Continue without tracking if there's an error
    }
  }

  return { html: finalHtml, trackingId, unsubscribeToken };
}

// Helper function to get user ID from email
async function getUserIdFromEmail(email: string): Promise<string | null> {
  try {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID from email:', error);
    return null;
  }
}

export const emailService = {
  // 1. COMMENT NOTIFICATION
  async sendCommentNotification(to: string, commenterName: string, threadTitle: string, commentPreview: string, threadSlug: string): Promise<void> {
    const safeCommenterName = escapeHtml(commenterName);
    const safeThreadTitle = escapeHtml(threadTitle);
    const safeCommentPreview = escapeHtml(truncate(commentPreview, 200));
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💬 New Comment</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeCommenterName}</strong> commented on <strong>"${safeThreadTitle}"</strong>
      </p>
      <div style="background: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6;">${safeCommentPreview}</p>
      </div>
      <a href="${process.env.BASE_URL}/threads/${threadSlug}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 8px;">View Thread</a>
    `;
    
    // Get user ID for tracking
    const userId = await getUserIdFromEmail(to);
    const subject = `${commenterName} commented on "${truncate(threadTitle, 50)}"`;
    
    // Create template with tracking
    const { html, trackingId } = await createEmailTemplate(content, {
      recipientEmail: to,
      userId: userId || undefined,
      templateKey: 'comment_notification',
      subject
    });
    
    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html
    });
    
    // Update email status to sent
    if (trackingId) {
      await db.update(emailNotifications)
        .set({ 
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: info.messageId
        })
        .where(eq(emailNotifications.id, trackingId));
    }
  },

  // 2. LIKE NOTIFICATION
  async sendLikeNotification(to: string, likerName: string, contentType: string, contentTitle: string, contentUrl: string): Promise<void> {
    const safeLikerName = escapeHtml(likerName);
    const safeContentType = escapeHtml(contentType);
    const safeContentTitle = escapeHtml(contentTitle);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">❤️ New Like</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeLikerName}</strong> liked your ${safeContentType}: <strong>"${safeContentTitle}"</strong>
      </p>
      <a href="${process.env.BASE_URL}${contentUrl}" style="display: inline-block; background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View ${safeContentType}</a>
    `;
    
    // Get user ID for tracking
    const userId = await getUserIdFromEmail(to);
    const subject = `${likerName} liked your ${contentType}`;
    
    // Create template with tracking
    const { html, trackingId } = await createEmailTemplate(content, {
      recipientEmail: to,
      userId: userId || undefined,
      templateKey: 'like_notification',
      subject
    });
    
    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html
    });
    
    // Update email status to sent
    if (trackingId) {
      await db.update(emailNotifications)
        .set({ 
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: info.messageId
        })
        .where(eq(emailNotifications.id, trackingId));
    }
  },

  // 3. FOLLOW NOTIFICATION
  async sendFollowNotification(to: string, followerName: string, followerUsername: string, followerAvatar?: string): Promise<void> {
    const safeFollowerName = escapeHtml(followerName);
    const safeFollowerUsername = escapeHtml(followerUsername);
    
    const avatarHtml = followerAvatar 
      ? `<img src="${followerAvatar}" alt="${safeFollowerName}" style="width: 64px; height: 64px; border-radius: 50%; margin-right: 16px;" />`
      : '';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">👥 New Follower</h2>
      <div style="display: flex; align-items: center; margin: 16px 0;">
        ${avatarHtml}
        <div>
          <p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.5;">
            <strong>${safeFollowerName}</strong> started following you!
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">@${safeFollowerUsername}</p>
        </div>
      </div>
      <a href="${process.env.BASE_URL}/users/${safeFollowerUsername}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 8px;">View Profile</a>
    `;
    
    // Get user ID for tracking
    const userId = await getUserIdFromEmail(to);
    const subject = `${followerName} started following you`;
    
    // Create template with tracking
    const { html, trackingId } = await createEmailTemplate(content, {
      recipientEmail: to,
      userId: userId || undefined,
      templateKey: 'follow_notification',
      subject
    });
    
    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html
    });
    
    // Update email status to sent
    if (trackingId) {
      await db.update(emailNotifications)
        .set({ 
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: info.messageId
        })
        .where(eq(emailNotifications.id, trackingId));
    }
  },

  // 4. WITHDRAWAL REQUEST RECEIVED
  async sendWithdrawalRequestReceived(to: string, amount: number, method: string, requestId: string): Promise<void> {
    const safeMethod = escapeHtml(method);
    const safeRequestId = escapeHtml(requestId);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💰 Withdrawal Request Received</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        We've received your withdrawal request. Here are the details:
      </p>
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Amount:</strong> ${amount} coins</p>
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Method:</strong> ${safeMethod}</p>
        <p style="margin: 0; color: #92400e;"><strong>Request ID:</strong> #${safeRequestId}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">Processing time: 1-3 business days</p>
      <a href="${process.env.BASE_URL}/wallet/withdrawals/${safeRequestId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Status</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Withdrawal Request #${requestId} - Processing`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 5. WITHDRAWAL SENT (APPROVED)
  async sendWithdrawalSent(to: string, amount: number, method: string, transactionId: string): Promise<void> {
    const safeMethod = escapeHtml(method);
    const safeTransactionId = escapeHtml(transactionId);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✅ Withdrawal Sent</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Great news! Your withdrawal has been processed successfully.
      </p>
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Amount:</strong> ${amount} coins</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Method:</strong> ${safeMethod}</p>
        <p style="margin: 0; color: #065f46;"><strong>Transaction ID:</strong> ${safeTransactionId}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">The funds should arrive in your account within 1-2 business days.</p>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Withdrawal Successful - ${amount} Coins Sent`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 6. COINS RECEIVED
  async sendCoinsReceived(to: string, amount: number, source: string, newBalance: number): Promise<void> {
    const safeSource = escapeHtml(source);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🪙 Coins Received!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        You've earned <strong style="color: #f59e0b; font-size: 20px;">${amount} coins</strong>!
      </p>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Source:</strong> ${safeSource}</p>
        <p style="margin: 0; color: #92400e;"><strong>New Balance:</strong> ${newBalance} coins</p>
      </div>
      <a href="${process.env.BASE_URL}/wallet" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Wallet</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `You earned ${amount} coins!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 7. PRODUCT SOLD
  async sendProductSold(to: string, productName: string, buyerName: string, price: number, earnings: number): Promise<void> {
    const safeProductName = escapeHtml(productName);
    const safeBuyerName = escapeHtml(buyerName);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🎉 Your Product Sold!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Congratulations! <strong>${safeBuyerName}</strong> purchased your product.
      </p>
      <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Product:</strong> ${safeProductName}</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Sale Price:</strong> ${price} coins</p>
        <p style="margin: 0; color: #065f46; font-size: 18px;"><strong>Your Earnings:</strong> +${earnings} coins 💰</p>
      </div>
      <a href="${process.env.BASE_URL}/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dashboard</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Your "${truncate(productName, 50)}" was purchased!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 8. PRODUCT PUBLISHED
  async sendProductPublished(to: string, productName: string, productSlug: string, category: string): Promise<void> {
    const safeProductName = escapeHtml(productName);
    const safeCategory = escapeHtml(category);
    const safeProductSlug = escapeHtml(productSlug);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✅ Product Published Successfully</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your ${safeCategory} "<strong>${safeProductName}</strong>" is now live on the marketplace!
      </p>
      <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af;">Your product is visible to all YoForex members and can now generate sales.</p>
      </div>
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/content/${safeProductSlug}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">View Listing</a>
        <a href="${process.env.BASE_URL}/content/${safeProductSlug}/edit" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Edit</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `"${truncate(productName, 50)}" is now live!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 9. PASSWORD RESET
  async sendPasswordReset(to: string, resetToken: string, expiresIn: string = '1 hour'): Promise<void> {
    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🔒 Password Reset Request</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">
        Or copy this link: <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
      </p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>⚠️ Security Notice:</strong> This link expires in ${expiresIn}. If you didn't request this, please ignore this email.</p>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: 'Reset your YoForex password',
      html: (await createEmailTemplate(content)).html
    });
  },

  // 10. USERNAME CHANGE CONFIRMATION
  async sendUsernameChanged(to: string, oldUsername: string, newUsername: string): Promise<void> {
    const safeOldUsername = escapeHtml(oldUsername);
    const safeNewUsername = escapeHtml(newUsername);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✏️ Username Changed</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your username has been successfully updated.
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>Old Username:</strong> @${safeOldUsername}</p>
        <p style="margin: 0; color: #4b5563;"><strong>New Username:</strong> @${safeNewUsername}</p>
      </div>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>⚠️ Important:</strong> If you didn't make this change, please contact support immediately.</p>
      </div>
      <a href="${process.env.BASE_URL}/settings" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Settings</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: 'Your username has been changed',
      html: (await createEmailTemplate(content)).html
    });
  },

  // 11. NEW MESSAGE RECEIVED
  async sendNewMessage(to: string, senderName: string, senderUsername: string, messagePreview: string): Promise<void> {
    const safeSenderName = escapeHtml(senderName);
    const safeSenderUsername = escapeHtml(senderUsername);
    const safeMessagePreview = escapeHtml(truncate(messagePreview, 200));
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✉️ New Message</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        You received a message from <strong>${safeSenderName}</strong> (@${safeSenderUsername})
      </p>
      <div style="background: #f3f4f6; border-left: 4px solid #8b5cf6; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6;">${safeMessagePreview}</p>
      </div>
      <a href="${process.env.BASE_URL}/messages" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Read Message</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `New message from ${senderName}`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 12. LEVEL UP NOTIFICATION
  async sendLevelUp(to: string, newLevel: string, xp: number, rewards: string[]): Promise<void> {
    const safeNewLevel = escapeHtml(newLevel);
    const rewardsList = rewards.map(r => `<li style="margin: 4px 0;">${escapeHtml(r)}</li>`).join('');
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🎊 Level Up!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Congratulations! You've reached <strong style="color: #f59e0b; font-size: 20px;">${safeNewLevel}</strong> level!
      </p>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e; font-size: 18px;"><strong>Your XP:</strong> ${xp}</p>
        ${rewards.length > 0 ? `
          <p style="margin: 8px 0 4px 0; color: #92400e;"><strong>Rewards Unlocked:</strong></p>
          <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #92400e;">${rewardsList}</ul>
        ` : ''}
      </div>
      <a href="${process.env.BASE_URL}/dashboard" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dashboard</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `🎊 You've reached ${newLevel} level!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 13. LEADERBOARD RANK NOTIFICATION
  async sendLeaderboardRank(to: string, rank: number, category: string, points: number): Promise<void> {
    const safeCategory = escapeHtml(category);
    
    const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏆';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">${medalEmoji} Leaderboard Achievement!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Amazing! You're now ranked <strong style="color: #f59e0b; font-size: 20px;">#${rank}</strong> in ${safeCategory}!
      </p>
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; color: #1e40af; font-size: 48px; font-weight: bold;">#${rank}</p>
        <p style="margin: 8px 0 0 0; color: #1e40af;"><strong>${points}</strong> points</p>
      </div>
      <a href="${process.env.BASE_URL}/leaderboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Leaderboard</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `${medalEmoji} You're ranked #${rank} in ${category}!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 14. EMAIL VERIFICATION (WELCOME)
  async sendEmailVerification(to: string, username: string, verificationToken: string): Promise<void> {
    const safeUsername = escapeHtml(username);
    const verifyUrl = `${process.env.BASE_URL}/verify-email?token=${verificationToken}`;
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">👋 Welcome to YoForex!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Hi <strong>${safeUsername}</strong>, welcome to the YoForex community!
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        To get started, please verify your email address:
      </p>
      <a href="${verifyUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Verify Email Address</a>
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">
        Or copy this link: <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>What you can do on YoForex:</strong></p>
        <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #4b5563;">
          <li style="margin: 4px 0;">Share and discuss trading strategies</li>
          <li style="margin: 4px 0;">Buy and sell EAs, indicators, and templates</li>
          <li style="margin: 4px 0;">Earn coins for contributions</li>
          <li style="margin: 4px 0;">Connect with forex traders worldwide</li>
        </ul>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: 'Welcome to YoForex - Verify your email',
      html: (await createEmailTemplate(content)).html
    });
  },

  // 15. PURCHASE RECEIPT
  async sendPurchaseReceipt(to: string, productName: string, price: number, purchaseId: string, downloadUrl: string): Promise<void> {
    const safeProductName = escapeHtml(productName);
    const safePurchaseId = escapeHtml(purchaseId);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🎁 Purchase Successful!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Thank you for your purchase! You now have access to <strong>"${safeProductName}"</strong>
      </p>
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Product:</strong> ${safeProductName}</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Price:</strong> ${price} coins</p>
        <p style="margin: 0; color: #065f46;"><strong>Order ID:</strong> #${safePurchaseId}</p>
      </div>
      <a href="${downloadUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Download Now</a>
      <a href="${process.env.BASE_URL}/purchases" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">View All Purchases</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Receipt: ${truncate(productName, 50)} - ${price} coins`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 16. THREAD REPLY NOTIFICATION
  async sendThreadReply(to: string, replierName: string, threadTitle: string, replyPreview: string, threadSlug: string): Promise<void> {
    const safeReplierName = escapeHtml(replierName);
    const safeThreadTitle = escapeHtml(threadTitle);
    const safeReplyPreview = escapeHtml(truncate(replyPreview, 200));
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💬 New Reply to Your Thread</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeReplierName}</strong> replied to your thread <strong>"${safeThreadTitle}"</strong>
      </p>
      <div style="background: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6;">${safeReplyPreview}</p>
      </div>
      <a href="${process.env.BASE_URL}/threads/${threadSlug}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Reply</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `${replierName} replied to "${truncate(threadTitle, 50)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 17. SOMEONE SHARES YOUR CONTENT
  async sendContentShared(to: string, sharerName: string, contentTitle: string, contentUrl: string, platform?: string): Promise<void> {
    const safeSharerName = escapeHtml(sharerName);
    const safeContentTitle = escapeHtml(contentTitle);
    const safePlatform = platform ? escapeHtml(platform) : 'YoForex';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🔄 Your Content Was Shared!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeSharerName}</strong> shared your content <strong>"${safeContentTitle}"</strong> on ${safePlatform}!
      </p>
      <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #0c4a6e; margin: 0;">Your content is reaching more traders! Keep creating valuable content.</p>
      </div>
      <a href="${process.env.BASE_URL}${contentUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Content</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `${sharerName} shared your content!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 18. SOMEONE UNFOLLOWS YOU
  async sendUnfollowNotification(to: string, unfollowerName: string, unfollowerUsername: string): Promise<void> {
    const safeUnfollowerName = escapeHtml(unfollowerName);
    const safeUnfollowerUsername = escapeHtml(unfollowerUsername);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">👤 Follower Update</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeUnfollowerName}</strong> (@${safeUnfollowerUsername}) unfollowed you.
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="color: #6b7280; margin: 0;">Keep creating great content to maintain and grow your following!</p>
      </div>
      <a href="${process.env.BASE_URL}/dashboard" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dashboard</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `${unfollowerName} unfollowed you`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 19. SOMEONE SENDS YOU A REQUEST
  async sendFriendRequest(to: string, requesterName: string, requesterUsername: string, message?: string): Promise<void> {
    const safeRequesterName = escapeHtml(requesterName);
    const safeRequesterUsername = escapeHtml(requesterUsername);
    const safeMessage = message ? escapeHtml(truncate(message, 200)) : '';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🤝 New Connection Request</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeRequesterName}</strong> (@${safeRequesterUsername}) wants to connect with you!
      </p>
      ${safeMessage ? `
        <div style="background: #f3f4f6; border-left: 4px solid #8b5cf6; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6;">"${safeMessage}"</p>
        </div>
      ` : ''}
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/requests" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Accept</a>
        <a href="${process.env.BASE_URL}/users/${safeRequesterUsername}" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Profile</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `${requesterName} wants to connect`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 20. SOMEONE TAGS/MENTIONS YOU
  async sendMentionNotification(to: string, mentionerName: string, contentType: string, contentTitle: string, contentUrl: string, context?: string): Promise<void> {
    const safeMentionerName = escapeHtml(mentionerName);
    const safeContentType = escapeHtml(contentType);
    const safeContentTitle = escapeHtml(contentTitle);
    const safeContext = context ? escapeHtml(truncate(context, 200)) : '';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📢 You Were Mentioned</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeMentionerName}</strong> mentioned you in a ${safeContentType}: <strong>"${safeContentTitle}"</strong>
      </p>
      ${safeContext ? `
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="color: #14532d; margin: 0; font-size: 14px; line-height: 1.6;">${safeContext}</p>
        </div>
      ` : ''}
      <a href="${process.env.BASE_URL}${contentUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Mention</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `${mentionerName} mentioned you`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 21. USER BUYS COINS
  async sendCoinPurchaseConfirmation(to: string, amount: number, price: string, paymentMethod: string, transactionId: string): Promise<void> {
    const safePaymentMethod = escapeHtml(paymentMethod);
    const safeTransactionId = escapeHtml(transactionId);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💳 Coin Purchase Successful</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your coin purchase has been completed successfully!
      </p>
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Coins Purchased:</strong> ${amount} coins</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Amount Paid:</strong> ${price}</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Payment Method:</strong> ${safePaymentMethod}</p>
        <p style="margin: 0; color: #065f46;"><strong>Transaction ID:</strong> #${safeTransactionId}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Your coins have been added to your wallet instantly!</p>
      <a href="${process.env.BASE_URL}/wallet" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Wallet</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Coin Purchase Receipt - ${amount} coins`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 22. LOW COIN BALANCE WARNING
  async sendLowBalanceWarning(to: string, currentBalance: number, threshold: number = 10): Promise<void> {
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">⚠️ Low Coin Balance</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your coin balance is running low!
      </p>
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e; font-size: 18px;"><strong>Current Balance:</strong> ${currentBalance} coins</p>
        <p style="margin: 0; color: #92400e;">You need at least ${threshold} coins to purchase content.</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Earn more coins by contributing to the community or recharge your wallet:</p>
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/recharge" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Recharge Now</a>
        <a href="${process.env.BASE_URL}/earn-coins" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Earn Coins</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `⚠️ Low coin balance - ${currentBalance} coins remaining`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 23. POST APPROVED BY MODERATOR
  async sendPostApproved(to: string, postTitle: string, postUrl: string, category: string): Promise<void> {
    const safePostTitle = escapeHtml(postTitle);
    const safeCategory = escapeHtml(category);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✅ Post Approved!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Great news! Your post <strong>"${safePostTitle}"</strong> has been approved and is now live!
      </p>
      <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; color: #065f46;"><strong>Category:</strong> ${safeCategory}</p>
        <p style="margin: 8px 0 0 0; color: #065f46;">Your post is now visible to all community members.</p>
      </div>
      <a href="${process.env.BASE_URL}${postUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Post</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `✅ Your post "${truncate(postTitle, 50)}" was approved`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 24. POST REJECTED BY MODERATOR
  async sendPostRejected(to: string, postTitle: string, reason: string, guidelines?: string): Promise<void> {
    const safePostTitle = escapeHtml(postTitle);
    const safeReason = escapeHtml(reason);
    const safeGuidelines = guidelines ? escapeHtml(guidelines) : '';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📝 Post Review Required</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your post <strong>"${safePostTitle}"</strong> needs some adjustments before it can be published.
      </p>
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>Reason:</strong></p>
        <p style="margin: 0; color: #991b1b;">${safeReason}</p>
      </div>
      ${safeGuidelines ? `
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Guidelines to follow:</strong></p>
          <p style="margin: 0; color: #6b7280;">${safeGuidelines}</p>
        </div>
      ` : ''}
      <a href="${process.env.BASE_URL}/publish" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Edit and Resubmit</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Post review required: "${truncate(postTitle, 50)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 25. COMMENT POSTED SUCCESSFULLY
  async sendCommentSuccess(to: string, threadTitle: string, threadUrl: string): Promise<void> {
    const safeThreadTitle = escapeHtml(threadTitle);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💬 Comment Posted!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your comment on <strong>"${safeThreadTitle}"</strong> has been posted successfully!
      </p>
      <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; color: #0c4a6e;">Thank you for contributing to the discussion!</p>
      </div>
      <a href="${process.env.BASE_URL}${threadUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Thread</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Comment posted on "${truncate(threadTitle, 50)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 26. FIRST POST MILESTONE
  async sendFirstPostMilestone(to: string, postTitle: string, postUrl: string, tips: string[]): Promise<void> {
    const safePostTitle = escapeHtml(postTitle);
    const tipsList = tips.map(t => `<li style="margin: 4px 0;">${escapeHtml(t)}</li>`).join('');
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🎉 Congratulations on Your First Post!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        You've published your first post: <strong>"${safePostTitle}"</strong>
      </p>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 18px;">🏆 Achievement Unlocked: First Post!</p>
        <p style="margin: 8px 0 0 0; color: #92400e;">+10 coins earned!</p>
      </div>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #374151;"><strong>Tips for success:</strong></p>
        <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #6b7280;">${tipsList}</ul>
      </div>
      <a href="${process.env.BASE_URL}${postUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Your Post</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `🎉 Congratulations on your first post!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 27. POST MILESTONE ACHIEVEMENTS
  async sendPostMilestone(to: string, milestone: number, totalPosts: number, reward: number): Promise<void> {
    const milestoneEmoji = milestone >= 500 ? '🏆' : milestone >= 100 ? '🥇' : milestone >= 50 ? '🥈' : '🥉';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">${milestoneEmoji} Post Milestone Reached!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Amazing achievement! You've reached your <strong>${milestone}th post</strong>!
      </p>
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; color: #1e40af; font-size: 48px; font-weight: bold;">${totalPosts}</p>
        <p style="margin: 8px 0 0 0; color: #1e40af;">Total Posts</p>
      </div>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 18px;"><strong>Milestone Reward:</strong> +${reward} coins!</p>
      </div>
      <a href="${process.env.BASE_URL}/dashboard" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dashboard</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `${milestoneEmoji} You've reached ${milestone} posts!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 28. UPLOAD SUCCESSFUL
  async sendUploadSuccess(to: string, fileName: string, fileType: string, fileSize: string): Promise<void> {
    const safeFileName = escapeHtml(fileName);
    const safeFileType = escapeHtml(fileType);
    const safeFileSize = escapeHtml(fileSize);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📁 Upload Successful!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your file has been uploaded successfully!
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #374151;"><strong>File Name:</strong> ${safeFileName}</p>
        <p style="margin: 0 0 8px 0; color: #374151;"><strong>Type:</strong> ${safeFileType}</p>
        <p style="margin: 0; color: #374151;"><strong>Size:</strong> ${safeFileSize}</p>
      </div>
      <a href="${process.env.BASE_URL}/uploads" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Uploads</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Upload successful: ${truncate(fileName, 50)}`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 29. POST GETTING POPULAR
  async sendPostPopular(to: string, postTitle: string, postUrl: string, views: number, threshold: number): Promise<void> {
    const safePostTitle = escapeHtml(postTitle);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🔥 Your Post is Trending!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your post <strong>"${safePostTitle}"</strong> is getting popular!
      </p>
      <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; color: #991b1b; font-size: 36px; font-weight: bold;">🔥 ${views.toLocaleString()}</p>
        <p style="margin: 8px 0 0 0; color: #991b1b;">Views</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Your post has reached the ${threshold.toLocaleString()} view milestone!</p>
      <a href="${process.env.BASE_URL}${postUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Post</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `🔥 Your post reached ${views.toLocaleString()} views!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 30. POST SELECTED AS BEST ANSWER
  async sendBestAnswer(to: string, threadTitle: string, threadUrl: string, rewardCoins: number): Promise<void> {
    const safeThreadTitle = escapeHtml(threadTitle);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✨ Best Answer Selected!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your answer was selected as the best answer in <strong>"${safeThreadTitle}"</strong>!
      </p>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; color: #92400e; font-size: 24px;">✨ Best Answer!</p>
        <p style="margin: 8px 0 0 0; color: #92400e;">+${rewardCoins} coins earned</p>
      </div>
      <a href="${process.env.BASE_URL}${threadUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Thread</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `✨ Your answer was selected as best!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 31. SOMEONE QUOTED YOUR POST
  async sendQuoteNotification(to: string, quoterName: string, originalPost: string, threadTitle: string, threadUrl: string): Promise<void> {
    const safeQuoterName = escapeHtml(quoterName);
    const safeOriginalPost = escapeHtml(truncate(originalPost, 150));
    const safeThreadTitle = escapeHtml(threadTitle);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💬 Your Post Was Quoted</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeQuoterName}</strong> quoted your post in <strong>"${safeThreadTitle}"</strong>
      </p>
      <div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 12px;">Your original post:</p>
        <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6;">"${safeOriginalPost}"</p>
      </div>
      <a href="${process.env.BASE_URL}${threadUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Quote</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `${quoterName} quoted your post`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 32. THREAD YOU'RE FOLLOWING HAS NEW ACTIVITY
  async sendThreadActivity(to: string, threadTitle: string, threadUrl: string, activityType: string, activityCount: number): Promise<void> {
    const safeThreadTitle = escapeHtml(threadTitle);
    const safeActivityType = escapeHtml(activityType);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🔔 Thread Activity</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        New activity in thread you're following: <strong>"${safeThreadTitle}"</strong>
      </p>
      <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; color: #0c4a6e;"><strong>${activityCount}</strong> new ${safeActivityType}</p>
      </div>
      <a href="${process.env.BASE_URL}${threadUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Thread</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `New activity in "${truncate(threadTitle, 50)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 33. WEEKLY ACTIVITY SUMMARY (renamed from WEEKLY DIGEST)
  async sendWeeklyActivitySummary(to: string, username: string, stats: {
    postsCreated: number;
    commentsReceived: number;
    likesReceived: number;
    newFollowers: number;
    coinsEarned: number;
    viewsReceived: number;
  }): Promise<void> {
    const safeUsername = escapeHtml(username);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📊 Your Weekly Activity Summary</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Hi <strong>${safeUsername}</strong>, here's your activity for this week:
      </p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0;">
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Posts Created</p>
          <p style="margin: 8px 0 0 0; color: #111827; font-size: 24px; font-weight: bold;">${stats.postsCreated}</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Comments Received</p>
          <p style="margin: 8px 0 0 0; color: #111827; font-size: 24px; font-weight: bold;">${stats.commentsReceived}</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Likes</p>
          <p style="margin: 8px 0 0 0; color: #ec4899; font-size: 24px; font-weight: bold;">${stats.likesReceived}</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">New Followers</p>
          <p style="margin: 8px 0 0 0; color: #2563eb; font-size: 24px; font-weight: bold;">${stats.newFollowers}</p>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">Coins Earned</p>
        <p style="margin: 8px 0 0 0; color: #92400e; font-size: 32px; font-weight: bold;">+${stats.coinsEarned}</p>
      </div>
      
      <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; color: #1e40af; font-size: 14px;">Total Views</p>
        <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 24px; font-weight: bold;">${stats.viewsReceived.toLocaleString()}</p>
      </div>
      
      <a href="${process.env.BASE_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 8px;">View Full Dashboard</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `📊 Weekly Summary: ${stats.coinsEarned} coins earned`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 34. PRODUCT LISTED SUCCESSFULLY
  async sendProductListed(to: string, productName: string, productSlug: string, category: string, price: number): Promise<void> {
    const safeProductName = escapeHtml(productName);
    const safeCategory = escapeHtml(category);
    const safeProductSlug = escapeHtml(productSlug);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🛍️ Product Listed Successfully</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your product <strong>"${safeProductName}"</strong> is now listed in the marketplace!
      </p>
      <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Category:</strong> ${safeCategory}</p>
        <p style="margin: 0; color: #065f46;"><strong>Price:</strong> ${price} coins</p>
      </div>
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/marketplace/${safeProductSlug}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">View Listing</a>
        <a href="${process.env.BASE_URL}/marketplace/${safeProductSlug}/edit" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Edit Product</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Product listed: "${truncate(productName, 50)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 35. PRODUCT REVIEW RECEIVED
  async sendProductReview(to: string, productName: string, reviewerName: string, rating: number, review: string, productUrl: string): Promise<void> {
    const safeProductName = escapeHtml(productName);
    const safeReviewerName = escapeHtml(reviewerName);
    const safeReview = escapeHtml(truncate(review, 200));
    
    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">⭐ New Product Review</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeReviewerName}</strong> reviewed your product <strong>"${safeProductName}"</strong>
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #111827; font-size: 20px;">${stars}</p>
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">"${safeReview}"</p>
      </div>
      <a href="${process.env.BASE_URL}${productUrl}#reviews" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Review</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `${rating}⭐ review for "${truncate(productName, 40)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 36. PRODUCT SALE PENDING PAYMENT
  async sendSalePendingPayment(to: string, productName: string, buyerName: string, amount: number, orderId: string): Promise<void> {
    const safeProductName = escapeHtml(productName);
    const safeBuyerName = escapeHtml(buyerName);
    const safeOrderId = escapeHtml(orderId);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">⏳ Sale Pending Payment</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeBuyerName}</strong> wants to purchase your product but payment is pending.
      </p>
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Product:</strong> ${safeProductName}</p>
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Amount:</strong> ${amount} coins</p>
        <p style="margin: 0; color: #92400e;"><strong>Order ID:</strong> #${safeOrderId}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">The buyer has been notified to complete the payment. You'll be notified once the payment is received.</p>
      <a href="${process.env.BASE_URL}/orders/${safeOrderId}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Order Details</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Sale pending: "${truncate(productName, 50)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 37. PAYOUT PROCESSED
  async sendPayoutProcessed(to: string, amount: string, method: string, transactionId: string, processingTime: string): Promise<void> {
    const safeMethod = escapeHtml(method);
    const safeTransactionId = escapeHtml(transactionId);
    const safeProcessingTime = escapeHtml(processingTime);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💸 Payout Processed!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your payout has been processed successfully!
      </p>
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Amount:</strong> ${amount}</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Method:</strong> ${safeMethod}</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Transaction ID:</strong> ${safeTransactionId}</p>
        <p style="margin: 0; color: #065f46;"><strong>Processing Time:</strong> ${safeProcessingTime}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">The funds should arrive in your account according to the processing time above.</p>
      <a href="${process.env.BASE_URL}/payouts/${safeTransactionId}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `💸 Payout processed: ${amount}`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 38. REFUND ISSUED
  async sendRefundIssued(to: string, productName: string, amount: number, reason: string, refundId: string): Promise<void> {
    const safeProductName = escapeHtml(productName);
    const safeReason = escapeHtml(reason);
    const safeRefundId = escapeHtml(refundId);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💰 Refund Issued</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your refund request has been processed.
      </p>
      <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #1e40af;"><strong>Product:</strong> ${safeProductName}</p>
        <p style="margin: 0 0 8px 0; color: #1e40af;"><strong>Refund Amount:</strong> ${amount} coins</p>
        <p style="margin: 0 0 8px 0; color: #1e40af;"><strong>Reason:</strong> ${safeReason}</p>
        <p style="margin: 0; color: #1e40af;"><strong>Refund ID:</strong> #${safeRefundId}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">The coins have been credited back to your wallet.</p>
      <a href="${process.env.BASE_URL}/wallet" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Wallet</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Refund processed: ${amount} coins`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 39. LOGIN FROM NEW DEVICE
  async sendNewDeviceLogin(to: string, deviceInfo: {
    browser: string;
    os: string;
    ip: string;
    location?: string;
    timestamp: string;
  }): Promise<void> {
    const safeBrowser = escapeHtml(deviceInfo.browser);
    const safeOs = escapeHtml(deviceInfo.os);
    const safeIp = escapeHtml(deviceInfo.ip);
    const safeLocation = deviceInfo.location ? escapeHtml(deviceInfo.location) : 'Unknown';
    const safeTimestamp = escapeHtml(deviceInfo.timestamp);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🔐 New Device Login Detected</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        A new login to your account was detected.
      </p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>Browser:</strong> ${safeBrowser}</p>
        <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>Operating System:</strong> ${safeOs}</p>
        <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>IP Address:</strong> ${safeIp}</p>
        <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>Location:</strong> ${safeLocation}</p>
        <p style="margin: 0; color: #991b1b;"><strong>Time:</strong> ${safeTimestamp}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">If this was you, you can ignore this email. If not, please secure your account immediately.</p>
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/settings/security" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Secure Account</a>
        <a href="${process.env.BASE_URL}/settings/sessions" style="display: inline-block; background: white; border: 2px solid #6b7280; color: #6b7280; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">View All Sessions</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: '⚠️ New device login detected',
      html: (await createEmailTemplate(content)).html
    });
  },

  // 40. ACCOUNT SUSPENDED/WARNING
  async sendAccountWarning(to: string, warningType: 'warning' | 'suspension', reason: string, duration?: string, appealUrl?: string): Promise<void> {
    const safeReason = escapeHtml(reason);
    const safeDuration = duration ? escapeHtml(duration) : '';
    
    const isWarning = warningType === 'warning';
    const title = isWarning ? '⚠️ Account Warning' : '🚫 Account Suspended';
    const description = isWarning 
      ? 'Your account has received a warning due to policy violations.'
      : 'Your account has been temporarily suspended.';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">${title}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        ${description}
      </p>
      <div style="background: #fef2f2; border: 1px solid #dc2626; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>Reason:</strong></p>
        <p style="margin: 0 0 8px 0; color: #991b1b;">${safeReason}</p>
        ${safeDuration ? `<p style="margin: 0; color: #991b1b;"><strong>Duration:</strong> ${safeDuration}</p>` : ''}
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">
        ${isWarning 
          ? 'Please review our community guidelines to avoid further actions on your account.'
          : 'During this period, you will have limited access to certain features.'}
      </p>
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/guidelines" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">View Guidelines</a>
        ${appealUrl ? `<a href="${appealUrl}" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Appeal Decision</a>` : ''}
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: title,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 41. CONTENT REPORTED
  async sendContentReported(to: string, contentTitle: string, contentType: string, reportReason: string, reportId: string): Promise<void> {
    const safeContentTitle = escapeHtml(contentTitle);
    const safeContentType = escapeHtml(contentType);
    const safeReportReason = escapeHtml(reportReason);
    const safeReportId = escapeHtml(reportId);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📋 Content Reported</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your ${safeContentType} has been reported and is under review.
      </p>
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Content:</strong> ${safeContentTitle}</p>
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Report Reason:</strong> ${safeReportReason}</p>
        <p style="margin: 0; color: #92400e;"><strong>Report ID:</strong> #${safeReportId}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Our moderation team will review the report and take appropriate action if necessary. You'll be notified of the outcome.</p>
      <a href="${process.env.BASE_URL}/reports/${safeReportId}" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Report Details</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Content reported: "${truncate(contentTitle, 50)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 42. CONTENT REMOVED
  async sendContentRemoved(to: string, contentTitle: string, contentType: string, reason: string, violatedPolicy: string): Promise<void> {
    const safeContentTitle = escapeHtml(contentTitle);
    const safeContentType = escapeHtml(contentType);
    const safeReason = escapeHtml(reason);
    const safeViolatedPolicy = escapeHtml(violatedPolicy);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">❌ Content Removed</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your ${safeContentType} has been removed for violating community guidelines.
      </p>
      <div style="background: #fef2f2; border: 1px solid #dc2626; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>Content:</strong> ${safeContentTitle}</p>
        <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>Reason:</strong> ${safeReason}</p>
        <p style="margin: 0; color: #991b1b;"><strong>Policy Violated:</strong> ${safeViolatedPolicy}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Please review our community guidelines to understand what content is allowed on YoForex.</p>
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/guidelines" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">View Guidelines</a>
        <a href="${process.env.BASE_URL}/support/appeal" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Appeal</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Content removed: "${truncate(contentTitle, 50)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 17. WEEKLY DIGEST (keep original as well for backward compatibility)
  async sendWeeklyDigest(to: string, username: string, stats: {
    newThreads: number;
    hotDiscussions: Array<{title: string; slug: string; replies: number}>;
    topContent: Array<{title: string; slug: string; author: string}>;
    yourEarnings: number;
    yourRank: number;
  }): Promise<void> {
    const safeUsername = escapeHtml(username);
    
    const hotDiscussionsHtml = stats.hotDiscussions.map(thread => `
      <li style="margin: 8px 0;">
        <a href="${process.env.BASE_URL}/threads/${thread.slug}" style="color: #2563eb; text-decoration: none; font-weight: bold;">
          ${escapeHtml(thread.title)}
        </a>
        <span style="color: #6b7280; font-size: 14px;"> (${thread.replies} replies)</span>
      </li>
    `).join('');
    
    const topContentHtml = stats.topContent.map(content => `
      <li style="margin: 8px 0;">
        <a href="${process.env.BASE_URL}/content/${content.slug}" style="color: #2563eb; text-decoration: none; font-weight: bold;">
          ${escapeHtml(content.title)}
        </a>
        <span style="color: #6b7280; font-size: 14px;"> by ${escapeHtml(content.author)}</span>
      </li>
    `).join('');
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📊 Your Weekly YoForex Digest</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Hi <strong>${safeUsername}</strong>, here's what happened this week on YoForex:
      </p>
      
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 18px;">📈 Platform Activity</h3>
        <p style="color: #4b5563; margin: 0;"><strong>${stats.newThreads}</strong> new threads this week</p>
      </div>
      
      ${stats.hotDiscussions.length > 0 ? `
        <div style="margin: 16px 0;">
          <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 18px;">🔥 Hot Discussions</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563;">${hotDiscussionsHtml}</ul>
        </div>
      ` : ''}
      
      ${stats.topContent.length > 0 ? `
        <div style="margin: 16px 0;">
          <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 18px;">⭐ Top Content</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563;">${topContentHtml}</ul>
        </div>
      ` : ''}
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 18px;">💰 Your Stats</h3>
        <p style="color: #92400e; margin: 0 0 8px 0;"><strong>Coins Earned:</strong> ${stats.yourEarnings}</p>
        <p style="color: #92400e; margin: 0;"><strong>Leaderboard Rank:</strong> #${stats.yourRank}</p>
      </div>
      
      <a href="${process.env.BASE_URL}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 8px;">Visit YoForex</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Your Weekly YoForex Digest - ${stats.newThreads} new threads`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 43. PREMIUM EXPIRING SOON
  async sendPremiumExpiringSoon(to: string, daysLeft: number, expiryDate: string, renewalUrl: string): Promise<void> {
    const safeExpiryDate = escapeHtml(expiryDate);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">⏰ Premium Subscription Expiring Soon</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your Premium subscription expires in <strong style="color: #f59e0b; font-size: 20px;">${daysLeft} days</strong>.
      </p>
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Expiry Date:</strong> ${safeExpiryDate}</p>
        <p style="margin: 0; color: #92400e;">Renew now to keep enjoying premium benefits without interruption.</p>
      </div>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>Premium Benefits You'll Lose:</strong></p>
        <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #4b5563;">
          <li style="margin: 4px 0;">Unlimited downloads</li>
          <li style="margin: 4px 0;">Priority support</li>
          <li style="margin: 4px 0;">Exclusive content access</li>
          <li style="margin: 4px 0;">Ad-free experience</li>
        </ul>
      </div>
      <a href="${renewalUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Renew Premium</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `⏰ Premium expires in ${daysLeft} days`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 44. SUBSCRIPTION AUTO-RENEWED
  async sendSubscriptionAutoRenewed(to: string, planName: string, amount: string, nextRenewalDate: string, invoiceUrl?: string): Promise<void> {
    const safePlanName = escapeHtml(planName);
    const safeAmount = escapeHtml(amount);
    const safeNextRenewalDate = escapeHtml(nextRenewalDate);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✅ Subscription Renewed Successfully</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your <strong>${safePlanName}</strong> subscription has been automatically renewed.
      </p>
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Plan:</strong> ${safePlanName}</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Amount Charged:</strong> ${safeAmount}</p>
        <p style="margin: 0; color: #065f46;"><strong>Next Renewal:</strong> ${safeNextRenewalDate}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Thank you for continuing with YoForex Premium!</p>
      <div style="margin-top: 16px;">
        ${invoiceUrl ? `<a href="${invoiceUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">View Invoice</a>` : ''}
        <a href="${process.env.BASE_URL}/settings/subscription" style="display: inline-block; background: white; border: 2px solid #6b7280; color: #6b7280; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Manage Subscription</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Subscription renewed: ${planName}`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 45. SUBSCRIPTION CANCELED
  async sendSubscriptionCanceled(to: string, planName: string, endDate: string, reason?: string): Promise<void> {
    const safePlanName = escapeHtml(planName);
    const safeEndDate = escapeHtml(endDate);
    const safeReason = reason ? escapeHtml(reason) : '';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📋 Subscription Canceled</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your <strong>${safePlanName}</strong> subscription has been canceled.
      </p>
      <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #1e40af;"><strong>Plan:</strong> ${safePlanName}</p>
        <p style="margin: 0 ${safeReason ? '0 8px' : ''}; color: #1e40af;"><strong>Access Until:</strong> ${safeEndDate}</p>
        ${safeReason ? `<p style="margin: 0; color: #1e40af;"><strong>Reason:</strong> ${safeReason}</p>` : ''}
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">You'll continue to have access to premium features until ${safeEndDate}.</p>
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/pricing" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Reactivate</a>
        <a href="${process.env.BASE_URL}/feedback" style="display: inline-block; background: white; border: 2px solid #6b7280; color: #6b7280; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Give Feedback</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Subscription canceled: ${planName}`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 46. CONTEST ENTRY CONFIRMED
  async sendContestEntry(to: string, contestName: string, entryId: string, submissionTitle: string, deadline: string): Promise<void> {
    const safeContestName = escapeHtml(contestName);
    const safeEntryId = escapeHtml(entryId);
    const safeSubmissionTitle = escapeHtml(submissionTitle);
    const safeDeadline = escapeHtml(deadline);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🎯 Contest Entry Confirmed!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your entry to <strong>"${safeContestName}"</strong> has been successfully submitted!
      </p>
      <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; color: #0c4a6e;"><strong>Submission:</strong> ${safeSubmissionTitle}</p>
        <p style="margin: 0 0 8px 0; color: #0c4a6e;"><strong>Entry ID:</strong> #${safeEntryId}</p>
        <p style="margin: 0; color: #0c4a6e;"><strong>Contest Deadline:</strong> ${safeDeadline}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Good luck! Winners will be announced shortly after the deadline.</p>
      <a href="${process.env.BASE_URL}/contests/${safeEntryId}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Entry</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Contest entry confirmed: "${truncate(contestName, 40)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 47. CONTEST WINNER
  async sendContestWinner(to: string, contestName: string, position: number, prize: string, claimUrl: string): Promise<void> {
    const safeContestName = escapeHtml(contestName);
    const safePrize = escapeHtml(prize);
    
    const positionText = position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `${position}th`;
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏆';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">${medal} Congratulations - You're a Winner!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Amazing news! You won <strong style="color: #f59e0b; font-size: 20px;">${positionText} place</strong> in "${safeContestName}"!
      </p>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; font-size: 64px;">${medal}</p>
        <p style="margin: 8px 0 0 0; color: #92400e; font-size: 24px; font-weight: bold;">${positionText} Place Winner!</p>
        <p style="margin: 8px 0 0 0; color: #92400e; font-size: 18px;"><strong>Prize:</strong> ${safePrize}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Claim your prize within 7 days to receive your rewards.</p>
      <a href="${claimUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">Claim Prize</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `${medal} You WON ${positionText} place in "${truncate(contestName, 30)}"!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 48. BADGE EARNED
  async sendBadgeEarned(to: string, badgeName: string, badgeIcon: string, badgeDescription: string, totalBadges: number): Promise<void> {
    const safeBadgeName = escapeHtml(badgeName);
    const safeBadgeIcon = escapeHtml(badgeIcon);
    const safeBadgeDescription = escapeHtml(badgeDescription);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🏅 New Badge Unlocked!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Congratulations! You've earned a new badge!
      </p>
      <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; font-size: 48px;">${safeBadgeIcon}</p>
        <p style="margin: 8px 0 0 0; color: #4c1d95; font-size: 20px; font-weight: bold;">${safeBadgeName}</p>
        <p style="margin: 8px 0 0 0; color: #5b21b6; font-size: 14px;">${safeBadgeDescription}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">You now have <strong>${totalBadges} badges</strong> in your collection!</p>
      <a href="${process.env.BASE_URL}/profile/badges" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View All Badges</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `🏅 Badge earned: "${badgeName}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 49. GROUP INVITE
  async sendGroupInvite(to: string, groupName: string, inviterName: string, memberCount: number, groupDescription: string): Promise<void> {
    const safeGroupName = escapeHtml(groupName);
    const safeInviterName = escapeHtml(inviterName);
    const safeGroupDescription = escapeHtml(truncate(groupDescription, 200));
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">👥 Group Invitation</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeInviterName}</strong> invited you to join <strong>"${safeGroupName}"</strong>
      </p>
      <div style="background: #f3f4f6; border-left: 4px solid #8b5cf6; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #4b5563; margin: 0 0 8px 0;">${safeGroupDescription}</p>
        <p style="color: #6b7280; margin: 0; font-size: 14px;"><strong>${memberCount}</strong> members</p>
      </div>
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/groups/join/${encodeURIComponent(groupName)}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Accept Invite</a>
        <a href="${process.env.BASE_URL}/groups/${encodeURIComponent(groupName)}" style="display: inline-block; background: white; border: 2px solid #6b7280; color: #6b7280; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Group</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Invitation to join "${truncate(groupName, 40)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 50. EVENT REMINDER
  async sendEventReminder(to: string, eventName: string, eventDate: string, eventTime: string, eventType: string, joinUrl: string): Promise<void> {
    const safeEventName = escapeHtml(eventName);
    const safeEventDate = escapeHtml(eventDate);
    const safeEventTime = escapeHtml(eventTime);
    const safeEventType = escapeHtml(eventType);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📅 Event Reminder</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Don't forget! <strong>"${safeEventName}"</strong> is coming up soon!
      </p>
      <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 18px;"><strong>📅 ${safeEventDate}</strong></p>
        <p style="margin: 0 0 8px 0; color: #1e40af;"><strong>🕐 Time:</strong> ${safeEventTime}</p>
        <p style="margin: 0; color: #1e40af;"><strong>📍 Type:</strong> ${safeEventType}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Set a reminder so you don't miss this valuable session!</p>
      <div style="margin-top: 16px;">
        <a href="${joinUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Join Event</a>
        <a href="${process.env.BASE_URL}/events/calendar" style="display: inline-block; background: white; border: 2px solid #6b7280; color: #6b7280; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Add to Calendar</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `📅 Reminder: "${truncate(eventName, 40)}" - ${eventDate}`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 51. BIG ANNOUNCEMENT
  async sendBigAnnouncement(to: string, title: string, announcement: string, ctaText?: string, ctaUrl?: string): Promise<void> {
    const safeTitle = escapeHtml(title);
    const safeAnnouncement = escapeHtml(announcement);
    const safeCtaText = ctaText ? escapeHtml(ctaText) : '';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📢 Important Announcement</h2>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 16px 0;">
        <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 20px;">${safeTitle}</h3>
        <p style="color: #92400e; margin: 0; line-height: 1.6;">${safeAnnouncement}</p>
      </div>
      ${ctaUrl && safeCtaText ? `
        <div style="margin-top: 16px; text-align: center;">
          <a href="${ctaUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">${safeCtaText}</a>
        </div>
      ` : ''}
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0 0 0; text-align: center;">This is an official announcement from YoForex</p>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `📢 ${title}`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 52. RECOMMENDED POSTS
  async sendRecommendedPosts(to: string, username: string, posts: Array<{
    title: string;
    author: string;
    slug: string;
    excerpt: string;
    category: string;
  }>): Promise<void> {
    const safeUsername = escapeHtml(username);
    
    const postsHtml = posts.map(post => `
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
        <h4 style="margin: 0 0 8px 0;">
          <a href="${process.env.BASE_URL}/posts/${post.slug}" style="color: #2563eb; text-decoration: none; font-weight: bold;">
            ${escapeHtml(post.title)}
          </a>
        </h4>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">by ${escapeHtml(post.author)} in ${escapeHtml(post.category)}</p>
        <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6;">${escapeHtml(truncate(post.excerpt, 150))}</p>
      </div>
    `).join('');
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📚 Recommended for You</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Hi <strong>${safeUsername}</strong>, here are some posts we think you'll enjoy based on your interests:
      </p>
      ${postsHtml}
      <div style="margin-top: 16px; text-align: center;">
        <a href="${process.env.BASE_URL}/discover" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Discover More</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: '📚 Your weekly recommended posts',
      html: (await createEmailTemplate(content)).html
    });
  },

  // 53. DOWNLOAD LIMIT REACHED
  async sendDownloadLimitReached(to: string, currentLimit: number, downloadsToday: number, resetTime: string): Promise<void> {
    const safeResetTime = escapeHtml(resetTime);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">⚠️ Download Limit Reached</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        You've reached your daily download limit.
      </p>
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Downloads Today:</strong> ${downloadsToday}/${currentLimit}</p>
        <p style="margin: 0; color: #92400e;"><strong>Limit Resets:</strong> ${safeResetTime}</p>
      </div>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>Upgrade to Premium for:</strong></p>
        <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #4b5563;">
          <li style="margin: 4px 0;">Unlimited daily downloads</li>
          <li style="margin: 4px 0;">Faster download speeds</li>
          <li style="margin: 4px 0;">Priority access to new content</li>
        </ul>
      </div>
      <a href="${process.env.BASE_URL}/upgrade" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Upgrade to Premium</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: '⚠️ Daily download limit reached',
      html: (await createEmailTemplate(content)).html
    });
  },

  // 54. FILE EXPIRING
  async sendFileExpiring(to: string, fileName: string, expiryDate: string, fileSize: string, downloadUrl: string): Promise<void> {
    const safeFileName = escapeHtml(fileName);
    const safeExpiryDate = escapeHtml(expiryDate);
    const safeFileSize = escapeHtml(fileSize);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">⏰ File Expiring Soon</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your uploaded file will expire soon and be automatically deleted.
      </p>
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>File:</strong> ${safeFileName}</p>
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Size:</strong> ${safeFileSize}</p>
        <p style="margin: 0; color: #92400e;"><strong>Expires:</strong> ${safeExpiryDate}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Download your file now or extend its expiration to keep it available.</p>
      <div style="margin-top: 16px;">
        <a href="${downloadUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Download Now</a>
        <a href="${process.env.BASE_URL}/files/extend" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Extend Expiry</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `⏰ File expiring soon: "${truncate(fileName, 40)}"`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 55. INACTIVE USER RE-ENGAGEMENT
  async sendInactiveUserReengagement(to: string, username: string, daysSinceLastVisit: number, newFeatures: string[], popularContent: Array<{title: string; slug: string}>): Promise<void> {
    const safeUsername = escapeHtml(username);
    
    const featuresHtml = newFeatures.map(feature => `<li style="margin: 4px 0;">${escapeHtml(feature)}</li>`).join('');
    const contentHtml = popularContent.map(item => `
      <li style="margin: 4px 0;">
        <a href="${process.env.BASE_URL}/content/${item.slug}" style="color: #2563eb; text-decoration: none;">
          ${escapeHtml(item.title)}
        </a>
      </li>
    `).join('');
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">👋 We Miss You, ${safeUsername}!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        It's been <strong>${daysSinceLastVisit} days</strong> since your last visit. Here's what you've missed!
      </p>
      
      ${newFeatures.length > 0 ? `
        <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #0c4a6e;"><strong>✨ New Features:</strong></p>
          <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #0c4a6e;">${featuresHtml}</ul>
        </div>
      ` : ''}
      
      ${popularContent.length > 0 ? `
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>🔥 Popular This Week:</strong></p>
          <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #4b5563;">${contentHtml}</ul>
        </div>
      ` : ''}
      
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Your trading community is waiting for you!</p>
      <a href="${process.env.BASE_URL}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Return to YoForex</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `We miss you, ${username}! Here's what's new`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 56. BIRTHDAY WISHES
  async sendBirthdayWishes(to: string, username: string, bonusCoins: number, specialOffer?: string): Promise<void> {
    const safeUsername = escapeHtml(username);
    const safeSpecialOffer = specialOffer ? escapeHtml(specialOffer) : '';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🎂 Happy Birthday, ${safeUsername}!</h2>
      <div style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; font-size: 64px;">🎉🎂🎈</p>
        <p style="margin: 8px 0 0 0; color: #be185d; font-size: 24px; font-weight: bold;">It's Your Special Day!</p>
      </div>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 16px 0;">
        The entire YoForex community wishes you a fantastic birthday! As our gift to you:
      </p>
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 18px;"><strong>🎁 Birthday Bonus: ${bonusCoins} Coins!</strong></p>
        ${safeSpecialOffer ? `<p style="margin: 8px 0 0 0; color: #92400e;">${safeSpecialOffer}</p>` : ''}
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">May your trades be profitable and your year ahead be amazing!</p>
      <a href="${process.env.BASE_URL}/wallet" style="display: inline-block; background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Claim Birthday Gift</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `🎂 Happy Birthday, ${username}! Here's your gift`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 57. ANNIVERSARY CELEBRATION
  async sendAnniversaryCelebration(to: string, username: string, years: number, rewardCoins: number, achievements: string[]): Promise<void> {
    const safeUsername = escapeHtml(username);
    
    const achievementsHtml = achievements.map(achievement => `<li style="margin: 4px 0;">${escapeHtml(achievement)}</li>`).join('');
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🎊 Happy ${years}-Year Anniversary!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Congratulations, <strong>${safeUsername}</strong>! You've been part of YoForex for ${years} ${years === 1 ? 'year' : 'years'}!
      </p>
      <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; font-size: 48px;">🏆</p>
        <p style="margin: 8px 0 0 0; color: #4c1d95; font-size: 24px; font-weight: bold;">${years} ${years === 1 ? 'Year' : 'Years'} Strong!</p>
        <p style="margin: 8px 0 0 0; color: #5b21b6; font-size: 18px;">Anniversary Reward: ${rewardCoins} Coins</p>
      </div>
      ${achievements.length > 0 ? `
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>Your Journey Highlights:</strong></p>
          <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #4b5563;">${achievementsHtml}</ul>
        </div>
      ` : ''}
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Thank you for being an invaluable member of our community!</p>
      <a href="${process.env.BASE_URL}/profile/achievements" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Achievements</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `🎊 Happy ${years}-Year YoForex Anniversary!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 58. REFERRAL BONUS
  async sendReferralBonus(to: string, referredUsername: string, bonusCoins: number, totalReferrals: number, nextMilestone?: {referrals: number; bonus: number}): Promise<void> {
    const safeReferredUsername = escapeHtml(referredUsername);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💸 Referral Bonus Earned!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Great news! <strong>${safeReferredUsername}</strong> joined YoForex using your referral link!
      </p>
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #065f46; font-size: 18px;"><strong>Bonus Earned: ${bonusCoins} Coins</strong></p>
        <p style="margin: 0; color: #065f46;"><strong>Total Referrals: ${totalReferrals}</strong></p>
      </div>
      ${nextMilestone ? `
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; color: #4b5563;">
            <strong>Next Milestone:</strong> Refer ${nextMilestone.referrals - totalReferrals} more friends to earn ${nextMilestone.bonus} bonus coins!
          </p>
        </div>
      ` : ''}
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Keep sharing and earning!</p>
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/referrals" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">View Referrals</a>
        <a href="${process.env.BASE_URL}/referrals/share" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Share Link</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `💸 You earned ${bonusCoins} coins from a referral!`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 59. SURVEY INVITATION
  async sendSurveyInvitation(to: string, surveyTitle: string, estimatedTime: string, coinReward: number, deadline: string, surveyUrl: string): Promise<void> {
    const safeSurveyTitle = escapeHtml(surveyTitle);
    const safeEstimatedTime = escapeHtml(estimatedTime);
    const safeDeadline = escapeHtml(deadline);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📝 Survey Invitation - Earn ${coinReward} Coins!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        We value your opinion! Please take a moment to complete our survey.
      </p>
      <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; color: #0c4a6e;"><strong>Survey:</strong> ${safeSurveyTitle}</p>
        <p style="margin: 0 0 8px 0; color: #0c4a6e;"><strong>Time Required:</strong> ${safeEstimatedTime}</p>
        <p style="margin: 0 0 8px 0; color: #0c4a6e;"><strong>Reward:</strong> ${coinReward} Coins</p>
        <p style="margin: 0; color: #0c4a6e;"><strong>Deadline:</strong> ${safeDeadline}</p>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">Your feedback helps us improve YoForex for everyone!</p>
      <a href="${surveyUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Start Survey</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `📝 Complete survey & earn ${coinReward} coins`,
      html: (await createEmailTemplate(content)).html
    });
  },

  // 60. MAINTENANCE NOTICE (changed from 18 to 60 to avoid duplicate numbering)
  async sendMaintenanceNotice(to: string, maintenanceDate: string, startTime: string, duration: string, affectedServices: string[], reason: string): Promise<void> {
    const safeMaintenanceDate = escapeHtml(maintenanceDate);
    const safeStartTime = escapeHtml(startTime);
    const safeDuration = escapeHtml(duration);
    const safeReason = escapeHtml(reason);
    
    const servicesHtml = affectedServices.map(service => `<li style="margin: 4px 0;">${escapeHtml(service)}</li>`).join('');
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🔧 Scheduled Maintenance Notice</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        We'll be performing scheduled maintenance to improve your experience.
      </p>
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Date:</strong> ${safeMaintenanceDate}</p>
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Start Time:</strong> ${safeStartTime}</p>
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Duration:</strong> ${safeDuration}</p>
        <p style="margin: 0; color: #92400e;"><strong>Reason:</strong> ${safeReason}</p>
      </div>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>Affected Services:</strong></p>
        <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #4b5563;">${servicesHtml}</ul>
      </div>
      <p style="color: #374151; font-size: 16px; margin: 16px 0;">We apologize for any inconvenience and appreciate your patience.</p>
      <a href="${process.env.BASE_URL}/status" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Check Status</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'YoForex'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `🔧 Scheduled Maintenance: ${maintenanceDate} at ${startTime}`,
      html: (await createEmailTemplate(content)).html
    });
  }
};
