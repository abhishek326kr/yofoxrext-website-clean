#!/bin/bash

# YoForex Next.js-Only Server Startup Script
# Runs Express API (port 3001 internal) and Next.js frontend (port 5000 user-facing)

# STEP 1: Auto-detect and fix fresh GitHub imports
if [ -f "scripts/auto-setup.sh" ]; then
    bash scripts/auto-setup.sh
fi

echo "🚀 Starting YoForex (Next.js-Only Architecture)..."

# Start Express API server on port 3001 in background
echo "📦 Starting Express API server (port 3001)..."
API_PORT=3001 NODE_ENV=development tsx server/index.ts &
EXPRESS_PID=$!

# Wait a moment for Express to initialize
sleep 3

# Start Next.js server on port 5000 (required by Replit for webview)
echo "⚡ Starting Next.js frontend (port 5000)..."
npx next dev -p 5000 &
NEXTJS_PID=$!

echo "✅ Both servers started:"
echo "   - Express API: http://localhost:3001/api/* (internal)"
echo "   - Next.js App: http://localhost:5000 (user-facing)"
echo ""
echo "🎯 Browse to: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C to kill both processes
trap "echo '⏹️  Stopping servers...'; kill $EXPRESS_PID $NEXTJS_PID; exit" SIGINT SIGTERM

# Wait for both processes
wait
