# CalAI - Calorie Tracking App

A modern, end-to-end calorie tracking application with AI-powered meal recognition.

## 🚀 Quick Start

### Run Both Backend and Frontend Together

```bash
./start-both.sh
```

This will start:
- **Backend API**: http://localhost:8000
- **Frontend Web App**: http://localhost:8081
- **Mobile App**: Scan QR code in terminal with Expo Go app

### Manual Startup

#### Backend
```bash
cd "neocal_backend_ai_0336 2"
source venv/bin/activate
python main.py
```

#### Frontend
```bash
cd cai_mobile_app
npx expo start --web
```

## 📱 Features

- **Dashboard**: Daily calorie tracking with macros visualization
- **Meal Logging**: Add meals manually or via AI image recognition
- **Water Tracking**: Log water intake with quick presets
- **Exercise Logging**: Track workouts with calorie burn estimation
- **Modern UI**: Dark theme with glassmorphism effects
- **Real-time Sync**: Instant data synchronization between frontend and backend

## 🛠 Tech Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Frontend**: React Native, Expo, TypeScript
- **AI**: OpenAI Vision API for meal recognition
- **Database**: SQLite with SQLAlchemy ORM

## 📊 API Endpoints

- `POST /auth/anonymous-session` - Create session
- `POST /meals` - Log meals
- `GET /meals/history` - Get meal history
- `POST /water` - Log water intake
- `POST /exercise` - Log exercise
- `GET /summary/day` - Get daily summary

## 🚀 Deployment

Ready for deployment to Vercel (backend) and app stores (mobile).

## 📝 Development

All integration tests pass. The app is fully functional end-to-end.
