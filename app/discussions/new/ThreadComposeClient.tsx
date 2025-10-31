"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  extractPotentialTags 
} from "@shared/tradingMetadata";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { apiRequest } from "@/lib/queryClient";
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Check, 
  Copy, 
  Share2, 
  Bell,
  Sparkles,
  Upload,
  X,
  Coins,
  Eye,
  Save,
  Send,
  Hash,
  Clock,
  Zap,
  Info,
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  Shield,
  MessageSquare
} from "lucide-react";

// Simplified form validation schema
const threadFormSchema = z.object({
  title: z.string()
    .min(15, "Add 3-4 more words to help others understand")
    .max(90, "Keep it under 90 characters")
    .refine(
      (val) => {
        const upperCount = (val.match(/[A-Z]/g) || []).length;
        const letterCount = (val.match(/[a-zA-Z]/g) || []).length;
        return letterCount === 0 || upperCount / letterCount < 0.5;
      },
      { message: "Avoid ALL CAPS - it's easier to read in normal case" }
    ),
  body: z.string()
    .min(150, "Add a bit more detail (min 150 characters)")
    .max(50000, "That's too long - try to be more concise"),
  categorySlug: z.string().min(1, "Please select a category"),
  instruments: z.array(z.string()).default([]),
  timeframes: z.array(z.string()).default([]),
  strategies: z.array(z.string()).default([]),
  platform: z.string().optional(),
  broker: z.string().optional(),
  hashtags: z.array(z.string()).max(10).default([]),
  attachmentUrls: z.array(z.string()).default([]),
});

type ThreadFormData = z.infer<typeof threadFormSchema>;

interface ThreadComposeClientProps {
  categories: ForumCategory[];
}

// Auto-save draft hook
function useThreadDraft() {
  const [hasDraft, setHasDraft] = useState(false);
  const draftKey = "thread_draft_v2";
  const lastSaveRef = useRef<NodeJS.Timeout>();

  const saveDraft = useCallback((data: Partial<ThreadFormData>) => {
    if (lastSaveRef.current) {
      clearTimeout(lastSaveRef.current);
    }
    
    lastSaveRef.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          ...data,
          savedAt: new Date().toISOString(),
        }));
        setHasDraft(true);
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }, 1000); // Debounce saves
  }, [draftKey]);

  const loadDraft = useCallback((): Partial<ThreadFormData> | null => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedDate = new Date(parsed.savedAt);
        const hoursSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);
        
        // Only restore drafts less than 24 hours old
        if (hoursSince < 24) {
          setHasDraft(true);
          return parsed;
        }
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
      if (lastSaveRef.current) {
        clearTimeout(lastSaveRef.current);
      }
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [draftKey]);

  return { saveDraft, loadDraft, clearDraft, hasDraft };
}

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                ${isActive ? 'bg-primary text-primary-foreground scale-110' : ''}
                ${isCompleted ? 'bg-primary/20 text-primary' : ''}
                ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
              `}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
            </div>
            {stepNumber < totalSteps && (
              <div className={`w-12 h-0.5 mx-1 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Character counter component
function CharacterCounter({ current, min, max }: { current: number; min?: number; max: number }) {
  const percentage = (current / max) * 100;
  const isValid = (!min || current >= min) && current <= max;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <Progress value={percentage} className="h-1 w-20" />
      <span className={isValid ? "text-muted-foreground" : "text-destructive"}>
        {current}/{max}
      </span>
    </div>
  );
}

// Tag chip component
function TagChip({ 
  label, 
  isSelected, 
  onClick, 
  icon 
}: { 
  label: string; 
  isSelected: boolean; 
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
        ${isSelected 
          ? 'bg-primary text-primary-foreground scale-105' 
          : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
        }
      `}
      data-testid={`chip-${label.toLowerCase()}`}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
      {isSelected && <Check className="w-3 h-3 ml-1" />}
    </button>
  );
}

export default function ThreadComposeClient({ categories }: ThreadComposeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { requireAuth, AuthPrompt } = useAuthPrompt("create a thread");
  
  const [currentStep, setCurrentStep] = useState(1);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // Pre-select category from URL param
  const categoryParam = searchParams?.get("category") || "";
  
  // Get categories for selection
  const parentCategories = categories.filter(c => !c.parentSlug);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "");
  
  // Auto-save draft
  const { saveDraft, loadDraft, clearDraft, hasDraft } = useThreadDraft();
  
  const form = useForm<ThreadFormData>({
    resolver: zodResolver(threadFormSchema),
    defaultValues: {
      title: "",
      body: "",
      categorySlug: categoryParam,
      instruments: [],
      timeframes: [],
      strategies: [],
      platform: "",
      broker: "",
      hashtags: [],
      attachmentUrls: [],
    },
  });

  const watchedValues = form.watch();
  const titleLength = watchedValues.title?.length || 0;
  const bodyLength = watchedValues.body?.length || 0;

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.title || draft.body)) {
      toast({
        title: "Draft found",
        description: (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                Object.keys(draft).forEach((key) => {
                  if (key !== 'savedAt') {
                    form.setValue(key as any, (draft as any)[key]);
                  }
                });
                setSelectedCategory(draft.categorySlug || "");
                toast({ title: "Draft restored!" });
              }}
            >
              <Clock className="w-3 h-3 mr-1" />
              Restore
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                clearDraft();
                toast({ title: "Draft discarded" });
              }}
            >
              Discard
            </Button>
          </div>
        ),
        duration: 8000,
      });
    }
  }, []);

  // Auto-save on changes
  useEffect(() => {
    const values = form.getValues();
    if (values.title || values.body) {
      setIsSavingDraft(true);
      saveDraft(values);
      setTimeout(() => setIsSavingDraft(false), 500);
    }
  }, [watchedValues, saveDraft]);

  // Auto-suggest tags based on content
  useEffect(() => {
    const text = `${watchedValues.title} ${watchedValues.body}`;
    if (text.trim().length > 30) {
      const tags = extractPotentialTags(text).slice(0, 8);
      setSuggestedTags(tags);
    } else {
      setSuggestedTags([]);
    }
  }, [watchedValues.title, watchedValues.body]);

  const createThreadMutation = useMutation({
    mutationFn: async (data: ThreadFormData) => {
      const res = await apiRequest("POST", "/api/threads", data);
      return await res.json() as { thread: any; coinsEarned: number; message: string };
    },
    onSuccess: (response) => {
      clearDraft();
      
      const threadUrl = `${window.location.origin}/thread/${response.thread.slug}`;
      
      // Success toast with actions
      toast({
        title: "Thread posted! 🎉",
        description: (
          <div className="space-y-3">
            <p className="font-medium">
              +{response.coinsEarned} coins earned!
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(threadUrl);
                  toast({ title: "Link copied!" });
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: response.thread.title,
                      url: threadUrl,
                    });
                  }
                }}
              >
                <Share2 className="h-3 w-3 mr-1" />
                Share
              </Button>
            </div>
          </div>
        ),
        duration: 10000,
      });
      
      // Navigate to the thread
      setTimeout(() => {
        router.push(`/thread/${response.thread.slug}`);
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ThreadFormData) => {
    requireAuth(() => {
      data.attachmentUrls = uploadedFiles.map(f => f.url);
      createThreadMutation.mutate(data);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (uploadedFiles.length + files.length > 5) {
      toast({
        title: "Too many files",
        description: "Maximum 5 attachments allowed",
        variant: "destructive",
      });
      return;
    }

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
        throw new Error("Upload failed");
      }

      const response = await res.json() as { urls: string[]; message: string };
      const newFiles = response.urls.map((url: string, idx: number) => ({
        name: files[idx].name,
        url: url,
      }));

      setUploadedFiles([...uploadedFiles, ...newFiles]);
      toast({ title: "Files uploaded!" });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
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
    const normalized = hashtagInput.trim().toLowerCase().replace(/^#/, "");
    const current = form.getValues("hashtags") || [];
    if (!current.includes(normalized) && current.length < 10) {
      form.setValue("hashtags", [...current, normalized]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    const current = form.getValues("hashtags") || [];
    form.setValue("hashtags", current.filter(t => t !== tag));
  };

  const canProceedStep1 = titleLength >= 15 && bodyLength >= 150;
  const isFormValid = form.formState.isValid;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl mx-auto px-4 py-6">
          {/* Header with progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Start a Thread</h1>
              {isSavingDraft && (
                <Badge variant="secondary" className="animate-pulse">
                  <Save className="w-3 h-3 mr-1" />
                  Saving...
                </Badge>
              )}
            </div>
            <StepIndicator currentStep={currentStep} totalSteps={3} />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* STEP 1: Core Content */}
              {currentStep === 1 && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      What's on your mind?
                    </CardTitle>
                    <CardDescription>
                      Share your trading question, strategy, or insight
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Category Selection */}
                    <FormField
                      control={form.control}
                      name="categorySlug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCategory(value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Where does this belong?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {parentCategories.map((cat) => (
                                <SelectItem 
                                  key={cat.slug} 
                                  value={cat.slug}
                                  data-testid={`option-category-${cat.slug}`}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{cat.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {cat.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Title</span>
                            <CharacterCounter current={titleLength} min={15} max={90} />
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="What's your XAUUSD scalping rule that actually works?"
                              className="text-lg"
                              data-testid="input-title"
                            />
                          </FormControl>
                          {titleLength > 0 && titleLength < 15 && (
                            <p className="text-xs text-muted-foreground">
                              Add {15 - titleLength} more characters...
                            </p>
                          )}
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
                          <FormLabel className="flex items-center justify-between">
                            <span>Your story or question</span>
                            <CharacterCounter current={bodyLength} min={150} max={50000} />
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={8}
                              placeholder="I've been trading XAUUSD on M5 for 3 months now. Here's what I learned...

• Which pair and timeframe?
• What's your entry/exit strategy?
• What broker are you using?
• What are your results so far?
• What specific help do you need?"
                              className="resize-none"
                              data-testid="textarea-body"
                            />
                          </FormControl>
                          {bodyLength > 0 && bodyLength < 150 && (
                            <p className="text-xs text-muted-foreground">
                              Add {150 - bodyLength} more characters for a complete post...
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quick tips */}
                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-900 dark:text-blue-100">
                        Quick tips for great threads
                      </AlertTitle>
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                          <li>Be specific: Include pair, timeframe, and broker</li>
                          <li>Show results: Share your win rate or P&L if relevant</li>
                          <li>Ask clear questions: What exactly do you need help with?</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (canProceedStep1) {
                              setCurrentStep(3);
                            }
                          }}
                          disabled={!canProceedStep1}
                          data-testid="button-quick-post"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Quick Post
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          disabled={!canProceedStep1}
                          data-testid="button-next"
                        >
                          Next
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 2: Smart Tags (Optional) */}
              {currentStep === 2 && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Add context (optional)
                    </CardTitle>
                    <CardDescription>
                      Help others find your thread with relevant tags
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Auto-suggested tags */}
                    {suggestedTags.length > 0 && (
                      <div>
                        <Label className="text-sm mb-2 block">
                          Suggested tags from your content
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTags.map((tag) => {
                            const isInstrument = INSTRUMENTS.some(i => i.value === tag);
                            const isTimeframe = TIMEFRAMES.some(t => t.value === tag);
                            const isStrategy = STRATEGIES.some(s => s.value === tag);
                            
                            let field: "instruments" | "timeframes" | "strategies" | null = null;
                            let icon = null;
                            
                            if (isInstrument) {
                              field = "instruments";
                              icon = <DollarSign className="w-3 h-3" />;
                            } else if (isTimeframe) {
                              field = "timeframes";
                              icon = <Clock className="w-3 h-3" />;
                            } else if (isStrategy) {
                              field = "strategies";
                              icon = <TrendingUp className="w-3 h-3" />;
                            }
                            
                            if (!field) return null;
                            
                            const isSelected = (form.getValues(field) || []).includes(tag);
                            
                            return (
                              <TagChip
                                key={tag}
                                label={tag.toUpperCase()}
                                isSelected={isSelected}
                                onClick={() => toggleTag(field!, tag)}
                                icon={icon}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Instruments */}
                    <div>
                      <Label className="text-sm mb-2 block">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Trading Pairs
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {INSTRUMENTS.slice(0, 8).map((instrument) => {
                          const isSelected = watchedValues.instruments?.includes(instrument.value);
                          return (
                            <TagChip
                              key={instrument.value}
                              label={instrument.label}
                              isSelected={isSelected}
                              onClick={() => toggleTag("instruments", instrument.value)}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeframes */}
                    <div>
                      <Label className="text-sm mb-2 block">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Timeframes
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {TIMEFRAMES.map((timeframe) => {
                          const isSelected = watchedValues.timeframes?.includes(timeframe.value);
                          return (
                            <TagChip
                              key={timeframe.value}
                              label={timeframe.label}
                              isSelected={isSelected}
                              onClick={() => toggleTag("timeframes", timeframe.value)}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Strategies */}
                    <div>
                      <Label className="text-sm mb-2 block">
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                        Trading Strategies
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {STRATEGIES.slice(0, 8).map((strategy) => {
                          const isSelected = watchedValues.strategies?.includes(strategy.value);
                          return (
                            <TagChip
                              key={strategy.value}
                              label={strategy.label}
                              isSelected={isSelected}
                              onClick={() => toggleTag("strategies", strategy.value)}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Platform */}
                    <FormField
                      control={form.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform (optional)</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-platform">
                                <SelectValue placeholder="Select trading platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PLATFORMS.map((platform) => (
                                <SelectItem key={platform.value} value={platform.value}>
                                  {platform.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Hashtags */}
                    <div>
                      <Label className="text-sm mb-2 block">
                        <Hash className="w-4 h-4 inline mr-1" />
                        Hashtags
                      </Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add hashtag..."
                          value={hashtagInput}
                          onChange={(e) => setHashtagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addHashtag();
                            }
                          }}
                          className="flex-1"
                          data-testid="input-hashtag"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addHashtag}
                          disabled={!hashtagInput.trim() || watchedValues.hashtags?.length >= 10}
                        >
                          Add
                        </Button>
                      </div>
                      {watchedValues.hashtags && watchedValues.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {watchedValues.hashtags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => removeHashtag(tag)}
                            >
                              #{tag}
                              <X className="w-3 h-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* File attachments */}
                    <div>
                      <Label className="text-sm mb-2 block">
                        <Upload className="w-4 h-4 inline mr-1" />
                        Attachments (optional)
                      </Label>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.txt,.mq4,.mq5,.ex4,.ex5"
                          onChange={handleFileUpload}
                          disabled={isUploading || uploadedFiles.length >= 5}
                          data-testid="input-file-upload"
                        />
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-1">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <span className="truncate flex-1">{file.name}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentStep(1)}
                        data-testid="button-back"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        data-testid="button-next"
                      >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 3: Preview & Post */}
              {currentStep === 3 && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Review & Post
                    </CardTitle>
                    <CardDescription>
                      Everything look good? Let's publish your thread!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Preview */}
                    <div className="rounded-lg border bg-card p-4 space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Title</p>
                        <h3 className="text-xl font-semibold">{watchedValues.title || "No title yet"}</h3>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Content</p>
                        <p className="whitespace-pre-wrap text-sm">
                          {watchedValues.body ? 
                            (watchedValues.body.length > 300 ? 
                              watchedValues.body.substring(0, 300) + "..." : 
                              watchedValues.body
                            ) : "No content yet"}
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex flex-wrap gap-2">
                        {selectedCategory && (
                          <Badge variant="outline">
                            📁 {categories.find(c => c.slug === selectedCategory)?.name}
                          </Badge>
                        )}
                        {watchedValues.instruments?.map(i => (
                          <Badge key={i} variant="secondary">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {i}
                          </Badge>
                        ))}
                        {watchedValues.timeframes?.map(t => (
                          <Badge key={t} variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            {t}
                          </Badge>
                        ))}
                        {watchedValues.strategies?.map(s => (
                          <Badge key={s} variant="secondary">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {s}
                          </Badge>
                        ))}
                        {watchedValues.hashtags?.map(h => (
                          <Badge key={h} variant="outline">#{h}</Badge>
                        ))}
                        {uploadedFiles.length > 0 && (
                          <Badge variant="outline">
                            <Upload className="w-3 h-3 mr-1" />
                            {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Coin reward info */}
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
                      <Coins className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-900 dark:text-green-100">
                        Earn coins for posting!
                      </AlertTitle>
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        You'll earn <strong>10 coins</strong> for posting this thread. 
                        Quality threads that get engagement earn even more!
                      </AlertDescription>
                    </Alert>

                    {/* Community guidelines */}
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Community Guidelines</AlertTitle>
                      <AlertDescription className="text-sm space-y-1">
                        <p>✓ Be respectful and constructive</p>
                        <p>✓ No spam or promotional content</p>
                        <p>✓ Share real experiences, not financial advice</p>
                      </AlertDescription>
                    </Alert>

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentStep(2)}
                        data-testid="button-back"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      
                      <Button
                        type="submit"
                        size="lg"
                        disabled={!isFormValid || createThreadMutation.isPending}
                        data-testid="button-submit"
                      >
                        {createThreadMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Post Thread
                          </>
                        )}
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