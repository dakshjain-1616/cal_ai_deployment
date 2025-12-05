import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print("=" * 80)
    print("NeoCal Backend API - End-to-End Test")
    print("=" * 80)
    
    try:
        print("\n1. Creating anonymous session...")
        resp = requests.post(f"{BASE_URL}/auth/anonymous-session")
        print(f"   Status: {resp.status_code}")
        auth_data = resp.json()
        print(f"   Response: {json.dumps(auth_data, indent=2)}")
        token = auth_data["token"]
        user_id = auth_data["user_id"]
        
        headers = {"X-Auth-Token": token}
        
        print("\n2. Getting user profile...")
        resp = requests.get(f"{BASE_URL}/user/profile", headers=headers)
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {json.dumps(resp.json(), indent=2)}")
        
        print("\n3. Updating user profile (daily calorie target 2500, timezone: America/New_York)...")
        resp = requests.put(
            f"{BASE_URL}/user/profile",
            headers=headers,
            json={"daily_calorie_target": 2500, "timezone": "America/New_York"}
        )
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {json.dumps(resp.json(), indent=2)}")
        
        print("\n4. Logging meal from text ('200g grilled chicken with 150g rice')...")
        resp = requests.post(
            f"{BASE_URL}/meals/from-text",
            headers=headers,
            json={"description": "200g grilled chicken with 150g rice"}
        )
        print(f"   Status: {resp.status_code}")
        meal_text = resp.json()
        meal_id_1 = meal_text["meal_id"]
        print(f"   Meal ID: {meal_id_1}")
        print(f"   Total Calories: {meal_text['total_calories']}")
        print(f"   Macros: {json.dumps(meal_text['total_macros'], indent=2)}")
        
        print("\n5. Logging meal from image (pizza image URL)...")
        resp = requests.post(
            f"{BASE_URL}/meals/from-image",
            headers=headers,
            json={"image_url": "https://example.com/pizza.jpg"}
        )
        print(f"   Status: {resp.status_code}")
        meal_image = resp.json()
        meal_id_2 = meal_image["meal_id"]
        print(f"   Meal ID: {meal_id_2}")
        print(f"   Total Calories: {meal_image['total_calories']}")
        
        print("\n6. Logging meal from barcode (Coca Cola)...")
        resp = requests.post(
            f"{BASE_URL}/meals/from-barcode",
            headers=headers,
            json={
                "barcode": "012345678901",
                "serving_description": "330ml bottle",
                "servings": 1
            }
        )
        print(f"   Status: {resp.status_code}")
        meal_barcode = resp.json()
        meal_id_3 = meal_barcode["meal_id"]
        print(f"   Meal ID: {meal_id_3}")
        print(f"   Total Calories: {meal_barcode['total_calories']}")
        
        print("\n7. Retrieving specific meal...")
        resp = requests.get(f"{BASE_URL}/meals/{meal_id_1}", headers=headers)
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {json.dumps(resp.json(), indent=2)}")
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        print(f"\n8. Listing all meals for today ({today})...")
        resp = requests.get(f"{BASE_URL}/meals?date={today}", headers=headers)
        print(f"   Status: {resp.status_code}")
        meals = resp.json()
        print(f"   Total meals: {len(meals)}")
        for meal in meals:
            print(f"   - {meal['meal_id']}: {meal['total_calories']} cal ({meal['source']})")
        
        print(f"\n9. Getting daily summary for today ({today})...")
        resp = requests.get(f"{BASE_URL}/summary/day?date={today}", headers=headers)
        print(f"   Status: {resp.status_code}")
        summary = resp.json()
        print(f"   Response: {json.dumps(summary, indent=2)}")
        
        print("\n" + "=" * 80)
        print("✓ All tests completed successfully!")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_endpoints()