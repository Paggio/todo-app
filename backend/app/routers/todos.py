"""Todo CRUD router — list, create, update, delete todos.

Story: 3.1 (Todo CRUD API Endpoints).
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.deps import get_current_user, get_db
from app.errors import api_error
from app.models.todo import Todo
from app.models.user import User


router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class TodoCreate(BaseModel):
    description: str = Field(min_length=1, max_length=500)


class TodoUpdate(BaseModel):
    is_completed: bool | None = None
    description: str | None = Field(default=None, min_length=1, max_length=500)


class TodoRead(BaseModel):
    id: int
    user_id: int
    description: str
    is_completed: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_user_todo(todo_id: int, user: User, db: Session) -> Todo:
    """Fetch a todo owned by the given user, or raise 404."""
    stmt = select(Todo).where(Todo.id == todo_id, Todo.user_id == user.id)
    todo = db.exec(stmt).first()
    if todo is None:
        raise api_error(
            status.HTTP_404_NOT_FOUND,
            "Todo not found",
            "TODO_NOT_FOUND",
        )
    return todo


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[TodoRead])
def list_todos(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Todo]:
    """Return all todos belonging to the authenticated user, most recent first."""
    stmt = (
        select(Todo)
        .where(Todo.user_id == user.id)
        .order_by(Todo.created_at.desc())  # type: ignore[union-attr]
    )
    return list(db.exec(stmt).all())


@router.post("/", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def create_todo(
    payload: TodoCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Todo:
    """Create a new todo scoped to the authenticated user."""
    todo = Todo(
        user_id=user.id,  # type: ignore[arg-type]
        description=payload.description,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.patch("/{todo_id}", response_model=TodoRead)
def update_todo(
    todo_id: int,
    payload: TodoUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Todo:
    """Partially update a todo owned by the authenticated user."""
    todo = _get_user_todo(todo_id, user, db)

    if payload.is_completed is None and payload.description is None:
        raise api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "At least one field must be provided",
            "VALIDATION_ERROR",
        )

    if payload.is_completed is not None:
        todo.is_completed = payload.is_completed
    if payload.description is not None:
        todo.description = payload.description

    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a todo owned by the authenticated user."""
    todo = _get_user_todo(todo_id, user, db)
    db.delete(todo)
    db.commit()
