---
title: CI Quality Pipeline
generated_by: bmad-testarch-ci
platform: github-actions
stack: fullstack (FastAPI backend + Vite/React frontend + Playwright E2E)
date: 2026-04-20
stepsCompleted:
  - step-01-preflight
  - step-02-generate-pipeline
  - step-03-configure-quality-gates
  - step-04-validate-and-summary
lastStep: step-04-validate-and-summary
lastSaved: 2026-04-20
---

# CI Quality Pipeline — todo-app

## Overview

This document captures the CI quality pipeline scaffolded by the BMAD Test Architect
(`bmad-testarch-ci`) for the `bmad_nf_todo_app` monorepo. It enforces objective
quality gates for both backend and frontend, and runs end-to-end Playwright tests
when configured.

- **Platform:** GitHub Actions
- **Workflow file:** `.github/workflows/ci.yml`
- **Triggers:** `push` to `main` / `develop`, all `pull_request` targeting `main` / `develop`
- **Concurrency:** per-workflow + per-ref, cancel-in-progress (shorter feedback loops)
- **OS matrix:** `ubuntu-latest`

## Preflight Findings (Step 1)

| Check                  | Result                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| Git repository present | Yes (branch `main`, clean)                                          |
| Test stack type        | `fullstack` (FastAPI backend + Vite/React frontend)                 |
| Backend framework      | `pytest` (tests in `backend/tests/`, config via `conftest.py`)      |
| Frontend unit framework| `vitest` (co-located with Vite via `frontend/vite.config.ts`)       |
| E2E framework          | Playwright (scaffolded by parallel subagent; guarded in CI)         |
| Python version         | 3.12 (from `backend/Dockerfile`)                                    |
| Node version           | 20 LTS (no `.nvmrc` present; `packageManager` not pinned)           |
| Package manager        | pnpm 9 (lockfile `pnpm-lock.yaml` v9)                               |
| CI platform            | GitHub Actions (`.github/` already exists; user override confirmed) |

## Jobs

### 1. `backend-tests` — pytest + coverage gate

- Runner: `ubuntu-latest`
- Working directory: `backend/`
- Actions used: `actions/checkout@v4`, `actions/setup-python@v5`
- Python cache: `pip` keyed on `backend/requirements*.txt`
- Install: `pip install -r requirements-dev.txt` (includes `pytest-cov` — added by this scaffold)
- Test command:

  ```bash
  pytest \
    --cov=app \
    --cov-report=term-missing \
    --cov-report=xml:coverage.xml \
    --cov-report=html:htmlcov \
    --cov-fail-under=70
  ```

- **Quality gate:** `--cov-fail-under=70` fails the job if backend coverage drops below 70%.
- Artifact: `backend-coverage` (XML + HTML report, 14-day retention).

### 2. `frontend-unit` — vitest + v8 coverage gate

- Runner: `ubuntu-latest`
- Working directory: `frontend/`
- Actions used: `actions/checkout@v4`, `pnpm/action-setup@v4` (v9), `actions/setup-node@v4` (Node 20)
- pnpm cache: keyed on `frontend/pnpm-lock.yaml`
- Install: `pnpm install --frozen-lockfile`
- Test command: `pnpm run test:coverage` (added script → `vitest run --coverage`)
- Provider: `@vitest/coverage-v8` (added to `frontend/devDependencies`)
- **Quality gate:** coverage thresholds configured in `frontend/vite.config.ts` under `test.coverage.thresholds`:
  - `lines: 70`
  - `statements: 70`
  - `branches: 70`
  - `functions: 70`
- Artifact: `frontend-coverage` (HTML + lcov, 14-day retention).

### 3. `e2e` — Playwright (guarded)

- Runner: `ubuntu-latest`
- Depends on: `backend-tests`, `frontend-unit` (runs only after unit gates pass)
- **Guard:** a preflight step checks `frontend/playwright.config.ts` (or `.js`) and
  sets `steps.playwright-config.outputs.exists`. All subsequent steps run only
  when `exists == 'true'`, so the job is a safe no-op until Playwright is
  configured by the parallel subagent.
- Setup: pnpm 9, Node 20, Python 3.12 (backend needed as API under test for E2E).
- Browser cache: `~/.cache/ms-playwright` keyed on `frontend/pnpm-lock.yaml`.
- Browser install: `pnpm exec playwright install --with-deps chromium`.
- Test command: `pnpm --dir frontend test:e2e`.
- Artifact: `playwright-report` (report + test-results on all runs, 30-day retention).

## Quality Gates Summary (Step 3)

| Gate                         | Tool                   | Threshold | Enforcement                                |
| ---------------------------- | ---------------------- | --------- | ------------------------------------------ |
| Backend test coverage        | pytest-cov             | 70%       | `--cov-fail-under=70` in pytest invocation |
| Frontend unit coverage       | @vitest/coverage-v8    | 70% L/S/B/F | `vite.config.ts` → `test.coverage.thresholds` |
| E2E green (when configured)  | Playwright             | Pass      | Job required (guarded on config presence)  |

Burn-in / flaky-detection loop is intentionally **not** scaffolded in this first
pass — the primary objective was the 70% coverage gate. It can be added later
once Playwright tests stabilize.

## Files Touched

| Path                                | Change                                                   |
| ----------------------------------- | -------------------------------------------------------- |
| `.github/workflows/ci.yml`          | **New** — 3-job CI pipeline with coverage gates.         |
| `backend/requirements-dev.txt`      | Added `pytest-cov>=5.0.0,<7.0.0`.                        |
| `frontend/package.json`             | Added `test:coverage` script and `@vitest/coverage-v8`.  |
| `frontend/vite.config.ts`           | Added `test.coverage` block with 70% thresholds (v8).    |
| `_bmad-output/test-artifacts/ci-pipeline.md` | **New** — this document.                         |

## Post-Workflow Actions (for the user)

1. Run `pnpm install` in `frontend/` locally (or let CI refresh the lockfile on
   the first PR) so `@vitest/coverage-v8` lands in `pnpm-lock.yaml`.
2. Commit changes (handled by this workflow run).
3. Open a PR to confirm all three jobs appear and pass in the GitHub Actions dashboard.
4. Once the parallel Playwright subagent lands `frontend/playwright.config.ts`,
   the `e2e` job automatically becomes active — no workflow edit needed.

## Assumptions

- Node 20 LTS is acceptable (no `.nvmrc` or `engines` pin found in the repo).
- pnpm 9 matches the `lockfileVersion: '9.0'` lockfile.
- Backend coverage target is `app/` (the FastAPI package).
- No SQLite/Postgres service container is required for `pytest` — the existing
  `backend/tests/conftest.py` already provisions a test DB in-process. If future
  tests require a live Postgres, add a `services:` block.
- No secrets are currently required; when contract testing or deployments are
  added later, document them in a `docs/ci-secrets-checklist.md`.
