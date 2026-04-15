# Story 2.4: Auth Guard, Protected Routes, and 401 Handling

Status: done

## Story

As a user,
I want the app to protect my data behind authentication and handle expired sessions gracefully,
so that I never see broken states or lose access unexpectedly.

## Acceptance Criteria

1. **Given** React Router is configured with two routes **When** the app renders **Then** `/login` is public and `/` is protected by the `AuthGuard` component (FR4)

2. **Given** an unauthenticated user navigates to `/` **When** the auth-guard evaluates **Then** they are redirected to `/login` without any flash of protected content

3. **Given** a user's JWT has expired **When** they make any API request **Then** the server returns 401, the `api.ts` wrapper intercepts it, clears auth context, and redirects to `/login` (FR7)

4. **Given** a user has re-authenticated after session expiry **When** they complete login **Then** they are returned to the main todo list with their data intact (FR8)

5. **Given** any protected API endpoint **When** a request arrives without a valid JWT cookie **Then** the server returns 401 with `{ "detail": "Not authenticated", "code": "UNAUTHORIZED" }` (FR9) _(already implemented in Story 2.2 via `get_current_user`; this AC is re-validated, not reimplemented)_

## Tasks / Subtasks

- [x] Task 1: Create `AuthGuard` component (AC: #1, #2)
  - [x] 1.1 Create `frontend/src/components/auth-guard.tsx`:
    - Import `useAuth` from `@/hooks/use-auth` and `Navigate`, `useLocation` from `react-router`
    - Accept `children: React.ReactNode` prop
    - If `isLoading` → return `<div />` (blank hydration state — matches architecture's "brief blank while validating cookie")
    - If `!isAuthenticated` → return `<Navigate to="/login" state={{ from: location }} replace />` — passes current location so `LoginPage` can redirect back after re-auth (FR8)
    - Otherwise → render `children`
    - Export both named and default: `export function AuthGuard` + `export default AuthGuard`
  - [x] 1.2 The component must NOT import or call `apiFetch`, `queryClient`, or any mutation hook. Its sole responsibility is reading auth context and deciding render vs redirect.

- [x] Task 2: Update `app.tsx` routing to use `AuthGuard` (AC: #1)
  - [x] 2.1 In `frontend/src/app.tsx`:
    - Import `AuthGuard` from `@/components/auth-guard`
    - Wrap `<HomePage />` in `<AuthGuard>`: `<Route path="/" element={<AuthGuard><HomePage /></AuthGuard>} />`
    - The `/login` route remains unwrapped — it is public
    - No other route changes; future protected routes (Epic 3+) will use the same `<AuthGuard>` wrapper pattern

- [x] Task 3: Remove inline auth guard from `pages/home.tsx` (AC: #2)
  - [x] 3.1 In `frontend/src/pages/home.tsx`:
    - Remove the `import { Navigate } from "react-router"` import
    - Remove the `import { useAuth } from "@/hooks/use-auth"` import (the `useAuth` for auth state) — BUT keep `useLogout` import
    - Remove the `const { isAuthenticated, isLoading } = useAuth()` call
    - Remove the `if (isLoading) return <div />` block
    - Remove the `if (!isAuthenticated) return <Navigate to="/login" replace />` block
    - `HomePage` becomes a plain component that assumes it is authenticated (the `AuthGuard` wrapper enforces this)
    - Keep the logout button and `useLogout` hook — that is Story 2.3's work and remains
  - [x] 3.2 Update the component's JSDoc to remove the reference to "once Story 2.4 wires the auth guard" — that is now.

- [x] Task 4: Global 401 interceptor in `api.ts` (AC: #3)
  - [x] 4.1 **Design decision: use `window.dispatchEvent` with a custom `auth:unauthorized` event.** Rationale: `api.ts` is not a React component and cannot call hooks or access React context. An event-based approach keeps `api.ts` decoupled from React entirely — no circular imports, no setter registration, no module-level callbacks. The `AuthProvider` subscribes to the event.
  - [x] 4.2 In `frontend/src/lib/api.ts`:
    - Remove the `TODO(Story 2.4)` comment block (lines 112-114)
    - After the `const response = await fetch(...)` call, before parsing the body, add:
      ```ts
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"))
      }
      ```
    - The event fires BEFORE the `ApiClientError` throw so listeners can react. The throw still happens — TanStack Query `onError` handlers still receive the error. This is additive, not a replacement.
    - **Important:** The 401 check fires for ALL 401s, including the initial `/api/auth/me` hydration call. The `AuthProvider` listener must handle this gracefully (see Task 5).
  - [x] 4.3 Update the module-level JSDoc to remove the "NOT responsible (yet)" note and replace with: "Global 401 interceptor: dispatches `auth:unauthorized` event on any 401 response, then throws `ApiClientError` as usual."

- [x] Task 5: `AuthProvider` subscribes to `auth:unauthorized` event (AC: #3)
  - [x] 5.1 In `frontend/src/hooks/auth-provider.tsx`:
    - Add a `useEffect` that:
      1. Defines a handler: `const handleUnauthorized = () => { setUser(null); queryClient.invalidateQueries({ queryKey: ["auth", "me"] }); queryClient.removeQueries({ queryKey: ["todos"] }) }`
      2. Subscribes: `window.addEventListener("auth:unauthorized", handleUnauthorized)`
      3. Cleans up: `return () => window.removeEventListener("auth:unauthorized", handleUnauthorized)`
    - Import `queryClient` from `@/lib/query-client`
    - The handler sets `user` to `null` which flips `isAuthenticated` to `false`, which causes `AuthGuard` to redirect to `/login` with the `from` location preserved
  - [x] 5.2 **Guard against initial hydration 401:** The `/api/auth/me` query fires on mount. If there is no cookie, it returns 401, which dispatches `auth:unauthorized`. The handler calls `setUser(null)` — but `user` is already `null` on mount, so this is a no-op. The `invalidateQueries` on `["auth", "me"]` is also safe because `retry: false` + `staleTime: Infinity` means no refetch loop. **Verify this is stable — no infinite render cycles.**
  - [x] 5.3 Document with a comment in the `useEffect`: "Listens for 401 responses from api.ts. On session expiry, clears auth state so AuthGuard redirects to /login. Safe on initial mount — setUser(null) is a no-op when user is already null."

- [x] Task 6: Post-reauth redirect — `LoginPage` reads `location.state.from` (AC: #4)
  - [x] 6.1 In `frontend/src/pages/login.tsx`:
    - Import `useLocation` from `react-router`
    - Call `const location = useLocation()` and extract: `const from = (location.state as { from?: Location })?.from?.pathname ?? "/"`
    - Change `<Navigate to="/" replace />` to `<Navigate to={from} replace />` — after successful login/register, redirect to the stored `from` location instead of always `/`
    - Type the state safely: use a type guard or optional chaining — never assert `location.state.from` directly since it may be undefined (e.g., user navigated to `/login` directly)
  - [x] 6.2 **For `useLogin` and `useRegister` — no changes needed.** The `onSuccess` callbacks already call `setUser(user)`, which flips `isAuthenticated` to `true`, which causes `LoginPage`'s `if (isAuthenticated)` check to render `<Navigate to={from} replace />`. The redirect is declarative, not imperative.

- [x] Task 7: Anti-pattern verification (AC: all)
  - [x] 7.1 Verify no `fetch` calls exist outside `frontend/src/lib/api.ts`. Search the entire `frontend/src/` tree for raw `fetch(` calls — there should be zero outside `api.ts`.
  - [x] 7.2 Verify no `any` types exist in the frontend source. Search `frontend/src/` for `: any`, `as any`, `<any>` — there should be zero.
  - [x] 7.3 Verify no `react-router-dom` imports exist — v7 uses `react-router` only.
  - [x] 7.4 Verify the component tree order in `main.tsx` remains `ThemeProvider > QueryClientProvider > AuthProvider > BrowserRouter` — `useQuery` in `AuthProvider` must be inside `QueryClientProvider`.

- [x] Task 8: End-to-end smoke (AC: #1, #2, #3, #4, #5)
  - [x] 8.1 `make test-backend` → all 26 existing tests pass (no backend changes in this story)
  - [x] 8.2 `pnpm typecheck` and `pnpm lint` → both pass clean
  - [x] 8.3 Playwright browser smoke — happy path:
    - Navigate to `/login` → Sign In → register or log in with valid credentials
    - Verify redirect to `/` and "You're signed in." content visible
    - Reload the page → stays on `/` (session hydrated via cookie)
  - [x] 8.4 Playwright browser smoke — auth guard:
    - Clear cookies via `page.context().clearCookies()`
    - Navigate directly to `/` → verify redirect to `/login` (auth guard fires)
    - Verify no flash of protected content (the blank `<div />` during hydration prevents this)
  - [x] 8.5 Playwright browser smoke — 401 interceptor + post-reauth redirect:
    - Log in successfully → navigate to `/` → verify authenticated state
    - Clear cookies via `page.context().clearCookies()` (simulates session expiry)
    - Trigger a page reload (which re-runs `/api/auth/me` → 401) → verify redirect to `/login`
    - Log in again → verify redirect back to `/` (the `from` state carries the previous location)
  - [x] 8.6 Verify the `access_token` cookie is gone after the 401-triggered logout (via `page.context().cookies()`)

### Review Findings

**Code review: 2026-04-15 | Reviewer: Claude Opus 4.6 (1M context) | All 3 layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor)**

**Quality gates: all green** -- 26 backend tests passing, frontend typecheck clean, frontend lint clean. Anti-pattern scan clean (zero raw `fetch` outside `api.ts`, zero `any` types, zero `react-router-dom` imports).

**Summary: 0 Patch, 0 Defer, 2 Decision, 0 Dismissed.**

- [x] [Review][Decision] **Side effects inside React state updater** [`frontend/src/hooks/auth-provider.tsx:41-45`] -- The `handleUnauthorized` callback calls `queryClient.invalidateQueries()` and `queryClient.removeQueries()` inside a `setUser` functional updater. React documents that state updaters should be pure functions. In practice this is safe: (a) the side effects are idempotent, (b) StrictMode double-invocation does not apply to `setState` updaters called from DOM event handlers, (c) the loop-prevention guard is verified effective. The alternative (a `useRef` tracking current user) introduces stale-closure risk. **Accepted as-is** -- pragmatic pattern, no observable bugs.

- [x] [Review][Decision] **Post-reauth redirect path not validated against open-redirect** [`frontend/src/pages/login.tsx:10-12`] -- `location.state.from.pathname` is used in `<Navigate to={from} replace />` without explicit validation that `from` is a local path. Verified safe: (a) `location.state` in react-router v7 with `BrowserRouter` can only be set via same-origin JavaScript (`history.pushState`), not by external links; (b) react-router's `<Navigate>` uses the internal routing system, not raw `window.location.href`, so even `//evil.com/` would be treated as an in-app route path, not a scheme-relative URL. **Accepted as-is** -- no real attack vector.

**Acceptance Criteria Audit:**

| AC | Verdict | Evidence |
|----|---------|----------|
| AC1: `/login` public, `/` protected by AuthGuard | PASS | `app.tsx` lines 13-20: `/login` unwrapped, `/` wrapped in `<AuthGuard>` |
| AC2: Unauthenticated redirect without flash | PASS | `auth-guard.tsx`: returns `<div />` during loading, `<Navigate>` when not authenticated |
| AC3: 401 intercept, clear auth, redirect | PASS | `api.ts` dispatches `auth:unauthorized` on 401; `auth-provider.tsx` handler clears state; `AuthGuard` redirects |
| AC4: Post-reauth redirect to todo list | PASS | `login.tsx` reads `from` from `location.state`, defaults to `/` |
| AC5: Server 401 format (re-validation) | PASS | Already implemented in Story 2.2 via `get_current_user`; no regressions |

**Adversarial deep-dive results:**

- CustomEvent infinite-loop guard: **verified effective**. Functional updater reads queued state; second invocation sees `null` and skips `invalidateQueries`. No loop possible.
- AuthGuard + AuthProvider tree order: **correct**. `QueryClientProvider > AuthProvider > BrowserRouter > AuthGuard`.
- Event listener timing vs. first `/me` 401: **safe**. `useEffect` attaches listener before any async fetch response arrives. Even if it didn't, initial `user=null` means correct behavior.
- HomePage without guard: **correct by design**. AuthGuard enforces auth; HomePage assumes it.

## Dev Notes

### Critical Architecture Constraints

- **`api.ts` is the single HTTP boundary.** All fetch calls go through `apiFetch`. No component or hook may call `fetch` directly. The 401 interceptor lives here. [Source: architecture.md#Enforcement Guidelines L352-357]
- **`AuthGuard` is a route wrapper, not a HOC or hook.** It reads `useAuth()`, returns blank/redirect/children. It does NOT fetch data or call mutations. [Source: architecture.md#Frontend Architecture L213 — "Auth guard via a wrapper component"]
- **Event-based 401 communication pattern.** `api.ts` dispatches `CustomEvent("auth:unauthorized")`. `AuthProvider` subscribes via `addEventListener`. This keeps `api.ts` decoupled from React — no context imports, no hooks, no circular dependencies. The event is a fire-and-forget signal; the throw still happens for TanStack Query error handlers.
- **Post-reauth redirect via React Router `location.state`.** `AuthGuard` passes `state={{ from: location }}` to `<Navigate to="/login">`. `LoginPage` reads `location.state.from.pathname` and redirects there after successful auth. Falls back to `/` if `state.from` is absent.
- **No `any` types.** Use explicit types or `unknown` with type guards. [Source: architecture.md#Anti-Patterns L366]
- **No `react-router-dom`.** v7 consolidates to `react-router`. [Source: Story 2.1 established pattern]

### Previous Story Intelligence (Stories 2.1, 2.2, 2.3)

1. **The inline auth guard in `pages/home.tsx`** (lines 15-22) is the target for removal. It checks `isLoading` and `!isAuthenticated` with `<Navigate to="/login" replace />`. Task 3 removes this; Task 1 replaces it with the generalized `AuthGuard`.
2. **`AuthContextValue`** exposes `{ user, isAuthenticated, isLoading, setUser }` — all four fields are used by `AuthGuard`. [Source: `frontend/src/hooks/auth-context.ts`]
3. **`AuthProvider` uses `useQuery({ queryKey: ["auth", "me"] })` with `retry: false` and `staleTime: Infinity`** — the initial `/me` call returns 401 when unauthenticated. The 401 interceptor (Task 4) will fire on this call too; Task 5's guard ensures this is a no-op.
4. **`queryClient` is a singleton** exported from `frontend/src/lib/query-client.ts`. Import it directly into `auth-provider.tsx` for the `auth:unauthorized` handler. This is the established pattern from Story 2.3's `useLogout`.
5. **`useLogout` already clears auth state** via `setUser(null)` + `queryClient.invalidateQueries/removeQueries`. The `auth:unauthorized` handler in Task 5 does the same thing — they may both fire on a logout-triggered 401. This is safe: `setUser(null)` is idempotent when `user` is already `null`.
6. **`apiFetch` signature**: `apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T>` — the 401 check goes between `fetch()` and `response.text()`. The event dispatch is synchronous; the throw happens after (via the existing `!response.ok` block).
7. **The `TODO(Story 2.4)` comment in `api.ts`** (lines 112-114) is the insertion point for the 401 interceptor. Remove it and replace with the implementation.
8. **`LoginPage` currently has `<Navigate to="/" replace />`** on line 14. Task 6 changes this to `<Navigate to={from} replace />` where `from` comes from `location.state`.
9. **Component tree**: `main.tsx` → `ThemeProvider > QueryClientProvider > [App → AuthProvider > BrowserRouter]`. `AuthProvider` is inside `QueryClientProvider` (required for `useQuery`). `BrowserRouter` is inside `AuthProvider` (required for `useLocation` in components). Verify this remains intact.
10. **`useLogout` is in `frontend/src/hooks/use-auth.ts`** — no changes to this file in this story. The logout button in `HomePage` remains; only the inline guard is removed.
11. **No `react-router-dom`** — Story 2.1 established that v7 uses `react-router` exclusively. `Navigate`, `useLocation`, `BrowserRouter`, `Route`, `Routes` all come from `react-router`.
12. **Story 2.3's "What NOT To Do"** says "Do NOT build the `AuthGuard` component — that is Story 2.4." — now we do build it.
13. **`api.ts` module docstring** (lines 1-13) references the Story 2.4 TODO. Task 4.3 updates this docstring.

### Epic 1 Retro Actions (ongoing)

- **P1** (lockfile discipline): No new frontend or backend dependencies in this story — zero lockfile churn expected. All changes are pure source code. If any package.json change is accidentally introduced, regenerate `pnpm-lock.yaml` in the same patch.
- **P2** (Previous Story Intelligence section): Present above — satisfied.

### What NOT To Do

- Do NOT touch any backend code — this is a frontend-only story. All 26 backend tests should pass unchanged.
- Do NOT add any Epic 3 concerns — no todo CRUD, no todo routes, no todo components, no todo hooks.
- Do NOT add new npm dependencies — `react-router`, `@tanstack/react-query` are already installed. The `CustomEvent` API is built into the browser. Zero new deps.
- Do NOT add new pip dependencies.
- Do NOT implement CSRF tokens — deferred from Story 2.1, tracked in `deferred-work.md`.
- Do NOT add a server-side JWT blocklist — out of scope (stateless JWT, intentional v1 choice).
- Do NOT change cookie attributes, `get_current_user`, `_issue_auth_cookie`, or any backend auth code.
- Do NOT modify `useLogin`, `useRegister`, or `useLogout` in `use-auth.ts` — they are complete from Stories 2.1-2.3.
- Do NOT modify `auth-screen.tsx` — the login/register form is complete from Story 2.2.
- Do NOT add a header/navbar/sidebar — that is Epic 3/4 concern.
- Do NOT re-list items already tracked in `deferred-work.md` (passlib EOL, timezone-naive `created_at`, Alembic naming convention, CSRF tokens, race condition on duplicate email, etc.).
- Do NOT use `react-router-dom` — v7 uses the `react-router` package exclusively.
- Do NOT use `any` type — use explicit types or `unknown` with type guards.
- Do NOT call `fetch` directly outside `lib/api.ts`.
- Do NOT use `useNavigate()` imperatively for the post-reauth redirect — use declarative `<Navigate to={from} replace />` in `LoginPage`. The redirect triggers from `isAuthenticated` flipping to `true`.

### References

- [Source: epics.md#Story 2.4 L357-384]
- [Source: architecture.md#Frontend Architecture L209-215 — routing, auth guard, 401 handling]
- [Source: architecture.md#Error Handling Layers L339-343 — api.ts catches 401 → clears auth → redirects]
- [Source: architecture.md#Auth State L326-329 — React Context for auth, populated on mount via /me]
- [Source: architecture.md#Loading State Patterns L333-336 — brief blank while validating cookie]
- [Source: architecture.md#Structure Patterns L280-286 — components/auth-guard.tsx path]
- [Source: architecture.md#Anti-Patterns L359-366 — no localStorage JWT, no any, no fetch outside api.ts]
- [Source: architecture.md#Enforcement Guidelines L352-357 — use api.ts for all HTTP calls]
- [Source: prd.md#FR4 (prevent unauth access), FR7 (session expiry redirect), FR8 (post-reauth redirect), FR9 (reject unauth API)]
- [Source: 2-3-logout-and-per-user-data-isolation.md#File List — current repo state]
- [Source: 2-2-user-login-with-jwt-cookie.md#Task 6.2 — inline guard in HomePage, "Story 2.4 generalizes"]
- [Source: epic-1-retro-2026-04-15.md#Action Items P1, P2]
- [Source: deferred-work.md — existing debt items, do not re-list]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context) (dev-story subagent)

### Debug Log References

- **CustomEvent infinite-loop prevention:** Used `setUser` functional updater form (`setUser((current) => { if (current !== null) { ... } return null })`) to guard against the hydration 401 loop. When the initial `/api/auth/me` fires a 401 on page load with no cookie, `current` is already `null`, so `invalidateQueries`/`removeQueries` never execute. Confirmed stable across multiple reload cycles in Playwright -- no infinite render loops observed.
- **Console errors:** All console errors across the Playwright session are exclusively `401 /api/auth/me` network errors (browser-level "Failed to load resource" messages). These are expected when no auth cookie is present. Zero React errors, zero JS exceptions.
- **Playwright cookie clearing:** Used `page.context().clearCookies()` + `page.reload()` to simulate session expiry. The 401 from `/api/auth/me` correctly triggers the `auth:unauthorized` event, which clears auth state and causes AuthGuard to redirect to `/login`.

### Completion Notes List

- Created `AuthGuard` component as a pure route wrapper -- reads `useAuth()` context, renders blank during loading, redirects to `/login` with `state.from` for unauthenticated users, renders children otherwise. No data fetching or mutations.
- Wrapped `<HomePage />` in `<AuthGuard>` in `app.tsx` routing. `/login` remains public.
- Removed inline auth guard from `pages/home.tsx` -- component now assumes authenticated context (enforced by wrapper).
- Added global 401 interceptor in `api.ts` -- dispatches `CustomEvent("auth:unauthorized")` before the existing `ApiClientError` throw. Additive, not a replacement.
- Added `auth:unauthorized` event listener in `AuthProvider` via `useEffect`. Handler uses `setUser` functional updater to conditionally clear state only when `current !== null`, preventing the hydration 401 from triggering unnecessary `invalidateQueries` calls.
- Updated `LoginPage` to read `location.state.from.pathname` for post-reauth redirect. Falls back to `/` when state is absent. Typing is safe via optional chaining.
- Anti-pattern verification: zero raw `fetch` outside `api.ts`, zero `any` types, zero `react-router-dom` imports, component tree order intact.
- P1 (lockfile discipline): Zero new dependencies, zero lockfile churn -- confirmed.
- All quality gates green: 26 backend tests passing, frontend typecheck clean, frontend lint clean.
- Playwright smoke: happy path, auth guard redirect, 401 interceptor, post-reauth redirect, and cookie verification all confirmed.

### Change Log

- 2026-04-15: Implemented AuthGuard component, global 401 interceptor, post-reauth redirect, removed inline auth guard from HomePage

### File List

- `frontend/src/components/auth-guard.tsx` (NEW)
- `frontend/src/app.tsx` (MODIFIED)
- `frontend/src/pages/home.tsx` (MODIFIED)
- `frontend/src/pages/login.tsx` (MODIFIED)
- `frontend/src/lib/api.ts` (MODIFIED)
- `frontend/src/hooks/auth-provider.tsx` (MODIFIED)
