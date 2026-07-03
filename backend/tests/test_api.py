"""Endpoint tests covering the security fixes.

Run from backend/:  pytest -q
"""


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_register_rejects_short_password(client):
    r = client.post(
        "/api/auth/register",
        json={"username": "shorty", "email": "shorty@example.com", "password": "abc"},
    )
    assert r.status_code == 422  # pydantic validation error


def test_register_and_login_flow(register_and_login):
    headers, username = register_and_login(username="bob")
    assert headers["Authorization"].startswith("Bearer ")


def test_login_wrong_password_rejected(client, register_and_login):
    register_and_login(username="carol", password="rightpassword1")
    r = client.post("/api/auth/login", data={"username": "carol", "password": "wrongpassword"})
    assert r.status_code == 401


def test_users_list_requires_auth(client):
    # The critical fix: no anonymous PII dump.
    assert client.get("/api/auth/users").status_code == 401
    assert client.get("/api/auth/users/count").status_code == 401


def test_users_list_forbidden_for_non_admin(client, register_and_login):
    headers, _ = register_and_login(username="dave")
    assert client.get("/api/auth/users", headers=headers).status_code == 403


def test_users_list_allowed_for_admin(client, register_and_login):
    from app.database import SessionLocal
    from app.models.user import User

    headers, username = register_and_login(username="admin")
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.username == username).first()
        u.is_admin = True
        db.commit()
    finally:
        db.close()
    r = client.get("/api/auth/users", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    # Passwords are never serialised.
    assert all("hashed_password" not in row and "password" not in row for row in r.json())


def test_interview_endpoints_require_auth(client):
    assert client.get("/api/interview/generate-question").status_code == 401
    r = client.post("/api/interview/evaluate", json={"question": "q", "user_answer": "a"})
    assert r.status_code == 401


def test_security_headers_present(client):
    r = client.get("/health")
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert r.headers.get("X-Frame-Options") == "DENY"
    assert "default-src 'self'" in r.headers.get("Content-Security-Policy", "")
    # Voice answers need the mic, so it must stay allowed.
    assert "microphone=(self)" in r.headers.get("Permissions-Policy", "")


def test_sessions_scoped_to_current_user(client, register_and_login):
    assert client.get("/api/sessions/").status_code == 401
    headers, _ = register_and_login(username="erin")
    r = client.get("/api/sessions/", headers=headers)
    assert r.status_code == 200
    assert r.json() == []
