import secrets
from datetime import datetime, time, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from models.database import WaterLog
from models.schemas import WaterLogResponse


def _generate_water_log_id() -> str:
    return f"water_{secrets.token_hex(8)}"


def _normalize_timestamp(value: datetime) -> datetime:
    if value.tzinfo:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _resolve_timestamp(timestamp: Optional[datetime], date_str: Optional[str]) -> datetime:
    if timestamp is not None:
        return _normalize_timestamp(timestamp)
    if date_str:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        return datetime.combine(date_obj, time.min)
    return datetime.utcnow()


def _get_day_bounds(date_str: Optional[str]) -> Tuple[datetime, datetime]:
    if date_str:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    else:
        date_obj = datetime.utcnow().date()
    start = datetime.combine(date_obj, time.min)
    end = datetime.combine(date_obj, time.max)
    return start, end


def _serialize_timestamp(value: datetime) -> str:
    normalized = _normalize_timestamp(value)
    return normalized.isoformat() + "Z"


def _format_water_log(log: WaterLog) -> WaterLogResponse:
    return WaterLogResponse(
        water_log_id=log.water_log_id,
        amount=log.amount_ml,
        timestamp=_serialize_timestamp(log.timestamp),
    )


def create_water_log(
    db: Session,
    user_id: str,
    amount_ml: int,
    timestamp: Optional[datetime] = None,
    date_str: Optional[str] = None,
) -> WaterLogResponse:
    log = WaterLog(
        water_log_id=_generate_water_log_id(),
        user_id=user_id,
        amount_ml=amount_ml,
        timestamp=_resolve_timestamp(timestamp, date_str),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return _format_water_log(log)


def get_water_logs_for_date(
    db: Session,
    user_id: str,
    date_str: Optional[str],
) -> List[WaterLogResponse]:
    start, end = _get_day_bounds(date_str)
    logs = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == user_id)
        .filter(WaterLog.timestamp >= start, WaterLog.timestamp <= end)
        .order_by(WaterLog.timestamp.asc())
        .all()
    )
    return [_format_water_log(log) for log in logs]


def delete_water_log(db: Session, user_id: str, water_log_id: str) -> bool:
    log = (
        db.query(WaterLog)
        .filter(WaterLog.water_log_id == water_log_id, WaterLog.user_id == user_id)
        .first()
    )
    if not log:
        return False

    db.delete(log)
    db.commit()
    return True