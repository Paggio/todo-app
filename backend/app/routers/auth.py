"""Authentication router — register, login, me, logout.

Stories: 2.1 (register), 2.2 (login + me), 2.3 (logout).
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlmodel import Session, select

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.errors import api_error
from app.models.user import User


router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


def _normalize_email(v: object) -> object:
    if isinstance(v, str):
        return v.strip().lower()
    return v


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def _lowercase_email(cls, v: object) -> object:
        return _normalize_email(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str  # deliberately no min_length — don't leak password rules

    @field_validator("email", mode="before")
    @classmethod
    def _lowercase_email(cls, v: object) -> object:
        return _normalize_email(v)


class UserRead(BaseModel):
    id: int
    email: str
    created_at: datetime


class LogoutResponse(BaseModel):
    status: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _issue_auth_cookie(response: Response, user_id: int) -> None:
    """Sign a JWT for `user_id` and attach it as an httpOnly cookie."""
    token = create_access_token(subject=str(user_id))
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        max_age=settings.access_token_expire_days * 86400,
        path="/",
    )


# Fixed dummy bcrypt hash for the unknown-email branch of login.
# Computed once at import time so login timing stays constant regardless of
# whether the email exists. `$2b$12$` prefix matches our real hash cost.
_DUMMY_PASSWORD_HASH = hash_password("timing-safety-pad")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    """Create a new account and issue an auth cookie."""
    email = payload.email
    existing = db.exec(select(User).where(User.email == email)).first()
    if existing is not None:
        raise api_error(
            status.HTTP_409_CONFLICT,
            "Email already registered",
            "EMAIL_ALREADY_EXISTS",
        )

    user = User(email=email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    assert user.id is not None
    _issue_auth_cookie(response, user.id)
    return user


@router.post(
    "/login",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    """Validate credentials and issue an auth cookie."""
    user = db.exec(select(User).where(User.email == payload.email)).first()

    # Run verify_password even when the user is missing, against a fixed
    # dummy hash — eliminates the timing side-channel that would otherwise
    # disclose whether an email is registered.
    if user is None:
        verify_password(payload.password, _DUMMY_PASSWORD_HASH)
        raise api_error(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid email or password",
            "INVALID_CREDENTIALS",
        )

    if not verify_password(payload.password, user.hashed_password):
        raise api_error(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid email or password",
            "INVALID_CREDENTIALS",
        )

    assert user.id is not None
    _issue_auth_cookie(response, user.id)
    return user


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)) -> User:
    """Return the currently authenticated user — the session hydration endpoint."""
    return user


@router.post("/logout", response_model=LogoutResponse)
def logout(
    response: Response,
    user: User = Depends(get_current_user),  # noqa: ARG001
) -> dict[str, str]:
    """Clear the httpOnly auth cookie — client-side session termination.

    JWT is stateless; there is no server-side revocation. The cookie is
    overwritten with Max-Age=0 so the browser drops it immediately.
    """
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
        samesite=settings.auth_cookie_samesite,
        secure=settings.auth_cookie_secure,
        httponly=True,
    )
    return {"status": "ok"}
