# Story 5.1: Category & Todo Metadata Backend

Status: done

## Story

As a developer,
I want category CRUD API endpoints and an expanded todo model with category, deadline, and priority fields,
so that the frontend can build organizational features on a complete backend.

## Acceptance Criteria

1. **Given** the Category SQLModel (id, user_id FK, name, created_at) with unique constraint on (user_id, name) and its Alembic migration **When** the migration runs **Then** the `categories` table is created with index `idx_categories_user_id` on user_id, and the `todos` table is expanded with: `category_id` (FK to categories, nullable, ON DELETE SET NULL), `deadline` (date, nullable), `priority` (integer 1-5, nullable), plus indexes `idx_todos_category_id` and `idx_todos_deadline`

2. **Given** an authenticated user sends GET /api/categories **When** the server processes the request **Then** it returns an array of all categories belonging to that user, ordered by name (FR36)

3. **Given** an authenticated user sends POST /api/categories with `{ "name": "Work" }` **When** the server processes the request **Then** it creates the category scoped to the user and returns the created object (FR31)

4. **Given** an authenticated user sends POST /api/categories with an empty name or a name that already exists for that user **When** the server processes the request **Then** it returns 409 with `{ "detail": "...", "code": "DUPLICATE_CATEGORY_NAME" }` or 422 with `VALIDATION_ERROR` (FR37)

5. **Given** an authenticated user owns a category **When** they send PATCH /api/categories/{id} with `{ "name": "Personal" }` **Then** the server renames the category and returns the updated object; rejects empty or duplicate names (FR32, FR37)

6. **Given** an authenticated user owns a category with 5 assigned todos **When** they send DELETE /api/categories/{id} **Then** the server deletes the category, sets `category_id = NULL` on all 5 affected todos, and returns `{ "affected_todos": 5 }` (FR33)

7. **Given** an authenticated user sends POST /api/todos with `{ "description": "Buy milk", "category_id": 1, "deadline": "2026-04-20", "priority": 2 }` **When** the server processes the request **Then** it creates the todo with all optional fields populated and returns the full object including category_id, deadline, and priority (FR10 expanded)

8. **Given** an authenticated user sends PATCH /api/todos/{id} with `{ "category_id": 2 }` or `{ "category_id": null }` **When** the server processes the request **Then** it updates the category assignment (or removes it) and returns the updated todo (FR34, FR35)

9. **Given** an authenticated user attempts to access or modify another user's categories **When** the server processes the request **Then** it returns 404 with `CATEGORY_NOT_FOUND` -- no data leakage (FR36)

## Tasks / Subtasks

- [x] Task 1: Create Category SQLModel and Alembic migration (AC: #1)
  - [x] 1.1 Create `backend/app/models/category.py` with Category SQLModel
  - [x] 1.2 Register Category import in `backend/app/models/__init__.py`
  - [x] 1.3 Expand Todo model with `category_id`, `deadline`, `priority` fields
  - [x] 1.4 Generate Alembic migration for categories table + todos expansion
  - [x] 1.5 Verify migration creates all required indexes

- [x] Task 2: Create Category CRUD router (AC: #2, #3, #4, #5, #6, #9)
  - [x] 2.1 Create `backend/app/routers/categories.py` with GET, POST, PATCH, DELETE endpoints
  - [x] 2.2 Register categories router in `backend/app/main.py`
  - [x] 2.3 Implement per-user category isolation via `get_current_user` dependency
  - [x] 2.4 Implement duplicate name detection (409 DUPLICATE_CATEGORY_NAME)
  - [x] 2.5 Implement cascade delete (set `category_id = NULL` on affected todos, return count)

- [x] Task 3: Expand Todo API schemas and endpoints (AC: #7, #8)
  - [x] 3.1 Update `TodoCreate` schema to accept optional `category_id`, `deadline`, `priority`
  - [x] 3.2 Update `TodoRead` schema to include `category_id`, `deadline`, `priority`
  - [x] 3.3 Update `TodoUpdate` schema to accept optional `category_id`, `deadline`, `priority`
  - [x] 3.4 Update create_todo endpoint to handle new optional fields
  - [x] 3.5 Update update_todo endpoint to handle new optional fields (including null assignment)
  - [x] 3.6 Validate category_id references a category owned by the same user
  - [x] 3.7 Validate priority is integer 1-5 when provided

- [x] Task 4: Update frontend types (AC: #7, #8)
  - [x] 4.1 Update `Todo` type to include `categoryId`, `deadline`, `priority`
  - [x] 4.2 Update `CreateTodoRequest` to include optional `categoryId`, `deadline`, `priority`
  - [x] 4.3 Update `UpdateTodoRequest` to include optional `categoryId`, `deadline`, `priority`
  - [x] 4.4 Add `Category`, `CreateCategoryRequest`, `RenameCategoryRequest` types
  - [x] 4.5 Update optimistic todo creation in `use-todos.ts` to include new fields with defaults

- [x] Task 5: Write comprehensive backend tests (AC: all)
  - [x] 5.1 Create `backend/tests/test_categories.py` with category CRUD tests
  - [x] 5.2 Add category isolation tests (User A vs User B)
  - [x] 5.3 Add duplicate name rejection tests
  - [x] 5.4 Add cascade delete tests (verify affected_todos count, verify todos uncategorized)
  - [x] 5.5 Update `backend/tests/test_todos.py` with expanded field tests
  - [x] 5.6 Test todo creation with category_id, deadline, priority
  - [x] 5.7 Test todo update for category/deadline/priority changes
  - [x] 5.8 Test category_id validation (must belong to same user)
  - [x] 5.9 Test priority validation (1-5 range)
  - [x] 5.10 Update response shape test to include new fields

- [x] Task 6: Update conftest.py (AC: all)
  - [x] 6.1 Import Category model in conftest.py to populate SQLModel metadata
  - [x] 6.2 Verify all tests pass with in-memory SQLite

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** There is NO `tailwind.config.ts`. All theme customization goes through CSS custom properties in `src/index.css`.
- **No JS animation libraries.** All animation is CSS transitions + keyframes + JS class toggling.
- **File naming: kebab-case for frontend, snake_case for backend.** Component naming: PascalCase.
- **No hardcoded values.** All config from environment variables via Pydantic BaseSettings.
- **No `any` type in TypeScript.**
- **API boundary:** API always returns snake_case JSON. Frontend `api.ts` transforms to camelCase automatically.
- **Error contract:** All errors return `{ "detail": "message", "code": "CODE" }`. Use `api_error()` from `app.errors`.
- **Per-user isolation:** Every query MUST filter by `user_id` from `get_current_user` dependency.
- **SQLModel patterns:** Use `Field()` with explicit `nullable`, `index`, `foreign_key` kwargs. Use `sa_column_kwargs` for composite constraints.
- **Tests use in-memory SQLite** via conftest.py. No Docker/Postgres needed for test runs.

### Existing Code Patterns to Follow Exactly

**Model pattern** (from `backend/app/models/todo.py`):
```python
from __future__ import annotations
from datetime import datetime, timezone
import sqlalchemy as sa
from sqlmodel import Field, SQLModel

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

class Todo(SQLModel, table=True):
    __tablename__ = "todos"  # type: ignore[assignment]
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    # ... fields ...
    created_at: datetime = Field(
        default_factory=_utcnow, nullable=False,
        sa_type=sa.DateTime(timezone=True),
    )
```

**Router pattern** (from `backend/app/routers/todos.py`):
```python
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from app.core.deps import get_current_user, get_db
from app.errors import api_error
from app.models.user import User

router = APIRouter()

class SomeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)

class SomeRead(BaseModel):
    id: int
    # ... fields ...
```

**Naming convention** (from `backend/app/models/__init__.py`):
```python
SQLModel.metadata.naming_convention = {
    "ix": "idx_%(table_name)s_%(column_0_name)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    ...
}
```
This means indexes and constraints get auto-named by Alembic. The composite unique constraint on (user_id, name) needs `sa.UniqueConstraint` in `__table_args__`.

**Test pattern** (from `backend/tests/test_todos.py`):
```python
def _register_and_login(client, email="alice@example.com", password="hunter22!"):
    resp = client.post("/api/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 201
    return client

def _assert_error_envelope(response, expected_code):
    body = response.json()
    assert set(body.keys()) == {"detail", "code"}
    assert body["code"] == expected_code
```

**Main app router registration** (from `backend/app/main.py`):
```python
app.include_router(todos_router.router, prefix="/api/todos", tags=["todos"])
# Add: app.include_router(categories_router.router, prefix="/api/categories", tags=["categories"])
```

### Category Model Specification

File: `backend/app/models/category.py`

```python
class Category(SQLModel, table=True):
    __tablename__ = "categories"  # type: ignore[assignment]
    __table_args__ = (
        sa.UniqueConstraint("user_id", "name", name="uq_categories_user_id_name"),
    )
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    name: str = Field(max_length=100, nullable=False)
    created_at: datetime = Field(
        default_factory=_utcnow, nullable=False,
        sa_type=sa.DateTime(timezone=True),
    )
```

The composite unique constraint `uq_categories_user_id_name` prevents duplicate category names per user at the database level. The router must also catch `IntegrityError` to return 409 DUPLICATE_CATEGORY_NAME.

### Todo Model Expansion

Add to the existing `backend/app/models/todo.py` (do NOT replace -- add fields):

```python
category_id: int | None = Field(
    default=None, foreign_key="categories.id",
    nullable=True, index=True,
    sa_column_kwargs={"server_default": None},
)
deadline: date | None = Field(default=None, nullable=True, index=True)
priority: int | None = Field(default=None, nullable=True, ge=1, le=5)
```

Import `date` from `datetime`. The `foreign_key="categories.id"` with ON DELETE SET NULL is handled by SQLAlchemy relationship configuration or by the SA column definition. With SQLModel, use `sa_column_kwargs` if needed:
```python
sa_column_kwargs={"ondelete": "SET NULL"}
```

**IMPORTANT:** SQLite (used in tests) does not enforce foreign key constraints by default. The ON DELETE SET NULL cascade is handled by PostgreSQL in production. For the DELETE /api/categories/{id} endpoint, the router should explicitly UPDATE todos SET category_id = NULL WHERE category_id = {id} AND user_id = {user_id} before deleting the category, to ensure consistent behavior across SQLite and PostgreSQL.

### Category Router Specification

File: `backend/app/routers/categories.py`

Endpoints:
- `GET /` -- list categories for authenticated user, ordered by name
- `POST /` -- create category; validate non-empty name; catch IntegrityError for duplicate name per user
- `PATCH /{category_id}` -- rename category; validate non-empty name; catch IntegrityError for duplicate
- `DELETE /{category_id}` -- delete category; first UPDATE todos to uncategorize, count affected rows, delete category, return `{ "affected_todos": N }`

Error codes:
- `CATEGORY_NOT_FOUND` (404) -- when category_id doesn't exist or belongs to another user
- `DUPLICATE_CATEGORY_NAME` (409) -- when name already exists for this user
- `VALIDATION_ERROR` (422) -- empty name or invalid input

Helper function `_get_user_category(category_id, user, db)` follows the same pattern as `_get_user_todo()` in todos.py.

The DELETE endpoint returns a JSON body `{ "affected_todos": N }` with status 200 (not 204, since there IS a response body).

### Todo API Schema Expansion

In `backend/app/routers/todos.py`, update schemas:

```python
class TodoCreate(BaseModel):
    description: str = Field(min_length=1, max_length=500)
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

class TodoUpdate(BaseModel):
    is_completed: bool | None = None
    description: str | None = Field(default=None, min_length=1, max_length=500)
    category_id: int | None = None
    deadline: date | None = None
    priority: int | None = Field(default=None, ge=1, le=5)
```

**IMPORTANT -- null assignment for PATCH:** The `TodoUpdate` schema needs to distinguish between "field not provided" (leave unchanged) and "field explicitly set to null" (clear the value). The default `None` for `category_id`, `deadline`, and `priority` means "not provided". To allow explicit null assignment:

Use a sentinel pattern or Pydantic `model_fields_set`:
```python
# In the update_todo endpoint:
update_data = payload.model_dump(exclude_unset=True)
# Then iterate over update_data keys to apply only provided fields
```

This way:
- `PATCH {"category_id": 2}` -- sets category_id to 2
- `PATCH {"category_id": null}` -- sets category_id to None (uncategorize)
- `PATCH {"is_completed": true}` -- only changes completion, leaves category_id unchanged

**Category ownership validation in todo endpoints:** When `category_id` is provided in create/update, verify the category exists AND belongs to the same user. If not, return 404 CATEGORY_NOT_FOUND.

### Frontend Types Update

In `frontend/src/types/index.ts`, expand the types:

```typescript
export type Todo = {
  id: number
  userId: number
  description: string
  isCompleted: boolean
  categoryId: number | null
  deadline: string | null  // ISO 8601 date string "2026-04-20"
  priority: number | null  // 1-5, null = no priority
  createdAt: string
}

export type CreateTodoRequest = {
  description: string
  categoryId?: number | null
  deadline?: string | null
  priority?: number | null
}

export type UpdateTodoRequest = {
  isCompleted?: boolean
  description?: string
  categoryId?: number | null
  deadline?: string | null
  priority?: number | null
}

export type Category = {
  id: number
  userId: number
  name: string
  createdAt: string
}

export type CreateCategoryRequest = {
  name: string
}

export type RenameCategoryRequest = {
  name: string
}
```

### Optimistic Todo Hooks Update

In `frontend/src/hooks/use-todos.ts`, the `useCreateTodo` mutation builds an optimistic todo in `onMutate`. Update the optimistic todo object to include the new fields with defaults:

```typescript
const optimisticTodo: Todo = {
  id: -Date.now(),
  userId: 0,
  description: newTodo.description,
  isCompleted: false,
  categoryId: newTodo.categoryId ?? null,
  deadline: newTodo.deadline ?? null,
  priority: newTodo.priority ?? null,
  createdAt: new Date().toISOString(),
}
```

Also update the `useUpdateTodo` optimistic cache write to handle the new fields:
```typescript
queryClient.setQueryData<Todo[]>(["todos"], (old) =>
  (old ?? []).map((t) =>
    t.id === variables.id
      ? {
          ...t,
          ...(variables.isCompleted !== undefined && { isCompleted: variables.isCompleted }),
          ...(variables.categoryId !== undefined && { categoryId: variables.categoryId }),
          ...(variables.deadline !== undefined && { deadline: variables.deadline }),
          ...(variables.priority !== undefined && { priority: variables.priority }),
        }
      : t
  )
)
```

### Alembic Migration Notes

Generate the migration with:
```bash
docker compose exec backend alembic revision --autogenerate -m "add_categories_table_expand_todos"
```

The migration should create:
1. `categories` table with columns: id, user_id, name, created_at
2. Index `idx_categories_user_id` on categories.user_id
3. Unique constraint `uq_categories_user_id_name` on (user_id, name)
4. Add column `category_id` (nullable FK) to todos table
5. Add column `deadline` (date, nullable) to todos table
6. Add column `priority` (integer, nullable) to todos table
7. Index `idx_todos_category_id` on todos.category_id
8. Index `idx_todos_deadline` on todos.deadline

Review the autogenerated migration carefully. SQLite (used in tests) has limited ALTER TABLE support -- adding nullable columns with no default is fine, but adding foreign key constraints may need `batch_alter_table` mode if Alembic generates standard `op.add_column`.

### SQLite Compatibility Notes for Tests

1. SQLite does NOT enforce foreign key constraints by default. `PRAGMA foreign_keys = ON` would enable them but is not needed for these tests -- the router explicitly manages cascade behavior.
2. SQLite `date` type stores as TEXT. SQLModel/SQLAlchemy handles the conversion.
3. The composite unique constraint works in SQLite via the `CREATE TABLE` statement (handled by `create_all()`).
4. The `IntegrityError` for duplicate category names fires in both SQLite and PostgreSQL.

### Error Codes Reference

Existing codes: `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `TODO_NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`

New codes added by this story:
- `CATEGORY_NOT_FOUND` (404) -- category does not exist or belongs to another user
- `DUPLICATE_CATEGORY_NAME` (409) -- category name already exists for this user

### What NOT to Do

- Do NOT install any new Python packages -- all dependencies are already in requirements.txt
- Do NOT install any new npm packages
- Do NOT create separate API endpoints for view filtering (All/This Week/By Deadline) -- views are client-side
- Do NOT add a `categories.py` router to handle todo-category assignment -- the existing todos.py router handles `category_id` in create/update
- Do NOT store JWT in localStorage or React state
- Do NOT modify the auth flow or CORS configuration
- Do NOT create a `tailwind.config.ts` file
- Do NOT use `any` type in TypeScript
- Do NOT hardcode color values in component files
- Do NOT create response wrappers `{ data: ..., success: true }` -- return data directly
- Do NOT add `use-categories.ts` hook in this story -- that is Story 5.2
- Do NOT add any frontend components (CategoryManagementPanel, etc.) -- that is Stories 5.2 and 5.3
- Do NOT break the existing 47 backend tests -- all must continue to pass
- Do NOT change the existing test helper functions (_register_and_login, _create_todo) -- add new helpers alongside

### Files to Create

- `backend/app/models/category.py` -- Category SQLModel
- `backend/app/routers/categories.py` -- Category CRUD router (GET, POST, PATCH, DELETE)
- `backend/alembic/versions/XXXX_add_categories_table_expand_todos.py` -- Alembic migration
- `backend/tests/test_categories.py` -- Category API tests

### Files to Modify

- `backend/app/models/__init__.py` -- add Category import
- `backend/app/models/todo.py` -- add category_id, deadline, priority fields
- `backend/app/routers/todos.py` -- expand TodoCreate, TodoRead, TodoUpdate schemas; update create/update endpoints
- `backend/app/main.py` -- register categories router
- `backend/tests/conftest.py` -- import Category model
- `backend/tests/test_todos.py` -- update response shape test, add tests for new fields
- `frontend/src/types/index.ts` -- expand Todo type, add Category types
- `frontend/src/hooks/use-todos.ts` -- update optimistic todo creation/update with new fields

### Files to Verify (no changes expected)

- `backend/app/core/deps.py` -- get_current_user dependency (unchanged)
- `backend/app/core/security.py` -- JWT handling (unchanged)
- `backend/app/errors.py` -- error contract (unchanged, reused as-is)
- `frontend/src/lib/api.ts` -- fetch wrapper (unchanged, snake/camel transform handles new fields automatically)

### Cross-Story Dependencies

- **Epics 1-4 (done):** All foundation code is in place -- models, routers, auth, frontend types, hooks.
- **Story 5.2 (next):** Will consume the category API via a new `use-categories.ts` hook and build the CategoryManagementPanel. Depends on this story's category endpoints being complete.
- **Story 5.3 (after 5.2):** Will add category assignment UI (FAB dropdown, inline edit, category sections in All view). Depends on todo API accepting `category_id`.
- **Epic 6 (after Epic 5):** Will build priority indicators and deadline labels on the frontend. Depends on todo API returning `priority` and `deadline` fields (done in this story).
- **Epic 7 (after Epic 6):** Will build view switcher with client-side filtering. Depends on todo data having `deadline` and `priority` fields in the cached TanStack Query data.

### Previous Story Intelligence (Story 4-8)

Key learnings from the last story in Epic 4:
1. `pnpm typecheck`, `pnpm lint`, and `pnpm build` all pass with 0 errors. Maintain this standard.
2. Backend has 47 passing tests (`pytest`). All must continue to pass.
3. The `_utcnow()` helper is defined per-model file (user.py, todo.py). Follow this pattern for category.py.
4. The `api_error()` helper from `app.errors` is the standard way to raise domain errors.
5. The `_get_user_todo()` helper pattern in todos.py should be replicated as `_get_user_category()` in categories.py.
6. Test helpers `_register_and_login()` and `_assert_error_envelope()` are established patterns -- reuse them.
7. The `Makefile` at project root has convenience targets. No changes needed.

### Git Intelligence

Recent commits show a pattern of large, comprehensive commits per epic:
- `1aef05a` Epic 4, UI improvements and system stability (34 files changed)
- `5de34e4` feat: epic 3, todo backend and frontend implementation
- `4f7608b` init commit

The project uses descriptive commit messages with `feat:` prefix convention.

### Project Structure Notes

- Alignment with unified project structure: all new files go in established directories (`backend/app/models/`, `backend/app/routers/`, `backend/tests/`)
- No new directories needed
- The `backend/app/models/__init__.py` uses a star-import pattern for Alembic metadata population -- the new Category model must be imported there
- The `backend/alembic/env.py` already imports `from app.models import *` which will pick up the Category model once it is registered in `__init__.py`

### References

- [Source: epics.md#Story 5.1 -- acceptance criteria, FR31-37, FR10 expanded, FR34-35, FR36]
- [Source: architecture.md#Data Architecture -- three tables schema, indexes, ON DELETE SET NULL]
- [Source: architecture.md#API & Communication Patterns -- category endpoints, error codes, view filtering note]
- [Source: architecture.md#Implementation Patterns -- naming conventions, structure patterns, anti-patterns]
- [Source: architecture.md#Project Structure -- backend organization, file locations]
- [Source: prd.md#Category Management FR31-37 -- functional requirements]
- [Source: prd.md#Deadline & Priority FR38-42 -- deadline and priority field requirements]
- [Source: backend/app/models/todo.py -- existing model pattern]
- [Source: backend/app/routers/todos.py -- existing router pattern, schemas]
- [Source: backend/app/errors.py -- error contract, api_error() helper]
- [Source: backend/tests/test_todos.py -- test patterns, helpers]
- [Source: backend/tests/conftest.py -- test fixture pattern, SQLite engine]
- [Source: backend/app/models/__init__.py -- naming convention, model registration]
- [Source: frontend/src/types/index.ts -- TypeScript type patterns]
- [Source: frontend/src/hooks/use-todos.ts -- optimistic mutation pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Fixed `sa_column_kwargs={"ondelete": "SET NULL"}` TypeError -- SQLModel does not pass `ondelete` as a column kwarg; removed it since the Alembic migration already defines the FK with ON DELETE SET NULL and the router explicitly manages cascade behavior for SQLite compatibility.

### Completion Notes List

- Task 1: Created Category SQLModel with composite unique constraint (user_id, name), expanded Todo model with category_id (FK), deadline (date), priority (1-5), and created Alembic migration using batch_alter_table for SQLite compatibility.
- Task 2: Created full Category CRUD router (GET/POST/PATCH/DELETE) with per-user isolation, IntegrityError-based duplicate name detection (409), and explicit cascade delete that uncategorizes affected todos before deletion.
- Task 3: Expanded TodoCreate/TodoRead/TodoUpdate schemas with category_id, deadline, priority fields. Updated create_todo and update_todo endpoints with category ownership validation and model_dump(exclude_unset=True) for proper null assignment support.
- Task 4: Updated frontend types (Todo, CreateTodoRequest, UpdateTodoRequest) and added Category types. Updated optimistic todo creation/update in use-todos.ts to handle new fields.
- Task 5: Added 22 category tests and 18 expanded todo field tests. All 86 tests pass (25 auth + 1 health + 22 category + 38 todo).
- Task 6: Imported Category model in conftest.py, all tests pass with in-memory SQLite.

### Change Log

- 2026-04-16: Story 5.1 implementation complete -- Category CRUD API, Todo metadata expansion, comprehensive tests (86 total, 0 failures)

### File List

**New files:**
- `backend/app/models/category.py` -- Category SQLModel
- `backend/app/routers/categories.py` -- Category CRUD router (GET, POST, PATCH, DELETE)
- `backend/alembic/versions/b5c6d7e8f9a0_add_categories_table_expand_todos.py` -- Alembic migration
- `backend/tests/test_categories.py` -- 22 category API tests

**Modified files:**
- `backend/app/models/__init__.py` -- added Category import
- `backend/app/models/todo.py` -- added category_id, deadline, priority fields
- `backend/app/routers/todos.py` -- expanded schemas, added category ownership validation, updated endpoints
- `backend/app/main.py` -- registered categories router
- `backend/tests/conftest.py` -- imported Category model
- `backend/tests/test_todos.py` -- added 18 expanded field tests, updated response shape test
- `frontend/src/types/index.ts` -- expanded Todo type, added Category types
- `frontend/src/hooks/use-todos.ts` -- updated optimistic todo creation/update with new fields
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- story status updated to review
- `_bmad-output/implementation-artifacts/5-1-category-and-todo-metadata-backend.md` -- story file updated
