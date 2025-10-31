#!/bin/bash

# YoForex Production Startup Script
# Runs Express API (port 3001 internal) and Next.js frontend (port 5000 user-facing)

echo "🚀 Starting YoForex in Production Mode..."

# Set environment variables
export EXPRESS_URL=${EXPRESS_URL:-http://127.0.0.1:3001}
export NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://$REPL_SLUG.$REPL_OWNER.repl.co}
export NODE_ENV=production

# Build Express if dist doesn't exist
if [ ! -f "dist/index.js" ]; then
  echo "📦 Building Express API (first run)..."
  npm run build:express
fi

# Build Next.js if .next doesn't exist
if [ ! -d ".next" ]; then
  echo "📦 Building Next.js (first run)..."
  npm run build:next
fi

# Verify builds exist
if [ ! -f "dist/index.js" ]; then
  echo "❌ Express build missing - running build..."
  npm run build:express || exit 1
fi

if [ ! -d ".next" ]; then
  echo "❌ Next.js build missing - running build..."
  npm run build:next || exit 1
fi

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

echo "✅ Production servers started:"
echo "   - Express API: http://localhost:3001/api/* (internal)"
echo "   - Next.js App: http://localhost:5000 (user-facing)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C to kill both processes
trap "echo '⏹️  Stopping servers...'; kill $EXPRESS_PID $NEXTJS_PID; exit" SIGINT SIGTERM

# Wait for both processes
wait
