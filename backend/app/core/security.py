"""Authentication primitives: password hashing and JWT encode/decode.

All auth logic lives here — routers import from this module and never
instantiate CryptContext or call `jwt.encode` directly.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import settings


# bcrypt cost factor 12 — NFR5 requires >= 10; we stay a little safer.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time comparison of plaintext to bcrypt hash."""
    return _pwd_context.verify(plain, hashed)


def create_access_token(
    *, subject: str, expires_in: timedelta | None = None
) -> str:
    """Encode a signed JWT with `sub`, `iat`, `exp` claims."""
    now = datetime.now(timezone.utc)
    expire_delta = expires_in or timedelta(days=settings.access_token_expire_days)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + expire_delta).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


class InvalidTokenError(Exception):
    """Raised when a JWT is malformed, expired, or signature-invalid."""


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises InvalidTokenError on any failure."""
    try:
        return jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc
