import type { Metadata } from 'next';
import PublishEAFormClient from './PublishEAFormClient';

// Generate SEO metadata
export const metadata: Metadata = {
  title: 'Publish New Expert Advisor | YoForex',
  description: 'Publish your MT4/MT5 Expert Advisor on YoForex marketplace. Share your automated trading system with the community and earn coins from downloads.',
  keywords: ['publish EA', 'sell EA', 'MT4 EA marketplace', 'MT5 expert advisor', 'trading system'],
  robots: 'noindex, nofollow', // Don't index form pages
};

export default function PublishEANewPage() {
  return <PublishEAFormClient />;
}
