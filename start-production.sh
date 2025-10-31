#!/bin/bash

# YoForex Production Startup Script
# Runs Express API (port 3001 internal) and Next.js frontend (port 5000 user-facing)

echo "🚀 Starting YoForex in Production Mode..."

# Fail fast if builds don't exist
echo "🔍 Verifying production builds..."

if [ ! -f "dist/index.js" ]; then
  echo "❌ ERROR: Express build missing (dist/index.js not found)"
  echo "   The build phase should have created this file"
  echo "   Please check build logs for errors"
  exit 1
fi

if [ ! -d ".next" ]; then
  echo "❌ ERROR: Next.js build missing (.next directory not found)"
  echo "   The build phase should have created this directory"
  echo "   Please check build logs for errors"
  exit 1
fi

# Additional verification for Next.js build integrity
if [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ ERROR: Next.js build appears incomplete (BUILD_ID missing)"
  echo "   The .next directory exists but seems corrupted"
  echo "   Please rebuild the application"
  exit 1
fi

echo "✅ Production builds verified"

# Set environment variables
export EXPRESS_URL=${EXPRESS_URL:-http://127.0.0.1:3001}
export NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://$REPL_SLUG.$REPL_OWNER.repl.co}
export NODE_ENV=production

# Log environment for debugging
echo "📋 Environment Configuration:"
echo "   EXPRESS_URL=$EXPRESS_URL"
echo "   NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL"
echo "   NODE_ENV=$NODE_ENV"

# Start Express API server on port 3001 in background
echo "📦 Starting Express API server (port 3001)..."
API_PORT=3001 DEFER_BACKGROUND_JOBS=true node dist/index.js &
EXPRESS_PID=$!

# Wait for Express to be ready (increased delay for health checks)
echo "⏳ Waiting for Express API to be ready..."
sleep 5

# Check if Express is running
if ! kill -0 $EXPRESS_PID 2>/dev/null; then
  echo "❌ Express API failed to start"
  exit 1
fi

# Verify Express health
curl -f http://127.0.0.1:3001/api/health || {
  echo "❌ Express health check failed"
  kill $EXPRESS_PID
  exit 1
}
echo "✅ Express API is healthy"

# Start Next.js server on port 5000 (bind to 0.0.0.0 for Autoscale Deployments)
echo "⚡ Starting Next.js frontend (port 5000)..."
echo "   Binding to 0.0.0.0:5000 for external access"
npx next start -p 5000 -H 0.0.0.0 &
NEXTJS_PID=$!

# Wait for Next.js to be ready
echo "⏳ Waiting for Next.js to be ready..."
sleep 8

# Check if Next.js is running
if ! kill -0 $NEXTJS_PID 2>/dev/null; then
  echo "❌ Next.js failed to start"
  kill $EXPRESS_PID
  exit 1
fi

# Verify Next.js health (check root endpoint)
MAX_RETRIES=5
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f -s http://127.0.0.1:5000/ > /dev/null 2>&1; then
    echo "✅ Next.js is healthy and responding"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
      echo "❌ Next.js health check failed after $MAX_RETRIES attempts"
      echo "   The application may not be responding correctly"
      kill $EXPRESS_PID $NEXTJS_PID
      exit 1
    fi
    echo "   Retry $RETRY_COUNT/$MAX_RETRIES - waiting 3 seconds..."
    sleep 3
  fi
done

echo "✅ Production servers started and healthy:"
echo "   - Express API: http://localhost:3001/api/* (internal)"
echo "   - Next.js App: http://localhost:5000 (user-facing)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C to kill both processes
trap "echo '⏹️  Stopping servers...'; kill $EXPRESS_PID $NEXTJS_PID; exit" SIGINT SIGTERM

# Wait for both processes
wait
