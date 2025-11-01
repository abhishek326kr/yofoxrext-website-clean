"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Download,
  Eye,
  Coins,
  Calendar,
  Share2,
  Star,
  User,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Package
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { coinsToUSD } from "../../../shared/coinUtils";

interface EA {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  priceCoins: number;
  isFree: boolean;
  imageUrls?: string[];
  downloads?: number;
  views?: number;
  createdAt: string;
  creatorId: string;
  creatorUsername?: string;
  creatorProfileImageUrl?: string;
  fileUrl?: string;
}

interface EADetailClientProps {
  ea: EA;
  similarEAs: EA[];
}

export default function EADetailClient({ ea, similarEAs }: EADetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt();

  // Fetch user coins
  const { data: coinsData } = useQuery<{ totalCoins: number }>({
    queryKey: ["/api/user", user?.id, "coins"],
    enabled: !!user?.id,
  });

  const userCoins = coinsData?.totalCoins ?? 0;
  const hasEnoughCoins = userCoins >= ea.priceCoins;

  // Purchase/Download mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/content/purchase/${ea.id}`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      toast({
        title: "EA downloaded!",
        description: `Successfully purchased ${ea.title} for ${ea.priceCoins} coins`,
      });
      
      // Trigger file download
      if (data.downloadUrl || ea.fileUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl || ea.fileUrl;
        link.download = `${ea.title}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "coins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: (error: any) => {
      toast({
        title: "Download failed",
        description: error.message || "Failed to purchase EA",
        variant: "destructive",
      });
    }
  });

  const handleDownload = () => {
    if (!isAuthenticated) {
      requireAuth(() => {});
      return;
    }

    if (!hasEnoughCoins) {
      toast({
        title: "Insufficient coins",
        description: `You need ${ea.priceCoins} coins but only have ${userCoins}`,
        variant: "destructive",
      });
      router.push('/recharge');
      return;
    }

    downloadMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ea.title,
          text: ea.description.substring(0, 100),
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "EA link copied to clipboard",
      });
    }
  };

  const images = ea.imageUrls && ea.imageUrls.length > 0 
    ? ea.imageUrls 
    : ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop"];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/publish-ea">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to EA Listings
            </Button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge data-testid="badge-category">{ea.category}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ea.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="heading-ea-title">
                        {ea.title}
                      </h1>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={ea.creatorProfileImageUrl} alt={ea.creatorUsername} />
                          <AvatarFallback>{ea.creatorUsername?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" data-testid="text-seller-name">{ea.creatorUsername || "Unknown Seller"}</p>
                          <p className="text-sm text-muted-foreground">EA Developer</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="text-2xl px-6 py-3" data-testid="badge-price">
                        <Coins className="h-5 w-5 mr-2" />
                        {ea.priceCoins}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        ~${coinsToUSD(ea.priceCoins).toFixed(2)} USD
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span data-testid="text-downloads">{ea.downloads || 0} downloads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span data-testid="text-views">{ea.views || 0} views</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Image Gallery */}
              {images.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <Carousel className="w-full" data-testid="carousel-images">
                      <CarouselContent>
                        {images.map((img, index) => (
                          <CarouselItem key={index}>
                            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
                              <img
                                src={img}
                                alt={`${ea.title} - Screenshot ${index + 1}`}
                                className="w-full h-full object-cover"
                                data-testid={`img-screenshot-${index}`}
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {images.length > 1 && (
                        <>
                          <CarouselPrevious />
                          <CarouselNext />
                        </>
                      )}
                    </Carousel>
                    {images.length > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`h-2 w-2 rounded-full transition-colors ${
                              index === selectedImage ? 'bg-primary' : 'bg-muted-foreground/25'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">About This EA</h2>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap" data-testid="text-description">
                      {ea.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews Section */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Reviews & Ratings</h2>
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet. Be the first to review this EA!</p>
                  </div>
                </CardContent>
              </Card>

              {/* Similar EAs */}
              {similarEAs.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">You Might Also Like</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {similarEAs.map((similarEA) => (
                        <Link key={similarEA.id} href={`/ea/${similarEA.slug}`}>
                          <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-similar-${similarEA.id}`}>
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                                  <img
                                    src={similarEA.imageUrls?.[0] || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=200&fit=crop"}
                                    alt={similarEA.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                    {similarEA.title}
                                  </h3>
                                  <Badge variant="secondary" className="text-xs">
                                    <Coins className="h-3 w-3 mr-1" />
                                    {similarEA.priceCoins}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Download Section */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-bold">Get This EA</h3>
                  
                  {isAuthenticated ? (
                    <>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
                        <p className="text-2xl font-bold" data-testid="text-user-balance">
                          <Coins className="h-5 w-5 inline mr-2" />
                          {userCoins.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${coinsToUSD(userCoins).toFixed(2)} USD
                        </p>
                      </div>

                      {hasEnoughCoins ? (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="lg"
                          onClick={handleDownload}
                          disabled={downloadMutation.isPending}
                          data-testid="button-download"
                        >
                          {downloadMutation.isPending ? (
                            <>
                              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-5 w-5 mr-2" />
                              Download for {ea.priceCoins} ₡
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            size="lg"
                            onClick={() => router.push('/recharge')}
                            data-testid="button-recharge"
                          >
                            <AlertCircle className="h-5 w-5 mr-2" />
                            Recharge Coins
                          </Button>
                          <p className="text-xs text-center text-destructive">
                            Need {ea.priceCoins - userCoins} more coins
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => requireAuth(() => {})}
                      data-testid="button-login-to-download"
                    >
                      Login to Download
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleShare}
                    data-testid="button-share"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </CardContent>
              </Card>

              {/* Seller's Other EAs */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">About the Seller</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={ea.creatorProfileImageUrl} alt={ea.creatorUsername} />
                      <AvatarFallback>{ea.creatorUsername?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{ea.creatorUsername || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">EA Developer</p>
                    </div>
                  </div>
                  <Link href={`/user/${ea.creatorUsername}`}>
                    <Button variant="outline" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-lg font-bold mb-4">Quick Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{ea.category}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">{ea.priceCoins} ₡</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Downloads:</span>
                      <span className="font-medium">{ea.downloads || 0}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Published:</span>
                      <span className="font-medium">
                        {new Date(ea.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <EnhancedFooter />
      <AuthPrompt />
    </>
  );
}
