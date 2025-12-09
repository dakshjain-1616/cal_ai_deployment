# Deploying NeoCal AI Backend to Vercel (Docker)

This guide shows a minimal path to deploy the FastAPI backend to Vercel using the Docker builder. The backend keeps any AI provider API keys server-side — do NOT expose keys in the mobile/web client.

Steps

1. Install the Vercel CLI and log in:

```bash
npm i -g vercel
vercel login
```

2. From the backend folder, push a deploy using Docker builder (Vercel will build the Docker image using the `Dockerfile` in this folder):

```bash
cd "neocal_backend_ai_0336 2"
vercel --prod
```

3. Set your `OPENAI_API_KEY` in the Vercel project environment variables:

- In the Vercel dashboard: Project → Settings → Environment Variables
- Add `OPENAI_API_KEY` (Value = your key) and mark it as "Encrypted"

Alternatively with the CLI:

```bash
vercel env add OPENAI_API_KEY production
# then paste your key
```

4. Confirm the deployment is healthy. The app will be served on the assigned Vercel URL and the backend will listen on port 8080 inside the container. Vercel routes incoming requests to that container.

Notes & Troubleshooting

- Keep the API key only in Vercel environment variables. Never put the key into client code.
- If you prefer not to use Docker, you can deploy to other hosts (Render, Railway, Fly.io) that support Python containers or ASGI apps. The same environment variable approach applies.
- For local testing, copy `.env.example` to `.env` and set `OPENAI_API_KEY` there. Use `python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000` to run locally.

