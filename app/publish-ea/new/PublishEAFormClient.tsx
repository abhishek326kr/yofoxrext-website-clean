"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import AutoSEOPanel, { type SEOData } from "@/components/AutoSEOPanel";
import SEOPreview from "@/components/SEOPreview";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  FileCode,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";

// EA Categories
const EA_CATEGORIES = [
  "Scalping",
  "Trend Following",
  "Grid",
  "Martingale",
  "Breakout",
  "News Trading",
  "Multi-Timeframe"
];

// Form validation schema
const eaFormSchema = z.object({
  title: z.string()
    .min(30, "Title must be at least 30 characters")
    .max(60, "Title must be at most 60 characters"),
  category: z.enum(["Scalping", "Trend Following", "Grid", "Martingale", "Breakout", "News Trading", "Multi-Timeframe"] as const),
  description: z.string()
    .min(200, "Description must be at least 200 characters")
    .max(2000, "Description must be at most 2000 characters"),
  priceCoins: z.number()
    .int("Price must be a whole number")
    .min(1, "Price must be at least 1 coin")
    .max(1000, "Price must be at most 1000 coins"),
  eaFileUrl: z.string().min(1, "EA file is required"),
  imageUrls: z.array(z.string()).max(5, "Maximum 5 images allowed").default([]),
  
  // SEO fields
  slug: z.string().min(1, "Slug is required"),
  primaryKeyword: z.string().optional().default(""),
  seoExcerpt: z.string().optional().default(""),
  hashtags: z.array(z.string()).default([])
});

type EAFormData = z.infer<typeof eaFormSchema>;

export default function PublishEAFormClient() {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt();

  const form = useForm<EAFormData>({
    resolver: zodResolver(eaFormSchema),
    defaultValues: {
      title: "",
      category: "Trend Following",
      description: "",
      priceCoins: 50,
      eaFileUrl: "",
      imageUrls: [],
      slug: "",
      primaryKeyword: "",
      seoExcerpt: "",
      hashtags: []
    }
  });

  const title = form.watch("title");
  const description = form.watch("description");
  const priceCoins = form.watch("priceCoins");
  const imageUrls = form.watch("imageUrls");
  const eaFileUrl = form.watch("eaFileUrl");

  // Update SEO data when it changes
  const handleSEOUpdate = useCallback((data: SEOData) => {
    setSeoData(data);
    form.setValue("slug", data.urlSlug);
    form.setValue("primaryKeyword", data.primaryKeyword);
    form.setValue("seoExcerpt", data.seoExcerpt);
    form.setValue("hashtags", data.hashtags);
  }, [form]);

  // EA File upload
  const { getRootProps: getFileRootProps, getInputProps: getFileInputProps, isDragActive: isFileDragActive } = useDropzone({
    accept: {
      'application/octet-stream': ['.ex4', '.ex5', '.mq4'],
      'application/zip': ['.zip']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);
      formData.append('type', 'ea-file');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        form.setValue("eaFileUrl", data.url);
        toast({
          title: "File uploaded",
          description: "EA file uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload EA file",
          variant: "destructive",
        });
      } finally {
        setUploadingFile(false);
      }
    }
  });

  // Image upload
  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB per image
    multiple: true,
    maxFiles: 5,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      setUploadingImages(true);
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'ea-screenshot');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data.url;
      });

      try {
        const urls = await Promise.all(uploadPromises);
        const currentUrls = form.getValues("imageUrls");
        const newUrls = [...currentUrls, ...urls].slice(0, 5);
        form.setValue("imageUrls", newUrls);
        toast({
          title: "Images uploaded",
          description: `${urls.length} image(s) uploaded successfully`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload some images",
          variant: "destructive",
        });
      } finally {
        setUploadingImages(false);
      }
    }
  });

  // Remove image
  const removeImage = (index: number) => {
    const currentUrls = form.getValues("imageUrls");
    const newUrls = currentUrls.filter((_, i) => i !== index);
    form.setValue("imageUrls", newUrls);
  };

  // Submit mutation
  const publishMutation = useMutation({
    mutationFn: async (data: EAFormData) => {
      return await apiRequest('/api/content', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          type: 'ea',
          status: 'pending',
          isFree: false,
          focusKeyword: data.primaryKeyword,
          autoMetaDescription: data.seoExcerpt,
          autoImageAltTexts: imageUrls.map((url, i) => `${title} - Screenshot ${i + 1}`)
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "EA submitted for review",
        description: "Your EA will be published after admin approval",
      });
      router.push('/publish-ea');
    },
    onError: (error) => {
      toast({
        title: "Failed to publish",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: EAFormData) => {
    publishMutation.mutate(data);
  };

  // Require authentication
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      requireAuth(() => {});
    }
  }, [isAuthLoading, isAuthenticated, requireAuth]);

  if (isAuthLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground mb-4">
                Please log in to publish an EA
              </p>
              <Button onClick={() => requireAuth(() => {})}>
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
        <AuthPrompt />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/publish-ea">
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to EA Listings
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="heading-publish-ea">
              Publish New Expert Advisor
            </h1>
            <p className="text-muted-foreground">
              Share your automated trading system with the community
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">EA Details</TabsTrigger>
                  <TabsTrigger value="files">Files & Media</TabsTrigger>
                  <TabsTrigger value="seo">SEO & Preview</TabsTrigger>
                </TabsList>

                {/* Tab 1: EA Details */}
                <TabsContent value="details" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Provide details about your Expert Advisor
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Title */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>EA Title *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="e.g., Gold Scalper Pro EA v2.5"
                                  {...field}
                                  data-testid="input-title"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  {field.value.length}/60
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              30-60 characters. Make it descriptive and keyword-rich.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Category */}
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {EA_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose the trading strategy category
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Textarea
                                  placeholder="Describe your EA's features, trading strategy, recommended settings, backtest results, etc..."
                                  rows={10}
                                  {...field}
                                  data-testid="textarea-description"
                                />
                                <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                                  {field.value.length}/2000
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              200-2000 characters. Include key features, strategy, and performance metrics.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Price */}
                      <FormField
                        control={form.control}
                        name="priceCoins"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (Gold Coins) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={1000}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-price"
                              />
                            </FormControl>
                            <FormDescription>
                              1-1000 coins. Users will pay this amount to download your EA.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 2: Files & Media */}
                <TabsContent value="files" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>EA File Upload</CardTitle>
                      <CardDescription>
                        Upload your Expert Advisor file (.ex4, .ex5, .mq4, or .zip)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        {...getFileRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                          isFileDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
                        }`}
                        data-testid="dropzone-ea-file"
                      >
                        <input {...getFileInputProps()} />
                        {uploadingFile ? (
                          <div className="space-y-2">
                            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </div>
                        ) : eaFileUrl ? (
                          <div className="space-y-2">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                            <p className="font-medium">EA File Uploaded</p>
                            <p className="text-sm text-muted-foreground">{eaFileUrl.split('/').pop()}</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                form.setValue("eaFileUrl", "");
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="font-medium">Drop EA file here or click to browse</p>
                            <p className="text-sm text-muted-foreground">
                              Accepts: .ex4, .ex5, .mq4, .zip • Max 10MB
                            </p>
                          </div>
                        )}
                      </div>
                      {form.formState.errors.eaFileUrl && (
                        <p className="text-sm text-destructive mt-2">{form.formState.errors.eaFileUrl.message}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Screenshots (Optional)</CardTitle>
                      <CardDescription>
                        Upload 0-5 screenshots of your EA in action
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {imageUrls.map((url, index) => (
                            <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                              <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {imageUrls.length < 5 && (
                        <div
                          {...getImageRootProps()}
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            isImageDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
                          }`}
                          data-testid="dropzone-screenshots"
                        >
                          <input {...getImageInputProps()} />
                          {uploadingImages ? (
                            <div className="space-y-2">
                              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                              <p className="text-sm text-muted-foreground">Uploading...</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-sm font-medium">Add Screenshots</p>
                              <p className="text-xs text-muted-foreground">
                                {imageUrls.length}/5 images • PNG, JPG, WEBP • Max 5MB each
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 3: SEO & Preview */}
                <TabsContent value="seo" className="space-y-6 mt-6">
                  {/* SEO Panel */}
                  <AutoSEOPanel
                    title={title}
                    body={description}
                    imageUrls={imageUrls}
                    onSEOUpdate={handleSEOUpdate}
                  />

                  {/* SEO Preview */}
                  <SEOPreview
                    title={title}
                    seoExcerpt={seoData?.seoExcerpt || ""}
                    primaryKeyword={seoData?.primaryKeyword || ""}
                    body={description}
                  />
                </TabsContent>
              </Tabs>

              {/* Submit Buttons */}
              <Card>
                <CardContent className="pt-6 flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPreview(!showPreview)}
                    data-testid="button-toggle-preview"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? "Hide" : "Show"} Preview
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={publishMutation.isPending || !eaFileUrl}
                    data-testid="button-publish-ea"
                  >
                    {publishMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Publish EA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview Section */}
              {showPreview && title && description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      This is how your EA will appear to users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">{title}</h2>
                          <Badge>{form.watch("category")}</Badge>
                        </div>
                        <Badge variant="default" className="text-lg px-4 py-2">
                          {priceCoins} ₡
                        </Badge>
                      </div>
                      
                      {imageUrls.length > 0 && (
                        <img
                          src={imageUrls[0]}
                          alt={title}
                          className="w-full aspect-video object-cover rounded-lg"
                        />
                      )}
                      
                      <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
                      
                      <Button className="w-full" size="lg" disabled>
                        Download for {priceCoins} ₡
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </Form>
        </div>
      </main>
      <EnhancedFooter />
      <AuthPrompt />
    </>
  );
}
