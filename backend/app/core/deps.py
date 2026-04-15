"""FastAPI dependency injection: database sessions and authenticated user."""

from __future__ import annotations

from collections.abc import Generator
from functools import lru_cache

from fastapi import Depends, Request, status
from sqlalchemy.engine import Engine
from sqlmodel import Session, create_engine

from app.core.config import settings
from app.core.security import InvalidTokenError, decode_access_token
from app.errors import api_error
from app.models.user import User


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    """Lazy, cached SQLModel engine bound to settings.database_url."""
    return create_engine(settings.database_url, echo=False, pool_pre_ping=True)


def get_db() -> Generator[Session, None, None]:
    """Yield a SQLModel session for the lifetime of a request."""
    engine = get_engine()
    with Session(engine) as session:
        yield session


def _unauthorized() -> Exception:
    return api_error(
        status.HTTP_401_UNAUTHORIZED, "Not authenticated", "UNAUTHORIZED"
    )


def get_current_user(
    request: Request, db: Session = Depends(get_db)
) -> User:
    """Extract + validate the JWT cookie; return the matching User row.

    Raises 401 UNAUTHORIZED on missing cookie, bad signature, expired token,
    malformed subject, or nonexistent user.
    """
    token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        raise _unauthorized()
    try:
        payload = decode_access_token(token)
    except InvalidTokenError as exc:
        raise _unauthorized() from exc

    sub = payload.get("sub")
    if not isinstance(sub, str):
        raise _unauthorized()
    try:
        user_id = int(sub)
    except ValueError as exc:
        raise _unauthorized() from exc

    user = db.get(User, user_id)
    if user is None:
        raise _unauthorized()
    return user
