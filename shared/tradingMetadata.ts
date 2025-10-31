/**
 * Trading Metadata Reference Data
 * Used for thread creation, filtering, and tagging
 */

// Trading Instruments
export const INSTRUMENTS = [
  // Forex Majors
  { value: "EURUSD", label: "EUR/USD", category: "forex" },
  { value: "GBPUSD", label: "GBP/USD", category: "forex" },
  { value: "USDJPY", label: "USD/JPY", category: "forex" },
  { value: "USDCHF", label: "USD/CHF", category: "forex" },
  { value: "AUDUSD", label: "AUD/USD", category: "forex" },
  { value: "USDCAD", label: "USD/CAD", category: "forex" },
  { value: "NZDUSD", label: "NZD/USD", category: "forex" },
  
  // Forex Crosses
  { value: "EURJPY", label: "EUR/JPY", category: "forex" },
  { value: "GBPJPY", label: "GBP/JPY", category: "forex" },
  { value: "EURGBP", label: "EUR/GBP", category: "forex" },
  { value: "AUDJPY", label: "AUD/JPY", category: "forex" },
  
  // Metals (Gold/Silver)
  { value: "XAUUSD", label: "XAU/USD (Gold)", category: "metals" },
  { value: "XAGUSD", label: "XAG/USD (Silver)", category: "metals" },
  
  // Crypto
  { value: "BTCUSD", label: "BTC/USD", category: "crypto" },
  { value: "ETHUSD", label: "ETH/USD", category: "crypto" },
  
  // Indices
  { value: "US30", label: "US30 (Dow Jones)", category: "indices" },
  { value: "NAS100", label: "NAS100 (Nasdaq)", category: "indices" },
  { value: "SPX500", label: "SPX500 (S&P 500)", category: "indices" },
  { value: "UK100", label: "UK100 (FTSE)", category: "indices" },
  { value: "GER40", label: "GER40 (DAX)", category: "indices" },
  { value: "JPN225", label: "JPN225 (Nikkei)", category: "indices" },
  
  // Oil
  { value: "USOIL", label: "US Oil (WTI)", category: "commodities" },
  { value: "UKOIL", label: "UK Oil (Brent)", category: "commodities" },
] as const;

// Trading Timeframes
export const TIMEFRAMES = [
  { value: "M1", label: "M1 (1 Minute)", category: "scalping" },
  { value: "M5", label: "M5 (5 Minutes)", category: "scalping" },
  { value: "M15", label: "M15 (15 Minutes)", category: "day-trading" },
  { value: "M30", label: "M30 (30 Minutes)", category: "day-trading" },
  { value: "H1", label: "H1 (1 Hour)", category: "day-trading" },
  { value: "H4", label: "H4 (4 Hours)", category: "swing" },
  { value: "D1", label: "D1 (Daily)", category: "swing" },
  { value: "W1", label: "W1 (Weekly)", category: "position" },
  { value: "MN1", label: "MN1 (Monthly)", category: "position" },
] as const;

// Trading Strategies
export const STRATEGIES = [
  // Core Strategies
  { value: "scalping", label: "Scalping", description: "Quick trades, small profits" },
  { value: "day-trading", label: "Day Trading", description: "Intraday positions" },
  { value: "swing-trading", label: "Swing Trading", description: "Multi-day positions" },
  { value: "position-trading", label: "Position Trading", description: "Long-term positions" },
  
  // Analysis Methods
  { value: "trend-following", label: "Trend Following", description: "Trade with the trend" },
  { value: "mean-reversion", label: "Mean Reversion", description: "Trade reversals" },
  { value: "breakout", label: "Breakout", description: "Trade breakouts" },
  { value: "range-trading", label: "Range Trading", description: "Trade within ranges" },
  
  // Advanced Strategies
  { value: "grid-trading", label: "Grid Trading", description: "Grid of orders" },
  { value: "martingale", label: "Martingale", description: "Progressive position sizing" },
  { value: "hedging", label: "Hedging", description: "Risk hedging" },
  { value: "arbitrage", label: "Arbitrage", description: "Price differences" },
  
  // News & Events
  { value: "news-trading", label: "News Trading", description: "Trade news events" },
  { value: "fundamental", label: "Fundamental", description: "Economic analysis" },
  
  // Technical Patterns
  { value: "price-action", label: "Price Action", description: "Pure price analysis" },
  { value: "supply-demand", label: "Supply & Demand", description: "S/D zones" },
  { value: "order-blocks", label: "Order Blocks", description: "Institutional levels" },
  { value: "smart-money", label: "Smart Money Concepts", description: "SMC/ICT" },
  
  // Multi-Strategy
  { value: "multi-pair", label: "Multi-Pair", description: "Multiple pairs" },
  { value: "multi-timeframe", label: "Multi-Timeframe", description: "Multiple TFs" },
] as const;

// Trading Platforms
export const PLATFORMS = [
  { value: "MT4", label: "MetaTrader 4 (MT4)" },
  { value: "MT5", label: "MetaTrader 5 (MT5)" },
  { value: "cTrader", label: "cTrader" },
  { value: "TradingView", label: "TradingView" },
  { value: "NinjaTrader", label: "NinjaTrader" },
  { value: "Other", label: "Other" },
] as const;

// Popular Brokers (for autocomplete suggestions)
export const POPULAR_BROKERS = [
  "IC Markets",
  "Pepperstone",
  "XM",
  "FXTM",
  "FBS",
  "Exness",
  "HotForex",
  "OctaFX",
  "Roboforex",
  "Alpari",
  "Admiral Markets",
  "IG",
  "OANDA",
  "Forex.com",
  "Interactive Brokers",
  "Plus500",
  "eToro",
  "AvaTrade",
  "XTB",
  "ThinkMarkets",
] as const;

// Thread Types
export const THREAD_TYPES = [
  {
    value: "question",
    label: "Question",
    description: "Ask for help or advice",
    icon: "HelpCircle",
  },
  {
    value: "discussion",
    label: "Discussion",
    description: "General trading discussion",
    icon: "MessageSquare",
  },
  {
    value: "review",
    label: "Review",
    description: "Review an EA, indicator, or broker",
    icon: "Star",
  },
  {
    value: "journal",
    label: "Journal",
    description: "Share your trading journey",
    icon: "BookOpen",
  },
  {
    value: "guide",
    label: "Guide",
    description: "How-to or tutorial",
    icon: "Lightbulb",
  },
  {
    value: "program_sharing",
    label: "Program Sharing",
    description: "Share EA/indicator/code",
    icon: "Code",
  },
] as const;

// Utility functions
export function getInstrumentsByCategory(category: string) {
  return INSTRUMENTS.filter((i) => i.category === category);
}

export function getTimeframesByCategory(category: string) {
  return TIMEFRAMES.filter((t) => t.category === category);
}

export function getStrategyByValue(value: string) {
  return STRATEGIES.find((s) => s.value === value);
}

export function getPlatformByValue(value: string) {
  return PLATFORMS.find((p) => p.value === value);
}

// Tag extraction from text
export function extractPotentialTags(text: string): string[] {
  const tags: Set<string> = new Set();
  const lowerText = text.toLowerCase();
  
  // Extract instruments
  INSTRUMENTS.forEach((instrument) => {
    if (lowerText.includes(instrument.value.toLowerCase()) || 
        lowerText.includes(instrument.label.toLowerCase().replace(/\//g, ""))) {
      tags.add(instrument.value.toLowerCase());
    }
  });
  
  // Extract timeframes
  TIMEFRAMES.forEach((timeframe) => {
    const regex = new RegExp(`\\b${timeframe.value.toLowerCase()}\\b`, "i");
    if (regex.test(lowerText)) {
      tags.add(timeframe.value.toLowerCase());
    }
  });
  
  // Extract strategies
  STRATEGIES.forEach((strategy) => {
    if (lowerText.includes(strategy.value) || lowerText.includes(strategy.label.toLowerCase())) {
      tags.add(strategy.value);
    }
  });
  
  // Extract platforms
  PLATFORMS.forEach((platform) => {
    if (lowerText.includes(platform.value.toLowerCase())) {
      tags.add(platform.value.toLowerCase());
    }
  });
  
  return Array.from(tags);
}

// Validation
export function validatePrimaryKeyword(keyword: string): boolean {
  const words = keyword.trim().split(/\s+/);
  return words.length >= 1 && words.length <= 6 && /^[a-z0-9\s-]+$/i.test(keyword);
}

export function validateSeoExcerpt(excerpt: string): boolean {
  return excerpt.length >= 120 && excerpt.length <= 160;
}

export function validateHashtag(hashtag: string): boolean {
  const clean = hashtag.replace(/^#/, "");
  return clean.length >= 2 && clean.length <= 24 && /^[a-z0-9-]+$/i.test(clean);
}

// Export types
export type Instrument = typeof INSTRUMENTS[number]["value"];
export type Timeframe = typeof TIMEFRAMES[number]["value"];
export type Strategy = typeof STRATEGIES[number]["value"];
export type Platform = typeof PLATFORMS[number]["value"];
export type ThreadType = typeof THREAD_TYPES[number]["value"];
