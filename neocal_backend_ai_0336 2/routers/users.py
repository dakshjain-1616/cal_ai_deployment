from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database.db import get_db
from models.schemas import UserProfileResponse, ProfileUpdateRequest
from services.auth import verify_token, get_user

router = APIRouter(tags=["user"])

async def get_current_user(x_auth_token: str = Header(None), db: Session = Depends(get_db)):
    if not x_auth_token:
        raise HTTPException(status_code=401, detail="X-Auth-Token header required")
    
    user_id = verify_token(db, x_auth_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user_id

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