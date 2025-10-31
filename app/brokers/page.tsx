import { Metadata } from 'next';
import BrokerDirectoryClient from './BrokerDirectoryClient';

// Broker type matching the React component
type Broker = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  overallRating: number | null;
  reviewCount: number;
  scamReportCount: number;
  isVerified: boolean;
  regulationSummary: string | null;
};

// Express API base URL
const EXPRESS_API_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

export const metadata: Metadata = {
  title: "Broker Directory | YoForex",
  description: "Find trusted forex brokers for MT4/MT5 trading. Compare regulations, spreads, reviews, and community ratings.",
  keywords: "forex brokers, MT4 brokers, MT5 brokers, broker reviews, regulated brokers",
  openGraph: {
    title: "Broker Directory | YoForex",
    description: "Find trusted forex brokers for MT4/MT5 trading. Compare regulations, spreads, reviews, and community ratings.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Broker Directory | YoForex",
    description: "Find trusted forex brokers for MT4/MT5 trading. Compare regulations, spreads, reviews, and community ratings.",
  },
};

export const revalidate = 0; // Disable caching for fresh data

export default async function BrokerDirectoryPage() {
  let brokers: Broker[] = [];
  
  try {
    const response = await fetch(`${EXPRESS_API_URL}/api/brokers`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      brokers = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch brokers:', error);
    // Continue with empty array, client will show empty state
  }

  return <BrokerDirectoryClient initialBrokers={brokers} />;
}
