import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
import bcrypt
from models.database import User, Session as DBSession

def generate_token():
    return secrets.token_hex(32)

def hash_password(password: str) -> str:
    # Truncate password to 72 bytes as required by bcrypt
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except ValueError:
        return False

def create_user(db: Session, email: str, password: str, user_id: str = None):
    if not user_id:
        user_id = f"user_{secrets.token_hex(8)}"

    hashed_password = hash_password(password)

    user = User(
        user_id=user_id,
        email=email,
        hashed_password=hashed_password,
        daily_calorie_target=2000,
        timezone="UTC"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
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

def verify_token(db: Session, token: str) -> Optional[str]:
    """
    Verify authentication token and return user_id if valid.
    Returns None if token is invalid or expired.
    """
    if not token or token == "":
        return None

    # Check if token exists and is not expired
    session = db.query(DBSession).filter(
        DBSession.token == token,
        DBSession.expires_at > datetime.utcnow()
    ).first()

    if session:
        return session.user_id

    return None

def get_user(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.user_id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()
