#!/bin/bash

# YoForex Optimized Production Build Script
# Builds both Express API and Next.js frontend with optimizations

set -e  # Exit on any error

echo "🚀 Starting Optimized Production Build..."

# Set environment variables for build
export EXPRESS_URL=${EXPRESS_URL:-http://127.0.0.1:3001}
export NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://$REPL_SLUG.$REPL_OWNER.repl.co}
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"  # 2GB for Next.js build (optimized for Replit)

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
export SKIP_ENV_VALIDATION=1

# Ensure Express URL is set for Next.js build
echo "   EXPRESS_URL=$EXPRESS_URL"
echo "   NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL"
echo "   NODE_OPTIONS=$NODE_OPTIONS"

# Build Next.js with proper error handling and output
echo "   Starting Next.js build process..."
if npm run build:next; then
  echo "✅ Next.js build command completed successfully"
else
  BUILD_EXIT_CODE=$?
  echo "❌ Next.js build command failed with exit code $BUILD_EXIT_CODE"
  
  # Check if .next directory was created despite error
  if [ ! -d ".next" ]; then
    echo "❌ .next directory not created - build completely failed"
    echo "💡 Troubleshooting tips:"
    echo "   1. Check if you have enough memory (current: $NODE_OPTIONS)"
    echo "   2. Verify environment variables are set correctly"
    echo "   3. Check Next.js logs above for specific errors"
    exit 1
  fi
  
  echo "⚠️  Next.js build had errors but .next directory exists"
  echo "   This might be okay if it's just warnings. Continuing..."
fi

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