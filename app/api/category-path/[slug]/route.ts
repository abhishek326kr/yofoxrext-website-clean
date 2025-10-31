/**
 * API Endpoint: Get Category Path
 * 
 * Returns the full hierarchical path for a given category slug
 * Used by client components to generate hierarchical URLs
 * 
 * Example:
 * GET /api/category-path/xauusd-scalping
 * Response: { path: "trading-strategies/scalping-m1-m15/xauusd-scalping" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCategoryPath } from '@/lib/category-path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const path = await getCategoryPath(slug);
    
    return NextResponse.json({
      slug,
      path,
      success: true,
    });
  } catch (error) {
    console.error('[API] Error getting category path:', error);
    return NextResponse.json(
      { error: 'Failed to get category path' },
      { status: 500 }
    );
  }
}
