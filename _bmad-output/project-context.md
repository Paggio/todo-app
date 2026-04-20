---
project_name: 'bmad_nf_todo_app'
user_name: 'Mattiapagetti'
date: '2026-04-20'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 120
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Frontend (`frontend/`)
- **React 19.2** + **TypeScript ~5.9.3** (strict mode via `tsconfig.json`)
- **Vite 7** (dev server + build) — `@vitejs/plugin-react`
- **Tailwind CSS 4** via `@tailwindcss/vite` (NOT postcss plugin) — v4 uses CSS-first config; tokens live in `src/index.css`, not `tailwind.config.js`
- **shadcn/ui v4** — components scaffolded via `shadcn` CLI into `components/ui/`; built on **`@base-ui/react` 1.4** (NOT Radix directly — shadcn v4 migrated to Base UI)
- **TanStack Query v5.59** — all server state
- **React Router v7.1** — note the unscoped `react-router` package (v7 merged the dom variant)
- **react-hook-form 7.54** + **Zod 3.24** + `@hookform/resolvers` — form validation stack
- **Sonner 2** — toast notifications (NOT shadcn's deprecated `toast`)
- **Lucide React** — icon set
- **Vitest 4** + **@testing-library/react 16** + **jsdom 29** — tests
- **ESLint 9 flat config** + Prettier 3 + `prettier-plugin-tailwindcss`
- **Package manager: pnpm 10** — `pnpm-lock.yaml` is the lockfile; npm/yarn are NOT supported

### Backend (`backend/`)
- **Python 3.12**, **FastAPI ~0.135** (`[standard]` extras), **Uvicorn** (`[standard]`)
- **SQLModel ~0.0.38** — dual-purpose DB + Pydantic schemas
- **Alembic 1.18** — autogenerate migrations from SQLModel metadata
- **PostgreSQL 16** via **psycopg2-binary 2.9**
- **PyJWT 2.10** — HS256 signed tokens
- **passlib 1.7.4** with **`bcrypt` pinned to 4.x** — critical: bcrypt 5.x removed `__about__` and added strict length checks that break passlib 1.7.4 (upstream-known incompatibility until passlib 1.8+). Do NOT unpin.
- **pydantic-settings 2.8** — env var loading via `BaseSettings`

### Infrastructure
- **Docker Compose v2** — three services: `frontend`, `backend`, `db`
- Named volume `postgres_data` — PostgreSQL persistence across `make down`/`up`
- `frontend` `depends_on: backend` (healthcheck); `backend` waits on `db` healthcheck
- Backend `entrypoint.sh` runs `alembic upgrade head` before `uvicorn` start

### Critical Version Constraints
- **bcrypt MUST stay < 5.0** (see above)
- **Tailwind v4 API differs from v3** — do NOT reference `tailwind.config.js` conventions; tokens are CSS custom properties in `src/index.css`
- **shadcn v4 uses Base UI, not Radix** — when installing new components, use `pnpm dlx shadcn@latest add <component>`; do NOT add `@radix-ui/*` packages manually
- **React Router v7 package is `react-router`** (not `react-router-dom`) — imports are `from "react-router"`

## Critical Implementation Rules

### TypeScript / Frontend Language Rules

- **Path alias `@/*` → `./src/*`** — always import as `@/lib/api`, `@/types`, `@/hooks/use-todos`. Do NOT use relative paths that escape the current directory (`../../lib/api`).
- **`verbatimModuleSyntax: true`** — type-only imports MUST use `import type { X }`. Mixing runtime + type imports in a single statement is a compile error.
- **`erasableSyntaxOnly: true`** — `enum`, `namespace`, parameter property shorthand, and `import =` are forbidden. Use string literal unions or `as const` objects instead of enums.
- **`noUnusedLocals` + `noUnusedParameters`** — remove dead vars or prefix with `_` (e.g., `_req`, `_ch`). Don't silence with `// eslint-disable`.
- **No `any`** — use `unknown` + type guards (see `isPlainObject` in `lib/api.ts`). `as unknown as T` casts are a code smell.
- **Double-quoted strings** — the codebase uses `"` in `.ts`/`.tsx` (see `api.ts`). Prettier handles this; do not hand-format to single quotes.
- **JSX runtime is `react-jsx`** — do NOT write `import React from "react"` at the top of every component; import only what you use (`useState`, `useEffect`, etc.).

### Python / Backend Language Rules

- **`from __future__ import annotations`** at the top of every module (see `deps.py`, `errors.py`) — enables postponed evaluation so forward references and `X | None` unions work cleanly.
- **Full type hints, including return types** — every function has a return annotation (`-> User`, `-> None`, `-> dict[str, str]`). Missing return types is a review blocker.
- **Domain errors raise `api_error()`, not `HTTPException`** — `app.errors.api_error(status, message, code)` is the only approved way to raise API errors. It attaches the machine-readable `code` field the frontend contract requires. Using FastAPI's bare `HTTPException` will silently drop the `code` and break `{detail, code}` shape.
- **Validation errors are auto-coerced** — FastAPI's 422 `RequestValidationError` is rewritten by `install_exception_handlers()` to the flat `{detail, code: "VALIDATION_ERROR"}` shape. Don't try to override this per-router.
- **Use `db.get(Model, id)` for primary-key lookups** — consistent with `deps.py`; avoid raw `session.query()` / `select(...).where(id == ...)` boilerplate for simple PK fetches.
- **Module docstrings at the top of every file** — one short sentence describing purpose (see `errors.py`, `deps.py`). This is the codebase convention.

### API Boundary Rule (cross-language)

- **`api.ts` owns ALL snake↔camel conversion.** Outgoing bodies are transformed via `toSnake()` before send; incoming responses via `toCamel()` before return. Components and hooks see camelCase exclusively.
- **Never call `fetch` directly from a component, hook, or util** — always go through `apiFetch<T>()`. It handles: `credentials: "include"`, key-case transforms, `Content-Type`, the typed `ApiClientError`, and the global 401 → `auth:unauthorized` CustomEvent.
- **401 handling is event-based, not redirect-based** — `apiFetch` dispatches `window` event `auth:unauthorized` on any 401. A single listener (in `AuthProvider` or equivalent) clears auth state and triggers navigation. Do NOT add per-call redirect logic.

### React + TanStack Query Rules

- **Single shared `queryClient`** — imported from `@/lib/query-client`. Defaults: `retry: 1`, `refetchOnWindowFocus: false`, `staleTime: 30s`. Do NOT create ad-hoc clients or override these defaults per-hook unless the use case genuinely requires it.
- **Query keys are arrays, hierarchical** — `["todos"]`, `["categories"]`, `["auth", "me"]`. When mutating, invalidate the broadest key that covers affected caches.
- **Optimistic mutations follow a 5-step `onMutate`**, not just 3 steps:
  1. `await queryClient.cancelQueries({ queryKey })` — prevent in-flight refetch from overwriting optimistic write
  2. `const previous = queryClient.getQueryData(queryKey)` — snapshot for rollback
  3. `queryClient.setQueryData(queryKey, ...)` — optimistic write
  4. `return { previous }` — rollback context
  5. `onError`: guard with `if (context?.previous)` before restoring, show `toast.error("...", { duration: 4000 })`
  6. `onSettled`: `queryClient.invalidateQueries({ queryKey })` regardless of success/failure
- **Optimistic IDs use negative `-Date.now()`** — collision-safe with real auto-increment IDs. Delete mutations MUST guard with `if (id < 0) return Promise.resolve()` to avoid hitting the API with a fake ID (see `useDeleteTodo`).
- **Invalidate cross-entity when cascades apply** — deleting a category invalidates BOTH `["categories"]` and `["todos"]` (because `category_id` is set to null on affected todos).
- **Sonner for toasts** — `import { toast } from "sonner"`. Error toasts use `duration: 4000`. Do NOT import from `@/components/ui/toast` (removed).
- **Selectors live in the same file as the query hook** — `selectDueThisWeek`, `selectByDeadlineGroups` are co-located with `useGetTodos` in `use-todos.ts` and exported as pure, memoizable functions. Views call the selector, not a separate API.

### React Component Rules

- **Date parsing — use `parseDeadlineLocal()`, never `new Date("YYYY-MM-DD")`** — the native constructor interprets `YYYY-MM-DD` as UTC midnight, which shifts the date back one day in negative-offset timezones. The codebase helper splits the string and constructs via local-midnight `new Date(y, m-1, d)`.
- **ISO `YYYY-MM-DD` strings sort chronologically under lexicographic compare** — use `a.deadline.localeCompare(b.deadline)` for date sorts; do NOT convert to `Date` objects just to sort.
- **Return a NEW array from selectors** — `[...todos].filter(...).sort(...)`. TanStack Query's structural sharing requires cache immutability.
- **Popover overflow rule (post-Epic 6)** — inline popovers inside collapsible containers (`CategorySectionHeader`, `DeadlineGroupHeader`) must open upward using `bottom-full` anchor; the parent must be `overflow-visible` when open. Adding `overflow-hidden` to "fix" clipping is an anti-pattern. Reference commit `bfa0d62`.
- **shadcn/ui primitives live in `components/ui/`** — ESLint exempts them from `react-refresh/only-export-components`. When adding a new shadcn component, use `pnpm dlx shadcn@latest add <component>`; it writes into `components/ui/` using `components.json` config.
- **Icons from `lucide-react` only** — do not add alternative icon packs.

### FastAPI + SQLModel Rules

- **Request/response schemas use Pydantic `BaseModel`, NOT SQLModel** — routers define `TodoCreate`, `TodoUpdate`, `TodoRead` as `BaseModel` classes (see `routers/todos.py`). The SQLModel class is the DB table only. This separation keeps API contracts decoupled from DB schema evolution.
- **Field validation inline with `Field(...)`** — `Field(min_length=1, max_length=500)`, `Field(default=None, ge=1, le=5)` for priority. Put constraints on the schema, not in route logic.
- **PATCH endpoints use `payload.model_dump(exclude_unset=True)`** — only updates fields the client actually sent, preserving unset fields (distinguishes "set to null" from "not sent"). Empty result → `422 VALIDATION_ERROR`; do NOT silently no-op.
- **Per-user scoping is explicit in every query** — `.where(Todo.user_id == user.id)` on every select, update, delete. Enforced by convention, not dependency — `get_current_user` returns the user, but you still write the filter. Never trust a client-supplied `user_id`.
- **Ownership helpers centralize the "load or 404" pattern** — `_get_user_todo(id, user, db)`, `_validate_category_ownership(id, user, db)`. Reuse, don't inline.
- **Cross-entity ownership validation** — when accepting a foreign-key-like `category_id` on a todo mutation, validate the referenced category belongs to the same user. Otherwise a user could attach their todo to another user's category.
- **Routers use root path `/` with prefix mounted in `main.py`** — e.g., `@router.get("/")` registers `GET /api/todos` because the prefix `/api/todos` is added in `app.include_router(...)`. Do not prefix paths inside router modules.
- **Pagination / ordering belongs in SQL, not Python** — `order_by(Todo.created_at.desc())` on the query, not a post-fetch `sorted(...)` call.
- **Use `type: ignore[...]` only with specific codes** — e.g., `# type: ignore[union-attr]`. Blanket `# type: ignore` is forbidden.

### Backend Testing Rules

- **Tests live in `backend/tests/`**, NOT co-located next to source. Run via `pytest` from `backend/` (inside the container: `make shell-backend` then `pytest`).
- **In-memory SQLite per test** — `conftest.py` provides an `engine` fixture that creates a fresh `sqlite://` engine with `StaticPool` for each test. Tests are hermetic and do NOT require the Postgres container to be running. Do not reach for Postgres in tests.
- **Override `get_db`, don't mock it** — `conftest.py` uses `app.dependency_overrides[get_db] = _override_get_db`. FastAPI's dependency injection is the intended seam. Do not monkey-patch the engine or mock `sqlmodel.Session`.
- **Import all SQLModel classes in `conftest.py` with `# noqa: F401`** — SQLModel only registers tables whose classes have been imported. Forgetting this causes the in-memory schema to be missing tables that tests need.
- **Use `TestClient` with real registration, not fake JWTs** — the pattern in `test_todos.py::_register_and_login` hits `/api/auth/register` and lets the auth cookie flow naturally. Do not mint test JWTs or patch `get_current_user`.
- **Test helpers are module-private (prefix `_`)** — `_register_and_login`, `_create_todo`, `_create_category`, `_assert_error_envelope`. They stay in the test module, not in a shared utilities file.
- **Error envelope contract is asserted exactly** — `_assert_error_envelope` checks `set(body.keys()) == {"detail", "code"}` — any extra key is a regression. Every error-path test must assert both `status_code` AND the error code string.
- **ISO 8601 timestamps are validated parsable** — `datetime.fromisoformat(body["created_at"])`, not substring match.

### Frontend Testing Rules

- **Tests are co-located**: `component-name.test.tsx` sits next to `component-name.tsx`; `lib/utils.test.ts` next to `lib/utils.ts`. Do NOT create a `__tests__/` folder or `frontend/tests/`.
- **Vitest config is inferred from `vite.config.ts`** — no separate `vitest.config.ts`. Run with `pnpm test` (single run) or `pnpm test:watch`.
- **jsdom environment** — `jsdom 29` is configured for browser DOM emulation. Do not assume Node-only APIs.
- **Testing Library (`@testing-library/react` 16) is the render layer** — query by accessible role / text, not by test-id or implementation detail. Do not add `data-testid` as a first-resort query target.
- **Pure helpers get direct unit tests; components get integration-style tests** — `lib/utils.test.ts` tests `isOverdue`, `formatDeadline`, etc. directly. Component tests exercise user-visible behavior through `render` + user events.
- **Coverage is pragmatic, not enforced** — not every component has a test. Prioritize tests for: (a) pure selectors / utils with branching logic (date parsing, sorting, bucketing), (b) components with complex state (view switchers, collapsibles), (c) regression tests for shipped bugs.

### Cross-cutting Test Conventions

- **No mocks for the API layer in integration-style tests** — backend tests hit the real (in-memory) DB; frontend tests that need network should use MSW if/when added, not per-call mocks. Do not mock `apiFetch`.
- **No network calls to external services in any test** — the app has no third-party integrations; if one is added, stub it at the module boundary.
- **Tests must be deterministic** — no `Date.now()` without control, no random data without a seed. Deadline and priority helpers parse dates at local midnight (see React Component Rules) — tests should pass regardless of TZ by using the same helpers, not by hard-coding UTC dates.

### File & Directory Organization

- **Flat structure, NOT feature-folders** — `frontend/src/components/` is flat with kebab-case file names (`category-management-panel.tsx`, `deadline-group-header.tsx`). Do NOT introduce `features/todos/`, `features/categories/` folders.
- **One file per component / hook / router** — `components/todo-item.tsx`, `hooks/use-todos.ts`, `routers/todos.py`. Multi-component files are acceptable ONLY for tightly-coupled parts (e.g., a compound component with sub-parts that are never used independently).
- **Related hooks live in a single file** — `use-todos.ts` contains `useGetTodos`, `useCreateTodo`, `useUpdateTodo`, `useDeleteTodo`, AND pure selectors (`selectDueThisWeek`, `selectByDeadlineGroups`). Do NOT split each hook into its own file.
- **Context split pattern** — auth splits across three files: `auth-context.ts` (context creation), `auth-provider.tsx` (provider component), `use-auth.ts` (consumer hook). Follow this trio if adding new contexts.

### Naming Conventions (authoritative quick reference)

| Layer | Convention | Example |
|---|---|---|
| Frontend files | kebab-case | `category-picker-popover.tsx`, `use-todos.ts` |
| React components | PascalCase | `TodoItem`, `ViewSwitcher` |
| TypeScript types/interfaces | PascalCase | `Todo`, `CreateTodoRequest`, `ApiError` |
| TypeScript variables/functions | camelCase | `isCompleted`, `parseDeadlineLocal` |
| TypeScript constants | UPPER_SNAKE_CASE | `DAY_MS`, `PRIORITY_SORT_KEY`, `CAMEL_RE` |
| CSS custom properties | kebab-case | `--color-accent`, `--radius-sm` |
| Backend files | snake_case | `todos.py`, `auth.py`, `deps.py` |
| Python variables/functions | snake_case | `get_current_user`, `api_error` |
| Python classes | PascalCase | `ApiError`, `TodoCreate`, `User` |
| Python private helpers | `_prefix` | `_get_user_todo`, `_unauthorized` |
| DB tables | snake_case plural | `users`, `todos`, `categories` |
| DB columns | snake_case | `user_id`, `is_completed`, `created_at` |
| DB indexes | `idx_{table}_{column}` | `idx_todos_deadline` |
| API endpoints | plural nouns, lowercase | `/api/todos`, `/api/categories` |
| JSON wire format | snake_case | `{ "is_completed": true }` |
| Machine error codes | UPPER_SNAKE_CASE | `TODO_NOT_FOUND`, `VALIDATION_ERROR` |

### Comment & Documentation Style

- **Module docstrings / file headers explain WHY, not WHAT** — e.g., `api.ts` opens with a JSDoc block listing the four responsibilities of the HTTP boundary. Good pattern; follow it for new "boundary" files (auth context, query client, etc.).
- **Section dividers in long files** — `// -----...----` comment bars separate logical groups (see `api.ts`, `use-todos.ts`, `routers/todos.py`). Use sparingly, only in files with ≥3 related concerns.
- **No line-by-line narration** — per repo convention, avoid comments that restate what the code does. Do add comments for: non-obvious WHY (e.g., `parseDeadlineLocal` TZ reasoning), workarounds with pinned reference (e.g., bcrypt 4.x pin in `requirements.txt`), regression-prevention notes tied to a past incident (e.g., `useDeleteTodo`'s "A4 (Epic 3 → 6 carried debt)" comment).
- **Reference commits or stories by short SHA / story ID for historical context** — e.g., `Reference commit bfa0d62` or `(Story 7.2)`. Do NOT write long change-log paragraphs inside code.

### Linting, Formatting, and Config

- **ESLint 9 flat config** in `eslint.config.js`. Extends `js.recommended`, `tseslint.recommended`, `react-hooks.recommended`, `react-refresh/vite`. `components/ui/**` is exempted from `react-refresh/only-export-components` (shadcn files export variants alongside components).
- **Prettier uses defaults + `prettier-plugin-tailwindcss`** — no `.prettierrc` in the repo; defaults plus Tailwind class sorting. Run `pnpm format` to apply.
- **No Python linter/formatter is committed** (no `ruff`, `black`, `mypy` config files) — follow the existing style: `from __future__ import annotations` header, full type hints, docstrings, 4-space indent, double-quoted strings.

### Import Ordering (frontend)

Observed convention:
1. External packages (`react`, `@tanstack/react-query`, `sonner`)
2. Blank line
3. `@/...` aliased project imports
4. Blank line
5. Type-only imports (`import type { ... }`) — grouped with their runtime counterparts when from the same module

Do not reorder arbitrarily; this grouping is used across `api.ts`, `use-todos.ts`, etc.

### Environment Variables

- **Backend vars validated on startup** via `Settings(BaseSettings)` — missing/empty values cause the container to exit with a `ValidationError` before serving requests. Do NOT add defensive fallbacks at call sites; trust `settings.*`.
- **Frontend vars MUST be prefixed `VITE_`** — only `VITE_*` vars are exposed to the client at build time (Vite behavior). Use `import.meta.env.VITE_API_URL`, never `process.env`.
- **Never hardcode secrets, URLs, or connection strings** — everything flows through `.env` → `settings` (backend) or `import.meta.env` (frontend).

### Docker-First Development

- **`make` targets are the canonical entry points** — never run `docker compose ...` directly unless the Makefile has no target for it. Common flows: `make up`, `make down`, `make logs-backend`, `make shell-backend`, `make migrate`, `make test-backend`, `make lint-frontend`, `make typecheck-frontend`.
- **All service commands run inside containers** — backend tests, lint, typecheck, and migrations use `docker compose exec`. Do NOT run `pytest` or `pnpm lint` on the host unless you've set up the full toolchain locally (the project does not expect you to).
- **Host-side `pnpm install` is only for lockfile regeneration** — after editing `frontend/package.json`, run `make install-frontend` to regenerate `pnpm-lock.yaml`, then `make up` to rebuild the container. Do NOT edit `pnpm-lock.yaml` by hand.
- **Hot reload is wired**: edits to `frontend/src/**` → Vite HMR (~1s); edits to `backend/app/**` → Uvicorn reload (~2s). If a change doesn't take effect, suspect: (a) a `requirements.txt`/`package.json` change requiring rebuild (`make up`), (b) an entrypoint/config file change.

### Database Migrations

- **Alembic autogeneration from SQLModel metadata**:
  1. Edit / add a SQLModel class in `backend/app/models/`
  2. `make migration name="short description"` — autogenerates a migration file in `backend/alembic/versions/`
  3. **Review the generated file** — autogeneration misses default values, enum changes, and some index edits. Never ship a migration without reading it.
  4. `make migrate` — applies. Also runs automatically on backend container startup via `entrypoint.sh`.
- **Never write raw SQL migrations** — the source of truth for schema is SQLModel classes. Manual SQL fragments are acceptable ONLY inside an autogenerated migration's `upgrade()` / `downgrade()` (e.g., for data backfills).
- **Migrations are forward-only in practice** — write `downgrade()` for correctness but don't rely on it in a deployed environment. Destructive down-migrations should set reasonable defaults, not raise.

### Git Workflow

- **Conventional commits**: `type(scope): short description`. Observed types: `feat`, `fix`, `chore`, `docs`. Scope is typically the story ID (`feat(7.2): ...`) or a subsystem area (`fix: UI polish — ...`). Keep the subject line < 72 chars.
- **Branch naming**: `feature/<story-id>-<slug>` (e.g., `feature/7.2-by-deadline-view`), `fix/<slug>` (e.g., `fix/ui-polish-category-button-fab-spacing-popover-overflow`). One branch per story.
- **One PR per story** — merges go through GitHub PRs (`Merge pull request #N from ...`). The main branch stays linear through merge commits.
- **Post-story chores are separate commits** — `chore(<story>): code review — story status done, deferred items logged`, `chore: mark epic N as done in sprint status`, `chore: add epic N retrospective`. Do NOT bundle these into the feature commit.
- **Finish-of-task commit is standard** — per saved feedback in `.claude/memory`, after finishing a task's file changes, commit as the final step without being asked. Use the conventional-commit format above.

### BMad Planning Artifacts

- **Planning artifacts live in `_bmad-output/`** — `planning-artifacts/architecture.md`, `planning-artifacts/prd.md`, `planning-artifacts/ux-design-specification.md`, `planning-artifacts/epics.md`. These are the source of truth for product scope and architectural decisions.
- **Story files live in `_bmad-output/implementation-artifacts/<epic>-<story>-<slug>.md`** — each story is context-complete (requirements + acceptance criteria + technical notes). When implementing, read the story file first.
- **Sprint state lives in `_bmad-output/implementation-artifacts/sprint-status.yaml`** — update it when closing a story or epic.
- **Retrospectives per epic** — `epic-N-retro-YYYY-MM-DD.md`. One at end of each epic.
- **`_bmad/` is BMad tooling (installer/config)** — don't edit unless working on BMad itself. `_bmad-output/` is per-project artifacts.

### UI Verification (Claude-specific feedback)

- **Per saved feedback** in `.claude/memory`: UI changes MUST be verified with Playwright browser tools before reporting completion. Do not claim a UI change works based solely on type-check + test pass.

### Security Must-Dos

- **Every DB query filters by `user.id`** — both `todos` and `categories` are per-user. Missing a `.where(X.user_id == user.id)` is a data leak. Cross-entity mutations (e.g., `category_id` on a todo) must also validate the referenced entity belongs to the same user via `_validate_category_ownership`.
- **JWT is httpOnly cookie only** — NEVER read, write, or inspect the token from JS. NEVER persist it in `localStorage`, `sessionStorage`, or React state. The frontend has no reason to touch the token directly.
- **Passwords / tokens never enter logs** — `Settings.JWT_SECRET` is loaded via `BaseSettings` (which excludes itself from `repr`). Don't add `print(settings)` or `logger.info(f"token={token}")` shortcuts.
- **bcrypt cost stays `>= 10`** — hardcoded in `security.py`. Don't reduce "for test speed"; tests use bcrypt at real cost.
- **CORS origin must be explicit** — `allow_origins=[settings.cors_origin]` with `allow_credentials=True`. Never use `["*"]` with credentials — browsers reject it silently, and it would be a security regression.
- **Always validate on both sides** — frontend validation is UX, not security. Every field must also be validated by Pydantic `Field(...)` constraints or explicit route checks.

### Frontend Anti-Patterns (forbidden)

- ❌ `fetch(...)` directly from a component, hook, or util — use `apiFetch`
- ❌ `useState` + `useEffect` for data fetching — use TanStack Query
- ❌ JWT in `localStorage` or React state
- ❌ `{ data: ..., success: true }` response wrappers in API calls (responses are direct data)
- ❌ Separate API endpoints per view (`/api/todos/this-week`) — views are client-side selectors
- ❌ Mixing snake_case and camelCase inside TS code — the API boundary in `api.ts` is the only place both appear
- ❌ Using `any` — use `unknown` + guards; most "need for any" indicates a missing type in `@/types`
- ❌ `overflow-hidden` on a popover's ancestor to "fix" clipping — open upward with `bottom-full` and set parent `overflow-visible` instead
- ❌ Adding `@radix-ui/*` packages manually — shadcn v4 uses Base UI; install via `pnpm dlx shadcn@latest add`
- ❌ Storing category collapse state or FAB last-used values server-side — these are `localStorage` concerns
- ❌ Mocking `apiFetch`, `useTodos`, `queryClient` in tests — integration-test through the real layers

### Backend Anti-Patterns (forbidden)

- ❌ `raise HTTPException(...)` directly — use `api_error(status, message, code)` to preserve the `{detail, code}` envelope
- ❌ Query without `.where(X.user_id == user.id)` — data-leak hazard
- ❌ Trusting client-supplied `user_id` — always read from `get_current_user`
- ❌ `session.query(...)` raw SQLAlchemy — use SQLModel's `select(...)` and `db.exec(...)`
- ❌ Silently no-op on empty PATCH — return `422 VALIDATION_ERROR`
- ❌ Response wrapper objects (`{"todos": [...], "count": 5}`) — return a bare list
- ❌ Raw SQL for schema change — use Alembic autogeneration from SQLModel
- ❌ Unpinning `bcrypt<5.0` in `requirements.txt` — see Technology Stack section
- ❌ Blanket `# type: ignore` — always specify a rule code
- ❌ Router path prefixes inside router modules (`@router.get("/api/todos")`) — use root `/` and let `main.py` prefix

### Edge Cases Agents Commonly Miss

- **Optimistic todos have negative IDs** — `id = -Date.now()`. `useDeleteTodo` guards with `if (id < 0) return Promise.resolve()` to avoid hitting `DELETE /api/todos/-1713000000` which would 404. Any new mutation that accepts an `id` must apply the same guard.
- **`YYYY-MM-DD` parsed by native `new Date()` is UTC** — shifts the date one day back in negative-offset TZs. Use `parseDeadlineLocal()`. Test this explicitly — use the helper in tests, not a hand-built date.
- **`exclude_unset=True` on PATCH** distinguishes "set to null" from "not sent". A client sending `{"deadline": null}` clears the deadline; `{}` (not sent at all) leaves it untouched.
- **Category deletion is a cascade** — backend sets `category_id = NULL` on affected todos and returns the affected count. Frontend must invalidate BOTH `["categories"]` AND `["todos"]` after a category delete, otherwise stale todos still show the deleted category chip.
- **`docker compose down` preserves the volume; `down -v` destroys it** — `make reset` and `make clean` use `-v` (destructive). `make down` does NOT. Data loss bugs usually trace to confusing these.
- **Pydantic `BaseSettings` fails at import time** — missing `.env` vars crash the backend on startup, not on first request. If the backend container exits immediately with `ValidationError`, the fix is in `.env`, not in the code.
- **SQLModel table metadata needs the class imported** — tests import all model classes in `conftest.py` via `# noqa: F401` so `SQLModel.metadata.create_all(engine)` actually creates those tables. Adding a new model class requires adding its import to `conftest.py`.
- **shadcn/ui v4 is Base UI, not Radix** — do not copy solutions from v3 docs that reference `@radix-ui/*` imports. The shadcn components in `components/ui/` import from `@base-ui/react`.
- **`frontend` container depends on `backend` healthcheck** — if backend fails to start (e.g., bad `.env`), frontend never boots. Check `make logs-backend` first when the app is unreachable.
- **React Router v7 package is `react-router`** — NOT `react-router-dom`. Migrating an old snippet from v6 docs requires rewriting the imports.

### Performance Gotchas

- **Selectors must return new arrays** (`[...todos].filter().sort()`) — mutating cached data breaks TanStack Query's structural sharing and causes stale renders.
- **Wrap expensive selectors with `useMemo` at the call site** when computing on every render — the selectors themselves are pure, but calling them on every render without memoization is wasteful when the todos array is stable.
- **Indexes matter for the "Due This Week" view's `NFR14` (<500ms)** — `idx_todos_deadline` and `idx_todos_user_id` are required. Don't drop them to "simplify the migration".
- **Uvicorn `--reload` is DEV only** — production containers should not ship with it enabled.

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code in this repo.
- Follow ALL rules exactly as documented. When in doubt, prefer the more restrictive option.
- Pair with `_bmad-output/planning-artifacts/architecture.md` for architectural decisions; this file captures the *unobvious* implementation-time rules the architecture doc doesn't emphasise.
- When implementing a story, read the story file in `_bmad-output/implementation-artifacts/` first — it carries per-story context.
- If a new pattern emerges that you had to discover from the code, propose an update to this file.

**For Humans:**
- Keep this file lean. Obvious rules age out; unobvious gotchas are the valuable content.
- Update when the technology stack changes, when a new anti-pattern is discovered, or when a saved feedback memory becomes codebase-wide.
- Review at each epic retrospective for outdated rules.

**Related documents:**
- `_bmad-output/planning-artifacts/architecture.md` — architectural decisions, schema, route list
- `_bmad-output/planning-artifacts/prd.md` — product requirements (FRs/NFRs)
- `_bmad-output/planning-artifacts/ux-design-specification.md` — UX tokens, animations, component specs
- `docs/overview.md` — feature walkthrough (user-facing)

Last Updated: 2026-04-20
