import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiBaseUrl, buildApiUrl } from "./api-config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use centralized API config (no hardcoded URLs)
  const fullUrl = url.startsWith('http') ? url : buildApiUrl(url);
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  baseUrl?: string;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, baseUrl }) =>
  async ({ queryKey }) => {
    // CRITICAL FIX: Only use the first element as the URL
    // queryKey format: ["/api/endpoint", ...cacheKeys]
    // The rest are for React Query caching/invalidation, not URL building
    const endpoint = queryKey[0] as string;
    const url = baseUrl 
      ? `${baseUrl}${endpoint}`
      : endpoint;
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// CRITICAL FIX: Don't set baseUrl at module load time!
// The issue: getApiBaseUrl() is called during module initialization, which happens on the server
// during SSR. This means EXPRESS_API_URL gets set to the server URL (http://127.0.0.1:3001)
// and that value is baked into the client bundle, causing client-side queries to fail.
//
// Solution: Use relative URLs (no baseUrl) which works with Next.js rewrites.
// Client-side queries will use paths like '/api/stats' instead of absolute server URLs.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }), // No baseUrl - use relative URLs
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
