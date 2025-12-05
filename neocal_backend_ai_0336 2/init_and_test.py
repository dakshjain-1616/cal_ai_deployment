import os
import sys

sys.path.insert(0, '/app/neocal_backend_ai_0336')

from database.db import engine, Base, SessionLocal
from models.database import User, Session, Meal, FoodItem

def init_db():
    data_dir = "/app/neocal_backend_ai_0336/data"
    os.makedirs(data_dir, exist_ok=True)
    
    db_path = "/app/neocal_backend_ai_0336/data/neocal.db"
    
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database at {db_path}")
    
    Base.metadata.create_all(bind=engine)
    print(f"Database schema created at {db_path}")
    
    db = SessionLocal()
    print("Database connection verified")
    db.close()
    
    return db_path

if __name__ == "__main__":
    db_path = init_db()
    print(f"\n✓ Database initialization complete!")
    print(f"  Location: {db_path}")