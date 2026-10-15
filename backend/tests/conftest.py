"""
Pytest configuration – uses SQLite in-memory so MySQL is never needed.

Strategy: patch app.database.base.engine and SessionLocal BEFORE
the app lifespan runs, then override the get_db dependency.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# ── Build the SQLite engine ──────────────────────────────────────────────────
SQLITE_URL = "sqlite:///./test_truthlens.db"

_test_engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
)
_TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)

# ── Patch database module BEFORE importing app ───────────────────────────────
import app.database.base as _db_base           # noqa: E402
_db_base.engine         = _test_engine         # replace the MySQL engine
_db_base.SessionLocal   = _TestingSession      # replace the session factory

# ── NOW import the FastAPI app (it uses the patched engine) ──────────────────
from app.database.base import Base, get_db     # noqa: E402
from app.main import app as fastapi_app        # noqa: E402
import app.models                              # noqa: F401, E402 – register ORM models


# ── Override the get_db dependency ──────────────────────────────────────────
def _override_get_db():
    db = _TestingSession()
    try:
        yield db
    finally:
        db.close()


fastapi_app.dependency_overrides[get_db] = _override_get_db


# ── Session-scoped fixtures ──────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=_test_engine)
    yield
    Base.metadata.drop_all(bind=_test_engine)
    try:
        if os.path.exists("test_truthlens.db"):
            os.remove("test_truthlens.db")
    except OSError:
        pass


@pytest.fixture(scope="session")
def client(setup_database):
    with TestClient(fastapi_app, raise_server_exceptions=False) as c:
        yield c


# ── Shared auth helper ────────────────────────────────────────────────────────
TEST_USER = {
    "name":     "Test User",
    "email":    "test@truthlens.io",
    "password": "TestPass123",
}


@pytest.fixture(scope="module")
def auth_headers(client):
    """Register (or login if already registered) and return Bearer headers."""
    r = client.post("/api/auth/register", json=TEST_USER)
    if r.status_code == 409:
        r = client.post("/api/auth/login", json={
            "email":    TEST_USER["email"],
            "password": TEST_USER["password"],
        })
    assert r.status_code in (200, 201), f"Auth setup failed ({r.status_code}): {r.text}"
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
