import sys
import os
sys.path.insert(0, '/app/neocal_backend_ai_0336')

from services.ai_service import parse_text_meal, parse_image_meal, parse_barcode_meal
import json

print("=" * 60)
print("Testing parse_text_meal() with GPT-2")
print("=" * 60)
try:
    result = parse_text_meal("2 cups of chicken rice and a bowl of salad")
    print(f"Input: '2 cups of chicken rice and a bowl of salad'")
    print(f"Output: {json.dumps(result, indent=2)}")
    print(f"Type: {type(result)}, Length: {len(result)}")
    for item in result:
        assert 'name' in item, "Missing 'name' field"
        assert 'grams' in item, "Missing 'grams' field"
        assert 'model_label' in item, "Missing 'model_label' field"
        assert 'confidence' in item, "Missing 'confidence' field"
        assert isinstance(item['confidence'], (int, float)), "confidence should be numeric"
        assert 0 <= item['confidence'] <= 1, "confidence should be 0-1"
    print("✓ parse_text_meal() validation PASSED\n")
except Exception as e:
    print(f"✗ parse_text_meal() error: {e}\n")

print("=" * 60)
print("Testing parse_image_meal() with CLIP")
print("=" * 60)
try:
    result = parse_image_meal("https://example.com/pizza.jpg")
    print(f"Input: 'https://example.com/pizza.jpg'")
    print(f"Output: {json.dumps(result, indent=2)}")
    print(f"Type: {type(result)}, Length: {len(result)}")
    for item in result:
        assert 'name' in item, "Missing 'name' field"
        assert 'grams' in item, "Missing 'grams' field"
        assert 'model_label' in item, "Missing 'model_label' field"
        assert 'confidence' in item, "Missing 'confidence' field"
        assert isinstance(item['confidence'], (int, float)), "confidence should be numeric"
        assert 0 <= item['confidence'] <= 1, "confidence should be 0-1"
    print("✓ parse_image_meal() validation PASSED\n")
except Exception as e:
    print(f"✗ parse_image_meal() error: {e}\n")

print("=" * 60)
print("Testing parse_barcode_meal() with lookup table")
print("=" * 60)
try:
    result = parse_barcode_meal("012345678901", servings=2)
    print(f"Input: barcode='012345678901', servings=2")
    print(f"Output: {json.dumps(result, indent=2)}")
    assert 'name' in result, "Missing 'name' field"
    assert 'grams' in result, "Missing 'grams' field"
    assert 'calories' in result, "Missing 'calories' field"
    assert 'protein_g' in result, "Missing 'protein_g' field"
    assert 'carbs_g' in result, "Missing 'carbs_g' field"
    assert 'fat_g' in result, "Missing 'fat_g' field"
    assert 'confidence' in result, "Missing 'confidence' field"
    assert isinstance(result['confidence'], (int, float)), "confidence should be numeric"
    assert 0 <= result['confidence'] <= 1, "confidence should be 0-1"
    print("✓ parse_barcode_meal() validation PASSED\n")
except Exception as e:
    print(f"✗ parse_barcode_meal() error: {e}\n")

print("=" * 60)
print("All parsing function tests completed")
print("=" * 60)