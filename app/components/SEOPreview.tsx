"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import slugify from "slugify";

interface SEOPreviewProps {
  title: string;
  seoExcerpt?: string;
  primaryKeyword?: string;
  body?: string;
}

function calculateKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) return 0;
  
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase().trim();
  
  if (!normalizedKeyword) return 0;
  
  // Count total words
  const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  
  if (totalWords === 0) return 0;
  
  // Count keyword occurrences (handle multi-word keywords)
  const keywordWords = normalizedKeyword.split(/\s+/);
  let keywordCount = 0;
  
  if (keywordWords.length === 1) {
    // Single word keyword
    keywordCount = words.filter(w => w === normalizedKeyword).length;
  } else {
    // Multi-word keyword - search for phrase
    const regex = new RegExp(normalizedKeyword.replace(/\s+/g, '\\s+'), 'gi');
    const matches = normalizedText.match(regex);
    keywordCount = matches ? matches.length : 0;
  }
  
  // Calculate density as percentage
  const density = (keywordCount / totalWords) * 100;
  return Math.round(density * 100) / 100; // Round to 2 decimal places
}

function getKeywordDensityStatus(density: number): { 
  status: 'good' | 'low' | 'high'; 
  message: string;
  icon: React.ElementType;
} {
  if (density === 0) {
    return { 
      status: 'low', 
      message: 'Keyword not found in content',
      icon: AlertCircle
    };
  }
  if (density < 0.5) {
    return { 
      status: 'low', 
      message: 'Keyword density is low. Consider mentioning it more naturally.',
      icon: Info
    };
  }
  if (density > 3) {
    return { 
      status: 'high', 
      message: 'Keyword density is high. This may look like spam to search engines.',
      icon: AlertCircle
    };
  }
  return { 
    status: 'good', 
    message: 'Good keyword density for SEO',
    icon: CheckCircle2
  };
}

export default function SEOPreview({ title, seoExcerpt, primaryKeyword, body }: SEOPreviewProps) {
  const slug = title ? slugify(title, { lower: true, strict: true }) : 'your-thread-title';
  const previewUrl = `yoforex.com/thread/${slug}`;
  
  const displayTitle = title || 'Your Thread Title';
  const displayDescription = seoExcerpt || (body ? body.substring(0, 160) + '...' : 'Your thread description will appear here...');
  
  const descriptionLength = seoExcerpt?.length || 0;
  const titleLength = title?.length || 0;
  
  // Calculate keyword density if we have both keyword and content
  const keywordDensity = primaryKeyword && (title || body) 
    ? calculateKeywordDensity(`${title} ${body}`, primaryKeyword)
    : 0;
  
  const densityStatus = primaryKeyword ? getKeywordDensityStatus(keywordDensity) : null;
  const DensityIcon = densityStatus?.icon || Info;

  return (
    <Card data-testid="card-seo-preview">
      <CardHeader>
        <CardTitle className="text-base">Search Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Search Result Preview */}
        <div className="border rounded-md p-4 bg-card" data-testid="google-preview">
          <div className="text-xs text-muted-foreground mb-1">{previewUrl}</div>
          <div 
            className="text-primary text-lg font-medium mb-1 hover:underline cursor-pointer"
            data-testid="preview-title"
          >
            {displayTitle}
          </div>
          <div className="text-sm text-muted-foreground" data-testid="preview-description">
            {displayDescription}
          </div>
        </div>

        {/* SEO Metrics */}
        <div className="space-y-2">
          {/* Title Length */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Title length:</span>
            <Badge 
              variant={titleLength >= 30 && titleLength <= 60 ? "default" : titleLength > 0 ? "secondary" : "outline"}
              data-testid="badge-title-length"
            >
              {titleLength}/60 chars {titleLength >= 30 && titleLength <= 60 && '✓'}
            </Badge>
          </div>

          {/* Description Length */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Description length:</span>
            <Badge 
              variant={descriptionLength >= 120 && descriptionLength <= 160 ? "default" : descriptionLength > 0 ? "secondary" : "outline"}
              data-testid="badge-description-length"
            >
              {descriptionLength}/160 chars {descriptionLength >= 120 && descriptionLength <= 160 && '✓'}
            </Badge>
          </div>

          {/* Keyword Density */}
          {primaryKeyword && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Keyword density:</span>
              <Badge 
                variant={densityStatus?.status === 'good' ? "default" : densityStatus?.status === 'high' ? "destructive" : "secondary"}
                data-testid="badge-keyword-density"
              >
                {keywordDensity}% {densityStatus?.status === 'good' && '✓'}
              </Badge>
            </div>
          )}
        </div>

        {/* Keyword Density Feedback */}
        {primaryKeyword && densityStatus && (
          <Alert variant={densityStatus.status === 'high' ? 'destructive' : 'default'}>
            <DensityIcon className="h-4 w-4" />
            <AlertDescription data-testid="text-density-feedback">
              {densityStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* SEO Tips */}
        {!seoExcerpt && !primaryKeyword && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>SEO Tips:</strong> Add a primary keyword and excerpt to improve your thread's visibility in search results.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
