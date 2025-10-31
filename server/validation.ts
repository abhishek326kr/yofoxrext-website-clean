import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

/**
 * Input Validation & Security Module
 * 
 * This module provides comprehensive input validation and sanitization
 * to prevent XSS attacks, SQL injection, and invalid data.
 */

// ============================================================================
// XSS Protection
// ============================================================================

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes malicious scripts while preserving safe HTML
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
  });
}

/**
 * Strip all HTML tags - for plain text fields
 */
export function stripHtml(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

// ============================================================================
// String Validation
// ============================================================================

export const StringLimits = {
  USERNAME: { min: 3, max: 30 },
  EMAIL: { min: 5, max: 255 },
  PASSWORD: { min: 8, max: 100 },
  TITLE: { min: 10, max: 300 },
  SHORT_DESCRIPTION: { min: 10, max: 500 },
  LONG_DESCRIPTION: { min: 50, max: 50000 },
  COMMENT: { min: 1, max: 2000 },
  URL: { min: 10, max: 500 },
  SLUG: { min: 3, max: 200 },
  KEYWORD: { min: 3, max: 100 },
  META_DESCRIPTION: { min: 50, max: 160 },
} as const;

/**
 * Validate string length with proper error messages
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  limits: { min: number; max: number }
): { valid: boolean; error?: string } {
  if (value.length < limits.min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${limits.min} characters`,
    };
  }
  if (value.length > limits.max) {
    return {
      valid: false,
      error: `${fieldName} must be at most ${limits.max} characters`,
    };
  }
  return { valid: true };
}

// ============================================================================
// Numeric Validation
// ============================================================================

/**
 * Validate that a number is positive (> 0)
 */
export function validatePositive(value: number, fieldName: string): { valid: boolean; error?: string } {
  if (value <= 0) {
    return {
      valid: false,
      error: `${fieldName} must be positive`,
    };
  }
  return { valid: true };
}

/**
 * Validate that a number is non-negative (>= 0)
 */
export function validateNonNegative(value: number, fieldName: string): { valid: boolean; error?: string } {
  if (value < 0) {
    return {
      valid: false,
      error: `${fieldName} cannot be negative`,
    };
  }
  return { valid: true };
}

/**
 * Validate coin amount - must be positive integer
 */
export function validateCoinAmount(amount: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(amount)) {
    return {
      valid: false,
      error: "Coin amount must be an integer",
    };
  }
  if (amount <= 0) {
    return {
      valid: false,
      error: "Coin amount must be positive",
    };
  }
  if (amount > 1000000) {
    return {
      valid: false,
      error: "Coin amount cannot exceed 1,000,000",
    };
  }
  return { valid: true };
}

/**
 * Validate user has sufficient coins
 */
export function validateSufficientCoins(
  userBalance: number,
  requiredAmount: number
): { valid: boolean; error?: string } {
  if (userBalance < requiredAmount) {
    return {
      valid: false,
      error: `Insufficient coins. You have ${userBalance} coins but need ${requiredAmount}`,
    };
  }
  return { valid: true };
}

/**
 * Validate price - must be positive integer between 0 and 1M
 */
export function validatePrice(price: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(price)) {
    return {
      valid: false,
      error: "Price must be an integer",
    };
  }
  if (price < 0) {
    return {
      valid: false,
      error: "Price cannot be negative",
    };
  }
  if (price > 1000000) {
    return {
      valid: false,
      error: "Price cannot exceed 1,000,000 coins",
    };
  }
  return { valid: true };
}

// ============================================================================
// Enum Validation
// ============================================================================

/**
 * Validate that a value is in an allowed set
 */
export function validateEnum<T extends string>(
  value: T,
  allowedValues: readonly T[],
  fieldName: string
): { valid: boolean; error?: string } {
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
    };
  }
  return { valid: true };
}

// ============================================================================
// Combined Validation Helper
// ============================================================================

/**
 * Run multiple validators and return first error
 */
export function runValidators(...validators: { valid: boolean; error?: string }[]): { valid: boolean; error?: string } {
  for (const result of validators) {
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
}

// ============================================================================
// Request Body Sanitization
// ============================================================================

/**
 * Sanitize a request body object recursively
 * Strips HTML from string fields to prevent XSS
 */
export function sanitizeRequestBody(body: any, htmlFields: string[] = []): any {
  if (typeof body !== 'object' || body === null) {
    return body;
  }

  const sanitized: any = Array.isArray(body) ? [] : {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      // If this field should allow HTML, sanitize it; otherwise strip all HTML
      sanitized[key] = htmlFields.includes(key) ? sanitizeHtml(value) : stripHtml(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestBody(value, htmlFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
