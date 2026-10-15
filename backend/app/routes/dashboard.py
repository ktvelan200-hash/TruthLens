"""
Dashboard route – GET /api/dashboard
Aggregates prediction statistics for the authenticated user.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.base import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.dashboard import DashboardStats, DailyStats
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get(
    "",
    response_model=DashboardStats,
    summary="Return aggregate statistics for the current user's dashboard",
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id
    base_q = db.query(Prediction).filter(Prediction.user_id == uid)

    total = base_q.count()
    real  = base_q.filter(Prediction.prediction == "REAL").count()
    fake  = total - real

    avg_conf_row = (
        db.query(func.avg(Prediction.confidence))
        .filter(Prediction.user_id == uid)
        .scalar()
    )
    avg_conf = round(float(avg_conf_row or 0), 4)

    # Daily stats – last 14 days
    daily: list[DailyStats] = []
    today = datetime.utcnow().date()
    for i in range(13, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, 0, 0, 0)
        day_end   = datetime(day.year, day.month, day.day, 23, 59, 59)

        day_real = (
            db.query(Prediction)
            .filter(
                Prediction.user_id == uid,
                Prediction.prediction == "REAL",
                Prediction.created_at >= day_start,
                Prediction.created_at <= day_end,
            )
            .count()
        )
        day_fake = (
            db.query(Prediction)
            .filter(
                Prediction.user_id == uid,
                Prediction.prediction == "FAKE",
                Prediction.created_at >= day_start,
                Prediction.created_at <= day_end,
            )
            .count()
        )
        daily.append(DailyStats(
            date=day.strftime("%b %d"),
            real_count=day_real,
            fake_count=day_fake,
        ))

    return DashboardStats(
        total_analyzed=total,
        real_count=real,
        fake_count=fake,
        avg_confidence=avg_conf,
        real_percentage=round((real / total * 100) if total else 0, 1),
        fake_percentage=round((fake / total * 100) if total else 0, 1),
        daily_stats=daily,
    )
