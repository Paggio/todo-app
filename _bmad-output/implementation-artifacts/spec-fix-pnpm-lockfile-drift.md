---
title: 'Fix pnpm lockfile drift blocking docker compose up'
type: 'bugfix'
created: '2026-04-20'
status: 'done'
route: 'one-shot'
---

# Fix pnpm lockfile drift blocking docker compose up

## Intent

**Problem:** Commit `15d3e40` added `@vitest/coverage-v8@^4.1.4` to `frontend/package.json` but did not regenerate `frontend/pnpm-lock.yaml`. The Dockerfile runs `pnpm install --frozen-lockfile`, which fails with `ERR_PNPM_OUTDATED_LOCKFILE`, so `make up-logs` (and any CI build) cannot bring the stack up.

**Approach:** Run `pnpm install --lockfile-only` in `frontend/` to regenerate the lockfile in sync with `package.json`, then verify the frontend image builds clean with `docker compose build frontend`.

## Suggested Review Order

1. [Regenerated lockfile delta](../../frontend/pnpm-lock.yaml) — net +96/−2 lines, scoped to `@vitest/coverage-v8` + its transitive graph (`@bcoe/v8-coverage`, `ast-v8-to-istanbul`, `istanbul-lib-*`, `istanbul-reports`, `magicast`, `html-escaper`, `make-dir`, `js-tokens@10`, `obug`). `obug` is a legitimate upstream fork of `debug` declared by coverage-v8 itself, not a typo-squat.
2. [Frontend Dockerfile](../../frontend/Dockerfile) — unchanged; confirms the `--frozen-lockfile` contract this fix restores.
3. [CI commit that caused the drift](../../.github/workflows/ci.yml) — for context on why the dep landed.

**Verification:** `docker compose build frontend` completed successfully after the regeneration (26.3s pnpm install, image exported clean).
