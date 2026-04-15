"""User SQLModel — the database table for authenticated accounts."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(
        sa_column_kwargs={"unique": True}, index=True, max_length=320
    )
    hashed_password: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
