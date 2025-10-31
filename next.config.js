/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Environment variables (NO DEFAULTS - must be set in production)
  env: {
    EXPRESS_URL: process.env.EXPRESS_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  // Server actions
  experimental: {
    serverActions: {
      // Dynamic allowed origins from environment
      allowedOrigins: [
        'localhost:3000', 
        'localhost:5000', 
        'localhost:3001',
        ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
      ],
    },
  },

  // Proxy API requests to Express server
  // In VPS: NGINX handles routing, so this is for local dev only
  // In production: NGINX routes /api/* → Express:3001 externally
  async rewrites() {
    const expressUrl = process.env.EXPRESS_URL;
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!expressUrl) {
      if (isProduction) {
        throw new Error(
          '🚨 CRITICAL: EXPRESS_URL environment variable is required for production deployment.\n' +
          'Set it in your .env.production file.\n' +
          'Example: EXPRESS_URL=http://127.0.0.1:3001\n' +
          'For VPS deployment, see: VPS_DEPLOYMENT_GUIDE.md'
        );
      }
      // Development fallback only (matches api-config.ts)
      console.warn('⚠️  EXPRESS_URL not set, using development fallback: http://127.0.0.1:3001');
      return [{
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/api/:path*',
      }];
    }
    
    return [{
      source: '/api/:path*',
      destination: `${expressUrl}/api/:path*`,
    }];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Redirects for old routes (if needed)
  async redirects() {
    return [];
  },
};

export default nextConfig;
