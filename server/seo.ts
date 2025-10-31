import slugify from 'slugify';
import { db } from './db';
import { content, forumThreads, forumReplies } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate URL-friendly slug from title
 * Handles collision by appending numbers
 */
export async function generateSlug(
  title: string,
  table: 'content' | 'thread' | 'reply'
): Promise<string> {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  }).substring(0, 60);

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await checkSlugExists(slug, table);
    if (!exists) break;
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function checkSlugExists(slug: string, table: 'content' | 'thread' | 'reply'): Promise<boolean> {
  if (table === 'content') {
    const results = await db.select({ slug: content.slug }).from(content).where(eq(content.slug, slug)).limit(1);
    return results.length > 0;
  } else if (table === 'thread') {
    const results = await db.select({ slug: forumThreads.slug }).from(forumThreads).where(eq(forumThreads.slug, slug)).limit(1);
    return results.length > 0;
  } else {
    const results = await db.select({ slug: forumReplies.slug }).from(forumReplies).where(eq(forumReplies.slug, slug)).limit(1);
    return results.length > 0;
  }
}

/**
 * Extract focus keyword from title
 * Takes first 2-3 meaningful words
 */
export function generateFocusKeyword(title: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);

  return words.slice(0, 3).join(' ');
}

/**
 * Generate meta description from content
 * Max 155 characters for Google snippet
 */
export function generateMetaDescription(text: string): string {
  const plainText = text
    .replace(/[#*_`~]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (plainText.length <= 155) return plainText;

  const truncated = plainText.substring(0, 152);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return truncated.substring(0, lastSpace) + '...';
}

/**
 * Generate unique alt texts for images
 */
export function generateImageAltTexts(
  title: string,
  imageCount: number
): string[] {
  const base = slugify(title, { lower: true });
  const alts: string[] = [];

  for (let i = 0; i < imageCount; i++) {
    if (i === 0) {
      alts.push(`${base} screenshot`);
    } else if (i === 1) {
      alts.push(`${base} interface view`);
    } else if (i === 2) {
      alts.push(`${base} settings panel`);
    } else {
      alts.push(`${base} image ${i + 1}`);
    }
  }

  return alts;
}

/**
 * Generate Schema.org JSON-LD structured data
 */
export function generateSchemaOrg(data: {
  type: 'SoftwareApplication' | 'Article' | 'Question';
  name: string;
  description: string;
  author: string;
  datePublished: Date;
  price?: number;
}): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': data.type,
    name: data.name,
    description: data.description,
    author: {
      '@type': 'Person',
      name: data.author,
    },
    datePublished: data.datePublished.toISOString(),
    ...(data.price !== undefined && {
      offers: {
        '@type': 'Offer',
        price: data.price,
        priceCurrency: 'COINS',
      },
    }),
  };

  return JSON.stringify(schema);
}
