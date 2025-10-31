"use client";

import { useState } from "react";
import AutoSEOPanel, { type SEOData } from "@/components/AutoSEOPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Sample categories for testing
const SAMPLE_CATEGORIES = [
  "forex-trading",
  "technical-analysis",
  "fundamental-analysis",
  "trading-strategies",
  "risk-management",
  "market-news",
  "broker-reviews",
  "educational-content",
  "trading-tools",
  "cryptocurrency"
];

export default function TestSEOPanel() {
  const [title, setTitle] = useState("Best Forex Trading Strategies for Beginners in 2025");
  const [body, setBody] = useState(`Are you new to forex trading and looking for proven strategies? In this comprehensive guide, I'll share the top 5 forex trading strategies that work consistently for beginners.

## 1. Trend Following Strategy

The trend following strategy is one of the most reliable approaches for forex trading. This involves identifying the market direction using indicators like Moving Averages (MA) and the MACD indicator. When trading EURUSD or GBPUSD on the H4 timeframe, look for clear trend signals.

## 2. Support and Resistance Trading

Support and resistance levels are crucial for successful forex trading. These key levels help identify potential reversal points in the market. I recommend using the D1 timeframe for better accuracy when trading major pairs like XAUUSD (Gold).

## 3. Scalping Strategy

Scalping involves making quick trades on smaller timeframes like M5 or M15. This strategy works well during high liquidity sessions, especially when trading volatile pairs. Remember to use tight stop losses and proper risk management.

## Key Tips for Success:
- Always use stop loss orders
- Risk only 1-2% per trade
- Focus on major currency pairs initially
- Keep a trading journal
- Practice on demo accounts first

The forex market offers numerous opportunities, but success requires discipline and proper strategy implementation. Whether you're day trading or swing trading, these strategies can help improve your results.

What's your favorite forex trading strategy? Share your experience in the comments below!`);
  
  const [imageUrls, setImageUrls] = useState<string[]>([
    "/sample-chart-1.png",
    "/sample-chart-2.png"
  ]);
  
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const handleSEOUpdate = (data: SEOData) => {
    setSeoData(data);
    console.log("SEO Data Updated:", data);
  };

  const addImage = () => {
    if (imageUrlInput) {
      setImageUrls([...imageUrls, imageUrlInput]);
      setImageUrlInput("");
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>AutoSEOPanel Component Test</CardTitle>
          <CardDescription>
            Test the AutoSEOPanel component with different inputs and see real-time SEO optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Thread Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a thread title..."
              data-testid="input-test-title"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Length: {title.length} chars</span>
              <Badge variant={title.length >= 15 && title.length <= 90 ? "default" : "destructive"}>
                {title.length >= 15 && title.length <= 90 ? "Optimal" : "Not Optimal"}
              </Badge>
            </div>
          </div>

          {/* Body Input */}
          <div className="space-y-2">
            <Label htmlFor="body">Thread Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter thread content..."
              rows={10}
              className="font-mono text-sm"
              data-testid="textarea-test-body"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Length: {body.length} chars</span>
              <span>Words: {body.split(/\s+/).filter(w => w.length > 0).length}</span>
            </div>
          </div>

          {/* Image URLs */}
          <div className="space-y-2">
            <Label>Image URLs (for testing alt text generation)</Label>
            <div className="flex gap-2">
              <Input
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Enter image URL..."
                data-testid="input-test-image-url"
              />
              <Button onClick={addImage} type="button">Add Image</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url, index) => (
                <Badge key={index} variant="secondary" className="group">
                  Image {index + 1}: {url}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AutoSEOPanel Component */}
      <div className="mb-8">
        <AutoSEOPanel
          title={title}
          body={body}
          imageUrls={imageUrls}
          onSEOUpdate={handleSEOUpdate}
          categories={SAMPLE_CATEGORIES}
        />
      </div>

      {/* SEO Data Output */}
      {seoData && (
        <Card>
          <CardHeader>
            <CardTitle>Generated SEO Data</CardTitle>
            <CardDescription>
              This is the SEO data that would be sent to the server when creating a thread
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Primary Keyword</Label>
                  <p className="text-sm mt-1">{seoData.primaryKeyword || "Not generated"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Keyword Density</Label>
                  <p className="text-sm mt-1">
                    <Badge className={
                      seoData.keywordDensity >= 0.5 && seoData.keywordDensity <= 3
                        ? "bg-green-500"
                        : seoData.keywordDensity < 0.5
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }>
                      {seoData.keywordDensity.toFixed(2)}%
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">URL Slug</Label>
                  <p className="text-sm mt-1">
                    <code className="bg-muted px-2 py-1 rounded">{seoData.urlSlug || "not-generated"}</code>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Hashtags ({seoData.hashtags.length})</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {seoData.hashtags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">SEO Excerpt</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                  {seoData.seoExcerpt || "Not generated"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Length: {seoData.seoExcerpt.length} chars (optimal: 120-160)
                </p>
              </div>

              {seoData.imageAltTexts.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Image Alt Texts</Label>
                  <div className="space-y-1 mt-1">
                    {seoData.imageAltTexts.map((alt, i) => (
                      <div key={i} className="text-sm p-2 bg-muted rounded">
                        <span className="font-medium">Image {i + 1}:</span> {alt}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {seoData.internalLinks.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Internal Link Suggestions</Label>
                  <div className="space-y-1 mt-1">
                    {seoData.internalLinks.map((link, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 bg-muted rounded">
                        <span>{link.category}</span>
                        <Badge variant="outline">{link.relevance}% relevant</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <Label className="text-sm font-semibold mb-2 block">Raw JSON Data</Label>
                <div className="p-3 bg-muted rounded-md overflow-auto max-h-96">
                  <pre className="text-xs">
                    {JSON.stringify(seoData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}