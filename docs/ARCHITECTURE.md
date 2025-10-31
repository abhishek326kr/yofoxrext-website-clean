# YoForex Frontend Architecture Guide

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [Custom Hooks](#custom-hooks)
6. [Authentication System](#authentication-system)
7. [Routing](#routing)
8. [Form Handling](#form-handling)
9. [Styling System](#styling-system)
10. [Real-time Updates](#real-time-updates)
11. [SEO Implementation](#seo-implementation)
12. [Best Practices](#best-practices)

---

## Technology Stack

### Dual Frontend Architecture (Oct 27, 2025)
YoForex runs **two frontend servers** for different purposes:

1. **React SPA** (Port 5000 - Express + Vite)
   - Original app in `client/src/*`
   - Used for development and testing
   - Wouter routing
   - Served by Express at http://localhost:5000

2. **Next.js SSR** (Port 3000 - Next.js 16 App Router)
   - SEO-optimized version in `app/*`
   - 100% design parity with React SPA
   - Server Components for initial data fetching
   - Client Components for interactivity
   - next/link routing
   - All API calls route to Express backend

### Core Libraries
- **React 18** - UI framework (shared by both apps)
- **TypeScript** - Type safety
- **Vite** - React SPA build tool
- **Next.js 16** - SSR framework with App Router
- **TanStack Query v5** - Server state management
- **Wouter** - Routing (React SPA)
- **next/link** - Routing (Next.js)
- **React Hook Form** - Form management
- **Zod** - Schema validation

### UI Components (Shared)
- **shadcn/ui** - Component library (Radix UI primitives)
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Framer Motion** - Animations (optional)

### Backend Integration
- **Express.js** - REST API server (port 5000)
- **Drizzle ORM** - Database queries
- **PostgreSQL** - Production database

### Security & Performance (Oct 26, 2025)
- **Input Validation** - All user inputs sanitized with DOMPurify
- **Rate Limiting** - Multiple limiters prevent API abuse
- **Database Indexes** - 25 indexes for 10-100x query speedup
- **XSS Protection** - Server-side HTML sanitization
- **Coin System Security** - Validates negative amounts, overdrafts

### SEO Enhancements (Oct 28, 2025)
- **SEOPreview Component** - Real-time Google search result preview
- **Keyword Density Validation** - Automatic analysis with 0.5-3% optimal range
- **Character Counters** - Live validation for title (30-60 chars) and description (120-160 chars)
- **SEO Feedback** - Contextual tips and warnings for optimization

### Testing Infrastructure (Oct 28, 2025)
- **Integration Tests** - `tests/api.test.ts` with 8 critical endpoint tests
- **Test Framework** - Node.js native HTTP client with TypeScript
- **Coverage** - Authentication, threads, categories, feedback, brokers, stats
- **Status** - ✅ 100% pass rate

---

## Project Structure

```
client/                      # React SPA (Port 5000)
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn components (original)
│   │   ├── Header.tsx        # Global header with coin balance
│   │   ├── EnhancedFooter.tsx
│   │   ├── CoinBalance.tsx
│   │   └── OnboardingChecklist.tsx    # New user onboarding widget
│   ├── pages/
│   │   ├── Home.tsx         # Forum homepage with trending threads
│   │   ├── CategoriesPage.tsx        # All 16 forum categories grid
│   │   ├── CategoryDiscussionPage.tsx # Individual category threads
│   │   ├── ThreadDetailPage.tsx      # Thread view with nested replies
│   │   ├── PublishPage.tsx  # EABOOK-style EA/Indicator release form
│   │   ├── MembersPage.tsx  # Leaderboard and community stats
│   │   ├── MarketplacePage.tsx
│   │   ├── ContentDetailPage.tsx
│   │   ├── RechargePage.tsx
│   │   └── TransactionHistoryPage.tsx
│   ├── lib/
│   │   ├── queryClient.ts   # TanStack Query setup (fetches from Express)
│   │   └── utils.ts         # Helper functions
│   ├── hooks/
│   │   └── use-toast.ts     # Toast notifications
│   ├── App.tsx              # Root component with Wouter routing
│   └── index.css            # Global styles + theme
├── public/
└── index.html

app/                         # Next.js SSR (Port 3000) - NEW Oct 27, 2025
├── components/              # Copied from client/src/components with "use client"
│   ├── ui/                  # shadcn components (Next.js compatible)
│   ├── providers/
│   │   └── AppProviders.tsx # QueryClient + Auth + Theme wrapper
│   ├── Header.tsx           # Next.js version (uses next/link)
│   ├── EnhancedFooter.tsx   # Next.js version
│   ├── ThemeToggle.tsx      # Next.js version
│   ├── StatsBar.tsx         # Homepage stats widget
│   ├── CategoryCard.tsx     # Forum category display
│   ├── ForumThreadCard.tsx  # Thread preview card
│   ├── CoinBalance.tsx      # User coin widget
│   ├── Leaderboard.tsx      # Top users widget
│   ├── WeekHighlights.tsx   # Trending threads tabs
│   ├── TrustLevel.tsx       # User rank widget
│   ├── WhatsHot.tsx         # Hot threads widget
│   ├── TopSellers.tsx       # Best selling EAs widget
│   └── OnboardingChecklist.tsx # New user checklist
├── contexts/
│   ├── AuthContext.tsx      # Authentication state
│   └── ThemeContext.tsx     # Dark/light theme state
├── lib/
│   ├── queryClient.ts       # TanStack Query (routes to Express API)
│   └── utils.ts             # Helper functions
├── hooks/
│   └── use-toast.ts         # Toast notifications
├── thread/
│   └── [slug]/
│       ├── ThreadDetailClient.tsx  # Client Component for thread interactivity
│       └── page.tsx                # Server Component - SEO + SSR ✅
├── HomeClient.tsx           # Client Component for homepage interactivity
├── page.tsx                 # Server Component - fetches from Express ✅
├── layout.tsx               # Root layout with AppProviders
├── globals.css              # Tailwind + custom CSS
└── next.config.ts           # Next.js configuration

server/
├── routes.ts                # API endpoints (60+) - used by both React & Next.js
├── storage.ts               # Database layer
├── seo-engine.ts            # Auto-SEO generation
├── seed.ts                  # Database seed data
└── index.ts                 # Express server (port 5000)

shared/
└── schema.ts                # TypeScript types + Drizzle schemas (shared)
```

---

## Component Architecture

### Page Components (Route-Level)

Pages should be thin wrappers that:
1. Fetch data with TanStack Query
2. Handle loading/error states
3. Compose smaller UI components

**Example: ForumThreadList.tsx**
```tsx
import { useQuery } from "@tanstack/react-query";
import type { ForumThread } from "@shared/schema";
import { ThreadCard } from "@/components/ThreadCard";

export function ForumThreadList({ categorySlug }: { categorySlug?: string }) {
  const { data: threads, isLoading, error } = useQuery<ForumThread[]>({
    queryKey: ['/api/threads', { categorySlug }],
    refetchInterval: 15000, // Real-time updates every 15s
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-4">
      {threads?.map(thread => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
    </div>
  );
}
```

### Presentational Components

Pure UI components that receive props and render:

**Example: ThreadCard.tsx**
```tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Eye } from "lucide-react";
import type { ForumThread } from "@shared/schema";
import { Link } from "wouter";

interface ThreadCardProps {
  thread: ForumThread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-thread-${thread.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link href={`/thread/${thread.slug}`}>
            <h3 className="text-lg font-semibold hover:text-primary">
              {thread.title}
            </h3>
          </Link>
          {thread.isPinned && <Badge>Pinned</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {thread.metaDescription}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {thread.replyCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {thread.views}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Container Components (Smart)

Handle business logic and API interactions:

**Example: CreateThreadForm.tsx**
```tsx
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertForumThreadSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function CreateThreadForm({ categorySlug }: { categorySlug: string }) {
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(insertForumThreadSchema.omit({ 
      userId: true, 
      categorySlug: true 
    })),
    defaultValues: {
      title: "",
      body: "",
    }
  });

  const createThread = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/threads', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          userId: "6e5f03b9-e0f1-424b-b264-779d75f62d89", // TODO: Get from auth
          categorySlug,
        })
      });
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Thread created!",
        description: "Your thread has been published.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create thread",
        variant: "destructive",
      });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createThread.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thread Title</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="e.g., XAUUSD Scalping Strategy - M5 Timeframe"
                  data-testid="input-thread-title"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Share your strategy, ask questions, or discuss trading..."
                  rows={8}
                  data-testid="input-thread-body"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={createThread.isPending}
          data-testid="button-create-thread"
        >
          {createThread.isPending ? "Publishing..." : "Create Thread"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## State Management

### Server State (TanStack Query)

All backend data uses TanStack Query for:
- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication

**Query Setup (lib/queryClient.ts):**
```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // 5 seconds
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Default fetcher
export async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return res.json();
}
```

### Client State (React State)

For UI-only state (modals, filters, temporary form data):

```tsx
import { useState } from "react";

function ThreadFilters() {
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div>
      <Switch 
        checked={showPinnedOnly} 
        onCheckedChange={setShowPinnedOnly}
      />
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        {/* ... */}
      </Select>
    </div>
  );
}
```

---

## Custom Hooks

### useRealtimeUpdates Hook

**File:** `client/src/hooks/useRealtimeUpdates.ts`  
**Status:** ✅ Implemented (October 26, 2025)  
**Purpose:** Automatic polling for real-time data updates with configurable intervals

The `useRealtimeUpdates` hook wraps TanStack Query to provide consistent, configurable auto-refresh functionality across all components that need real-time data updates.

---

### Hook Interface

```typescript
interface RealtimeOptions {
  /**
   * Refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  interval?: number;
  
  /**
   * Whether to enable auto-refresh
   * @default true
   */
  enabled?: boolean;
}

function useRealtimeUpdates<T = any>(
  queryKey: string,
  options?: RealtimeOptions
): {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isRefetching: boolean;
  lastUpdated: Date | null;
  refetch: () => void;
}
```

---

### Implementation

```typescript
import { useQuery } from '@tanstack/react-query';

export function useRealtimeUpdates<T = any>(
  queryKey: string,
  options: RealtimeOptions = {}
) {
  const { interval = 30000, enabled = true } = options;

  const query = useQuery<T>({
    queryKey: [queryKey],
    enabled,
    refetchInterval: interval,
    refetchIntervalInBackground: true,
    staleTime: interval / 2, // Data is stale after half the interval
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    lastUpdated: query.dataUpdatedAt > 0 ? new Date(query.dataUpdatedAt) : null,
    refetch: query.refetch,
  };
}
```

---

### Usage Examples

**StatsBar Component (30s refresh):**
```tsx
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

interface StatsData {
  totalThreads: number;
  totalMembers: number;
  totalPosts: number;
  todayActivity: { threads: number; content: number };
}

export default function StatsBar() {
  // Auto-refresh stats every 30 seconds
  const { data, isLoading } = useRealtimeUpdates<StatsData>('/api/stats', { 
    interval: 30000 
  });

  return (
    <div className="grid grid-cols-4 gap-6">
      <StatCard label="Forum Threads" value={data?.totalThreads} />
      <StatCard label="Community Members" value={data?.totalMembers} />
      <StatCard label="Total Replies" value={data?.totalPosts} />
      <StatCard label="Active Today" value={data?.todayActivity?.threads} />
    </div>
  );
}
```

**Leaderboard Component (30s refresh):**
```tsx
export function Leaderboard() {
  const { data: leaderboard, isLoading } = useRealtimeUpdates('/api/leaderboard', {
    interval: 30000
  });

  return (
    <div className="space-y-2">
      {leaderboard?.map(user => (
        <UserRankCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

**ActivityFeed Component (10s refresh - fastest):**
```tsx
export function ActivityFeed() {
  const { data: activities, lastUpdated } = useRealtimeUpdates('/api/activities', {
    interval: 10000 // Fastest refresh rate
  });

  return (
    <Card>
      <CardHeader>
        <h3>Live Activity Feed</h3>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Updated {formatDistance(lastUpdated, new Date())} ago
          </span>
        )}
      </CardHeader>
      <CardContent>
        {activities?.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </CardContent>
    </Card>
  );
}
```

**TopSellers Component (60s refresh):**
```tsx
export function TopSellers() {
  const { data: sellers } = useRealtimeUpdates('/api/content/top-sellers', {
    interval: 60000 // Slower refresh for less volatile data
  });

  return (
    <div className="grid gap-4">
      {sellers?.map(content => (
        <ContentCard key={content.id} content={content} />
      ))}
    </div>
  );
}
```

---

### Refresh Rate Strategy

Different widgets use different refresh intervals based on data volatility:

| Component | Interval | Rationale |
|-----------|----------|-----------|
| **ActivityFeed** | 10s | High volatility - live user actions |
| **StatsBar** | 30s | Medium volatility - overall platform stats |
| **Leaderboard** | 30s | Medium volatility - ranking changes |
| **WhatsHot** | 30s | Medium volatility - trending content |
| **WeekHighlights** | 30s | Medium volatility - weekly highlights |
| **TopSellers** | 60s | Low volatility - sales data changes slowly |

---

### Benefits

1. **Consistent API**: Same interface across all components
2. **Configurable**: Easy to adjust refresh rates per component
3. **Automatic**: No manual invalidation needed
4. **Background Refresh**: Continues polling even when browser is backgrounded
5. **Stale Time Management**: Smart caching based on refresh interval
6. **Timestamp Tracking**: `lastUpdated` for visual "Updated X ago" indicators

---

### Best Practices

**DO:**
- Use appropriate refresh intervals based on data volatility
- Display `lastUpdated` timestamp for user transparency
- Handle loading states with skeletons
- Use shorter intervals (10-15s) for highly dynamic data
- Use longer intervals (60s+) for static content

**DON'T:**
- Use intervals shorter than 10s (risks rate limiting)
- Forget to handle loading/error states
- Poll on pages users rarely visit
- Use same interval for all components

---

## Authentication System

### Overview
**Status:** ✅ Fully Implemented (October 26, 2025)  
**File:** `client/src/contexts/AuthContext.tsx`  
**Backend Integration:** Replit Auth (OIDC) via `server/replitAuth.ts`

The frontend authentication system uses a centralized `AuthContext` provider that manages user authentication state via TanStack Query. The system integrates seamlessly with Replit's OIDC authentication backend.

---

### AuthContext Provider

**File:** `client/src/contexts/AuthContext.tsx`

**Purpose:** Centralized authentication state management for the entire application

**Three Authentication States:**
1. **`undefined`** - Loading (initial authentication check in progress)
2. **`null`** - Not authenticated (user not logged in)
3. **`User`** - Authenticated (user logged in with valid session)

**Context API:**
```typescript
interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}
```

**Implementation:**
```typescript
import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Fetch current user from /api/me
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }), // Return null on 401 (not authenticated)
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const login = () => {
    window.location.href = "/api/login"; // Redirect to OIDC login
  };

  const logout = async () => {
    await fetch("/api/logout", { 
      method: "POST", 
      credentials: "include" 
    });
    window.location.href = "/"; // Redirect to homepage
  };

  const isAuthenticated = user !== null && user !== undefined;

  return (
    <AuthContext.Provider 
      value={{ user, isLoading, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to access auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

**App Setup (App.tsx):**
```tsx
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

### Using the useAuth Hook

**Basic Usage:**
```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return (
      <Button onClick={login} data-testid="button-login">
        Log in with Replit
      </Button>
    );
  }

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <p>You have {user.totalCoins} coins</p>
      <Button onClick={logout} data-testid="button-logout">
        Log out
      </Button>
    </div>
  );
}
```

**Accessing User Data:**
```tsx
function UserProfile() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <Avatar>
          <AvatarImage src={user.profileImageUrl} />
          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <h2>{user.username}</h2>
      </CardHeader>
      <CardContent>
        <p>Email: {user.email}</p>
        <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
        <p>Coins: {user.totalCoins}</p>
        <p>Rank: #{user.rank}</p>
      </CardContent>
    </Card>
  );
}
```

---

### Header Component Authentication UI

**File:** `client/src/components/Header.tsx`

**Unauthenticated State:**
- Displays "Login" button in header
- Clicking button redirects to `/api/login`
- No coin balance shown
- No user avatar/dropdown

**Authenticated State:**
- Shows user avatar (or fallback initials)
- Displays current coin balance
- User dropdown menu with:
  - Username display
  - Coin balance
  - "Profile" link
  - "Settings" link
  - "Transaction History" link
  - "Logout" button

**Implementation Example:**
```tsx
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins, User, Settings, History, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

function Header() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [, navigate] = useLocation();

  return (
    <header className="border-b">
      <div className="container flex items-center justify-between p-4">
        {/* Left: Logo & Navigation */}
        <nav className="flex items-center gap-6">
          <Link href="/">
            <h1 className="text-2xl font-bold">YoForex</h1>
          </Link>
          <Link href="/categories">Categories</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/brokers">Brokers</Link>
        </nav>

        {/* Right: Authentication UI */}
        {!isAuthenticated ? (
          <Button onClick={login} data-testid="button-login">
            Log in with Replit
          </Button>
        ) : (
          <div className="flex items-center gap-4">
            {/* Coin Balance */}
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{user.totalCoins}</span>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger data-testid="button-user-menu">
                <Avatar>
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback>
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Coins className="mr-2 h-4 w-4" />
                  {user.totalCoins} coins
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate(`/user/${user.username}`)}
                  data-testid="link-profile"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/settings")}
                  data-testid="link-settings"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/transactions")}
                  data-testid="link-transactions"
                >
                  <History className="mr-2 h-4 w-4" />
                  Transaction History
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout} 
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
```

---

### Authentication Guards for Protected Actions

**Pattern:** All protected actions must check authentication state before allowing user interaction

**Login Required Guard:**
```tsx
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

function CreateThreadButton() {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  const handleClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to create a thread",
        variant: "destructive",
      });
      login(); // Redirect to /api/login
      return;
    }

    // Proceed with thread creation
    openCreateThreadModal();
  };

  return (
    <Button onClick={handleClick} data-testid="button-create-thread">
      Create Thread
    </Button>
  );
}
```

**Inline Conditional Rendering:**
```tsx
function ThreadActions({ threadId }: { threadId: string }) {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex gap-2">
      {isAuthenticated ? (
        <>
          <Button onClick={handleReply}>Reply</Button>
          <Button onClick={handleLike}>Like</Button>
        </>
      ) : (
        <Button onClick={() => window.location.href = "/api/login"}>
          Log in to interact
        </Button>
      )}
    </div>
  );
}
```

**Protected Form Submission:**
```tsx
function CreateThreadForm() {
  const { user, isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  const createThread = useMutation({
    mutationFn: async (data: any) => {
      // Check authentication before API call
      if (!isAuthenticated) {
        toast({
          title: "Login required",
          description: "Please log in to create a thread",
          variant: "destructive",
        });
        login();
        return;
      }

      return await apiRequest('/api/threads', {
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include', // Include session cookie
      });
    },
    onError: (error: any) => {
      if (error.message.includes("Unauthorized")) {
        // Session expired - redirect to login
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        login();
        return;
      }

      toast({
        title: "Error",
        description: error.message || "Failed to create thread",
        variant: "destructive",
      });
    }
  });

  return <Form onSubmit={createThread.mutate} />;
}
```

---

### Protected Frontend Actions

All the following actions require authentication and should use authentication guards:

**Content & Marketplace:**
- Publish content
- Purchase content
- Submit content review
- Like content
- Reply to content
- Mark content reply helpful

**Forum:**
- Create thread
- Create reply
- Mark reply as accepted answer
- Mark reply as helpful

**Social:**
- Follow/unfollow user
- Send private message
- Mark message as read

**Coins & System:**
- Create coin transaction
- Recharge coins
- Award user badge
- Update user profile

**Brokers:**
- Create broker entry
- Submit broker review

---

### Authentication State Handling

**Loading State:**
```tsx
function ProtectedPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2>Login Required</h2>
        <p>You must be logged in to view this page</p>
        <Button onClick={() => window.location.href = "/api/login"}>
          Log in with Replit
        </Button>
      </div>
    );
  }

  return <ProtectedContent user={user} />;
}
```

**Optimistic Updates with Authentication:**
```tsx
function LikeButton({ contentId }: { contentId: string }) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const likeContent = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error("Must be logged in to like content");
      }

      return await apiRequest(`/api/content/like`, {
        method: 'POST',
        body: JSON.stringify({ contentId }),
        credentials: 'include',
      });
    },
    onMutate: async () => {
      // Optimistic update: increment like count immediately
      await queryClient.cancelQueries({ queryKey: ['/api/content', contentId] });
      
      const previousData = queryClient.getQueryData(['/api/content', contentId]);
      
      queryClient.setQueryData(['/api/content', contentId], (old: any) => ({
        ...old,
        likes: old.likes + 1,
      }));

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['/api/content', contentId], 
        context?.previousData
      );
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/content', contentId] });
    },
  });

  return (
    <Button 
      onClick={() => likeContent.mutate()} 
      disabled={!isAuthenticated || likeContent.isPending}
    >
      {likeContent.isPending ? "Liking..." : "Like"}
    </Button>
  );
}
```

---

### Session Management & Token Refresh

**Automatic Refresh:**
The backend `isAuthenticated` middleware automatically refreshes expired access tokens using refresh tokens. The frontend doesn't need to handle token refresh explicitly.

**Session Expiration Handling:**
```tsx
// In queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401 (unauthorized)
        if (error.message?.includes("Unauthorized")) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error: any) => {
        // Redirect to login on 401
        if (error.message?.includes("Unauthorized")) {
          window.location.href = "/api/login";
        }
      },
    },
  },
});
```

**Manual Session Check:**
```tsx
function useSessionCheck() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Refetch user every 5 minutes to check session validity
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { user, isLoading };
}
```

---

### Security Best Practices

#### 1. Always Include Credentials
All authenticated requests must include `credentials: 'include'` to send session cookies:

```tsx
// ✅ GOOD
await fetch('/api/transactions', {
  method: 'POST',
  credentials: 'include', // Send session cookie
  body: JSON.stringify(data),
});

// ❌ BAD
await fetch('/api/transactions', {
  method: 'POST',
  // Missing credentials - session cookie not sent
  body: JSON.stringify(data),
});
```

#### 2. Never Store Sensitive Data in localStorage
```tsx
// ❌ BAD: Storing user ID in localStorage
localStorage.setItem('userId', user.id);

// ✅ GOOD: Always fetch from session via /api/me
const { user } = useAuth(); // Gets user from server session
```

#### 3. Check Authentication Before Actions
```tsx
// ❌ BAD: Assuming user is authenticated
const handleAction = () => {
  // User might not be logged in!
  performAction(user.id);
};

// ✅ GOOD: Check authentication first
const handleAction = () => {
  if (!isAuthenticated) {
    toast({ title: "Login required" });
    login();
    return;
  }
  performAction(user.id);
};
```

#### 4. Handle 401 Errors Gracefully
```tsx
// ✅ GOOD: Redirect to login on 401
const mutation = useMutation({
  onError: (error: any) => {
    if (error.message.includes("Unauthorized")) {
      login(); // Redirect to /api/login
      return;
    }
    // Handle other errors
  },
});
```

---

### Migration from Demo User

**Old Pattern (Deprecated):**
```tsx
// ❌ OLD: Hardcoded demo user ID
const createThread = useMutation({
  mutationFn: async (data) => {
    return await apiRequest('/api/threads', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        userId: "6e5f03b9-e0f1-424b-b264-779d75f62d89", // Hardcoded!
      }),
    });
  },
});
```

**New Pattern (Current):**
```tsx
// ✅ NEW: Use authenticated user from session
const { user, isAuthenticated } = useAuth();

const createThread = useMutation({
  mutationFn: async (data) => {
    if (!isAuthenticated) {
      throw new Error("Must be logged in");
    }

    // No need to send userId - backend reads from session
    return await apiRequest('/api/threads', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include', // Session cookie
    });
  },
});
```

**Key Differences:**
- ❌ No hardcoded user IDs
- ✅ Authentication state checked before actions
- ✅ Session cookie sent with all requests
- ✅ User data fetched from `/api/me` endpoint
- ✅ Login/logout flow handled by AuthContext

---

## Routing

### Wouter Setup (App.tsx)

```tsx
import { Switch, Route } from "wouter";
import Home from "@/pages/Home";
import ThreadDetail from "@/pages/ThreadDetail";
import MarketplacePage from "@/pages/MarketplacePage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/thread/:slug" component={ThreadDetail} />
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/content/:slug" component={ContentDetailPage} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/user/:username" component={UserProfile} />
      <Route path="/recharge" component={RechargePage} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

### Dynamic Routes with Params

```tsx
import { useRoute } from "wouter";

function ThreadDetail() {
  const [match, params] = useRoute("/thread/:slug");
  
  const { data: thread, isLoading } = useQuery({
    queryKey: ['/api/threads/slug', params?.slug],
    enabled: !!params?.slug,
  });

  if (!match) return <NotFound />;
  if (isLoading) return <LoadingSkeleton />;

  return <div>{thread?.title}</div>;
}
```

### Navigation

```tsx
import { Link, useLocation } from "wouter";

function Navigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/marketplace">Marketplace</Link>
      <button onClick={() => setLocation("/recharge")}>
        Recharge Coins
      </button>
    </nav>
  );
}
```

### Current Page Components

#### Home.tsx - Forum Homepage
Displays forum highlights and recent activity:
- WhatsHot sidebar widget (trending discussions)
- Forum Categories overview (6 visible, link to "View all")
- Recent Discussions list
- Real-time updates with 15s polling for threads
- Consistent text-lg font sizes for section headers

#### CategoriesPage.tsx - All Categories Grid
Full view of all 15 forum categories:
- Grid layout (3 columns on desktop)
- Real-time stats polling (30s intervals)
- Each category shows: icon, name, description, threadCount, postCount
- Summary statistics at bottom (total categories/threads/posts)
- Proper null-safe rendering with `(value ?? 0).toLocaleString()`
- Route: `/categories`

#### CategoryDiscussionPage.tsx - Category Thread List
Individual category view with thread listing:
- Dynamic route: `/category/:slug`
- Category header with stats (threadCount, postCount)
- Thread list with real-time updates (15s polling)
- Filter/sort buttons (Latest, Trending, Answered)
- Empty state handling for categories with no threads
- Null-safe stats rendering
- Pagination placeholder for future implementation

#### MembersPage.tsx - Community Leaderboard
Leaderboard and community stats:
- Three tabs: Coins, Contributions, Uploads
- Real-time leaderboard updates (30s polling)
- Rank badges:
  - #1: Crown (default variant, yellow)
  - #2: Medal (secondary variant, silver)
  - #3: Medal (outline variant, bronze)
  - Others: Trophy (outline variant)
- Top stats overview cards showing #1 users
- Call-to-action section to encourage participation
- Route: `/members`

#### DashboardSettings.tsx - Widget Customization Interface
**Status:** ✅ Implemented (October 26, 2025)  
**Route:** `/dashboard/customize`  
**Purpose:** User interface for customizing dashboard widgets and layout

**Features:**
- **Widget Management:**
  - Toggle visibility for 6 dashboard widgets (show/hide)
  - Reorder widgets using up/down arrow buttons
  - Visual category badges (stats, community, content, activity)
  - Icons for each widget type
  - Enabled/disabled count indicator
- **Layout Selection:**
  - Three layout modes: Default, Compact, Comfortable
  - Radio button selection with descriptions
- **Settings Controls:**
  - Save button (when changes detected)
  - Reset to Default button
  - Unsaved changes badge indicator
- **Live Preview Panel:**
  - Shows current enabled widgets count
  - Real-time preview as user makes changes

**Available Widgets:**
1. Statistics Bar (stats) - Overview of forum threads and activity
2. What's Hot (community) - Trending discussions
3. Leaderboard (community) - Top contributors
4. Week's Highlights (community) - Weekly trending/solved threads
5. Live Activity Feed (activity) - Real-time updates
6. Top Sellers (content) - Best-selling EAs/indicators

**Implementation Details:**
```tsx
interface Widget {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
  category: 'stats' | 'community' | 'content' | 'activity';
}

type LayoutType = 'default' | 'compact' | 'comfortable';
```

**State Management:**
- Local React state for widget configuration
- `hasChanges` flag to track unsaved modifications
- Save/Reset functionality implemented

**Note:** ⚠️ **UI-only implementation** - Backend persistence not yet implemented. Settings are not saved across sessions. Future enhancement will integrate with user preferences API.

**Key Components Used:**
- Card, CardHeader, CardContent
- Button, Badge
- Switch (for toggle controls)
- RadioGroup (for layout selection)
- GripVertical icon (for reorder visual)
- Settings2, LayoutDashboard icons

**Common Patterns Across Pages:**
- All use TanStack Query with appropriate polling intervals
- Loading skeletons during data fetch
- Empty state handling
- Proper error states
- Null-safe rendering (`.toLocaleString()` with fallbacks)
- Comprehensive test IDs on all interactive elements

---

## Form Handling

### React Hook Form + Zod Validation

All forms use shadcn's Form components with Zod validation:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertContentSchema } from "@shared/schema";

const formSchema = insertContentSchema
  .omit({ authorId: true })
  .extend({
    priceCoins: z.coerce.number().min(0).max(10000),
  });

function PublishContentForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "ea" as const,
      title: "",
      description: "",
      priceCoins: 100,
      isFree: false,
      category: "",
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Auto-SEO happens in backend!
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

### File Uploads (Future Implementation)

```tsx
function ImageUploadField() {
  const [images, setImages] = useState<File[]>([]);

  const uploadImages = async (files: File[]) => {
    // TODO: Upload to storage service
    // Return URLs, then include in form submission
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    return res.json(); // { urls: string[] }
  };

  return (
    <input 
      type="file" 
      multiple 
      accept="image/*"
      onChange={(e) => {
        const files = Array.from(e.target.files || []);
        setImages(files);
      }}
    />
  );
}
```

---

## Styling System

### Theme Configuration (index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Primary colors (YoForex brand blue) */
    --primary: 220 90% 56%;
    --primary-foreground: 0 0% 100%;
    
    /* Gold accent (for coins) */
    --accent: 45 100% 50%;
    --accent-foreground: 26 83% 14%;
    
    /* Backgrounds */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    
    /* Cards */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    
    /* Borders */
    --border: 214 32% 91%;
    --ring: 220 90% 56%;
  }

  .dark {
    --primary: 220 90% 56%;
    --primary-foreground: 0 0% 100%;
    
    --background: 222 47% 11%;
    --foreground: 213 31% 91%;
    
    --card: 222 47% 15%;
    --card-foreground: 213 31% 91%;
    
    --border: 222 47% 20%;
  }
}
```

### Component Styling Best Practices

**Use shadcn components:**
```tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <h3>Title</h3>
        <Badge>New</Badge>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

**Use Tailwind utilities:**
```tsx
<div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-card border">
  <span className="text-sm text-muted-foreground">Secondary text</span>
  <span className="font-semibold text-foreground">Primary text</span>
</div>
```

**Responsive design:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

---

## Real-time Updates

**Status:** ✅ Fully Implemented (October 26, 2025)  
**Implementation:** Polling-based auto-refresh system with configurable intervals

The platform implements a comprehensive real-time update system using the `useRealtimeUpdates` custom hook (see [Custom Hooks](#custom-hooks) section). This provides automatic data refreshes across all dashboard widgets and key components.

---

### Real-time Update System Architecture

**Core Components:**
1. **Custom Hook:** `useRealtimeUpdates` (wraps TanStack Query)
2. **Background Polling:** Continues even when browser is backgrounded
3. **Smart Caching:** Stale time set to half the refresh interval
4. **Visual Indicators:** "Updated X ago" timestamps on widgets
5. **Error Handling:** Graceful degradation on API failures

---

### Widget-Specific Refresh Rates

**Updated Components with Auto-Refresh (October 26, 2025):**

| Component | Interval | Endpoint | Data Type |
|-----------|----------|----------|-----------|
| **ActivityFeed** | 10s | `/api/activities` | Live user actions, new posts |
| **StatsBar** | 30s | `/api/stats` | Global platform statistics |
| **Leaderboard** | 30s | `/api/leaderboard` | User rankings and reputation |
| **WhatsHot** | 30s | `/api/threads/hot` | Trending discussions |
| **WeekHighlights** | 30s | `/api/threads/highlights` | Weekly top threads |
| **TopSellers** | 60s | `/api/content/top-sellers` | Best-selling content |

**Rationale:**
- **10s (Fastest):** High-volatility data (live activity feed)
- **30s (Medium):** Moderate volatility (stats, rankings, trending content)
- **60s (Slower):** Low volatility (sales data changes gradually)

---

### Implementation Pattern

**Before (Manual Polling):**
```tsx
// ❌ OLD: Manual refetchInterval configuration
const { data: stats } = useQuery({
  queryKey: ['/api/stats'],
  refetchInterval: 30000,
  refetchIntervalInBackground: true,
});
```

**After (useRealtimeUpdates Hook):**
```tsx
// ✅ NEW: Simplified with useRealtimeUpdates
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

const { data: stats, isLoading, lastUpdated } = useRealtimeUpdates('/api/stats', {
  interval: 30000
});
```

---

### Visual Update Indicators

All widgets with auto-refresh display timestamp information:

```tsx
import { formatDistance } from 'date-fns';

function StatsWidget() {
  const { data, lastUpdated, isRefetching } = useRealtimeUpdates('/api/stats', {
    interval: 30000
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3>Platform Statistics</h3>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {formatDistance(lastUpdated, new Date())} ago
              {isRefetching && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats display */}
      </CardContent>
    </Card>
  );
}
```

---

### Error Handling Strategy

**Graceful Degradation:**
```tsx
const { data, isLoading, isError, error } = useRealtimeUpdates('/api/stats', {
  interval: 30000
});

if (isError) {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Unable to load statistics
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          className="mt-4"
        >
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Loading States:**
```tsx
if (isLoading && !data) {
  return (
    <div className="grid grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="bg-muted rounded-lg h-11 w-11" />
          <div className="space-y-2">
            <div className="h-8 w-20 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### Manual Refresh

Manual refresh still available for user-initiated updates:

```tsx
import { queryClient } from "@/lib/queryClient";

function RefreshButton() {
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/threads'] });
  };

  return (
    <Button onClick={refresh} variant="outline" size="sm">
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh Now
    </Button>
  );
}
```

---

### Optimistic Updates

For user-initiated actions (likes, votes), optimistic updates provide instant feedback:

```tsx
const likeMutation = useMutation({
  mutationFn: async (contentId: string) => {
    return apiRequest(`/api/content/like`, {
      method: 'POST',
      body: JSON.stringify({ contentId, userId }),
    });
  },
  onMutate: async (contentId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['/api/content', contentId] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['/api/content', contentId]);

    // Optimistically update
    queryClient.setQueryData(['/api/content', contentId], (old: any) => ({
      ...old,
      likes: old.likes + 1,
    }));

    return { previous };
  },
  onError: (err, contentId, context) => {
    // Rollback on error
    queryClient.setQueryData(['/api/content', contentId], context?.previous);
  },
});
```

---

### Performance Considerations

**Rate Limiting:**
- Minimum interval: 10s (prevents API abuse)
- Background refetch enabled for all intervals
- Smart stale time (interval / 2) reduces unnecessary requests

**Network Optimization:**
- HTTP caching headers respected
- 304 Not Modified responses utilized
- Request deduplication via TanStack Query

**Memory Management:**
- Old queries garbage collected automatically
- Inactive queries removed after 5 minutes
- Cache size limited to prevent memory leaks

---

## SEO Implementation

### Meta Tags (Per-Page)

Every page should set unique meta tags:

```tsx
import { useEffect } from "react";

function ThreadDetail({ thread }: { thread: ForumThread }) {
  useEffect(() => {
    // Update document title
    document.title = `${thread.title} | YoForex.net`;
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', thread.metaDescription);
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', thread.title);
    }
  }, [thread]);

  return <div>{/* thread content */}</div>;
}
```

### SEO-Friendly URLs

All links use SEO slugs:

```tsx
// Good - SEO-friendly
<Link href={`/thread/${thread.slug}`}>
  {thread.title}
</Link>

// Bad - Not SEO-friendly
<Link href={`/thread/${thread.id}`}>
  {thread.title}
</Link>
```

### Structured Data

```tsx
function ThreadDetail({ thread }: { thread: ForumThread }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": thread.title,
    "text": thread.body,
    "datePublished": thread.createdAt,
    "author": {
      "@type": "Person",
      "name": thread.userId, // TODO: Fetch username
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article>{/* thread content */}</article>
    </>
  );
}
```

---

## Best Practices

### 1. Data Fetching Patterns

**✅ Good - Fetch at page level:**
```tsx
function ThreadPage() {
  const { data: thread } = useQuery({ queryKey: ['/api/threads', id] });
  const { data: replies } = useQuery({ queryKey: ['/api/threads', id, 'replies'] });
  
  return (
    <>
      <ThreadHeader thread={thread} />
      <ReplyList replies={replies} />
    </>
  );
}
```

**❌ Bad - Fetch in child components:**
```tsx
function ThreadHeader({ threadId }: { threadId: string }) {
  // Don't fetch here - parent should pass data down
  const { data: thread } = useQuery({ queryKey: ['/api/threads', threadId] });
  return <h1>{thread?.title}</h1>;
}
```

### 2. Error Handling

```tsx
function ThreadList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/threads'],
  });

  if (isLoading) {
    return <div className="grid gap-4">
      {Array(5).fill(0).map((_, i) => <Skeleton key={i} />)}
    </div>;
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Failed to load threads</h3>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/threads'] })}>
          Try Again
        </Button>
      </Card>
    );
  }

  return <div>{/* render threads */}</div>;
}
```

### 3. Loading States

```tsx
function ContentCard({ content }: { content: Content | undefined }) {
  if (!content) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    );
  }

  return <Card>{/* actual content */}</Card>;
}
```

### 4. Type Safety

Always use shared types from `@shared/schema`:

```tsx
import type { ForumThread, ForumReply, Content, User } from "@shared/schema";

interface ThreadCardProps {
  thread: ForumThread;
  author: User;
}

function ThreadCard({ thread, author }: ThreadCardProps) {
  // TypeScript will catch errors!
  return <div>{thread.title} by {author.username}</div>;
}
```

### 5. Accessibility

Add proper ARIA labels and test IDs:

```tsx
<Button 
  aria-label="Like this content"
  data-testid="button-like"
  onClick={handleLike}
>
  <Heart className="w-4 h-4" />
  {likes}
</Button>
```

### 6. Performance Optimization

**Use React.memo for expensive components:**
```tsx
import { memo } from "react";

export const ThreadCard = memo(function ThreadCard({ thread }: ThreadCardProps) {
  return <Card>{/* expensive render */}</Card>;
});
```

**Virtualize long lists (future):**
```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualThreadList({ threads }: { threads: ForumThread[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: threads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.index}>
            <ThreadCard thread={threads[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## File Upload Implementation (Future)

### Client-Side Upload

```tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

function ImageUpload({ onUploadComplete }: { onUploadComplete: (urls: string[]) => void }) {
  const [files, setFiles] = useState<File[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: (data) => {
      onUploadComplete(data.urls);
      setFiles([]);
    }
  });

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          const fileList = Array.from(e.target.files || []);
          setFiles(fileList);
        }}
      />
      <Button 
        onClick={() => uploadMutation.mutate(files)}
        disabled={files.length === 0 || uploadMutation.isPending}
      >
        {uploadMutation.isPending ? 'Uploading...' : `Upload ${files.length} images`}
      </Button>
    </div>
  );
}
```

---

## Testing Strategy

### Component Tests (Future)

```tsx
import { render, screen } from "@testing-library/react";
import { ThreadCard } from "./ThreadCard";

test("renders thread card", () => {
  const thread = {
    id: "1",
    title: "Test Thread",
    metaDescription: "Test description",
    views: 100,
    replyCount: 5,
  };

  render(<ThreadCard thread={thread} />);
  
  expect(screen.getByText("Test Thread")).toBeInTheDocument();
  expect(screen.getByText("5")).toBeInTheDocument(); // Reply count
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from "@playwright/test";

test("create thread flow", async ({ page }) => {
  await page.goto("/");
  
  await page.click('[data-testid="button-create-thread"]');
  await page.fill('[data-testid="input-thread-title"]', 'My Test Thread');
  await page.fill('[data-testid="input-thread-body"]', 'Thread content here');
  await page.click('[data-testid="button-submit"]');
  
  await expect(page.locator('text=My Test Thread')).toBeVisible();
});
```

---

## Deployment Checklist

### Frontend Optimization
- [ ] Run `npm run build` to generate production build
- [ ] Check bundle size (`vite-bundle-visualizer`)
- [ ] Enable gzip compression
- [ ] Add service worker for PWA (optional)
- [ ] Configure CDN for static assets

### SEO Optimization
- [ ] Add `sitemap.xml` generation
- [ ] Configure `robots.txt`
- [ ] Add canonical URLs
- [ ] Implement social share cards
- [ ] Test with Google PageSpeed Insights

### Performance
- [ ] Lazy load images with `loading="lazy"`
- [ ] Code split routes with `React.lazy()`
- [ ] Optimize fonts (subset, preload)
- [ ] Enable HTTP/2 push
- [ ] Configure service worker caching

---

## Onboarding Checklist Component

**File:** `client/src/components/OnboardingChecklist.tsx`  
**Status:** ✅ Implemented  
**Purpose:** Guide new users through essential platform features

### Component Structure

```tsx
export function OnboardingChecklist() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/me/onboarding'],
    retry: false,
  });

  const dismissMutation = useMutation({
    mutationFn: () => apiRequest('/api/me/onboarding/dismiss', {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me/onboarding'] });
    }
  });

  // Auto-hide if completed or dismissed
  if (data?.completed || data?.dismissed) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <Button variant="ghost" size="icon" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Progress value={progressPercent} />
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskItem
              key={task.step}
              completed={data?.progress[task.step]}
              label={task.label}
              coins={task.coins}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Features

- **Progress Bar:** Shows % completion (0-100%)
- **Task List:** 5 milestones with checkmarks
- **Coin Display:** Shows reward amount for each task
- **Dismiss Button:** Close icon in header
- **Auto-Hide:** Disappears when complete or dismissed
- **Real-time:** Auto-updates as user completes tasks

### Integration

**Used in:** `client/src/pages/Home.tsx`

```tsx
<div className="space-y-6">
  <OnboardingChecklist />
  {/* Other content */}
</div>
```

### Data Structure

**Query Response:**
```typescript
{
  completed: boolean;
  dismissed: boolean;
  progress: {
    profileCreated: boolean;
    firstReply: boolean;
    firstReport: boolean;
    firstUpload: boolean;
    socialLinked: boolean;
  };
}
```

### Task Configuration

```typescript
const tasks = [
  { step: 'profileCreated', label: 'Create your profile', coins: 10 },
  { step: 'firstReply', label: 'Join a discussion', coins: 15 },
  { step: 'firstReport', label: 'Review a broker', coins: 20 },
  { step: 'firstUpload', label: 'Publish your first EA', coins: 50 },
  { step: 'socialLinked', label: 'Link social account', coins: 30 },
];
```

---

**Last Updated:** October 26, 2025  
**Frontend Version:** 1.0.0  
**Framework:** React 18 + TypeScript + Vite
