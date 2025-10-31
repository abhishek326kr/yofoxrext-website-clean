"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  extractPrimaryKeyword,
  generateSeoExcerpt,
  extractHashtags,
  generateUrlSlug,
  calculateKeywordDensity,
  generateImageAltText,
  suggestInternalLinks,
  analyzeTitle
} from "@/lib/seo-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  Hash,
  Link as LinkIcon,
  AlertCircle,
  Check,
  X,
  Info,
  TrendingUp,
  Image as ImageIcon,
  Target,
  Lightbulb,
  Eye,
  Edit
} from "lucide-react";

export interface SEOData {
  primaryKeyword: string;
  seoExcerpt: string;
  hashtags: string[];
  urlSlug: string;
  keywordDensity: number;
  imageAltTexts: string[];
  internalLinks: Array<{ category: string; relevance: number }>;
}

interface AutoSEOPanelProps {
  title: string;
  body: string;
  imageUrls?: string[];
  onSEOUpdate: (data: SEOData) => void;
  categories?: string[];
}

interface OptimizationTip {
  type: "success" | "warning" | "error" | "info";
  message: string;
  icon?: React.ReactNode;
}

export default function AutoSEOPanel({
  title,
  body,
  imageUrls = [],
  onSEOUpdate,
  categories = []
}: AutoSEOPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [manualFields, setManualFields] = useState<SEOData>({
    primaryKeyword: "",
    seoExcerpt: "",
    hashtags: [],
    urlSlug: "",
    keywordDensity: 0,
    imageAltTexts: [],
    internalLinks: []
  });
  const [hashtagInput, setHashtagInput] = useState("");

  // Debounce title and body for performance
  const debouncedTitle = useDebounce(title, 500);
  const debouncedBody = useDebounce(body, 500);

  // Auto-generate SEO data
  const autoSEOData = useMemo(() => {
    if (!debouncedTitle && !debouncedBody) {
      return {
        primaryKeyword: "",
        seoExcerpt: "",
        hashtags: [],
        urlSlug: "",
        keywordDensity: 0,
        imageAltTexts: [],
        internalLinks: []
      };
    }

    const primaryKeyword = extractPrimaryKeyword(debouncedTitle, debouncedBody);
    const seoExcerpt = debouncedBody ? generateSeoExcerpt(debouncedBody, primaryKeyword) : "";
    const hashtags = debouncedBody ? extractHashtags(debouncedBody, 5) : [];
    const urlSlug = generateUrlSlug(primaryKeyword, debouncedTitle);
    const keywordDensity = calculateKeywordDensity(`${debouncedTitle} ${debouncedBody}`, primaryKeyword);
    
    // Generate alt texts for images
    const imageAltTexts = imageUrls.map((_, index) => 
      generateImageAltText(primaryKeyword, `Image ${index + 1} from thread`)
    );
    
    // Get internal link suggestions
    const internalLinks = categories.length > 0 && debouncedBody
      ? suggestInternalLinks(debouncedBody, categories)
      : [];

    return {
      primaryKeyword,
      seoExcerpt,
      hashtags,
      urlSlug,
      keywordDensity,
      imageAltTexts,
      internalLinks
    };
  }, [debouncedTitle, debouncedBody, imageUrls, categories]);

  // Title analysis
  const titleAnalysis = useMemo(() => {
    if (!debouncedTitle) return null;
    return analyzeTitle(debouncedTitle);
  }, [debouncedTitle]);

  // Initialize manual fields with auto-generated values when switching modes
  useEffect(() => {
    if (!autoOptimize && autoSEOData.primaryKeyword) {
      setManualFields(autoSEOData);
    }
  }, [autoOptimize, autoSEOData]);

  // Update parent component with SEO data
  useEffect(() => {
    const data = autoOptimize ? autoSEOData : manualFields;
    onSEOUpdate(data);
  }, [autoOptimize, autoSEOData, manualFields, onSEOUpdate]);

  // Calculate current SEO data
  const currentSEOData = autoOptimize ? autoSEOData : manualFields;

  // Generate optimization tips
  const optimizationTips = useMemo((): OptimizationTip[] => {
    const tips: OptimizationTip[] = [];

    // Title length check
    if (titleAnalysis) {
      if (titleAnalysis.isOptimalLength) {
        tips.push({
          type: "success",
          message: `Title length is optimal (${titleAnalysis.length} characters)`,
          icon: <Check className="h-4 w-4" />
        });
      } else if (titleAnalysis.length < 15) {
        tips.push({
          type: "error",
          message: "Title is too short (minimum 15 characters)",
          icon: <X className="h-4 w-4" />
        });
      } else if (titleAnalysis.length > 90) {
        tips.push({
          type: "warning",
          message: "Title is too long (maximum 90 characters)",
          icon: <AlertCircle className="h-4 w-4" />
        });
      }

      // Keyword position check
      if (titleAnalysis.keywordInFirst100) {
        tips.push({
          type: "success",
          message: "Primary keyword appears in first 100 characters",
          icon: <Target className="h-4 w-4" />
        });
      } else if (currentSEOData.primaryKeyword) {
        tips.push({
          type: "warning",
          message: "Primary keyword should appear in first 100 characters",
          icon: <AlertCircle className="h-4 w-4" />
        });
      }
    }

    // Keyword density check
    if (currentSEOData.keywordDensity > 0) {
      if (currentSEOData.keywordDensity >= 0.5 && currentSEOData.keywordDensity <= 3) {
        tips.push({
          type: "success",
          message: `Keyword density is optimal (${currentSEOData.keywordDensity.toFixed(1)}%)`,
          icon: <TrendingUp className="h-4 w-4" />
        });
      } else if (currentSEOData.keywordDensity < 0.5) {
        tips.push({
          type: "warning",
          message: `Keyword density is low (${currentSEOData.keywordDensity.toFixed(1)}%). Consider using the keyword more frequently.`,
          icon: <AlertCircle className="h-4 w-4" />
        });
      } else {
        tips.push({
          type: "warning",
          message: `Keyword density is high (${currentSEOData.keywordDensity.toFixed(1)}%). Reduce keyword usage to avoid over-optimization.`,
          icon: <AlertCircle className="h-4 w-4" />
        });
      }
    }

    // SEO excerpt check
    if (currentSEOData.seoExcerpt) {
      const excerptLength = currentSEOData.seoExcerpt.length;
      if (excerptLength >= 120 && excerptLength <= 160) {
        tips.push({
          type: "success",
          message: `SEO excerpt length is perfect (${excerptLength} characters)`,
          icon: <Check className="h-4 w-4" />
        });
      } else {
        tips.push({
          type: "warning",
          message: `SEO excerpt should be 120-160 characters (currently ${excerptLength})`,
          icon: <AlertCircle className="h-4 w-4" />
        });
      }
    }

    // Image alt text check
    if (imageUrls.length > 0 && currentSEOData.imageAltTexts.length === 0) {
      tips.push({
        type: "error",
        message: "Missing alt text for images. Add descriptions for better SEO.",
        icon: <ImageIcon className="h-4 w-4" />
      });
    } else if (currentSEOData.imageAltTexts.length > 0) {
      tips.push({
        type: "success",
        message: `Alt text generated for ${currentSEOData.imageAltTexts.length} images`,
        icon: <ImageIcon className="h-4 w-4" />
      });
    }

    // Internal links suggestion
    if (currentSEOData.internalLinks.length > 0) {
      tips.push({
        type: "info",
        message: `Found ${currentSEOData.internalLinks.length} relevant categories for internal linking`,
        icon: <LinkIcon className="h-4 w-4" />
      });
    }

    // Hashtags check
    if (currentSEOData.hashtags.length === 0 && body.length > 100) {
      tips.push({
        type: "info",
        message: "Consider adding hashtags to increase discoverability",
        icon: <Hash className="h-4 w-4" />
      });
    }

    return tips;
  }, [titleAnalysis, currentSEOData, imageUrls, body]);

  // Handle manual field updates
  const handleManualFieldChange = (field: keyof SEOData, value: any) => {
    setManualFields(prev => ({ ...prev, [field]: value }));
  };

  // Add hashtag manually
  const addHashtag = () => {
    if (hashtagInput && manualFields.hashtags.length < 10) {
      const tag = hashtagInput.startsWith("#") ? hashtagInput : `#${hashtagInput}`;
      handleManualFieldChange("hashtags", [...manualFields.hashtags, tag]);
      setHashtagInput("");
    }
  };

  // Remove hashtag
  const removeHashtag = (index: number) => {
    handleManualFieldChange("hashtags", manualFields.hashtags.filter((_, i) => i !== index));
  };

  // Get keyword density badge color
  const getKeywordDensityColor = (density: number) => {
    if (density >= 0.5 && density <= 3) return "bg-green-500";
    if (density < 0.5) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <TooltipProvider>
      <Card className="w-full">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">SEO Optimization</CardTitle>
                  {autoOptimize && (
                    <Badge variant="secondary" className="ml-2">
                      Auto-optimizing
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-toggle-seo-panel"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <CardDescription>
                Optimize your thread for better visibility and engagement
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Auto-optimize toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-optimize" className="text-base cursor-pointer">
                    Auto-optimize SEO for me
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate optimal SEO fields from your content
                  </p>
                </div>
                <Switch
                  id="auto-optimize"
                  checked={autoOptimize}
                  onCheckedChange={setAutoOptimize}
                  data-testid="switch-auto-optimize"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SEO Fields */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Primary Keyword */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Label>Primary Keyword</Label>
                      {currentSEOData.keywordDensity > 0 && (
                        <Badge 
                          className={`ml-auto ${getKeywordDensityColor(currentSEOData.keywordDensity)} text-white`}
                        >
                          {currentSEOData.keywordDensity.toFixed(1)}% density
                        </Badge>
                      )}
                    </div>
                    {autoOptimize ? (
                      <div className="p-3 rounded-md bg-muted">
                        <p className="font-medium">{currentSEOData.primaryKeyword || "Generating..."}</p>
                      </div>
                    ) : (
                      <Input
                        value={manualFields.primaryKeyword}
                        onChange={(e) => handleManualFieldChange("primaryKeyword", e.target.value)}
                        placeholder="Enter your primary keyword..."
                        maxLength={50}
                        data-testid="input-primary-keyword"
                      />
                    )}
                  </div>

                  {/* SEO Excerpt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <Label>SEO Excerpt</Label>
                      </div>
                      <span className={`text-xs ${
                        currentSEOData.seoExcerpt.length >= 120 && currentSEOData.seoExcerpt.length <= 160
                          ? "text-green-500"
                          : "text-amber-500"
                      }`}>
                        {currentSEOData.seoExcerpt.length}/160 chars
                      </span>
                    </div>
                    {autoOptimize ? (
                      <div className="p-3 rounded-md bg-muted">
                        <p className="text-sm">{currentSEOData.seoExcerpt || "Generating..."}</p>
                      </div>
                    ) : (
                      <Textarea
                        value={manualFields.seoExcerpt}
                        onChange={(e) => handleManualFieldChange("seoExcerpt", e.target.value)}
                        placeholder="Enter a compelling description (120-160 characters)..."
                        maxLength={160}
                        rows={3}
                        data-testid="textarea-seo-excerpt"
                      />
                    )}
                  </div>

                  {/* Hashtags */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <Label>Hashtags</Label>
                      <span className="text-xs text-muted-foreground">({currentSEOData.hashtags.length}/10)</span>
                    </div>
                    {autoOptimize ? (
                      <div className="flex flex-wrap gap-2 p-3 rounded-md bg-muted min-h-[60px]">
                        {currentSEOData.hashtags.length > 0 ? (
                          currentSEOData.hashtags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Generating hashtags...</span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={hashtagInput}
                            onChange={(e) => setHashtagInput(e.target.value)}
                            placeholder="Add hashtag..."
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                            data-testid="input-hashtag"
                          />
                          <Button
                            type="button"
                            onClick={addHashtag}
                            size="sm"
                            data-testid="button-add-hashtag"
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {manualFields.hashtags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="group">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeHashtag(index)}
                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* URL Slug */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <Label>URL Slug</Label>
                    </div>
                    {autoOptimize ? (
                      <div className="p-3 rounded-md bg-muted">
                        <code className="text-sm">{currentSEOData.urlSlug || "generating-slug..."}</code>
                      </div>
                    ) : (
                      <Input
                        value={manualFields.urlSlug}
                        onChange={(e) => handleManualFieldChange("urlSlug", e.target.value.replace(/[^a-z0-9-]/g, ""))}
                        placeholder="url-friendly-slug"
                        maxLength={60}
                        data-testid="input-url-slug"
                      />
                    )}
                  </div>

                  {/* Image Alt Texts */}
                  {imageUrls.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <Label>Image Alt Texts</Label>
                      </div>
                      {autoOptimize ? (
                        <div className="space-y-2">
                          {currentSEOData.imageAltTexts.map((altText, index) => (
                            <div key={index} className="p-2 rounded-md bg-muted text-sm">
                              <span className="font-medium">Image {index + 1}:</span> {altText}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {imageUrls.map((_, index) => (
                            <Input
                              key={index}
                              value={manualFields.imageAltTexts[index] || ""}
                              onChange={(e) => {
                                const newAltTexts = [...manualFields.imageAltTexts];
                                newAltTexts[index] = e.target.value;
                                handleManualFieldChange("imageAltTexts", newAltTexts);
                              }}
                              placeholder={`Describe image ${index + 1}...`}
                              data-testid={`input-alt-text-${index}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Internal Links */}
                  {currentSEOData.internalLinks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <Label>Suggested Internal Links</Label>
                      </div>
                      <div className="p-3 rounded-md bg-muted space-y-1">
                        {currentSEOData.internalLinks.map((link, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{link.category}</span>
                            <Badge variant="outline" className="text-xs">
                              {link.relevance}% relevant
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Optimization Tips Sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-4 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Optimization Tips
                      </h3>
                      <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                        <div className="space-y-3">
                          {optimizationTips.map((tip, index) => (
                            <Alert key={index} className={`
                              ${tip.type === "success" ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}
                              ${tip.type === "warning" ? "border-amber-500 bg-amber-50 dark:bg-amber-950" : ""}
                              ${tip.type === "error" ? "border-red-500 bg-red-50 dark:bg-red-950" : ""}
                              ${tip.type === "info" ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : ""}
                            `}>
                              <div className="flex items-start gap-2">
                                {tip.icon}
                                <AlertDescription className="text-xs">
                                  {tip.message}
                                </AlertDescription>
                              </div>
                            </Alert>
                          ))}

                          {optimizationTips.length === 0 && (
                            <Alert>
                              <Info className="h-4 w-4" />
                              <AlertDescription>
                                Start typing to see optimization suggestions
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* SEO Score */}
                    <div className="p-4 rounded-lg border space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        SEO Score
                      </h4>
                      <div className="space-y-2">
                        <Progress 
                          value={
                            Math.min(100, 
                              (optimizationTips.filter(t => t.type === "success").length / 
                              Math.max(1, optimizationTips.length)) * 100
                            )
                          } 
                          className="h-2"
                        />
                        <p className="text-sm text-muted-foreground">
                          {optimizationTips.filter(t => t.type === "success").length} of{" "}
                          {optimizationTips.length} optimizations complete
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}