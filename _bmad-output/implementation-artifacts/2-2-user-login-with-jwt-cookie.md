# Story 2.2: User Login with JWT Cookie

Status: done

## Story

As a registered user,
I want to log in with my email and password,
so that I can access my todos securely.

## Acceptance Criteria

1. **Given** a registered user exists **When** they send `POST /api/auth/login` with correct credentials **Then** the server validates the password against the bcrypt hash, returns the user object (without `hashed_password`), and sets a signed JWT (HS256, 7-day expiry) in an httpOnly cookie (FR6)

2. **Given** a visitor sends `POST /api/auth/login` with incorrect credentials (either wrong password OR unknown email) **When** the server processes the request **Then** it returns **401** with `{ "detail": "Invalid email or password", "code": "INVALID_CREDENTIALS" }` (no disclosure of whether the email exists)

3. **Given** the frontend login form **When** a user submits valid credentials **Then** the auth context is populated with the user object and the user is redirected to `/`

4. **Given** the frontend `api.ts` utility **When** any HTTP request is made **Then** it includes `credentials: 'include'` **and** transforms snake_case response keys to camelCase and camelCase request keys to snake_case _(already delivered in Story 2.1; this AC is re-validated here, not re-implemented)_

5. **Given** a JWT cookie exists in the browser **When** the user refreshes the page or returns to the app **Then** the app validates the session (`GET /api/auth/me`) and populates auth context without requiring re-login

## Tasks / Subtasks

- [x] Task 1: Backend — implement `get_current_user` dependency (AC: #5; also unblocks Story 2.3's protected endpoints)
  - [x] 1.1 Remove the Story-2.3 TODO marker in `backend/app/core/deps.py` and add `get_current_user(db: Session = Depends(get_db), request: Request)`:
    - Read the token from `request.cookies.get(settings.auth_cookie_name)`
    - If the cookie is absent → raise `api_error(401, "Not authenticated", "UNAUTHORIZED")`
    - Decode via `decode_access_token(token)` — on `InvalidTokenError` raise the same 401
    - Extract `sub` → `int(sub)`; look up `User` by `id`; if not found → 401 with same envelope
    - Return the `User` instance
  - [x] 1.2 Export `get_current_user` so routers can import it: no change needed (function is module-level)

- [x] Task 2: Backend — `POST /api/auth/login` (AC: #1, #2)
  - [x] 2.1 Extend `backend/app/routers/auth.py`:
    - `LoginRequest(BaseModel)`: `email: EmailStr`, `password: str` — NO `min_length=8` on login (don't leak that short passwords are "invalid format" vs "invalid creds"). Apply the same lowercase-on-validate email validator used by `RegisterRequest` (factor it into a module-level validator or a shared base class if that stays <20 LOC; otherwise duplicate — don't over-engineer)
    - Endpoint `POST /login`:
      1. Look up the user by email
      2. If the user is missing, **still run `verify_password`** against a known-bad hash to equalize timing (store the dummy hash as a module-level constant). This prevents a timing-side-channel that discloses email existence.
      3. If either the user is missing OR `verify_password` fails → raise `api_error(401, "Invalid email or password", "INVALID_CREDENTIALS")`
      4. On success: call `_issue_auth_cookie(response, user.id)`, return `UserRead`
    - Return `UserRead` with status 200 (not 201 — login is not a creation)

- [x] Task 3: Backend — `GET /api/auth/me` (AC: #5)
  - [x] 3.1 Add endpoint `GET /me` to `backend/app/routers/auth.py`:
    - `def me(user: User = Depends(get_current_user)) -> User:` → returns `UserRead`
    - No body; the cookie does the auth
    - On missing/invalid/expired cookie → 401 via `get_current_user`'s error path (same envelope)

- [x] Task 4: Backend tests (AC: #1, #2, #5)
  - [x] 4.1 Extend `backend/tests/test_auth.py`:
    - `test_login_success`: register → login with same creds → 200; response body matches `UserRead` shape exactly `{id, email, created_at}`; `Set-Cookie: access_token=...; HttpOnly` present
    - `test_login_wrong_password`: register → login with wrong password → 401 with `{"detail":"Invalid email or password","code":"INVALID_CREDENTIALS"}` (use `_assert_error_envelope`)
    - `test_login_unknown_email`: login against a fresh DB with no matching user → 401 with same envelope (must not leak existence)
    - `test_login_case_insensitive_email`: register `Foo@Bar.com` → login with `foo@bar.com` → 200
    - `test_login_missing_email_or_password`: body missing either field → 422 + `VALIDATION_ERROR`
    - `test_me_authenticated`: register → capture `access_token` cookie → GET `/api/auth/me` with cookie → 200 with `UserRead`
    - `test_me_unauthenticated`: GET `/api/auth/me` with no cookie → 401 + `UNAUTHORIZED`
    - `test_me_invalid_token`: GET `/api/auth/me` with a bogus cookie value → 401 + `UNAUTHORIZED`
    - `test_me_expired_token`: craft a JWT with `exp` in the past using `create_access_token(subject=..., expires_in=timedelta(seconds=-1))` or manually; GET `/me` → 401 + `UNAUTHORIZED`

- [x] Task 5: Frontend — implement `useLogin` (AC: #3)
  - [x] 5.1 Replace the `throw` stub in `frontend/src/hooks/use-auth.ts`:
    - `useMutation` that calls `apiFetch<User>("/api/auth/login", { method: "POST", body: { email, password } })`
    - `onSuccess: (user) => setUser(user)`
  - [x] 5.2 No `useLogout` changes in this story — that stays a TODO marker for Story 2.3

- [x] Task 6: Frontend — session hydration on mount (AC: #5)
  - [x] 6.1 In `frontend/src/hooks/auth-provider.tsx`:
    - Replace the `TODO(Story 2.2)` hydration comment with a `useQuery` call:
      ```ts
      const meQuery = useQuery({
        queryKey: ["auth", "me"],
        queryFn: () => apiFetch<User>("/api/auth/me"),
        retry: false,
        staleTime: Infinity,
      })
      ```
    - On `meQuery.data` → `setUser(data)`
    - On `meQuery.isError` (most likely 401) → leave `user` as `null`
    - Expose a loading flag: extend `AuthContextValue` with `isLoading: boolean` (true until `meQuery` is settled on initial mount). Update `auth-context.ts` and every consumer.
    - Add `isHydrating` guard in `<LoginPage />` and `<HomePage />` so the brief hydration window doesn't flash a redirect in the wrong direction (per architecture: "brief blank while validating cookie")
  - [x] 6.2 `<HomePage />` should redirect to `/login` if `!isAuthenticated && !isLoading` — this is a minimal, story-2.2-scoped guard. The generalized `AuthGuard` component lands in Story 2.4.

- [x] Task 7: Frontend — wire `AuthScreen` Sign In submit (AC: #3)
  - [x] 7.1 In `frontend/src/components/auth-screen.tsx`:
    - Flip the default `mode` from `"sign-up"` to `"sign-in"` — now that Login works, it's the primary path. Registration is the "create an account" escape hatch.
    - Call `useLogin` at the top of the component alongside `useRegister`
    - In `onSubmit`: if `mode === "sign-in"` → `login.mutate(values)`; else → `register.mutate(values)`
    - `serverError` surfaces either mutation's `ApiClientError.payload.detail`
    - `disabled={login.isPending || register.isPending}` on the submit button
    - Submit button label: "Sign in" in sign-in mode, "Sign up" in sign-up mode (already implemented for the label; just ensure the pending-state text is correct: "Signing in..." / "Creating account...")
    - On mode toggle, reset **both** mutations (`login.reset()`, `register.reset()`)

- [x] Task 8: End-to-end smoke (AC: #1, #2, #3, #5)
  - [x] 8.1 `make test-backend` → all previous + new tests pass
  - [x] 8.2 Playwright browser smoke:
    - Navigate to `/login` → defaults to Sign In mode
    - Attempt login with bogus email → "Invalid email or password" alert
    - Toggle to Sign Up → register a fresh account → redirected to `/` → HomePage shows
    - Reload the page while on `/` → stays on `/` (session hydrated)
    - Manually delete the cookie via Playwright (or clear cookies) → reload → redirects to `/login`

### Review Findings

- [x] [Review][Patch] Frontend zod schema applied `min(8)` to password in BOTH modes — behavioral mismatch with backend's deliberate no-min-length on `LoginRequest.password`. A user with a sub-8-char password would be blocked client-side from logging in even though the server would accept them. Fix: split schema into `signUpSchema` (min 8) and `signInSchema` (min 1, just "not empty"); `useForm` swaps resolver based on `mode`. [frontend/src/components/auth-screen.tsx]
- [x] [Review][Defer] Empty/whitespace-only password in login body reaches bcrypt — backend has no `min_length`, so `""` or `"   "` hits `verify_password` against the real hash. bcrypt handles this safely (returns false → 401), so functionally fine. One wasted bcrypt cycle per request. Low priority; frontend schema blocks this from the UI. No action. Noted in deferred-work if it ever matters. [backend/app/routers/auth.py]
- [x] [Review][Decision] `_DUMMY_PASSWORD_HASH` cost factor matches the real bcrypt cost (12) — timing-attack defence correctly equalized. [backend/app/routers/auth.py]
- [x] [Review][Decision] `test_login_missing_email_or_password` split into two tests — strictly superior coverage vs. spec. [backend/tests/test_auth.py]
- [x] [Review][Decision] Extra `test_me_token_for_deleted_user` beyond spec — valuable edge-case coverage for the "valid JWT, missing user row" path. [backend/tests/test_auth.py]
- [x] [Review][Decision] `get_current_user` handles malformed `sub` safely — `isinstance(sub, str)` + `try/except ValueError` around `int()`. All bad-token paths return 401, not 500. [backend/app/core/deps.py]
- [x] [Review][Decision] `/login` and `/me` serialize via `response_model=UserRead` — `hashed_password` excluded by FastAPI filter; confirmed by shape assertions in tests. [backend/app/routers/auth.py]
- [x] [Review][Decision] `useState` + `useEffect` sync in `auth-provider.tsx` — NOT the forbidden "data fetching via useEffect+useState" anti-pattern. `useQuery` IS the fetcher; `useState` is a writable target shared with mutation `onSuccess`. Standard TanStack pattern for this shape of state. Alternative (fully cache-resident user via `setQueryData`) would be cleaner but isn't required. [frontend/src/hooks/auth-provider.tsx]
- [x] [Review][Decision] `useQuery.isLoading` semantics correct here — only true during initial fetch; `staleTime: Infinity` prevents later refetches from re-entering loading. No guard flickering risk. [frontend/src/hooks/auth-provider.tsx]
- [x] [Review][Decision] No race between `/me` query and `useLogin.onSuccess` — `meQuery.data` stays undefined after 401, so the sync useEffect won't overwrite a user set by mutation. [frontend/src/hooks/auth-provider.tsx]
- [x] [Review][Decision] Double-click protection on submit — `disabled={login.isPending || register.isPending}` fires synchronously on mutate, second click is no-op. [frontend/src/components/auth-screen.tsx]
- [x] [Review][Decision] Hydration guards match architecture "brief blank while validating cookie" — both LoginPage and HomePage render `<div />` while `isLoading`. [frontend/src/pages/login.tsx, frontend/src/pages/home.tsx]
- [x] [Review][Decision] Component tree order verified — `ThemeProvider > QueryClientProvider > AuthProvider > BrowserRouter`; `useQuery` in AuthProvider is inside QueryClientProvider. [frontend/src/main.tsx, frontend/src/app.tsx]
- [x] [Review][Decision] `credentials: 'include'` + camelCase/snake_case transforms verified in `api.ts` — AC #4 re-validated, not reimplemented. [frontend/src/lib/api.ts]

## Dev Notes

### Critical Architecture Constraints

- **Timing-safe error path for unknown email.** Always run bcrypt `verify_password` even when the email is not found — against a fixed dummy hash. Otherwise the response-time delta discloses whether an email is registered. [Source: architecture.md#Authentication & Security L182-192; NFR security]
- **Single error message for all auth failures on login.** Both "unknown email" and "wrong password" return the same `INVALID_CREDENTIALS` envelope. AC #2 mandates the same message.
- **Session hydration must not block the UI indefinitely.** Architecture says "brief blank while validating cookie". `isLoading` exposed via auth context is the mechanism. [Source: architecture.md#Loading State Patterns L333-336]
- **`credentials: 'include'` is already on every request** (Story 2.1's `api.ts`). No additional work here — AC #4 is a re-validation, not a reimplementation.
- **`useState` + `useEffect` for data fetching is forbidden.** Hydration must use `useQuery` (TanStack Query). [Source: architecture.md#Anti-Patterns L359-366]

### Previous Story Intelligence (Story 2.1)

1. **`get_current_user` was a TODO marker in `core/deps.py`** (left by Story 2.1). Task 1 removes the marker and fills in the function.
2. **`_issue_auth_cookie` is already implemented** in `routers/auth.py` (Story 2.1). Login reuses it — do not duplicate the cookie config.
3. **Error envelope is enforced by `app/errors.py`** — use `api_error()` for all domain errors. 401 + `UNAUTHORIZED` for auth failures at the cookie/token layer; 401 + `INVALID_CREDENTIALS` for bad login attempts. **These are intentionally different codes.**
4. **Test fixtures** (`client`, `session`) already do the `dependency_overrides` dance (Story 2.1 `conftest.py`). New tests piggyback without new fixtures.
5. **422 tests already assert strict shape** via `_assert_error_envelope` helper (Story 2.1 review patch). Reuse it for 401 tests too.
6. **Frontend `useLogin` and `useLogout` are currently `throw` stubs** — Story 2.1 used strong throws deliberately so accidental callsites crash loudly. Task 5 replaces `useLogin`.
7. **`AuthScreen` was defaulted to `sign-up` in Story 2.1** — flip to `sign-in` now that login works.
8. **`AuthContextValue` has `user, isAuthenticated, setUser`** — extending with `isLoading` is a breaking change only for the (internal) consumers. Update `auth-context.ts`, `auth-provider.tsx`, and `use-auth.ts` in one patch.
9. **Frontend `TanStack Query` is wired via `QueryClientProvider`** in `main.tsx`. `useQuery` for `/me` lands inside `AuthProvider` — which means `AuthProvider` must be a child of `QueryClientProvider`. Verify the tree in `main.tsx` / `app.tsx` is `ThemeProvider > QueryClientProvider > AuthProvider > BrowserRouter` before merging.

### Epic 1 Retro Actions (ongoing)

- **P1** (lockfile discipline) — no frontend deps added in this story; nothing to regenerate.
- **P2** (Previous Story Intelligence) — present above.

### What NOT To Do

- Do NOT implement logout (`POST /api/auth/logout`, `useLogout`) — Story 2.3.
- Do NOT build `AuthGuard` component — Story 2.4. The inline `HomePage` guard in Task 6.2 is the story-2.2-scoped minimum; Story 2.4 generalizes.
- Do NOT add a "remember me" checkbox, email verification, password reset, MFA — out of PRD scope.
- Do NOT log the plaintext password in the login path or anywhere else.
- Do NOT return different error messages for "unknown email" vs "wrong password" — information disclosure (NFR5/6/9 spirit).
- Do NOT skip the dummy-hash bcrypt call for the unknown-email branch — timing disclosure.
- Do NOT change the cookie attributes — Story 2.1 already sets `httponly`, `samesite=lax`, `secure=false-in-dev`, `path=/`. Login reuses the same helper.

### References

- [Source: epics.md#Story 2.2 L296-323]
- [Source: architecture.md#Authentication & Security L182-192]
- [Source: architecture.md#Auth State L326-329]
- [Source: architecture.md#Loading State Patterns L333-336]
- [Source: 2-1-user-registration.md#Dev Agent Record — File List] — confirms current repo state
- [Source: epic-1-retro-2026-04-15.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context) (via general-purpose subagent)

### Debug Log References

- **Existing session cookie from Story 2.1 smoke test** — initial Playwright navigation to `/login` was immediately redirected to `/` because a valid `access_token` cookie remained from the Story 2.1 end-to-end registration test. Resolved by clearing cookies via `page.context().clearCookies()` before starting the smoke test sequence. Not a code bug — expected browser state persistence.
- **Browser-level 401 console error on `/api/auth/me`** — when unauthenticated, the browser logs the 401 response from `GET /api/auth/me` as a network error in the console. This is expected behavior: the `useQuery` with `retry: false` handles it gracefully (leaves `user` as `null`). Not an application error — verified zero application-level console errors on the final authenticated page state.
- **No typecheck or lint failures** — both `pnpm typecheck` and `pnpm lint` passed clean on first run after all code changes. No ESLint overrides needed; the file-split pattern from Story 2.1 (auth-context/auth-provider/use-auth) continued to satisfy `react-refresh/only-export-components`.

### Completion Notes List

- **Task 5 (useLogin):** Replaced the `throw` stub with a real `useMutation` calling `POST /api/auth/login` via `apiFetch`. `onSuccess` sets the user in auth context. `useLogout` remains a throw-stub for Story 2.3.
- **Task 6 (session hydration):** Added `useQuery` for `GET /api/auth/me` in `AuthProvider` with `retry: false` and `staleTime: Infinity`. Extended `AuthContextValue` with `isLoading: boolean`. Both `LoginPage` and `HomePage` now render an empty `<div />` while `isLoading` is true, preventing flash-redirects during hydration.
- **Task 6.2 (minimal guard):** `HomePage` redirects to `/login` when `!isAuthenticated && !isLoading`. This is the story-2.2-scoped minimum; the generalized `AuthGuard` component lands in Story 2.4.
- **Task 7 (AuthScreen wiring):** Default mode flipped to `"sign-in"`. `useLogin` called alongside `useRegister`. Submit dispatches to the correct mutation based on mode. `serverError` shows the active mode's mutation error. Submit button disabled during either mutation's pending state. Pending labels: "Signing in..." / "Creating account...". Mode toggle resets both mutations.
- **Task 8.2 (Playwright smoke):** All steps verified — Sign In default mode, bogus-login error display, Sign Up registration with redirect, session hydration on reload, cookie-clear redirect to `/login`.
- **No deviations from spec.** All architectural constraints respected: no `useState+useEffect` for data fetching, no `any` types, no direct `fetch`, no manual snake_case transforms.
- **Backend untouched** — 19 tests still passing.

### Change Log

- 2026-04-15: Story 2.2 frontend implementation complete. Replaced `useLogin` throw-stub with real `useMutation`, added `useQuery`-based session hydration in `AuthProvider`, extended `AuthContextValue` with `isLoading`, added loading/auth guards to `HomePage` and `LoginPage`, wired `AuthScreen` Sign In submit with dual-mutation support. All quality gates green: typecheck, lint, 19 backend tests, Playwright E2E smoke.

### File List

**Frontend (modified)**
- `frontend/src/hooks/auth-context.ts` (added `isLoading` to `AuthContextValue`)
- `frontend/src/hooks/auth-provider.tsx` (replaced TODO with `useQuery` for `/api/auth/me`, syncs user state, exposes `isLoading`)
- `frontend/src/hooks/use-auth.ts` (replaced `useLogin` throw-stub with real `useMutation`, added `LoginRequest` import)
- `frontend/src/components/auth-screen.tsx` (flipped default mode to sign-in, wired `useLogin`, dual-mutation submit/error/pending/reset)
- `frontend/src/pages/login.tsx` (added `isLoading` guard to prevent flash-redirect during hydration)
- `frontend/src/pages/home.tsx` (added `isLoading` + `!isAuthenticated` guard with `<Navigate to="/login">`)

**Artifacts (modified)**
- `_bmad-output/implementation-artifacts/2-2-user-login-with-jwt-cookie.md` (ticked all task checkboxes, filled Dev Agent Record)
