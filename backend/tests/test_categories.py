"""Tests for /api/categories/* (Story 5.1)."""

from __future__ import annotations

from datetime import datetime

from fastapi.testclient import TestClient

from app.core.config import settings


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _register_and_login(
    client: TestClient,
    email: str = "alice@example.com",
    password: str = "hunter22!",
) -> TestClient:
    """Register a user and return the client with auth cookie set."""
    resp = client.post(
        "/api/auth/register", json={"email": email, "password": password}
    )
    assert resp.status_code == 201, f"Registration failed: {resp.text}"
    return client


def _create_category(client: TestClient, name: str = "Work") -> dict:
    """Create a category and return the response body."""
    resp = client.post("/api/categories", json={"name": name})
    assert resp.status_code == 201, f"Create category failed: {resp.text}"
    return resp.json()


def _create_todo(
    client: TestClient,
    description: str = "Buy milk",
    category_id: int | None = None,
) -> dict:
    """Create a todo and return the response body."""
    payload: dict = {"description": description}
    if category_id is not None:
        payload["category_id"] = category_id
    resp = client.post("/api/todos", json=payload)
    assert resp.status_code == 201, f"Create todo failed: {resp.text}"
    return resp.json()


def _assert_error_envelope(response: object, expected_code: str) -> None:
    """Assert the response body matches the architecture contract exactly."""
    body = response.json()  # type: ignore[attr-defined]
    assert set(body.keys()) == {"detail", "code"}, (
        f"Error envelope must have exactly 'detail' and 'code', got {set(body.keys())}"
    )
    assert body["code"] == expected_code
    assert isinstance(body["detail"], str) and body["detail"]


# ---------------------------------------------------------------------------
# CRUD happy-path tests (Task 5.1)
# ---------------------------------------------------------------------------


def test_create_category(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.post("/api/categories", json={"name": "Work"})
    assert resp.status_code == 201

    body = resp.json()
    assert body["name"] == "Work"
    assert isinstance(body["id"], int)
    assert isinstance(body["user_id"], int)
    datetime.fromisoformat(body["created_at"])


def test_list_categories_empty(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.get("/api/categories")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_categories_ordered_by_name(client: TestClient) -> None:
    _register_and_login(client)
    _create_category(client, "Zebra")
    _create_category(client, "Apple")
    _create_category(client, "Middle")

    resp = client.get("/api/categories")
    assert resp.status_code == 200
    categories = resp.json()
    assert len(categories) == 3
    assert categories[0]["name"] == "Apple"
    assert categories[1]["name"] == "Middle"
    assert categories[2]["name"] == "Zebra"


def test_rename_category(client: TestClient) -> None:
    _register_and_login(client)
    category = _create_category(client, "Old Name")

    resp = client.patch(
        f"/api/categories/{category['id']}", json={"name": "New Name"}
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


def test_delete_category_no_todos(client: TestClient) -> None:
    _register_and_login(client)
    category = _create_category(client, "Work")

    resp = client.delete(f"/api/categories/{category['id']}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["affected_todos"] == 0

    # Verify it's gone
    list_resp = client.get("/api/categories")
    assert list_resp.json() == []


# ---------------------------------------------------------------------------
# Category isolation tests (Task 5.2)
# ---------------------------------------------------------------------------


def test_list_categories_isolation(client: TestClient) -> None:
    """User A creates a category; User B sees an empty list."""
    _register_and_login(client, email="alice@example.com")
    _create_category(client, "Alice's Work")

    user_a_token = client.cookies[settings.auth_cookie_name]

    client.cookies.clear()
    _register_and_login(client, email="bob@example.com")

    resp = client.get("/api/categories")
    assert resp.status_code == 200
    assert resp.json() == []

    # Switch back to User A
    client.cookies.set(settings.auth_cookie_name, user_a_token)
    resp = client.get("/api/categories")
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["name"] == "Alice's Work"


def test_rename_category_not_owned(client: TestClient) -> None:
    """User B cannot rename User A's category."""
    _register_and_login(client, email="alice@example.com")
    category = _create_category(client, "Alice's Work")

    client.cookies.clear()
    _register_and_login(client, email="bob@example.com")

    resp = client.patch(
        f"/api/categories/{category['id']}", json={"name": "Hacked"}
    )
    assert resp.status_code == 404
    _assert_error_envelope(resp, "CATEGORY_NOT_FOUND")


def test_delete_category_not_owned(client: TestClient) -> None:
    """User B cannot delete User A's category."""
    _register_and_login(client, email="alice@example.com")
    category = _create_category(client, "Alice's Work")

    client.cookies.clear()
    _register_and_login(client, email="bob@example.com")

    resp = client.delete(f"/api/categories/{category['id']}")
    assert resp.status_code == 404
    _assert_error_envelope(resp, "CATEGORY_NOT_FOUND")


# ---------------------------------------------------------------------------
# Duplicate name rejection tests (Task 5.3)
# ---------------------------------------------------------------------------


def test_create_category_duplicate_name(client: TestClient) -> None:
    _register_and_login(client)
    _create_category(client, "Work")

    resp = client.post("/api/categories", json={"name": "Work"})
    assert resp.status_code == 409
    _assert_error_envelope(resp, "DUPLICATE_CATEGORY_NAME")


def test_rename_category_duplicate_name(client: TestClient) -> None:
    _register_and_login(client)
    _create_category(client, "Work")
    personal = _create_category(client, "Personal")

    resp = client.patch(
        f"/api/categories/{personal['id']}", json={"name": "Work"}
    )
    assert resp.status_code == 409
    _assert_error_envelope(resp, "DUPLICATE_CATEGORY_NAME")


def test_create_category_empty_name(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.post("/api/categories", json={"name": ""})
    assert resp.status_code == 422
    _assert_error_envelope(resp, "VALIDATION_ERROR")


def test_rename_category_empty_name(client: TestClient) -> None:
    _register_and_login(client)
    category = _create_category(client, "Work")

    resp = client.patch(
        f"/api/categories/{category['id']}", json={"name": ""}
    )
    assert resp.status_code == 422
    _assert_error_envelope(resp, "VALIDATION_ERROR")


def test_same_name_different_users(client: TestClient) -> None:
    """Two users can have categories with the same name."""
    _register_and_login(client, email="alice@example.com")
    _create_category(client, "Work")

    client.cookies.clear()
    _register_and_login(client, email="bob@example.com")

    resp = client.post("/api/categories", json={"name": "Work"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Work"


# ---------------------------------------------------------------------------
# Cascade delete tests (Task 5.4)
# ---------------------------------------------------------------------------


def test_delete_category_with_todos(client: TestClient) -> None:
    """Deleting a category should uncategorize its assigned todos."""
    _register_and_login(client)
    category = _create_category(client, "Work")

    # Create 5 todos assigned to this category
    for i in range(5):
        _create_todo(client, f"Task {i}", category_id=category["id"])

    resp = client.delete(f"/api/categories/{category['id']}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["affected_todos"] == 5

    # Verify todos still exist but are uncategorized
    todos_resp = client.get("/api/todos")
    assert todos_resp.status_code == 200
    todos = todos_resp.json()
    assert len(todos) == 5
    for todo in todos:
        assert todo["category_id"] is None


def test_delete_category_only_affects_own_todos(client: TestClient) -> None:
    """Only todos belonging to the same user are counted as affected."""
    _register_and_login(client, email="alice@example.com")
    category = _create_category(client, "Work")
    _create_todo(client, "Alice task", category_id=category["id"])

    # Verify affected_todos count is 1
    resp = client.delete(f"/api/categories/{category['id']}")
    assert resp.status_code == 200
    assert resp.json()["affected_todos"] == 1


# ---------------------------------------------------------------------------
# Category nonexistent tests
# ---------------------------------------------------------------------------


def test_rename_category_nonexistent(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.patch("/api/categories/99999", json={"name": "Nope"})
    assert resp.status_code == 404
    _assert_error_envelope(resp, "CATEGORY_NOT_FOUND")


def test_delete_category_nonexistent(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.delete("/api/categories/99999")
    assert resp.status_code == 404
    _assert_error_envelope(resp, "CATEGORY_NOT_FOUND")


# ---------------------------------------------------------------------------
# Auth guard tests
# ---------------------------------------------------------------------------


def test_list_categories_unauthenticated(client: TestClient) -> None:
    resp = client.get("/api/categories")
    assert resp.status_code == 401
    _assert_error_envelope(resp, "UNAUTHORIZED")


def test_create_category_unauthenticated(client: TestClient) -> None:
    resp = client.post("/api/categories", json={"name": "Work"})
    assert resp.status_code == 401
    _assert_error_envelope(resp, "UNAUTHORIZED")


def test_rename_category_unauthenticated(client: TestClient) -> None:
    resp = client.patch("/api/categories/1", json={"name": "New"})
    assert resp.status_code == 401
    _assert_error_envelope(resp, "UNAUTHORIZED")


def test_delete_category_unauthenticated(client: TestClient) -> None:
    resp = client.delete("/api/categories/1")
    assert resp.status_code == 401
    _assert_error_envelope(resp, "UNAUTHORIZED")


# ---------------------------------------------------------------------------
# Response shape test
# ---------------------------------------------------------------------------


def test_category_response_shape(client: TestClient) -> None:
    """Verify response keys are exactly the expected set with correct types."""
    _register_and_login(client)
    category = _create_category(client)

    assert set(category.keys()) == {"id", "user_id", "name", "created_at"}
    assert isinstance(category["id"], int)
    assert isinstance(category["user_id"], int)
    assert isinstance(category["name"], str)
    assert isinstance(category["created_at"], str)
    datetime.fromisoformat(category["created_at"])

    # Verify snake_case keys
    for key in category.keys():
        assert key == key.lower(), f"Key {key} is not snake_case"
        assert "-" not in key, f"Key {key} uses hyphens instead of underscores"
