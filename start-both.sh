#!/bin/bash

# Script to start both backend and frontend for CalAI app

echo "🚀 Starting CalAI - Backend + Frontend"
echo "====================================="

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    pkill -f "python main.py"
    pkill -f "expo start"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting Backend Server..."
cd "neocal_backend_ai_0336 2"
source venv/bin/activate
python main.py &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID) on http://localhost:8000"

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "📱 Starting Mobile Frontend..."
cd "../cai_mobile_app"
npx expo start --web &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID) on http://localhost:8081"

echo ""
echo "🎉 Both services are running!"
echo "   📊 Backend API: http://localhost:8000"
echo "   📱 Frontend Web: http://localhost:8081"
echo "   📱 Mobile App: Scan QR code in terminal with Expo Go"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
