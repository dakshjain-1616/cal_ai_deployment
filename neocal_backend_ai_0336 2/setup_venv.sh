#!/usr/bin/env bash
set -euo pipefail

# Creates a .venv in this backend folder and installs requirements
# Run from: cd "neocal_backend_ai_0336 2" && ./setup_venv.sh

PYTHON=${PYTHON:-python3}
VENV_DIR=".venv"

echo "Using python: $(which $PYTHON)"

$PYTHON -m venv $VENV_DIR
source $VENV_DIR/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
# Optional: install openai client for future direct OpenAI calls
pip install openai

echo "Virtualenv created at ./.venv and dependencies installed. Activate: source .venv/bin/activate"
