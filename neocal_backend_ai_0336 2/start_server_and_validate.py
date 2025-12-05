import subprocess
import time
import sys
import os
import requests
import json
import signal

sys.path.insert(0, '/app/neocal_backend_ai_0336')
os.chdir('/app/neocal_backend_ai_0336')

print("=" * 80)
print("NEOCAL BACKEND - COMPREHENSIVE E2E VALIDATION")
print("=" * 80)

print("\n[1] Starting FastAPI server on port 8000...")
proc = subprocess.Popen(
    [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'],
    cwd='/app/neocal_backend_ai_0336',
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

time.sleep(4)

try:
    print("[2] Testing health endpoint...")
    resp = requests.get('http://127.0.0.1:8000/health', timeout=5)
    print(f"✓ Health check: {resp.json()}")
    
    print("\n[3] Creating anonymous session...")
    resp = requests.post('http://127.0.0.1:8000/auth/anonymous-session', timeout=5)
    print(f"Status: {resp.status_code}")
    print(f"Response: {json.dumps(resp.json(), indent=2)}")
    
    if resp.status_code == 200:
        token = resp.json()['token']
        user_id = resp.json()['user_id']
        print(f"\n✓ Auth successful!")
        print(f"  Token: {token}")
        print(f"  User ID: {user_id}")
        
        print("\n[4] Testing protected endpoint (GET /user/profile)...")
        headers = {'X-Auth-Token': token}
        resp = requests.get('http://127.0.0.1:8000/user/profile', headers=headers, timeout=5)
        print(f"Status: {resp.status_code}")
        print(f"Response: {json.dumps(resp.json(), indent=2)}")
        
        print("\n[5] Testing meal logging from text...")
        payload = {
            'text': '2 slices of pizza and a coke'
        }
        resp = requests.post(
            'http://127.0.0.1:8000/meals/from-text',
            json=payload,
            headers=headers,
            timeout=10
        )
        print(f"Status: {resp.status_code}")
        print(f"Response: {json.dumps(resp.json(), indent=2)}")
        
        if resp.status_code == 201:
            meal_id = resp.json()['meal_id']
            print(f"\n[6] Retrieving meal {meal_id}...")
            resp = requests.get(f'http://127.0.0.1:8000/meals/{meal_id}', headers=headers, timeout=5)
            print(f"Status: {resp.status_code}")
            print(f"Response: {json.dumps(resp.json(), indent=2)}")
            
            print("\n[7] Getting daily summary...")
            resp = requests.get('http://127.0.0.1:8000/summary/day', headers=headers, timeout=5)
            print(f"Status: {resp.status_code}")
            print(f"Response: {json.dumps(resp.json(), indent=2)}")
    
    print("\n✓ Comprehensive validation complete!")
    
finally:
    print("\nTerminating server...")
    proc.terminate()
    proc.wait(timeout=5)