"""
Prediction route – POST /api/predict
Runs NLP preprocessing + ML model and returns REAL/FAKE with confidence.
Optionally saves the result to the database if the user is authenticated.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictRequest, PredictResponse
from app.services.prediction_service import prediction_service
from app.utils.auth import get_optional_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Prediction"])


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Analyze a news article and predict REAL or FAKE",
    description=(
        "Runs NLP preprocessing (lowercase, stop-word removal, lemmatization) "
        "followed by TF-IDF feature extraction and a trained ML classifier. "
        "The result is a prediction label (REAL/FAKE), confidence score, "
        "per-class probabilities, and top keywords used by the model."
    ),
)
async def predict(
    body: PredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user),
):
    if not prediction_service.is_ready:
        loaded = prediction_service.load()
        if not loaded:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "ML model is not available. "
                    "Run `python -m ml.train` to train the model first."
                ),
            )

    try:
        result = prediction_service.predict(body.headline, body.content)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error during prediction")
        raise HTTPException(status_code=500, detail="Internal prediction error")

    # Persist to DB (non-blocking – skip on error)
    try:
        record = Prediction(
            user_id=current_user.id if current_user else None,
            headline=body.headline,
            content=body.content,
            prediction=result.prediction,
            confidence=result.confidence,
            label=result.label,
            source=body.source,
            article_url=body.article_url,
            image_url=body.image_url,
            author=body.author,
            published_at=body.published_at,
        )
        db.add(record)
        db.commit()
    except Exception as exc:
        logger.warning("Failed to save prediction to DB: %s", exc)
        db.rollback()

    return result


@router.get(
    "/model/info",
    summary="Return current model metadata and training metrics",
)
def model_info():
    metrics = prediction_service.get_metrics()
    return {
        "model_ready": prediction_service.is_ready,
        "metrics": metrics,
    }
