#!/bin/bash

# YoForex Hybrid Startup Script (Development Mode)
# Runs Express API (port 3001 internal) and Next.js frontend (port 5000 user-facing)

echo "🚀 Starting YoForex in Development Mode..."

# Start Express API server on port 3001 in background using tsx (for hot reload)
echo "📦 Starting Express API server (port 3001)..."
API_PORT=3001 NODE_ENV=development npx tsx server/index.ts &
EXPRESS_PID=$!

# Minimal wait for Express to bind port
sleep 2

# Start Next.js dev server on port 5000 (bind to 0.0.0.0 for Replit webview)
echo "⚡ Starting Next.js dev server (port 5000)..."
EXPRESS_URL=http://127.0.0.1:3001 npx next dev -p 5000 -H 0.0.0.0 &
NEXTJS_PID=$!

echo "✅ Development servers started:"
echo "   - Express API: http://localhost:3001/api/* (internal)"
echo "   - Next.js App: http://localhost:5000 (user-facing)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C to kill both processes
trap "echo '⏹️  Stopping servers...'; kill $EXPRESS_PID $NEXTJS_PID; exit" SIGINT SIGTERM

# Wait for both processes
wait
