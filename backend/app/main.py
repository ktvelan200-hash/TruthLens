"""
TruthLens – FastAPI Application Entry Point

Start:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Docs:
    http://localhost:8000/docs
"""

import logging
import sys
import os

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure the backend root is on sys.path so `ml.*` imports resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings
from app.database.base import create_tables, check_db_connection
import app.models  # REQUIRED: registers User, Prediction, SavedArticle with Base.metadata
from app.services.prediction_service import prediction_service

# Routes
from app.routes import auth, news, prediction, history, dashboard

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s – %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Lifespan – startup / shutdown hooks
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== TruthLens starting up ===")

    # 0. Warn about any unfilled .env placeholders
    settings.warn_about_placeholders()

    # 1. Database
    if check_db_connection():
        logger.info("Database connection  ✓")
        try:
            create_tables()
            logger.info("Tables created/verified  ✓")
        except Exception as exc:
            logger.error("Failed to create tables: %s", exc)
    else:
        logger.warning(
            "Database is NOT reachable. "
            "Start MySQL and check DATABASE_URL in .env"
        )

    # 2. ML Model
    logger.info("Loading ML model ...")
    loaded = prediction_service.load()
    if loaded:
        metrics = prediction_service.get_metrics()
        model_name = metrics.get("best_model", "unknown")
        f1 = metrics.get("best_metrics", {}).get("f1", "N/A")
        logger.info("Model loaded  ✓  (%s, F1=%.4s)", model_name, f1)
    else:
        logger.warning(
            "ML model could not be loaded or trained. "
            "Prediction endpoint will return 503 until model is available."
        )

    logger.info("=== TruthLens ready on port %s ===", settings.app_port)
    yield
    logger.info("=== TruthLens shutting down ===")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="TruthLens – Fake News Detection API",
    description=(
        "REST API for the TruthLens fake-news detection system. "
        "Supports user authentication, NewsAPI integration, "
        "NLP preprocessing, and ML-based article classification."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global error handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred."},
    )

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

app.include_router(auth.router)
app.include_router(news.router)
app.include_router(prediction.router)
app.include_router(history.router)
app.include_router(dashboard.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "db_connected": check_db_connection(),
        "model_ready": prediction_service.is_ready,
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "app": "TruthLens – Fake News Detection",
        "version": "1.0.0",
        "docs": "/docs",
    }
