#!/bin/bash

# CalAI Mobile - Quick Start Script

echo "🚀 CalAI Mobile Setup"
echo "===================="
echo ""

# Get the Mac's IP address
IP_ADDRESS=$(ifconfig | grep -E 'inet ' | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo "📍 Your Mac's IP Address: $IP_ADDRESS"
echo ""

# Ask for backend configuration
echo "How would you like to configure the backend?"
echo "1. Local network (192.168.x.x:8000)"
echo "2. ngrok tunnel (recommended for quick testing)"
echo "3. Deployed backend (custom URL)"
echo ""

read -p "Enter choice (1-3): " choice

BACKEND_URL=""

case $choice in
  1)
    BACKEND_URL="http://$IP_ADDRESS:8000"
    echo "✅ Backend URL: $BACKEND_URL"
    echo ""
    echo "⚠️  Make sure:"
    echo "   • Your backend is running: python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo "   • Phone is on the same WiFi network"
    ;;
  2)
    echo "📦 Starting ngrok tunnel..."
    read -p "Enter ngrok auth token (or press Enter to skip): " NGROK_TOKEN
    if [ ! -z "$NGROK_TOKEN" ]; then
      ngrok authtoken $NGROK_TOKEN
    fi
    # You would need ngrok installed
    echo "Please start ngrok manually:"
    echo "  ngrok http 8000"
    read -p "Enter the ngrok URL (e.g., https://xxxx-xx-xxx-xxx-xx.ngrok.io): " BACKEND_URL
    echo "✅ Backend URL: $BACKEND_URL"
    ;;
  3)
    read -p "Enter your backend URL: " BACKEND_URL
    echo "✅ Backend URL: $BACKEND_URL"
    ;;
  *)
    echo "Invalid choice. Using local IP."
    BACKEND_URL="http://$IP_ADDRESS:8000"
    ;;
esac

# Update the API configuration
echo ""
echo "⚙️  Updating API configuration..."

# Read the current API file
API_FILE="src/services/api.js"

# Replace the backend URL in the file
if [ -f "$API_FILE" ]; then
  # Create backup
  cp "$API_FILE" "$API_FILE.backup"
  
  # Update the URL (handles both http and https)
  sed -i '' "s|const BACKEND_URL = .*|const BACKEND_URL = '$BACKEND_URL'|" "$API_FILE"
  echo "✅ Updated $API_FILE"
else
  echo "❌ Could not find $API_FILE"
  exit 1
fi

echo ""
echo "📱 Starting Expo..."
echo ""
echo "Next steps:"
echo "1. Open Expo Go on your phone"
echo "2. Scan the QR code that appears below"
echo "3. Your app will load on the device"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "======================================="
echo ""

# Start the Expo development server
npm start
