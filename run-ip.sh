#!/bin/bash

# ==========================================
# 🍎 CALAI - IP Backend Mode (Working!)
# ==========================================
# Uses IP address for backend connection

set -e

echo "🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎"
echo "🍎                                                                          🍎"
echo "🍎                  🍎🍎🍎  CALAI IP MODE  🍎🍎🍎                   🍎"
echo "🍎                                                                          🍎"
echo "🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎"

# Function to detect local IP
detect_ip() {
    if command -v ip >/dev/null 2>&1; then
        IP=$(ip route get 8.8.8.8 | awk '{print $7}' | head -1)
    elif command -v ifconfig >/dev/null 2>&1; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    else
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    fi

    if [[ ! $IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "❌ Could not detect valid local IP address"
        exit 1
    fi

    echo "$IP"
}

# Kill any existing processes
echo "🧹 Cleaning up..."
pkill -f "python main.py" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
sleep 2

# Detect IP
echo "🔍 Detecting your local IP..."
LOCAL_IP=$(detect_ip)
echo "📡 Your IP: $LOCAL_IP"

# Set backend URL to IP address
echo "🔗 Setting backend URL to IP: $LOCAL_IP"
echo "EXPO_PUBLIC_BACKEND_URL=http://$LOCAL_IP:8000" > cai_mobile_app/.env

# Start backend
echo "🔧 Starting backend on $LOCAL_IP:8000..."
cd "neocal_backend_ai_0336 2"
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "⏳ Waiting for backend..."
for i in {1..15}; do
    if curl -s "http://$LOCAL_IP:8000/health" >/dev/null 2>&1; then
        echo "✅ Backend is ready on http://$LOCAL_IP:8000!"
        break
    fi
    echo "   Attempt $i/15..."
    sleep 2
done

if ! curl -s "http://$LOCAL_IP:8000/health" >/dev/null 2>&1; then
    echo "❌ Backend failed to start"
    exit 1
fi

# Start mobile app
echo "📱 Starting mobile app..."
cd cai_mobile_app
echo ""
echo "🎉🎉🎉 CALAI IS RUNNING! 🎉🎉🎉"
echo ""
echo "📊 Backend: http://$LOCAL_IP:8000"
echo "🌐 Web App: http://localhost:8081"
echo ""
echo "📱 For mobile testing:"
echo "   1. Make sure your phone is on the same network as this computer"
echo "   2. Open Expo Go app on phone"
echo "   3. Scan QR code above, or manually enter: exp://$LOCAL_IP:8081"
echo ""
echo "🛑 Press Ctrl+C to stop"
echo ""

npm start &
MOBILE_PID=$!

# Cleanup on exit
trap 'echo ""; echo "🛑 Stopping..."; kill $BACKEND_PID $MOBILE_PID 2>/dev/null || true; exit 0' INT

wait
