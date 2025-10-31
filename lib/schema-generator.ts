/**
 * Dynamic Schema.org JSON-LD Generator
 * 
 * Complies with:
 * - Schema.org v29.3 (Latest 2025 standard)
 * - Google Rich Results Guidelines 2025
 * - JSON-LD 1.0 specification
 * 
 * Features:
 * - Automatic content type detection
 * - Dynamic schema generation based on page context
 * - Type-safe schema builders
 * - Validation-ready output
 */

import { ForumThread, Content, User, ForumCategory } from '@shared/schema';
import { 
  toAbsoluteUrl, 
  validateImageUrl, 
  sanitizeForSchema, 
  toISO8601, 
  shouldIncludeRating,
  validateRequiredProperties,
  getLanguage,
  getWordCount
} from './schema-utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SchemaContext = 'https://schema.org';

export interface BaseSchema {
  '@context': SchemaContext;
  '@type': string;
  '@id'?: string;
}

export interface OrganizationSchema extends BaseSchema {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  email?: string;
  telephone?: string;
  address?: PostalAddress;
  sameAs?: string[];
  foundingDate?: string;
}

export interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface WebSiteSchema extends BaseSchema {
  '@type': 'WebSite';
  url: string;
  name: string;
  description?: string;
  inLanguage?: string;
  publisher?: { '@id': string };
  potentialAction?: SearchAction;
}

export interface SearchAction {
  '@type': 'SearchAction';
  target: string | EntryPoint;
  'query-input'?: string;
}

export interface EntryPoint {
  '@type': 'EntryPoint';
  urlTemplate: string;
}

export interface BreadcrumbListSchema extends BaseSchema {
  '@type': 'BreadcrumbList';
  itemListElement: ListItem[];
}

export interface ListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string | { '@id': string; name: string };
}

export interface ArticleSchema extends BaseSchema {
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle';
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished: string;
  dateModified?: string;
  author: Person | Organization;
  publisher: Organization;
  articleBody?: string;
  wordCount?: number;
  commentCount?: number;
  interactionStatistic?: InteractionCounter;
}

export interface Person {
  '@type': 'Person';
  '@id'?: string;
  name: string;
  url?: string;
  image?: string;
}

export interface Organization {
  '@type': 'Organization';
  '@id'?: string;
  name: string;
  url?: string;
  logo?: ImageObject;
}

export interface ImageObject {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
}

export interface InteractionCounter {
  '@type': 'InteractionCounter';
  interactionType: string;
  userInteractionCount: number;
}

// ============================================================================
// DISCUSSION FORUM POSTING SCHEMA (Schema.org 2025)
// ============================================================================

export interface DiscussionForumPostingSchema extends BaseSchema {
  '@type': 'DiscussionForumPosting';
  '@id': string;
  headline: string;
  articleBody: string;
  author: Person | Organization;
  datePublished: string;
  dateModified?: string;
  url: string;
  mainEntityOfPage?: { '@id': string };
  inLanguage?: string;
  interactionStatistic?: InteractionCounter[];
  comment?: CommentSchema[];
  commentCount?: number;
  publisher?: Organization;
}

export interface CommentSchema extends BaseSchema {
  '@type': 'Comment';
  '@id'?: string;
  text: string;
  author: Person | Organization;
  datePublished: string;
  upvoteCount?: number;
  parentItem?: { '@id': string };
}

// ============================================================================
// PRODUCT SCHEMA (Schema.org 2025 - Enhanced)
// ============================================================================

export interface ProductSchema extends BaseSchema {
  '@type': 'Product';
  '@id': string;
  name: string;
  description: string;
  image?: string | string[];
  brand?: Organization | { '@type': 'Brand'; name: string };
  offers: OfferSchema;
  aggregateRating?: AggregateRatingSchema;
  review?: ReviewSchema[];
  sku?: string;
  gtin?: string;
  mpn?: string;
  additionalType?: string;
  category?: string;
}

export interface OfferSchema {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  availability: string;
  url?: string;
  seller?: Organization | Person;
  priceValidUntil?: string;
}

export interface AggregateRatingSchema {
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface ReviewSchema {
  '@type': 'Review';
  author: Person;
  datePublished: string;
  reviewRating: {
    '@type': 'Rating';
    ratingValue: number;
    bestRating?: number;
  };
  reviewBody?: string;
}

// Legacy type aliases for backward compatibility
export interface Brand {
  '@type': 'Brand';
  name: string;
}

export interface Offer extends OfferSchema {}
export interface AggregateRating extends AggregateRatingSchema {}
export interface Review extends ReviewSchema {}

export interface Rating {
  '@type': 'Rating';
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
}

// ============================================================================
// FAQ PAGE SCHEMA (Schema.org 2025 - Enhanced)
// ============================================================================

export interface FAQPageSchema extends BaseSchema {
  '@type': 'FAQPage';
  '@id': string;
  mainEntity: QuestionSchema[];
}

export interface QuestionSchema {
  '@type': 'Question';
  '@id'?: string;
  name: string;
  acceptedAnswer: AnswerSchema;
}

export interface AnswerSchema {
  '@type': 'Answer';
  '@id'?: string;
  text: string;
  dateCreated?: string;
  upvoteCount?: number;
  url?: string;
  author?: Person;
}

// Legacy type aliases for backward compatibility
export interface Question extends QuestionSchema {}
export interface Answer extends AnswerSchema {}

// ============================================================================
// VIDEO OBJECT SCHEMA (Schema.org 2025 - Enhanced)
// ============================================================================

export interface VideoObjectSchema extends BaseSchema {
  '@type': 'VideoObject';
  '@id': string;
  name: string;
  description: string;
  thumbnailUrl: string | string[];
  uploadDate: string;
  contentUrl?: string;
  embedUrl?: string;
  duration?: string;
  interactionStatistic?: InteractionCounter;
  author?: Person | Organization;
}

// ============================================================================
// NEWS ARTICLE SCHEMA (Schema.org 2025)
// ============================================================================

export interface NewsArticleSchema extends BaseSchema {
  '@type': 'NewsArticle';
  '@id': string;
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished: string;
  dateModified?: string;
  author: Person | Organization;
  publisher: Organization;
  articleBody?: string;
  inLanguage?: string;
  dateline?: string;
  url: string;
}

// ============================================================================
// BLOG POSTING SCHEMA (Schema.org 2025)
// ============================================================================

export interface BlogPostingSchema extends BaseSchema {
  '@type': 'BlogPosting';
  '@id': string;
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished: string;
  dateModified?: string;
  author: Person | Organization;
  publisher: Organization;
  articleBody?: string;
  wordCount?: number;
  inLanguage?: string;
  articleSection?: string;
  url: string;
  mainEntityOfPage?: { '@id': string };
}

export interface ProfilePageSchema extends BaseSchema {
  '@type': 'ProfilePage';
  mainEntity: Person;
  dateCreated?: string;
  dateModified?: string;
}

export interface PersonSchema extends BaseSchema {
  '@type': 'Person';
  '@id': string;
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  alumniOf?: Organization;
  affiliation?: Organization;
  worksFor?: Organization;
  sameAs?: string[];
  knowsAbout?: string[];
  interactionStatistic?: InteractionCounter[];
}

// ============================================================================
// SITE CONFIGURATION
// ============================================================================

export interface SiteConfig {
  name: string;
  url: string;
  description: string;
  logo: string;
  organizationId: string;
  foundingDate?: string;
  email?: string;
  telephone?: string;
  socialProfiles?: string[];
  searchEndpoint?: string;
}

// Default YoForex configuration
export const SITE_CONFIG: SiteConfig = {
  name: 'YoForex',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com',
  description: 'Global forex trading community platform featuring forum discussions, EA marketplace, broker reviews, and expert insights',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com'}/logo.png`,
  organizationId: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com'}/#organization`,
  foundingDate: '2024-01-01',
  email: 'contact@yoforex.com',
  socialProfiles: [
    'https://twitter.com/yoforex',
    'https://linkedin.com/company/yoforex',
    'https://facebook.com/yoforex',
  ],
  searchEndpoint: '/search?q={search_term_string}',
};

// ============================================================================
// SCHEMA GENERATORS
// ============================================================================

/**
 * Generate WebSite schema with SearchAction
 * Should be included on all pages (usually in root layout)
 */
export function generateWebSiteSchema(config: SiteConfig = SITE_CONFIG): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${config.url}/#website`,
    url: config.url,
    name: config.name,
    description: config.description,
    inLanguage: 'en-US',
    publisher: {
      '@id': config.organizationId,
    },
    potentialAction: config.searchEndpoint
      ? {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${config.url}${config.searchEndpoint}`,
          },
          'query-input': 'required name=search_term_string',
        }
      : undefined,
  };
}

/**
 * Generate Organization schema
 * Should be included on homepage and about page
 */
export function generateOrganizationSchema(
  config: SiteConfig = SITE_CONFIG
): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': config.organizationId,
    name: config.name,
    url: config.url,
    logo: config.logo,
    description: config.description,
    email: config.email,
    telephone: config.telephone,
    foundingDate: config.foundingDate,
    sameAs: config.socialProfiles,
  };
}

/**
 * Generate BreadcrumbList schema from path segments
 * @param items Array of breadcrumb items with name and url
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: index < items.length - 1 ? item.url : undefined, // Last item shouldn't have URL
    })),
  };
}

/**
 * Generate Article schema for forum threads
 * Complies with Google Rich Results requirements
 */
export function generateArticleSchema(params: {
  thread: ForumThread;
  author?: User;
  canonicalUrl: string;
  category?: ForumCategory;
}): ArticleSchema {
  const { thread, author, canonicalUrl, category } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': canonicalUrl,
    headline: thread.title,
    description: thread.metaDescription || thread.body?.substring(0, 160) || '',
    image: `${SITE_CONFIG.logo}`, // Thread schema doesn't have featured image
    datePublished: new Date(thread.createdAt).toISOString(),
    dateModified: new Date(thread.updatedAt).toISOString(),
    author: author
      ? {
          '@type': 'Person',
          name: author.username,
          url: `${SITE_CONFIG.url}/user/${author.username}`,
        }
      : {
          '@type': 'Person',
          name: 'YoForex Community',
        },
    publisher: {
      '@type': 'Organization',
      '@id': SITE_CONFIG.organizationId,
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.logo,
      },
    },
    wordCount: thread.body ? thread.body.split(/\s+/).length : 0,
    commentCount: thread.replyCount || 0,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ViewAction',
      userInteractionCount: thread.views || 0,
    },
  };
}

/**
 * Generate Product schema for marketplace items (Schema.org 2025 Enhanced)
 * Includes offers, ratings, and reviews
 * Supports digital products (SoftwareApplication for EAs/Indicators)
 */
export function generateProductSchema(params: {
  product: Content;
  baseUrl: string;
  author: User;
  averageRating?: number;
  reviewCount?: number;
  reviews?: Array<{ author: User; rating: number; comment: string; createdAt: Date }>;
}): ProductSchema {
  const { product, baseUrl, author, averageRating, reviewCount, reviews } = params;

  const images = product.images || [];
  const coverImage = images.find((img) => img.isCover) || images[0];
  const imageUrl = images.length > 0 ? images[0].url : undefined;

  // Determine additional type based on content type
  let additionalType: string | undefined;
  if (product.type === 'ea' || product.type === 'indicator') {
    additionalType = 'https://schema.org/SoftwareApplication';
  }

  // Build reviews array if provided with Person schema links
  const reviewSchemas: ReviewSchema[] | undefined = reviews?.map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      '@id': `${baseUrl}/user/${review.author.username}#person`,
      name: review.author.username,
      url: `${baseUrl}/user/${review.author.username}`,
    },
    datePublished: toISO8601(review.createdAt)!,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
    },
    reviewBody: sanitizeForSchema(review.comment),
  }));

  const schema: ProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${baseUrl}/content/${product.slug}#product`,
    name: product.title,
    description: sanitizeForSchema(product.description) || '',
    image: validateImageUrl(imageUrl || coverImage?.url, baseUrl) || `${baseUrl}/logo.png`,
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
    offers: {
      '@type': 'Offer',
      price: product.isFree ? '0' : (product.priceCoins || 0).toString(),
      priceCurrency: 'USD',
      availability: product.status === 'approved' 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/content/${product.slug}`,
      seller: {
        '@type': 'Person',
        '@id': `${baseUrl}/user/${author.username}#person`,
        name: author.username,
        url: `${baseUrl}/user/${author.username}`,
      },
    },
    sku: product.id,
    ...(additionalType && { additionalType }),
    ...(product.category && { category: product.category }),
  };
  
  // Conditional: Include aggregateRating only when minimum 5 reviews present
  if (reviewCount && shouldIncludeRating(reviewCount) && averageRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount: reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  
  // Include individual reviews
  if (reviewSchemas && reviewSchemas.length > 0) {
    schema.review = reviewSchemas;
  }
  
  // Validate required properties
  if (!validateRequiredProperties(schema, ['name', 'offers'])) {
    throw new Error('Missing required Product schema properties');
  }
  
  return schema;
}

/**
 * Generate comprehensive Person schema for user profiles
 * Follows Schema.org 2025 Person specification
 */
export function generatePersonSchema(params: {
  user: User;
  baseUrl: string;
  reputationScore?: number;
  threadCount?: number;
  replyCount?: number;
  badges?: string[];
}): PersonSchema {
  const { user, baseUrl, reputationScore, threadCount, replyCount, badges } = params;
  
  // Build name from firstName/lastName or fallback to username
  const name = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.username;
  
  // Build sameAs array from social profiles
  const sameAs: string[] = [];
  if (user.youtubeUrl) sameAs.push(user.youtubeUrl);
  if (user.instagramHandle) {
    // Handle both full URLs and handles
    const instaUrl = user.instagramHandle.startsWith('http') 
      ? user.instagramHandle 
      : `https://instagram.com/${user.instagramHandle}`;
    sameAs.push(instaUrl);
  }
  if (user.telegramHandle) {
    // Handle both full URLs and handles
    const telegramUrl = user.telegramHandle.startsWith('http') || user.telegramHandle.startsWith('https://t.me/')
      ? user.telegramHandle
      : `https://t.me/${user.telegramHandle}`;
    sameAs.push(telegramUrl);
  }
  if (user.myfxbookLink) sameAs.push(user.myfxbookLink);
  
  // Build knowsAbout from badges (expertise areas)
  const knowsAbout: string[] = [];
  if (badges && badges.length > 0) {
    // Map badge types to expertise areas
    const badgeToExpertise: Record<string, string> = {
      'EA_EXPERT': 'Expert Advisor Development',
      'TRADER_PRO': 'Forex Trading',
      'HELPFUL_MEMBER': 'Community Support',
      'TOP_CONTRIBUTOR': 'Technical Analysis',
      'VERIFIED_TRADER': 'Live Trading',
      'EARLY_ADOPTER': 'Trading Systems',
      'CONTENT_CREATOR': 'Trading Education'
    };
    badges.forEach(badge => {
      if (badgeToExpertise[badge]) {
        knowsAbout.push(badgeToExpertise[badge]);
      }
    });
  }
  
  // Add default expertise based on user level
  if (!knowsAbout.length) {
    knowsAbout.push('Forex Trading', 'Expert Advisors');
  }
  
  // Build interaction statistics
  const interactionStatistic: InteractionCounter[] = [];
  if (threadCount) {
    interactionStatistic.push({
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CreateAction',
      userInteractionCount: threadCount,
    });
  }
  if (replyCount) {
    interactionStatistic.push({
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: replyCount,
    });
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${baseUrl}/user/${user.username}#person`,
    name,
    url: `${baseUrl}/user/${user.username}`,
    image: user.profileImageUrl || `${baseUrl}/default-avatar.png`,
    description: `Forex trader and community member on YoForex with ${reputationScore || 0} reputation points`,
    jobTitle: 'Forex Trader',
    worksFor: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: 'YoForex Community',
      url: baseUrl,
    },
    ...(sameAs.length > 0 && { sameAs }),
    ...(knowsAbout.length > 0 && { knowsAbout }),
    ...(interactionStatistic.length > 0 && { interactionStatistic }),
  };
}

/**
 * Generate ProfilePage schema for user profiles (legacy)
 * Use generatePersonSchema for comprehensive Person schema
 */
export function generateProfilePageSchema(params: {
  user: User;
  canonicalUrl: string;
}): ProfilePageSchema {
  const { user, canonicalUrl } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': canonicalUrl,
    mainEntity: {
      '@type': 'Person',
      '@id': `${canonicalUrl}#person`,
      name: user.username,
      url: canonicalUrl,
      image: user.profileImageUrl || undefined,
    },
    dateCreated: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
  };
}

/**
 * Generate FAQPage schema from Q&A content (Schema.org 2025 Enhanced)
 */
export function generateFAQPageSchema(params: {
  questions: Array<{ question: string; answer: string; id?: string }>;
  baseUrl: string;
  pageUrl: string;
}): FAQPageSchema {
  const { questions, baseUrl, pageUrl } = params;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': pageUrl,
    mainEntity: questions.map((q, index) => ({
      '@type': 'Question',
      '@id': q.id || `${pageUrl}#question-${index + 1}`,
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        '@id': q.id ? `${pageUrl}#answer-${q.id}` : `${pageUrl}#answer-${index + 1}`,
        text: q.answer,
      },
    })),
  };
}

/**
 * Legacy alias for backward compatibility
 */
export function generateFAQSchema(
  questions: Array<{ question: string; answer: string }>
): FAQPageSchema {
  return generateFAQPageSchema({
    questions,
    baseUrl: SITE_CONFIG.url,
    pageUrl: `${SITE_CONFIG.url}/faq`,
  });
}

/**
 * Generate VideoObject schema (Schema.org 2025 Enhanced)
 * Supports duration conversion and interaction statistics
 */
export function generateVideoObjectSchema(params: {
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: Date;
  videoUrl?: string;
  embedUrl?: string;
  durationSeconds?: number;
  viewCount?: number;
  baseUrl: string;
  author?: User;
}): VideoObjectSchema {
  const { title, description, thumbnailUrl, uploadDate, videoUrl, embedUrl, durationSeconds, viewCount, baseUrl, author } = params;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': videoUrl || embedUrl || `${baseUrl}/video/${title.toLowerCase().replace(/\s+/g, '-')}`,
    name: title,
    description,
    thumbnailUrl,
    uploadDate: new Date(uploadDate).toISOString(),
    ...(videoUrl && { contentUrl: videoUrl }),
    ...(embedUrl && { embedUrl }),
    ...(durationSeconds && { duration: secondsToISO8601Duration(durationSeconds) }),
    ...(viewCount && {
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/WatchAction',
        userInteractionCount: viewCount,
      },
    }),
    ...(author && {
      author: {
        '@type': 'Person',
        name: author.username,
        url: `${baseUrl}/user/${author.username}`,
      },
    }),
  };
}

/**
 * Legacy alias for backward compatibility
 */
export function generateVideoSchema(params: {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string;
  embedUrl?: string;
  views?: number;
}): VideoObjectSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': params.embedUrl || `${SITE_CONFIG.url}/video/${params.title.toLowerCase().replace(/\s+/g, '-')}`,
    name: params.title,
    description: params.description || '',
    thumbnailUrl: params.thumbnailUrl || '',
    uploadDate: params.uploadDate || new Date().toISOString(),
    duration: params.duration,
    embedUrl: params.embedUrl,
    interactionStatistic: params.views
      ? {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/WatchAction',
          userInteractionCount: params.views,
        }
      : undefined,
  };
}

/**
 * Generate DiscussionForumPosting schema for forum threads (Schema.org 2025)
 * Includes interaction statistics, comments, and nested replies
 */
export function generateDiscussionForumPostingSchema(params: {
  thread: ForumThread;
  author: User;
  baseUrl: string;
  viewCount?: number;
  replyCount?: number;
  upvoteCount?: number;
  replies?: Array<{ id: string; content: string; author: User; createdAt: Date; upvotes?: number }>;
}): DiscussionForumPostingSchema {
  const { thread, author, baseUrl, viewCount, replyCount, upvoteCount, replies } = params;
  
  const threadUrl = `${baseUrl}/thread/${thread.slug}`;
  
  // Build interaction statistics array
  const interactionStatistic: InteractionCounter[] = [];
  
  if (viewCount !== undefined) {
    interactionStatistic.push({
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ViewAction',
      userInteractionCount: viewCount,
    });
  }
  
  if (replyCount !== undefined) {
    interactionStatistic.push({
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: replyCount,
    });
  }
  
  if (upvoteCount !== undefined) {
    interactionStatistic.push({
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/LikeAction',
      userInteractionCount: upvoteCount,
    });
  }
  
  // Build comment schemas if replies are provided
  const comments: CommentSchema[] | undefined = replies?.map((reply) => ({
    '@context': 'https://schema.org',
    '@type': 'Comment',
    '@id': `${threadUrl}#comment-${reply.id}`,
    text: sanitizeForSchema(reply.content) || '',
    author: {
      '@type': 'Person',
      '@id': `${baseUrl}/user/${reply.author.username}#person`,
      name: reply.author.username,
      url: `${baseUrl}/user/${reply.author.username}`,
    },
    datePublished: toISO8601(reply.createdAt)!,
    ...(reply.upvotes !== undefined && { upvoteCount: reply.upvotes }),
    parentItem: { '@id': threadUrl },
  }));
  
  const schema: DiscussionForumPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': threadUrl,
    headline: thread.title.substring(0, 110),
    articleBody: sanitizeForSchema(thread.body) || '',
    author: {
      '@type': 'Person',
      '@id': `${baseUrl}/user/${author.username}#person`,
      name: author.username,
      url: `${baseUrl}/user/${author.username}`,
    },
    datePublished: toISO8601(thread.createdAt)!,
    dateModified: toISO8601(thread.updatedAt)!,
    url: threadUrl,
    mainEntityOfPage: { '@id': threadUrl },
    inLanguage: getLanguage(thread.body),
    publisher: {
      '@type': 'Organization',
      '@id': SITE_CONFIG.organizationId,
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.logo,
      },
    },
  };
  
  // Add interaction statistics if provided
  if (interactionStatistic.length > 0) {
    schema.interactionStatistic = interactionStatistic;
  }
  
  // Add comments if provided
  if (comments && comments.length > 0) {
    schema.comment = comments;
  }
  
  // Add commentCount if provided
  if (replyCount !== undefined) {
    schema.commentCount = replyCount;
  }
  
  return schema;
}

/**
 * Generate NewsArticle schema (Schema.org 2025)
 * For news articles with dateline and news-specific metadata
 */
export function generateNewsArticleSchema(params: {
  headline: string;
  description?: string;
  content: string;
  author: User;
  publishDate: Date;
  modifiedDate?: Date;
  baseUrl: string;
  url: string;
  imageUrl?: string;
  location?: string;
  commentCount?: number;
}): NewsArticleSchema {
  const { headline, description, content, author, publishDate, modifiedDate, baseUrl, url, imageUrl, location, commentCount } = params;
  
  const schema: NewsArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${baseUrl}${url}#newsarticle`,
    headline: headline.substring(0, 110),
    description: sanitizeForSchema(description),
    image: validateImageUrl(imageUrl, baseUrl),
    datePublished: toISO8601(publishDate)!,
    dateModified: toISO8601(modifiedDate) || toISO8601(publishDate)!,
    author: {
      '@type': 'Person',
      '@id': `${baseUrl}/user/${author.username}#person`,
      name: author.firstName && author.lastName ? `${author.firstName} ${author.lastName}` : author.username,
      url: `${baseUrl}/user/${author.username}`,
    },
    publisher: {
      '@type': 'Organization',
      '@id': SITE_CONFIG.organizationId,
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.logo,
      },
    },
    articleBody: sanitizeForSchema(content),
    inLanguage: getLanguage(content),
    url: `${baseUrl}${url}`,
    ...(location && { dateline: location }),
  };
  
  // Conditional: Add commentCount only if comments exist
  if (commentCount && commentCount > 0) {
    (schema as any).commentCount = commentCount;
  }
  
  // Validate required properties
  if (!validateRequiredProperties(schema, ['headline', 'datePublished', 'author', 'publisher'])) {
    throw new Error('Missing required NewsArticle schema properties');
  }
  
  return schema;
}

/**
 * Generate BlogPosting schema (Schema.org 2025)
 * For blog posts with word count and article sections
 */
export function generateBlogPostingSchema(params: {
  title: string;
  description?: string;
  content: string;
  author: User;
  publishDate: Date;
  modifiedDate?: Date;
  baseUrl: string;
  url: string;
  imageUrl?: string;
  category?: string;
  commentCount?: number;
}): BlogPostingSchema {
  const { title, description, content, author, publishDate, modifiedDate, baseUrl, url, imageUrl, category, commentCount } = params;
  
  const schema: BlogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${baseUrl}${url}#blogposting`,
    headline: title.substring(0, 110),
    description: sanitizeForSchema(description),
    image: validateImageUrl(imageUrl, baseUrl),
    datePublished: toISO8601(publishDate)!,
    dateModified: toISO8601(modifiedDate) || toISO8601(publishDate)!,
    author: {
      '@type': 'Person',
      '@id': `${baseUrl}/user/${author.username}#person`,
      name: author.firstName && author.lastName ? `${author.firstName} ${author.lastName}` : author.username,
      url: `${baseUrl}/user/${author.username}`,
    },
    publisher: {
      '@type': 'Organization',
      '@id': SITE_CONFIG.organizationId,
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.logo,
      },
    },
    articleBody: sanitizeForSchema(content),
    wordCount: getWordCount(content),
    inLanguage: getLanguage(content),
    url: `${baseUrl}${url}`,
    mainEntityOfPage: { '@id': `${baseUrl}${url}` },
    ...(category && { articleSection: category }),
  };
  
  // Conditional: Add commentCount only if comments exist
  if (commentCount && commentCount > 0) {
    (schema as any).commentCount = commentCount;
  }
  
  // Validate required properties
  if (!validateRequiredProperties(schema, ['headline', 'datePublished', 'author', 'publisher'])) {
    throw new Error('Missing required BlogPosting schema properties');
  }
  
  return schema;
}

// ============================================================================
// COMBINED SCHEMA BUILDERS
// ============================================================================

/**
 * Generate complete homepage schema using @graph
 * Includes WebSite + Organization
 */
export function generateHomepageSchema(config: SiteConfig = SITE_CONFIG) {
  return {
    '@context': 'https://schema.org',
    '@graph': [generateOrganizationSchema(config), generateWebSiteSchema(config)],
  };
}

/**
 * Generate schema for inner pages with breadcrumbs
 */
export function generatePageWithBreadcrumbsSchema(
  breadcrumbItems: Array<{ name: string; url: string }>,
  config: SiteConfig = SITE_CONFIG
) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      generateBreadcrumbSchema(breadcrumbItems),
      {
        '@type': 'Organization',
        '@id': config.organizationId,
        name: config.name,
        url: config.url,
        logo: config.logo,
      },
    ],
  };
}

// ============================================================================
// CONTENT TYPE DETECTION
// ============================================================================

export type ContentType =
  | 'homepage'
  | 'article'
  | 'product'
  | 'category'
  | 'profile'
  | 'faq'
  | 'video'
  | 'generic';

/**
 * Detect content type based on path and data
 */
export function detectContentType(pathname: string): ContentType {
  if (pathname === '/') return 'homepage';
  if (pathname.startsWith('/thread/') || pathname.startsWith('/discussions/'))
    return 'article';
  if (pathname.startsWith('/content/') || pathname.startsWith('/marketplace/'))
    return 'product';
  if (pathname.startsWith('/category/')) return 'category';
  if (pathname.startsWith('/user/')) return 'profile';
  if (pathname.startsWith('/faq')) return 'faq';

  return 'generic';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert seconds to ISO 8601 duration format (e.g., PT2M30S)
 * Used for VideoObject duration property
 */
export function secondsToISO8601Duration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  let duration = 'PT';
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;
  if (secs > 0 || duration === 'PT') duration += `${secs}S`;
  
  return duration;
}

/**
 * Convert schema object to JSON-LD script tag
 */
export function schemaToScriptTag(schema: any): string {
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}

/**
 * Validate schema structure (basic validation)
 * For production, use Google Rich Results Test API
 */
export function validateSchema(schema: BaseSchema): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!schema['@context']) {
    errors.push('Missing @context property');
  }

  if (!schema['@type']) {
    errors.push('Missing @type property');
  }

  if (schema['@context'] !== 'https://schema.org') {
    errors.push('Invalid @context - must be "https://schema.org"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate validation URL for Google Rich Results Test
 */
export function getRichResultsTestUrl(pageUrl: string): string {
  return `https://search.google.com/test/rich-results?url=${encodeURIComponent(pageUrl)}`;
}

/**
 * Generate validation URL for Schema.org Validator
 */
export function getSchemaValidatorUrl(pageUrl: string): string {
  return `https://validator.schema.org/#url=${encodeURIComponent(pageUrl)}`;
}
