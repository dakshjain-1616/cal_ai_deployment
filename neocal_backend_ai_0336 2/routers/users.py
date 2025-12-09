from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from models.schemas import UserProfileResponse, ProfileUpdateRequest
from services.auth import verify_token, get_user

router = APIRouter(tags=["user"])

async def get_current_user(db: Session = Depends(get_db)) -> str:
    """
    Auth disabled: always return a shared demo user via verify_token.

    We ignore headers and just rely on verify_token's demo-user behavior so
    the rest of the API continues to work without requiring X-Auth-Token.
    """
    return verify_token(db, "")

@router.get("/user/profile", response_model=UserProfileResponse)
async def get_profile(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserProfileResponse(
        user_id=user.user_id,
        daily_calorie_target=user.daily_calorie_target,
        timezone=user.timezone
    )

@router.put("/user/profile", response_model=UserProfileResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request.daily_calorie_target is not None:
        user.daily_calorie_target = request.daily_calorie_target
    if request.timezone is not None:
        user.timezone = request.timezone
    
    db.commit()
    db.refresh(user)
    
    return UserProfileResponse(
        user_id=user.user_id,
        daily_calorie_target=user.daily_calorie_target,
        timezone=user.timezone
    )