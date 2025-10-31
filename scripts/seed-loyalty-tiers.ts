import { db } from '../server/db.js';
import { loyaltyTiers } from '../shared/schema.js';

async function seedLoyaltyTiers() {
  console.log('Seeding loyalty tiers table...');
  
  try {
    await db.insert(loyaltyTiers).values([
      {
        tier: "new",
        minActiveDays: 0,
        feeRate: "0.0700",
        benefits: ["Access to basic features", "7% withdrawal fee"],
        displayName: "New Member",
        displayColor: "#94a3b8"
      },
      {
        tier: "committed",
        minActiveDays: 22,
        feeRate: "0.0400",
        benefits: ["4% withdrawal fee", "Priority support", "Badge: Forum Regular"],
        displayName: "Committed Trader",
        displayColor: "#3b82f6"
      },
      {
        tier: "elite",
        minActiveDays: 90,
        feeRate: "0.0000",
        benefits: ["0% withdrawal fee", "VIP support", "Exclusive content", "Badge: Elite Member"],
        displayName: "Elite Member",
        displayColor: "#f59e0b"
      }
    ]).onConflictDoNothing();
    
    console.log('✅ Loyalty tiers seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding loyalty tiers:', error);
    throw error;
  }
}

seedLoyaltyTiers().then(() => {
  console.log('Seed script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});
