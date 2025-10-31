import type { Metadata } from 'next';
import Header from '../components/Header';
import { Footer } from '../components/Footer';
import DiscussionsClient from './DiscussionsClient';

// Enable ISR with 60-second revalidation
export const revalidate = 60;

// SEO Metadata as specified in requirements
export const metadata: Metadata = {
  title: 'Forum Discussions | YoForex - Expert Advisor Community',
  description: 'Join the YoForex community forum. Discuss trading strategies, expert advisors, and MT4/MT5 indicators with forex traders worldwide.',
  keywords: ['forex forum', 'EA discussion', 'MT4 forum', 'trading community', 'expert advisor forum'],
  openGraph: {
    title: 'Forum Discussions | YoForex - Expert Advisor Community',
    description: 'Join the YoForex community forum. Discuss trading strategies, expert advisors, and MT4/MT5 indicators with forex traders worldwide.',
    type: 'website',
    url: 'https://yoforex.net/discussions',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forum Discussions | YoForex - Expert Advisor Community',
    description: 'Join the YoForex community forum. Discuss trading strategies, expert advisors, and MT4/MT5 indicators with forex traders worldwide.',
  },
};

// Fetch from Express API
async function getThreads() {
  try {
    const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
    const res = await fetch(`${EXPRESS_URL}/api/threads?sortBy=newest&limit=50`, {
      next: { revalidate: 60 },
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('Failed to fetch threads:', res.status);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching threads:', error);
    return [];
  }
}

// Server Component
export default async function DiscussionsPage() {
  const initialThreads = await getThreads();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DiscussionsClient initialThreads={initialThreads} />
      <Footer />
    </div>
  );
}
