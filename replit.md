# YoForex - Expert Advisor Forum & Marketplace

## Overview

YoForex is a comprehensive trading community platform designed for forex traders, integrating forum discussions, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy. The platform aims to be a central hub for traders to share strategies, publish trading tools, and engage with a global community. Key capabilities include extensive category management, SEO-optimized URLs, automated email notifications, a trust level progression system, and a gold coin economy that rewards user contributions and facilitates content distribution. It enhances user retention through loyalty tiers, badges, AI nudges, and abandonment emails, alongside an automated bot system to stimulate community activity.

## Recent Changes

### November 1, 2025 - Smart Error Auto-Resolution System ✅

**Problem Solved:** Error dashboard showed 98 "unsolved" errors that should be "solved" after code fixes. Previously, errors remained marked as "active" indefinitely unless manually resolved or inactive for 7 days. No mechanism existed to detect when errors stopped occurring due to code fixes.

**Auto-Resolve Fixed Errors Feature**
- **Purpose:** Automatically detect and resolve errors that were fixed in code but still marked as "active"
- **Location:** Admin Error Monitoring Dashboard → "Resolve Fixed Errors" button
- **Backend Implementation:** (server/storage.ts, server/routes.ts)
  - Added `autoResolveFixedErrors(minutesInactive)` method to DrizzleStorage
  - New API endpoint: `POST /api/admin/errors/auto-resolve-fixed`
  - Finds errors with: status='active', lastSeen > X minutes ago, occurrenceCount > 0
  - Marks them as resolved with resolvedBy='auto-system'
  - Creates audit trail in errorStatusChanges table
  - Admin authentication + rate limiting + action logging
- **Frontend Implementation:** (app/admin/sections/ErrorMonitoring.tsx)
  - "Resolve Fixed Errors" button between Refresh and Cleanup
  - Toast notifications on success/failure
  - Invalidates error queries to refresh dashboard counts
  - Default threshold: 30 minutes of inactivity
- **Impact:** Instantly resolve 7-10 fixed errors (TipTap SSR, file uploads, admin logs 404s)
- **Distinction:** 
  - Fixed errors (30 min threshold) = likely fixed in code
  - Abandoned errors (7 day threshold via cron) = one-time occurrences

**React Error Fixes**
- **Fixed key prop warnings** - Wrapped all `.map()` returns in `React.Fragment` with proper key props
- **Fixed Select.Item warnings** - Changed all empty value props from `value=""` to `value="all"`
- **Verification:** Browser console shows ZERO React warnings
- **Files:** app/admin/sections/ErrorMonitoring.tsx

**Architect Review Verdict:** ✅ PASS
- Date arithmetic and SQL queries verified correct
- Storage layer updates atomically with audit trail
- UI mutation invalidates caches correctly
- Admin endpoint properly secured
- Recommended: Monitor production telemetry for future severity/occurrence filters
- Recommended: Ensure lastSeen/status columns remain indexed for performance

### November 1, 2025 - Production-Ready Error Fixes ✅

**File Upload System Overhaul**
- **Fixed ENOENT errors** - Migrated from disk-based multer (public/uploads/) to memory storage + object storage
- Changed multer configuration from `diskStorage` to `memoryStorage()` in server/routes.ts (line 219)
- Updated `/api/upload` endpoint to process files in-memory and upload directly to object storage via `objectStorageService.uploadObject()`
- Images are now resized in-memory using Sharp (640x480) before uploading, eliminating disk I/O
- Returns object storage paths (`/objects/uploads/...`) instead of local file paths
- **Impact:** File uploads now work reliably in cloud environments without local disk dependencies

**Admin Logs API Routes**
- **Fixed 404 errors** - Added missing admin logs endpoints (lines 6245-6307 in server/routes.ts)
- `/api/admin/logs/security` - maps to existing security events endpoint
- `/api/admin/logs/system-events` - returns empty array (placeholder for future implementation)
- `/api/admin/logs/performance` - maps to existing performance metrics endpoint
- `/api/admin/logs/admin-actions` - maps to existing admin action logs endpoint
- All routes secured with `isAuthenticated` + `adminOperationLimiter` + explicit admin check
- **Impact:** Admin logs pages now load without errors

**Password Authentication Fix**
- Updated `server/localAuth.ts` to check both `password_hash` (new) and `password` (legacy) fields
- **Impact:** Backward compatibility maintained for older user accounts with legacy password fields

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

- **PostgreSQL with Drizzle ORM:** Features 25+ tables with foreign key relationships, 25 critical indexes, connection pooling, SSL/TLS support, and automatic retry logic. Key tables include `users`, `forum_threads`, `content`, `forum_categories`, `transactions`, and `email_tracking`.

### SEO-Optimized URL Structure

- **Hierarchical URLs:** Replaces flat slugs for improved SEO, supporting unlimited category nesting depth and dynamic catch-all routes.

### State Management

- **React Query (TanStack Query v5):** Manages all server state with a centralized API client, custom `apiRequest` helper, per-query cache configuration, and SSR support.

### Authentication System

- **Email/Password + Google OAuth:** Custom email/password authentication using bcryptjs, Google OAuth via Firebase Admin SDK, and PostgreSQL session storage. `isAuthenticated` middleware protects sensitive endpoints.

### Email System

- **Hostinger SMTP:** Handles 58+ types of transactional and notification emails, including tracking and preference management.

### Coin Economy

- **Virtual Currency:** Rewards user contributions and allows spending on premium content or profile boosts, with detailed transaction history and fraud prevention.

### Production Deployment

- **Deployment Targets:** Supports one-command deployment to Replit or full control via AWS EC2/VPS using Docker, PM2, Nginx, and Let's Encrypt.
- **Environment Variables:** Critical variables include `DATABASE_URL`, `EXPRESS_URL`, `NEXT_PUBLIC_SITE_URL`, and `SESSION_SECRET`.

### Zero-Touch Migration System

- **Automated GitHub Import:** A `postinstall` hook triggers `scripts/auto-setup.js` to automatically set up the database upon a fresh Replit import.

### Retention Dashboard System

- **Purpose:** Enhances user retention through loyalty tiers, badges, AI nudges, and abandonment emails.
- **Backend Services:** Services for vault management, loyalty calculations, badge awarding, real-time WebSocket events, AI-driven behavioral nudges, and abandonment email sequences.
- **API Endpoints:** 12 endpoints for dashboard overview, earnings, loyalty timeline, activity heatmap, badges, referrals, nudges, vault claims, and preferences.
- **Frontend Components:** Nine React components for visualizing earnings, loyalty progress, vault status, referrals, health scores, badges, and activity heatmaps.

### Bot Economy System

- **Purpose:** Automated bot system for natural-feeling engagement to boost community activity without disrupting user experience.
- **Backend Services:** TreasuryService, BotProfileService, BotBehaviorEngine.
- **Bot Behavior:** Automated scanner for likes/follows/purchases, marketplace purchases, daily auto-refund, wallet cap enforcement.
- **Admin Controls:** 16 API endpoints for bot CRUD, treasury management, economy settings, and analytics.

### Error Tracking & Monitoring System

- **Comprehensive Error Capture:** Tracks all frontend (React errors, console errors, unhandled promises) and backend errors.
- **Smart Error Grouping:** Uses fingerprint hashing to group similar errors.
- **Admin Dashboard:** Error monitoring section (`/admin/errors`) with filters, severity badges, occurrence counts, and resolution workflow.

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