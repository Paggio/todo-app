"""Smoke test — proves the test harness and app factory can boot."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_root_returns_ok(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
