import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EADetailClient from './EADetailClient';
import { getInternalApiUrl } from '../../lib/api-config';

// Enable ISR with 60-second revalidation
export const revalidate = 60;

// Generate SEO metadata dynamically
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${getInternalApiUrl()}/api/content/by-slug/${params.slug}`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      return {
        title: 'EA Not Found | YoForex',
      };
    }
    
    const ea = await res.json();
    
    return {
      title: `${ea.title} | Expert Advisors | YoForex`,
      description: ea.autoMetaDescription || ea.description.substring(0, 160),
      keywords: ea.hashtags || [ea.focusKeyword, 'forex EA', 'MT4', 'MT5', 'expert advisor'],
      openGraph: {
        title: ea.title,
        description: ea.autoMetaDescription || ea.description.substring(0, 160),
        type: 'website',
        images: ea.imageUrls || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: ea.title,
        description: ea.autoMetaDescription || ea.description.substring(0, 160),
        images: ea.imageUrls || [],
      },
    };
  } catch (error) {
    return {
      title: 'EA Not Found | YoForex',
    };
  }
}

// Fetch EA data
async function getEA(slug: string) {
  try {
    const res = await fetch(`${getInternalApiUrl()}/api/content/by-slug/${slug}`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching EA:', error);
    return null;
  }
}

// Fetch similar EAs
async function getSimilarEAs(category: string, excludeId: string) {
  try {
    const apiUrl = getInternalApiUrl();
    const res = await fetch(`${apiUrl}/api/content?type=ea&status=approved&category=${category}&limit=4`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      return [];
    }
    
    const eas = await res.json();
    return eas.filter((ea: any) => ea.id !== excludeId).slice(0, 4);
  } catch (error) {
    return [];
  }
}

export default async function EADetailPage({ params }: { params: { slug: string } }) {
  const ea = await getEA(params.slug);
  
  if (!ea || ea.type !== 'ea') {
    notFound();
  }
  
  const similarEAs = await getSimilarEAs(ea.category || 'Trend Following', ea.id);
  
  return <EADetailClient ea={ea} similarEAs={similarEAs} />;
}
