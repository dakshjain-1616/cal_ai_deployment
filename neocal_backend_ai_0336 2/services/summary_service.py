from datetime import datetime
from sqlalchemy.orm import Session
from models.database import Meal, User
from models.schemas import DailySummaryResponse, Macros
from services.meal_service import get_meals_for_date

def get_daily_summary(db: Session, user_id: str, date_str: str):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return None
    
    meals = get_meals_for_date(db, user_id, date_str)
    if meals is None:
        return None
    
    total_calories = sum(m.total_calories for m in meals)
    total_protein = sum(m.total_macros.protein_g for m in meals)
    total_carbs = sum(m.total_macros.carbs_g for m in meals)
    total_fat = sum(m.total_macros.fat_g for m in meals)
    
    remaining = user.daily_calorie_target - total_calories
    
    return DailySummaryResponse(
        date=date_str,
        total_calories=total_calories,
        total_macros=Macros(
            protein_g=total_protein,
            carbs_g=total_carbs,
            fat_g=total_fat
        ),
        remaining_calories=remaining
    )