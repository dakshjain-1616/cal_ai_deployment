# CalAI Monorepo Deployment Layout

This document explains how to treat this repo as a three‑app monorepo so you can easily deploy the backend and web frontend on Vercel and run the mobile app via Expo using the same backend.

## 1. Logical project layout

You have three apps:

- **Backend (FastAPI)** – `neocal_backend_ai_0336 2/`
- **Web frontend (React)** – `fe_2/`
- **Mobile app (Expo / React Native)** – `cai_mobile_app/`

Treat each of these as its own deployable unit:

- When deploying the backend, use `neocal_backend_ai_0336 2/` as the project root in Vercel.
- When deploying the web UI, use `fe_2/` as the project root in Vercel.
- When running the mobile app, always start it from the `cai_mobile_app/` folder with Expo.

No code sharing is required between these apps; they communicate only over HTTP to the backend.

## 2. Backend app (Vercel, Docker)

- Path: `neocal_backend_ai_0336 2/`
- Entry: [`main.py`](neocal_backend_ai_0336 2/main.py:1)
- Config: [`vercel.json`](neocal_backend_ai_0336 2/vercel.json:1), [`Dockerfile`](neocal_backend_ai_0336 2/Dockerfile:1)

Deploy steps:

```bash
cd "neocal_backend_ai_0336 2"
vercel
vercel --prod
```

After deploy you will get a URL like:

```text
https://your-backend-name.vercel.app
```

Use this as the single **BACKEND_URL** for both web and mobile.

## 3. Web frontend app (Vercel, static build)

- Path: `fe_2/`
- Config: [`fe_2/vercel.json`](fe_2/vercel.json:1)
- API client: [`fe_2/src/services/api.js`](fe_2/src/services/api.js:1)

The backend URL is controlled via an env variable:

```env
REACT_APP_BACKEND_URL=https://your-backend-name.vercel.app
```

You can set this:

- **Locally** in [`fe_2/.env`](fe_2/.env:1)
- **On Vercel** in the project’s **Environment Variables** settings

Deploy steps (Vercel project root = `fe_2/`):

```bash
cd fe_2
vercel
vercel --prod
```

## 4. Mobile app (Expo, uses the same backend URL)

- Path: `cai_mobile_app/`
- API client: [`cai_mobile_app/src/services/api.js`](cai_mobile_app/src/services/api.js:1)

The backend URL is controlled via an Expo env variable:

```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-name.vercel.app
```

Create or edit `.env` inside `cai_mobile_app/` with that value. Expo will inject it into `process.env.EXPO_PUBLIC_BACKEND_URL` at build time.

Run the mobile app locally (it talks to the deployed Vercel backend over the internet):

```bash
cd cai_mobile_app
npm install
npm start   # or: npx expo start
```

Then scan the QR code with Expo Go on your phone. The app will use the same backend as the web frontend.

## 5. Recommended naming (optional)

If you want an even cleaner structure, you can rename folders like this **in your Git repo**:

- `neocal_backend_ai_0336 2` → `backend`
- `fe_2` → `web`
- `cai_mobile_app` → `mobile`

After renaming, the layout would look like:

```text
apps/
  backend/     # FastAPI + Vercel Docker
  web/         # React + Vercel static build
  mobile/      # Expo app (runs via Expo Go / EAS)
```

You would then point your Vercel projects at `apps/backend` and `apps/web`, and run the mobile app from `apps/mobile`.

The existing code already supports env‑based backend URLs, so no internal code changes are required to adopt this layout; only the folder names and Vercel project roots would change.