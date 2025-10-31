import { db } from "../server/db";
import { forumCategories } from "../shared/schema";
import { getCategoryTree, getAllCategories } from "../app/lib/categoryTree";

async function seedCategories() {
  console.log("🌱 Starting category tree seeding...");
  
  try {
    // Get all categories from the tree (flattened)
    const allCategories = getAllCategories();
    
    console.log(`📦 Found ${allCategories.length} categories to seed`);
    
    // Seed each category
    for (const cat of allCategories) {
      const categoryData = {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: getIconForCategory(cat.slug),
        color: getColorForCategory(cat.slug),
        parentSlug: cat.parentSlug || null,
        threadCount: 0,
        postCount: 0,
        sortOrder: 0,
        isActive: true,
      };
      
      // Upsert category (insert or update if exists)
      await db
        .insert(forumCategories)
        .values(categoryData)
        .onConflictDoUpdate({
          target: forumCategories.slug,
          set: {
            name: categoryData.name,
            description: categoryData.description,
            parentSlug: categoryData.parentSlug,
            icon: categoryData.icon,
            color: categoryData.color,
          },
        });
      
      console.log(`✅ Seeded: ${cat.name} (${cat.slug})`);
    }
    
    console.log(`\n🎉 Successfully seeded ${allCategories.length} categories!`);
    
    // Print tree structure
    console.log("\n📊 Category Tree Structure:");
    const tree = getCategoryTree();
    for (const main of tree) {
      console.log(`\n${main.name} (${main.slug})`);
      if (main.children) {
        for (const sub of main.children) {
          console.log(`  ├─ ${sub.name} (${sub.slug})`);
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    throw error;
  }
}

// Icon mapping for categories
function getIconForCategory(slug: string): string {
  const iconMap: Record<string, string> = {
    "trading-strategies": "TrendingUp",
    "ea-library": "Bot",
    "indicators-templates": "Activity",
    "broker-reviews": "Building2",
    "coding-dev": "Code2",
    "education": "GraduationCap",
    "journals-performance": "LineChart",
    "tools-services": "Wrench",
    
    // Subcategories
    "scalping-m1-m15": "Zap",
    "xauusd-scalping": "Coins",
    "eurusd-scalping": "Euro",
    "crypto-scalping": "Bitcoin",
    "news-scalping": "Newspaper",
    "day-trading": "Sun",
    "swing-trading": "TrendingUp",
    "position-trading": "Target",
    "grid-martingale": "Grid3x3",
    "hedging": "Shield",
    "multi-pair-correlation": "Network",
    
    "scalping-eas": "Zap",
    "grid-trading-eas": "Grid3x3",
    "trend-following-eas": "TrendingUp",
    "breakout-eas": "CircleDot",
    "news-trading-eas": "Newspaper",
    "mt4-eas": "Terminal",
    "mt5-eas": "Terminal",
    "ctrader-robots": "Bot",
    "free-eas-0": "Gift",
    "budget-eas-50-100": "DollarSign",
    "premium-eas-200-500": "Crown",
    
    "trend-indicators": "TrendingUp",
    "oscillators-momentum": "Activity",
    "volume-indicators": "BarChart3",
    "sr-tools": "Ruler",
    "template-packs": "Package",
    
    "ecn-brokers": "Building2",
    "market-maker-brokers": "Building",
    "low-spread-brokers": "TrendingDown",
    "high-leverage-brokers": "TrendingUp",
    "regulated-brokers": "Shield",
    "scam-watch": "AlertTriangle",
    
    "mql4": "Code",
    "mql5": "Code2",
    "python-bots": "FileCode",
    "strategy-backtesting": "TestTube",
    "freelance-requests": "Users",
    
    "beginners-corner": "BookOpen",
    "technical-analysis": "LineChart",
    "fundamental-analysis": "FileText",
    "risk-management": "Shield",
    "trading-psychology": "Brain",
    
    "live-trading-journals": "BookOpen",
    "ea-performance-reports": "BarChart",
    "backtest-results": "TestTube2",
    "forward-test-results": "ArrowRight",
    
    "vps-services": "Server",
    "trade-copiers": "Copy",
    "signal-services": "Radio",
    "calculators-utilities": "Calculator",
  };
  
  return iconMap[slug] || "Folder";
}

// Color mapping for categories
function getColorForCategory(slug: string): string {
  const colorMap: Record<string, string> = {
    "trading-strategies": "bg-blue-500",
    "ea-library": "bg-purple-500",
    "indicators-templates": "bg-green-500",
    "broker-reviews": "bg-orange-500",
    "coding-dev": "bg-indigo-500",
    "education": "bg-yellow-500",
    "journals-performance": "bg-pink-500",
    "tools-services": "bg-cyan-500",
  };
  
  return colorMap[slug] || "bg-primary";
}

// Run the seeding
seedCategories()
  .then(() => {
    console.log("\n✨ Category seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Category seeding failed:", error);
    process.exit(1);
  });
