'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { BrokerCard } from './BrokerCard';

type Broker = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  overallRating: number | null;
  reviewCount: number;
  scamReportCount: number;
  isVerified: boolean;
  regulationSummary: string | null;
  regulation: string | null;
  platform: string | null;
  spreadType: string | null;
  minSpread: string | null;
};

interface BrokerFiltersProps {
  brokers: Broker[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function BrokerFilters({ brokers, totalCount }: BrokerFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current filter values from URL
  const currentSearch = searchParams.get('search') || '';
  const currentRegulation = searchParams.get('regulation') || 'all';
  const currentPlatform = searchParams.get('platform') || 'all';
  const currentSpreadType = searchParams.get('spreadType') || 'all';
  const currentMinRating = searchParams.get('minRating') || 'all';
  const currentSort = searchParams.get('sort') || 'rating';

  // Update URL with new filter value
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    // Reset to page 1 when filters change
    params.delete('page');

    startTransition(() => {
      router.push(`/brokers?${params.toString()}`);
    });
  };

  // Clear all filters
  const clearFilters = () => {
    startTransition(() => {
      router.push('/brokers');
    });
  };

  // Check if any filters are active
  const hasActiveFilters = currentSearch || 
    currentRegulation !== 'all' || 
    currentPlatform !== 'all' || 
    currentSpreadType !== 'all' || 
    currentMinRating !== 'all';

  return (
    <>
      <div className="space-y-4 mb-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search brokers..."
            className="pl-9"
            defaultValue={currentSearch}
            onChange={(e) => updateFilter('search', e.target.value)}
            data-testid="input-search-brokers"
            disabled={isPending}
          />
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Regulation Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Regulation</label>
            <Select
              value={currentRegulation}
              onValueChange={(value) => updateFilter('regulation', value)}
              disabled={isPending}
            >
              <SelectTrigger data-testid="select-regulation">
                <SelectValue placeholder="All Regulations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regulations</SelectItem>
                <SelectItem value="FCA">FCA</SelectItem>
                <SelectItem value="ASIC">ASIC</SelectItem>
                <SelectItem value="CySEC">CySEC</SelectItem>
                <SelectItem value="CFTC">CFTC</SelectItem>
                <SelectItem value="FSA">FSA</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Platform Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Platform</label>
            <Select
              value={currentPlatform}
              onValueChange={(value) => updateFilter('platform', value)}
              disabled={isPending}
            >
              <SelectTrigger data-testid="select-platform">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="MT4">MT4</SelectItem>
                <SelectItem value="MT5">MT5</SelectItem>
                <SelectItem value="Both">Both MT4 & MT5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spread Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Spread Type</label>
            <Select
              value={currentSpreadType}
              onValueChange={(value) => updateFilter('spreadType', value)}
              disabled={isPending}
            >
              <SelectTrigger data-testid="select-spread-type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Fixed">Fixed</SelectItem>
                <SelectItem value="Variable">Variable</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Rating Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Min Rating</label>
            <Select
              value={currentMinRating}
              onValueChange={(value) => updateFilter('minRating', value)}
              disabled={isPending}
            >
              <SelectTrigger data-testid="select-min-rating">
                <SelectValue placeholder="Any Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Rating</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <Select
              value={currentSort}
              onValueChange={(value) => updateFilter('sort', value)}
              disabled={isPending}
            >
              <SelectTrigger data-testid="select-sort">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Rating (Highest)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="spread">Spread (Lowest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={isPending}
                className="w-full"
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isPending && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>

      {/* Broker List */}
      <div className="space-y-4">
        {brokers.map((broker) => (
          <BrokerCard key={broker.id} broker={broker} />
        ))}
        {brokers.length === 0 && !isPending && (
          <div className="text-center py-12 text-muted-foreground">
            No brokers found matching your criteria.
          </div>
        )}
      </div>
    </>
  );
}
