import { db } from './db';
import { 
  adminActions, moderationQueue, reportedContent, systemSettings,
  supportTickets, announcements, ipBans, emailTemplates, adminRoles,
  userSegments, automationRules, abTests, featureFlags, apiKeys,
  webhooks, scheduledJobs, performanceMetrics, securityEvents,
  mediaLibrary, contentRevisions, users, content, forumThreads
} from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function seedAdminData() {
  console.log('🌱 Seeding admin data...');
  
  try {
    // Get existing users from database to use as admin IDs
    const existingUsers = await db.select().from(users).limit(5);
    if (existingUsers.length < 3) {
      throw new Error('Not enough users in database. Please run main seed script first.');
    }
    
    const adminIds = existingUsers.slice(0, 3).map(u => u.id);
    const allUserIds = existingUsers.map(u => u.id);
    
    console.log('📝 Seeding admin roles...');
    // 1. Admin Roles (3 admins with different permission levels)
    await db.insert(adminRoles).values([
      {
        userId: adminIds[0],
        role: 'super_admin',
        permissions: { all: true, users: true, content: true, finance: true, settings: true, security: true },
        grantedBy: adminIds[0],
        grantedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
      {
        userId: adminIds[1],
        role: 'admin',
        permissions: { users: true, content: true, finance: true, support: true },
        grantedBy: adminIds[0],
        grantedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        userId: adminIds[2],
        role: 'moderator',
        permissions: { content: true, moderation: true },
        grantedBy: adminIds[0],
        grantedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      }
    ]);

    console.log('🔨 Seeding admin actions...');
    // 2. Admin Actions (50 recent actions spread over time)
    const adminActionTypes = ['user_ban', 'user_suspend', 'user_warn', 'content_approve', 'content_reject', 
                        'withdrawal_approve', 'withdrawal_reject', 'settings_update', 'role_grant'];
    const targetTypes = ['user', 'content', 'thread', 'review', 'withdrawal', 'setting'];
    const actions = [];
    for (let i = 0; i < 50; i++) {
      actions.push({
        adminId: adminIds[i % 3],
        actionType: adminActionTypes[i % adminActionTypes.length],
        targetType: targetTypes[i % targetTypes.length],
        targetId: `target-${Math.floor(Math.random() * 1000)}`,
        details: { 
          reason: `Action ${i}: ${adminActionTypes[i % adminActionTypes.length]}`,
          note: 'Automated admin action',
          severity: ['low', 'medium', 'high'][i % 3]
        },
        ipAddress: `192.168.${Math.floor(i / 256)}.${i % 256}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000),
      });
    }
    await db.insert(adminActions).values(actions);

    console.log('🔍 Seeding moderation queue...');
    // 3. Moderation Queue (30 items in various states)
    const queueContentTypes = ['thread', 'reply', 'content', 'review', 'broker_review'];
    const moderationStatuses = ['pending', 'approved', 'rejected', 'flagged'];
    const queue = [];
    for (let i = 0; i < 30; i++) {
      const isPending = i < 10;
      queue.push({
        contentType: queueContentTypes[i % queueContentTypes.length],
        contentId: `content-mod-${i}`,
        authorId: allUserIds[i % allUserIds.length],
        status: isPending ? 'pending' : moderationStatuses[i % moderationStatuses.length],
        priorityScore: Math.floor(Math.random() * 100),
        spamScore: Math.random().toFixed(2),
        sentimentScore: (Math.random() * 2 - 1).toFixed(2),
        flaggedReasons: ['spam', 'inappropriate', 'offensive', 'scam'].slice(0, Math.floor(Math.random() * 3) + 1),
        reviewedBy: isPending ? null : adminIds[i % 3],
        reviewedAt: isPending ? null : new Date(Date.now() - (30 - i) * 60 * 60 * 1000),
        reviewNotes: isPending ? null : `Reviewed by admin. Decision: ${moderationStatuses[i % moderationStatuses.length]}`,
        createdAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
      });
    }
    await db.insert(moderationQueue).values(queue);

    console.log('🚨 Seeding reported content...');
    // 4. Reported Content (25 user reports)
    const reportReasons = ['spam', 'harassment', 'scam', 'inappropriate', 'copyright', 'fake_results'];
    const reportStatuses = ['pending', 'investigating', 'resolved', 'dismissed'];
    const reports = [];
    for (let i = 0; i < 25; i++) {
      const isResolved = i >= 15;
      reports.push({
        reporterId: allUserIds[i % allUserIds.length],
        contentType: queueContentTypes[i % queueContentTypes.length],
        contentId: `reported-content-${i}`,
        reportReason: reportReasons[i % reportReasons.length],
        description: `User report #${i}: This content violates our community guidelines. ${reportReasons[i % reportReasons.length]} detected.`,
        status: reportStatuses[i % reportStatuses.length],
        assignedTo: i < 5 ? null : adminIds[i % 3],
        resolution: isResolved ? `Report resolved: ${['Content removed', 'User warned', 'No action needed'][i % 3]}` : null,
        actionTaken: isResolved ? ['removed', 'warned', 'dismissed'][i % 3] : null,
        createdAt: new Date(Date.now() - i * 3 * 60 * 60 * 1000),
        resolvedAt: isResolved ? new Date(Date.now() - (25 - i) * 60 * 60 * 1000) : null,
      });
    }
    await db.insert(reportedContent).values(reports);

    console.log('⚙️ Seeding system settings...');
    // 5. System Settings (comprehensive platform configuration)
    const settings = [
      { settingKey: 'site_name', settingValue: { value: 'YoForex' }, category: 'general', description: 'Platform name' },
      { settingKey: 'site_tagline', settingValue: { value: 'Professional EA Trading Community' }, category: 'general', description: 'Platform tagline' },
      { settingKey: 'maintenance_mode', settingValue: { value: false }, category: 'general', description: 'Enable maintenance mode' },
      { settingKey: 'registration_enabled', settingValue: { value: true }, category: 'general', description: 'Allow new user registrations' },
      { settingKey: 'max_upload_size', settingValue: { value: 50 }, category: 'general', description: 'Maximum file upload size (MB)' },
      
      { settingKey: 'coin_exchange_rate', settingValue: { value: 0.055 }, category: 'coins', description: '100 coins = $5.50 USD' },
      { settingKey: 'min_withdrawal', settingValue: { value: 1000 }, category: 'coins', description: 'Minimum withdrawal amount in coins' },
      { settingKey: 'withdrawal_fee', settingValue: { value: 0.05 }, category: 'coins', description: 'Withdrawal fee percentage (5%)' },
      { settingKey: 'daily_checkin_reward', settingValue: { value: 10 }, category: 'coins', description: 'Daily check-in coin reward' },
      { settingKey: 'referral_bonus', settingValue: { value: 500 }, category: 'coins', description: 'Referral signup bonus' },
      
      { settingKey: 'email_from', settingValue: { value: 'noreply@yoforex.com' }, category: 'email', description: 'From email address' },
      { settingKey: 'smtp_host', settingValue: { value: 'smtp.sendgrid.net' }, category: 'email', description: 'SMTP server hostname' },
      { settingKey: 'smtp_port', settingValue: { value: 587 }, category: 'email', description: 'SMTP server port' },
      { settingKey: 'email_footer', settingValue: { value: 'YoForex - Professional Trading Community' }, category: 'email', description: 'Email footer text' },
      
      { settingKey: 'moderation_auto_approve', settingValue: { value: false }, category: 'moderation', description: 'Auto-approve content from trusted users' },
      { settingKey: 'spam_threshold', settingValue: { value: 0.7 }, category: 'moderation', description: 'Spam detection threshold (0-1)' },
      { settingKey: 'max_daily_posts', settingValue: { value: 50 }, category: 'moderation', description: 'Maximum posts per user per day' },
      
      { settingKey: 'api_rate_limit', settingValue: { value: 100 }, category: 'api', description: 'API rate limit per hour' },
      { settingKey: 'enable_analytics', settingValue: { value: true }, category: 'analytics', description: 'Enable platform analytics' },
      { settingKey: 'seo_default_title', settingValue: { value: 'YoForex - EA Trading Community' }, category: 'seo', description: 'Default SEO title' },
    ];
    
    for (const setting of settings) {
      await db.insert(systemSettings).values({
        ...setting,
        updatedBy: adminIds[0],
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    console.log('🎫 Seeding support tickets...');
    // 6. Support Tickets (20 tickets in various states)
    const ticketStatuses = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const categories = ['technical', 'billing', 'account', 'report', 'feature_request', 'other'];
    const tickets = [];
    
    for (let i = 0; i < 20; i++) {
      const hasReplies = i > 10;
      tickets.push({
        ticketNumber: `TICKET-${String(i + 10000).slice(-5)}`,
        userId: allUserIds[i % allUserIds.length],
        subject: [
          'Cannot withdraw coins',
          'Account verification issue',
          'EA download not working',
          'Payment not reflected',
          'Profile update error',
          'Feature request: Dark mode',
          'Suspicious activity on account',
        ][i % 7],
        description: `Support ticket #${i}: Detailed description of the user's issue. The user is experiencing problems with ${categories[i % categories.length]}. Please investigate and resolve.`,
        status: ticketStatuses[i % ticketStatuses.length],
        priority: priorities[i % priorities.length],
        category: categories[i % categories.length],
        assignedTo: i < 5 ? null : adminIds[(i - 5) % 3],
        replies: hasReplies ? [
          { author: 'admin', message: 'We are looking into this issue.', timestamp: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString() },
          { author: 'user', message: 'Thank you for the update.', timestamp: new Date(Date.now() - (19 - i) * 24 * 60 * 60 * 1000).toISOString() },
        ] : [],
        tags: [categories[i % categories.length], priorities[i % priorities.length]],
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * i * 24 * 60 * 60 * 1000),
        resolvedAt: ['resolved', 'closed'].includes(ticketStatuses[i % ticketStatuses.length]) 
          ? new Date(Date.now() - Math.random() * i * 24 * 60 * 60 * 1000) 
          : null,
      });
    }
    await db.insert(supportTickets).values(tickets);

    console.log('📢 Seeding announcements...');
    // 7. Announcements (platform-wide messages)
    const announcementTypes = ['info', 'warning', 'success', 'error'];
    const displayTypes = ['banner', 'modal', 'toast'];
    await db.insert(announcements).values([
      {
        title: 'Platform Maintenance Scheduled',
        content: 'We will be performing scheduled maintenance on Saturday, October 28th from 2:00 AM to 4:00 AM UTC. The platform may be unavailable during this time.',
        type: 'warning',
        targetAudience: 'all',
        displayType: 'banner',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: adminIds[0],
        createdAt: new Date(),
        views: 1250,
        clicks: 45,
      },
      {
        title: 'New Features Released!',
        content: 'Check out our latest marketplace improvements, enhanced admin dashboard, and new earning opportunities. Learn more in our blog.',
        type: 'success',
        targetAudience: 'all',
        displayType: 'modal',
        isActive: true,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        views: 3400,
        clicks: 890,
      },
      {
        title: 'Withdrawal Processing Delays',
        content: 'Due to high volume, withdrawal processing may take up to 48 hours. We apologize for the inconvenience.',
        type: 'info',
        targetAudience: 'all',
        displayType: 'banner',
        isActive: false,
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdBy: adminIds[1],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        views: 2100,
        clicks: 120,
      },
      {
        title: 'Happy Holidays!',
        content: 'Celebrate the season with 2x coin rewards on all activities. Valid until December 31st.',
        type: 'success',
        targetAudience: 'all',
        displayType: 'toast',
        isActive: false,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        views: 5600,
        clicks: 2300,
      },
    ]);

    console.log('🚫 Seeding IP bans...');
    // 8. IP Bans (security enforcement)
    const banTypes = ['permanent', 'temporary'];
    const bans = [];
    for (let i = 0; i < 12; i++) {
      const isTemp = i % 3 === 0;
      bans.push({
        ipAddress: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        reason: [
          'Multiple failed login attempts',
          'Spam posting detected',
          'DDoS attack attempt',
          'Fraudulent activity',
          'Automated bot behavior',
          'Violation of terms of service',
        ][i % 6],
        banType: isTemp ? 'temporary' : 'permanent',
        expiresAt: isTemp ? new Date(Date.now() + (7 + i) * 24 * 60 * 60 * 1000) : null,
        bannedBy: adminIds[i % 3],
        bannedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        isActive: i < 10,
      });
    }
    await db.insert(ipBans).values(bans);

    console.log('📧 Seeding email templates...');
    // 9. Email Templates (transactional emails)
    const emailCategories = ['onboarding', 'transactions', 'finance', 'notifications', 'marketing', 'support'];
    const templates = [
      { 
        templateKey: 'welcome_email', 
        subject: 'Welcome to YoForex, {{username}}!', 
        htmlBody: '<h1>Welcome {{username}}!</h1><p>Thank you for joining our trading community. Start exploring EAs and earning coins today!</p>',
        textBody: 'Welcome {{username}}! Thank you for joining our trading community.',
        category: 'onboarding', 
        variables: ['username', 'email'] 
      },
      { 
        templateKey: 'email_verification', 
        subject: 'Verify your email address', 
        htmlBody: '<p>Hi {{username}}, please verify your email by clicking: {{verificationLink}}</p>',
        textBody: 'Please verify your email: {{verificationLink}}',
        category: 'onboarding', 
        variables: ['username', 'verificationLink'] 
      },
      { 
        templateKey: 'purchase_confirmation', 
        subject: 'Purchase Confirmed - {{itemName}}', 
        htmlBody: '<p>Your purchase of {{itemName}} for {{amount}} coins is confirmed.</p><p>Download link: {{downloadLink}}</p>',
        textBody: 'Purchase confirmed: {{itemName}} for {{amount}} coins. Download: {{downloadLink}}',
        category: 'transactions', 
        variables: ['username', 'itemName', 'amount', 'downloadLink'] 
      },
      { 
        templateKey: 'withdrawal_approved', 
        subject: 'Withdrawal Request Approved', 
        htmlBody: '<p>Your withdrawal of {{amount}} coins ({{cryptoAmount}} {{cryptoType}}) has been approved and is being processed.</p>',
        textBody: 'Withdrawal approved: {{amount}} coins ({{cryptoAmount}} {{cryptoType}})',
        category: 'finance', 
        variables: ['username', 'amount', 'cryptoAmount', 'cryptoType'] 
      },
      { 
        templateKey: 'withdrawal_rejected', 
        subject: 'Withdrawal Request Rejected', 
        htmlBody: '<p>Your withdrawal request has been rejected. Reason: {{reason}}</p>',
        textBody: 'Withdrawal rejected. Reason: {{reason}}',
        category: 'finance', 
        variables: ['username', 'amount', 'reason'] 
      },
      { 
        templateKey: 'password_reset', 
        subject: 'Reset Your Password', 
        htmlBody: '<p>Reset your password by clicking: {{resetLink}}</p><p>This link expires in 1 hour.</p>',
        textBody: 'Reset password: {{resetLink}} (expires in 1 hour)',
        category: 'support', 
        variables: ['username', 'resetLink'] 
      },
      { 
        templateKey: 'content_approved', 
        subject: 'Your content has been approved!', 
        htmlBody: '<p>Congratulations! Your {{contentType}} "{{contentTitle}}" has been approved and is now live.</p>',
        textBody: 'Your {{contentType}} "{{contentTitle}}" has been approved!',
        category: 'notifications', 
        variables: ['username', 'contentType', 'contentTitle', 'contentUrl'] 
      },
      { 
        templateKey: 'content_rejected', 
        subject: 'Content Review Update', 
        htmlBody: '<p>Your {{contentType}} was not approved. Reason: {{reason}}</p>',
        textBody: 'Content not approved. Reason: {{reason}}',
        category: 'notifications', 
        variables: ['username', 'contentType', 'reason'] 
      },
      { 
        templateKey: 'monthly_summary', 
        subject: 'Your Monthly Activity Summary', 
        htmlBody: '<h2>Hi {{username}},</h2><p>This month: {{earnings}} coins earned, {{posts}} posts created, {{downloads}} downloads.</p>',
        textBody: 'Monthly summary: {{earnings}} coins, {{posts}} posts, {{downloads}} downloads',
        category: 'marketing', 
        variables: ['username', 'earnings', 'posts', 'downloads'] 
      },
      { 
        templateKey: 'support_ticket_reply', 
        subject: 'New reply on ticket {{ticketNumber}}', 
        htmlBody: '<p>Your support ticket {{ticketNumber}} has a new reply from our team.</p>',
        textBody: 'New reply on ticket {{ticketNumber}}',
        category: 'support', 
        variables: ['username', 'ticketNumber', 'replyText'] 
      },
    ];
    
    for (const template of templates) {
      await db.insert(emailTemplates).values({
        ...template,
        isActive: true,
        updatedBy: adminIds[0],
        updatedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      });
    }

    console.log('👥 Seeding user segments...');
    // 10. User Segments (targeting and analytics)
    await db.insert(userSegments).values([
      { 
        name: 'High Value Users', 
        description: 'Users with over 10,000 coins in balance', 
        rules: { coinBalance: { gt: 10000 } }, 
        userCount: 25, 
        createdBy: adminIds[0], 
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), 
        updatedAt: new Date() 
      },
      { 
        name: 'New Users', 
        description: 'Users registered within the last 30 days', 
        rules: { registeredDays: { lte: 30 } }, 
        userCount: 150, 
        createdBy: adminIds[0], 
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
        updatedAt: new Date() 
      },
      { 
        name: 'Content Creators', 
        description: 'Users who published 5 or more items', 
        rules: { publishedContent: { gte: 5 } }, 
        userCount: 42, 
        createdBy: adminIds[0], 
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), 
        updatedAt: new Date() 
      },
      { 
        name: 'Active Contributors', 
        description: 'Users with 20+ forum posts in last month', 
        rules: { monthlyPosts: { gte: 20 } }, 
        userCount: 88, 
        createdBy: adminIds[1], 
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), 
        updatedAt: new Date() 
      },
      { 
        name: 'At Risk - Inactive', 
        description: 'Users with no activity in 60+ days', 
        rules: { lastActivityDays: { gte: 60 } }, 
        userCount: 35, 
        createdBy: adminIds[1], 
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), 
        updatedAt: new Date() 
      },
      { 
        name: 'Premium Buyers', 
        description: 'Users who made 3+ purchases', 
        rules: { totalPurchases: { gte: 3 } }, 
        userCount: 67, 
        createdBy: adminIds[0], 
        createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), 
        updatedAt: new Date() 
      },
    ]);

    console.log('🤖 Seeding automation rules...');
    // 11. Automation Rules (workflow automation)
    const triggerTypes = ['user_signup', 'content_published', 'purchase_made', 'inactivity_detected', 'milestone_reached'];
    const automationActionTypes = ['send_email', 'award_badge', 'add_coins', 'send_notification', 'assign_role'];
    
    await db.insert(automationRules).values([
      {
        name: 'Welcome Email on Signup',
        description: 'Send welcome email when new user registers',
        triggerType: 'user_signup',
        triggerConfig: { event: 'user.created' },
        actionType: 'send_email',
        actionConfig: { templateKey: 'welcome_email', delay: 0 },
        isActive: true,
        executionCount: 1523,
        lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Award Early Adopter Badge',
        description: 'Give badge to users who joined in first month',
        triggerType: 'user_signup',
        triggerConfig: { dateRange: { start: '2024-01-01', end: '2024-01-31' } },
        actionType: 'award_badge',
        actionConfig: { badgeType: 'early_adopter' },
        isActive: false,
        executionCount: 234,
        lastExecuted: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Reward First Purchase',
        description: 'Give 100 bonus coins on first purchase',
        triggerType: 'purchase_made',
        triggerConfig: { condition: 'first_purchase' },
        actionType: 'add_coins',
        actionConfig: { amount: 100, description: 'First purchase bonus' },
        isActive: true,
        executionCount: 456,
        lastExecuted: new Date(Date.now() - 5 * 60 * 60 * 1000),
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Re-engage Inactive Users',
        description: 'Send email to users inactive for 30 days',
        triggerType: 'inactivity_detected',
        triggerConfig: { days: 30 },
        actionType: 'send_email',
        actionConfig: { templateKey: 'reengagement_email' },
        isActive: true,
        executionCount: 89,
        lastExecuted: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdBy: adminIds[1],
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Notify on Content Approval',
        description: 'Send notification when content is approved',
        triggerType: 'content_published',
        triggerConfig: { status: 'approved' },
        actionType: 'send_notification',
        actionConfig: { type: 'content_approved' },
        isActive: true,
        executionCount: 678,
        lastExecuted: new Date(Date.now() - 1 * 60 * 60 * 1000),
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('🧪 Seeding A/B tests...');
    // 12. A/B Tests (experimentation)
    const testStatuses = ['draft', 'running', 'paused', 'completed'];
    await db.insert(abTests).values([
      {
        name: 'Homepage Hero Layout',
        description: 'Test different hero section layouts on homepage',
        variants: [
          { id: 'A', name: 'Original', description: 'Current hero layout', allocation: 50 },
          { id: 'B', name: 'Minimal', description: 'Simplified hero with CTA', allocation: 50 },
        ],
        trafficAllocation: { A: 50, B: 50 },
        status: 'running',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        winnerVariant: null,
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Pricing Page CTA Button',
        description: 'Test button text: "Buy Now" vs "Get Started"',
        variants: [
          { id: 'A', name: 'Buy Now', allocation: 50 },
          { id: 'B', name: 'Get Started', allocation: 50 },
        ],
        trafficAllocation: { A: 50, B: 50 },
        status: 'completed',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        winnerVariant: 'B',
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Email Subject Line Test',
        description: 'Test welcome email subject lines',
        variants: [
          { id: 'A', name: 'Welcome to YoForex', allocation: 33 },
          { id: 'B', name: 'Start Trading with YoForex', allocation: 33 },
          { id: 'C', name: 'Your Trading Journey Begins', allocation: 34 },
        ],
        trafficAllocation: { A: 33, B: 33, C: 34 },
        status: 'paused',
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        winnerVariant: null,
        createdBy: adminIds[1],
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('🚩 Seeding feature flags...');
    // 13. Feature Flags (progressive rollout)
    await db.insert(featureFlags).values([
      {
        flagKey: 'new_dashboard_ui',
        name: 'New Dashboard UI',
        description: 'Enable redesigned dashboard interface',
        isEnabled: true,
        rolloutPercentage: 50,
        targetUsers: [adminIds[0], adminIds[1]],
        targetSegments: [],
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        flagKey: 'ai_content_moderation',
        name: 'AI Content Moderation',
        description: 'Use AI to detect spam and inappropriate content',
        isEnabled: true,
        rolloutPercentage: 100,
        targetUsers: [],
        targetSegments: [],
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        flagKey: 'social_sharing',
        name: 'Social Media Sharing',
        description: 'Allow users to share content on social media',
        isEnabled: false,
        rolloutPercentage: 0,
        targetUsers: [adminIds[0]],
        targetSegments: [],
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        flagKey: 'dark_mode',
        name: 'Dark Mode',
        description: 'Enable dark theme option',
        isEnabled: true,
        rolloutPercentage: 100,
        targetUsers: [],
        targetSegments: [],
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        flagKey: 'referral_program',
        name: 'Referral Program',
        description: 'Enable referral rewards system',
        isEnabled: true,
        rolloutPercentage: 100,
        targetUsers: [],
        targetSegments: [],
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('🔑 Seeding API keys...');
    // 14. API Keys (third-party integrations)
    const apiPermissions = ['read', 'write', 'delete', 'admin'];
    await db.insert(apiKeys).values([
      {
        key: `yfx_live_${Math.random().toString(36).substring(2, 15)}`,
        name: 'Production API Key',
        userId: adminIds[0],
        permissions: ['read', 'write'],
        rateLimit: 1000,
        isActive: true,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
      {
        key: `yfx_test_${Math.random().toString(36).substring(2, 15)}`,
        name: 'Testing API Key',
        userId: adminIds[1],
        permissions: ['read'],
        rateLimit: 100,
        isActive: true,
        lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        key: `yfx_dev_${Math.random().toString(36).substring(2, 15)}`,
        name: 'Development Key',
        userId: adminIds[0],
        permissions: ['read', 'write', 'delete'],
        rateLimit: 500,
        isActive: true,
        lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000),
        expiresAt: null,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      },
      {
        key: `yfx_archived_${Math.random().toString(36).substring(2, 15)}`,
        name: 'Archived Key',
        userId: adminIds[1],
        permissions: ['read'],
        rateLimit: 60,
        isActive: false,
        lastUsed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('🪝 Seeding webhooks...');
    // 15. Webhooks (event notifications)
    const webhookEvents = ['user.created', 'user.updated', 'content.published', 'purchase.completed', 'withdrawal.approved'];
    await db.insert(webhooks).values([
      {
        url: 'https://api.example.com/webhooks/yoforex',
        events: ['user.created', 'user.updated'],
        secret: Math.random().toString(36).substring(2, 18),
        isActive: true,
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lastTriggered: new Date(Date.now() - 3 * 60 * 60 * 1000),
        successCount: 1234,
        failureCount: 12,
      },
      {
        url: 'https://analytics.platform.com/events',
        events: ['content.published', 'purchase.completed'],
        secret: Math.random().toString(36).substring(2, 18),
        isActive: true,
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        lastTriggered: new Date(Date.now() - 1 * 60 * 60 * 1000),
        successCount: 5678,
        failureCount: 45,
      },
      {
        url: 'https://slack.com/webhooks/finance-alerts',
        events: ['withdrawal.approved', 'purchase.completed'],
        secret: Math.random().toString(36).substring(2, 18),
        isActive: true,
        createdBy: adminIds[0],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastTriggered: new Date(Date.now() - 12 * 60 * 60 * 1000),
        successCount: 234,
        failureCount: 3,
      },
      {
        url: 'https://old-system.legacy.com/webhook',
        events: ['user.created'],
        secret: Math.random().toString(36).substring(2, 18),
        isActive: false,
        createdBy: adminIds[1],
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        lastTriggered: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        successCount: 456,
        failureCount: 234,
      },
    ]);

    console.log('⏰ Seeding scheduled jobs...');
    // 16. Scheduled Jobs (cron management)
    await db.insert(scheduledJobs).values([
      {
        jobKey: 'update_user_reputation',
        name: 'Update User Reputation Scores',
        description: 'Recalculate reputation scores for all users based on activity',
        schedule: '0 0 * * *',
        isActive: true,
        lastRun: new Date(Date.now() - 3 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 21 * 60 * 60 * 1000),
        lastStatus: 'success',
        lastError: null,
        executionCount: 87,
      },
      {
        jobKey: 'clean_expired_sessions',
        name: 'Clean Expired Sessions',
        description: 'Remove expired user sessions from database',
        schedule: '0 */6 * * *',
        isActive: true,
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000),
        lastStatus: 'success',
        lastError: null,
        executionCount: 342,
      },
      {
        jobKey: 'send_daily_digest',
        name: 'Send Daily Digest Emails',
        description: 'Send daily activity summary to subscribed users',
        schedule: '0 8 * * *',
        isActive: true,
        lastRun: new Date(Date.now() - 17 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 7 * 60 * 60 * 1000),
        lastStatus: 'success',
        lastError: null,
        executionCount: 92,
      },
      {
        jobKey: 'backup_database',
        name: 'Backup Database',
        description: 'Create automated database backup',
        schedule: '0 2 * * *',
        isActive: true,
        lastRun: new Date(Date.now() - 5 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 19 * 60 * 60 * 1000),
        lastStatus: 'success',
        lastError: null,
        executionCount: 115,
      },
      {
        jobKey: 'process_withdrawals',
        name: 'Process Pending Withdrawals',
        description: 'Process approved withdrawal requests',
        schedule: '0 */3 * * *',
        isActive: true,
        lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000),
        lastStatus: 'success',
        lastError: null,
        executionCount: 287,
      },
      {
        jobKey: 'generate_analytics',
        name: 'Generate Analytics Reports',
        description: 'Generate daily analytics and insights',
        schedule: '0 1 * * *',
        isActive: true,
        lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 18 * 60 * 60 * 1000),
        lastStatus: 'success',
        lastError: null,
        executionCount: 98,
      },
    ]);

    console.log('📊 Seeding performance metrics...');
    // 17. Performance Metrics (monitoring)
    const metricTypes = ['api', 'database', 'cache', 'background_job', 'system'];
    const metrics = [];
    for (let i = 0; i < 100; i++) {
      const hoursAgo = Math.floor(i / 4);
      metrics.push({
        metricType: metricTypes[i % metricTypes.length],
        metricName: [
          'response_time',
          'query_duration',
          'cache_hit_rate',
          'job_execution_time',
          'cpu_usage',
          'memory_usage',
          'request_count',
          'error_rate',
        ][i % 8],
        value: (Math.random() * 100).toFixed(2),
        unit: ['ms', 'ms', '%', 'ms', '%', 'MB', 'count', '%'][i % 8],
        metadata: {
          environment: 'production',
          server: `server-${(i % 3) + 1}`,
        },
        recordedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      });
    }
    await db.insert(performanceMetrics).values(metrics);

    console.log('🔒 Seeding security events...');
    // 18. Security Events (security monitoring)
    const eventTypes = ['failed_login', 'suspicious_activity', 'brute_force', 'unauthorized_access', 'data_breach_attempt'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const events = [];
    for (let i = 0; i < 30; i++) {
      const isResolved = i >= 20;
      events.push({
        eventType: eventTypes[i % eventTypes.length],
        severity: severities[i % severities.length],
        userId: i % 5 === 0 ? null : allUserIds[i % allUserIds.length],
        ipAddress: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        details: {
          event: eventTypes[i % eventTypes.length],
          attempts: Math.floor(Math.random() * 10) + 1,
          target: 'login_endpoint',
          userAgent: 'Mozilla/5.0',
        },
        isResolved: isResolved,
        resolvedBy: isResolved ? adminIds[i % 3] : null,
        resolvedAt: isResolved ? new Date(Date.now() - (30 - i) * 60 * 60 * 1000) : null,
        createdAt: new Date(Date.now() - i * 3 * 60 * 60 * 1000),
      });
    }
    await db.insert(securityEvents).values(events);

    console.log('🖼️ Seeding media library...');
    // 19. Media Library (uploaded files)
    const mimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const mediaFiles = [];
    for (let i = 0; i < 25; i++) {
      const mimeType = mimeTypes[i % mimeTypes.length];
      const isImage = mimeType.startsWith('image/');
      mediaFiles.push({
        filename: `file_${i}_${Math.random().toString(36).substring(7)}.${mimeType.split('/')[1]}`,
        originalFilename: `user_upload_${i}.${mimeType.split('/')[1]}`,
        filePath: `/uploads/media/${new Date().getFullYear()}/${new Date().getMonth() + 1}/file_${i}.${mimeType.split('/')[1]}`,
        fileSize: Math.floor(Math.random() * 5000000) + 100000,
        mimeType: mimeType,
        width: isImage ? Math.floor(Math.random() * 2000) + 800 : null,
        height: isImage ? Math.floor(Math.random() * 1500) + 600 : null,
        altText: isImage ? `Image ${i}: EA performance chart` : null,
        tags: ['upload', mimeType.split('/')[0], `user-${i % allUserIds.length}`],
        uploadedBy: allUserIds[i % allUserIds.length],
        uploadedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        usageCount: Math.floor(Math.random() * 50),
      });
    }
    await db.insert(mediaLibrary).values(mediaFiles);

    console.log('📝 Seeding content revisions...');
    // 20. Content Revisions (version history)
    const revisionContentTypes = ['thread', 'content', 'profile', 'announcement'];
    const revisions = [];
    for (let i = 0; i < 40; i++) {
      revisions.push({
        contentType: revisionContentTypes[i % revisionContentTypes.length],
        contentId: `content-${Math.floor(i / 3)}`,
        revisionNumber: (i % 3) + 1,
        data: {
          title: `Version ${(i % 3) + 1} of content`,
          body: `This is revision ${(i % 3) + 1} with updated content`,
          metadata: { edited: true, version: (i % 3) + 1 },
        },
        changedFields: ['title', 'body', 'updatedAt'],
        changedBy: allUserIds[i % allUserIds.length],
        changeReason: [
          'Initial creation',
          'Fixed typos',
          'Updated information',
          'Added more details',
          'Corrected errors',
        ][i % 5],
        createdAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
      });
    }
    await db.insert(contentRevisions).values(revisions);

    console.log('✅ Admin data seeded successfully!');
    console.log('📊 Summary:');
    console.log('  - Admin Roles: 3');
    console.log('  - Admin Actions: 50');
    console.log('  - Moderation Queue: 30');
    console.log('  - Reported Content: 25');
    console.log('  - System Settings: 20');
    console.log('  - Support Tickets: 20');
    console.log('  - Announcements: 4');
    console.log('  - IP Bans: 12');
    console.log('  - Email Templates: 10');
    console.log('  - User Segments: 6');
    console.log('  - Automation Rules: 5');
    console.log('  - A/B Tests: 3');
    console.log('  - Feature Flags: 5');
    console.log('  - API Keys: 4');
    console.log('  - Webhooks: 4');
    console.log('  - Scheduled Jobs: 6');
    console.log('  - Performance Metrics: 100');
    console.log('  - Security Events: 30');
    console.log('  - Media Library: 25');
    console.log('  - Content Revisions: 40');
    
    return { success: true, message: 'Admin data seeded successfully' };
  } catch (error) {
    console.error('❌ Error seeding admin data:', error);
    throw error;
  }
}

// Check if this file is being run directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  seedAdminData()
    .then(() => {
      console.log('✅ Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
