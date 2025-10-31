/**
 * Server-side SEO Utilities Module
 * Provides comprehensive SEO analysis and optimization functions for trading/forex content
 * Matches client-side logic for consistency
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
 * Generate the primary keyword/phrase from title and body text
 * @param title - The title text to analyze
 * @param body - The body text to analyze
 * @returns The most relevant keyword/phrase (1-3 words)
 */
export function generatePrimaryKeyword(title: string, body: string): string {
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
 * @returns SEO-optimized excerpt (120-160 characters)
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
export function generateSlug(primaryKeyword: string, title: string): string {
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
 * Main function to auto-generate missing SEO fields
 * @param data - The input data with optional SEO fields
 * @returns Complete SEO data with auto-generated values for missing fields
 */
export function autoGenerateSEOFields(data: {
  title: string;
  body: string;
  primaryKeyword?: string;
  seoExcerpt?: string;
  hashtags?: string[];
  slug?: string;
}): {
  primaryKeyword: string;
  seoExcerpt: string;
  hashtags: string[];
  slug: string;
  autoGenerated: {
    primaryKeyword: boolean;
    seoExcerpt: boolean;
    hashtags: boolean;
    slug: boolean;
  };
} {
  const { title, body } = data;
  const autoGenerated = {
    primaryKeyword: false,
    seoExcerpt: false,
    hashtags: false,
    slug: false
  };

  // Auto-generate primary keyword if missing
  let primaryKeyword = data.primaryKeyword;
  if (!primaryKeyword || primaryKeyword.trim() === '') {
    primaryKeyword = generatePrimaryKeyword(title, body);
    autoGenerated.primaryKeyword = true;
  }

  // Auto-generate SEO excerpt if missing
  let seoExcerpt = data.seoExcerpt;
  if (!seoExcerpt || seoExcerpt.trim() === '') {
    seoExcerpt = generateSeoExcerpt(body, primaryKeyword);
    autoGenerated.seoExcerpt = true;
  }
  // Ensure excerpt meets length requirements (120-160 chars)
  else if (seoExcerpt.length < 120) {
    seoExcerpt = seoExcerpt.padEnd(120, '...');
  } else if (seoExcerpt.length > 160) {
    seoExcerpt = seoExcerpt.substring(0, 157) + '...';
  }

  // Auto-generate hashtags if missing or empty
  let hashtags = data.hashtags;
  if (!hashtags || hashtags.length === 0) {
    hashtags = extractHashtags(body, 5);
    autoGenerated.hashtags = true;
  }
  // Ensure hashtags are properly formatted
  else {
    hashtags = hashtags.map(tag => {
      // Add # if missing
      if (!tag.startsWith('#')) {
        return `#${tag}`;
      }
      return tag;
    });
  }

  // Auto-generate slug if missing
  let slug = data.slug;
  if (!slug || slug.trim() === '') {
    slug = generateSlug(primaryKeyword, title);
    autoGenerated.slug = true;
  }
  // Ensure slug is URL-safe
  else {
    slug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  return {
    primaryKeyword,
    seoExcerpt,
    hashtags,
    slug,
    autoGenerated
  };
}

/**
 * Validate SEO fields meet requirements
 * @param fields - The SEO fields to validate
 * @returns Validation result with any issues
 */
export function validateSEOFields(fields: {
  primaryKeyword?: string;
  seoExcerpt?: string;
  hashtags?: string[];
  slug?: string;
}): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Validate primary keyword (1-50 chars)
  if (fields.primaryKeyword) {
    if (fields.primaryKeyword.length < 1 || fields.primaryKeyword.length > 50) {
      issues.push('Primary keyword must be between 1 and 50 characters');
    }
  }

  // Validate SEO excerpt (120-160 chars)
  if (fields.seoExcerpt) {
    if (fields.seoExcerpt.length < 120 || fields.seoExcerpt.length > 160) {
      issues.push('SEO excerpt must be between 120 and 160 characters');
    }
  }

  // Validate hashtags (max 10, each max 30 chars)
  if (fields.hashtags) {
    if (fields.hashtags.length > 10) {
      issues.push('Maximum 10 hashtags allowed');
    }
    fields.hashtags.forEach((tag, index) => {
      if (tag.length > 30) {
        issues.push(`Hashtag ${index + 1} exceeds 30 character limit`);
      }
      if (!tag.startsWith('#')) {
        issues.push(`Hashtag ${index + 1} must start with #`);
      }
    });
  }

  // Validate slug (3-100 chars, URL-safe)
  if (fields.slug) {
    if (fields.slug.length < 3 || fields.slug.length > 100) {
      issues.push('Slug must be between 3 and 100 characters');
    }
    if (!/^[a-z0-9-]+$/.test(fields.slug)) {
      issues.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}