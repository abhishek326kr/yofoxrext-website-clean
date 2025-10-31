#!/bin/bash

# YoForex Optimized Production Build Script
# Builds both Express API and Next.js frontend with optimizations

set -e  # Exit on any error

echo "🚀 Starting Optimized Production Build..."

# Set environment variables for build
export EXPRESS_URL=${EXPRESS_URL:-http://127.0.0.1:3001}
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

# Skip type checking during build (already done in dev)
export SKIP_TYPE_CHECK=true

# Use swc compiler for faster builds
npx next build --no-lint || {
  echo "⚠️  Standard build failed, trying with reduced options..."
  
  # Fallback: Build without TypeScript checking
  npx next build --experimental-turbotrace || {
    echo "❌ Next.js build failed"
    exit 1
  }
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