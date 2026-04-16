"""Category SQLModel — the database table for user-defined categories."""

from __future__ import annotations

from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Category(SQLModel, table=True):
    __tablename__ = "categories"  # type: ignore[assignment]
    __table_args__ = (
        sa.UniqueConstraint("user_id", "name", name="uq_categories_user_id_name"),
    )

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    name: str = Field(max_length=100, nullable=False)
    created_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_type=sa.DateTime(timezone=True),
    )
