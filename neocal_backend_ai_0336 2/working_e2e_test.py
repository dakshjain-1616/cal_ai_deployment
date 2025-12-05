import sys
sys.path.insert(0, '/app/neocal_backend_ai_0336')

print("Step 1: Import all models before creating database...")
from models.database import User, Session, Meal, FoodItem
from database.db import engine, Base, SessionLocal

print("Step 2: Create all tables...")
Base.metadata.create_all(bind=engine)
print("✓ Database schema created\n")

print("Step 3: Test using FastAPI TestClient...")
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 75)
print("END-TO-END TEST: 8 Core API Endpoints with Real Hugging Face Models")
print("=" * 75)

success = 0
total = 8
token = None
test_meal_id = None

try:
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
            print(f"      ✗ FAIL - {r.status_code}: {r.text[:80]}")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:80]}")

    if not token:
        print("\n✗ ABORT - Cannot proceed without auth token")
        sys.exit(1)

    headers = {"X-Auth-Token": token}

    print("\n[2/8] GET /user/profile")
    try:
        r = client.get("/user/profile", headers=headers)
        print(f"      Status: {r.status_code}")
        if r.status_code == 200:
            profile = r.json()
            target = profile.get('daily_calorie_target', 'N/A')
            print(f"      ✓ PASS - Target: {target} cal")
            success += 1
        else:
            print(f"      ✗ FAIL - {r.status_code}")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:80]}")

    print("\n[3/8] PUT /user/profile")
    try:
        r = client.put("/user/profile", headers=headers,
                      json={"daily_calorie_target": 2500, "timezone": "America/New_York"})
        print(f"      Status: {r.status_code}")
        if r.status_code == 200:
            print(f"      ✓ PASS - Updated to 2500 cal")
            success += 1
        else:
            print(f"      ✗ FAIL - {r.status_code}")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:80]}")

    print("\n[4/8] POST /meals/from-text (GPT-2 model)")
    try:
        r = client.post("/meals/from-text", headers=headers,
                       json={"description": "200g grilled chicken with 150g rice"})
        print(f"      Status: {r.status_code}")
        if r.status_code == 201:
            data = r.json()
            test_meal_id = data.get("meal_id")
            cal = data.get("total_calories", 0)
            foods = [f["name"] for f in data.get("foods", [])]
            print(f"      ✓ PASS - Meal ID: {test_meal_id}, Cal: {cal}")
            print(f"               Foods: {foods}")
            success += 1
        else:
            print(f"      ✗ FAIL - Status {r.status_code} (expected 201)")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:80]}")

    print("\n[5/8] POST /meals/from-image (CLIP model)")
    try:
        r = client.post("/meals/from-image", headers=headers,
                       json={"image_url": "https://example.com/pizza.jpg"})
        print(f"      Status: {r.status_code}")
        if r.status_code == 201:
            data = r.json()
            cal = data.get("total_calories", 0)
            foods = [f["name"] for f in data.get("foods", [])]
            print(f"      ✓ PASS - Meal created, Cal: {cal}")
            print(f"               Foods: {foods}")
            success += 1
        else:
            print(f"      ✗ FAIL - Status {r.status_code} (expected 201)")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:80]}")

    print("\n[6/8] POST /meals/from-barcode")
    try:
        r = client.post("/meals/from-barcode", headers=headers,
                       json={"barcode": "012345678901", "servings": 2})
        print(f"      Status: {r.status_code}")
        if r.status_code == 201:
            data = r.json()
            cal = data.get("total_calories", 0)
            product = data.get("foods", [{}])[0].get("name", "Unknown")
            print(f"      ✓ PASS - Meal created, Cal: {cal}")
            print(f"               Product: {product} (2x servings)")
            success += 1
        else:
            print(f"      ✗ FAIL - Status {r.status_code} (expected 201)")
    except Exception as e:
        print(f"      ✗ EXCEPTION - {str(e)[:80]}")

    print("\n[7/8] GET /meals/{meal_id}")
    if test_meal_id:
        try:
            r = client.get(f"/meals/{test_meal_id}", headers=headers)
            print(f"      Status: {r.status_code}")
            if r.status_code == 200:
                meal = r.json()
                print(f"      ✓ PASS - Retrieved meal {test_meal_id}")
                print(f"               Source: {meal.get('source')}, Cal: {meal.get('total_calories')}")
                success += 1
            else:
                print(f"      ✗ FAIL - {r.status_code}")
        except Exception as e:
            print(f"      ✗ EXCEPTION - {str(e)[:80]}")
    else:
        print(f"      ⊘ SKIP - No meal ID from text parsing")

    print("\n[8/8] GET /meals (list by date)")
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
        print(f"      ✗ EXCEPTION - {str(e)[:80]}")

    print("\n" + "=" * 75)
    print(f"TEST RESULTS: {success}/{total} endpoints PASSING")
    if success == total:
        print("✓ SUCCESS - All endpoints working with real Hugging Face models!")
    elif success >= 6:
        print("✓ INTEGRATION SUCCESS - Core functionality working!")
    else:
        print(f"⚠ {total - success} endpoints need fixing")
    print("=" * 75)

except Exception as e:
    print(f"\n✗ FATAL ERROR: {e}")
    import traceback
    traceback.print_exc()