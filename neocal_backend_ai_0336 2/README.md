# NeoCal Backend - AI Calorie Tracking Application

## Project Overview

NeoCal is a proof-of-concept calorie tracking backend that demonstrates real AI application development. The system handles meal logging from multiple input sources (text description, image, barcode) and returns structured nutrition information with daily summaries.

## Architecture Overview

### System Design

The application follows a clean, layered architecture:

- **API Layer**: FastAPI routers handling HTTP requests/responses with automatic request validation
- **Business Logic Layer**: Services for meal processing, nutrition calculations, summary generation
- **Data Access Layer**: SQLAlchemy ORM models for database interactions
- **Mock AI Layer**: Stub functions simulating LLM/vision model responses for meal parsing

### Data Flow

1. **Request**: User sends meal data (text/image/barcode) with authentication token
2. **Parsing**: Mock AI service parses input into structured food items
3. **Nutrition Lookup**: System looks up nutrition data for identified foods
4. **Storage**: Meal and food items persisted to database
5. **Response**: Formatted meal response returned with calculated totals
6. **Retrieval**: Users can query meals by ID, list daily meals, or get daily summaries

### Database Schema

- **users**: User profiles with calorie targets and timezone
- **sessions**: Authentication sessions with expiring tokens
- **meals**: Meal records with timestamp, source, original input, totals
- **food_items**: Individual food items within meals with nutrition data

## Technology Stack

- **Framework**: FastAPI (Python async web framework)
- **Server**: Uvicorn (ASGI server)
- **Database**: SQLite (simple, file-based for demo)
- **ORM**: SQLAlchemy (database abstraction)
- **Validation**: Pydantic (request/response schemas)
- **HTTP Client**: Python requests (for testing)

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
python database/init_db.py
```

This creates the SQLite database at `data/neocal.db` with schema and seeds nutrition data.

### 3. Run the Server

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### 4. API Documentation

Auto-generated docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /auth/anonymous-session` - Create anonymous session with token

### User Profile
- `GET /user/profile` - Retrieve user profile
- `PUT /user/profile` - Update daily calorie target and timezone

### Meal Logging
- `POST /meals/from-text` - Log meal from text description
- `POST /meals/from-image` - Log meal from image URL
- `POST /meals/from-barcode` - Log meal from barcode

### Meal Retrieval
- `GET /meals/{meal_id}` - Get specific meal
- `GET /meals?date=YYYY-MM-DD` - List meals for a date
- `GET /summary/day?date=YYYY-MM-DD` - Daily calorie and macro summary

## Authentication

All endpoints except `/auth/anonymous-session` require the `X-Auth-Token` header:

```bash
curl -H "X-Auth-Token: your_token_here" http://localhost:8000/user/profile
```

## Example Usage

### 1. Create Session and Get Token

```bash
curl -X POST http://localhost:8000/auth/anonymous-session
# Returns: {"token": "...", "user_id": "user_..."}
```

### 2. Log a Text Meal

```bash
curl -X POST http://localhost:8000/meals/from-text \
  -H "X-Auth-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{"description": "200g grilled chicken with 150g rice"}'
```

### 3. Get Daily Summary

```bash
curl http://localhost:8000/summary/day?date=2024-11-26 \
  -H "X-Auth-Token: your_token"
```

## Testing

Run the complete test suite:

```bash
# Start server in one terminal
uvicorn main:app --reload

# Run tests in another terminal
python scripts/test_api.py
```

This script tests all 8 endpoints with sample data and validates responses.

## Mock AI Implementation

The system currently uses mock AI services that return realistic sample responses:

### Text Parsing
- Extracts quantities (grams, cups, servings) from descriptions
- Identifies food names using pattern matching
- Returns confidence scores (0.6-0.95 range)

### Image Parsing
- Simulates vision model by checking image URL for food keywords
- Returns likely food items with confidence scores
- Supports: pizza, salad, burger, chicken meals

### Barcode Parsing
- Uses simple lookup table for common products
- Returns nutrition facts for identified products
- Handles serving multipliers

## Project Structure