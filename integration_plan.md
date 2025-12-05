# CalAI End-to-End Integration Plan

## 1. Backend Capabilities (Current State)

- **Authentication**
  - Anonymous session bootstrap via [`create_anonymous_session()`](neocal_backend_ai_0336%202/routers/auth.py:9) returning `{ token, user_id }`.
  - Session verification handled by [`verify_token()`](neocal_backend_ai_0336%202/services/auth.py:34) scoped to `X-Auth-Token`.

- **Meals & Daily Summary**
  - Text-based ingestion [`log_meal_from_text()`](neocal_backend_ai_0336%202/routers/meals.py:32) & [`create_meal_from_text()`](neocal_backend_ai_0336%202/services/meal_service.py:9).
  - Image-based ingestion [`log_meal_from_image()`](neocal_backend_ai_0336%202/routers/meals.py:44) & [`create_meal_from_image()`](neocal_backend_ai_0336%202/services/meal_service.py:13) using AI fallback in [`parse_image_meal()`](neocal_backend_ai_0336%202/services/ai_service.py:213).
  - Barcode ingestion [`log_meal_from_barcode()`](neocal_backend_ai_0336%202/routers/meals.py:71) & [`create_meal_from_barcode()`](neocal_backend_ai_0336%202/services/meal_service.py:17).
  - Meal retrieval [`get_meal()`](neocal_backend_ai_0336%202/routers/meals.py:89) and list-by-date [`list_meals()`](neocal_backend_ai_0336%202/routers/meals.py:101) returning `MealResponse` with per-food breakdown.
  - Daily summary [`get_day_summary()`](neocal_backend_ai_0336%202/routers/meals.py:116) aggregating totals through [`get_daily_summary()`](neocal_backend_ai_0336%202/services/summary_service.py:7).

- **User Profile**
  - Fetch [`get_profile()`](neocal_backend_ai_0336%202/routers/users.py:19) providing `daily_calorie_target` and `timezone`.
  - Update [`update_profile()`](neocal_backend_ai_0336%202/routers/users.py:31) for calorie target & timezone persistence.

- **Persistence**
  - SQLite database configured in [`database/db.py`](neocal_backend_ai_0336%202/database/db.py:1) with ORM models [`User`, `Session`, `Meal`, `FoodItem`](neocal_backend_ai_0336%202/models/database.py:1).
  - Meal formatting via [`format_meal_response()`](neocal_backend_ai_0336%202/services/meal_service.py:135) returning nested macros.

## 2. Frontend Feature Expectations (Current Code)

- **Profile Setup**: `ProfileSetup` persists profile to `localStorage` and assumes direct calorie calculations without backend sync.
- **Dashboard / MealHistory**: `getMeals()` expects flattened `{ food_name, calories, protein, carbs, fat }` per meal, with optional deletion ability.
- **FoodScanner**: Supports camera/upload/search flows; uses `analyzeFoodImage`, `searchFood`, `logMeal` mocks.
- **Progress**: Requires weight log CRUD via `logWeight`, `getWeightLogs`.
- **WaterTracker**: Requires water intake endpoints for logging and daily totals.
- **ExerciseTracker**: Requires exercise log endpoints (log, list, delete).
- **Settings**: Relies on profile edit & logout but currently clears local storage.

## 3. Integration Objectives

1. **Unify Authentication**
   - Use backend anonymous session to bootstrap token.
   - Persist `{ token, user_id }` in frontend and attach to every API request via `X-Auth-Token`.
2. **Synchronize Profile Data**
   - Replace local profile storage with `/user/profile` GET/PUT.
3. **Align Meal Data Structures**
   - Update frontend to consume backend `MealResponse` (nested foods + totals) and map to UI needs.
   - Enable new meal log flows using `/meals/from-text`, `/meals/from-image`, `/meals/from-barcode`.
4. **Extend Backend for Ancillary Trackers**
   - Implement water intake, exercise logs, and weight logs APIs (CRUD) to match frontend pages.
5. **Provide Summary & Dashboard Metrics**
   - Use `/summary/day` for daily totals and macros.
6. **Establish Environment Configuration**
   - Frontend `.env` must specify `REACT_APP_BACKEND_URL`.
   - Backend CORS already open; confirm final domain list before production.

## 4. Required Backend Enhancements

| Feature | Endpoint(s) to Implement | Notes |
| --- | --- | --- |
| Water tracking | `POST /water`, `GET /water`, optional `DELETE /water/{id}` | Persist totals per user/date; align response shape with frontend expectations (id, amount, timestamp). |
| Exercise tracking | `POST /exercise`, `GET /exercise`, `DELETE /exercise/{id}` | Store name, duration, caloriesBurned, timestamp. |
| Weight logs | `POST /weight`, `GET /weight`, optional `DELETE /weight/{id}` | Persist weight entries with date & timestamp. |
| Meal deletion | `DELETE /meals/{meal_id}` | Frontend `MealHistory` expects delete option. |
| Daily dashboard summary | Use existing `/summary/day`; ensure macros and remaining calories align with UI. |
| Search & analysis fallbacks | Optionally expose `POST /meals/search` if enhancing `searchFood` UI; otherwise map search to text meals. |

Schema additions:
- New tables `water_logs`, `exercise_logs`, `weight_logs`.
- Consider migration script updates in [`database/schema.sql`](neocal_backend_ai_0336%202/database/schema.sql:1) and ORM models mirroring structure.

## 5. Frontend Integration Steps

1. **API Client Refactor**
   - Introduce Axios instance with base URL from `REACT_APP_BACKEND_URL` and interceptor injecting `X-Auth-Token`.
   - Replace mock implementations in [`services/api.js`](fe_2/src/services/api.js:1) with real endpoints.
2. **Auth Bootstrap**
   - On app load, if token missing, call `/auth/anonymous-session` to create user and session; store token & user ID in local storage.
   - Ensure token refresh or re-creation when expired (retry logic on 401).
3. **Profile Flow**
   - `ProfileSetup` should `GET /user/profile`; if empty, leverage defaults from backend.
   - Submit updates via `PUT /user/profile`.
4. **Meals**
   - Map dashboard & meal history to backend `MealResponse`:
     - Display aggregated totals (`total_calories`, `total_macros`).
     - For simple UI cards, compute derived `calories`/`protein`/`carbs`/`fat` from totals rather than expecting flat fields.
   - Logging:
     - Text description → `/meals/from-text`.
     - Image upload → `/meals/from-image` using `FormData` & binary upload.
     - Barcode search → `/meals/from-barcode`.
   - Deletion via new `DELETE /meals/{meal_id}` endpoint once implemented.
5. **Water / Exercise / Weight**
   - Update hooks to call new backend endpoints with token.
   - Ensure date filtering via query parameters (e.g., `?date=YYYY-MM-DD`) to align with backend queries.
6. **Dashboard Metrics**
   - Fetch `/summary/day?date=YYYY-MM-DD` to populate progress bars.
   - Combine with `GET /meals` for latest entries and macros breakdown.

## 6. Data Contracts & Mapping

- **MealResponse**
  - UI needs: `meal_id`, `timestamp`, per-food list, aggregated totals.
  - Convert ISO timestamp to local time for display.
- **DailySummaryResponse**
  - Provide `remaining_calories` for dashboard gauge.
- **New log entities**
  - Standard shape: `{ id, user_id, amount/weight/name, timestamp }`.
  - Frontend expects `timestamp` convertible to human-readable time.

## 7. Environment & Deployment Considerations

- Frontend `.env`:
  ```
  REACT_APP_BACKEND_URL=http://localhost:8000
  ```
- Backend `.env` (optional) for DB path override if staging different dataset.
- Ensure CORS `allow_origins` refined before production.
- Provide combined start scripts (e.g., concurrently run backend `uvicorn` and frontend `npm start`).

## 8. Testing Strategy

1. **Backend**
   - Add pytest coverage for new routers (water/exercise/weight) ensuring token validation.
   - Verify SQLAlchemy models and schema migrations.
2. **Frontend**
   - Integration tests for API client (mocked HTTP) to ensure correct headers & payloads.
   - UI smoke tests covering meal logging, trackers, and profile update.
3. **End-to-End**
   - Manual validation flow:
     1. Launch backend (`uvicorn main:app`).
     2. Launch frontend (`npm start`).
     3. Complete profile -> log meals via text/image/barcode -> verify dashboard & history -> log water/exercise/weight -> confirm summary accuracy.

This plan aligns the existing backend surfaces with frontend functionality and identifies necessary backend additions to deliver a fully integrated CalAI calorie tracking experience.