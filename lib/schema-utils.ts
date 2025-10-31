/**
 * Schema Utilities - Validation, Sanitization, and Field Mapping
 * 
 * Provides helper functions for Schema.org JSON-LD generation:
 * - URL normalization and validation
 * - HTML sanitization for schema fields
 * - Date formatting to ISO 8601
 * - Conditional property validation
 * - Schema quality checks
 */

/**
 * Convert relative URL to absolute URL
 * Handles http, https, protocol-relative (//), data, and mailto URLs
 * 
 * @param url - URL to convert (can be relative or absolute)
 * @param baseUrl - Base URL of the site
 * @returns Absolute URL or undefined if input is null/undefined
 */
export function toAbsoluteUrl(url: string | undefined | null, baseUrl: string): string | undefined {
  if (!url) return undefined;
  
  // Trim whitespace
  url = url.trim();
  
  // Already absolute (http or https)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Protocol-relative URL (//cdn.example.com/image.jpg)
  if (url.startsWith('//')) {
    return `https:${url}`; // Add https: protocol
  }
  
  // Data URLs (data:image/png;base64,...)
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Mailto URLs
  if (url.startsWith('mailto:')) {
    return url;
  }
  
  // Telephone URLs
  if (url.startsWith('tel:')) {
    return url;
  }
  
  // Relative URL starting with /
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  
  // Relative URL without leading slash
  return `${baseUrl}/${url}`;
}

/**
 * Validate and ensure image URL is absolute with proper formatting
 * Google recommends images be at least 1200px wide for optimal rich results
 * 
 * @param url - Image URL to validate
 * @param baseUrl - Base URL of the site
 * @returns Absolute image URL or undefined if input is null/undefined
 */
export function validateImageUrl(url: string | undefined | null, baseUrl: string): string | undefined {
  const absoluteUrl = toAbsoluteUrl(url, baseUrl);
  
  // Add size parameter for recommended 1200px width if it's from YoForex domain
  if (absoluteUrl && absoluteUrl.includes(baseUrl)) {
    // Add image optimization parameters if supported
    // This can be extended to add query params like ?w=1200 if image service supports it
    return absoluteUrl;
  }
  
  return absoluteUrl;
}

/**
 * Sanitize HTML content for schema articleBody
 * Removes HTML tags and normalizes whitespace
 * Relies on JSON.stringify for proper escaping
 * 
 * @param html - HTML content to sanitize
 * @returns Clean text suitable for schema.org or undefined if input is null/undefined
 */
export function sanitizeForSchema(html: string | undefined | null): string | undefined {
  if (!html) return undefined;
  
  // Strip HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
  
  // Normalize whitespace (but don't escape quotes - JSON.stringify handles that)
  text = text.replace(/\n/g, ' ')
            .replace(/\r/g, '')
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' '); // Collapse multiple spaces
  
  // Trim whitespace
  return text.trim();
}

/**
 * Convert database timestamp to ISO 8601 format
 * Schema.org requires ISO 8601 date format for all date fields
 * 
 * @param date - Date object or string to convert
 * @returns ISO 8601 formatted date string or undefined if invalid
 */
export function toISO8601(date: Date | string | undefined | null): string | undefined {
  if (!date) return undefined;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return undefined;
    }
    
    return dateObj.toISOString();
  } catch (e) {
    console.warn('[Schema Utils] Invalid date conversion:', date);
    return undefined;
  }
}

/**
 * Check if aggregateRating should be included
 * Google requires minimum 5 reviews for aggregateRating to be valid
 * 
 * @param reviewCount - Number of reviews
 * @returns True if rating should be included (>= 5 reviews)
 */
export function shouldIncludeRating(reviewCount: number): boolean {
  return reviewCount >= 5;
}

/**
 * Validate schema has all required properties before generation
 * Prevents generating invalid schemas that won't pass Google validation
 * 
 * @param schema - Schema object to validate
 * @param requiredProps - Array of required property names
 * @returns True if all required properties exist and are non-empty
 */
export function validateRequiredProperties(schema: any, requiredProps: string[]): boolean {
  return requiredProps.every(prop => {
    const value = schema[prop];
    
    // Check for nested properties (e.g., 'author.name')
    if (prop.includes('.')) {
      const parts = prop.split('.');
      let current = schema;
      for (const part of parts) {
        if (!current || current[part] === undefined || current[part] === null) {
          return false;
        }
        current = current[part];
      }
      return current !== '';
    }
    
    // Direct property check
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Get inLanguage property for schema.org
 * Currently defaults to 'en' but can be extended with language detection
 * 
 * @param content - Content to analyze (for future language detection)
 * @returns Language code (BCP 47 format)
 */
export function getLanguage(content?: string): string {
  // Future enhancement: Implement language detection
  // For now, default to English as primary platform language
  return 'en';
}

/**
 * Truncate text to specified length while preserving word boundaries
 * Useful for meta descriptions and schema descriptions
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string | undefined | null, maxLength: number): string | undefined {
  if (!text) return undefined;
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // Truncate at last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Calculate word count for articleBody
 * Used in Article and BlogPosting schemas
 * 
 * @param text - Text to count words in
 * @returns Number of words
 */
export function getWordCount(text: string | undefined | null): number {
  if (!text) return 0;
  
  // Remove extra whitespace and split on word boundaries
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
