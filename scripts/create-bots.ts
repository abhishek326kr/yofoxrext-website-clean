#!/usr/bin/env tsx

import { db } from '../server/db.js';
import { bots } from '../shared/schema.js';
import { createBot, activateBot, listBots } from '../server/services/botProfileService.js';

interface BotProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  purpose: 'engagement' | 'marketplace' | 'referral';
  trustLevel: number;
  personaProfile: {
    timezone: string;
    favoritePairs: string[];
    tradingStyle: string;
    personality?: string;
  };
  activityCaps: {
    dailyLikes: number;
    dailyFollows: number;
    dailyPurchases: number;
    dailyUnlocks: number;
  };
}

const BOT_PROFILES: BotProfile[] = [
  {
    username: '@TrendMasterPro',
    displayName: 'TrendMasterPro',
    bio: '8+ years trading EUR/USD and GBP/USD. Trend following specialist. Love sharing insights with the community!',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    purpose: 'engagement',
    trustLevel: 5,
    personaProfile: {
      timezone: 'Europe/London',
      favoritePairs: ['EUR/USD', 'GBP/USD'],
      tradingStyle: 'trend following',
      personality: 'helpful and enthusiastic'
    },
    activityCaps: {
      dailyLikes: 25,
      dailyFollows: 8,
      dailyPurchases: 2,
      dailyUnlocks: 10
    }
  },
  {
    username: '@ScalpKing88',
    displayName: 'ScalpKing88',
    bio: 'Scalping the majors for 5 years. Quick trades, consistent profits. Sharing my setups daily.',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    purpose: 'marketplace',
    trustLevel: 4,
    personaProfile: {
      timezone: 'America/New_York',
      favoritePairs: ['USD/JPY', 'EUR/USD'],
      tradingStyle: 'scalping',
      personality: 'aggressive and results-focused'
    },
    activityCaps: {
      dailyLikes: 10,
      dailyFollows: 3,
      dailyPurchases: 5,
      dailyUnlocks: 5
    }
  },
  {
    username: '@GoldBullTrader',
    displayName: 'GoldBullTrader',
    bio: 'XAU/USD specialist since 2019. Position trading with technical analysis. Risk management is key!',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    purpose: 'engagement',
    trustLevel: 4,
    personaProfile: {
      timezone: 'Asia/Tokyo',
      favoritePairs: ['XAU/USD', 'XAG/USD'],
      tradingStyle: 'position',
      personality: 'analytical and methodical'
    },
    activityCaps: {
      dailyLikes: 20,
      dailyFollows: 6,
      dailyPurchases: 1,
      dailyUnlocks: 8
    }
  },
  {
    username: '@CryptoFXNinja',
    displayName: 'CryptoFXNinja',
    bio: 'Trading crypto and forex for 3 years. BTC/USD and majors. Day trading with price action.',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    purpose: 'referral',
    trustLevel: 3,
    personaProfile: {
      timezone: 'UTC',
      favoritePairs: ['BTC/USD', 'ETH/USD', 'EUR/USD'],
      tradingStyle: 'day trading',
      personality: 'social and community-driven'
    },
    activityCaps: {
      dailyLikes: 15,
      dailyFollows: 12,
      dailyPurchases: 2,
      dailyUnlocks: 3
    }
  },
  {
    username: '@SwingTradeQueen',
    displayName: 'SwingTradeQueen',
    bio: '6 years of swing trading experience. Focus on USD pairs. Patient trader, quality over quantity.',
    avatarUrl: 'https://i.pravatar.cc/150?img=49',
    purpose: 'marketplace',
    trustLevel: 4,
    personaProfile: {
      timezone: 'Australia/Sydney',
      favoritePairs: ['USD/CAD', 'USD/CHF'],
      tradingStyle: 'swing',
      personality: 'patient and educational'
    },
    activityCaps: {
      dailyLikes: 8,
      dailyFollows: 4,
      dailyPurchases: 4,
      dailyUnlocks: 6
    }
  },
  {
    username: '@PipCollector',
    displayName: 'PipCollector',
    bio: 'Trading since 2020. Learning and growing every day. Focus on EUR/GBP cross pairs.',
    avatarUrl: 'https://i.pravatar.cc/150?img=15',
    purpose: 'engagement',
    trustLevel: 2,
    personaProfile: {
      timezone: 'Europe/Berlin',
      favoritePairs: ['EUR/GBP', 'EUR/JPY'],
      tradingStyle: 'swing',
      personality: 'beginner-friendly and curious'
    },
    activityCaps: {
      dailyLikes: 18,
      dailyFollows: 5,
      dailyPurchases: 1,
      dailyUnlocks: 7
    }
  },
  {
    username: '@MarketShark23',
    displayName: 'MarketShark23',
    bio: 'Professional trader for 10 years. Multiple strategies, all pairs. Here to dominate the markets!',
    avatarUrl: 'https://i.pravatar.cc/150?img=7',
    purpose: 'referral',
    trustLevel: 5,
    personaProfile: {
      timezone: 'America/Chicago',
      favoritePairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'],
      tradingStyle: 'mixed',
      personality: 'confident and competitive'
    },
    activityCaps: {
      dailyLikes: 12,
      dailyFollows: 10,
      dailyPurchases: 3,
      dailyUnlocks: 4
    }
  }
];

async function createAndActivateBots() {
  console.log('🤖 Starting bot creation process...\n');
  
  try {
    // Check current bot count
    const existingBots = await listBots();
    console.log(`📊 Current bot count: ${existingBots.length}/15\n`);
    
    if (existingBots.length >= 15) {
      console.log('❌ Maximum bot limit (15) reached. Cannot create more bots.');
      return;
    }
    
    const botsToCreate = Math.min(BOT_PROFILES.length, 15 - existingBots.length);
    console.log(`✅ Creating ${botsToCreate} new bots...\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < botsToCreate; i++) {
      const profile = BOT_PROFILES[i];
      console.log(`\n📝 Creating bot ${i + 1}/${botsToCreate}: ${profile.username}`);
      console.log(`   Purpose: ${profile.purpose}`);
      console.log(`   Trust Level: ${profile.trustLevel}`);
      console.log(`   Trading Style: ${profile.personaProfile.tradingStyle}`);
      
      try {
        // Create the bot
        const bot = await createBot({
          ...profile,
          isActive: false // Start inactive
        });
        
        console.log(`   ✅ Bot created with ID: ${bot.id}`);
        
        // Activate the bot
        await activateBot(bot.id);
        console.log(`   🚀 Bot activated successfully!`);
        
        successCount++;
      } catch (error: any) {
        console.error(`   ❌ Failed to create/activate bot: ${error.message}`);
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BOT CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created and activated: ${successCount} bots`);
    if (failCount > 0) {
      console.log(`❌ Failed: ${failCount} bots`);
    }
    
    // List all active bots
    const allBots = await listBots();
    const activeBots = allBots.filter(b => b.isActive);
    
    console.log(`\n📋 Total bots in system: ${allBots.length}/15`);
    console.log(`🟢 Active bots: ${activeBots.length}`);
    console.log(`⚫ Inactive bots: ${allBots.length - activeBots.length}`);
    
    if (activeBots.length > 0) {
      console.log('\n🤖 Active Bot List:');
      activeBots.forEach(bot => {
        console.log(`   - ${bot.username} (${bot.purpose}) - Trust Level: ${bot.trustLevel}`);
      });
    }
    
    console.log('\n✨ Bot creation process completed!');
    
  } catch (error: any) {
    console.error('❌ Fatal error during bot creation:', error);
    process.exit(1);
  }
}

// Run the script
createAndActivateBots()
  .then(() => {
    console.log('\n👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });