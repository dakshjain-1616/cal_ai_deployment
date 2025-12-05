import sys
import os
import json
from datetime import datetime, timedelta

sys.path.insert(0, '/app/neocal_backend_ai_0336')
os.chdir('/app/neocal_backend_ai_0336')

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 80)
print("NEOCAL BACKEND - COMPREHENSIVE E2E VALIDATION")
print("=" * 80)

results = {
    "total_endpoints": 0,
    "passed": 0,
    "failed": 0,
    "endpoint_results": []
}

def test_endpoint(name, method, path, **kwargs):
    """Generic endpoint tester"""
    print(f"\n[TEST] {name}")
    print(f"  {method.upper()} {path}")
    
    try:
        if method.lower() == "post":
            response = client.post(path, **kwargs)
        elif method.lower() == "get":
            response = client.get(path, **kwargs)
        elif method.lower() == "put":
            response = client.put(path, **kwargs)
        else:
            raise ValueError(f"Unknown method: {method}")
        
        print(f"  Status: {response.status_code}")
        data = response.json()
        print(f"  Response keys: {list(data.keys())}")
        
        result = {
            "name": name,
            "method": method.upper(),
            "path": path,
            "status": response.status_code,
            "response_keys": list(data.keys()),
            "full_response": data
        }
        
        results["endpoint_results"].append(result)
        results["total_endpoints"] += 1
        
        if 200 <= response.status_code < 300:
            results["passed"] += 1
            print("  ✓ PASS")
            return data, True
        else:
            results["failed"] += 1
            print("  ✗ FAIL")
            return data, False
    except Exception as e:
        print(f"  ✗ ERROR: {e}")
        results["failed"] += 1
        results["total_endpoints"] += 1
        return None, False

print("\n" + "=" * 80)
print("ENDPOINT TESTS")
print("=" * 80)

data, ok = test_endpoint("Health Check", "GET", "/health")

print("\n--- Authentication Flow ---")
data, ok = test_endpoint("Create Anonymous Session", "POST", "/auth/anonymous-session")
if ok:
    token = data.get('token')
    user_id = data.get('user_id')
    print(f"  Token: {token}")
    print(f"  User ID: {user_id}")
else:
    print("ERROR: Failed to create session. Cannot continue with authenticated tests.")
    token = "invalid"
    user_id = None

headers = {"X-Auth-Token": token}

print("\n--- User Profile Endpoints ---")
data, ok = test_endpoint("Get User Profile", "GET", "/user/profile", headers=headers)
if ok:
    print(f"  User data: daily_target={data.get('daily_calorie_target')}, timezone={data.get('timezone')}")

data, ok = test_endpoint(
    "Update User Profile",
    "PUT",
    "/user/profile",
    headers=headers,
    json={"daily_calorie_target": 2500, "timezone": "UTC"}
)

print("\n--- Meal Logging Endpoints ---")
data, ok = test_endpoint(
    "Log Meal from Text",
    "POST",
    "/meals/from-text",
    headers=headers,
    json={"text": "2 slices of pizza and a coke"}
)
if ok:
    meal_id = data.get('meal_id')
    print(f"  Meal ID: {meal_id}")
    total_cal = data.get('total_calories')
    print(f"  Total calories: {total_cal}")

data, ok = test_endpoint(
    "Log Meal from Image",
    "POST",
    "/meals/from-image",
    headers=headers,
    json={"image_url": "https://example.com/meal.jpg"}
)
if ok:
    print(f"  Meal ID: {data.get('meal_id')}")

data, ok = test_endpoint(
    "Log Meal from Barcode",
    "POST",
    "/meals/from-barcode",
    headers=headers,
    json={"barcode": "012345678905", "servings": 1}
)
if ok:
    print(f"  Meal ID: {data.get('meal_id')}")

print("\n--- Meal Retrieval Endpoints ---")
data, ok = test_endpoint(
    "Get Specific Meal",
    "GET",
    "/meals/1",
    headers=headers
)

data, ok = test_endpoint(
    "List Meals by Date",
    "GET",
    "/meals?date=" + datetime.now().strftime("%Y-%m-%d"),
    headers=headers
)
if ok:
    print(f"  Meals count: {len(data.get('meals', []))}")

print("\n--- Summary Endpoints ---")
data, ok = test_endpoint(
    "Get Daily Summary",
    "GET",
    "/summary/day?date=" + datetime.now().strftime("%Y-%m-%d"),
    headers=headers
)
if ok:
    print(f"  Total calories: {data.get('total_calories')}")
    print(f"  Remaining calories: {data.get('remaining_calories')}")

print("\n--- Error Handling Tests ---")
print("\n[TEST] Missing Auth Token")
response = client.get("/user/profile")
print(f"  Status: {response.status_code} (expected 401)")
if response.status_code == 401:
    print("  ✓ PASS")
else:
    print("  ✗ FAIL")

print("\n[TEST] Invalid Date Format")
response = client.get("/meals?date=invalid-date", headers=headers)
print(f"  Status: {response.status_code} (expected 400)")

print("\n" + "=" * 80)
print("VALIDATION SUMMARY")
print("=" * 80)
print(f"Total endpoints tested: {results['total_endpoints']}")
print(f"Passed: {results['passed']}")
print(f"Failed: {results['failed']}")
print(f"Success rate: {(results['passed'] / max(results['total_endpoints'], 1)) * 100:.1f}%")

print("\n" + "=" * 80)
print("DETAILED RESULTS")
print("=" * 80)
print(json.dumps(results, indent=2))