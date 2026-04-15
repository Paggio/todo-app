"""Shared test fixtures.

Tests run against an in-memory SQLite database so they are hermetic and
do not require the Postgres service to be up. The `get_db` dependency is
overridden to yield sessions bound to this test engine.
"""

from __future__ import annotations

from collections.abc import Generator, Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

# Importing `app` triggers `Settings()` instantiation which reads env vars.
# For the test process, pytest-dotenv or explicit env setup is outside scope;
# the existing `.env` file (loaded by pydantic-settings on import) satisfies
# the required non-empty strings. Tests are fully hermetic at the DB layer —
# the engine below replaces the Postgres one via dependency_overrides.
from app.core.deps import get_db
from app.main import app
from app.models.user import User  # noqa: F401  -- ensures metadata is populated
from app.models.todo import Todo  # noqa: F401  -- ensures metadata is populated (Story 3.1)


@pytest.fixture(name="engine")
def engine_fixture() -> Iterator[object]:
    """Fresh in-memory SQLite engine per test — no cross-test state."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture(name="session")
def session_fixture(engine: object) -> Iterator[Session]:
    with Session(engine) as session:  # type: ignore[arg-type]
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    """TestClient with `get_db` overridden to use the per-test session."""

    def _override_get_db() -> Iterator[Session]:
        yield session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
