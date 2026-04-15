"""Tests for /api/auth/* (Stories 2.1, 2.2, 2.3)."""

from __future__ import annotations

import logging
from datetime import timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _register(
    client: TestClient, email: str = "alice@example.com", password: str = "hunter22!"
) -> object:
    return client.post(
        "/api/auth/register", json={"email": email, "password": password}
    )


def _login(
    client: TestClient, email: str, password: str
) -> object:
    return client.post(
        "/api/auth/login", json={"email": email, "password": password}
    )


def _assert_error_envelope(response: object, expected_code: str) -> None:
    """Assert the response body matches the architecture contract exactly.

    Contract: `{ "detail": "<message>", "code": "<MACHINE_CODE>" }` — no other keys.
    """
    body = response.json()  # type: ignore[attr-defined]
    assert set(body.keys()) == {"detail", "code"}, (
        f"Error envelope must have exactly 'detail' and 'code', got {set(body.keys())}"
    )
    assert body["code"] == expected_code
    assert isinstance(body["detail"], str) and body["detail"]


def _assert_user_read_shape(body: object, expected_email: str) -> None:
    assert isinstance(body, dict)
    assert set(body.keys()) == {"id", "email", "created_at"}
    assert body["email"] == expected_email
    assert isinstance(body["id"], int)
    assert "hashed_password" not in body
    assert "password" not in body


# ---------------------------------------------------------------------------
# Register (Story 2.1)
# ---------------------------------------------------------------------------


def test_register_success(client: TestClient, session: Session) -> None:
    response = _register(client)
    assert response.status_code == 201

    body = response.json()
    _assert_user_read_shape(body, "alice@example.com")

    set_cookie = response.headers.get("set-cookie", "")
    assert settings.auth_cookie_name in set_cookie
    assert "httponly" in set_cookie.lower()

    user = session.exec(select(User).where(User.email == "alice@example.com")).first()
    assert user is not None
    assert user.hashed_password != "hunter22!"
    assert user.hashed_password.startswith(("$2a$", "$2b$", "$2y$"))


def test_register_duplicate_email(client: TestClient) -> None:
    first = _register(client)
    assert first.status_code == 201

    second = _register(client)
    assert second.status_code == 409
    _assert_error_envelope(second, "EMAIL_ALREADY_EXISTS")


def test_register_duplicate_email_case_insensitive(client: TestClient) -> None:
    first = _register(client, email="Foo@Bar.com")
    assert first.status_code == 201

    second = _register(client, email="foo@BAR.com")
    assert second.status_code == 409
    _assert_error_envelope(second, "EMAIL_ALREADY_EXISTS")


def test_register_invalid_email(client: TestClient) -> None:
    response = _register(client, email="not-an-email")
    assert response.status_code == 422
    _assert_error_envelope(response, "VALIDATION_ERROR")


def test_register_short_password(client: TestClient) -> None:
    response = _register(client, password="short")
    assert response.status_code == 422
    _assert_error_envelope(response, "VALIDATION_ERROR")


def test_register_missing_password(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register", json={"email": "alice@example.com"}
    )
    assert response.status_code == 422
    _assert_error_envelope(response, "VALIDATION_ERROR")


def test_register_does_not_log_plaintext_password(
    client: TestClient, caplog: "logging.LogCaptureFixture"
) -> None:
    secret_password = "super-secret-unique-xyz-1234"
    with caplog.at_level(logging.DEBUG):
        response = _register(client, password=secret_password)
    assert response.status_code == 201

    for record in caplog.records:
        assert secret_password not in record.getMessage()


# ---------------------------------------------------------------------------
# Login (Story 2.2)
# ---------------------------------------------------------------------------


def test_login_success(client: TestClient) -> None:
    assert _register(client, email="bob@example.com", password="hunter22!").status_code == 201
    client.cookies.clear()

    response = _login(client, "bob@example.com", "hunter22!")
    assert response.status_code == 200
    _assert_user_read_shape(response.json(), "bob@example.com")

    set_cookie = response.headers.get("set-cookie", "")
    assert settings.auth_cookie_name in set_cookie
    assert "httponly" in set_cookie.lower()


def test_login_wrong_password(client: TestClient) -> None:
    assert _register(client, email="bob@example.com", password="hunter22!").status_code == 201

    response = _login(client, "bob@example.com", "wrong-password")
    assert response.status_code == 401
    _assert_error_envelope(response, "INVALID_CREDENTIALS")


def test_login_unknown_email(client: TestClient) -> None:
    response = _login(client, "nobody@example.com", "whatever123")
    assert response.status_code == 401
    _assert_error_envelope(response, "INVALID_CREDENTIALS")


def test_login_case_insensitive_email(client: TestClient) -> None:
    assert _register(client, email="Foo@Bar.com", password="hunter22!").status_code == 201
    client.cookies.clear()

    response = _login(client, "foo@bar.com", "hunter22!")
    assert response.status_code == 200


def test_login_missing_email(client: TestClient) -> None:
    response = client.post("/api/auth/login", json={"password": "whatever123"})
    assert response.status_code == 422
    _assert_error_envelope(response, "VALIDATION_ERROR")


def test_login_missing_password(client: TestClient) -> None:
    response = client.post("/api/auth/login", json={"email": "bob@example.com"})
    assert response.status_code == 422
    _assert_error_envelope(response, "VALIDATION_ERROR")


# ---------------------------------------------------------------------------
# /me (Story 2.2)
# ---------------------------------------------------------------------------


def test_me_authenticated(client: TestClient) -> None:
    reg = _register(client, email="carol@example.com", password="hunter22!")
    assert reg.status_code == 201
    # TestClient automatically persists cookies across subsequent requests.

    response = client.get("/api/auth/me")
    assert response.status_code == 200
    _assert_user_read_shape(response.json(), "carol@example.com")


def test_me_unauthenticated(client: TestClient) -> None:
    # No register, no cookies.
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    _assert_error_envelope(response, "UNAUTHORIZED")


def test_me_invalid_token(client: TestClient) -> None:
    client.cookies.set(settings.auth_cookie_name, "not-a-real-jwt")
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    _assert_error_envelope(response, "UNAUTHORIZED")


def test_me_expired_token(client: TestClient) -> None:
    reg = _register(client, email="dave@example.com", password="hunter22!")
    assert reg.status_code == 201
    user_id = reg.json()["id"]
    client.cookies.clear()

    # Craft a JWT that's already expired.
    expired_token = create_access_token(
        subject=str(user_id), expires_in=timedelta(seconds=-1)
    )
    client.cookies.set(settings.auth_cookie_name, expired_token)

    response = client.get("/api/auth/me")
    assert response.status_code == 401
    _assert_error_envelope(response, "UNAUTHORIZED")


def test_me_token_for_deleted_user(client: TestClient, session: Session) -> None:
    reg = _register(client, email="erin@example.com", password="hunter22!")
    assert reg.status_code == 201

    # Delete the user out from under the valid cookie.
    user = session.exec(select(User).where(User.email == "erin@example.com")).first()
    assert user is not None
    session.delete(user)
    session.commit()

    response = client.get("/api/auth/me")
    assert response.status_code == 401
    _assert_error_envelope(response, "UNAUTHORIZED")


# ---------------------------------------------------------------------------
# Logout (Story 2.3)
# ---------------------------------------------------------------------------


def test_logout_success(client: TestClient) -> None:
    _register(client, email="logoutuser@example.com", password="hunter22!")

    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    # FastAPI's delete_cookie sets Max-Age=0 and value to "null".
    set_cookie = response.headers.get("set-cookie", "")
    assert settings.auth_cookie_name in set_cookie
    assert "max-age=0" in set_cookie.lower() or 'access_token=""' in set_cookie


def test_logout_unauthenticated(client: TestClient) -> None:
    response = client.post("/api/auth/logout")
    assert response.status_code == 401
    _assert_error_envelope(response, "UNAUTHORIZED")


def test_logout_then_me(client: TestClient) -> None:
    # After `delete_cookie`, the TestClient's cookie jar receives the
    # `Max-Age=0` Set-Cookie and drops the cookie. The next `/me` sends no
    # cookie, hence 401. Note: logout does NOT invalidate the JWT server-side
    # (stateless JWT). If an attacker has already extracted the raw token, it
    # remains valid until expiry. Logout is a client-side cookie clear — an
    # intentional architectural choice.
    _register(client, email="logoutme@example.com", password="hunter22!")

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 200

    me = client.get("/api/auth/me")
    assert me.status_code == 401
    _assert_error_envelope(me, "UNAUTHORIZED")


def test_login_does_not_log_plaintext_password(
    client: TestClient, caplog: "logging.LogCaptureFixture"
) -> None:
    _register(client, email="logpasscheck@example.com", password="hunter22!")
    client.cookies.clear()

    secret_login_pw = "hunter22!-unique-login-check-xyz"
    # Re-register with the unique password so login can succeed
    _register(client, email="logpasscheck2@example.com", password=secret_login_pw)
    client.cookies.clear()

    with caplog.at_level(logging.DEBUG):
        response = _login(client, "logpasscheck2@example.com", secret_login_pw)
    assert response.status_code == 200

    for record in caplog.records:
        assert secret_login_pw not in record.getMessage()


# ---------------------------------------------------------------------------
# Per-user isolation (Story 2.3)
# ---------------------------------------------------------------------------


# `get_current_user` returns the full `User` ORM object (not just user_id).
# All future per-user queries (Epic 3 todos) will filter by `user.id`. This
# test verifies the protected-endpoint pattern correctly scopes to the cookie
# owner.
def test_me_isolates_to_cookie_owner(client: TestClient) -> None:
    # Register User A
    resp_a = _register(client, email="alice@example.com", password="hunter22!")
    assert resp_a.status_code == 201
    # Capture User A's cookie from the Set-Cookie header
    user_a_token = resp_a.cookies[settings.auth_cookie_name]

    # Register User B (overwrites cookie jar)
    client.cookies.clear()
    resp_b = _register(client, email="bob@example.com", password="hunter22!")
    assert resp_b.status_code == 201

    # Switch back to User A's cookie
    client.cookies.set(settings.auth_cookie_name, user_a_token)

    # /me should return Alice, not Bob
    me_resp = client.get("/api/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "alice@example.com"


# ---------------------------------------------------------------------------
# CORS enforcement (Story 2.3)
# ---------------------------------------------------------------------------


def test_cors_rejects_unknown_origin(client: TestClient) -> None:
    response = client.options(
        "/api/auth/register",
        headers={
            "Origin": "http://evil.example.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers.get("access-control-allow-origin") != "http://evil.example.com"


def test_cors_allows_configured_origin(client: TestClient) -> None:
    response = client.options(
        "/api/auth/register",
        headers={
            "Origin": settings.cors_origin,
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers.get("access-control-allow-origin") == settings.cors_origin
