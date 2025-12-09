import secrets
from datetime import datetime
from sqlalchemy.orm import Session
from models.database import Meal, FoodItem, User
from models.schemas import MealResponse, Food, Macros
from services.nutrition_service import lookup_food_nutrition, scale_nutrition_by_grams
from services.ai_service import parse_text_meal, parse_image_meal, parse_barcode_meal

def create_meal_from_text(db: Session, user_id: str, description: str):
    parsed_foods = parse_text_meal(description)
    return _create_meal(db, user_id, description, parsed_foods, "text")

def create_meal_from_image(db: Session, user_id: str, image_url: str):
    parsed_foods = parse_image_meal(image_url)
    # If AI returned explicit calories/macros, trust them and skip lookup
    has_macros = False
    for f in parsed_foods:
        if any(k in f for k in ("calories", "protein_g", "carbs_g", "fat_g")):
            has_macros = True
            break

    return _create_meal(db, user_id, image_url, parsed_foods, "image", skip_lookup=has_macros)

def create_meal_from_barcode(db: Session, user_id: str, barcode: str, serving_description: str = None, servings: int = 1):
    product = parse_barcode_meal(barcode, serving_description, servings)
    
    parsed_foods = [{
        "name": product["name"],
        "grams": product["grams"],
        "calories": product["calories"],
        "protein_g": product["protein_g"],
        "carbs_g": product["carbs_g"],
        "fat_g": product["fat_g"],
        "model_label": product["model_label"],
        "confidence": product["confidence"]
    }]
    
    meal_input = f"Barcode: {barcode}"
    if serving_description:
        meal_input += f", {serving_description} x{servings}"
    
    return _create_meal(db, user_id, meal_input, parsed_foods, "barcode", skip_lookup=True)

def _create_meal(db: Session, user_id: str, original_input: str, parsed_foods: list, source: str, skip_lookup: bool = False):
    meal_id = f"meal_{secrets.token_hex(8)}"
    timestamp = datetime.utcnow()
    
    food_items = []
    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fat = 0
    confidence_scores = []
    
    for food_data in parsed_foods:
        if skip_lookup and "calories" in food_data:
            nutrition = {
                "calories": food_data["calories"],
                "protein_g": food_data["protein_g"],
                "carbs_g": food_data["carbs_g"],
                "fat_g": food_data["fat_g"]
            }
        else:
            base_nutrition = lookup_food_nutrition(food_data["name"])
            nutrition = scale_nutrition_by_grams(base_nutrition, food_data["grams"])
        
        food_item = FoodItem(
            food_item_id=f"food_{secrets.token_hex(8)}",
            meal_id=meal_id,
            name=food_data["name"],
            grams=food_data["grams"],
            calories=nutrition["calories"],
            protein_g=nutrition["protein_g"],
            carbs_g=nutrition["carbs_g"],
            fat_g=nutrition["fat_g"],
            model_label=food_data.get("model_label", food_data["name"]),
            confidence=food_data.get("confidence", 0.75)
        )
        
        db.add(food_item)
        food_items.append(food_item)
        
        total_calories += nutrition["calories"]
        total_protein += nutrition["protein_g"]
        total_carbs += nutrition["carbs_g"]
        total_fat += nutrition["fat_g"]
        confidence_scores.append(food_data.get("confidence", 0.75))
    
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.75
    
    meal = Meal(
        meal_id=meal_id,
        user_id=user_id,
        timestamp=timestamp,
        source=source,
        original_input=original_input,
        total_calories=total_calories,
        total_macros_protein_g=total_protein,
        total_macros_carbs_g=total_carbs,
        total_macros_fat_g=total_fat,
        confidence_score=avg_confidence
    )
    
    db.add(meal)
    db.commit()
    db.refresh(meal)
    
    return format_meal_response(meal, food_items)

def get_meal_by_id(db: Session, meal_id: str, user_id: str):
    meal = db.query(Meal).filter(Meal.meal_id == meal_id, Meal.user_id == user_id).first()
    if not meal:
        return None
    
    food_items = db.query(FoodItem).filter(FoodItem.meal_id == meal_id).all()
    return format_meal_response(meal, food_items)

def get_meals_for_date(db: Session, user_id: str, date_str: str):
    from datetime import datetime as dt
    
    try:
        date_obj = dt.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None
    
    start_time = dt.combine(date_obj.date(), dt.min.time())
    end_time = dt.combine(date_obj.date(), dt.max.time())
    
    meals = db.query(Meal).filter(
        Meal.user_id == user_id,
        Meal.timestamp >= start_time,
        Meal.timestamp <= end_time
    ).order_by(Meal.timestamp).all()
    
    results = []
    for meal in meals:
        food_items = db.query(FoodItem).filter(FoodItem.meal_id == meal.meal_id).all()
        results.append(format_meal_response(meal, food_items))
    
    return results


def get_meals_for_range(db: Session, user_id: str, start_date_str: str, end_date_str: str):
    from datetime import datetime as dt
    try:
        start_obj = dt.strptime(start_date_str, "%Y-%m-%d")
        end_obj = dt.strptime(end_date_str, "%Y-%m-%d")
    except Exception:
        return None

    start_time = dt.combine(start_obj.date(), dt.min.time())
    end_time = dt.combine(end_obj.date(), dt.max.time())

    meals = db.query(Meal).filter(
        Meal.user_id == user_id,
        Meal.timestamp >= start_time,
        Meal.timestamp <= end_time
    ).order_by(Meal.timestamp).all()

    results = []
    for meal in meals:
        food_items = db.query(FoodItem).filter(FoodItem.meal_id == meal.meal_id).all()
        results.append(format_meal_response(meal, food_items))

    return results


def create_meal_from_structured(db: Session, user_id: str, foods: list, original_input: str = "manual"):
    """Create a meal record from a structured list of food dicts.

    Each food dict should include at least: name, grams. If calories/proteins provided, they will be used.
    """
    # Reuse private _create_meal helper
    return _create_meal(db, user_id, original_input, foods, "manual", skip_lookup=True)

def delete_meal(db: Session, user_id: str, meal_id: str) -> bool:
    meal = (
        db.query(Meal)
        .filter(Meal.meal_id == meal_id, Meal.user_id == user_id)
        .first()
    )
    if not meal:
        return False

    db.delete(meal)
    db.commit()
    return True


def format_meal_response(meal: Meal, food_items: list):
    foods = [
        Food(
            name=fi.name,
            grams=fi.grams,
            calories=fi.calories,
            protein_g=fi.protein_g,
            carbs_g=fi.carbs_g,
            fat_g=fi.fat_g,
            model_label=fi.model_label,
            confidence=fi.confidence
        )
        for fi in food_items
    ]
    
    return MealResponse(
        meal_id=meal.meal_id,
        timestamp=meal.timestamp.isoformat() + "Z",
        source=meal.source,
        original_input=meal.original_input,
        foods=foods,
        total_calories=meal.total_calories,
        total_macros=Macros(
            protein_g=meal.total_macros_protein_g,
            carbs_g=meal.total_macros_carbs_g,
            fat_g=meal.total_macros_fat_g
        ),
        confidence_score=meal.confidence_score
    )