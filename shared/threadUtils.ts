/**
 * Thread Utilities
 * Slug generation, meta descriptions, tag extraction, structured data
 */

import { extractPotentialTags } from "./tradingMetadata";

// Stop words to remove from slugs
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
  "to", "was", "will", "with", "the", "this", "but", "they", "have",
  "had", "what", "when", "where", "who", "which", "why", "how"
]);

/**
 * Generate a clean, SEO-friendly slug from title
 * Example: "XAUUSD M5 Scalping Strategy" → "xauusd-m5-scalping-strategy"
 */
export function generateSlug(title: string, maxLength = 60): string {
  return title
    .toLowerCase()
    .normalize("NFD") // Decompose Unicode characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Keep only letters, numbers, spaces, hyphens
    .trim()
    .split(/\s+/)
    .filter((word) => !STOP_WORDS.has(word)) // Remove stop words
    .join("-")
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, maxLength)
    .replace(/-$/, ""); // Remove trailing hyphen
}

/**
 * Generate full slug with category path
 * Example: category="trading-strategies", sub="xauusd-scalping", title="M5 Rules"
 * → "trading-strategies/xauusd-scalping/m5-rules"
 */
export function generateFullSlug(
  categorySlug: string,
  subcategorySlug: string | null | undefined,
  title: string
): string {
  const titleSlug = generateSlug(title);
  const parts = [categorySlug];
  if (subcategorySlug) {
    parts.push(subcategorySlug);
  }
  parts.push(titleSlug);
  return parts.join("/");
}

/**
 * Generate meta description from body text
 * Extracts first paragraph, strips markdown/HTML, trims to 150-160 chars
 */
export function generateMetaDescription(
  body: string,
  seoExcerpt?: string | null
): string {
  // Use provided SEO excerpt if available
  if (seoExcerpt && seoExcerpt.length >= 120 && seoExcerpt.length <= 160) {
    return seoExcerpt;
  }

  // Extract first paragraph (up to first double line break or 300 chars)
  const firstParagraph = body
    .split(/\n\n/)[0]
    .substring(0, 300);

  // Strip markdown and HTML
  const cleaned = firstParagraph
    .replace(/[#*_`~\[\]]/g, "") // Remove markdown
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Trim to 150-160 chars without cutting words
  if (cleaned.length <= 160) {
    return cleaned;
  }

  const trimmed = cleaned.substring(0, 160);
  const lastSpace = trimmed.lastIndexOf(" ");
  return lastSpace > 140 ? trimmed.substring(0, lastSpace) + "..." : trimmed + "...";
}

/**
 * Extract and suggest tags from title and body
 * Returns array of suggested tags (instruments, timeframes, strategies, platforms)
 */
export function suggestTags(title: string, body: string): string[] {
  const text = `${title} ${body}`;
  return extractPotentialTags(text);
}

/**
 * Deduplicate and normalize tags/hashtags
 * Combines manual tags with hashtags, removes duplicates, caps at maxTags
 */
export function deduplicateTags(
  instruments: string[],
  timeframes: string[],
  strategies: string[],
  hashtags: string[],
  maxTags = 12
): {
  instruments: string[];
  timeframes: string[];
  strategies: string[];
  hashtags: string[];
  totalTags: number;
} {
  // Normalize hashtags (remove #, lowercase)
  const normalizedHashtags = hashtags.map((tag) =>
    tag.replace(/^#/, "").toLowerCase().trim()
  );

  // Create sets for deduplication
  const uniqueInstruments = new Set(instruments.map((i) => i.toLowerCase()));
  const uniqueTimeframes = new Set(timeframes.map((t) => t.toUpperCase()));
  const uniqueStrategies = new Set(strategies.map((s) => s.toLowerCase()));
  const uniqueHashtags = new Set(normalizedHashtags);

  // Remove hashtags that duplicate other tags
  uniqueHashtags.forEach((hashtag) => {
    if (
      uniqueInstruments.has(hashtag) ||
      uniqueTimeframes.has(hashtag.toUpperCase()) ||
      uniqueStrategies.has(hashtag)
    ) {
      uniqueHashtags.delete(hashtag);
    }
  });

  // Calculate total and cap if needed
  const allTags = [
    ...Array.from(uniqueInstruments),
    ...Array.from(uniqueTimeframes),
    ...Array.from(uniqueStrategies),
    ...Array.from(uniqueHashtags),
  ];

  const totalTags = allTags.length;

  // If over limit, prioritize: instruments > timeframes > strategies > hashtags
  if (totalTags > maxTags) {
    let remaining = maxTags;
    const finalInstruments = Array.from(uniqueInstruments).slice(0, remaining);
    remaining -= finalInstruments.length;

    const finalTimeframes = Array.from(uniqueTimeframes).slice(0, remaining);
    remaining -= finalTimeframes.length;

    const finalStrategies = Array.from(uniqueStrategies).slice(0, remaining);
    remaining -= finalStrategies.length;

    const finalHashtags = Array.from(uniqueHashtags).slice(0, remaining);

    return {
      instruments: finalInstruments,
      timeframes: finalTimeframes,
      strategies: finalStrategies,
      hashtags: finalHashtags,
      totalTags: maxTags,
    };
  }

  return {
    instruments: Array.from(uniqueInstruments),
    timeframes: Array.from(uniqueTimeframes),
    strategies: Array.from(uniqueStrategies),
    hashtags: Array.from(uniqueHashtags),
    totalTags,
  };
}

/**
 * Generate structured data (JSON-LD) for SEO based on thread type
 */
export function generateStructuredData(
  threadType: string,
  thread: {
    title: string;
    body: string;
    authorName: string;
    authorUrl: string;
    threadUrl: string;
    categoryName: string;
    createdAt: Date;
    replyCount: number;
    viewCount: number;
    reviewRating?: number | null;
    reviewTarget?: string | null;
  }
): Record<string, any> {
  const basePosting = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: thread.title,
    text: thread.body.substring(0, 500),
    author: {
      "@type": "Person",
      name: thread.authorName,
      url: thread.authorUrl,
    },
    url: thread.threadUrl,
    datePublished: thread.createdAt.toISOString(),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: thread.replyCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ViewAction",
        userInteractionCount: thread.viewCount,
      },
    ],
    about: {
      "@type": "Thing",
      name: thread.categoryName,
    },
  };

  // Add Question schema for questions
  if (threadType === "question") {
    return {
      ...basePosting,
      "@type": ["DiscussionForumPosting", "Question"],
      answerCount: thread.replyCount,
    };
  }

  // Add Review schema for reviews
  if (threadType === "review" && thread.reviewTarget && thread.reviewRating) {
    return {
      ...basePosting,
      "@type": ["DiscussionForumPosting", "Review"],
      itemReviewed: {
        "@type": "SoftwareApplication",
        name: thread.reviewTarget,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: thread.reviewRating,
        bestRating: 5,
      },
    };
  }

  // Add BlogPosting for journals
  if (threadType === "journal") {
    return {
      ...basePosting,
      "@type": ["DiscussionForumPosting", "BlogPosting"],
      articleBody: thread.body.substring(0, 1000),
    };
  }

  // Add HowTo for guides (simplified, would need step detection)
  if (threadType === "guide") {
    return {
      ...basePosting,
      "@type": ["DiscussionForumPosting", "HowTo"],
      name: thread.title,
      description: thread.body.substring(0, 500),
    };
  }

  // Default: just DiscussionForumPosting
  return basePosting;
}

/**
 * Calculate engagement score for thread ranking
 * Formula: views*1 + replies*3 + likes*4 + bookmarks*2 + shares*5 - reports*5
 */
export function calculateEngagementScore(metrics: {
  views: number;
  replies: number;
  likes: number;
  bookmarks: number;
  shares: number;
  reports?: number;
}): number {
  return (
    metrics.views * 1 +
    metrics.replies * 3 +
    metrics.likes * 4 +
    metrics.bookmarks * 2 +
    metrics.shares * 5 -
    (metrics.reports || 0) * 5
  );
}

/**
 * Word count utility for body validation
 * Counts words (space-separated) not characters
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Check if title is too shouty (>50% uppercase letters)
 */
export function isTitleTooShouty(title: string): boolean {
  const upperCount = (title.match(/[A-Z]/g) || []).length;
  const letterCount = (title.match(/[a-zA-Z]/g) || []).length;
  return letterCount > 0 && upperCount / letterCount >= 0.5;
}

/**
 * Clean and validate hashtags
 */
export function cleanHashtags(hashtags: string[]): string[] {
  return hashtags
    .map((tag) => tag.replace(/^#/, "").toLowerCase().trim())
    .filter((tag) => tag.length >= 2 && tag.length <= 24 && /^[a-z0-9-]+$/i.test(tag));
}
