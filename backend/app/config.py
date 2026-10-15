"""
TruthLens – Application Configuration
Loads all settings from environment variables via pydantic-settings.
"""

import logging
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

# Resolve .env relative to this file (backend/app/config.py → backend/.env)
_ENV_FILE = str(Path(__file__).parent.parent / ".env")

# Placeholder sentinel values that must be replaced before use
_PLACEHOLDERS = {
    "your_newsapi_key_here",
    "your_mysql_password_here",
    "your_supabase_db_password_here",
    "your_very_long_random_secret_key_here_change_this",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Database
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "postgres"
    db_user: str = "postgres"
    db_password: str = ""
    database_url: str = "sqlite:///./truthlens.db"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""

    # JWT
    jwt_secret: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # NewsAPI
    news_api_key: str = ""
    news_api_base_url: str = "https://newsapi.org/v2"

    # ML Model
    model_path: str = "ml/models/fake_news_model.pkl"
    vectorizer_path: str = "ml/models/tfidf_vectorizer.pkl"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def db_password_is_placeholder(self) -> bool:
        return self.db_password in _PLACEHOLDERS

    @property
    def news_api_key_is_placeholder(self) -> bool:
        return self.news_api_key in _PLACEHOLDERS

    def warn_about_placeholders(self) -> None:
        """Log clear warnings for any settings still containing placeholder values."""
        if self.db_password_is_placeholder or "your_supabase_db_password" in self.database_url:
            logger.warning(
                "⚠  DATABASE_URL still has a placeholder DB password.\n"
                "   Go to Supabase Dashboard → Project Settings → Database\n"
                "   copy your Database Password and update DATABASE_URL in backend/.env"
            )
        if self.news_api_key_is_placeholder:
            logger.warning(
                "⚠  NEWS_API_KEY still contains a placeholder value.\n"
                "   Get a free key at https://newsapi.org/register"
            )
        if self.jwt_secret in _PLACEHOLDERS:
            logger.warning(
                "⚠  JWT_SECRET still contains a placeholder value.\n"
                '   Run: python -c "import secrets; print(secrets.token_hex(32))"'
            )


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance (thread-safe via lru_cache)."""
    return Settings()
