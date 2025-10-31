"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  Download,
  Eye,
  Coins,
  ShoppingCart,
  Check,
  Heart,
  Share2,
  FileCheck,
  Package,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { Content, User as UserType, ContentReview } from "@shared/schema";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";

// Review form schema
const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().min(50, "Review must be at least 50 characters").max(1000, "Review must be less than 1000 characters"),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ContentDetailClientProps {
  slug: string;
  initialContent: Content | undefined;
  initialAuthor: UserType | undefined;
  initialReviews: Array<ContentReview & { user: UserType }>;
  initialSimilarContent: Content[];
  initialAuthorReleases: Content[];
}

export default function ContentDetailClient({
  slug,
  initialContent,
  initialAuthor,
  initialReviews,
  initialSimilarContent,
  initialAuthorReleases,
}: ContentDetailClientProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt("interact with this content");
  const [selectedRating, setSelectedRating] = useState(0);

  // Check if slug is UUID format
  const isUUID = slug?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

  // Use initial data for content query
  const { data: content } = useQuery<Content>({
    queryKey: isUUID
      ? ["/api/content", slug]
      : ["/api/content/slug", slug],
    initialData: initialContent,
    enabled: !!slug,
  });

  // Use initial data for author query
  const { data: author } = useQuery<UserType>({
    queryKey: ["/api/user", content?.authorId],
    initialData: initialAuthor,
    enabled: !!content?.authorId,
  });

  // Fetch current user's coins
  const { data: userCoins } = useQuery<{ totalCoins: number; weeklyEarned: number; rank: number | null }>({
    queryKey: ["/api/user", user?.id, "coins"],
    enabled: !!user?.id,
    retry: false,
    placeholderData: { totalCoins: 0, weeklyEarned: 0, rank: null },
  });

  // Check if user has purchased content
  const { data: purchaseStatus, isLoading: isLoadingPurchase } = useQuery<{ hasPurchased: boolean }>({
    queryKey: ["/api/content", content?.id, "purchased", user?.id],
    enabled: !!content?.id && !!user?.id,
  });

  // Use initial data for similar content query
  const { data: similarContent } = useQuery<Content[]>({
    queryKey: ["/api/content", { category: content?.category, limit: 5 }],
    initialData: initialSimilarContent,
    enabled: !!content?.category,
  });

  // Use initial data for author releases query
  const { data: authorReleases } = useQuery<Content[]>({
    queryKey: ["/api/user", content?.authorId, "content"],
    initialData: initialAuthorReleases,
    enabled: !!content?.authorId,
  });

  // Purchase content mutation
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be logged in to purchase");
      if (!content?.id) throw new Error("Content not loaded");
      const res = await apiRequest("POST", "/api/content/purchase", {
        contentId: content.id,
        buyerId: user.id,
      });
      return res.json();
    },
    onSuccess: () => {
      if (content?.id && user?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/content", content.id, "purchased", user.id] });
        queryClient.invalidateQueries({ queryKey: ["/api/user", user.id, "coins"] });
      }
      toast({
        title: "Purchase successful!",
        description: "You can now download this content.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Like content mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be logged in to like");
      if (!content?.id) throw new Error("Content not loaded");
      const res = await apiRequest("POST", "/api/content/like", {
        contentId: content.id,
        userId: user.id,
      });
      return res.json();
    },
    onSuccess: () => {
      if (content?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/content/slug", slug] });
        queryClient.invalidateQueries({ queryKey: ["/api/content", slug] });
      }
      toast({
        title: "Liked!",
        description: "Thank you for your feedback.",
      });
    },
  });

  // Use initial data for reviews query
  const { data: reviews } = useQuery<Array<ContentReview & { user: UserType }>>({
    queryKey: ["/api/content", content?.id, "reviews"],
    initialData: initialReviews,
    enabled: !!content?.id,
  });

  // Review form
  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      review: "",
    },
  });

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      if (!user?.id) throw new Error("You must be logged in to review");
      if (!content?.id) throw new Error("Content not loaded");
      const res = await apiRequest("POST", "/api/content/review", {
        contentId: content.id,
        userId: user.id,
        rating: values.rating,
        review: values.review,
      });
      return res.json();
    },
    onSuccess: () => {
      if (content?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/content", content.id, "reviews"] });
      }
      reviewForm.reset();
      setSelectedRating(0);
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

  // Handle share button
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied!",
        description: "Content link copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    });
  };

  // Error state
  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Content Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The content you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/marketplace">
                <Button>Back to Marketplace</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <EnhancedFooter />
      </div>
    );
  }

  const isPurchased = purchaseStatus?.hasPurchased || false;
  const images = content.images || [];
  const coverImage = images.find(img => img.isCover) || images[0];
  const files = content.files || [];
  const tags = content.tags || [];

  // Build breadcrumb schema
  const breadcrumbPath = [
    { name: 'Home', url: '/' },
    { name: 'Marketplace', url: '/marketplace' },
    { name: content.category || 'Content', url: `/category/${content.category}` },
    { name: content.title, url: (content as any).fullUrl || `/content/${content.slug}` }
  ];

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbSchema path={breadcrumbPath} />
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Hero Section */}
            <Card data-testid="card-content-hero">
              <CardContent className="p-8 space-y-6">
                
                {/* Title & Meta */}
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold leading-tight" data-testid="text-content-title">
                    {content.title}
                  </h1>
                  
                  {/* Author & Meta Row */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{author?.username?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/user/${author?.username || ""}`}>
                          <div className="font-medium hover:underline" data-testid="text-author-name">
                            {author?.username || "Loading..."}
                          </div>
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {author?.totalCoins?.toLocaleString() || 0} reputation
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5" data-testid="stat-views">
                        <Eye className="w-4 h-4" />
                        <span>{content.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5" data-testid="stat-likes">
                        <Heart className="w-4 h-4" />
                        <span>{content.likes}</span>
                      </div>
                      <div className="flex items-center gap-1.5" data-testid="stat-downloads">
                        <Download className="w-4 h-4" />
                        <span>{content.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1.5" data-testid="stat-date">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Platform & Version Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {content.platform && (
                      <Badge variant="secondary" className="text-sm" data-testid="badge-platform">
                        <Package className="w-3 h-3 mr-1" />
                        {content.platform}
                      </Badge>
                    )}
                    {content.version && (
                      <Badge variant="outline" className="text-sm" data-testid="badge-version">
                        v{content.version}
                      </Badge>
                    )}
                    {content.category && (
                      <Badge variant="default" className="text-sm" data-testid="badge-category">
                        {content.category}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Cover Image */}
                {coverImage && (
                  <div className="rounded-lg overflow-hidden border" data-testid="img-cover">
                    <img 
                      src={coverImage.url} 
                      alt={content.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Specs Table */}
                <Card className="bg-muted/50" data-testid="card-specs">
                  <CardHeader>
                    <CardTitle className="text-lg">Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Type</div>
                        <div className="font-medium">{content.type.toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Platform</div>
                        <div className="font-medium">{content.platform || "Universal"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Version</div>
                        <div className="font-medium">{content.version || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Category</div>
                        <div className="font-medium">{content.category}</div>
                      </div>
                      {files.length > 0 && (
                        <div>
                          <div className="text-muted-foreground mb-1">File Size</div>
                          <div className="font-medium">{(files[0].size / 1024).toFixed(2)} KB</div>
                        </div>
                      )}
                      <div>
                        <div className="text-muted-foreground mb-1">Price</div>
                        <div className="font-medium flex items-center gap-1">
                          {content.isFree ? (
                            <span className="text-green-600">Free</span>
                          ) : (
                            <>
                              <Coins className="w-4 h-4 text-yellow-600" />
                              {content.priceCoins} coins
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* File Download Block */}
                {files.length > 0 && (
                  <Card className="border-2 border-primary/20" data-testid="card-files">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileCheck className="w-5 h-5" />
                        Download Files
                      </CardTitle>
                      {isPurchased && (
                        <Badge variant="default" className="gap-1" data-testid="badge-purchased">
                          <Check className="w-3 h-3" />
                          Purchased
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {files.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                          data-testid={`file-item-${index}`}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{file.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Size: {(file.size / 1024).toFixed(2)} KB
                            </div>
                            {file.checksum && (
                              <div className="text-xs text-muted-foreground mt-1 font-mono">
                                SHA-256: {file.checksum.substring(0, 16)}...
                              </div>
                            )}
                          </div>
                          {isPurchased ? (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                              data-testid={`button-download-${index}`}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled
                              data-testid={`button-locked-${index}`}
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Locked
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                <div data-testid="content-description">
                  <h2 className="text-2xl font-bold mb-4">Description</h2>
                  <div className="prose prose-sm max-w-none text-foreground">
                    {content.description.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-sm"
                          data-testid={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requireAuth(() => likeMutation.mutate())}
                    disabled={likeMutation.isPending}
                    data-testid="button-like"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Like ({content.likes})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    data-testid="button-share"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card data-testid="card-reviews">
              <CardHeader>
                <CardTitle className="text-2xl">Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Review Submission Form */}
                {isAuthenticated && (
                  <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
                    <h3 className="font-semibold text-lg">Write a Review</h3>
                    <Form {...reviewForm}>
                      <form onSubmit={reviewForm.handleSubmit((values) => reviewMutation.mutate(values))} className="space-y-4">
                        <FormField
                          control={reviewForm.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rating</FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={rating}
                                      type="button"
                                      onClick={() => {
                                        setSelectedRating(rating);
                                        field.onChange(rating);
                                      }}
                                      className="focus:outline-none"
                                      data-testid={`star-rating-${rating}`}
                                    >
                                      <Star
                                        className={`w-8 h-8 ${
                                          selectedRating >= rating
                                            ? "fill-yellow-500 text-yellow-500"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={reviewForm.control}
                          name="review"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Review</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Share your experience with this content... (minimum 50 characters)"
                                  className="min-h-32"
                                  data-testid="input-review"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          disabled={reviewMutation.isPending || selectedRating === 0}
                          data-testid="button-submit-review"
                        >
                          {reviewMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Review"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="text-center p-6 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">
                      <Link href="/api/login" className="text-primary hover:underline">
                        Log in
                      </Link>{" "}
                      to write a review
                    </p>
                  </div>
                )}

                <Separator />

                {/* Display Reviews */}
                <div className="space-y-4">
                  {reviews && reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`review-${review.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>{review.user?.username?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium" data-testid={`review-author-${review.id}`}>
                                {review.user?.username || "Anonymous"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1" data-testid={`review-stars-${review.id}`}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? "fill-yellow-500 text-yellow-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm" data-testid={`review-text-${review.id}`}>
                          {review.review}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      No reviews yet. Be the first to review!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Purchase Card */}
            {!content.isFree && (
              <Card className="sticky top-4" data-testid="card-purchase">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Coins className="w-6 h-6 text-yellow-600" />
                    {content.priceCoins.toLocaleString()} Coins
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingPurchase ? (
                    <Button size="lg" className="w-full" disabled>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </Button>
                  ) : isPurchased ? (
                    <Button size="lg" className="w-full" disabled data-testid="button-purchased">
                      <Check className="w-4 h-4 mr-2" />
                      Already Purchased
                    </Button>
                  ) : (
                    <Button 
                      size="lg"
                      className="w-full"
                      onClick={() => requireAuth(() => purchaseMutation.mutate())}
                      disabled={purchaseMutation.isPending}
                      data-testid="button-purchase"
                    >
                      {purchaseMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Purchase Now
                        </>
                      )}
                    </Button>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-4 h-4" />
                      Instant download
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-4 h-4" />
                      6 months support
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-4 h-4" />
                      Free updates
                    </div>
                  </div>

                  {!isAuthenticated && (
                    <p className="text-xs text-muted-foreground">
                      <Link href="/api/login" className="text-primary hover:underline">
                        Log in
                      </Link> to purchase
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Similar Content */}
            {similarContent && similarContent.length > 1 && (
              <Card data-testid="card-similar">
                <CardHeader>
                  <CardTitle className="text-lg">Similar {content.category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {similarContent
                    .filter(item => item.id !== content.id)
                    .slice(0, 4)
                    .map((item) => (
                      <Link key={item.id} href={`/content/${item.slug || item.id}`}>
                        <div 
                          className="p-3 rounded-lg hover-elevate border cursor-pointer"
                          data-testid={`similar-item-${item.id}`}
                        >
                          <div className="font-medium text-sm line-clamp-2 mb-1">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.isFree ? (
                              <span className="text-green-600">Free</span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Coins className="w-3 h-3 text-yellow-600" />
                                {item.priceCoins}
                              </span>
                            )}
                            <span>•</span>
                            <span>{item.downloads} downloads</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Author's Other Releases */}
            {authorReleases && authorReleases.length > 1 && (
              <Card data-testid="card-author-releases">
                <CardHeader>
                  <CardTitle className="text-lg">More by {author?.username}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {authorReleases
                    .filter(item => item.id !== content.id)
                    .slice(0, 3)
                    .map((item) => (
                      <Link key={item.id} href={`/content/${item.slug || item.id}`}>
                        <div 
                          className="p-3 rounded-lg hover-elevate border cursor-pointer"
                          data-testid={`author-release-${item.id}`}
                        >
                          <div className="font-medium text-sm line-clamp-2 mb-1">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.isFree ? (
                              <span className="text-green-600">Free</span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Coins className="w-3 h-3 text-yellow-600" />
                                {item.priceCoins}
                              </span>
                            )}
                            <span>•</span>
                            <span>{item.views} views</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <EnhancedFooter />
      <AuthPrompt />
    </div>
  );
}
