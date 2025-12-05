import secrets
from datetime import datetime, time, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from models.database import WeightLog
from models.schemas import WeightLogResponse


def _generate_weight_log_id() -> str:
    return f"weight_{secrets.token_hex(8)}"


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


def _format_weight_log(log: WeightLog) -> WeightLogResponse:
    return WeightLogResponse(
        weight_log_id=log.weight_log_id,
        weight=log.weight_kg,
        timestamp=_serialize_timestamp(log.timestamp),
    )


def create_weight_log(
    db: Session,
    user_id: str,
    weight_kg: float,
    timestamp: Optional[datetime] = None,
    date_str: Optional[str] = None,
) -> WeightLogResponse:
    log = WeightLog(
        weight_log_id=_generate_weight_log_id(),
        user_id=user_id,
        weight_kg=weight_kg,
        timestamp=_resolve_timestamp(timestamp, date_str),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return _format_weight_log(log)


def get_weight_logs(
    db: Session,
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[WeightLogResponse]:
    query = db.query(WeightLog).filter(WeightLog.user_id == user_id)

    if start_date:
        start_dt = datetime.combine(datetime.strptime(start_date, "%Y-%m-%d").date(), time.min)
        query = query.filter(WeightLog.timestamp >= start_dt)
    if end_date:
        end_dt = datetime.combine(datetime.strptime(end_date, "%Y-%m-%d").date(), time.max)
        query = query.filter(WeightLog.timestamp <= end_dt)

    logs = query.order_by(WeightLog.timestamp.asc()).all()
    return [_format_weight_log(log) for log in logs]


def delete_weight_log(db: Session, user_id: str, weight_log_id: str) -> bool:
    log = (
        db.query(WeightLog)
        .filter(WeightLog.weight_log_id == weight_log_id, WeightLog.user_id == user_id)
        .first()
    )
    if not log:
        return False

    db.delete(log)
    db.commit()
    return True