"""Tests for admin auth - allowlist and JWT secret must fail closed."""

import datetime
from unittest.mock import patch

import jwt
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app

SECRET = "a" * 64
ADMIN = "me@example.com"


@pytest.fixture(autouse=True)
def auth_env(monkeypatch):
    """Configured server: strong secret, one allowed admin, Firebase key present."""
    monkeypatch.setenv("JWT_SECRET", SECRET)
    monkeypatch.setenv("ALLOWED_ADMIN_EMAILS", ADMIN)
    monkeypatch.setenv("FIREBASE_API_KEY", "test-key")
    get_settings.cache_clear()
    yield monkeypatch
    get_settings.cache_clear()


@pytest.fixture
def client():
    return TestClient(app)


def make_token(sub=ADMIN, secret=SECRET, exp=True):
    payload = {"sub": sub}
    if exp:
        payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    return jwt.encode(payload, secret, algorithm="HS256")


def delete_post(client, token):
    """Hit a real protected route; DB calls are mocked out."""
    with patch("app.api.routes.posts.get_post_by_slug", return_value={"slug": "x"}), \
         patch("app.api.routes.posts.delete_post"):
        return client.delete("/posts/x", headers={"Authorization": f"Bearer {token}"})


def test_allowed_admin_token_is_accepted(client):
    assert delete_post(client, make_token()).status_code == 204


def test_allowlist_check_is_case_insensitive(client):
    assert delete_post(client, make_token(sub="Me@Example.com")).status_code == 204


@pytest.mark.parametrize("raw", [
    "me@example.com",
    " Me@Example.com , other@example.com ",
    '["me@example.com", "other@example.com"]',
])
def test_allowlist_formats(client, auth_env, raw):
    auth_env.setenv("ALLOWED_ADMIN_EMAILS", raw)
    assert delete_post(client, make_token()).status_code == 204


def test_token_for_email_not_in_allowlist_is_rejected(client):
    assert delete_post(client, make_token(sub="stranger@example.com")).status_code == 401


def test_empty_allowlist_rejects_everyone(client, auth_env):
    auth_env.setenv("ALLOWED_ADMIN_EMAILS", "")
    assert delete_post(client, make_token()).status_code == 401


def test_removing_email_from_allowlist_revokes_existing_token(client, auth_env):
    token = make_token()
    auth_env.setenv("ALLOWED_ADMIN_EMAILS", "someone-else@example.com")
    assert delete_post(client, token).status_code == 401


def test_token_forged_with_old_default_secret_is_rejected(client):
    forged = make_token(secret="change-me-in-production")
    assert delete_post(client, forged).status_code == 401


def test_token_without_exp_is_rejected(client):
    assert delete_post(client, make_token(exp=False)).status_code == 401


@pytest.mark.parametrize("bad_secret", ["", "change-me-in-production", "secret", "short-secret"])
def test_unusable_jwt_secret_refuses_auth(client, auth_env, bad_secret):
    auth_env.setenv("JWT_SECRET", bad_secret)
    get_settings.cache_clear()
    token = make_token(secret=bad_secret or "x")
    assert delete_post(client, token).status_code == 503


class _FakeResponse:
    def __init__(self, status_code, data):
        self.status_code = status_code
        self._data = data
        self.headers = {"content-type": "application/json"}

    def json(self):
        return self._data


def fake_firebase(status_code, data, calls):
    """Stand-in for httpx.AsyncClient that records sign-in attempts."""
    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def post(self, url, json=None, timeout=None):
            calls.append(json)
            return _FakeResponse(status_code, data)

    return FakeClient


def login(client, firebase_status=200, firebase_data=None, calls=None):
    calls = [] if calls is None else calls
    data = firebase_data if firebase_data is not None else {"email": ADMIN}
    with patch("app.api.routes.admin.httpx.AsyncClient", fake_firebase(firebase_status, data, calls)):
        return client.post("/admin/login", json={"email": ADMIN, "password": "pw"})


def test_login_fails_closed_without_allowlist(client, auth_env):
    auth_env.setenv("ALLOWED_ADMIN_EMAILS", "")
    calls = []
    res = login(client, calls=calls)
    assert res.status_code == 503
    assert calls == []  # never even asks Firebase


def test_login_fails_closed_without_jwt_secret(client, auth_env):
    auth_env.delenv("JWT_SECRET")
    get_settings.cache_clear()
    calls = []
    res = login(client, calls=calls)
    assert res.status_code == 503
    assert calls == []


def test_login_rejects_valid_firebase_user_not_in_allowlist(client):
    res = login(client, firebase_data={"email": "stranger@example.com"})
    assert res.status_code == 403


def test_login_maps_firebase_bad_credentials_to_401(client):
    res = login(client, firebase_status=400, firebase_data={"error": {"message": "INVALID_LOGIN_CREDENTIALS"}})
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid email or password"


def test_login_issues_token_that_protected_routes_accept(client):
    res = login(client)
    assert res.status_code == 200
    token = res.json()["access_token"]
    assert jwt.decode(token, SECRET, algorithms=["HS256"])["sub"] == ADMIN
    assert delete_post(client, token).status_code == 204
