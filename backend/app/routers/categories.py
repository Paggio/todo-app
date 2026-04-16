"""Category CRUD router — list, create, rename, delete categories.

Story: 5.1 (Category & Todo Metadata Backend).
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select, func

from app.core.deps import get_current_user, get_db
from app.errors import api_error
from app.models.category import Category
from app.models.todo import Todo
from app.models.user import User


router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CategoryRead(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime


class CategoryDeleteResponse(BaseModel):
    affected_todos: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_user_category(category_id: int, user: User, db: Session) -> Category:
    """Fetch a category owned by the given user, or raise 404."""
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
    return category


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[CategoryRead])
def list_categories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Category]:
    """Return all categories belonging to the authenticated user, ordered by name."""
    stmt = (
        select(Category)
        .where(Category.user_id == user.id)
        .order_by(Category.name)  # type: ignore[arg-type]
    )
    return list(db.exec(stmt).all())


@router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Category:
    """Create a new category scoped to the authenticated user."""
    category = Category(
        user_id=user.id,  # type: ignore[arg-type]
        name=payload.name,
    )
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise api_error(
            status.HTTP_409_CONFLICT,
            "A category with this name already exists",
            "DUPLICATE_CATEGORY_NAME",
        )
    db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Category:
    """Rename a category owned by the authenticated user."""
    category = _get_user_category(category_id, user, db)
    category.name = payload.name
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise api_error(
            status.HTTP_409_CONFLICT,
            "A category with this name already exists",
            "DUPLICATE_CATEGORY_NAME",
        )
    db.refresh(category)
    return category


@router.delete("/{category_id}", response_model=CategoryDeleteResponse)
def delete_category(
    category_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    """Delete a category and uncategorize all affected todos.

    Explicitly sets category_id = NULL on affected todos before deleting
    the category, ensuring consistent behavior across SQLite and PostgreSQL.
    Returns the count of affected todos.
    """
    category = _get_user_category(category_id, user, db)

    # Count and uncategorize affected todos
    count_stmt = (
        select(func.count())
        .select_from(Todo)
        .where(Todo.category_id == category.id, Todo.user_id == user.id)
    )
    affected_count = db.exec(count_stmt).one()

    # Explicitly uncategorize todos (required for SQLite compatibility)
    update_stmt = (
        select(Todo)
        .where(Todo.category_id == category.id, Todo.user_id == user.id)
    )
    affected_todos = db.exec(update_stmt).all()
    for todo in affected_todos:
        todo.category_id = None
        db.add(todo)

    db.delete(category)
    db.commit()
    return {"affected_todos": affected_count}
