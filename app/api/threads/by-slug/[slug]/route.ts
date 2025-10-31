/**
 * API Endpoint: Get Thread by Slug
 * 
 * Returns a single thread by its slug
 * Used by hierarchical URL system to resolve thread pages
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
    const response = await fetch(`${apiUrl}/api/threads/slug/${slug}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    const thread = await response.json();
    return NextResponse.json(thread);
  } catch (error: any) {
    console.error('[API] Error fetching thread by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}
