"""Todo CRUD router — list, create, update, delete todos.

Story: 3.1 (Todo CRUD API Endpoints), expanded in Story 5.1.
"""

from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.deps import get_current_user, get_db
from app.errors import api_error
from app.models.category import Category
from app.models.todo import Todo
from app.models.user import User


router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class TodoCreate(BaseModel):
    description: str = Field(min_length=1, max_length=500)
    category_id: int | None = None
    deadline: date | None = None
    priority: int | None = Field(default=None, ge=1, le=5)


class TodoUpdate(BaseModel):
    is_completed: bool | None = None
    description: str | None = Field(default=None, min_length=1, max_length=500)
    category_id: int | None = None
    deadline: date | None = None
    priority: int | None = Field(default=None, ge=1, le=5)


class TodoRead(BaseModel):
    id: int
    user_id: int
    description: str
    is_completed: bool
    category_id: int | None
    deadline: date | None
    priority: int | None
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


def _validate_category_ownership(category_id: int, user: User, db: Session) -> None:
    """Verify the category exists and belongs to the given user, or raise 404."""
    stmt = select(Category).where(
        Category.id == category_id, Category.user_id == user.id
    )
    category = db.exec(stmt).first()
    if category is None:
        raise api_error(
            status.HTTP_404_NOT_FOUND,
            "Category not found",
            "CATEGORY_NOT_FOUND",
        )


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
    # Validate category ownership when category_id is provided
    if payload.category_id is not None:
        _validate_category_ownership(payload.category_id, user, db)

    todo = Todo(
        user_id=user.id,  # type: ignore[arg-type]
        description=payload.description,
        category_id=payload.category_id,
        deadline=payload.deadline,
        priority=payload.priority,
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

    update_data = payload.model_dump(exclude_unset=True)

    if not update_data:
        raise api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "At least one field must be provided",
            "VALIDATION_ERROR",
        )

    # Validate category ownership when category_id is explicitly provided
    if "category_id" in update_data and update_data["category_id"] is not None:
        _validate_category_ownership(update_data["category_id"], user, db)

    for field, value in update_data.items():
        setattr(todo, field, value)

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
