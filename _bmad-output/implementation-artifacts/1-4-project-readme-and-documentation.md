# Story 1.4: Project README and Documentation

Status: done

## Story

As a developer,
I want a comprehensive README with setup instructions and a convenience Makefile,
so that I can get the project running without prior context and drive common workflows with a single command.

## Acceptance Criteria

1. **Given** the repository root contains `README.md` **When** a developer reads it **Then** it includes: project description, tech stack overview (React + Vite + Tailwind + shadcn/ui frontend, FastAPI + SQLModel backend, PostgreSQL), prerequisites (Docker, pnpm), setup instructions (clone, copy `.env.example` to `.env`, `docker compose up`), environment variable documentation for each variable, and project directory structure overview (FR30)

2. **Given** the developer follows the README instructions from a fresh clone **When** they execute the documented steps **Then** the full stack starts successfully and the app is accessible at `http://localhost:5173`

3. **Given** the repository root contains a `Makefile` (user-requested extension to Story 1.4 scope) **When** a developer runs any of the documented `make` targets **Then** the stack and dev workflows can be driven without typing long docker-compose invocations

## Tasks / Subtasks

- [x] Task 1: Create `README.md` at project root (AC: #1, #2)
  - [x] 1.1 Create `README.md` at project root with the following sections, in this order:
    1. **Project title and one-line description** -- e.g., "A minimal, crafted Todo web app (React + FastAPI + Postgres)"
    2. **Tech Stack** -- tables or bullets for Frontend, Backend, Database, Infrastructure (see template below)
    3. **Prerequisites** -- Docker Desktop (or compatible daemon), pnpm 10.x (only needed for frontend lockfile updates; not required to run the app); no Python or Node required on the host -- everything runs in containers
    4. **Quick Start** -- exact copy-pasteable commands: clone, `cp .env.example .env`, `make up` (or `docker compose up --build`), then URLs
    5. **Environment Variables** -- table with name, purpose, and example value for each variable in `.env.example`
    6. **Project Structure** -- annotated tree showing top-level layout (frontend/, backend/, docker-compose.yml, etc.)
    7. **Make Targets** -- table listing each Makefile target with description
    8. **Development Workflow** -- how HMR works for frontend and backend, where migrations live, how to run alembic commands
    9. **Troubleshooting** -- known issues: Docker Desktop daemon flakiness (restart Docker Desktop), pnpm lockfile drift after `package.json` edits (run `pnpm install` to regenerate)
  - [x] 1.2 Use the URLs `http://localhost:5173` (frontend), `http://localhost:8000` (backend), `http://localhost:8000/docs` (Swagger UI)
  - [x] 1.3 Keep the tone pragmatic and direct -- no marketing copy, no emojis, no "Why this matters" sections

- [x] Task 2: Create `Makefile` at project root (AC: #3)
  - [x] 2.1 Create `Makefile` at project root with these targets (use `.PHONY` for all):
    - **`help`** (default) -- prints a formatted list of all available targets with descriptions
    - **`up`** -- `docker compose up -d --build` (start stack, detached, rebuild if needed)
    - **`up-logs`** -- `docker compose up --build` (foreground, shows live logs)
    - **`down`** -- `docker compose down` (stops containers; preserves volumes)
    - **`reset`** -- `docker compose down -v` (stops AND WIPES volumes; DANGEROUS)
    - **`logs`** -- `docker compose logs -f` (tail all service logs)
    - **`logs-backend`** -- `docker compose logs -f backend`
    - **`logs-frontend`** -- `docker compose logs -f frontend`
    - **`logs-db`** -- `docker compose logs -f db`
    - **`ps`** -- `docker compose ps`
    - **`shell-backend`** -- `docker compose exec backend /bin/sh` (interactive shell in backend container)
    - **`shell-db`** -- `docker compose exec db psql -U todo -d todo_app` (psql shell)
    - **`migrate`** -- `docker compose exec backend alembic upgrade head`
    - **`migration`** -- `docker compose exec backend alembic revision --autogenerate -m "$(name)"` (usage: `make migration name="add users table"`)
    - **`install-frontend`** -- `cd frontend && pnpm install` (regenerates lockfile when package.json changes)
    - **`lint-frontend`** -- `docker compose exec frontend pnpm lint`
    - **`typecheck-frontend`** -- `docker compose exec frontend pnpm typecheck`
    - **`clean`** -- `docker compose down -v --rmi local` (wipe containers, volumes, local images)
  - [x] 2.2 Set `.DEFAULT_GOAL := help` so `make` with no args prints help
  - [x] 2.3 Use `@` prefix on echo commands so Make doesn't echo them before running
  - [x] 2.4 Document each target with a comment using the pattern `target: ## description` (so help can auto-extract)

- [x] Task 3: Update root `.gitignore` if needed (AC: #2)
  - [x] 3.1 Verify `.gitignore` still has `.env` (shouldn't be committed); `.env.example` must NOT be in gitignore
  - [x] 3.2 (Optional) add OS-specific entries if missing: `.DS_Store` already present; consider `Thumbs.db` for Windows contributors

- [x] Task 4: Smoke-test the documented Quick Start (AC: #2, #3)
  - [x] 4.1 Tear down any existing state: `docker compose down -v` (wipe volumes for a clean fresh-clone simulation)
  - [x] 4.2 Follow the README's Quick Start verbatim: `cp .env.example .env` (already in place -- verify), then `make up`
  - [x] 4.3 Verify frontend reachable at `http://localhost:5173` (HTTP 200 + HTML with `<div id="root">`)
  - [x] 4.4 Verify backend reachable at `http://localhost:8000/` (returns `{"status":"ok"}`) and `/docs` (Swagger UI)
  - [x] 4.5 Run `make ps` -- confirm 3 services Up, db healthy, backend healthy
  - [x] 4.6 Run `make help` -- confirm targets are listed cleanly
  - [x] 4.7 Run `make shell-db` and exit cleanly (verifies psql access)
  - [x] 4.8 Run `make down` -- confirm clean shutdown

### Review Findings

- [x] [Review][Decision] shadcn/ui claim vs Base UI reality — kept "shadcn/ui v4 components" (how shadcn describes its v4 stack; shadcn CLI was used to scaffold).
- [x] [Review][Decision] VITE_API_URL description accuracy — deferred; already tracked in deferred-work.md from Story 1.3 review.
- [x] [Review][Patch] Intro describes unimplemented features as current + marketing copy — removed "authenticated" from one-liner; removed marketing copy paragraph. [README.md:3-5]
- [x] [Review][Patch] `_bmad/` directory missing from Project Structure tree — added `_bmad/` entry to annotated tree. [README.md]
- [x] [Review][Patch] `make shell-db` hardcodes credentials instead of reading from env — Makefile now reads `POSTGRES_USER` and `POSTGRES_DB` from `.env` with `todo`/`todo_app` as fallback defaults. [Makefile]
- [x] [Review][Patch] No guidance that stack must be running before `make migrate` / `make migration` — added blockquote note to Development Workflow section. [README.md]
- [x] [Review][Patch] `JWT_SECRET` min length 1 documented without production security guidance — updated env var table to say "use a strong random value (32+ chars) in production". [README.md]
- [x] [Review][Defer] `shell-backend` /bin/sh assumption — `python:3.12-slim` includes `/bin/sh`; safe now but an undocumented assumption that could break if the base image changes. [Makefile:38] — deferred, pre-existing
- [x] [Review][Defer] Frontend healthcheck tight coupling to backend `/` endpoint — frontend depends on backend healthcheck; the healthcheck pings `http://localhost:8000/` which must remain stable. [docker-compose.yml] — deferred, pre-existing
- [x] [Review][Defer] Anonymous volumes (`node_modules`, `.venv`) purged on `docker compose down` — README says "data persists" via `postgres_data` volume; this does not extend to anonymous volumes, which are recreated on next `up`. [docker-compose.yml] — deferred, pre-existing
- [x] [Review][Defer] Backend `entrypoint.sh` lacks migration retry logic — `alembic upgrade head` runs immediately after the db healthcheck passes with no retry for transient connection failures. [backend/entrypoint.sh] — deferred, pre-existing
- [x] [Review][Defer] `CORS_ORIGIN` single-origin behavior undocumented — Backend enforces a single CORS origin; no documentation of what happens if a user tries to configure multiple origins. [backend] — deferred, pre-existing

## Dev Notes

### Critical Architecture Constraints

- **Documentation tone:** Pragmatic and direct. No emojis, no marketing copy. The target reader is a developer evaluating or resuming work on this codebase.
- **Do NOT create files in any subdirectory** for this story -- this is a root-level documentation + Makefile story. The only exceptions are potential tiny README-link pointers in frontend/ or backend/ if they don't already have READMEs (they do -- Vite scaffolded `frontend/README.md`; leave it alone).
- **Quick Start must match reality:** Anything in the README must be an exact command that works. No "for example" pseudo-code for the Quick Start.
- **Environment variable table must be exhaustive:** Every variable in `.env.example` must appear in the README's env var table.

[Source: architecture.md#Requirements to Structure Mapping]

### README Template (use as a skeleton)

```markdown
# bmad_nf_todo_app

A minimal, crafted Todo web app — single-user, authenticated, full-stack, containerized.

Built as a portfolio piece demonstrating production-grade full-stack engineering: secure auth, optimistic UI, persistent storage, and single-command local development.

## Tech Stack

**Frontend** — React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui v4 components
**Backend** — FastAPI ~0.135, SQLModel, Alembic, Python 3.12
**Database** — PostgreSQL 16
**Infrastructure** — Docker Compose (dev + prod image builds)

## Prerequisites

- **Docker Desktop** (or any compatible Docker daemon) with Compose v2
- **pnpm 10.x** — only required if you need to regenerate the frontend lockfile after editing `package.json`. Not needed to run the app.

No Python, Node, or Postgres installation required on the host — everything runs in containers.

## Quick Start

```sh
git clone <repo-url>
cd bmad_nf_todo_app
cp .env.example .env
make up         # or: docker compose up -d --build
```

Once all services are healthy:

- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:8000
- **Swagger UI** → http://localhost:8000/docs

Stop the stack: `make down`

## Environment Variables

All variables are defined in `.env.example`. Copy it to `.env` and override as needed.

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string used by backend | `postgresql://todo:todo@db:5432/todo_app` |
| `JWT_SECRET` | HS256 signing key for auth tokens (min length 1) | `dev-secret-change-me-in-production` |
| `CORS_ORIGIN` | Allowed origin for browser requests | `http://localhost:5173` |
| `VITE_API_URL` | Backend URL consumed by frontend at build time | `http://localhost:8000` |
| `POSTGRES_USER` | Postgres container init user | `todo` |
| `POSTGRES_PASSWORD` | Postgres container init password | `todo` |
| `POSTGRES_DB` | Postgres container init database name | `todo_app` |

**Note:** The hostname `db` in `DATABASE_URL` is the Docker Compose service name. Accessing Postgres from your host machine uses `localhost:5432`.

## Project Structure

```
bmad_nf_todo_app/
├── docker-compose.yml           # 3-service stack: db, backend, frontend
├── Makefile                     # Convenience targets (see `make help`)
├── .env.example                 # Template; copy to .env
├── frontend/                    # React + Vite + Tailwind + shadcn/ui
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── backend/                     # FastAPI + SQLModel + Alembic
│   ├── Dockerfile
│   ├── entrypoint.sh            # Runs `alembic upgrade head` then uvicorn
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py              # FastAPI app factory
│   │   ├── core/config.py       # Pydantic BaseSettings (env-driven)
│   │   ├── models/              # SQLModel definitions (populated in later stories)
│   │   └── routers/             # Route handlers (populated in later stories)
│   └── alembic/                 # Database migrations
└── _bmad-output/                # Planning artifacts (not deployed)
```

## Make Targets

Run `make help` (or just `make`) for the full list. Highlights:

| Target | Description |
|---|---|
| `make up` | Start the full stack (detached, auto-build) |
| `make up-logs` | Same as `up` but foreground with live logs |
| `make down` | Stop containers (preserves data volumes) |
| `make reset` | Stop AND wipe all data (⚠ destroys Postgres volume) |
| `make logs` | Tail logs from all services |
| `make logs-backend` / `make logs-frontend` / `make logs-db` | Tail specific service |
| `make ps` | Show service status |
| `make shell-backend` | Interactive `/bin/sh` in backend container |
| `make shell-db` | psql shell in db container |
| `make migrate` | Run Alembic `upgrade head` |
| `make migration name="<description>"` | Generate autogenerated migration |
| `make install-frontend` | Run `pnpm install` in `frontend/` (regenerates lockfile) |
| `make lint-frontend` | Run ESLint inside the frontend container |
| `make typecheck-frontend` | Run `tsc --noEmit` inside the frontend container |
| `make clean` | Wipe containers, volumes, and local images |

## Development Workflow

**Hot reload** is enabled for both services when running via Docker Compose:
- Edits to `frontend/src/**` trigger Vite HMR; updates reflect in the browser within ~1 second
- Edits to `backend/app/**` trigger Uvicorn reload; the API serves updated code within ~2 seconds
- PostgreSQL data persists across `docker compose down`/`up` cycles via the named `postgres_data` volume

**Database migrations:**

```sh
# After adding or changing a SQLModel in backend/app/models/:
make migration name="add users table"
# Review the generated file in backend/alembic/versions/, then:
make migrate
```

Migrations also run automatically on backend container startup (via `entrypoint.sh`).

## Troubleshooting

- **`docker compose up` fails with "Cannot connect to Docker daemon":** Start Docker Desktop and retry. On macOS, Docker Desktop can occasionally disconnect — a full restart of the app resolves it.
- **`pnpm install --frozen-lockfile` fails in the frontend build:** `package.json` was edited without regenerating the lockfile. Run `make install-frontend` then retry `make up`.
- **Backend exits immediately on startup with `ValidationError`:** One of `DATABASE_URL`, `JWT_SECRET`, or `CORS_ORIGIN` is missing or empty in `.env`. Copy `.env.example` and ensure all values are set.
- **Migrations fail with "permission denied":** Ensure the backend container user can connect to Postgres — verify `POSTGRES_USER`/`POSTGRES_PASSWORD` in `.env` match `DATABASE_URL` credentials.

## License

Portfolio project — license TBD.
```

### Makefile Template

```makefile
.DEFAULT_GOAL := help
.PHONY: help up up-logs down reset logs logs-backend logs-frontend logs-db ps \
        shell-backend shell-db migrate migration install-frontend \
        lint-frontend typecheck-frontend clean

help: ## Show this help message
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

up: ## Start the full stack (detached, auto-build)
	docker compose up -d --build

up-logs: ## Start the stack in the foreground with live logs
	docker compose up --build

down: ## Stop containers (preserves data volumes)
	docker compose down

reset: ## Stop containers AND wipe all data volumes (DESTRUCTIVE)
	docker compose down -v

logs: ## Tail logs from all services
	docker compose logs -f

logs-backend: ## Tail logs from the backend service
	docker compose logs -f backend

logs-frontend: ## Tail logs from the frontend service
	docker compose logs -f frontend

logs-db: ## Tail logs from the db service
	docker compose logs -f db

ps: ## Show service status
	docker compose ps

shell-backend: ## Interactive /bin/sh inside the backend container
	docker compose exec backend /bin/sh

shell-db: ## psql shell inside the db container
	docker compose exec db psql -U todo -d todo_app

migrate: ## Run Alembic upgrade head (apply pending migrations)
	docker compose exec backend alembic upgrade head

migration: ## Generate an autogenerated migration (usage: make migration name="add users")
	@if [ -z "$(name)" ]; then echo "Error: name is required. Usage: make migration name=\"<description>\""; exit 1; fi
	docker compose exec backend alembic revision --autogenerate -m "$(name)"

install-frontend: ## Run pnpm install in frontend/ (regenerate lockfile after package.json edits)
	cd frontend && pnpm install

lint-frontend: ## Run ESLint inside the frontend container
	docker compose exec frontend pnpm lint

typecheck-frontend: ## Run tsc --noEmit inside the frontend container
	docker compose exec frontend pnpm typecheck

clean: ## Wipe containers, volumes, and locally-built images (DESTRUCTIVE)
	docker compose down -v --rmi local
```

### Previous Story Intelligence (Stories 1.1 - 1.3)

- **docker-compose.yml now has restart policies and frontend healthcheck dependency** (added in 1.3 code review). These behaviors should be mentioned briefly in the README's Development Workflow section -- specifically: "services auto-restart on transient crashes" and "frontend waits for backend to be healthy before starting."
- **Frontend lockfile drift is a real failure mode** (observed in 1.3). The Troubleshooting section must call this out.
- **Docker Desktop daemon has been unstable on this host.** The README's Troubleshooting section addresses this without being alarmist -- "restart Docker Desktop" is the pragmatic fix.
- **POST-1.3 state of env vars:** Pydantic settings now validate `min_length=1` (from 1.2 review). Empty `JWT_SECRET=""` will fail. `CORS_ORIGIN` trailing slashes are auto-stripped (from 1.2 review) -- the README doesn't need to cover this detail but don't tell users to include/exclude trailing slashes explicitly.

### Current Repository State (end of Story 1.3)

Already present -- do NOT recreate:
- `.env`, `.env.example`, root `.gitignore` (from 1.3)
- `docker-compose.yml` (from 1.3, post-review)
- `frontend/` tree (from 1.1, post-review)
- `backend/` tree including `alembic/`, `entrypoint.sh`, `Dockerfile` (from 1.2 + 1.3, post-review)

Files to CREATE in this story:
- `README.md` at project root
- `Makefile` at project root

Files NOT to touch:
- `frontend/README.md` (Vite scaffold; leave alone)
- `backend/` or `frontend/` internals
- `_bmad-output/` (planning artifacts)

### What NOT To Do

- Do NOT add emojis to the README (per project preference for pragmatic, no-emoji documentation)
- Do NOT include marketing copy or "Why this project is special" sections
- Do NOT document features not yet implemented (no auth, no todos yet -- that's Epics 2-4)
- Do NOT reference Python or Node versions as host prerequisites -- everything runs in Docker
- Do NOT use `docker-compose` (hyphenated v1) commands -- use `docker compose` (v2) everywhere
- Do NOT recommend `make reset` or `make clean` without calling out that they destroy data
- Do NOT add a license section with a specific license -- the PRD doesn't specify one; "TBD" is accurate
- Do NOT create a CONTRIBUTING.md or CHANGELOG.md -- scope creep
- Do NOT document `make migration` without the `name=` argument requirement check
- Do NOT create GitHub Actions CI config files -- not in this story's scope
- Do NOT create Python virtualenv creation instructions -- user runs everything in Docker

### Project Structure Notes

- All files created in this story live at the project root
- No existing files should be modified (root `.gitignore` is already correct after 1.3 code review)
- The `Makefile` lives next to `docker-compose.yml`, signaling that they are the two primary developer entry points

### References

- [Source: architecture.md#Development Workflow Integration] -- Development server structure
- [Source: prd.md#FR30] -- README with setup instructions, env var docs, local dev steps
- [Source: prd.md#Implementation Considerations] -- Commit discipline, git from day one
- [Source: 1-3 story file] -- docker-compose setup this README documents

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Smoke test ran from a fully clean state (`docker compose down -v` first) to simulate a fresh clone
- `make` (default goal) correctly prints help via awk pattern matching on `## ` comments
- Stack came up cleanly on first run after full volume reset; db healthy in ~10s, backend healthy in ~15s, frontend starts after backend healthcheck passes
- All documented endpoints verified via curl: frontend (200), backend `/` (`{"status":"ok"}`), backend `/docs` (200)
- psql access via `docker compose exec db ...` returned `todo_app` database
- `make down` cleanly stopped all containers while preserving the volume

### Completion Notes List

- Created `README.md` at project root with all required sections: description, tech stack, prerequisites, Quick Start, env var table, project structure, Make targets table, development workflow (HMR + migrations), troubleshooting, license placeholder
- Created `Makefile` at project root with 18 targets: `help` (default), `up`, `up-logs`, `down`, `reset`, `logs`, `logs-backend`, `logs-frontend`, `logs-db`, `ps`, `shell-backend`, `shell-db`, `migrate`, `migration` (requires `name=` arg), `install-frontend`, `lint-frontend`, `typecheck-frontend`, `clean`
- `make help` auto-extracts target documentation from `## ` comments using awk -- DRY (no manual sync between target definitions and help text)
- `make migration` validates that `name=` argument is provided before running alembic; prints usage error otherwise
- Destructive targets (`reset`, `clean`) are clearly labeled "DESTRUCTIVE" in both the Makefile and the README Make Targets table
- Smoke-tested the documented Quick Start verbatim: from a fully cleaned state, `make up` → all three services healthy → all endpoints responsive → `make down` clean shutdown
- Root `.gitignore` unchanged (already correct after Story 1.3 review)
- Epic 1 work is effectively complete after this story; sprint-status.yaml epic-1 can be marked `done` in a future retrospective step

### Change Log

- 2026-04-15: README.md and Makefile created at project root. Quick Start smoke-tested end-to-end. Epic 1 closure candidate.

### File List

- README.md (new, project root)
- Makefile (new, project root)
