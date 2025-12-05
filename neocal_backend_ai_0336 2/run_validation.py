import subprocess
import time
import sys
import os
import json
import threading

sys.path.insert(0, '/app/neocal_backend_ai_0336')

def run_server():
    """Start FastAPI server in background"""
    os.chdir('/app/neocal_backend_ai_0336')
    subprocess.Popen(
        [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

print("[1/4] Starting FastAPI server...")
server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
time.sleep(3)

print("[2/4] Testing server connectivity...")
import requests
try:
    response = requests.get('http://localhost:8000/docs', timeout=5)
    print(f"✓ Server responding on port 8000 (status: {response.status_code})")
except Exception as e:
    print(f"✗ Server connection failed: {e}")
    sys.exit(1)

print("[3/4] Running comprehensive API validation...")
os.chdir('/app/neocal_backend_ai_0336')
result = subprocess.run([sys.executable, 'scripts/test_api.py'], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)

print("[4/4] Validation complete. Results captured above.")
time.sleep(1)