# YoForex - Expert Advisor Forum & Marketplace

## Overview

YoForex is a comprehensive trading community platform that combines forum discussions, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy. Built with Next.js 16 and Express.js, it serves as a hub for forex traders to share strategies, publish trading tools, and engage with the community.

The platform features 60+ hierarchical categories, SEO-optimized URLs, automated email notifications (58+ types), a trust level progression system, and comprehensive analytics. It supports both free and premium content distribution with a gold coin economy that rewards user contributions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Hybrid Frontend Architecture

The application uses a **dual frontend approach** with distinct purposes:

1. **Next.js SSR (Port 3000)** - Primary user-facing application
   - App Router with Server Components for SEO optimization
   - Dynamic catch-all routes for hierarchical URLs (`/category/[...path]`)
   - ISR (Incremental Static Regeneration) with 60-second revalidation
   - 28 fully migrated pages with 100% design parity
   - Server-side data fetching for initial page loads

2. **Express API (Port 3001)** - Backend API server
   - 194 RESTful endpoints for all platform functionality
   - Authentication via Replit OIDC with PostgreSQL sessions
   - Rate limiting per endpoint category (general: 100/15min, writes: 30/15min, coins: 10/15min)
   - Input validation and XSS protection with DOMPurify
   - Health check endpoints for monitoring (`/api/health`, `/api/health/live`, `/api/health/ready`)

**Communication Flow:**
```
Browser → Next.js (3000) → Express API (3001) → PostgreSQL
            ↓
    React Query Cache & State Management
```

### Database Design

**PostgreSQL with Drizzle ORM** featuring:
- 25+ tables with comprehensive foreign key relationships
- 25 critical indexes optimized for category filtering, date sorting, and user lookups
- Connection pooling (min: 2, max: 20 connections)
- SSL/TLS support for production with configurable certificates
- Automatic retry logic (5 attempts with exponential backoff)
- 90-day data retention for GDPR compliance

**Key Tables:**
- `users` - User profiles with reputation scores, coin balances, trust levels
- `forum_threads` - Discussion threads with hierarchical category support
- `forum_replies` - Nested thread replies with SEO slugs
- `content` - Marketplace items (EAs, indicators, articles)
- `forum_categories` - 60 hierarchical categories with parent-child relationships
- `seo_categories` - SEO-optimized category structure with metadata
- `category_redirects` - 301/302 redirect mapping for URL migrations
- `transactions` - Gold coin economy tracking
- `email_tracking` - Email open/click analytics with privacy controls

### SEO-Optimized URL Structure

**Hierarchical URLs** replace flat slugs for better search rankings:

```
Old: /thread/oscillator-indicators-rsi-vs-stochastic
New: /category/indicators-templates/oscillators-momentum/oscillator-indicators-rsi-vs-stochastic

Old: /content/gold-scalper-pro-ea
New: /category/ea-library/scalping-eas/gold-scalper-pro-ea
```

**Implementation:**
- `lib/category-path.ts` - Core path resolution with 5-minute caching
- Dynamic catch-all route: `app/category/[...path]/page.tsx`
- Automatic redirect system for legacy URLs
- Support for unlimited category nesting depth
- Infinite loop protection in path resolution

### State Management

**React Query (TanStack Query v5)** handles all server state:
- Centralized API client in `app/lib/queryClient.ts`
- Custom `apiRequest` helper with authentication and error handling
- Per-query cache configuration (staleTime, refetchInterval)
- Automatic retries and background refetching
- SSR support with dehydrated query state

**Key Implementation Detail:**
The QueryClient uses relative URLs (no baseUrl) to work with Next.js rewrites, avoiding client-side baseUrl baking during SSR.

### Authentication System

**Email/Password + Google OAuth with PostgreSQL Sessions:**
- Custom email/password authentication using bcryptjs
- Google OAuth integration via Firebase Admin SDK
- Session storage in PostgreSQL with configurable expiry (default: 7 days)
- `isAuthenticated` middleware protects sensitive endpoints
- Session cleanup on SIGTERM/SIGINT for graceful shutdown

**Cookie Configuration (CRITICAL):**
- **Development**: `secure: false`, `sameSite: "lax"` (works with Next.js HTTP proxy)
- **Production**: `secure: true`, `sameSite: "lax"` (or "none" if CROSS_ORIGIN_COOKIES=true)
- **Key Fix (Oct 2025)**: Changed dev cookies from `secure:true, sameSite:none` to `secure:false, sameSite:lax` to fix login issues with Next.js rewrites proxying to Express over HTTP

### Email System

**Hostinger SMTP with 58+ notification types:**
- Transactional emails (welcome, verification, password reset)
- Activity notifications (replies, mentions, follows)
- Marketplace alerts (purchases, sales, reviews)
- Moderation notifications (reports, warnings, bans)
- Email tracking with open/click analytics
- Privacy-respecting unsubscribe system
- Category-based preference management

### Coin Economy

**Virtual currency system rewarding contributions:**
- Earn coins: Thread creation (+10), replies (+5), accepted answers (+50), quality content (+100)
- Spend coins: Premium EA downloads, content purchases, profile boosts
- Transaction history with detailed tracking
- Fraud prevention with amount validation
- Leaderboards tracking top earners

### Production Deployment

**Supports two deployment targets:**

1. **Replit ($20/month)** - One-command deployment with auto-scaling
2. **AWS EC2/VPS** - Full control with comprehensive automation:
   - `master-deploy.sh` - One-command deployment script
   - Docker & Docker Compose for containerization
   - PM2 cluster mode with 2 instances for Next.js
   - Nginx reverse proxy with automatic SSL via Let's Encrypt
   - Automated S3 backups and restore
   - Health check endpoints for monitoring
   - 28+ automated production tests

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (required)
- `EXPRESS_URL` - Internal API URL (default: http://127.0.0.1:3001)
- `NEXT_PUBLIC_SITE_URL` - Public site URL (required in production)
- `SESSION_SECRET` - Session encryption key (minimum 32 characters)
- Pool configuration: `DB_POOL_MAX`, `DB_POOL_MIN`, `DB_IDLE_TIMEOUT`, `DB_CONNECTION_TIMEOUT`

### Zero-Touch Migration System

**Automated GitHub import process:**
1. User imports repository to new Replit
2. `postinstall` hook triggers `scripts/auto-setup.js`
3. Auto-setup detects fresh import and runs:
   - Database table creation
   - Data import from `database-export.sql` (or seed data)
   - Verification checks
4. Application starts fully configured

**Export before push:** `npm run db:export` creates portable SQL dump

## External Dependencies

### Core Infrastructure

- **Neon PostgreSQL** - Serverless database with connection pooling
- **Replit Object Storage** - Persistent file storage for EA uploads (backed by Google Cloud Storage)
- **Replit OIDC** - OAuth authentication provider

### Email Services

- **Hostinger SMTP** - Transactional email delivery
- **Brevo (SendinBlue)** - Alternative email provider with API client

### Analytics & SEO

- **Google Tag Manager** - Tag management and analytics (`NEXT_PUBLIC_GTM_ID`)
- **Google Analytics 4** - User tracking (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- **Google Search Console** - SEO monitoring and indexing
- **Bing Webmaster Tools** - Bing/Yahoo search indexing
- **Yandex Webmaster** - Yandex search engine optimization

### Payment Processing

- **Stripe** - USD payment processing for coin recharges (planned integration)

### CDN & Storage

- **Google Cloud Storage** - Object storage backend for Replit
- **CloudFront/Cloudflare** - CDN for static assets (optional)

### Monitoring & Security

- **PM2** - Process management with clustering and auto-restart
- **Nginx** - Reverse proxy with SSL termination
- **Let's Encrypt** - Automatic SSL certificate management
- **AWS S3** - Backup storage for database exports

### Development Tools

- **Drizzle Kit** - Database migrations and schema management
- **TypeScript** - Type safety across the entire stack
- **shadcn/ui** - Component library built on Radix UI primitives
- **TailwindCSS** - Utility-first CSS framework
- **Zod** - Runtime schema validation

### Build & Deployment

- **Next.js 16** - React framework with App Router
- **Vite** - Build tool for React SPA (legacy)
- **esbuild** - Express API bundling
- **Docker** - Containerization for development and production
- **PM2 Ecosystem** - Multi-process orchestration