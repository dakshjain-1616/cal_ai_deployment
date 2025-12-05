from fastapi import APIRouter, Depends, HTTPException, Header, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from database.db import get_db
from models.schemas import (
    MealResponse, TextMealRequest, ImageMealRequest,
    BarcodeMealRequest, DailySummaryResponse
)
from services.auth import verify_token
from services.meal_service import (
    create_meal_from_text, create_meal_from_image,
    create_meal_from_barcode, get_meal_by_id, get_meals_for_date,
    delete_meal
)
from services.summary_service import get_daily_summary

router = APIRouter(tags=["meals"])


async def get_current_user(
    x_auth_token: str = Header(None),
    db: Session = Depends(get_db)
):
    if not x_auth_token:
        raise HTTPException(status_code=401, detail="X-Auth-Token header required")

    user_id = verify_token(db, x_auth_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user_id


@router.post("/meals/from-text", response_model=MealResponse, status_code=201)
async def log_meal_from_text(
    request: TextMealRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return create_meal_from_text(db, user_id, request.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/meals/from-image", response_model=MealResponse, status_code=201)
async def log_meal_from_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        import os
        import uuid

        # Save uploaded file to a temp path
        ext = (file.filename or "jpg").split(".")[-1]
        filename = f"neocal_upload_{uuid.uuid4().hex}.{ext}"
        tmp_dir = "/tmp"
        os.makedirs(tmp_dir, exist_ok=True)
        filepath = os.path.join(tmp_dir, filename)

        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)

        # Pass local file path into the existing AI pipeline
        return create_meal_from_image(db, user_id, filepath)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/meals/from-barcode", response_model=MealResponse, status_code=201)
async def log_meal_from_barcode(
    request: BarcodeMealRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return create_meal_from_barcode(
            db,
            user_id,
            request.barcode,
            request.serving_description,
            request.servings,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/meals/{meal_id}", response_model=MealResponse)
async def get_meal(
    meal_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meal = get_meal_by_id(db, meal_id, user_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.delete("/meals/{meal_id}", status_code=204, response_class=Response)
async def remove_meal(
    meal_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deleted = delete_meal(db, user_id, meal_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Meal not found")
    return Response(status_code=204)


@router.get("/meals", response_model=list[MealResponse])
async def list_meals(
    date: str = Query(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meals = get_meals_for_date(db, user_id, date)
    if meals is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD",
        )
    return meals


@router.get("/summary/day", response_model=DailySummaryResponse)
async def get_day_summary(
    date: str = Query(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    summary = get_daily_summary(db, user_id, date)
    if summary is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD",
        )
    return summary
