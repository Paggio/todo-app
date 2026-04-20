---
stepsCompleted: ['step-01-load-context', 'step-02-define-thresholds', 'step-03-gather-evidence', 'step-04-evaluate-and-score', 'step-05-generate-report']
lastStep: 'step-05-generate-report'
lastSaved: '2026-04-20'
workflowType: 'testarch-nfr-assess'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/implementation-artifacts/ (all story files)'
  - 'backend/app/ (source)'
  - 'frontend/src/ (source)'
  - 'docker-compose.yml'
---

# NFR Assessment — bmad_nf_todo_app

**Date:** 2026-04-20
**Story / Scope:** Project-wide pre-release assessment (MVP / v1.0, Epics 1–7)
**Overall Status:** CONCERNS ⚠️

---

> Note: This assessment summarizes existing evidence (source review, test inventory, retrospectives, PRD/architecture commitments). No load tests, CI runs, or dynamic scans were executed as part of this pass.

## Executive Summary

**Assessment:** 10 PASS · 7 CONCERNS · 1 FAIL

**Blockers (release-gating):** 1 — no automated accessibility verification against the stated "zero critical WCAG AA violations" bar.

**High-Priority Issues:** 3 — (a) missing accessibility gate, (b) no rate limiting on auth endpoints, (c) no frontend error boundary / graceful-backend-down path verified end-to-end.

**Recommendation:** CONCERNS — ship candidate build to a staging URL, but before tagging v1.0 (i) run an axe-core sweep on `/login`, `/home`, each view and inline editors, and (ii) add login rate limiting and CSRF hardening for the production domain. Functional correctness, data isolation, and security fundamentals (hashing, JWT, cookie flags, per-user scoping) are in a genuinely good state.

---

## Performance Assessment

### Response Time (NFR1, NFR3, NFR14)

- **Status:** PASS ✅ (design-level) / CONCERNS ⚠️ (unverified at runtime)
- **Threshold:** NFR1 optimistic UI < 100ms · NFR3 CRUD API < 500ms · NFR14 "Due this week" query < 500ms
- **Actual:** Optimistic updates fire synchronously in TanStack Query `onMutate` (hooks/use-todos.ts) — effectively 0ms UI commit. API handlers are pure SQL-select + return, single-table or single-join, hitting indexed columns (`todos.user_id`, `todos.category_id`, `todos.deadline`). "This week" and "By deadline" filtering is **client-side** on an already-cached list, not a DB query — NFR14 is satisfied trivially.
- **Evidence:** `frontend/src/hooks/use-todos.ts` (selectDueThisWeek / selectByDeadline), `backend/app/routers/todos.py`, `backend/app/models/todo.py` (indexes on user_id, category_id, deadline).
- **Findings:** No measured p95 numbers in repo. At single-user scale this is almost certainly fine, but there is no perf test or benchmark to quote.

### Main-thread blocking (NFR4, <50ms)

- **Status:** PASS ✅
- **Actual:** No synchronous heavy work in render paths. `selectDueThisWeek` / `selectByDeadline` iterate one list of todos (v1 target is a single user with ≤ low-hundreds todos); no serialization or parsing on the hot path beyond JSON.parse of API responses.
- **Findings:** Adequate for stated scale. Recommend `useMemo` around the two view selectors if list sizes grow materially, but not required today.

### Initial page load (NFR2, <3s on 10 Mbps)

- **Status:** CONCERNS ⚠️ (unverified)
- **Evidence:** Vite build, React 19, lazy-loaded fonts, Tailwind v4 — standard fast profile. No Lighthouse / WebPageTest number captured.
- **Findings:** Recommend one Lighthouse run against the deployed preview and attach the report to the gate.

### Throughput / Resource Usage / Scalability

- **Status:** PASS ✅ for v1 scope
- **Threshold:** PRD explicitly states single-user scale; no throughput NFR defined.
- **Findings:** Out of scope. SQLite + single-uvicorn-worker is appropriate; architecture leaves door open to Postgres (already wired via `docker-compose.yml`).

---

## Security Assessment

### Authentication Strength (NFR5, NFR6)

- **Status:** PASS ✅
- **Threshold:** bcrypt cost ≥ 10, signed JWT with expiry.
- **Actual:** `bcrypt` cost factor **12** (above the NFR5 floor), HS256 JWT with `iat`/`exp`, 7-day expiry, signed with `settings.jwt_secret`. Login uses **timing-safe dummy-hash compare** on unknown emails (`backend/app/core/security.py`, `backend/app/routers/auth.py:86-155`) — enumeration side-channel deliberately closed. Password min length 8, max 128.
- **Evidence:** `backend/app/core/security.py`, `backend/app/routers/auth.py`.
- **Findings:** Strong. One minor: no explicit password-complexity beyond length — acceptable for a personal-scale app.

### Authorization Controls / Data Isolation (NFR7)

- **Status:** PASS ✅
- **Actual:** Every protected route depends on `get_current_user`, which decodes the cookie JWT, validates signature/expiry, looks the user up, and raises 401 otherwise. Every query filters by `user_id` (see `todos.py` `_get_user_todo`, `_validate_category_ownership`; `categories.py` `_get_user_category`). No raw SQL anywhere — all access via SQLModel parameterized queries → SQL injection not reachable.
- **Evidence:** `backend/app/core/deps.py`, `backend/app/routers/todos.py`, `backend/app/routers/categories.py`.
- **Findings:** Tenant isolation is enforced at the dependency layer, not trusted to callers. Good pattern.

### Data Protection — XSS, transport, cookie flags (NFR8, NFR9, NFR10)

- **Status:** PASS ✅ (XSS, cookie flags) / CONCERNS ⚠️ (CSRF, production hardening)
- **XSS:** No `dangerouslySetInnerHTML`, no `innerHTML` assignments, no `eval` — grep returned zero hits across `frontend/src`. React default escaping handles all user-supplied `todo.description` / `category.name` rendering.
- **Transport / cookie flags:** Cookie is `httpOnly=True`, `samesite=lax`, `secure` toggled by env (`auth_cookie_secure`). Production must set `AUTH_COOKIE_SECURE=true` + serve over HTTPS (NFR8).
- **CSRF:** Explicitly deferred (`_bmad-output/implementation-artifacts/deferred-work.md` D11 + `epic-2-retro`). `samesite=lax` blocks cross-site POSTs for a single-domain deployment; fine for v1 on a dedicated domain, risky if ever sharing a suffix with untrusted subdomains.
- **CORS:** Locked to `settings.cors_origin` (a single origin, not `*`), with `allow_credentials=True` — correct pairing.
- **Logging:** No observed logging of tokens/passwords in the 3 routers; FastAPI access logs are default Uvicorn (path + status, no bodies) — NFR9 satisfied.
- **Evidence:** `backend/app/core/config.py`, `backend/app/main.py`, `backend/app/routers/auth.py`, `deferred-work.md`.
- **Recommendation:** (a) document "set AUTH_COOKIE_SECURE=true in prod" in README deploy section; (b) add a double-submit CSRF token before any multi-subdomain deployment.

### Vulnerability Management

- **Status:** CONCERNS ⚠️
- **Threshold:** 0 critical, <3 high.
- **Actual:** No `pip-audit` / `npm audit` / Dependabot output in repo. Dependencies are reasonably fresh (FastAPI 0.135.x, React 19, pyjwt 2.10, passlib 1.7.4 — note passlib 1.7.4 is effectively abandoned, `bcrypt` pinned <5 for this reason per `security.py` comment).
- **Recommendation:** Add `pip-audit` + `pnpm audit` to a CI workflow; plan a passlib → argon2-cffi or native `bcrypt` migration (tracked in deferred-work).

### Auth endpoint abuse controls

- **Status:** FAIL ❌
- **Actual:** No rate limiting on `/api/auth/register` or `/api/auth/login`. Timing-safe comparison closes the enumeration leak but does nothing against credential-stuffing or brute force.
- **Recommendation (HIGH, release-gating for public deploy):** Add `slowapi` (FastAPI-compatible wrapper over `limits`) with a conservative policy — e.g. 5 login attempts per IP per minute, 3 registrations per IP per hour.

---

## Reliability Assessment

### Data Persistence (NFR11, NFR12)

- **Status:** PASS ✅
- **Actual:** `docker-compose.yml` mounts `postgres_data` named volume for Postgres; Alembic migrations under `backend/alembic/` version the schema. Data survives `docker-compose down` (not `down -v`).
- **Evidence:** `docker-compose.yml:56-57`, `backend/alembic/`.

### Fault Tolerance / Graceful Degradation (NFR13)

- **Status:** CONCERNS ⚠️
- **Actual:** Each mutation hook (`useCreateTodo` / `useUpdateTodo` / `useDeleteTodo`) rolls back the optimistic cache on error and shows a Sonner toast. `ApiClientError` is typed and carries `status`/`code`. A 401 triggers `window.dispatchEvent("auth:unauthorized")` which the auth guard listens for and redirects. An `OfflineIndicator` component exists.
- **Gap:** No top-level React error boundary (`ErrorBoundary` not seen in `app.tsx` or `main.tsx`). If `useGetTodos` rejects with a non-401 (e.g. 500 / network-level failure after the initial cache is warm), the home page will render empty lists — no explicit "Something went wrong, retry" error state for the list fetch. FR22 asks for an error state; it is partially covered by per-mutation toasts but not for the initial read path.
- **Recommendation:** Add an `ErrorBoundary` around the router outlet and an `isError` branch in `home.tsx` / `useGetTodos` consumers with a retry button.

### Error Handling Hygiene

- **Status:** PASS ✅
- **Actual:** Global FastAPI exception handlers (`backend/app/errors.py`) enforce the `{detail, code}` error envelope. 404/401/409/422 all carry typed codes (`TODO_NOT_FOUND`, `UNAUTHORIZED`, `DUPLICATE_CATEGORY_NAME`, `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`). Frontend `ApiClientError` surfaces both status and code.

### Test Inventory (proxy for CI burn-in)

- **Status:** CONCERNS ⚠️
- **Threshold:** 70% meaningful coverage.
- **Actual:**
  - Backend pytest: **86 tests** across `test_auth.py` (25) / `test_categories.py` (22) / `test_todos.py` (38) / `test_health.py` (1). Covers register/login/logout/me, timing-safe login on unknown email, per-user isolation on todos and categories, CRUD happy paths, category delete cascades, 401 shapes, etc. Backend surface (`backend/app/`, ~870 LOC) is well-covered at the behavior level — coverage almost certainly ≥ 70% on the API and security modules.
  - Frontend vitest: **5 test files** (`by-deadline-view`, `deadline-group-header`, `view-switcher`, `login`, `utils`) — ~800 LOC of tests against ~6k LOC of components. Coverage of selectors and view components is good; most custom hooks (`use-todos`, `use-categories`, `use-auth`) and most components (`todo-item`, `fab`, `auth-screen`, `auth-guard`, pickers, popovers) have **no direct tests**.
  - No e2e / Playwright tests in repo.
  - No coverage numbers measured (`pytest --cov` / `vitest --coverage` not wired into CI).
- **Recommendation:** Wire `--coverage` in both test runners, set the 70% threshold as a hard gate, and add component tests for `todo-item` (optimistic state machine), `use-todos` hooks (rollback on mutation error), and auth-guard redirect flow. Optionally add a minimal Playwright smoke (login → create todo → complete → logout).

### MTTR / Availability / DR

- **Status:** N/A (single-user personal app, no production SLOs defined in PRD)

---

## Accessibility Assessment (project-specific NFR — "zero critical WCAG AA")

- **Status:** CONCERNS ⚠️ / candidate FAIL until verified
- **Threshold:** Zero critical WCAG AA violations (per project objectives). PRD itself only asks "best-effort" — the stricter bar is the external objective.
- **Actual — what is in place (strong):**
  - Semantic HTML + ARIA is intentional: 121 `aria-*` / `role=` / `htmlFor=` usages across 27 components. Every custom checkbox has `role="checkbox"` + `aria-checked`. Delete buttons carry `aria-label`. Focus rings use `focus-visible:ring-2 focus-visible:ring-ring` tokens (visible in both themes).
  - `prefers-reduced-motion` is honored both in CSS (media query disables all `.animate-*` classes) and in JS (`lib/motion.ts` → `motionDuration(ms)` used by `todo-item.tsx`, `login.tsx`).
  - `aria-live="polite"` regions announce completion and deletion.
  - Minimum 44×44 touch targets enforced on interactive elements (checkboxes, delete buttons).
  - Epic 4.8 retrospective lists these as completed.
- **Gap:** No axe-core (or equivalent) automated check is present. No Playwright + `@axe-core/playwright` pass. No manual screen-reader walk-through evidence in `_bmad-output/test-artifacts/`.
- **Risk:** Without an automated pass, color-contrast regressions (priority colors, overdue red background + red text), focus-trap correctness in the FAB/popovers, and `aria-controls` wiring for `CompletedSection` are unverified.
- **Recommendation (HIGH, release-gating against the stated objective):** Run `@axe-core/playwright` against `/login`, `/home` (empty + populated), each view (All / This Week / By Deadline), and the inline editors (priority, deadline, category, FAB expanded). Any "critical" or "serious" finding blocks release. Store the resulting JSON/HTML in `_bmad-output/test-artifacts/a11y/`.

---

## Maintainability Assessment

### Test Coverage

- **Status:** CONCERNS ⚠️ (see Reliability → Test Inventory). Backend likely ≥ 70%; frontend likely < 70%. No measured number.

### Code Quality / Technical Debt

- **Status:** PASS ✅
- **Actual:** Clear modular layout (routers/models/core in backend; hooks/components/lib in frontend). Typed end-to-end (TypeScript strict, Pydantic). Explicit error contracts. Retros per epic capture deferred work transparently. `deferred-work.md` is the single source of truth for tracked debt (passlib EOL, CSRF, timezone-naive `created_at`, Alembic naming convention, duplicate-email race).

### Documentation

- **Status:** PASS ✅
- README, `project-context.md`, per-story implementation artifacts, architecture, UX spec, PRD, epic retrospectives — exceptionally complete for the scale of the project.

---

## Findings Summary

Based on the ADR Quality Readiness Checklist (29 criteria, adapted to an SPA + SQLite + single-user scope).

| Category                                         | Criteria Met | PASS | CONCERNS | FAIL | Overall Status |
| ------------------------------------------------ | ------------ | ---- | -------- | ---- | -------------- |
| 1. Testability & Automation                      | 3/4          | 2    | 1        | 0    | CONCERNS ⚠️   |
| 2. Test Data Strategy                            | 3/3          | 3    | 0        | 0    | PASS ✅       |
| 3. Scalability & Availability                    | 3/4          | 2    | 1        | 0    | CONCERNS ⚠️   |
| 4. Disaster Recovery                             | 2/3          | 1    | 1        | 0    | CONCERNS ⚠️   |
| 5. Security                                      | 3/4          | 3    | 0        | 1    | CONCERNS ⚠️   |
| 6. Monitorability, Debuggability & Manageability | 3/4          | 2    | 1        | 0    | CONCERNS ⚠️   |
| 7. QoS & QoE (incl. Accessibility)               | 2/4          | 1    | 2        | 0    | CONCERNS ⚠️   |
| 8. Deployability                                 | 3/3          | 3    | 0        | 0    | PASS ✅       |
| **Total**                                        | **22/29**    | 17   | 6        | 1    | **CONCERNS ⚠️** |

22/29 = 76% → "Room for improvement" band. Strong security/deployment core; weakness is verification (a11y, rate-limit, coverage numbers, Lighthouse).

---

## Quick Wins

4 quick wins identified:

1. **Set `AUTH_COOKIE_SECURE=true` in prod `.env`** (Security) — CRITICAL — 5 min. Doc-only change, already supported by `config.py`.
2. **Wire `pytest --cov` and `vitest --coverage` with a 70% hard threshold** (Maintainability) — HIGH — 30 min. Unlocks the 70%-coverage objective as an automated gate.
3. **Add `@axe-core/playwright` smoke against `/login` + `/home`** (Accessibility) — HIGH — 1–2h. Directly discharges the "zero critical WCAG AA" objective.
4. **Add a top-level `ErrorBoundary` + `useGetTodos` `isError` branch** (Reliability / FR22) — MEDIUM — 1h.

---

## Recommended Actions

### Immediate (before release) — CRITICAL / HIGH

1. **Automated accessibility gate** — HIGH — 2–4h — Frontend.
   Run `@axe-core/playwright` (or `axe-core` in a vitest jsdom test) against every route + each inline editor open state. Fail on `critical` or `serious`. Store report under `_bmad-output/test-artifacts/a11y/`.
2. **Auth endpoint rate limiting** — HIGH — 1–2h — Backend.
   Add `slowapi`: 5 login / min / IP, 3 register / hour / IP. Return 429 with the existing `{detail, code}` envelope. Add two pytest cases.
3. **Coverage gate at 70%** — HIGH — 30–60min — Both.
   Add `--cov-fail-under=70` (backend) and vitest coverage threshold; add a CI workflow that runs both, plus backend `pip-audit` and frontend `pnpm audit --prod`.
4. **Production cookie hardening documented** — CRITICAL — 15min — Docs.
   README deploy section must require `AUTH_COOKIE_SECURE=true`, HTTPS-only domain, `JWT_SECRET` rotated per env, and `CORS_ORIGIN` = production frontend origin only.

### Short-term (next milestone) — MEDIUM

1. **Top-level React ErrorBoundary + list error state** — MEDIUM — 1–2h.
2. **Lighthouse CI run** on deployed preview, attach HTML report — MEDIUM — 1h.
3. **CSRF double-submit token** — MEDIUM — 3–4h (only before any shared-suffix deployment).
4. **Component tests for `todo-item`, `fab`, `auth-guard`, `use-todos`** — MEDIUM — half-day.

### Long-term (backlog) — LOW

1. Replace passlib (EOL) with native `bcrypt` or argon2-cffi — already in `deferred-work.md`.
2. Timezone-aware `created_at` across all models — already in `deferred-work.md`.
3. Playwright e2e smoke (login → CRUD → logout) — LOW but high confidence.

---

## Evidence Gaps

- **Accessibility:** No axe report, no screen-reader walkthrough. **Owner:** frontend dev. **Suggested evidence:** `@axe-core/playwright` JSON + manual VoiceOver pass. **Impact:** cannot claim "zero critical WCAG AA".
- **Performance:** No Lighthouse / WebPageTest capture against NFR2 (<3s). **Impact:** NFR2 unverified.
- **Coverage:** No measured % from either runner. **Impact:** 70% objective unverified.
- **Dependency audit:** No `pip-audit` / `pnpm audit` output. **Impact:** vulnerability posture unknown.

---

## Gate YAML Snippet

```yaml
nfr_assessment:
  date: '2026-04-20'
  story_id: 'MVP / v1.0'
  feature_name: 'bmad_nf_todo_app'
  adr_checklist_score: '22/29'
  categories:
    testability_automation: 'CONCERNS'
    test_data_strategy: 'PASS'
    scalability_availability: 'CONCERNS'
    disaster_recovery: 'CONCERNS'
    security: 'CONCERNS'
    monitorability: 'CONCERNS'
    qos_qoe: 'CONCERNS'
    deployability: 'PASS'
  overall_status: 'CONCERNS'
  critical_issues: 1            # auth endpoint rate limiting
  high_priority_issues: 3       # a11y automation, coverage gate, prod cookie hardening doc
  medium_priority_issues: 4
  concerns: 6
  blockers: true                # a11y + rate-limit before public release
  quick_wins: 4
  evidence_gaps: 4
  recommendations:
    - 'Add @axe-core/playwright pass; block on critical/serious findings'
    - 'Add slowapi rate limits to /api/auth/login and /api/auth/register'
    - 'Wire pytest --cov and vitest coverage with 70% hard threshold'
    - 'Enforce AUTH_COOKIE_SECURE=true + HTTPS in production deploy docs'
    - 'Add top-level ErrorBoundary and list-read isError branch'
```

---

## Related Artifacts

- **PRD:** `_bmad-output/planning-artifacts/prd.md`
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
- **UX Spec:** `_bmad-output/planning-artifacts/ux-design-specification.md`
- **Implementation stories & retros:** `_bmad-output/implementation-artifacts/`
- **Deferred technical debt:** `_bmad-output/implementation-artifacts/deferred-work.md`
- **Source under review:**
  - `backend/app/` (main.py, core/, routers/, models/, errors.py)
  - `frontend/src/` (lib/api.ts, hooks/, components/, pages/)
  - `docker-compose.yml`, `backend/requirements.txt`, `frontend/package.json`

---

## Sign-Off

**NFR Assessment:**

- Overall Status: **CONCERNS ⚠️**
- Critical Issues: 1 (rate limiting)
- High Priority Issues: 3 (a11y gate, coverage gate, prod cookie/HTTPS enforcement)
- Concerns: 6
- Evidence Gaps: 4

**Gate Status:** CONCERNS ⚠️ — conditional pass. Release to staging OK. Public release gated on the 3 HIGH items above.

**Next Actions:**
1. Implement the 4 quick wins.
2. Re-run this assessment (`*nfr-assess`) once a11y + rate-limit + coverage evidence is in `_bmad-output/test-artifacts/`.
3. If all HIGH/CRITICAL clear, promote to PASS and proceed to gate/release.

**Generated:** 2026-04-20
**Workflow:** testarch-nfr v4.0

---

<!-- Powered by BMAD-CORE™ -->
