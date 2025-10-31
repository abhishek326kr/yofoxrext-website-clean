import { db } from "./db";
import { users, brokers, contentReplies, forumCategories, forumThreads, forumReplies, userBadges, activityFeed } from "@shared/schema";
import { storage } from "./storage";
import { eq } from "drizzle-orm";

// SEO Helper Functions
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function generateMetaDescription(text: string, maxLength: number = 155): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength - 3) + '...';
}

function extractFocusKeyword(title: string): string {
  // Extract main keyword from title (first 2-3 meaningful words)
  const words = title.toLowerCase().split(' ').filter(w => 
    !['the', 'a', 'an', 'is', 'are', 'was', 'were', 'for', 'to', 'of', 'in', 'on', 'at', 'with', 'by'].includes(w)
  );
  return words.slice(0, 3).join(' ');
}

function getRandomDate(daysAgo: number): Date {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  const randomHours = Math.floor(Math.random() * 24);
  now.setDate(now.getDate() - randomDays);
  now.setHours(now.getHours() - randomHours);
  return now;
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Use the specified demo user ID
  const DEMO_USER_ID = "6e5f03b9-e0f1-424b-b264-779d75f62d89";
  
  let demoUser = await storage.getUser(DEMO_USER_ID);
  if (!demoUser) {
    // If not found, try getting by username
    demoUser = await storage.getUserByUsername("demo") || await storage.getUserByUsername("demo-user");
    if (!demoUser) {
      throw new Error(`Demo user not found. Please create a user with ID '${DEMO_USER_ID}' first.`);
    }
  }

  let trader1 = await storage.getUserByUsername("AlgoKing");
  if (!trader1) {
    trader1 = await storage.createUser({
      username: "AlgoKing",
      password: "password123",
    });
    await storage.updateUserCoins(trader1.id, 8540);
  }

  let trader2 = await storage.getUserByUsername("GridMaster88");
  if (!trader2) {
    trader2 = await storage.createUser({
      username: "GridMaster88",
      password: "password123",
    });
    await storage.updateUserCoins(trader2.id, 5230);
  }

  console.log(`✅ Created or found 3 demo users`);

  // Create sample content
  const contentData = [
    {
      authorId: trader1.id,
      type: "ea" as const,
      title: "Gold Hedger EA - Profitable Grid Strategy for XAUUSD",
      description: "Professional grid trading EA specifically optimized for Gold (XAUUSD). Features dynamic lot sizing, smart grid spacing, and advanced risk management. Includes backtests from 2020-2024 showing 67% win rate with max 18% drawdown. Works on MT4/MT5.",
      priceCoins: 250,
      isFree: false,
      category: "Grid Trading",
      postLogoUrl: null,
      fileUrl: "/files/gold-hedger-ea.ex4",
      imageUrl: "/images/gold-hedger-chart.png",
      imageUrls: ["/images/gold-hedger-chart.png", "/images/gold-backtest.png"],
      views: 1247,
      downloads: 89,
      likes: 67,
      status: "approved" as const,
    },
    {
      authorId: trader2.id,
      type: "indicator" as const,
      title: "Smart Money Divergence Indicator - Detect Institutional Orders",
      description: "Advanced divergence indicator that highlights institutional order flow. Uses volume profile analysis combined with price action to identify smart money entry/exit points. Multi-timeframe support (M15-D1). Perfect for scalping and day trading.",
      priceCoins: 150,
      isFree: false,
      category: "Technical Analysis",
      postLogoUrl: null,
      fileUrl: "/files/smart-money-divergence.ex4",
      imageUrl: "/images/smd-indicator.png",
      imageUrls: ["/images/smd-indicator.png", "/images/smd-signals.png", "/images/smd-settings.png"],
      views: 892,
      downloads: 54,
      likes: 43,
      status: "approved" as const,
    },
    {
      authorId: trader1.id,
      type: "article" as const,
      title: "How I Made $45K in 6 Months Trading Gold with Grid Strategy",
      description: "Detailed breakdown of my 6-month trading journey using grid strategies on XAUUSD. Includes: risk management rules, optimal grid spacing formulas, session-based trading times, broker selection criteria, and psychological tips. Real account screenshots included.",
      priceCoins: 50,
      isFree: false,
      category: "Trading Psychology",
      postLogoUrl: null,
      fileUrl: null,
      imageUrl: "/images/trading-results.png",
      imageUrls: ["/images/trading-results.png", "/images/equity-curve.png"],
      views: 2134,
      downloads: 156,
      likes: 128,
      status: "approved" as const,
    },
    {
      authorId: trader2.id,
      type: "source_code" as const,
      title: "MQL4 Library - Custom Grid Functions with Error Handling",
      description: "Complete MQL4 library for building grid trading systems. Includes: safe order placement with retry logic, grid level calculation functions, profit target management, emergency stop loss, and broker compatibility checks. Well-commented code, beginner-friendly.",
      priceCoins: 100,
      isFree: false,
      category: "Algorithm Development",
      postLogoUrl: null,
      fileUrl: "/files/grid-library.mq4",
      imageUrl: null,
      imageUrls: null,
      views: 567,
      downloads: 32,
      likes: 29,
      status: "approved" as const,
    },
    {
      authorId: demoUser.id,
      type: "ea" as const,
      title: "FREE Breakout Scalper - News Trading EA",
      description: "Free news breakout EA that trades high-impact news events. Features: economic calendar integration, pending order system, trailing stop, and time filter. Best for EURUSD, GBPUSD during London/NY sessions. Limited features version - premium version available.",
      priceCoins: 0,
      isFree: true,
      category: "News Trading",
      postLogoUrl: null,
      fileUrl: "/files/breakout-scalper-free.ex4",
      imageUrl: "/images/breakout-ea.png",
      imageUrls: ["/images/breakout-ea.png"],
      views: 3421,
      downloads: 421,
      likes: 234,
      status: "approved" as const,
    },
  ];

  const createdContent = [];
  for (const item of contentData) {
    const created = await storage.createContent(item);
    createdContent.push(created);
  }

  console.log(`✅ Created ${createdContent.length} sample content items`);

  // Create sample brokers
  const brokerData = [
    {
      name: "IC Markets",
      slug: "ic-markets",
      websiteUrl: "https://icmarkets.com",
      logoUrl: null,
      yearFounded: 2007,
      regulationSummary: "ASIC (Australia), CySEC (Cyprus), FSA (Seychelles)",
      overallRating: 5,
      reviewCount: 23,
      scamReportCount: 1,
      isVerified: true,
      status: "approved" as const,
    },
    {
      name: "Pepperstone",
      slug: "pepperstone",
      websiteUrl: "https://pepperstone.com",
      logoUrl: null,
      yearFounded: 2010,
      regulationSummary: "ASIC (Australia), FCA (UK), CySEC (Cyprus)",
      overallRating: 5,
      reviewCount: 18,
      scamReportCount: 0,
      isVerified: true,
      status: "approved" as const,
    },
    {
      name: "FBS",
      slug: "fbs",
      websiteUrl: "https://fbs.com",
      logoUrl: null,
      yearFounded: 2009,
      regulationSummary: "IFSC (Belize), CySEC (Cyprus)",
      overallRating: 3,
      reviewCount: 12,
      scamReportCount: 4,
      isVerified: false,
      status: "approved" as const,
    },
  ];

  for (const broker of brokerData) {
    await db.insert(brokers).values(broker).onConflictDoNothing();
  }

  console.log(`✅ Created ${brokerData.length} sample brokers`);

  // Create sample replies for first content item
  if (createdContent.length > 0) {
    const firstContentId = createdContent[0].id;

    const [reply1] = await db
      .insert(contentReplies)
      .values({
        contentId: firstContentId,
        userId: demoUser.id,
        parentId: null,
        body: "Excellent EA! Been running this on my live account for 3 weeks now. Started with $5000 and currently up $890. The grid spacing is perfect for gold's volatility. Quick question: what's the recommended lot size for a $10k account?",
        rating: 5,
        imageUrls: null,
        helpful: 12,
        isVerified: false,
      })
      .onConflictDoNothing()
      .returning();

    const [reply2] = await db
      .insert(contentReplies)
      .values({
        contentId: firstContentId,
        userId: trader1.id,
        parentId: reply1.id,
        body: "Thanks for the great feedback! For a $10k account, I'd recommend starting with 0.02 lots per grid level with max 10 levels. This gives you enough cushion for drawdown while maintaining good profit potential. Make sure to adjust based on your broker's spread!",
        rating: null,
        imageUrls: null,
        helpful: 8,
        isVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    await db
      .insert(contentReplies)
      .values({
        contentId: firstContentId,
        userId: trader2.id,
        parentId: reply1.id,
        body: "I second this! Running 0.03 lots on $15k account and it's been smooth. The key is being patient during ranging markets. Don't panic when you see multiple open positions - that's the grid doing its job.",
        rating: null,
        imageUrls: null,
        helpful: 5,
        isVerified: true,
      })
      .onConflictDoNothing();

    await db
      .insert(contentReplies)
      .values({
        contentId: firstContentId,
        userId: trader2.id,
        parentId: null,
        body: "Does this work on EURUSD or only Gold? I'm getting mixed results on EUR pairs with default settings.",
        rating: 3,
        imageUrls: null,
        helpful: 3,
        isVerified: true,
      })
      .onConflictDoNothing();

    console.log(`✅ Created sample replies for content`);
  }

  // ========================================
  // FORUM CATEGORIES - All 15 Categories
  // ========================================
  console.log("🏷️  Creating forum categories...");

  const categoryData = [
    { slug: "strategy-discussion", name: "Strategy Discussion", description: "Share and discuss trading strategies, from scalping to swing trading", icon: "TrendingUp", color: "bg-blue-500", sortOrder: 1 },
    { slug: "algorithm-development", name: "Algorithm Development", description: "MQL4/MQL5 coding, EA development, and automation techniques", icon: "Code", color: "bg-purple-500", sortOrder: 2 },
    { slug: "backtest-results", name: "Backtest Results", description: "Share your backtest results, optimization reports, and performance analysis", icon: "BarChart", color: "bg-green-500", sortOrder: 3 },
    { slug: "live-trading-reports", name: "Live Trading Reports", description: "Real account performance, trade journals, and live trading discussions", icon: "Activity", color: "bg-orange-500", sortOrder: 4 },
    { slug: "signal-services", name: "Signal Services", description: "Discuss signal providers, copy trading, and social trading platforms", icon: "Radio", color: "bg-pink-500", sortOrder: 5 },
    { slug: "mt4-mt5-tips", name: "MT4/MT5 Tips", description: "Platform tips, tricks, custom indicators, and terminal optimization", icon: "Monitor", color: "bg-indigo-500", sortOrder: 6 },
    { slug: "broker-discussion", name: "Broker Discussion", description: "Broker reviews, spread comparison, and execution quality discussions", icon: "Building", color: "bg-cyan-500", sortOrder: 7 },
    { slug: "risk-management", name: "Risk Management", description: "Position sizing, drawdown control, and portfolio management strategies", icon: "Shield", color: "bg-red-500", sortOrder: 8 },
    { slug: "market-analysis", name: "Market Analysis", description: "Technical analysis, fundamental analysis, and market forecasting", icon: "LineChart", color: "bg-teal-500", sortOrder: 9 },
    { slug: "indicator-library", name: "Indicator Library", description: "Custom indicators, trading tools, and technical analysis utilities", icon: "Layers", color: "bg-violet-500", sortOrder: 10 },
    { slug: "ea-reviews", name: "EA Reviews", description: "Expert Advisor reviews, performance ratings, and community feedback", icon: "Star", color: "bg-yellow-500", sortOrder: 11 },
    { slug: "troubleshooting", name: "Troubleshooting", description: "Get help with EA issues, coding errors, and platform problems", icon: "AlertCircle", color: "bg-rose-500", sortOrder: 12 },
    { slug: "trading-psychology", name: "Trading Psychology", description: "Mindset, discipline, emotional control, and trading journal discussions", icon: "Brain", color: "bg-emerald-500", sortOrder: 13 },
    { slug: "news-updates", name: "News & Updates", description: "Market news, economic events, and platform updates", icon: "Newspaper", color: "bg-amber-500", sortOrder: 14 },
    { slug: "commercial-trials", name: "Commercial & Trials", description: "Promote your EAs, offer trials, and showcase your products", icon: "ShoppingCart", color: "bg-lime-500", sortOrder: 15 },
  ];

  for (const cat of categoryData) {
    await db.insert(forumCategories).values(cat).onConflictDoNothing();
  }

  console.log(`✅ Created ${categoryData.length} forum categories`);

  // ========================================
  // FORUM THREADS - Realistic Trading Discussions
  // ========================================
  console.log("💬 Creating forum threads...");

  const threadData = [
    {
      authorId: trader1.id,
      categorySlug: "strategy-discussion",
      title: "XAUUSD M1 Scalping - Stable Set File for Gold Trading",
      body: "After months of optimization, I've finally cracked a stable M1 scalping strategy for XAUUSD. Key settings:\n\n- Lot size: 0.01 per $1000\n- TP: 8 pips, SL: 12 pips\n- Trading hours: 8:00-16:00 GMT only (avoid Asian session)\n- Spread filter: max 25 points\n- Uses custom RSI divergence + volume confirmation\n\nBacktest results from Jan-Oct 2024: 68% win rate, profit factor 1.85, max DD 14.2%. Running live on IC Markets for 3 weeks, currently up $1,247 on $10k account.\n\nAnyone else trading Gold on M1? What's your approach to handling the volatility spikes during news events?",
      isPinned: true,
      views: 3847,
      replyCount: 0,
      lastActivityAt: getRandomDate(3),
      status: "approved" as const,
    },
    {
      authorId: trader2.id,
      categorySlug: "algorithm-development",
      title: "MQL5 EA Template with Multi-Pair Support and Advanced Money Management",
      body: "I've built a robust EA template that includes:\n\n```mql5\n// Multi-pair trading support\n// Dynamic lot sizing based on account equity\n// Advanced trailing stop with breakeven logic\n// Session filters (London, NY, Asian)\n// Spread monitoring and trade validation\n// Email + push notifications\n```\n\nThe template uses class-based architecture for easy maintenance. Includes proper error handling for order placement and modification. Works with both hedging and netting accounts.\n\nLooking for beta testers! Drop a comment if you want to try it. Also open to suggestions for additional features.",
      isPinned: false,
      views: 1256,
      replyCount: 0,
      lastActivityAt: getRandomDate(5),
      status: "approved" as const,
    },
    {
      authorId: demoUser.id,
      categorySlug: "backtest-results",
      title: "Backtest Results: EURUSD Grid Strategy 2020-2024 (99% Quality)",
      body: "Just finished a comprehensive backtest of my grid EA on EURUSD H1 using real tick data:\n\n📊 **Results Summary:**\n- Initial deposit: $10,000\n- Final balance: $47,832\n- Total net profit: $37,832 (378.32%)\n- Win rate: 71.4%\n- Profit factor: 2.14\n- Max drawdown: 18.7% ($1,870)\n- Total trades: 2,847\n- Sharpe ratio: 1.93\n\n**Settings:**\n- Grid step: 20 pips\n- Max grid levels: 8\n- Lot multiplier: 1.5\n- TP per level: 15 pips\n\nBacktest quality was 99% (real ticks, every tick mode). Broker model: IC Markets. The strategy worked especially well during 2022-2023 trending markets.\n\nAttached: Full backtest report + statement HTML. Questions welcome!",
      isPinned: false,
      views: 2145,
      replyCount: 0,
      lastActivityAt: getRandomDate(7),
      status: "approved" as const,
    },
    {
      authorId: trader1.id,
      categorySlug: "live-trading-reports",
      title: "Week 12 Live Results - Martingale Recovery EA ($5k → $8.2k)",
      body: "**Weekly Update - Live Account Performance**\n\nStarting balance: $5,000\nCurrent balance: $8,247\nProfit this week: +$847 (+11.4%)\n\nTrades this week: 47\nWin rate: 68%\nLargest win: $284\nLargest loss: -$156\n\nBroker: Pepperstone RAW\nAverage spread: 0.6 pips (EURUSD)\n\nThe EA uses a controlled martingale system with max 3 recovery attempts. This week was smooth - only had to recover twice and both times it worked perfectly. Still maintaining strict 15% max DD rule.\n\n⚠️ **Risk Warning:** Martingale is high risk. Only using 2% per initial trade. Not recommended for beginners.\n\nMyfxbook link in profile for live verification.",
      isPinned: false,
      views: 1823,
      replyCount: 0,
      lastActivityAt: getRandomDate(2),
      status: "approved" as const,
    },
    {
      authorId: trader2.id,
      categorySlug: "mt4-mt5-tips",
      title: "Custom MT5 Indicator: Smart Money Concepts (SMC) Scanner",
      body: "Built a powerful indicator that automatically identifies:\n\n✅ Order blocks (bullish/bearish)\n✅ Fair value gaps (FVG)\n✅ Break of structure (BOS)\n✅ Change of character (CHoCH)\n✅ Liquidity zones\n\nWorks on all timeframes. Highlights high-probability zones where institutions are likely entering. The indicator plots boxes on the chart and sends alerts when price approaches these levels.\n\n**Installation:**\n1. Copy to Indicators folder\n2. Restart MT5\n3. Drag onto chart\n\n**Settings:**\n- FVG minimum size: 10 pips (adjustable)\n- Order block lookback: 100 bars\n- Alert enabled: true/false\n\nFree download in comments. Would love feedback from SMC traders!",
      isPinned: false,
      views: 2934,
      replyCount: 0,
      lastActivityAt: getRandomDate(4),
      status: "approved" as const,
    },
    {
      authorId: demoUser.id,
      categorySlug: "broker-discussion",
      title: "IC Markets vs Pepperstone - Real Slippage Test Results",
      body: "I ran a 30-day test comparing execution quality on both brokers using the same EA:\n\n**Test Setup:**\n- Same EA, same settings\n- $5k account on each\n- EURUSD, GBPUSD only\n- News trading EA (high slippage risk)\n\n**IC Markets:**\n- Average slippage: 0.4 pips\n- Positive slippage: 23%\n- Requotes: 2 (out of 847 orders)\n- Execution speed: 18ms average\n\n**Pepperstone:**\n- Average slippage: 0.6 pips\n- Positive slippage: 19%\n- Requotes: 5 (out of 839 orders)\n- Execution speed: 22ms average\n\n**Verdict:** IC Markets slightly better, but both are excellent. Pepperstone has better customer service though. For news trading specifically, IC Markets edge is worth it.\n\nNote: I'm on Sydney VPS for both, your results may vary based on location.",
      isPinned: false,
      views: 4123,
      replyCount: 0,
      lastActivityAt: getRandomDate(6),
      status: "approved" as const,
    },
    {
      authorId: trader1.id,
      categorySlug: "risk-management",
      title: "The 2% Rule Saved My Account - My Drawdown Recovery Story",
      body: "Last month I violated my own risk management rules and paid the price. Sharing this as a cautionary tale.\n\n**What Happened:**\n- Usually risk 2% per trade max\n- Got overconfident after 8 wins in a row\n- Increased to 5% per trade\n- Hit a 6-trade losing streak\n- Lost 28% of account in 2 days\n\n**The Recovery:**\n- Immediately stopped trading for 1 week\n- Reviewed every losing trade\n- Went back to strict 2% rule\n- Took 6 weeks to recover the losses\n- Now back to break-even\n\n**Lessons:**\n1. Never increase risk after winning streak\n2. Discipline > Intelligence\n3. 2% rule exists for a reason\n4. One bad day can wipe out weeks of profits\n\nAnyone else have similar experiences? How did you recover mentally?",
      isPinned: false,
      views: 2678,
      replyCount: 0,
      lastActivityAt: getRandomDate(8),
      status: "approved" as const,
    },
    {
      authorId: trader2.id,
      categorySlug: "market-analysis",
      title: "XAUUSD Analysis - Why Gold Will Hit $2,200 This Month",
      body: "Technical + fundamental analysis pointing to strong bullish momentum:\n\n**Technical:**\n- Broke above 2,150 resistance with high volume\n- RSI showing strength but not overbought\n- MACD golden cross on daily\n- Fibonacci 1.618 extension targets 2,205\n\n**Fundamental:**\n- Fed likely to pause rate hikes\n- Geopolitical tensions increasing (safe haven demand)\n- Dollar weakening against major currencies\n- Central banks accumulating gold\n\n**My positions:**\n- Long from 2,145, SL at 2,120\n- TP1: 2,180 (50% close)\n- TP2: 2,205 (remaining 50%)\n\nRisk/reward: 1:2.4\n\nWhat's your take? Am I being too optimistic?",
      isPinned: false,
      views: 1934,
      replyCount: 0,
      lastActivityAt: getRandomDate(1),
      status: "approved" as const,
    },
    {
      authorId: demoUser.id,
      categorySlug: "ea-reviews",
      title: "Review: Forex Fury EA - 6 Months Live Results (Honest Opinion)",
      body: "**Overall Rating: 3.5/5**\n\nI've been running Forex Fury on a live account for 6 months. Here's my honest assessment:\n\n**Pros:**\n✅ Consistent small profits (average $200/week on $5k account)\n✅ Good documentation and support\n✅ Regular updates from developer\n✅ Works on multiple brokers\n✅ Low drawdown (max 12% in my testing)\n\n**Cons:**\n❌ Expensive ($349 one-time)\n❌ Needs VPS (adds monthly cost)\n❌ Very sensitive to spread - useless on high-spread brokers\n❌ Stopped working well after September update\n❌ Refund policy is complicated\n\n**Results:**\n- Starting: $5,000\n- After 6 months: $6,847\n- Total profit: +36.9%\n- Max DD: 11.8%\n\n**Recommendation:** Good for set-and-forget style, but there are cheaper alternatives with similar performance. Worth it if you catch a sale.\n\nHappy to answer questions!",
      isPinned: false,
      views: 5234,
      replyCount: 0,
      lastActivityAt: getRandomDate(9),
      status: "approved" as const,
    },
    {
      authorId: trader1.id,
      categorySlug: "troubleshooting",
      title: "URGENT: EA Stopped Opening Trades After MT5 Update - SOLVED",
      body: "**PROBLEM SOLVED - Posting solution for others**\n\nIssue: EA compiled fine, no errors in log, but stopped opening any trades after MT5 build 3850 update.\n\n**What I tried (didn't work):**\n- Recompiling EA\n- Checking AutoTrading button\n- Verifying account permissions\n- Reinstalling MT5\n\n**SOLUTION:**\nThe new MT5 build changed how trade requests are validated. Had to update the EA code:\n\n```mql5\n// OLD CODE (broken):\nrequest.type = ORDER_TYPE_BUY;\nrequest.action = TRADE_ACTION_DEAL;\n\n// NEW CODE (working):\nrequest.action = TRADE_ACTION_DEAL;\nrequest.type = ORDER_TYPE_BUY;\nrequest.type_filling = ORDER_FILLING_FOK; // THIS WAS MISSING!\n```\n\nAdding `type_filling` fixed it! All trades working normally now.\n\nHope this helps someone else stuck with the same issue.",
      isPinned: false,
      views: 1567,
      replyCount: 0,
      lastActivityAt: getRandomDate(10),
      status: "approved" as const,
    },
    {
      authorId: trader2.id,
      categorySlug: "trading-psychology",
      title: "How I Overcame Revenge Trading (And Saved My Account)",
      body: "Revenge trading nearly destroyed my account. Here's how I fixed it:\n\n**The Problem:**\nAfter every loss, I'd immediately open a larger position to \"win it back.\" Lost $3,200 in one afternoon doing this.\n\n**What Changed:**\n\n1. **Mandatory Break Rule**\n   - After any loss: 2-hour minimum break\n   - After 3 losses in a row: Stop for the day\n   - No exceptions\n\n2. **Pre-Trade Checklist**\n   - Am I calm and focused? (Yes/No)\n   - Is this based on my strategy? (Yes/No)\n   - Have I waited the required time? (Yes/No)\n   - All must be YES or no trade\n\n3. **Daily Loss Limit**\n   - Max 3% account loss per day\n   - EA automatically stops at -3%\n   - Cannot override it\n\n4. **Trading Journal**\n   - Record emotional state before each trade\n   - Review weekly to identify patterns\n   - Realized most losses happened when angry/frustrated\n\n**Results:**\nWent from losing 2 months to profitable 4 months in a row. Win rate improved from 43% to 61% just by controlling emotions.\n\nAnyone else struggle with this? What techniques worked for you?",
      isPinned: false,
      views: 3421,
      replyCount: 0,
      lastActivityAt: getRandomDate(11),
      status: "approved" as const,
    },
    {
      authorId: demoUser.id,
      categorySlug: "news-updates",
      title: "Major Update: MetaTrader 5 Build 3900 Released - What's New",
      body: "MetaQuotes just released MT5 build 3900 with some significant changes:\n\n**Key Updates:**\n\n🔧 **Performance Improvements**\n- 30% faster backtesting on multi-core processors\n- Optimized memory usage for EAs with many indicators\n- Faster chart rendering\n\n📊 **New Features**\n- Enhanced Strategy Tester with genetic optimization\n- New built-in indicators (21 total additions)\n- Improved MQL5 debugger\n- Cloud terminal synchronization\n\n⚠️ **Breaking Changes**\n- OrderSend() now requires type_filling parameter (see my troubleshooting thread)\n- Some deprecated functions removed\n- Changed behavior for pending order modification\n\n🐛 **Bug Fixes**\n- Fixed memory leak in custom indicators\n- Corrected timezone issues in Strategy Tester\n- Fixed crash when loading large history files\n\n**Recommendation:** Test your EAs in demo before updating live accounts. Some older EAs may need code updates.\n\nDownload: Official MetaQuotes website\n\nAnyone updated yet? Any issues?",
      isPinned: true,
      views: 6234,
      replyCount: 0,
      lastActivityAt: getRandomDate(0),
      status: "approved" as const,
    },
  ];

  const createdThreads: any[] = [];
  for (const thread of threadData) {
    const slug = generateSlug(thread.title);
    const focusKeyword = extractFocusKeyword(thread.title);
    const metaDescription = generateMetaDescription(thread.body);
    
    const [created] = await db
      .insert(forumThreads)
      .values({
        ...thread,
        slug,
        focusKeyword,
        metaDescription,
        createdAt: thread.lastActivityAt,
        updatedAt: thread.lastActivityAt,
      })
      .onConflictDoNothing()
      .returning();
    
    if (created) {
      createdThreads.push(created);
    }
  }

  console.log(`✅ Created ${createdThreads.length} forum threads`);

  // ========================================
  // FORUM REPLIES - With Nested Threads
  // ========================================
  console.log("💭 Creating forum replies...");

  const replyData: any[] = [];

  // Replies for Thread 1 (XAUUSD Scalping)
  if (createdThreads[0]) {
    const t = createdThreads[0];
    replyData.push(
      {
        threadId: t.id,
        userId: trader2.id,
        parentId: null,
        body: "Great results! I'm also scalping XAUUSD but on M5. The 8 pip TP seems tight for M1 - do you find that you're getting stopped out often during spread widening? I use 12 pip TP minimum to account for spread fluctuation.",
        helpful: 8,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 2 * 60 * 60 * 1000), // 2 hours after thread
      },
      {
        threadId: t.id,
        userId: trader1.id,
        parentId: null, // Will be set to first reply's ID
        body: "Good point! Yes, spread widening is an issue. That's why I added the 25-point spread filter - the EA simply won't trade if spread exceeds that. During normal hours (London session), IC Markets keeps XAUUSD spread around 15-20 points, so 8 pips works. But you're right, 12 pips would be safer for brokers with wider spreads.",
        helpful: 5,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 4 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: demoUser.id,
        parentId: null,
        body: "What VPS are you using? I tried XAUUSD scalping but latency was killing my results. Need something under 10ms to broker server.",
        helpful: 3,
        isVerified: false,
        createdAt: new Date(t.createdAt.getTime() + 6 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: trader1.id,
        parentId: null, // Will be set to third reply's ID
        body: "I'm using Beeks VPS in London (LD4 datacenter). Latency to IC Markets is 0.8ms average. Totally worth it for scalping - made the difference between profitable and break-even for me. They have a 14-day trial if you want to test.",
        helpful: 6,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 8 * 60 * 60 * 1000),
      },
    );
  }

  // Replies for Thread 2 (MQL5 Template)
  if (createdThreads[1]) {
    const t = createdThreads[1];
    replyData.push(
      {
        threadId: t.id,
        userId: demoUser.id,
        parentId: null,
        body: "This looks amazing! I'd love to beta test. Does it support hedging accounts? Most of my strategies need to hold opposite positions simultaneously.",
        helpful: 4,
        isVerified: false,
        createdAt: new Date(t.createdAt.getTime() + 1 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: trader2.id,
        parentId: null,
        body: "Yes! It works with both hedging and netting. The template automatically detects your account type and adjusts order management accordingly. I'll DM you the beta version.",
        helpful: 2,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 3 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: trader1.id,
        parentId: null,
        body: "Feature suggestion: add email reporting with daily PnL summary? Would be super useful for managing multiple EAs.",
        helpful: 7,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 5 * 60 * 60 * 1000),
      },
    );
  }

  // Replies for Thread 3 (Backtest Results)
  if (createdThreads[2]) {
    const t = createdThreads[2];
    replyData.push(
      {
        threadId: t.id,
        userId: trader2.id,
        parentId: null,
        body: "378% in 4 years is impressive! But that 18.7% max DD is concerning for a grid strategy. Did you have any months with worse DD? Grid systems can sometimes hide risk until a black swan event.",
        helpful: 12,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 2 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: demoUser.id,
        parentId: null,
        body: "Fair concern. March 2020 (COVID crash) hit 17.9% DD, and August 2023 had 16.2%. Those were the worst months. The 8-level cap prevents runaway grid expansion. I also added an emergency stop loss at 25% to protect against black swans. But you're right - grid trading always has tail risk.",
        helpful: 9,
        isVerified: false,
        createdAt: new Date(t.createdAt.getTime() + 4 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: trader1.id,
        parentId: null,
        body: "What spread did you use for the backtest? Generic spread or broker-specific? Results can vary wildly based on that.",
        helpful: 5,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 6 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: demoUser.id,
        parentId: null,
        body: "Used IC Markets real spread data from their FTP server. Average spread was 0.7 pips for EURUSD. Didn't use generic/fixed spread since that's unrealistic.",
        helpful: 4,
        isVerified: false,
        createdAt: new Date(t.createdAt.getTime() + 8 * 60 * 60 * 1000),
      },
    );
  }

  // Replies for Thread 6 (Broker Comparison)
  if (createdThreads[5]) {
    const t = createdThreads[5];
    replyData.push(
      {
        threadId: t.id,
        userId: trader1.id,
        parentId: null,
        body: "Great comparison! Did you test during NFP or other high-impact news? That's where you really see the difference in execution quality.",
        helpful: 11,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 1 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: demoUser.id,
        parentId: null,
        body: "Yes! I specifically ran it during NFP, FOMC, and ECB announcements. IC Markets had 1.2 pips average slippage during NFP vs 1.8 pips on Pepperstone. Both are still way better than most retail brokers though (my previous broker was 4+ pips slippage on NFP).",
        helpful: 8,
        isVerified: false,
        createdAt: new Date(t.createdAt.getTime() + 3 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: trader2.id,
        parentId: null,
        body: "I'm on Pepperstone and get positive slippage about 30% of the time. Wonder if it's account-type dependent? I'm on Razor account with commission.",
        helpful: 4,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 5 * 60 * 60 * 1000),
      },
    );
  }

  // Replies for Thread 9 (EA Review)
  if (createdThreads[8]) {
    const t = createdThreads[8];
    replyData.push(
      {
        threadId: t.id,
        userId: trader2.id,
        parentId: null,
        body: "I tried Forex Fury for 2 months and had completely different results. Lost 8% in month 1, broke even in month 2, then requested refund. The refund process took 6 weeks and tons of back-and-forth emails. Not recommended based on my experience.",
        helpful: 15,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 2 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: trader1.id,
        parentId: null,
        body: "Which broker did you use? Forex Fury is extremely broker-dependent. Works great on IC Markets/Pepperstone but terrible on high-spread brokers like FXCM or Oanda.",
        helpful: 7,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 4 * 60 * 60 * 1000),
      },
      {
        threadId: t.id,
        userId: trader2.id,
        parentId: null,
        body: "I was on FXCM. That might explain it. Spread averaged 1.2 pips which is probably too high for this EA's strategy.",
        helpful: 3,
        isVerified: true,
        createdAt: new Date(t.createdAt.getTime() + 5 * 60 * 60 * 1000),
      },
    );
  }

  // Create replies with proper parent relationships
  const createdReplies: any[] = [];
  const replyIdMap = new Map(); // Track reply IDs for threading

  for (let i = 0; i < replyData.length; i++) {
    const reply = replyData[i];
    
    // Generate unique slug for each reply
    const thread = createdThreads.find(t => t.id === reply.threadId);
    const author = [demoUser, trader1, trader2].find(u => u.id === reply.userId);
    const slugBase = generateSlug(`reply-to-${thread?.slug || 'thread'}-by-${author?.username || 'user'}`);
    const slug = `${slugBase}-${Date.now()}-${i}`;
    const metaDescription = generateMetaDescription(reply.body);
    
    // Handle parent ID for threaded replies
    let parentId = reply.parentId;
    if (parentId === null && i > 0 && replyData[i-1]?.threadId === reply.threadId) {
      // Create some nested replies (reply to previous comment)
      if (i % 3 === 0 && createdReplies.length > 0) {
        parentId = createdReplies[createdReplies.length - 1].id;
      }
    }

    const [created] = await db
      .insert(forumReplies)
      .values({
        ...reply,
        parentId,
        slug,
        metaDescription,
        updatedAt: reply.createdAt,
      })
      .onConflictDoNothing()
      .returning();
    
    if (created) {
      createdReplies.push(created);
      replyIdMap.set(i, created.id);
    }
  }

  console.log(`✅ Created ${createdReplies.length} forum replies (with nested threads)`);

  // Update thread reply counts
  for (const thread of createdThreads) {
    const replyCount = createdReplies.filter(r => r.threadId === thread.id).length;
    if (replyCount > 0) {
      await db
        .update(forumThreads)
        .set({ 
          replyCount,
          lastActivityAt: new Date(), // Update to most recent activity
        })
        .where(eq(forumThreads.id, thread.id));
    }
  }

  // ========================================
  // USER BADGES
  // ========================================
  console.log("🏅 Creating user badges...");

  const badgeData = [
    {
      userId: demoUser.id,
      badgeType: "verified_trader" as const,
      awardedAt: getRandomDate(20),
    },
    {
      userId: demoUser.id,
      badgeType: "top_contributor" as const,
      awardedAt: getRandomDate(15),
    },
    {
      userId: trader1.id,
      badgeType: "ea_expert" as const,
      awardedAt: getRandomDate(25),
    },
    {
      userId: trader2.id,
      badgeType: "helpful_member" as const,
      awardedAt: getRandomDate(18),
    },
  ];

  for (const badge of badgeData) {
    await db.insert(userBadges).values(badge).onConflictDoNothing();
  }

  console.log(`✅ Created ${badgeData.length} user badges`);

  // ========================================
  // ACTIVITY FEED
  // ========================================
  console.log("📢 Creating activity feed...");

  const activityData = [
    // Thread created activities
    {
      userId: trader1.id,
      activityType: "thread_created" as const,
      entityType: "thread" as const,
      entityId: createdThreads[0]?.id || "thread-1",
      title: "Started a discussion in Strategy Discussion",
      description: "XAUUSD M1 Scalping - Stable Set File for Gold Trading",
      createdAt: createdThreads[0]?.createdAt || getRandomDate(3),
    },
    {
      userId: trader2.id,
      activityType: "thread_created" as const,
      entityType: "thread" as const,
      entityId: createdThreads[1]?.id || "thread-2",
      title: "Started a discussion in Algorithm Development",
      description: "MQL5 EA Template with Multi-Pair Support and Advanced Money Management",
      createdAt: createdThreads[1]?.createdAt || getRandomDate(5),
    },
    {
      userId: demoUser.id,
      activityType: "thread_created" as const,
      entityType: "thread" as const,
      entityId: createdThreads[2]?.id || "thread-3",
      title: "Started a discussion in Backtest Results",
      description: "Backtest Results: EURUSD Grid Strategy 2020-2024 (99% Quality)",
      createdAt: createdThreads[2]?.createdAt || getRandomDate(7),
    },
    // Reply posted activities
    {
      userId: trader2.id,
      activityType: "reply_posted" as const,
      entityType: "reply" as const,
      entityId: createdReplies[0]?.id || "reply-1",
      title: "Replied to XAUUSD M1 Scalping discussion",
      description: "Great results! I'm also scalping XAUUSD but on M5...",
      createdAt: createdReplies[0]?.createdAt || getRandomDate(3),
    },
    {
      userId: demoUser.id,
      activityType: "reply_posted" as const,
      entityType: "reply" as const,
      entityId: createdReplies[2]?.id || "reply-3",
      title: "Replied to XAUUSD M1 Scalping discussion",
      description: "What VPS are you using? I tried XAUUSD scalping but latency was killing my results...",
      createdAt: createdReplies[2]?.createdAt || getRandomDate(3),
    },
    {
      userId: trader1.id,
      activityType: "reply_posted" as const,
      entityType: "reply" as const,
      entityId: createdReplies[6]?.id || "reply-7",
      title: "Replied to Backtest Results discussion",
      description: "What spread did you use for the backtest?",
      createdAt: createdReplies[6]?.createdAt || getRandomDate(7),
    },
    // Content published activities
    {
      userId: trader1.id,
      activityType: "content_published" as const,
      entityType: "content" as const,
      entityId: createdContent[0]?.id || "content-1",
      title: "Published a new EA",
      description: "Gold Hedger EA - Profitable Grid Strategy for XAUUSD",
      createdAt: getRandomDate(12),
    },
    {
      userId: trader2.id,
      activityType: "content_published" as const,
      entityType: "content" as const,
      entityId: createdContent[1]?.id || "content-2",
      title: "Published a new Indicator",
      description: "Smart Money Divergence Indicator - Detect Institutional Orders",
      createdAt: getRandomDate(14),
    },
    {
      userId: demoUser.id,
      activityType: "content_published" as const,
      entityType: "content" as const,
      entityId: createdContent[4]?.id || "content-5",
      title: "Published a free EA",
      description: "FREE Breakout Scalper - News Trading EA",
      createdAt: getRandomDate(16),
    },
    // Badge earned activities
    {
      userId: demoUser.id,
      activityType: "badge_earned" as const,
      entityType: "badge" as const,
      entityId: badgeData[0]?.userId || "badge-1",
      title: "Earned a new badge",
      description: "Verified Trader",
      createdAt: badgeData[0]?.awardedAt || getRandomDate(20),
    },
    {
      userId: demoUser.id,
      activityType: "badge_earned" as const,
      entityType: "badge" as const,
      entityId: badgeData[1]?.userId || "badge-2",
      title: "Earned a new badge",
      description: "Top Contributor",
      createdAt: badgeData[1]?.awardedAt || getRandomDate(15),
    },
    {
      userId: trader1.id,
      activityType: "badge_earned" as const,
      entityType: "badge" as const,
      entityId: badgeData[2]?.userId || "badge-3",
      title: "Earned a new badge",
      description: "EA Expert",
      createdAt: badgeData[2]?.awardedAt || getRandomDate(25),
    },
    // Additional recent activities
    {
      userId: trader2.id,
      activityType: "reply_posted" as const,
      entityType: "reply" as const,
      entityId: createdReplies[10]?.id || "reply-11",
      title: "Replied to Broker Comparison discussion",
      description: "I'm on Pepperstone and get positive slippage about 30% of the time...",
      createdAt: getRandomDate(1),
    },
    {
      userId: trader1.id,
      activityType: "thread_created" as const,
      entityType: "thread" as const,
      entityId: createdThreads[7]?.id || "thread-8",
      title: "Started a discussion in Market Analysis",
      description: "XAUUSD Analysis - Why Gold Will Hit $2,200 This Month",
      createdAt: getRandomDate(1),
    },
    {
      userId: trader2.id,
      activityType: "thread_created" as const,
      entityType: "thread" as const,
      entityId: createdThreads[10]?.id || "thread-11",
      title: "Started a discussion in Trading Psychology",
      description: "How I Overcame Revenge Trading (And Saved My Account)",
      createdAt: getRandomDate(2),
    },
  ];

  for (const activity of activityData) {
    await db.insert(activityFeed).values(activity).onConflictDoNothing();
  }

  console.log(`✅ Created ${activityData.length} activity feed entries`);

  // Update forum category stats
  console.log("📊 Updating forum category statistics...");
  
  for (const category of categoryData) {
    const threadCount = createdThreads.filter(t => t.categorySlug === category.slug).length;
    const postCount = threadCount + createdReplies.filter(r => {
      const thread = createdThreads.find(t => t.id === r.threadId);
      return thread?.categorySlug === category.slug;
    }).length;

    if (threadCount > 0 || postCount > 0) {
      await db
        .update(forumCategories)
        .set({ threadCount, postCount })
        .where(eq(forumCategories.slug, category.slug));
    }
  }

  console.log("✅ Updated category statistics");

  console.log("✨ Seeding complete!");
  console.log("\n📊 Summary:");
  console.log(`   - ${categoryData.length} forum categories`);
  console.log(`   - ${createdThreads.length} forum threads`);
  console.log(`   - ${createdReplies.length} forum replies`);
  console.log(`   - ${badgeData.length} user badges`);
  console.log(`   - ${activityData.length} activity feed entries`);
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .then(() => {
    console.log("👋 Exiting...");
    process.exit(0);
  });
