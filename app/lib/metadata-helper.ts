import { Metadata } from 'next';
import { getMetadataWithSeoOverrides } from '@/lib/seo-overrides';

/**
 * Fetch SEO overrides from the database and merge with default metadata
 * 
 * @param pathname - The page URL path (e.g., '/forum', '/marketplace')
 * @param defaultMetadata - Fallback metadata if no overrides exist
 * @returns Merged metadata with overrides applied
 * 
 * Usage:
 * ```typescript
 * export async function generateMetadata(): Promise<Metadata> {
 *   return await getMetadataWithOverrides('/forum', {
 *     title: 'Forum | YoForex',
 *     description: 'Join the YoForex community forum',
 *   });
 * }
 * ```
 */
export async function getMetadataWithOverrides(
  pathname: string,
  defaultMetadata: Metadata = {}
): Promise<Metadata> {
  try {
    // Get overrides from database (via shared DB connection from lib/db.ts)
    const overrides = await getMetadataWithSeoOverrides(pathname);
    
    // If no overrides found, return defaults
    if (!overrides) {
      return defaultMetadata;
    }
    
    // Merge overrides with defaults - overrides take precedence
    return {
      ...defaultMetadata,
      ...overrides,
    };
  } catch (error) {
    console.error('[Metadata] Failed to load overrides for', pathname, error);
    // Always fallback to defaults on error to ensure pages still render
    return defaultMetadata;
  }
}
