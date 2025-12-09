"""
Vercel Python entrypoint for the NeoCal FastAPI backend.

Vercel's Python runtime will look for an ASGI application object named `app`
in this file. We simply import the FastAPI `app` defined in `main.py`.

Docs:
- https://vercel.com/docs/functions/serverless-functions/runtimes/python
"""

from main import app  # FastAPI instance defined in main.py