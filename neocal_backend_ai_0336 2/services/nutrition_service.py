NUTRITION_DATABASE = {
    "chicken_grilled": {"calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6},
    "chicken_breast": {"calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6},
    "chicken": {"calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6},
    "grilled chicken": {"calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6},
    "rice_white": {"calories": 130, "protein_g": 2.7, "carbs_g": 28, "fat_g": 0.3},
    "rice": {"calories": 130, "protein_g": 2.7, "carbs_g": 28, "fat_g": 0.3},
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
    "yogurt": {"calories": 59, "protein_g": 10, "carbs_g": 3.6, "fat_g": 0.4},
    "milk": {"calories": 61, "protein_g": 3.2, "carbs_g": 4.8, "fat_g": 3.3},
    "cheese_cheddar": {"calories": 402, "protein_g": 23, "carbs_g": 3.3, "fat_g": 33},
    "cheese": {"calories": 402, "protein_g": 23, "carbs_g": 3.3, "fat_g": 33},
    "bread": {"calories": 265, "protein_g": 9, "carbs_g": 49, "fat_g": 3.3},
    "olive_oil": {"calories": 884, "protein_g": 0, "carbs_g": 0, "fat_g": 100},
    "butter": {"calories": 717, "protein_g": 0.9, "carbs_g": 0.1, "fat_g": 81},
    "sweet_potato": {"calories": 86, "protein_g": 1.6, "carbs_g": 20, "fat_g": 0.1},
    "spinach": {"calories": 23, "protein_g": 2.9, "carbs_g": 3.6, "fat_g": 0.4},
    "tomato": {"calories": 18, "protein_g": 0.9, "carbs_g": 3.9, "fat_g": 0.2},
    "pasta": {"calories": 131, "protein_g": 5, "carbs_g": 25, "fat_g": 1.1},
    "pizza": {"calories": 285, "protein_g": 12, "carbs_g": 36, "fat_g": 10},
    "mixed vegetables": {"calories": 35, "protein_g": 2, "carbs_g": 8, "fat_g": 0.3},
    "vegetables": {"calories": 35, "protein_g": 2, "carbs_g": 8, "fat_g": 0.3},
    "burger": {"calories": 540, "protein_g": 25, "carbs_g": 45, "fat_g": 28},
    "fries": {"calories": 365, "protein_g": 3.4, "carbs_g": 48, "fat_g": 17},
    "dressing": {"calories": 440, "protein_g": 1, "carbs_g": 2, "fat_g": 48},
    "meal": {"calories": 300, "protein_g": 15, "carbs_g": 35, "fat_g": 10},
    "mixed_meal": {"calories": 300, "protein_g": 15, "carbs_g": 35, "fat_g": 10},
}

def lookup_food_nutrition(food_name: str):
    food_key = food_name.lower().replace(" ", "_")
    
    if food_key in NUTRITION_DATABASE:
        return NUTRITION_DATABASE[food_key]
    
    for key, nutrition in NUTRITION_DATABASE.items():
        if key in food_key or food_key in key:
            return nutrition
    
    return {"calories": 250, "protein_g": 10, "carbs_g": 35, "fat_g": 8}

def scale_nutrition_by_grams(nutrition: dict, grams: float):
    per_100g = {k: v / 100 for k, v in nutrition.items()}
    return {k: v * grams for k, v in per_100g.items()}