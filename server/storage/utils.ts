import { randomUUID as cryptoRandomUUID } from "crypto";
import { 
  applySEOAutomations, 
  generateUniqueSlug, 
  generateThreadSlug, 
  generateReplySlug, 
  generateMetaDescription as seoGenerateMetaDescription, 
  extractFocusKeyword 
} from "../seo-engine";

/**
 * Calculate user level based on total coins
 * Level = floor(totalCoins / 1000)
 * Examples: 0 coins=level 0, 1000 coins=level 1, 2500 coins=level 2, 10000 coins=level 10
 */
export function calculateUserLevel(totalCoins: number): number {
  return Math.floor(totalCoins / 1000);
}

/**
 * Generate a random UUID
 */
export function randomUUID(): string {
  return cryptoRandomUUID();
}

/**
 * SEO Helper Functions - Re-exported from seo-engine
 */
export {
  applySEOAutomations,
  generateUniqueSlug,
  generateThreadSlug,
  generateReplySlug,
  extractFocusKeyword
};

/**
 * Generate SEO metadata description
 */
export function generateMetaDescription(text: string): string {
  return seoGenerateMetaDescription(text);
}
