import logging
import json
import re
import time
from typing import Optional, Dict, List, Any

logger = logging.getLogger(__name__)

INFERENCE_TIMEOUT = 30
model_cache: Dict[str, Any] = {}

# --- Optional deps ---------------------------------------------------------

try:
    import torch  # type: ignore
except Exception:  # pragma: no cover
    torch = None  # type: ignore

try:
    from transformers import pipeline  # type: ignore
except Exception:  # pragma: no cover
    pipeline = None  # type: ignore


# --- Model loaders ---------------------------------------------------------


def load_text_model():
    """Lazy-load text model (GPT-2) for meal parsing."""
    if "text_model" in model_cache:
        return model_cache["text_model"]

    if pipeline is None:
        logger.warning("transformers not available, using text fallback")
        model_cache["text_model"] = None
        return None

    try:
        device = 0 if (torch is not None and torch.cuda.is_available()) else -1
        model_cache["text_model"] = pipeline(
            "text-generation",
            model="gpt2",
            device=device,
        )
        logger.info("Text model (GPT-2) loaded successfully")
    except Exception as e:  # pragma: no cover
        logger.error(f"Failed to load text model: {e}")
        model_cache["text_model"] = None

    return model_cache["text_model"]


def load_image_model():
    """Lazy-load CLIP vision model for zero-shot image classification."""
    if "image_model" in model_cache:
        return model_cache["image_model"]

    if pipeline is None:
        logger.warning("transformers not available, using image fallback")
        model_cache["image_model"] = None
        return None

    try:
        device = 0 if (torch is not None and torch.cuda.is_available()) else -1
        model_cache["image_model"] = pipeline(
            "zero-shot-image-classification",
            model="openai/clip-vit-base-patch32",
            device=device,
        )
        logger.info("CLIP image model loaded successfully")
    except Exception as e:  # pragma: no cover
        logger.error(f"Failed to load image model: {e}")
        model_cache["image_model"] = None

    return model_cache["image_model"]


# --- Helpers ---------------------------------------------------------------


def extract_json_from_text(text: str) -> Optional[Dict]:
    """Extract first JSON object from model output text."""
    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return None


def _parse_text_meal_fallback(description: str) -> List[Dict[str, Any]]:
    """
    Heuristic fallback for text meal parsing.

    Very simple keyword-based detector so the API still works even
    if models are missing.
    """
    desc = description.lower()
    foods: List[Dict[str, Any]] = []

    keywords = {
        "pizza": "pizza",
        "burger": "burger",
        "fries": "fries",
        "salad": "salad",
        "rice": "rice",
        "chicken": "chicken",
        "fish": "fish",
        "pasta": "pasta",
        "egg": "omelette",
        "omelette": "omelette",
        "biryani": "biryani",
    }

    for word, label in keywords.items():
        if word in desc:
            foods.append(
                {
                    "name": label,
                    "grams": 200,
                    "model_label": label.replace(" ", "_"),
                    "confidence": 0.7,
                }
            )

    if not foods:
        foods.append(
            {
                "name": "mixed meal",
                "grams": 300,
                "model_label": "mixed_meal",
                "confidence": 0.6,
            }
        )

    return foods


# --- Public: text meal parsing --------------------------------------------


def parse_text_meal(description: str) -> List[Dict[str, Any]]:
    """
    Parse a meal from free-form text description.

    Returns a list of food dicts:
    - name
    - grams
    - model_label
    - confidence
    """
    model = load_text_model()
    if model is None:
        return _parse_text_meal_fallback(description)

    prompt = (
        "You are a nutrition assistant. Extract foods and approximate grams "
        "from this description and return ONLY valid JSON with the format:\n"
        '{ "foods": [ { "name": "...","grams": 120 }, ... ] }\n\n'
        f"Description: {description}\n\nJSON:"
    )

    try:
        start = time.time()
        outputs = model(
            prompt,
            max_new_tokens=160,
            num_return_sequences=1,
            do_sample=False,
        )
        elapsed = time.time() - start

        if elapsed > INFERENCE_TIMEOUT:  # pragma: no cover
            logger.warning(
                "Text inference took %.1fs (>%ss), using fallback",
                elapsed,
                INFERENCE_TIMEOUT,
            )
            return _parse_text_meal_fallback(description)

        generated = outputs[0]["generated_text"]
        json_data = extract_json_from_text(generated)

        foods: List[Dict[str, Any]] = []
        if json_data and isinstance(json_data, dict) and "foods" in json_data:
            for item in json_data["foods"][:5]:
                name = str(item.get("name", "food")).lower()
                grams = float(item.get("grams", 150) or 150.0)
                grams = max(10.0, min(grams, 1000.0))
                foods.append(
                    {
                        "name": name,
                        "grams": grams,
                        "model_label": name.replace(" ", "_"),
                        "confidence": 0.8,
                    }
                )

        if not foods:
            return _parse_text_meal_fallback(description)

        return foods

    except Exception as e:  # pragma: no cover
        logger.error(f"Error in parse_text_meal: {e}")
        return _parse_text_meal_fallback(description)


# --- Public: image meal parsing -------------------------------------------


def parse_image_meal(image_url: str) -> List[Dict[str, Any]]:
    """
    Parse a meal from an image.

    Supports:
    - HTTP/HTTPS URLs
    - Local file paths (what /meals/from-image sends)
    - Anything accepted by HF pipeline (PIL image, etc.)

    Returns list of foods:
    - name
    - grams
    - model_label
    - confidence
    """
    model = load_image_model()
    if model is None:
        return _parse_image_meal_fallback(image_url)

    # Label space for CLIP
    food_labels = [
        "pizza",
        "burger",
        "fries",
        "salad",
        "pasta",
        "rice",
        "noodles",
        "sushi",
        "chicken",
        "fish",
        "steak",
        "tacos",
        "biryani",
        "sandwich",
        "omelette",
        "soup",
        "ice cream",
        "cake",
        "fruit",
        "vegetables",
    ]

    try:
        # HF pipeline accepts URLs, paths, or images directly
        results = model(
            image_url,
            candidate_labels=food_labels,
            hypothesis_template="a photo of {}",
        )

        foods: List[Dict[str, Any]] = []
        for r in results:
            score = float(r.get("score", 0.0))
            if score < 0.25:
                continue
            label = str(r.get("label", "meal")).lower()
            foods.append(
                {
                    "name": label,
                    "grams": 250,  # rough default; nutrition layer refines totals
                    "model_label": label.replace(" ", "_"),
                    "confidence": min(score, 0.99),
                }
            )

        if not foods:
            return _parse_image_meal_fallback(image_url)

        return foods[:5]

    except Exception as e:  # pragma: no cover
        logger.error(f"Error in parse_image_meal: {e}")
        return _parse_image_meal_fallback(image_url)


def _parse_image_meal_fallback(image_url: str) -> List[Dict[str, Any]]:
    """
    Fallback heuristic if CLIP is not available or fails.

    Uses simple keyword matching on the URL / path plus a generic default.
    """
    url_lower = image_url.lower()
    foods: List[Dict[str, Any]] = []

    if "pizza" in url_lower:
        foods = [
            {
                "name": "pizza",
                "grams": 300,
                "model_label": "pizza",
                "confidence": 0.9,
            }
        ]
    elif "salad" in url_lower:
        foods = [
            {
                "name": "salad",
                "grams": 250,
                "model_label": "salad",
                "confidence": 0.9,
            }
        ]
    elif "burger" in url_lower:
        foods = [
            {
                "name": "burger",
                "grams": 280,
                "model_label": "burger",
                "confidence": 0.9,
            }
        ]
    elif "fries" in url_lower or "chips" in url_lower:
        foods = [
            {
                "name": "fries",
                "grams": 200,
                "model_label": "fries",
                "confidence": 0.85,
            }
        ]
    else:
        foods = [
            {
                "name": "meal",
                "grams": 250,
                "model_label": "meal",
                "confidence": 0.7,
            }
        ]

    return foods


# --- Public: barcode parsing ----------------------------------------------


def parse_barcode_meal(
    barcode: str, serving_description: Optional[str] = None, servings: int = 1
) -> Dict[str, Any]:
    """
    Parse meal from barcode using a tiny lookup table.

    This is just a stub to keep the API consistent for the demo.
    """
    barcode_db: Dict[str, Dict[str, Any]] = {
        "012345678901": {
            "name": "Coca Cola 330ml",
            "calories": 140,
            "protein_g": 0,
            "carbs_g": 39,
            "fat_g": 0,
            "grams": 330,
        },
        "012345678902": {
            "name": "Sprite 330ml",
            "calories": 139,
            "protein_g": 0,
            "carbs_g": 34,
            "fat_g": 0,
            "grams": 330,
        },
        "012345678903": {
            "name": "Orange Juice 250ml",
            "calories": 110,
            "protein_g": 1,
            "carbs_g": 26,
            "fat_g": 0,
            "grams": 250,
        },
    }

    if barcode in barcode_db:
        product = barcode_db[barcode]
        return {
            "name": product["name"],
            "grams": product["grams"] * servings,
            "calories": product["calories"] * servings,
            "protein_g": product["protein_g"] * servings,
            "carbs_g": product["carbs_g"] * servings,
            "fat_g": product["fat_g"] * servings,
            "model_label": product["name"].lower().replace(" ", "_"),
            "confidence": 0.95,
        }

    # Unknown barcode – generic placeholder
    return {
        "name": f"Unknown product {barcode}",
        "grams": 100 * servings,
        "calories": 200 * servings,
        "protein_g": 5 * servings,
        "carbs_g": 30 * servings,
        "fat_g": 8 * servings,
        "model_label": "unknown_product",
        "confidence": 0.4,
    }
