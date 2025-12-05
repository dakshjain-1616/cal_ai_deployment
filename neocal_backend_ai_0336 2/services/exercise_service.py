import secrets
from datetime import datetime, time, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from models.database import ExerciseLog
from models.schemas import ExerciseLogResponse


def _generate_exercise_log_id() -> str:
    return f"exercise_{secrets.token_hex(8)}"


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


def _format_exercise_log(log: ExerciseLog) -> ExerciseLogResponse:
    return ExerciseLogResponse(
        exercise_log_id=log.exercise_log_id,
        name=log.name,
        duration=log.duration_minutes,
        caloriesBurned=log.calories_burned,
        timestamp=_serialize_timestamp(log.timestamp),
    )


def create_exercise_log(
    db: Session,
    user_id: str,
    name: str,
    duration_minutes: int,
    calories_burned: int,
    timestamp: Optional[datetime] = None,
    date_str: Optional[str] = None,
) -> ExerciseLogResponse:
    log = ExerciseLog(
        exercise_log_id=_generate_exercise_log_id(),
        user_id=user_id,
        name=name,
        duration_minutes=duration_minutes,
        calories_burned=calories_burned,
        timestamp=_resolve_timestamp(timestamp, date_str),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return _format_exercise_log(log)


def get_exercise_logs_for_date(
    db: Session,
    user_id: str,
    date_str: Optional[str],
) -> List[ExerciseLogResponse]:
    start, end = _get_day_bounds(date_str)
    logs = (
        db.query(ExerciseLog)
        .filter(ExerciseLog.user_id == user_id)
        .filter(ExerciseLog.timestamp >= start, ExerciseLog.timestamp <= end)
        .order_by(ExerciseLog.timestamp.asc())
        .all()
    )
    return [_format_exercise_log(log) for log in logs]


def delete_exercise_log(db: Session, user_id: str, exercise_log_id: str) -> bool:
    log = (
        db.query(ExerciseLog)
        .filter(
            ExerciseLog.exercise_log_id == exercise_log_id,
            ExerciseLog.user_id == user_id,
        )
        .first()
    )
    if not log:
        return False

    db.delete(log)
    db.commit()
    return True