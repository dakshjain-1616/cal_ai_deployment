Integration tests for NeoCal AI backend

Run the tests against a running backend (local or deployed).

Requirements
- Python 3.8+
- `requests` package (install into backend venv): `pip install requests`

Usage:

```bash
cd "neocal_backend_ai_0336 2"/integration_tests
# optional: export BACKEND_URL if not localhost
# export BACKEND_URL=http://192.168.1.100:8000
python3 run_integration_tests.py
```

Notes
- The script creates an anonymous session, logs water, creates a structured meal, attempts an image scan (uses https://via.placeholder.com/150), and fetches the daily summary.
- If any critical endpoint fails, the script exits with a non-zero status and prints the server response.
