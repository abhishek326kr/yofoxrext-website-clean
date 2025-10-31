/**
 * YoForex Invisible SEO Engine
 * 
 * This module automatically generates all SEO metadata when users publish content.
 * Users only provide: title, description, images. We handle the rest.
 */

/**
 * Extract focus keyword from title
 * Strategy: Remove common words, take first 2-4 meaningful words
 */
export function extractFocusKeyword(title: string): string {
  const commonWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'over',
    'my', 'new', 'best', 'free', 'mt4', 'mt5', 'no', 'dll'
  ]);

  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));

  return words.slice(0, 3).join(' ');
}

/**
 * Generate meta description from post body
 * Takes first 155 characters for optimal Google display
 */
export function generateMetaDescription(bodyText: string, maxLength: number = 155): string {
  const cleaned = bodyText
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Generate unique alt text for each image
 * First image: "Main image for [Focus Keyword]"
 * Others: "[Focus Keyword] - Screenshot N"
 */
export function generateImageAltTexts(focusKeyword: string, imageCount: number): string[] {
  if (imageCount === 0) return [];
  if (imageCount === 1) return [`Main image for ${focusKeyword}`];

  const altTexts: string[] = [`Main image for ${focusKeyword}`];
  
  for (let i = 2; i <= imageCount; i++) {
    altTexts.push(`${focusKeyword} - Screenshot ${i}`);
  }

  return altTexts;
}

/**
 * Generate URL-friendly slug from title
 * Note: Caller must handle collision detection and add suffixes if needed
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100);
}

/**
 * Generate unique slug by checking for collisions and appending counter
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 2;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }
  
  return `${baseSlug}-${counter}`;
}

/**
 * Generate unique slug for forum thread with SEO optimization
 */
export function generateThreadSlug(title: string): string {
  return generateSlug(title);
}

/**
 * Generate unique SEO-friendly slug for forum reply
 * Format: reply-to-{thread-title-slug}-by-{username}-{id}
 * Example: "reply-to-xauusd-scalping-by-john-abc123"
 * This ensures each reply can rank independently on Google/Bing/Baidu
 */
export function generateReplySlug(threadTitle: string, username: string, replyId: string): string {
  // Generate slug from thread title (first 40 chars for SEO keywords)
  const titleSlug = threadTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 40);
  
  // Clean username for URL
  const usernameSlug = username
    .toLowerCase()
    .replace(/[^\w]/g, '')
    .substring(0, 15);
  
  // Short unique ID
  const shortId = replyId.substring(0, 6);
  
  // Format: reply-to-{keywords}-by-{user}-{id}
  return `reply-to-${titleSlug}-by-${usernameSlug}-${shortId}`;
}

/**
 * Generate SEO-optimized title tag
 * Format: "[Original Title] | YoForex.net"
 */
export function generateSEOTitle(title: string, username?: string): string {
  if (username) {
    return `${title} | by ${username} | YoForex.net`;
  }
  return `${title} | YoForex.net`;
}

/**
 * Generate Schema.org structured data for content
 * Tells Google exactly what the content is and who wrote it
 */
export function generateStructuredData(content: {
  type: string;
  title: string;
  description: string;
  authorName: string;
  datePublished: Date;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
}) {
  const schemaType = content.type === 'article' ? 'Article' : 'Product';
  
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: content.title,
    description: content.description,
    author: {
      '@type': 'Person',
      name: content.authorName,
    },
    datePublished: content.datePublished.toISOString(),
  };

  if (content.imageUrl) {
    structuredData.image = content.imageUrl;
  }

  if (content.rating && content.reviewCount) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: content.rating,
      reviewCount: content.reviewCount,
    };
  }

  return structuredData;
}

/**
 * Apply all SEO automations to content
 * This is called when content is created
 */
export function applySEOAutomations(content: {
  title: string;
  description: string;
  imageUrls?: string[];
}) {
  const focusKeyword = extractFocusKeyword(content.title);
  const autoMetaDescription = generateMetaDescription(content.description);
  const autoImageAltTexts = generateImageAltTexts(
    focusKeyword,
    content.imageUrls?.length || 0
  );
  const slug = generateSlug(content.title);

  return {
    focusKeyword,
    autoMetaDescription,
    autoImageAltTexts,
    slug,
  };
}
