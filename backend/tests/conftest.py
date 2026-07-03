"""Test configuration: spin up the app against a throwaway SQLite database.

Environment must be set before importing the app, since app.database builds the
engine at import time from DATABASE_URL.
"""
import os
import tempfile

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
import app.main as main_module
# Import models so their tables register on Base before create_all.
import app.models.user  # noqa: F401
import app.models.session  # noqa: F401
import app.models.daily_visit  # noqa: F401
import app.models.calendar_event  # noqa: F401

Base.metadata.create_all(bind=engine)


@pytest.fixture()
def client():
    with TestClient(main_module.app) as c:
        yield c


@pytest.fixture()
def register_and_login(client):
    """Register a user and return (auth_headers, username)."""
    def _make(username="alice", password="supersecret1", email=None):
        email = email or f"{username}@example.com"
        client.post(
            "/api/auth/register",
            json={"username": username, "email": email, "password": password, "full_name": username},
        )
        resp = client.post(
            "/api/auth/login",
            data={"username": username, "password": password},
        )
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}, username
    return _make
