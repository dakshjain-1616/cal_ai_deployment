# 🍎 CalAI - Smart Nutrition Tracking App

A comprehensive full-stack application for intelligent calorie and nutrition tracking with AI-powered food recognition.

## ✨ Features

- **🔐 Secure Authentication** - User registration and login with JWT tokens
- **🤖 AI Image Analysis** - Advanced food recognition using OpenAI GPT-4o Vision
- **📊 Nutrition Tracking** - Comprehensive calorie, macro, and micronutrient tracking
- **📱 Cross-Platform** - Works on iOS, Android, and Web
- **🎯 Smart Suggestions** - Personalized nutrition insights and recommendations
- **💾 Persistent Data** - Secure cloud storage with user isolation

## 🚀 Quick Start

### 📋 COMPLETE STEP-BY-STEP GUIDE

#### **Step 1: One-Time Setup (Required First Time Only)**
```bash
./setup.sh
```
**What it installs:**
- Python virtual environment
- All Python dependencies (FastAPI, OpenAI, etc.)
- Node.js dependencies
- Database initialization

#### **Step 2: Choose Your Testing Method**

### 🎯 **METHOD A: IP-BASED (RECOMMENDED - Works with Phone Hotspot!)**
```bash
./run-ip.sh
```
**Perfect for:**
- Testing on real mobile devices
- Phone hotspot networks
- Same WiFi network testing

**What it does:**
- Auto-detects your local IP (192.168.x.x)
- Sets backend URL to IP address (not localhost!)
- Starts backend on http://YOUR_IP:8000
- Starts mobile app with QR code
- Mobile devices connect via IP address

**How to test:**
1. Run `./run-ip.sh`
2. Note your IP address shown (e.g., 192.168.29.198)
3. On phone: Open Expo Go → Scan QR code
4. Backend runs on: `http://192.168.29.198:8000`

### 🌐 **METHOD B: TUNNEL MODE (Advanced - Any Network)**
```bash
./run-calai.sh
```
**Perfect for:**
- Different networks
- Remote testing
- Complex network setups

**What it does:**
- Auto-installs ngrok
- Tunnels backend through internet
- Mobile app connects via tunnel URL
- Works anywhere with internet

### 🖥️ **METHOD C: LOCAL BROWSER ONLY**
```bash
./start.sh
```
**Perfect for:**
- Quick browser testing
- Development only
- No mobile device needed

**What it does:**
- Runs backend on localhost:8000
- Runs mobile app web version on localhost:8081
- Open http://localhost:8081 in browser

#### **Step 3: Stop Services**
```bash
./stop-services.sh
```
**Cleanly stops all running services**

This will:
- ✅ Auto-detect your local IP address
- ✅ Set up Python virtual environment
- ✅ Install all dependencies (backend & frontend)
- ✅ Initialize database
- ✅ Configure networking
- ✅ Start backend API (runs in background)
- ✅ Start mobile app with QR code display
- ✅ Provide clear testing instructions

### Manual Setup (Alternative)

If you prefer manual control:

```bash
# 1. Setup backend
cd "neocal_backend_ai_0336 2"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Setup mobile app
cd ../cai_mobile_app
npm install

# 3. Start services
# Terminal 1 - Backend
cd "neocal_backend_ai_0336 2"
source venv/bin/activate
python main.py

# Terminal 2 - Mobile App
cd cai_mobile_app
npm start
```

## 🧪 Testing the Application

### Option 1: Web Browser
1. Open `http://localhost:8081` in your browser
2. Create an account or login
3. Test all features!

### Option 2: Mobile Device
1. Install "Expo Go" app on your phone
2. **For Phone Hotspot Users:**
   - Make sure both phone and laptop are connected to the SAME hotspot network
   - Scan the QR code shown in the terminal
3. **If hotspot doesn't work:** Stop the script (Ctrl+C) and run:
   ```bash
   ./tunnel-run.sh
   ```
   **Note:** Tunnel mode requires making your backend accessible from the internet. Follow the instructions shown by the tunnel script.
4. Test on real mobile device!

### Option 3: Custom IP
If the auto-detected IP doesn't work:

```bash
./setup-and-run.sh --ip YOUR_IP_ADDRESS
```

## 🛠️ Project Structure

```
📁 CalAI/
├── 📄 setup.sh                     # 🔧 One-time setup (venv, packages, DB)
├── 📄 run-ip.sh                    # 🎯 IP-based testing (RECOMMENDED)
├── 📄 run-calai.sh                 # 🌐 Tunnel mode (advanced)
├── 📄 start.sh                     # 🖥️ Local browser testing
├── 📄 stop-services.sh             # 🛑 Clean shutdown
├── 📄 README.md                    # 📖 Documentation
│
├── 📁 neocal_backend_ai_0336 2/     # Python FastAPI Backend
│   ├── 📁 services/                 # Business logic
│   │   ├── ai_service.py           # OpenAI Vision integration
│   │   ├── auth_service.py         # Authentication & security
│   │   └── nutrition_service.py    # Nutrition calculations
│   ├── 📁 routers/                 # API endpoints
│   ├── 📁 models/                  # Database models
│   └── main.py                     # FastAPI application
│
└── 📁 cai_mobile_app/              # React Native Expo App
    ├── 📁 app/                     # Expo Router pages
    │   ├── (tabs)/                # Main app screens
    │   ├── login.tsx              # Authentication
    │   └── signup.tsx             # User registration
    ├── 📁 src/services/           # API client
    └── package.json               # Dependencies
```

## 🔑 API Features

### Authentication
- User registration with email/password
- JWT token-based authentication
- Secure session management
- Automatic token refresh

### AI Food Recognition
- **OpenAI GPT-4o Vision** - Latest AI model for image analysis
- **Smart Categorization** - Fruits, proteins, vegetables, grains, dairy
- **Accurate Nutrition** - Calorie and macronutrient estimation
- **Fallback System** - 6 different realistic food options when AI fails

### Nutrition Tracking
- **Meal Logging** - Breakfast, lunch, dinner, snacks
- **Macro Tracking** - Protein, carbs, fat, calories
- **Progress Analytics** - Daily/weekly/monthly insights
- **Goal Setting** - Customizable calorie targets

## 🗄️ Database Schema

- **Users** - Account information and preferences
- **Meals** - Food entries with nutritional data
- **Water** - Hydration tracking
- **Exercise** - Physical activity logging
- **Weight** - Body weight measurements

## 🔧 Configuration

### Backend Environment
```bash
# neocal_backend_ai_0336 2/.env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_VISION_MODEL=gpt-4o
```

### Mobile App Environment
```bash
# cai_mobile_app/.env
EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP:8000
```

## 🛑 Stopping Services

```bash
./stop-services.sh
```

Or manually:
```bash
pkill -f "python main.py"
pkill -f "expo start"
```

## 🔍 Troubleshooting

### Backend Won't Start
```bash
# Check if port 8000 is free
lsof -i :8000

# Kill any processes using the port
kill -9 PROCESS_ID
```

### Mobile App Won't Connect
```bash
# Check backend is running
curl http://localhost:8000/health

# Update IP address if needed
./setup-and-run.sh --ip YOUR_NEW_IP
```

### Phone Hotspot Issues
If using your phone's hotspot:
```bash
# Option 1: Use tunnel mode (works over any network)
cd cai_mobile_app
npm start -- --tunnel

# Option 2: Make sure both devices are on the same network
# Check if both phone and laptop show the same network name
# Restart the setup script: ./setup-and-run.sh
```

### AI Image Analysis Not Working
- Ensure OpenAI API key is set in `neocal_backend_ai_0336 2/.env`
- Check API quota and billing status
- Fallback system will provide realistic alternatives

## 📊 System Requirements

- **Python 3.8+**
- **Node.js 18+**
- **Expo CLI**
- **OpenAI API Key** (for AI features)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `./setup-and-run.sh`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎉 Ready to Get Started?

Just run:

```bash
./setup-and-run.sh
```

And you'll have a fully functional AI-powered nutrition tracking app running in minutes! 🚀

---

**Built with:** FastAPI, React Native, Expo, OpenAI GPT-4o, SQLite, JWT Authentication
