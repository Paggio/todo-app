# Story 3.3: Todo Creation via FAB with Optimistic Updates

Status: done

## Story

As an authenticated user,
I want to create new todos via a floating action button that responds instantly,
so that capturing a thought feels frictionless.

## Acceptance Criteria

1. **Given** the main view **When** it renders for an authenticated user **Then** a FAB (floating action button) is displayed in the bottom-right area of the viewport (FR10, UX-DR4)

2. **Given** the user clicks/taps the FAB **When** the expansion activates **Then** it reveals a text input field for entering a todo description, and focus moves to the input (UX-DR4, UX-DR16)

3. **Given** the FAB is expanded with text entered **When** the user presses Enter or clicks submit **Then** the FAB closes, the new todo appears at the top of the active list immediately via optimistic update (`useCreateTodo` mutation with `onMutate`), and the API request fires in the background (FR10, FR17, NFR1)

4. **Given** an optimistic create was applied **When** the server confirms the creation **Then** the cache is revalidated via `onSettled` (`queryClient.invalidateQueries({ queryKey: ["todos"] })`)

5. **Given** an optimistic create was applied **When** the server returns an error **Then** the optimistic item is rolled back via `onError` (restores cache snapshot) and a toast notification informs the user (FR18)

6. **Given** the FAB is expanded **When** the user tries to submit an empty description **Then** the submission is prevented and inline validation feedback appears (FR15)

7. **Given** the FAB is expanded **When** the user presses Escape or clicks outside **Then** the FAB collapses without creating a todo

## Tasks / Subtasks

- [x] Task 1: Create the `useCreateTodo` mutation hook (AC: #3, #4, #5)
  - [x] 1.1 In `frontend/src/hooks/use-todos.ts`, add `import { useMutation } from "@tanstack/react-query"` alongside the existing `useQuery` import. Import `queryClient` from `@/lib/query-client` and `CreateTodoRequest` from `@/types`.
  - [x] 1.2 Export `function useCreateTodo()` returning `useMutation`. The `mutationFn` calls `apiFetch<Todo>("/api/todos", { method: "POST", body: payload })` where `payload` is `CreateTodoRequest`. The `api.ts` utility handles the camelCase-to-snake_case transform automatically.
  - [x] 1.3 Implement the three-step optimistic pattern (architecture.md mandatory pattern):
    - `onMutate`: (a) cancel any outgoing refetches with `queryClient.cancelQueries({ queryKey: ["todos"] })`, (b) snapshot the current cache with `queryClient.getQueryData<Todo[]>(["todos"])`, (c) create a temporary optimistic `Todo` object with `id: -Date.now()` (negative temp ID ensures no collision with real IDs), `userId: 0`, `description` from the mutation variable, `isCompleted: false`, `createdAt: new Date().toISOString()`, (d) write the optimistic item to cache via `queryClient.setQueryData<Todo[]>(["todos"], (old) => [optimisticTodo, ...(old ?? [])])` (prepend -- most recent first, matching API sort order), (e) return `{ previousTodos: snapshot }` as the rollback context.
    - `onError`: receive `(_err, _vars, context)`, call `queryClient.setQueryData(["todos"], context?.previousTodos)` to restore the snapshot. Display error feedback (see Task 3 for toast).
    - `onSettled`: call `queryClient.invalidateQueries({ queryKey: ["todos"] })` to revalidate from server (replaces temp todo with real server response).
  - [x] 1.4 Do NOT add `useUpdateTodo` or `useDeleteTodo` -- those are Stories 3.4 and 3.5 respectively.

- [x] Task 2: Create the `FAB` component (AC: #1, #2, #6, #7)
  - [x] 2.1 Create `frontend/src/components/fab.tsx`. Import `useState`, `useRef`, `useEffect` from React, `Input` from `@/components/ui/input`, `Button` from `@/components/ui/button`, `cn` from `@/lib/utils`, and `useCreateTodo` from `@/hooks/use-todos`.
  - [x] 2.2 Manage local state: `isExpanded: boolean` (default `false`), `description: string` (default `""`), `validationError: string | null` (default `null`). Use `useRef<HTMLInputElement>` for the input and `useRef<HTMLDivElement>` for the FAB container (click-outside detection).
  - [x] 2.3 **Idle state:** Render a `<button>` (or shadcn/ui `Button` with `size="icon"` variant) positioned fixed at bottom-right. Use `fixed bottom-6 right-6 sm:bottom-8 sm:right-8` (24px on mobile per UX-DR15, 32px on larger). Size: `h-14 w-14` (56px, above the 44px minimum touch target). Background: `bg-primary text-primary-foreground` (maps to accent color via shadcn/ui tokens). Content: a `+` icon using Lucide `Plus` icon (already installed in `lucide-react`). Apply `rounded-full shadow-lg` for circular elevated appearance. `aria-label="Add todo"`.
  - [x] 2.4 **Expanded state:** Replace the circular button with an input panel. Use a `div` with `fixed bottom-6 right-6 left-6 sm:bottom-8 sm:left-auto sm:right-8 sm:w-[400px]` for responsive sizing (full-width on mobile with 24px padding, 400px fixed width on tablet+). Background: `bg-background border border-border rounded-lg shadow-lg p-3`. Contains: (a) `Input` component for the description, (b) a submit `Button` (or icon button).
  - [x] 2.5 **Focus management (UX-DR16):** When `isExpanded` becomes `true`, call `inputRef.current?.focus()` via a `useEffect` that depends on `isExpanded`. When the FAB closes, return focus to the FAB button (store the button ref and call `fabButtonRef.current?.focus()` on close).
  - [x] 2.6 **Submit handler:** Trim the description. If empty after trimming, set `validationError` to "Description cannot be empty" and return (AC: #6). Otherwise, call `createTodo.mutate({ description: trimmedDescription })`, reset `description` to `""`, clear `validationError`, and set `isExpanded` to `false`.
  - [x] 2.7 **Keyboard handling:** On the input, `onKeyDown`: if `key === "Enter"`, call the submit handler. If `key === "Escape"`, close the FAB (reset `description`, clear `validationError`, set `isExpanded` to `false`).
  - [x] 2.8 **Click-outside handling:** Add a `useEffect` with a `mousedown` event listener on `document`. If the click target is outside the FAB container ref AND `isExpanded` is `true`, close the FAB. Clean up the listener on unmount.
  - [x] 2.9 **Validation display (AC: #6):** When `validationError` is non-null, render it below the input as `<p className="text-xs text-destructive mt-1">{validationError}</p>`. Clear `validationError` on every input change (`onChange`).
  - [x] 2.10 Do NOT add animations (spring scale, pulse) -- those are Story 4.4 (Epic 4). The FAB should expand/collapse with a simple show/hide for now.

- [x] Task 3: Add toast notification for create error feedback (AC: #5)
  - [x] 3.1 Since no toast library is currently installed, implement a lightweight toast mechanism. Install the `sonner` package (`pnpm add sonner`) which is the recommended toast library for shadcn/ui projects. It is lightweight (< 5KB), has no peer dependencies beyond React, and provides `toast()` as a simple function call.
  - [x] 3.2 In `frontend/src/app.tsx`, import `Toaster` from `sonner` and add `<Toaster position="bottom-center" />` inside the `AuthProvider` wrapper (before `BrowserRouter`). This matches the UX spec position (UX-DR19: bottom-center, auto-dismiss).
  - [x] 3.3 In the `useCreateTodo` hook's `onError` callback, call `toast.error("Failed to create todo. Please try again.")` (import `toast` from `sonner`). This satisfies FR18 (rollback + notify).
  - [x] 3.4 Style the Toaster to match the project's design tokens: `toastOptions={{ className: "text-sm" }}` for consistent typography. The default sonner styling is minimal and integrates well with Tailwind.

- [x] Task 4: Update `HomePage` to render the FAB (AC: #1)
  - [x] 4.1 In `frontend/src/pages/home.tsx`, import `FAB` from `@/components/fab`.
  - [x] 4.2 Add `<FAB />` as a sibling to the existing layout `div`, NOT inside the `max-w-2xl` container (the FAB is fixed-positioned relative to the viewport, not the content column). Place it after the content container div, before the closing `</div>` of the outermost wrapper.

- [x] Task 5: Verify and test (AC: all)
  - [x] 5.1 Run `pnpm typecheck` from the `frontend/` directory -- 0 errors expected.
  - [x] 5.2 Run `pnpm lint` from the `frontend/` directory -- 0 errors, 0 warnings expected.
  - [x] 5.3 Run backend test suite (`cd backend && python -m pytest tests/ -v`) to verify no regressions -- all existing tests (47) must still pass.
  - [ ] 5.4 Manual smoke test: `docker compose up`, navigate to the app, verify FAB renders, expand it, type a description, press Enter, verify the todo appears instantly in the active list.
  - [ ] 5.5 Verify error rollback: temporarily break the API (e.g., stop the backend container), try to create a todo, verify the optimistic item is rolled back and a toast appears.
  - [ ] 5.6 Verify empty submission prevention: expand the FAB, press Enter without typing, verify validation message appears.
  - [ ] 5.7 Verify Escape and click-outside close the FAB without creating a todo.

## Dev Notes

### Critical Architecture Constraints

- **Three-step optimistic mutation pattern is MANDATORY.** Every mutation must follow: `onMutate` (snapshot + optimistic write) -> `onError` (rollback to snapshot) -> `onSettled` (revalidate from server). No exceptions. [Source: architecture.md#Communication Patterns L318-323]
- **TanStack Query for ALL server state.** The `useCreateTodo` mutation hook is the ONLY way to create todos. Components never call `api.ts` directly. [Source: architecture.md#Enforcement Guidelines L354, L358]
- **`api.ts` handles all HTTP + key transforms.** `apiFetch<T>()` automatically transforms camelCase body keys to snake_case before sending, and transforms snake_case response keys to camelCase. The `CreateTodoRequest` body `{ description }` has no camelCase keys, but this is still important for the `Todo` response parsing. [Source: architecture.md#Enforcement Guidelines L354]
- **Query key `["todos"]`** is already established. `useGetTodos` uses it, `useLogout` already calls `queryClient.removeQueries({ queryKey: ["todos"] })`. All mutations must invalidate via `queryClient.invalidateQueries({ queryKey: ["todos"] })`. [Source: architecture.md#Communication Patterns L315-316]
- **No `useEffect` + `useState` for data fetching.** Anti-pattern. Use TanStack Query's `useMutation` hook. [Source: architecture.md#Anti-Patterns L363]
- **File naming: kebab-case** for frontend files (`fab.tsx`, `use-todos.ts`). **Component naming: PascalCase** (`FAB`). [Source: architecture.md#Naming Patterns L272-274]
- **No response wrappers.** `POST /api/todos` returns the created `Todo` directly, not wrapped in `{ data: ..., success: true }`. [Source: architecture.md#Anti-Patterns L363]
- **No `any` type in TypeScript.** Use explicit types or `unknown` with type guards. [Source: architecture.md#Anti-Patterns L364]

### API Contract (from Story 3.1)

- `POST /api/todos` accepts `{ "description": "string" }` (snake_case; `api.ts` transforms from camelCase automatically)
- Returns `201` with the created `TodoRead`: `{ "id": int, "user_id": int, "description": string, "is_completed": false, "created_at": "ISO8601" }`
- After `api.ts` transforms: `{ id, userId, description, isCompleted, createdAt }` matching the `Todo` type
- Validation error on empty description: `422` with `{ "detail": "...", "code": "VALIDATION_ERROR" }`
- Auth: httpOnly cookie sent automatically via `credentials: "include"` in `api.ts`
- Error: 401 if not authenticated (intercepted globally by `api.ts` which dispatches `auth:unauthorized` event)

### Optimistic Update Implementation Details

The optimistic todo must be prepended to the cache array (not appended) because the API returns todos ordered by `created_at` DESC (most recent first). When `onSettled` fires, `invalidateQueries` fetches the fresh list from the server, replacing the temp todo with the real server-generated todo (which has a real `id`, `userId`, and `createdAt`).

The temporary `id: -Date.now()` is safe because:
- Real PostgreSQL IDs are always positive integers
- `Date.now()` is millisecond-precision, so negating it produces a unique negative number
- The temp todo only exists in the TanStack Query cache for the duration of the API call (~100-500ms)

### Project Structure Notes

Files to create:
- `frontend/src/components/fab.tsx` -- Floating action button component (idle + expanded states, input, validation)

Files to modify:
- `frontend/src/hooks/use-todos.ts` -- Add `useCreateTodo` mutation hook with optimistic update pattern
- `frontend/src/pages/home.tsx` -- Add `<FAB />` to the main view
- `frontend/src/app.tsx` -- Add `<Toaster />` from sonner for error notifications

New npm dependency:
- `sonner` -- Lightweight toast library recommended for shadcn/ui projects (UX-DR19 requires toast notifications for error feedback)

No backend changes in this story. The `POST /api/todos` endpoint is already implemented and tested (Story 3.1, 47 tests passing).

### Previous Story Intelligence (Stories 3.1 and 3.2)

1. **Backend API is production-ready.** All 47 tests pass (26 auth + 21 todos including health). `POST /api/todos` creates a todo scoped to the authenticated user, returns 201 with the `TodoRead` shape. Empty description returns 422 `VALIDATION_ERROR`. [Source: 3-1-todo-crud-api-endpoints.md#Completion Notes]

2. **`Todo` type and `CreateTodoRequest` type already exist.** Defined in `frontend/src/types/index.ts` during Story 3.2. `Todo` has `id`, `userId`, `description`, `isCompleted`, `createdAt`. `CreateTodoRequest` has `description: string`. No new types needed. [Source: 3-2-todo-list-view-with-active-and-completed-sections.md#Task 1]

3. **`useGetTodos` hook already works with query key `["todos"]`.** The hook in `frontend/src/hooks/use-todos.ts` fetches from `GET /api/todos` using `apiFetch<Todo[]>`. The `useCreateTodo` hook will be added to the same file. [Source: 3-2-todo-list-view-with-active-and-completed-sections.md#Task 2]

4. **`useLogout` already references `["todos"]` query key.** Calls `queryClient.removeQueries({ queryKey: ["todos"] })`. This confirms the query key convention. [Source: use-auth.ts L53-54]

5. **`HomePage` renders active and completed sections.** Active todos are filtered by `!t.isCompleted` and rendered via `<TodoList>`. The FAB must be added as a fixed-positioned element outside the content container. [Source: home.tsx]

6. **No frontend test framework is configured.** Vitest/jest are not installed. Manual testing is sufficient for now. Frontend unit tests are deferred. [Source: 3-2-todo-list-view-with-active-and-completed-sections.md#Completion Notes]

7. **Design token system uses shadcn/ui defaults.** Use Tailwind classes that reference shadcn/ui tokens: `bg-primary`, `text-primary-foreground`, `bg-background`, `border-border`, `text-destructive`. Do NOT use hex color values directly. The full Apple-inspired design token system is Story 4.1. [Source: 3-2-todo-list-view-with-active-and-completed-sections.md#Dev Notes]

8. **Lucide React is installed.** The `lucide-react` package is in `package.json`. Use `import { Plus } from "lucide-react"` for the FAB icon. No new icon library needed.

9. **Existing component patterns:**
   - `auth-screen.tsx` for form handling patterns (uses react-hook-form, but the FAB is simple enough to use controlled state)
   - `todo-item.tsx` for `cn()` usage, conditional classes, `role` attributes
   - `completed-section.tsx` for `useRef`, `useEffect`, localStorage patterns

10. **Empty active list gap fix from Story 3.2 review.** `<TodoList>` is conditionally rendered only when `activeTodos.length > 0`. The FAB must be visible regardless of whether todos exist.

### What NOT To Do

- Do NOT add `useUpdateTodo` or `useDeleteTodo` mutation hooks -- those are Stories 3.4 and 3.5
- Do NOT add completion toggle behavior to `TodoItem` -- that is Story 3.4
- Do NOT add delete button/action to `TodoItem` -- that is Story 3.5
- Do NOT add empty state component -- that is Story 3.6
- Do NOT add skeleton loading states -- that is Story 3.6
- Do NOT add FAB animations (spring scale, pulse in empty state) -- that is Story 4.4
- Do NOT add todo creation fade-in animation -- that is Story 4.4
- Do NOT modify any backend files -- API is already complete
- Do NOT use `useEffect` + `useState` to manage server state -- use TanStack Query `useMutation`
- Do NOT call `fetch` directly or `apiFetch` from components -- always go through hooks
- Do NOT use the `any` type in TypeScript
- Do NOT store server data in React context -- TanStack Query cache is the source of truth
- Do NOT hardcode URLs or configuration values
- Do NOT add additional npm packages beyond `sonner` (for toast)
- Do NOT create separate CSS files for components -- use Tailwind utility classes inline

### References

- [Source: epics.md#Story 3.3 L452-487 -- story requirements and acceptance criteria]
- [Source: architecture.md#Communication Patterns L315-324 -- query keys, three-step optimistic pattern, auth state]
- [Source: architecture.md#Frontend Architecture L209-215 -- TanStack Query, useMutation, optimistic updates]
- [Source: architecture.md#Structure Patterns L280-286 -- frontend directory organization]
- [Source: architecture.md#Naming Patterns L252-275 -- camelCase TS, PascalCase components, kebab-case files]
- [Source: architecture.md#Enforcement Guidelines L352-366 -- mandatory patterns, forbidden anti-patterns]
- [Source: architecture.md#Architectural Boundaries L476-487 -- component boundaries, hooks own data-fetching]
- [Source: architecture.md#API & Communication Patterns L196-207 -- POST /api/todos endpoint]
- [Source: ux-design-specification.md#Component Strategy L425-437 -- FAB component spec (idle/expanded states)]
- [Source: ux-design-specification.md#Core Interaction Design L206-240 -- effortless interactions, todo creation flow]
- [Source: ux-design-specification.md#UX Consistency Patterns L471-515 -- feedback patterns (todo created: fade-in 200ms), form patterns]
- [Source: ux-design-specification.md#Responsive Design L520-537 -- breakpoints, FAB positioning]
- [Source: ux-design-specification.md#Accessibility L539-565 -- keyboard nav, focus management, touch targets]
- [Source: prd.md#FR10 (create todo), FR15 (empty validation), FR17 (optimistic UI), FR18 (rollback + notify)]
- [Source: 3-1-todo-crud-api-endpoints.md -- POST /api/todos contract, test coverage, error format]
- [Source: 3-2-todo-list-view-with-active-and-completed-sections.md -- component patterns, query key convention, design token usage]
- [Source: frontend/src/hooks/use-todos.ts -- existing useGetTodos hook to extend]
- [Source: frontend/src/hooks/use-auth.ts -- useMutation pattern reference, queryClient import]
- [Source: frontend/src/lib/api.ts -- apiFetch, snake/camel transforms, 401 interception]
- [Source: frontend/src/types/index.ts -- Todo, CreateTodoRequest types already defined]
- [Source: frontend/src/pages/home.tsx -- layout to add FAB to]
- [Source: frontend/src/app.tsx -- app wrapper to add Toaster to]

### Review Findings

- [x] [Review][Patch] Focus return to unmounted ref on FAB close — closeFab() calls fabButtonRef.current?.focus() but when expanded the idle button is not in DOM; focus silently fails [fab.tsx:32]
- [x] [Review][Patch] No double-submit guard — handleSubmit() does not check createTodo.isPending; rapid open-submit cycles could fire duplicate mutations [fab.tsx:59-68]
- [x] [Review][Patch] onError rollback with potentially undefined context — if onMutate throws, context?.previousTodos is undefined and setQueryData(["todos"], undefined) clears cache entirely [use-todos.ts:57-60]
- [x] [Review][Patch] Idle FAB uses raw button instead of shadcn Button — spec Task 2.3 prescribes shadcn Button with size="icon" variant; inconsistent with expanded state [fab.tsx:120-134]
- [x] [Review][Patch] Missing aria-describedby for validation error — aria-invalid is set but screen readers cannot locate the error text without aria-describedby [fab.tsx:102,112-114]
- [x] [Review][Defer] No input maxLength constraint — no client-side limit on description length; long inputs could overflow UI or hit server limits [fab.tsx:92-103] — deferred, pre-existing (server enforces no limit either)

### Re-Review Findings (2026-04-15, pass 2)

All 5 prior patch findings verified as resolved. No new patch or decision-needed issues found.

- [x] [Review][Defer] FAB z-index not set explicitly — no z-stacking conflict exists in current codebase, but future fixed/absolute elements (modals, drawers) may overlap [fab.tsx:91,134] — deferred, pre-existing architectural concern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- ESLint caught `closeFab` being accessed before declaration in click-outside useEffect. Fixed by converting `closeFab` to `useCallback` and declaring it before the useEffect that references it.

### Completion Notes List

- Task 1: Implemented `useCreateTodo` mutation hook in `use-todos.ts` with the mandatory three-step optimistic pattern (onMutate/onError/onSettled). Uses negative `Date.now()` for temp IDs, prepends optimistic todo to cache, rolls back on error with toast notification, and revalidates on settle.
- Task 2: Created `FAB` component (`fab.tsx`) with idle state (circular 56px button, fixed bottom-right, Plus icon) and expanded state (responsive input panel with submit button). Implements focus management, click-outside detection, Escape key dismiss, Enter to submit, and inline validation for empty descriptions.
- Task 3: Installed `sonner` (v2.0.7) and added `<Toaster position="bottom-center" />` to `app.tsx`. Error toast fires on mutation error in `useCreateTodo.onError`.
- Task 4: Added `<FAB />` to `HomePage` as a sibling outside the `max-w-2xl` content container, ensuring viewport-relative positioning.
- Task 5: TypeScript 0 errors, ESLint 0 errors/0 warnings, backend 47/47 tests pass. Manual smoke tests (5.4-5.7) deferred to user review.
- Review follow-ups (2026-04-15): Resolved all 5 code-review patch findings:
  - Resolved review finding [Patch] #1: Deferred focus return via requestAnimationFrame so idle button is in DOM before focus call
  - Resolved review finding [Patch] #2: Added createTodo.isPending guard in handleSubmit to prevent double-submit
  - Resolved review finding [Patch] #3: Added truthy check on context?.previousTodos before rollback to avoid clearing cache with undefined
  - Resolved review finding [Patch] #4: Replaced raw `<button>` with shadcn `<Button size="icon">` for idle FAB per spec Task 2.3
  - Resolved review finding [Patch] #5: Added aria-describedby="fab-validation-error" on Input and id on error `<p>` for screen reader association

### File List

- `frontend/src/components/fab.tsx` (created) -- FAB component with idle/expanded states, input, validation, keyboard handling, click-outside
- `frontend/src/hooks/use-todos.ts` (modified) -- Added useCreateTodo mutation hook with optimistic updates
- `frontend/src/app.tsx` (modified) -- Added Toaster from sonner for error notifications
- `frontend/src/pages/home.tsx` (modified) -- Added FAB component to main view
- `frontend/package.json` (modified) -- Added sonner dependency
- `frontend/pnpm-lock.yaml` (modified) -- Lock file updated for sonner
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) -- Story status updated to review

### Change Log

- 2026-04-15: Implemented Story 3.3 — Todo Creation via FAB with Optimistic Updates. Created FAB component, useCreateTodo hook with three-step optimistic pattern, integrated sonner toast for error feedback, and wired FAB into HomePage. All automated checks pass (typecheck, lint, 47 backend tests).
- 2026-04-15: Addressed code review findings — 5 patch items resolved (focus return, double-submit guard, onError rollback safety, shadcn Button for idle FAB, aria-describedby for validation). All automated checks pass (typecheck 0 errors, lint 0 errors, 47/47 backend tests).
