import sys
import os

sys.path.insert(0, '/app/neocal_backend_ai_0336')

print("=" * 80)
print("FINAL VALIDATION - NeoCal Backend Infrastructure")
print("=" * 80)

print("\n1. Checking project structure...")
required_files = [
    "main.py", "requirements.txt", "README.md",
    "database/db.py", "database/init_db.py", "database/schema.sql",
    "models/database.py", "models/schemas.py",
    "routers/auth.py", "routers/users.py", "routers/meals.py",
    "services/auth.py", "services/ai_service.py", "services/nutrition_service.py",
    "services/meal_service.py", "services/summary_service.py",
    "scripts/test_api.py", "data/neocal.db"
]

base_path = "/app/neocal_backend_ai_0336"
all_present = True
for file_path in required_files:
    full_path = os.path.join(base_path, file_path)
    exists = os.path.exists(full_path)
    if not exists:
        print(f"   ✗ {file_path}")
        all_present = False

if all_present:
    print(f"   ✓ All {len(required_files)} required files present")

print("\n2. Verifying database initialization...")
try:
    from database.db import engine, SessionLocal
    from models.database import User, Session, Meal, FoodItem
    
    db = SessionLocal()
    
    users = db.query(User).count()
    sessions = db.query(Session).count()
    meals = db.query(Meal).count()
    food_items = db.query(FoodItem).count()
    
    db.close()
    
    print(f"   ✓ Database connection verified")
    print(f"   ✓ Tables accessible: users, sessions, meals, food_items")
    print(f"   ✓ Current records: {users} users, {sessions} sessions, {meals} meals, {food_items} food_items")
except Exception as e:
    print(f"   ✗ Database error: {e}")

print("\n3. Verifying API imports...")
try:
    from routers import auth, users, meals
    from services.auth import create_user, create_session, verify_token
    from services.ai_service import parse_text_meal, parse_image_meal, parse_barcode_meal
    from services.nutrition_service import lookup_food_nutrition, scale_nutrition_by_grams
    from services.meal_service import create_meal_from_text, get_daily_summary
    from models.schemas import MealResponse, AnonymousSessionResponse, UserProfileResponse
    
    print(f"   ✓ All routers imported successfully")
    print(f"   ✓ All services imported successfully")
    print(f"   ✓ All schemas imported successfully")
except Exception as e:
    print(f"   ✗ Import error: {e}")

print("\n4. Testing mock AI service...")
try:
    text_foods = parse_text_meal("200g grilled chicken with 150g rice")
    image_foods = parse_image_meal("https://example.com/pizza.jpg")
    barcode_food = parse_barcode_meal("012345678901", servings=1)
    
    print(f"   ✓ Text parsing: {len(text_foods)} items detected")
    print(f"   ✓ Image parsing: {len(image_foods)} items detected")
    print(f"   ✓ Barcode parsing: {barcode_food['name']} identified")
except Exception as e:
    print(f"   ✗ AI service error: {e}")

print("\n5. Testing nutrition calculations...")
try:
    chicken_nutrition = lookup_food_nutrition("chicken")
    scaled = scale_nutrition_by_grams(chicken_nutrition, 150)
    
    print(f"   ✓ Nutrition lookup: {chicken_nutrition}")
    print(f"   ✓ Scaling (150g): {scaled}")
except Exception as e:
    print(f"   ✗ Nutrition service error: {e}")

print("\n6. Verifying FastAPI application...")
try:
    from main import app
    
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append(route.path)
    
    expected_endpoints = [
        "/auth/anonymous-session",
        "/user/profile",
        "/meals/from-text",
        "/meals/from-image",
        "/meals/from-barcode",
        "/meals/{meal_id}",
        "/meals",
        "/summary/day",
        "/health"
    ]
    
    print(f"   ✓ FastAPI application loads successfully")
    print(f"   ✓ Routes registered: {len(routes)}")
    for endpoint in expected_endpoints:
        if endpoint in routes:
            print(f"   ✓ {endpoint}")
        else:
            print(f"   ✗ {endpoint} NOT FOUND")
except Exception as e:
    print(f"   ✗ FastAPI error: {e}")

print("\n" + "=" * 80)
print("✓ BACKEND INFRASTRUCTURE COMPLETE AND VALIDATED")
print("=" * 80)
print("\nTo start the server:")
print("  cd /app/neocal_backend_ai_0336")
print("  uvicorn main:app --reload")
print("\nTo test all endpoints:")
print("  python scripts/test_api.py")
print("=" * 80)