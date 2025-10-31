# Category Migration Map: SEO Overhaul

## Migration Strategy
This document maps the current YoForex category structure to the new SEO-optimized taxonomy.

**Migration Date**: TBD  
**Status**: Planning Phase  
**Approach**: Zero-downtime phased migration with 301 redirects

---

## New SEO-Optimized Structure

### 1. Forex Trading (`/forex-trading/`)
**Primary Keywords**: forex expert advisors, MT4 MT5 indicators, forex trading robots, automated forex systems

#### Subcategories:
- **Expert Advisors** (`/forex-trading/expert-advisors/`)
  - Maps from: `ea-library` and all its subcategories
  
- **Indicators** (`/forex-trading/indicators/`)
  - Maps from: `indicators-templates` and all its subcategories
  
- **Source Code** (`/forex-trading/source-code/`)
  - Maps from: `coding-dev` (MQL4, MQL5 sections)
  
- **Strategies** (`/forex-trading/strategies/`)
  - Maps from: `trading-strategies` and all its subcategories
  
- **NinjaTrader** (`/forex-trading/ninjatrader/`)
  - **NEW CATEGORY** - No legacy mapping
  
- **Courses** (`/forex-trading/courses/`)
  - Maps from: `education` and all its subcategories
  
- **Signals** (`/forex-trading/signals/`)
  - Maps from: `tools-services/signal-services`
  
- **TradingView** (`/forex-trading/tradingview/`)
  - **NEW CATEGORY** - No legacy mapping

---

### 2. Binary Options (`/binary-options/`)
**Primary Keywords**: binary options robots, binary trading strategies, binary indicators MT4

#### Subcategories:
- **Robots** (`/binary-options/robots/`)
  - **NEW CATEGORY** - No legacy mapping
  
- **Indicators** (`/binary-options/indicators/`)
  - **NEW CATEGORY** - No legacy mapping
  
- **Strategies** (`/binary-options/strategies/`)
  - **NEW CATEGORY** - No legacy mapping
  
- **Training** (`/binary-options/training/`)
  - **NEW CATEGORY** - No legacy mapping

---

### 3. Cryptocurrency Trading (`/cryptocurrency-trading/`)
**Primary Keywords**: crypto trading bots, cryptocurrency EA, bitcoin trading strategy

#### Subcategories:
- **Bots** (`/cryptocurrency-trading/bots/`)
  - Partial map from: `trading-strategies/crypto-scalping`
  - Partial map from: `coding-dev/python-bots`
  
- **Strategies** (`/cryptocurrency-trading/strategies/`)
  - Partial map from: `trading-strategies/crypto-scalping`
  
- **Courses** (`/cryptocurrency-trading/courses/`)
  - **NEW CATEGORY** - No legacy mapping
  
- **Books** (`/cryptocurrency-trading/books/`)
  - **NEW CATEGORY** - No legacy mapping

---

### 4. Online Courses (`/online-courses/`)
**Primary Keywords**: forex trading courses, programming courses online, dropshipping training

#### Subcategories:
- **Programming** (`/online-courses/programming/`)
  - Partial map from: `coding-dev`
  
- **Business** (`/online-courses/business/`)
  - **NEW CATEGORY** - No legacy mapping
  
- **Dropshipping** (`/online-courses/dropshipping/`)
  - **NEW CATEGORY** - No legacy mapping
  
- **Social Media** (`/online-courses/social-media/`)
  - **NEW CATEGORY** - No legacy mapping

---

### 5. Sports Betting (`/sports-betting/`)
**Primary Keywords**: sports betting systems, betting strategy courses, sports betting software

#### Subcategories:
- **Systems** (`/sports-betting/systems/`)
  - **NEW CATEGORY** - No legacy mapping
  
- **Courses** (`/sports-betting/courses/`)
  - **NEW CATEGORY** - No legacy mapping
  
- **Tools** (`/sports-betting/tools/`)
  - **NEW CATEGORY** - No legacy mapping

---

### 6. Casino & Poker (`/casino-poker/`)
**Primary Keywords**: casino strategies, poker systems, blackjack card counting

- **No subcategories initially** (flat structure)
- **NEW CATEGORY** - No legacy mapping

---

### 7. Community (`/community/`)
**Purpose**: General discussions, member introductions, off-topic

#### Subcategories:
- **Journals** (`/community/journals/`)
  - Maps from: `journals-performance` and all its subcategories
  
- **Success Stories** (`/community/success-stories/`)
  - **NEW CATEGORY** - No legacy mapping
  
- **General Discussion** (`/community/general/`)
  - **NEW CATEGORY** - No legacy mapping

---

### 8. Free Downloads (`/free-downloads/`)
**Purpose**: Free EAs, indicators, tools

#### Subcategories:
- **Free EAs** (`/free-downloads/expert-advisors/`)
  - Maps from: `ea-library/free-eas-0`
  
- **Free Indicators** (`/free-downloads/indicators/`)
  - Partial map from: `indicators-templates` (free items only)
  
- **Free Tools** (`/free-downloads/tools/`)
  - Maps from: `tools-services/calculators-utilities`

---

## Detailed Legacy to New Mapping

### Current Parent Categories → New Structure

| Legacy Parent | Legacy Slug | Thread Count | New Parent | New Slug |
|---------------|-------------|--------------|------------|----------|
| Trading Strategies & Discussion | `trading-strategies` | 1 | Forex Trading | `forex-trading` |
| Expert Advisors Library | `ea-library` | 0 | Forex Trading (sub) | `forex-trading/expert-advisors` |
| Custom Indicators | `indicators-templates` | 0 | Forex Trading (sub) | `forex-trading/indicators` |
| Coding & Development | `coding-dev` | 0 | Forex Trading (sub) | `forex-trading/source-code` |
| Education & Resources | `education` | 0 | Forex Trading (sub) | `forex-trading/courses` |
| Tools & Services | `tools-services` | 0 | Multiple destinations | See subcategory mapping |
| Journals & Performance | `journals-performance` | 0 | Community | `community/journals` |
| Broker Reviews | `broker-reviews` | 0 | **KEEP SEPARATE** | `/brokers/` (existing structure) |

### Current Subcategories → New Structure

#### Trading Strategies Subcategories
| Legacy Slug | New Location | New Slug |
|-------------|--------------|----------|
| `scalping-m1-m15` | Forex Trading / Strategies | `forex-trading/strategies/scalping` |
| `day-trading` | Forex Trading / Strategies | `forex-trading/strategies/day-trading` |
| `swing-trading` | Forex Trading / Strategies | `forex-trading/strategies/swing-trading` |
| `position-trading` | Forex Trading / Strategies | `forex-trading/strategies/position-trading` |
| `grid-martingale` | Forex Trading / Strategies | `forex-trading/strategies/grid-martingale` |
| `hedging` | Forex Trading / Strategies | `forex-trading/strategies/hedging` |
| `news-scalping` | Forex Trading / Strategies | `forex-trading/strategies/news-trading` |
| `eurusd-scalping` | Forex Trading / Strategies | `forex-trading/strategies/eurusd` |
| `xauusd-scalping` | Forex Trading / Strategies | `forex-trading/strategies/xauusd` |
| `crypto-scalping` | Cryptocurrency Trading / Strategies | `cryptocurrency-trading/strategies/scalping` |
| `multi-pair-correlation` | Forex Trading / Strategies | `forex-trading/strategies/multi-pair` |

#### EA Library Subcategories
| Legacy Slug | New Location | New Slug |
|-------------|--------------|----------|
| `free-eas-0` | Free Downloads | `free-downloads/expert-advisors` |
| `budget-eas-50-100` | Forex Trading / Expert Advisors | `forex-trading/expert-advisors/budget` |
| `premium-eas-200-500` | Forex Trading / Expert Advisors | `forex-trading/expert-advisors/premium` |
| `mt4-eas` | Forex Trading / Expert Advisors | `forex-trading/expert-advisors/mt4` |
| `mt5-eas` | Forex Trading / Expert Advisors | `forex-trading/expert-advisors/mt5` |
| `ctrader-robots` | Forex Trading / Expert Advisors | `forex-trading/expert-advisors/ctrader` |
| `scalping-eas` | Forex Trading / Expert Advisors | `forex-trading/expert-advisors/scalping` |
| `trend-following-eas` | Forex Trading / Expert Advisors | `forex-trading/expert-advisors/trend-following` |
| `grid-trading-eas` | Forex Trading / Expert Advisors | `forex-trading/expert-advisors/grid-trading` |
| `breakout-eas` | Forex Trading / Expert Advisors | `forex-trading/expert-advisors/breakout` |
| `news-trading-eas` | Forex Trading / Expert Advisors | `forex-trading/expert-advisors/news-trading` |

#### Indicators & Templates Subcategories
| Legacy Slug | New Location | New Slug |
|-------------|--------------|----------|
| `trend-indicators` | Forex Trading / Indicators | `forex-trading/indicators/trend` |
| `oscillators-momentum` | Forex Trading / Indicators | `forex-trading/indicators/oscillators` |
| `volume-indicators` | Forex Trading / Indicators | `forex-trading/indicators/volume` |
| `sr-tools` | Forex Trading / Indicators | `forex-trading/indicators/support-resistance` |
| `template-packs` | Forex Trading / Indicators | `forex-trading/indicators/templates` |

#### Coding & Development Subcategories
| Legacy Slug | New Location | New Slug |
|-------------|--------------|----------|
| `mql4` | Forex Trading / Source Code | `forex-trading/source-code/mql4` |
| `mql5` | Forex Trading / Source Code | `forex-trading/source-code/mql5` |
| `python-bots` | Cryptocurrency Trading / Bots | `cryptocurrency-trading/bots/python` |
| `strategy-backtesting` | Forex Trading / Source Code | `forex-trading/source-code/backtesting` |
| `freelance-requests` | Online Courses / Programming | `online-courses/programming/freelance` |

#### Education & Resources Subcategories
| Legacy Slug | New Location | New Slug |
|-------------|--------------|----------|
| `beginners-corner` | Forex Trading / Courses | `forex-trading/courses/beginners` |
| `technical-analysis` | Forex Trading / Courses | `forex-trading/courses/technical-analysis` |
| `fundamental-analysis` | Forex Trading / Courses | `forex-trading/courses/fundamental-analysis` |
| `trading-psychology` | Forex Trading / Courses | `forex-trading/courses/psychology` |
| `risk-management` | Forex Trading / Courses | `forex-trading/courses/risk-management` |

#### Tools & Services Subcategories
| Legacy Slug | New Location | New Slug |
|-------------|--------------|----------|
| `vps-services` | Forex Trading / Tools | `forex-trading/tools/vps` |
| `signal-services` | Forex Trading / Signals | `forex-trading/signals` |
| `trade-copiers` | Forex Trading / Tools | `forex-trading/tools/copiers` |
| `calculators-utilities` | Free Downloads | `free-downloads/tools` |

#### Journals & Performance Subcategories
| Legacy Slug | New Location | New Slug |
|-------------|--------------|----------|
| `live-trading-journals` | Community / Journals | `community/journals/live-trading` |
| `ea-performance-reports` | Community / Journals | `community/journals/ea-performance` |
| `backtest-results` | Community / Journals | `community/journals/backtests` |
| `forward-test-results` | Community / Journals | `community/journals/forward-tests` |

#### Broker Reviews Subcategories
**NOTE**: Broker reviews will maintain their existing structure at `/brokers/` rather than being migrated. This avoids disrupting the broker directory which is already SEO-optimized.

| Legacy Slug | Action | New Location |
|-------------|--------|--------------|
| `broker-reviews/*` | **KEEP AS-IS** | `/brokers/` (no change) |

---

## URL Redirect Mapping Examples

### Category Page Redirects (301)
```
/category/trading-strategies → /forex-trading/strategies
/category/ea-library → /forex-trading/expert-advisors
/category/indicators-templates → /forex-trading/indicators
/category/education → /forex-trading/courses
/category/coding-dev → /forex-trading/source-code
/category/journals-performance → /community/journals
/category/tools-services → /forex-trading/tools (or /forex-trading/signals)
```

### Thread URL Redirects (301)
```
/category/trading-strategies/scalping-m1-m15 → /forex-trading/strategies/scalping
/category/ea-library/mt4-eas → /forex-trading/expert-advisors/mt4
/category/education/beginners-corner → /forex-trading/courses/beginners
```

### Individual Thread Page Redirects (301)
```
/category/trading-strategies/scalping-m1-m15/my-thread-slug → /forex-trading/strategies/scalping/my-thread-slug
/category/ea-library/free-eas-0/awesome-ea → /free-downloads/expert-advisors/awesome-ea
```

---

## Migration Phases

### Phase 1: Database Preparation (Week 1)
1. Add new columns to `forum_categories` table:
   - `new_slug` (text, nullable initially)
   - `new_parent_slug` (text, nullable)
   - `redirect_from_slug` (text, nullable)
2. Create `category_slug_redirects` table for tracking all URL changes
3. Backfill `new_slug` values for all existing categories
4. Test data integrity

### Phase 2: Create New Categories (Week 1)
1. Insert new parent categories (Forex Trading, Binary Options, etc.)
2. Insert new subcategories
3. Update `new_slug` and `new_parent_slug` for legacy categories
4. Populate redirect table with all old → new mappings

### Phase 3: Application Updates (Week 2)
1. Update routing to check `new_slug` first, fall back to `slug`
2. Implement redirect middleware
3. Update navigation components (mega-menu)
4. Update API responses to include both old and new slugs
5. Feature flag to switch between old/new routing

### Phase 4: Frontend Migration (Week 2)
1. Deploy mega-menu navigation
2. Update all internal links to use new URLs
3. Update breadcrumbs
4. Update sitemaps (split into multiple files)
5. Test all category pages

### Phase 5: Cutover & Monitoring (Week 3)
1. Enable new routing by default
2. Monitor redirect logs
3. Submit new sitemaps to search engines
4. Monitor Google Search Console for errors
5. Track ranking changes

### Phase 6: Cleanup (Week 4+)
1. Remove legacy `slug` column (after 30 days of monitoring)
2. Rename `new_slug` to `slug`
3. Remove feature flags
4. Archive redirect logs older than 90 days

---

## Thread & Content Migration

**Critical**: All existing threads must be associated with new category slugs.

### Migration SQL Strategy
```sql
-- Example: Update threads from old category to new category
UPDATE forum_threads 
SET category_slug = 'forex-trading/strategies/scalping'
WHERE category_slug = 'scalping-m1-m15';

-- Verify no threads are orphaned
SELECT COUNT(*) FROM forum_threads 
WHERE category_slug NOT IN (SELECT slug FROM forum_categories);
```

---

## Success Metrics

### Technical Metrics
- ✅ Zero 404 errors on old URLs (all redirected)
- ✅ All threads accessible via new URLs
- ✅ Sitemap submitted and indexed
- ✅ No broken internal links
- ✅ Page load time < 2 seconds

### SEO Metrics (Monitor for 90 days)
- 📊 Organic traffic maintained or increased
- 📊 Keyword rankings tracked weekly
- 📊 Google Search Console impressions/clicks
- 📊 Crawl errors: 0
- 📊 Index coverage: 95%+

### User Experience Metrics
- 🎯 Bounce rate: < 60%
- 🎯 Average session duration: > 2 minutes
- 🎯 Pages per session: > 2.5

---

## Rollback Plan

If critical issues arise:
1. **Immediate**: Disable new routing via feature flag
2. **Quick**: Revert to legacy slug column in database
3. **Full**: Restore database from pre-migration backup
4. **Communication**: Notify users via site banner

**Rollback Window**: 30 days after cutover

---

## Next Steps

1. ✅ Review and approve this migration map
2. ⏳ Create database migration scripts
3. ⏳ Implement redirect service
4. ⏳ Build mega-menu component
5. ⏳ Update routing logic
6. ⏳ Split sitemap system
7. ⏳ Execute migration in staging environment
8. ⏳ User acceptance testing
9. ⏳ Production deployment
10. ⏳ Post-migration monitoring

---

**Last Updated**: 2025-10-30  
**Document Owner**: SEO Overhaul Team  
**Status**: Draft - Pending Approval
