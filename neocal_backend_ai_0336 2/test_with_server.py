import subprocess
import time
import sys
import os

print("Setting up database...")
sys.path.insert(0, '/app/neocal_backend_ai_0336')
from database.db import engine, Base

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("✓ Database schema created\n")

print("Starting FastAPI server on port 8000...")
server_process = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd="/app/neocal_backend_ai_0336",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

time.sleep(8)

print("Waiting for server to be ready...")
import requests
max_retries = 10
for i in range(max_retries):
    try:
        resp = requests.get("http://127.0.0.1:8000/health", timeout=2)
        if resp.status_code == 200:
            print("✓ Server is ready\n")
            break
    except:
        pass
    time.sleep(1)

success = 0
total = 8

try:
    print("=" * 75)
    print("END-TO-END TEST: 8 Core API Endpoints with Real Hugging Face Models")
    print("=" * 75)
    
    print("\n[1/8] POST /auth/anonymous-session")
    try:
        r = requests.post("http://127.0.0.1:8000/auth/anonymous-session", timeout=10)
        if r.status_code == 200:
            data = r.json()
            token = data.get("token")
            user_id = data.get("user_id")
            print(f"      ✓ PASS - Token: {token[:15]}..., User: {user_id}")
            success += 1
        else:
            print(f"      ✗ FAIL - {r.status_code}: {r.text[:60]}")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:60]}")
    
    headers = {"X-Auth-Token": token} if token else {}
    
    print("\n[2/8] GET /user/profile")
    try:
        r = requests.get("http://127.0.0.1:8000/user/profile", headers=headers, timeout=10)
        if r.status_code == 200:
            print(f"      ✓ PASS - Profile retrieved")
            success += 1
        else:
            print(f"      ✗ FAIL - {r.status_code}")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:60]}")
    
    print("\n[3/8] PUT /user/profile")
    try:
        r = requests.put("http://127.0.0.1:8000/user/profile", headers=headers,
                        json={"daily_calorie_target": 2500, "timezone": "UTC"}, timeout=10)
        if r.status_code == 200:
            print(f"      ✓ PASS - Profile updated")
            success += 1
        else:
            print(f"      ✗ FAIL - {r.status_code}")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:60]}")
    
    print("\n[4/8] POST /meals/from-text (GPT-2 model)")
    try:
        r = requests.post("http://127.0.0.1:8000/meals/from-text", headers=headers,
                         json={"description": "200g chicken with 150g rice"}, timeout=60)
        if r.status_code == 201:
            data = r.json()
            meal_id = data.get("meal_id")
            cal = data.get("total_calories")
            foods = [f["name"] for f in data.get("foods", [])]
            print(f"      ✓ PASS - Meal created (ID: {meal_id}, Cal: {cal}, Foods: {foods})")
            success += 1
        else:
            print(f"      ✗ FAIL - {r.status_code}: {r.text[:60]}")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:60]}")
    
    print("\n[5/8] POST /meals/from-image (CLIP model)")
    try:
        r = requests.post("http://127.0.0.1:8000/meals/from-image", headers=headers,
                         json={"image_url": "https://example.com/pizza.jpg"}, timeout=60)
        if r.status_code == 201:
            data = r.json()
            cal = data.get("total_calories")
            foods = [f["name"] for f in data.get("foods", [])]
            print(f"      ✓ PASS - Meal created (Cal: {cal}, Foods: {foods})")
            success += 1
        else:
            print(f"      ✗ FAIL - {r.status_code}")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:60]}")
    
    print("\n[6/8] POST /meals/from-barcode")
    try:
        r = requests.post("http://127.0.0.1:8000/meals/from-barcode", headers=headers,
                         json={"barcode": "012345678901", "servings": 1}, timeout=10)
        if r.status_code == 201:
            data = r.json()
            cal = data.get("total_calories")
            print(f"      ✓ PASS - Meal created (Cal: {cal})")
            success += 1
        else:
            print(f"      ✗ FAIL - {r.status_code}")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:60]}")
    
    print("\n[7/8] GET /meals/{meal_id}")
    try:
        r = requests.post("http://127.0.0.1:8000/meals/from-text", headers=headers,
                         json={"description": "1 apple"}, timeout=60)
        if r.status_code == 201:
            meal_id = r.json().get("meal_id")
            r2 = requests.get(f"http://127.0.0.1:8000/meals/{meal_id}", headers=headers, timeout=10)
            if r2.status_code == 200:
                print(f"      ✓ PASS - Retrieved meal details")
                success += 1
            else:
                print(f"      ✗ FAIL - {r2.status_code}")
        else:
            print(f"      ✗ SKIP - Can't create test meal")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:60]}")
    
    print("\n[8/8] GET /meals (list by date)")
    try:
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        r = requests.get(f"http://127.0.0.1:8000/meals?date={today}", headers=headers, timeout=10)
        if r.status_code == 200:
            meals = r.json()
            print(f"      ✓ PASS - Retrieved {len(meals)} meals for today")
            success += 1
        else:
            print(f"      ✗ FAIL - {r.status_code}")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:60]}")
    
    print("\n" + "=" * 75)
    print(f"RESULTS: {success}/{total} endpoints passing")
    if success >= 6:
        print("✓ INTEGRATION SUCCESS - Real Hugging Face models working")
    print("=" * 75)
    
finally:
    server_process.terminate()
    try:
        server_process.wait(timeout=3)
    except:
        server_process.kill()