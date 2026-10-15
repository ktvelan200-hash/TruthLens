"""
History routes – GET/DELETE /api/history
Returns and manages the authenticated user's prediction history.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.base import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionHistoryItem
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get(
    "",
    response_model=list[PredictionHistoryItem],
    summary="Get the current user's prediction history",
)
def get_history(
    filter_by: Optional[str] = Query(None, description="Filter: REAL | FAKE"),
    search:    Optional[str] = Query(None, description="Search by headline"),
    page:      int            = Query(1,    ge=1),
    page_size: int            = Query(20,   ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
    )

    if filter_by and filter_by.upper() in ("REAL", "FAKE"):
        query = query.filter(Prediction.prediction == filter_by.upper())

    if search:
        query = query.filter(
            Prediction.headline.ilike(f"%{search}%")
        )

    total = query.count()
    items = (
        query
        .order_by(Prediction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return [PredictionHistoryItem.model_validate(i) for i in items]


@router.get(
    "/count",
    summary="Return total count of predictions for the current user",
)
def history_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Prediction).filter(Prediction.user_id == current_user.id).count()
    real  = db.query(Prediction).filter(
        Prediction.user_id == current_user.id,
        Prediction.prediction == "REAL",
    ).count()
    fake  = total - real
    return {"total": total, "real": real, "fake": fake}


@router.get(
    "/{prediction_id}",
    response_model=PredictionHistoryItem,
    summary="Get a single prediction by ID",
)
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(Prediction)
        .filter(
            Prediction.id == prediction_id,
            Prediction.user_id == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return PredictionHistoryItem.model_validate(item)


@router.delete(
    "/{prediction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a prediction from history",
)
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(Prediction)
        .filter(
            Prediction.id == prediction_id,
            Prediction.user_id == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Prediction not found")
    db.delete(item)
    db.commit()


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear all history for the current user",
)
def clear_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Prediction).filter(Prediction.user_id == current_user.id).delete()
    db.commit()
