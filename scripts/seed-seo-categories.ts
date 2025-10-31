import { db } from '../server/db';
import { seoCategories, categoryRedirects } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function seedSeoCategories() {
  console.log('Starting SEO categories seed...');
  
  try {
    // Clear existing categories (if any)
    await db.delete(seoCategories);
    await db.delete(categoryRedirects);
    
    // Main Categories with SEO-optimized URLs
    const mainCategories = [
      // Forex Trading Category
      {
        slug: 'forex-trading',
        name: 'Forex Trading',
        urlPath: '/forex-trading/',
        categoryType: 'main' as const,
        icon: 'TrendingUp',
        color: 'bg-blue-500',
        metaTitle: 'Forex Trading Tools, EAs & Indicators | Expert Advisors & MT4/MT5',
        metaDescription: 'Professional forex trading tools, expert advisors, indicators, and strategies for MT4/MT5 platforms. Download proven trading systems and automated solutions.',
        metaKeywords: 'forex trading, expert advisors, MT4 indicators, MT5 EAs, trading strategies',
        h1Title: 'Forex Trading Resources',
        sortOrder: 1
      },
      // Binary Options Category
      {
        slug: 'binary-options',
        name: 'Binary Options',
        urlPath: '/binary-options/',
        categoryType: 'main' as const,
        icon: 'Binary',
        color: 'bg-purple-500',
        metaTitle: 'Binary Options Trading Robots & Indicators | Automated Trading',
        metaDescription: 'Binary options trading robots, indicators, strategies and training resources. Find profitable binary options systems and educational content.',
        metaKeywords: 'binary options, trading robots, binary indicators, binary strategies',
        h1Title: 'Binary Options Trading',
        sortOrder: 2
      },
      // Cryptocurrency Trading Category
      {
        slug: 'cryptocurrency-trading',
        name: 'Crypto Trading',
        urlPath: '/cryptocurrency-trading/',
        categoryType: 'main' as const,
        icon: 'Bitcoin',
        color: 'bg-orange-500',
        metaTitle: 'Cryptocurrency Trading Bots & Strategies | Crypto Trading Tools',
        metaDescription: 'Crypto trading bots, strategies, courses and blockchain resources. Automated cryptocurrency trading solutions and educational materials.',
        metaKeywords: 'cryptocurrency trading, crypto bots, blockchain, crypto strategies',
        h1Title: 'Cryptocurrency Trading',
        sortOrder: 3
      },
      // Online Courses Category
      {
        slug: 'online-courses',
        name: 'Online Courses',
        urlPath: '/online-courses/',
        categoryType: 'main' as const,
        icon: 'GraduationCap',
        color: 'bg-green-500',
        metaTitle: 'Online Trading & Business Courses | Programming & Marketing',
        metaDescription: 'Professional online courses for trading, programming, business, dropshipping, and social media marketing. Learn from experts.',
        metaKeywords: 'online courses, trading education, programming courses, business training',
        h1Title: 'Online Courses',
        sortOrder: 4
      },
      // Sports Betting Category
      {
        slug: 'sports-betting',
        name: 'Sports Betting',
        urlPath: '/sports-betting/',
        categoryType: 'main' as const,
        icon: 'Trophy',
        color: 'bg-red-500',
        metaTitle: 'Sports Betting Systems & Analysis Tools | Betting Strategies',
        metaDescription: 'Sports betting systems, courses, and analysis tools. Professional betting strategies and educational resources.',
        metaKeywords: 'sports betting, betting systems, betting analysis, sports gambling',
        h1Title: 'Sports Betting',
        sortOrder: 5
      },
      // Casino & Poker Category
      {
        slug: 'casino-poker',
        name: 'Casino & Poker',
        urlPath: '/casino-poker/',
        categoryType: 'main' as const,
        icon: 'Spade',
        color: 'bg-pink-500',
        metaTitle: 'Casino & Poker Strategies | Gambling Systems & Tools',
        metaDescription: 'Casino and poker strategies, systems, and educational resources. Professional gambling techniques and tools.',
        metaKeywords: 'casino strategies, poker systems, gambling tools, casino education',
        h1Title: 'Casino & Poker',
        sortOrder: 6
      },
      // Community Category
      {
        slug: 'community',
        name: 'Community',
        urlPath: '/community/',
        categoryType: 'main' as const,
        icon: 'Users',
        color: 'bg-indigo-500',
        metaTitle: 'Trading Community Forum | Discussions & Support',
        metaDescription: 'Join our trading community forum for discussions, support, and sharing experiences with fellow traders.',
        metaKeywords: 'trading community, forum, trader discussions, trading support',
        h1Title: 'Community Forum',
        sortOrder: 7
      },
      // Free Downloads Category
      {
        slug: 'free-downloads',
        name: 'Free Downloads',
        urlPath: '/free-downloads/',
        categoryType: 'main' as const,
        icon: 'Download',
        color: 'bg-gray-500',
        metaTitle: 'Free Trading Downloads | Free EAs, Indicators & Tools',
        metaDescription: 'Download free trading tools, expert advisors, indicators, and educational resources. Start trading without cost.',
        metaKeywords: 'free downloads, free EAs, free indicators, free trading tools',
        h1Title: 'Free Downloads',
        sortOrder: 8
      }
    ];
    
    // Insert main categories
    const insertedMainCategories = await db.insert(seoCategories).values(mainCategories).returning();
    console.log(`Inserted ${insertedMainCategories.length} main categories`);
    
    // Map slug to ID for parent references
    const categoryIdMap: Record<string, string> = {};
    insertedMainCategories.forEach(cat => {
      categoryIdMap[cat.slug] = cat.id;
    });
    
    // Subcategories for Forex Trading
    const forexSubcategories = [
      {
        slug: 'expert-advisors',
        name: 'Expert Advisors',
        urlPath: '/forex-trading/expert-advisors/',
        parentId: categoryIdMap['forex-trading'],
        categoryType: 'sub' as const,
        oldSlug: 'ea-library',
        icon: 'Bot',
        metaTitle: 'Forex Expert Advisors (EAs) | Automated Trading Systems',
        metaDescription: 'Professional forex expert advisors for MT4/MT5. Automated trading systems with proven performance.',
        sortOrder: 1
      },
      {
        slug: 'indicators',
        name: 'MT4/MT5 Indicators',
        urlPath: '/forex-trading/indicators/',
        parentId: categoryIdMap['forex-trading'],
        categoryType: 'sub' as const,
        oldSlug: 'oscillators-momentum',
        icon: 'Activity',
        metaTitle: 'MT4/MT5 Trading Indicators | Technical Analysis Tools',
        metaDescription: 'Professional trading indicators for MetaTrader 4 and 5. Technical analysis tools for forex trading.',
        sortOrder: 2
      },
      {
        slug: 'source-code',
        name: 'Source Code',
        urlPath: '/forex-trading/source-code/',
        parentId: categoryIdMap['forex-trading'],
        categoryType: 'sub' as const,
        oldSlug: 'source-code',
        icon: 'Code',
        metaTitle: 'Trading EA Source Code | MQL4/MQL5 Programming',
        metaDescription: 'Expert advisor source code for MT4/MT5. Learn MQL programming with professional trading code.',
        sortOrder: 3
      },
      {
        slug: 'strategies',
        name: 'Trading Strategies',
        urlPath: '/forex-trading/strategies/',
        parentId: categoryIdMap['forex-trading'],
        categoryType: 'sub' as const,
        oldSlug: 'trading-strategies',
        icon: 'Strategy',
        metaTitle: 'Forex Trading Strategies | Proven Trading Systems',
        metaDescription: 'Professional forex trading strategies and systems. Scalping, day trading, and swing trading methods.',
        sortOrder: 4
      },
      {
        slug: 'ninjatrader',
        name: 'NinjaTrader',
        urlPath: '/forex-trading/ninjatrader/',
        parentId: categoryIdMap['forex-trading'],
        categoryType: 'sub' as const,
        icon: 'Terminal',
        metaTitle: 'NinjaTrader Indicators & Strategies | NT8 Trading Tools',
        metaDescription: 'NinjaTrader 8 indicators, strategies, and automated trading systems for professional traders.',
        sortOrder: 5
      },
      {
        slug: 'courses',
        name: 'Video Courses',
        urlPath: '/forex-trading/courses/',
        parentId: categoryIdMap['forex-trading'],
        categoryType: 'sub' as const,
        icon: 'Video',
        metaTitle: 'Forex Trading Video Courses | Trading Education',
        metaDescription: 'Professional forex trading video courses. Learn from expert traders and improve your skills.',
        sortOrder: 6
      },
      {
        slug: 'signals',
        name: 'Trading Signals',
        urlPath: '/forex-trading/signals/',
        parentId: categoryIdMap['forex-trading'],
        categoryType: 'sub' as const,
        icon: 'Signal',
        metaTitle: 'Forex Trading Signals | Trade Alerts & Notifications',
        metaDescription: 'Professional forex trading signals and trade alerts. Get real-time notifications for profitable trades.',
        sortOrder: 7
      },
      {
        slug: 'tradingview',
        name: 'TradingView Tools',
        urlPath: '/forex-trading/tradingview/',
        parentId: categoryIdMap['forex-trading'],
        categoryType: 'sub' as const,
        icon: 'ChartLine',
        metaTitle: 'TradingView Indicators & Strategies | Pine Script Tools',
        metaDescription: 'TradingView indicators and strategies. Professional Pine Script trading tools and alerts.',
        sortOrder: 8
      }
    ];
    
    // Subcategories for Binary Options
    const binarySubcategories = [
      {
        slug: 'robots',
        name: 'Trading Robots',
        urlPath: '/binary-options/robots/',
        parentId: categoryIdMap['binary-options'],
        categoryType: 'sub' as const,
        icon: 'Bot',
        metaTitle: 'Binary Options Trading Robots | Automated Binary Trading',
        metaDescription: 'Automated binary options trading robots with high win rates. Professional binary trading systems.',
        sortOrder: 1
      },
      {
        slug: 'binary-indicators',
        name: 'Indicators',
        urlPath: '/binary-options/indicators/',
        parentId: categoryIdMap['binary-options'],
        categoryType: 'sub' as const,
        icon: 'Activity',
        metaTitle: 'Binary Options Indicators | Trading Signals & Tools',
        metaDescription: 'Professional binary options indicators and signal tools. Improve your binary trading accuracy.',
        sortOrder: 2
      },
      {
        slug: 'binary-strategies',
        name: 'Strategies',
        urlPath: '/binary-options/strategies/',
        parentId: categoryIdMap['binary-options'],
        categoryType: 'sub' as const,
        icon: 'Strategy',
        metaTitle: 'Binary Options Strategies | Winning Trading Methods',
        metaDescription: 'Proven binary options trading strategies. Learn professional methods for successful binary trading.',
        sortOrder: 3
      },
      {
        slug: 'training',
        name: 'Training',
        urlPath: '/binary-options/training/',
        parentId: categoryIdMap['binary-options'],
        categoryType: 'sub' as const,
        icon: 'BookOpen',
        metaTitle: 'Binary Options Training | Educational Courses',
        metaDescription: 'Complete binary options training courses. Learn from basics to advanced binary trading techniques.',
        sortOrder: 4
      }
    ];
    
    // Subcategories for Crypto Trading
    const cryptoSubcategories = [
      {
        slug: 'bots',
        name: 'Crypto Bots',
        urlPath: '/cryptocurrency-trading/bots/',
        parentId: categoryIdMap['cryptocurrency-trading'],
        categoryType: 'sub' as const,
        icon: 'Bot',
        metaTitle: 'Cryptocurrency Trading Bots | Automated Crypto Trading',
        metaDescription: 'Professional cryptocurrency trading bots for automated trading on major exchanges.',
        sortOrder: 1
      },
      {
        slug: 'crypto-strategies',
        name: 'Crypto Strategies',
        urlPath: '/cryptocurrency-trading/strategies/',
        parentId: categoryIdMap['cryptocurrency-trading'],
        categoryType: 'sub' as const,
        icon: 'Strategy',
        metaTitle: 'Cryptocurrency Trading Strategies | Crypto Trading Methods',
        metaDescription: 'Proven cryptocurrency trading strategies for profitable crypto trading.',
        sortOrder: 2
      },
      {
        slug: 'crypto-courses',
        name: 'Crypto Courses',
        urlPath: '/cryptocurrency-trading/courses/',
        parentId: categoryIdMap['cryptocurrency-trading'],
        categoryType: 'sub' as const,
        icon: 'GraduationCap',
        metaTitle: 'Cryptocurrency Trading Courses | Blockchain Education',
        metaDescription: 'Professional cryptocurrency and blockchain educational courses.',
        sortOrder: 3
      },
      {
        slug: 'books',
        name: 'Blockchain Books',
        urlPath: '/cryptocurrency-trading/books/',
        parentId: categoryIdMap['cryptocurrency-trading'],
        categoryType: 'sub' as const,
        icon: 'Book',
        metaTitle: 'Blockchain & Cryptocurrency Books | Crypto Literature',
        metaDescription: 'Essential blockchain and cryptocurrency books for traders and investors.',
        sortOrder: 4
      }
    ];
    
    // Subcategories for Online Courses
    const courseSubcategories = [
      {
        slug: 'programming',
        name: 'Programming',
        urlPath: '/online-courses/programming/',
        parentId: categoryIdMap['online-courses'],
        categoryType: 'sub' as const,
        icon: 'Code',
        metaTitle: 'Programming Courses | Learn Coding & Development',
        metaDescription: 'Professional programming and development courses. Learn popular programming languages.',
        sortOrder: 1
      },
      {
        slug: 'business',
        name: 'Online Business',
        urlPath: '/online-courses/business/',
        parentId: categoryIdMap['online-courses'],
        categoryType: 'sub' as const,
        icon: 'Briefcase',
        metaTitle: 'Online Business Courses | Entrepreneurship Training',
        metaDescription: 'Start and grow your online business with professional courses and training.',
        sortOrder: 2
      },
      {
        slug: 'dropshipping',
        name: 'Dropshipping',
        urlPath: '/online-courses/dropshipping/',
        parentId: categoryIdMap['online-courses'],
        categoryType: 'sub' as const,
        icon: 'Package',
        metaTitle: 'Dropshipping Courses | E-commerce Training',
        metaDescription: 'Learn dropshipping and e-commerce with comprehensive training courses.',
        sortOrder: 3
      },
      {
        slug: 'social-media',
        name: 'Social Media Marketing',
        urlPath: '/online-courses/social-media/',
        parentId: categoryIdMap['online-courses'],
        categoryType: 'sub' as const,
        icon: 'Share2',
        metaTitle: 'Social Media Marketing Courses | Digital Marketing',
        metaDescription: 'Master social media marketing with professional courses and strategies.',
        sortOrder: 4
      }
    ];
    
    // Subcategories for Sports Betting
    const sportsSubcategories = [
      {
        slug: 'systems',
        name: 'Betting Systems',
        urlPath: '/sports-betting/systems/',
        parentId: categoryIdMap['sports-betting'],
        categoryType: 'sub' as const,
        icon: 'Calculator',
        metaTitle: 'Sports Betting Systems | Professional Betting Strategies',
        metaDescription: 'Proven sports betting systems and mathematical strategies for consistent profits.',
        sortOrder: 1
      },
      {
        slug: 'betting-courses',
        name: 'Betting Courses',
        urlPath: '/sports-betting/courses/',
        parentId: categoryIdMap['sports-betting'],
        categoryType: 'sub' as const,
        icon: 'GraduationCap',
        metaTitle: 'Sports Betting Courses | Professional Betting Education',
        metaDescription: 'Learn professional sports betting with comprehensive educational courses.',
        sortOrder: 2
      },
      {
        slug: 'tools',
        name: 'Analysis Tools',
        urlPath: '/sports-betting/tools/',
        parentId: categoryIdMap['sports-betting'],
        categoryType: 'sub' as const,
        icon: 'BarChart',
        metaTitle: 'Sports Betting Analysis Tools | Betting Software',
        metaDescription: 'Professional sports betting analysis tools and software for better predictions.',
        sortOrder: 3
      }
    ];
    
    // Insert all subcategories
    const allSubcategories = [
      ...forexSubcategories,
      ...binarySubcategories,
      ...cryptoSubcategories,
      ...courseSubcategories,
      ...sportsSubcategories
    ];
    
    const insertedSubcategories = await db.insert(seoCategories).values(allSubcategories).returning();
    console.log(`Inserted ${insertedSubcategories.length} subcategories`);
    
    // Create redirect mappings for old URLs
    const redirectMappings = [
      // Old category paths to new SEO-friendly paths
      { oldUrl: '/marketplace/ea-library', newUrl: '/forex-trading/expert-advisors/' },
      { oldUrl: '/marketplace/scalping-eas', newUrl: '/forex-trading/expert-advisors/' },
      { oldUrl: '/marketplace/grid-trading-eas', newUrl: '/forex-trading/expert-advisors/' },
      { oldUrl: '/marketplace/trend-following-eas', newUrl: '/forex-trading/expert-advisors/' },
      { oldUrl: '/marketplace/news-trading-eas', newUrl: '/forex-trading/expert-advisors/' },
      { oldUrl: '/marketplace/oscillators-momentum', newUrl: '/forex-trading/indicators/' },
      { oldUrl: '/marketplace/volume-indicators', newUrl: '/forex-trading/indicators/' },
      { oldUrl: '/marketplace/sr-tools', newUrl: '/forex-trading/indicators/' },
      { oldUrl: '/marketplace/template-packs', newUrl: '/forex-trading/indicators/' },
      { oldUrl: '/marketplace/source-code', newUrl: '/forex-trading/source-code/' },
      { oldUrl: '/marketplace/trading-strategies', newUrl: '/forex-trading/strategies/' },
      { oldUrl: '/content/ea', newUrl: '/forex-trading/expert-advisors/' },
      { oldUrl: '/content/indicator', newUrl: '/forex-trading/indicators/' },
      { oldUrl: '/content/source_code', newUrl: '/forex-trading/source-code/' },
    ];
    
    await db.insert(categoryRedirects).values(redirectMappings);
    console.log(`Created ${redirectMappings.length} URL redirects`);
    
    console.log('SEO categories seed completed successfully!');
    return {
      mainCategories: insertedMainCategories.length,
      subcategories: insertedSubcategories.length,
      redirects: redirectMappings.length
    };
    
  } catch (error) {
    console.error('Error seeding SEO categories:', error);
    throw error;
  }
}

// Run the seed function if called directly
seedSeoCategories()
  .then(result => {
    console.log('Seed results:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  });

export default seedSeoCategories;