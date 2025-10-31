import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import type { ForumThread, ForumReply } from '@shared/schema';
import ThreadDetailClient from './ThreadDetailClient';
import { getThreadUrl } from '../../../lib/category-path';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchData(url: string) {
  try {
    const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
    const res = await fetch(`${expressUrl}${url}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch ${url}:`, res.status, res.statusText);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function createExcerpt(html: string, maxLength: number = 155): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const thread: ForumThread | null = await fetchData(`/api/threads/slug/${slug}`);

  if (!thread) {
    return {
      title: 'Thread Not Found - YoForex',
      description: 'The thread you are looking for does not exist.',
    };
  }

  const description = thread.metaDescription || createExcerpt(thread.body || '');
  const title = `${thread.title} - YoForex Forum`;

  return {
    title,
    description,
    keywords: [
      thread.categorySlug || 'forum',
      'EA discussion',
      'forex forum',
      'expert advisor',
      'trading discussion',
      'MT4',
      'MT5',
    ],
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://yoforex.com/thread/${slug}`,
      siteName: 'YoForex',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ThreadDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch thread data from Express API
  const thread: ForumThread | null = await fetchData(`/api/threads/slug/${slug}`);
  
  // Return 404 if thread doesn't exist
  if (!thread) {
    notFound();
  }
  
  // Generate hierarchical URL and perform permanent redirect (308 for SEO)
  // Note: Next.js uses 308 (not 301) for permanent redirects to preserve HTTP method
  // Both 301 and 308 transfer SEO equity equally; 308 is the modern standard
  const hierarchicalUrl = await getThreadUrl(thread);
  permanentRedirect(hierarchicalUrl);
}
