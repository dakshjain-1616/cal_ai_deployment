from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database.db import Base

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(String, primary_key=True)
    daily_calorie_target = Column(Integer, default=2000)
    timezone = Column(String, default="UTC")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sessions = relationship("Session", back_populates="user")
    meals = relationship("Meal", back_populates="user")
    water_logs = relationship("WaterLog", back_populates="user", cascade="all, delete-orphan")
    exercise_logs = relationship("ExerciseLog", back_populates="user", cascade="all, delete-orphan")
    weight_logs = relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"
    
    session_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    user = relationship("User", back_populates="sessions")

class Meal(Base):
    __tablename__ = "meals"
    
    meal_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    source = Column(String, nullable=False)
    original_input = Column(Text)
    total_calories = Column(Float)
    total_macros_protein_g = Column(Float)
    total_macros_carbs_g = Column(Float)
    total_macros_fat_g = Column(Float)
    confidence_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="meals")
    food_items = relationship("FoodItem", back_populates="meal", cascade="all, delete-orphan")

class FoodItem(Base):
    __tablename__ = "food_items"
    
    food_item_id = Column(String, primary_key=True)
    meal_id = Column(String, ForeignKey("meals.meal_id"), nullable=False)
    name = Column(String, nullable=False)
    grams = Column(Float)
    calories = Column(Float)
    protein_g = Column(Float)
    carbs_g = Column(Float)
    fat_g = Column(Float)
    model_label = Column(String)
    confidence = Column(Float)
    
    meal = relationship("Meal", back_populates="food_items", cascade_backrefs=False)


class WaterLog(Base):
    __tablename__ = "water_logs"
    
    water_log_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    amount_ml = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="water_logs")


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"
    
    exercise_log_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    name = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    calories_burned = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="exercise_logs")


class WeightLog(Base):
    __tablename__ = "weight_logs"
    
    weight_log_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    weight_kg = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="weight_logs")