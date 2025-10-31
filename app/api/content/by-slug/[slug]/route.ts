/**
 * API Endpoint: Get Content by Slug
 * 
 * Returns a single marketplace content item by its slug
 * Used by hierarchical URL system to resolve content pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiUrl } from '@/lib/api-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // Forward to the backend Express API
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/api/content/slug/${slug}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }
    
    const content = await response.json();
    return NextResponse.json(content);
  } catch (error: any) {
    console.error('[API] Error fetching content by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
