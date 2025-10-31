# User Profile Components

This directory contains 5 reusable profile page components built with Next.js, TanStack Query, and shadcn/ui.

## Components

### 1. ProfileHeader
Hero section with user information and quick actions.

**Features:**
- Cover photo with gradient background
- Avatar with fallback
- User badges display
- Follow/Unfollow, Message, Share buttons
- Quick stats grid (Posts, Followers, Following, Content)
- Social media links (YouTube, Instagram, MyFxBook, Telegram)

**Props:**
```typescript
interface ProfileHeaderProps {
  user: UserType;
  badges?: Array<{ id: string; name: string; description: string }>;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  isLoading?: boolean;
  onFollowToggle?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  stats?: {
    followers: number;
    following: number;
    posts: number;
    content: number;
  };
}
```

### 2. StatsCards
Grid of trading statistics cards with trend indicators.

**Features:**
- 6 stat cards (Revenue, Sales, Rating, Followers, Content, Downloads)
- Trend indicators (up/down with percentage)
- Icon for each metric
- Responsive grid layout

**Props:**
```typescript
interface StatsCardsProps {
  stats?: {
    totalRevenue?: number;
    totalSales?: number;
    averageRating?: number;
    followers?: number;
    contentCount?: number;
    totalDownloads?: number;
    revenueChange?: number;
    salesChange?: number;
  };
  isLoading?: boolean;
}
```

### 3. BadgesWall
Achievement badges with progress tracking for locked badges.

**Features:**
- Earned and locked badges display
- Progress bars for locked badges
- 6 badge types with unique icons
- Requirements shown for locked badges
- Badge count indicator

**Props:**
```typescript
interface BadgesWallProps {
  earnedBadges?: Array<{ id: string; name: string; description: string }>;
  isLoading?: boolean;
}
```

### 4. ContentGrid
Published content showcase with filtering and featured section.

**Features:**
- Filter tabs (All/EAs/Indicators/Articles)
- Featured content section (top 3)
- Content cards with stats
- Price badges (free/paid)
- Empty states

**Props:**
```typescript
interface ContentGridProps {
  content?: Content[];
  isLoading?: boolean;
}
```

### 5. ReviewsSection
User reviews with rating breakdown and seller responses.

**Features:**
- Average rating display
- 5-star rating breakdown histogram
- Featured reviews (highest rated with most helpful votes)
- Seller response support
- All reviews list
- Empty states

**Props:**
```typescript
interface ReviewsSectionProps {
  reviews?: Review[];
  isLoading?: boolean;
  ratingBreakdown?: {
    averageRating: number;
    totalReviews: number;
    breakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}
```

## Usage Example

```typescript
import { 
  ProfileHeader, 
  StatsCards, 
  BadgesWall, 
  ContentGrid, 
  ReviewsSection 
} from './components';

export default function UserProfile() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/users', username],
  });

  return (
    <div className="space-y-6">
      <ProfileHeader 
        user={user} 
        badges={badges}
        stats={{ followers: 234, following: 89, posts: 45, content: 12 }}
        onFollowToggle={handleFollow}
        onMessage={handleMessage}
        onShare={handleShare}
      />
      
      <StatsCards 
        stats={{
          totalRevenue: 15000,
          totalSales: 234,
          averageRating: 4.8,
          followers: 234,
          contentCount: 12,
          totalDownloads: 1500
        }}
      />
      
      <BadgesWall earnedBadges={badges} />
      
      <ContentGrid content={content} />
      
      <ReviewsSection reviews={reviews} />
    </div>
  );
}
```

## Features

All components include:
- ✅ Full TypeScript support
- ✅ Loading states with skeleton loaders
- ✅ Responsive design (mobile-first)
- ✅ data-testid attributes for testing
- ✅ shadcn/ui components
- ✅ Proper error handling
- ✅ Empty states
- ✅ Accessibility support

## Testing

All interactive elements and data displays have `data-testid` attributes:
- `profile-header`, `avatar-user`, `button-follow-toggle`, `button-message`, `button-share`
- `stats-cards-grid`, `card-revenue`, `card-sales`, etc.
- `badges-wall`, `badge-item-{id}`, `badge-{id}-progress`
- `content-grid`, `content-item-{id}`, `featured-content-{id}`
- `reviews-section`, `review-{id}`, `featured-review-{id}`
