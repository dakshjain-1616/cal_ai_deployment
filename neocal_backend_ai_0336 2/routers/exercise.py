from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response
from sqlalchemy.orm import Session

from database.db import get_db
from models.schemas import ExerciseLogRequest, ExerciseLogResponse
from services.auth import verify_token
from services.exercise_service import (
    create_exercise_log,
    delete_exercise_log,
    get_exercise_logs_for_date,
)

router = APIRouter(tags=["exercise"])


async def get_current_user(
    x_auth_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> str:
    if not x_auth_token:
        raise HTTPException(status_code=401, detail="X-Auth-Token header required")

    user_id = verify_token(db, x_auth_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user_id


@router.post("/exercise", response_model=ExerciseLogResponse, status_code=201)
async def log_exercise(
    request: ExerciseLogRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExerciseLogResponse:
    try:
        return create_exercise_log(
            db,
            user_id=user_id,
            name=request.name,
            duration_minutes=request.duration,
            calories_burned=request.caloriesBurned,
            timestamp=request.timestamp,
            date_str=request.date,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")


@router.get("/exercise", response_model=List[ExerciseLogResponse])
async def list_exercises(
    date: Optional[str] = Query(None, description="Filter logs for a given date (YYYY-MM-DD)"),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[ExerciseLogResponse]:
    try:
        return get_exercise_logs_for_date(db, user_id, date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")


@router.delete("/exercise/{exercise_log_id}", status_code=204, response_class=Response)
async def remove_exercise_log(
    exercise_log_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    deleted = delete_exercise_log(db, user_id, exercise_log_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Exercise log not found")
    return Response(status_code=204)