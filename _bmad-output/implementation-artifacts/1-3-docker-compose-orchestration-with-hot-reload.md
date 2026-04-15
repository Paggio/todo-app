# Story 1.3: Docker-Compose Orchestration with Hot Reload

Status: done

## Story

As a developer,
I want to start the entire stack with a single `docker-compose up` command and have hot reload working,
so that I can develop efficiently without manual service management.

## Acceptance Criteria

1. **Given** the repository contains `docker-compose.yml`, `.env`, and `.env.example` **When** the developer runs `docker-compose up` **Then** three services start: frontend (port 5173), backend (port 8000), and db (PostgreSQL on port 5432)

2. **Given** all three services are running **When** the developer modifies a frontend source file **Then** Vite HMR reflects the change in the browser without a manual restart (FR28)

3. **Given** all three services are running **When** the developer modifies a backend source file **Then** Uvicorn auto-reloads and the API serves the updated code (FR28)

4. **Given** the PostgreSQL service uses a named Docker volume **When** the developer runs `docker-compose down` and then `docker-compose up` **Then** all database data persists across restarts (NFR12)

5. **Given** the `.env.example` file exists **When** the developer copies it to `.env` **Then** it contains all required environment variables (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `VITE_API_URL`) with sensible development defaults

6. **Given** Alembic is configured in the backend **When** the backend container starts **Then** `alembic.ini` and `alembic/env.py` are present, configured to use SQLModel metadata and `DATABASE_URL` from the environment, and an entrypoint script runs migrations on startup

## Tasks / Subtasks

- [x] Task 1: Create `.env.example` and `.env` at project root (AC: #5)
  - [x] 1.1 Create `.env.example` at project root with these variables and dev defaults:
    - `DATABASE_URL=postgresql://todo:todo@db:5432/todo_app` (uses `db` hostname for inter-container Docker DNS)
    - `JWT_SECRET=dev-secret-change-me-in-production` (placeholder; user must override in real envs)
    - `CORS_ORIGIN=http://localhost:5173`
    - `VITE_API_URL=http://localhost:8000`
    - `POSTGRES_USER=todo`, `POSTGRES_PASSWORD=todo`, `POSTGRES_DB=todo_app` (used by Postgres container init)
  - [x] 1.2 Copy `.env.example` to `.env` (this is the actual file docker-compose loads; safe defaults for dev)
  - [x] 1.3 Add `/.env` to root `.gitignore` (create root `.gitignore` if missing); keep `.env.example` tracked

- [x] Task 2: Create `docker-compose.yml` at project root (AC: #1, #2, #3, #4)
  - [x] 2.1 Define `services:` with three services: `db`, `backend`, `frontend`
  - [x] 2.2 **db service:**
    - `image: postgres:16-alpine`
    - `environment: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB` from env vars
    - `ports: - "5432:5432"`
    - `volumes: - postgres_data:/var/lib/postgresql/data` (named volume for persistence -- NFR12)
    - `healthcheck:` using `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB` so backend can wait
  - [x] 2.3 **backend service:**
    - `build: ./backend`
    - `ports: - "8000:8000"`
    - `environment: DATABASE_URL, JWT_SECRET, CORS_ORIGIN` from env vars (use `${VAR}` interpolation)
    - `volumes: - ./backend:/app` (volume-mount source for hot reload -- FR28)
    - `volumes: - /app/.venv` (anonymous volume to prevent host venv from shadowing if any)
    - `depends_on: db: { condition: service_healthy }` (waits for db to be ready)
    - `command:` should be the entrypoint script (Task 5) that runs Alembic migrations then uvicorn
  - [x] 2.4 **frontend service:**
    - `build: ./frontend`
    - `ports: - "5173:5173"`
    - `environment: VITE_API_URL` from env var
    - `volumes: - ./frontend:/app` (source mount for HMR)
    - `volumes: - /app/node_modules` (anonymous volume so host's empty/missing node_modules doesn't shadow container's installed deps)
    - `depends_on: - backend` (frontend doesn't strictly need backend to start, but startup ordering is sensible)
  - [x] 2.5 Define `volumes: postgres_data:` at the bottom (named volume declaration)
  - [x] 2.6 Use Compose file format -- do NOT include the `version:` key (deprecated in modern Docker Compose v2)

- [x] Task 3: Initialize Alembic in backend (AC: #6)
  - [x] 3.1 Create `backend/alembic.ini` with config pointing to `alembic` script_location and using env-driven `sqlalchemy.url`
  - [x] 3.2 Create `backend/alembic/` directory
  - [x] 3.3 Create `backend/alembic/env.py` configured to:
    - Read `DATABASE_URL` from the environment (NOT from alembic.ini directly)
    - Import SQLModel metadata: `from sqlmodel import SQLModel` then set `target_metadata = SQLModel.metadata`
    - Import the models package so SQLModel.metadata is populated: `from app.models import *  # noqa` -- this is forward-compatible (no models exist yet, but Story 2.x will add them and migrations will then auto-detect)
  - [x] 3.4 Create `backend/alembic/script.py.mako` (use the standard Alembic template)
  - [x] 3.5 Create empty `backend/alembic/versions/` directory with a `.gitkeep` (so versions/ is committed despite being empty)

- [x] Task 4: Add Alembic to the prescribed structure
  - [x] 4.1 Update `backend/app/models/__init__.py` to be ready for future model imports (currently empty, document with a comment that future stories will add User and Todo imports)
  - [x] 4.2 Update `backend/.dockerignore` to NOT exclude `alembic/` directory or `alembic.ini` (verify they aren't filtered by `*.pyc` or `__pycache__` patterns)

- [x] Task 5: Create backend entrypoint script (AC: #6)
  - [x] 5.1 Create `backend/entrypoint.sh` that:
    - Runs `alembic upgrade head` (idempotent -- runs all pending migrations)
    - On failure of `alembic upgrade`, exits with non-zero so Docker restart policy kicks in
    - Then `exec`s into uvicorn so signal handling works correctly: `exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
  - [x] 5.2 Make the script executable: `chmod +x backend/entrypoint.sh`
  - [x] 5.3 Update `backend/Dockerfile`:
    - Copy `entrypoint.sh` and ensure it's executable: `RUN chmod +x /app/entrypoint.sh`
    - Replace `CMD ["uvicorn", ...]` with `CMD ["./entrypoint.sh"]`
  - [x] 5.4 In `docker-compose.yml` for the backend service, you can either omit `command:` (uses Dockerfile CMD = entrypoint) OR explicitly set `command: ./entrypoint.sh`. Prefer the explicit form for clarity.

- [x] Task 6: Verify end-to-end (AC: #1, #2, #3, #4, #6)
  - [x] 6.1 From project root: `docker compose up --build -d`
  - [x] 6.2 Verify all three services are running: `docker compose ps` should show `db`, `backend`, `frontend` all in `Up` state, with backend healthy after db healthcheck passes
  - [x] 6.3 Verify frontend serves: `curl http://localhost:5173` returns HTML with `<div id="root">`
  - [x] 6.4 Verify backend serves: `curl http://localhost:8000/` returns `{"status":"ok"}`
  - [x] 6.5 Verify Postgres accepts connections: `docker compose exec db psql -U todo -d todo_app -c "SELECT 1;"`
  - [x] 6.6 Verify Alembic migrations ran: `docker compose exec backend alembic current` returns the current migration head (or "head" if no migrations exist yet -- empty `versions/` is acceptable since no models defined yet)
  - [x] 6.7 **Verify backend HMR (FR28):** Modify `backend/app/main.py` (e.g., change the `root()` return value to `{"status":"ok","reloaded":true}`), then `curl http://localhost:8000/` -- should reflect the new value within ~3 seconds without manual restart
  - [x] 6.8 **Verify frontend HMR (FR28):** Modify `frontend/src/app.tsx` (e.g., change "Project ready!" to "Project ready! (reloaded)"), then refresh `http://localhost:5173` and confirm the change is reflected. Revert the change before completing.
  - [x] 6.9 **Verify Postgres data persistence (NFR12):** Create test data: `docker compose exec db psql -U todo -d todo_app -c "CREATE TABLE persistence_test (id int); INSERT INTO persistence_test VALUES (42);"`. Then run `docker compose down` (NOT `down -v` -- that would wipe volumes). Then `docker compose up -d`. After the db is healthy, run `docker compose exec db psql -U todo -d todo_app -c "SELECT * FROM persistence_test;"` -- the row `42` should be returned. Drop the test table.
  - [x] 6.10 Tear down for clean state: `docker compose down` (preserves data) -- DO NOT use `-v` flag

## Dev Notes

### Critical Architecture Constraints

- **Compose file format:** Use Docker Compose v2 (no `version:` key at top). The `docker compose` (with space) command is the v2 CLI; older `docker-compose` (with hyphen) v1 is deprecated.
- **PostgreSQL version:** `postgres:16-alpine` -- alpine is fine for Postgres (no pip-binary needs); slim/alpine difference matters for Python/Node images, not Postgres.
- **Volume mount + node_modules pattern:** When mounting `./frontend:/app` for HMR, you MUST also declare an anonymous volume on `/app/node_modules` -- otherwise the host's empty/non-existent node_modules folder shadows the container's installed dependencies.
- **Volume mount + .venv pattern (defensive):** Same logic for backend -- if any developer has a `.venv` in `./backend` locally, it would shadow the container's site-packages. Anonymous volume on `/app/.venv` (even though we don't create one in the container) is defensive.
- **Database URL hostname:** Inside the Docker network, the backend reaches Postgres at hostname `db` (the compose service name), NOT `localhost`. The `DATABASE_URL` in `.env` MUST use `db` not `localhost` for the backend service.
- **Health check on db before backend starts:** Without `depends_on: condition: service_healthy`, backend may attempt to run Alembic before Postgres is accepting connections, causing migration failures.
- **Entrypoint script uses `exec`:** `exec uvicorn ...` replaces the shell process so Uvicorn receives SIGTERM directly when `docker compose down` is called. Without `exec`, Uvicorn doesn't shut down gracefully.

[Source: architecture.md#Infrastructure & Deployment]

### Required Files (this story)

```
bmad_nf_todo_app/
├── .env                              # NEW (gitignored)
├── .env.example                      # NEW (committed)
├── .gitignore                        # NEW or update
├── docker-compose.yml                # NEW
├── backend/
│   ├── Dockerfile                    # MODIFIED (add entrypoint copy + CMD change)
│   ├── entrypoint.sh                 # NEW (executable)
│   ├── alembic.ini                   # NEW
│   └── alembic/
│       ├── env.py                    # NEW
│       ├── script.py.mako            # NEW
│       └── versions/
│           └── .gitkeep              # NEW
└── frontend/                         # NO CHANGES from Story 1.1
```

### docker-compose.yml Template

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
    volumes:
      - ./backend:/app
      - /app/.venv
    depends_on:
      db:
        condition: service_healthy
    command: ["./entrypoint.sh"]

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: ${VITE_API_URL}
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

volumes:
  postgres_data:
```

NOTE: `$${POSTGRES_USER}` (double dollar sign) in the healthcheck is intentional -- it escapes the variable so it's evaluated by the SHELL inside the container, not by Compose's variable interpolation.

### Alembic Configuration Pattern

`backend/alembic.ini` (relevant sections only -- start from a vanilla `alembic init alembic` template):

```ini
[alembic]
script_location = alembic
sqlalchemy.url = driver://user:pass@host/dbname  # PLACEHOLDER -- overridden in env.py
```

`backend/alembic/env.py` -- key adaptations from default:

```python
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel
from alembic import context

# Import models package so SQLModel.metadata is populated.
# Currently empty; Stories 2.x and 3.x will add User/Todo models.
from app.models import *  # noqa: F401, F403

config = context.config

# Override sqlalchemy.url from environment
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

# ... rest of standard env.py boilerplate (run_migrations_offline, run_migrations_online)
```

### entrypoint.sh Template

```bash
#!/bin/sh
set -e

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Updated backend/Dockerfile (delta from Story 1.2)

```dockerfile
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    WATCHFILES_FORCE_POLLING=true

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["./entrypoint.sh"]
```

### Previous Story Intelligence (Story 1.2)

- **Pydantic settings now have `Field(min_length=1)` validators** (added in 1.2 code review) -- so an empty `JWT_SECRET=""` in `.env` will fail validation at backend startup. The `.env.example` defaults must therefore be non-empty strings.
- **`CORS_ORIGIN` is auto-stripped of trailing slash** (added in 1.2 code review) -- so writing `CORS_ORIGIN=http://localhost:5173/` in .env still works correctly.
- **The container runs as root** (deferred from 1.2 code review) -- this is acceptable for dev. Do NOT add a `USER` directive in this story.
- **Docker Desktop on this host has been unstable** -- if `docker compose up` fails with daemon connection error, restart Docker Desktop.

### Network & Port Cheat Sheet

| Service | Internal hostname | Internal port | Host port |
|---|---|---|---|
| frontend | `frontend` | 5173 | 5173 |
| backend | `backend` | 8000 | 8000 |
| db (Postgres) | `db` | 5432 | 5432 |

- Frontend in browser uses `http://localhost:8000` (host port mapping) for API calls -- this is what `VITE_API_URL` must be (NOT `http://backend:8000`, which only works inside the Docker network)
- Backend uses `db:5432` to reach Postgres (Docker DNS resolves the service name)
- Anything connecting from your host machine uses `localhost:5432`, `localhost:5173`, `localhost:8000`

### What NOT To Do

- Do NOT include `version:` at the top of `docker-compose.yml` (deprecated in Compose v2)
- Do NOT use `localhost` in `DATABASE_URL` for the backend service -- use `db` (the compose service name)
- Do NOT skip the anonymous `/app/node_modules` volume mount -- without it the volume mount of source code will shadow `node_modules`
- Do NOT use `docker-compose up -v` thinking it preserves volumes -- `-v` does NOT exist for `up`. The `-v` flag is for `down -v` and DELETES volumes. Use plain `docker compose down` to preserve.
- Do NOT commit `.env` -- only `.env.example`
- Do NOT make `JWT_SECRET` empty in `.env.example` -- it must be non-empty (min_length=1) or the backend won't start
- Do NOT create any actual SQLModel model files (`backend/app/models/user.py`, etc.) -- those are Story 2.1 and 3.1
- Do NOT generate any Alembic migration files (don't run `alembic revision --autogenerate`) -- `versions/` stays empty in this story
- Do NOT use `postgres:latest` -- pin to `postgres:16-alpine` for reproducibility

### Project Structure Notes

- `frontend/` and `backend/` exist from Stories 1.1 and 1.2 -- do NOT recreate
- This story adds the orchestration layer at the project root
- `backend/Dockerfile` will be modified (CMD changes) -- not recreated
- `backend/.dockerignore` should be reviewed to ensure `alembic/` and `entrypoint.sh` are NOT excluded
- The root `.gitignore` may not exist yet -- create it if missing, and ensure it ignores `.env`

### References

- [Source: architecture.md#Infrastructure & Deployment] -- docker-compose service definitions
- [Source: architecture.md#Data Architecture] -- Alembic migrations on container startup
- [Source: prd.md#FR27] -- Single-command stack start
- [Source: prd.md#FR28] -- Hot reload for frontend and backend
- [Source: prd.md#NFR12] -- Persistent Docker volume for database
- [Source: 1-2 story file] -- Backend container patterns and Pydantic Field validators

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- **Frontend lockfile out-of-sync at first build:** Story 1.1 code review removed `shadcn` from `dependencies` and added it to `devDependencies`, but `pnpm-lock.yaml` was never regenerated. First `docker compose up --build` failed with `ERR_PNPM_OUTDATED_LOCKFILE`. Fixed by running `pnpm install` in `frontend/` to regenerate the lockfile, then re-built. Recommend regenerating lockfile any time `package.json` changes.
- **Backend HMR test:** Edited `app/main.py` to return `{"status":"ok","reloaded":"true"}` -- uvicorn detected the change (`Started server process [18]` after shutdown) and curl returned the new value within ~1.5s. Reverted.
- **Frontend HMR test:** Edited `src/app.tsx` heading -- Vite logged `hmr update /src/app.tsx, /src/index.css` and the dev server immediately served the updated module bundle. Reverted.
- **Persistence test:** Inserted row `42` into `persistence_test` table. Ran `docker compose down` (without `-v`), then `docker compose up -d`. Row was still present after restart. Cleaned up table.
- **Stack startup order:** Backend correctly waited for db's `pg_isready` healthcheck to pass before starting Alembic migrations. No race conditions observed.

### Completion Notes List

- Created `.env.example` and `.env` at project root with all required variables (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, VITE_API_URL, POSTGRES_USER/PASSWORD/DB)
- Added root `.gitignore` to keep `.env` out of version control
- Created `docker-compose.yml` with three services (db, backend, frontend) using Compose v2 format (no `version:` key)
- Added `pg_isready` healthcheck to db service; backend `depends_on` uses `condition: service_healthy`
- Configured volume mounts for hot reload: `./backend:/app` + anonymous `/app/.venv` for backend; `./frontend:/app` + anonymous `/app/node_modules` for frontend
- Initialized Alembic in backend: `alembic.ini`, `alembic/env.py` (reads DATABASE_URL from env, imports SQLModel.metadata, imports `app.models` for autogenerate readiness), `alembic/script.py.mako`, empty `alembic/versions/.gitkeep`
- Created `backend/entrypoint.sh` that runs `alembic upgrade head` then `exec`s into uvicorn
- Updated `backend/Dockerfile` to copy entrypoint, chmod +x, and use it as CMD
- Added comments to `backend/app/models/__init__.py` documenting future User/Todo imports for Alembic
- **All 6 ACs verified end-to-end:** stack starts with one command, both HMR paths work, named volume preserves Postgres data across restarts, Alembic config loads correctly

### Change Log

- 2026-04-15: Docker-compose orchestration complete. Three-service stack (db, backend, frontend) with hot reload, persistent volumes, Alembic-on-startup. All ACs verified end-to-end.

### File List

- .env (new, gitignored)
- .env.example (new)
- .gitignore (new, project root)
- docker-compose.yml (new)
- backend/Dockerfile (modified -- CMD changed to entrypoint.sh)
- backend/entrypoint.sh (new, executable)
- backend/alembic.ini (new)
- backend/alembic/env.py (new)
- backend/alembic/script.py.mako (new)
- backend/alembic/versions/.gitkeep (new)
- backend/app/models/__init__.py (modified -- documented future imports)
- frontend/pnpm-lock.yaml (regenerated to match package.json)

### Review Findings

- [x] [Review][Patch] DATABASE_URL KeyError crash in alembic/env.py — `os.environ["DATABASE_URL"]` raises unhandled KeyError if the env var is missing; replace with explicit error message [backend/alembic/env.py:16]
- [x] [Review][Patch] .gitignore missing Python/Node exclusion patterns — add `__pycache__/`, `*.pyc`, `.venv/`, `node_modules/`, `dist/` to prevent accidental commits [.gitignore]
- [x] [Review][Patch] alembic.ini placeholder sqlalchemy.url lacks explanatory comment — add comment clarifying it is overridden by env.py via DATABASE_URL [backend/alembic.ini:5]
- [x] [Review][Patch] No restart policy on services — add `restart: unless-stopped` to db, backend, and frontend so transient crashes self-recover [docker-compose.yml]
- [x] [Review][Patch] Frontend depends_on backend with no health condition — add backend healthcheck and use `condition: service_healthy` so frontend waits until backend is actually serving [docker-compose.yml:42-44]
- [x] [Review][Defer] `--reload` and WATCHFILES_FORCE_POLLING unconditional in all environments [backend/entrypoint.sh, backend/Dockerfile] — deferred, intentional dev-only setup; production hardening out of scope
- [x] [Review][Defer] Vite HMR clientPort/port — works correctly with current 1:1 port mapping; only breaks if host mapping changes [frontend/vite.config.ts] — deferred, pre-existing
- [x] [Review][Defer] JWT_SECRET weak dev default — `dev-secret-change-me-in-production` is a public known value; enforcement/validation should be added in auth story [.env.example] — deferred, pre-existing
- [x] [Review][Defer] Postgres credentials trivially weak (`todo`/`todo`) — dev defaults; acceptable for local-only dev [.env.example] — deferred, pre-existing
- [x] [Review][Defer] Frontend Dockerfile uses floating `node:lts-slim` tag — Story 1.1 scope; pin to specific version in future polish [frontend/Dockerfile] — deferred, pre-existing
- [x] [Review][Defer] VITE_API_URL injection not exercised — no API calls in this story; will be validated when frontend makes real requests in Story 2+ [docker-compose.yml] — deferred, pre-existing
- [x] [Review][Defer] .env file on disk without git tracking confirmation — gitignore is in place; verify `.env` is ignored when git is initialized [.env] — deferred, pre-existing
