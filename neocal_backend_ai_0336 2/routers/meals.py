from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response, Header
from sqlalchemy.orm import Session
from database.db import get_db
from models.schemas import (
    MealResponse, TextMealRequest, ImageMealRequest,
    BarcodeMealRequest, DailySummaryResponse, Food
)
from services.auth import verify_token
from services.meal_service import (
    create_meal_from_text, create_meal_from_image,
    create_meal_from_barcode, get_meal_by_id, get_meals_for_date,
    get_meals_for_range, create_meal_from_structured,
    delete_meal
)
from services.summary_service import get_daily_summary

router = APIRouter(tags=["meals"])


# --- Auth Dependency (must be above all route definitions) ---
async def get_current_user(
    x_auth_token: str = Header(None, alias="X-Auth-Token"),
    db: Session = Depends(get_db),
) -> str:
    """
    Extract and verify user from authentication token.
    """
    if not x_auth_token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    user_id = verify_token(db, x_auth_token)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    return user_id


# --- Food Search Endpoint ---
@router.get("/meals/search")
async def search_food(
    q: str = Query(..., description="Search query for food name"),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Use nutrition database for search
    from services.nutrition_service import NUTRITION_DATABASE
    results = []
    for key, nutrition in NUTRITION_DATABASE.items():
        if q.lower() in key.replace('_', ' '):
            results.append({
                "id": key,
                "name": key.replace('_', ' ').title(),
                "serving": "100g",
                "calories": nutrition.get("calories", 0),
                "protein": nutrition.get("protein_g", 0),
                "carbs": nutrition.get("carbs_g", 0),
                "fat": nutrition.get("fat_g", 0)
            })
    # Always return 200 OK with results (even if empty)
    return {"results": results}


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


@router.post("/meals/scan", response_model=List[Food])
async def scan_meal_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Food]:
    """Upload an image and return parsed foods with nutrition estimates.

    This endpoint does NOT persist a meal; it only returns the AI
    parse result and estimated nutrition so the client can preview.
    """
    try:
        import os
        import uuid

        # Save uploaded file to a temp path
        ext = (file.filename or "jpg").split(".")[-1]
        filename = f"neocal_scan_{uuid.uuid4().hex}.{ext}"
        tmp_dir = "/tmp"
        os.makedirs(tmp_dir, exist_ok=True)
        filepath = os.path.join(tmp_dir, filename)

        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)

        # Use AI service to parse image (may call OpenAI/HF/local fallback)
        from services.ai_service import parse_image_meal
        from services.nutrition_service import lookup_food_nutrition, scale_nutrition_by_grams

        parsed = parse_image_meal(filepath)
        results: List[Food] = []
        for item in parsed:
            name = item.get("name", "meal")
            grams = float(item.get("grams", 250) or 250)
            nutrition = lookup_food_nutrition(name)
            scaled = scale_nutrition_by_grams(nutrition, grams)
            food_obj = {
                "name": name,
                "grams": grams,
                "calories": scaled.get("calories", 0),
                "protein_g": scaled.get("protein_g", 0),
                "carbs_g": scaled.get("carbs_g", 0),
                "fat_g": scaled.get("fat_g", 0),
                "model_label": item.get("model_label", name.replace(" ", "_")),
                "confidence": float(item.get("confidence", 0.7)),
            }
            results.append(Food(**food_obj))

        return results
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


@router.get("/meals/history", response_model=List[MealResponse])
async def meals_history(
    date: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[MealResponse]:
    # Support single-date or date-range queries
    if date:
        meals = get_meals_for_date(db, user_id, date)
        if meals is None:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        return meals

    if start_date and end_date:
        meals = get_meals_for_range(db, user_id, start_date, end_date)
        if meals is None:
            raise HTTPException(status_code=400, detail="Invalid date range format. Use YYYY-MM-DD")
        return meals

    raise HTTPException(status_code=400, detail="Provide either 'date' or 'start_date' and 'end_date'")


@router.post("/meals", response_model=MealResponse, status_code=201)
async def create_meal_manual(
    foods: List[dict],
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MealResponse:
    """Create a meal by posting a structured list of food objects.

    Example body: [{"name":"rice","grams":200, "calories":260, "protein_g":5, ...}, ...]
    """
    try:
        return create_meal_from_structured(db, user_id, foods)
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


@router.get("/meals", response_model=List[MealResponse])
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
