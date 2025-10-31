"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Star, MessageSquare, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  review: string;
  createdAt: Date | string;
  contentTitle?: string;
  userId?: string;
  username?: string;
  helpful?: number;
  sellerResponse?: {
    message: string;
    date: Date | string;
  };
}

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

export function ReviewsSection({ 
  reviews = [], 
  isLoading = false,
  ratingBreakdown 
}: ReviewsSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews Received</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const breakdown = ratingBreakdown || {
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0,
    totalReviews: reviews.length,
    breakdown: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5" data-testid={`stars-${rating}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating 
                ? 'fill-yellow-500 text-yellow-500' 
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const featuredReviews = reviews
    .filter(r => r.rating >= 4)
    .sort((a, b) => (b.helpful || 0) - (a.helpful || 0))
    .slice(0, 3);

  return (
    <Card data-testid="reviews-section">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Reviews Received</CardTitle>
          <Badge variant="outline" data-testid="reviews-count">
            {breakdown.totalReviews} {breakdown.totalReviews === 1 ? 'review' : 'reviews'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-center p-6 border rounded-lg">
              <div className="text-5xl font-bold mb-2" data-testid="average-rating">
                {breakdown.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(breakdown.averageRating))}
              </div>
              <div className="text-sm text-muted-foreground">
                Based on {breakdown.totalReviews} {breakdown.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = breakdown.breakdown[stars as keyof typeof breakdown.breakdown];
              const percentage = breakdown.totalReviews > 0 
                ? (count / breakdown.totalReviews) * 100 
                : 0;

              return (
                <div 
                  key={stars} 
                  className="flex items-center gap-3"
                  data-testid={`rating-breakdown-${stars}`}
                >
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  </div>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {featuredReviews.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Featured Reviews</h3>
            </div>
            <div className="space-y-3">
              {featuredReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border rounded-lg space-y-3"
                  data-testid={`featured-review-${review.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {review.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {review.username || 'Anonymous'}
                          </span>
                          {review.contentTitle && (
                            <span className="text-xs text-muted-foreground">
                              · {review.contentTitle}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.helpful && review.helpful > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        {review.helpful}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground pl-11">
                    {review.review}
                  </p>

                  {review.sellerResponse && (
                    <div className="pl-11 mt-3 pt-3 border-t">
                      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                        <MessageSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium mb-1">
                            Seller Response · {formatDistanceToNow(new Date(review.sellerResponse.date), { addSuffix: true })}
                          </div>
                          <p className="text-sm">
                            {review.sellerResponse.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {reviews.length === 0 && (
          <div className="text-center py-12" data-testid="no-reviews">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">No reviews yet</h3>
            <p className="text-sm text-muted-foreground">
              This user hasn't received any reviews for their content.
            </p>
          </div>
        )}

        {reviews.length > 0 && reviews.length > featuredReviews.length && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">All Reviews</h3>
            <div className="space-y-3">
              {reviews.slice(0, 5).map((review) => (
                <div
                  key={review.id}
                  className="p-4 border rounded-lg space-y-2"
                  data-testid={`review-${review.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {review.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {review.username || 'Anonymous'}
                        </span>
                        {review.contentTitle && (
                          <span className="text-xs text-muted-foreground">
                            · {review.contentTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.review}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
