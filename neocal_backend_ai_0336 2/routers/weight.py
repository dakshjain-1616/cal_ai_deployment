from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from database.db import get_db
from models.schemas import WeightLogRequest, WeightLogResponse
from services.auth import verify_token
from services.weight_service import (
    create_weight_log,
    delete_weight_log,
    get_weight_logs,
)

router = APIRouter(tags=["weight"])


async def get_current_user(
    db: Session = Depends(get_db),
) -> str:
    """
    Auth disabled: always return a shared demo user.
    """
    return verify_token(db, "")


@router.post("/weight", response_model=WeightLogResponse, status_code=201)
async def log_weight(
    request: WeightLogRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WeightLogResponse:
    try:
        return create_weight_log(
            db,
            user_id=user_id,
            weight_kg=request.weight,
            timestamp=request.timestamp,
            date_str=request.date,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")


@router.get("/weight", response_model=List[WeightLogResponse])
async def list_weight_logs(
    start: Optional[str] = Query(None, description="Start date inclusive (YYYY-MM-DD)"),
    end: Optional[str] = Query(None, description="End date inclusive (YYYY-MM-DD)"),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[WeightLogResponse]:
    try:
        return get_weight_logs(db, user_id, start_date=start, end_date=end)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")


@router.delete("/weight/{weight_log_id}", status_code=204, response_class=Response)
async def remove_weight_log(
    weight_log_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    deleted = delete_weight_log(db, user_id, weight_log_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Weight log not found")
    return Response(status_code=204)