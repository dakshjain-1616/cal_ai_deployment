# Deploying NeoCal AI Backend to Vercel (Python Serverless)

This guide shows how to deploy the FastAPI backend to Vercel **without Docker**, using Vercel's Python serverless runtime. The backend keeps any AI provider API keys server-side — do **NOT** expose keys in the mobile/web client.

The repo is already wired for this with:

- [`vercel.json`](vercel.json)
- [`api/index.py`](api/index.py)
- [`main.py`](main.py)

---

## 1. One-time setup

Install the Vercel CLI and log in:

```bash
npm i -g vercel
vercel login
```

---

## 2. Deploy the backend (Python runtime)

From the backend folder:

```bash
cd "neocal_backend_ai_0336 2"
vercel        # first time, to create/link the project
vercel --prod # production deployment
```

What this does:

- Uses [`vercel.json`](vercel.json) to route all requests to `api/index.py`
- Vercel's Python runtime loads the FastAPI `app` from [`main.py`](main.py)
- You get a production URL like:

```text
https://your-backend-name.vercel.app
```

This URL is your **BACKEND_URL** for:

- React web app (`REACT_APP_BACKEND_URL`)
- Expo mobile app (`EXPO_PUBLIC_BACKEND_URL`)

---

## 3. Configure environment variables (OPENAI_API_KEY)

In the Vercel dashboard for this backend project:

1. Go to **Project → Settings → Environment Variables**
2. Add:

   - `OPENAI_API_KEY` → your key (Encrypted)

Alternatively with the CLI:

```bash
vercel env add OPENAI_API_KEY production
# then paste your key
```

The key is only available server-side in the Vercel function, never in client code.

---

## 4. Verify deployment

After deploy, check:

```text
https://your-backend-name.vercel.app/health
https://your-backend-name.vercel.app/docs
```

- `/health` should return `{"status": "ok"}`
- `/docs` should show the FastAPI Swagger UI

These endpoints are defined in [`main.py`](main.py).

---

## 5. Local testing (unchanged)

For local development, you can still run Uvicorn directly:

```bash
cd "neocal_backend_ai_0336 2"
cp .env.example .env   # if needed, then edit OPENAI_API_KEY in .env
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then test locally:

```bash
curl http://localhost:8000/health
```

---

## 6. Notes & Troubleshooting

- Keep API keys **only** in Vercel environment variables (or `.env` locally). Never commit them to git.
- If you previously tried Docker on Vercel and saw an error about `@vercel/docker` not existing, that is resolved by this Python serverless setup.
- For staging vs production:
  - Use separate Vercel projects or separate `Environment` scopes.
  - Point `REACT_APP_BACKEND_URL` / `EXPO_PUBLIC_BACKEND_URL` to the correct backend URL per environment.

