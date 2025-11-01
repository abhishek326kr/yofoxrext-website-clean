import type { Metadata } from 'next';
import PublishEAClient from './PublishEAClient';
import { getInternalApiUrl } from '../lib/api-config';

// Enable ISR with 60-second revalidation
export const revalidate = 60;

// Generate SEO metadata
export const metadata: Metadata = {
  title: 'Expert Advisors Marketplace | Browse & Publish EAs | YoForex',
  description: 'Browse and download expert advisors (EAs) for MT4/MT5. Find automated trading systems from expert developers or publish your own EA for sale.',
  keywords: ['forex EA', 'MT4 expert advisor', 'MT5 EA', 'automated trading', 'EA marketplace', 'publish EA'],
  openGraph: {
    title: 'Expert Advisors Marketplace | YoForex',
    description: 'Browse and download expert advisors (EAs) for MT4/MT5. Find automated trading systems from expert developers.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expert Advisors Marketplace | YoForex',
    description: 'Browse and download expert advisors (EAs) for MT4/MT5. Find automated trading systems from expert developers.',
  },
};

// Fetch EAs from Express API
async function getEAs() {
  try {
    const apiUrl = getInternalApiUrl();
    const res = await fetch(`${apiUrl}/api/content?type=ea&status=approved`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      console.error('Failed to fetch EAs:', res.status, res.statusText);
      return [];
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching EAs:', error);
    return [];
  }
}

export default async function PublishEAPage() {
  const initialEAs = await getEAs();
  
  // Calculate stats from the fetched data
  const stats = {
    totalEAs: initialEAs.length,
    totalDownloads: initialEAs.reduce((sum, ea) => sum + (ea.downloads || 0), 0),
    totalSellers: new Set(initialEAs.map(ea => ea.creatorId)).size
  };

  return <PublishEAClient initialEAs={initialEAs} stats={stats} />;
}
