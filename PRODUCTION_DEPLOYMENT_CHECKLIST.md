# YoForex Production Deployment Checklist
**Domain**: https://yoforex.net  
**Last Updated**: October 30, 2025

---

## ✅ Pre-Deployment Verification

### 1. Environment Configuration
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://yoforex.net` in production environment
- [ ] Set `EXPRESS_URL=http://127.0.0.1:3001` for internal API communication
- [ ] Configure `DATABASE_URL` with production PostgreSQL (Neon) connection string
- [ ] Set strong `SESSION_SECRET` (minimum 32 characters, use: `openssl rand -base64 32`)
- [ ] Configure CORS origins: `yoforex.net` and `www.yoforex.net`
- [ ] Verify all environment variables from `.env.production.example`

### 2. SEO & Analytics
- [ ] Google Tag Manager ID configured (`NEXT_PUBLIC_GTM_ID`)
- [ ] Google Analytics 4 tracking ID set (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- [ ] Google Search Console verification code added
- [ ] Bing Webmaster Tools verification configured
- [ ] Yandex Webmaster verification set
- [ ] Sitemap.xml accessible at https://yoforex.net/sitemap.xml
- [ ] Robots.txt configured at https://yoforex.net/robots.txt
- [ ] Schema.org markup validated (all pages)
- [ ] OpenGraph tags verified (test with Facebook Debugger)
- [ ] Twitter Cards validated (test with Twitter Card Validator)

### 3. Security
- [ ] HTTPS/SSL certificate installed and active
- [ ] Force HTTPS redirects configured
- [ ] Session secret is strong and unique
- [ ] Rate limiting enabled on API endpoints
- [ ] SQL injection protection verified (Drizzle ORM parameterized queries)
- [ ] XSS protection enabled (Content Security Policy)
- [ ] CSRF protection active (express-session)
- [ ] Authentication working (Replit Auth integration)
- [ ] Sensitive data not exposed in client-side code
- [ ] Environment variables not committed to git

### 4. Database
- [ ] Production database created (Neon PostgreSQL)
- [ ] Database connection string tested
- [ ] Schema synchronized (`npm run db:push`)
- [ ] Database backup strategy in place
- [ ] Connection pooling configured
- [ ] SSL mode enabled (`sslmode=require`)

### 5. Performance
- [ ] Next.js production build successful (`next build`)
- [ ] Static pages pre-rendered (48 pages verified)
- [ ] Image optimization enabled (Next.js Image component)
- [ ] Code splitting working (automatic with Next.js)
- [ ] Compression enabled (gzip/brotli)
- [ ] CDN configured (if applicable)
- [ ] Background jobs disabled for performance (`ENABLE_BACKGROUND_JOBS=false`)
- [ ] Browser caching headers set
- [ ] Custom scrollbar styling implemented (professional dark mode support)

### 6. Functionality Testing
- [ ] Homepage loads correctly
- [ ] User authentication works (login/logout)
- [ ] Forum threads display properly
- [ ] Thread creation functional
- [ ] Reply posting works
- [ ] Marketplace listings visible
- [ ] Broker directory accessible
- [ ] Search functionality working
- [ ] Mobile responsive design verified
- [ ] Dark mode toggle functional
- [ ] WeekHighlights component with custom scrollbars working

### 7. API Endpoints
- [ ] `/api/threads` - Returns threads (200 OK)
- [ ] `/api/categories` - Returns categories (200 OK)
- [ ] `/api/me` - Authentication check (401 if not logged in)
- [ ] `/api/stats` - Platform statistics (200 OK)
- [ ] `/api/brokers` - Broker listings (200 OK)
- [ ] `/api/content/top-sellers` - Marketplace content (200 OK)
- [ ] `/api/hot` - Hot items (200 OK)
- [ ] Rate limiting active (100 requests/15min per IP)

---

## 🚀 Deployment Steps

### Step 1: Build Production Assets
```bash
# Build Next.js for production
npm run build

# Verify build succeeded
# Expected: 48 pages generated, ~48MB build size
```

### Step 2: Set Environment Variables
```bash
# In Replit Secrets or deployment platform, set:
NEXT_PUBLIC_SITE_URL=https://yoforex.net
EXPRESS_URL=http://127.0.0.1:3001
DATABASE_URL=postgresql://[your-neon-connection]
SESSION_SECRET=[your-secret-32-chars]
NODE_ENV=production
```

### Step 3: Database Migration
```bash
# Push schema to production database
npm run db:push

# If data-loss warning, use force flag
npm run db:push --force
```

### Step 4: Start Production Servers
```bash
# Start both Express (port 3001) and Next.js (port 5000)
bash start-production.sh
```

### Step 5: Verify Deployment
```bash
# Test API endpoints
curl https://yoforex.net/api/stats

# Test homepage
curl https://yoforex.net/

# Check sitemap
curl https://yoforex.net/sitemap.xml

# Verify robots.txt
curl https://yoforex.net/robots.txt
```

---

## 📊 Post-Deployment Verification

### Immediate (0-2 hours)
- [ ] Homepage loads at https://yoforex.net
- [ ] All API endpoints responding correctly
- [ ] No 404 errors in browser console
- [ ] No JavaScript errors in production
- [ ] SSL certificate valid (green padlock)
- [ ] Database connections stable
- [ ] Authentication working
- [ ] Session management functional

### Short-term (2-24 hours)
- [ ] Google Analytics receiving data
- [ ] GTM tags firing correctly
- [ ] No server errors in logs
- [ ] Memory usage stable (< 512MB)
- [ ] CPU usage reasonable (< 50%)
- [ ] Response times acceptable (< 200ms API, < 2s page load)
- [ ] Custom scrollbars rendering correctly in both themes

### Medium-term (1-7 days)
- [ ] Google Search Console indexing pages
- [ ] Sitemap submitted to search engines
- [ ] No crawl errors in GSC
- [ ] Core Web Vitals in good range (green)
- [ ] User registrations working
- [ ] No database connection issues
- [ ] Backup system verified

### Long-term (7-30 days)
- [ ] SEO rankings improving
- [ ] Organic traffic growing
- [ ] No memory leaks
- [ ] Database performance optimized
- [ ] User feedback positive
- [ ] Error rate < 0.1%

---

## 🔧 Production URLs Reference

| Service | URL | Notes |
|---------|-----|-------|
| **Production Site** | https://yoforex.net | User-facing |
| **API (Internal)** | http://127.0.0.1:3001/api/* | Server-side only |
| **Sitemap** | https://yoforex.net/sitemap.xml | SEO |
| **Robots.txt** | https://yoforex.net/robots.txt | Crawler control |
| **Google Search Console** | https://search.google.com/search-console | SEO monitoring |
| **Google Analytics** | https://analytics.google.com | Traffic analytics |
| **Neon Database** | Your Neon dashboard URL | Database management |

---

## 🛠️ Troubleshooting

### Issue: Pages not loading
**Solution**: Check `NEXT_PUBLIC_SITE_URL` is set to `https://yoforex.net`

### Issue: API calls failing
**Solution**: Verify `EXPRESS_URL=http://127.0.0.1:3001` and Express server is running on port 3001

### Issue: Database connection errors
**Solution**: Check `DATABASE_URL` format: `postgresql://user:pass@host:5432/db?sslmode=require`

### Issue: Authentication not working
**Solution**: Verify Replit Auth integration is set up with correct callback URLs

### Issue: SEO tags not showing
**Solution**: Rebuild Next.js (`npm run build`) and restart production servers

### Issue: Scrollbars looking unprofessional
**Solution**: Custom scrollbar styling implemented - clear browser cache and verify `.custom-scrollbar` class is applied

---

## 📞 Emergency Contacts

- **Database Issues**: Neon support
- **Hosting Issues**: Replit support
- **DNS Issues**: Domain registrar support
- **SEO Issues**: Google Search Console

---

## 🔄 Rollback Procedure

If critical issues occur:

1. **Immediate**: Stop production servers
   ```bash
   pkill -f "next start"
   pkill -f "node server/index.js"
   ```

2. **Database**: Restore from backup (if needed)
   ```bash
   # Contact Neon support for point-in-time recovery
   ```

3. **Code**: Revert to previous working commit
   ```bash
   git log --oneline
   git revert [commit-hash]
   npm run build
   bash start-production.sh
   ```

4. **Notify**: Alert users via site banner or social media

---

## ✅ Final Checklist Before Going Live

- [ ] All tests passing
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] SEO tags verified
- [ ] Analytics tracking
- [ ] SSL certificate active
- [ ] Backup strategy in place
- [ ] Monitoring tools configured
- [ ] Team notified
- [ ] Launch announcement ready

---

**Deployment Date**: __________  
**Deployed By**: __________  
**Build ID**: __________  
**Status**: ⬜ Pending / ⬜ In Progress / ⬜ Live / ⬜ Rolled Back

---

**Note**: This checklist should be reviewed and updated after each major deployment.
