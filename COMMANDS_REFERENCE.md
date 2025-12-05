# CalAI Integration - Command Reference & Troubleshooting

## ⚡ Quick Commands

### Start Everything (New Terminal Windows)

**Terminal 1 - Backend:**
```bash
cd "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2"
python3 -c "from database.db import engine, Base; from models import database; Base.metadata.create_all(bind=engine)"
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/dakshjain/Documents/Cai_ai_full/fe_2
npm start
```

**Terminal 3 - Testing (Optional):**
```bash
cd /Users/dakshjain/Documents/Cai_ai_full
# Run integration tests
curl -s http://localhost:8000/health
```

---

## 🧪 Testing Commands

### Backend Health Check
```bash
curl http://localhost:8000/health
```

### Create Session
```bash
curl -X POST http://localhost:8000/auth/anonymous-session \
  -H 'Content-Type: application/json'
```

### Get User Profile
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:8000/user/profile \
  -H "X-Auth-Token: $TOKEN" \
  -H 'Content-Type: application/json'
```

### Log Water
```bash
TOKEN="your_token_here"
curl -X POST http://localhost:8000/water \
  -H "X-Auth-Token: $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount": 500}'
```

### Log Exercise
```bash
TOKEN="your_token_here"
curl -X POST http://localhost:8000/exercise \
  -H "X-Auth-Token: $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name": "Running", "duration": 30, "caloriesBurned": 300}'
```

### Log Weight
```bash
TOKEN="your_token_here"
curl -X POST http://localhost:8000/weight \
  -H "X-Auth-Token: $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"weight": 75.5}'
```

### Get Daily Summary
```bash
TOKEN="your_token_here"
curl -X GET "http://localhost:8000/summary/day?date=2025-12-05" \
  -H "X-Auth-Token: $TOKEN" \
  -H 'Content-Type: application/json'
```

### Log Meal from Text
```bash
TOKEN="your_token_here"
curl -X POST http://localhost:8000/meals/from-text \
  -H "X-Auth-Token: $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"description": "Chicken sandwich with salad"}'
```

---

## 📋 Configuration Files

### Frontend Environment (.env)
**Location:** `/Users/dakshjain/Documents/Cai_ai_full/fe_2/.env`

```env
REACT_APP_BACKEND_URL=http://localhost:8000
WDS_SOCKET_PORT=3000
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

### Backend Configuration
**Location:** `/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2/main.py`

```python
# Backend runs on http://0.0.0.0:8000
# Database at: database/neocal_demo.db
# CORS: Enabled for all origins
```

---

## 🐛 Troubleshooting

### Issue: Backend won't start

**Symptom:** `ERROR: Uvicorn server failed to start`

**Solution:**
```bash
# Kill existing process
lsof -i :8000 | grep -v PID | awk '{print $2}' | xargs kill -9

# Reinitialize database
cd "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2"
rm -f database/neocal_demo.db
python3 << 'EOF'
from database.db import engine, Base
from models import database
Base.metadata.create_all(bind=engine)
print("Database reinitialized")
EOF

# Start again
uvicorn main:app --reload --port 8000
```

### Issue: Frontend can't connect to backend

**Symptom:** "Failed to load resource: the server responded with a status of 404"

**Solution:**
1. Check backend is running: `curl http://localhost:8000/health`
2. Check frontend .env: `cat fe_2/.env | grep REACT_APP_BACKEND_URL`
3. Should be: `http://localhost:8000`
4. If different, edit `fe_2/.env` and restart frontend

### Issue: Port already in use

**Symptom:** `ERROR: Address already in use`

**Solution:**
```bash
# Find and kill process using port 8000
lsof -i :8000
kill -9 <PID>

# Or use different port
uvicorn main:app --reload --port 8001
# Then update fe_2/.env: REACT_APP_BACKEND_URL=http://localhost:8001
```

### Issue: Database locked

**Symptom:** `sqlite3.OperationalError: database is locked`

**Solution:**
```bash
# Close all connections
pkill -f "uvicorn"
sleep 2

# Delete and recreate
cd "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2"
rm -f database/neocal_demo.db
python3 -c "from database.db import engine, Base; from models import database; Base.metadata.create_all(bind=engine)"

# Restart
uvicorn main:app --reload --port 8000
```

### Issue: npm modules not found

**Symptom:** `Module not found: Can't resolve 'react-router-dom'`

**Solution:**
```bash
cd /Users/dakshjain/Documents/Cai_ai_full/fe_2
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: Import errors in Python

**Symptom:** `ImportError: No module named 'fastapi'`

**Solution:**
```bash
cd "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2"
pip install -r requirements.txt
# Or individual packages:
pip install fastapi uvicorn sqlalchemy pydantic
```

---

## 📊 Database Management

### View Database Tables
```bash
sqlite3 "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2/database/neocal_demo.db" ".tables"
```

### View Table Schema
```bash
sqlite3 "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2/database/neocal_demo.db" ".schema users"
```

### Query Data
```bash
sqlite3 "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2/database/neocal_demo.db" "SELECT * FROM users LIMIT 5;"
```

### Delete All Data (Start Fresh)
```bash
sqlite3 "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2/database/neocal_demo.db" << 'EOF'
DELETE FROM food_items;
DELETE FROM meals;
DELETE FROM water_logs;
DELETE FROM exercise_logs;
DELETE FROM weight_logs;
DELETE FROM sessions;
DELETE FROM users;
EOF
```

### Backup Database
```bash
cp "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2/database/neocal_demo.db" \
   "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2/database/neocal_demo.db.backup.$(date +%s)"
```

---

## 🧪 Browser Console Tests

### Test Everything
```javascript
window.runIntegrationTests()
```

This will:
- ✓ Create session
- ✓ Get user profile
- ✓ Update profile
- ✓ Log water
- ✓ Get water logs
- ✓ Log exercise
- ✓ Get exercises
- ✓ Log weight
- ✓ Get weight logs
- ✓ Get daily summary
- ✓ Log meal from text

### Check Current Token
```javascript
console.log(JSON.parse(localStorage.getItem('calai_session')))
```

### Clear Session
```javascript
localStorage.removeItem('calai_session')
```

---

## 🚀 Production Deployment

### Environment Variables
Create `.env.production`:
```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=true
```

### Build Frontend
```bash
cd /Users/dakshjain/Documents/Cai_ai_full/fe_2
npm run build
# Output: build/ directory ready for deployment
```

### Production Backend Start
```bash
cd "/Users/dakshjain/Documents/Cai_ai_full/neocal_backend_ai_0336 2"
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Nginx Configuration (Example)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/build;
        try_files $uri /index.html;
    }

    # Backend
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

---

## 📈 Performance Monitoring

### Check Backend Response Time
```bash
time curl http://localhost:8000/health
```

### Monitor Backend
```bash
# Start uvicorn with stats
uvicorn main:app --reload --port 8000 --log-level debug
```

### Monitor Frontend
```bash
# Check browser DevTools Network tab for request times
# Check Performance tab for render times
# Check Console for errors
```

---

## 🔧 Development Tips

### Hot Reload Backend
Backend automatically reloads with `--reload` flag

### Hot Reload Frontend
Frontend automatically reloads on file save

### Debug Frontend
1. Open DevTools (F12)
2. Console tab for errors
3. Network tab for API calls
4. Application tab for localStorage
5. React DevTools extension for component debugging

### Debug Backend
```bash
# Add print statements
# View in terminal where uvicorn is running

# Or use Python debugger
import pdb; pdb.set_trace()
```

### API Request/Response Logging
Open DevTools → Network tab → Look for API calls

---

## 📞 Support

### Check Logs
- Backend: Terminal where `uvicorn` is running
- Frontend: Browser Console (F12 → Console tab)

### Common Issues & Fixes
| Issue | Fix |
|-------|-----|
| 404 on /auth/anonymous-session | Backend not running |
| 401 Unauthorized | Token expired, refresh needed |
| CORS error | Check CORS middleware (enabled by default) |
| Empty response | Check X-Auth-Token header |
| Database locked | Restart backend |
| Module not found | Run `npm install` or `pip install -r requirements.txt` |

---

**Last Updated:** December 5, 2025  
**Version:** 1.0  
**Status:** ✅ Ready for Use
