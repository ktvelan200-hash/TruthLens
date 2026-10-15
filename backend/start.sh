#!/usr/bin/env bash
# TruthLens – Backend Startup Script (Bash / Linux / macOS)
# Run from the backend/ directory:  bash start.sh

set -e

echo "=== TruthLens Backend ==="

# Create venv if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment ..."
    python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install deps
echo "Installing dependencies ..."
pip install -r requirements.txt -q

# Train model if not present
if [ ! -f "ml/models/fake_news_model.pkl" ]; then
    echo "Training ML model (first run) ..."
    python -m ml.train
fi

# Start server
echo "Starting FastAPI server on http://localhost:8000 ..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
