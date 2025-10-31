import { Metadata } from 'next';
import Header from '@/components/Header';
import EnhancedFooter from '@/components/EnhancedFooter';
import LeaderboardClient from './LeaderboardClient';

export const metadata: Metadata = {
  title: 'Leaderboard | YoForex',
  description: 'View the top contributors, publishers, and active members in the YoForex community. See who\'s leading the expert advisor marketplace.',
  keywords: 'leaderboard, top contributors, top traders, EA developers',
  openGraph: {
    title: 'Leaderboard | YoForex',
    description: 'View the top contributors, publishers, and active members in the YoForex community. See who\'s leading the expert advisor marketplace.',
    type: 'website',
    url: '/leaderboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leaderboard | YoForex',
    description: 'View the top contributors, publishers, and active members in the YoForex community. See who\'s leading the expert advisor marketplace.',
  },
};

type CoinsLeader = {
  userId: string;
  username: string;
  balance: number;
  rank: number;
};

type ContributorLeader = {
  userId: string;
  username: string;
  helpfulCount: number;
  acceptedCount: number;
  totalContributions: number;
  rank: number;
};

type SellerLeader = {
  userId: string;
  username: string;
  totalRevenue: number;
  salesCount: number;
  rank: number;
};

async function getLeaderboardData() {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  
  try {
    // Fetch all three leaderboards in parallel
    const [coinsRes, contributorsRes, sellersRes] = await Promise.all([
      fetch(`${EXPRESS_URL}/api/leaderboards/coins`, { cache: 'no-store' }),
      fetch(`${EXPRESS_URL}/api/leaderboards/contributors`, { cache: 'no-store' }),
      fetch(`${EXPRESS_URL}/api/leaderboards/sellers`, { cache: 'no-store' }),
    ]);

    const coinLeaders: CoinsLeader[] = coinsRes.ok ? await coinsRes.json() : [];
    const contributors: ContributorLeader[] = contributorsRes.ok ? await contributorsRes.json() : [];
    const sellers: SellerLeader[] = sellersRes.ok ? await sellersRes.json() : [];

    return {
      coinLeaders,
      contributors,
      sellers,
    };
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return {
      coinLeaders: [],
      contributors: [],
      sellers: [],
    };
  }
}

export default async function LeaderboardPage() {
  const { coinLeaders, contributors, sellers } = await getLeaderboardData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <LeaderboardClient 
        initialCoinLeaders={coinLeaders}
        initialContributors={contributors}
        initialSellers={sellers}
      />
      <EnhancedFooter />
    </div>
  );
}
