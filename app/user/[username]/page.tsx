import { Metadata } from 'next';
import ProfileClient from './ProfileClient';
import { SchemaScript } from '@/components/SchemaGenerator';
import { generatePersonSchema } from '@/lib/schema-generator';

// Express API base URL
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com';

// Generate metadata for SEO with enhanced optimization
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  try {
    const res = await fetch(`${EXPRESS_URL}/api/user/${username}/profile`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        title: 'User Not Found | YoForex Community',
        description: 'The profile you are looking for does not exist or has been removed.',
      };
    }

    const profileData = await res.json();
    const user = profileData?.user;
    const stats = profileData?.stats;
    const badges = profileData?.badges || [];
    
    if (!user) {
      return {
        title: 'User Not Found | YoForex Community',
        description: 'The profile you are looking for does not exist or has been removed.',
      };
    }

    // Enhanced description with stats
    const description = `${user.username} - Forex Trader at YoForex. ${stats?.followers || 0} followers, ${stats?.content || 0} products, ${stats?.totalSales || 0} sales. ${user.bio || `View ${user.username}'s trading expertise, achievements, and contributions.`}`;
    
    // Dynamic keywords based on user data
    const keywords = [
      'forex trader',
      user.username,
      'MT4',
      'MT5', 
      'expert advisor',
      'trading',
      ...(badges.length > 0 ? badges.map((b: any) => b.name).slice(0, 3) : []),
      'yoforex community',
      'trading profile'
    ].filter(Boolean).join(', ');

    const profileUrl = `${BASE_URL}/user/${username}`;
    const avatarUrl = user.avatarUrl || `${BASE_URL}/default-avatar.png`;
    
    return {
      title: `${user.username} - Forex Trader | YoForex`,
      description: description.substring(0, 160), // Keep under 160 chars for SEO
      keywords,
      authors: [{ name: user.username }],
      alternates: {
        canonical: profileUrl,
      },
      openGraph: {
        title: `${user.username} - Forex Trader`,
        description: description.substring(0, 160),
        type: 'profile',
        url: profileUrl,
        siteName: 'YoForex',
        images: [{
          url: avatarUrl,
          width: 200,
          height: 200,
          alt: `${user.username}'s profile picture`
        }],
      },
      twitter: {
        card: 'summary',
        site: '@YoForex',
        creator: `@${user.username}`,
        title: `${user.username} - Forex Trader`,
        description: description.substring(0, 160),
        images: [avatarUrl],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    return {
      title: 'User Profile | YoForex Community',
      description: 'Explore trader profiles and connect with the YoForex community.',
    };
  }
}

// Main page component (Server Component)
export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  
  // Fetch profile data from the comprehensive profile endpoint
  let profileData = undefined;
  try {
    const profileRes = await fetch(`${EXPRESS_URL}/api/user/${username}/profile`, { 
      cache: 'no-store',
    });
    if (profileRes.ok) {
      profileData = await profileRes.json();
    }
  } catch (error) {
    // Swallow error - ProfileClient will show custom error card
    profileData = undefined;
  }

  // Generate enhanced Person schema with more SEO data
  let personSchema = null;
  if (profileData?.user) {
    const user = profileData.user;
    const stats = profileData.stats || {};
    
    personSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${BASE_URL}/user/${username}`,
      "name": user.username,
      "alternateName": "Forex Trader",
      "url": `${BASE_URL}/user/${username}`,
      "image": user.avatarUrl || `${BASE_URL}/default-avatar.png`,
      "description": user.bio || `${user.username} is a trader at YoForex with ${stats.followers || 0} followers and ${stats.content || 0} products.`,
      "jobTitle": "Forex Trader",
      "worksFor": {
        "@type": "Organization",
        "name": "YoForex",
        "url": BASE_URL
      },
      "interactionStatistic": [
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/FollowAction",
          "userInteractionCount": stats.followers || 0
        },
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/CreateAction",
          "userInteractionCount": stats.content || 0
        },
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/SellAction",
          "userInteractionCount": stats.totalSales || 0
        }
      ],
      "aggregateRating": stats.averageRating ? {
        "@type": "AggregateRating",
        "ratingValue": stats.averageRating,
        "reviewCount": stats.totalReviews || 0,
        "bestRating": 5,
        "worstRating": 1
      } : undefined,
      "knowsAbout": [
        "Forex Trading",
        "MetaTrader",
        "Expert Advisors",
        "Trading"
      ].filter(Boolean),
      "memberOf": {
        "@type": "Organization",
        "name": "YoForex Trading Community",
        "url": BASE_URL
      },
      "sameAs": [
        user.website,
        user.youtubeUrl,
        user.instagramHandle ? `https://instagram.com/${user.instagramHandle}` : null,
        user.telegramHandle ? `https://t.me/${user.telegramHandle}` : null,
        user.myfxbookLink
      ].filter(Boolean)
    };
    
    // Remove undefined values for cleaner JSON-LD
    personSchema = JSON.parse(JSON.stringify(personSchema));
  }

  // Pass profile data to Client Component
  return (
    <>
      {personSchema && <SchemaScript schema={personSchema} />}
      <ProfileClient
        username={username}
        initialData={profileData}
      />
    </>
  );
}

// Enable dynamic rendering with no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
