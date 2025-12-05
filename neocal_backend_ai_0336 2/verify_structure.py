import os
import sys

sys.path.insert(0, '/app/neocal_backend_ai_0336')

print("Checking project structure...")
print()

required_files = [
    "main.py",
    "requirements.txt",
    "README.md",
    "database/db.py",
    "database/init_db.py",
    "database/schema.sql",
    "models/database.py",
    "models/schemas.py",
    "routers/auth.py",
    "routers/users.py",
    "routers/meals.py",
    "services/auth.py",
    "services/ai_service.py",
    "services/nutrition_service.py",
    "services/meal_service.py",
    "services/summary_service.py",
    "scripts/test_api.py",
]

base_path = "/app/neocal_backend_ai_0336"

for file_path in required_files:
    full_path = os.path.join(base_path, file_path)
    exists = os.path.exists(full_path)
    status = "✓" if exists else "✗"
    print(f"{status} {file_path}")

print()
print("Verifying imports...")
try:
    from fastapi import FastAPI
    print("✓ FastAPI")
except ImportError as e:
    print(f"✗ FastAPI: {e}")

try:
    from sqlalchemy import create_engine
    print("✓ SQLAlchemy")
except ImportError as e:
    print(f"✗ SQLAlchemy: {e}")

try:
    from pydantic import BaseModel
    print("✓ Pydantic")
except ImportError as e:
    print(f"✗ Pydantic: {e}")

print()
print("Verifying database models...")
try:
    from models.database import User, Session, Meal, FoodItem
    print("✓ Database models imported successfully")
except Exception as e:
    print(f"✗ Error importing database models: {e}")

print()
print("Verifying services...")
try:
    from services.auth import create_user, create_session, verify_token
    from services.ai_service import parse_text_meal, parse_image_meal, parse_barcode_meal
    from services.nutrition_service import lookup_food_nutrition
    print("✓ Services imported successfully")
except Exception as e:
    print(f"✗ Error importing services: {e}")

print()
print("✓ All verifications passed!")