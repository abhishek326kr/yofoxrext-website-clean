# YoForex - Expert Advisor Forum & Marketplace

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)

**YoForex** is a comprehensive EA (Expert Advisor) forum and marketplace platform for algorithmic trading on MT4/MT5. It combines traditional forum features with a marketplace, gold coin economy, broker directory, and social features.

---

## 🎯 **NEW: Zero-Touch GitHub Migration**

**Importing from GitHub to a new Replit?** Everything works automatically! 🚀

When you import this project from GitHub:
- ✅ Database is created automatically
- ✅ Data is imported automatically  
- ✅ Setup completes automatically
- ✅ **NO manual commands needed!**

Just click "Import from GitHub" → Wait 30 seconds → Everything works!

📖 **See:** [Migration Guide](./docs/MIGRATION_GUIDE.md) for details

**Before you export:** Run `npm run db:export` to include your data in the migration.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Google Service Account (for Google OAuth, optional)

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:push

# Start development server (hybrid mode)
npm run dev:hybrid
```

**Two servers will start:**
- **Express Backend**: http://localhost:5000 (API, Auth, React SPA)
- **Next.js SSR**: http://localhost:3000 (SEO-optimized pages)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Platform Guide](docs/PLATFORM_GUIDE.md)** | Complete feature documentation (5,700+ lines) |
| **[Architecture](docs/ARCHITECTURE.md)** | Frontend/backend architecture & patterns |
| **[API Reference](docs/API_REFERENCE.md)** | 60+ API endpoints with examples |
| **[Deployment](docs/DEPLOYMENT.md)** | Replit & VPS deployment guide |
| **[Migration Guide](docs/MIGRATION_GUIDE.md)** | Zero-touch GitHub migration |
| **[Client Handover](CLIENT_HANDOVER_GUIDE.md)** | Complete client documentation |

---

## 🎯 Key Features

### Core Systems
- ✅ **Forum System** - 16 categories, nested replies, @mentions
- ✅ **Marketplace** - Buy/sell EAs, Indicators, Articles, Source Code
- ✅ **Gold Coin Economy** - Earn coins for contributions, spend on content
- ✅ **Broker Directory** - Community reviews, scam reporting
- ✅ **Social Features** - Follow users, private messaging, badges
- ✅ **Real-time Updates** - Auto-refreshing widgets (10-60s intervals)
- ✅ **SEO Engine** - Automated metadata, slugs, structured data
- ✅ **Onboarding System** - Interactive checklist with coin rewards

### Technical Highlights
- **Hybrid Architecture**: Next.js 16 SSR + Express API
- **Authentication**: Email/password and Google OAuth with PostgreSQL sessions
- **State Management**: TanStack Query v5 with real-time polling
- **UI Components**: shadcn/ui + Tailwind CSS
- **Database**: Drizzle ORM with 25+ performance indexes
- **Security**: Rate limiting, XSS protection, input validation

---

## 🏗️ Architecture Overview

```
YoForex Platform
│
├── Express Backend (Port 5000)
│   ├── Authentication (Email/Password + Google OAuth)
│   ├── REST API (60+ endpoints)
│   ├── Background Jobs (node-cron)
│   ├── React SPA (Vite)
│   └── Database (Drizzle ORM)
│
└── Next.js Frontend (Port 3000)
    ├── Server Components (SSR)
    ├── Client Components (Interactivity)
    ├── 28 SEO-Optimized Pages
    └── API Client (fetches from Express)
```

**28 Pages Migrated (100% Complete)**:
- **SEO-Critical (7)**: Homepage, Thread Detail, Content Detail, User Profile, Category, Broker, Marketplace
- **High-Traffic (5)**: Discussions, Categories, Brokers, Members, Leaderboard
- **Authenticated (9)**: Dashboard, Settings, Recharge, Transactions, Publish, Messages, Notifications, Withdrawals
- **Additional (7)**: Earn Coins, Submit Review, Feedback, Support, API Docs, Dashboard Settings

---

## 📊 Project Structure

```
yoforex/
├── app/                          # Next.js 16 App Router (SSR)
│   ├── page.tsx                  # Homepage (/)
│   ├── thread/[slug]/            # Thread detail pages
│   ├── content/[slug]/           # Marketplace content
│   ├── dashboard/                # User dashboard
│   ├── components/               # Next.js-specific components
│   └── lib/                      # Utilities, API client
│
├── client/src/                   # React SPA (Original)
│   ├── pages/                    # Page components
│   ├── components/               # Reusable components
│   │   ├── ui/                   # shadcn/ui primitives
│   │   └── dashboard/            # Dashboard widgets
│   └── lib/                      # Utilities, hooks
│
├── server/                       # Express Backend
│   ├── routes.ts                 # API endpoints
│   ├── storage.ts                # Database layer
│   ├── replitAuth.ts             # Authentication
│   ├── emailService.ts           # Email notifications
│   └── jobs/                     # Background tasks
│
├── shared/                       # Shared types & schemas
│   └── schema.ts                 # Drizzle schema + Zod types
│
└── docs/                         # Documentation
    ├── PLATFORM_GUIDE.md         # Complete feature guide
    ├── ARCHITECTURE.md           # Technical architecture
    ├── API_REFERENCE.md          # API documentation
    └── DEPLOYMENT.md             # Deployment guide
```

---

## 🔧 Common Commands

```bash
# Development
npm run dev              # Express + React SPA only
npm run dev:hybrid       # Express + Next.js SSR (recommended)
npm run dev:next         # Next.js only

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database GUI)

# Build
npm run build            # Build React SPA
npm run build:next       # Build Next.js SSR

# Production
npm run start            # Start production server
```

---

## 🌐 Environment Variables

Required variables for full functionality:

```bash
# Database (Required)
DATABASE_URL=postgresql://user:pass@host:5432/database

# Authentication (Required)
REPLIT_CLIENT_ID=your_client_id
REPLIT_CLIENT_SECRET=your_client_secret
SESSION_SECRET=random_secure_string

# URLs
BASE_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
EXPRESS_URL=http://localhost:5000
NEXT_PUBLIC_EXPRESS_URL=http://localhost:5000

# Email (Optional)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=YourSiteName
```

---

## 📈 Performance & Security

### Database Performance
- **25+ indexes** on critical queries (10-100x speedup)
- **Optimized joins** for forum threads, marketplace, brokers
- **Connection pooling** with pg library

### Security Features
- **Rate Limiting**: Multiple tiers (API, writes, coins, content)
- **XSS Protection**: DOMPurify sanitization on all inputs
- **Input Validation**: Zod schemas + server-side checks
- **Session Security**: HTTP-only cookies, 7-day TTL
- **Coin System Security**: Prevents negative amounts, overdrafts

### Real-time Updates
- **Auto-refresh widgets** with configurable intervals
- **Visual indicators** ("Updated X ago")
- **Background polling** without page reload
- **Error handling** with automatic retries

---

## 🎨 UI Components

Built with **shadcn/ui** + **Tailwind CSS**:
- Forms (React Hook Form + Zod validation)
- Cards, Badges, Buttons
- Dialogs, Dropdowns, Tooltips
- Data Tables with sorting/filtering
- Real-time activity feeds
- Interactive charts (Recharts)

---

## 🚢 Deployment

### Replit (Recommended)
```bash
# Automatically handles:
# - Database setup (PostgreSQL)
# - Environment variables
# - HTTPS with custom domain
# - Zero-config deployment

# Just click "Deploy" in Replit!
```

### Manual Deployment
See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for:
- Vercel deployment (Next.js)
- Heroku/Railway deployment (Express)
- Docker containerization
- Environment setup
- Database migrations

---

## 📖 Learn More

- **[Complete Platform Guide](docs/PLATFORM_GUIDE.md)** - Every feature explained
- **[Architecture Guide](docs/ARCHITECTURE.md)** - How it's built
- **[API Reference](docs/API_REFERENCE.md)** - All endpoints documented
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production setup

---

## 🤝 Contributing

YoForex is built with modern best practices:
1. **TypeScript** for type safety
2. **Drizzle ORM** for database queries
3. **TanStack Query** for server state
4. **shadcn/ui** for consistent components
5. **Zod** for validation

---

## 📄 License

Proprietary - All rights reserved

---

## 🆘 Support

- **Documentation**: See `/docs` folder
- **Issues**: Report bugs or request features
- **Community**: Join our Telegram channel

---

**Built with ❤️ for the algorithmic trading community**
