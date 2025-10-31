#!/usr/bin/env npx tsx

/**
 * Complete Platform Seeding Script
 * Seeds users, threads, replies, and content to populate YoForex with realistic data
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { users, forumThreads, forumReplies } from '../shared/schema';
import ws from 'ws';

// Configure Neon for Node.js environment
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Seed users data
const SEED_USERS = [
  { username: 'forex_newbie423', email: 'newbie@example.com', reputationScore: 150, totalCoins: 500 },
  { username: 'grid_hunter88', email: 'grid@example.com', reputationScore: 450, totalCoins: 1200 },
  { username: 'pip_trader2024', email: 'pip@example.com', reputationScore: 680, totalCoins: 800 },
  { username: 'crypto_ninja77', email: 'crypto@example.com', reputationScore: 920, totalCoins: 2500 },
  { username: 'dev_learner99', email: 'dev@example.com', reputationScore: 200, totalCoins: 300 },
  { username: 'news_trader_x', email: 'news@example.com', reputationScore: 550, totalCoins: 1500 },
  { username: 'desperate_guy21', email: 'desperate@example.com', reputationScore: 80, totalCoins: 100 },
  { username: 'ea_coder123', email: 'coder@example.com', reputationScore: 1200, totalCoins: 3000 },
  { username: 'angry_trader55', email: 'angry@example.com', reputationScore: 320, totalCoins: 600 },
  { username: 'yen_hunter2025', email: 'yen@example.com', reputationScore: 410, totalCoins: 900 },
  { username: 'generous_coder', email: 'generous@example.com', reputationScore: 1500, totalCoins: 5000 },
  { username: 'hedge_master_', email: 'hedge@example.com', reputationScore: 780, totalCoins: 1800 },
  { username: 'ea_runner2024', email: 'runner@example.com', reputationScore: 290, totalCoins: 450 },
  { username: 'patient_trader', email: 'patient@example.com', reputationScore: 650, totalCoins: 1400 },
  { username: 'indicator_guy88', email: 'indicator@example.com', reputationScore: 380, totalCoins: 700 },
];

// Seed threads data (60 threads from seed-threads-data.jsonl)
const SEED_THREADS = [
  { title: "Help pls – XAUUSD M5 scalping keeps failing", body: "Been trying to scalp gold on M5 but my entries are always late. Losing more than winning. Any tips for faster entries? SL placement is also messy.", categorySlug: "xauusd-scalping", username: "forex_newbie423" },
  { title: "Grid EA on EURUSD – is 20 pip grid too tight?", body: "Running a grid EA on EURUSD with 20 pip spacing. Works in ranging markets but blows up when it trends. Should I widen the grid or add a stop loss?", categorySlug: "grid-trading-eas", username: "grid_hunter88" },
  { title: "IC Markets vs Pepperstone for scalping", body: "Which broker is better for scalping XAUUSD? IC Markets has tighter spreads but Pepperstone has better execution. Anyone tested both?", categorySlug: "ecn-brokers", username: "pip_trader2024" },
  { title: "My BTCUSD scalping strategy – 500 pips in 2 weeks", body: "Finally profitable with crypto scalping! Using a simple EMA crossover on M15 timeframe. Risk management is key – never risk more than 2% per trade. Happy to share the details if anyone is interested.", categorySlug: "crypto-scalping", username: "crypto_ninja77" },
  { title: "MQL4 vs MQL5 – which should I learn first?", body: "Want to start coding my own EAs. Is MQL4 easier for beginners? Or should I jump straight to MQL5 since it's newer?", categorySlug: "mql4", username: "dev_learner99" },
  { title: "News scalping on NFP – best pairs to trade?", body: "NFP day is coming up. Planning to scalp the news release. EURUSD and XAUUSD are obvious choices but what about GBPUSD? Too volatile?", categorySlug: "news-scalping", username: "news_trader_x" },
  { title: "Martingale on EURUSD – lost my account again 😭", body: "Third time blowing my account with martingale. I know it's risky but the profits are so tempting when it works. Should I just quit forex?", categorySlug: "grid-martingale", username: "desperate_guy21" },
  { title: "Trend following EA – 70% win rate backtest", body: "Backtested a trend following EA on GBPUSD H4. 70% win rate over 2 years! Anyone interested in testing it on demo? Free to share with the community.", categorySlug: "trend-following-eas", username: "ea_coder123" },
  { title: "XM broker blocked my withdrawal – SCAM ALERT", body: "XM is refusing to process my withdrawal. They keep asking for more documents. Been trading with them for 6 months and suddenly this happens. Avoid this broker!", categorySlug: "scam-watch", username: "angry_trader55" },
  { title: "Day trading USDJPY – best time of day?", body: "What's the best session to day trade USDJPY? I've heard Asian session is best but I'm in EST timezone. Should I trade during London open instead?", categorySlug: "day-trading", username: "yen_hunter2025" },
  { title: "Free scalping EA – tested on demo for 3 months", body: "Sharing a free scalping EA that I've been testing. It's not perfect but works on EURUSD M5. No martingale or grid, just pure scalping logic. PM me if you want it.", categorySlug: "free-eas-0", username: "generous_coder" },
  { title: "Hedging strategy for correlated pairs", body: "Anyone using hedge strategies on EURUSD and USDCHF? They're negatively correlated so theoretically you can reduce risk. But spreads eat into profits. Worth it?", categorySlug: "hedging", username: "hedge_master_" },
  { title: "VPS recommendations for MT4 EAs", body: "Need a reliable VPS for running my EAs 24/7. Currently using ForexVPS but it's expensive. Any cheaper alternatives with low latency?", categorySlug: "vps-services", username: "ea_runner2024" },
  { title: "Swing trading on D1 – patience is key", body: "Finally profitable after 2 years of losing. Switched from scalping to swing trading on D1 timeframe. Less stress, better results. Sometimes slow and steady wins the race.", categorySlug: "swing-trading", username: "patient_trader" },
  { title: "Oscillator indicators – RSI vs Stochastic?", body: "Which oscillator is more reliable? RSI or Stochastic? I use both but they sometimes give conflicting signals. Should I stick to just one?", categorySlug: "oscillators-momentum", username: "indicator_guy88" },
];

async function seedUsers() {
  console.log('👥 Seeding users...');
  const insertedUsers: any[] = [];
  
  for (const user of SEED_USERS) {
    try {
      const [inserted] = await db.insert(users).values({
        username: user.username,
        email: user.email,
        reputationScore: user.reputationScore,
        totalCoins: user.totalCoins,
      }).returning();
      
      insertedUsers.push(inserted);
      console.log(`  ✅ ${user.username} (${user.reputationScore} rep, ${user.totalCoins} coins)`);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        console.log(`  ⏭️  ${user.username} already exists`);
      } else {
        console.error(`  ❌ Failed to seed ${user.username}:`, error.message);
      }
    }
  }
  
  return insertedUsers;
}

async function seedThreads(userMap: Map<string, string>) {
  console.log('\n💬 Seeding forum threads...');
  const insertedThreads: any[] = [];
  
  for (const thread of SEED_THREADS) {
    try {
      const authorId = userMap.get(thread.username);
      if (!authorId) {
        console.log(`  ⚠️  User ${thread.username} not found, skipping thread`);
        continue;
      }
      
      // Generate slug from title
      const slug = thread.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);
      
      const [inserted] = await db.insert(forumThreads).values({
        title: thread.title,
        slug: slug,
        body: thread.body,
        categorySlug: thread.categorySlug,
        authorId: authorId,
        views: Math.floor(Math.random() * 500) + 50,
        likeCount: Math.floor(Math.random() * 30),
        bookmarkCount: Math.floor(Math.random() * 15),
        shareCount: Math.floor(Math.random() * 5),
        isPinned: false,
        isLocked: false,
      }).returning();
      
      insertedThreads.push(inserted);
      console.log(`  ✅ ${thread.title.substring(0, 50)}... by ${thread.username}`);
    } catch (error: any) {
      console.error(`  ❌ Failed to seed thread:`, error.message);
    }
  }
  
  return insertedThreads;
}

async function seedReplies(threads: any[], userMap: Map<string, string>) {
  console.log('\n💭 Seeding replies...');
  
  const replyTemplates = [
    "Thanks for sharing! This is really helpful.",
    "I had the same issue. Here's what worked for me: {tip}",
    "Interesting approach. Have you considered {suggestion}?",
    "Great results! Can you share your settings?",
    "I wouldn't recommend this strategy. Too risky for beginners.",
    "Been using this for months. Works great on trending markets.",
    "This only works in specific market conditions. Be careful.",
    "Awesome! Keep us updated with your progress.",
    "I tried this and lost money. Maybe I'm doing something wrong?",
    "Thanks for the detailed explanation. Very informative!",
  ];
  
  let replyCount = 0;
  
  // Add 2-5 replies to each thread
  for (const thread of threads) {
    const numReplies = Math.floor(Math.random() * 4) + 2; // 2-5 replies
    
    for (let i = 0; i < numReplies; i++) {
      try {
        // Pick a random user (different from author)
        const usernames = Array.from(userMap.keys()).filter(u => userMap.get(u) !== thread.authorId);
        const randomUsername = usernames[Math.floor(Math.random() * usernames.length)];
        const userId = userMap.get(randomUsername);
        
        if (!userId) continue;
        
        const replyBody = replyTemplates[Math.floor(Math.random() * replyTemplates.length)]
          .replace('{tip}', 'adjusting your stop loss to 1.5x ATR')
          .replace('{suggestion}', 'adding a trend filter');
        
        // Generate unique slug for reply
        const replySlug = `${thread.slug}-reply-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        await db.insert(forumReplies).values({
          threadId: thread.id,
          userId: userId,
          body: replyBody,
          slug: replySlug,
        });
        
        replyCount++;
      } catch (error: any) {
        console.error(`  ❌ Failed to seed reply:`, error.message);
      }
    }
  }
  
  console.log(`  ✅ Seeded ${replyCount} replies`);
}

async function main() {
  console.log('🌱 Starting complete platform seeding...\n');
  
  try {
    // Step 1: Seed users
    const insertedUsers = await seedUsers();
    
    // Create username -> userId map
    const userMap = new Map<string, string>();
    for (const user of insertedUsers) {
      userMap.set(user.username, user.id);
    }
    
    // Also get existing users
    const existingUsers = await db.select().from(users);
    for (const user of existingUsers) {
      if (!userMap.has(user.username)) {
        userMap.set(user.username, user.id);
      }
    }
    
    console.log(`\n📊 Total users available: ${userMap.size}`);
    
    // Step 2: Seed threads
    const insertedThreads = await seedThreads(userMap);
    console.log(`\n📊 Total threads seeded: ${insertedThreads.length}`);
    
    // Step 3: Seed replies
    await seedReplies(insertedThreads, userMap);
    
    console.log('\n✅ Platform seeding completed successfully!');
    console.log('\n📊 Final Summary:');
    console.log(`   Users: ${userMap.size}`);
    console.log(`   Threads: ${insertedThreads.length}`);
    console.log('\n🎉 Your YoForex platform is now populated with content!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
