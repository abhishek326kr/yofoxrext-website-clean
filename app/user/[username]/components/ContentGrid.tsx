"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileCode, 
  LineChart, 
  FileText, 
  Download, 
  Eye, 
  Star,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import type { Content } from '@shared/schema';

interface ContentGridProps {
  content?: Content[];
  isLoading?: boolean;
}

type ContentFilter = 'all' | 'ea' | 'indicator' | 'article';

export function ContentGrid({ content = [], isLoading = false }: ContentGridProps) {
  const [filter, setFilter] = useState<ContentFilter>('all');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Published Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredContent = filter === 'all' 
    ? content 
    : content.filter(item => item.type === filter);

  const featuredContent = content.filter(item => item.isFeatured).slice(0, 3);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'ea': return FileCode;
      case 'indicator': return LineChart;
      case 'article': return FileText;
      default: return FileText;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'ea': return 'Expert Advisor';
      case 'indicator': return 'Indicator';
      case 'article': return 'Article';
      default: return type;
    }
  };

  return (
    <Card data-testid="content-grid">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Published Content</CardTitle>
          <Badge variant="outline" data-testid="content-count">
            {content.length} {content.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as ContentFilter)}>
          <TabsList className="grid w-full grid-cols-4" data-testid="content-filters">
            <TabsTrigger value="all" data-testid="filter-all">
              All
            </TabsTrigger>
            <TabsTrigger value="ea" data-testid="filter-ea">
              EAs
            </TabsTrigger>
            <TabsTrigger value="indicator" data-testid="filter-indicator">
              Indicators
            </TabsTrigger>
            <TabsTrigger value="article" data-testid="filter-article">
              Articles
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {featuredContent.length > 0 && filter === 'all' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Featured Content</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredContent.map((item) => {
                const Icon = getContentIcon(item.type);
                return (
                  <Link 
                    key={item.id} 
                    href={`/content/${item.slug}`}
                    data-testid={`featured-content-${item.id}`}
                  >
                    <Card className="hover-elevate h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                {item.downloads || 0}
                              </div>
                              {item.averageRating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                  {item.averageRating.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {filteredContent.length === 0 ? (
          <div className="text-center py-12" data-testid="no-content">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">No content found</h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'all' 
                ? 'This user hasn\'t published any content yet.'
                : `No ${getContentTypeLabel(filter).toLowerCase()}s published yet.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.map((item) => {
              const Icon = getContentIcon(item.type);
              return (
                <Link 
                  key={item.id} 
                  href={`/content/${item.slug}`}
                  data-testid={`content-item-${item.id}`}
                >
                  <Card className="hover-elevate h-full">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-md flex items-center justify-center">
                          <Icon className="w-8 h-8 text-primary" />
                        </div>
                        
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm line-clamp-2 flex-1">
                              {item.title}
                            </h4>
                            {item.isFeatured && (
                              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {item.description}
                          </p>

                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="secondary" className="text-xs">
                              {getContentTypeLabel(item.type)}
                            </Badge>
                            {!item.isFree && (
                              <Badge variant="outline" className="text-xs">
                                {item.priceCoins} coins
                              </Badge>
                            )}
                            {item.isFree && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                Free
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {item.views || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                {item.downloads || 0}
                              </div>
                            </div>
                            {item.averageRating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                <span className="font-medium">
                                  {item.averageRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
