"""SQLAlchemy ORM model – saved_articles table."""

from datetime import datetime
from sqlalchemy import String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class SavedArticle(Base):
    __tablename__ = "saved_articles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=True)
    source: Mapped[str] = mapped_column(String(200), nullable=True)
    author: Mapped[str] = mapped_column(String(200), nullable=True)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    image_url: Mapped[str] = mapped_column(String(1000), nullable=True)
    published_at: Mapped[str] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="saved_articles")

    def __repr__(self) -> str:
        return f"<SavedArticle id={self.id} title={self.title[:40]!r}>"
