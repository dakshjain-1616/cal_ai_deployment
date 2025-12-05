from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from models.schemas import AnonymousSessionResponse
from services.auth import create_user, create_session

router = APIRouter(tags=["auth"])

@router.post("/auth/anonymous-session", response_model=AnonymousSessionResponse)
async def create_anonymous_session(db: Session = Depends(get_db)):
    user = create_user(db)
    session = create_session(db, user.user_id)
    return AnonymousSessionResponse(token=session.token, user_id=user.user_id)