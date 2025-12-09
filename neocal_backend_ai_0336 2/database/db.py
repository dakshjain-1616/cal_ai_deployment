import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use DATABASE_URL env var when provided (e.g., postgres://...), otherwise fall back to local SQLite
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
default_sqlite_path = os.path.join(BASE_DIR, "neocal_demo.db")
DATABASE_URL = os.environ.get("DATABASE_URL") or f"sqlite:///{default_sqlite_path}"

# SQLAlchemy engine
engine_kwargs = {"echo": False}
connect_args = None
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()

# FastAPI dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
