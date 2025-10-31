import type { Metadata } from 'next';
import MembersClient from './MembersClient';

// SEO Metadata
export const metadata: Metadata = {
  title: 'Community Members | YoForex',
  description: 'Meet the YoForex community. Connect with expert traders, EA developers, and forex enthusiasts from around the world.',
  keywords: 'forex community, EA developers, trading experts, forex traders',
  openGraph: {
    title: 'Community Members | YoForex',
    description: 'Meet the YoForex community. Connect with expert traders, EA developers, and forex enthusiasts from around the world.',
    type: 'website',
    url: '/members',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community Members | YoForex',
    description: 'Meet the YoForex community. Connect with expert traders, EA developers, and forex enthusiasts from around the world.',
  },
};

// Fetch leaderboard data from Express API
async function getLeaderboardData() {
  try {
    const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
    
    // Fetch all three leaderboard types in parallel
    const [topByCoinsRes, topByContributionsRes, topByUploadsRes] = await Promise.all([
      fetch(`${EXPRESS_URL}/api/leaderboard?type=coins&limit=50`, {
        cache: 'no-store',
      }),
      fetch(`${EXPRESS_URL}/api/leaderboard?type=contributions&limit=50`, {
        cache: 'no-store',
      }),
      fetch(`${EXPRESS_URL}/api/leaderboard?type=uploads&limit=50`, {
        cache: 'no-store',
      }),
    ]);

    const topByCoins = topByCoinsRes.ok ? await topByCoinsRes.json() : [];
    const topByContributions = topByContributionsRes.ok ? await topByContributionsRes.json() : [];
    const topByUploads = topByUploadsRes.ok ? await topByUploadsRes.json() : [];

    return {
      topByCoins,
      topByContributions,
      topByUploads,
    };
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return {
      topByCoins: [],
      topByContributions: [],
      topByUploads: [],
    };
  }
}

export default async function MembersPage() {
  const initialData = await getLeaderboardData();

  return <MembersClient initialData={initialData} />;
}
