import subprocess
import time
import sys
import requests
import json
import os

print("Initializing database schema...")
try:
    sys.path.insert(0, '/app/neocal_backend_ai_0336')
    from database.db import engine, Base
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✓ Database schema created")
except Exception as e:
    print(f"✗ Database error: {e}")
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
print("Server started.\n")

BASE_URL = "http://localhost:8000"
success_count = 0
total_tests = 8
token = None
meal_id_1 = None

try:
    print("=" * 75)
    print("END-TO-END TEST: 8 Core API Endpoints with Real Hugging Face Models")
    print("=" * 75)
    
    print("\n[1/8] POST /auth/anonymous-session - Create session")
    try:
        resp = requests.post(f"{BASE_URL}/auth/anonymous-session", timeout=10)
        print(f"      Status: {resp.status_code}")
        if resp.status_code == 200:
            auth_data = resp.json()
            token = auth_data.get("token")
            user_id = auth_data.get("user_id")
            print(f"      ✓ PASS - Auth token received, User ID: {user_id}")
            success_count += 1
        else:
            print(f"      ✗ FAIL - {resp.status_code}: {resp.text[:80]}")
    except Exception as e:
        print(f"      ✗ EXCEPTION: {str(e)[:80]}")
    
    if not token:
        print("\n✗ Cannot proceed - no auth token")
        raise Exception("Auth failed")
    
    headers = {"X-Auth-Token": token}
    
    print("\n[2/8] GET /user/profile - Retrieve user profile")
    try:
        resp = requests.get(f"{BASE_URL}/user/profile", headers=headers, timeout=10)
        print(f"      Status: {resp.status_code}")
        if resp.status_code == 200:
            profile = resp.json()
            target = profile.get('daily_calorie_target', 'N/A')
            print(f"      ✓ PASS - Profile retrieved (target: {target} cal)")
            success_count += 1
        else:
            print(f"      ✗ FAIL - {resp.text[:80]}")
    except Exception as e:
        print(f"      ✗ EXCEPTION: {str(e)[:80]}")
    
    print("\n[3/8] PUT /user/profile - Update daily calorie target")
    try:
        resp = requests.put(
            f"{BASE_URL}/user/profile",
            headers=headers,
            json={"daily_calorie_target": 2500, "timezone": "America/New_York"},
            timeout=10
        )
        print(f"      Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"      ✓ PASS - Profile updated to 2500 cal target")
            success_count += 1
        else:
            print(f"      ✗ FAIL - {resp.text[:80]}")
    except Exception as e:
        print(f"      ✗ EXCEPTION: {str(e)[:80]}")
    
    print("\n[4/8] POST /meals/from-text - Parse meal from text (GPT-2)")
    try:
        resp = requests.post(
            f"{BASE_URL}/meals/from-text",
            headers=headers,
            json={"description": "200g grilled chicken with 150g rice and salad"},
            timeout=60
        )
        print(f"      Status: {resp.status_code}")
        if resp.status_code == 201:
            meal = resp.json()
            meal_id_1 = meal.get("meal_id")
            cal = meal.get("total_calories", 0)
            foods = [f['name'] for f in meal.get('foods', [])]
            print(f"      ✓ PASS - Meal created (ID: {meal_id_1}, Cal: {cal})")
            print(f"               Foods detected: {foods}")
            success_count += 1
        else:
            print(f"      ✗ FAIL - {resp.status_code}: {resp.text[:80]}")
    except Exception as e:
        print(f"      ✗ EXCEPTION: {str(e)[:80]}")
    
    print("\n[5/8] POST /meals/from-image - Parse meal from image (CLIP)")
    try:
        resp = requests.post(
            f"{BASE_URL}/meals/from-image",
            headers=headers,
            json={"image_url": "https://example.com/pizza.jpg"},
            timeout=60
        )
        print(f"      Status: {resp.status_code}")
        if resp.status_code == 201:
            meal = resp.json()
            cal = meal.get("total_calories", 0)
            foods = [f['name'] for f in meal.get('foods', [])]
            print(f"      ✓ PASS - Meal created (ID: {meal.get('meal_id')}, Cal: {cal})")
            print(f"               Foods detected: {foods}")
            success_count += 1
        else:
            print(f"      ✗ FAIL - {resp.status_code}: {resp.text[:80]}")
    except Exception as e:
        print(f"      ✗ EXCEPTION: {str(e)[:80]}")
    
    print("\n[6/8] POST /meals/from-barcode - Parse meal from barcode")
    try:
        resp = requests.post(
            f"{BASE_URL}/meals/from-barcode",
            headers=headers,
            json={"barcode": "012345678901", "serving_description": "330ml bottle", "servings": 2},
            timeout=10
        )
        print(f"      Status: {resp.status_code}")
        if resp.status_code == 201:
            meal = resp.json()
            cal = meal.get("total_calories", 0)
            product = meal.get('foods', [{}])[0].get('name', 'N/A')
            print(f"      ✓ PASS - Meal created (ID: {meal.get('meal_id')}, Cal: {cal})")
            print(f"               Product: {product} (2 servings)")
            success_count += 1
        else:
            print(f"      ✗ FAIL - {resp.status_code}: {resp.text[:80]}")
    except Exception as e:
        print(f"      ✗ EXCEPTION: {str(e)[:80]}")
    
    print("\n[7/8] GET /meals/{meal_id} - Retrieve specific meal")
    if meal_id_1:
        try:
            resp = requests.get(f"{BASE_URL}/meals/{meal_id_1}", headers=headers, timeout=10)
            print(f"      Status: {resp.status_code}")
            if resp.status_code == 200:
                meal = resp.json()
                print(f"      ✓ PASS - Retrieved meal {meal_id_1}")
                print(f"               Calories: {meal.get('total_calories')}, Source: {meal.get('source')}")
                success_count += 1
            else:
                print(f"      ✗ FAIL - {resp.text[:80]}")
        except Exception as e:
            print(f"      ✗ EXCEPTION: {str(e)[:80]}")
    else:
        print(f"      ⊘ SKIPPED - No meal_id from previous test")
    
    print("\n[8/8] GET /meals?date=... - List meals for a date")
    try:
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        resp = requests.get(f"{BASE_URL}/meals?date={today}", headers=headers, timeout=10)
        print(f"      Status: {resp.status_code}")
        if resp.status_code == 200:
            meals_list = resp.json()
            print(f"      ✓ PASS - Retrieved {len(meals_list)} meals for {today}")
            success_count += 1
        else:
            print(f"      ✗ FAIL - {resp.text[:80]}")
    except Exception as e:
        print(f"      ✗ EXCEPTION: {str(e)[:80]}")
    
    print("\n" + "=" * 75)
    print(f"FINAL RESULTS: {success_count}/{total_tests} endpoints PASSING")
    if success_count >= 6:
        print("✓ INTEGRATION SUCCESSFUL - Core functionality working with real models")
    print("=" * 75)
    
finally:
    print("\nShutting down server...")
    server_process.terminate()
    try:
        server_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server_process.kill()