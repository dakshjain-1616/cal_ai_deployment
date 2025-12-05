import subprocess
import time
import sys
import requests
import json
import os

print("Setting up database...")
try:
    sys.path.insert(0, '/app/neocal_backend_ai_0336')
    from database.db import engine, Base
    from database.init_db import init_db
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    init_db()
    print("✓ Database initialized")
except Exception as e:
    print(f"Database init error: {e}")
    import traceback
    traceback.print_exc()

print("\nStarting FastAPI server...")
server_process = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd="/app/neocal_backend_ai_0336",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

time.sleep(5)

print("Server started. Running API tests...\n")

BASE_URL = "http://localhost:8000"
success_count = 0
total_tests = 8
token = None
meal_id_1 = None

try:
    print("=" * 70)
    print("Testing 8 Core API Endpoints with Real Models")
    print("=" * 70)
    
    print("\n[1/8] POST /auth/anonymous-session")
    try:
        resp = requests.post(f"{BASE_URL}/auth/anonymous-session", timeout=10)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            auth_data = resp.json()
            token = auth_data.get("token")
            user_id = auth_data.get("user_id")
            print(f"   ✓ PASS - Token: {token[:20] if token else 'None'}..., User: {user_id}")
            success_count += 1
        else:
            print(f"   ✗ FAIL - Status {resp.status_code}: {resp.text[:100]}")
    except Exception as e:
        print(f"   ✗ EXCEPTION: {e}")
    
    if not token:
        raise Exception("Failed to get auth token")
    
    headers = {"X-Auth-Token": token}
    
    print("\n[2/8] GET /user/profile")
    try:
        resp = requests.get(f"{BASE_URL}/user/profile", headers=headers, timeout=10)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            profile = resp.json()
            print(f"   ✓ PASS - Profile retrieved, target: {profile.get('daily_calorie_target')}")
            success_count += 1
        else:
            print(f"   ✗ FAIL - {resp.text[:100]}")
    except Exception as e:
        print(f"   ✗ EXCEPTION: {e}")
    
    print("\n[3/8] PUT /user/profile")
    try:
        resp = requests.put(
            f"{BASE_URL}/user/profile",
            headers=headers,
            json={"daily_calorie_target": 2500, "timezone": "America/New_York"},
            timeout=10
        )
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"   ✓ PASS - Profile updated")
            success_count += 1
        else:
            print(f"   ✗ FAIL - {resp.text[:100]}")
    except Exception as e:
        print(f"   ✗ EXCEPTION: {e}")
    
    print("\n[4/8] POST /meals/from-text (GPT-2)")
    try:
        resp = requests.post(
            f"{BASE_URL}/meals/from-text",
            headers=headers,
            json={"description": "200g grilled chicken with 150g rice"},
            timeout=60
        )
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 201:
            meal = resp.json()
            meal_id_1 = meal.get("meal_id")
            cal = meal.get("total_calories")
            print(f"   ✓ PASS - Meal logged (ID: {meal_id_1}, Calories: {cal})")
            print(f"      Foods: {[f['name'] for f in meal.get('foods', [])]}")
            success_count += 1
        else:
            print(f"   ✗ FAIL - Status {resp.status_code}: {resp.text[:100]}")
    except Exception as e:
        print(f"   ✗ EXCEPTION: {e}")
    
    print("\n[5/8] POST /meals/from-image (CLIP)")
    try:
        resp = requests.post(
            f"{BASE_URL}/meals/from-image",
            headers=headers,
            json={"image_url": "https://example.com/pizza.jpg"},
            timeout=60
        )
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 201:
            meal = resp.json()
            meal_id_2 = meal.get("meal_id")
            cal = meal.get("total_calories")
            print(f"   ✓ PASS - Meal logged (ID: {meal_id_2}, Calories: {cal})")
            print(f"      Foods: {[f['name'] for f in meal.get('foods', [])]}")
            success_count += 1
        else:
            print(f"   ✗ FAIL - Status {resp.status_code}: {resp.text[:100]}")
    except Exception as e:
        print(f"   ✗ EXCEPTION: {e}")
    
    print("\n[6/8] POST /meals/from-barcode")
    try:
        resp = requests.post(
            f"{BASE_URL}/meals/from-barcode",
            headers=headers,
            json={"barcode": "012345678901", "serving_description": "330ml", "servings": 1},
            timeout=10
        )
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 201:
            meal = resp.json()
            meal_id_3 = meal.get("meal_id")
            cal = meal.get("total_calories")
            print(f"   ✓ PASS - Meal logged (ID: {meal_id_3}, Calories: {cal})")
            print(f"      Product: {meal.get('foods', [{}])[0].get('name', 'N/A')}")
            success_count += 1
        else:
            print(f"   ✗ FAIL - Status {resp.status_code}: {resp.text[:100]}")
    except Exception as e:
        print(f"   ✗ EXCEPTION: {e}")
    
    print("\n[7/8] GET /meals/{meal_id}")
    if meal_id_1:
        try:
            resp = requests.get(f"{BASE_URL}/meals/{meal_id_1}", headers=headers, timeout=10)
            print(f"   Status: {resp.status_code}")
            if resp.status_code == 200:
                meal = resp.json()
                print(f"   ✓ PASS - Retrieved meal details")
                success_count += 1
            else:
                print(f"   ✗ FAIL - {resp.text[:100]}")
        except Exception as e:
            print(f"   ✗ EXCEPTION: {e}")
    else:
        print(f"   ✗ SKIPPED - No meal_id from text parsing")
    
    print("\n[8/8] GET /meals?date=... (Daily list)")
    try:
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        resp = requests.get(f"{BASE_URL}/meals?date={today}", headers=headers, timeout=10)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            meals_list = resp.json()
            print(f"   ✓ PASS - Retrieved {len(meals_list)} meals for today")
            success_count += 1
        else:
            print(f"   ✗ FAIL - {resp.text[:100]}")
    except Exception as e:
        print(f"   ✗ EXCEPTION: {e}")
    
    print("\n" + "=" * 70)
    print(f"TEST RESULTS: {success_count}/{total_tests} endpoints PASSING")
    print("=" * 70)
    
    if success_count == total_tests:
        print("✓ ALL TESTS PASSED - API contract validated")
        sys.exit(0)
    else:
        print(f"✗ {total_tests - success_count} tests failed")
        sys.exit(1)
    
finally:
    print("\nShutting down server...")
    server_process.terminate()
    try:
        server_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server_process.kill()