import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryDiscussionClient from './CategoryDiscussionClient';
import type { ForumCategory, ForumThread } from '@shared/schema';

// Express API base URL - use internal API URL for SSR
const EXPRESS_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'
  : 'http://127.0.0.1:3001';

// Enable ISR with 60-second revalidation
export const revalidate = 60;
export const dynamicParams = true;

// Pre-generate static pages for all categories
export async function generateStaticParams() {
  try {
    const res = await fetch(`${EXPRESS_URL}/api/categories`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      return [];
    }
    
    const categories = await res.json();
    return categories.map((cat: any) => ({
      slug: cat.slug,
    }));
  } catch (error) {
    console.error('Error fetching categories for static params:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${EXPRESS_URL}/api/categories/${slug}`, { 
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return {
        title: 'Category Not Found | YoForex',
      };
    }

    const category: ForumCategory = await res.json();
    
    return {
      title: `${category.name} - Forum Discussions | YoForex`,
      description: `Browse ${category.name} discussions, questions, and expert advice on YoForex`,
      keywords: `${category.name}, forex, MT4, MT5, trading strategies`,
      openGraph: {
        title: `${category.name} - Forum Discussions | YoForex`,
        description: `Browse ${category.name} discussions, questions, and expert advice on YoForex`,
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `${category.name} - Forum Discussions | YoForex`,
        description: `Browse ${category.name} discussions, questions, and expert advice on YoForex`,
      },
    };
  } catch (error) {
    return {
      title: 'Category Not Found | YoForex',
    };
  }
}

// Main page component (Server Component)
export default async function CategoryDiscussionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Parallel data fetching with error handling
  const [categoryRes, threadsRes] = await Promise.all([
    fetch(`${EXPRESS_URL}/api/categories/${slug}`, { 
      next: { revalidate: 60 },
    }).catch(() => null),
    fetch(`${EXPRESS_URL}/api/categories/${slug}/threads`, { 
      next: { revalidate: 60 },
    }).catch(() => null),
  ]);

  // Parse responses
  let category: ForumCategory | undefined = undefined;
  let threads: ForumThread[] = [];

  if (categoryRes && categoryRes.ok) {
    try {
      category = await categoryRes.json();
    } catch (error) {
      console.error('Error parsing category:', error);
    }
  }

  if (threadsRes && threadsRes.ok) {
    try {
      threads = await threadsRes.json();
    } catch (error) {
      console.error('Error parsing threads:', error);
    }
  }

  // Return 404 if category doesn't exist
  if (!category) {
    notFound();
  }

  // Pass all data to Client Component
  return (
    <CategoryDiscussionClient
      slug={slug}
      initialCategory={category}
      initialThreads={threads}
    />
  );
}
