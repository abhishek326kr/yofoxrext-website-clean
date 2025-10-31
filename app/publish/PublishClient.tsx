"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, X, FileText, Image as ImageIcon, TrendingUp } from "lucide-react";
import type { ForumCategory } from "@shared/schema";

// Client-side validation schema matching backend
const publishFormSchema = z.object({
  type: z.enum(["ea", "indicator", "article", "source_code"]),
  title: z.string().min(10, "Title must be at least 10 characters").max(120, "Title must not exceed 120 characters"),
  description: z.string().min(300, "Description must be at least 300 characters"),
  platform: z.enum(["MT4", "MT5", "Both"]).optional(),
  version: z.string().optional(),
  priceCoins: z.coerce.number().min(0).max(10000),
  isFree: z.boolean(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).max(8, "Maximum 8 tags allowed").optional(),
  files: z.array(z.object({
    name: z.string(),
    size: z.number(),
    url: z.string(),
    checksum: z.string(),
  })).min(1, "At least 1 file is required"),
  images: z.array(z.object({
    url: z.string(),
    isCover: z.boolean(),
    order: z.number(),
  })).min(1, "At least 1 image is required"),
  brokerCompat: z.array(z.string()).optional(),
  minDeposit: z.coerce.number().optional(),
  hedging: z.boolean().optional(),
  changelog: z.string().optional(),
  license: z.string().optional(),
  // Evidence fields
  equityCurveImage: z.string().optional(),
  profitFactor: z.coerce.number().optional(),
  drawdownPercent: z.coerce.number().optional(),
  winPercent: z.coerce.number().optional(),
  broker: z.string().optional(),
  monthsTested: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
  // Conditional validation for Performance Report
  const hasPerformanceReportTag = data.tags?.includes("Performance Report");
  
  if (hasPerformanceReportTag) {
    if (!data.equityCurveImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Equity curve image is required for Performance Reports",
        path: ["equityCurveImage"],
      });
    }
    if (!data.profitFactor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Profit Factor is required for Performance Reports",
        path: ["profitFactor"],
      });
    }
    if (!data.drawdownPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Drawdown % is required for Performance Reports",
        path: ["drawdownPercent"],
      });
    }
    if (!data.winPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Win % is required for Performance Reports",
        path: ["winPercent"],
      });
    }
    if (!data.broker) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Broker name is required for Performance Reports",
        path: ["broker"],
      });
    }
    if (!data.monthsTested) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Months Tested is required for Performance Reports",
        path: ["monthsTested"],
      });
    }
  }
});

type PublishFormData = z.infer<typeof publishFormSchema>;

interface PublishClientProps {
  initialCategories: ForumCategory[];
  categoryParam?: string;
}

export default function PublishClient({ initialCategories, categoryParam }: PublishClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  // Fetch categories with initialData
  const { data: categories = [] } = useQuery<ForumCategory[]>({
    queryKey: ["/api/publish/categories"],
    initialData: initialCategories,
  });

  // Form setup
  const form = useForm<PublishFormData>({
    resolver: zodResolver(publishFormSchema),
    defaultValues: {
      type: "ea",
      title: "",
      description: "",
      platform: "MT4",
      version: "1.0.0",
      priceCoins: 0,
      isFree: true,
      category: categoryParam || "",
      tags: [],
      files: [],
      images: [],
      brokerCompat: [],
      hedging: false,
    },
  });

  // Pre-fill category from URL
  useEffect(() => {
    if (categoryParam && categories.length > 0) {
      form.setValue("category", categoryParam);
    }
  }, [categoryParam, categories, form]);

  // Watch tags for evidence mode
  const watchedTags = form.watch("tags");
  const showEvidenceFields = watchedTags?.includes("Performance Report");

  // Watch isFree to control price field
  const isFree = form.watch("isFree");
  useEffect(() => {
    if (isFree) {
      form.setValue("priceCoins", 0);
    }
  }, [isFree, form]);

  // File upload mutation
  const fileUploadMutation = useMutation({
    mutationFn: async (file: { name: string; size: number }) => {
      const res = await apiRequest("POST", "/api/uploads/file", file);
      return res.json() as Promise<{ name: string; size: number; url: string; checksum: string }>;
    },
  });

  // Image upload mutation
  const imageUploadMutation = useMutation({
    mutationFn: async (image: { name: string; isCover: boolean; order: number }) => {
      const res = await apiRequest("POST", "/api/uploads/image", image);
      return res.json() as Promise<{ url: string; isCover: boolean; order: number }>;
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (data: PublishFormData) => {
      const res = await apiRequest("POST", "/api/publish", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Your content has been published successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      router.push("/marketplace");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to publish content",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentFiles = form.getValues("files") || [];
    
    if (currentFiles.length + files.length > 5) {
      toast({
        title: "Too many files",
        description: "Maximum 5 files allowed",
        variant: "destructive",
      });
      return;
    }

    for (const file of files) {
      const uploadedFile = await fileUploadMutation.mutateAsync({
        name: file.name,
        size: file.size,
      });
      
      form.setValue("files", [...(form.getValues("files") || []), uploadedFile]);
    }
  };

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImages = form.getValues("images") || [];
    
    if (currentImages.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "Maximum 5 images allowed",
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadedImage = await imageUploadMutation.mutateAsync({
        name: file.name,
        isCover: currentImages.length === 0 && i === 0,
        order: currentImages.length + i,
      });
      
      form.setValue("images", [...(form.getValues("images") || []), uploadedImage]);
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    const files = form.getValues("files") || [];
    form.setValue("files", files.filter((_, i) => i !== index));
  };

  // Remove image
  const removeImage = (index: number) => {
    const images = form.getValues("images") || [];
    form.setValue("images", images.filter((_, i) => i !== index));
  };

  // Add tag
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const tags = form.getValues("tags") || [];
    if (tags.length >= 8) {
      toast({
        title: "Maximum tags reached",
        description: "You can add up to 8 tags",
        variant: "destructive",
      });
      return;
    }
    
    if (!tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      form.setValue("tags", newTags);
      setCurrentTags(newTags);
    }
    setTagInput("");
  };

  // Remove tag
  const removeTag = (tag: string) => {
    const tags = form.getValues("tags") || [];
    const newTags = tags.filter(t => t !== tag);
    form.setValue("tags", newTags);
    setCurrentTags(newTags);
  };

  // Character counters
  const titleLength = form.watch("title")?.length || 0;
  const descriptionLength = form.watch("description")?.length || 0;

  // Submit handler
  const onSubmit = (data: PublishFormData) => {
    publishMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Publish Your EA / Indicator</h1>
          <p className="text-muted-foreground">
            Share your Expert Advisor, indicator, or trading article with the community
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content Type */}
              <div className="space-y-2">
                <Label htmlFor="select-type">Content Type</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value) => form.setValue("type", value as any)}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ea">Expert Advisor (EA)</SelectItem>
                    <SelectItem value="indicator">Indicator</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="source_code">Source Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="input-title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-sm text-muted-foreground" data-testid="text-title-counter">
                    {titleLength} / 120
                  </span>
                </div>
                <Input
                  id="input-title"
                  data-testid="input-title"
                  {...form.register("title")}
                  placeholder="e.g., Gold Scalper Pro - High Win Rate EA"
                  maxLength={120}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <Label>
                  Platform <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={form.watch("platform")}
                  onValueChange={(value) => form.setValue("platform", value as any)}
                  data-testid="radio-platform"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MT4" id="platform-mt4" data-testid="radio-platform-mt4" />
                    <Label htmlFor="platform-mt4" className="font-normal cursor-pointer">MetaTrader 4</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MT5" id="platform-mt5" data-testid="radio-platform-mt5" />
                    <Label htmlFor="platform-mt5" className="font-normal cursor-pointer">MetaTrader 5</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Both" id="platform-both" data-testid="radio-platform-both" />
                    <Label htmlFor="platform-both" className="font-normal cursor-pointer">Both MT4 & MT5</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Version */}
              <div className="space-y-2">
                <Label htmlFor="input-version">Version</Label>
                <Input
                  id="input-version"
                  data-testid="input-version"
                  {...form.register("version")}
                  placeholder="e.g., 1.0.0"
                />
                <p className="text-xs text-muted-foreground">Semantic versioning recommended (e.g., 1.0.0)</p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="select-category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value) => form.setValue("category", value)}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Set your content pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="switch-free"
                  data-testid="switch-free"
                  checked={isFree}
                  onCheckedChange={(checked) => form.setValue("isFree", checked)}
                />
                <Label htmlFor="switch-free" className="cursor-pointer">Free Content</Label>
              </div>

              {!isFree && (
                <div className="space-y-2">
                  <Label htmlFor="input-price">
                    Price (Coins) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="input-price"
                    data-testid="input-price"
                    type="number"
                    min="0"
                    max="10000"
                    {...form.register("priceCoins", { valueAsNumber: true })}
                    placeholder="e.g., 500"
                  />
                  <p className="text-xs text-muted-foreground">Maximum 10,000 coins</p>
                  {form.formState.errors.priceCoins && (
                    <p className="text-sm text-destructive">{form.formState.errors.priceCoins.message}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <CardDescription>Detailed information about your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="textarea-description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-sm text-muted-foreground" data-testid="text-description-counter">
                    {descriptionLength} / 300 minimum
                  </span>
                </div>
                <Textarea
                  id="textarea-description"
                  data-testid="textarea-description"
                  {...form.register("description")}
                  rows={10}
                  placeholder="Describe your EA/indicator in detail. Include features, strategy, recommended settings, etc."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Markdown supported. Minimum 300 characters.</p>
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add up to 8 tags to help users find your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  data-testid="input-tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Type a tag and press Enter"
                />
                <Button type="button" onClick={addTag} data-testid="button-add-tag">Add</Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {currentTags.map((tag) => (
                  <Badge key={tag} variant="secondary" data-testid={`badge-tag-${tag}`}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2"
                      data-testid={`button-remove-tag-${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Suggested: Performance Report, Scalping, Grid, Hedging, News Trading, etc.
              </p>
              {form.formState.errors.tags && (
                <p className="text-sm text-destructive">{form.formState.errors.tags.message}</p>
              )}
            </CardContent>
          </Card>

          {/* File Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
              <CardDescription>Upload your EA/indicator files (max 5 files)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file-upload"
                  accept=".ex4,.ex5,.mq4,.mq5,.zip,.rar"
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" asChild data-testid="button-file-upload">
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Select Files
                    </span>
                  </Button>
                </label>
              </div>

              {(form.watch("files") || []).map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`file-item-${index}`}>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB • Checksum: {file.checksum}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {form.formState.errors.files && (
                <p className="text-sm text-destructive">{form.formState.errors.files.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Image Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>Upload screenshots and charts (max 5 images)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop images here, or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                  data-testid="input-image-upload"
                />
                <label htmlFor="image-upload">
                  <Button type="button" variant="outline" asChild data-testid="button-image-upload">
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Select Images
                    </span>
                  </Button>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(form.watch("images") || []).map((image, index) => (
                  <div key={index} className="relative group" data-testid={`image-item-${index}`}>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    {image.isCover && (
                      <Badge className="absolute top-2 left-2">Cover</Badge>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      data-testid={`button-remove-image-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {form.formState.errors.images && (
                <p className="text-sm text-destructive">{form.formState.errors.images.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Evidence Fields (Conditional) */}
          {showEvidenceFields && (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <CardTitle>Performance Evidence</CardTitle>
                </div>
                <CardDescription>
                  Required fields for Performance Report content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="input-equity-curve">
                    Equity Curve Image <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="input-equity-curve"
                    data-testid="input-equity-curve"
                    {...form.register("equityCurveImage")}
                    placeholder="URL to equity curve screenshot"
                  />
                  {form.formState.errors.equityCurveImage && (
                    <p className="text-sm text-destructive">{form.formState.errors.equityCurveImage.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="input-profit-factor">
                      Profit Factor <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="input-profit-factor"
                      data-testid="input-profit-factor"
                      type="number"
                      step="0.01"
                      {...form.register("profitFactor", { valueAsNumber: true })}
                      placeholder="e.g., 2.5"
                    />
                    {form.formState.errors.profitFactor && (
                      <p className="text-sm text-destructive">{form.formState.errors.profitFactor.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-drawdown">
                      Max Drawdown % <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="input-drawdown"
                      data-testid="input-drawdown"
                      type="number"
                      step="0.1"
                      {...form.register("drawdownPercent", { valueAsNumber: true })}
                      placeholder="e.g., 15.5"
                    />
                    {form.formState.errors.drawdownPercent && (
                      <p className="text-sm text-destructive">{form.formState.errors.drawdownPercent.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-win-percent">
                      Win Rate % <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="input-win-percent"
                      data-testid="input-win-percent"
                      type="number"
                      step="0.1"
                      {...form.register("winPercent", { valueAsNumber: true })}
                      placeholder="e.g., 68.5"
                    />
                    {form.formState.errors.winPercent && (
                      <p className="text-sm text-destructive">{form.formState.errors.winPercent.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-months-tested">
                      Months Tested <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="input-months-tested"
                      data-testid="input-months-tested"
                      type="number"
                      {...form.register("monthsTested", { valueAsNumber: true })}
                      placeholder="e.g., 12"
                    />
                    {form.formState.errors.monthsTested && (
                      <p className="text-sm text-destructive">{form.formState.errors.monthsTested.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="input-broker-evidence">
                    Broker Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="input-broker-evidence"
                    data-testid="input-broker-evidence"
                    {...form.register("broker")}
                    placeholder="e.g., IC Markets"
                  />
                  {form.formState.errors.broker && (
                    <p className="text-sm text-destructive">{form.formState.errors.broker.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              size="lg"
              disabled={!form.formState.isValid || publishMutation.isPending}
              data-testid="button-submit"
              className="flex-1"
            >
              {publishMutation.isPending ? "Publishing..." : "Publish Content"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push("/marketplace")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>

      <EnhancedFooter />
    </div>
  );
}
