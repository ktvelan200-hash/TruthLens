"""Import all models so SQLAlchemy registers them before create_all()."""
from app.models.user import User
from app.models.prediction import Prediction
from app.models.saved_article import SavedArticle

__all__ = ["User", "Prediction", "SavedArticle"]
