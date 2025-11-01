import { db } from '../db';
import { seoOverrides } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export async function getSeoOverrides(pageUrl: string) {
  const overrides = await db.select()
    .from(seoOverrides)
    .where(and(
      eq(seoOverrides.pageUrl, pageUrl),
      eq(seoOverrides.active, true)
    ))
    .limit(1);
  
  return overrides[0] || null;
}

export async function getMetadataForPage(pageUrl: string) {
  const overrides = await getSeoOverrides(pageUrl);
  if (!overrides) return null;
  
  return {
    title: overrides.title || undefined,
    description: overrides.metaDescription || undefined,
    alternates: overrides.canonical ? {
      canonical: overrides.canonical
    } : undefined,
    viewport: overrides.viewport || undefined,
    robots: overrides.robotsMeta || undefined,
  };
}
