import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Health check detection - ONLY respond to explicit health check endpoints
  // DO NOT detect based on IP addresses as Replit proxy uses internal IPs
  if (request.nextUrl.pathname === '/health') {
    return new NextResponse('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // For all other requests, continue normally
  return NextResponse.next();
}

// Only run middleware on health check endpoint
export const config = {
  matcher: [
    '/health',
  ],
};