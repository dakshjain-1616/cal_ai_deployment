#!/bin/bash

# ==========================================
# Stop CalAI Services Script
# ==========================================
# This script stops all running CalAI services

echo "🛑 Stopping CalAI services..."

# Kill backend processes
echo "🔧 Stopping backend..."
pkill -f "python main.py" 2>/dev/null || true

# Kill mobile app processes
echo "📱 Stopping mobile app..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 2

# Check if any processes are still running
BACKEND_RUNNING=$(pgrep -f "python main.py" | wc -l)
MOBILE_RUNNING=$(pgrep -f "expo start" | wc -l)

if [ "$BACKEND_RUNNING" -eq 0 ] && [ "$MOBILE_RUNNING" -eq 0 ]; then
    echo "✅ All services stopped successfully"
else
    echo "⚠️  Some processes may still be running. Use 'pkill -9 python' or 'pkill -9 expo' if needed."
fi

echo ""
echo "📋 To restart services:"
echo "   ./setup-and-run.sh"
echo ""
echo "📋 To restart with custom IP:"
echo "   ./setup-and-run.sh --ip YOUR_IP_ADDRESS"
