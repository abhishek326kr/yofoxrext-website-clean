#!/bin/bash

# YoForex Production Build Script
# Builds both Express API and Next.js frontend with proper error handling

set -e  # Exit on any error

echo "🚀 Starting Production Build..."

# Set environment variables for build
export EXPRESS_URL=http://127.0.0.1:3001
export NODE_ENV=production

# Build Express API
echo "📦 Building Express API..."
npm run build:express
if [ ! -f "dist/index.js" ]; then
  echo "❌ Express build failed - dist/index.js not found"
  exit 1
fi
echo "✅ Express API built successfully"

# Build Next.js
echo "📦 Building Next.js frontend..."
npm run build:next || {
  echo "❌ Next.js build failed"
  exit 1
}
if [ ! -d ".next" ]; then
  echo "❌ Next.js build failed - .next directory not found"
  exit 1
fi
echo "✅ Next.js built successfully"

echo "✅ Production build completed successfully!"