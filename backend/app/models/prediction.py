"""SQLAlchemy ORM model – predictions table."""

from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    headline: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=True)
    prediction: Mapped[str] = mapped_column(String(10), nullable=False)   # "REAL" | "FAKE"
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    label: Mapped[int] = mapped_column(Integer, nullable=False)           # 1=REAL, 0=FAKE
    source: Mapped[str] = mapped_column(String(200), nullable=True)
    article_url: Mapped[str] = mapped_column(String(1000), nullable=True)
    image_url: Mapped[str] = mapped_column(String(1000), nullable=True)
    author: Mapped[str] = mapped_column(String(200), nullable=True)
    published_at: Mapped[str] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Relationship
    user = relationship("User", back_populates="predictions")

    def __repr__(self) -> str:
        return f"<Prediction id={self.id} prediction={self.prediction!r} confidence={self.confidence}>"
