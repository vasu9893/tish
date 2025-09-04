#!/bin/bash

echo "🔍 InstantChat Server Debug Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "server/server.js" ]; then
    echo "❌ Error: server/server.js not found. Are you in the right directory?"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "📁 Contents:"
ls -la

echo ""
echo "📦 Checking Node.js version:"
node --version
npm --version

echo ""
echo "📋 Checking environment variables:"
echo "- NODE_ENV: ${NODE_ENV:-'NOT SET'}"
echo "- PORT: ${PORT:-'NOT SET'}"
echo "- MONGODB_URI: ${MONGODB_URI:+SET}"
echo "- JWT_SECRET: ${JWT_SECRET:+SET}"

echo ""
echo "🔍 Running debug script..."
node debug-server.js

echo ""
echo "🧪 Testing simplified server..."
node test-server.js &
TEST_PID=$!

# Wait a bit for server to start
sleep 3

# Test the server
echo "📡 Testing server endpoints..."
curl -s http://localhost:3001/health || echo "❌ Health check failed"
curl -s http://localhost:3001/test || echo "❌ Test endpoint failed"

# Kill test server
kill $TEST_PID 2>/dev/null

echo ""
echo "🚀 Starting main server..."
cd server
npm run dev
