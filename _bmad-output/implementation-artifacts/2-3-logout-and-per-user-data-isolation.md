# Story 2.3: Logout and Per-User Data Isolation

Status: done

## Story

As an authenticated user,
I want to log out securely and know my data is isolated from other users,
so that I can trust the application with my information.

## Acceptance Criteria

1. **Given** an authenticated user **When** they send POST /api/auth/logout **Then** the server clears the httpOnly auth cookie and returns 200

2. **Given** the frontend **When** the user clicks the logout action **Then** the auth context is cleared and the user is redirected to the login screen (FR3)

3. **Given** the `get_current_user` FastAPI dependency **When** it processes a request **Then** it extracts the JWT from the httpOnly cookie, validates the signature and expiry, and returns the user_id for scoping all subsequent queries (FR5)

4. **Given** any protected API endpoint **When** a request is made with a valid JWT **Then** all database queries are scoped to the `user_id` from the JWT — a user can never access another user's data (FR5, NFR7)

5. **Given** application logging **When** any request is processed **Then** passwords, tokens, and JWT secrets are never included in log output (NFR9)

6. **Given** the backend CORS configuration **When** a request arrives from an origin other than CORS_ORIGIN **Then** the request is rejected (NFR10)

## Tasks / Subtasks

- [x] Task 1: Backend — `POST /api/auth/logout` endpoint (AC: #1)
  - [x] 1.1 Add a `POST /logout` endpoint to `backend/app/routers/auth.py` (after the existing `/me` endpoint):
    - Depends on `get_current_user` — anonymous requests get 401 via the existing dependency chain (the endpoint is authenticated by nature; you're logging someone out)
    - Accept no request body
    - Call `response.delete_cookie(key=settings.auth_cookie_name, path="/", samesite=settings.auth_cookie_samesite, secure=settings.auth_cookie_secure, httponly=True)` — all attributes must exactly match those in `_issue_auth_cookie` so the browser actually overwrites the cookie. The `path="/"` is critical: if it doesn't match the issued cookie's path, the browser will NOT delete it.
    - Return `{"status": "ok"}` with status 200. Architectural justification: PRD FR3 says "clears cookie, returns 200"; the literal reading is 200 with a body. Using `{"status": "ok"}` (not the error envelope shape) because this is a success response, not a domain object. Define a small `LogoutResponse(BaseModel)` with `status: str` for type safety on the `response_model`.
  - [x] 1.2 Update the module docstring at the top of `auth.py` from "register, login, me" to "register, login, me, logout" for accuracy.

- [x] Task 2: Backend tests — logout (AC: #1, #5)
  - [x] 2.1 Add the following tests to `backend/tests/test_auth.py` under a new `# Logout (Story 2.3)` section:
    - `test_logout_success`: register a user (captures auth cookie automatically via TestClient) → `POST /api/auth/logout` → assert 200; assert response body is `{"status": "ok"}`; assert `Set-Cookie` header contains `access_token=` with either an empty value or `Max-Age=0` (FastAPI's `delete_cookie` uses `Max-Age=0` and sets the value to `"null"` — assert one of these is present)
    - `test_logout_unauthenticated`: `POST /api/auth/logout` with no cookie → 401 + `UNAUTHORIZED` (via `_assert_error_envelope`)
    - `test_logout_then_me`: register → `POST /api/auth/logout` → `GET /api/auth/me` → 401 + `UNAUTHORIZED`. Add a comment in the test explaining: "After `delete_cookie`, the TestClient's cookie jar receives the `Max-Age=0` Set-Cookie and drops the cookie. The next `/me` sends no cookie, hence 401. Note: logout does NOT invalidate the JWT server-side (stateless JWT). If an attacker has already extracted the raw token, it remains valid until expiry. Logout is a client-side cookie clear — an intentional architectural choice."
  - [x] 2.2 `test_login_does_not_log_plaintext_password`: mirror the existing `test_register_does_not_log_plaintext_password` pattern for the login path. Register a user, then login with a unique password string, capture logs with `caplog.at_level(logging.DEBUG)`, assert the password does not appear in any log record. Low effort, maintains NFR9 parity.

- [x] Task 3: Backend tests — per-user isolation verification (AC: #3, #4)
  - [x] 3.1 `test_me_isolates_to_cookie_owner`: register User A (`alice@example.com`) → capture the `access_token` cookie value from the `Set-Cookie` header → register User B (`bob@example.com`) (this overwrites the TestClient's cookie jar with User B's cookie) → manually set the cookie back to User A's captured value via `client.cookies.set(settings.auth_cookie_name, user_a_token)` → `GET /api/auth/me` → assert response email is `alice@example.com`, NOT `bob@example.com`. This trivially demonstrates that `get_current_user` scopes to the cookie owner, which is the foundation for all per-user isolation in Epic 3.
  - [x] 3.2 Add a comment block above this test explaining: "`get_current_user` returns the full `User` ORM object (not just user_id). All future per-user queries (Epic 3 todos) will filter by `user.id`. This test verifies the protected-endpoint pattern correctly scopes to the cookie owner."

- [x] Task 4: Backend tests — CORS enforcement (AC: #6)
  - [x] 4.1 `test_cors_rejects_unknown_origin`: send `OPTIONS /api/auth/register` with `Origin: http://evil.example.com` and `Access-Control-Request-Method: POST` headers → assert the response does NOT contain `Access-Control-Allow-Origin: http://evil.example.com`. FastAPI's CORSMiddleware will still return a response (likely 400 or 200 without the CORS headers), but the browser would block the actual request because the `Access-Control-Allow-Origin` header is absent or doesn't match. Assert `response.headers.get("access-control-allow-origin") != "http://evil.example.com"`.
  - [x] 4.2 `test_cors_allows_configured_origin`: send `OPTIONS /api/auth/register` with `Origin: http://localhost:5173` (the dev CORS_ORIGIN from settings) and `Access-Control-Request-Method: POST` → assert `Access-Control-Allow-Origin` header is present and equals the configured origin. This is the positive-case complement to 4.1.

- [x] Task 5: Frontend — implement `useLogout` (AC: #2)
  - [x] 5.1 In `frontend/src/hooks/use-auth.ts`, replace the `useLogout` throw-stub with a real implementation:
    - Import `queryClient` from `@/lib/query-client`
    - Return a `useMutation` that:
      - `mutationFn`: calls `apiFetch<{ status: string }>("/api/auth/logout", { method: "POST" })` — no body
      - `onSuccess`: calls `setUser(null)` AND calls `queryClient.invalidateQueries({ queryKey: ["auth", "me"] })` — this clears the cached `/me` result so a subsequent login re-fetches cleanly. Also call `queryClient.removeQueries({ queryKey: ["todos"] })` for forward-compatibility with Epic 3 (todo cache should not survive logout).
      - `onError`: STILL calls `setUser(null)` — if logout fails (e.g., 401 because cookie is already invalid/expired), the frontend should still reflect logged-out state. A failed logout means you're already effectively logged out.
    - The mutation result is returned so callers can access `isPending` and `mutate`
  - [x] 5.2 Verify the import structure: `use-auth.ts` already imports from `@/lib/api` and `@/types`. The new import of `queryClient` from `@/lib/query-client` is the only addition. No new packages needed.

- [x] Task 6: Frontend — logout button on HomePage (AC: #2)
  - [x] 6.1 In `frontend/src/pages/home.tsx`:
    - Import `useLogout` from `@/hooks/use-auth`
    - Call `const logout = useLogout()` inside the component body
    - Add a "Sign out" `<Button>` with `variant="outline"` (or `"ghost"` — keep it minimal) that calls `logout.mutate()` on click. Disable the button while `logout.isPending`.
    - Place the button in the existing content area (next to or below the "You're signed in." text). No layout overhaul — this is a placeholder page until Epic 3.
    - The existing inline auth guard (`if (!isAuthenticated) return <Navigate to="/login" replace />`) will handle the redirect once `setUser(null)` fires in `onSuccess` or `onError`, flipping `isAuthenticated` to false.
  - [x] 6.2 Do NOT restructure the page, do NOT move the guard into an `AuthGuard` wrapper (Story 2.4), and do NOT add a header/navbar (Epic 3/4). Keep changes minimal.

- [x] Task 7: End-to-end smoke (AC: #1, #2, #3, #4, #5, #6)
  - [x] 7.1 `make test-backend` → all existing tests (19) plus new tests (approximately 7 new: logout success, logout unauth, logout-then-me, me-isolates, login-no-log-password, CORS reject, CORS allow) = approximately 26 total, all green.
  - [x] 7.2 Playwright browser smoke:
    - Navigate to `/login` → sign in with existing credentials (or register if needed)
    - Verify redirect to `/` with "You're signed in." content and a "Sign out" button visible
    - Click "Sign out" → verify redirect to `/login`
    - Verify the `access_token` cookie is gone (or empty) via `page.context().cookies()`
    - Attempt to navigate directly to `/` → should redirect back to `/login` (cookie cleared, no session)

## Dev Notes

### Critical Architecture Constraints

- **Cookie attributes on delete MUST exactly match cookie attributes on issue.** `response.delete_cookie(key=settings.auth_cookie_name, path="/", samesite=settings.auth_cookie_samesite, secure=settings.auth_cookie_secure, httponly=True)` must mirror `_issue_auth_cookie`'s `response.set_cookie(...)` call in `auth.py` line 69-77. If `path`, `samesite`, `secure`, or `httponly` differ, the browser will NOT delete the cookie — it will create a second cookie instead. This is the single most common logout bug.
- **Logout is a client-side cookie clear — NOT a server-side JWT invalidation.** JWTs are stateless; there is no revocation store. If an attacker has already extracted the raw JWT value, they can replay it until it expires (7 days). This is an intentional architectural choice for v1. A server-side blocklist is out of scope and tracked as a potential future enhancement. Document this as a `[Decision]` finding in the review.
- **`get_current_user` is the auth boundary.** It is already implemented in `backend/app/core/deps.py` (Story 2.2). It returns the full `User` ORM object. All protected endpoints depend on it — no endpoint should extract the cookie or validate the JWT independently.
- **Per-user isolation enforcement at the dependency level, not per-route.** Architecture mandates this. In practice, this means every future query in `routers/todos.py` (Epic 3) will receive the `User` from `get_current_user` and filter by `user.id`. Story 2.3 verifies the pattern works via `/me`; Epic 3 applies it to todos.
- **No sensitive data in logs (NFR9).** Do not log the cookie value, JWT token, or any password in the logout endpoint or test fixtures.
- **Error envelope contract.** The logout endpoint returns `{"status": "ok"}` on 200 — this is a success shape, NOT the error envelope `{"detail": "...", "code": "..."}`. The error envelope is only for error responses. Unauthenticated logout attempts get the standard 401 + `{"detail": "Not authenticated", "code": "UNAUTHORIZED"}` via `get_current_user`.

### Previous Story Intelligence (Stories 2.1, 2.2)

1. **`get_current_user` is already implemented** in `backend/app/core/deps.py` (Story 2.2, lines 37-64). It extracts the JWT from the cookie, validates signature/expiry, resolves the `User` row, and returns it. Story 2.3 depends on it; do NOT redefine or modify it.
2. **`_issue_auth_cookie` is the reference for cookie attributes** in `backend/app/routers/auth.py` (lines 66-77). The `delete_cookie` call must use exactly `key=settings.auth_cookie_name, path="/", samesite=settings.auth_cookie_samesite, secure=settings.auth_cookie_secure, httponly=True`. Note that `_issue_auth_cookie` also sets `max_age`; `delete_cookie` sets `Max-Age=0` automatically.
3. **`api_error()` helper** is in `backend/app/errors.py`. Use it for all domain errors (the logout endpoint does not raise domain errors itself — `get_current_user` handles the 401). The logout endpoint only returns the success body.
4. **`_assert_error_envelope` and `_assert_user_read_shape` test helpers** are in `backend/tests/test_auth.py`. Reuse `_assert_error_envelope` for the unauthenticated-logout and logout-then-me test assertions.
5. **`_register` and `_login` test helpers** are also in `test_auth.py`. Reuse `_register` for setting up users in the new logout tests.
6. **Auth context** (`frontend/src/hooks/auth-context.ts`) exposes `{ user, isAuthenticated, isLoading, setUser }`. `useLogout` will call `setUser(null)` which flips `isAuthenticated` to `false`, triggering the inline guard in `HomePage` to redirect to `/login`.
7. **Session hydration** (`frontend/src/hooks/auth-provider.tsx`) uses `useQuery({ queryKey: ["auth", "me"] })` with `staleTime: Infinity`. After logout, `queryClient.invalidateQueries({ queryKey: ["auth", "me"] })` will mark this stale and trigger a re-fetch; the re-fetch will 401 (cookie gone), leaving `user` as `null`. The `queryClient.removeQueries({ queryKey: ["todos"] })` call is forward-compatible (no todo queries exist yet, but the pattern is correct for Epic 3).
8. **`queryClient` is a singleton** exported from `frontend/src/lib/query-client.ts`. Import it directly into `use-auth.ts` for the logout mutation's `onSuccess`/`onError` handlers. This is the established pattern — `QueryClientProvider` makes it available via context for hooks, but direct import is fine for imperative operations.
9. **`apiFetch` signature**: `apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T>` — in `frontend/src/lib/api.ts`. For logout: `apiFetch<{ status: string }>("/api/auth/logout", { method: "POST" })`. No body needed. The `credentials: "include"` is automatic.
10. **The inline auth guard in `HomePage`** (`frontend/src/pages/home.tsx`, lines 14-19) checks `isLoading` and `!isAuthenticated`. After logout sets `user` to `null`, `isAuthenticated` becomes `false` and `<Navigate to="/login" replace />` fires. This guard is NOT generalized into `AuthGuard` until Story 2.4.
11. **`useLogout` is currently a throw-stub** in `frontend/src/hooks/use-auth.ts` (lines 45-48). The function signature must change from a bare `throw` to returning a `useMutation` result. No callers currently reference `useLogout` (the throw prevented use), so this is a safe replacement.
12. **Test file organization**: backend tests go in `backend/tests/test_auth.py` (already has Story 2.1 + 2.2 tests). Add the new Story 2.3 tests under a new comment section. Frontend test files co-locate next to source (e.g., `frontend/src/hooks/use-auth.test.ts`) but no frontend unit tests are required in this story — the Playwright smoke covers the frontend integration.

### Epic 1 Retro Actions (ongoing)

- **P1** (lockfile discipline): No frontend deps added in this story — no lockfile churn expected. If any `package.json` change occurs (unlikely), regenerate `pnpm-lock.yaml` in the same patch.
- **P2** (Previous Story Intelligence section): Present above — satisfied.

### What NOT To Do

- Do NOT build the `AuthGuard` component — that is Story 2.4. Keep the inline guard in `HomePage`.
- Do NOT implement the global 401 interceptor in `api.ts` — that is Story 2.4. The `TODO(Story 2.4)` comment in `api.ts` line 112-114 stays untouched.
- Do NOT add a server-side JWT blocklist / revocation store — out of scope. The architectural choice is stateless JWT; logout is a client-side cookie clear.
- Do NOT invalidate the JWT cryptographically — JWTs are stateless; you cannot "invalidate" a signed token without a server-side store.
- Do NOT add CSRF tokens — tracked in `deferred-work.md` from Story 2.1. `samesite=lax` is sufficient for single-domain.
- Do NOT add todo CRUD scaffolding — that is Epic 3. The `removeQueries({ queryKey: ["todos"] })` call in `useLogout` is forward-compatible cleanup only.
- Do NOT change cookie attributes — `delete_cookie` must use EXACTLY the same `path`/`samesite`/`secure`/`httponly` as `_issue_auth_cookie`. Do not add or remove any attribute.
- Do NOT log tokens, passwords, or auth cookies anywhere — NFR9.
- Do NOT modify `get_current_user` in `core/deps.py` — it is complete from Story 2.2 and serves this story as-is.
- Do NOT modify `_issue_auth_cookie` — it is correct and complete from Story 2.1.
- Do NOT add a header/navbar/sidebar to `HomePage` — the page is a placeholder until Epic 3/4. Add only the "Sign out" button.
- Do NOT add new frontend dependencies — `@tanstack/react-query` and `react-router` are already installed. `useLogout` uses `useMutation` which is already imported in `use-auth.ts`.
- Do NOT re-list items already tracked in `deferred-work.md` (passlib EOL, timezone-naive `created_at`, Alembic naming convention, CSRF tokens, race condition on duplicate email, etc.). Just ensure this story does not accidentally un-defer or conflict with them.
- Do NOT use `react-router-dom` — v7 uses the `react-router` package (established in Story 2.1).

### References

- [Source: epics.md#Story 2.3 L325-356]
- [Source: architecture.md#Authentication & Security L182-192]
- [Source: architecture.md#Service Boundaries L484-488]
- [Source: architecture.md#Data Boundaries L490-494]
- [Source: architecture.md#API & Communication Patterns L194-207 — POST /api/auth/logout]
- [Source: architecture.md#Error Codes L303-304 — UNAUTHORIZED]
- [Source: prd.md#FR3 (logout), FR4 (prevent unauth access), FR5 (per-user isolation)]
- [Source: prd.md#NFR7 (per-user isolation on every endpoint), NFR9 (no sensitive data in logs), NFR10 (CORS)]
- [Source: 2-2-user-login-with-jwt-cookie.md#Dev Agent Record — File List (current state)]
- [Source: 2-1-user-registration.md#Critical Architecture Constraints]
- [Source: epic-1-retro-2026-04-15.md#Action Items P1, P2]
- [Source: deferred-work.md — existing debt items, do not re-list]

### Review Findings

- [x] [Review][Decision] Cookie `delete_cookie` attributes exactly mirror `_issue_auth_cookie` (`path="/"`, `samesite`, `secure`, `httponly=True`) -- the single most common logout bug (mismatched attributes causing the browser to create a second cookie instead of deleting) is correctly avoided. [backend/app/routers/auth.py:177-183]
- [x] [Review][Decision] JWT is stateless -- logout is a client-side cookie clear only. No server-side revocation store. A compromised token remains valid until expiry (7 days). Intentional v1 architectural choice per architecture.md. [backend/app/routers/auth.py:167-184]
- [x] [Review][Decision] `useLogout.onError` also clears auth state (`setUser(null)` + cache invalidation) -- if logout fails (e.g., 401 because cookie already expired), the UI still reflects logged-out state. Defensive and correct. [frontend/src/hooks/use-auth.ts:56-61]
- [x] [Review][Decision] `test_me_isolates_to_cookie_owner` directly proves per-user isolation at the `get_current_user` dependency level by swapping cookies between two registered users and verifying `/me` scopes to the cookie owner. Foundation for all Epic 3 per-user queries. [backend/tests/test_auth.py:313-331]
- [x] [Review][Decision] CORS tests assert header presence/absence (not HTTP status) -- correct, since CORS is browser-enforced; FastAPI's CORSMiddleware returns 200 regardless. [backend/tests/test_auth.py:339-358]
- [x] [Review][Decision] `LogoutResponse(BaseModel)` with `status: str` provides type safety on `response_model` without over-constraining. The endpoint always returns `{"status": "ok"}` -- success shape, not the error envelope. [backend/app/routers/auth.py:61-62]
- [x] [Review][Decision] Forward-compatible `removeQueries({ queryKey: ["todos"] })` in logout -- no-op today (no todo queries exist), correct cache cleanup for Epic 3. [frontend/src/hooks/use-auth.ts:54]
- [x] [Review][Decision] `# noqa: ARG001` on unused `user` parameter in logout endpoint -- the `Depends(get_current_user)` is used purely for authentication gating; the resolved user object is intentionally discarded. Clean suppression. [backend/app/routers/auth.py:170]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context) (dev-story subagent)

### Debug Log References

- No cookie-matching issues encountered. `delete_cookie` attributes exactly mirror `_issue_auth_cookie` (`path="/"`, `samesite=settings.auth_cookie_samesite`, `secure=settings.auth_cookie_secure`, `httponly=True`). TestClient correctly drops the cookie on `Max-Age=0`.
- CORS tests: FastAPI's CORSMiddleware on OPTIONS preflight returns 200 with or without CORS headers. The test asserts header presence/absence rather than HTTP status, which is the correct pattern since CORS is browser-enforced.
- Playwright console errors: 3 `401 Unauthorized` errors from `GET /api/auth/me` -- these are expected browser devtools network noise (initial page load without cookie, post-logout `/me` re-fetch, and guard-redirect page load). No application-level errors.

### Completion Notes List

1. **[Decision] JWT is stateless -- logout is a client-side cookie clear.** A compromised token remains valid until expiry (7 days). There is no server-side revocation store. This is an intentional v1 architectural choice. A blocklist is out of scope and tracked as potential future enhancement.
2. **Per-user isolation is enforced by `get_current_user`** returning the correct `User` row based on JWT `sub`. The `test_me_isolates_to_cookie_owner` test verifies this pattern. Epic 3's todo queries will `.where(Todo.user_id == user.id)` off this dependency.
3. **No dependencies added** -- P1 lockfile discipline maintained. No `package.json` or `pnpm-lock.yaml` changes.
4. **P2 Previous Story Intelligence section** present in the story spec and followed throughout implementation.
5. **`useLogout` `onError` handler also clears auth state** -- if logout fails (e.g., cookie already expired), the UI still reflects logged-out state. This is defensive by design.
6. **Forward-compatible `removeQueries({ queryKey: ["todos"] })`** included in logout mutation for Epic 3 todo cache cleanup. No todo queries exist yet.
7. **Module docstring updated** from "register, login, me" to "register, login, me, logout" per Task 1.2 (was already partially done from Story 2.2 prep -- confirmed the final text is accurate).

### Change Log

- 2026-04-15: Story 2.3 implemented -- logout endpoint, frontend useLogout + Sign out button, 7 new backend tests (26 total), Playwright smoke verified.

### File List

- `backend/app/routers/auth.py` -- Modified: added `LogoutResponse` schema, `POST /logout` endpoint, updated module docstring
- `backend/tests/test_auth.py` -- Modified: added 7 tests under Logout, Per-user isolation, and CORS enforcement sections; updated module docstring
- `frontend/src/hooks/use-auth.ts` -- Modified: replaced `useLogout` throw-stub with real `useMutation` implementation; added `queryClient` import
- `frontend/src/pages/home.tsx` -- Modified: added `useLogout` hook call, replaced placeholder `<Button>` with "Sign out" button wired to `logout.mutate()`
- `_bmad-output/implementation-artifacts/2-3-logout-and-per-user-data-isolation.md` -- Modified: ticked all task checkboxes, filled Dev Agent Record
