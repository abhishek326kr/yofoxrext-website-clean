// Coin System Utilities
// Exchange Rate: 100 coins = $5.50 USD (each coin = $0.055)

export const COIN_TO_USD_RATE = 0.055; // $0.055 per coin
export const USD_TO_COIN_RATE = 100 / 5.5; // ~18.18 coins per dollar

// Recharge Packages - NEW PRICING
export interface CoinPackage {
  id: string;
  name: string;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  priceUSD: number;
  popular?: boolean;
  bestValue?: boolean;
  savingsPercent: number;
}

export const RECHARGE_PACKAGES: CoinPackage[] = [
  {
    id: 'mini',
    name: 'Mini',
    baseCoins: 100,
    bonusCoins: 10,
    totalCoins: 110,
    priceUSD: 5.50,
    savingsPercent: 10
  },
  {
    id: 'starter',
    name: 'Starter',
    baseCoins: 300,
    bonusCoins: 40,
    totalCoins: 340,
    priceUSD: 16.50,
    savingsPercent: 13
  },
  {
    id: 'basic',
    name: 'Basic',
    baseCoins: 500,
    bonusCoins: 75,
    totalCoins: 575,
    priceUSD: 27.50,
    savingsPercent: 15
  },
  {
    id: 'popular',
    name: 'Popular',
    baseCoins: 1000,
    bonusCoins: 200,
    totalCoins: 1200,
    priceUSD: 55.00,
    popular: true,
    savingsPercent: 20
  },
  {
    id: 'pro',
    name: 'Pro',
    baseCoins: 2000,
    bonusCoins: 450,
    totalCoins: 2450,
    priceUSD: 110.00,
    savingsPercent: 23
  },
  {
    id: 'business',
    name: 'Business',
    baseCoins: 5000,
    bonusCoins: 1250,
    totalCoins: 6250,
    priceUSD: 275.00,
    savingsPercent: 25
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    baseCoins: 10000,
    bonusCoins: 3000,
    totalCoins: 13000,
    priceUSD: 550.00,
    bestValue: true,
    savingsPercent: 30
  }
];

// Earning Rewards - NEW REDUCED AMOUNTS
export const EARNING_REWARDS = {
  // Publishing Bonuses (one-time)
  PUBLISH_EA_INDICATOR: 10,
  PUBLISH_SET_FILE: 5,
  PUBLISH_ARTICLE: 10,
  
  // Quality Bonuses
  EA_QUALITY_BONUS: 25, // 10+ sales AND 4+ star rating
  ARTICLE_FEATURED: 50,
  
  // Community Help
  REPLY: 1, // per reply, max 20/day
  BEST_ANSWER: 10,
  
  // Backtest Reports
  BACKTEST_BASIC: 10,
  BACKTEST_QUALITY: 10, // 12+ months data
  BACKTEST_FEATURED: 25,
  
  // Violation Reports
  SPAM_REPORT: 5,
  SCAM_REPORT: 25,
  MALICIOUS_EA: 50,
  FALSE_REPORT_PENALTY: -10,
  
  // Daily Activity
  DAILY_LOGIN: 2,
  DAILY_CHECKIN: 1,
  WEEKLY_STREAK: 10, // every 7 days
  MONTHLY_PERFECT: 50, // all 30 days
  
  // Referral Rewards
  REFERRAL_SIGNUP: 10,
  REFERRAL_FIRST_POST: 10,
  REFERRAL_FIRST_PURCHASE_PERCENT: 0.05, // 5% of purchase, max 50 coins
  REFERRAL_LIFETIME_COMMISSION: 0.03, // 3% of all content sales
};

// Daily Limits
export const DAILY_LIMITS = {
  MAX_REPLIES: 20,
  MAX_REPORTS: 5,
  MAX_BACKTESTS: 3,
};

// Commission Splits
export const COMMISSION_RATES = {
  EA_INDICATOR: {
    seller: 0.80,
    platform: 0.20
  },
  SET_FILE: {
    seller: 0.75,
    platform: 0.25
  },
  ARTICLE: {
    seller: 0.80,
    platform: 0.20
  },
  SOURCE_CODE: {
    seller: 0.80,
    platform: 0.20
  }
};

// Withdrawal Settings
export const WITHDRAWAL_CONFIG = {
  MIN_AMOUNT: 1000, // coins
  FEE_PERCENT: 0.05, // 5%
  SUPPORTED_CRYPTO: ['BTC', 'ETH', 'USDT'] as const,
};

// Minimum Content Prices
export const MIN_CONTENT_PRICES = {
  ea: 20,
  indicator: 10,
  set_file: 5,
  article: 10,
  source_code: 50,
};

/**
 * Convert coins to USD
 */
export function coinsToUSD(coins: number): number {
  return parseFloat((coins * COIN_TO_USD_RATE).toFixed(2));
}

/**
 * Convert USD to coins
 */
export function usdToCoins(usd: number): number {
  return Math.floor(usd * USD_TO_COIN_RATE);
}

/**
 * Format coin amount with USD equivalent
 * Example: "500 coins ($27.50 USD)"
 */
export function formatCoinPrice(coins: number): string {
  const usd = coinsToUSD(coins);
  return `${coins.toLocaleString()} coins ($${usd.toFixed(2)} USD)`;
}

/**
 * Calculate commission split for content sale
 */
export function calculateCommission(
  priceCoins: number,
  contentType: keyof typeof MIN_CONTENT_PRICES
): {
  sellerAmount: number;
  platformAmount: number;
} {
  const rateKey = contentType === 'set_file' ? 'SET_FILE' 
    : contentType === 'source_code' ? 'SOURCE_CODE'
    : contentType === 'article' ? 'ARTICLE'
    : 'EA_INDICATOR';
  
  const rates = COMMISSION_RATES[rateKey];
  const sellerAmount = Math.floor(priceCoins * rates.seller);
  const platformAmount = priceCoins - sellerAmount;
  
  return { sellerAmount, platformAmount };
}

/**
 * Calculate withdrawal amount after fee
 */
export function calculateWithdrawal(amount: number): {
  grossAmount: number;
  fee: number;
  netAmount: number;
  netUSD: number;
} {
  const fee = Math.floor(amount * WITHDRAWAL_CONFIG.FEE_PERCENT);
  const netAmount = amount - fee;
  const netUSD = coinsToUSD(netAmount);
  
  return {
    grossAmount: amount,
    fee,
    netAmount,
    netUSD,
  };
}

/**
 * Calculate referral commission
 */
export function calculateReferralCommission(
  amount: number,
  type: 'purchase' | 'sale'
): number {
  if (type === 'purchase') {
    // 5% of purchase, max 50 coins
    return Math.min(Math.floor(amount * EARNING_REWARDS.REFERRAL_FIRST_PURCHASE_PERCENT), 50);
  } else {
    // 3% of sale
    return Math.floor(amount * EARNING_REWARDS.REFERRAL_LIFETIME_COMMISSION);
  }
}

/**
 * Get minimum price for content type
 */
export function getMinPrice(contentType: string): number {
  return MIN_CONTENT_PRICES[contentType as keyof typeof MIN_CONTENT_PRICES] || 0;
}

/**
 * Validate if price meets minimum requirement
 */
export function validateContentPrice(contentType: string, price: number): boolean {
  const minPrice = getMinPrice(contentType);
  return price >= minPrice;
}

/**
 * Calculate monthly earning potential
 */
export function calculateMonthlyPotential(activityLevel: 'passive' | 'moderate' | 'active' | 'creator'): {
  coinsPerMonth: number;
  usdValue: number;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};
  
  switch (activityLevel) {
    case 'passive':
      // Daily login only
      breakdown['Daily Login'] = 60; // 2 × 30
      breakdown['Check-in'] = 30; // 1 × 30
      breakdown['Weekly Streaks'] = 40; // 10 × 4
      breakdown['Monthly Bonus'] = 50;
      break;
    
    case 'moderate':
      // Login + 10 replies daily
      breakdown['Daily Login'] = 60;
      breakdown['Check-in'] = 30;
      breakdown['Replies'] = 300; // 10 × 30
      breakdown['Weekly Streaks'] = 40;
      breakdown['Monthly Bonus'] = 50;
      break;
    
    case 'active':
      // Full participation
      breakdown['Daily Login'] = 60;
      breakdown['Check-in'] = 30;
      breakdown['Replies'] = 600; // 20 × 30
      breakdown['Best Answers'] = 100; // ~3-4 per month
      breakdown['Reports'] = 150; // ~5 per month
      breakdown['Weekly Streaks'] = 40;
      breakdown['Monthly Bonus'] = 50;
      break;
    
    case 'creator':
      // Content creator
      breakdown['Daily Login'] = 60;
      breakdown['Check-in'] = 30;
      breakdown['Content Sales'] = 1000; // Varies widely
      breakdown['Weekly Streaks'] = 40;
      breakdown['Monthly Bonus'] = 50;
      break;
  }
  
  const coinsPerMonth = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const usdValue = coinsToUSD(coinsPerMonth);
  
  return { coinsPerMonth, usdValue, breakdown };
}
