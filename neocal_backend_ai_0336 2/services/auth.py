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
    session = db.query(DBSession).filter(DBSession.token == token).first()
    if not session:
        return None
    if session.expires_at and datetime.utcnow() > session.expires_at:
        return None
    return session.user_id

def get_user(db: Session, user_id: str):
    return db.query(User).filter(User.user_id == user_id).first()