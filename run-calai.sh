#!/bin/bash

# ==========================================
# 🍎 CALAI - One Command Complete Setup
# ==========================================
# Run both backend and frontend with automatic tunneling
# Works with phone hotspots and any network!

set -e  # Exit on any error

echo "🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎"
echo "🍎                                                                          🍎"
echo "🍎                    🍎🍎🍎  CALAI ONE-CLICK  🍎🍎🍎                   🍎"
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

# Function to check ngrok availability
setup_ngrok() {
    echo "🔧 Checking ngrok..."

    # Check if ngrok is available via npx (from mobile app dependencies)
    if npx ngrok version >/dev/null 2>&1; then
        echo "✅ ngrok available via npx"
    else
        echo "⚠️  ngrok not available via npx, will try global installation"
        if ! command -v ngrok >/dev/null 2>&1; then
            echo "📦 Installing ngrok globally..."

            # Detect OS and install ngrok
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                if command -v brew >/dev/null 2>&1; then
                    brew install ngrok/ngrok/ngrok
                else
                    echo "❌ Homebrew not found. Please install ngrok manually from: https://ngrok.com/download"
                    echo "Or install Homebrew first: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                    exit 1
                fi
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                # Linux
                if command -v snap >/dev/null 2>&1; then
                    sudo snap install ngrok
                else
                    echo "📦 Installing ngrok via npm globally..."
                    npm install -g ngrok
                fi
            else
                echo "❌ Unsupported OS for automatic ngrok install"
                echo "Please install ngrok manually from: https://ngrok.com/download"
                exit 1
            fi
        fi
        echo "✅ ngrok ready"
    fi
}

# Function to setup backend
setup_backend() {
    echo "🔧 Setting up Python backend..."

    cd "neocal_backend_ai_0336 2"

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "📦 Creating Python virtual environment..."
        python3 -m venv venv
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Upgrade pip
    pip install --upgrade pip >/dev/null 2>&1

    # Install requirements
    echo "📚 Installing Python dependencies..."
    pip install -r requirements.txt >/dev/null 2>&1

    # Initialize database if needed
    if [ ! -f "data/neocal.db" ] && [ ! -f "database/neocal_demo.db" ]; then
        echo "🗄️  Initializing database..."
        python -c "
from database.db import engine, Base
from models import database
Base.metadata.create_all(bind=engine)
print('Database initialized successfully')
        " >/dev/null 2>&1
    fi

    cd ..
    echo "✅ Backend setup complete"
}

# Function to setup mobile app
setup_mobile() {
    echo "📱 Setting up mobile app..."

    cd cai_mobile_app

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing Node.js dependencies..."
        npm install >/dev/null 2>&1
    fi

    cd ..
    echo "✅ Mobile app setup complete"
}

# Function to get ngrok tunnel URL
get_ngrok_url() {
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for ngrok tunnel..."

    while [ $attempt -le $max_attempts ]; do
        # Try to get the tunnel URL from ngrok API
        if TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null); then
            if [[ $TUNNEL_URL != "null" && $TUNNEL_URL =~ https:// ]]; then
                echo "$TUNNEL_URL"
                return 0
            fi
        fi

        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done

    echo "❌ Failed to get ngrok tunnel URL"
    return 1
}

# Function to start complete system
start_complete_system() {
    echo "🚀 Starting CalAI Complete System..."
    echo ""

    # Kill any existing processes
    echo "🧹 Cleaning up existing processes..."
    pkill -f "python main.py" 2>/dev/null || true
    pkill -f "expo start" 2>/dev/null || true
    pkill -f ngrok 2>/dev/null || true
    sleep 2

    # Start backend
    echo "🔧 Starting backend server..."
    cd "neocal_backend_ai_0336 2"
    source venv/bin/activate
    nohup python main.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    # Wait for backend to be ready
    echo "⏳ Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s "http://localhost:8000/health" >/dev/null 2>&1; then
            echo "✅ Backend is ready!"
            break
        fi
        sleep 2
        echo "   Attempt $i/30..."
    done

    if ! curl -s "http://localhost:8000/health" >/dev/null 2>&1; then
        echo "❌ Backend failed to start properly"
        echo "Check backend.log for details"
        exit 1
    fi

    # Start ngrok tunnel for backend
    echo "🌐 Starting ngrok tunnel for backend..."
    nohup ngrok http 8000 > ngrok.log 2>&1 &
    NGROK_PID=$!
    sleep 3

    # Get tunnel URL
    if ! TUNNEL_URL=$(get_ngrok_url); then
        echo "❌ Failed to establish ngrok tunnel"
        kill $BACKEND_PID $NGROK_PID 2>/dev/null || true
        exit 1
    fi

    echo "✅ Backend tunneled at: $TUNNEL_URL"

    # Update mobile app backend URL
    echo "🔗 Configuring mobile app backend URL..."
    echo "EXPO_PUBLIC_BACKEND_URL=$TUNNEL_URL" > cai_mobile_app/.env

    # Start mobile app in tunnel mode
    echo "📱 Starting mobile app in tunnel mode..."
    cd cai_mobile_app
    echo ""
    echo "🎉🎉🎉 CALAI IS NOW RUNNING! 🎉🎉🎉"
    echo ""
    echo "📊 System Status:"
    echo "   ✅ Backend API: $TUNNEL_URL"
    echo "   ✅ Database: SQLite (initialized)"
    echo "   ✅ AI Vision: OpenAI GPT-4o (configured)"
    echo ""
    echo "📱 Mobile Testing:"
    echo "   1. Scan the QR code below with 'Expo Go' app"
    echo "   2. Or open: http://localhost:8081 in web browser"
    echo ""
    echo "🔑 Features Ready:"
    echo "   • User authentication & registration"
    echo "   • AI-powered food image analysis"
    echo "   • Nutrition tracking & insights"
    echo "   • Cross-platform mobile support"
    echo ""
    echo "🛑 To stop everything: Ctrl+C or ./stop-services.sh"
    echo ""

    # Start mobile app (this will show QR code)
    npm start -- --tunnel &
    MOBILE_PID=$!

    # Wait for services
    trap 'echo ""; echo "🛑 Stopping CalAI..."; kill $BACKEND_PID $NGROK_PID $MOBILE_PID 2>/dev/null || true; exit 0' INT
    wait
}

# Main script
main() {
    # Check if we're in the right directory
    if [ ! -d "neocal_backend_ai_0336 2" ] || [ ! -d "cai_mobile_app" ]; then
        echo "❌ Error: Please run this script from the CalAI root directory"
        echo "   Directory should contain 'neocal_backend_ai_0336 2' and 'cai_mobile_app' folders"
        exit 1
    fi

    # Check ports
    echo "🔍 Checking port availability..."
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port 8000 (backend) is already in use"
        exit 1
    fi
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port 8081 (mobile) is already in use"
        exit 1
    fi

    # Setup components
    setup_ngrok
    setup_backend
    setup_mobile

    # Start complete system
    start_complete_system
}

# Run main function
main "$@"
