import subprocess
import time
import sys
import requests
import json

print("Initializing database...")
try:
    from database.db import engine, Base
    from database.init_db import init_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    init_db(engine)
    print("✓ Database initialized")
except Exception as e:
    print(f"Database init: {e}")

print("\nStarting FastAPI server...")
server_process = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd="/app/neocal_backend_ai_0336",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

time.sleep(4)

print("Server started. Running API tests...\n")

BASE_URL = "http://localhost:8000"
success_count = 0
total_tests = 8

try:
    print("=" * 70)
    print("Testing 8 Core API Endpoints with Real Models")
    print("=" * 70)
    
    print("\n1. POST /auth/anonymous-session")
    resp = requests.post(f"{BASE_URL}/auth/anonymous-session", timeout=10)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        auth_data = resp.json()
        token = auth_data["token"]
        user_id = auth_data["user_id"]
        print(f"   ✓ Token: {token[:20]}..., User: {user_id}")
        success_count += 1
    else:
        print(f"   ✗ Failed: {resp.text}")
    
    headers = {"X-Auth-Token": token}
    
    print("\n2. GET /user/profile")
    resp = requests.get(f"{BASE_URL}/user/profile", headers=headers, timeout=10)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        profile = resp.json()
        print(f"   ✓ User profile retrieved")
        success_count += 1
    else:
        print(f"   ✗ Failed: {resp.text}")
    
    print("\n3. PUT /user/profile")
    resp = requests.put(
        f"{BASE_URL}/user/profile",
        headers=headers,
        json={"daily_calorie_target": 2500, "timezone": "America/New_York"},
        timeout=10
    )
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        print(f"   ✓ User profile updated")
        success_count += 1
    else:
        print(f"   ✗ Failed: {resp.text}")
    
    print("\n4. POST /meals/from-text")
    resp = requests.post(
        f"{BASE_URL}/meals/from-text",
        headers=headers,
        json={"description": "200g grilled chicken with 150g rice"},
        timeout=30
    )
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 201:
        meal = resp.json()
        meal_id_1 = meal["meal_id"]
        print(f"   ✓ Meal ID: {meal_id_1}, Calories: {meal['total_calories']}")
        success_count += 1
    else:
        print(f"   ✗ Failed: {resp.text}")
    
    print("\n5. POST /meals/from-image")
    resp = requests.post(
        f"{BASE_URL}/meals/from-image",
        headers=headers,
        json={"image_url": "https://example.com/pizza.jpg"},
        timeout=30
    )
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 201:
        meal = resp.json()
        meal_id_2 = meal["meal_id"]
        print(f"   ✓ Meal ID: {meal_id_2}, Calories: {meal['total_calories']}")
        success_count += 1
    else:
        print(f"   ✗ Failed: {resp.text}")
    
    print("\n6. POST /meals/from-barcode")
    resp = requests.post(
        f"{BASE_URL}/meals/from-barcode",
        headers=headers,
        json={"barcode": "012345678901", "serving_description": "330ml", "servings": 1},
        timeout=10
    )
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 201:
        meal = resp.json()
        meal_id_3 = meal["meal_id"]
        print(f"   ✓ Meal ID: {meal_id_3}, Calories: {meal['total_calories']}")
        success_count += 1
    else:
        print(f"   ✗ Failed: {resp.text}")
    
    print("\n7. GET /meals/{meal_id}")
    resp = requests.get(f"{BASE_URL}/meals/{meal_id_1}", headers=headers, timeout=10)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        meal = resp.json()
        print(f"   ✓ Retrieved meal details")
        success_count += 1
    else:
        print(f"   ✗ Failed: {resp.text}")
    
    print("\n8. GET /meals?date=...")
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    resp = requests.get(f"{BASE_URL}/meals?date={today}", headers=headers, timeout=10)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        meals_list = resp.json()
        print(f"   ✓ Retrieved {len(meals_list)} meals for today")
        success_count += 1
    else:
        print(f"   ✗ Failed: {resp.text}")
    
    print("\n" + "=" * 70)
    print(f"Test Results: {success_count}/{total_tests} endpoints passing")
    print("=" * 70)
    
finally:
    print("\nShutting down server...")
    server_process.terminate()
    try:
        server_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server_process.kill()