# CalAI Run & Test Guide

This document explains how to set up, run, and verify the full CalAI application using the backend (`neocal_backend_ai_0336 2`) and the frontend (`fe_2`).

---

## 1. Prerequisites

- **Python 3.11+** (Anaconda or system Python is fine)
- **Node.js 18+** and **npm 9+**
- macOS/Linux shell or Windows PowerShell
- Recommended: create a Python virtual environment for the backend

---

## 2. Backend Setup

1. **Install dependencies**

   ```bash
   cd "neocal_backend_ai_0336 2"
   pip install -r requirements.txt
   ```

2. **Initialize the SQLite database (optional)**  
   The application auto-creates tables on startup. To reset with seed data, run:

   ```bash
   python database/init_db_main.py
   ```

3. **Start the FastAPI server**

   ```bash
   uvicorn main:app --reload --port 8000
   ```

   The server listens on `http://localhost:8000`. Verify health:

   ```bash
   curl http://localhost:8000/health
   ```

   Expected:
   ```json
   {"status": "ok"}
   ```

---

## 3. Frontend Setup

1. **Install dependencies**

   ```bash
   cd ../fe_2
   npm install
   ```

2. **Configure environment**

   Create or edit `fe_2/.env`:

   ```
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

   This opens the app at `http://localhost:3000`.

---

## 4. Running the Integrated App

1. Ensure **both servers** are running:

   - Backend: `uvicorn main:app`
   - Frontend: `npm start`

2. Navigate to `http://localhost:3000`. The frontend automatically requests an anonymous session from the backend and stores the token in `localStorage`.

---

## 5. Manual Verification Checklist

1. **Bootstrap session**
   - Open the app; check browser dev tools network tab for `/auth/anonymous-session` 201 status.

2. **Profile setup**
   - Fill out the profile form; verify backend updates via `/user/profile`.

3. **Dashboard overview**
   - After logging meals or activities, confirm macros and totals display from `/summary/day`.

4. **Meal logging**
   - Text: Dashboard → Quick Action → Scan Food → enter description → ensure the card refreshes.
   - Image: Upload an image; backend should process `/meals/from-image`.
   - Barcode: Use barcode entry; backend responds via `/meals/from-barcode`.

5. **Meal history**
   - Visit `/history`, confirm meals load with aggregated macros.
   - Delete a meal and ensure UI updates and backend receives `DELETE /meals/{id}`.

6. **Water tracker**
   - Add quick amounts; backend should show `/water` POST/GET activity.

7. **Exercise tracker**
   - Log workouts (custom or quick-add); confirm backend entries via `/exercise`.

8. **Weight tracking**
   - Log weight; backend `/weight` should record entries and the progress chart updates.

---

## 6. Automated Testing (Optional)

- **Backend**: Use provided scripts (e.g., `python run_validation.py`) to execute FastAPI verification suites.
- **Frontend**: Add React testing-library or Cypress tests as needed (not included by default).

---

## 7. Troubleshooting

- **401 Unauthorized**: The frontend will auto-refresh the anonymous session on 401 responses. If errors persist, clear browser `localStorage` and hard reload.
- **CORS issues**: Backend is configured with permissive CORS. Adjust origins in `main.py` if deploying to production.
- **Port conflicts**: Change backend (`--port`) or frontend (`PORT=3001 npm start`) as needed.

---

## 8. Summary of Commands

```bash
# Backend
cd "neocal_backend_ai_0336 2"
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd ../fe_2
npm install
npm start
```

With both servers running, the CalAI application is fully functional for end-to-end calorie tracking and analytics.