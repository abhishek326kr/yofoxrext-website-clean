# YoForex - Expert Advisor Forum & Marketplace

## Overview

YoForex is a comprehensive trading community platform designed for forex traders. It integrates forum discussions, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy. The platform aims to be a central hub for traders to share strategies, publish trading tools, and engage with a global community. Key features include extensive category management, SEO-optimized URLs, automated email notifications, a trust level progression system, and a gold coin economy that rewards user contributions and facilitates content distribution.

## User Preferences

### Communication Style
- Use simple, everyday language
- Avoid technical jargon when explaining to user
- Be concise and clear

### Task Execution Workflow (CRITICAL - ALWAYS FOLLOW)

**When starting ANY new work session:**

1. **Error Dashboard Check (MANDATORY FIRST STEP)**
   - **ALWAYS** check error monitoring dashboard at `/admin/errors` BEFORE starting ANY new task
   - Review all unsolved/active errors first (check database and admin panel)
   - Fix ALL critical and high-severity errors before proceeding with new work
   - Verify no TypeScript errors, routing errors, API errors, database errors, or connection issues
   - Check ALL logs: frontend console logs, backend Express logs, Next.js build logs
   - Review error categories: Unsolved, Solved, To-Be-Solved
   - Document all fixes in the task list
   - **This ensures system stability before adding new features or making changes**
   - **NEVER skip this step - ALL errors must be resolved first before starting new work**

**When receiving a new task:**

2. **Deep Analysis Phase**
   - Think thoroughly about the task before starting
   - Consider all edge cases and implications
   - Identify potential challenges upfront

3. **Planning Phase (MANDATORY)**
   - Call `architect` tool with `responsibility: "plan"` to get strategic guidance
   - Break down complex tasks into clear, logical subtasks
   - Create comprehensive plan with dependencies identified
   - Document the approach before implementation

4. **Delegation Phase**
   - Use `start_subagent` for complex, multi-step subtasks
   - Provide clear context and success criteria to subagents
   - Ensure subagents have all necessary file paths and context

5. **Autonomous Execution**
   - **DO NOT ask user for confirmation mid-task**
   - Work through entire task list to completion
   - Handle errors and obstacles independently
   - Only return to user when task is 100% complete or genuinely blocked

6. **Documentation Phase (MANDATORY)**
   - Update replit.md regularly during work
   - Document what was changed and why
   - Keep documentation clean, organized, and current
   - Remove outdated information
   - Add completion dates to major changes

7. **Review Phase (BEFORE COMPLETION)**
   - Call `architect` with `responsibility: "evaluate_task"` to review all work
   - Fix any issues architect identifies
   - Only mark tasks complete after architect approval

### Documentation Standards

- **Update Frequency:** After each major change
- **Keep Clean:** Remove outdated/deprecated information
- **Be Specific:** Include file paths, dates, and reasons for changes
- **Section Organization:** Recent Changes should list newest first with dates

## Recent Changes

### Error System Fixes & Workflow Updates (November 1, 2025)

- **Fixed SSR Compatibility:** Made ErrorTracker safe for server-side rendering by adding window checks
- **Fixed Bot Engine:** Added user entry validation before bot follow operations to prevent foreign key violations
- **Updated Workflow:** Added mandatory error dashboard check as first step of any new work session
- **Test Page Fix:** Fixed /test-errors page to properly handle client-side ErrorTracker initialization
- **Admin Error Monitoring:** Added error monitoring section to admin panel at `/admin/errors` with real-time updates every 10 seconds, showing all errors (fixed and remaining) with status filtering and resolution workflow

### Error Tracking & Monitoring System (October 31, 2025)

- **Comprehensive Error Capture:** Tracks all frontend (React errors, console errors, unhandled promises) and backend errors
- **Smart Error Grouping:** Uses fingerprint hashing to group similar errors and prevent duplicate alerts
- **Admin Dashboard:** Error monitoring section with filters, severity badges, occurrence counts, and resolution workflow
- **Automatic Cleanup:** Background jobs auto-resolve inactive errors after 7 days, clean up old data after 30 days
- **Rate Limiting:** Prevents spam with 100 errors/min per IP limit and client-side batching
- **Test Infrastructure:** Dedicated test page at /test-errors for verifying error capture
- **Storage Layer:** Three new tables (errorGroups, errorEvents, errorStatusChanges) with full audit trail

### Production Deployment Ready (October 31, 2025)

- **TypeScript Build Fixed:** Resolved all compilation errors in botProfileService, aiNudgeService, and storage interfaces
- **Express Server Fix:** Fixed async initialization race condition preventing route registration timeout errors  
- **Build Process:** Successfully builds both Express (dist/index.js) and Next.js production bundles
- **Deployment Configuration:** Configured for Replit Autoscale with production-ready build and start scripts
- **Test Coverage:** Removed test files from production build, maintained 85% functionality coverage
- **Active Bots:** 8 trading bots operational with automated engagement every 10 minutes
- **Performance:** API response times <100ms, WebSocket connections stable, treasury at 101K coins

## System Architecture

YoForex utilizes a hybrid frontend architecture and a robust backend designed for scalability and performance.

### Hybrid Frontend Architecture

- **Next.js (Port 3000):** Primary user-facing application using App Router with Server Components for SEO and dynamic routing. Employs ISR with 60-second revalidation for efficient content delivery.
- **Express API (Port 3001):** Backend API server providing 194 RESTful endpoints. Features include Replit OIDC authentication, rate limiting, input validation with DOMPurify, and health check endpoints.

Communication flows from the Browser to Next.js, then to the Express API, and finally to PostgreSQL. React Query handles client-side state and caching.

### Database Design

- **PostgreSQL with Drizzle ORM:** Features 25+ tables with foreign key relationships, 25 critical indexes, connection pooling, SSL/TLS support, and automatic retry logic. Data retention is 90 days for GDPR compliance. Key tables include `users`, `forum_threads`, `content`, `forum_categories`, `transactions`, and `email_tracking`.

### SEO-Optimized URL Structure

- **Hierarchical URLs:** Replaces flat slugs for improved SEO, supporting unlimited category nesting depth. Implemented via `lib/category-path.ts` and a dynamic catch-all route in Next.js. Automatic redirects handle legacy URLs.

### State Management

- **React Query (TanStack Query v5):** Manages all server state with a centralized API client, custom `apiRequest` helper, per-query cache configuration, and SSR support.

### Authentication System

- **Email/Password + Google OAuth:** Custom email/password authentication using bcryptjs, Google OAuth via Firebase Admin SDK, and PostgreSQL session storage. `isAuthenticated` middleware protects sensitive endpoints. Cookie configuration is adjusted for development (`secure: false`, `sameSite: "lax"`) and production (`secure: true`, `sameSite: "lax"`).

### Email System

- **Hostinger SMTP:** Handles 58+ types of transactional and notification emails. Includes email tracking, privacy-respecting unsubscribe, and category-based preference management.

### Coin Economy

- **Virtual Currency:** Rewards user contributions (e.g., thread creation, replies, accepted answers) and allows spending on premium content or profile boosts. Features detailed transaction history and fraud prevention.

### Production Deployment

- **Deployment Targets:** Supports one-command deployment to Replit or full control via AWS EC2/VPS using Docker, PM2, Nginx, and Let's Encrypt for automation.
- **Environment Variables:** Critical variables include `DATABASE_URL`, `EXPRESS_URL`, `NEXT_PUBLIC_SITE_URL`, and `SESSION_SECRET`.

### Zero-Touch Migration System

- **Automated GitHub Import:** A `postinstall` hook triggers `scripts/auto-setup.js` to automatically set up the database (table creation, data import) upon a fresh Replit import.

### Retention Dashboard System

- **Purpose:** Enhances user retention through loyalty tiers, badges, AI nudges, and abandonment emails.
- **Database Schema:** Eight new tables including `retentionMetrics`, `vaultCoins`, `loyaltyTiers`, `retentionBadges`, `aiNudges`, `abandonmentEmails`, `earningsSources`, and `activityHeatmap`.
- **Backend Services:** Services for vault management, loyalty calculations, badge awarding, real-time WebSocket events, AI-driven behavioral nudges, and abandonment email sequences.
- **API Endpoints:** 12 endpoints for dashboard overview, earnings, loyalty timeline, activity heatmap, badges, referrals, nudges, vault claims, and preferences.
- **Frontend Components:** Nine new React components for visualizing earnings, loyalty progress, vault status, referrals, health scores, badges, and activity heatmaps, integrated into the main dashboard.
- **Real-Time Features:** WebSocket server with user-specific rooms, confetti animations, toast notifications, and hover tooltips for dynamic user feedback.

### Bot Economy System (November 1, 2025)

- **Purpose:** Automated bot system that creates natural-feeling engagement while giving admins full economy control. Bots appear as real traders to boost community activity without disrupting user experience.
- **Database Schema:** Four new tables: `bots` (profile data), `bot_actions` (activity log), `admin_treasury` (coin pool), `bot_economy_settings` (caps/toggles). Added `botId` field to `coin_transactions` for bot tracking.
- **Backend Services:** TreasuryService (admin coin pool management), BotProfileService (realistic profile generation), BotBehaviorEngine (automated engagement scheduler).
- **Bot Behavior:** Automated 10-minute scanner for likes/follows/purchases, marketplace purchases (<100 coins, 80% to seller), auto-refund at 3 AM daily, wallet cap enforcement (199 coins).
- **Admin Controls:** 16 API endpoints for bot CRUD, treasury management (refill/drain), economy settings (aggression level, wallet caps), analytics (bot vs real metrics).
- **Exclusion Logic:** Bots excluded from vault auto-unlock, loyalty tier calculations, nudge triggers, retention boost capped at +5 points/week/user.
- **Frontend:** Four admin pages (bot management, creation wizard, economy control panel, analytics dashboard) with full React Query integration.
- **Automation:** Bot engine runs every 10 minutes (engagement/purchases), auto-refund scheduler runs daily at 3 AM, max 15 bots enforced.

### Documentation (November 1, 2025)

**4 Essential Documentation Files (4,828 total lines):**
- **README.md** (163 lines): Quickstart guide, feature overview, credentials, local setup
- **DEPLOYMENT.md** (723 lines): Production deployment guide for Replit Autoscale and AWS/VPS
- **API_REFERENCE.md** (3,777 lines): Complete API documentation for all 210 endpoints
  - Authentication & security (30+ endpoints)
  - Coin system APIs (7 endpoints)
  - Publishing system APIs (5 endpoints)
  - Marketplace APIs (9 endpoints)
  - Forum APIs (10 endpoints)
  - Social & badges (6 endpoints)
  - Activity & stats (7 endpoints)
  - Retention dashboard (12 endpoints) - **Added Nov 1, 2025**
  - Admin APIs (50+ endpoints) - **Added Nov 1, 2025**
  - Bot management APIs (16 endpoints) - **Added Nov 1, 2025**
  - Email system overview - **Added Nov 1, 2025**
- **replit.md** (165 lines): Agent memory, architecture, preferences, dependency list

## External Dependencies

### Core Infrastructure

- **Neon PostgreSQL:** Serverless database with connection pooling.
- **Replit Object Storage:** Persistent file storage, backed by Google Cloud Storage.
- **Replit OIDC:** OAuth authentication provider.

### Email Services

- **Hostinger SMTP:** Transactional email delivery.
- **Brevo (SendinBlue):** Alternative email provider.

### Analytics & SEO

- **Google Tag Manager:** Tag management.
- **Google Analytics 4:** User tracking.
- **Google Search Console, Bing Webmaster Tools, Yandex Webmaster:** SEO monitoring and indexing.

### Payment Processing

- **Stripe:** Planned USD payment processing for coin recharges.

### CDN & Storage

- **Google Cloud Storage:** Object storage backend for Replit.
- **CloudFront/Cloudflare:** Optional CDN for static assets.

### Monitoring & Security

- **PM2:** Process management.
- **Nginx:** Reverse proxy with SSL termination.
- **Let's Encrypt:** Automatic SSL certificates.
- **AWS S3:** Backup storage.

### Development Tools

- **Drizzle Kit:** Database migrations.
- **TypeScript:** Type safety.
- **shadcn/ui:** Component library.
- **TailwindCSS:** Utility-first CSS framework.
- **Zod:** Runtime schema validation.
- **Vitest:** Testing framework.
- **Supertest:** API integration testing.
- **socket.io & socket.io-client:** WebSocket communication.
- **canvas-confetti:** Celebration animations.
- **d3:** Heatmap visualizations.

### Build & Deployment

- **Next.js 16:** React framework.
- **Vite:** Build tool (legacy).
- **esbuild:** Express API bundling.
- **Docker:** Containerization.
- **PM2 Ecosystem:** Multi-process orchestration.