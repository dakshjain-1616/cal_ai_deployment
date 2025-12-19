from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Food(BaseModel):
    name: str
    grams: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    model_label: str
    confidence: float

class Macros(BaseModel):
    protein_g: float
    carbs_g: float
    fat_g: float

class MealResponse(BaseModel):
    meal_id: str
    timestamp: str
    source: str
    original_input: str
    foods: List[Food]
    total_calories: float
    total_macros: Macros
    confidence_score: float

class UserRegistrationRequest(BaseModel):
    email: str
    password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user_id: str
    email: str

class UserProfileResponse(BaseModel):
    user_id: str
    daily_calorie_target: int
    timezone: str

class ProfileUpdateRequest(BaseModel):
    daily_calorie_target: Optional[int] = None
    timezone: Optional[str] = None

class TextMealRequest(BaseModel):
    description: str

class ImageMealRequest(BaseModel):
    image_url: str

class BarcodeMealRequest(BaseModel):
    barcode: str
    serving_description: Optional[str] = None
    servings: int = 1

class DailySummaryResponse(BaseModel):
    date: str
    total_calories: float
    total_macros: Macros
    remaining_calories: float
    total_water: Optional[int] = 0
    total_exercise: Optional[int] = 0


class WaterLogRequest(BaseModel):
    amount: int = Field(..., gt=0, description="Water intake amount in milliliters")
    timestamp: Optional[datetime] = None
    date: Optional[str] = None


class WaterLogResponse(BaseModel):
    water_log_id: str
    amount: int
    timestamp: str


class ExerciseLogRequest(BaseModel):
    name: str
    duration: int = Field(..., gt=0, description="Duration in minutes")
    caloriesBurned: int = Field(..., ge=0, description="Calories burned during the activity")
    timestamp: Optional[datetime] = None
    date: Optional[str] = None


class ExerciseLogResponse(BaseModel):
    exercise_log_id: str
    name: str
    duration: int
    caloriesBurned: int
    timestamp: str


class WeightLogRequest(BaseModel):
    weight: float = Field(..., gt=0, description="Body weight in kilograms")
    timestamp: Optional[datetime] = None
    date: Optional[str] = None


class WeightLogResponse(BaseModel):
    weight_log_id: str
    weight: float
    timestamp: str
