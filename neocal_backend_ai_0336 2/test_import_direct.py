import sys
import os

sys.path.insert(0, '/app/neocal_backend_ai_0336')
os.chdir('/app/neocal_backend_ai_0336')

print("Python path:", sys.path[:3])
print("Current dir:", os.getcwd())
print("Files in current dir:", os.listdir('.')[:5])

print("\nTrying to import main module...")
try:
    import main
    print(f"✓ main module imported from: {main.__file__}")
    print(f"✓ app object: {main.app}")
    
    print("\nApp routes:")
    for route in main.app.routes:
        if hasattr(route, 'path'):
            print(f"  {route.path}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()