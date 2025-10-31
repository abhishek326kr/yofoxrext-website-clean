"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ForumThread, ForumCategory } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { 
  MessageSquare, 
  FileText,
  Plus,
  TrendingUp,
  Clock,
  Star,
  Search,
  Home
} from "lucide-react";

interface CategoryDiscussionClientProps {
  slug: string;
  initialCategory: ForumCategory | undefined;
  initialThreads: ForumThread[];
}

export default function CategoryDiscussionClient({
  slug,
  initialCategory,
  initialThreads,
}: CategoryDiscussionClientProps) {
  const router = useRouter();
  const { requireAuth, AuthPrompt } = useAuthPrompt("create a thread");
  
  const [activeTab, setActiveTab] = useState<"latest" | "trending" | "answered">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: category, isLoading: categoryLoading } = useQuery<ForumCategory>({
    queryKey: ['/api/categories', slug],
    initialData: initialCategory,
    enabled: !!slug,
  });

  const { data: allCategories } = useQuery<ForumCategory[]>({
    queryKey: ['/api/categories'],
  });

  const { data: subcategories } = useQuery<ForumCategory[]>({
    queryKey: ['/api/categories', slug, 'subcategories'],
    enabled: !!slug,
  });

  const { data: threads, isLoading: threadsLoading } = useQuery<ForumThread[]>({
    queryKey: ['/api/categories', slug, 'threads', activeTab, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        tab: activeTab,
      });
      if (debouncedSearch) {
        params.append('q', debouncedSearch);
      }
      const res = await fetch(`/api/categories/${slug}/threads?${params}`);
      if (!res.ok) throw new Error('Failed to fetch threads');
      return res.json();
    },
    initialData: initialThreads,
    enabled: !!slug,
  });

  const isLoading = categoryLoading || threadsLoading;

  // Get parent category for breadcrumbs
  const parentCategory = category?.parentSlug 
    ? allCategories?.find(c => c.slug === category.parentSlug)
    : null;

  // Error state - category not found
  if (!category && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-2">Category Not Found</h2>
            <p className="text-muted-foreground mb-4">The category you're looking for doesn't exist.</p>
            <Link href="/categories">
              <Button>Browse Categories</Button>
            </Link>
          </Card>
        </main>
        <EnhancedFooter />
      </div>
    );
  }

  // Loading state
  if (isLoading && !category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-24 w-full mb-8" />
          <div className="space-y-4">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
        <EnhancedFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6" data-testid="breadcrumb-navigation">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" data-testid="breadcrumb-home">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {parentCategory && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/category/${parentCategory.slug}`} data-testid="breadcrumb-parent">
                    {parentCategory.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="breadcrumb-current">{category?.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header */}
        <Card className="mb-8" data-testid="card-category-header">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <CardTitle className="text-2xl" data-testid="heading-category-name">
                    {category?.name}
                  </CardTitle>
                  <Badge variant="secondary" data-testid="badge-active-status">
                    Active
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4" data-testid="text-category-description">
                  {category?.description}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="stat-thread-count">
                      <strong>{(category?.threadCount ?? 0).toLocaleString()}</strong> threads
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="stat-post-count">
                      <strong>{(category?.postCount ?? 0).toLocaleString()}</strong> posts
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                size="default" 
                data-testid="button-create-thread"
                onClick={() => requireAuth(() => {
                  router.push(`/discussions/new?category=${slug}`);
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Thread
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Subcategories Section */}
        {subcategories && subcategories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4" data-testid="heading-subcategories">
              Subcategories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((subcat) => (
                <Card 
                  key={subcat.slug} 
                  className="hover-elevate active-elevate-2 cursor-pointer" 
                  data-testid={`card-subcategory-${subcat.slug}`}
                >
                  <Link href={`/category/${subcat.slug}`}>
                    <CardHeader>
                      <CardTitle className="text-base" data-testid={`text-subcat-name-${subcat.slug}`}>
                        {subcat.name}
                      </CardTitle>
                      <CardDescription className="text-sm" data-testid={`text-subcat-desc-${subcat.slug}`}>
                        {subcat.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground" data-testid={`stat-subcat-threads-${subcat.slug}`}>
                          {subcat.threadCount} threads
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            requireAuth(() => {
                              router.push(`/discussions/new?category=${subcat.slug}`);
                            });
                          }}
                          data-testid={`button-new-thread-${subcat.slug}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          New
                        </Button>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search within ${category?.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-category-search"
            />
          </div>
          {debouncedSearch && (
            <p className="text-sm text-muted-foreground mt-2" data-testid="text-search-info">
              Searching in: {category?.name}
            </p>
          )}
        </div>

        {/* Filter/Sort Tabs */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Button 
              variant={activeTab === "latest" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setActiveTab("latest")}
              data-testid="filter-latest"
            >
              <Clock className="w-4 h-4 mr-2" />
              Latest
            </Button>
            <Button 
              variant={activeTab === "trending" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setActiveTab("trending")}
              data-testid="filter-trending"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </Button>
            <Button 
              variant={activeTab === "answered" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setActiveTab("answered")}
              data-testid="filter-answered"
            >
              <Star className="w-4 h-4 mr-2" />
              Answered
            </Button>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-thread-count">
            Showing {threads?.length || 0} threads
          </p>
        </div>

        {/* Thread List */}
        <div className="space-y-4">
          {threadsLoading && !threads ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))
          ) : threads && threads.length > 0 ? (
            threads.map((thread) => (
              <Link key={thread.id} href={`/thread/${thread.slug}`} data-testid={`link-thread-${thread.id}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-thread-${thread.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-lg" data-testid={`text-thread-title-${thread.id}`}>
                            {thread.title}
                          </h3>
                          {thread.isPinned && (
                            <Badge variant="secondary" data-testid={`badge-pinned-${thread.id}`}>
                              Pinned
                            </Badge>
                          )}
                          {thread.isSolved && (
                            <Badge variant="default" data-testid={`badge-solved-${thread.id}`}>
                              Solved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-thread-description-${thread.id}`}>
                          {thread.metaDescription}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span data-testid={`stat-reply-count-${thread.id}`}>{thread.replyCount} replies</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span data-testid={`stat-view-count-${thread.id}`}>{thread.views} views</span>
                          </span>
                          <span data-testid={`text-last-activity-${thread.id}`}>
                            Last activity: {new Date(thread.lastActivityAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="p-12 text-center" data-testid="card-no-threads">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {debouncedSearch ? "No threads found" : "No threads yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {debouncedSearch 
                  ? `No threads match your search for "${debouncedSearch}"`
                  : "Be the first to start a discussion in this category!"
                }
              </p>
              {!debouncedSearch && (
                <Button 
                  data-testid="button-create-first-thread"
                  onClick={() => requireAuth(() => {
                    router.push(`/discussions/new?category=${slug}`);
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Thread
                </Button>
              )}
            </Card>
          )}
        </div>
      </main>

      <EnhancedFooter />
      <AuthPrompt />
    </div>
  );
}
