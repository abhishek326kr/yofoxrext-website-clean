import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import ContentDetailClient from './ContentDetailClient';
import type { Content, User as UserType, ContentReview } from '@shared/schema';
import { getContentUrl } from '../../../lib/category-path';

// Express API base URL
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    // Check if slug is UUID format
    const isUUID = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const endpoint = isUUID 
      ? `${EXPRESS_URL}/api/content/${slug}`
      : `${EXPRESS_URL}/api/content/slug/${slug}`;

    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) {
      return {
        title: 'Content Not Found | YoForex Marketplace',
      };
    }

    const content: Content = await res.json();
    
    // Get cover image
    const images = content.images || [];
    const coverImage = images.find(img => img.isCover) || images[0];
    
    // Create description from content description (first 150 chars)
    const description = content.description 
      ? content.description.substring(0, 150) + (content.description.length > 150 ? '...' : '')
      : `Download ${content.title} - ${content.type} for MT4/MT5`;
    
    // Get tags as keywords
    const tags = content.tags || [];
    const keywords = tags.length > 0 ? tags.join(', ') : 'forex, EA, indicator, MT4, MT5';

    return {
      title: `${content.title} | YoForex Marketplace`,
      description,
      keywords,
      openGraph: {
        title: content.title,
        description,
        images: coverImage?.url ? [{ url: coverImage.url }] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: content.title,
        description,
        images: coverImage?.url ? [coverImage.url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Content Not Found | YoForex Marketplace',
    };
  }
}

// Main page component (Server Component)
export default async function ContentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Check if slug is UUID format
  const isUUID = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  const contentEndpoint = isUUID 
    ? `${EXPRESS_URL}/api/content/${slug}`
    : `${EXPRESS_URL}/api/content/slug/${slug}`;

  // Fetch content with error handling that doesn't trigger Next.js 404
  let content: Content | undefined = undefined;
  try {
    const contentRes = await fetch(contentEndpoint, { 
      cache: 'no-store',
      // Prevent Next.js from treating this as a 404 route
    });
    if (contentRes.ok) {
      content = await contentRes.json();
    }
  } catch (error) {
    // Swallow error - we'll show custom error card
    content = undefined;
  }

  // If content not found, return 404
  if (!content) {
    return (
      <ContentDetailClient
        slug={slug}
        initialContent={undefined}
        initialAuthor={undefined}
        initialReviews={[]}
        initialSimilarContent={[]}
        initialAuthorReleases={[]}
      />
    );
  }

  // Generate hierarchical URL and perform permanent redirect (308 for SEO)
  // Note: Next.js uses 308 (not 301) for permanent redirects to preserve HTTP method
  // Both 301 and 308 transfer SEO equity equally; 308 is the modern standard
  const hierarchicalUrl = await getContentUrl(content);
  permanentRedirect(hierarchicalUrl);
}

// Enable dynamic rendering with no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
