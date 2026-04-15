---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
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
FR10: An authenticated user can create a new todo by providing a text description
FR11: An authenticated user can view all their todos — both active and completed
FR12: An authenticated user can mark a todo as complete
FR13: An authenticated user can mark a completed todo as active (undo completion)
FR14: An authenticated user can delete a todo permanently
FR15: The system prevents creation of a todo with an empty description
FR16: Todo creation time is recorded and associated with each item
FR17: The UI reflects write operations (create, complete, delete) immediately, before server confirmation
FR18: If a write operation fails server-side, the UI rolls back to the previous state and notifies the user
FR19: Completed todos are visually distinguished from active todos at a glance
FR20: The application displays a purposeful empty state when the user has no todos
FR21: The application displays a loading state while data is being fetched
FR22: The application displays an error state when a data operation fails unrecoverably
FR23: The application layout is functional and polished on mobile and desktop viewports
FR24: Core flows are operable via keyboard navigation
FR25: The frontend is buildable and runnable as a standalone Docker container
FR26: The backend is buildable and runnable as a standalone Docker container
FR27: A `docker-compose.yml` starts the full stack (frontend, backend, database) with a single command
FR28: The local development setup supports hot reload for frontend and backend changes
FR29: The frontend renders using standard DOM elements compatible with MCP-based browser inspection tools
FR30: The repository includes a README with setup instructions, environment variable documentation, and local development steps

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
FR10: Epic 3 — Todo creation API endpoint and UI
FR11: Epic 3 — Todo list view (active + completed)
FR12: Epic 3 — Mark todo as complete
FR13: Epic 3 — Mark completed todo as active (undo)
FR14: Epic 3 — Delete todo permanently
FR15: Epic 3 — Empty description validation
FR16: Epic 3 — Todo creation timestamp
FR17: Epic 3 — Optimistic UI updates on write operations
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
