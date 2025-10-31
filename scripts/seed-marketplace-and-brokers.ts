/**
 * Seed Marketplace Content (EAs, Indicators) and Broker Directory
 * Production-ready data for YoForex platform
 */

import { db } from '../server/db';
import { content, brokers, users } from '../shared/schema';

async function seedMarketplaceAndBrokers() {
  console.log('🌱 Seeding marketplace content and brokers...\n');

  // Get existing users for author assignments
  const allUsers = await db.select().from(users);
  
  if (allUsers.length === 0) {
    console.error('❌ No users found. Please run seed-complete-platform.ts first!');
    process.exit(1);
  }

  console.log(`👥 Found ${allUsers.length} users for content authorship\n`);

  // === MARKETPLACE CONTENT (EAs & Indicators) ===
  console.log('💼 Seeding marketplace content...\n');

  const marketplaceItems = [
    // Scalping EAs
    {
      title: 'Gold Scalper Pro EA',
      slug: 'gold-scalper-pro-ea',
      type: 'ea' as const,
      category: 'scalping-eas',
      description: 'Advanced XAUUSD scalping EA with AI trend detection. Avg 15-20 pips/day on M5. Martingale-free, news filter included.',
      price: 250,
      authorId: allUsers[7].id, // ea_coder123
      status: 'published' as const,
      downloads: 342,
      rating: 4.7,
      platform: 'MT4',
      fileUrl: '/files/eas/gold-scalper-pro.ex4',
      fileSize: 245000,
    },
    {
      title: 'EURUSD Night Scalper',
      slug: 'eurusd-night-scalper',
      type: 'ea' as const,
      category: 'scalping-eas',
      description: 'Trades EURUSD during Asian session (low volatility). Uses Bollinger Bands + RSI. 68% win rate backtested 2020-2024.',
      price: 150,
      authorId: allUsers[10].id, // generous_coder
      status: 'published' as const,
      downloads: 521,
      rating: 4.5,
      platform: 'MT4',
      fileUrl: '/files/eas/eurusd-night-scalper.ex4',
      fileSize: 189000,
    },
    {
      title: 'Multi-Pair Grid EA',
      slug: 'multi-pair-grid-ea',
      type: 'ea' as const,
      category: 'grid-trading-eas',
      description: 'Trade EURUSD, GBPUSD, USDJPY simultaneously with dynamic grid sizing. Max 10 trades per pair, automatic SL/TP.',
      price: 0, // FREE
      authorId: allUsers[1].id, // grid_hunter88
      status: 'published' as const,
      downloads: 1234,
      rating: 4.3,
      platform: 'MT5',
      fileUrl: '/files/eas/multi-pair-grid.ex5',
      fileSize: 312000,
    },
    {
      title: 'Trend Rider Pro',
      slug: 'trend-rider-pro',
      type: 'ea' as const,
      category: 'trend-following-eas',
      description: 'H4 trend following EA. Uses 50/200 EMA crossover + MACD confirmation. Best on trending pairs like GBPJPY.',
      price: 200,
      authorId: allUsers[7].id, // ea_coder123
      status: 'published' as const,
      downloads: 287,
      rating: 4.6,
      platform: 'MT4',
      fileUrl: '/files/eas/trend-rider-pro.ex4',
      fileSize: 278000,
    },
    {
      title: 'NFP News Trader EA',
      slug: 'nfp-news-trader-ea',
      type: 'ea' as const,
      category: 'news-trading-eas',
      description: 'Automatically trades NFP, FOMC, CPI releases. Places pending orders 1 min before release. 55% win rate.',
      price: 300,
      authorId: allUsers[5].id, // news_trader_x
      status: 'published' as const,
      downloads: 156,
      rating: 4.1,
      platform: 'MT5',
      fileUrl: '/files/eas/nfp-news-trader.ex5',
      fileSize: 423000,
    },

    // Indicators
    {
      title: 'Advanced RSI with Divergence Alerts',
      slug: 'advanced-rsi-divergence',
      type: 'indicator' as const,
      category: 'oscillators-momentum',
      description: 'RSI indicator with automatic divergence detection (regular & hidden). Push notifications + email alerts.',
      price: 50,
      authorId: allUsers[14].id, // indicator_guy88
      status: 'published' as const,
      downloads: 892,
      rating: 4.8,
      platform: 'MT4',
      fileUrl: '/files/indicators/advanced-rsi.ex4',
      fileSize: 98000,
    },
    {
      title: 'Dynamic Support/Resistance Zones',
      slug: 'dynamic-sr-zones',
      type: 'indicator' as const,
      category: 'sr-tools',
      description: 'Automatically draws support/resistance zones based on price action. Updates in real-time. Works on all timeframes.',
      price: 75,
      authorId: allUsers[14].id, // indicator_guy88
      status: 'published' as const,
      downloads: 634,
      rating: 4.7,
      platform: 'MT5',
      fileUrl: '/files/indicators/dynamic-sr-zones.ex5',
      fileSize: 145000,
    },
    {
      title: 'Volume Profile Indicator',
      slug: 'volume-profile-indicator',
      type: 'indicator' as const,
      category: 'volume-indicators',
      description: 'Shows volume distribution at each price level. Identifies high-volume nodes (HVN) and low-volume nodes (LVN).',
      price: 0, // FREE
      authorId: allUsers[10].id, // generous_coder
      status: 'published' as const,
      downloads: 1567,
      rating: 4.9,
      platform: 'MT4',
      fileUrl: '/files/indicators/volume-profile.ex4',
      fileSize: 234000,
    },

    // Templates
    {
      title: 'Scalper Template Package',
      slug: 'scalper-template-package',
      type: 'template' as const,
      category: 'template-packs',
      description: 'Complete MT4 template for scalpers. Includes 5/15/30 EMA, Bollinger Bands, ATR, custom color scheme. Pre-configured for 1-click trading.',
      price: 25,
      authorId: allUsers[2].id, // pip_trader2024
      status: 'published' as const,
      downloads: 423,
      rating: 4.4,
      platform: 'MT4',
      fileUrl: '/files/templates/scalper-template.tpl',
      fileSize: 12000,
    },
    {
      title: 'Price Action Trader Setup',
      slug: 'price-action-trader-setup',
      type: 'template' as const,
      category: 'template-packs',
      description: 'Clean chart template for price action traders. Only candlesticks + 20/50/200 SMA. No clutter, minimal indicators.',
      price: 0, // FREE
      authorId: allUsers[13].id, // patient_trader
      status: 'published' as const,
      downloads: 2341,
      rating: 4.9,
      platform: 'MT5',
      fileUrl: '/files/templates/price-action-setup.tpl',
      fileSize: 8500,
    },
  ];

  for (const item of marketplaceItems) {
    await db.insert(content).values(item);
    console.log(`  ✅ ${item.title} (${item.type}, ${item.price} coins)`);
  }

  console.log(`\n✅ Seeded ${marketplaceItems.length} marketplace items\n`);

  // === BROKERS ===
  console.log('🏦 Seeding broker directory...\n');

  const brokersList = [
    {
      name: 'IC Markets',
      slug: 'ic-markets',
      country: 'Australia',
      regulation: 'ASIC, CySEC',
      minDeposit: 200,
      maxLeverage: '500:1',
      spreadType: 'ECN',
      minSpread: '0.0',
      platforms: ['MT4', 'MT5', 'cTrader'],
      accountTypes: ['Raw Spread', 'Standard'],
      website: 'https://www.icmarkets.com',
      description: 'One of the largest forex brokers globally. True ECN pricing with raw spreads from 0.0 pips. Popular for scalping and algorithmic trading.',
      logo: '/logos/ic-markets.png',
      rating: 4.8,
      totalReviews: 1523,
      status: 'active' as const,
    },
    {
      name: 'Pepperstone',
      slug: 'pepperstone',
      country: 'United Kingdom',
      regulation: 'FCA, ASIC, CySEC',
      minDeposit: 200,
      maxLeverage: '200:1',
      spreadType: 'ECN',
      minSpread: '0.0',
      platforms: ['MT4', 'MT5', 'cTrader', 'TradingView'],
      accountTypes: ['Razor', 'Standard'],
      website: 'https://www.pepperstone.com',
      description: 'Award-winning broker with tight spreads and fast execution. FCA regulated with excellent customer service. Great for day traders.',
      logo: '/logos/pepperstone.png',
      rating: 4.7,
      totalReviews: 2134,
      status: 'active' as const,
    },
    {
      name: 'XM Global',
      slug: 'xm-global',
      country: 'Cyprus',
      regulation: 'CySEC, ASIC',
      minDeposit: 5,
      maxLeverage: '888:1',
      spreadType: 'Market Maker',
      minSpread: '0.6',
      platforms: ['MT4', 'MT5'],
      accountTypes: ['Micro', 'Standard', 'XM Zero'],
      website: 'https://www.xm.com',
      description: 'Popular broker with low minimum deposit. Over 1000 instruments. Good for beginners. Offers generous bonuses and promotions.',
      logo: '/logos/xm.png',
      rating: 4.3,
      totalReviews: 3421,
      status: 'active' as const,
    },
    {
      name: 'FBS',
      slug: 'fbs',
      country: 'Belize',
      regulation: 'IFSC',
      minDeposit: 1,
      maxLeverage: '3000:1',
      spreadType: 'Market Maker',
      minSpread: '0.5',
      platforms: ['MT4', 'MT5'],
      accountTypes: ['Cent', 'Standard', 'Zero Spread', 'ECN'],
      website: 'https://www.fbs.com',
      description: 'High leverage broker with very low minimum deposit. Popular in Asia. Offers multiple account types. WARNING: High leverage = high risk.',
      logo: '/logos/fbs.png',
      rating: 3.9,
      totalReviews: 1876,
      status: 'active' as const,
    },
    {
      name: 'Exness',
      slug: 'exness',
      country: 'Cyprus',
      regulation: 'FCA, CySEC',
      minDeposit: 10,
      maxLeverage: 'Unlimited',
      spreadType: 'ECN',
      minSpread: '0.0',
      platforms: ['MT4', 'MT5', 'Exness Terminal'],
      accountTypes: ['Standard', 'Raw Spread', 'Zero', 'Pro'],
      website: 'https://www.exness.com',
      description: 'Offers unlimited leverage and instant withdrawals. Popular for high-volume traders. Tight spreads on major pairs.',
      logo: '/logos/exness.png',
      rating: 4.6,
      totalReviews: 2567,
      status: 'active' as const,
    },
    {
      name: 'FXTM (ForexTime)',
      slug: 'fxtm',
      country: 'United Kingdom',
      regulation: 'FCA, CySEC',
      minDeposit: 10,
      maxLeverage: '1000:1',
      spreadType: 'ECN',
      minSpread: '0.1',
      platforms: ['MT4', 'MT5'],
      accountTypes: ['Standard', 'Cent', 'ECN', 'ECN Zero'],
      website: 'https://www.fxtm.com',
      description: 'Regulated broker with good educational resources. Offers ECN accounts with competitive spreads. Strong presence in emerging markets.',
      logo: '/logos/fxtm.png',
      rating: 4.4,
      totalReviews: 1234,
      status: 'active' as const,
    },
    {
      name: 'Tickmill',
      slug: 'tickmill',
      country: 'United Kingdom',
      regulation: 'FCA, CySEC',
      minDeposit: 100,
      maxLeverage: '500:1',
      spreadType: 'ECN',
      minSpread: '0.0',
      platforms: ['MT4', 'MT5'],
      accountTypes: ['Classic', 'Pro', 'VIP'],
      website: 'https://www.tickmill.com',
      description: 'Premium ECN broker with institutional-grade liquidity. Excellent for scalpers. Very tight spreads on EUR/USD (0.0-0.2 pips).',
      logo: '/logos/tickmill.png',
      rating: 4.7,
      totalReviews: 892,
      status: 'active' as const,
    },
  ];

  for (const broker of brokersList) {
    await db.insert(brokers).values(broker);
    console.log(`  ✅ ${broker.name} (${broker.regulation}) - ${broker.spreadType}`);
  }

  console.log(`\n✅ Seeded ${brokersList.length} brokers\n`);
  console.log('🎉 Marketplace and broker seeding completed!\n');
  
  console.log('📊 Database Summary:');
  console.log(`   Content Items: ${marketplaceItems.length}`);
  console.log(`   - EAs: ${marketplaceItems.filter(i => i.type === 'ea').length}`);
  console.log(`   - Indicators: ${marketplaceItems.filter(i => i.type === 'indicator').length}`);
  console.log(`   - Templates: ${marketplaceItems.filter(i => i.type === 'template').length}`);
  console.log(`   Brokers: ${brokersList.length}`);
  
  process.exit(0);
}

seedMarketplaceAndBrokers().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
