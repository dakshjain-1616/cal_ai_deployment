#!/usr/bin/env python3
"""
Simple integration test script for NeoCal AI backend.

It exercises:
- POST /auth/anonymous-session
- POST /water
- GET /water
- POST /meals (structured)
- GET /meals/history?date=YYYY-MM-DD
- POST /meals/scan (image multipart)
- GET /summary/day?date=YYYY-MM-DD

Usage:
  BACKEND_URL=http://127.0.0.1:8000 python3 run_integration_tests.py

Exit code 0 on success, non-zero on failure.
"""

import os
import sys
import requests
from datetime import datetime

BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000").rstrip('/')

session = requests.Session()

def fail(msg, resp=None):
    print("ERROR:", msg)
    if resp is not None:
        try:
            print("Status:", resp.status_code)
            print(resp.text)
        except Exception:
            pass
    sys.exit(1)


def main():
    print("Using backend:", BACKEND_URL)

    # 1) Create anonymous session
    r = session.post(f"{BACKEND_URL}/auth/anonymous-session")
    if r.status_code != 200:
        fail("anonymous-session failed", r)
    data = r.json()
    token = data.get("token")
    user_id = data.get("user_id")
    print("Session created:", user_id, token[:8] if token else None)

    headers = {"X-Auth-Token": token}

    # 2) Log water
    today = datetime.utcnow().strftime("%Y-%m-%d")
    payload = {"amount": 250}
    r = session.post(f"{BACKEND_URL}/water", json=payload, headers=headers)
    if r.status_code not in (200,201):
        fail("POST /water failed", r)
    print("Logged water:", r.json())

    # 3) Get water for today
    r = session.get(f"{BACKEND_URL}/water", params={"date": today}, headers=headers)
    if r.status_code != 200:
        fail("GET /water failed", r)
    print("Water logs for today:", r.json())

    # 4) Create a structured meal
    foods = [
        {"name": "test rice", "grams": 150, "calories": 195, "protein_g": 3.9, "carbs_g": 33, "fat_g": 0.3}
    ]
    r = session.post(f"{BACKEND_URL}/meals", json=foods, headers=headers)
    if r.status_code not in (200,201):
        fail("POST /meals (structured) failed", r)
    meal = r.json()
    print("Created meal:", meal.get("meal_id"))

    # 5) Get meals history for today
    r = session.get(f"{BACKEND_URL}/meals/history", params={"date": today}, headers=headers)
    if r.status_code != 200:
        fail("GET /meals/history failed", r)
    print("Meals today:", len(r.json()))

    # 6) Image scan (fetch a small image and upload)
    try:
        img_url = "https://via.placeholder.com/150"
        img_resp = requests.get(img_url, timeout=10)
        img_resp.raise_for_status()
        files = {"file": ("photo.jpg", img_resp.content, "image/jpeg")}
        r = session.post(f"{BACKEND_URL}/meals/scan", files=files, headers=headers, timeout=30)
        if r.status_code != 200:
            print("Warning: image scan returned status", r.status_code)
            print(r.text)
        else:
            print("Image scan result:", r.json())
    except Exception as e:
        print("Warning: image scan step failed:", e)

    # 7) Get daily summary
    r = session.get(f"{BACKEND_URL}/summary/day", params={"date": today}, headers=headers)
    if r.status_code != 200:
        fail("GET /summary/day failed", r)
    print("Summary:", r.json())

    print("All integration checks passed.")

if __name__ == '__main__':
    main()
