#!/bin/bash

# ==========================================
# 🍎 CALAI - Simple Local Start
# ==========================================
# Just run backend + web frontend locally

set -e

echo "🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎"
echo "🍎                                                                          🍎"
echo "🍎                    🍎🍎🍎  CALAI LOCAL  🍎🍎🍎                     🍎"
echo "🍎                                                                          🍎"
echo "🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎"

# Kill any existing processes
echo "🧹 Cleaning up..."
pkill -f "python main.py" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
sleep 2

# Set local backend URL
echo "🔗 Setting local backend URL..."
echo "EXPO_PUBLIC_BACKEND_URL=http://localhost:8000" > cai_mobile_app/.env

# Start backend
echo "🔧 Starting backend..."
cd "neocal_backend_ai_0336 2"
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
for i in {1..10}; do
    if curl -s "http://localhost:8000/health" >/dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "   Attempt $i/10..."
    sleep 2
done

if ! curl -s "http://localhost:8000/health" >/dev/null 2>&1; then
    echo "❌ Backend failed to start. Check if virtual environment is set up:"
    echo "   cd 'neocal_backend_ai_0336 2' && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Start mobile app in web mode
echo "📱 Starting mobile app (web)..."
cd cai_mobile_app
echo ""
echo "🎉🎉🎉 CALAI IS READY! 🎉🎉🎉"
echo ""
echo "🌐 Open in browser: http://localhost:8081"
echo ""
echo "📱 Features:"
echo "   • AI food image analysis"
echo "   • Nutrition tracking"
echo "   • User authentication"
echo ""
echo "🛑 Press Ctrl+C to stop"
echo ""

npm start -- --web &
MOBILE_PID=$!

# Cleanup on exit
trap 'echo ""; echo "🛑 Stopping..."; kill $BACKEND_PID $MOBILE_PID 2>/dev/null || true; exit 0' INT

# Wait
wait
