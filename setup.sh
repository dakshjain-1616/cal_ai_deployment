#!/bin/bash

# ==========================================
# 🍎 CALAI - Initial Setup
# ==========================================
# One-time setup for backend and frontend

set -e

echo "🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎"
echo "🍎                                                                          🍎"
echo "🍎                    🍎🍎🍎  CALAI SETUP  🍎🍎🍎                     🍎"
echo "🍎                                                                          🍎"
echo "🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎"

echo ""
echo "🔧 Setting up CalAI development environment..."
echo ""

# Backend setup
echo "🐍 Setting up Python backend..."
cd "neocal_backend_ai_0336 2"

if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo "📚 Installing Python dependencies..."
pip install --upgrade pip >/dev/null 2>&1
pip install -r requirements.txt >/dev/null 2>&1

echo "🗄️  Setting up database..."
python -c "
from database.db import engine, Base
from models import database
Base.metadata.create_all(bind=engine)
print('✅ Database initialized')
" >/dev/null 2>&1

cd ..
echo "✅ Backend setup complete!"

# Frontend setup
echo ""
echo "📱 Setting up React Native frontend..."
cd cai_mobile_app

if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install >/dev/null 2>&1
fi

cd ..
echo "✅ Frontend setup complete!"

echo ""
echo "🎉🎉🎉 SETUP COMPLETE! 🎉🎉🎉"
echo ""
echo "🚀 Ready to run:"
echo "   ./start.sh          # Start locally (recommended)"
echo "   ./run-calai.sh      # Start with tunneling"
echo ""
echo "📖 For help: cat README.md"
