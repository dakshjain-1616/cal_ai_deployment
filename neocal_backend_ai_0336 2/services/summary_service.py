from datetime import datetime, time
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.database import Meal, User, WaterLog, ExerciseLog
from models.schemas import DailySummaryResponse, Macros
from services.meal_service import get_meals_for_date


def _get_day_bounds(date_str: str | None):
    if date_str:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    else:
        date_obj = datetime.utcnow().date()
    start = datetime.combine(date_obj, time.min)
    end = datetime.combine(date_obj, time.max)
    return start, end

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

    # Aggregate water and exercise for the day
    start, end = _get_day_bounds(date_str)
    water_total = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == user_id)
        .filter(WaterLog.timestamp >= start, WaterLog.timestamp <= end)
        .with_entities(func.coalesce(func.sum(WaterLog.amount_ml), 0))
        .scalar()
    )
    exercise_total = (
        db.query(ExerciseLog)
        .filter(ExerciseLog.user_id == user_id)
        .filter(ExerciseLog.timestamp >= start, ExerciseLog.timestamp <= end)
        .with_entities(func.coalesce(func.sum(ExerciseLog.duration_minutes), 0))
        .scalar()
    )

    # SQLAlchemy may return Decimal or None; coerce to int
    try:
        water_total = int(water_total or 0)
    except Exception:
        water_total = 0
    try:
        exercise_total = int(exercise_total or 0)
    except Exception:
        exercise_total = 0

    return DailySummaryResponse(
        date=date_str,
        total_calories=total_calories,
        total_macros=Macros(
            protein_g=total_protein,
            carbs_g=total_carbs,
            fat_g=total_fat
        ),
        remaining_calories=remaining,
        total_water=water_total,
        total_exercise=exercise_total,
    )