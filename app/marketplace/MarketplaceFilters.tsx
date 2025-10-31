'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';

export default function MarketplaceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current filter values from URL
  const currentSearch = searchParams.get('search') || '';
  const currentType = searchParams.get('type') || 'all';
  const currentPrice = searchParams.get('price') || 'all';
  const currentPlatform = searchParams.get('platform') || 'all';
  const currentSort = searchParams.get('sort') || 'latest';
  const currentFeatured = searchParams.get('featured') === 'true';

  // Update URL with new filter values
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.delete('page');

    startTransition(() => {
      router.push(`/marketplace?${params.toString()}`);
    });
  };

  // Handle search input with debounce
  const handleSearch = (value: string) => {
    updateFilters({ search: value || null });
  };

  // Handle featured toggle
  const handleFeaturedToggle = (checked: boolean) => {
    updateFilters({ featured: checked ? 'true' : null });
  };

  // Clear all filters
  const clearAllFilters = () => {
    startTransition(() => {
      router.push('/marketplace');
    });
  };

  // Check if any filters are active
  const hasActiveFilters = currentSearch || currentType !== 'all' || currentPrice !== 'all' || 
                          currentPlatform !== 'all' || currentSort !== 'latest' || currentFeatured;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              data-testid="button-clear-filters"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search Input */}
          <div className="xl:col-span-2">
            <Label htmlFor="search-input" className="text-sm mb-2 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search-input"
                type="text"
                placeholder="Search titles & descriptions..."
                defaultValue={currentSearch}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-marketplace"
              />
            </div>
          </div>

          {/* Content Type Filter */}
          <div>
            <Label htmlFor="type-select" className="text-sm mb-2 block">Content Type</Label>
            <Select
              value={currentType}
              onValueChange={(value) => updateFilters({ type: value })}
            >
              <SelectTrigger id="type-select" data-testid="select-type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ea">EA (Expert Advisor)</SelectItem>
                <SelectItem value="indicator">Indicator</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="source_code">Source Code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Filter */}
          <div>
            <Label htmlFor="price-select" className="text-sm mb-2 block">Price</Label>
            <Select
              value={currentPrice}
              onValueChange={(value) => updateFilters({ price: value })}
            >
              <SelectTrigger id="price-select" data-testid="select-price">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Platform Filter */}
          <div>
            <Label htmlFor="platform-select" className="text-sm mb-2 block">Platform</Label>
            <Select
              value={currentPlatform}
              onValueChange={(value) => updateFilters({ platform: value })}
            >
              <SelectTrigger id="platform-select" data-testid="select-platform">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="MT4">MT4 Only</SelectItem>
                <SelectItem value="MT5">MT5 Only</SelectItem>
                <SelectItem value="Both">Both MT4 & MT5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div>
            <Label htmlFor="sort-select" className="text-sm mb-2 block">Sort By</Label>
            <Select
              value={currentSort}
              onValueChange={(value) => updateFilters({ sort: value })}
            >
              <SelectTrigger id="sort-select" data-testid="select-sort">
                <SelectValue placeholder="Latest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Featured Toggle */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Switch
            id="featured-toggle"
            checked={currentFeatured}
            onCheckedChange={handleFeaturedToggle}
            data-testid="toggle-featured"
          />
          <Label htmlFor="featured-toggle" className="text-sm cursor-pointer">
            Show only featured content
          </Label>
        </div>

        {/* Loading indicator */}
        {isPending && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Updating results...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
