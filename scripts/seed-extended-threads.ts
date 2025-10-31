#!/usr/bin/env npx tsx

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { users, forumThreads, forumReplies } from '../shared/schema';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Extended thread data (45 more threads)
const EXTENDED_THREADS = [
  { title: "FP Markets slippage on NFP day", body: "Got 15 pips of negative slippage on FP Markets during last NFP. Is this normal? My stop loss was hit 15 pips earlier than it should have been.", categorySlug: "low-spread-brokers", username: "pip_trader2024" },
  { title: "Position trading on W1 – holding for months", body: "Started position trading on weekly timeframe. Holding trades for 2-3 months. Much less stressful than day trading. Anyone else trading this way?", categorySlug: "position-trading", username: "patient_trader" },
  { title: "Python trading bot for MT5 – anyone tried it?", body: "Thinking of coding a trading bot in Python instead of MQL5. Is the integration smooth? Any performance issues compared to native MQL5 EAs?", categorySlug: "python-bots", username: "dev_learner99" },
  { title: "Backtesting results vs forward testing – huge difference", body: "My EA had 80% win rate in backtesting but only 50% in forward testing. Is this normal? Feels like backtesting is useless if results don't match reality.", categorySlug: "backtest-results", username: "ea_coder123" },
  { title: "Trading psychology – how to handle losing streaks?", body: "On a 10-trade losing streak. Can't focus, second-guessing every entry. How do you guys deal with this mentally? Thinking of taking a break from trading.", categorySlug: "trading-psychology", username: "desperate_guy21" },
  { title: "Support and resistance indicators – do they work?", body: "Using an SR indicator that draws lines automatically. Sometimes it's spot on, other times completely wrong. Are these indicators reliable or should I draw lines manually?", categorySlug: "sr-tools", username: "indicator_guy88" },
  { title: "Exness withdrawal – instant to crypto wallet", body: "Withdrew $500 from Exness to my BTC wallet. Arrived in 10 minutes! Best broker for fast withdrawals. Highly recommend.", categorySlug: "high-leverage-brokers", username: "crypto_ninja77" },
  { title: "Risk management calculator – excel vs app?", body: "Do you guys use excel spreadsheets or dedicated apps for risk management? I built my own excel calculator but wondering if there's something better.", categorySlug: "calculators-utilities", username: "ea_runner2024" },
  { title: "MT4 EA keeps crashing on VPS", body: "My EA works fine on my local PC but keeps crashing on VPS. Could it be a memory issue? The VPS has 2GB RAM. Is that enough?", categorySlug: "mt4-eas", username: "grid_hunter88" },
  { title: "Live trading journal – XAUUSD scalping results", body: "Starting a public journal to track my XAUUSD scalping. Will post daily results. Currently at +250 pips for the month. Let's see if I can maintain this.", categorySlug: "live-trading-journals", username: "forex_newbie423" },
  { title: "Fundamental analysis for forex – does it matter?", body: "I only use technical analysis. Never pay attention to news or fundamentals. Am I missing out? Do fundamentals really move the market short-term?", categorySlug: "fundamental-analysis", username: "news_trader_x" },
  { title: "Trade copier software – which one is best?", body: "Looking for a reliable trade copier to copy signals from my main account to multiple sub-accounts. MT4-to-MT4. Any recommendations?", categorySlug: "trade-copiers", username: "generous_coder" },
  { title: "Regulated brokers – is FCA really better?", body: "Everyone says use FCA-regulated brokers. But I've had good experience with offshore brokers too. Is FCA regulation really worth the higher spreads?", categorySlug: "regulated-brokers", username: "hedge_master_" },
  { title: "Technical analysis course – free resources?", body: "Want to learn TA properly. Any free courses or YouTube channels you recommend? Already know the basics but want to level up.", categorySlug: "technical-analysis", username: "yen_hunter2025" },
  { title: "Breakout EA on GBPUSD – 15% monthly returns", body: "Running a breakout EA on GBPUSD for 6 months. Averaging 15% monthly returns with 10% drawdown. Should I share it with the community or keep it private?", categorySlug: "breakout-eas", username: "ea_coder123" },
  { title: "Signal services – are they worth it?", body: "Thinking of subscribing to a forex signal service. $100/month seems expensive but if it works, could be worth it. Anyone using signal services successfully?", categorySlug: "signal-services", username: "angry_trader55" },
  { title: "cTrader vs MT5 – which platform is better?", body: "Been using MT4 forever. Considering switching to either cTrader or MT5. Which one has better features for automated trading?", categorySlug: "ctrader-robots", username: "indicator_guy88" },
  { title: "Volume indicators on forex – do they work?", body: "I know forex is decentralized so volume isn't real volume. Are volume indicators still useful? Or just noise?", categorySlug: "volume-indicators", username: "patient_trader" },
  { title: "Market maker vs ECN brokers – huge spread difference", body: "Tested both MM and ECN brokers. MM spreads are 3-5 pips, ECN is 0.5-1 pip. But ECN charges commission. Which is more cost-effective for scalping?", categorySlug: "market-maker-brokers", username: "pip_trader2024" },
  { title: "Freelance EA developer needed – budget $200", body: "Need someone to code a simple EA in MQL4. Basically a moving average crossover with fixed SL/TP. Budget is $200. DM me if interested.", categorySlug: "freelance-requests", username: "forex_newbie423" },
  { title: "Strategy backtesting – how many years is enough?", body: "Backtesting my strategy over 5 years of data. Is that enough or should I go back 10 years? More data = better results or just overfitting?", categorySlug: "strategy-backtesting", username: "dev_learner99" },
  { title: "Forward test results – EA stopped working after 2 months", body: "EA worked perfectly for 2 months in forward testing, then suddenly started losing. Market conditions changed or EA is broken? How to diagnose this?", categorySlug: "forward-test-results", username: "ea_coder123" },
  { title: "Multi-pair correlation trading – how many pairs?", body: "Trading EURUSD, GBPUSD, and AUDUSD simultaneously based on correlation. Is 3 pairs enough or should I add more? Worried about over-diversification.", categorySlug: "multi-pair-correlation", username: "hedge_master_" },
  { title: "Beginner's corner – where do I even start?", body: "Complete noob here. Opened a demo account but have no idea what I'm doing. Should I take a course first or just learn by doing? Any beginner-friendly resources?", categorySlug: "beginners-corner", username: "desperate_guy21" },
  { title: "Trend indicators – EMA vs SMA?", body: "Using moving averages for trend identification. EMA reacts faster but more false signals. SMA is slower but more reliable. Which do you prefer?", categorySlug: "trend-indicators", username: "indicator_guy88" },
  { title: "EA performance reports – how to analyze them?", body: "My EA generated a huge performance report with 1000+ trades. How do I analyze this data? What metrics should I focus on besides win rate?", categorySlug: "ea-performance-reports", username: "ea_runner2024" },
  { title: "Template packs for MT4 – any good free ones?", body: "Looking for free MT4 template packs. Already have the default templates but want something more professional-looking with better indicator setups.", categorySlug: "template-packs", username: "generous_coder" },
  { title: "MT5 EA development – is it harder than MQL4?", body: "Learned MQL4 pretty well. Considering learning MQL5 but heard it's more complex. Is the learning curve steep? Worth the effort?", categorySlug: "mt5-eas", username: "dev_learner99" },
  { title: "Budget EA – found one for 75 coins, worth it?", body: "Saw a budget EA listed for 75 coins. Looks promising from the description but no reviews yet. Should I risk it or wait for reviews?", categorySlug: "budget-eas-50-100", username: "grid_hunter88" },
  { title: "Premium EA – 400 coins but lifetime updates", body: "Considering buying a premium EA for 400 coins. It's expensive but includes lifetime updates and support. Anyone bought premium EAs? Worth the investment?", categorySlug: "premium-eas-200-500", username: "crypto_ninja77" },
  { title: "News trading EA – does it even work?", body: "Heard about EAs that trade news releases automatically. Sounds too good to be true. Anyone actually profitable with news trading EAs?", categorySlug: "news-trading-eas", username: "news_trader_x" },
  { title: "Risk management – how much per trade?", body: "Everyone says 1-2% per trade. But with small accounts, 1% is just $10. How do you guys manage risk with accounts under $1000?", categorySlug: "risk-management", username: "forex_newbie423" },
  { title: "Tickmill review – solid broker for beginners", body: "Been using Tickmill for 3 months. No issues with withdrawals, spreads are competitive, and customer support is helpful. Good choice for beginners.", categorySlug: "ecn-brokers", username: "patient_trader" },
  { title: "ASIC regulation – is it as good as FCA?", body: "Most people talk about FCA regulation. But what about ASIC? Australian brokers seem solid too. Is ASIC as reliable as FCA?", categorySlug: "regulated-brokers", username: "pip_trader2024" },
  { title: "Grid trading – lost $2k in 1 week", body: "Tried grid trading on EURUSD. Worked great for 2 weeks then lost everything in 1 week when price trended hard. Grid trading is too risky. Stick to traditional strategies.", categorySlug: "grid-martingale", username: "desperate_guy21" },
  { title: "Scalping EAs – do any actually work long-term?", body: "Tested 10+ scalping EAs. They all work for a few weeks then blow up. Is there any scalping EA that's profitable long-term? Or is it all hype?", categorySlug: "scalping-eas", username: "angry_trader55" },
  { title: "Day trading EURUSD – London session best?", body: "Trading EURUSD during London session (8am-12pm GMT). Most action happens here. Anyone trading other sessions successfully?", categorySlug: "day-trading", username: "yen_hunter2025" },
  { title: "Swing trading – closed 3 trades this week, all winners", body: "Swing trading update: Closed 3 trades this week, all winners. Total +450 pips. Patience really pays off in swing trading. Not as exciting as scalping but more consistent.", categorySlug: "swing-trading", username: "patient_trader" },
  { title: "Position trading on gold – holding for 6 months", body: "Entered a long position on XAUUSD 6 months ago at $1800. Still holding at $2050. Position trading requires nerves of steel but the profits are worth it.", categorySlug: "position-trading", username: "crypto_ninja77" },
  { title: "Hedging strategy – how to calculate position sizes?", body: "Want to hedge EURUSD with USDCHF. How do you calculate the position sizes to balance the hedge? Equal lots or need to adjust for correlation strength?", categorySlug: "hedging", username: "hedge_master_" },
  { title: "Python bot vs MQL5 EA – which is faster?", body: "Coded the same strategy in both Python and MQL5. Python bot has slight delay in execution. MQL5 EA is instant. Is this latency a deal-breaker for scalping?", categorySlug: "python-bots", username: "ea_coder123" },
  { title: "Beginner question – what is leverage?", body: "Keep hearing about leverage but don't fully understand it. Is 1:500 leverage dangerous? Should beginners use low leverage like 1:50?", categorySlug: "beginners-corner", username: "forex_newbie423" },
  { title: "EURUSD scalping – best indicators?", body: "What indicators do you use for EURUSD scalping on M1-M5? I'm using RSI and Bollinger Bands but getting mixed results. Any better combinations?", categorySlug: "eurusd-scalping", username: "grid_hunter88" },
  { title: "MQL5 programming – where to start?", body: "Want to learn MQL5 from scratch. Any good tutorials or documentation you recommend? The official docs are confusing for beginners.", categorySlug: "mql5", username: "dev_learner99" },
  { title: "Trend following on H4 – which pairs work best?", body: "Running a trend following strategy on H4 timeframe. Works great on GBPUSD but terrible on EURUSD. Are some pairs better for trend following than others?", categorySlug: "trend-following-eas", username: "ea_coder123" },
  { title: "VPS in Singapore vs London – latency comparison", body: "Comparing VPS locations for MT4. Singapore has 5ms ping to my broker, London has 15ms. Does 10ms really make a difference for scalping?", categorySlug: "vps-services", username: "ea_runner2024" },
];

async function seedExtendedThreads() {
  console.log('🌱 Seeding 45 additional threads...\n');
  
  // Get all users
  const allUsers = await db.select().from(users);
  const userMap = new Map<string, string>();
  for (const user of allUsers) {
    userMap.set(user.username, user.id);
  }
  
  let successCount = 0;
  
  for (const thread of EXTENDED_THREADS) {
    try {
      const authorId = userMap.get(thread.username);
      if (!authorId) {
        console.log(`  ⚠️  User ${thread.username} not found, skipping`);
        continue;
      }
      
      const slug = thread.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);
      
      await db.insert(forumThreads).values({
        title: thread.title,
        slug: slug,
        body: thread.body,
        categorySlug: thread.categorySlug,
        authorId: authorId,
        views: Math.floor(Math.random() * 500) + 50,
        likes: Math.floor(Math.random() * 30),
        bookmarks: Math.floor(Math.random() * 15),
        shares: Math.floor(Math.random() * 5),
        isPinned: false,
        isLocked: false,
      });
      
      successCount++;
      console.log(`  ✅ ${thread.title.substring(0, 60)}...`);
    } catch (error: any) {
      console.error(`  ❌ Failed:`, error.message);
    }
  }
  
  console.log(`\n📊 Seeded ${successCount} additional threads`);
  
  // Get current total
  const totalThreads = await db.select().from(forumThreads);
  console.log(`📊 Total threads in database: ${totalThreads.length}`);
}

async function seedReplies() {
  console.log('\n💭 Seeding replies...\n');
  
  const allThreads = await db.select().from(forumThreads);
  const allUsers = await db.select().from(users);
  
  const replyTemplates = [
    "Thanks for sharing! This is really helpful.",
    "I had the same issue. Adjusting my stop loss to 1.5x ATR helped.",
    "Interesting approach. Have you considered adding a trend filter?",
    "Great results! Can you share your settings?",
    "I wouldn't recommend this strategy. Too risky for beginners.",
    "Been using this for months. Works great on trending markets.",
    "This only works in specific market conditions. Be careful.",
    "Awesome! Keep us updated with your progress.",
    "I tried this and lost money. Maybe I'm doing something wrong?",
    "Thanks for the detailed explanation. Very informative!",
  ];
  
  let replyCount = 0;
  
  // Add 2-4 replies to each thread
  for (const thread of allThreads) {
    const numReplies = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numReplies; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      if (randomUser.id === thread.authorId) continue; // Skip if same as author
      
      const replyBody = replyTemplates[Math.floor(Math.random() * replyTemplates.length)];
      const slug = `reply-${thread.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      
      try {
        await db.insert(forumReplies).values({
          threadId: thread.id,
          userId: randomUser.id,
          body: replyBody,
          slug: slug,
          metaDescription: replyBody.substring(0, 150),
        });
        
        replyCount++;
      } catch (error: any) {
        console.error(`  ❌ Failed to seed reply:`, error.message);
      }
    }
  }
  
  console.log(`  ✅ Seeded ${replyCount} replies across all threads`);
}

async function main() {
  console.log('🚀 Extending platform content...\n');
  
  try {
    await seedExtendedThreads();
    await seedReplies();
    
    console.log('\n✅ Extended seeding complete!');
    console.log('🎉 YoForex now has 60 threads with active discussions!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
