# CalAI Frontend-Backend Integration - Quick Start Guide

## 🚀 Start Both Services (2 Terminal Windows)

### Terminal 1: Backend
```bash
cd "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2"
python3 -c "from database.db import engine, Base; from models import database; Base.metadata.create_all(bind=engine)"
uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Terminal 2: Frontend
```bash
cd /Users/dakshjain/Documents/Cai_ai_full/fe_2
npm start
```

Expected output:
```
Compiled successfully!
You can now view fe_2 in the browser.
Local:            http://localhost:3000
```

## ✅ Verify Integration Works

### Option 1: Test via Browser Console
1. Open DevTools (F12)
2. Run in console: `window.runIntegrationTests()`
3. Watch all tests pass in the console

### Option 2: Test via curl
```bash
# Create session
curl -X POST http://localhost:8000/auth/anonymous-session \
  -H 'Content-Type: application/json'

# Get profile (replace TOKEN with actual token from above)
curl -X GET http://localhost:8000/user/profile \
  -H 'X-Auth-Token: YOUR_TOKEN_HERE'
```

## 📋 Key Files

| File | Purpose |
|------|---------|
| `fe_2/.env` | Frontend configuration (points to localhost:8000) |
| `fe_2/src/services/api.js` | Frontend API client |
| `neocal_backend_ai_0336 2/main.py` | Backend FastAPI app |
| `neocal_backend_ai_0336 2/routers/*.py` | Backend API routes |
| `fe_2/src/test_integration.js` | Integration test suite |

## 🛠️ If Something Breaks

### Backend won't start
```bash
# Reinitialize database
cd "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2"
rm database/neocal_demo.db
python3 -c "from database.db import engine, Base; from models import database; Base.metadata.create_all(bind=engine)"
uvicorn main:app --reload --port 8000
```

### Frontend won't compile
```bash
cd /Users/dakshjain/Documents/Cai_ai_full/fe_2
rm -rf node_modules package-lock.json
npm install
npm start
```

### Backend/Frontend can't communicate
1. Check backend is running: `curl http://localhost:8000/health`
2. Check frontend env: `cat fe_2/.env | grep REACT_APP_BACKEND_URL`
3. Should be: `http://localhost:8000`

## 📊 API Status Dashboard

### Backend Health
- Endpoint: `GET http://localhost:8000/health`
- Expected: `{"status":"ok"}`

### Frontend State
- Open DevTools → Application → LocalStorage
- Look for `calai_session` key containing token and user_id

## 🎯 Main User Flows (All Working)

1. **Create Session** → Get token automatically
2. **Load Profile** → Display user daily calorie target
3. **Log Meals** → Text, image, or barcode
4. **Track Water** → Log and view daily intake
5. **Log Exercise** → Track workouts
6. **Monitor Weight** → Track weight trends
7. **View Summary** → See daily totals and remaining calories

## 📝 Notes

- Database auto-initializes on backend startup
- Sessions expire after 24 hours
- All data is stored in SQLite (`neocal_demo.db`)
- Frontend automatically creates anonymous session on first load
- All API calls include X-Auth-Token header
- CORS is enabled for development (all origins allowed)

## 🔧 Troubleshooting Commands

```bash
# Check if ports are in use
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Kill process using port
kill -9 $(lsof -t -i :8000)

# Check database tables
sqlite3 "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2/database/neocal_demo.db" ".tables"

# View recent logs
tail -f /tmp/calai.log
```

---
**Last Updated:** December 5, 2025
**Status:** ✅ All Systems Operational
