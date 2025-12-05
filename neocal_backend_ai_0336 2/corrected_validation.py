import sys
import os
import json
from datetime import datetime

sys.path.insert(0, '/app/neocal_backend_ai_0336')
os.chdir('/app/neocal_backend_ai_0336')

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 80)
print("NEOCAL BACKEND - CORRECTED COMPREHENSIVE E2E VALIDATION")
print("=" * 80)

results = {
    "total_tests": 0,
    "passed": 0,
    "failed": 0,
    "issues": [],
    "test_details": []
}

print("\n" + "=" * 80)
print("PHASE 1: AUTHENTICATION FLOW VALIDATION")
print("=" * 80)

print("\n[1.1] Create Anonymous Session (POST /auth/anonymous-session)")
resp = client.post("/auth/anonymous-session")
results["total_tests"] += 1
print(f"Status: {resp.status_code} (expected: 200)")
if resp.status_code == 200:
    data = resp.json()
    if 'token' in data and 'user_id' in data:
        token = data['token']
        user_id = data['user_id']
        print(f"✓ PASS - Token: {token[:20]}..., User ID: {user_id}")
        results["passed"] += 1
    else:
        print(f"✗ FAIL - Missing required fields. Got: {list(data.keys())}")
        results["failed"] += 1
        results["issues"].append(f"Auth endpoint missing fields: {list(data.keys())}")
else:
    print(f"✗ FAIL - Unexpected status code")
    results["failed"] += 1
    results["issues"].append(f"Auth endpoint returned {resp.status_code}")

print("\n[1.2] Test Missing Auth Token (GET /user/profile without token)")
resp = client.get("/user/profile")
results["total_tests"] += 1
print(f"Status: {resp.status_code} (expected: 401)")
if resp.status_code == 401:
    print("✓ PASS - Correctly rejects missing token")
    results["passed"] += 1
else:
    print("✗ FAIL - Should return 401 for missing token")
    results["failed"] += 1
    results["issues"].append(f"Missing auth token not properly rejected: {resp.status_code}")

headers = {"X-Auth-Token": token}

print("\n" + "=" * 80)
print("PHASE 2: USER PROFILE ENDPOINTS")
print("=" * 80)

print("\n[2.1] Get User Profile (GET /user/profile with valid token)")
resp = client.get("/user/profile", headers=headers)
results["total_tests"] += 1
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    required_fields = ['user_id', 'daily_calorie_target', 'timezone']
    if all(field in data for field in required_fields):
        print(f"✓ PASS - Has all required fields: {required_fields}")
        print(f"  Values: daily_target={data['daily_calorie_target']}, timezone={data['timezone']}")
        results["passed"] += 1
    else:
        missing = [f for f in required_fields if f not in data]
        print(f"✗ FAIL - Missing fields: {missing}")
        results["failed"] += 1
        results["issues"].append(f"User profile missing: {missing}")
else:
    print(f"✗ FAIL - Status {resp.status_code}")
    results["failed"] += 1

print("\n[2.2] Update User Profile (PUT /user/profile)")
update_data = {"daily_calorie_target": 2500, "timezone": "America/New_York"}
resp = client.put("/user/profile", json=update_data, headers=headers)
results["total_tests"] += 1
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    if data.get('daily_calorie_target') == 2500 and data.get('timezone') == "America/New_York":
        print(f"✓ PASS - Profile updated correctly")
        results["passed"] += 1
    else:
        print(f"✗ FAIL - Updates not applied")
        results["failed"] += 1
        results["issues"].append("Profile update not persisting")
else:
    print(f"✗ FAIL - Status {resp.status_code}")
    results["failed"] += 1

print("\n" + "=" * 80)
print("PHASE 3: MEAL LOGGING ENDPOINTS")
print("=" * 80)

meal_ids = {}

print("\n[3.1] Log Meal from Text (POST /meals/from-text)")
text_payload = {"description": "2 slices of pizza and a coke"}
resp = client.post("/meals/from-text", json=text_payload, headers=headers)
results["total_tests"] += 1
print(f"Status: {resp.status_code}")
if resp.status_code == 201 or resp.status_code == 200:
    data = resp.json()
    required_fields = ['meal_id', 'timestamp', 'source', 'foods', 'total_calories', 'total_macros', 'confidence_score']
    if all(field in data for field in required_fields):
        meal_ids['text'] = data['meal_id']
        print(f"✓ PASS - Created meal: {data['meal_id']}")
        print(f"  Calories: {data['total_calories']}, Foods: {len(data['foods'])}")
        results["passed"] += 1
    else:
        missing = [f for f in required_fields if f not in data]
        print(f"✗ FAIL - Missing fields: {missing}")
        results["failed"] += 1
        results["issues"].append(f"Text meal response missing: {missing}")
else:
    print(f"✗ FAIL - Status {resp.status_code}")
    print(f"  Response: {resp.json()}")
    results["failed"] += 1
    results["issues"].append(f"Text meal endpoint returned {resp.status_code}")

print("\n[3.2] Log Meal from Image (POST /meals/from-image)")
image_payload = {"image_url": "https://example.com/meal.jpg"}
resp = client.post("/meals/from-image", json=image_payload, headers=headers)
results["total_tests"] += 1
print(f"Status: {resp.status_code}")
if resp.status_code == 200 or resp.status_code == 201:
    data = resp.json()
    meal_ids['image'] = data.get('meal_id')
    print(f"✓ PASS - Created meal: {data.get('meal_id')}")
    print(f"  Calories: {data.get('total_calories')}")
    results["passed"] += 1
else:
    print(f"✗ FAIL - Status {resp.status_code}")
    results["failed"] += 1

print("\n[3.3] Log Meal from Barcode (POST /meals/from-barcode)")
barcode_payload = {"barcode": "012345678905", "servings": 1}
resp = client.post("/meals/from-barcode", json=barcode_payload, headers=headers)
results["total_tests"] += 1
print(f"Status: {resp.status_code}")
if resp.status_code == 200 or resp.status_code == 201:
    data = resp.json()
    meal_ids['barcode'] = data.get('meal_id')
    print(f"✓ PASS - Created meal: {data.get('meal_id')}")
    print(f"  Calories: {data.get('total_calories')}")
    results["passed"] += 1
else:
    print(f"✗ FAIL - Status {resp.status_code}")
    results["failed"] += 1

print("\n" + "=" * 80)
print("PHASE 4: MEAL RETRIEVAL ENDPOINTS")
print("=" * 80)

print("\n[4.1] Get Specific Meal (GET /meals/{meal_id})")
if 'image' in meal_ids and meal_ids['image']:
    meal_id = meal_ids['image']
    resp = client.get(f"/meals/{meal_id}", headers=headers)
    results["total_tests"] += 1
    print(f"Status: {resp.status_code} (retrieving {meal_id})")
    if resp.status_code == 200:
        data = resp.json()
        if data.get('meal_id') == meal_id:
            print(f"✓ PASS - Retrieved meal correctly")
            results["passed"] += 1
        else:
            print(f"✗ FAIL - Retrieved wrong meal")
            results["failed"] += 1
            results["issues"].append("Retrieved meal ID mismatch")
    else:
        print(f"✗ FAIL - Status {resp.status_code}")
        results["failed"] += 1
        results["issues"].append(f"Meal retrieval returned {resp.status_code}")
else:
    print("SKIP - No meal_id from previous test")

print("\n[4.2] List Meals by Date (GET /meals?date=YYYY-MM-DD)")
today = datetime.now().strftime("%Y-%m-%d")
resp = client.get(f"/meals?date={today}", headers=headers)
results["total_tests"] += 1
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    if isinstance(data, list):
        print(f"✓ PASS - Returned {len(data)} meals as list")
        results["passed"] += 1
    elif isinstance(data, dict) and 'meals' in data:
        meals_list = data['meals']
        print(f"✓ PASS - Returned {len(meals_list)} meals in object")
        results["passed"] += 1
    else:
        print(f"✗ FAIL - Unexpected response format: {type(data)}")
        results["failed"] += 1
        results["issues"].append(f"List meals returned unexpected format: {list(data.keys()) if isinstance(data, dict) else type(data)}")
else:
    print(f"✗ FAIL - Status {resp.status_code}")
    results["failed"] += 1

print("\n" + "=" * 80)
print("PHASE 5: DAILY SUMMARY")
print("=" * 80)

print("\n[5.1] Get Daily Summary (GET /summary/day?date=YYYY-MM-DD)")
resp = client.get(f"/summary/day?date={today}", headers=headers)
results["total_tests"] += 1
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    required_fields = ['date', 'total_calories', 'total_macros', 'remaining_calories']
    if all(field in data for field in required_fields):
        print(f"✓ PASS - Summary complete")
        print(f"  Date: {data['date']}")
        print(f"  Total calories: {data['total_calories']}")
        print(f"  Remaining: {data['remaining_calories']}")
        results["passed"] += 1
    else:
        missing = [f for f in required_fields if f not in data]
        print(f"✗ FAIL - Missing: {missing}")
        results["failed"] += 1
        results["issues"].append(f"Summary missing: {missing}")
else:
    print(f"✗ FAIL - Status {resp.status_code}")
    results["failed"] += 1

print("\n" + "=" * 80)
print("PHASE 6: ERROR HANDLING")
print("=" * 80)

print("\n[6.1] Invalid Date Format (GET /meals?date=invalid)")
resp = client.get("/meals?date=invalid-date", headers=headers)
results["total_tests"] += 1
print(f"Status: {resp.status_code} (expected: 400)")
if resp.status_code == 400:
    print("✓ PASS - Correctly rejects invalid date")
    results["passed"] += 1
else:
    print(f"✗ FAIL - Should return 400, got {resp.status_code}")
    results["failed"] += 1

print("\n[6.2] Non-existent Meal (GET /meals/nonexistent)")
resp = client.get("/meals/nonexistent", headers=headers)
results["total_tests"] += 1
print(f"Status: {resp.status_code} (expected: 404)")
if resp.status_code == 404:
    print("✓ PASS - Correctly returns 404")
    results["passed"] += 1
else:
    print(f"✗ FAIL - Should return 404, got {resp.status_code}")
    results["failed"] += 1

print("\n" + "=" * 80)
print("VALIDATION SUMMARY")
print("=" * 80)
print(f"Total tests: {results['total_tests']}")
print(f"Passed: {results['passed']}")
print(f"Failed: {results['failed']}")
success_rate = (results['passed'] / max(results['total_tests'], 1)) * 100
print(f"Success rate: {success_rate:.1f}%")

if results['issues']:
    print("\nIssues Found:")
    for i, issue in enumerate(results['issues'], 1):
        print(f"  {i}. {issue}")

print("\n" + "=" * 80)
print("STATUS")
print("=" * 80)
if success_rate >= 90:
    print("✓ VALIDATION PASSED - Backend is production-ready")
elif success_rate >= 70:
    print("⚠ VALIDATION PARTIAL - Most features working, some issues to fix")
else:
    print("✗ VALIDATION FAILED - Critical issues to resolve")