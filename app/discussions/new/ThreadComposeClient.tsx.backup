"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ForumCategory, Broker } from "@shared/schema";
import { 
  INSTRUMENTS, 
  TIMEFRAMES, 
  STRATEGIES, 
  PLATFORMS, 
  POPULAR_BROKERS, 
  THREAD_TYPES,
  extractPotentialTags 
} from "@shared/tradingMetadata";
import { countWords } from "@shared/threadUtils";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, ChevronLeft, ChevronRight, HelpCircle, MessageSquare, Star, BookOpen, Lightbulb, Code, X, Upload, FileText, Loader2, Check, Copy, Share2, Bell } from "lucide-react";
import SEOPreview from "@/components/SEOPreview";

// Form validation schema
const threadFormSchema = z.object({
  title: z.string()
    .min(15, "This is a bit short—add 3–4 more words?")
    .max(90, "Title must not exceed 90 characters")
    .refine(
      (val) => {
        const upperCount = (val.match(/[A-Z]/g) || []).length;
        const letterCount = (val.match(/[a-zA-Z]/g) || []).length;
        return letterCount === 0 || upperCount / letterCount < 0.5;
      },
      { message: "Let's tone this down a bit so more folks read it" }
    ),
  body: z.string()
    .min(150, "Need more detail—add a few sentences? (150 characters minimum)")
    .max(50000, "Body is too long"),
  categorySlug: z.string().min(1, "Please select a category"),
  subcategorySlug: z.string().optional(),
  threadType: z.enum(["question", "discussion", "review", "journal", "guide", "program_sharing"]).default("discussion"),
  seoExcerpt: z.string().optional().or(z.literal("")),
  primaryKeyword: z.string().optional().or(z.literal("")),
  instruments: z.array(z.string()).default([]),
  timeframes: z.array(z.string()).default([]),
  strategies: z.array(z.string()).default([]),
  platform: z.string().optional().or(z.literal("")),
  broker: z.string().max(40).optional().or(z.literal("")),
  riskNote: z.string().max(500).optional().or(z.literal("")),
  hashtags: z.array(z.string()).max(10, "Maximum 10 hashtags").default([]),
  reviewTarget: z.string().optional().or(z.literal("")),
  reviewVersion: z.string().optional().or(z.literal("")),
  reviewRating: z.number().int().min(1).max(5).optional(),
  reviewPros: z.array(z.string()).default([]),
  reviewCons: z.array(z.string()).default([]),
  questionSummary: z.string().max(200).optional().or(z.literal("")),
  attachmentUrls: z.array(z.string()).default([]),
});

type ThreadFormData = z.infer<typeof threadFormSchema>;

interface ThreadComposeClientProps {
  categories: ForumCategory[];
}

// Auto-save draft hook
function useThreadDraft(categorySlug: string) {
  const [hasDraft, setHasDraft] = useState(false);
  const draftKey = `thread_draft_${categorySlug}`;

  const saveDraft = useCallback((data: Partial<ThreadFormData>) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        ...data,
        savedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [draftKey]);

  const loadDraft = useCallback((): Partial<ThreadFormData> | null => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHasDraft(true);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  }, [draftKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [draftKey]);

  return { saveDraft, loadDraft, clearDraft, hasDraft };
}

export default function ThreadComposeClient({ categories }: ThreadComposeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { requireAuth, AuthPrompt } = useAuthPrompt("create a thread");
  
  const [currentStep, setCurrentStep] = useState(1);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [proInput, setProInput] = useState("");
  const [conInput, setConInput] = useState("");
  const [bodyCharCount, setBodyCharCount] = useState(0);
  const [titleCharCount, setTitleCharCount] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCustomBroker, setShowCustomBroker] = useState(false);
  const [showCustomPlatform, setShowCustomPlatform] = useState(false);
  
  // Pre-select category from URL param
  const categoryParam = searchParams?.get("category") || "";
  
  // Get subcategories for selected category
  const parentCategories = categories.filter(c => !c.parentSlug);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const subcategories = categories.filter(c => c.parentSlug === selectedCategory);
  
  // Fetch all brokers from database using apiRequest
  const { data: brokers, isLoading: brokersLoading } = useQuery<Broker[]>({
    queryKey: ['/api/brokers'],
  });
  
  // Auto-save draft
  const { saveDraft, loadDraft, clearDraft } = useThreadDraft(selectedCategory || "general");
  
  const form = useForm<ThreadFormData>({
    resolver: zodResolver(threadFormSchema),
    defaultValues: {
      title: "",
      body: "",
      categorySlug: categoryParam,
      subcategorySlug: "",
      threadType: "discussion",
      seoExcerpt: "",
      primaryKeyword: "",
      instruments: [],
      timeframes: [],
      strategies: [],
      platform: "",
      broker: "",
      riskNote: "",
      hashtags: [],
      reviewTarget: "",
      reviewVersion: "",
      reviewPros: [],
      reviewCons: [],
      questionSummary: "",
      attachmentUrls: [],
    },
  });

  const watchedValues = form.watch();
  const watchedThreadType = form.watch("threadType");

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      const shouldRestore = window.confirm("Restore previous draft?");
      if (shouldRestore && draft) {
        Object.keys(draft).forEach((key) => {
          if (key !== 'savedAt') {
            form.setValue(key as any, (draft as any)[key]);
          }
        });
      } else {
        clearDraft();
      }
    }
  }, []);

  // Auto-save every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const values = form.getValues();
      if (values.title || values.body) {
        saveDraft(values);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [form, saveDraft]);

  // Auto-suggest tags based on title and body
  useEffect(() => {
    const text = `${watchedValues.title} ${watchedValues.body}`;
    if (text.trim().length > 20) {
      const tags = extractPotentialTags(text);
      setSuggestedTags(tags);
    } else {
      setSuggestedTags([]);
    }
  }, [watchedValues.title, watchedValues.body]);

  // Update character counts
  useEffect(() => {
    setBodyCharCount((watchedValues.body || "").length);
    setTitleCharCount((watchedValues.title || "").length);
  }, [watchedValues.body, watchedValues.title]);

  // Skip step 1 if no subcategories
  useEffect(() => {
    if (currentStep === 1 && subcategories.length === 0) {
      setCurrentStep(2);
    }
  }, [currentStep, subcategories.length]);

  const createThreadMutation = useMutation({
    mutationFn: async (data: ThreadFormData) => {
      const res = await apiRequest("POST", "/api/threads", data);
      return await res.json() as { thread: any; coinsEarned: number; message: string };
    },
    onSuccess: (response) => {
      clearDraft();
      
      const threadUrl = `${window.location.origin}/thread/${response.thread.slug}`;
      
      const copyLink = async () => {
        try {
          await navigator.clipboard.writeText(threadUrl);
          toast({
            title: "Link copied!",
            description: "Thread URL copied to clipboard",
          });
        } catch (error) {
          toast({
            title: "Failed to copy",
            description: "Please copy the link manually",
            variant: "destructive",
          });
        }
      };
      
      const shareThread = async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: response.thread.title,
              text: "Check out this thread on YoForex",
              url: threadUrl,
            });
          } catch (error) {
            // User cancelled or share failed, fall back to copy
            copyLink();
          }
        } else {
          // Fallback to copy link
          copyLink();
        }
      };
      
      const followThread = async () => {
        try {
          // TODO: Implement follow thread API call when available
          toast({
            title: "Following thread",
            description: "You'll get notified of new replies",
          });
        } catch (error) {
          toast({
            title: "Failed to follow",
            description: "Please try again later",
            variant: "destructive",
          });
        }
      };
      
      toast({
        title: "Posted!",
        description: (
          <div className="space-y-3">
            <p>{response.message} (+{response.coinsEarned} coins)</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={copyLink}
                data-testid="button-copy-link"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={shareThread}
                data-testid="button-share"
              >
                <Share2 className="h-3 w-3 mr-1" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={followThread}
                data-testid="button-follow"
              >
                <Bell className="h-3 w-3 mr-1" />
                Follow
              </Button>
            </div>
          </div>
        ),
        duration: 10000, // Extended duration to allow interaction with buttons
      });
      
      // Navigate after a short delay to allow toast interaction
      setTimeout(() => {
        router.push(`/thread/${response.thread.slug}`);
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create thread",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ThreadFormData) => {
    requireAuth(() => {
      // Add uploaded file URLs to form data
      data.attachmentUrls = uploadedFiles.map(f => f.url);
      
      createThreadMutation.mutate(data);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    if (uploadedFiles.length + files.length > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 files allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      const response = await res.json() as { urls: string[]; message: string };

      const newFiles = response.urls.map((url: string, idx: number) => ({
        name: files[idx].name,
        url: url,
      }));

      setUploadedFiles([...uploadedFiles, ...newFiles]);
      
      toast({
        title: "Files uploaded!",
        description: response.message,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const toggleTag = (field: "instruments" | "timeframes" | "strategies", value: string) => {
    const current = form.getValues(field) || [];
    if (current.includes(value)) {
      form.setValue(field, current.filter(v => v !== value));
    } else {
      form.setValue(field, [...current, value]);
    }
  };

  const addHashtag = () => {
    if (!hashtagInput.trim()) return;
    const normalized = hashtagInput.trim().replace(/^#/, "").toLowerCase();
    const current = form.getValues("hashtags") || [];
    if (!current.includes(normalized) && current.length < 10) {
      form.setValue("hashtags", [...current, normalized]);
    }
    setHashtagInput("");
  };

  const removeHashtag = (tag: string) => {
    const current = form.getValues("hashtags") || [];
    form.setValue("hashtags", current.filter(t => t !== tag));
  };

  const addPro = () => {
    if (!proInput.trim()) return;
    const current = form.getValues("reviewPros") || [];
    form.setValue("reviewPros", [...current, proInput.trim()]);
    setProInput("");
  };

  const addCon = () => {
    if (!conInput.trim()) return;
    const current = form.getValues("reviewCons") || [];
    form.setValue("reviewCons", [...current, conInput.trim()]);
    setConInput("");
  };

  const totalTags = (watchedValues.instruments?.length || 0) + 
    (watchedValues.timeframes?.length || 0) + 
    (watchedValues.strategies?.length || 0) + 
    (watchedValues.hashtags?.length || 0);

  const threadTypeIcon = {
    question: HelpCircle,
    discussion: MessageSquare,
    review: Star,
    journal: BookOpen,
    guide: Lightbulb,
    program_sharing: Code,
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Start a Thread</h1>
            <p className="text-muted-foreground mt-2">Share your knowledge, ask questions, and connect with traders</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* STEP 1: Where (Subcategory Selection) */}
              {currentStep === 1 && subcategories.length > 0 && (
                <Card data-testid="card-step-where">
                  <CardHeader>
                    <CardTitle>Where does this fit?</CardTitle>
                    <CardDescription>Choose the best subcategory for your thread</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="subcategorySlug"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {subcategories.map((sub) => (
                              <Button
                                key={sub.slug}
                                type="button"
                                variant={field.value === sub.slug ? "default" : "outline"}
                                className="h-auto py-4 px-4 flex-col items-start gap-1"
                                onClick={() => field.onChange(sub.slug)}
                                data-testid={`button-subcategory-${sub.slug}`}
                              >
                                <span className="font-semibold text-sm">{sub.name}</span>
                                <span className="text-xs opacity-80">{sub.description}</span>
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        data-testid="button-next-step"
                      >
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 2: Write (Main Content) */}
              {currentStep === 2 && (
                <Card data-testid="card-step-write">
                  <CardHeader>
                    <CardTitle>What's on your mind?</CardTitle>
                    <CardDescription>Tell your story or ask your question</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="What's your topic? e.g., 'XAUUSD M5 scalping rules that worked for me'"
                              data-testid="input-title"
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Short and clear works best</span>
                            <span data-testid="text-char-count">{titleCharCount} characters (15-90 required)</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Body */}
                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Body</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={10}
                              placeholder="Tell your story. What pair? timeframe? broker? results? What do you need help with?"
                              data-testid="textarea-body"
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Share the basics: pair, timeframe, broker, your rules/results, and what you need</span>
                            <span data-testid="text-body-char-count">{bodyCharCount} characters (150-50,000 required)</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Auto-suggested Tags */}
                    {suggestedTags.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Looks right?</Label>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTags.map((tag) => {
                            const isInstrument = INSTRUMENTS.some(i => i.value.toLowerCase() === tag);
                            const isTimeframe = TIMEFRAMES.some(t => t.value.toLowerCase() === tag);
                            const isStrategy = STRATEGIES.some(s => s.value.toLowerCase() === tag);
                            
                            let field: "instruments" | "timeframes" | "strategies" = "instruments";
                            if (isTimeframe) field = "timeframes";
                            else if (isStrategy) field = "strategies";
                            
                            const isSelected = (form.getValues(field) || []).includes(tag);
                            
                            return (
                              <Badge
                                key={tag}
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer hover-elevate"
                                onClick={() => toggleTag(field, tag)}
                                data-testid={`badge-suggested-tag-${tag}`}
                              >
                                {tag.toUpperCase()}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Optional Details Accordion */}
                    <Accordion type="single" collapsible>
                      <AccordionItem value="details">
                        <AccordionTrigger data-testid="button-toggle-details">
                          Add details (optional)
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          {/* Instruments */}
                          <FormField
                            control={form.control}
                            name="instruments"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Instruments</FormLabel>
                                <div className="flex flex-wrap gap-2">
                                  {INSTRUMENTS.slice(0, 15).map((inst) => (
                                    <Badge
                                      key={inst.value}
                                      variant={(field.value || []).includes(inst.value) ? "default" : "outline"}
                                      className="cursor-pointer hover-elevate"
                                      onClick={() => toggleTag("instruments", inst.value)}
                                      data-testid={`badge-instrument-${inst.value}`}
                                    >
                                      {inst.label}
                                    </Badge>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />

                          {/* Timeframes */}
                          <FormField
                            control={form.control}
                            name="timeframes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timeframes</FormLabel>
                                <div className="flex flex-wrap gap-2">
                                  {TIMEFRAMES.map((tf) => (
                                    <Badge
                                      key={tf.value}
                                      variant={(field.value || []).includes(tf.value) ? "default" : "outline"}
                                      className="cursor-pointer hover-elevate"
                                      onClick={() => toggleTag("timeframes", tf.value)}
                                      data-testid={`badge-timeframe-${tf.value}`}
                                    >
                                      {tf.label}
                                    </Badge>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />

                          {/* Strategies */}
                          <FormField
                            control={form.control}
                            name="strategies"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Strategies</FormLabel>
                                <div className="flex flex-wrap gap-2">
                                  {STRATEGIES.slice(0, 12).map((strat) => (
                                    <Badge
                                      key={strat.value}
                                      variant={(field.value || []).includes(strat.value) ? "default" : "outline"}
                                      className="cursor-pointer hover-elevate"
                                      onClick={() => toggleTag("strategies", strat.value)}
                                      data-testid={`badge-strategy-${strat.value}`}
                                    >
                                      {strat.label}
                                    </Badge>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />

                          {/* Platform */}
                          <FormField
                            control={form.control}
                            name="platform"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Platform</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    if (value === "Other") {
                                      setShowCustomPlatform(true);
                                      field.onChange("");
                                    } else {
                                      setShowCustomPlatform(false);
                                      field.onChange(value);
                                    }
                                  }} 
                                  value={showCustomPlatform ? "Other" : field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-platform">
                                      <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {PLATFORMS.map((plat) => (
                                      <SelectItem key={plat.value} value={plat.value}>
                                        {plat.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {showCustomPlatform && (
                                  <FormControl>
                                    <Input
                                      value={field.value}
                                      onChange={(e) => {
                                        field.onChange(e.target.value);
                                      }}
                                      placeholder="Enter platform name manually"
                                      data-testid="input-custom-platform"
                                      className="mt-2"
                                    />
                                  </FormControl>
                                )}
                              </FormItem>
                            )}
                          />

                          {/* Broker */}
                          <FormField
                            control={form.control}
                            name="broker"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Broker</FormLabel>
                                {brokersLoading ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading brokers...
                                  </div>
                                ) : (
                                  <>
                                    <Select 
                                      onValueChange={(value) => {
                                        if (value === "other") {
                                          setShowCustomBroker(true);
                                          field.onChange("");
                                        } else {
                                          setShowCustomBroker(false);
                                          field.onChange(value);
                                        }
                                      }} 
                                      value={showCustomBroker ? "other" : field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger data-testid="select-broker">
                                          <SelectValue placeholder="Select broker" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {brokers && brokers.length > 0 ? (
                                          <>
                                            {brokers.map((broker) => (
                                              <SelectItem key={broker.id} value={broker.name}>
                                                {broker.name}
                                              </SelectItem>
                                            ))}
                                            <SelectItem value="other">Other</SelectItem>
                                          </>
                                        ) : (
                                          <SelectItem value="other">Other</SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                    {showCustomBroker && (
                                      <FormControl>
                                        <Input
                                          value={field.value}
                                          onChange={(e) => {
                                            field.onChange(e.target.value);
                                          }}
                                          placeholder="Enter broker name manually"
                                          data-testid="input-custom-broker"
                                          className="mt-2"
                                        />
                                      </FormControl>
                                    )}
                                  </>
                                )}
                              </FormItem>
                            )}
                          />

                          {/* Risk Note */}
                          <FormField
                            control={form.control}
                            name="riskNote"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Risk Note</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., risk 1% per trade"
                                    data-testid="input-risk-note"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="flex justify-between">
                      {subcategories.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          data-testid="button-back"
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="ml-auto"
                        data-testid="button-next-step"
                      >
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 3: Finish (Thread Type, Conditional Fields, SEO, Hashtags) */}
              {currentStep === 3 && (
                <Card data-testid="card-step-finish">
                  <CardHeader>
                    <CardTitle>Finish up</CardTitle>
                    <CardDescription>Choose thread type and add final details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Thread Type Selection */}
                    <FormField
                      control={form.control}
                      name="threadType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thread Type</FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {THREAD_TYPES.map((type) => {
                              const Icon = threadTypeIcon[type.value as keyof typeof threadTypeIcon];
                              return (
                                <Button
                                  key={type.value}
                                  type="button"
                                  variant={field.value === type.value ? "default" : "outline"}
                                  className="h-auto py-4 px-4 flex-col items-center gap-2"
                                  onClick={() => field.onChange(type.value)}
                                  data-testid={`button-thread-type-${type.value}`}
                                >
                                  <Icon className="h-6 w-6" />
                                  <span className="font-semibold text-sm">{type.label}</span>
                                  <span className="text-xs opacity-80 text-center">{type.description}</span>
                                </Button>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Conditional: Question Summary */}
                    {watchedThreadType === "question" && (
                      <FormField
                        control={form.control}
                        name="questionSummary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What do you want solved?</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={2}
                                placeholder="Summarize your question in 1-2 sentences"
                                data-testid="textarea-question-summary"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Conditional: Review Fields */}
                    {watchedThreadType === "review" && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="reviewTarget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What are you reviewing? *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="EA/Indicator/Broker name"
                                  data-testid="input-review-target"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="reviewVersion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Version (optional)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., v2.3"
                                  data-testid="input-review-version"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="reviewRating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rating (1-5 stars) *</FormLabel>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Button
                                    key={rating}
                                    type="button"
                                    variant={field.value === rating ? "default" : "outline"}
                                    size="icon"
                                    onClick={() => field.onChange(rating)}
                                    data-testid={`button-rating-${rating}`}
                                  >
                                    <Star className={`h-4 w-4 ${field.value && field.value >= rating ? "fill-current" : ""}`} />
                                  </Button>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Pros */}
                        <FormField
                          control={form.control}
                          name="reviewPros"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pros (optional)</FormLabel>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={proInput}
                                    onChange={(e) => setProInput(e.target.value)}
                                    placeholder="Add a pro"
                                    data-testid="input-pro"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addPro();
                                      }
                                    }}
                                  />
                                  <Button type="button" onClick={addPro} data-testid="button-add-pro">
                                    Add
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(field.value || []).map((pro, idx) => (
                                    <Badge key={idx} variant="default" className="gap-1">
                                      ✓ {pro}
                                      <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => {
                                          form.setValue("reviewPros", (field.value || []).filter((_, i) => i !== idx));
                                        }}
                                      />
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Cons */}
                        <FormField
                          control={form.control}
                          name="reviewCons"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cons (optional)</FormLabel>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={conInput}
                                    onChange={(e) => setConInput(e.target.value)}
                                    placeholder="Add a con"
                                    data-testid="input-con"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addCon();
                                      }
                                    }}
                                  />
                                  <Button type="button" onClick={addCon} data-testid="button-add-con">
                                    Add
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(field.value || []).map((con, idx) => (
                                    <Badge key={idx} variant="destructive" className="gap-1">
                                      ✗ {con}
                                      <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => {
                                          form.setValue("reviewCons", (field.value || []).filter((_, i) => i !== idx));
                                        }}
                                      />
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Optional SEO Section */}
                    <Accordion type="single" collapsible defaultValue="seo">
                      <AccordionItem value="seo">
                        <AccordionTrigger data-testid="button-toggle-seo">
                          Help others find this (optional)
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          <FormField
                            control={form.control}
                            name="primaryKeyword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Primary Keyword (1-6 words)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., xauusd m5 scalping"
                                    data-testid="input-primary-keyword"
                                  />
                                </FormControl>
                                <FormDescription>Short phrase that describes your topic</FormDescription>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="seoExcerpt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SEO Excerpt (120-160 chars)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    rows={2}
                                    placeholder="One sentence summary for search engines"
                                    data-testid="textarea-seo-excerpt"
                                  />
                                </FormControl>
                                <FormDescription>
                                  {((field.value || "").length)}/160 chars
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* SEO Preview Component */}
                          <SEOPreview
                            title={watchedValues.title || ""}
                            seoExcerpt={watchedValues.seoExcerpt || ""}
                            primaryKeyword={watchedValues.primaryKeyword || ""}
                            body={watchedValues.body || ""}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Hashtags */}
                    <FormField
                      control={form.control}
                      name="hashtags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hashtags (max 10)</FormLabel>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={hashtagInput}
                                onChange={(e) => setHashtagInput(e.target.value)}
                                placeholder="#xauusd #m5 #scalping"
                                data-testid="input-hashtag"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addHashtag();
                                  }
                                }}
                              />
                              <Button type="button" onClick={addHashtag} data-testid="button-add-hashtag">
                                Add
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(field.value || []).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="gap-1" data-testid={`badge-hashtag-${tag}`}>
                                  #{tag}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => removeHashtag(tag)}
                                  />
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* File Attachments */}
                    <div className="space-y-3">
                      <FormLabel>Attachments (optional)</FormLabel>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.webp,.pdf,.set,.csv"
                            onChange={handleFileUpload}
                            disabled={isUploading || uploadedFiles.length >= 10}
                            className="flex-1"
                            data-testid="input-file-upload"
                          />
                          {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Screenshots, PDFs, SET files, CSV. Max 5MB each, 10 files total.
                        </p>
                        
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            {uploadedFiles.map((file, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-3 rounded-md border bg-card"
                                data-testid={`uploaded-file-${idx}`}
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{file.name}</span>
                                  <Check className="h-4 w-4 text-green-500" />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeUploadedFile(idx)}
                                  data-testid={`button-remove-file-${idx}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tag Count Warning */}
                    {totalTags > 12 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          You have {totalTags} tags. Maximum is 12. Please remove {totalTags - 12} tags.
                        </AlertDescription>
                      </Alert>
                    )}

                    {totalTags > 0 && totalTags <= 12 && (
                      <div className="text-sm text-muted-foreground" data-testid="text-tag-count">
                        Total tags: {totalTags}/12
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        data-testid="button-back"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={createThreadMutation.isPending || totalTags > 12}
                        data-testid="button-submit"
                      >
                        {createThreadMutation.isPending ? "Posting..." : "Post Thread"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </Form>
        </div>
      </div>
      <EnhancedFooter />
      <AuthPrompt />
    </>
  );
}
