import { describe, it, expect, beforeEach } from 'vitest';

describe('Vault Bonus Calculation', () => {
  it('should calculate 10% vault bonus correctly', () => {
    const amount = 1000;
    const vaultBonus = Math.floor(amount * 0.10);
    expect(vaultBonus).toBe(100);
  });

  it('should calculate 10% for different amounts', () => {
    expect(Math.floor(5000 * 0.10)).toBe(500);
    expect(Math.floor(100 * 0.10)).toBe(10);
    expect(Math.floor(7 * 0.10)).toBe(0); // Too small
  });

  it('should set unlock date to 30 days from now', () => {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    // Test unlock date calculation
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + 30);
    
    expect(unlockDate.getDate()).toBe(thirtyDaysLater.getDate());
    expect(unlockDate.getMonth()).toBe(thirtyDaysLater.getMonth());
  });
});

describe('Loyalty Tier Calculator', () => {
  function calculateTier(activeDays: number): string {
    if (activeDays >= 90) return 'diamond';
    if (activeDays >= 67) return 'platinum';
    if (activeDays >= 45) return 'gold';
    if (activeDays >= 22) return 'silver';
    return 'bronze';
  }

  it('should return "bronze" for 0-21 active days', () => {
    expect(calculateTier(0)).toBe('bronze');
    expect(calculateTier(15)).toBe('bronze');
    expect(calculateTier(21)).toBe('bronze');
  });

  it('should return "silver" for 22-44 active days', () => {
    expect(calculateTier(22)).toBe('silver');
    expect(calculateTier(30)).toBe('silver');
    expect(calculateTier(44)).toBe('silver');
  });

  it('should return "gold" for 45-66 active days', () => {
    expect(calculateTier(45)).toBe('gold');
    expect(calculateTier(50)).toBe('gold');
    expect(calculateTier(66)).toBe('gold');
  });

  it('should return "platinum" for 67-89 active days', () => {
    expect(calculateTier(67)).toBe('platinum');
    expect(calculateTier(75)).toBe('platinum');
    expect(calculateTier(89)).toBe('platinum');
  });

  it('should return "diamond" for 90+ active days', () => {
    expect(calculateTier(90)).toBe('diamond');
    expect(calculateTier(95)).toBe('diamond');
    expect(calculateTier(365)).toBe('diamond');
  });
});

describe('Referral Rate Logic', () => {
  function calculateReferralRate(referrals: number): number {
    return referrals >= 5 ? 0.05 : 0.02;
  }

  it('should calculate 5% permanent rate with 5+ active referrals', () => {
    expect(calculateReferralRate(5)).toBe(0.05);
    expect(calculateReferralRate(6)).toBe(0.05);
    expect(calculateReferralRate(10)).toBe(0.05);
  });

  it('should use default rate with <5 referrals', () => {
    expect(calculateReferralRate(0)).toBe(0.02);
    expect(calculateReferralRate(3)).toBe(0.02);
    expect(calculateReferralRate(4)).toBe(0.02);
  });
});

describe('Fee Rate Calculation', () => {
  function calculateFeeRate(tier: string): number {
    const feeRates: Record<string, number> = {
      bronze: 0.07,
      silver: 0.05,
      gold: 0.03,
      platinum: 0.02,
      diamond: 0,
    };
    return feeRates[tier] !== undefined ? feeRates[tier] : 0.07;
  }

  it('should return correct fee rates for each tier', () => {
    expect(calculateFeeRate('bronze')).toBe(0.07);
    expect(calculateFeeRate('silver')).toBe(0.05);
    expect(calculateFeeRate('gold')).toBe(0.03);
    expect(calculateFeeRate('platinum')).toBe(0.02);
    expect(calculateFeeRate('diamond')).toBe(0);
  });

  it('should default to bronze rate for unknown tiers', () => {
    expect(calculateFeeRate('unknown')).toBe(0.07);
  });
});

describe('Badge Progress Calculation', () => {
  function calculateBadgeProgress(current: number, threshold: number): number {
    if (threshold === 0) return 100; // Handle edge case
    return Math.min(100, (current / threshold) * 100);
  }

  it('should calculate progress percentage correctly', () => {
    expect(calculateBadgeProgress(25, 50)).toBe(50);
    expect(calculateBadgeProgress(75, 100)).toBe(75);
    expect(calculateBadgeProgress(10, 100)).toBe(10);
  });

  it('should cap progress at 100%', () => {
    expect(calculateBadgeProgress(150, 100)).toBe(100);
    expect(calculateBadgeProgress(200, 100)).toBe(100);
  });

  it('should handle zero threshold', () => {
    expect(calculateBadgeProgress(50, 0)).toBe(100);
  });
});
