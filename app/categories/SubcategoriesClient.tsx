"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ForumCategory } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Plus, ArrowRight, FileText, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";

interface SubcategoriesClientProps {
  parentSlug: string;
  parentName: string;
}

export default function SubcategoriesClient({ parentSlug, parentName }: SubcategoriesClientProps) {
  const router = useRouter();
  const { requireAuth, AuthPrompt } = useAuthPrompt("create a thread");
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const { data: subcategories, isLoading } = useQuery<ForumCategory[]>({
    queryKey: ['/api/categories', parentSlug, 'subcategories'],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${parentSlug}/subcategories`);
      if (!res.ok) throw new Error('Failed to fetch subcategories');
      return res.json();
    },
    staleTime: 60000,
  });

  const handleNewThread = (e: React.MouseEvent, categorySlug: string) => {
    e.stopPropagation();
    e.preventDefault();
    requireAuth(() => {
      setIsNavigating(categorySlug);
      router.push(`/discussions/new?category=${categorySlug}`);
    });
  };

  const handleCardClick = (categorySlug: string) => {
    setIsNavigating(categorySlug);
    router.push(`/category/${categorySlug}`);
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Subcategories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" data-testid="heading-subcategories">
          {parentName} Subcategories
        </h3>
        <Badge variant="secondary" className="text-xs">
          {subcategories.length} subcategories
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subcategories.map((subcat) => (
          <Card
            key={subcat.slug}
            onClick={() => handleCardClick(subcat.slug)}
            className={`
              hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 
              ${isNavigating === subcat.slug ? 'border-primary/50' : ''}
              group
            `}
            data-testid={`card-subcategory-${subcat.slug}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors" 
                    data-testid={`text-subcat-name-${subcat.slug}`}>
                    {subcat.name}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-2 mt-1" 
                    data-testid={`text-subcat-desc-${subcat.slug}`}>
                    {subcat.description}
                  </CardDescription>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span data-testid={`stat-subcat-threads-${subcat.slug}`}>
                      {subcat.threadCount || 0} threads
                    </span>
                  </span>
                  <span className="text-border">•</span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span data-testid={`stat-subcat-posts-${subcat.slug}`}>
                      {subcat.postCount || 0} posts
                    </span>
                  </span>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                onClick={(e) => handleNewThread(e, subcat.slug)}
                disabled={isNavigating === subcat.slug}
                data-testid={`button-new-thread-${subcat.slug}`}
              >
                <Plus className="w-3 h-3 mr-1" />
                New Thread
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <AuthPrompt />
    </div>
  );
}