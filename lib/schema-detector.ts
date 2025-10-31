/**
 * Automated Content Type Detection for Dynamic Schema Generation
 * 
 * Analyzes content metadata, structure, and context to determine
 * the most appropriate Schema.org type for SEO optimization.
 */

import { ForumThread, Content, User } from '@shared/schema';

export type SchemaType = 
  | 'DiscussionForumPosting'
  | 'Product'
  | 'Article'
  | 'BlogPosting'
  | 'NewsArticle'
  | 'FAQPage'
  | 'VideoObject'
  | 'Person'
  | 'Organization'
  | 'WebSite';

export interface ContentAnalysis {
  schemaType: SchemaType;
  confidence: number; // 0-1 score
  reasons: string[]; // Why this type was selected
}

/**
 * Detect appropriate schema type for forum threads
 */
export function detectThreadSchemaType(thread: ForumThread, category?: { slug: string; name: string }): ContentAnalysis {
  const reasons: string[] = [];
  
  // Check if it's a FAQ-style thread (question in title)
  if (thread.title.toLowerCase().match(/\?(.*)?$/)) {
    reasons.push('Title contains question mark - FAQ pattern detected');
    return { schemaType: 'FAQPage', confidence: 0.8, reasons };
  }
  
  // Check if it's a news article (time-sensitive, recent)
  const publishedDate = new Date(thread.createdAt);
  const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSincePublished <= 2 && (
    thread.title.toLowerCase().includes('breaking') ||
    thread.title.toLowerCase().includes('news') ||
    thread.title.toLowerCase().includes('announcement')
  )) {
    reasons.push('Recent publication (< 2 days) with news keywords');
    return { schemaType: 'NewsArticle', confidence: 0.9, reasons };
  }
  
  // Check if it's a blog-style post (long-form, editorial)
  if (category?.slug.includes('blog') || category?.slug.includes('editorial') || 
      thread.title.toLowerCase().includes('guide') || 
      thread.title.toLowerCase().includes('tutorial')) {
    reasons.push('Category or title indicates blog/editorial content');
    return { schemaType: 'BlogPosting', confidence: 0.85, reasons };
  }
  
  // Check if it contains video (check in body content)
  if (thread.body?.toLowerCase().includes('youtube.com') || 
      thread.body?.toLowerCase().includes('vimeo.com') ||
      thread.body?.toLowerCase().includes('video')) {
    reasons.push('Content contains video links');
    return { schemaType: 'VideoObject', confidence: 0.75, reasons };
  }
  
  // Default: Forum discussion
  reasons.push('Standard forum discussion with replies');
  return { schemaType: 'DiscussionForumPosting', confidence: 1.0, reasons };
}

/**
 * Detect appropriate schema type for marketplace content
 */
export function detectContentSchemaType(content: Content, category?: { slug: string; name: string }): ContentAnalysis {
  const reasons: string[] = [];
  
  // Marketplace items (EAs, Indicators, source code with pricing)
  if (content.type === 'ea' || content.type === 'indicator' || content.type === 'source_code' || 
      !content.isFree || (content.priceCoins !== undefined && content.priceCoins > 0)) {
    reasons.push(`Content type: ${content.type}, has pricing`);
    return { schemaType: 'Product', confidence: 1.0, reasons };
  }
  
  // Educational content (articles can be tutorials/guides)
  if (content.type === 'article' && (
      category?.slug.includes('tutorial') || 
      category?.slug.includes('guide') ||
      content.title?.toLowerCase().includes('tutorial') ||
      content.title?.toLowerCase().includes('guide'))) {
    reasons.push('Educational content type detected');
    return { schemaType: 'BlogPosting', confidence: 0.9, reasons };
  }
  
  // Video content (check description for video links)
  if (content.description?.toLowerCase().includes('youtube.com') || 
      content.description?.toLowerCase().includes('vimeo.com') ||
      content.description?.toLowerCase().includes('video')) {
    reasons.push('Content has video URL or video type');
    return { schemaType: 'VideoObject', confidence: 1.0, reasons };
  }
  
  // Default: Article
  reasons.push('General article content');
  return { schemaType: 'Article', confidence: 0.8, reasons };
}

/**
 * Detect schema type for any page based on URL pattern
 */
export function detectPageSchemaType(pathname: string): ContentAnalysis {
  const reasons: string[] = [];
  
  // User profiles
  if (pathname.match(/^\/user\/[^/]+$/)) {
    reasons.push('User profile page pattern');
    return { schemaType: 'Person', confidence: 1.0, reasons };
  }
  
  // Homepage
  if (pathname === '/' || pathname === '/home') {
    reasons.push('Homepage');
    return { schemaType: 'WebSite', confidence: 1.0, reasons };
  }
  
  // Thread pages
  if (pathname.includes('/thread/') || pathname.match(/\/category\/.*\/[^/]+$/)) {
    reasons.push('Thread page pattern');
    return { schemaType: 'DiscussionForumPosting', confidence: 0.9, reasons };
  }
  
  // Marketplace
  if (pathname.includes('/marketplace') || pathname.includes('/content/')) {
    reasons.push('Marketplace/content page pattern');
    return { schemaType: 'Product', confidence: 0.85, reasons };
  }
  
  // FAQ pages
  if (pathname.includes('/faq') || pathname.includes('/help')) {
    reasons.push('FAQ/help page pattern');
    return { schemaType: 'FAQPage', confidence: 0.9, reasons };
  }
  
  // Default
  reasons.push('Generic page');
  return { schemaType: 'Article', confidence: 0.5, reasons };
}

/**
 * Main detection function - analyzes all available data
 */
export function detectSchemaType(params: {
  thread?: ForumThread;
  content?: Content;
  user?: User;
  pathname?: string;
  category?: { slug: string; name: string };
}): ContentAnalysis {
  const { thread, content, user, pathname, category } = params;
  
  // Priority 1: User profile
  if (user && pathname?.includes('/user/')) {
    return { 
      schemaType: 'Person', 
      confidence: 1.0, 
      reasons: ['User profile page with user data'] 
    };
  }
  
  // Priority 2: Marketplace content
  if (content) {
    return detectContentSchemaType(content, category);
  }
  
  // Priority 3: Forum thread
  if (thread) {
    return detectThreadSchemaType(thread, category);
  }
  
  // Priority 4: URL-based detection
  if (pathname) {
    return detectPageSchemaType(pathname);
  }
  
  // Fallback
  return { 
    schemaType: 'Article', 
    confidence: 0.3, 
    reasons: ['Insufficient data for accurate detection'] 
  };
}

/**
 * Helper: Check if content should use Product schema
 */
export function isProductContent(content: Content): boolean {
  return content.type === 'ea' || 
         content.type === 'indicator' || 
         content.type === 'source_code' ||
         !content.isFree ||
         (content.priceCoins !== undefined && content.priceCoins > 0);
}

/**
 * Helper: Check if thread should use FAQ schema
 */
export function isFAQThread(thread: ForumThread): boolean {
  return thread.title.toLowerCase().match(/\?(.*)?$/) !== null;
}

/**
 * Helper: Check if content is news-worthy (< 2 days old)
 */
export function isNewsContent(publishDate: Date): boolean {
  const daysSince = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= 2;
}
