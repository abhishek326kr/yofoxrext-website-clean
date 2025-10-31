import { Metadata } from 'next';
import BrokerProfileClient from './BrokerProfileClient';

// Express API base URL
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

// Type definitions
type Broker = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  overallRating: number;
  reviewCount: number;
  scamReportCount: number;
  isVerified: boolean;
  regulationSummary: string | null;
  yearFounded: number | null;
  status: string;
};

type BrokerReview = {
  id: string;
  userName: string;
  userReputation: number;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  isScamReport: boolean;
  datePosted: Date;
  helpfulCount: number;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${EXPRESS_URL}/api/brokers/slug/${slug}`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        title: 'Broker Not Found | YoForex',
      };
    }

    const broker: Broker = await res.json();
    
    const title = `${broker.name} - Broker Review & Profile | YoForex`;
    const description = `Read reviews, ratings, and detailed information about ${broker.name}. Check regulation, spreads, and community feedback. ${broker.reviewCount} verified reviews.`;
    const keywords = `${broker.name}, forex broker, MT4, MT5, broker review, regulation, ${broker.regulationSummary || ''}`;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title: `${broker.name} - Broker Review & Profile`,
        description,
        images: broker.logoUrl ? [{ url: broker.logoUrl }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${broker.name} Review`,
        description,
        images: broker.logoUrl ? [broker.logoUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Broker Not Found | YoForex',
    };
  }
}

// Main page component (Server Component)
export default async function BrokerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Fetch broker with error handling that doesn't trigger Next.js 404
  let broker: Broker | null = null;
  try {
    const brokerRes = await fetch(`${EXPRESS_URL}/api/brokers/slug/${slug}`, { 
      cache: 'no-store',
    });
    if (brokerRes.ok) {
      broker = await brokerRes.json();
    }
  } catch (error) {
    // Swallow error - we'll show custom error card
    broker = null;
  }

  // If broker not found, return Client Component with undefined broker to show custom error card
  if (!broker) {
    return (
      <BrokerProfileClient
        slug={slug}
        initialBroker={undefined}
        initialReviews={[]}
      />
    );
  }

  // Fetch broker reviews (using broker ID, not slug)
  let reviews: BrokerReview[] = [];
  try {
    const reviewsRes = await fetch(`${EXPRESS_URL}/api/brokers/${broker.id}/reviews`, { 
      cache: 'no-store',
    });
    if (reviewsRes.ok) {
      reviews = await reviewsRes.json();
    }
  } catch (error) {
    // If reviews fail, just use empty array
    reviews = [];
  }

  // Pass all data to Client Component
  return (
    <BrokerProfileClient
      slug={slug}
      initialBroker={broker}
      initialReviews={reviews}
    />
  );
}

// Enable dynamic rendering with no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
