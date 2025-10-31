import type { Metadata } from 'next';
import MarketplaceClient from './MarketplaceClient';
import { getInternalApiUrl } from '../lib/api-config';

// Enable ISR with 60-second revalidation
export const revalidate = 60;

// Generate SEO metadata
export const metadata: Metadata = {
  title: 'EA & Indicator Marketplace | YoForex',
  description: 'Browse and download expert advisors (EAs) and indicators for MT4/MT5. Find free and premium trading tools from expert developers.',
  keywords: ['forex EA', 'MT4 indicators', 'MT5 expert advisor', 'trading tools', 'forex marketplace'],
  openGraph: {
    title: 'EA & Indicator Marketplace | YoForex',
    description: 'Browse and download expert advisors (EAs) and indicators for MT4/MT5. Find free and premium trading tools from expert developers.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EA & Indicator Marketplace | YoForex',
    description: 'Browse and download expert advisors (EAs) and indicators for MT4/MT5. Find free and premium trading tools from expert developers.',
  },
};

// Fetch marketplace content from Express API
async function getMarketplaceContent() {
  try {
    // Use centralized API config for SSR
    const apiUrl = getInternalApiUrl();
    const res = await fetch(`${apiUrl}/api/content?status=approved`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      console.error('Failed to fetch marketplace content:', res.status, res.statusText);
      return [];
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching marketplace content:', error);
    return [];
  }
}

export default async function MarketplacePage() {
  const initialContent = await getMarketplaceContent();

  return <MarketplaceClient initialContent={initialContent} />;
}
