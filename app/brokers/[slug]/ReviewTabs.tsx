'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';

type BrokerReview = {
  id: string;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  isScamReport: boolean;
  datePosted: Date;
  user: {
    username: string;
    reputationScore: number;
  };
};

interface ReviewTabsProps {
  reviews: BrokerReview[];
  scamReportCount: number;
}

export function ReviewTabs({ reviews, scamReportCount }: ReviewTabsProps) {
  const [activeTab, setActiveTab] = useState('all-reviews');

  const filteredReviews = reviews.filter((review) => {
    if (activeTab === 'scam-reports') return review.isScamReport;
    return true;
  });

  const formatDate = (date: Date) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="all-reviews" data-testid="tab-all-reviews">
          All Reviews ({reviews.length})
        </TabsTrigger>
        <TabsTrigger value="scam-reports" data-testid="tab-scam-reports">
          Scam Reports ({scamReportCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id} data-testid={`card-review-${review.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 
                      className="font-semibold text-lg" 
                      data-testid={`text-review-title-${review.id}`}
                    >
                      {review.reviewTitle}
                    </h3>
                    {review.isScamReport && (
                      <Badge 
                        variant="destructive" 
                        data-testid={`badge-scam-${review.id}`}
                      >
                        Scam Report
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <span 
                      className="text-sm font-medium" 
                      data-testid={`text-reviewer-${review.id}`}
                    >
                      {review.user.username}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {review.user.reputationScore} reputation
                    </span>
                    <span 
                      className="text-sm text-muted-foreground" 
                      data-testid={`text-date-${review.id}`}
                    >
                      {formatDate(review.datePosted)}
                    </span>
                  </div>

                  <div className="mb-3" data-testid={`rating-stars-${review.id}`}>
                    <StarRating rating={review.rating} showValue={false} />
                  </div>

                  <p 
                    className="text-sm text-foreground whitespace-pre-wrap" 
                    data-testid={`text-review-body-${review.id}`}
                  >
                    {review.reviewBody}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <button 
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  data-testid={`button-helpful-${review.id}`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Helpful
                </button>
              </div>
            </CardHeader>
          </Card>
        ))}
        
        {filteredReviews.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No reviews found in this category.
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
