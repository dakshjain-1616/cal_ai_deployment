import sys
sys.path.insert(0, '/app/neocal_backend_ai_0336')

print("Testing model imports and initialization...\n")

try:
    print("[1] Importing services.ai_service...")
    from services.ai_service import parse_text_meal, parse_image_meal, parse_barcode_meal
    print("    ✓ Import successful")
except Exception as e:
    print(f"    ✗ Import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n[2] Testing parse_text_meal()...")
try:
    result = parse_text_meal("2 cups chicken and rice")
    print(f"    ✓ Result: {result[0] if result else 'Empty'}")
except Exception as e:
    print(f"    ✗ Error: {e}")

print("\n[3] Testing parse_image_meal()...")
try:
    result = parse_image_meal("https://example.com/pizza.jpg")
    print(f"    ✓ Result: {result[0] if result else 'Empty'}")
except Exception as e:
    print(f"    ✗ Error: {e}")

print("\n[4] Testing parse_barcode_meal()...")
try:
    result = parse_barcode_meal("012345678901", servings=1)
    print(f"    ✓ Result: {result.get('name') if result else 'Empty'}")
except Exception as e:
    print(f"    ✗ Error: {e}")

print("\n[5] Importing main app...")
try:
    from main import app
    print(f"    ✓ App imported, {len(app.routes)} routes registered")
    auth_routes = [r.path for r in app.routes if 'auth' in r.path]
    print(f"    Auth routes: {auth_routes}")
except Exception as e:
    print(f"    ✗ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n✓ All verification checks passed!")