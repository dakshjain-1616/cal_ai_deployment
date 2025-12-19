import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.database import User, Session as DBSession

def generate_token():
    return secrets.token_hex(32)

def create_user(db: Session, user_id: str = None):
    if not user_id:
        user_id = f"user_{secrets.token_hex(8)}"
    
    user = User(user_id=user_id, daily_calorie_target=2000, timezone="UTC")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_session(db: Session, user_id: str):
    token = generate_token()
    session_id = f"session_{secrets.token_hex(8)}"
    
    db_session = DBSession(
        session_id=session_id,
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def verify_token(db: Session, token: str):
    """
    No-op auth: always return a shared demo user ID, creating the user if needed.

    This ensures the demo user exists in the database for queries that require it.
    """
    user_id = "demo_user"
    user = get_user(db, user_id)
    if not user:
        create_user(db, user_id)
    return user_id

def get_user(db: Session, user_id: str):
    return db.query(User).filter(User.user_id == user_id).first()
