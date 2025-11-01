"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import ReactMarkdown from "react-markdown";
import AutoSEOPanel, { type SEOData } from "@/components/AutoSEOPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Eye, 
  Edit, 
  ChevronDown,
  ChevronUp,
  Globe,
  Search,
  Hash,
  Info,
  Image,
  Youtube,
  Link as LinkIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Coins,
  Sparkles,
  Target,
  TrendingUp,
  Lightbulb
} from "lucide-react";
import {
  extractPrimaryKeyword,
  generateSeoExcerpt,
  extractHashtags,
  generateUrlSlug,
  calculateKeywordDensity,
  generateImageAltText,
  analyzeTitle,
  suggestInternalLinks
} from "@/lib/seo-utils";

// Dynamic import for markdown editor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

// Validation schema for the form
const threadSchema = z.object({
  title: z.string().min(15, "Title must be at least 15 characters").max(90, "Title must be at most 90 characters"),
  body: z.string().min(500, "Body must be at least 500 characters").max(5000, "Body must be at most 5000 characters"),
  
  // Media
  imageUrls: z.array(z.string()).max(10, "Maximum 10 images allowed").default([]),
  videoEmbedUrl: z.string().url().optional().or(z.literal("")),
  
  // Thread Details
  threadType: z.enum(["question", "discussion", "review", "journal", "guide", "program_sharing"]).default("discussion"),
  instruments: z.array(z.string()).default([]),
  timeframes: z.array(z.string()).default([]),
  strategies: z.array(z.string()).default([]),
  platform: z.string().optional(),
  broker: z.string().optional(),
  riskNote: z.string().max(500).optional(),
  
  // SEO Fields - Now optional when auto-optimize is enabled
  primaryKeyword: z.string().max(50, "Primary keyword should be 1-6 words").optional().default(""),
  seoExcerpt: z.string().max(160, "SEO excerpt must be at most 160 characters").optional().default(""),
  hashtags: z.array(z.string()).max(10, "Maximum 10 hashtags allowed").default([]),
  slug: z.string().min(1, "Slug is required"),
  
  categorySlug: z.string().min(1, "Category is required")
});

type ThreadFormData = z.infer<typeof threadSchema>;

// Available options for multi-select fields
const INSTRUMENTS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "NZDUSD", "USDCHF", "BTCUSD", "ETHUSD", "US30", "NAS100", "SPX500"];
const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];
const STRATEGIES = ["Scalping", "Day Trading", "Swing Trading", "Position Trading", "Grid Trading", "Martingale", "Hedging", "News Trading", "Trend Following", "Mean Reversion"];
const PLATFORMS = ["MT4", "MT5", "cTrader", "TradingView", "NinjaTrader", "Other"];
const POPULAR_HASHTAGS = ["#forex", "#trading", "#xauusd", "#gold", "#eurusd", "#daytrading", "#technicalanalysis", "#forextrader", "#scalping", "#mt4"];

const THREAD_TYPE_LABELS = {
  question: { label: "Question", icon: "❓", description: "Ask the community for help" },
  discussion: { label: "Discussion", icon: "💬", description: "Start a conversation" },
  review: { label: "Review", icon: "⭐", description: "Share your experience" },
  journal: { label: "Journal", icon: "📓", description: "Document your trades" },
  guide: { label: "Guide", icon: "📚", description: "Teach others" },
  program_sharing: { label: "Program Sharing", icon: "🤖", description: "Share EAs or indicators" }
};

interface ThreadCreationWizardProps {
  categorySlug?: string;
}

export default function ThreadCreationWizard({ categorySlug = "general" }: ThreadCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [autoOptimizeSeo, setAutoOptimizeSeo] = useState(true);
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  // Fetch categories for internal link suggestions
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/seo-categories/tree"],
    queryFn: async () => {
      const response = await fetch("/api/seo-categories/tree");
      if (!response.ok) return [];
      const data = await response.json();
      // Extract category slugs from the tree structure
      const extractSlugs = (items: any[]): string[] => {
        let slugs: string[] = [];
        items.forEach(item => {
          if (item.slug) slugs.push(item.slug);
          if (item.children) {
            slugs = slugs.concat(extractSlugs(item.children));
          }
        });
        return slugs;
      };
      return extractSlugs(data.categories || []);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const form = useForm<ThreadFormData>({
    resolver: zodResolver(threadSchema),
    defaultValues: {
      title: "",
      body: "",
      imageUrls: [],
      videoEmbedUrl: "",
      threadType: "discussion",
      instruments: [],
      timeframes: [],
      strategies: [],
      platform: "",
      broker: "",
      riskNote: "",
      primaryKeyword: "",
      seoExcerpt: "",
      hashtags: [],
      slug: "",
      categorySlug
    },
    mode: "onChange"
  });

  const { watch, setValue, formState: { errors } } = form;
  const watchedFields = watch();

  // Handle SEO data updates from AutoSEOPanel
  const handleSEOUpdate = useCallback((data: SEOData) => {
    setSeoData(data);
    // Update form values with SEO data when in auto-optimize mode
    if (autoOptimizeSeo) {
      setValue("primaryKeyword", data.primaryKeyword);
      setValue("seoExcerpt", data.seoExcerpt);
      setValue("hashtags", data.hashtags);
      setValue("slug", data.urlSlug);
    }
  }, [autoOptimizeSeo, setValue]);

  // Generate slug from title when not in auto-optimize mode
  useEffect(() => {
    if (!autoOptimizeSeo && watchedFields.title) {
      const slug = watchedFields.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 60);
      setValue("slug", slug);
    }
  }, [watchedFields.title, autoOptimizeSeo, setValue]);

  // Image upload with dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedImages.length + acceptedFiles.length > 10) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 10 images",
        variant: "destructive"
      });
      return;
    }

    setUploadingImages(true);
    const formData = new FormData();
    acceptedFiles.forEach(file => formData.append("files", file));

    try {
      // For file uploads, use fetch directly since apiRequest expects JSON
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      const data = await response.json();
      const newImageUrls = data.urls || [];
      const allImages = [...uploadedImages, ...newImageUrls];
      setUploadedImages(allImages);
      setValue("imageUrls", allImages);
      
      toast({
        title: "Images uploaded",
        description: `${acceptedFiles.length} image(s) uploaded successfully`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingImages(false);
    }
  }, [uploadedImages, setValue, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"]
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadingImages || uploadedImages.length >= 10
  });

  // Remove uploaded image
  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setValue("imageUrls", newImages);
  };


  // Generate video embed preview
  const getVideoEmbedPreview = (url: string) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return null;
  };

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (data: ThreadFormData) => {
      const response = await apiRequest("POST", "/api/threads", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      
      toast({
        title: "Thread created! 🎉",
        description: (
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span>You earned 10 coins for creating a thread!</span>
          </div>
        )
      });
      
      // Redirect to the new thread
      router.push(`/thread/${data.slug}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create thread",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ThreadFormData) => {
    // Merge auto-generated SEO data if auto-optimize is enabled
    if (autoOptimizeSeo && seoData) {
      const mergedData = {
        ...data,
        primaryKeyword: seoData.primaryKeyword || data.primaryKeyword,
        seoExcerpt: seoData.seoExcerpt || data.seoExcerpt,
        hashtags: seoData.hashtags.length > 0 ? seoData.hashtags : data.hashtags,
        slug: seoData.urlSlug || data.slug
      };
      createThreadMutation.mutate(mergedData);
    } else {
      createThreadMutation.mutate(data);
    }
  };

  // Step navigation
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return !errors.title && !errors.body && watchedFields.title && watchedFields.body.length >= 500;
      case 2:
        return true; // Optional step
      case 3:
        // In auto-optimize mode, we can proceed as long as SEO data is generated
        // In manual mode, check for required fields
        if (autoOptimizeSeo) {
          return seoData !== null && seoData.primaryKeyword !== "" && seoData.seoExcerpt !== "";
        } else {
          return watchedFields.primaryKeyword !== "" && watchedFields.seoExcerpt !== "";
        }
      case 4:
        return true; // Final preview
      default:
        return false;
    }
  };


  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-2xl">Create New Thread</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
            <Progress value={currentStep * 25} className="w-32" />
          </div>
        </div>
        <CardDescription>
          Share your knowledge, ask questions, or start a discussion with the community
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Core Content */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thread Title *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder="Enter a descriptive title for your thread..."
                            className={errors.title ? "border-red-500" : ""}
                            data-testid="input-thread-title"
                          />
                          <span className={`absolute right-2 top-2.5 text-xs ${
                            field.value.length < 15 || field.value.length > 90 ? "text-red-500" : "text-green-500"
                          }`}>
                            {field.value.length}/90
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thread Content *</FormLabel>
                      <FormDescription>
                        Use markdown to format your content (minimum 500 characters)
                      </FormDescription>
                      <FormControl>
                        <div className="space-y-2">
                          <MDEditor
                            value={field.value}
                            onChange={(value) => field.onChange(value || "")}
                            preview="edit"
                            height={400}
                            data-color-mode="light"
                          />
                          <div className="flex justify-between text-xs">
                            <span className={field.value.length < 500 ? "text-red-500" : "text-muted-foreground"}>
                              {field.value.length}/5000 characters
                            </span>
                            {field.value.length >= 500 && (
                              <span className="text-green-500 flex items-center gap-1">
                                <Check className="h-3 w-3" /> Minimum length met
                              </span>
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Label>Media Upload</Label>
                  
                  {/* Image Upload */}
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary"
                    } ${uploadingImages ? "opacity-50 cursor-not-allowed" : ""}`}
                    data-testid="dropzone-images"
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    {isDragActive ? (
                      <p>Drop the images here...</p>
                    ) : (
                      <div>
                        <p className="mb-2">Drag & drop images here, or click to select</p>
                        <p className="text-sm text-muted-foreground">
                          Max 10 images, 10MB each (PNG, JPG, GIF, WebP)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image Previews */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                            data-testid={`image-preview-${index}`}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                            data-testid={`button-remove-image-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Video Embed */}
                  <FormField
                    control={form.control}
                    name="videoEmbedUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Youtube className="inline h-4 w-4 mr-1" />
                          Video Embed (YouTube/Vimeo)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            data-testid="input-video-url"
                          />
                        </FormControl>
                        <FormMessage />
                        
                        {/* Video Preview */}
                        {field.value && getVideoEmbedPreview(field.value) && (
                          <div className="mt-4">
                            <iframe
                              src={getVideoEmbedPreview(field.value) || ""}
                              className="w-full h-64 rounded-lg"
                              allowFullScreen
                              data-testid="video-preview"
                            />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Thread Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="threadType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thread Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 md:grid-cols-3 gap-4"
                        >
                          {Object.entries(THREAD_TYPE_LABELS).map(([value, info]) => (
                            <Label
                              key={value}
                              htmlFor={value}
                              className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-accent ${
                                field.value === value ? "border-primary bg-primary/5" : ""
                              }`}
                            >
                              <RadioGroupItem value={value} id={value} className="sr-only" />
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">{info.icon}</span>
                                <div className="flex-1">
                                  <div className="font-medium">{info.label}</div>
                                  <div className="text-sm text-muted-foreground">{info.description}</div>
                                </div>
                              </div>
                            </Label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instruments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Instruments</FormLabel>
                      <FormDescription>Select the instruments relevant to your thread</FormDescription>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {INSTRUMENTS.map((instrument) => (
                            <Badge
                              key={instrument}
                              variant={field.value.includes(instrument) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => {
                                const updated = field.value.includes(instrument)
                                  ? field.value.filter(i => i !== instrument)
                                  : [...field.value, instrument];
                                field.onChange(updated);
                              }}
                              data-testid={`chip-instrument-${instrument}`}
                            >
                              {instrument}
                            </Badge>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeframes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeframes</FormLabel>
                      <FormDescription>Select applicable timeframes</FormDescription>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {TIMEFRAMES.map((timeframe) => (
                            <Badge
                              key={timeframe}
                              variant={field.value.includes(timeframe) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => {
                                const updated = field.value.includes(timeframe)
                                  ? field.value.filter(t => t !== timeframe)
                                  : [...field.value, timeframe];
                                field.onChange(updated);
                              }}
                              data-testid={`chip-timeframe-${timeframe}`}
                            >
                              {timeframe}
                            </Badge>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strategies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Strategies</FormLabel>
                      <FormDescription>Select relevant trading strategies</FormDescription>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {STRATEGIES.map((strategy) => (
                            <Badge
                              key={strategy}
                              variant={field.value.includes(strategy) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => {
                                const updated = field.value.includes(strategy)
                                  ? field.value.filter(s => s !== strategy)
                                  : [...field.value, strategy];
                                field.onChange(updated);
                              }}
                              data-testid={`chip-strategy-${strategy}`}
                            >
                              {strategy}
                            </Badge>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trading Platform</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-platform">
                              <SelectValue placeholder="Select a platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PLATFORMS.map((platform) => (
                              <SelectItem key={platform} value={platform}>
                                {platform}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="broker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Broker (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter broker name"
                            data-testid="input-broker"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="riskNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Management Note (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Share any risk management advice or warnings..."
                          className="resize-none"
                          rows={3}
                          data-testid="textarea-risk-note"
                        />
                      </FormControl>
                      <FormDescription>
                        Add any important risk warnings or management tips
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: SEO Optimization */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <AutoSEOPanel
                  title={watchedFields.title}
                  body={watchedFields.body}
                  imageUrls={uploadedImages}
                  categories={categories}
                  onSEOUpdate={handleSEOUpdate}
                />
              </div>
            )}

            {/* Step 4: Preview & Submit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thread Preview</CardTitle>
                    <CardDescription>
                      This is how your thread will appear to other users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <article className="space-y-4">
                      <h1 className="text-2xl font-bold">{watchedFields.title}</h1>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge>{THREAD_TYPE_LABELS[watchedFields.threadType].label}</Badge>
                        {watchedFields.instruments.map(instrument => (
                          <Badge key={instrument} variant="outline">{instrument}</Badge>
                        ))}
                        {watchedFields.timeframes.map(timeframe => (
                          <Badge key={timeframe} variant="outline">{timeframe}</Badge>
                        ))}
                      </div>
                      
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {uploadedImages.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Image ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                      
                      {watchedFields.videoEmbedUrl && getVideoEmbedPreview(watchedFields.videoEmbedUrl) && (
                        <iframe
                          src={getVideoEmbedPreview(watchedFields.videoEmbedUrl) || ""}
                          className="w-full h-96 rounded-lg"
                          allowFullScreen
                        />
                      )}
                      
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{watchedFields.body || ''}</ReactMarkdown>
                      </div>
                      
                      {watchedFields.riskNote && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{watchedFields.riskNote}</AlertDescription>
                        </Alert>
                      )}
                      
                      {watchedFields.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {watchedFields.hashtags.map((tag, index) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </article>
                  </CardContent>
                </Card>
                
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    data-testid="button-edit-thread"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Thread
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={!form.formState.isValid || createThreadMutation.isPending}
                    data-testid="button-post-thread"
                  >
                    {createThreadMutation.isPending ? (
                      <>Creating...</>
                    ) : (
                      <>
                        <Coins className="h-4 w-4 mr-2" />
                        Post Thread (+10 coins)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  data-testid="button-previous-step"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                  disabled={!canProceedToNextStep()}
                  data-testid="button-next-step"
                >
                  {currentStep === 3 ? "Preview" : "Next"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}