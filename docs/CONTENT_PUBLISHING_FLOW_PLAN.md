# Content Publishing Flow - Complete System Plan

## Overview
YoForex has **TWO distinct publishing systems**:
1. **Forum Threads** - Discussions, questions, reviews (Text-based)
2. **EA Content** - Expert Advisors, Indicators, Articles (File + Download-based)

## CRITICAL: These Are NOT The Same!

### Forum Threads (Discussions)
- **Purpose**: Community discussions, questions, strategy sharing
- **Route**: `/discussions/new` → POST `/api/threads`
- **Storage**: `forum_threads` table
- **Visibility**: Shows in discussions list, category pages
- **User Journey**: Write → Discuss → Reply
- **No files required** (optional attachments)

### EA Content (Marketplace)
- **Purpose**: Sell/share trading tools (EAs, Indicators)
- **Route**: `/publish` → POST `/api/publish`
- **Storage**: `content` table
- **Visibility**: Shows in marketplace, content library
- **User Journey**: Upload → List → Purchase/Download
- **Files required** (EA files, screenshots, documentation)

---

## 1. Forum Thread Creation Flow

### Frontend: `/discussions/new` (ThreadComposeClient.tsx)

**Step 1: User Fills Form**
```typescript
// Required fields:
- title (15-90 characters)
- body (500+ characters, ~150 words)
- categorySlug
- threadType (question, discussion, review, etc.)

// Optional fields:
- seoExcerpt (120-160 chars)
- primaryKeyword
- instruments (XAUUSD, EURUSD, etc.)
- timeframes (M5, H1, etc.)
- strategies (Scalping, Swing, etc.)
- hashtags (max 10)
- attachments (screenshots, PDFs, SET files)
```

**Step 2: Form Submission**
```typescript
const createThreadMutation = useMutation({
  mutationFn: async (data: ThreadFormData) => {
    const res = await apiRequest("POST", "/api/threads", data);
    return await res.json();
  },
  onSuccess: (response) => {
    // Shows success toast with:
    // - Thread URL to copy/share
    // - Coins earned (10-12 coins)
    // - Redirects to thread page
  }
});
```

### Backend: POST `/api/threads` (server/routes.ts:2484)

**Step 1: Validation**
- Validates schema (title length, body word count)
- Checks authentication
- Sanitizes inputs (XSS protection)
- Validates word count (minimum 150 words)

**Step 2: Thread Creation**
```typescript
const thread = await storage.createForumThread({
  ...validated,
  slug: "category-slug/thread-title-slug", // Auto-generated
  focusKeyword: "Auto-extracted from title",
  metaDescription: "Auto-generated from body",
  engagementScore: 0,
});
```

**Step 3: Coin Rewards**
- Base reward: **10 coins**
- Bonus reward: **+2 coins** if optional fields provided
- Transaction type: `thread_creation`

**Step 4: Side Effects**
- Creates activity feed entry
- Updates category stats (thread count)
- Marks onboarding progress (`firstThread` milestone)

**Step 5: Response**
```json
{
  "thread": {
    "id": "uuid",
    "title": "...",
    "slug": "category/thread-title",
    ...
  },
  "coinsEarned": 12,
  "message": "Posted! We'll share it around and keep things tidy for you."
}
```

### After Publishing: Where Thread Appears

1. **`/discussions`** - Recent Discussions page
2. **`/category/{categorySlug}`** - Category-specific page
3. **`/thread/{slug}`** - Individual thread page (SEO-optimized)
4. **Homepage "What's Hot"** - If engagement score rises
5. **User profile** - Author's threads list
6. **Search results** - Indexed by slug, title, body

---

## 2. EA Content Publishing Flow

### Frontend: `/publish` (PublishClient.tsx)

**Step 1: User Fills Publishing Form**
```typescript
// Basic Information
- contentType: "ea" | "indicator" | "article" | "source_code"
- title (e.g., "Gold Scalper Pro - High Win Rate EA")
- description (Rich HTML, detailed explanation)
- platform: "mt4" | "mt5" | "both"
- version (e.g., "1.0.0")
- category (from forum categories)

// Pricing
- isFree: boolean
- priceCoins: number (if paid)

// Files (CRITICAL FOR EAs/Indicators)
- EA/Indicator file (.ex4, .ex5, .mq4, .mq5)
- Screenshots (trading results, settings)
- Documentation (PDF user guide)
- SET files (backtesting parameters)

// Optional
- changelog (version history)
- images (product images)
- videoUrl (demo video)
```

**Step 2: File Upload Flow**
```typescript
// Files are uploaded BEFORE publishing
POST /api/uploads/file
{
  name: "GoldScalper.ex4",
  type: "ea",
  size: 45600
}

// Response:
{
  url: "/uploads/files/1234567890-GoldScalper.ex4",
  name: "GoldScalper.ex4",
  size: 45600
}
```

**Step 3: Content Submission**
```typescript
const publishMutation = useMutation({
  mutationFn: async (data: PublishFormData) => {
    const res = await apiRequest("POST", "/api/publish", data);
    return res.json();
  },
  onSuccess: (content) => {
    // Redirects to /content/{slug}
    router.push(`/content/${content.slug}`);
  }
});
```

### Backend: POST `/api/publish` (server/routes.ts:1434)

**Step 1: Validation**
- Validates schema (`publishContentSchema`)
- Checks authentication
- Sanitizes HTML in description
- Validates price (if paid content)

**Step 2: Content Creation**
```typescript
const content = await storage.createContent({
  ...validated,
  authorId: authenticatedUserId,
  status: "published", // or "draft" if user saves draft
  slug: auto-generated from title,
  downloads: 0,
  views: 0,
  salesCount: 0,
});
```

**Step 3: Badge Awards**
```typescript
await storage.checkAndAwardBadges(authenticatedUserId);
// Checks for:
// - "First Publisher" badge (first EA published)
// - "Prolific Creator" badge (10+ EAs)
// - "Bestseller" badge (100+ sales)
```

**Step 4: Coin Rewards** (via POST `/api/content`)
```typescript
// EA or Indicator: 50 coins
// Article: 20 coins
// SET file sharing: 5 coins

await storage.beginLedgerTransaction(
  'earn',
  userId,
  [
    {
      userId: authenticatedUserId,
      direction: 'credit',
      amount: 50, // For EA/Indicator
      memo: 'Published ea: Gold Scalper Pro'
    }
  ],
  { contentId: content.id, contentType: 'ea' }
);
```

**Step 5: Onboarding Progress**
```typescript
await storage.markOnboardingStep(
  authenticatedUserId,
  'firstPublish' // 30 coins bonus
);
```

**Step 6: Response**
```json
{
  "id": "content-uuid",
  "title": "Gold Scalper Pro",
  "slug": "gold-scalper-pro",
  "type": "ea",
  "priceCoins": 500,
  "authorId": "user-uuid",
  "status": "published"
}
```

### After Publishing: Where EA Content Appears

1. **`/marketplace`** - Main marketplace listing
   - Filtered by type (EA, Indicator, Article)
   - Sorted by newest, popular, top-rated
   - Searchable by title, description

2. **`/content/{slug}`** - Individual product page
   - Full description with HTML
   - Screenshots gallery
   - Download button (if purchased or free)
   - Reviews and ratings
   - Q&A section
   - Purchase button (if paid)

3. **User Profile** - `/user/{username}`
   - "Published Content" tab
   - Shows all EAs/Indicators by author

4. **Homepage** - "Top Sellers" section
   - If content gets sales/downloads
   - Ranked by revenue or download count

5. **Category Pages** - `/category/{categorySlug}`
   - Shows related EAs for that category

---

## 3. File Storage System

### Current Implementation
```typescript
// Mock file upload (server/routes.ts:1411)
POST /api/uploads/image
POST /api/uploads/file

// Returns:
{
  url: "/uploads/files/timestamp-filename.ext",
  name: "filename.ext",
  size: 12345
}
```

### ⚠️ PRODUCTION REQUIREMENTS

**Current State**: Files are stored locally in `/uploads/` directory
**Problem**: Local files don't persist on Replit's autoscale platform

**Required Solution**: Integrate Replit Object Storage

```bash
# 1. Add Replit Object Storage integration
# Use search_integrations tool to find object storage

# 2. Update file upload endpoints
POST /api/uploads/file
- Upload to Replit Object Storage
- Return permanent URL
- Store metadata in database

# 3. Update content schema
{
  files: [
    {
      name: "GoldScalper.ex4",
      url: "https://storage.replit.com/.../GoldScalper.ex4",
      type: "ea",
      size: 45600
    }
  ],
  images: [
    {
      url: "https://storage.replit.com/.../screenshot1.png",
      isCover: true,
      order: 0
    }
  ]
}
```

---

## 4. Content Purchase & Download Flow

### When User Buys EA Content

**Step 1: Purchase**
```typescript
POST /api/content/{contentId}/purchase
{
  paymentMethod: "coins" // or "stripe" for USD
}
```

**Step 2: Coin Transaction**
```typescript
// Buyer pays
await storage.beginLedgerTransaction(
  'purchase',
  buyerId,
  [
    {
      userId: buyerId,
      direction: 'debit',
      amount: 500, // EA price
      memo: 'Purchased: Gold Scalper Pro'
    },
    {
      userId: sellerId,
      direction: 'credit',
      amount: 475, // 95% to seller (5% platform fee)
      memo: 'Sale: Gold Scalper Pro'
    },
    {
      userId: 'platform',
      direction: 'credit',
      amount: 25, // 5% platform fee
      memo: 'Platform fee: Gold Scalper Pro'
    }
  ],
  { contentId, price: 500 }
);
```

**Step 3: Grant Access**
```typescript
await storage.createPurchase({
  userId: buyerId,
  contentId: contentId,
  priceCoins: 500,
  status: 'completed'
});
```

**Step 4: Download**
```typescript
GET /api/content/{contentId}/download
// Checks:
// 1. User owns content (purchased or free)
// 2. Content is published
// 3. Files exist

// Returns:
{
  files: [
    {
      name: "GoldScalper.ex4",
      url: "https://storage.replit.com/.../GoldScalper.ex4",
      downloadUrl: "/api/download/file/abc123" // Signed URL
    }
  ]
}
```

---

## 5. Testing Thread Creation Issue

### Debug Steps

1. **Check Browser Console** for errors when submitting
2. **Check Network Tab** for API request/response
3. **Check Server Logs** for validation errors

### Common Issues

**Issue 1: Authentication**
```
Error: "Not authenticated"
Solution: User must log in via /api/login (Replit OIDC)
```

**Issue 2: Validation Errors**
```
Error: "This is a bit short—add 3–4 more words?"
Solution: Title must be 15-90 characters

Error: "A little more context helps people reply..."
Solution: Body must be 500+ characters (~150 words)
```

**Issue 3: Rate Limiting**
```
Error: 429 Too Many Requests
Solution: Content creation limited to 5 per hour
```

**Issue 4: Category Not Found**
```
Error: "Category not found"
Solution: Select valid category from dropdown
```

---

## 6. Complete User Journeys

### Journey A: Trader Posts Discussion Thread

1. User visits `/discussions`
2. Clicks "+ New Thread"
3. Fills form:
   - Title: "XAUUSD CPI/NFP handling: disable or reduce lots?"
   - Body: 500+ char explanation
   - Category: "Strategy Discussion"
   - Instruments: [XAUUSD]
   - Timeframes: [M5, M15]
4. Clicks "Post Thread"
5. **Thread created** → Earns 10-12 coins
6. Redirected to `/thread/strategy-discussion/xauusd-cpi-nfp-handling`
7. Thread appears in:
   - `/discussions` (recent discussions)
   - `/category/strategy-discussion`
   - User's profile page

### Journey B: Developer Publishes EA

1. User visits `/marketplace`
2. Clicks "Release EA" → "Publish EA"
3. Goes to `/publish`
4. Fills form:
   - Title: "Gold Scalper Pro - High Win Rate EA"
   - Type: "Expert Advisor (EA)"
   - Description: Rich HTML with features
   - Platform: "Both MT4 & MT5"
   - Category: "EA Library"
5. **Uploads files**:
   - GoldScalper.ex4 (MT4 file)
   - GoldScalper.ex5 (MT5 file)
   - Screenshots (3 images)
   - UserGuide.pdf
   - Settings.set
6. Sets price: 500 coins ($27.50 USD)
7. Clicks "Publish"
8. **EA created** → Earns 50 coins + First Publisher badge
9. Redirected to `/content/gold-scalper-pro`
10. EA appears in:
    - `/marketplace` (newest EAs)
    - User's profile (published content)
    - `/category/ea-library`

### Journey C: Trader Buys EA

1. User visits `/marketplace`
2. Finds "Gold Scalper Pro" (500 coins)
3. Clicks product → Goes to `/content/gold-scalper-pro`
4. Reads description, reviews, Q&A
5. Clicks "Buy Now" (500 coins)
6. Confirms purchase
7. **Purchase completed**:
   - Buyer: -500 coins
   - Seller: +475 coins (95%)
   - Platform: +25 coins (5% fee)
8. Download button appears
9. Clicks "Download"
10. Gets ZIP with:
    - GoldScalper.ex4
    - GoldScalper.ex5
    - UserGuide.pdf
    - Settings.set

---

## 7. Database Tables

### Forum Threads
```sql
forum_threads
  - id (uuid)
  - title (varchar)
  - body (text)
  - slug (varchar, indexed)
  - categorySlug (varchar)
  - authorId (varchar, FK to users)
  - views (integer)
  - replyCount (integer)
  - engagementScore (integer)
  - createdAt (timestamp)
  - status (enum: draft, published, locked)
```

### EA Content
```sql
content
  - id (uuid)
  - type (enum: ea, indicator, article, source_code)
  - title (varchar)
  - description (text, HTML allowed)
  - slug (varchar, indexed)
  - authorId (varchar, FK to users)
  - priceCoins (integer, nullable)
  - isFree (boolean)
  - platform (enum: mt4, mt5, both)
  - files (json array)
  - images (json array)
  - downloads (integer)
  - views (integer)
  - salesCount (integer)
  - revenue (integer, total coins earned)
  - status (enum: draft, published, suspended)
  - createdAt (timestamp)
```

### Purchases
```sql
purchases
  - id (uuid)
  - userId (varchar, FK to users)
  - contentId (varchar, FK to content)
  - priceCoins (integer)
  - status (enum: pending, completed, refunded)
  - createdAt (timestamp)
```

---

## 8. Action Items for Production Deployment

### Critical (Must Do Before Launch)

1. **✅ Fix Thread Creation** (Already Working)
   - Endpoint exists and functional
   - If user reports issues, debug specific validation errors

2. **🔴 Implement File Storage**
   - Current: Mock file uploads (local storage)
   - Required: Replit Object Storage integration
   - Files: EA files, screenshots, PDFs, SET files

3. **🔴 Implement Purchase System**
   - Coin payment processing
   - Stripe integration for USD payments
   - Download access control

4. **🔴 File Download Security**
   - Signed URLs with expiration
   - Purchase verification before download
   - Rate limiting on downloads

### Important (Launch Week)

5. **🟡 Content Moderation**
   - Admin review queue for published EAs
   - Virus scanning for uploaded files
   - Malicious code detection

6. **🟡 Search & Discovery**
   - Full-text search for threads and content
   - Advanced filters (price range, platform, rating)
   - Recommendations engine

### Nice to Have (Post-Launch)

7. **🟢 Analytics Dashboard**
   - Publisher earnings dashboard
   - Download statistics
   - Revenue tracking

8. **🟢 Reviews & Ratings**
   - User reviews for purchased EAs
   - Star ratings
   - Verified purchaser badge

---

## 9. Testing Checklist

### Thread Creation
- [ ] Create thread as logged-in user
- [ ] Verify thread appears in `/discussions`
- [ ] Verify thread appears in category page
- [ ] Verify coin reward (10-12 coins)
- [ ] Verify activity feed entry
- [ ] Test validation errors (short title, short body)
- [ ] Test rate limiting (5 per hour)

### EA Publishing
- [ ] Upload EA file (.ex4, .ex5)
- [ ] Upload screenshots
- [ ] Set price (free or coins)
- [ ] Publish EA
- [ ] Verify appears in `/marketplace`
- [ ] Verify product page `/content/{slug}`
- [ ] Verify coin reward (50 coins)
- [ ] Verify badge award

### Purchase Flow
- [ ] Find EA in marketplace
- [ ] Click "Buy Now"
- [ ] Verify coin balance check
- [ ] Complete purchase
- [ ] Verify coin deduction
- [ ] Verify seller receives coins (95%)
- [ ] Download files
- [ ] Verify purchase history

---

## Summary

**Two Distinct Systems:**
1. **Forum Threads** (`/discussions/new` → `/api/threads`)
   - Text-based discussions
   - No files required
   - Earns 10-12 coins
   - Appears in discussions/categories

2. **EA Content** (`/publish` → `/api/publish`)
   - File-based products
   - Files required
   - Earns 50 coins + sales revenue
   - Appears in marketplace

**Critical Missing Piece:**
- **File storage** must use Replit Object Storage (not local files)
- **Purchase system** needs completion
- **Download system** needs access control

**Next Steps:**
1. Test thread creation to confirm it works
2. Integrate Replit Object Storage for file uploads
3. Complete purchase/download flow
4. Add content moderation
