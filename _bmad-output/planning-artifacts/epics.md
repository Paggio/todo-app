---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
previousEpics: [1, 2, 3, 4]
newWorkScope: 'Organizational features: categories, priorities, deadlines, multi-view navigation (FR31-FR47, NFR14, UX-DR21-UX-DR34)'
---

# bmad_nf_todo_app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad_nf_todo_app, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: A visitor can register a new account using an email address and password
FR2: A registered user can log in with their email and password
FR3: An authenticated user can log out, terminating their session
FR4: The system prevents access to todo data for unauthenticated users
FR5: The system stores each user's todos in isolation — no user can access another user's data
FR6: The system issues a token upon successful login that authenticates subsequent requests
FR7: When a user's session expires or token is invalid, the system redirects them to the login screen without data loss
FR8: After re-authenticating from an expired session, the user is returned to their todo list
FR9: The system rejects requests to protected API endpoints that lack valid authentication
FR10: An authenticated user can create a new todo by providing a text description, and optionally a deadline, priority level, and category
FR11: An authenticated user can view all their todos — both active and completed
FR12: An authenticated user can mark a todo as complete
FR13: An authenticated user can mark a completed todo as active (undo completion)
FR14: An authenticated user can delete a todo permanently
FR15: The system prevents creation of a todo with an empty description
FR16: Todo creation time is recorded and associated with each item
FR17: The UI reflects write operations (create, complete, delete, category/priority/deadline changes) immediately, before server confirmation
FR18: If a write operation fails server-side, the UI rolls back to the previous state and notifies the user
FR19: Completed todos are visually distinguished from active todos at a glance
FR20: The application displays a purposeful empty state when the user has no todos
FR21: The application displays a loading state while data is being fetched
FR22: The application displays an error state when a data operation fails unrecoverably
FR23: The application layout is fully functional on viewports from 375px to 1920px with no horizontal scrolling, no overlapping elements, and all interactive targets at least 44x44px on mobile
FR24: Core flows are operable via keyboard navigation
FR25: The frontend is buildable and runnable as a standalone Docker container
FR26: The backend is buildable and runnable as a standalone Docker container
FR27: A `docker-compose.yml` starts the full stack (frontend, backend, database) with a single command
FR28: The local development setup supports hot reload for frontend and backend changes
FR29: The frontend renders using standard DOM elements compatible with MCP-based browser inspection tools
FR30: The repository includes a README with setup instructions, environment variable documentation, and local development steps
FR31: An authenticated user can create a new category by providing a name
FR32: An authenticated user can rename an existing category
FR33: An authenticated user can delete a category; todos in that category revert to uncategorized
FR34: An authenticated user can assign a todo to exactly one category, or leave it uncategorized
FR35: An authenticated user can change or remove a todo's category assignment
FR36: Categories are per-user — no user can see or modify another user's categories
FR37: The system prevents creation of a category with an empty or duplicate name (per user)
FR38: An authenticated user can set a deadline (date) on a todo at creation or afterward
FR39: An authenticated user can change or remove a todo's deadline
FR40: An authenticated user can set a priority level (1–5, where 1 is highest) on a todo at creation or afterward
FR41: An authenticated user can change or remove a todo's priority level
FR42: Deadline and priority are optional — todos without them remain valid
FR43: The application provides a "Due This Week" view that displays all active (non-completed) todos with deadlines within the next 7 calendar days
FR44: Todos in the "Due This Week" view are sorted by priority (highest first); todos without a priority appear after prioritized items
FR45: The "Due This Week" view is accessible within 1 interaction from the main todo list
FR46: Todos display their category, deadline, and priority visually when set
FR47: Todos with deadlines in the past (overdue) are visually flagged

### NonFunctional Requirements

NFR1: All UI write operations (create, complete, delete) must reflect optimistically in under 100ms from user action
NFR2: Initial page load (authenticated user landing on todo list) must complete within 3 seconds on a standard broadband connection
NFR3: API responses for all CRUD operations must complete within 500ms under normal single-user load
NFR4: The application must remain responsive and not block the UI thread during any network operation
NFR5: Passwords must be hashed using bcrypt with a minimum cost factor of 10 before storage — plaintext passwords must never be persisted
NFR6: Auth tokens (JWT) must be signed with a secret key and include an expiry; expired tokens must be rejected server-side
NFR7: All API endpoints that return or modify user data must validate the auth token and enforce per-user data isolation
NFR8: The application must be served over HTTPS in production
NFR9: No sensitive data (tokens, passwords) must be logged in application logs
NFR10: CORS must be configured to allow only the expected frontend origin in production
NFR11: Todo data must persist across user sessions, browser restarts, and container restarts
NFR12: The database must use a persistent volume in the Docker setup — no data loss on `docker-compose down`
NFR13: The application must handle backend unavailability gracefully — the frontend must display an error state rather than crashing
NFR14: The "Due This Week" query must return results within 500ms under normal single-user load, including filtering and priority sorting

### Additional Requirements

- **Starter Template (Epic 1, Story 1):** Architecture specifies shadcn/ui CLI v4 (Vite template) for frontend scaffold and manual FastAPI project structure for backend — these initialization commands are the first implementation step
- Two-service architecture: frontend and backend as independent Docker services with PostgreSQL as persistent data store
- SQLModel as ORM with Alembic for database migrations; migrations must run on container startup via entrypoint script
- JWT stored in httpOnly cookies — frontend never touches the token directly; backend sets cookie on login
- TanStack Query v5 for all server state management with mandatory three-step optimistic mutation pattern (onMutate → onError → onSettled)
- React Router v7 for routing with auth guard wrapper component; two routes: `/login` (public) and `/` (protected)
- Native fetch wrapped in `api.ts` utility with `credentials: 'include'` and automatic snake_case ↔ camelCase key transformation
- Global 401 interception in fetch wrapper: clears auth context and redirects to `/login`
- Pydantic BaseSettings for type-safe, validated environment variable management on backend startup
- Docker-compose with three services: frontend (Vite dev server, port 5173), backend (Uvicorn with `--reload`, port 8000), db (PostgreSQL, port 5432, persistent named volume)
- Consistent API error format: `{ "detail": "Human-readable message", "code": "MACHINE_READABLE_CODE" }`
- Naming conventions enforced: snake_case (Python/API JSON), camelCase (TypeScript), PascalCase (React components/types), kebab-case (frontend files, CSS properties)
- Anti-patterns explicitly forbidden: JWT in localStorage, useEffect+useState for data fetching, response wrappers, `any` type in TypeScript, hardcoded config values
- **New: Categories table** — `categories` (id, user_id FK, name, created_at) with unique constraint on (user_id, name); ON DELETE SET NULL for todos.category_id
- **New: Todo model expansion** — category_id FK nullable, deadline date nullable, priority integer 1-5 nullable added to todos table
- **New: Indexes** — `idx_categories_user_id`, `idx_todos_category_id`, `idx_todos_deadline` for query performance
- **New: Category API** — GET/POST/PATCH/DELETE `/api/categories`; delete returns count of affected todos; rejects empty or duplicate names per user
- **New: Todo API expansion** — PATCH `/api/todos/{id}` now accepts category_id, deadline, priority; POST `/api/todos` accepts optional category_id, deadline, priority
- **New: Error codes** — `CATEGORY_NOT_FOUND`, `DUPLICATE_CATEGORY_NAME` added to API error format
- **New: TanStack Query invalidation** — category deletion must invalidate both `["categories"]` and `["todos"]` query keys (cascade affects both)
- **New: Client-side view filtering** — three views (All/This Week/By Deadline) as TanStack Query selectors on cached `["todos"]` data; no dedicated API endpoints per view
- **New: View state** — tracked via URL query param (`?view=all|week|deadline`) for browser back/forward support
- **New: use-categories hook** — useGetCategories, useCreateCategory, useRenameCategory, useDeleteCategory with three-step optimistic mutation pattern
- **New: Frontend components** — ViewSwitcher, CategorySectionHeader, CategoryManagementPanel, PriorityIndicator, DeadlineLabel, DeadlineGroupHeader
- **New: Separate API endpoints forbidden** — views must NOT have dedicated API endpoints; all filtering/sorting is client-side
- **New: localStorage concerns** — category collapse state and FAB last-used selector values stored in localStorage, not server state

### UX Design Requirements

UX-DR1: Design token system — implement CSS custom properties for the full color palette (light/dark mode variants), typography scale (Inter, weights 400/500/600), spacing (4px base unit), elevation (3-level shadow: subtle/resting/elevated), and motion (spring-physics easing `cubic-bezier(0.34, 1.56, 0.64, 1)`)
UX-DR2: Light/dark mode theming — `class` strategy with `data-theme` root attribute, system preference detection via `prefers-color-scheme`, CSS custom property switching between light and dark palettes
UX-DR3: TodoItem component — 4 visual states (active / completing / completed / deleting), checkbox with custom check-draw path animation (150ms), text dims to 50% opacity + strikethrough on completion, delete affordance revealed on hover/focus
UX-DR4: FloatingActionButton (FAB) — circular idle state (bottom-right, 24px from edges, accent color, `+` icon), spring scale expansion to input panel, closes on submit/Escape/click-outside, subtle pulse animation in empty state
UX-DR5: CompletedSection component — collapsible with count badge when collapsed, expanded by default, collapse preference persisted in localStorage, visually muted items (dimmed text, lighter checkbox)
UX-DR6: AuthScreen component — full-viewport frosted glass overlay (`backdrop-filter: blur()`), single card layout (logo/title + email + password + submit), animated transition between Sign In and Sign Up modes
UX-DR7: EmptyState component — single line of welcoming copy + subtle arrow pointing to FAB, no illustrations, shown only when active todo list is empty
UX-DR8: OfflineIndicator component — thin strip at top of viewport in warning color (`#FF9500`), auto-hides on reconnect, never blocks content
UX-DR9: Todo completion animation sequence — (1) checkbox hover: accent fill at 60% opacity + scale(1.05), (2) click: checkmark "draws" in 150ms, (3) text dims + strikethrough animates simultaneously, (4) item slides to completed section with spring easing ~300ms, (5) active list reflows with layout animation
UX-DR10: Todo creation animation — new item fades in at top of active list (200ms duration)
UX-DR11: Todo deletion animation — item collapses with fade-out (200ms duration)
UX-DR12: Destructive confirmation pattern — inline expansion below the item (not a modal), single [Confirm delete] button, auto-dismissed after 5s if no action taken
UX-DR13: Form patterns — labels always visible (no placeholder-only labels), validation fires on blur, submit button always enabled, Enter submits single-field forms, Tab navigates between fields in multi-field forms
UX-DR14: Button hierarchy — Primary (filled accent background, white text, max one per view), Secondary (outlined border, accent text), Ghost (no border, muted text, for destructive/low-priority), Icon-only (44px tap target, tooltip on hover)
UX-DR15: Responsive layout — Mobile (<640px): full-width, 16px horizontal padding, FAB 16px from edges; Tablet (640-1024px): centered column max-width 640px, 32px padding; Desktop (>1024px): same as tablet
UX-DR16: Accessibility — keyboard navigation (Tab to navigate, Space to toggle completion, Enter to confirm, Escape to cancel), screen reader support (`aria-checked`, `aria-live="polite"` for completion announcements), focus management (FAB expansion → focus input, close → return focus to FAB), 44x44px minimum touch targets, `prefers-reduced-motion` wrapping all animations
UX-DR17: Loading states — skeleton screens (not spinners) for initial list load; no loading indicators on subsequent fetches due to optimistic updates
UX-DR18: Auth ↔ Main view transition — full-page transition (fade or slide depending on direction)
UX-DR19: Toast notifications — bottom-center position, 3s auto-dismiss for general feedback, 4s for network errors
UX-DR20: Typography implementation — Inter self-hosted via `@fontsource/inter`, type scale: display (28px/600), heading (20px/600), body (16px/400), body-medium (16px/500), label (13px/500), caption (12px/400); letter-spacing: -0.01em on display/heading, +0.02em on all-caps labels
UX-DR21: ViewSwitcher — segmented tab bar (All | This Week | By Deadline), pill-style segments with accent fill on active/ghost on inactive, 150ms fade transition on view switch, active view stored in URL query param (?view=all|week|deadline), abbreviated labels on narrow viewports ("All" / "Week" / "Deadline")
UX-DR22: CategorySectionHeader — collapsible section dividers in "All" view, category name (heading weight) + todo count badge (right-aligned) + collapse chevron (far right), smooth 200ms height collapse/expand animation, collapse state persisted in localStorage per category, 1px bottom border (--color-border), empty categories hidden
UX-DR23: CategoryManagementPanel — slide-in panel from right (320px desktop, full-width sheet on mobile), triggered by gear icon in header, lists categories with inline rename (click-to-edit) + delete (ghost red icon), "Add category" input at top, inline delete confirmation ("This will uncategorize X todos. Remove?" with [Cancel][Remove]), frosted glass backdrop
UX-DR24: PriorityIndicator — 3px solid left border on todo item in priority color (--color-priority-{1-5}), no border when unpriorized, clickable to open priority picker popover for inline editing
UX-DR25: Priority color token system — 5-level colors: P1 red (#FF3B30), P2 orange (#FF9500), P3 yellow (#FFCC00), P4 blue (#0066FF), P5 gray (#98989D); dark mode variants: #FF453A, #FF9F0A, #FFD60A, #4D9FFF, #636366
UX-DR26: DeadlineLabel — right-aligned within todo item, caption size (12px, --color-text-muted), smart formatting: "Today" (bold), "Tomorrow", day name (this week), short date (beyond), "Overdue · date" (red), clickable to open date picker popover for inline editing
UX-DR27: Overdue treatment — todo item background tinted with --color-overdue-bg (5% opacity red #FF3B300D), deadline label in --color-overdue-text (red), priority left-border unchanged (independent signals)
UX-DR28: DeadlineGroupHeader — temporal section dividers in "By Deadline" view: Overdue (red tint header), Today, Tomorrow, This Week, Later, No Deadline; same visual style as CategorySectionHeader; empty groups hidden
UX-DR29: Extended FAB creation panel — compact row of optional selectors below text input: Category dropdown, Priority dropdown (with colored dot preview), Date picker; all optional (Enter with only text creates plain todo); selectors remember last-used values within session (cleared on page refresh); stack vertically below 400px viewport
UX-DR30: Inline edit pattern — click/tap on priority indicator, deadline label, or category chip triggers compact popover anchored to clicked element, same dropdown/picker as FAB panel, optimistic update on selection, Escape or click-outside dismisses without change
UX-DR31: Category chip on todo items — shown in non-"All" views (This Week, By Deadline), caption size, --color-bg-subtle background, --color-text-muted text, 4px border-radius, 4px 8px padding, no chip for uncategorized todos
UX-DR32: "Due This Week" view layout — flat list (no section dividers, no category grouping), only active (non-completed) todos with deadlines within 7 calendar days, sorted by priority (P1→P5→no priority) then by deadline (earliest first) within same priority, each todo shows priority indicator + deadline label + category chip, empty state: "Nothing due this week" with subtle checkmark
UX-DR33: "By Deadline" view layout — grouped by temporal proximity: Overdue, Today, Tomorrow, This Week, Later, No Deadline; within each group sorted by priority (P1 first); each todo shows priority indicator + category chip + full date; empty groups hidden; completed section at bottom
UX-DR34: "All Todos" view with categories — category section dividers (collapsible), uncategorized section at top, completed section at bottom regardless of category, sections default expanded, collapse state persisted in localStorage, empty categories hidden

### FR Coverage Map

FR1: Epic 2 — User registration endpoint and form
FR2: Epic 2 — User login endpoint and form
FR3: Epic 2 — User logout endpoint and UI action
FR4: Epic 2 — Auth guard and protected routes
FR5: Epic 2 — Per-user data isolation via JWT user_id scoping
FR6: Epic 2 — JWT token issuance in httpOnly cookie
FR7: Epic 2 — Session expiry redirect to login without data loss
FR8: Epic 2 — Post-reauthentication redirect to todo list
FR9: Epic 2 — Protected API endpoint validation
FR10: Epic 3 (base) + Epic 5 (category selector) + Epic 6 (priority/deadline selectors) — Todo creation with optional metadata
FR11: Epic 3 — Todo list view (active + completed)
FR12: Epic 3 — Mark todo as complete
FR13: Epic 3 — Mark completed todo as active (undo)
FR14: Epic 3 — Delete todo permanently
FR15: Epic 3 — Empty description validation
FR16: Epic 3 — Todo creation timestamp
FR17: Epic 3 (base) + Epic 5 (category mutations) + Epic 6 (priority/deadline mutations) — Optimistic UI updates on all write operations
FR18: Epic 3 — UI rollback on server-side failure with notification
FR19: Epic 3 — Visual distinction between active and completed todos
FR20: Epic 3 — Empty state display when no todos
FR21: Epic 3 — Loading state during data fetch
FR22: Epic 3 — Error state on unrecoverable failure
FR23: Epic 4 — Responsive layout (mobile + desktop)
FR24: Epic 4 — Keyboard navigation for core flows
FR25: Epic 1 — Frontend Docker container
FR26: Epic 1 — Backend Docker container
FR27: Epic 1 — docker-compose.yml single-command start
FR28: Epic 1 — Hot reload for frontend and backend
FR29: Epic 1 — MCP-compatible standard DOM rendering
FR30: Epic 1 — README with setup documentation
FR31: Epic 5 — Create category
FR32: Epic 5 — Rename category
FR33: Epic 5 — Delete category with uncategorize cascade
FR34: Epic 5 — Assign todo to category
FR35: Epic 5 — Change or remove todo's category
FR36: Epic 5 — Per-user category isolation
FR37: Epic 5 — Prevent empty or duplicate category names
FR38: Epic 6 — Set deadline on todo
FR39: Epic 6 — Change or remove deadline
FR40: Epic 6 — Set priority level (1–5) on todo
FR41: Epic 6 — Change or remove priority
FR42: Epic 6 — Deadline and priority are optional
FR43: Epic 7 — "Due This Week" view (active todos with deadlines within 7 days)
FR44: Epic 7 — Due This Week sorted by priority (highest first)
FR45: Epic 7 — Due This Week accessible within 1 interaction
FR46: Epic 5 (category display) + Epic 6 (priority/deadline display) — Visual metadata on todo items
FR47: Epic 6 — Overdue flagging for past-deadline todos
NFR14: Epic 7 — Due This Week query within 500ms

## Epic List

### Epic 1: Project Foundation & Developer Experience
After this epic, a developer can clone the repo, run `docker-compose up`, and have the full stack (frontend, backend, PostgreSQL) running with hot reload — ready for feature development.
**FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30
**NFRs addressed:** NFR12 (persistent Docker volume)
**Additional:** Architecture starter template (shadcn/ui CLI v4 + manual FastAPI), SQLModel + Alembic migration setup, env var configuration, README

### Epic 2: User Authentication & Secure Access
After this epic, a visitor can register an account, log in, and log out. The system manages JWT sessions via httpOnly cookies, protects all todo routes, handles session expiry gracefully, and enforces per-user data isolation.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9
**NFRs addressed:** NFR5 (bcrypt), NFR6 (signed JWT with expiry), NFR7 (per-user isolation), NFR8 (HTTPS), NFR9 (no secrets in logs), NFR10 (CORS)
**Additional:** httpOnly cookie strategy, auth guard component, 401 interception in api.ts, auth context

### Epic 3: Todo Management & Core Interaction
After this epic, an authenticated user can create, view, complete, uncomplete, and delete todos with instant optimistic feedback. The UI handles empty, loading, and error states. Completed todos are visually distinct from active ones.
**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22
**NFRs addressed:** NFR1 (optimistic < 100ms), NFR3 (API < 500ms), NFR4 (non-blocking UI), NFR11 (data persistence)
**Additional:** TanStack Query hooks with three-step optimistic mutation pattern, todo API endpoints, active/completed list split

### Epic 4: Design Polish, Responsiveness & Accessibility
After this epic, the application delivers a crafted, Apple-inspired experience with a full design token system, light/dark theming, spring-physics animations, responsive layout, and keyboard/screen-reader accessibility.
**FRs covered:** FR23, FR24
**NFRs addressed:** NFR2 (page load < 3s), NFR13 (graceful backend unavailability)
**UX-DRs covered:** UX-DR1 through UX-DR20

### Epic 5: Category Organization
After this epic, an authenticated user can create, rename, and delete custom categories, assign any todo to a category, and see their todos organized into collapsible category sections in the main list view. The category management panel provides full CRUD, and the FAB includes a category selector for new todos.
**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR46 (category display)
**NFRs addressed:** NFR7 (per-user category isolation)
**UX-DRs covered:** UX-DR22, UX-DR23, UX-DR29 (category selector), UX-DR30 (category inline edit), UX-DR31, UX-DR34
**Additional:** Categories table + Alembic migration, category CRUD API, todo table expansion (category_id, deadline, priority fields), use-categories hook with optimistic mutations

### Epic 6: Priority & Deadline Management
After this epic, an authenticated user can set priority levels (1–5) and deadlines on any todo, see expressive priority color indicators and smart deadline labels, spot overdue items at a glance, and use the fully extended FAB creation panel with all metadata selectors.
**FRs covered:** FR38, FR39, FR40, FR41, FR42, FR46 (priority/deadline display), FR47
**UX-DRs covered:** UX-DR24, UX-DR25, UX-DR26, UX-DR27, UX-DR29 (priority/deadline selectors), UX-DR30 (priority/deadline inline edit)
**Additional:** Priority color tokens (light/dark), priority indicator component, deadline label with smart formatting, overdue treatment, extended FAB selectors, inline editing popovers

### Epic 7: Multi-View Navigation
After this epic, the application provides three views — All Todos, Due This Week, and By Deadline — letting the user see their tasks from different perspectives with a single-tap view switcher. The Due This Week view surfaces upcoming priority-sorted tasks, and the By Deadline view groups todos by temporal proximity.
**FRs covered:** FR43, FR44, FR45
**NFRs addressed:** NFR14 (Due This Week query < 500ms)
**UX-DRs covered:** UX-DR21, UX-DR28, UX-DR32, UX-DR33
**Additional:** View switcher (segmented tab bar), client-side TanStack Query selectors for filtering/sorting, URL query param view state, deadline group headers, view-specific empty states

---

## Epic 1: Project Foundation & Developer Experience

After this epic, a developer can clone the repo, run `docker-compose up`, and have the full stack (frontend, backend, PostgreSQL) running with hot reload — ready for feature development.

### Story 1.1: Initialize Frontend with shadcn/ui and Docker

As a developer,
I want a scaffolded React + TypeScript + Tailwind frontend running in a Docker container,
So that I have a ready-to-develop frontend environment with the prescribed tech stack.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** the developer navigates to the `frontend/` directory
**Then** the following exist: `package.json` with React 19, TypeScript, Vite, Tailwind CSS, and shadcn/ui dependencies; `tsconfig.json` with strict mode; `vite.config.ts`; `components.json` (shadcn/ui config); `index.html`; `src/main.tsx`; `src/app.tsx`; `src/index.css` with Tailwind directives

**Given** a `frontend/Dockerfile` exists
**When** the developer builds the Docker image
**Then** the image builds successfully and serves the Vite dev server on port 5173

**Given** the frontend container is running
**When** the developer accesses `http://localhost:5173`
**Then** a default React page renders using standard DOM elements (FR29 — MCP-compatible)

### Story 1.2: Initialize Backend with FastAPI and Docker

As a developer,
I want a scaffolded FastAPI backend running in a Docker container,
So that I have a ready-to-develop API server with the prescribed project structure.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** the developer navigates to the `backend/` directory
**Then** the following exist: `requirements.txt` with fastapi, sqlmodel, alembic, psycopg2-binary, pyjwt, and passlib[bcrypt]; `app/main.py` with a FastAPI app factory and CORS middleware; `app/core/config.py` with Pydantic BaseSettings reading DATABASE_URL, JWT_SECRET, and CORS_ORIGIN; the prescribed directory structure (`app/core/`, `app/routers/`, `app/models/`)

**Given** a `backend/Dockerfile` exists
**When** the developer builds the Docker image
**Then** the image builds successfully and serves Uvicorn on port 8000

**Given** the backend container is running
**When** the developer accesses `http://localhost:8000/docs`
**Then** the FastAPI Swagger UI loads successfully

**Given** the backend app starts
**When** environment variables DATABASE_URL, JWT_SECRET, or CORS_ORIGIN are missing
**Then** the application fails to start with a clear validation error from Pydantic BaseSettings

### Story 1.3: Docker-Compose Orchestration with Hot Reload

As a developer,
I want to start the entire stack with a single `docker-compose up` command and have hot reload working,
So that I can develop efficiently without manual service management.

**Acceptance Criteria:**

**Given** the repository contains `docker-compose.yml`, `.env`, and `.env.example`
**When** the developer runs `docker-compose up`
**Then** three services start: frontend (port 5173), backend (port 8000), and db (PostgreSQL on port 5432)

**Given** all three services are running
**When** the developer modifies a frontend source file
**Then** Vite HMR reflects the change in the browser without a manual restart (FR28)

**Given** all three services are running
**When** the developer modifies a backend source file
**Then** Uvicorn auto-reloads and the API serves the updated code (FR28)

**Given** the PostgreSQL service uses a named Docker volume
**When** the developer runs `docker-compose down` and then `docker-compose up`
**Then** all database data persists across restarts (NFR12)

**Given** the `.env.example` file exists
**When** the developer copies it to `.env`
**Then** it contains all required environment variables (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, VITE_API_URL) with sensible development defaults

**Given** Alembic is configured in the backend
**When** the backend container starts
**Then** `alembic.ini` and `alembic/env.py` are present, configured to use SQLModel metadata and DATABASE_URL from the environment, and an entrypoint script runs migrations on startup

### Story 1.4: Project README and Documentation

As a developer,
I want a comprehensive README with setup instructions,
So that I can get the project running without prior context.

**Acceptance Criteria:**

**Given** the repository root contains `README.md`
**When** a developer reads it
**Then** it includes: project description, tech stack overview (React + Vite + Tailwind + shadcn/ui frontend, FastAPI + SQLModel backend, PostgreSQL), prerequisites (Docker, pnpm), setup instructions (clone, copy .env.example to .env, docker-compose up), environment variable documentation for each variable, and project directory structure overview (FR30)

**Given** the developer follows the README instructions from a fresh clone
**When** they execute the documented steps
**Then** the full stack starts successfully and the app is accessible at localhost:5173

---

## Epic 2: User Authentication & Secure Access

After this epic, a visitor can register an account, log in, and log out. The system manages JWT sessions via httpOnly cookies, protects all todo routes, handles session expiry gracefully, and enforces per-user data isolation.

### Story 2.1: User Registration

As a visitor,
I want to register a new account with my email and password,
So that I can start using the todo application.

**Acceptance Criteria:**

**Given** the User SQLModel (id, email, hashed_password, created_at) and its Alembic migration are created
**When** a visitor sends POST /api/auth/register with a valid email and password
**Then** the system creates a new user with the password hashed using bcrypt (cost factor >= 10), returns the user object (without password), and sets a signed JWT (HS256, 7-day expiry) in an httpOnly cookie (NFR5, NFR6)

**Given** a visitor sends POST /api/auth/register with an email that already exists
**When** the server processes the request
**Then** it returns 409 with `{ "detail": "Email already registered", "code": "EMAIL_ALREADY_EXISTS" }`

**Given** a visitor sends POST /api/auth/register with an invalid email or missing password
**When** the server processes the request
**Then** it returns 422 with `{ "detail": "...", "code": "VALIDATION_ERROR" }`

**Given** the frontend auth screen is displayed
**When** a visitor fills in the registration form (email + password) and submits
**Then** on success, the user is redirected to the main todo view; on error, an inline error message is displayed below the form

**Given** the auth screen component
**When** it renders
**Then** it supports toggling between Sign In and Sign Up modes

### Story 2.2: User Login with JWT Cookie

As a registered user,
I want to log in with my email and password,
So that I can access my todos securely.

**Acceptance Criteria:**

**Given** a registered user exists
**When** they send POST /api/auth/login with correct credentials
**Then** the server validates the password against the bcrypt hash, returns the user object (without password), and sets a signed JWT (HS256, 7-day expiry) in an httpOnly cookie (FR6)

**Given** a visitor sends POST /api/auth/login with incorrect credentials
**When** the server processes the request
**Then** it returns 401 with `{ "detail": "Invalid email or password", "code": "INVALID_CREDENTIALS" }`

**Given** the frontend login form
**When** a user submits valid credentials
**Then** the auth context is populated with the user object and the user is redirected to the main todo view

**Given** the frontend `api.ts` utility
**When** any HTTP request is made
**Then** it includes `credentials: 'include'` to send the httpOnly cookie automatically
**And** it transforms snake_case response keys to camelCase and camelCase request keys to snake_case

**Given** a JWT cookie exists in the browser
**When** the user refreshes the page or returns to the app
**Then** the app validates the session (GET /api/auth/me or equivalent) and populates auth context without requiring re-login

### Story 2.3: Logout and Per-User Data Isolation

As an authenticated user,
I want to log out securely and know my data is isolated from other users,
So that I can trust the application with my information.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they send POST /api/auth/logout
**Then** the server clears the httpOnly auth cookie and returns 200

**Given** the frontend
**When** the user clicks the logout action
**Then** the auth context is cleared and the user is redirected to the login screen (FR3)

**Given** the `get_current_user` FastAPI dependency
**When** it processes a request
**Then** it extracts the JWT from the httpOnly cookie, validates the signature and expiry, and returns the user_id for scoping all subsequent queries (FR5)

**Given** any protected API endpoint
**When** a request is made with a valid JWT
**Then** all database queries are scoped to the `user_id` from the JWT — a user can never access another user's data (FR5, NFR7)

**Given** application logging
**When** any request is processed
**Then** passwords, tokens, and JWT secrets are never included in log output (NFR9)

**Given** the backend CORS configuration
**When** a request arrives from an origin other than CORS_ORIGIN
**Then** the request is rejected (NFR10)

### Story 2.4: Auth Guard, Protected Routes, and 401 Handling

As a user,
I want the app to protect my data behind authentication and handle expired sessions gracefully,
So that I never see broken states or lose access unexpectedly.

**Acceptance Criteria:**

**Given** React Router is configured with two routes
**When** the app renders
**Then** `/login` is public and `/` is protected by the auth-guard component (FR4)

**Given** an unauthenticated user navigates to `/`
**When** the auth-guard evaluates
**Then** they are redirected to `/login` without any flash of protected content

**Given** a user's JWT has expired
**When** they make any API request
**Then** the server returns 401, the `api.ts` wrapper intercepts it, clears auth context, and redirects to `/login` (FR7)

**Given** a user has re-authenticated after session expiry
**When** they complete login
**Then** they are returned to the main todo list with their data intact (FR8)

**Given** any protected API endpoint
**When** a request arrives without a valid JWT cookie
**Then** the server returns 401 with `{ "detail": "Not authenticated", "code": "UNAUTHORIZED" }` (FR9)

---

## Epic 3: Todo Management & Core Interaction

After this epic, an authenticated user can create, view, complete, uncomplete, and delete todos with instant optimistic feedback. The UI handles empty, loading, and error states. Completed todos are visually distinct from active ones.

### Story 3.1: Todo CRUD API Endpoints

As an authenticated user,
I want API endpoints to create, read, update, and delete my todos,
So that my task data is managed and persisted on the server.

**Acceptance Criteria:**

**Given** the Todo SQLModel (id, user_id FK, description, is_completed, is_completed default false, created_at) and its Alembic migration are created
**When** an authenticated user sends GET /api/todos
**Then** the server returns an array of all todos belonging to that user, ordered by created_at descending (FR11)

**Given** an authenticated user
**When** they send POST /api/todos with `{ "description": "Buy milk" }`
**Then** the server creates a todo with is_completed=false and created_at set to current UTC time, scoped to the user_id from JWT, and returns the created todo object (FR10, FR16)

**Given** an authenticated user
**When** they send POST /api/todos with `{ "description": "" }` or missing description
**Then** the server returns 422 with `{ "detail": "Description cannot be empty", "code": "VALIDATION_ERROR" }` (FR15)

**Given** an authenticated user owns a todo
**When** they send PATCH /api/todos/{id} with `{ "is_completed": true }`
**Then** the server updates the todo and returns the updated object (FR12, FR13)

**Given** an authenticated user owns a todo
**When** they send DELETE /api/todos/{id}
**Then** the server deletes the todo and returns 204 (FR14)

**Given** an authenticated user
**When** they attempt PATCH or DELETE on a todo they don't own or that doesn't exist
**Then** the server returns 404 with `{ "detail": "Todo not found", "code": "TODO_NOT_FOUND" }`

**Given** all todo API responses
**When** they are returned
**Then** JSON uses snake_case keys, dates are ISO 8601 UTC strings, booleans are true/false, and IDs are integers
**And** API responses complete within 500ms under normal load (NFR3)

### Story 3.2: Todo List View with Active and Completed Sections

As an authenticated user,
I want to see all my todos organized into active and completed sections,
So that I can quickly scan what needs doing and what's done.

**Acceptance Criteria:**

**Given** the user has todos
**When** they land on the main view
**Then** a TanStack Query hook (useGetTodos with query key `["todos"]`) fetches todos and displays them in two sections: active todos at the top, completed todos below a separator (FR11)

**Given** completed todos are displayed
**When** they render in the completed section
**Then** they are visually distinguished from active todos with dimmed text (--color-text-muted) and strikethrough (FR19)

**Given** the `api.ts` fetch utility receives API responses
**When** it processes the response
**Then** it transforms snake_case keys to camelCase before returning data to frontend hooks

**Given** the TanStack Query client configuration
**When** query keys are structured
**Then** `["todos"]` supports targeted invalidation via `queryClient.invalidateQueries({ queryKey: ["todos"] })` after any mutation

### Story 3.3: Todo Creation via FAB with Optimistic Updates

As an authenticated user,
I want to create new todos via a floating action button that responds instantly,
So that capturing a thought feels frictionless.

**Acceptance Criteria:**

**Given** the main view
**When** it renders for an authenticated user
**Then** a FAB (floating action button) is displayed in the bottom-right area

**Given** the user clicks/taps the FAB
**When** the expansion activates
**Then** it reveals a text input field for entering a todo description

**Given** the FAB is expanded with text entered
**When** the user presses Enter or clicks submit
**Then** the FAB closes, the new todo appears in the active list immediately (optimistic update via useCreateTodo mutation with onMutate), and the API request fires in the background (FR10, FR17, NFR1)

**Given** an optimistic create was applied
**When** the server confirms the creation
**Then** the cache is revalidated via onSettled (invalidateQueries on `["todos"]`)

**Given** an optimistic create was applied
**When** the server returns an error
**Then** the optimistic item is rolled back via onError (restores cache snapshot) and a toast notification informs the user (FR18)

**Given** the FAB is expanded
**When** the user tries to submit an empty description
**Then** the submission is prevented and inline validation feedback appears (FR15)

**Given** the FAB is expanded
**When** the user presses Escape or clicks outside
**Then** the FAB collapses without creating a todo

### Story 3.4: Todo Completion Toggle with Optimistic Updates

As an authenticated user,
I want to mark todos as complete or undo completion with instant visual feedback,
So that managing my task status feels responsive and satisfying.

**Acceptance Criteria:**

**Given** an active todo is displayed
**When** the user clicks the checkbox
**Then** the item is immediately marked as completed (optimistic update via useUpdateTodo mutation with onMutate), visually dimmed with strikethrough, and moves to the completed section (FR12, FR17, NFR1)

**Given** a completed todo is displayed
**When** the user clicks the checkbox
**Then** the item is immediately marked as active (optimistic undo), visual treatment reverts, and the item moves back to the active section (FR13)

**Given** an optimistic completion toggle
**When** the server confirms the update via onSettled
**Then** the cache is revalidated to ensure sync with server state

**Given** an optimistic completion toggle
**When** the server returns an error via onError
**Then** the item reverts to its previous state (rollback from snapshot) and a toast notification appears (FR18)

**Given** any completion toggle
**When** it occurs
**Then** the UI reflects the change in under 100ms without blocking the main thread (NFR1, NFR4)

### Story 3.5: Todo Deletion with Optimistic Updates

As an authenticated user,
I want to delete todos I no longer need with instant feedback,
So that my list stays clean and focused.

**Acceptance Criteria:**

**Given** a todo item (active or completed)
**When** the user triggers the delete action
**Then** the item is immediately removed from the list (optimistic update via useDeleteTodo mutation with onMutate) and the API delete request fires in the background (FR14, FR17, NFR1)

**Given** an optimistic deletion
**When** the server confirms with 204 via onSettled
**Then** the cache is revalidated

**Given** an optimistic deletion
**When** the server returns an error via onError
**Then** the item reappears in its previous position (rollback from snapshot) and a toast notification informs the user (FR18)

**Given** a todo item
**When** the delete affordance is displayed
**Then** it is revealed on hover or focus on the todo item

### Story 3.6: Empty, Loading, and Error State Handling

As a user,
I want the application to clearly communicate its state at all times,
So that I'm never confused about what's happening.

**Acceptance Criteria:**

**Given** the user has no active todos
**When** the main view renders
**Then** an empty state message is displayed with welcoming copy (FR20)

**Given** the main view is loading todos for the first time
**When** the TanStack Query is in loading state (isLoading)
**Then** a skeleton loading placeholder is shown instead of the todo list (FR21)

**Given** a data fetch fails unrecoverably
**When** the TanStack Query is in error state (isError)
**Then** an inline error message is displayed explaining the issue with a recovery action (FR22)

**Given** any mutation (create, complete, delete) fails
**When** the onError callback fires
**Then** a toast notification appears with the error message

**Given** the backend is unavailable
**When** the frontend attempts to fetch or mutate data
**Then** the UI displays an error state rather than crashing or showing a white screen (NFR13)

---

## Epic 4: Design Polish, Responsiveness & Accessibility

After this epic, the application delivers a crafted, Apple-inspired experience with a full design token system, light/dark theming, spring-physics animations, responsive layout, and keyboard/screen-reader accessibility.

### Story 4.1: Design Token System and Typography

As a user,
I want a consistent, Apple-inspired visual design across the entire application,
So that the experience feels crafted and cohesive.

**Acceptance Criteria:**

**Given** the `src/index.css` file
**When** design tokens are implemented
**Then** CSS custom properties define the full color palette with light mode values (--color-bg: #FFFFFF, --color-bg-subtle: #F5F5F7, --color-border: #E0E0E5, --color-text: #1D1D1F, --color-text-muted: #6E6E73, --color-accent: #0066FF, --color-accent-soft: #0066FF1A) and semantic colors (destructive: #FF3B30, warning: #FF9500) (UX-DR1)

**Given** the Tailwind configuration
**When** the theme is extended
**Then** it references CSS custom properties as the single source of truth for colors, spacing, shadows, and border-radius (UX-DR1)

**Given** the spacing system
**When** applied to components
**Then** all values follow the 4px base unit scale (4, 8, 12, 16, 20, 24, 32, 48, 64) (UX-DR1)

**Given** the elevation system
**When** shadows are used
**Then** three levels exist (subtle, resting, elevated) as Tailwind shadow tokens; border-radius uses ~6-8px for cards and ~4px for inputs (UX-DR1)

**Given** the motion system
**When** the spring-physics easing is defined
**Then** `cubic-bezier(0.34, 1.56, 0.64, 1)` is available as a reusable CSS custom property or Tailwind utility (UX-DR1)

**Given** the typography system
**When** Inter is loaded via @fontsource/inter (weights 400, 500, 600) with fallback `system-ui, -apple-system, sans-serif`
**Then** the type scale is implemented: display (28px/600/lh 1.2), heading (20px/600/lh 1.3), body (16px/400/lh 1.5), body-medium (16px/500/lh 1.5), label (13px/500/lh 1.4), caption (12px/400/lh 1.4); letter-spacing: -0.01em on display/heading, +0.02em on all-caps labels (UX-DR20)

### Story 4.2: Light/Dark Mode Theming

As a user,
I want the app to support light and dark modes based on my system preference,
So that it's comfortable to use in any lighting condition.

**Acceptance Criteria:**

**Given** the theme-provider component
**When** it initializes on app mount
**Then** it detects the system preference via `prefers-color-scheme` and applies the matching theme (UX-DR2)

**Given** the `class` strategy for dark mode
**When** dark mode is active
**Then** a `dark` class is applied to the root element and a `data-theme` attribute is set for future user-preference override (UX-DR2)

**Given** dark mode is active
**When** CSS custom properties resolve
**Then** they switch to the dark palette: --color-bg: #000000, --color-bg-subtle: #1C1C1E, --color-border: #38383A, --color-text: #F5F5F7, --color-text-muted: #98989D, --color-accent: #4D9FFF, --color-accent-soft: #4D9FFF1A (UX-DR2)

**Given** any text/background combination in either mode
**When** contrast is measured
**Then** it meets WCAG AA minimum (4.5:1 ratio)

### Story 4.3: Todo Completion Animation Sequence

As a user,
I want the todo completion interaction to feel satisfying and precise,
So that checking off a task provides a sense of accomplishment.

**Acceptance Criteria:**

**Given** an active todo item
**When** the user hovers over the checkbox
**Then** the checkbox fills with accent color at 60% opacity and scales to 1.05 (UX-DR9)

**Given** the user clicks the checkbox
**When** the completion animation plays
**Then** the checkmark "draws" in with a path animation over 150ms (UX-DR9)

**Given** the check animation completes
**When** the text state updates simultaneously
**Then** the text dims to 50% opacity (--color-text-muted) and a strikethrough animates in (UX-DR9)

**Given** the item is marked complete
**When** it transitions to the completed section
**Then** it slides down with spring easing (cubic-bezier(0.34, 1.56, 0.64, 1)) over ~300ms (UX-DR9)

**Given** an item moves to the completed section
**When** the active list adjusts
**Then** remaining items reflow smoothly with layout animation — no visual jump (UX-DR9)

**Given** a completed item
**When** the user clicks the checkbox to undo completion
**Then** all animations reverse: item springs back to the active list, text restores full opacity, strikethrough removes, checkmark un-draws (UX-DR9)

**Given** the TodoItem component
**When** it manages visual states
**Then** it supports 4 states: active, completing (animation in progress), completed, deleting — each with distinct CSS treatment (UX-DR3)

### Story 4.4: FAB Design, Creation and Deletion Animations

As a user,
I want smooth animations for creating and deleting todos and an elegant FAB interaction,
So that every action feels polished and intentional.

**Acceptance Criteria:**

**Given** the FAB in idle state
**When** it renders
**Then** it appears as a circular button, bottom-right (24px from edges), accent-colored, with a `+` icon and 44px minimum touch target (UX-DR4)

**Given** the user taps the FAB
**When** the expansion animation plays
**Then** the FAB grows into an input panel with a spring scale animation; focus moves to the text input (UX-DR4)

**Given** the FAB expansion panel
**When** it closes (submit, Escape, or click-outside)
**Then** it shrinks back with the reverse spring animation; focus returns to the FAB button (UX-DR4)

**Given** no active todos exist (empty state)
**When** the FAB is displayed
**Then** it has a subtle pulse animation drawing attention to it (UX-DR4)

**Given** a new todo is created
**When** it appears in the active list
**Then** it fades in at the top over 200ms (UX-DR10)

**Given** a todo is deleted
**When** it is removed from the list
**Then** it collapses with a fade-out over 200ms (UX-DR11)

**Given** the user triggers delete on a todo
**When** the destructive confirmation appears
**Then** it expands inline below the item (not a modal) with a [Confirm delete] button that auto-dismisses after 5s if no action is taken (UX-DR12)

### Story 4.5: Auth Screen Visual Design and Page Transitions

As a user,
I want the auth screen to make a strong visual impression and transitions to feel smooth,
So that the first interaction with the app feels premium and trustworthy.

**Acceptance Criteria:**

**Given** the auth screen is displayed
**When** it renders
**Then** it shows a full-viewport frosted glass overlay using `backdrop-filter: blur()` with a single card containing logo/title, email input, password input, and submit button (UX-DR6)

**Given** the auth screen
**When** the user toggles between Sign In and Sign Up modes
**Then** the form transitions with an animation between the two states (UX-DR6)

**Given** the user completes authentication
**When** they are redirected to the main view
**Then** a full-page transition (fade or slide) animates between auth and main view (UX-DR18)

**Given** an authenticated user navigates to the app
**When** their session is valid
**Then** they bypass the auth screen entirely and land directly on the todo list

### Story 4.6: Component Polish — CompletedSection, EmptyState, and System Feedback

As a user,
I want polished secondary components that add personality and clarity,
So that every part of the app feels considered and complete.

**Acceptance Criteria:**

**Given** the CompletedSection component has completed todos
**When** it renders
**Then** it is collapsible with a count badge shown when collapsed, expanded by default, and the collapse preference is persisted in localStorage (UX-DR5)

**Given** completed items within the CompletedSection
**When** they render
**Then** they display with visually muted styling: dimmed text and lighter checkbox (UX-DR5)

**Given** no active todos exist
**When** the EmptyState component renders
**Then** it displays a single line of welcoming copy and a subtle arrow pointing toward the FAB — no illustrations (UX-DR7)

**Given** the browser loses network connectivity
**When** the OfflineIndicator component activates
**Then** a thin strip appears at the top of the viewport in warning color (#FF9500), auto-hides on reconnect, and never blocks content below (UX-DR8)

**Given** toast notifications are triggered
**When** they appear
**Then** they are positioned at bottom-center, auto-dismiss after 3s (general feedback) or 4s (network errors) (UX-DR19)

### Story 4.7: Responsive Layout, Button Hierarchy, and Form Patterns

As a user,
I want the app to look great on any device and have consistent interaction patterns,
So that I can use it comfortably on mobile and desktop.

**Acceptance Criteria:**

**Given** a mobile viewport (< 640px)
**When** the layout renders
**Then** content is full-width with 16px horizontal padding and the FAB is 16px from viewport edges (UX-DR15)

**Given** a tablet viewport (640–1024px)
**When** the layout renders
**Then** content is centered in a 640px max-width column with 32px padding (UX-DR15)

**Given** a desktop viewport (> 1024px)
**When** the layout renders
**Then** it matches the tablet layout — the single-column design does not widen further (UX-DR15)

**Given** any supported viewport
**When** the page renders
**Then** there is no horizontal scrolling and the layout is functional and polished (FR23)

**Given** the button system
**When** buttons are used across the app
**Then** four variants are available: Primary (filled accent, white text, max one per view), Secondary (outlined, accent text), Ghost (no border, muted text, for destructive/low-priority), Icon-only (44px target, tooltip on hover) (UX-DR14)

**Given** form fields (auth screen, FAB input)
**When** they are interacted with
**Then** labels are always visible (no placeholder-only labels), validation fires on blur, submit is always enabled, Enter submits single-field forms, Tab navigates between fields in multi-field forms (UX-DR13)

**Given** the initial page load for an authenticated user
**When** todos are being fetched
**Then** skeleton screens (not spinners) are displayed as loading placeholders (UX-DR17)

### Story 4.8: Keyboard Navigation, Screen Reader Support, and Accessibility

As a user with accessibility needs,
I want to navigate and use the app entirely via keyboard and screen reader,
So that the app is inclusive and usable regardless of input method.

**Acceptance Criteria:**

**Given** the todo list
**When** a user navigates with Tab
**Then** focus moves through interactive elements in a logical order: todo checkboxes, delete affordances, FAB, logout action (FR24)

**Given** a focused todo item checkbox
**When** the user presses Space
**Then** the completion state toggles (same as clicking the checkbox) (FR24)

**Given** the FAB is expanded
**When** focus management activates
**Then** focus moves to the text input field; when the FAB closes, focus returns to the FAB button (UX-DR16)

**Given** the FAB input is focused
**When** the user presses Enter
**Then** the todo is created; pressing Escape closes the FAB without creating (UX-DR16)

**Given** a todo is completed or uncompleted
**When** the state change occurs
**Then** an `aria-live="polite"` region announces the change to screen readers (UX-DR16)

**Given** custom checkboxes on todo items
**When** they render
**Then** they include `aria-checked` reflecting the current completion state (UX-DR16)

**Given** all interactive elements
**When** they render
**Then** they have a minimum touch target of 44x44px and visible focus rings (2px solid accent with 2px offset) in both light and dark modes (UX-DR16)

**Given** the user has `prefers-reduced-motion` enabled
**When** animations would normally play
**Then** all spring and transition animations are disabled and state changes are instant (UX-DR16)

---

## Epic 5: Category Organization

After this epic, an authenticated user can create, rename, and delete custom categories, assign any todo to a category, and see their todos organized into collapsible category sections in the main list view. The category management panel provides full CRUD, and the FAB includes a category selector for new todos.

### Story 5.1: Category & Todo Metadata Backend

As a developer,
I want category CRUD API endpoints and an expanded todo model with category, deadline, and priority fields,
So that the frontend can build organizational features on a complete backend.

**Acceptance Criteria:**

**Given** the Category SQLModel (id, user_id FK, name, created_at) with unique constraint on (user_id, name) and its Alembic migration
**When** the migration runs
**Then** the `categories` table is created with index `idx_categories_user_id` on user_id, and the `todos` table is expanded with: `category_id` (FK to categories, nullable, ON DELETE SET NULL), `deadline` (date, nullable), `priority` (integer 1-5, nullable), plus indexes `idx_todos_category_id` and `idx_todos_deadline`

**Given** an authenticated user sends GET /api/categories
**When** the server processes the request
**Then** it returns an array of all categories belonging to that user, ordered by name (FR36)

**Given** an authenticated user sends POST /api/categories with `{ "name": "Work" }`
**When** the server processes the request
**Then** it creates the category scoped to the user and returns the created object (FR31)

**Given** an authenticated user sends POST /api/categories with an empty name or a name that already exists for that user
**When** the server processes the request
**Then** it returns 409 with `{ "detail": "...", "code": "DUPLICATE_CATEGORY_NAME" }` or 422 with `VALIDATION_ERROR` (FR37)

**Given** an authenticated user owns a category
**When** they send PATCH /api/categories/{id} with `{ "name": "Personal" }`
**Then** the server renames the category and returns the updated object; rejects empty or duplicate names (FR32, FR37)

**Given** an authenticated user owns a category with 5 assigned todos
**When** they send DELETE /api/categories/{id}
**Then** the server deletes the category, sets `category_id = NULL` on all 5 affected todos, and returns `{ "affected_todos": 5 }` (FR33)

**Given** an authenticated user sends POST /api/todos with `{ "description": "Buy milk", "category_id": 1, "deadline": "2026-04-20", "priority": 2 }`
**When** the server processes the request
**Then** it creates the todo with all optional fields populated and returns the full object including category_id, deadline, and priority (FR10 expanded)

**Given** an authenticated user sends PATCH /api/todos/{id} with `{ "category_id": 2 }` or `{ "category_id": null }`
**When** the server processes the request
**Then** it updates the category assignment (or removes it) and returns the updated todo (FR34, FR35)

**Given** an authenticated user attempts to access or modify another user's categories
**When** the server processes the request
**Then** it returns 404 with `CATEGORY_NOT_FOUND` — no data leakage (FR36)

### Story 5.2: Category Management Frontend

As an authenticated user,
I want a category management panel where I can create, rename, and delete my categories,
So that I can organize my task structure.

**Acceptance Criteria:**

**Given** the `use-categories` hook
**When** it is initialized
**Then** it provides useGetCategories (query key `["categories"]`), useCreateCategory, useRenameCategory, and useDeleteCategory — each mutation following the three-step optimistic pattern (onMutate → onError → onSettled)

**Given** the app header
**When** it renders for an authenticated user
**Then** a gear icon is displayed that opens the CategoryManagementPanel (UX-DR23)

**Given** the user clicks the gear icon
**When** the CategoryManagementPanel opens
**Then** it slides in from the right (320px on desktop, full-width sheet on mobile) with a frosted glass backdrop, showing all categories with an "Add category" input at the top (UX-DR23)

**Given** the user types a category name and submits in the panel
**When** the category is created
**Then** it appears immediately in the list (optimistic update), the server syncs in the background, and the input clears (FR31, FR17 expanded)

**Given** the user clicks a category name in the panel
**When** inline rename activates (click-to-edit)
**Then** the name becomes an editable input; on blur or Enter the rename is saved optimistically; empty or duplicate names show inline validation error (FR32, FR37)

**Given** the user clicks the delete button on a category
**When** the inline confirmation appears ("This will uncategorize X todos. Remove?" with [Cancel][Remove])
**Then** clicking [Remove] deletes the category optimistically, invalidates both `["categories"]` and `["todos"]` query keys, and the affected todo count reflects the server response (FR33)

**Given** the CategoryManagementPanel is open
**When** the user clicks outside or presses Escape
**Then** the panel closes with a reverse slide animation

### Story 5.3: Category Assignment, Display & All View Sections

As an authenticated user,
I want to assign categories to todos and see my list organized into collapsible category sections,
So that I can visually group and manage related tasks.

**Acceptance Criteria:**

**Given** the FAB creation panel is expanded
**When** it renders
**Then** a category dropdown selector appears in the optional selectors row below the text input; selecting a category is optional — submitting with only text creates an uncategorized todo (UX-DR29, FR34)

**Given** the user creates a todo with a category selected in the FAB
**When** the todo is created
**Then** it appears in the correct category section in the All view (FR34, FR10 expanded)

**Given** the FAB selectors
**When** the user creates multiple todos with the same category
**Then** the category selector remembers the last-used value within the session; the memory is cleared on page refresh (UX-DR29)

**Given** a todo item in a non-"All" view (Due This Week or By Deadline)
**When** it has a category assigned
**Then** a category chip is displayed (caption size, `--color-bg-subtle` background, `--color-text-muted` text, 4px border-radius); no chip for uncategorized todos (UX-DR31, FR46)

**Given** a todo item's category chip (in non-"All" views) or category assignment
**When** the user clicks it
**Then** a compact popover opens anchored to the element with a category dropdown (same as FAB), selection applies optimistically, Escape or click-outside dismisses without change (UX-DR30, FR35)

**Given** the All Todos view
**When** it renders with categorized todos
**Then** todos are grouped under collapsible CategorySectionHeader dividers: each header shows category name (heading weight), todo count badge (right-aligned), and collapse chevron (far right); uncategorized todos appear in an "Uncategorized" section at the top; completed todos remain in the "Completed" section at the bottom regardless of category; empty categories are hidden (UX-DR22, UX-DR34)

**Given** a CategorySectionHeader
**When** the user clicks the collapse chevron
**Then** the section collapses/expands with a smooth 200ms height animation; collapse state is persisted in localStorage per category ID (UX-DR22)

**Given** a category is deleted (via management panel)
**When** affected todos lose their category_id
**Then** they animate to the "Uncategorized" section in the All view (UX-DR34)

---

## Epic 6: Priority & Deadline Management

After this epic, an authenticated user can set priority levels (1–5) and deadlines on any todo, see expressive priority color indicators and smart deadline labels, spot overdue items at a glance, and use the fully extended FAB creation panel with all metadata selectors.

### Story 6.1: Priority System — Tokens, Indicator & Inline Edit

As an authenticated user,
I want to set priority levels (1–5) on my todos and see expressive color indicators,
So that I can visually distinguish urgency at a glance.

**Acceptance Criteria:**

**Given** the design token system (`src/index.css`)
**When** priority color tokens are implemented
**Then** CSS custom properties define 5 priority colors for both light and dark modes: `--color-priority-1` (red #FF3B30 / #FF453A), `--color-priority-2` (orange #FF9500 / #FF9F0A), `--color-priority-3` (yellow #FFCC00 / #FFD60A), `--color-priority-4` (blue #0066FF / #4D9FFF), `--color-priority-5` (gray #98989D / #636366) (UX-DR25)

**Given** a todo item with a priority level set
**When** it renders
**Then** a PriorityIndicator displays as a 3px solid left border in the corresponding `--color-priority-{n}` color; todos without a priority have no left border (UX-DR24, FR46)

**Given** the FAB creation panel is expanded
**When** it renders
**Then** a priority dropdown selector appears in the optional selectors row, showing colored dots with labels (e.g. "P1 Urgent", "P2 High"); selection is optional — submitting without priority creates an unprioritized todo (UX-DR29, FR40, FR42)

**Given** the user creates multiple todos with the same priority
**When** the FAB re-opens
**Then** the priority selector remembers the last-used value within the session (UX-DR29)

**Given** a todo item's priority indicator
**When** the user clicks it
**Then** a compact popover opens anchored to the indicator with the priority dropdown (same as FAB); selecting a new level applies optimistically via useUpdateTodo; Escape or click-outside dismisses without change (UX-DR30, FR41)

**Given** a todo with priority set
**When** the user selects "None" or clears the priority in the inline edit popover
**Then** the priority is removed optimistically, the left border disappears, and the server syncs in the background (FR41, FR42)

**Given** any priority change (set, change, or remove)
**When** the mutation fires
**Then** the three-step optimistic pattern applies: onMutate (snapshot + optimistic cache write), onError (rollback + toast), onSettled (invalidate `["todos"]`) (FR17 expanded)

**Given** the priority indicator border color
**When** priority changes
**Then** the left border color transitions smoothly over 150ms (UX feedback pattern)

### Story 6.2: Deadline System — Label, Overdue Treatment & Inline Edit

As an authenticated user,
I want to set deadlines on my todos, see smart date labels, and have overdue items visually flagged,
So that I can track time-sensitive work and never miss a due date.

**Acceptance Criteria:**

**Given** the design token system
**When** overdue tokens are implemented
**Then** CSS custom properties define `--color-overdue-text` (#FF3B30 / #FF453A) and `--color-overdue-bg` (#FF3B300D / #FF453A0D, 5% opacity) for both light and dark modes (UX-DR27)

**Given** a todo item with a deadline set
**When** it renders
**Then** a DeadlineLabel displays right-aligned within the todo item at caption size (12px, `--color-text-muted`), with smart formatting: "Today" (slightly bold), "Tomorrow", day name for this week (e.g. "Thursday"), short date for beyond (e.g. "Apr 23"), or "Overdue · Apr 10" in red for past deadlines (UX-DR26, FR46)

**Given** a todo with a deadline in the past (overdue)
**When** it renders
**Then** the deadline label uses `--color-overdue-text` (red), the todo item background is tinted with `--color-overdue-bg` (5% opacity red), and the priority left-border indicator remains unchanged — overdue and priority are independent visual signals (UX-DR27, FR47)

**Given** the FAB creation panel is expanded
**When** it renders
**Then** a date picker selector appears in the optional selectors row; selection is optional — submitting without a deadline creates a todo with no deadline (UX-DR29, FR38, FR42)

**Given** the user selects a date in the FAB date picker
**When** quick-select options are displayed above the calendar
**Then** "Today", "Tomorrow", "Next Week", and "Clear" options are available for fast selection (UX-DR26)

**Given** a todo item's deadline label
**When** the user clicks it
**Then** a compact popover opens anchored to the label with the same date picker as the FAB panel; selecting a new date applies optimistically; Escape or click-outside dismisses without change (UX-DR30, FR39)

**Given** a todo with a deadline set
**When** the user selects "Clear" in the inline date picker or removes the deadline
**Then** the deadline is removed optimistically, the label disappears, and any overdue treatment is cleared (FR39, FR42)

**Given** any deadline change (set, change, or remove)
**When** the mutation fires
**Then** the three-step optimistic pattern applies: onMutate (snapshot + optimistic cache write), onError (rollback + toast), onSettled (invalidate `["todos"]`) (FR17 expanded)

**Given** a todo without a deadline
**When** it renders
**Then** no deadline label is shown — the todo is a first-class citizen without metadata (FR42)

---

## Epic 7: Multi-View Navigation

After this epic, the application provides three views — All Todos, Due This Week, and By Deadline — letting the user see their tasks from different perspectives with a single-tap view switcher. The Due This Week view surfaces upcoming priority-sorted tasks, and the By Deadline view groups todos by temporal proximity.

### Story 7.1: View Switcher & Due This Week View

As an authenticated user,
I want a view switcher and a "Due This Week" view that shows my upcoming priority-sorted tasks,
So that I can focus on what matters most this week.

**Acceptance Criteria:**

**Given** the main view for an authenticated user
**When** it renders
**Then** a ViewSwitcher component (segmented tab bar) appears below the app header with three pill-style segments: "All" | "This Week" | "By Deadline"; the active tab uses accent fill background with white text; inactive tabs use ghost style with muted text (UX-DR21)

**Given** the user taps a view tab
**When** the view switches
**Then** the content area transitions with a 150ms fade — no page navigation, no API call; the switch is a client-side filter on cached `["todos"]` data (UX-DR21)

**Given** the active view
**When** the URL is checked
**Then** the view state is persisted as a URL query param (`?view=all|week|deadline`); browser back/forward navigates between previously visited views (UX-DR21)

**Given** a narrow viewport (mobile)
**When** the ViewSwitcher renders
**Then** tab labels abbreviate to "All" / "Week" / "Deadline" to fit; all three remain visible (UX-DR21)

**Given** the user selects the "This Week" tab
**When** the Due This Week view renders
**Then** it displays a flat list (no section dividers, no category grouping) of only active (non-completed) todos with deadlines within the next 7 calendar days (FR43, UX-DR32)

**Given** the Due This Week view has todos
**When** they are sorted
**Then** the order is: priority P1 first → P2 → P3 → P4 → P5 → no priority last; within the same priority level, sorted by deadline earliest first (FR44, UX-DR32)

**Given** a todo in the Due This Week view
**When** it renders
**Then** it shows its priority indicator (left border), deadline label, and category chip (UX-DR32, FR46)

**Given** the user has no active todos due within 7 days
**When** the Due This Week view renders
**Then** an empty state displays "Nothing due this week" with a subtle checkmark (UX-DR32)

**Given** the Due This Week view
**When** it returns results
**Then** the client-side filtering and sorting completes in under 500ms (NFR14) — this is a TanStack Query `select` transform on cached data, expected to be sub-millisecond

**Given** the "All" tab is selected
**When** the view renders
**Then** it displays the existing category-section layout from Epic 5 — this is the default view (FR45, UX-DR34)

### Story 7.2: By Deadline View

As an authenticated user,
I want a "By Deadline" view that groups my todos by temporal proximity,
So that I can see a time-based picture of what's coming up.

**Acceptance Criteria:**

**Given** the user selects the "By Deadline" tab
**When** the view renders
**Then** all active todos are displayed grouped under DeadlineGroupHeader section dividers with temporal labels: "Overdue", "Today", "Tomorrow", "This Week", "Later", "No Deadline" (UX-DR28, UX-DR33)

**Given** the "Overdue" group in the By Deadline view
**When** it contains todos with past deadlines
**Then** the DeadlineGroupHeader has a subtle red background tint to indicate urgency (UX-DR28)

**Given** todos within any temporal group
**When** they are sorted
**Then** the order is by priority (P1 first → P5 → no priority last) within each group (UX-DR33)

**Given** a todo in the By Deadline view
**When** it renders
**Then** it shows its priority indicator (left border), category chip, and full date (UX-DR33, FR46)

**Given** a temporal group has no todos
**When** the By Deadline view renders
**Then** that group and its header are hidden — no empty sections clutter the view (UX-DR33)

**Given** the By Deadline view
**When** completed todos exist
**Then** they appear in a "Completed" section at the bottom of the view, consistent with the All view behavior (UX-DR33)

**Given** the DeadlineGroupHeader component
**When** it renders
**Then** it uses the same visual style as CategorySectionHeader (heading weight, count badge, 1px bottom border) but with temporal labels instead of category names (UX-DR28)
