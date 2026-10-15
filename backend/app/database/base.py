"""
Database engine + session factory.
Supports:
  - SQLite   (local dev / tests)     sqlite:///./truthlens.db
  - PostgreSQL via Supabase          postgresql+psycopg2://...
  - MySQL / MariaDB                  mysql+pymysql://...
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

settings = get_settings()

_url = settings.database_url
_is_sqlite     = _url.startswith("sqlite")
_is_postgres   = _url.startswith("postgresql") or _url.startswith("postgres://")

# ── Engine kwargs ────────────────────────────────────────────────────────────
_engine_kwargs: dict = {
    "pool_pre_ping": True,
    # SQL echo only in dev and only for non-SQLite (avoids noisy test output)
    "echo": settings.app_env == "development" and not _is_sqlite,
}

if _is_sqlite:
    # SQLite needs check_same_thread=False for multi-threaded FastAPI usage
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

elif _is_postgres:
    # Supabase requires SSL; psycopg2 honours sslmode in connect_args
    _engine_kwargs["connect_args"] = {"sslmode": "require"}
    _engine_kwargs["pool_size"]    = 5
    _engine_kwargs["max_overflow"] = 10
    _engine_kwargs["pool_recycle"] = 300   # recycle connections every 5 min

else:
    # MySQL
    _engine_kwargs["pool_recycle"] = 3600

engine = create_engine(_url, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# ── FastAPI dependency ───────────────────────────────────────────────────────

def get_db():
    """Yield a database session and close it on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Create all registered ORM tables that do not already exist."""
    Base.metadata.create_all(bind=engine)


def check_db_connection() -> bool:
    """Return True if the database is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
