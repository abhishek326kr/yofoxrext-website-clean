/**
 * SEO Utilities Module
 * Provides comprehensive SEO analysis and optimization functions for trading/forex content
 */

/**
 * Common stop words to filter out during keyword analysis
 */
export const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was',
  'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'in', 'for', 'with', 'by', 'from', 'up', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
  'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
  'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
]);

/**
 * Popular hashtags in the trading/forex community
 */
export const POPULAR_HASHTAGS = [
  '#forex', '#trading', '#forextrader', '#forexsignals', '#forexlifestyle',
  '#daytrading', '#swingtrading', '#scalping', '#technicalanalysis', '#fundamentalanalysis',
  '#eurusd', '#gbpusd', '#xauusd', '#gold', '#usdjpy', '#audusd', '#nzdusd',
  '#cryptocurrency', '#bitcoin', '#ethereum', '#stocks', '#indices', '#commodities',
  '#pips', '#profit', '#stoploss', '#takeprofit', '#riskmanagement', '#moneymanagement',
  '#mt4', '#mt5', '#tradingview', '#ea', '#expertadvisor', '#algotrading',
  '#forexmarket', '#currencytrading', '#fxtrading', '#forexeducation', '#tradingstrategy'
];

/**
 * Extract the primary keyword/phrase from title and body text
 * @param title - The title text to analyze
 * @param body - The body text to analyze
 * @returns The most relevant keyword/phrase (1-3 words)
 */
export function extractPrimaryKeyword(title: string, body: string): string {
  const combinedText = `${title} ${body}`.toLowerCase();
  const words = combinedText.match(/[a-z0-9]+/gi) || [];
  
  // If body is too short (less than 20 words), fall back to title analysis
  if (body.split(/\s+/).length < 20) {
    // Extract first 3 nouns from title
    const titleWords = title.toLowerCase().split(/\s+/);
    const nouns = titleWords.filter(word => 
      word.length > 3 && 
      !STOP_WORDS.has(word) &&
      /^[a-z]+$/i.test(word)
    ).slice(0, 3);
    
    if (nouns.length > 0) {
      return nouns.join(' ');
    }
  }
  
  // Word frequency analysis
  const wordFreq = new Map<string, number>();
  const phraseFreq = new Map<string, number>();
  
  // Count single words
  words.forEach(word => {
    if (!STOP_WORDS.has(word) && word.length > 3) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });
  
  // Count 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      phraseFreq.set(phrase, (phraseFreq.get(phrase) || 0) + 1);
    }
  }
  
  // Count 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 2])) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      phraseFreq.set(phrase, (phraseFreq.get(phrase) || 0) + 1);
    }
  }
  
  // Find keywords/phrases that appear at least twice
  let bestKeyword = '';
  let maxFreq = 1;
  
  // Check phrases first (prefer longer matches)
  phraseFreq.forEach((freq, phrase) => {
    if (freq >= 2 && freq > maxFreq) {
      bestKeyword = phrase;
      maxFreq = freq;
    }
  });
  
  // If no phrase found, check single words
  if (!bestKeyword) {
    wordFreq.forEach((freq, word) => {
      if (freq >= 2 && freq > maxFreq) {
        bestKeyword = word;
        maxFreq = freq;
      }
    });
  }
  
  // Fallback to most frequent word if nothing appears twice
  if (!bestKeyword) {
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([word]) => word.length > 3);
    
    if (sortedWords.length > 0) {
      bestKeyword = sortedWords[0][0];
    }
  }
  
  return bestKeyword || 'trading';
}

/**
 * Generate an SEO-optimized excerpt from body text
 * @param body - The body text to extract excerpt from
 * @param primaryKeyword - The primary keyword to prioritize
 * @returns SEO-optimized excerpt (140-155 characters)
 */
export function generateSeoExcerpt(body: string, primaryKeyword: string): string {
  // Clean the body text
  const cleanBody = body.replace(/\s+/g, ' ').trim();
  
  // Try to find the first complete sentence containing the keyword
  const sentences = cleanBody.match(/[^.!?]+[.!?]+/g) || [];
  const keywordLower = primaryKeyword.toLowerCase();
  
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(keywordLower)) {
      const trimmed = sentence.trim();
      if (trimmed.length <= 155) {
        return trimmed.length >= 140 ? trimmed : trimmed.padEnd(140, '...');
      }
      // Trim to 152 chars and add ellipsis
      return trimmed.substring(0, 152) + '...';
    }
  }
  
  // Fallback: "Discussion about [keyword]: [first 15 words]..."
  const first15Words = cleanBody.split(/\s+/).slice(0, 15).join(' ');
  const fallback = `Discussion about ${primaryKeyword}: ${first15Words}...`;
  
  // Ensure it's within 140-155 chars
  if (fallback.length > 155) {
    return fallback.substring(0, 152) + '...';
  }
  
  return fallback;
}

/**
 * Extract trading-specific hashtags from body text
 * @param body - The body text to analyze
 * @param maxTags - Maximum number of hashtags to return (default: 5)
 * @returns Array of relevant hashtags
 */
export function extractHashtags(body: string, maxTags: number = 5): string[] {
  const hashtags = new Set<string>();
  const bodyLower = body.toLowerCase();
  
  // Trading term patterns
  const patterns = {
    // Currency pairs (major, minor, exotic)
    currencyPairs: /\b(EUR\/USD|GBP\/USD|USD\/JPY|USD\/CHF|AUD\/USD|USD\/CAD|NZD\/USD|EUR\/GBP|EUR\/JPY|GBP\/JPY|XAU\/USD|XAG\/USD)\b/gi,
    // Alternative currency pair formats
    currencyPairsAlt: /\b(EURUSD|GBPUSD|USDJPY|USDCHF|AUDUSD|USDCAD|NZDUSD|EURGBP|EURJPY|GBPJPY|XAUUSD|XAGUSD)\b/gi,
    // Timeframes
    timeframes: /\b(M1|M5|M15|M30|H1|H4|D1|W1|MN)\b/g,
    // Trading strategies
    strategies: /\b(scalping|day\s?trading|swing\s?trading|position\s?trading|hedging|martingale|grid\s?trading|news\s?trading)\b/gi,
    // Technical indicators
    indicators: /\b(RSI|MACD|MA|EMA|SMA|Bollinger\s?Bands?|Stochastic|Fibonacci|Support|Resistance|Pivot\s?Points?)\b/gi,
    // Market terms
    marketTerms: /\b(bullish|bearish|breakout|reversal|trend|consolidation|volatility|liquidity|spread|pips?|lots?)\b/gi
  };
  
  // Extract currency pairs
  const currencyMatches = [
    ...(body.match(patterns.currencyPairs) || []),
    ...(body.match(patterns.currencyPairsAlt) || [])
  ];
  
  currencyMatches.forEach(match => {
    const normalized = match.replace(/[\/\s]/g, '').toUpperCase();
    hashtags.add(`#${normalized}`);
  });
  
  // Extract timeframes
  const timeframeMatches = body.match(patterns.timeframes) || [];
  timeframeMatches.forEach(match => {
    hashtags.add(`#${match.toUpperCase()}`);
  });
  
  // Extract strategies
  const strategyMatches = body.match(patterns.strategies) || [];
  strategyMatches.forEach(match => {
    const normalized = match.replace(/\s+/g, '').toLowerCase();
    hashtags.add(`#${normalized}`);
  });
  
  // Extract indicators (limit to most important)
  const indicatorMatches = body.match(patterns.indicators) || [];
  indicatorMatches.slice(0, 3).forEach(match => {
    const normalized = match.replace(/\s+/g, '').toLowerCase();
    hashtags.add(`#${normalized}`);
  });
  
  // Extract market terms (limit to most relevant)
  const marketMatches = body.match(patterns.marketTerms) || [];
  marketMatches.slice(0, 2).forEach(match => {
    const normalized = match.toLowerCase();
    hashtags.add(`#${normalized}`);
  });
  
  // Add popular hashtags if they're mentioned in the body
  POPULAR_HASHTAGS.forEach(tag => {
    const tagWord = tag.substring(1).toLowerCase();
    if (bodyLower.includes(tagWord) && hashtags.size < maxTags * 2) {
      hashtags.add(tag);
    }
  });
  
  // Convert to array and limit to maxTags
  const hashtagArray = Array.from(hashtags);
  
  // Prioritize: currency pairs > timeframes > strategies > others
  const prioritized = [
    ...hashtagArray.filter(tag => /^#[A-Z]{6}$/.test(tag)), // Currency pairs
    ...hashtagArray.filter(tag => /^#(M1|M5|M15|M30|H1|H4|D1|W1|MN)$/i.test(tag)), // Timeframes
    ...hashtagArray.filter(tag => !(/^#[A-Z]{6}$/.test(tag) || /^#(M1|M5|M15|M30|H1|H4|D1|W1|MN)$/i.test(tag)))
  ];
  
  // Return 3-5 most relevant ones
  const minTags = 3;
  const resultCount = Math.min(Math.max(minTags, prioritized.length), maxTags);
  return prioritized.slice(0, resultCount);
}

/**
 * Generate an SEO-friendly URL slug
 * @param primaryKeyword - The primary keyword to include
 * @param title - The title to extract last words from
 * @returns SEO-friendly kebab-case slug
 */
export function generateUrlSlug(primaryKeyword: string, title: string): string {
  // Clean and prepare the primary keyword
  const keywordSlug = primaryKeyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove multiple hyphens
  
  // Extract last 3 words from title (excluding stop words)
  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  
  const lastWords = titleWords.slice(-3);
  
  // Combine keyword and last words
  const slugParts = [keywordSlug];
  
  // Add last words if they don't duplicate the keyword
  lastWords.forEach(word => {
    if (!keywordSlug.includes(word)) {
      slugParts.push(word);
    }
  });
  
  // Join with hyphens and clean up
  const finalSlug = slugParts
    .join('-')
    .replace(/-+/g, '-') // Remove multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Ensure URL safety and reasonable length (max 60 chars for SEO)
  const safeSlug = encodeURIComponent(finalSlug)
    .replace(/%[0-9A-F]{2}/gi, '') // Remove encoded special chars
    .substring(0, 60)
    .replace(/-$/g, ''); // Remove trailing hyphen if truncated
  
  return safeSlug || 'post';
}

/**
 * Calculate keyword density as a percentage
 * @param text - The text to analyze
 * @param keyword - The keyword to calculate density for
 * @returns Keyword density percentage
 */
export function calculateKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) return 0;
  
  const textLower = text.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  
  // Count total words
  const totalWords = text.match(/\b\w+\b/g)?.length || 0;
  if (totalWords === 0) return 0;
  
  // Count keyword occurrences (including partial matches for phrases)
  const keywordPattern = new RegExp(`\\b${keywordLower.replace(/\s+/g, '\\s+')}\\b`, 'gi');
  const keywordMatches = text.match(keywordPattern)?.length || 0;
  
  // Calculate density
  const density = (keywordMatches / totalWords) * 100;
  
  // Round to 2 decimal places
  return Math.round(density * 100) / 100;
}

/**
 * Generate alt text for images
 * @param primaryKeyword - The primary keyword to include
 * @param context - Optional context information (e.g., timeframe, chart type)
 * @returns Generated alt text for images
 */
export function generateImageAltText(primaryKeyword: string, context?: string): string {
  // Extract potential timeframe from context
  const timeframeMatch = context?.match(/\b(M1|M5|M15|M30|H1|H4|D1|W1|MN)\b/i);
  const timeframe = timeframeMatch ? timeframeMatch[0].toUpperCase() : null;
  
  // Extract chart type from context
  const chartTypes = ['candlestick', 'line', 'bar', 'area', 'renko', 'heikin ashi'];
  let chartType = 'chart';
  if (context) {
    const contextLower = context.toLowerCase();
    for (const type of chartTypes) {
      if (contextLower.includes(type)) {
        chartType = type + ' chart';
        break;
      }
    }
  }
  
  // Build alt text
  if (timeframe) {
    return `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} showing ${primaryKeyword} on ${timeframe} timeframe`;
  } else if (context) {
    return `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} displaying ${primaryKeyword} analysis - ${context.substring(0, 50)}`;
  } else {
    return `Chart showing ${primaryKeyword} trading analysis`;
  }
}

/**
 * Suggest internal links based on matching categories
 * @param body - The body text to analyze
 * @param existingCategories - Array of existing category names/slugs
 * @returns Array of suggested internal links
 */
export function suggestInternalLinks(body: string, existingCategories: string[]): Array<{ category: string; relevance: number }> {
  const bodyLower = body.toLowerCase();
  const suggestions: Array<{ category: string; relevance: number }> = [];
  
  existingCategories.forEach(category => {
    const categoryLower = category.toLowerCase();
    const categoryWords = categoryLower.split(/[-_\s]+/);
    let relevance = 0;
    
    // Check for exact category match
    if (bodyLower.includes(categoryLower)) {
      relevance += 10;
    }
    
    // Check for individual word matches
    categoryWords.forEach(word => {
      if (word.length > 3 && bodyLower.includes(word)) {
        relevance += 3;
      }
    });
    
    // Check for related terms
    const relatedTerms: Record<string, string[]> = {
      'forex': ['currency', 'fx', 'foreign exchange', 'pip', 'spread'],
      'crypto': ['bitcoin', 'ethereum', 'blockchain', 'altcoin', 'defi'],
      'stocks': ['shares', 'equity', 'dividend', 'nasdaq', 'sp500'],
      'commodities': ['gold', 'oil', 'silver', 'wheat', 'copper'],
      'technical': ['chart', 'indicator', 'pattern', 'analysis', 'signal'],
      'fundamental': ['news', 'economic', 'gdp', 'inflation', 'interest rate'],
      'strategy': ['system', 'method', 'approach', 'plan', 'technique'],
      'education': ['learn', 'tutorial', 'guide', 'course', 'lesson'],
      'broker': ['platform', 'account', 'deposit', 'withdrawal', 'spread'],
      'signals': ['alert', 'notification', 'entry', 'exit', 'setup']
    };
    
    // Check for related terms
    Object.entries(relatedTerms).forEach(([key, terms]) => {
      if (categoryLower.includes(key)) {
        terms.forEach(term => {
          if (bodyLower.includes(term)) {
            relevance += 1;
          }
        });
      }
    });
    
    if (relevance > 0) {
      suggestions.push({ category, relevance });
    }
  });
  
  // Sort by relevance and return top suggestions
  return suggestions
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

/**
 * Analyze title for SEO optimization
 * @param title - The title to analyze
 * @returns Analysis results with optimization suggestions
 */
export function analyzeTitle(title: string): {
  length: number;
  isOptimalLength: boolean;
  keywordInFirst100: boolean;
  suggestions: string[];
} {
  const length = title.length;
  const isOptimalLength = length >= 15 && length <= 90;
  
  // Extract primary keyword from title
  const primaryKeyword = extractPrimaryKeyword(title, '');
  const first100Chars = title.substring(0, 100).toLowerCase();
  const keywordInFirst100 = first100Chars.includes(primaryKeyword.toLowerCase());
  
  const suggestions: string[] = [];
  
  if (length < 15) {
    suggestions.push('Title is too short. Add more descriptive words (minimum 15 characters).');
  } else if (length > 90) {
    suggestions.push('Title is too long. Consider shortening it (maximum 90 characters for optimal display).');
  }
  
  if (!keywordInFirst100 && primaryKeyword) {
    suggestions.push(`Primary keyword "${primaryKeyword}" should appear in the first 100 characters.`);
  }
  
  // Check for power words
  const powerWords = ['how', 'why', 'best', 'guide', 'tips', 'strategy', 'proven', 'ultimate', 'complete'];
  const hasPowerWord = powerWords.some(word => title.toLowerCase().includes(word));
  if (!hasPowerWord) {
    suggestions.push('Consider adding power words like "How", "Best", "Guide", or "Strategy" to increase click-through rate.');
  }
  
  // Check for numbers
  const hasNumber = /\d/.test(title);
  if (!hasNumber && title.toLowerCase().includes('tips') || title.toLowerCase().includes('ways') || title.toLowerCase().includes('strategies')) {
    suggestions.push('Consider adding numbers (e.g., "5 Tips", "3 Strategies") for better engagement.');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Title is well-optimized for SEO!');
  }
  
  return {
    length,
    isOptimalLength,
    keywordInFirst100,
    suggestions
  };
}

/**
 * Extract trading-specific terms from text
 * @param text - The text to analyze
 * @returns Object containing categorized trading terms
 */
export function extractTradingTerms(text: string): {
  currencyPairs: string[];
  timeframes: string[];
  strategies: string[];
  indicators: string[];
  priceActions: string[];
} {
  const result = {
    currencyPairs: [] as string[],
    timeframes: [] as string[],
    strategies: [] as string[],
    indicators: [] as string[],
    priceActions: [] as string[]
  };
  
  // Currency pairs patterns
  const currencyPairPatterns = [
    /\b(EUR\/USD|GBP\/USD|USD\/JPY|USD\/CHF|AUD\/USD|USD\/CAD|NZD\/USD)\b/gi,
    /\b(EURUSD|GBPUSD|USDJPY|USDCHF|AUDUSD|USDCAD|NZDUSD)\b/gi,
    /\b(EUR\/GBP|EUR\/JPY|GBP\/JPY|EUR\/AUD|EUR\/CAD|GBP\/AUD|GBP\/CAD)\b/gi,
    /\b(EURGBP|EURJPY|GBPJPY|EURAUD|EURCAD|GBPAUD|GBPCAD)\b/gi,
    /\b(XAU\/USD|XAG\/USD|WTI|BRENT)\b/gi,
    /\b(XAUUSD|XAGUSD|GOLD|SILVER)\b/gi
  ];
  
  currencyPairPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      const normalized = match.replace(/\//g, '').toUpperCase();
      if (!result.currencyPairs.includes(normalized)) {
        result.currencyPairs.push(normalized);
      }
    });
  });
  
  // Timeframes
  const timeframePattern = /\b(M1|M5|M15|M30|H1|H4|D1|W1|MN|1min|5min|15min|30min|1hr|4hr|daily|weekly|monthly)\b/gi;
  const timeframeMatches = text.match(timeframePattern) || [];
  timeframeMatches.forEach(match => {
    const normalized = match.toUpperCase()
      .replace('1MIN', 'M1')
      .replace('5MIN', 'M5')
      .replace('15MIN', 'M15')
      .replace('30MIN', 'M30')
      .replace('1HR', 'H1')
      .replace('4HR', 'H4')
      .replace('DAILY', 'D1')
      .replace('WEEKLY', 'W1')
      .replace('MONTHLY', 'MN');
    if (!result.timeframes.includes(normalized)) {
      result.timeframes.push(normalized);
    }
  });
  
  // Trading strategies
  const strategyPatterns = [
    /\b(scalping|scalper|scalp)\b/gi,
    /\b(day\s?trading|day\s?trader)\b/gi,
    /\b(swing\s?trading|swing\s?trader)\b/gi,
    /\b(position\s?trading|position\s?trader)\b/gi,
    /\b(trend\s?following|trend\s?trading)\b/gi,
    /\b(breakout\s?trading|breakout\s?strategy)\b/gi,
    /\b(range\s?trading|range\s?bound)\b/gi,
    /\b(carry\s?trade)\b/gi,
    /\b(arbitrage|arb)\b/gi,
    /\b(hedging|hedge)\b/gi,
    /\b(martingale|grid\s?trading|averaging\s?down)\b/gi,
    /\b(news\s?trading|fundamental\s?trading)\b/gi,
    /\b(price\s?action|naked\s?trading)\b/gi
  ];
  
  strategyPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      const normalized = match.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!result.strategies.some(s => s.toLowerCase() === normalized)) {
        result.strategies.push(normalized);
      }
    });
  });
  
  // Technical indicators
  const indicatorPatterns = [
    /\b(RSI|relative\s?strength\s?index)\b/gi,
    /\b(MACD|moving\s?average\s?convergence\s?divergence)\b/gi,
    /\b(MA|SMA|EMA|WMA|moving\s?average|simple\s?moving\s?average|exponential\s?moving\s?average)\b/gi,
    /\b(Bollinger\s?Bands?|BB)\b/gi,
    /\b(Stochastic|Stoch)\b/gi,
    /\b(Fibonacci|Fib|Fibo)\b/gi,
    /\b(ATR|average\s?true\s?range)\b/gi,
    /\b(ADX|average\s?directional\s?index)\b/gi,
    /\b(CCI|commodity\s?channel\s?index)\b/gi,
    /\b(Williams?\s?%?R)\b/gi,
    /\b(Ichimoku|Cloud)\b/gi,
    /\b(VWAP|volume\s?weighted\s?average\s?price)\b/gi,
    /\b(Pivot\s?Points?|PP)\b/gi,
    /\b(Support\s?(?:and\s?)?Resistance|S&R|SR)\b/gi
  ];
  
  indicatorPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      const normalized = match.toUpperCase()
        .replace(/\s+/g, ' ')
        .replace('RELATIVE STRENGTH INDEX', 'RSI')
        .replace('MOVING AVERAGE CONVERGENCE DIVERGENCE', 'MACD')
        .replace('SIMPLE MOVING AVERAGE', 'SMA')
        .replace('EXPONENTIAL MOVING AVERAGE', 'EMA')
        .replace('AVERAGE TRUE RANGE', 'ATR')
        .replace('AVERAGE DIRECTIONAL INDEX', 'ADX');
      if (!result.indicators.some(i => i.toUpperCase() === normalized)) {
        result.indicators.push(normalized);
      }
    });
  });
  
  // Price action terms
  const priceActionPatterns = [
    /\b(pin\s?bar|hammer|doji|engulfing|harami)\b/gi,
    /\b(head\s?(?:and\s?)?shoulders?|inverse\s?head\s?(?:and\s?)?shoulders?)\b/gi,
    /\b(double\s?top|double\s?bottom|triple\s?top|triple\s?bottom)\b/gi,
    /\b(ascending\s?triangle|descending\s?triangle|symmetrical\s?triangle)\b/gi,
    /\b(flag\s?pattern|pennant|wedge)\b/gi,
    /\b(cup\s?(?:and\s?)?handle)\b/gi,
    /\b(breakout|breakdown|pullback|retracement)\b/gi,
    /\b(trend\s?line|channel|consolidation)\b/gi,
    /\b(gap|gap\s?up|gap\s?down)\b/gi,
    /\b(reversal|continuation)\b/gi
  ];
  
  priceActionPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      const normalized = match.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!result.priceActions.some(p => p.toLowerCase() === normalized)) {
        result.priceActions.push(normalized);
      }
    });
  });
  
  return result;
}