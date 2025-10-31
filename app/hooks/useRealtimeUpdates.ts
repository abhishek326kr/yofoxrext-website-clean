"use client";

import { useQuery } from '@tanstack/react-query';

interface RealtimeOptions {
  /**
   * Refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  interval?: number;
  
  /**
   * Whether to enable auto-refresh
   * @default true
   */
  enabled?: boolean;
}

/**
 * Custom hook for real-time data updates with automatic polling
 * 
 * @param queryKey - Unique identifier for the query (also used as endpoint path)
 * @param options - Configuration options for refresh interval and enable/disable
 * 
 * @example
 * ```tsx
 * const { data, isLoading, lastUpdated } = useRealtimeUpdates('/api/stats', { interval: 30000 });
 * ```
 */
export function useRealtimeUpdates<T = any>(
  queryKey: string,
  options: RealtimeOptions = {}
) {
  const { interval = 30000, enabled = true } = options;

  const query = useQuery<T>({
    queryKey: [queryKey],
    enabled,
    refetchInterval: interval,
    refetchIntervalInBackground: true,
    staleTime: interval / 2,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    lastUpdated: query.dataUpdatedAt > 0 ? new Date(query.dataUpdatedAt) : null,
    refetch: query.refetch,
  };
}
