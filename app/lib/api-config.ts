/**
 * Centralized API Configuration
 * 
 * This module provides runtime URL resolution for API calls across the application.
 * It eliminates hardcoded localhost URLs and uses environment variables for flexibility.
 * 
 * Architecture:
 * - Development: Next.js (3000) + Express (3001)
 * - Production VPS: NGINX proxy (80/443) → Next.js (3000) + Express (3001)
 * - Production Replit: Single Next.js server (5000) with API routes
 */

/**
 * Environment variable validation
 * Ensures required configuration is present at runtime
 * 
 * PRODUCTION SAFETY: Throws errors for missing critical variables
 * DEVELOPMENT: Allows fallbacks with warnings
 */
function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (typeof window === 'undefined') {
    // Server-side: require EXPRESS_URL in production
    if (!process.env.EXPRESS_URL) {
      if (isProduction) {
        throw new Error(
          '🚨 CRITICAL: EXPRESS_URL environment variable is required in production.\n' +
          'Please set it in your .env.production file.\n' +
          'Example: EXPRESS_URL=http://127.0.0.1:3001\n' +
          'For VPS deployment, see: VPS_DEPLOYMENT_GUIDE.md'
        );
      } else {
        console.warn(
          '⚠️  EXPRESS_URL not set, using development fallback: http://127.0.0.1:3001'
        );
      }
    }
  }

  // NEXT_PUBLIC_SITE_URL is required in production for SEO, OG tags, canonical URLs
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    if (isProduction) {
      throw new Error(
        '🚨 CRITICAL: NEXT_PUBLIC_SITE_URL environment variable is required in production.\n' +
        'Please set it in your .env.production file.\n' +
        'Example: NEXT_PUBLIC_SITE_URL=https://yourdomain.com\n' +
        'This is used for SEO metadata, Open Graph tags, and canonical URLs.'
      );
    } else {
      console.warn(
        '⚠️  NEXT_PUBLIC_SITE_URL not set, using development fallback: http://localhost:3000'
      );
    }
  }
}

// Run validation on module load
validateEnv();

/**
 * Get the API base URL for client-side requests
 * 
 * @returns API base URL accessible from the browser
 * 
 * Client-side behavior:
 * - Always returns empty string '' (uses relative URLs)
 * - Next.js rewrites handle /api/* → Express server routing
 * - No need for absolute URLs on client-side
 * 
 * Server-side behavior:
 * - Returns internal API URL (e.g., http://127.0.0.1:3001)
 * - Used for server-to-server communication
 * 
 * Usage in client components:
 * ```typescript
 * const apiUrl = getApiBaseUrl();
 * fetch(`${apiUrl}/api/stats`);  // Becomes: fetch('/api/stats')
 * ```
 */
export function getApiBaseUrl(): string {
  // Client-side: use relative URLs (NGINX/Next.js rewrites handle routing)
  if (typeof window !== 'undefined') {
    return '';
  }

  // Server-side: Use getInternalApiUrl which has production safety checks
  return getInternalApiUrl();
}

/**
 * Get the internal API URL for server-side requests
 * 
 * @returns Internal API URL for server-to-server communication
 * 
 * Usage in server components:
 * ```typescript
 * const apiUrl = getInternalApiUrl();
 * const response = await fetch(`${apiUrl}/api/stats`);
 * ```
 */
export function getInternalApiUrl(): string {
  // Server-side only
  if (typeof window !== 'undefined') {
    throw new Error('getInternalApiUrl() can only be called server-side');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const url = process.env.EXPRESS_URL;
  
  if (!url) {
    if (isProduction) {
      throw new Error(
        'EXPRESS_URL must be set in production. ' +
        'This is a critical configuration error that will prevent server-side API calls from working.'
      );
    }
    // Development fallback only
    const fallback = 'http://127.0.0.1:3001';
    console.log(`[API Config] Using development fallback: ${fallback}`);
    return fallback;
  }
  
  console.log(`[API Config] Internal API URL: ${url}`);
  return url;
}

/**
 * Get the public site URL
 * 
 * @returns Public-facing site URL (for SEO, OG tags, etc.)
 * 
 * Usage:
 * ```typescript
 * const siteUrl = getSiteUrl();
 * const canonical = `${siteUrl}/thread/${slug}`;
 * ```
 */
export function getSiteUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  
  if (!siteUrl) {
    if (isProduction) {
      throw new Error(
        'NEXT_PUBLIC_SITE_URL must be set in production. ' +
        'This is required for SEO, canonical URLs, and Open Graph tags.'
      );
    }
    // Development fallback
    return 'http://localhost:3000';
  }
  
  return siteUrl;
}

/**
 * Build a full API URL with path
 * 
 * @param path - API endpoint path (e.g., '/api/stats')
 * @returns Full API URL
 * 
 * Usage:
 * ```typescript
 * const url = buildApiUrl('/api/stats');
 * const response = await fetch(url);
 * ```
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * Configuration object for easy access
 */
export const apiConfig = {
  /**
   * API base URL (client or server appropriate)
   */
  baseUrl: getApiBaseUrl(),

  /**
   * Public site URL
   */
  siteUrl: getSiteUrl(),

  /**
   * Whether we're in production mode
   */
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * Whether we're in development mode
   */
  isDevelopment: process.env.NODE_ENV === 'development',

  /**
   * Express API URL (server-side only)
   */
  get expressUrl(): string {
    if (typeof window !== 'undefined') {
      throw new Error('expressUrl is only available server-side');
    }
    return getInternalApiUrl();
  },
} as const;

/**
 * Type-safe environment variable access
 * 
 * Note: NEXT_PUBLIC_EXPRESS_URL is not included as client-side code
 * uses relative URLs (/api/*) which are handled by Next.js rewrites.
 */
export const env = {
  // Server-side only
  EXPRESS_URL: process.env.EXPRESS_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,

  // Public (client-accessible)
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,

  // Node environment
  NODE_ENV: process.env.NODE_ENV,
} as const;

// Export helper for debugging
export function debugConfig() {
  if (typeof window === 'undefined') {
    console.log('🔧 API Configuration (Server-side):');
    console.log('  - Express URL:', env.EXPRESS_URL || 'NOT SET (using fallback)');
    console.log('  - Site URL:', getSiteUrl());
    console.log('  - API Base:', getApiBaseUrl());
  } else {
    console.log('🔧 API Configuration (Client-side):');
    console.log('  - Site URL:', env.NEXT_PUBLIC_SITE_URL || 'NOT SET');
    console.log('  - API Base:', getApiBaseUrl());
  }
}
