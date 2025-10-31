import { db } from '../db.js';
import { adminTreasury, botEconomySettings, users, coinTransactions } from '../../shared/schema.js';
import { eq, sql } from 'drizzle-orm';

/**
 * Treasury Service - Manages the admin treasury and bot economy
 * All bot spending draws from this central treasury
 */

/**
 * Get current treasury balance and settings
 */
export async function getBalance() {
  // Get treasury record (create if doesn't exist)
  let treasury = await db.select().from(adminTreasury).limit(1);
  
  if (treasury.length === 0) {
    // Initialize treasury with 100,000 coins
    const result = await db.insert(adminTreasury).values({
      balance: 100000,
      dailyCap: 500,
      auditLog: []
    }).returning();
    treasury = result;
  }
  
  return treasury[0];
}

/**
 * Spend coins from treasury
 * @param amount - Amount to spend (positive number)
 * @param reason - Reason for spending
 * @param metadata - Additional metadata (botId, targetId, etc.)
 * @returns Success boolean and new balance
 */
export async function spend(amount: number, reason: string, metadata?: Record<string, any>) {
  if (amount <= 0) {
    throw new Error('Spend amount must be positive');
  }
  
  const treasury = await getBalance();
  
  if (treasury.balance < amount) {
    console.warn(`[TREASURY] Insufficient balance: ${treasury.balance} < ${amount}`);
    return { success: false, balance: treasury.balance, message: 'Insufficient treasury balance' };
  }
  
  const newBalance = treasury.balance - amount;
  const timestamp = new Date().toISOString();
  
  // Create audit log entry
  const auditEntry = {
    timestamp,
    action: 'spend',
    amount: -amount,
    reason,
    balanceBefore: treasury.balance,
    balanceAfter: newBalance,
    ...metadata
  };
  
  // Update treasury
  await db.update(adminTreasury)
    .set({
      balance: newBalance,
      auditLog: sql`${adminTreasury.auditLog} || ${JSON.stringify(auditEntry)}::jsonb`,
      updatedAt: new Date()
    })
    .where(eq(adminTreasury.id, treasury.id));
  
  console.log(`[TREASURY] Spent ${amount} coins: ${reason}. New balance: ${newBalance}`);
  
  return { success: true, balance: newBalance };
}

/**
 * Refill treasury with coins
 * @param amount - Amount to add
 * @param adminId - Admin performing the refill
 * @returns New balance
 */
export async function refill(amount: number, adminId?: string) {
  if (amount <= 0) {
    throw new Error('Refill amount must be positive');
  }
  
  const treasury = await getBalance();
  const newBalance = treasury.balance + amount;
  const timestamp = new Date().toISOString();
  
  // Create audit log entry
  const auditEntry = {
    timestamp,
    action: 'refill',
    amount,
    reason: 'Manual treasury refill',
    adminId,
    balanceBefore: treasury.balance,
    balanceAfter: newBalance
  };
  
  // Update treasury
  await db.update(adminTreasury)
    .set({
      balance: newBalance,
      auditLog: sql`${adminTreasury.auditLog} || ${JSON.stringify(auditEntry)}::jsonb`,
      updatedAt: new Date()
    })
    .where(eq(adminTreasury.id, treasury.id));
  
  console.log(`[TREASURY] Refilled ${amount} coins by admin ${adminId}. New balance: ${newBalance}`);
  
  return { success: true, balance: newBalance };
}

/**
 * Drain a percentage of coins from a user's wallet
 * @param userId - User to drain from
 * @param percentage - Percentage to drain (0-100)
 * @param adminId - Admin performing the drain
 * @returns Amount drained
 */
export async function drainUserWallet(userId: string, percentage: number, adminId?: string) {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  
  // Get user's current balance
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user.length) {
    throw new Error('User not found');
  }
  
  const currentBalance = user[0].totalCoins;
  const drainAmount = Math.floor(currentBalance * (percentage / 100));
  
  if (drainAmount <= 0) {
    return { success: true, amount: 0, message: 'No coins to drain' };
  }
  
  // Deduct from user
  await db.update(users)
    .set({
      totalCoins: currentBalance - drainAmount
    })
    .where(eq(users.id, userId));
  
  // Create transaction record
  await db.insert(coinTransactions).values({
    userId,
    type: 'spend',
    amount: -drainAmount,
    description: `Platform fee (${percentage}%)`,
    status: 'completed'
  });
  
  // Log in treasury
  await logManipulation('drain_user', {
    userId,
    percentage,
    amount: drainAmount,
    adminId
  });
  
  console.log(`[TREASURY] Drained ${drainAmount} coins (${percentage}%) from user ${userId}`);
  
  return { success: true, amount: drainAmount };
}

/**
 * Log economy manipulation action
 * @param action - Action type
 * @param metadata - Additional data
 */
export async function logManipulation(action: string, metadata: Record<string, any>) {
  const treasury = await getBalance();
  const timestamp = new Date().toISOString();
  
  const auditEntry = {
    timestamp,
    action,
    amount: metadata.amount || 0,
    reason: metadata.reason || action,
    balanceBefore: treasury.balance,
    balanceAfter: treasury.balance,
    ...metadata
  };
  
  await db.update(adminTreasury)
    .set({
      auditLog: sql`${adminTreasury.auditLog} || ${JSON.stringify(auditEntry)}::jsonb`,
      updatedAt: new Date()
    })
    .where(eq(adminTreasury.id, treasury.id));
}

/**
 * Get treasury audit log
 * @param limit - Number of entries to return
 */
export async function getAuditLog(limit: number = 100) {
  const treasury = await getBalance();
  const auditLog = treasury.auditLog || [];
  
  // Return most recent entries
  return auditLog.slice(-limit).reverse();
}

/**
 * Get economy settings
 */
export async function getEconomySettings() {
  let settings = await db.select().from(botEconomySettings).limit(1);
  
  if (settings.length === 0) {
    // Initialize with defaults
    const result = await db.insert(botEconomySettings).values({
      walletCapDefault: 199,
      walletCapOverrides: {},
      aggressionLevel: 5,
      referralModeEnabled: false,
      botPurchasesEnabled: true,
      botUnlocksEnabled: true
    }).returning();
    settings = result;
  }
  
  return settings[0];
}

/**
 * Update economy settings
 * @param updates - Settings to update
 */
export async function updateEconomySettings(updates: Partial<{
  walletCapDefault: number;
  aggressionLevel: number;
  referralModeEnabled: boolean;
  botPurchasesEnabled: boolean;
  botUnlocksEnabled: boolean;
}>) {
  const settings = await getEconomySettings();
  
  await db.update(botEconomySettings)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(botEconomySettings.id, settings.id));
  
  console.log(`[TREASURY] Updated economy settings:`, updates);
  
  return await getEconomySettings();
}

/**
 * Set wallet cap override for a specific user
 * @param userId - User ID
 * @param cap - Custom wallet cap (or null to remove override)
 */
export async function setUserWalletCap(userId: string, cap: number | null) {
  const settings = await getEconomySettings();
  const overrides = settings.walletCapOverrides || {};
  
  if (cap === null) {
    delete overrides[userId];
  } else {
    overrides[userId] = cap;
  }
  
  await db.update(botEconomySettings)
    .set({
      walletCapOverrides: overrides,
      updatedAt: new Date()
    })
    .where(eq(botEconomySettings.id, settings.id));
  
  console.log(`[TREASURY] Set wallet cap for user ${userId}: ${cap}`);
}

/**
 * Get wallet cap for a user (considering overrides)
 * @param userId - User ID
 * @returns Wallet cap
 */
export async function getUserWalletCap(userId: string): Promise<number> {
  const settings = await getEconomySettings();
  const overrides = settings.walletCapOverrides || {};
  
  return overrides[userId] || settings.walletCapDefault;
}

/**
 * Check if user would exceed wallet cap with additional coins
 * @param userId - User ID
 * @param additionalCoins - Coins to add
 * @returns Whether cap would be exceeded
 */
export async function wouldExceedWalletCap(userId: string, additionalCoins: number): Promise<boolean> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user.length) {
    return false;
  }
  
  const currentBalance = user[0].totalCoins;
  const cap = await getUserWalletCap(userId);
  
  return (currentBalance + additionalCoins) > cap;
}

/**
 * Get treasury statistics
 */
export async function getTreasuryStats() {
  const treasury = await getBalance();
  const settings = await getEconomySettings();
  const auditLog = treasury.auditLog || [];
  
  // Calculate today's spending
  const today = new Date().toISOString().split('T')[0];
  const todaySpending = auditLog
    .filter((entry: any) => entry.action === 'spend' && entry.timestamp.startsWith(today))
    .reduce((sum: number, entry: any) => sum + Math.abs(entry.amount), 0);
  
  // Calculate total spent all time
  const totalSpent = auditLog
    .filter((entry: any) => entry.action === 'spend')
    .reduce((sum: number, entry: any) => sum + Math.abs(entry.amount), 0);
  
  // Calculate total refilled
  const totalRefilled = auditLog
    .filter((entry: any) => entry.action === 'refill')
    .reduce((sum: number, entry: any) => sum + entry.amount, 0);
  
  return {
    balance: treasury.balance,
    dailyCap: treasury.dailyCap,
    todaySpending,
    remainingToday: Math.max(0, treasury.dailyCap - todaySpending),
    totalSpent,
    totalRefilled,
    aggressionLevel: settings.aggressionLevel,
    walletCapDefault: settings.walletCapDefault
  };
}
