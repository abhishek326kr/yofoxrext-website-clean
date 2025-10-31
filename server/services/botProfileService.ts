import { db } from '../db.js';
import { bots, type Bot, type InsertBot } from '../../shared/schema.js';
import { eq, count } from 'drizzle-orm';

/**
 * Bot Profile Service - Manages bot creation, activation, and profiles
 * Enforces max 15 bots limit and provides profile generation
 */

// Predefined bot username prefixes for realistic profiles
const TRADER_PREFIXES = [
  'ScalpPro', 'ForexKing', 'PipHunter', 'TradeMaster', 'ChartWizard',
  'SwingGuru', 'DayTrader', 'FXNinja', 'MarketShark', 'TrendSeeker',
  'ProfitChaser', 'BullRunner', 'BearSlayer', 'CandleReader', 'BreakoutPro'
];

// Predefined bio templates
const BIO_TEMPLATES = [
  'Trading forex for {years} years. Focus on {pairs}. {style} trader.',
  '{years} years in the markets. Specializing in {pairs}. {style} approach.',
  'Professional trader with {years} years experience. {pairs} specialist. {style}.',
  'Been trading {pairs} for {years} years. Passionate about {style} strategies.',
  '{style} trader. {years} years of experience in {pairs}. Sharing what works.'
];

const TRADING_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD'];
const TRADING_STYLES = ['scalping', 'swing', 'day trading', 'position', 'trend following'];

// Avatar placeholder URLs (using placeholder services)
const AVATAR_URLS = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=7',
  'https://i.pravatar.cc/150?img=8',
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=12'
];

/**
 * Generate a realistic bot profile
 * @param purpose - Bot purpose (engagement, marketplace, referral)
 * @returns Generated profile data
 */
export function generateProfile(purpose: 'engagement' | 'marketplace' | 'referral') {
  const prefix = TRADER_PREFIXES[Math.floor(Math.random() * TRADER_PREFIXES.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  const username = `@${prefix}${number}`;
  
  const years = Math.floor(Math.random() * 8) + 3; // 3-10 years
  const pairs = TRADING_PAIRS[Math.floor(Math.random() * TRADING_PAIRS.length)];
  const style = TRADING_STYLES[Math.floor(Math.random() * TRADING_STYLES.length)];
  
  const bioTemplate = BIO_TEMPLATES[Math.floor(Math.random() * BIO_TEMPLATES.length)];
  const bio = bioTemplate
    .replace('{years}', years.toString())
    .replace('{pairs}', pairs)
    .replace('{style}', style);
  
  const avatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
  const trustLevel = Math.floor(Math.random() * 4) + 2; // 2-5
  
  // Set activity caps based on purpose
  let activityCaps = {
    dailyLikes: 10,
    dailyFollows: 3,
    dailyPurchases: 2,
    dailyUnlocks: 5
  };
  
  if (purpose === 'engagement') {
    activityCaps = {
      dailyLikes: 20,
      dailyFollows: 5,
      dailyPurchases: 1,
      dailyUnlocks: 8
    };
  } else if (purpose === 'marketplace') {
    activityCaps = {
      dailyLikes: 5,
      dailyFollows: 2,
      dailyPurchases: 5,
      dailyUnlocks: 3
    };
  } else if (purpose === 'referral') {
    activityCaps = {
      dailyLikes: 8,
      dailyFollows: 10,
      dailyPurchases: 1,
      dailyUnlocks: 2
    };
  }
  
  return {
    username,
    displayName: username.substring(1), // Remove @
    bio,
    avatarUrl,
    trustLevel,
    personaProfile: {
      timezone: 'UTC',
      favoritePairs: [pairs],
      tradingStyle: style
    },
    activityCaps
  };
}

/**
 * Create a new bot
 * @param botData - Bot creation data
 * @returns Created bot
 */
export async function createBot(botData: Partial<InsertBot> & { purpose: 'engagement' | 'marketplace' | 'referral' }) {
  // Check max limit (15 bots)
  const botCount = await db.select({ count: count() }).from(bots);
  
  if (botCount[0].count >= 15) {
    throw new Error('Maximum bot limit (15) reached. Delete a bot before creating a new one.');
  }
  
  // Generate profile if not provided
  const profile = botData.username ? botData : {
    ...generateProfile(botData.purpose),
    ...botData
  };
  
  // Create bot
  const result = await db.insert(bots).values({
    username: profile.username!,
    displayName: profile.displayName!,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    purpose: profile.purpose!,
    trustLevel: profile.trustLevel || 3,
    isActive: false, // Starts inactive by default
    personaProfile: profile.personaProfile as any,
    activityCaps: profile.activityCaps as any
  }).returning();
  
  console.log(`[BOT PROFILE] Created new bot: ${result[0].username} (${result[0].purpose})`);
  
  return result[0];
}

/**
 * Activate a bot
 * @param botId - Bot ID to activate
 * @returns Updated bot
 */
export async function activateBot(botId: string) {
  const result = await db.update(bots)
    .set({
      isActive: true,
      updatedAt: new Date()
    })
    .where(eq(bots.id, botId))
    .returning();
  
  if (!result.length) {
    throw new Error('Bot not found');
  }
  
  console.log(`[BOT PROFILE] Activated bot: ${result[0].username}`);
  
  return result[0];
}

/**
 * Deactivate a bot
 * @param botId - Bot ID to deactivate
 * @returns Updated bot
 */
export async function deactivateBot(botId: string) {
  const result = await db.update(bots)
    .set({
      isActive: false,
      updatedAt: new Date()
    })
    .where(eq(bots.id, botId))
    .returning();
  
  if (!result.length) {
    throw new Error('Bot not found');
  }
  
  console.log(`[BOT PROFILE] Deactivated bot: ${result[0].username}`);
  
  return result[0];
}

/**
 * Toggle bot active state
 * @param botId - Bot ID to toggle
 * @returns Updated bot
 */
export async function toggleBot(botId: string) {
  const bot = await db.select().from(bots).where(eq(bots.id, botId)).limit(1);
  
  if (!bot.length) {
    throw new Error('Bot not found');
  }
  
  return bot[0].isActive ? deactivateBot(botId) : activateBot(botId);
}

/**
 * List all bots
 * @returns Array of all bots
 */
export async function listBots() {
  return await db.select().from(bots);
}

/**
 * List active bots
 * @returns Array of active bots
 */
export async function listActiveBots() {
  return await db.select().from(bots).where(eq(bots.isActive, true));
}

/**
 * List bots by purpose
 * @param purpose - Bot purpose to filter by
 * @returns Array of bots with specified purpose
 */
export async function listBotsByPurpose(purpose: 'engagement' | 'marketplace' | 'referral') {
  return await db.select().from(bots).where(eq(bots.purpose, purpose));
}

/**
 * Get a single bot by ID
 * @param botId - Bot ID
 * @returns Bot or null
 */
export async function getBot(botId: string) {
  const result = await db.select().from(bots).where(eq(bots.id, botId)).limit(1);
  return result.length ? result[0] : null;
}

/**
 * Update bot profile
 * @param botId - Bot ID
 * @param updates - Profile updates
 * @returns Updated bot
 */
export async function updateBot(botId: string, updates: Partial<InsertBot>) {
  const result = await db.update(bots)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(bots.id, botId))
    .returning();
  
  if (!result.length) {
    throw new Error('Bot not found');
  }
  
  console.log(`[BOT PROFILE] Updated bot: ${result[0].username}`);
  
  return result[0];
}

/**
 * Delete a bot
 * @param botId - Bot ID to delete
 * @returns Success boolean
 */
export async function deleteBot(botId: string) {
  const result = await db.delete(bots)
    .where(eq(bots.id, botId))
    .returning();
  
  if (!result.length) {
    throw new Error('Bot not found');
  }
  
  console.log(`[BOT PROFILE] Deleted bot: ${result[0].username}`);
  
  return true;
}

/**
 * Get bot count
 * @returns Number of bots
 */
export async function getBotCount() {
  const result = await db.select({ count: count() }).from(bots);
  return result[0].count;
}

/**
 * Check if max bot limit is reached
 * @returns Boolean
 */
export async function isMaxLimitReached() {
  const botCount = await getBotCount();
  return botCount >= 15;
}
