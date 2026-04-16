"""Tests for /api/todos/* (Story 3.1, expanded Story 5.1)."""

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


def _create_todo(client: TestClient, description: str = "Buy milk") -> dict:
    """Create a todo and return the response body."""
    resp = client.post("/api/todos", json={"description": description})
    assert resp.status_code == 201, f"Create todo failed: {resp.text}"
    return resp.json()


def _create_category(client: TestClient, name: str = "Work") -> dict:
    """Create a category and return the response body."""
    resp = client.post("/api/categories", json={"name": name})
    assert resp.status_code == 201, f"Create category failed: {resp.text}"
    return resp.json()


def _assert_error_envelope(response: object, expected_code: str) -> None:
    """Assert the response body matches the architecture contract exactly.

    Contract: `{ "detail": "<message>", "code": "<MACHINE_CODE>" }` -- no other keys.
    """
    body = response.json()  # type: ignore[attr-defined]
    assert set(body.keys()) == {"detail", "code"}, (
        f"Error envelope must have exactly 'detail' and 'code', got {set(body.keys())}"
    )
    assert body["code"] == expected_code
    assert isinstance(body["detail"], str) and body["detail"]


# ---------------------------------------------------------------------------
# CRUD happy-path tests (Task 7.2)
# ---------------------------------------------------------------------------


def test_create_todo(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.post("/api/todos", json={"description": "Buy milk"})
    assert resp.status_code == 201

    body = resp.json()
    assert body["description"] == "Buy milk"
    assert body["is_completed"] is False
    assert isinstance(body["id"], int)
    assert isinstance(body["user_id"], int)
    # Verify created_at is a valid ISO 8601 datetime string
    datetime.fromisoformat(body["created_at"])


def test_list_todos_empty(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.get("/api/todos")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_todos(client: TestClient) -> None:
    _register_and_login(client)
    _create_todo(client, "First")
    _create_todo(client, "Second")
    _create_todo(client, "Third")

    resp = client.get("/api/todos")
    assert resp.status_code == 200
    todos = resp.json()
    assert len(todos) == 3
    # Most recent first (created_at descending)
    assert todos[0]["description"] == "Third"
    assert todos[1]["description"] == "Second"
    assert todos[2]["description"] == "First"


def test_update_todo_complete(client: TestClient) -> None:
    _register_and_login(client)
    todo = _create_todo(client)
    assert todo["is_completed"] is False

    resp = client.patch(f"/api/todos/{todo['id']}", json={"is_completed": True})
    assert resp.status_code == 200
    assert resp.json()["is_completed"] is True


def test_update_todo_uncomplete(client: TestClient) -> None:
    _register_and_login(client)
    todo = _create_todo(client)

    # First complete it
    client.patch(f"/api/todos/{todo['id']}", json={"is_completed": True})

    # Then uncomplete it
    resp = client.patch(f"/api/todos/{todo['id']}", json={"is_completed": False})
    assert resp.status_code == 200
    assert resp.json()["is_completed"] is False


def test_delete_todo(client: TestClient) -> None:
    _register_and_login(client)
    todo = _create_todo(client)

    resp = client.delete(f"/api/todos/{todo['id']}")
    assert resp.status_code == 204

    # Verify it's gone
    list_resp = client.get("/api/todos")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 0


# ---------------------------------------------------------------------------
# Validation tests (Task 7.3)
# ---------------------------------------------------------------------------


def test_create_todo_empty_description(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.post("/api/todos", json={"description": ""})
    assert resp.status_code == 422
    _assert_error_envelope(resp, "VALIDATION_ERROR")


def test_create_todo_missing_description(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.post("/api/todos", json={})
    assert resp.status_code == 422
    _assert_error_envelope(resp, "VALIDATION_ERROR")




def test_create_todo_max_length_description(client: TestClient) -> None:
    """A 500-character description should succeed."""
    _register_and_login(client)
    desc = "a" * 500
    resp = client.post("/api/todos", json={"description": desc})
    assert resp.status_code == 201
    assert resp.json()["description"] == desc


def test_create_todo_over_max_length_description(client: TestClient) -> None:
    """A 501-character description should fail with 422."""
    _register_and_login(client)
    desc = "a" * 501
    resp = client.post("/api/todos", json={"description": desc})
    assert resp.status_code == 422
    _assert_error_envelope(resp, "VALIDATION_ERROR")


def test_update_todo_empty_payload(client: TestClient) -> None:
    """PATCH with empty body should fail with 422 (Task 4.1 spec requirement)."""
    _register_and_login(client)
    todo = _create_todo(client)
    resp = client.patch(f"/api/todos/{todo['id']}", json={})
    assert resp.status_code == 422
    _assert_error_envelope(resp, "VALIDATION_ERROR")


# ---------------------------------------------------------------------------
# Per-user isolation tests (Task 7.4)
# ---------------------------------------------------------------------------


def test_list_todos_isolation(client: TestClient) -> None:
    """User A creates a todo; User B sees an empty list."""
    # Register User A and create a todo
    _register_and_login(client, email="alice@example.com")
    _create_todo(client, "Alice's todo")

    # Capture User A's cookie
    user_a_token = client.cookies[settings.auth_cookie_name]

    # Register User B (overwrites cookie jar)
    client.cookies.clear()
    _register_and_login(client, email="bob@example.com")

    # User B should see no todos
    resp = client.get("/api/todos")
    assert resp.status_code == 200
    assert resp.json() == []

    # Switch back to User A — should see their todo
    client.cookies.set(settings.auth_cookie_name, user_a_token)
    resp = client.get("/api/todos")
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["description"] == "Alice's todo"


def test_update_todo_not_owned(client: TestClient) -> None:
    """User B cannot update User A's todo."""
    # User A creates a todo
    _register_and_login(client, email="alice@example.com")
    todo = _create_todo(client, "Alice's todo")

    # Switch to User B
    client.cookies.clear()
    _register_and_login(client, email="bob@example.com")

    resp = client.patch(f"/api/todos/{todo['id']}", json={"is_completed": True})
    assert resp.status_code == 404
    _assert_error_envelope(resp, "TODO_NOT_FOUND")


def test_delete_todo_not_owned(client: TestClient) -> None:
    """User B cannot delete User A's todo."""
    # User A creates a todo
    _register_and_login(client, email="alice@example.com")
    todo = _create_todo(client, "Alice's todo")

    # Switch to User B
    client.cookies.clear()
    _register_and_login(client, email="bob@example.com")

    resp = client.delete(f"/api/todos/{todo['id']}")
    assert resp.status_code == 404
    _assert_error_envelope(resp, "TODO_NOT_FOUND")


# ---------------------------------------------------------------------------
# 404 tests (Task 7.5)
# ---------------------------------------------------------------------------


def test_update_todo_nonexistent(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.patch("/api/todos/99999", json={"is_completed": True})
    assert resp.status_code == 404
    _assert_error_envelope(resp, "TODO_NOT_FOUND")


def test_delete_todo_nonexistent(client: TestClient) -> None:
    _register_and_login(client)
    resp = client.delete("/api/todos/99999")
    assert resp.status_code == 404
    _assert_error_envelope(resp, "TODO_NOT_FOUND")


# ---------------------------------------------------------------------------
# Auth guard tests (Task 7.6)
# ---------------------------------------------------------------------------


def test_list_todos_unauthenticated(client: TestClient) -> None:
    resp = client.get("/api/todos")
    assert resp.status_code == 401
    _assert_error_envelope(resp, "UNAUTHORIZED")


def test_create_todo_unauthenticated(client: TestClient) -> None:
    resp = client.post("/api/todos", json={"description": "Buy milk"})
    assert resp.status_code == 401
    _assert_error_envelope(resp, "UNAUTHORIZED")


def test_update_todo_unauthenticated(client: TestClient) -> None:
    resp = client.patch("/api/todos/1", json={"is_completed": True})
    assert resp.status_code == 401
    _assert_error_envelope(resp, "UNAUTHORIZED")


def test_delete_todo_unauthenticated(client: TestClient) -> None:
    resp = client.delete("/api/todos/1")
    assert resp.status_code == 401
    _assert_error_envelope(resp, "UNAUTHORIZED")


# ---------------------------------------------------------------------------
# Response format verification (Task 7.7)
# ---------------------------------------------------------------------------


def test_todo_response_shape(client: TestClient) -> None:
    """Verify response keys are exactly the expected set with correct types."""
    _register_and_login(client)
    todo = _create_todo(client)

    # Verify exact key set (expanded with category_id, deadline, priority in Story 5.1)
    assert set(todo.keys()) == {
        "id", "user_id", "description", "is_completed",
        "category_id", "deadline", "priority", "created_at",
    }

    # Verify types
    assert isinstance(todo["id"], int)
    assert isinstance(todo["user_id"], int)
    assert isinstance(todo["description"], str)
    assert isinstance(todo["is_completed"], bool)
    assert todo["category_id"] is None  # None when not set
    assert todo["deadline"] is None  # None when not set
    assert todo["priority"] is None  # None when not set
    assert isinstance(todo["created_at"], str)

    # Verify created_at is valid ISO 8601
    parsed = datetime.fromisoformat(todo["created_at"])
    assert parsed is not None

    # Verify snake_case keys (no camelCase)
    for key in todo.keys():
        assert key == key.lower(), f"Key {key} is not snake_case"
        assert "-" not in key, f"Key {key} uses hyphens instead of underscores"


# ---------------------------------------------------------------------------
# Expanded field tests (Story 5.1 — Tasks 5.6-5.10)
# ---------------------------------------------------------------------------


def test_create_todo_with_category(client: TestClient) -> None:
    """Create a todo with category_id."""
    _register_and_login(client)
    category = _create_category(client, "Work")

    resp = client.post("/api/todos", json={
        "description": "Finish report",
        "category_id": category["id"],
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body["category_id"] == category["id"]
    assert body["description"] == "Finish report"


def test_create_todo_with_deadline(client: TestClient) -> None:
    """Create a todo with a deadline."""
    _register_and_login(client)

    resp = client.post("/api/todos", json={
        "description": "Buy milk",
        "deadline": "2026-04-20",
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body["deadline"] == "2026-04-20"


def test_create_todo_with_priority(client: TestClient) -> None:
    """Create a todo with a priority."""
    _register_and_login(client)

    resp = client.post("/api/todos", json={
        "description": "Buy milk",
        "priority": 3,
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body["priority"] == 3


def test_create_todo_with_all_fields(client: TestClient) -> None:
    """Create a todo with category_id, deadline, and priority."""
    _register_and_login(client)
    category = _create_category(client, "Work")

    resp = client.post("/api/todos", json={
        "description": "Important task",
        "category_id": category["id"],
        "deadline": "2026-04-25",
        "priority": 1,
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body["category_id"] == category["id"]
    assert body["deadline"] == "2026-04-25"
    assert body["priority"] == 1


def test_update_todo_category(client: TestClient) -> None:
    """Update a todo's category_id."""
    _register_and_login(client)
    cat1 = _create_category(client, "Work")
    cat2 = _create_category(client, "Personal")
    todo = _create_todo(client, "Task")

    # Assign category
    resp = client.patch(f"/api/todos/{todo['id']}", json={"category_id": cat1["id"]})
    assert resp.status_code == 200
    assert resp.json()["category_id"] == cat1["id"]

    # Change category
    resp = client.patch(f"/api/todos/{todo['id']}", json={"category_id": cat2["id"]})
    assert resp.status_code == 200
    assert resp.json()["category_id"] == cat2["id"]


def test_update_todo_remove_category(client: TestClient) -> None:
    """Setting category_id to null should uncategorize the todo."""
    _register_and_login(client)
    category = _create_category(client, "Work")

    resp = client.post("/api/todos", json={
        "description": "Task",
        "category_id": category["id"],
    })
    assert resp.status_code == 201
    todo = resp.json()
    assert todo["category_id"] == category["id"]

    # Remove category
    resp = client.patch(f"/api/todos/{todo['id']}", json={"category_id": None})
    assert resp.status_code == 200
    assert resp.json()["category_id"] is None


def test_update_todo_deadline(client: TestClient) -> None:
    """Update a todo's deadline."""
    _register_and_login(client)
    todo = _create_todo(client)

    resp = client.patch(f"/api/todos/{todo['id']}", json={"deadline": "2026-05-01"})
    assert resp.status_code == 200
    assert resp.json()["deadline"] == "2026-05-01"


def test_update_todo_priority(client: TestClient) -> None:
    """Update a todo's priority."""
    _register_and_login(client)
    todo = _create_todo(client)

    resp = client.patch(f"/api/todos/{todo['id']}", json={"priority": 5})
    assert resp.status_code == 200
    assert resp.json()["priority"] == 5


def test_update_todo_remove_deadline_and_priority(client: TestClient) -> None:
    """Setting deadline and priority to null should clear them."""
    _register_and_login(client)
    resp = client.post("/api/todos", json={
        "description": "Task",
        "deadline": "2026-04-20",
        "priority": 3,
    })
    assert resp.status_code == 201
    todo = resp.json()

    resp = client.patch(f"/api/todos/{todo['id']}", json={
        "deadline": None,
        "priority": None,
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["deadline"] is None
    assert body["priority"] is None


def test_create_todo_with_invalid_category(client: TestClient) -> None:
    """Creating a todo with a nonexistent category_id should fail with 404."""
    _register_and_login(client)

    resp = client.post("/api/todos", json={
        "description": "Task",
        "category_id": 99999,
    })
    assert resp.status_code == 404
    _assert_error_envelope(resp, "CATEGORY_NOT_FOUND")


def test_create_todo_with_other_users_category(client: TestClient) -> None:
    """Creating a todo with another user's category should fail with 404."""
    _register_and_login(client, email="alice@example.com")
    category = _create_category(client, "Alice's category")

    client.cookies.clear()
    _register_and_login(client, email="bob@example.com")

    resp = client.post("/api/todos", json={
        "description": "Task",
        "category_id": category["id"],
    })
    assert resp.status_code == 404
    _assert_error_envelope(resp, "CATEGORY_NOT_FOUND")


def test_update_todo_with_other_users_category(client: TestClient) -> None:
    """Updating a todo with another user's category should fail with 404."""
    _register_and_login(client, email="alice@example.com")
    category = _create_category(client, "Alice's category")

    client.cookies.clear()
    _register_and_login(client, email="bob@example.com")
    todo = _create_todo(client, "Bob's task")

    resp = client.patch(f"/api/todos/{todo['id']}", json={
        "category_id": category["id"],
    })
    assert resp.status_code == 404
    _assert_error_envelope(resp, "CATEGORY_NOT_FOUND")


def test_create_todo_priority_below_range(client: TestClient) -> None:
    """Priority below 1 should fail with 422."""
    _register_and_login(client)

    resp = client.post("/api/todos", json={
        "description": "Task",
        "priority": 0,
    })
    assert resp.status_code == 422
    _assert_error_envelope(resp, "VALIDATION_ERROR")


def test_create_todo_priority_above_range(client: TestClient) -> None:
    """Priority above 5 should fail with 422."""
    _register_and_login(client)

    resp = client.post("/api/todos", json={
        "description": "Task",
        "priority": 6,
    })
    assert resp.status_code == 422
    _assert_error_envelope(resp, "VALIDATION_ERROR")


def test_update_todo_priority_below_range(client: TestClient) -> None:
    """Updating priority below 1 should fail with 422."""
    _register_and_login(client)
    todo = _create_todo(client)

    resp = client.patch(f"/api/todos/{todo['id']}", json={"priority": 0})
    assert resp.status_code == 422
    _assert_error_envelope(resp, "VALIDATION_ERROR")


def test_update_todo_priority_above_range(client: TestClient) -> None:
    """Updating priority above 5 should fail with 422."""
    _register_and_login(client)
    todo = _create_todo(client)

    resp = client.patch(f"/api/todos/{todo['id']}", json={"priority": 6})
    assert resp.status_code == 422
    _assert_error_envelope(resp, "VALIDATION_ERROR")


def test_create_todo_priority_boundary_values(client: TestClient) -> None:
    """Priority values 1 and 5 should succeed (boundary test)."""
    _register_and_login(client)

    resp = client.post("/api/todos", json={"description": "Low", "priority": 1})
    assert resp.status_code == 201
    assert resp.json()["priority"] == 1

    resp = client.post("/api/todos", json={"description": "High", "priority": 5})
    assert resp.status_code == 201
    assert resp.json()["priority"] == 5
