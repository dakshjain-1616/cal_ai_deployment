import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use DATABASE_URL env var when provided (e.g., postgres://...).
# Otherwise fall back to SQLite. On Vercel the code directory is read-only,
# so use /tmp for the default DB path so writes succeed.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Prefer DATABASE_URL if set (e.g. for local dev you can set it to sqlite:///./database/neocal_demo.db)
env_db_url = os.environ.get("DATABASE_URL")
if env_db_url:
    DATABASE_URL = env_db_url
else:
    # Default writable path for serverless/container platforms
    default_sqlite_path = os.path.join("/tmp", "neocal_demo.db")
    DATABASE_URL = f"sqlite:///{default_sqlite_path}"

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
