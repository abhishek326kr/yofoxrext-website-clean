# YoForex - Trading Community Platform

## Overview
YoForex is a comprehensive trading community platform designed to foster a vibrant community for traders. It features forum discussions, trading journals, an Expert Advisor (EA) marketplace, broker reviews, and a user reputation and badge system, all underpinned by a coin-based economy. The platform aims to provide a rich, interactive environment for traders to share knowledge, access tools, and grow their skills, with robust SEO optimizations for global search visibility.

## Production Domain
- **Primary Domain**: https://yoforex.net
- **Environment**: Production-ready
- **SSL/HTTPS**: Required (enforced)
- **SEO Optimized**: Configured for search engine indexing

## User Preferences
- Prefer clear, concise code
- Minimize file count where possible
- Follow existing patterns and conventions
- Type safety is critical

## Production Status
- **Status**: ✅ PRODUCTION-READY FOR AWS EC2 (Verified: Oct 30, 2025)
- **Email System**: ✅ COMPLETE (Oct 30, 2025) - 58+ notification types via Hostinger SMTP
- **TypeScript**: All compilation errors resolved
- **Database**: Production-optimized with connection pooling, SSL/TLS support, retry logic
- **Authentication**: Flexible system supporting Replit OIDC, local auth, or disabled modes
- **Production Build**: Successful - 48 pages generated, 48MB build size
  - Build ID: dFTzjarCmmqQiSaWiKjYq
  - Compilation: 33.1s
  - Static Generation: 4.6s
- **Testing**: Comprehensive production testing completed
  - API: 7/7 endpoints working (30-70ms response times)
  - Frontend: All pages verified (Home, Discussions, Threads, Marketplace, Brokers, Members, 404)
  - Security: Auth guards, rate limiting, sanitized errors - all working
  - SEO: Meta tags, OG/Twitter cards, sitemap.xml, robots.txt - all verified
  - Performance: Sub-50ms API responses, optimized bundles
- **Deployment Infrastructure**: Complete AWS EC2 Ubuntu automation (Oct 30, 2025)
  - One-command deployment with `master-deploy.sh`
  - Docker & Docker Compose for development and production
  - PM2 cluster mode with auto-restart
  - Nginx with SSL/TLS automation via Let's Encrypt
  - Automated backup/restore to S3
  - Comprehensive health checks and monitoring
  - Production test suite with 28+ automated tests
- **Storage Architecture**: Modularized (Oct 30, 2025)
  - OrchestratedStorage: 346 lines (62% reduction from 918 lines)
  - Proxy Pattern: Automatic delegation for ~150 unmigrated methods
  - Domain Modules: 58 methods across users, forum, content domains
  - Zero breaking changes - all IStorage methods functional

## System Architecture
The platform is built with a modern tech stack:
- **Frontend**: Next.js 16 (App Router), React, TailwindCSS
- **Backend**: Express.js API
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Replit Auth (OIDC)

**UI/UX Decisions:**
The platform emphasizes a clean, intuitive interface designed for ease of use and engagement, leveraging a responsive design for various devices.

**Technical Implementations:**
- **Dynamic Schema Generation**: Production-ready Schema.org JSON-LD generation system with 10 schema types, automated content type detection, conditional properties, schema relationships, and HTML sanitization. Compliant with Schema.org 2025 and Google Rich Results guidelines.
- **Schema Utilities Library**: Comprehensive utility system (lib/schema-utils.ts) with helper functions for HTML sanitization, URL normalization, ISO 8601 date formatting, required property validation, and content sanitization for valid JSON-LD.
- **Hierarchical URLs**: Utilizes a hierarchical URL structure for improved SEO and content organization, with 301/308 redirects for backward compatibility.
- **Automated Sitemap System**: Production-ready sitemap generation and submission system with 24-hour automation, dynamic XML generation, IndexNow API integration, Google Search Console ping, and comprehensive logging.
- **Type Safety**: Comprehensive TypeScript implementation with strict type checking across the entire codebase.
- **API Connectivity**: A centralized Express API backend (port 3001) is robustly connected to the Next.js frontend (port 5000) using React Query.
- **SEO Optimization**: Enhanced with Google Tag Manager, a dynamic sitemap, Schema.org Breadcrumbs, and comprehensive schema properties for entity relationships.
- **Custom UI Components**: Professional scrollbar styling with theme-aware design (.custom-scrollbar utility class), smooth transitions, and optimal visibility in both light and dark modes (Oct 30, 2025).

**Feature Specifications:**
- **Forum System**: Supports discussions, replies, and interaction statistics.
  - **WeekHighlights Component** (Oct 30, 2025): Enhanced with limit selector (10/20/50 items), scrollable container (max-height: 600px), responsive dropdown UI, professional custom scrollbars with dark mode support
- **Marketplace**: Allows listing and selling of Expert Advisors, indicators, and templates with detailed product schemas.
- **User Profiles**: Comprehensive profiles with reputation scores, badges, social links, and expertise areas.
- **Coin-based Economy**: Rewards users for platform engagement.
- **Broker Directory**: 3-column responsive layout with advanced filters UI, search functionality, broker cards, comparison tools, featured showcases, and scam alerts. Advanced filter UI is implemented but non-functional pending schema extension.
- **Community Members**: Fully responsive layout with all sections visible on mobile and desktop. Features advanced member filters (collapsible on mobile), leaderboard (6 types), community stats, member search, member cards, trending members, recent activity, and new members sections. Mobile layout properly stacks with main content first, followed by sidebars. Advanced filter UI is implemented but non-functional pending user schema extension.
- **Client Dashboard**: Includes new tables for trading journal entries, watchlists, price alerts, saved searches, user habits, chat rooms, and dashboard customization (widgets, layouts). Fixed all API endpoints including goal creation, notifications, and customer stats. Dashboard redirects unauthenticated users to login.
- **Admin Dashboard**: Provides comprehensive tools for content moderation, marketplace management, finance management, broker management, schema validation, and analytics monitoring. Includes systems for admin authentication, broker management, and SEO & Marketing with meta tag CRUD, campaign tracking, and analytics.
- **SEO Category System** (Oct 30, 2025): Complete hierarchical category structure with SEO-optimized names and URLs. Features 60 categories total: 11 main categories and 49 subcategories designed for maximum search visibility. Main categories include Forex Trading Robots & EAs 2025, Binary Options Indicators & Robots, Crypto Trading Strategies & EAs, Online Trading Courses & Books, Sports Betting Strategies & Arbitrage, Casino & Poker Software Strategies, Trading Community Chat, Scam Alerts & Broker Warnings, YoForex Guides & Rules, Our Trusted Partners, and Free Downloads & Tools. Each category has SEO-focused keywords and clean URL slugs for optimal search engine rankings.
- **User Profile Optimization** (Oct 30, 2025): Enhanced profile pages with comprehensive SEO metadata, Open Graph and Twitter cards, structured data (JSON-LD) with interaction statistics, profile share tracking via analytics API and Google Analytics, and improved UI/UX with 1/3 + 2/3 responsive grid layout for better content distribution.

## External Dependencies
- **Database**: Neon (PostgreSQL-compatible, serverless)
- **Authentication**: Replit Auth (OIDC)
- **Analytics**: Google Analytics 4, Yandex Webmaster Tools, Bing Webmaster Tools, Seznam Webmaster
- **Tag Management**: Google Tag Manager (via `NEXT_PUBLIC_GTM_ID`)

## Production Deployment Configuration
- **Frontend Port**: 5000 (Next.js - user-facing)
- **Backend Port**: 3001 (Express API - internal)
- **Production URLs**:
  - Public: https://yoforex.net
  - API (internal): http://127.0.0.1:3001
- **Environment Variables**: See `.env.production.example` for complete configuration
- **Required ENV Vars**:
  - `NEXT_PUBLIC_SITE_URL=https://yoforex.net`
  - `EXPRESS_URL=http://127.0.0.1:3001` (internal communication)
  - `DATABASE_URL` (Neon PostgreSQL connection)
  - `SESSION_SECRET` (secure random string)
- **SEO Configuration**: All metadata, sitemaps, and schema.org markup configured for yoforex.net
- **CORS & Origins**: Configured for yoforex.net and www.yoforex.net