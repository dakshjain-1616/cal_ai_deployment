import subprocess
import time
import sys
import os
import requests
import json

sys.path.insert(0, '/app/neocal_backend_ai_0336')
os.chdir('/app/neocal_backend_ai_0336')

print("=" * 80)
print("NEOCAL BACKEND - DETAILED VALIDATION")
print("=" * 80)

print("\n[STEP 1] Checking dependencies...")
try:
    import fastapi
    import uvicorn
    import sqlalchemy
    import pydantic
    print("✓ FastAPI, Uvicorn, SQLAlchemy, Pydantic available")
except Exception as e:
    print(f"✗ Missing dependency: {e}")
    sys.exit(1)

print("\n[STEP 2] Checking database...")
if os.path.exists('/app/neocal_backend_ai_0336/data/neocal.db'):
    print("✓ Database file exists at /app/neocal_backend_ai_0336/data/neocal.db")
else:
    print("✗ Database file not found")
    sys.exit(1)

print("\n[STEP 3] Importing main application...")
try:
    from main import app
    print("✓ FastAPI app imported successfully")
    print(f"  Routes registered: {len(app.routes)}")
    for route in app.routes:
        if hasattr(route, 'path'):
            print(f"    - {route.methods if hasattr(route, 'methods') else 'N/A'} {route.path}")
except Exception as e:
    print(f"✗ Failed to import app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n[STEP 4] Starting server in background...")
proc = subprocess.Popen(
    [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--log-level', 'debug'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)
time.sleep(4)

print("\n[STEP 5] Testing server connectivity...")
for attempt in range(5):
    try:
        response = requests.get('http://localhost:8000/health', timeout=3)
        print(f"✓ Server responding: {response.json()}")
        break
    except Exception as e:
        if attempt < 4:
            print(f"  Attempt {attempt + 1}/5 failed, retrying in 1s...")
            time.sleep(1)
        else:
            print(f"✗ Server not responding after 5 attempts: {e}")
            sys.exit(1)

print("\n[STEP 6] Testing /auth/anonymous-session endpoint...")
try:
    response = requests.post('http://localhost:8000/auth/anonymous-session', timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    if response.status_code == 200:
        data = response.json()
        if 'token' in data and 'user_id' in data:
            print("✓ Auth endpoint working correctly")
        else:
            print("✗ Response missing expected fields")
    else:
        print(f"✗ Unexpected status code: {response.status_code}")
except Exception as e:
    print(f"✗ Request failed: {e}")

print("\n[STEP 7] Listing all available routes...")
try:
    response = requests.get('http://localhost:8000/openapi.json', timeout=5)
    if response.status_code == 200:
        openapi = response.json()
        print("Available paths:")
        for path in openapi.get('paths', {}):
            print(f"  - {path}")
except Exception as e:
    print(f"✗ Could not fetch OpenAPI spec: {e}")

print("\nServer PID:", proc.pid)
print("Server still running. Use 'kill -9' to terminate.")
time.sleep(2)