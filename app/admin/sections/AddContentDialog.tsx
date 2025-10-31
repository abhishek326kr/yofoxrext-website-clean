"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const addContentSchema = z.object({
  type: z.enum(["ea", "indicator", "article", "source_code"]),
  title: z.string().min(10, "Title must be at least 10 characters").max(120),
  description: z.string().min(300, "Description must be at least 300 characters"),
  category: z.string().min(1, "Category is required"),
  priceCoins: z.number().min(0).max(10000),
  isFree: z.boolean(),
  platform: z.enum(["MT4", "MT5", "Both"]).optional(),
  version: z.string().optional(),
  tags: z.string().optional(),
  license: z.string().optional(),
  minDeposit: z.number().optional(),
  hedging: z.boolean().optional(),
  changelog: z.string().optional(),
});

type AddContentFormData = z.infer<typeof addContentSchema>;

interface AddContentDialogProps {
  trigger?: React.ReactNode;
}

export default function AddContentDialog({ trigger }: AddContentDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const form = useForm<AddContentFormData>({
    resolver: zodResolver(addContentSchema),
    defaultValues: {
      type: "ea",
      title: "",
      description: "",
      category: "",
      priceCoins: 0,
      isFree: true,
      platform: "MT4",
      version: "1.0",
      tags: "",
      license: "Standard",
      minDeposit: undefined,
      hedging: false,
      changelog: "",
    },
  });

  const createContentMutation = useMutation({
    mutationFn: async (data: AddContentFormData) => {
      // Convert tags string to array
      const tagsArray = data.tags
        ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean)
        : [];

      const payload = {
        ...data,
        tags: tagsArray,
        // Set status to approved since admin is creating it
        status: "approved",
        files: [],
        images: [],
      };

      const response = await apiRequest("POST", "/api/admin/content", payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Created!",
        description: "The marketplace content has been successfully added.",
      });
      form.reset();
      setSelectedTags([]);
      setOpen(false);
      // Invalidate all marketplace-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/top-selling"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/revenue-chart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Create Content",
        description: error.message || "Could not create marketplace content. Please try again.",
      });
    },
  });

  const onSubmit = (data: AddContentFormData) => {
    createContentMutation.mutate(data);
  };

  const commonCategories = [
    "Expert Advisors",
    "Indicators",
    "Scripts",
    "Templates",
    "Trading Systems",
    "Libraries",
    "Utilities",
    "Educational",
  ];

  const commonTags = [
    "Scalping",
    "Day Trading",
    "Swing Trading",
    "Grid",
    "Martingale",
    "Breakout",
    "Trend Following",
    "Mean Reversion",
    "News Trading",
    "High Frequency",
    "Performance Report",
  ];

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    form.setValue("tags", newTags.join(", "));
  };

  const isFree = form.watch("isFree");

  useEffect(() => {
    if (isFree) {
      form.setValue("priceCoins", 0);
    }
  }, [isFree, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-content">
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Marketplace Content</DialogTitle>
          <DialogDescription>
            Create new marketplace content (EA, Indicator, Article, or Source Code). All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Content Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-content-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ea">Expert Advisor (EA)</SelectItem>
                      <SelectItem value="indicator">Indicator</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="source_code">Source Code</SelectItem>
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
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Gold Scalper Pro EA v2.5"
                      {...field}
                      data-testid="input-content-title"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/120 characters
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
                    <Textarea
                      placeholder="Detailed description of the content, features, benefits, and usage instructions..."
                      className="min-h-[150px]"
                      {...field}
                      data-testid="textarea-content-description"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length} characters (minimum 300)
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
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commonCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-platform">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MT4">MT4</SelectItem>
                      <SelectItem value="MT5">MT5</SelectItem>
                      <SelectItem value="Both">Both MT4 & MT5</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-is-free"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Free Content</FormLabel>
                      <FormDescription>
                        Check if this content is free
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceCoins"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (Coins) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={10000}
                        disabled={isFree}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-price-coins"
                      />
                    </FormControl>
                    <FormDescription>
                      0-10,000 coins
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {commonTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag)}
                        data-testid={`tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Or enter custom tags separated by commas..."
                      {...field}
                      data-testid="input-tags"
                    />
                  </FormControl>
                  <FormDescription>
                    Click tags above or enter custom tags separated by commas (max 8)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Version */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 1.0, 2.5.1"
                        {...field}
                        data-testid="input-version"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="license"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Standard, Extended, GPL"
                        {...field}
                        data-testid="input-license"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minDeposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Deposit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 100"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ""}
                        data-testid="input-min-deposit"
                      />
                    </FormControl>
                    <FormDescription>Minimum account balance required</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hedging"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-hedging"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Supports Hedging</FormLabel>
                      <FormDescription>
                        Check if this EA supports hedging
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Changelog */}
            <FormField
              control={form.control}
              name="changelog"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Changelog</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Version history and updates..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="textarea-changelog"
                    />
                  </FormControl>
                  <FormDescription>
                    Document version changes and improvements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createContentMutation.isPending}
                data-testid="button-submit-content"
              >
                {createContentMutation.isPending ? "Creating..." : "Create Content"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedTags([]);
                  setOpen(false);
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
