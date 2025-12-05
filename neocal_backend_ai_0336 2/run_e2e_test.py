import subprocess
import time
import sys
import os

print("Starting FastAPI server...")
server_process = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd="/app/neocal_backend_ai_0336",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

time.sleep(5)

print("Server started. Running API tests...\n")

try:
    result = subprocess.run(
        [sys.executable, "/app/neocal_backend_ai_0336/scripts/test_api.py"],
        timeout=120,
        capture_output=True,
        text=True
    )
    
    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    print(f"Test exit code: {result.returncode}")
    
finally:
    print("\nShutting down server...")
    server_process.terminate()
    try:
        server_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server_process.kill()