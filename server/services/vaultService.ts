import { db } from '../db.js';
import { vaultCoins, users } from '../../shared/schema.js';
import { and, eq, or, isNull, lt, lte, sql } from 'drizzle-orm';

/**
 * Create a 10% vault bonus on every coin earn event
 * @param userId - User ID who earned coins
 * @param amount - Amount of coins earned (10% will be added to vault)
 * @param earnedFrom - Source of earnings ("reply", "sale", "referral", etc.)
 * @param sourceId - Optional ID of the source entity
 * @returns The created vault coin record or null if amount is too small
 */
export async function createVaultBonus(
  userId: string,
  amount: number,
  earnedFrom: string,
  sourceId?: string
) {
  const vaultAmount = Math.floor(amount * 0.10); // 10% bonus
  if (vaultAmount <= 0) return null;
  
  const unlockAt = new Date();
  unlockAt.setDate(unlockAt.getDate() + 30); // 30 days from now
  
  const result = await db.insert(vaultCoins).values({
    userId,
    amount: vaultAmount,
    earnedFrom,
    sourceId: sourceId || null,
    unlockAt,
    status: "locked"
  }).returning();
  
  console.log(`[VAULT] Created ${vaultAmount} vault coins for user ${userId} from ${earnedFrom}`);
  
  return result[0];
}

/**
 * Weekly activity checker - extends unlock date for inactive users
 * This encourages users to stay active to unlock their vault bonuses
 */
export async function extendVaultUnlockForInactiveUsers() {
  console.log('[VAULT] Checking for inactive users to extend vault unlock dates...');
  
  // Get users with no activity in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const inactiveUsers = await db.select({ userId: users.id })
    .from(users)
    .where(
      or(
        isNull(users.lastActive),
        lt(users.lastActive, sevenDaysAgo)
      )
    );
  
  console.log(`[VAULT] Found ${inactiveUsers.length} inactive users`);
  
  // For each inactive user, extend vault unlock by 7 days
  let extendedCount = 0;
  for (const user of inactiveUsers) {
    const result = await db.update(vaultCoins)
      .set({ 
        unlockAt: sql`${vaultCoins.unlockAt} + interval '7 days'`
      })
      .where(
        and(
          eq(vaultCoins.userId, user.userId),
          eq(vaultCoins.status, "locked")
        )
      );
    
    if (result.rowCount && result.rowCount > 0) {
      extendedCount++;
    }
  }
  
  console.log(`[VAULT] Extended vault unlock for ${extendedCount} inactive users`);
  return extendedCount;
}

/**
 * Unlock vaults that have reached their unlock date
 * This should run daily to unlock matured vault bonuses
 */
export async function unlockMaturedVaults() {
  console.log('[VAULT] Unlocking matured vaults...');
  
  const result = await db.update(vaultCoins)
    .set({ status: "unlocked" })
    .where(
      and(
        eq(vaultCoins.status, "locked"),
        lte(vaultCoins.unlockAt, new Date())
      )
    );
  
  const unlockedCount = result.rowCount || 0;
  console.log(`[VAULT] Unlocked ${unlockedCount} vault bonuses`);
  
  return unlockedCount;
}

/**
 * Claim unlocked vault coins and transfer them to user's main balance
 * @param userId - User ID claiming the vault
 * @param vaultId - Optional specific vault ID to claim (if not provided, claims all unlocked)
 */
export async function claimVaultCoins(userId: string, vaultId?: string) {
  // Get unlocked vaults for this user
  const query = vaultId
    ? db.select().from(vaultCoins).where(
        and(
          eq(vaultCoins.id, vaultId),
          eq(vaultCoins.userId, userId),
          eq(vaultCoins.status, "unlocked")
        )
      )
    : db.select().from(vaultCoins).where(
        and(
          eq(vaultCoins.userId, userId),
          eq(vaultCoins.status, "unlocked")
        )
      );
  
  const unlockedVaults = await query;
  
  if (unlockedVaults.length === 0) {
    return { claimed: 0, totalAmount: 0 };
  }
  
  // Calculate total amount
  const totalAmount = unlockedVaults.reduce((sum, vault) => sum + vault.amount, 0);
  
  // Mark vaults as claimed
  const vaultIds = unlockedVaults.map(v => v.id);
  await db.update(vaultCoins)
    .set({ 
      status: "claimed",
      claimedAt: new Date()
    })
    .where(
      and(
        eq(vaultCoins.userId, userId),
        eq(vaultCoins.status, "unlocked"),
        ...(vaultId ? [eq(vaultCoins.id, vaultId)] : [])
      )
    );
  
  // Add coins to user's balance
  await db.update(users)
    .set({ 
      totalCoins: sql`${users.totalCoins} + ${totalAmount}`
    })
    .where(eq(users.id, userId));
  
  console.log(`[VAULT] User ${userId} claimed ${totalAmount} coins from ${unlockedVaults.length} vaults`);
  
  return { claimed: unlockedVaults.length, totalAmount };
}

/**
 * Get vault summary for a user
 */
export async function getVaultSummary(userId: string) {
  const vaults = await db.select().from(vaultCoins)
    .where(eq(vaultCoins.userId, userId));
  
  const locked = vaults.filter(v => v.status === 'locked');
  const unlocked = vaults.filter(v => v.status === 'unlocked');
  const claimed = vaults.filter(v => v.status === 'claimed');
  
  return {
    locked: {
      count: locked.length,
      total: locked.reduce((sum, v) => sum + v.amount, 0)
    },
    unlocked: {
      count: unlocked.length,
      total: unlocked.reduce((sum, v) => sum + v.amount, 0)
    },
    claimed: {
      count: claimed.length,
      total: claimed.reduce((sum, v) => sum + v.amount, 0)
    },
    all: vaults
  };
}
