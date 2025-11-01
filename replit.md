# YoForex - Expert Advisor Forum & Marketplace

## Overview

YoForex is a comprehensive trading community platform designed for forex traders. It integrates forum discussions, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy. The platform aims to be a central hub for traders to share strategies, publish trading tools, and engage with a global community. Key capabilities include extensive category management, SEO-optimized URLs, automated email notifications, a trust level progression system, and a gold coin economy that rewards user contributions and facilitates content distribution. The platform enhances user retention through loyalty tiers, badges, AI nudges, and abandonment emails, alongside an automated bot system to stimulate community activity without disrupting user experience.

## Recent Changes

### November 1, 2025 - Login Validation Fix
- **Fixed admin login issue:** Updated authentication validation schema to accept email field instead of username
- **Files modified:** `server/localAuth.ts` (loginSchema and LocalStrategy configuration)
- **Impact:** Both `/api/login` and `/api/auth/login` endpoints now properly accept email/password credentials
- **Status:** ✅ Deployed and tested successfully

### October 31, 2025 - Production Deployment Preparation
- **Fixed all TypeScript errors:** Resolved null safety issues in CoinBalance.tsx, Header.tsx, and other components
- **Fixed API errors:** Corrected 404 errors for non-existent endpoints, removed invalid API calls
- **Fixed metadata warnings:** Moved themeColor to viewport export across 13 Next.js pages
- **Production build:** Successfully built Express API (1.1mb) and Next.js (120+ pages)
- **Deployment config:** Configured Replit autoscale deployment with build and run commands
- **Status:** ✅ Production-ready, zero errors

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

## System Architecture

YoForex utilizes a hybrid frontend architecture and a robust backend designed for scalability and performance.

### Hybrid Frontend Architecture

- **Next.js (Port 3000):** Primary user-facing application using App Router with Server Components for SEO and dynamic routing. Employs ISR with 60-second revalidation.
- **Express API (Port 3001):** Backend API server providing 194 RESTful endpoints, featuring Replit OIDC authentication, rate limiting, and input validation. Communication flows from Browser to Next.js, then to Express API, and finally to PostgreSQL. React Query handles client-side state and caching.

### Database Design

- **PostgreSQL with Drizzle ORM:** Features 25+ tables with foreign key relationships, 25 critical indexes, connection pooling, SSL/TLS support, and automatic retry logic. Data retention is 90 days. Key tables include `users`, `forum_threads`, `content`, `forum_categories`, `transactions`, and `email_tracking`.

### SEO-Optimized URL Structure

- **Hierarchical URLs:** Replaces flat slugs for improved SEO, supporting unlimited category nesting depth via `lib/category-path.ts` and dynamic catch-all routes in Next.js. Automatic redirects handle legacy URLs.

### State Management

- **React Query (TanStack Query v5):** Manages all server state with a centralized API client, custom `apiRequest` helper, per-query cache configuration, and SSR support.

### Authentication System

- **Email/Password + Google OAuth:** Custom email/password authentication using bcryptjs, Google OAuth via Firebase Admin SDK, and PostgreSQL session storage. `isAuthenticated` middleware protects sensitive endpoints.

### Email System

- **Hostinger SMTP:** Handles 58+ types of transactional and notification emails, including tracking, privacy-respecting unsubscribe, and category-based preference management.

### Coin Economy

- **Virtual Currency:** Rewards user contributions and allows spending on premium content or profile boosts, with detailed transaction history and fraud prevention.

### Production Deployment

- **Deployment Targets:** Supports one-command deployment to Replit or full control via AWS EC2/VPS using Docker, PM2, Nginx, and Let's Encrypt.
- **Environment Variables:** Critical variables include `DATABASE_URL`, `EXPRESS_URL`, `NEXT_PUBLIC_SITE_URL`, and `SESSION_SECRET`.

### Zero-Touch Migration System

- **Automated GitHub Import:** A `postinstall` hook triggers `scripts/auto-setup.js` to automatically set up the database (table creation, data import) upon a fresh Replit import.

### Retention Dashboard System

- **Purpose:** Enhances user retention through loyalty tiers, badges, AI nudges, and abandonment emails.
- **Database Schema:** Eight new tables for metrics, vault coins, loyalty, badges, AI nudges, abandonment emails, earnings, and activity.
- **Backend Services:** Services for vault management, loyalty calculations, badge awarding, real-time WebSocket events, AI-driven behavioral nudges, and abandonment email sequences.
- **API Endpoints:** 12 endpoints for dashboard overview, earnings, loyalty timeline, activity heatmap, badges, referrals, nudges, vault claims, and preferences.
- **Frontend Components:** Nine React components for visualizing earnings, loyalty progress, vault status, referrals, health scores, badges, and activity heatmaps.
- **Real-Time Features:** WebSocket server with user-specific rooms, confetti animations, toast notifications, and hover tooltips.

### Bot Economy System

- **Purpose:** Automated bot system for natural-feeling engagement to boost community activity without disrupting user experience.
- **Database Schema:** Four new tables: `bots`, `bot_actions`, `admin_treasury`, `bot_economy_settings`. `botId` field added to `coin_transactions`.
- **Backend Services:** TreasuryService, BotProfileService, BotBehaviorEngine.
- **Bot Behavior:** Automated 10-minute scanner for likes/follows/purchases, marketplace purchases, daily auto-refund, wallet cap enforcement.
- **Admin Controls:** 16 API endpoints for bot CRUD, treasury management, economy settings, and analytics.
- **Exclusion Logic:** Bots excluded from vault auto-unlock, loyalty tier calculations, nudge triggers, and retention boost capped.
- **Frontend:** Four admin pages for bot management, creation, economy control, and analytics.

### Error Tracking & Monitoring System

- **Comprehensive Error Capture:** Tracks all frontend (React errors, console errors, unhandled promises) and backend errors.
- **Smart Error Grouping:** Uses fingerprint hashing to group similar errors.
- **Admin Dashboard:** Error monitoring section (`/admin/errors`) with filters, severity badges, occurrence counts, and resolution workflow, including a priority scoring system and categorized error tabs.
- **Automatic Cleanup:** Background jobs auto-resolve inactive errors and clean up old data.
- **Rate Limiting:** Prevents spam with 100 errors/min per IP limit and client-side batching.
- **Test Infrastructure:** Dedicated test page at `/test-errors`.
- **Storage Layer:** Three new tables (`errorGroups`, `errorEvents`, `errorStatusChanges`) with full audit trail.

## External Dependencies

### Core Infrastructure

- **Neon PostgreSQL:** Serverless database.
- **Replit Object Storage:** Persistent file storage.
- **Replit OIDC:** OAuth authentication provider.

### Email Services

- **Hostinger SMTP:** Transactional email delivery.
- **Brevo (SendinBlue):** Alternative email provider.

### Analytics & SEO

- **Google Tag Manager:** Tag management.
- **Google Analytics 4:** User tracking.
- **Google Search Console, Bing Webmaster Tools, Yandex Webmaster:** SEO monitoring.

### Payment Processing

- **Stripe:** Planned USD payment processing.

### CDN & Storage

- **Google Cloud Storage:** Object storage backend.
- **CloudFront/Cloudflare:** Optional CDN.

### Monitoring & Security

- **PM2:** Process management.
- **Nginx:** Reverse proxy with SSL termination.
- **Let's Encrypt:** Automatic SSL certificates.

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
- **esbuild:** Express API bundling.
- **Docker:** Containerization.
- **PM2 Ecosystem:** Multi-process orchestration.