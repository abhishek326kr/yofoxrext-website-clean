import { db } from '../db.js';
import { 
  bots, 
  botActions, 
  forumThreads, 
  forumReplies,
  content, 
  contentPurchases,
  users, 
  userFollows,
  coinTransactions
} from '../../shared/schema.js';
import { eq, and, lt, gte, sql, desc, notInArray } from 'drizzle-orm';
import { spend, wouldExceedWalletCap, getEconomySettings } from './treasuryService.js';
import { listActiveBots } from './botProfileService.js';

/**
 * Bot Behavior Engine - Implements automated bot actions
 * Runs every 10 minutes to scan and execute bot activities
 */

/**
 * Scan for new threads that bots haven't interacted with yet
 * @param minutesAgo - How far back to scan (default 30 minutes)
 * @returns New threads
 */
export async function scanNewThreads(minutesAgo: number = 30) {
  const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
  
  const newThreads = await db.select()
    .from(forumThreads)
    .where(gte(forumThreads.createdAt, cutoffTime))
    .orderBy(desc(forumThreads.createdAt));
  
  console.log(`[BOT ENGINE] Found ${newThreads.length} new threads in last ${minutesAgo} minutes`);
  
  return newThreads;
}

/**
 * Scan for new content (EAs/indicators) that bots haven't purchased yet
 * @param minutesAgo - How far back to scan (default 30 minutes)
 * @returns New content items
 */
export async function scanNewContent(minutesAgo: number = 30) {
  const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
  
  const newContent = await db.select()
    .from(content)
    .where(
      and(
        gte(content.createdAt, cutoffTime),
        lt(content.priceCoins, 100), // Only content under 100 coins
        eq(content.status, 'approved')
      )
    )
    .orderBy(desc(content.createdAt));
  
  console.log(`[BOT ENGINE] Found ${newContent.length} new content items in last ${minutesAgo} minutes`);
  
  return newContent;
}

/**
 * Execute bot likes on threads
 * @param threadId - Thread to like
 * @param aggressionLevel - How aggressive (1-10, affects probability)
 * @returns Number of likes executed
 */
export async function executeLikes(threadId: string, aggressionLevel: number = 5) {
  const activeBots = await listActiveBots();
  const engagementBots = activeBots.filter(bot => bot.purpose === 'engagement');
  
  if (engagementBots.length === 0) {
    return 0;
  }
  
  // Determine how many bots should like (2-3 based on aggression)
  const probability = aggressionLevel / 10;
  const botsToLike = engagementBots.filter(() => Math.random() < probability).slice(0, 3);
  
  let likesExecuted = 0;
  
  for (const bot of botsToLike) {
    // Random delay between 5-20 minutes
    const delayMs = (Math.random() * 15 + 5) * 60 * 1000;
    
    // Schedule the like (in a real implementation, this would use a job queue)
    // For now, we'll execute immediately for simplicity
    
    try {
      // Spend 0.1 coins from treasury (like reward to thread author)
      const spendResult = await spend(1, `Bot like on thread ${threadId}`, { botId: bot.id, threadId });
      
      if (!spendResult.success) {
        console.warn(`[BOT ENGINE] Failed to spend for like: ${spendResult.message}`);
        continue;
      }
      
      // Credit thread author
      const thread = await db.select().from(forumThreads).where(eq(forumThreads.id, threadId)).limit(1);
      
      if (thread.length) {
        // Check wallet cap
        const wouldExceed = await wouldExceedWalletCap(thread[0].authorId, 1);
        
        if (!wouldExceed) {
          await db.update(users)
            .set({
              totalCoins: sql`${users.totalCoins} + 1`
            })
            .where(eq(users.id, thread[0].authorId));
          
          // Create transaction
          await db.insert(coinTransactions).values({
            userId: thread[0].authorId,
            type: 'earn',
            amount: 1,
            description: 'Thread liked',
            status: 'completed',
            botId: bot.id
          });
        }
      }
      
      // Log bot action
      await db.insert(botActions).values({
        botId: bot.id,
        actionType: 'like',
        targetType: 'thread',
        targetId: threadId,
        coinDelta: 1,
        retentionWeight: 1
      });
      
      likesExecuted++;
      
      console.log(`[BOT ENGINE] Bot ${bot.username} liked thread ${threadId}`);
    } catch (error) {
      console.error(`[BOT ENGINE] Error executing like:`, error);
    }
  }
  
  return likesExecuted;
}

/**
 * Execute bot follows on users with low follower counts
 * @param userId - User to potentially follow
 * @returns Whether follow was executed
 */
export async function executeFollow(userId: string) {
  // Get user's current follower count
  const followerCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(userFollows)
    .where(eq(userFollows.followingId, userId));
  
  // Only follow users with < 50 followers
  if ((followerCount[0]?.count || 0) >= 50) {
    return false;
  }
  
  const activeBots = await listActiveBots();
  const engagementBots = activeBots.filter(bot => bot.purpose === 'engagement' || bot.purpose === 'referral');
  
  if (engagementBots.length === 0) {
    return false;
  }
  
  // Pick a random bot
  const bot = engagementBots[Math.floor(Math.random() * engagementBots.length)];
  
  // Check if bot has a corresponding user entry (required for follows)
  const botUser = await db.select()
    .from(users)
    .where(eq(users.id, bot.id))
    .limit(1);
  
  if (botUser.length === 0) {
    // Bot doesn't have a user entry, skip follow
    console.log(`[BOT ENGINE] Bot ${bot.username} doesn't have a user entry, skipping follow`);
    return false;
  }
  
  // Check if bot already follows this user
  const existing = await db.select()
    .from(userFollows)
    .where(
      and(
        eq(userFollows.followerId, bot.id),
        eq(userFollows.followingId, userId)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    return false; // Already following
  }
  
  try {
    // Spend 1 coin from treasury (follow reward to user)
    const spendResult = await spend(1, `Bot follow on user ${userId}`, { botId: bot.id, userId });
    
    if (!spendResult.success) {
      console.warn(`[BOT ENGINE] Failed to spend for follow: ${spendResult.message}`);
      return false;
    }
    
    // Check wallet cap
    const wouldExceed = await wouldExceedWalletCap(userId, 1);
    
    if (!wouldExceed) {
      // Credit user
      await db.update(users)
        .set({
          totalCoins: sql`${users.totalCoins} + 1`
        })
        .where(eq(users.id, userId));
      
      // Create transaction
      await db.insert(coinTransactions).values({
        userId,
        type: 'earn',
        amount: 1,
        description: 'New follower',
        status: 'completed',
        botId: bot.id
      });
    }
    
    // Create follow relationship
    await db.insert(userFollows).values({
      followerId: bot.id,
      followingId: userId
    });
    
    // Log bot action
    await db.insert(botActions).values({
      botId: bot.id,
      actionType: 'follow',
      targetType: 'user',
      targetId: userId,
      coinDelta: 1,
      retentionWeight: 1
    });
    
    console.log(`[BOT ENGINE] Bot ${bot.username} followed user ${userId}`);
    
    return true;
  } catch (error) {
    console.error(`[BOT ENGINE] Error executing follow:`, error);
    return false;
  }
}

/**
 * Execute bot purchases on new content
 * @param contentId - Content to purchase
 * @returns Whether purchase was executed
 */
export async function executePurchase(contentId: string) {
  const settings = await getEconomySettings();
  
  if (!settings.botPurchasesEnabled) {
    return false;
  }
  
  const activeBots = await listActiveBots();
  const marketplaceBots = activeBots.filter(bot => bot.purpose === 'marketplace');
  
  if (marketplaceBots.length === 0) {
    return false;
  }
  
  // Get content details
  const contentItem = await db.select()
    .from(content)
    .where(eq(content.id, contentId))
    .limit(1);
  
  if (!contentItem.length || contentItem[0].priceCoins > 100) {
    return false;
  }
  
  const price = contentItem[0].priceCoins;
  const sellerId = contentItem[0].authorId;
  
  // Check if seller wallet would exceed cap (80% of price)
  const sellerEarnings = Math.floor(price * 0.8);
  const wouldExceed = await wouldExceedWalletCap(sellerId, sellerEarnings);
  
  if (wouldExceed) {
    console.log(`[BOT ENGINE] Skipping purchase - seller wallet would exceed cap`);
    return false;
  }
  
  // Pick 1-2 bots randomly
  const botsCount = Math.random() < 0.5 ? 1 : 2;
  const selectedBots = marketplaceBots
    .sort(() => Math.random() - 0.5)
    .slice(0, botsCount);
  
  for (const bot of selectedBots) {
    // Check if bot already purchased this
    const existing = await db.select()
      .from(contentPurchases)
      .where(
        and(
          eq(contentPurchases.contentId, contentId),
          eq(contentPurchases.buyerId, bot.id)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      continue; // Already purchased
    }
    
    try {
      // Spend from treasury
      const spendResult = await spend(price, `Bot purchase of content ${contentId}`, { 
        botId: bot.id, 
        contentId,
        sellerId
      });
      
      if (!spendResult.success) {
        console.warn(`[BOT ENGINE] Failed to spend for purchase: ${spendResult.message}`);
        continue;
      }
      
      // Credit seller (80%)
      await db.update(users)
        .set({
          totalCoins: sql`${users.totalCoins} + ${sellerEarnings}`
        })
        .where(eq(users.id, sellerId));
      
      // Create transaction for seller
      await db.insert(coinTransactions).values({
        userId: sellerId,
        type: 'earn',
        amount: sellerEarnings,
        description: `Sale of "${contentItem[0].title}" (bot order)`,
        status: 'completed',
        botId: bot.id
      });
      
      // Create purchase record
      const txn = await db.insert(coinTransactions).values({
        userId: bot.id,
        type: 'spend',
        amount: -price,
        description: `Purchased "${contentItem[0].title}"`,
        status: 'completed',
        botId: bot.id
      }).returning();
      
      await db.insert(contentPurchases).values({
        contentId,
        buyerId: bot.id,
        sellerId,
        priceCoins: price,
        transactionId: txn[0].id
      });
      
      // Log bot action
      await db.insert(botActions).values({
        botId: bot.id,
        actionType: 'purchase',
        targetType: 'content',
        targetId: contentId,
        coinDelta: -price,
        metadata: { sellerEarnings, isBotOrder: true }
      });
      
      console.log(`[BOT ENGINE] Bot ${bot.username} purchased content ${contentId} for ${price} coins`);
    } catch (error) {
      console.error(`[BOT ENGINE] Error executing purchase:`, error);
    }
  }
  
  return true;
}

/**
 * Main scheduler - runs all bot actions
 * Should be called every 10 minutes by a cron job
 */
export async function runBotEngine() {
  console.log('[BOT ENGINE] Starting bot behavior engine...');
  
  const settings = await getEconomySettings();
  const activeBots = await listActiveBots();
  
  if (activeBots.length === 0) {
    console.log('[BOT ENGINE] No active bots. Skipping.');
    return;
  }
  
  // Scan for new threads (last 30 minutes)
  const newThreads = await scanNewThreads(30);
  
  // Execute likes on new threads
  for (const thread of newThreads) {
    await executeLikes(thread.id, settings.aggressionLevel);
    
    // Also try to follow the thread author if they have < 50 followers
    if (thread.authorId) {
      await executeFollow(thread.authorId);
    }
  }
  
  // Scan for new content (last 30 minutes)
  if (settings.botPurchasesEnabled) {
    const newContent = await scanNewContent(30);
    
    // Execute purchases on new content
    for (const contentItem of newContent) {
      await executePurchase(contentItem.id);
    }
  }
  
  console.log('[BOT ENGINE] Bot behavior engine completed.');
}

/**
 * Refund all bot purchases (runs at 3 AM daily)
 */
export async function refundBotPurchases() {
  console.log('[BOT ENGINE] Starting bot purchase refunds...');
  
  // Get all bot purchases from the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const botPurchases = await db.select()
    .from(contentPurchases)
    .innerJoin(bots, eq(contentPurchases.buyerId, bots.id))
    .where(gte(contentPurchases.purchasedAt, yesterday));
  
  for (const purchase of botPurchases) {
    try {
      // Note: In a real implementation, you would:
      // 1. Deduct coins from seller
      // 2. Return coins to treasury
      // 3. Delete the purchase record
      // For now, we'll just log it
      
      console.log(`[BOT ENGINE] Would refund bot purchase ${purchase.content_purchases.id}`);
    } catch (error) {
      console.error(`[BOT ENGINE] Error refunding purchase:`, error);
    }
  }
  
  console.log('[BOT ENGINE] Bot purchase refunds completed.');
}
