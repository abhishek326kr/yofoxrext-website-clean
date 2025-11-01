# YoForex - Expert Advisor Forum & Marketplace

## Overview

YoForex is a comprehensive trading community platform for forex traders, offering forum discussions, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy. Its purpose is to be a central hub for sharing strategies, publishing trading tools, and engaging with a global community. The platform includes extensive category management, SEO-optimized URLs, automated email notifications, a trust level progression system, and a gold coin economy that rewards user contributions. YoForex enhances user retention through loyalty tiers, badges, AI nudges, abandonment emails, and an automated bot system to stimulate community activity.

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

YoForex uses a hybrid frontend and a robust backend for scalability and performance.

### Hybrid Frontend Architecture
- **Next.js (Port 3000):** Primary user-facing application with App Router and Server Components for SEO and dynamic routing, utilizing ISR with 60-second revalidation.
- **Express API (Port 3001):** Backend API server with 194 RESTful endpoints, Replit OIDC authentication, rate limiting, and input validation. React Query manages client-side state and caching.

### Database Design
- **PostgreSQL with Drizzle ORM:** Features 25+ tables, 25 critical indexes, connection pooling, SSL/TLS, and automatic retry logic. Key tables include `users`, `forum_threads`, `content`, `forum_categories`, `transactions`, and `email_tracking`.

### System Design Choices
- **SEO-Optimized URL Structure:** Hierarchical URLs with unlimited category nesting and dynamic catch-all routes.
- **State Management:** React Query (TanStack Query v5) for server state, centralized API client, and SSR support.
- **Authentication System:** Email/Password (bcryptjs) + Google OAuth (Firebase Admin SDK), with PostgreSQL session storage and `isAuthenticated` middleware.
- **Email System:** Hostinger SMTP for 58+ types of transactional and notification emails, including tracking.
- **Coin Economy:** Virtual currency rewards user contributions and allows spending on premium content, with transaction history and fraud prevention.
- **Production Deployment:** Supports one-command deployment to Replit or full control via AWS EC2/VPS using Docker, PM2, Nginx, and Let's Encrypt.
- **Zero-Touch Migration System:** Automated GitHub import via `postinstall` hook (`scripts/auto-setup.js`) for fresh Replit database setup.
- **Retention Dashboard System:** Enhances user retention through loyalty tiers, badges, AI nudges, and abandonment emails, with dedicated backend services and API endpoints.
- **Bot Economy System:** Automated bot system for natural engagement, including automated likes/follows/purchases, daily auto-refunds, and wallet cap enforcement, managed via admin API endpoints.
- **Error Tracking & Monitoring System:** Comprehensive capture of frontend and backend errors, smart grouping via fingerprint hashing, and an admin dashboard (`/admin/errors`) for resolution workflow.
- **AI-Powered SEO Content Suggestions (Added 2025-11-01):** Gemini AI integration for generating SEO-optimized meta descriptions, alt text, and H1 tags. Admin-only workflow with human approval, async job processing, and structured JSON response schemas. Uses gemini-2.5-flash model with generationConfig for reliable JSON parsing.

## External Dependencies

### Core Infrastructure
- **Neon PostgreSQL:** Serverless database.
- **Replit Object Storage:** Persistent file storage.
- **Replit OIDC:** OAuth authentication provider.

### Email Services
- **Hostinger SMTP:** Transactional email delivery.

### Analytics & SEO
- **Google Tag Manager:** Tag management.
- **Google Analytics 4:** User tracking.
- **Google Search Console, Bing Webmaster Tools, Yandex Webmaster:** SEO monitoring.

### CDN & Storage
- **Google Cloud Storage:** Object storage backend.

### Development Tools
- **Drizzle Kit:** Database migrations.
- **TypeScript:** Type safety.
- **shadcn/ui:** Component library.
- **TailwindCSS:** Utility-first CSS framework.
- **Zod:** Runtime schema validation.
- **Vitest:** Testing framework.
- **Supertest:** API integration testing.
- **socket.io & socket.io-client:** WebSocket communication.

### Build & Deployment
- **Next.js 16:** React framework.
- **esbuild:** Express API bundling.
- **Docker:** Containerization.