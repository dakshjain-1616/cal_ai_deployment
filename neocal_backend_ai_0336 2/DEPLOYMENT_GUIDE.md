# NeoCal Backend - Deployment & Quick Start Guide

## ✓ Cycle Complete: Backend Infrastructure Foundation

All components of the NeoCal calorie tracking backend have been successfully implemented and tested.

## Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
cd /app/neocal_backend_ai_0336
pip install -r requirements.txt
```

### Step 2: Initialize Database
```bash
python database/init_db.py
```
✓ Creates SQLite database at `data/neocal.db`
✓ Initializes schema with users, sessions, meals, food_items tables
✓ Nutrition database ready with 25+ common foods

### Step 3: Start Server
```bash
uvicorn main:app --reload
```
✓ Server starts at `http://localhost:8000`
✓ API docs at `http://localhost:8000/docs`

### Step 4: Test All Endpoints
```bash
# In another terminal
python scripts/test_api.py
```
✓ Creates anonymous session
✓ Tests all 8 API endpoints
✓ Logs sample meals (text, image, barcode)
✓ Validates daily summary

## API Endpoints (8 Total)

### Authentication
- `POST /auth/anonymous-session` - Get token for new session

### User Profile  
- `GET /user/profile` - Retrieve user settings
- `PUT /user/profile` - Update calorie target and timezone

### Meal Logging
- `POST /meals/from-text` - Log meal from description
- `POST /meals/from-image` - Log meal from image URL
- `POST /meals/from-barcode` - Log meal from barcode

### Meal Retrieval
- `GET /meals/{meal_id}` - Get specific meal details
- `GET /meals?date=YYYY-MM-DD` - List daily meals
- `GET /summary/day?date=YYYY-MM-DD` - Daily totals and remaining calories

## Authentication

Use X-Auth-Token header for all protected endpoints:

```bash
TOKEN="your_token_here"
curl -H "X-Auth-Token: $TOKEN" http://localhost:8000/user/profile
```

## Example Workflow

```bash
# 1. Create session
curl -X POST http://localhost:8000/auth/anonymous-session
# Response: {"token": "abc123...", "user_id": "user_xyz"}

# 2. Log meal from text
curl -X POST http://localhost:8000/meals/from-text \
  -H "X-Auth-Token: abc123..." \
  -H "Content-Type: application/json" \
  -d '{"description": "200g grilled chicken with rice"}'

# 3. Get daily summary
curl http://localhost:8000/summary/day?date=2024-11-26 \
  -H "X-Auth-Token: abc123..."
```

## Project Structure