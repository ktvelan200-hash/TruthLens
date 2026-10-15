# TruthLens – Backend Startup Script (PowerShell)
# Run from the backend/ directory:   .\start.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== TruthLens Backend ===" -ForegroundColor Cyan

# Check venv
if (-not (Test-Path ".\venv")) {
    Write-Host "Creating Python virtual environment ..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate
Write-Host "Activating virtual environment ..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install deps
Write-Host "Installing dependencies ..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

# Train model if not present
if (-not (Test-Path ".\ml\models\fake_news_model.pkl")) {
    Write-Host "Training ML model (first run) ..." -ForegroundColor Yellow
    python -m ml.train
}

# Start server
Write-Host "Starting FastAPI server on http://localhost:8000 ..." -ForegroundColor Green
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
