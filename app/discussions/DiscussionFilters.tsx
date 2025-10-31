'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  threadCount: number;
  postCount: number;
  sortOrder: number;
  isActive: boolean;
}

interface DiscussionFiltersProps {
  categories: Category[];
}

export default function DiscussionFilters({ categories }: DiscussionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current filter values from URL
  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSort = searchParams.get('sort') || 'latest';
  const currentStatus = searchParams.get('status') || 'all';

  const [searchInput, setSearchInput] = useState(currentSearch);

  // Helper function to update URL params
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Always reset to page 1 when filters change
    params.delete('page');

    startTransition(() => {
      router.push(`/discussions?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const handleCategoryChange = (value: string) => {
    updateFilters({ category: value });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sort: value });
  };

  const handleStatusChange = (value: string) => {
    updateFilters({ status: value });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    startTransition(() => {
      router.push('/discussions');
    });
  };

  const hasActiveFilters = currentSearch || currentCategory || currentSort !== 'latest' || currentStatus !== 'all';

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="ml-auto"
            data-testid="button-clear-filters"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search discussions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            data-testid="input-search-discussions"
          />
        </form>

        {/* Category Filter */}
        <Select value={currentCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger data-testid="select-category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Options */}
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger data-testid="select-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest Activity</SelectItem>
            <SelectItem value="views">Most Viewed</SelectItem>
            <SelectItem value="replies">Most Replies</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger data-testid="select-status">
            <SelectValue placeholder="All Threads" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" data-testid="button-filter-all">All Threads</SelectItem>
            <SelectItem value="solved" data-testid="button-filter-solved">Solved Only</SelectItem>
            <SelectItem value="unsolved" data-testid="button-filter-unsolved">Unsolved Only</SelectItem>
            <SelectItem value="pinned" data-testid="button-filter-pinned">Pinned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending && (
        <div className="mt-4 text-sm text-muted-foreground">
          Loading...
        </div>
      )}
    </Card>
  );
}
