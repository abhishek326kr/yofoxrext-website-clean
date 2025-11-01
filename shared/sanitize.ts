/**
 * HTML Sanitization Utilities
 * 
 * Provides functions to sanitize HTML content to prevent XSS attacks
 * while preserving safe formatting for rich text descriptions.
 * 
 * Used for EA publishing form rich text editor content.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content for rich text descriptions
 * Allows safe formatting tags but removes scripts, iframes, and other dangerous content
 */
export function sanitizeRichTextHTML(html: string): string {
  if (!html) return '';
  
  // Configure DOMPurify to allow specific safe tags and attributes
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i',
      'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'style'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: true,
  });
  
  return clean;
}

/**
 * Strip all HTML tags and return plain text
 * Useful for generating meta descriptions from rich text
 */
export function stripHTML(html: string): string {
  if (!html) return '';
  
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // Remove extra whitespace and newlines
  return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Extract plain text excerpt from HTML (for previews, meta descriptions)
 */
export function extractTextExcerpt(html: string, maxLength: number = 155): string {
  const text = stripHTML(html);
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // Cut at the last complete word before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Count characters in HTML content (excluding tags)
 * Useful for character limit validation in rich text editors
 */
export function countTextCharacters(html: string): number {
  return stripHTML(html).length;
}

/**
 * Validate HTML content meets character requirements
 */
export function validateRichTextLength(html: string, min: number = 200, max: number = 2000): {
  isValid: boolean;
  length: number;
  message?: string;
} {
  const length = countTextCharacters(html);
  
  if (length < min) {
    return {
      isValid: false,
      length,
      message: `Description must be at least ${min} characters (currently ${length})`,
    };
  }
  
  if (length > max) {
    return {
      isValid: false,
      length,
      message: `Description must be at most ${max} characters (currently ${length})`,
    };
  }
  
  return { isValid: true, length };
}
