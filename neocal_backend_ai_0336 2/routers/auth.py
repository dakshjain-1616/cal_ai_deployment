from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from models.schemas import UserRegistrationRequest, UserLoginRequest, AuthResponse, UserProfileResponse, ProfileUpdateRequest
from services.auth import create_user, authenticate_user, create_session, get_user, get_user_by_email

router = APIRouter(tags=["auth"])

@router.post("/auth/register", response_model=AuthResponse)
async def register_user(request: UserRegistrationRequest, db: Session = Depends(get_db)):
    """
    Register a new user account.
    """
    # Check if user already exists
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = create_user(db, request.email, request.password)

    # Create session for the new user
    db_session = create_session(db, user.user_id)

    return AuthResponse(
        token=db_session.token,
        user_id=user.user_id,
        email=user.email
    )

@router.post("/auth/login", response_model=AuthResponse)
async def login_user(request: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return session token.
    """
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create new session
    db_session = create_session(db, user.user_id)

    return AuthResponse(
        token=db_session.token,
        user_id=user.user_id,
        email=user.email
    )

@router.get("/auth/profile", response_model=UserProfileResponse)
async def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """
    Get user profile information.
    """
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserProfileResponse(
        user_id=user.user_id,
        daily_calorie_target=user.daily_calorie_target,
        timezone=user.timezone
    )

@router.put("/auth/profile", response_model=UserProfileResponse)
async def update_user_profile(
    request: ProfileUpdateRequest,
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Update user profile information.
    """
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update fields if provided
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
