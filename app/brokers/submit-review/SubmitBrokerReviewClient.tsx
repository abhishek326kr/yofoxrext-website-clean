"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Star, Coins, AlertTriangle, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Link from "next/link";
import slugify from "slugify";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  brokerId: z.string().min(1, "Please select a broker"),
  rating: z.number().min(1, "Please select a rating").max(5),
  reviewTitle: z.string().min(10, "Title must be at least 10 characters").max(200),
  reviewBody: z.string().min(100, "Review must be at least 100 characters for coin reward").max(2000),
  isScamReport: z.boolean(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface SubmitBrokerReviewClientProps {
  initialBrokers: any[];
}

interface BrokerSearchResult {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  overallRating: number | null;
  reviewCount: number;
}

export default function SubmitBrokerReviewClient({ initialBrokers }: SubmitBrokerReviewClientProps) {
  const { toast } = useToast();
  const [selectedRating, setSelectedRating] = useState(0);
  const [isAddingNewBroker, setIsAddingNewBroker] = useState(false);
  const [newBrokerName, setNewBrokerName] = useState("");
  const [newBrokerWebsite, setNewBrokerWebsite] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BrokerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerSearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      brokerId: "",
      rating: 0,
      reviewTitle: "",
      reviewBody: "",
      isScamReport: false,
    },
  });

  // Debounced search function
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/brokers/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          setSearchResults(Array.isArray(data) ? data : (data.brokers || []));
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Mutation to create new broker with logo
  const createBrokerMutation = useMutation({
    mutationFn: async (data: { name: string; websiteUrl?: string }) => {
      const slug = slugify(data.name, { lower: true, strict: true });
      
      // Fetch logo if website URL is provided
      let fetchedLogoUrl = null;
      if (data.websiteUrl) {
        try {
          const logoResponse = await apiRequest("POST", "/api/brokers/fetch-logo", {
            websiteUrl: data.websiteUrl,
            brokerName: data.name,
          });
          const logoData = await logoResponse.json();
          fetchedLogoUrl = logoData.logoUrl;
        } catch (error) {
          console.error('Logo fetch error:', error);
        }
      }

      const response = await apiRequest("POST", "/api/brokers", {
        name: data.name,
        slug,
        websiteUrl: data.websiteUrl || null,
        logoUrl: fetchedLogoUrl,
        status: "pending",
      });
      return response.json();
    },
    onSuccess: (newBroker: any) => {
      setSelectedBroker({
        id: newBroker.id,
        name: newBroker.name,
        slug: newBroker.slug,
        websiteUrl: newBroker.websiteUrl,
        logoUrl: newBroker.logoUrl,
        isVerified: false,
        overallRating: null,
        reviewCount: 0,
      });
      setLogoUrl(newBroker.logoUrl);
      form.setValue("brokerId", newBroker.id);
      setIsAddingNewBroker(false);
      setNewBrokerName("");
      setNewBrokerWebsite("");
      toast({
        title: "Broker Added",
        description: `${newBroker.name} has been added to the list.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brokers"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Add Broker",
        description: error.message || "Could not create the new broker. Please try again.",
      });
    },
  });

  // Mutation to submit review
  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest("POST", "/api/brokers/review", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted!",
        description: "Your review will be approved shortly. You'll earn +50 coins once approved.",
      });
      form.reset();
      setSelectedRating(0);
      setNewBrokerName("");
      setNewBrokerWebsite("");
      setSelectedBroker(null);
      setSearchQuery("");
      setLogoUrl(null);
      setIsAddingNewBroker(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit review. Please check your connection and try again.",
      });
    },
  });

  const handleBrokerSelect = (broker: BrokerSearchResult) => {
    setSelectedBroker(broker);
    setLogoUrl(broker.logoUrl);
    form.setValue("brokerId", broker.id);
    setOpen(false);
    setSearchQuery(broker.name);
  };

  const handleAddNewBroker = () => {
    if (!newBrokerName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Broker Name",
        description: "Please enter a valid broker name.",
      });
      return;
    }
    createBrokerMutation.mutate({
      name: newBrokerName.trim(),
      websiteUrl: newBrokerWebsite.trim() || undefined,
    });
  };

  const onSubmit = (data: ReviewFormData) => {
    if (!data.brokerId) {
      toast({
        variant: "destructive",
        title: "Missing Broker",
        description: "Please select or add a broker before submitting.",
      });
      return;
    }
    submitReviewMutation.mutate(data);
  };

  const wordCount = form.watch("reviewBody")?.split(/\s+/).filter(Boolean).length || 0;
  const isEligibleForReward = wordCount >= 200;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-brokers" asChild>
            <Link href="/brokers">
              ← Back to Broker Directory
            </Link>
          </Button>

          <h1 className="text-4xl font-bold mb-2">Submit Broker Review</h1>
          <p className="text-lg text-muted-foreground">
            Share your experience and help the community make informed decisions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Review</CardTitle>
                <CardDescription>
                  Provide honest feedback about your experience with this broker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="brokerId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Select Broker</FormLabel>
                          
                          {!isAddingNewBroker ? (
                            <>
                              <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={open}
                                      className={cn(
                                        "w-full justify-between",
                                        !selectedBroker && "text-muted-foreground"
                                      )}
                                      data-testid="button-select-broker"
                                    >
                                      <div className="flex items-center gap-2">
                                        {selectedBroker && logoUrl && (
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage src={logoUrl} alt={selectedBroker.name} />
                                            <AvatarFallback>{selectedBroker.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                        )}
                                        <span className="truncate">
                                          {selectedBroker ? selectedBroker.name : "Search for a broker..."}
                                        </span>
                                      </div>
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                  <Command shouldFilter={false}>
                                    <CommandInput
                                      placeholder="Type to search brokers..."
                                      value={searchQuery}
                                      onValueChange={setSearchQuery}
                                      data-testid="input-broker-search"
                                    />
                                    <CommandList>
                                      {isSearching ? (
                                        <div className="flex items-center justify-center py-6">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                                        </div>
                                      ) : searchResults.length > 0 ? (
                                        <CommandGroup heading="Brokers">
                                          {searchResults.map((broker) => (
                                            <CommandItem
                                              key={broker.id}
                                              value={broker.name}
                                              onSelect={() => handleBrokerSelect(broker)}
                                              data-testid={`broker-option-${broker.id}`}
                                            >
                                              <div className="flex items-center gap-3 w-full">
                                                <Avatar className="h-8 w-8">
                                                  <AvatarImage src={broker.logoUrl || undefined} alt={broker.name} />
                                                  <AvatarFallback>{broker.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">{broker.name}</p>
                                                    {broker.isVerified && (
                                                      <Badge variant="secondary" className="text-xs">
                                                        Verified
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  {broker.reviewCount > 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                      {broker.reviewCount} reviews
                                                    </p>
                                                  )}
                                                </div>
                                                {selectedBroker?.id === broker.id && (
                                                  <Check className="h-4 w-4" />
                                                )}
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      ) : searchQuery.length >= 2 ? (
                                        <CommandEmpty>
                                          <div className="text-center py-6">
                                            <p className="text-sm text-muted-foreground mb-4">
                                              No broker found with name "{searchQuery}"
                                            </p>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setNewBrokerName(searchQuery);
                                                setIsAddingNewBroker(true);
                                                setOpen(false);
                                              }}
                                              data-testid="button-add-new-from-search"
                                            >
                                              Add "{searchQuery}" as new broker
                                            </Button>
                                          </div>
                                        </CommandEmpty>
                                      ) : (
                                        <div className="text-center py-6 text-sm text-muted-foreground">
                                          Type at least 2 characters to search
                                        </div>
                                      )}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              
                              {selectedBroker && logoUrl && (
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={logoUrl} alt={selectedBroker.name} />
                                    <AvatarFallback>{selectedBroker.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{selectedBroker.name}</p>
                                    <p className="text-xs text-muted-foreground">Logo preview</p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Input
                                  placeholder="Enter broker name..."
                                  value={newBrokerName}
                                  onChange={(e) => setNewBrokerName(e.target.value)}
                                  data-testid="input-new-broker-name"
                                  disabled={createBrokerMutation.isPending}
                                />
                                <Input
                                  placeholder="Broker website URL (optional, for logo fetch)..."
                                  value={newBrokerWebsite}
                                  onChange={(e) => setNewBrokerWebsite(e.target.value)}
                                  data-testid="input-new-broker-website"
                                  disabled={createBrokerMutation.isPending}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Providing a website URL helps us automatically fetch the broker's logo
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  onClick={handleAddNewBroker}
                                  disabled={createBrokerMutation.isPending || !newBrokerName.trim()}
                                  data-testid="button-add-broker"
                                >
                                  {createBrokerMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Adding...
                                    </>
                                  ) : (
                                    "Add Broker"
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    setIsAddingNewBroker(false);
                                    setNewBrokerName("");
                                    setNewBrokerWebsite("");
                                  }}
                                  data-testid="button-cancel-add-broker"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Rating</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-8 w-8 cursor-pointer transition-colors ${
                                    star <= (selectedRating || field.value)
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground hover:text-primary"
                                  }`}
                                  onClick={() => {
                                    setSelectedRating(star);
                                    field.onChange(star);
                                  }}
                                  data-testid={`star-rating-${star}`}
                                />
                              ))}
                              {selectedRating > 0 && (
                                <span className="ml-2 font-semibold">{selectedRating}/5</span>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reviewTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Sum up your experience in one line..."
                              {...field}
                              data-testid="input-review-title"
                            />
                          </FormControl>
                          <FormDescription data-testid="text-title-character-count">
                            {field.value.length}/200 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reviewBody"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Review</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share your detailed experience with this broker. Include information about spreads, execution speed, customer service, withdrawals, etc."
                              className="min-h-[200px]"
                              {...field}
                              data-testid="textarea-review-body"
                            />
                          </FormControl>
                          <FormDescription className="flex items-center justify-between">
                            <span data-testid="text-word-count">{wordCount} words (minimum 100, recommended 200+ for coins)</span>
                            {isEligibleForReward && (
                              <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-coin-eligible">
                                <Coins className="h-3 w-3 text-primary" />
                                Eligible for +50 Coins
                              </Badge>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isScamReport"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-destructive/5">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-scam-report"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-2 text-destructive">
                              <AlertTriangle className="h-4 w-4" />
                              This is a SCAM REPORT
                            </FormLabel>
                            <FormDescription>
                              Check this box only if you're reporting fraudulent activity, withdrawal issues, or deceptive practices. Provide detailed evidence in your review.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={submitReviewMutation.isPending}
                        data-testid="button-submit-review"
                      >
                        {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        onClick={() => {
                          form.reset();
                          setSelectedRating(0);
                          setIsAddingNewBroker(false);
                          setNewBrokerName("");
                          setNewBrokerWebsite("");
                          setSelectedBroker(null);
                          setSearchQuery("");
                          setLogoUrl(null);
                        }}
                        data-testid="button-reset-form"
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earn Gold Coins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md border border-primary/20">
                  <Coins className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">+50 Gold Coins</p>
                    <p className="text-xs text-muted-foreground">For quality reviews (200+ words)</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your review will be verified by our moderators before approval. Helpful, detailed reviews earn coins faster!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>✓ Be specific about spreads, execution speed, and costs</p>
                <p>✓ Share actual numbers and dates when possible</p>
                <p>✓ Include both positives and negatives</p>
                <p>✓ Mention the account type you used</p>
                <p>✓ Upload screenshots if reporting issues</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
