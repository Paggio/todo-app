# E2E Coverage Report

**Framework:** Playwright 1.59 + @axe-core/playwright 4.11
**Default gate project:** chromium (Desktop Chrome)
**Opt-in cross-browser:** `PLAYWRIGHT_ALL_BROWSERS=1` enables firefox + webkit
**Last verified:** 2026-04-20 — 16 / 16 passing on chromium in ~1.5 min

## Spec inventory

| File | Journey | Stories covered |
|---|---|---|
| `auth.spec.ts` | Register → land on home → logout → re-login; rejects bad credentials with inline error | 2.1, 2.2, 2.3, 2.4 |
| `todos-crud.spec.ts` | Create via FAB, toggle complete, delete; Enter/Escape/empty-title guard; multi-create | 3.1, 3.3, 3.4, 3.5 |
| `categories.spec.ts` | Create category, assign to todo, see section header; Uncategorized fallback | 5.1, 5.2, 5.3 |
| `views.spec.ts` | View switcher tablist (All / This Week / By Deadline); arrow-key roving tabindex | 7.1, 7.2 |
| `empty-and-loading.spec.ts` | First-login empty-state hero + pulsing FAB; skeleton before data | 3.6 |
| `keyboard-nav.spec.ts` | FAB opens on Enter + Escape restores focus; checkbox keyboard activation + focus ring | 4.8 |
| `accessibility.spec.ts` | axe-core WCAG 2.1 A/AA on `/login`, home empty, home populated across all three views (fails on `critical`/`serious`) | Cross-cutting (NFR accessibility gate) |

**Support modules** under `e2e/support/`:

- `api.ts` — register user via backend API (bypasses the auth UI for setup)
- `app.ts` — `loginViaUi`, `registerAndLogin`, `createTodoViaFab`, `createCategoryViaPanel`
- `a11y.ts` — `runAxe(page, tags)` helper that asserts zero critical/serious violations

## Run matrix

| Project | Default | Result |
|---|---|---|
| chromium | ✅ | 16 / 16 (~1.5 min) |
| firefox | opt-in via `PLAYWRIGHT_ALL_BROWSERS=1` | not currently gated |
| webkit | opt-in via `PLAYWRIGHT_ALL_BROWSERS=1` | not currently gated — animation timing needs longer nav waits |

## Objective vs. delivered

| Objective | Status |
|---|---|
| Minimum 5 passing Playwright tests | ✅ 16 passing |
| Zero critical WCAG AA violations | ✅ axe gate fails on `critical`/`serious`, suite green |
| E2E covers register/login | ✅ `auth.spec.ts` |
| E2E covers create/toggle/delete todo | ✅ `todos-crud.spec.ts` |
| E2E covers empty state + error handling | ✅ `empty-and-loading.spec.ts` + `auth.spec.ts` bad-credentials |

## Commands

```bash
# from frontend/
pnpm playwright:install          # one-time browser binaries install
pnpm test:e2e                    # chromium only (default gate)
PLAYWRIGHT_ALL_BROWSERS=1 \
  pnpm test:e2e                  # chromium + firefox + webkit
pnpm test:e2e --headed           # visible browser
pnpm test:e2e:ui                 # interactive UI mode

# backend + db must be running (docker-compose up -d)
```

## Follow-ups (deferred)

- Harden specs for firefox + webkit. Primary issue observed during authoring: webkit is slower on the auth-screen exit animation and needs `navigationTimeout` bumped or the animation stubbed behind `prefers-reduced-motion`.
- Add FAB creation/deletion animation coverage (currently only unit-tested).
- Add optimistic-mutation-rollback test once the backend can be induced to return a 5xx deterministically from an E2E context.
