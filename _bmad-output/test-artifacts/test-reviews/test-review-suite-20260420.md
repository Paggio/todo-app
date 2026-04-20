---
stepsCompleted:
  - step-01-load-context
  - step-02-discover-tests
  - step-03-quality-evaluation
  - step-04-generate-report
lastStep: 'step-04-generate-report'
lastSaved: '2026-04-20'
workflowType: 'testarch-test-review'
inputDocuments:
  - _bmad/tea/config.yaml
  - .claude/skills/bmad-testarch-test-review/resources/knowledge/test-quality.md
  - .claude/skills/bmad-testarch-test-review/resources/knowledge/data-factories.md (referenced)
  - .claude/skills/bmad-testarch-test-review/resources/knowledge/test-levels-framework.md (referenced)
  - .claude/skills/bmad-testarch-test-review/resources/knowledge/selective-testing.md (referenced)
  - .claude/skills/bmad-testarch-test-review/resources/knowledge/selector-resilience.md (referenced)
  - .claude/skills/bmad-testarch-test-review/resources/knowledge/timing-debugging.md (referenced)
  - backend/tests/conftest.py
  - backend/tests/test_health.py
  - backend/tests/test_auth.py
  - backend/tests/test_categories.py
  - backend/tests/test_todos.py
  - frontend/src/components/view-switcher.test.tsx
  - frontend/src/components/by-deadline-view.test.tsx
  - frontend/src/components/deadline-group-header.test.tsx
  - frontend/src/lib/utils.test.ts
  - frontend/src/pages/login.test.tsx
---

# Test Quality Review: bmad_nf_todo_app (suite)

**Quality Score**: 82/100 (B+ — Good)
**Review Date**: 2026-04-20
**Review Scope**: suite (backend pytest + frontend vitest; no E2E layer)
**Reviewer**: TEA Agent (Master Test Architect)

---

Note: This review audits existing tests; it does not generate tests. Coverage mapping and coverage gates are out of scope — use `trace` for coverage decisions.

## Executive Summary

**Overall Assessment**: Good
**Recommendation**: Approve with Comments

### Key Strengths

- Backend fixture design is excellent: `conftest.py` uses a fresh in-memory SQLite engine per test with `StaticPool` and overrides `get_db` via `app.dependency_overrides`, giving perfect isolation and parallel-safety with negligible setup cost.
- Error envelopes are asserted against an exact contract (`{detail, code}` — no other keys) via `_assert_error_envelope` in every backend file, so tests are both precise and refactor-aware rather than stringly-typed.
- Meaningful behavioural assertions throughout: auth tests cover happy path, case-insensitivity, invalid/expired/missing tokens, deleted-user tokens, log-scrubbing, per-user cookie isolation, and CORS — not just 200-status smoke checks.
- Frontend component tests lean on roles and ARIA (`getByRole('tab')`, `aria-selected`, `aria-controls`, `aria-expanded`) rather than class names or `data-testid`, and `view-switcher.test.tsx` actually exercises keyboard roving (Arrow/Home/End) — real a11y coverage.
- `utils.test.ts` properly parametrises boundaries (priority 0/1/5/6, bucket day offsets -1/0/1/2/6/7/30) and tests pure logic at the correct (unit) level.

### Key Weaknesses

- Several frontend tests reach into implementation details (`document.getElementById("deadline-section-today")`, `button[aria-controls^="deadline-section-"]`, `overflow-visible` / `bg-[color:var(--color-overdue-bg)]` class substrings). These are brittle against refactors that keep behaviour identical.
- `deadline-group-header.test.tsx` and `by-deadline-view.test.tsx` rely on shared `localStorage` across tests with manual `beforeEach`/`afterEach` `clear()` — one missed hook and state leaks. No fixture abstraction.
- No E2E layer (Playwright/Cypress) exists despite `tea_use_playwright_utils: true` in `_bmad/tea/config.yaml`. Multi-step flows (register → create todo with deadline → view in By-Deadline group → complete → logout) are tested only as disjoint component + API slices.
- Test data is almost entirely hardcoded (`alice@example.com`, `hunter22!`, `"Buy milk"`) with no factory/faker layer. With the per-test SQLite engine this is safe today, but there is no room for parallel execution against a shared DB and no override ergonomics.
- `login.test.tsx` asserts on a hardcoded `300` ms animation delay and re-renders to guard a regression. This works but couples the test to a magic number that lives in the component; exposing the duration via `motionDuration` (already mocked) would make it self-describing.

### Summary

The suite is clearly written, well-organized, and provides real confidence at the API and component level. Backend tests are the strongest: hermetic, contract-first, and exhaustive on auth/authorization/isolation/404/422 paths. Frontend tests are competent but occasionally slip from behavioural assertions into DOM/class-name introspection, and the whole suite lacks a browser-level smoke that ties the slices together. None of the issues are blockers — score reflects solid practice with addressable polish.

---

## Quality Criteria Assessment

| Criterion                            | Status   | Violations | Notes                                                                                                                          |
| ------------------------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| BDD Format (Given-When-Then)         | ⚠️ WARN  | suite-wide | No GWT comments; test names are readable but ad-hoc. Not mandated by pytest/vitest norms.                                      |
| Test IDs                             | ⚠️ WARN  | suite-wide | No `@story`/`@TID` markers; only informal story-number comments ("Story 5.1").                                                 |
| Priority Markers (P0/P1/P2/P3)       | ❌ FAIL  | suite-wide | No priority tagging; all tests execute every run, no risk-based selection possible.                                            |
| Hard Waits (sleep, waitForTimeout)   | ✅ PASS  | 0          | No `sleep`, no `waitForTimeout`. `login.test.tsx` uses fake timers + `vi.advanceTimersByTime(300)` deterministically.          |
| Determinism (no conditionals)        | ✅ PASS  | 0          | No if/try-for-flow-control. Test paths are single-branch.                                                                      |
| Isolation (cleanup, no shared state) | ✅ PASS  | 0          | Backend: per-test engine. Frontend: `cleanup()` + `localStorage.clear()` in hooks.                                             |
| Fixture Patterns                     | ⚠️ WARN  | FE only    | Backend fixtures are exemplary. Frontend has no shared fixture layer; each test inlines mocks and helpers.                     |
| Data Factories                       | ❌ FAIL  | suite-wide | One ad-hoc `makeTodo` helper in by-deadline-view; no faker, no backend factories. Hardcoded emails/passwords/descriptions.     |
| Network-First Pattern                | N/A      | -          | No browser tests.                                                                                                              |
| Explicit Assertions                  | ✅ PASS  | 0          | Assertions live in test bodies; `_assert_error_envelope` / `_assert_user_read_shape` are documented and used consistently.     |
| Test Length (≤300 lines)             | ⚠️ WARN  | 2 files    | `test_auth.py` 358, `test_categories.py` 345, `test_todos.py` 568 — all exceed the 300-line guideline.                          |
| Test Duration (≤1.5 min)             | ✅ PASS  | 0          | In-memory SQLite + jsdom; full suite well under budget.                                                                        |
| Flakiness Patterns                   | ⚠️ WARN  | 2          | `utils.test.ts` uses `toISODate(new Date())` → midnight rollover risk; `login.test.tsx` couples to literal `300`ms duration.   |

**Total Violations**: 0 Critical, 3 High, 6 Medium, 4 Low

---

## Quality Score Breakdown

```
Starting Score:          100
Critical Violations:     0 × 10  =  0
High Violations:         3 × 5   = -15
Medium Violations:       6 × 2   = -12
Low Violations:          4 × 1   =  -4

Bonus Points:
  Excellent BDD:              +0
  Comprehensive Fixtures:     +5   (backend conftest)
  Data Factories:             +0
  Network-First:              +0   (N/A, no browser tests)
  Perfect Isolation:          +5   (per-test engine + cleanup)
  All Test IDs:               +0
                         --------
Total Bonus:                 +10

Final Score:             79 + 10 = 82/100 approx (rounded to 82)
Grade:                   B+
```

---

## Critical Issues (Must Fix)

No critical issues detected. ✅

---

## Recommendations (Should Fix)

### 1. Brittle DOM / class-name assertions in frontend tests

**Severity**: P1 (High)
**Location**:
- `frontend/src/components/by-deadline-view.test.tsx:76-84, 117`
- `frontend/src/components/deadline-group-header.test.tsx:61-66, 89-102, 111-115, 126`
**Criterion**: Selector resilience / Explicit behavioural assertions
**Knowledge Base**: `selector-resilience.md`, `test-quality.md`

**Issue**: Tests traverse the DOM by raw `document.getElementById("deadline-section-today")`, `document.querySelectorAll('button[aria-controls^="deadline-section-"]')`, and assert on class substrings such as `overflow-visible` and `bg-[color:var(--color-overdue-bg)]`. These are implementation details — a Tailwind rename, a restructure, or a framework switch will break the test without any behaviour change.

**Current**:
```tsx
const body = document.getElementById("deadline-section-today")!
expect(body.className).toContain("overflow-visible")
```
**Recommended**:
```tsx
// Either: assert the behaviour (body is visible to AT / not hidden)
const region = screen.getByRole("region", { name: /today/i })
expect(region).toBeVisible()
// Or: if the overflow behaviour IS the contract, give it a semantic data attribute
// data-state="expanded" | "collapsed" and assert on that.
```
**Why this matters**: The tests currently pass _because_ the component happens to use those Tailwind classes. That's coupling without value.

---

### 2. No data factories; hardcoded credentials and fixture data

**Severity**: P1 (High)
**Location**: suite-wide (every backend test + `by-deadline-view.test.tsx`)
**Criterion**: Data Factories
**Knowledge Base**: `data-factories.md`

**Issue**: Every backend test literally writes `"alice@example.com"` / `"bob@example.com"` / `"hunter22!"` / `"Buy milk"`. There is no `createUser({...})` factory, no `faker`. Today this is safe (per-test SQLite), but (a) it makes intent noisy (which field is the one under test?), (b) it blocks moving toward a shared-DB integration layer, and (c) per-test setup duplicates the register/login dance 50+ times.

**Recommended**: Add `backend/tests/factories.py` with `make_user(**overrides) -> dict`, `make_todo(**overrides) -> dict`, and a `registered_client(email=faker.email())` fixture. Replace ~80% of the `_register_and_login(client)` boilerplate.

---

### 3. No E2E layer despite config enabling Playwright Utils

**Severity**: P1 (High)
**Location**: project root (missing `playwright.config.*`)
**Criterion**: Test Levels Framework
**Knowledge Base**: `test-levels-framework.md`

**Issue**: `_bmad/tea/config.yaml` sets `tea_use_playwright_utils: true` and `tea_browser_automation: auto`, but no E2E tests exist. The full journey — register → set deadline → see todo in "Today" bucket → complete → see it leave the bucket — is only covered as three separate slices. One happy-path smoke per top-level view would catch integration regressions (router/state/API wiring) that none of the current unit tests can see.

**Recommended**: One `@P0` Playwright spec per view: Login, Home list (with category picker), By-Deadline view. Follow the network-first pattern already documented in `test-quality.md` Example 1.

---

### 4. Three backend test files exceed the 300-line quality gate

**Severity**: P2 (Medium)
**Location**: `test_auth.py` 358, `test_categories.py` 345, `test_todos.py` 568
**Criterion**: Test Length
**Knowledge Base**: `test-quality.md` (Example 4)

**Issue**: `test_todos.py` is nearly double the soft limit. Despite section headers ("CRUD happy-path", "Validation tests", "Per-user isolation"), the file mixes 19 sub-concerns. Splitting by concern (e.g., `test_todos_crud.py`, `test_todos_isolation.py`, `test_todos_fields.py` for Story 5.1 fields) would make failures easier to locate and make file-level `pytest -k` targeting practical.

---

### 5. `login.test.tsx` couples to a magic number (300 ms)

**Severity**: P2 (Medium)
**Location**: `frontend/src/pages/login.test.tsx:89, 117, 140`
**Criterion**: Determinism / Maintainability
**Knowledge Base**: `timing-debugging.md`

**Issue**: Three tests hardcode `vi.advanceTimersByTime(300)`, duplicating a value owned by the component. If `LoginPage` changes its animation duration, the tests become flaky/fail with no obvious link back to the cause.

**Recommended**: Either export the constant from `login.tsx` (e.g., `export const LOGIN_EXIT_DELAY_MS = 300`) and import it in the test, or use `await waitFor(() => expect(mockNavigate).toHaveBeenCalled())` to be value-agnostic.

---

### 6. Wall-clock coupling in `utils.test.ts`

**Severity**: P2 (Medium)
**Location**: `frontend/src/lib/utils.test.ts:100, 119-120, 127-128, 133-134, 152-153, 178-183`
**Criterion**: Determinism
**Knowledge Base**: `timing-debugging.md`

**Issue**: `getDeadlineBucket` and `formatDeadline` tests call `new Date()` directly. If the test runs across local-midnight, `offsetISO(0)` returning "today" and the function's own `new Date()` returning "tomorrow" silently disagree. Rare, but deterministic-flake-by-design.

**Recommended**: Inject or freeze the clock: `vi.useFakeTimers(); vi.setSystemTime(new Date("2026-04-20T12:00:00Z"))` in `beforeEach`. Then every boundary test is reproducible.

---

### 7. Missing auth-permutations: empty string email, whitespace, very long inputs

**Severity**: P2 (Medium)
**Location**: `backend/tests/test_auth.py` (register/login)
**Criterion**: Edge-case coverage
**Knowledge Base**: `test-quality.md`

**Issue**: Good coverage of invalid-email format and missing fields, but no tests for: empty string email (`""`), whitespace-only email/password, 500-char emails, or Unicode emails. Pydantic's EmailStr handles most of this, but pinning the behaviour with explicit 422s guards against dependency upgrades quietly changing semantics.

---

### 8. `_register_and_login` helper name is slightly misleading

**Severity**: P3 (Low)
**Location**: `backend/tests/test_categories.py:17`, `backend/tests/test_todos.py:17`
**Criterion**: Readability

**Issue**: The helper only registers; login is implicit because FastAPI's register endpoint sets the auth cookie. Name it `_register_user_and_authenticate` or document the implicit cookie behaviour once.

---

### 9. `test_health.py` barely exists; consider removing or expanding

**Severity**: P3 (Low)
**Location**: `backend/tests/test_health.py`

**Issue**: A single `test_root_returns_ok` that checks `/` returns `{status: ok}`. Useful as a smoke test, but no `/health` readiness/liveness checks are covered. Either keep and add `/health/live`, `/health/ready` coverage, or fold into a `test_smoke.py`.

---

### 10. Duplicate `_create_todo` / `_create_category` helpers across files

**Severity**: P3 (Low)
**Location**: `test_categories.py`, `test_todos.py`

**Issue**: Identical helpers are re-declared. Move to `backend/tests/factories.py` (see #2) or `conftest.py`.

---

### 11. Missing trailing negative-space tests for categories

**Severity**: P3 (Low)
**Location**: `backend/tests/test_categories.py`

**Issue**: No tests for `PATCH /api/categories/{id}` with whitespace-only name, with name > max length, or `DELETE` twice (idempotency). Category name length limits are not exercised.

---

### 12. `by-deadline-view.test.tsx` mocks `useUpdateTodo` / `useDeleteTodo` as empty `vi.fn()`

**Severity**: P3 (Low)
**Location**: `frontend/src/components/by-deadline-view.test.tsx:14-23`

**Issue**: Mocks don't verify the call contract — nothing asserts that clicking "mark complete" actually calls `useUpdateTodo.mutate(...)` with the right payload. Worth one additional test that clicks a complete button and expects the mock to have been called with `{ id, is_completed: true }`.

---

## Best Practices Found

### 1. Hermetic per-test DB engine with dependency override

**Location**: `backend/tests/conftest.py:29-58`
**Pattern**: Fixture composition — pure function → fixture → client override
**Knowledge Base**: `fixture-architecture.md`, `test-quality.md`

```python
@pytest.fixture(name="engine")
def engine_fixture() -> Iterator[object]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()

@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    def _override_get_db() -> Iterator[Session]: yield session
    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as client: yield client
    app.dependency_overrides.clear()
```
This is textbook. Every test starts from a blank slate, cleanup is implicit, parallelism is free.

### 2. Error-contract assertion helper

**Location**: `backend/tests/test_auth.py:37-47` (also reused in `test_categories.py`, `test_todos.py`)
**Pattern**: Shape-first assertion over stringly-typed responses

```python
def _assert_error_envelope(response, expected_code):
    body = response.json()
    assert set(body.keys()) == {"detail", "code"}, f"got {set(body.keys())}"
    assert body["code"] == expected_code
    assert isinstance(body["detail"], str) and body["detail"]
```
Locks the architecture's `{detail, code}` envelope contract. A stray additional key, missing code, or wrong code type all surface as actionable diffs.

### 3. Cookie-swap pattern for multi-user isolation tests

**Location**: `backend/tests/test_auth.py:313-331`, `test_categories.py:130-149`, `test_todos.py:188-211`
**Pattern**: Capture token A → clear jar → register B → swap back to A
Simple, explicit, and doesn't require a second TestClient or elaborate fixture. Particularly clean for the `test_me_isolates_to_cookie_owner` sibling-auth scenario.

### 4. Real a11y assertions in `view-switcher.test.tsx`

**Location**: `frontend/src/components/view-switcher.test.tsx:43-49, 104-138`
**Pattern**: Role queries + keyboard interaction
Asserts `role="tablist"`, `aria-selected`, `aria-controls`, and exercises ArrowLeft/ArrowRight/Home/End with roving tabindex. This is the "right way" to test a tab widget and should be the reference for the rest of the component suite.

### 5. Log-redaction tests

**Location**: `backend/tests/test_auth.py:119-128` (`test_register_does_not_log_plaintext_password`), 285-301 (`test_login_does_not_log_plaintext_password`)
**Pattern**: `caplog` + uniqueness sentinel in the payload
Rare and valuable — catches a whole class of logging regressions that normally only show up in a post-mortem.

### 6. Boundary-value parametrisation in `utils.test.ts` and backend priority tests

**Location**: `frontend/src/lib/utils.test.ts` (deadline buckets at -1/0/1/2/6/7/30), `backend/tests/test_todos.py` (priority 0/1/5/6)
**Pattern**: Test exactly on and around the boundary
Proper boundary-value analysis. The bucket-boundary set in particular (today-1, today, today+1, today+2, today+6, today+7, today+30) is precisely the right shape.

---

## Test File Analysis

### Backend pytest (`backend/tests/`)

| File                | Lines | Tests | Concerns                            |
| ------------------- | ----- | ----- | ----------------------------------- |
| `conftest.py`       | 58    | -     | Engine/session/client fixtures      |
| `test_health.py`    | 11    | 1     | Root smoke                          |
| `test_auth.py`      | 358   | 22    | Register/Login/me/Logout/CORS/isolation |
| `test_categories.py`| 345   | 18    | CRUD/isolation/duplicates/cascade/auth |
| `test_todos.py`     | 568   | 35    | CRUD/validation/isolation/404/auth/fields (Story 5.1) |

- **Framework**: pytest + FastAPI TestClient + SQLModel
- **Average test length**: ~12 lines
- **Fixtures**: 3 (engine, session, client) — all in `conftest.py`, all per-test
- **Factories**: 0 (hardcoded data)

### Frontend vitest

| File                              | Lines | Tests | Concerns                                               |
| --------------------------------- | ----- | ----- | ------------------------------------------------------ |
| `view-switcher.test.tsx`          | 139   | 11    | Rendering, URL-state, a11y (ARIA + roving tabindex)    |
| `by-deadline-view.test.tsx`       | 144   | 5     | Empty state, group order, empty-bucket drop, category chip |
| `deadline-group-header.test.tsx`  | 128   | 8     | Expand/collapse, localStorage persistence, overdue tint|
| `login.test.tsx`                  | 168   | 6     | Redirect timing, "from" location, timer regression     |
| `utils.test.ts`                   | 221   | ~25   | Pure-function priority, toISODate, isOverdue, bucket   |

- **Framework**: vitest + @testing-library/react + jsdom
- **Mocking**: ESM-level via `vi.mock()` (react-router, motion, hooks). Well-scoped.
- **Factories**: 1 local `makeTodo` helper (in `by-deadline-view.test.tsx` only)

### Assertions Analysis

- **Total Assertions**: ~430 across 130+ tests
- **Assertions per Test**: ~3.3 (avg) — appropriate
- **Assertion Types**: Status codes, response shape (`set(body.keys())`), value equality, regex for labels, ARIA attributes, mock-call counts & args, log-content scan

---

## Context and Integration

### Related Artifacts

- **Config**: `_bmad/tea/config.yaml` (Playwright Utils enabled, CI platform auto, risk threshold p1)
- **Epics**: `_bmad-output/` contains multiple epic retrospectives (Epic 7 retro noted in git log). Story-number comments in test files ("Story 2.1", "Story 5.1", "Story 7.2") provide informal traceability, but no structured test-design doc is linked.

---

## Knowledge Base References

- `test-quality.md` — Definition of Done (no hard waits, <300 lines, <1.5 min, self-cleaning, explicit assertions)
- `data-factories.md` — Factory functions with overrides, API-first setup
- `test-levels-framework.md` — Unit vs. API vs. Component vs. E2E
- `selector-resilience.md` — Prefer role/label over DOM/CSS queries
- `timing-debugging.md` — Frozen clocks over wall-clock coupling
- `selective-testing.md` — Priority markers for risk-based runs

---

## Next Steps

### Immediate Actions (Before Merge)

1. **Replace brittle DOM/class-name assertions** in `by-deadline-view.test.tsx` and `deadline-group-header.test.tsx` with role/region/`data-state` queries.
   - Priority: P1
   - Estimated Effort: 1-2 hours

2. **Freeze the clock in `utils.test.ts`** (`vi.useFakeTimers()` + `vi.setSystemTime()`) to eliminate midnight-rollover flakes.
   - Priority: P1
   - Estimated Effort: 30 min

3. **Extract a login-delay constant** and import it into `login.test.tsx` instead of hardcoding `300`.
   - Priority: P2
   - Estimated Effort: 15 min

### Follow-up Actions (Future PRs)

1. **Introduce `backend/tests/factories.py`** with `make_user`, `make_todo`, `make_category`, each accepting overrides; swap the hardcoded dicts and most `_register_and_login(...)` calls for a `registered_client` fixture.
   - Priority: P2, next sprint

2. **Split `test_todos.py` (568 lines)** into `test_todos_crud.py`, `test_todos_isolation.py`, `test_todos_fields.py`; similarly consider splitting `test_auth.py` and `test_categories.py`.
   - Priority: P2, next sprint

3. **Add 3-4 Playwright smoke specs** (login, main list + category picker, by-deadline view) covering the happy path end-to-end; the `tea_use_playwright_utils: true` config implies this is already intended.
   - Priority: P1, next milestone

4. **Add priority markers** (`@pytest.mark.p0`/`p1`/`p2` in pytest; `test.describe.P0(...)` convention or tags in vitest) to enable risk-based selective runs (matches `risk_threshold: p1` in config).
   - Priority: P3, backlog

### Re-Review Needed?

No re-review needed — approve as-is. Critical issues: none. Address the P1/P2 recommendations incrementally.

---

## Decision

**Recommendation**: Approve with Comments

**Rationale**: Test quality is Good at 82/100. The backend suite is genuinely exemplary in isolation and contract assertions; frontend tests are solid but have addressable brittleness (DOM/class-name coupling) and there is no E2E layer despite being configured for one. None of the issues rise to blocking severity — they are polish items that will compound over time if ignored. Tests provide real confidence for the current feature set; confidence for *multi-slice integration* is implicit rather than asserted.

---

## Appendix: Violation Summary by Location

| File                              | Line       | Severity | Criterion            | Issue                                                         |
| --------------------------------- | ---------- | -------- | -------------------- | ------------------------------------------------------------- |
| by-deadline-view.test.tsx         | 76-84      | P1       | Selector resilience  | `document.querySelectorAll('button[aria-controls^=...]')`     |
| by-deadline-view.test.tsx         | 117        | P1       | Selector resilience  | `document.getElementById("deadline-section-today")`           |
| deadline-group-header.test.tsx    | 89-102     | P1       | Selector resilience  | Assert on Tailwind class substring `bg-[color:var(--...)]`    |
| deadline-group-header.test.tsx    | 111-115    | P2       | Selector resilience  | Assert on `overflow-visible` / `overflow-hidden` class        |
| (project root)                    | -          | P1       | Test Levels          | No E2E layer despite `tea_use_playwright_utils: true`         |
| backend/tests/*.py                | suite-wide | P1       | Data Factories       | No factories; hardcoded emails/passwords/descriptions         |
| test_todos.py                     | 568 LOC    | P2       | Test Length          | Exceeds 300-line guideline (double)                           |
| test_auth.py                      | 358 LOC    | P2       | Test Length          | Exceeds 300-line guideline                                    |
| test_categories.py                | 345 LOC    | P2       | Test Length          | Exceeds 300-line guideline                                    |
| login.test.tsx                    | 89/117/140 | P2       | Determinism          | Hardcoded `300` ms animation delay                            |
| utils.test.ts                     | 100-183    | P2       | Determinism          | Wall-clock coupling (`new Date()` in tests)                   |
| test_auth.py                      | register   | P2       | Edge cases           | Missing empty-string / whitespace / Unicode email permutations |
| test_categories.py                | PATCH/DEL  | P3       | Edge cases           | Missing max-length name, whitespace-only name, double-delete   |
| test_categories.py/test_todos.py  | 17         | P3       | Readability          | `_register_and_login` name misleading (login is implicit)     |
| test_health.py                    | 11 LOC     | P3       | Smoke scope          | Only `/` covered — no `/health/live` `/health/ready`          |
| test_categories.py/test_todos.py  | -          | P3       | DRY                  | Duplicate `_create_todo` / `_create_category` helpers         |
| by-deadline-view.test.tsx         | 14-23      | P3       | Mock verification    | Mocks exist but no call-assertion test                        |
| suite-wide                        | -          | P3       | Test IDs / Priorities | No `@story` / `@P0..P3` markers for selective execution       |

---

## Review Metadata

**Generated By**: BMad TEA Agent (Test Architect)
**Workflow**: testarch-test-review v4.0
**Review ID**: test-review-suite-20260420
**Timestamp**: 2026-04-20
**Version**: 1.0
