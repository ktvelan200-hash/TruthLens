"""
Tests for authentication endpoints.
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
"""
import pytest


class TestRegister:
    def test_register_success(self, client):
        payload = {
            "name": "Alice Smith",
            "email": "alice@example.com",
            "password": "Secure123",
        }
        r = client.post("/api/auth/register", json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert body["user"]["email"] == payload["email"]
        assert body["user"]["name"] == payload["name"]
        # Password must NOT be in the response
        assert "password" not in str(body)

    def test_register_duplicate_email(self, client):
        payload = {"name": "Bob", "email": "alice@example.com", "password": "Secure123"}
        r = client.post("/api/auth/register", json=payload)
        assert r.status_code == 409
        assert "already exists" in r.json()["detail"].lower()

    def test_register_short_password(self, client):
        payload = {"name": "Carol", "email": "carol@example.com", "password": "abc"}
        r = client.post("/api/auth/register", json=payload)
        assert r.status_code == 422   # pydantic validation error

    def test_register_invalid_email(self, client):
        payload = {"name": "Dave", "email": "not-an-email", "password": "Secure123"}
        r = client.post("/api/auth/register", json=payload)
        assert r.status_code == 422

    def test_register_short_name(self, client):
        payload = {"name": "X", "email": "x@example.com", "password": "Secure123"}
        r = client.post("/api/auth/register", json=payload)
        assert r.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        r = client.post("/api/auth/login", json={
            "email": "alice@example.com",
            "password": "Secure123",
        })
        assert r.status_code == 200, r.text
        assert "access_token" in r.json()

    def test_login_wrong_password(self, client):
        r = client.post("/api/auth/login", json={
            "email": "alice@example.com",
            "password": "wrongpassword",
        })
        assert r.status_code == 401

    def test_login_unknown_email(self, client):
        r = client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "Secure123",
        })
        assert r.status_code == 401

    def test_login_missing_fields(self, client):
        r = client.post("/api/auth/login", json={"email": "alice@example.com"})
        assert r.status_code == 422


class TestMe:
    def test_me_authenticated(self, client, auth_headers):
        r = client.get("/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert "email" in body
        assert "id" in body
        assert "password" not in str(body)

    def test_me_unauthenticated(self, client):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_me_invalid_token(self, client):
        r = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401
