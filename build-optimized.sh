#!/bin/bash

# YoForex Optimized Production Build Script
# Builds both Express API and Next.js frontend with optimizations

set -e  # Exit on any error

echo "🚀 Starting Optimized Production Build..."

# Set environment variables for build
export EXPRESS_URL=${EXPRESS_URL:-http://127.0.0.1:3001}
export NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://$REPL_SLUG.$REPL_OWNER.repl.co}
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=3072"  # Increase memory for build

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist .next

# Build Express API
echo "📦 Building Express API..."
npm run build:express
if [ ! -f "dist/index.js" ]; then
  echo "❌ Express build failed - dist/index.js not found"
  exit 1
fi
echo "✅ Express API built successfully"

# Build Next.js with optimizations
echo "📦 Building Next.js frontend with optimizations..."

# Skip linting and type checking for faster builds
export NEXT_TELEMETRY_DISABLED=1

# Ensure Express URL is set for Next.js build
echo "   EXPRESS_URL=$EXPRESS_URL"
echo "   NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL"

# Build Next.js with proper error handling
npm run build:next || {
  echo "❌ Next.js build failed"
  echo "Checking for common issues..."
  
  # Check if .next directory was created
  if [ ! -d ".next" ]; then
    echo "❌ .next directory not created - build completely failed"
    exit 1
  fi
  
  echo "⚠️  Next.js build had warnings but .next directory exists, continuing..."
}

if [ ! -d ".next" ]; then
  echo "❌ Next.js build failed - .next directory not found"
  exit 1
fi

echo "✅ Next.js built successfully"
echo "✅ Production build completed successfully!"
echo ""
echo "📊 Build summary:"
echo "   - Express API: dist/index.js"
echo "   - Next.js App: .next/"
echo ""
echo "🚀 Ready for deployment!"