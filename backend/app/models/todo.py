"""Todo SQLModel — the database table for user tasks."""

from __future__ import annotations

from datetime import date, datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Todo(SQLModel, table=True):
    __tablename__ = "todos"  # type: ignore[assignment]

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    description: str = Field(max_length=500, nullable=False)
    is_completed: bool = Field(default=False, nullable=False)
    category_id: int | None = Field(
        default=None,
        foreign_key="categories.id",
        nullable=True,
        index=True,
    )
    deadline: date | None = Field(default=None, nullable=True, index=True)
    priority: int | None = Field(default=None, nullable=True, ge=1, le=5)
    created_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_type=sa.DateTime(timezone=True),
    )
