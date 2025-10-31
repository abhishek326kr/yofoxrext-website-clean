export type CoinReward = { thread: number; reply: number; upvote: number; accepted: number };

export type SeoMeta = {
  title: string;
  metaDescription: string;
  canonicalPath: string;
  index: boolean;
  sitemapPriority: number;
  hreflangGroup?: string;
};

export type CategoryNode = {
  id: string;
  branch: "global" | "finance";
  slug: string;
  name: string;
  description: string;
  parentSlug?: string;
  allowedContent: Array<"thread" | "article" | "ea" | "indicator">;
  coinReward: CoinReward;
  locales: string[];
  children?: CategoryNode[];
  seo: SeoMeta;
};

export function getCategoryTree(): CategoryNode[] { return [
  // Main Category 1: Forex Trading Robots & EAs 2025
  {
    id: "cat-01",
    branch: "finance",
    slug: "forex-trading-robots-eas-2025",
    name: "Forex Trading Robots & EAs 2025",
    description: "forex robot, best forex brokers 2025, free forex signals, learn forex trading, MT4 MT5 experts",
    allowedContent: ["thread","article","ea","indicator"],
    coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
    locales: ["en","zh","hi","es"],
    seo: {
      title: "Forex Trading Robots & EAs 2025 – YoForex Community",
      metaDescription: "Discover the best forex trading robots and expert advisors for 2025. Free MT4/MT5 EAs, signals, and automated trading strategies.",
      canonicalPath: "/category/forex-trading-robots-eas-2025",
      index: true, sitemapPriority: 0.95,
      hreflangGroup: "forex-trading-robots",
    },
    children: [
      {
        id: "cat-01-01",
        branch: "finance",
        slug: "expert-advisors-trading-robots-mt4-mt5",
        name: "Expert Advisors & Trading Robots",
        description: "MT4/MT5 expert advisors and automated trading robots",
        parentSlug: "forex-trading-robots-eas-2025",
        allowedContent: ["thread","article","ea"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Expert Advisors & Trading Robots MT4/MT5 – YoForex",
          metaDescription: "Download and discuss the best MT4/MT5 expert advisors and trading robots. Free and premium EAs with proven results.",
          canonicalPath: "/category/forex-trading-robots-eas-2025/expert-advisors-trading-robots-mt4-mt5",
          index: true, sitemapPriority: 0.9,
        },
      },
      {
        id: "cat-01-02",
        branch: "finance",
        slug: "forex-indicators-mt4-mt5",
        name: "Forex Indicators MT4/MT5",
        description: "Technical indicators for MetaTrader platforms",
        parentSlug: "forex-trading-robots-eas-2025",
        allowedContent: ["thread","article","indicator"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Forex Indicators MT4/MT5 – YoForex",
          metaDescription: "Download free and premium forex indicators for MT4 and MT5. Custom indicators with alerts and advanced features.",
          canonicalPath: "/category/forex-trading-robots-eas-2025/forex-indicators-mt4-mt5",
          index: true, sitemapPriority: 0.9,
        },
      },
      {
        id: "cat-01-03",
        branch: "finance",
        slug: "source-code-mq4-mq5",
        name: "Source Code MQ4/MQ5",
        description: "MQL4 and MQL5 source code for custom development",
        parentSlug: "forex-trading-robots-eas-2025",
        allowedContent: ["thread","article","ea","indicator"],
        coinReward: { thread: 15, reply: 3, upvote: 1, accepted: 20 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Source Code MQ4/MQ5 – YoForex",
          metaDescription: "MQL4 and MQL5 source code for custom EA and indicator development. Learn programming and modify trading algorithms.",
          canonicalPath: "/category/forex-trading-robots-eas-2025/source-code-mq4-mq5",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-01-04",
        branch: "finance",
        slug: "forex-trading-systems-strategies",
        name: "Forex Trading Systems & Strategies",
        description: "Complete trading systems and proven strategies",
        parentSlug: "forex-trading-robots-eas-2025",
        allowedContent: ["thread","article","ea"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Forex Trading Systems & Strategies – YoForex",
          metaDescription: "Proven forex trading systems and strategies. Scalping, day trading, swing trading setups with real results.",
          canonicalPath: "/category/forex-trading-robots-eas-2025/forex-trading-systems-strategies",
          index: true, sitemapPriority: 0.9,
        },
      },
      {
        id: "cat-01-05",
        branch: "finance",
        slug: "ninjatrader-tools",
        name: "NinjaTrader Tools",
        description: "Indicators and strategies for NinjaTrader platform",
        parentSlug: "forex-trading-robots-eas-2025",
        allowedContent: ["thread","article","ea","indicator"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "NinjaTrader Tools – YoForex",
          metaDescription: "NinjaTrader indicators, strategies, and automated trading tools. Compatible with NinjaTrader 7 and 8.",
          canonicalPath: "/category/forex-trading-robots-eas-2025/ninjatrader-tools",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-01-06",
        branch: "finance",
        slug: "video-courses-forex-training",
        name: "Video Courses & Training",
        description: "Forex trading video courses and educational content",
        parentSlug: "forex-trading-robots-eas-2025",
        allowedContent: ["thread","article"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Video Courses & Forex Training – YoForex",
          metaDescription: "Professional forex trading video courses and training materials. Learn from expert traders and improve your skills.",
          canonicalPath: "/category/forex-trading-robots-eas-2025/video-courses-forex-training",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-01-07",
        branch: "finance",
        slug: "forex-signals-free",
        name: "Forex Signals",
        description: "Free and premium forex trading signals",
        parentSlug: "forex-trading-robots-eas-2025",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Forex Signals Free & Premium – YoForex",
          metaDescription: "Get accurate forex trading signals. Free and premium signal services with real-time alerts and performance tracking.",
          canonicalPath: "/category/forex-trading-robots-eas-2025/forex-signals-free",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-01-08",
        branch: "finance",
        slug: "tradingview-amibroker-thinkorswim-tradestation",
        name: "TradingView/Amibroker/ThinkOrSwim/TradeStation",
        description: "Multi-platform trading tools and scripts",
        parentSlug: "forex-trading-robots-eas-2025",
        allowedContent: ["thread","article","indicator"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "TradingView, Amibroker, ThinkOrSwim & TradeStation Tools – YoForex",
          metaDescription: "Scripts and indicators for TradingView, Amibroker, ThinkOrSwim, and TradeStation platforms.",
          canonicalPath: "/category/forex-trading-robots-eas-2025/tradingview-amibroker-thinkorswim-tradestation",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-01-09",
        branch: "finance",
        slug: "other-forex-tools",
        name: "Other Forex Tools",
        description: "Additional forex trading utilities and resources",
        parentSlug: "forex-trading-robots-eas-2025",
        allowedContent: ["thread","article","ea","indicator"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Other Forex Tools & Utilities – YoForex",
          metaDescription: "Additional forex trading tools, calculators, and utilities to enhance your trading experience.",
          canonicalPath: "/category/forex-trading-robots-eas-2025/other-forex-tools",
          index: true, sitemapPriority: 0.75,
        },
      },
    ],
  },

  // Main Category 2: Binary Options Indicators & Robots
  {
    id: "cat-02",
    branch: "finance",
    slug: "binary-options-indicators-robots",
    name: "Binary Options Indicators & Robots",
    description: "binary options indicators MT4, best binary options strategy, RSI MACD for binary, moving averages binary options",
    allowedContent: ["thread","article","ea","indicator"],
    coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
    locales: ["en","zh","hi","es"],
    seo: {
      title: "Binary Options Indicators & Robots – YoForex",
      metaDescription: "Best binary options indicators and robots for MT4/MT5. Proven strategies with high win rates.",
      canonicalPath: "/category/binary-options-indicators-robots",
      index: true, sitemapPriority: 0.9,
    },
    children: [
      {
        id: "cat-02-01",
        branch: "finance",
        slug: "binary-options-robots-auto-trading",
        name: "Binary Options Robots",
        description: "Automated binary options trading robots",
        parentSlug: "binary-options-indicators-robots",
        allowedContent: ["thread","article","ea"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Binary Options Robots & Auto Trading – YoForex",
          metaDescription: "Automated binary options trading robots with proven results. Free and premium auto-trading solutions.",
          canonicalPath: "/category/binary-options-indicators-robots/binary-options-robots-auto-trading",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-02-02",
        branch: "finance",
        slug: "binary-options-indicators-mt4-mt5",
        name: "Binary Options Indicators MT4/MT5",
        description: "Binary options indicators for MetaTrader",
        parentSlug: "binary-options-indicators-robots",
        allowedContent: ["thread","article","indicator"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Binary Options Indicators MT4/MT5 – YoForex",
          metaDescription: "Accurate binary options indicators for MT4 and MT5. Arrow indicators with alerts and high accuracy.",
          canonicalPath: "/category/binary-options-indicators-robots/binary-options-indicators-mt4-mt5",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-02-03",
        branch: "finance",
        slug: "binary-options-trading-systems-strategies",
        name: "Binary Options Trading Systems & Strategies",
        description: "Complete binary options trading systems",
        parentSlug: "binary-options-indicators-robots",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Binary Options Trading Systems & Strategies – YoForex",
          metaDescription: "Complete binary options trading systems and winning strategies. 60 seconds, 5 minutes, and daily expiry strategies.",
          canonicalPath: "/category/binary-options-indicators-robots/binary-options-trading-systems-strategies",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-02-04",
        branch: "finance",
        slug: "binary-options-video-courses-training",
        name: "Video Courses & Training",
        description: "Binary options educational videos",
        parentSlug: "binary-options-indicators-robots",
        allowedContent: ["thread","article"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Binary Options Video Courses & Training – YoForex",
          metaDescription: "Learn binary options trading with professional video courses. From beginner to advanced strategies.",
          canonicalPath: "/category/binary-options-indicators-robots/binary-options-video-courses-training",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-02-05",
        branch: "finance",
        slug: "nadex-thinkorswim-binary-tools",
        name: "Nadex/ThinkOrSwim Tools",
        description: "Tools for Nadex and ThinkOrSwim platforms",
        parentSlug: "binary-options-indicators-robots",
        allowedContent: ["thread","article","indicator"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Nadex & ThinkOrSwim Binary Tools – YoForex",
          metaDescription: "Specialized tools and strategies for Nadex and ThinkOrSwim binary options trading.",
          canonicalPath: "/category/binary-options-indicators-robots/nadex-thinkorswim-binary-tools",
          index: true, sitemapPriority: 0.75,
        },
      },
      {
        id: "cat-02-06",
        branch: "finance",
        slug: "other-binary-options-tools",
        name: "Other Binary Tools",
        description: "Additional binary options resources",
        parentSlug: "binary-options-indicators-robots",
        allowedContent: ["thread","article","ea","indicator"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Other Binary Options Tools – YoForex",
          metaDescription: "Additional binary options tools, calculators, and resources for successful trading.",
          canonicalPath: "/category/binary-options-indicators-robots/other-binary-options-tools",
          index: true, sitemapPriority: 0.7,
        },
      },
    ],
  },

  // Main Category 3: Crypto Trading Strategies & EAs
  {
    id: "cat-03",
    branch: "finance",
    slug: "crypto-trading-strategies-eas",
    name: "Crypto Trading Strategies & EAs",
    description: "crypto trading strategies, best crypto exchange, crypto ETF, blockchain trading robots, ada crypto signals",
    allowedContent: ["thread","article","ea","indicator"],
    coinReward: { thread: 12, reply: 3, upvote: 1, accepted: 18 },
    locales: ["en","zh","hi","es"],
    seo: {
      title: "Crypto Trading Strategies & EAs – YoForex",
      metaDescription: "Cryptocurrency trading strategies, robots, and signals. Bitcoin, Ethereum, and altcoin automated trading.",
      canonicalPath: "/category/crypto-trading-strategies-eas",
      index: true, sitemapPriority: 0.9,
    },
    children: [
      {
        id: "cat-03-01",
        branch: "finance",
        slug: "crypto-expert-advisors-robots-mt4-mt5",
        name: "Expert Advisors & Trading Robots MT4/MT5",
        description: "Crypto trading robots for MetaTrader",
        parentSlug: "crypto-trading-strategies-eas",
        allowedContent: ["thread","article","ea"],
        coinReward: { thread: 12, reply: 3, upvote: 1, accepted: 18 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Crypto Expert Advisors & Robots MT4/MT5 – YoForex",
          metaDescription: "Automated crypto trading robots for MT4/MT5. Trade Bitcoin, Ethereum, and altcoins automatically.",
          canonicalPath: "/category/crypto-trading-strategies-eas/crypto-expert-advisors-robots-mt4-mt5",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-03-02",
        branch: "finance",
        slug: "crypto-trading-systems-strategies",
        name: "Crypto Trading Systems & Strategies",
        description: "Cryptocurrency trading systems",
        parentSlug: "crypto-trading-strategies-eas",
        allowedContent: ["thread","article"],
        coinReward: { thread: 12, reply: 3, upvote: 1, accepted: 18 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Crypto Trading Systems & Strategies – YoForex",
          metaDescription: "Proven cryptocurrency trading systems and strategies. DeFi, arbitrage, and algorithmic crypto trading.",
          canonicalPath: "/category/crypto-trading-strategies-eas/crypto-trading-systems-strategies",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-03-03",
        branch: "finance",
        slug: "crypto-video-courses-training",
        name: "Video Courses & Training",
        description: "Cryptocurrency trading education",
        parentSlug: "crypto-trading-strategies-eas",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Crypto Video Courses & Training – YoForex",
          metaDescription: "Learn cryptocurrency trading with professional video courses. Blockchain, DeFi, and trading strategies.",
          canonicalPath: "/category/crypto-trading-strategies-eas/crypto-video-courses-training",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-03-04",
        branch: "finance",
        slug: "crypto-software-tools",
        name: "Crypto Software & Tools",
        description: "Cryptocurrency trading software",
        parentSlug: "crypto-trading-strategies-eas",
        allowedContent: ["thread","article","ea","indicator"],
        coinReward: { thread: 12, reply: 3, upvote: 1, accepted: 18 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Crypto Software & Tools – YoForex",
          metaDescription: "Cryptocurrency trading software, bots, and analysis tools. Portfolio trackers and market scanners.",
          canonicalPath: "/category/crypto-trading-strategies-eas/crypto-software-tools",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-03-05",
        branch: "finance",
        slug: "books-cryptocurrencies-blockchain",
        name: "Books on Cryptocurrencies & Blockchain",
        description: "Educational books on crypto and blockchain",
        parentSlug: "crypto-trading-strategies-eas",
        allowedContent: ["thread","article"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Books on Cryptocurrencies & Blockchain – YoForex",
          metaDescription: "Essential books on cryptocurrency trading, blockchain technology, and DeFi innovations.",
          canonicalPath: "/category/crypto-trading-strategies-eas/books-cryptocurrencies-blockchain",
          index: true, sitemapPriority: 0.75,
        },
      },
      {
        id: "cat-03-06",
        branch: "finance",
        slug: "other-crypto-resources",
        name: "Other Crypto Resources",
        description: "Additional cryptocurrency resources",
        parentSlug: "crypto-trading-strategies-eas",
        allowedContent: ["thread","article","ea","indicator"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Other Crypto Resources – YoForex",
          metaDescription: "Additional cryptocurrency resources, tools, and materials for successful crypto trading.",
          canonicalPath: "/category/crypto-trading-strategies-eas/other-crypto-resources",
          index: true, sitemapPriority: 0.7,
        },
      },
    ],
  },

  // Main Category 4: Online Trading Courses & Books
  {
    id: "cat-04",
    branch: "finance",
    slug: "online-trading-courses-books",
    name: "Online Trading Courses & Books",
    description: "online forex courses, AI trading neural networks, dropshipping training, amazon ebay strategies",
    allowedContent: ["thread","article"],
    coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
    locales: ["en","zh","hi","es"],
    seo: {
      title: "Online Trading Courses & Books – YoForex",
      metaDescription: "Professional trading courses, books, and educational materials. Learn forex, crypto, stocks, and online business.",
      canonicalPath: "/category/online-trading-courses-books",
      index: true, sitemapPriority: 0.9,
    },
    children: [
      {
        id: "cat-04-01",
        branch: "finance",
        slug: "development-it-programming-courses",
        name: "Development, IT & Programming",
        description: "Programming and IT courses for traders",
        parentSlug: "online-trading-courses-books",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Development, IT & Programming Courses – YoForex",
          metaDescription: "Learn programming for trading. Python, MQL, JavaScript, and AI development for financial markets.",
          canonicalPath: "/category/online-trading-courses-books/development-it-programming-courses",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-04-02",
        branch: "finance",
        slug: "reverse-engineering-training",
        name: "Reverse Engineering Tools",
        description: "Reverse engineering tools and training",
        parentSlug: "online-trading-courses-books",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Reverse Engineering Tools & Training – YoForex",
          metaDescription: "Learn reverse engineering for trading systems analysis and optimization.",
          canonicalPath: "/category/online-trading-courses-books/reverse-engineering-training",
          index: true, sitemapPriority: 0.75,
        },
      },
      {
        id: "cat-04-03",
        branch: "finance",
        slug: "online-business-dropshipping",
        name: "Online Business & Dropshipping",
        description: "E-commerce and dropshipping strategies",
        parentSlug: "online-trading-courses-books",
        allowedContent: ["thread","article"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Online Business & Dropshipping – YoForex",
          metaDescription: "Learn e-commerce, dropshipping, and online business strategies. Build profitable online stores.",
          canonicalPath: "/category/online-trading-courses-books/online-business-dropshipping",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-04-04",
        branch: "finance",
        slug: "amazon-aliexpress-ebay-strategies",
        name: "Amazon/AliExpress/eBay Strategies",
        description: "E-commerce platform strategies",
        parentSlug: "online-trading-courses-books",
        allowedContent: ["thread","article"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Amazon, AliExpress & eBay Strategies – YoForex",
          metaDescription: "Master selling on Amazon, AliExpress, and eBay. FBA, product research, and marketplace optimization.",
          canonicalPath: "/category/online-trading-courses-books/amazon-aliexpress-ebay-strategies",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-04-05",
        branch: "finance",
        slug: "ai-neural-networks-trading",
        name: "Artificial Intelligence & Neural Networks",
        description: "AI and machine learning for trading",
        parentSlug: "online-trading-courses-books",
        allowedContent: ["thread","article"],
        coinReward: { thread: 12, reply: 3, upvote: 1, accepted: 18 },
        locales: ["en"],
        seo: {
          title: "AI & Neural Networks Trading – YoForex",
          metaDescription: "Learn AI and machine learning for trading. Neural networks, deep learning, and algorithmic trading.",
          canonicalPath: "/category/online-trading-courses-books/ai-neural-networks-trading",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-04-06",
        branch: "finance",
        slug: "social-media-marketing-facebook-tiktok",
        name: "Facebook/TikTok/Instagram/YouTube Marketing",
        description: "Social media marketing strategies",
        parentSlug: "online-trading-courses-books",
        allowedContent: ["thread","article"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Social Media Marketing – Facebook, TikTok, Instagram, YouTube – YoForex",
          metaDescription: "Master social media marketing on Facebook, TikTok, Instagram, and YouTube. Growth hacking and monetization.",
          canonicalPath: "/category/online-trading-courses-books/social-media-marketing-facebook-tiktok",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-04-07",
        branch: "finance",
        slug: "other-trading-training-materials",
        name: "Other Training Materials",
        description: "Additional educational resources",
        parentSlug: "online-trading-courses-books",
        allowedContent: ["thread","article"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Other Trading Training Materials – YoForex",
          metaDescription: "Additional trading courses, books, and educational resources for continuous learning.",
          canonicalPath: "/category/online-trading-courses-books/other-trading-training-materials",
          index: true, sitemapPriority: 0.7,
        },
      },
    ],
  },

  // Main Category 5: Sports Betting Strategies & Arbitrage
  {
    id: "cat-05",
    branch: "finance",
    slug: "sports-betting-strategies-arbitrage",
    name: "Sports Betting Strategies & Arbitrage",
    description: "sports betting strategies, arbitrage betting, value betting sports, bankroll management betting, bet365 draftkings strategies",
    allowedContent: ["thread","article"],
    coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
    locales: ["en"],
    seo: {
      title: "Sports Betting Strategies & Arbitrage – YoForex",
      metaDescription: "Professional sports betting strategies, arbitrage systems, and value betting techniques.",
      canonicalPath: "/category/sports-betting-strategies-arbitrage",
      index: true, sitemapPriority: 0.85,
    },
    children: [
      {
        id: "cat-05-01",
        branch: "finance",
        slug: "sports-betting-financial-strategies",
        name: "Financial Systems & Sports Betting Strategies",
        description: "Sports betting financial strategies",
        parentSlug: "sports-betting-strategies-arbitrage",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Sports Betting Financial Strategies – YoForex",
          metaDescription: "Financial systems and money management for sports betting. Bankroll strategies and risk management.",
          canonicalPath: "/category/sports-betting-strategies-arbitrage/sports-betting-financial-strategies",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-05-02",
        branch: "finance",
        slug: "sports-betting-video-courses-webinars",
        name: "Video Courses & Webinars",
        description: "Sports betting educational content",
        parentSlug: "sports-betting-strategies-arbitrage",
        allowedContent: ["thread","article"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en"],
        seo: {
          title: "Sports Betting Video Courses & Webinars – YoForex",
          metaDescription: "Learn sports betting with professional video courses and live webinars.",
          canonicalPath: "/category/sports-betting-strategies-arbitrage/sports-betting-video-courses-webinars",
          index: true, sitemapPriority: 0.75,
        },
      },
      {
        id: "cat-05-03",
        branch: "finance",
        slug: "sports-betting-analysis-programs",
        name: "Programs for Sports Betting Analysis",
        description: "Sports betting analysis software",
        parentSlug: "sports-betting-strategies-arbitrage",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Sports Betting Analysis Programs – YoForex",
          metaDescription: "Advanced software and tools for sports betting analysis, statistics, and predictions.",
          canonicalPath: "/category/sports-betting-strategies-arbitrage/sports-betting-analysis-programs",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-05-04",
        branch: "finance",
        slug: "paid-sports-forecasts-bet365-draftkings",
        name: "Paid Sports Forecasts",
        description: "Premium sports betting predictions",
        parentSlug: "sports-betting-strategies-arbitrage",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Paid Sports Forecasts – Bet365, DraftKings – YoForex",
          metaDescription: "Premium sports betting predictions and forecasts for major betting platforms.",
          canonicalPath: "/category/sports-betting-strategies-arbitrage/paid-sports-forecasts-bet365-draftkings",
          index: true, sitemapPriority: 0.75,
        },
      },
    ],
  },

  // Main Category 6: Casino & Poker Software Strategies
  {
    id: "cat-06",
    branch: "finance",
    slug: "casino-poker-software-strategies",
    name: "Casino & Poker Software Strategies",
    description: "online casino bonuses, poker software free, play slots online, casino poker strategies, real money poker apps",
    allowedContent: ["thread","article"],
    coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
    locales: ["en"],
    seo: {
      title: "Casino & Poker Software Strategies – YoForex",
      metaDescription: "Casino strategies, poker software, and gambling systems. Win at online casinos and poker rooms.",
      canonicalPath: "/category/casino-poker-software-strategies",
      index: true, sitemapPriority: 0.8,
    },
    children: [
      {
        id: "cat-06-01",
        branch: "finance",
        slug: "casino-strategies-online-slots",
        name: "Casino Strategies",
        description: "Online casino winning strategies",
        parentSlug: "casino-poker-software-strategies",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Casino Strategies & Online Slots – YoForex",
          metaDescription: "Winning strategies for online casinos, slots, roulette, blackjack, and more.",
          canonicalPath: "/category/casino-poker-software-strategies/casino-strategies-online-slots",
          index: true, sitemapPriority: 0.75,
        },
      },
      {
        id: "cat-06-02",
        branch: "finance",
        slug: "poker-software-tools-free",
        name: "Poker Software & Tools",
        description: "Poker analysis and training software",
        parentSlug: "casino-poker-software-strategies",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Poker Software & Tools Free – YoForex",
          metaDescription: "Professional poker software, HUDs, trackers, and training tools for online poker success.",
          canonicalPath: "/category/casino-poker-software-strategies/poker-software-tools-free",
          index: true, sitemapPriority: 0.75,
        },
      },
      {
        id: "cat-06-03",
        branch: "finance",
        slug: "casino-forex-crypto-poker",
        name: "Forex/Crypto Integration",
        description: "Combined casino and trading strategies",
        parentSlug: "casino-poker-software-strategies",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Casino Forex & Crypto Integration – YoForex",
          metaDescription: "Combine casino strategies with forex and crypto trading for diversified income.",
          canonicalPath: "/category/casino-poker-software-strategies/casino-forex-crypto-poker",
          index: true, sitemapPriority: 0.7,
        },
      },
      {
        id: "cat-06-04",
        branch: "finance",
        slug: "binary-options-casino",
        name: "Binary Options in Casino",
        description: "Binary options casino strategies",
        parentSlug: "casino-poker-software-strategies",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Binary Options Casino Strategies – YoForex",
          metaDescription: "Binary options strategies adapted for casino-style trading platforms.",
          canonicalPath: "/category/casino-poker-software-strategies/binary-options-casino",
          index: true, sitemapPriority: 0.7,
        },
      },
      {
        id: "cat-06-05",
        branch: "finance",
        slug: "sports-betting-casino",
        name: "Sports Betting Casino Links",
        description: "Combined sports betting and casino",
        parentSlug: "casino-poker-software-strategies",
        allowedContent: ["thread","article"],
        coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
        locales: ["en"],
        seo: {
          title: "Sports Betting & Casino Combined – YoForex",
          metaDescription: "Strategies for platforms combining sports betting and casino games.",
          canonicalPath: "/category/casino-poker-software-strategies/sports-betting-casino",
          index: true, sitemapPriority: 0.7,
        },
      },
      {
        id: "cat-06-06",
        branch: "finance",
        slug: "other-casino-poker-tools",
        name: "Other Gambling Tools",
        description: "Additional gambling resources",
        parentSlug: "casino-poker-software-strategies",
        allowedContent: ["thread","article"],
        coinReward: { thread: 8, reply: 2, upvote: 1, accepted: 12 },
        locales: ["en"],
        seo: {
          title: "Other Casino & Poker Tools – YoForex",
          metaDescription: "Additional gambling tools, calculators, and resources for casino and poker players.",
          canonicalPath: "/category/casino-poker-software-strategies/other-casino-poker-tools",
          index: true, sitemapPriority: 0.65,
        },
      },
    ],
  },

  // Main Category 7: Trading Community Chat
  {
    id: "cat-07",
    branch: "global",
    slug: "trading-community-chat",
    name: "Trading Community Chat",
    description: "forex forum discussion, crypto trading chat, binary options community",
    allowedContent: ["thread"],
    coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 10 },
    locales: ["en","zh","hi","es"],
    seo: {
      title: "Trading Community Chat – YoForex",
      metaDescription: "Join the trading community discussion. Share experiences, ask questions, and connect with traders worldwide.",
      canonicalPath: "/category/trading-community-chat",
      index: true, sitemapPriority: 0.85,
    },
    children: [
      {
        id: "cat-07-01",
        branch: "global",
        slug: "free-trading-communication-topics",
        name: "Free Communication on Trading Topics",
        description: "Open discussion on all trading topics",
        parentSlug: "trading-community-chat",
        allowedContent: ["thread"],
        coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 10 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Free Trading Communication – YoForex",
          metaDescription: "Open forum for all trading topics. Share ideas, strategies, and market analysis freely.",
          canonicalPath: "/category/trading-community-chat/free-trading-communication-topics",
          index: true, sitemapPriority: 0.8,
        },
      },
    ],
  },

  // Main Category 8: Scam Alerts & Broker Warnings
  {
    id: "cat-08",
    branch: "global",
    slug: "scam-alerts-broker-warnings",
    name: "Scam Alerts & Broker Warnings",
    description: "scam forex brokers, binary options scams 2025, crypto scam signals",
    allowedContent: ["thread","article"],
    coinReward: { thread: 15, reply: 3, upvote: 2, accepted: 20 },
    locales: ["en","zh","hi","es"],
    seo: {
      title: "Scam Alerts & Broker Warnings – YoForex",
      metaDescription: "Report and avoid trading scams. Broker warnings, scam alerts, and fraud prevention in forex, crypto, and binary options.",
      canonicalPath: "/category/scam-alerts-broker-warnings",
      index: true, sitemapPriority: 0.9,
    },
    children: [
      {
        id: "cat-08-01",
        branch: "global",
        slug: "seller-scams-trading",
        name: "Seller Scams",
        description: "Warning about seller scams in trading",
        parentSlug: "scam-alerts-broker-warnings",
        allowedContent: ["thread","article"],
        coinReward: { thread: 15, reply: 3, upvote: 2, accepted: 20 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Seller Scams Warning – YoForex",
          metaDescription: "Report and avoid seller scams. Fake EA vendors, signal scams, and fraudulent course sellers.",
          canonicalPath: "/category/scam-alerts-broker-warnings/seller-scams-trading",
          index: true, sitemapPriority: 0.85,
        },
      },
      {
        id: "cat-08-02",
        branch: "global",
        slug: "scam-brokers-signals",
        name: "Scam Brokers & Signals",
        description: "Warning about scam brokers and signal services",
        parentSlug: "scam-alerts-broker-warnings",
        allowedContent: ["thread","article"],
        coinReward: { thread: 15, reply: 3, upvote: 2, accepted: 20 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Scam Brokers & Signals Warning – YoForex",
          metaDescription: "Blacklisted brokers and scam signal services. Protect your funds from fraudulent platforms.",
          canonicalPath: "/category/scam-alerts-broker-warnings/scam-brokers-signals",
          index: true, sitemapPriority: 0.85,
        },
      },
    ],
  },

  // Main Category 9: YoForex Guides & Rules
  {
    id: "cat-09",
    branch: "global",
    slug: "yoforex-guides-rules",
    name: "YoForex Guides & Rules",
    description: "how forex trading works, forum rules 2025, yoforex beginner guide",
    allowedContent: ["thread","article"],
    coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 8 },
    locales: ["en","zh","hi","es"],
    seo: {
      title: "YoForex Guides & Rules – Platform Help",
      metaDescription: "Learn how to use YoForex platform. Forum rules, guidelines, tutorials, and getting started guides.",
      canonicalPath: "/category/yoforex-guides-rules",
      index: true, sitemapPriority: 0.8,
    },
    children: [
      {
        id: "cat-09-01",
        branch: "global",
        slug: "how-yoforex-works",
        name: "How It Works",
        description: "Guide to using YoForex platform",
        parentSlug: "yoforex-guides-rules",
        allowedContent: ["thread","article"],
        coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 8 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "How YoForex Works – Platform Guide",
          metaDescription: "Complete guide to using YoForex. Earn coins, download EAs, participate in discussions, and grow your trading.",
          canonicalPath: "/category/yoforex-guides-rules/how-yoforex-works",
          index: true, sitemapPriority: 0.75,
        },
      },
      {
        id: "cat-09-02",
        branch: "global",
        slug: "forum-rules-regulations",
        name: "Rules & Regulations",
        description: "Forum rules and community guidelines",
        parentSlug: "yoforex-guides-rules",
        allowedContent: ["thread","article"],
        coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 8 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Forum Rules & Regulations – YoForex",
          metaDescription: "YoForex community rules and guidelines. Keep the forum safe and productive for all traders.",
          canonicalPath: "/category/yoforex-guides-rules/forum-rules-regulations",
          index: true, sitemapPriority: 0.75,
        },
      },
    ],
  },

  // Main Category 10: Our Trusted Partners
  {
    id: "cat-10",
    branch: "global",
    slug: "our-trusted-partners",
    name: "Our Trusted Partners",
    description: "best forex partners, crypto affiliate programs, sports betting partners",
    allowedContent: ["thread","article"],
    coinReward: { thread: 10, reply: 2, upvote: 1, accepted: 15 },
    locales: ["en"],
    seo: {
      title: "Our Trusted Partners – YoForex",
      metaDescription: "Verified partners and affiliate programs. Trusted brokers, signal providers, and service partners.",
      canonicalPath: "/category/our-trusted-partners",
      index: true, sitemapPriority: 0.75,
    },
    children: [], // No subcategories as specified
  },

  // Main Category 11: Free Downloads & Tools
  {
    id: "cat-11",
    branch: "finance",
    slug: "free-downloads-tools",
    name: "Free Downloads & Tools",
    description: "free forex indicators download, binary robots free, crypto signals free",
    allowedContent: ["thread","article","ea","indicator"],
    coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 8 },
    locales: ["en","zh","hi","es"],
    seo: {
      title: "Free Downloads & Tools – YoForex",
      metaDescription: "Download free forex indicators, EAs, binary options tools, and crypto resources. No cost trading tools.",
      canonicalPath: "/category/free-downloads-tools",
      index: true, sitemapPriority: 0.85,
    },
    children: [
      {
        id: "cat-11-01",
        branch: "finance",
        slug: "free-forex-downloads",
        name: "Free Forex Tools",
        description: "Free forex indicators and EAs",
        parentSlug: "free-downloads-tools",
        allowedContent: ["thread","article","ea","indicator"],
        coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 8 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Free Forex Downloads – YoForex",
          metaDescription: "Download free forex indicators, EAs, and trading tools. No registration required.",
          canonicalPath: "/category/free-downloads-tools/free-forex-downloads",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-11-02",
        branch: "finance",
        slug: "free-binary-downloads",
        name: "Free Binary Options",
        description: "Free binary options tools",
        parentSlug: "free-downloads-tools",
        allowedContent: ["thread","article","indicator"],
        coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 8 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Free Binary Options Downloads – YoForex",
          metaDescription: "Free binary options indicators and tools. Download without registration.",
          canonicalPath: "/category/free-downloads-tools/free-binary-downloads",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-11-03",
        branch: "finance",
        slug: "free-sports-betting-tools",
        name: "Free Sports Betting",
        description: "Free sports betting resources",
        parentSlug: "free-downloads-tools",
        allowedContent: ["thread","article"],
        coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 8 },
        locales: ["en"],
        seo: {
          title: "Free Sports Betting Tools – YoForex",
          metaDescription: "Free sports betting calculators, strategies, and analysis tools.",
          canonicalPath: "/category/free-downloads-tools/free-sports-betting-tools",
          index: true, sitemapPriority: 0.75,
        },
      },
      {
        id: "cat-11-04",
        branch: "finance",
        slug: "free-crypto-downloads",
        name: "Free Crypto Resources",
        description: "Free cryptocurrency tools",
        parentSlug: "free-downloads-tools",
        allowedContent: ["thread","article","ea","indicator"],
        coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 8 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Free Crypto Downloads – YoForex",
          metaDescription: "Free cryptocurrency trading tools, bots, and indicators. Download without cost.",
          canonicalPath: "/category/free-downloads-tools/free-crypto-downloads",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-11-05",
        branch: "finance",
        slug: "free-trading-courses-books",
        name: "Free Courses & Books",
        description: "Free educational materials",
        parentSlug: "free-downloads-tools",
        allowedContent: ["thread","article"],
        coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 8 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Free Trading Courses & Books – YoForex",
          metaDescription: "Free trading courses, ebooks, and educational materials. Learn without paying.",
          canonicalPath: "/category/free-downloads-tools/free-trading-courses-books",
          index: true, sitemapPriority: 0.8,
        },
      },
      {
        id: "cat-11-06",
        branch: "finance",
        slug: "other-free-trading-tools",
        name: "Other Freebies",
        description: "Other free trading resources",
        parentSlug: "free-downloads-tools",
        allowedContent: ["thread","article","ea","indicator"],
        coinReward: { thread: 5, reply: 1, upvote: 1, accepted: 8 },
        locales: ["en","zh","hi","es"],
        seo: {
          title: "Other Free Trading Tools – YoForex",
          metaDescription: "Miscellaneous free trading resources, tools, and utilities for all markets.",
          canonicalPath: "/category/free-downloads-tools/other-free-trading-tools",
          index: true, sitemapPriority: 0.75,
        },
      },
    ],
  },
]; }

// Helper function to get all categories as a flat list
export function getAllCategories(): CategoryNode[] {
  const tree = getCategoryTree();
  const allCategories: CategoryNode[] = [];
  
  function traverse(nodes: CategoryNode[]) {
    for (const node of nodes) {
      allCategories.push(node);
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  return allCategories;
}

// Helper function to find a category by slug
export function getCategoryBySlug(slug: string): CategoryNode | undefined {
  const allCategories = getAllCategories();
  return allCategories.find(cat => cat.slug === slug);
}

// Helper function to get category breadcrumbs
export function getCategoryBreadcrumbs(slug: string): CategoryNode[] {
  const category = getCategoryBySlug(slug);
  if (!category) return [];
  
  const breadcrumbs: CategoryNode[] = [category];
  let current = category;
  
  while (current.parentSlug) {
    const parent = getCategoryBySlug(current.parentSlug);
    if (parent) {
      breadcrumbs.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }
  
  return breadcrumbs;
}