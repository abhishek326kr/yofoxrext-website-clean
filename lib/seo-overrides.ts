import 'server-only';
import { db } from './db';
import { seoOverrides } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { Metadata } from 'next';

/**
 * Get SEO overrides for a specific page URL
 * This function works in Next.js SSR context using the shared DB connection
 */
export async function getSeoOverridesForPage(pageUrl: string) {
  try {
    const overrides = await db.select()
      .from(seoOverrides)
      .where(and(
        eq(seoOverrides.pageUrl, pageUrl),
        eq(seoOverrides.active, true)
      ))
      .limit(1);
    
    return overrides[0] || null;
  } catch (error) {
    console.error('[SEO Overrides] Failed to fetch for', pageUrl, error);
    return null;
  }
}

/**
 * Convert SEO overrides to Next.js Metadata format
 */
export async function getMetadataWithSeoOverrides(
  pageUrl: string
): Promise<Metadata | null> {
  const overrides = await getSeoOverridesForPage(pageUrl);
  
  if (!overrides) {
    return null;
  }
  
  const metadata: Metadata = {};
  
  if (overrides.title) {
    metadata.title = overrides.title;
  }
  
  if (overrides.metaDescription) {
    metadata.description = overrides.metaDescription;
  }
  
  if (overrides.canonical) {
    metadata.alternates = {
      canonical: overrides.canonical,
    };
  }
  
  if (overrides.viewport) {
    metadata.viewport = overrides.viewport;
  }
  
  if (overrides.robotsMeta) {
    metadata.robots = overrides.robotsMeta;
  }
  
  return metadata;
}
