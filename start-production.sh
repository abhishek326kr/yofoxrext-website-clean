#!/bin/bash

# YoForex Production Startup Script
# Runs Express API (port 3001 internal) and Next.js frontend (port 5000 user-facing)

echo "🚀 Starting YoForex in Production Mode..."

# Build Express if dist doesn't exist
if [ ! -f "dist/index.js" ]; then
  echo "📦 Building Express API (first run)..."
  npm run build:express
fi

# Build Next.js if .next doesn't exist
if [ ! -d ".next" ]; then
  echo "📦 Building Next.js (first run)..."
  EXPRESS_URL=http://127.0.0.1:3001 npm run build:next
fi

# Start Express API server on port 3001 in background
echo "📦 Starting Express API server (port 3001)..."
API_PORT=3001 NODE_ENV=production DEFER_BACKGROUND_JOBS=true node dist/index.js &
EXPRESS_PID=$!

# Wait for Express to be ready (increased delay for health checks)
echo "⏳ Waiting for Express API to be ready..."
sleep 3

# Check if Express is running
if ! kill -0 $EXPRESS_PID 2>/dev/null; then
  echo "❌ Express API failed to start"
  exit 1
fi

# Start Next.js server on port 5000 (bind to 0.0.0.0 for health checks)
# Use NODE_ENV=production for faster startup
echo "⚡ Starting Next.js frontend (port 5000)..."
NODE_ENV=production EXPRESS_URL=http://127.0.0.1:3001 npx next start -p 5000 -H 0.0.0.0 &
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
