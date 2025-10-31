/**
 * SchemaGenerator Component
 * 
 * Automatically injects Schema.org JSON-LD structured data into page <head>
 * Supports all major schema types and validates before rendering
 */

'use client';

import { useEffect } from 'react';

interface SchemaGeneratorProps {
  schema: any | any[]; // Single schema or array of schemas
  validate?: boolean; // Enable client-side validation (dev mode)
}

export default function SchemaGenerator({ schema, validate = false }: SchemaGeneratorProps) {
  useEffect(() => {
    if (validate && process.env.NODE_ENV === 'development') {
      console.log('[Schema Validation]', schema);
      
      // Basic validation
      const schemas = Array.isArray(schema) ? schema : [schema];
      schemas.forEach((s, idx) => {
        if (!s['@context']) {
          console.warn(`[Schema Warning] Missing @context in schema ${idx}`);
        }
        if (!s['@type']) {
          console.warn(`[Schema Warning] Missing @type in schema ${idx}`);
        }
      });
    }
  }, [schema, validate]);

  // Render JSON-LD script tag
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, process.env.NODE_ENV === 'development' ? 2 : 0),
      }}
    />
  );
}

/**
 * Server-side schema injection (use in Server Components)
 */
export function SchemaScript({ schema }: { schema: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
