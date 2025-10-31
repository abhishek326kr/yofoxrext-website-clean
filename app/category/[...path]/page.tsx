/**
 * Hierarchical Category & Thread Page (Catch-all Route)
 * 
 * Handles both:
 * 1. Category browsing: /category/trading-strategies/scalping-m1-m15
 * 2. Thread pages: /category/trading-strategies/scalping-m1-m15/thread-slug
 * 
 * SEO-optimized with full hierarchical paths for better search engine discovery
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getInternalApiUrl } from '@/lib/api-config';
import { getCategoryByPath } from '@/lib/category-path';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import { SchemaScript } from '@/components/SchemaGenerator';
import { generateDiscussionForumPostingSchema, generateProductSchema, generateFAQPageSchema, generateNewsArticleSchema, generateBlogPostingSchema, generateVideoObjectSchema } from '@/lib/schema-generator';
import { detectSchemaType } from '@/lib/schema-detector';
import { db } from '@/lib/db';
import { forumCategories } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Dynamic imports for components with dynamic route segments
const loadThreadClient = () => import('../../thread/[slug]/ThreadDetailClient');
const loadCategoryClient = () => import('../[slug]/CategoryDiscussionClient');
const loadContentClient = () => import('../../content/[slug]/ContentDetailClient');

type Props = {
  params: { path: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path: pathSegments } = await params;
  const lastSlug = pathSegments[pathSegments.length - 1];
  const categoryPath = pathSegments.slice(0, -1).join('/');
  
  // Try to find a thread first (most specific)
  try {
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/api/threads/slug/${lastSlug}`);
    if (response.ok) {
      const thread = await response.json();
      return {
        title: thread.title,
        description: thread.body?.substring(0, 160) || `Discussion about ${thread.title}`,
        keywords: [
          'forex forum',
          'trading discussion',
          thread.title,
          ...categoryPath.split('/'),
        ],
        openGraph: {
          title: thread.title,
          description: thread.body?.substring(0, 160),
          url: `/category/${pathSegments.join('/')}`,
          type: 'article',
        },
      };
    }
  } catch (error) {
    // Not a thread, continue to check if it's a category
  }
  
  // Check if it's a marketplace content item
  try {
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/api/content/slug/${lastSlug}`);
    if (response.ok) {
      const content = await response.json();
      return {
        title: `${content.title} | YoForex Marketplace`,
        description: content.description?.substring(0, 160) || `Download ${content.title}`,
        keywords: ['forex EA', 'trading indicator', content.title],
        openGraph: {
          title: content.title,
          description: content.description?.substring(0, 160),
          url: `/category/${pathSegments.join('/')}`,
          type: 'article',
        },
      };
    }
  } catch (error) {
    // Not content either
  }
  
  // It must be a category page
  const fullPath = pathSegments.join('/');
  const category = await getCategoryByPath(fullPath);
  
  if (!category) {
    return {
      title: 'Category Not Found | YoForex',
    };
  }
  
  return {
    title: `${category.name} | YoForex Forum`,
    description: category.description || `Browse ${category.name} discussions and content`,
    keywords: ['forex forum', category.name, ...categoryPath.split('/')],
    openGraph: {
      title: category.name,
      description: category.description || `Browse ${category.name} discussions`,
      url: `/category/${fullPath}`,
      type: 'website',
    },
  };
}

export default async function HierarchicalCategoryPage({ params }: Props) {
  const { path: pathSegments } = await params;
  const lastSlug = pathSegments[pathSegments.length - 1];
  const categoryPath = pathSegments.slice(0, -1).join('/');
  
  // Try to find a thread first (most specific content)
  let thread = null;
  let replies = [];
  try {
    const apiUrl = getInternalApiUrl();
    const threadRes = await fetch(`${apiUrl}/api/threads/slug/${lastSlug}`);
    
    if (threadRes.ok) {
      thread = await threadRes.json();
      // Fetch replies using thread ID
      try {
        const repliesRes = await fetch(`${apiUrl}/api/threads/${thread.id}/replies`);
        if (repliesRes.ok) {
          replies = await repliesRes.json();
        }
      } catch (e) {
        // Replies fetch failed, continue with empty replies
        console.warn('Failed to fetch thread replies');
      }
    }
  } catch (error) {
    // Not a thread
  }
  
  if (thread) {
    // Detect schema type
    const schemaAnalysis = detectSchemaType({ thread, pathname: `/category/${pathSegments.join('/')}` });
    
    // Fetch author data with graceful fallback
    const apiUrl = getInternalApiUrl();
    let author = null;
    try {
      const authorRes = await fetch(`${apiUrl}/api/users/${thread.authorId}`);
      if (authorRes.ok) author = await authorRes.json();
    } catch (e) {
      // Fallback to anonymous author if fetch fails
      console.warn('Author fetch failed, using anonymous author');
    }
    
    // Always provide fallback author to prevent schema generation failure
    if (!author) {
      author = {
        id: 'anonymous',
        username: 'Anonymous',
        profileImageUrl: null
      };
    }
    
    // Generate schema based on detected type with error handling
    let schema = null;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com';
    
    try {
      switch (schemaAnalysis.schemaType) {
        case 'FAQPage':
          // FAQ schema for Q&A threads
          const faqQuestions = [{
            question: thread.title,
            answer: thread.body || 'See discussion for details',
            id: thread.id
          }];
          // Add top replies as additional Q&A pairs
          if (replies && replies.length > 0) {
            replies.slice(0, 3).forEach((reply: any) => {
              if (reply.body) {
                faqQuestions.push({
                  question: `Reply: ${thread.title}`,
                  answer: reply.body,
                  id: reply.id
                });
              }
            });
          }
          schema = generateFAQPageSchema({
            questions: faqQuestions,
            baseUrl,
            pageUrl: `/category/${pathSegments.join('/')}`
          });
          break;
          
        case 'NewsArticle':
          // News article schema for recent news threads
          schema = generateNewsArticleSchema({
            headline: thread.title,
            description: thread.body?.substring(0, 160),
            content: thread.body || '',
            author,
            publishDate: new Date(thread.createdAt),
            modifiedDate: thread.updatedAt ? new Date(thread.updatedAt) : undefined,
            baseUrl,
            url: `/category/${pathSegments.join('/')}`,
            imageUrl: undefined,
            location: undefined,
            commentCount: replies?.length || 0,
          });
          break;
          
        case 'BlogPosting':
          // Blog posting schema for tutorials/guides
          schema = generateBlogPostingSchema({
            title: thread.title,
            description: thread.body?.substring(0, 160),
            content: thread.body || '',
            author,
            publishDate: new Date(thread.createdAt),
            modifiedDate: thread.updatedAt ? new Date(thread.updatedAt) : undefined,
            baseUrl,
            url: `/category/${pathSegments.join('/')}`,
            imageUrl: undefined,
            category: pathSegments[0],
            commentCount: replies?.length || 0,
          });
          break;
        
        case 'VideoObject':
          // Video object schema for threads with video links
          // Extract video URL from thread body
          const youtubeMatch = thread.body?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
          const videoId = youtubeMatch ? youtubeMatch[1] : null;
          const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
          
          schema = generateVideoObjectSchema({
            title: thread.title,
            description: thread.body?.substring(0, 160) || thread.title,
            thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : `${baseUrl}/default-video-thumbnail.jpg`,
            uploadDate: new Date(thread.createdAt),
            videoUrl: undefined,
            embedUrl,
            durationSeconds: undefined,
            viewCount: thread.viewCount || 0,
            baseUrl,
            author
          });
          break;
          
        case 'DiscussionForumPosting':
        default:
          // Standard forum discussion schema
          schema = generateDiscussionForumPostingSchema({
            thread,
            author,
            baseUrl,
            viewCount: thread.viewCount || 0,
            replyCount: replies?.length || 0,
            upvoteCount: thread.upvoteCount || 0,
            replies: replies?.slice(0, 10).map((r: any) => ({
              id: r.id,
              content: r.body,
              author: r.author || { username: 'Anonymous' },
              createdAt: new Date(r.createdAt),
              upvotes: r.helpfulCount || 0
            })) || []
          });
          break;
      }
    } catch (error) {
      console.error('[Schema Error]', error);
      // Omit schema entirely if generation fails
      schema = null;
    }
    
    // Render thread detail page with hierarchical breadcrumbs
    const { default: ThreadDetailClient } = await loadThreadClient();
    return (
      <>
        {schema && <SchemaScript schema={schema} />}
        <ThreadDetailClient initialThread={thread} initialReplies={replies} />
      </>
    );
  }
  
  // Try to find marketplace content
  let content = null;
  let author = null;
  let reviews = [];
  let similarContent = [];
  let authorReleases = [];
  
  try {
    const apiUrl = getInternalApiUrl();
    const contentRes = await fetch(`${apiUrl}/api/content/slug/${lastSlug}`);
    
    if (contentRes.ok) {
      content = await contentRes.json();
      
      // Fetch additional content data in parallel
      const [authorRes, reviewsRes, similarRes, releasesRes] = await Promise.all([
        fetch(`${apiUrl}/api/users/${content.authorId}`).catch(() => null),
        fetch(`${apiUrl}/api/content/${content.id}/reviews`).catch(() => null),
        fetch(`${apiUrl}/api/content/${content.id}/similar`).catch(() => null),
        fetch(`${apiUrl}/api/users/${content.authorId}/content`).catch(() => null),
      ]);
      
      if (authorRes && authorRes.ok) author = await authorRes.json();
      if (reviewsRes && reviewsRes.ok) reviews = await reviewsRes.json();
      if (similarRes && similarRes.ok) similarContent = await similarRes.json();
      if (releasesRes && releasesRes.ok) authorReleases = await releasesRes.json();
    }
  } catch (error) {
    // Not content either
  }
  
  if (content) {
    // Generate Product schema for marketplace items with error handling
    let schema = null;
    if (author) {
      try {
        const reviewCount = reviews?.length || 0;
        schema = generateProductSchema({
          product: content,
          baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com',
          author,
          // Conditional: Only include averageRating when >= 5 reviews
          averageRating: reviewCount >= 5 ? content.averageRating : undefined,
          reviewCount: reviewCount,
          reviews: reviews?.slice(0, 5).map((r: any) => ({
            author: r.author || { username: 'Anonymous' },
            rating: r.rating || 5,
            comment: r.comment || '',
            createdAt: new Date(r.createdAt)
          })) || []
        });
      } catch (error) {
        console.error('[Schema Error]', error);
        // Omit schema entirely if generation fails
        schema = null;
      }
    }
    
    // Render content detail page with all required data
    const { default: ContentDetailClient } = await loadContentClient();
    return (
      <>
        {schema && <SchemaScript schema={schema} />}
        <ContentDetailClient 
          slug={lastSlug}
          initialContent={content}
          initialAuthor={author}
          initialReviews={reviews}
          initialSimilarContent={similarContent}
          initialAuthorReleases={authorReleases}
        />
      </>
    );
  }
  
  // Must be a category browsing page
  const fullPath = pathSegments.join('/');
  const category = await getCategoryByPath(fullPath);
  
  if (!category) {
    notFound();
  }
  
  // Build breadcrumb path from category hierarchy
  const breadcrumbPath: { name: string; url: string }[] = [
    { name: 'Home', url: '/' },
  ];
  
  // Walk up the category hierarchy to build breadcrumbs
  const categorySegments = fullPath.split('/');
  for (let i = 0; i < categorySegments.length; i++) {
    const segmentPath = categorySegments.slice(0, i + 1).join('/');
    const segmentSlug = categorySegments[i];
    
    // Fetch category name for this segment
    const [segmentCategory] = await db
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.slug, segmentSlug))
      .limit(1);
    
    if (segmentCategory) {
      breadcrumbPath.push({
        name: segmentCategory.name,
        url: `/category/${segmentPath}`,
      });
    }
  }
  
  // Fetch threads for this category
  let threads = [];
  try {
    const apiUrl = getInternalApiUrl();
    const threadsRes = await fetch(`${apiUrl}/api/categories/${category.slug}/threads`);
    if (threadsRes.ok) {
      threads = await threadsRes.json();
    }
  } catch (error) {
    console.error('Error fetching category threads:', error);
  }
  
  // Render category discussion page with breadcrumbs
  const { default: CategoryDiscussionClient } = await loadCategoryClient();
  return (
    <>
      <BreadcrumbSchema path={breadcrumbPath} />
      <CategoryDiscussionClient 
        slug={category.slug} 
        initialCategory={category}
        initialThreads={threads}
      />
    </>
  );
}
