import os
import sys
from datetime import datetime
from sqlalchemy import text
import sqlite3

sys.path.insert(0, '/app/neocal_backend_ai_0336')

from database.db import engine, Base

NUTRITION_DATABASE = {
    "chicken_grilled": {"calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6},
    "chicken_breast": {"calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6},
    "rice_white": {"calories": 130, "protein_g": 2.7, "carbs_g": 28, "fat_g": 0.3},
    "rice_brown": {"calories": 112, "protein_g": 2.6, "carbs_g": 24, "fat_g": 0.9},
    "broccoli": {"calories": 34, "protein_g": 2.8, "carbs_g": 7, "fat_g": 0.4},
    "carrot": {"calories": 41, "protein_g": 0.9, "carbs_g": 10, "fat_g": 0.2},
    "apple": {"calories": 52, "protein_g": 0.3, "carbs_g": 14, "fat_g": 0.2},
    "banana": {"calories": 89, "protein_g": 1.1, "carbs_g": 23, "fat_g": 0.3},
    "orange": {"calories": 47, "protein_g": 0.9, "carbs_g": 12, "fat_g": 0.3},
    "salmon": {"calories": 208, "protein_g": 20, "carbs_g": 0, "fat_g": 13},
    "tuna": {"calories": 132, "protein_g": 29, "carbs_g": 0, "fat_g": 1.3},
    "egg": {"calories": 155, "protein_g": 13, "carbs_g": 1.1, "fat_g": 11},
    "almonds": {"calories": 579, "protein_g": 21, "carbs_g": 22, "fat_g": 50},
    "peanut_butter": {"calories": 588, "protein_g": 25, "carbs_g": 20, "fat_g": 50},
    "yogurt_plain": {"calories": 59, "protein_g": 10, "carbs_g": 3.6, "fat_g": 0.4},
    "milk_whole": {"calories": 61, "protein_g": 3.2, "carbs_g": 4.8, "fat_g": 3.3},
    "cheese_cheddar": {"calories": 402, "protein_g": 23, "carbs_g": 3.3, "fat_g": 33},
    "bread_white": {"calories": 265, "protein_g": 9, "carbs_g": 49, "fat_g": 3.3},
    "olive_oil": {"calories": 884, "protein_g": 0, "carbs_g": 0, "fat_g": 100},
    "butter": {"calories": 717, "protein_g": 0.9, "carbs_g": 0.1, "fat_g": 81},
    "sweet_potato": {"calories": 86, "protein_g": 1.6, "carbs_g": 20, "fat_g": 0.1},
    "spinach": {"calories": 23, "protein_g": 2.9, "carbs_g": 3.6, "fat_g": 0.4},
    "tomato": {"calories": 18, "protein_g": 0.9, "carbs_g": 3.9, "fat_g": 0.2},
    "pasta": {"calories": 131, "protein_g": 5, "carbs_g": 25, "fat_g": 1.1},
    "pizza_cheese": {"calories": 285, "protein_g": 12, "carbs_g": 36, "fat_g": 10},
}

BARCODE_DATABASE = {
    "012345678901": {"name": "Coca Cola 330ml", "calories": 140, "protein_g": 0, "carbs_g": 39, "fat_g": 0},
    "012345678902": {"name": "Sprite 330ml", "calories": 139, "protein_g": 0, "carbs_g": 34, "fat_g": 0},
    "012345678903": {"name": "Orange Juice 250ml", "calories": 110, "protein_g": 1, "carbs_g": 26, "fat_g": 0},
}

def init_db():
    data_dir = "/app/neocal_backend_ai_0336/data"
    os.makedirs(data_dir, exist_ok=True)
    
    db_path = "/app/neocal_backend_ai_0336/data/neocal.db"
    
    if os.path.exists(db_path):
        os.remove(db_path)
    
    Base.metadata.create_all(bind=engine)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    for label, nutrition in NUTRITION_DATABASE.items():
        cursor.execute("""
            INSERT INTO food_items (
                food_item_id, meal_id, name, grams, calories,
                protein_g, carbs_g, fat_g, model_label, confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"seed_{label}", "seed_meal",
            label.replace("_", " ").title(),
            100, nutrition["calories"],
            nutrition["protein_g"], nutrition["carbs_g"],
            nutrition["fat_g"], label, 0.95
        ))
    
    conn.commit()
    conn.close()
    
    print(f"Database initialized at {db_path}")
    print(f"Created nutrition database with {len(NUTRITION_DATABASE)} foods")
    print(f"Created barcode database with {len(BARCODE_DATABASE)} products")

if __name__ == "__main__":
    init_db()