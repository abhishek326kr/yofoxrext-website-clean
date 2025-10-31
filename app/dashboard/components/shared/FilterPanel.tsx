"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
  showDateRange?: boolean;
  showCategory?: boolean;
  showStatus?: boolean;
  categories?: string[];
  statuses?: string[];
}

export function FilterPanel({
  onFilterChange,
  showDateRange = true,
  showCategory = false,
  showStatus = false,
  categories = [],
  statuses = [],
}: FilterPanelProps) {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [category, setCategory] = useState<string>();
  const [status, setStatus] = useState<string>();

  const handleApply = () => {
    onFilterChange({ dateFrom, dateTo, category, status });
  };

  const handleReset = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCategory(undefined);
    setStatus(undefined);
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Filter className="h-4 w-4" />
        Filters:
      </div>

      {showDateRange && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
            </PopoverContent>
          </Popover>
        </>
      )}

      {showCategory && (
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat: string) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showStatus && (
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((stat: string) => (
              <SelectItem key={stat} value={stat}>
                {stat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button size="sm" onClick={handleApply}>
        Apply
      </Button>
      <Button size="sm" variant="ghost" onClick={handleReset}>
        <X className="h-4 w-4 mr-1" />
        Reset
      </Button>
    </div>
  );
}
