---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-14'
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/ux-design-specification.md']
workflowType: 'architecture'
project_name: 'bmad_nf_todo_app'
user_name: 'Mattiapagetti'
date: '2026-04-14'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
30 FRs across 5 domains:
- **User Account Management (FR1-5):** Registration, login, logout, route protection, per-user data isolation
- **Authentication & Session Handling (FR6-9):** Token issuance, session expiry with graceful redirect, protected API endpoints
- **Todo Management (FR10-16):** Full CRUD (create, read, complete/uncomplete, delete), empty description validation, timestamp tracking
- **User Interface & Experience (FR17-24):** Optimistic updates with rollback, visual distinction for completed items, empty/loading/error states, responsive layout, keyboard navigation
- **Developer Operations (FR25-30):** Separate Docker containers for frontend/backend, docker-compose single-command start, hot reload, MCP-compatible DOM, documented README

Architecturally, auth and optimistic UI are the two areas with the most design surface. The CRUD itself is straightforward.

**Non-Functional Requirements:**
13 NFRs that will shape architectural decisions:
- **Performance (NFR1-4):** Optimistic updates < 100ms, initial load < 3s, API responses < 500ms, non-blocking UI thread
- **Security (NFR5-10):** bcrypt (cost >= 10), signed JWT with expiry, per-user data isolation on every endpoint, HTTPS in production, no sensitive data in logs, CORS restricted to frontend origin
- **Reliability (NFR11-13):** Data persistence across sessions/restarts, persistent Docker volume, graceful frontend handling of backend unavailability

**UX-Driven Architectural Requirements:**
- Design system: Tailwind CSS + shadcn/ui (Radix primitives) — prescribes the component framework
- Animation: Spring-physics easing, check-draw path animation, layout reflow animation — requires CSS transitions + JS class toggling (no animation library)
- Theming: Light/dark mode via CSS custom properties with `class` strategy — requires design token architecture
- Frosted glass: `backdrop-filter: blur()` on auth screen and FAB expansion — limited to two surfaces for performance
- Accessibility: Best-effort WCAG AA — semantic HTML, keyboard nav, focus management, `prefers-reduced-motion` support

**Scale & Complexity:**

- Primary domain: Full-stack web (SPA + REST API)
- Complexity level: Low-medium
- Estimated architectural components: ~8-10 (Auth module, API layer, DB layer, State management, UI component library, Docker infrastructure, Routing, Error handling)

### Technical Constraints & Dependencies

- **Docker-first development** — the entire stack must run via `docker-compose up` with hot reload; this constrains build tooling choices
- **JWT auth** — stateless server-side auth; no session store needed but requires token refresh/expiry strategy
- **Single-user scale** — no need for horizontal scaling, connection pooling beyond defaults, or caching layers
- **No SSR** — client-side rendering only; simplifies the frontend build but means no server-rendered initial state
- **MCP-compatible DOM** — standard HTML elements required; no canvas-based or shadow DOM rendering that would break Playwright inspection
- **UX spec prescribes Tailwind + shadcn/ui** — frontend component framework is already decided

### Cross-Cutting Concerns Identified

- **Authentication/Authorization** — touches every API endpoint and every frontend route; the single most pervasive concern
- **Error handling & optimistic rollback** — spans frontend state management and API communication; requires consistent patterns
- **Light/dark theming** — affects every visual component; must be token-driven from foundation
- **Containerization** — shapes project structure, build process, environment configuration, and local development workflow
- **Responsive layout** — mobile-first approach affects component sizing, spacing, and interaction patterns throughout

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — React SPA frontend + Python REST API backend, independently containerized, communicating via HTTP/JSON.

### Starter Options Considered

**Frontend starters evaluated:**
- `create-vite` with `react-ts` template — official, minimal, well-maintained
- shadcn/ui CLI v4 `init -t vite` — scaffolds Vite + React + TypeScript + Tailwind + Radix in one step
- Create React App — deprecated, not considered

**Backend starters evaluated:**
- `create-fastapi-project` CLI — community tool, opinionated structure
- Manual FastAPI project structure — standard, well-documented, full control
- Django — too heavy for a CRUD + auth API at this scale

### Selected Approach: Two-Service Scaffold

**Frontend: shadcn/ui CLI v4 (Vite template)**

The shadcn/ui v4 CLI scaffolds the complete frontend foundation in one command, including Vite, React, TypeScript, Tailwind CSS, and Radix UI primitives — all of which are prescribed by the UX specification.

**Backend: Manual FastAPI project structure**

FastAPI projects are lightweight enough that a manual scaffold provides better control than an opinionated CLI tool. The standard project structure is well-documented and follows community conventions.

**Rationale for Selection:**
- shadcn/ui CLI v4 provides the exact frontend stack the UX spec prescribes, avoiding manual wiring of Tailwind + Radix + TypeScript
- FastAPI's simplicity means a manual scaffold is cleaner than adapting an opinionated template
- Two independent services align with the Docker containerization requirement (separate Dockerfiles per PRD FR25/FR26)

**Initialization Commands:**

```bash
# Frontend (from project root)
pnpm dlx shadcn@latest init -t vite

# Backend (from project root)
mkdir backend && cd backend
python -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]" sqlmodel alembic psycopg2-binary pyjwt "passlib[bcrypt]"
```

**Architectural Decisions Provided by Starters:**

**Language & Runtime:**
- Frontend: TypeScript (strict mode), React 19, Node.js LTS
- Backend: Python 3.12+, FastAPI ~0.135.x, Uvicorn ASGI server

**Styling Solution:**
- Tailwind CSS v4 with CSS custom property tokens
- shadcn/ui components (copy-pasted, fully owned)
- `class` strategy for dark mode toggling

**Build Tooling:**
- Frontend: Vite (dev server + production bundler)
- Backend: No build step; Uvicorn with `--reload` for development

**Testing Framework:**
- Frontend: Vitest (Vite-native)
- Backend: pytest + httpx (FastAPI TestClient)

**Code Organization:**
- Frontend: `src/` with component co-location, shadcn/ui component directory
- Backend: modular FastAPI structure with routers, models, schemas, dependencies

**Development Experience:**
- Frontend: Vite HMR (hot module replacement)
- Backend: Uvicorn `--reload` for auto-restart on file changes
- Both mounted as volumes in Docker for hot reload in containers

**ORM & Database:**
- SQLModel (SQLAlchemy + Pydantic fusion) for model definitions
- Alembic for database migrations
- PostgreSQL as the persistent data store

**Authentication:**
- PyJWT for token encoding/decoding
- passlib with bcrypt backend for password hashing

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- JWT token storage strategy (httpOnly cookies)
- Frontend state management (TanStack Query for optimistic updates)
- API route structure and error format
- Environment variable management pattern

**Important Decisions (Shape Architecture):**
- Token expiry and refresh strategy
- Frontend routing approach
- Logging strategy
- CORS configuration

**Deferred Decisions (Post-MVP):**
- Production deployment platform (Railway, Fly.io, etc.)
- API versioning (not needed until external consumers exist)
- Caching layer (not needed at single-user scale)
- Refresh tokens (re-evaluate if 7-day expiry proves insufficient)

### Data Architecture

- **Database:** PostgreSQL (user requirement)
- **ORM:** SQLModel — dual-purpose models serving as both DB table definitions and Pydantic request/response schemas; drops to raw SQLAlchemy when needed
- **Migrations:** Alembic with autogenerate from SQLModel metadata; migrations run on container startup
- **Schema:** Two tables — `users` (id, email, hashed_password, created_at) and `todos` (id, user_id FK, description, is_completed, created_at)
- **Caching:** None required — single-user scale; PostgreSQL handles query volume trivially

### Authentication & Security

- **Token type:** JWT (signed with HS256, secret key from environment variable)
- **Token storage:** httpOnly cookie — prevents XSS access to token; backend sets cookie on login, frontend never touches the token directly
- **Token expiry:** 7 days — balances security with convenience for a single-user daily-driver app; no refresh token in v1
- **Password hashing:** passlib with bcrypt backend, cost factor 10 (per NFR5)
- **Route protection:** FastAPI `Depends()` with a `get_current_user` dependency that extracts and validates JWT from cookie on every protected endpoint
- **Per-user isolation:** All todo queries scoped by `user_id` from the validated JWT — enforced at the dependency level, not per-route
- **CORS:** Allowed origin configured via `CORS_ORIGIN` env var — `http://localhost:5173` in dev, production frontend URL in prod
- **HTTPS:** Handled by deployment platform (reverse proxy / load balancer), not by the application itself
- **Sensitive data:** Passwords and tokens excluded from all log output (per NFR9)

### API & Communication Patterns

- **Style:** REST, resource-based routes under `/api` prefix
- **Routes:**
  - `POST /api/auth/register` — create account, return user + set auth cookie
  - `POST /api/auth/login` — authenticate, return user + set auth cookie
  - `POST /api/auth/logout` — clear auth cookie
  - `GET /api/todos` — list all todos for authenticated user
  - `POST /api/todos` — create todo
  - `PATCH /api/todos/{id}` — update todo (toggle completion, edit description)
  - `DELETE /api/todos/{id}` — delete todo
- **Error format:** `{ "detail": "Human-readable message", "code": "MACHINE_READABLE_CODE" }` — extends FastAPI's default HTTPException with a `code` field for frontend error handling
- **API versioning:** None in v1 — no external consumers; prefix with `/api/v2` if needed later
- **Documentation:** FastAPI auto-generated OpenAPI at `/docs` (Swagger UI) and `/redoc`

### Frontend Architecture

- **State management:** TanStack Query v5 (~5.99.x) for all server state — caching, background refetching, optimistic updates, and error rollback handled declaratively via `useMutation` hooks. React Context for auth state only (current user). No global state library.
- **Optimistic update pattern:** TanStack Query `useMutation` with `onMutate` (snapshot + optimistic cache write) → `onError` (rollback to snapshot) → `onSettled` (revalidate from server). Directly satisfies FR17/FR18.
- **Routing:** React Router v7 (~7.14.x) — two routes: `/login` (public) and `/` (protected, redirects to login if unauthenticated). Auth guard via a wrapper component that checks auth context.
- **HTTP client:** Native `fetch` wrapped in a thin utility (`api.ts`) with `credentials: 'include'` for httpOnly cookie auth. No axios — the API surface is small and fetch handles cookies natively.
- **401 handling:** The fetch wrapper intercepts 401 responses globally, clears auth context, and redirects to `/login` (satisfying FR7/FR8).

### Infrastructure & Deployment

- **Local development:** `docker-compose.yml` with three services: `frontend` (Node + Vite dev server), `backend` (Python + Uvicorn with `--reload`), `db` (PostgreSQL with persistent volume)
- **Hot reload:** Frontend and backend source directories mounted as Docker volumes; Vite HMR and Uvicorn `--reload` watch for changes
- **Environment variables:** `.env` file loaded by docker-compose. Backend reads via Pydantic `BaseSettings` (type-safe, validated on startup). Frontend reads via Vite's `VITE_` prefix env vars (build-time injection).
- **Required env vars:** `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `VITE_API_URL`
- **Logging:** Python `logging` module with structured output. No external logging service in v1. Sensitive data excluded per NFR9.
- **Production deployment:** Deferred — Docker-native platforms (Railway, Fly.io) are natural fits. Architecture is platform-agnostic by design.
- **Database persistence:** Named Docker volume for PostgreSQL data; survives `docker-compose down` (per NFR12)

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffolding (frontend + backend + docker-compose)
2. Database models + Alembic migration setup
3. Auth endpoints (register, login, logout) + JWT cookie middleware
4. Todo CRUD API endpoints
5. Frontend auth flow (login/register screens, auth context, route guard)
6. Frontend todo management (TanStack Query hooks, optimistic updates, UI components)
7. Error handling, loading states, polish

**Cross-Component Dependencies:**
- Auth cookie strategy ties frontend fetch config to backend CORS + cookie settings — must be wired together early
- TanStack Query's optimistic update pattern depends on the API error format being consistent — error format must be established before frontend mutation hooks
- Docker-compose networking connects frontend → backend → db — the compose file is the integration point and should be validated as soon as both services exist

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 6 categories where AI agents could make different choices — naming, structure, format, communication, process, and enforcement.

### Naming Patterns

**Database Naming Conventions:**
- Tables: snake_case, plural — `users`, `todos`
- Columns: snake_case — `user_id`, `is_completed`, `created_at`
- Foreign keys: `{referenced_table_singular}_id` — `user_id`
- Indexes: `idx_{table}_{column}` — `idx_users_email`

**API Naming Conventions:**
- Endpoints: plural nouns, lowercase — `/api/todos`, `/api/auth/login`
- Route parameters: `{id}` (FastAPI path parameter syntax)
- Query parameters: snake_case — `?is_completed=true`
- JSON fields: snake_case — `{ "is_completed": true, "created_at": "..." }`

**Code Naming Conventions:**

| Layer | Convention | Example |
|---|---|---|
| Python variables/functions | snake_case | `get_current_user`, `todo_router` |
| Python classes | PascalCase | `User`, `TodoCreate` |
| Python files | snake_case | `todo_router.py`, `auth_service.py` |
| TypeScript variables/functions | camelCase | `isCompleted`, `createTodo` |
| React components | PascalCase | `TodoItem`, `AuthScreen` |
| TypeScript types/interfaces | PascalCase | `Todo`, `CreateTodoRequest` |
| Frontend files | kebab-case | `todo-item.tsx`, `use-todos.ts` |
| CSS custom properties | kebab-case | `--color-accent`, `--radius-sm` |

**API Boundary Rule:** The API always returns snake_case JSON. The frontend `api.ts` utility transforms keys to camelCase on response and back to snake_case on request. Each layer stays idiomatic to its language.

### Structure Patterns

**Frontend Organization (`src/`):**
- `components/ui/` — shadcn/ui primitives (Button, Input, Checkbox, etc.)
- `components/` — custom app components (TodoItem, FAB, AuthScreen, etc.)
- `hooks/` — custom hooks (`use-todos.ts`, `use-auth.ts`)
- `lib/` — utilities (`api.ts`, `query-client.ts`)
- `pages/` — route-level components (`login.tsx`, `home.tsx`)
- `*.test.tsx` / `*.test.ts` — co-located next to source files

**Backend Organization (`app/`):**
- `routers/` — FastAPI route handlers (`auth.py`, `todos.py`)
- `models/` — SQLModel definitions (`user.py`, `todo.py`)
- `core/` — config, security, dependencies (`config.py`, `security.py`, `deps.py`)
- `main.py` — app factory, middleware, router mounting
- `tests/` — at backend root, separate from source (`test_auth.py`, `test_todos.py`)

### Format Patterns

**API Response Formats:**
- Success (single item): direct object — `{ "id": 1, "description": "Buy milk", "is_completed": false, "created_at": "2026-04-14T10:30:00Z" }`
- Success (list): direct array — `[{ ... }, { ... }]`
- Error: `{ "detail": "Human-readable message", "code": "MACHINE_READABLE_CODE" }`
- No response wrappers (no `{ data: ..., success: true }`)

**Error Codes (machine-readable):**
- `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `TODO_NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`

**Data Exchange Formats:**
- Dates: ISO 8601 strings in UTC — `"2026-04-14T10:30:00Z"`. Always UTC from API; frontend formats for display.
- Booleans: `true`/`false` (never 1/0)
- Null handling: omit null fields where possible; include explicitly when null is semantically meaningful
- IDs: integers (PostgreSQL auto-increment)

### Communication Patterns

**TanStack Query Keys:**
- Array-based, hierarchical: `["todos"]`, `["todos", todoId]`, `["auth", "me"]`
- Enables targeted invalidation: `queryClient.invalidateQueries({ queryKey: ["todos"] })` after any todo mutation

**Optimistic Mutation Pattern (mandatory for all write operations):**
```
onMutate → snapshot cache → write optimistic update → return snapshot
onError → rollback to snapshot → show toast
onSettled → invalidate query (revalidate from server)
```
Every mutation follows this exact three-step pattern. No exceptions.

**Auth State:**
- React Context provides `user` object and `isAuthenticated` boolean
- Auth context is the only global state — all other state lives in TanStack Query cache
- Auth context populated on app mount by calling `GET /api/auth/me` (or equivalent cookie validation)

### Process Patterns

**Loading State Patterns:**
- Initial page load: skeleton screen (per UX spec)
- Subsequent data fetches: no visible loading indicator (optimistic updates via TanStack Query)
- Auth check on app mount: brief blank while validating cookie; redirect to login if invalid

**Error Handling Layers (in order of specificity):**
1. **API utility** (`api.ts`): catches 401 → clears auth context → redirects to `/login`
2. **TanStack Query mutations**: `onError` → rollback optimistic update → show toast notification
3. **TanStack Query queries**: `isError` state → inline error message in component
4. **React Error Boundary**: catches unhandled render errors → "something went wrong" fallback

**Validation Pattern:**
- Frontend: validate on blur; submit always enabled; show errors on submit if fields untouched
- Backend: Pydantic/SQLModel validation returns 422 + `VALIDATION_ERROR` code
- Both layers validate independently — never trust frontend validation alone

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow the naming conventions table for their layer — snake_case in Python, camelCase in TypeScript, snake_case in API JSON
- Use the `api.ts` utility for all HTTP calls — never call `fetch` directly from components
- Use TanStack Query hooks for all server state — never store server data in React `useState` or context
- Follow the three-step optimistic mutation pattern for all write operations
- Place files in the prescribed directory structure — no ad-hoc folders
- Return consistent `{ detail, code }` error format from all backend endpoints

**Anti-Patterns (explicitly forbidden):**
- Mixing camelCase and snake_case within the same layer
- Storing JWT in localStorage or React state
- Using `useEffect` + `useState` for data fetching instead of TanStack Query
- Creating API response wrappers (`{ data: ..., success: true }`) — return data directly
- Adding test files in a location other than co-located (frontend) or `tests/` (backend)
- Hardcoding URLs, secrets, or configuration values
- Using `any` type in TypeScript — prefer explicit types or `unknown` with type guards

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad_nf_todo_app/
├── README.md
├── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── index.html
│   ├── components.json                # shadcn/ui configuration
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── main.tsx                    # React entry point, mounts App
│       ├── app.tsx                     # Router setup, QueryClientProvider, AuthProvider
│       ├── index.css                   # Tailwind directives + CSS custom properties (design tokens)
│       ├── vite-env.d.ts
│       ├── components/
│       │   ├── ui/                     # shadcn/ui primitives (installed via CLI)
│       │   │   ├── button.tsx
│       │   │   ├── input.tsx
│       │   │   ├── checkbox.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── toast.tsx
│       │   │   ├── toaster.tsx
│       │   │   └── separator.tsx
│       │   ├── todo-item.tsx           # Single todo: checkbox, text, delete action
│       │   ├── todo-item.test.tsx
│       │   ├── todo-list.tsx           # Active todos list container
│       │   ├── todo-list.test.tsx
│       │   ├── completed-section.tsx   # Collapsible completed todos section
│       │   ├── fab.tsx                 # Floating action button + expansion panel
│       │   ├── fab.test.tsx
│       │   ├── auth-screen.tsx         # Login/register form with frosted glass
│       │   ├── auth-screen.test.tsx
│       │   ├── empty-state.tsx         # Shown when no active todos
│       │   ├── offline-indicator.tsx   # Top-strip network status bar
│       │   ├── auth-guard.tsx          # Route wrapper: redirects to /login if unauthenticated
│       │   └── theme-provider.tsx      # Light/dark mode context + system preference detection
│       ├── hooks/
│       │   ├── use-todos.ts            # TanStack Query hooks: useGetTodos, useCreateTodo, etc.
│       │   ├── use-todos.test.ts
│       │   ├── use-auth.ts            # Auth context hook: useAuth, useLogin, useRegister, useLogout
│       │   └── use-auth.test.ts
│       ├── lib/
│       │   ├── api.ts                  # Fetch wrapper: credentials, snake↔camel transform, 401 intercept
│       │   ├── api.test.ts
│       │   ├── query-client.ts         # TanStack QueryClient configuration
│       │   └── utils.ts               # cn() helper, date formatting, etc.
│       ├── pages/
│       │   ├── home.tsx               # Protected: todo list + FAB + completed section
│       │   └── login.tsx              # Public: auth screen (login/register toggle)
│       └── types/
│           └── index.ts               # Todo, User, CreateTodoRequest, ApiError types
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/                  # Auto-generated migration files
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app: CORS, cookie config, router mounting
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py             # Pydantic BaseSettings: DATABASE_URL, JWT_SECRET, CORS_ORIGIN
│   │   │   ├── security.py           # create_access_token, verify_token, hash_password, verify_password
│   │   │   └── deps.py               # get_db (session), get_current_user (JWT from cookie)
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py               # User SQLModel: id, email, hashed_password, created_at
│   │   │   └── todo.py               # Todo SQLModel: id, user_id, description, is_completed, created_at
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── auth.py               # POST /register, /login, /logout
│   │       └── todos.py              # GET /, POST /, PATCH /{id}, DELETE /{id}
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py               # Fixtures: test client, test DB session, authenticated user helper
│       ├── test_auth.py              # Registration, login, logout, 401 handling
│       └── test_todos.py             # CRUD, per-user isolation, validation
│
└── _bmad-output/                      # Planning artifacts (not deployed)
    └── planning-artifacts/
```

### Architectural Boundaries

**API Boundaries:**
- All client-server communication passes through `/api/*` endpoints only
- The frontend never accesses the database directly — all data flows through the FastAPI REST API
- Auth boundary: every `/api/todos/*` endpoint requires a valid JWT cookie, enforced via `get_current_user` dependency
- Public endpoints: only `/api/auth/register` and `/api/auth/login` are accessible without authentication

**Component Boundaries:**
- `pages/` components own route-level layout and compose child components — they do not contain business logic
- `hooks/` own all data-fetching and mutation logic via TanStack Query — components consume hooks, never call `api.ts` directly
- `components/ui/` are pure presentational (shadcn/ui primitives) — no data fetching, no business logic
- `components/` (custom) may contain local UI state (animation, expand/collapse) but delegate server state to hooks

**Service Boundaries (Backend):**
- `routers/` handle HTTP request/response only — validation, serialization, status codes
- `models/` define data shape only — no business logic in model classes
- `core/security.py` owns all auth logic — JWT creation, verification, password hashing
- `core/deps.py` owns dependency injection — database sessions and authenticated user extraction

**Data Boundaries:**
- SQLModel models are the single source of truth for database schema
- Alembic migrations are the only mechanism for schema changes — no manual SQL
- All database access goes through SQLModel sessions provided by `get_db` dependency
- Per-user data isolation enforced in `get_current_user` dependency — queries always filter by `user_id`

### Requirements to Structure Mapping

**FR Category: User Account Management (FR1-5)**
- Backend: `app/routers/auth.py`, `app/models/user.py`, `app/core/security.py`
- Frontend: `components/auth-screen.tsx`, `hooks/use-auth.ts`, `pages/login.tsx`

**FR Category: Authentication & Session Handling (FR6-9)**
- Backend: `app/core/security.py`, `app/core/deps.py`, `app/main.py` (CORS/cookie middleware)
- Frontend: `lib/api.ts` (401 intercept), `hooks/use-auth.ts` (auth context), `components/auth-guard.tsx`

**FR Category: Todo Management (FR10-16)**
- Backend: `app/routers/todos.py`, `app/models/todo.py`
- Frontend: `hooks/use-todos.ts`, `components/todo-item.tsx`, `components/todo-list.tsx`, `components/completed-section.tsx`, `components/fab.tsx`

**FR Category: UI & Experience (FR17-24)**
- Frontend: `components/empty-state.tsx`, `components/offline-indicator.tsx`, `components/theme-provider.tsx`, `index.css` (design tokens), all component animation classes

**FR Category: Developer Operations (FR25-30)**
- Root: `docker-compose.yml`, `.env.example`, `README.md`
- Frontend: `frontend/Dockerfile`
- Backend: `backend/Dockerfile`

**Cross-Cutting Concerns:**
- Authentication: `app/core/` (backend) ↔ `lib/api.ts` + `hooks/use-auth.ts` (frontend)
- Error handling: `app/main.py` exception handlers (backend) ↔ `lib/api.ts` + TanStack Query `onError` (frontend)
- Theming: `index.css` (tokens) ↔ `components/theme-provider.tsx` ↔ Tailwind config

### Integration Points

**Internal Communication:**
- Frontend → Backend: HTTP/JSON via `lib/api.ts`, credentials included (httpOnly cookie)
- Backend → Database: SQLModel sessions via `core/deps.py`
- Docker networking: frontend container calls backend via `http://backend:8000/api`

**Data Flow:**
```
User Action → Component → Hook (useMutation) → api.ts (fetch + transform) → FastAPI Router → SQLModel → PostgreSQL
                                                                                    ↓
User sees result ← Component re-renders ← Hook (cache update) ← api.ts (response transform) ← JSON response
```

### Development Workflow Integration

**Development Server Structure:**
- `docker-compose up` starts all three services with hot reload
- Frontend: Vite dev server on port 5173, proxied via Docker network to backend
- Backend: Uvicorn on port 8000 with `--reload`, connected to PostgreSQL on port 5432
- Database: PostgreSQL on port 5432 with named volume for persistence

**Build Process Structure:**
- Frontend: `vite build` → `dist/` directory served by nginx (production Dockerfile multi-stage)
- Backend: No build step — Python source served directly by Uvicorn in production mode (no `--reload`)
- Database: Alembic migrations run on backend container startup via entrypoint script

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
All technology choices are compatible and well-tested together:
- React 19 + Vite + TypeScript + Tailwind + shadcn/ui — standard, well-documented combination
- FastAPI + SQLModel + Alembic + PostgreSQL — built by the same author (Sebastián Ramírez), designed to work together
- PyJWT + passlib — lightweight, focused libraries with no dependency conflicts
- TanStack Query v5 + React Router v7 — both actively maintained, no known conflicts
- Docker Compose orchestrates all three services with standard networking

**Pattern Consistency:**
- Naming conventions align with each ecosystem: snake_case in Python/API, camelCase in TypeScript, PascalCase for components/types
- The API boundary transformation (snake_case ↔ camelCase in `api.ts`) cleanly separates the two conventions
- File naming follows each ecosystem's convention: kebab-case frontend, snake_case backend

**Structure Alignment:**
- Two-service architecture maps directly to Docker containerization requirement (FR25/FR26)
- Frontend structure follows shadcn/ui conventions (components/ui/) while adding project-specific organization
- Backend structure follows FastAPI community conventions (routers/, models/, core/)

### Requirements Coverage Validation

**Functional Requirements Coverage:**
- FR1-5 (User Account Management): Covered by `auth.py` router + `user.py` model + `auth-screen.tsx` + `use-auth.ts`
- FR6-9 (Auth & Sessions): Covered by `security.py` (JWT) + `deps.py` (cookie extraction) + `api.ts` (401 handling) + `auth-guard.tsx`
- FR10-16 (Todo Management): Covered by `todos.py` router + `todo.py` model + `use-todos.ts` + todo components
- FR17-24 (UI/UX): Covered by TanStack Query optimistic updates + component state machines + design tokens + responsive Tailwind
- FR25-30 (DevOps): Covered by Dockerfiles + docker-compose.yml + volume mounts + README

**Non-Functional Requirements Coverage:**
- NFR1-4 (Performance): TanStack Query optimistic updates satisfy < 100ms UI response; Vite build optimization for < 3s load; FastAPI async for < 500ms API
- NFR5-10 (Security): bcrypt via passlib (cost 10); JWT via PyJWT with expiry; per-user isolation via `get_current_user` dependency; CORS via FastAPI middleware; httpOnly cookies prevent XSS; Pydantic BaseSettings excludes secrets from logs
- NFR11-13 (Reliability): PostgreSQL persistent volume; SQLModel sessions with proper cleanup; frontend error boundary + toast for graceful degradation

### Implementation Readiness Validation

**Decision Completeness:**
All critical decisions documented with specific library versions. No ambiguous "choose at implementation time" gaps remain for core architecture.

**Structure Completeness:**
Every file referenced in a pattern or requirement has a defined location in the project tree. Test files have prescribed locations. Configuration files are specified.

**Pattern Completeness:**
Naming, structure, format, communication, and process patterns are all defined with concrete examples. Anti-patterns are explicitly listed. The optimistic update pattern is specified step-by-step.

### Gap Analysis Results

**No Critical Gaps.** All implementation-blocking decisions are resolved.

**Minor Gaps (acceptable for v1, documented for awareness):**
- No CI/CD pipeline defined — acceptable for solo developer; add GitHub Actions when needed
- No production Dockerfile optimization (multi-stage builds) specified in detail — straightforward to add at deployment time
- No database seed data strategy — can be handled in first implementation story
- No rate limiting — acceptable at single-user scale; add if deployed publicly
- Refresh token strategy deferred — 7-day access token covers v1 use case

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed
- [x] Security model fully specified

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented
- [x] Anti-patterns explicitly listed

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all decisions are well-supported by mature, actively-maintained technologies with strong documentation and community support.

**Key Strengths:**
- Clean two-service separation aligns naturally with Docker requirements
- SQLModel + FastAPI synergy eliminates model duplication between DB and API layers
- TanStack Query's built-in optimistic update pattern directly satisfies the most complex UX requirement (FR17/FR18)
- httpOnly cookie strategy is more secure than localStorage alternatives with minimal additional complexity
- Every pattern choice follows the dominant convention of its ecosystem, reducing friction for any developer (human or AI) working in that layer

**Areas for Future Enhancement:**
- CI/CD pipeline (GitHub Actions) — add when ready to automate deployments
- Production deployment configuration — platform-specific, decide at deploy time
- Refresh token rotation — add if 7-day access token proves insufficient
- Rate limiting and request throttling — add if deployed for public access
- E2E testing with Playwright — natural addition for MCP-compatible testing

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- When in doubt about a convention, check the Naming Patterns and Enforcement Guidelines sections

**First Implementation Priority:**
1. Run `pnpm dlx shadcn@latest init -t vite` for frontend scaffold
2. Create `backend/` with FastAPI project structure and `requirements.txt`
3. Create `docker-compose.yml` with all three services and verify `docker-compose up` works with hot reload
4. Set up Alembic and create initial User + Todo migrations
