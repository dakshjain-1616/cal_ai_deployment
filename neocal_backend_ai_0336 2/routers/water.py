from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response
from sqlalchemy.orm import Session

from database.db import get_db
from models.schemas import WaterLogRequest, WaterLogResponse
from services.auth import verify_token
from services.water_service import (
    create_water_log,
    delete_water_log,
    get_water_logs_for_date,
)

router = APIRouter(tags=["water"])


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


@router.post("/water", response_model=WaterLogResponse, status_code=201)
async def log_water(
    request: WaterLogRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WaterLogResponse:
    try:
        return create_water_log(
            db,
            user_id,
            amount_ml=request.amount,
            timestamp=request.timestamp,
            date_str=request.date,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")


@router.get("/water", response_model=List[WaterLogResponse])
async def list_water_logs(
    date: Optional[str] = Query(None, description="Filter logs for a given date (YYYY-MM-DD)"),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[WaterLogResponse]:
    try:
        return get_water_logs_for_date(db, user_id, date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")


@router.delete("/water/{water_log_id}", status_code=204, response_class=Response)
async def remove_water_log(
    water_log_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    deleted = delete_water_log(db, user_id, water_log_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Water log not found")
    return Response(status_code=204)