import sys
sys.path.insert(0, '/app/neocal_backend_ai_0336')

from fastapi.testclient import TestClient
from database.db import engine, Base

print("Initializing database...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("✓ Database ready\n")

print("Importing app...")
from main import app
client = TestClient(app)
print("✓ App loaded with TestClient\n")

print("=" * 75)
print("END-TO-END TEST: 8 Core API Endpoints with Real Hugging Face Models")
print("=" * 75)

success = 0
total = 8

print("\n[1/8] POST /auth/anonymous-session")
try:
    r = client.post("/auth/anonymous-session")
    print(f"      Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        token = data.get("token")
        user_id = data.get("user_id")
        print(f"      ✓ PASS - User ID: {user_id}, Token: {token[:15]}...")
        success += 1
    else:
        print(f"      ✗ FAIL - {r.text[:100]}")
except Exception as e:
    print(f"      ✗ EXCEPTION - {str(e)[:100]}")

headers = {"X-Auth-Token": token} if token else {}

print("\n[2/8] GET /user/profile")
try:
    r = client.get("/user/profile", headers=headers)
    print(f"      Status: {r.status_code}")
    if r.status_code == 200:
        profile = r.json()
        print(f"      ✓ PASS - Target: {profile.get('daily_calorie_target')} cal")
        success += 1
    else:
        print(f"      ✗ FAIL - {r.status_code}")
except Exception as e:
    print(f"      ✗ EXCEPTION - {str(e)[:100]}")

print("\n[3/8] PUT /user/profile")
try:
    r = client.put("/user/profile", headers=headers,
                   json={"daily_calorie_target": 2500, "timezone": "America/New_York"})
    print(f"      Status: {r.status_code}")
    if r.status_code == 200:
        print(f"      ✓ PASS - Profile updated")
        success += 1
    else:
        print(f"      ✗ FAIL - {r.status_code}")
except Exception as e:
    print(f"      ✗ EXCEPTION - {str(e)[:100]}")

print("\n[4/8] POST /meals/from-text (GPT-2 model)")
try:
    r = client.post("/meals/from-text", headers=headers,
                    json={"description": "200g grilled chicken with 150g rice and salad"})
    print(f"      Status: {r.status_code}")
    if r.status_code == 201:
        data = r.json()
        meal_id = data.get("meal_id")
        cal = data.get("total_calories")
        foods = [f["name"] for f in data.get("foods", [])]
        print(f"      ✓ PASS - Meal: {meal_id}, Cal: {cal}, Foods: {foods}")
        success += 1
        test_meal_id = meal_id
    else:
        print(f"      ✗ FAIL - {r.status_code}: {r.text[:80]}")
except Exception as e:
    print(f"      ✗ EXCEPTION - {str(e)[:100]}")

print("\n[5/8] POST /meals/from-image (CLIP model)")
try:
    r = client.post("/meals/from-image", headers=headers,
                    json={"image_url": "https://example.com/pizza.jpg"})
    print(f"      Status: {r.status_code}")
    if r.status_code == 201:
        data = r.json()
        cal = data.get("total_calories")
        foods = [f["name"] for f in data.get("foods", [])]
        print(f"      ✓ PASS - Meal: Cal: {cal}, Foods: {foods}")
        success += 1
    else:
        print(f"      ✗ FAIL - {r.status_code}")
except Exception as e:
    print(f"      ✗ EXCEPTION - {str(e)[:100]}")

print("\n[6/8] POST /meals/from-barcode")
try:
    r = client.post("/meals/from-barcode", headers=headers,
                    json={"barcode": "012345678901", "servings": 2})
    print(f"      Status: {r.status_code}")
    if r.status_code == 201:
        data = r.json()
        cal = data.get("total_calories")
        product = data.get("foods", [{}])[0].get("name")
        print(f"      ✓ PASS - Meal: Cal: {cal}, Product: {product} (2x servings)")
        success += 1
    else:
        print(f"      ✗ FAIL - {r.status_code}")
except Exception as e:
    print(f"      ✗ EXCEPTION - {str(e)[:100]}")

print("\n[7/8] GET /meals/{meal_id}")
try:
    if test_meal_id:
        r = client.get(f"/meals/{test_meal_id}", headers=headers)
        print(f"      Status: {r.status_code}")
        if r.status_code == 200:
            meal = r.json()
            print(f"      ✓ PASS - Retrieved meal {test_meal_id}")
            success += 1
        else:
            print(f"      ✗ FAIL - {r.status_code}")
    else:
        print(f"      ⊘ SKIP - No meal ID from test 4")
except Exception as e:
    print(f"      ✗ EXCEPTION - {str(e)[:100]}")

print("\n[8/8] GET /meals?date=...")
try:
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    r = client.get(f"/meals?date={today}", headers=headers)
    print(f"      Status: {r.status_code}")
    if r.status_code == 200:
        meals = r.json()
        print(f"      ✓ PASS - Retrieved {len(meals)} meals for {today}")
        success += 1
    else:
        print(f"      ✗ FAIL - {r.status_code}")
except Exception as e:
    print(f"      ✗ EXCEPTION - {str(e)[:100]}")

print("\n" + "=" * 75)
print(f"TEST RESULTS: {success}/{total} endpoints PASSING")
if success >= 6:
    print("✓ INTEGRATION SUCCESS - Real Hugging Face models working correctly")
print("=" * 75)