"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// Type definitions
type Broker = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  overallRating: number;
  reviewCount: number;
  scamReportCount: number;
  isVerified: boolean;
  regulationSummary: string | null;
  yearFounded: number | null;
  status: string;
};

type BrokerReview = {
  id: string;
  userName: string;
  userReputation: number;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  isScamReport: boolean;
  datePosted: Date;
  helpfulCount: number;
};

interface BrokerProfileClientProps {
  slug: string;
  initialBroker: Broker | undefined;
  initialReviews: BrokerReview[];
}

export default function BrokerProfileClient({
  slug,
  initialBroker,
  initialReviews,
}: BrokerProfileClientProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt("write a broker review");
  const [activeTab, setActiveTab] = useState("all-reviews");
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");

  // Use initial data for broker query
  const { data: broker } = useQuery<Broker>({
    queryKey: ["/api/brokers/slug", slug],
    initialData: initialBroker,
  });

  // Use initial data for reviews query
  const { data: reviews } = useQuery<BrokerReview[]>({
    queryKey: ["/api/brokers", broker?.id, "reviews"],
    initialData: initialReviews,
    enabled: !!broker?.id,
  });

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be logged in to review");
      if (!broker?.id) throw new Error("Broker not loaded");
      if (selectedRating === 0) throw new Error("Please select a rating");
      if (!reviewTitle.trim()) throw new Error("Please enter a review title");
      if (!reviewBody.trim() || reviewBody.length < 50) throw new Error("Review must be at least 50 characters");
      
      const res = await apiRequest("POST", "/api/broker-reviews", {
        brokerId: broker.id,
        userId: user.id,
        rating: selectedRating,
        reviewTitle: reviewTitle.trim(),
        reviewBody: reviewBody.trim(),
        isScamReport: false,
      });
      return res.json();
    },
    onSuccess: () => {
      if (broker?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/brokers", broker.id, "reviews"] });
        queryClient.invalidateQueries({ queryKey: ["/api/brokers/slug", slug] });
      }
      setSelectedRating(0);
      setReviewTitle("");
      setReviewBody("");
      toast({
        title: "Review submitted!",
        description: "Your review is pending approval.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Review failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark review helpful mutation
  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user?.id) throw new Error("You must be logged in");
      const res = await apiRequest("POST", `/api/broker-reviews/${reviewId}/helpful`, {
        userId: user.id,
      });
      return res.json();
    },
    onSuccess: () => {
      if (broker?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/brokers", broker.id, "reviews"] });
      }
      toast({
        title: "Marked as helpful",
        description: "Thank you for your feedback.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  // Render interactive star rating for form
  const renderInteractiveStars = () => {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setSelectedRating(star)}
            className="focus:outline-none"
            data-testid={`star-rating-${star}`}
          >
            <Star
              className={`h-8 w-8 ${
                star <= selectedRating
                  ? "fill-yellow-500 text-yellow-500"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Error state - broker not found
  if (!broker) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-6xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Broker Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The broker you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/brokers">
                <Button>Back to Broker Directory</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <EnhancedFooter />
      </div>
    );
  }

  // Filter reviews based on active tab
  const filteredReviews = (reviews || []).filter((review) => {
    if (activeTab === "scam-reports") return review.isScamReport;
    if (activeTab === "all-reviews") return true;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/brokers">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-directory">
              ← Back to Directory
            </Button>
          </Link>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  {broker.logoUrl ? (
                    <img src={broker.logoUrl} alt={broker.name} className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <TrendingUp className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold" data-testid="text-broker-name">{broker.name}</h1>
                    {broker.isVerified && (
                      <Badge variant="default" className="flex items-center gap-1" data-testid="badge-verified">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                    {broker.scamReportCount > 10 && (
                      <Badge variant="destructive" className="flex items-center gap-1" data-testid="badge-scam-alert">
                        <AlertTriangle className="h-3 w-3" />
                        High Scam Reports
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div data-testid="rating-stars">
                      {renderStars(Math.round(broker.overallRating))}
                    </div>
                    <span className="font-semibold" data-testid="text-rating">{broker.overallRating.toFixed(1)}</span>
                    <span className="text-muted-foreground" data-testid="text-review-count">({broker.reviewCount} reviews)</span>
                    {broker.scamReportCount > 0 && (
                      <span className="text-destructive text-sm" data-testid="text-scam-count">
                        {broker.scamReportCount} scam reports
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {broker.yearFounded && (
                      <p className="text-sm" data-testid="text-founded"><strong>Founded:</strong> {broker.yearFounded}</p>
                    )}
                    <p className="text-sm" data-testid="text-regulation"><strong>Regulation:</strong> {broker.regulationSummary || 'Not specified'}</p>
                  </div>

                  <div className="flex gap-3">
                    {broker.websiteUrl && (
                      <Button asChild data-testid="button-visit-website">
                        <a href={broker.websiteUrl} target="_blank" rel="noopener noreferrer">
                          Visit Website <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      data-testid="button-write-review"
                      onClick={() => {
                        // Scroll to review form
                        const reviewForm = document.getElementById('review-form');
                        if (reviewForm) {
                          reviewForm.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      Write a Review
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all-reviews" data-testid="tab-all-reviews">
              All Reviews ({broker.reviewCount})
            </TabsTrigger>
            <TabsTrigger value="scam-reports" data-testid="tab-scam-reports">
              Scam Reports ({broker.scamReportCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Review Submission Form */}
            {isAuthenticated && (
              <Card id="review-form">
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rating</label>
                    {renderInteractiveStars()}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Review Title</label>
                    <input
                      type="text"
                      placeholder="Brief summary of your experience"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      data-testid="input-review-title"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Review</label>
                    <Textarea
                      placeholder="Share your experience with this broker... (minimum 50 characters)"
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      className="min-h-32"
                      data-testid="input-review-body"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {reviewBody.length} / 50 minimum characters
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => requireAuth(() => reviewMutation.mutate())}
                    disabled={reviewMutation.isPending || selectedRating === 0 || !reviewTitle.trim() || reviewBody.length < 50}
                    data-testid="button-submit-review"
                  >
                    {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isAuthenticated && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Please log in to write a review
                  </p>
                  <Button onClick={() => requireAuth(() => {})}>
                    Log In to Review
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            {filteredReviews.map((review) => (
              <Card key={review.id} data-testid={`card-review-${review.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg" data-testid={`text-review-title-${review.id}`}>
                          {review.reviewTitle}
                        </h3>
                        {review.isScamReport && (
                          <Badge variant="destructive" className="flex items-center gap-1" data-testid={`badge-scam-report-${review.id}`}>
                            <AlertTriangle className="h-3 w-3" />
                            Scam Report
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span data-testid={`text-reviewer-name-${review.id}`}>{review.userName}</span>
                        <span>•</span>
                        <span data-testid={`text-reviewer-reputation-${review.id}`}>{review.userReputation} reputation</span>
                        <span>•</span>
                        <span data-testid={`text-review-date-${review.id}`}>
                          {new Date(review.datePosted).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div data-testid={`rating-stars-${review.id}`}>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 whitespace-pre-wrap" data-testid={`text-review-body-${review.id}`}>
                    {review.reviewBody}
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Was this helpful?</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="gap-2" 
                      data-testid={`button-helpful-${review.id}`}
                      onClick={() => requireAuth(() => helpfulMutation.mutate(review.id))}
                      disabled={helpfulMutation.isPending}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span data-testid={`text-helpful-count-${review.id}`}>{review.helpfulCount}</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="gap-2" 
                      data-testid={`button-not-helpful-${review.id}`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredReviews.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {activeTab === "scam-reports" 
                      ? "No scam reports for this broker."
                      : "No reviews yet. Be the first to review this broker!"}
                  </p>
                  <Button 
                    className="mt-4" 
                    data-testid="button-write-first-review"
                    onClick={() => {
                      setActiveTab("all-reviews");
                      const reviewForm = document.getElementById('review-form');
                      if (reviewForm) {
                        reviewForm.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    Write a Review
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <EnhancedFooter />
      <AuthPrompt />
    </div>
  );
}
