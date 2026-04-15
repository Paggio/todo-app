# Story 3.4: Todo Completion Toggle with Optimistic Updates

Status: done

## Story

As an authenticated user,
I want to mark todos as complete or undo completion with instant visual feedback,
so that managing my task status feels responsive and satisfying.

## Acceptance Criteria

1. **Given** an active todo is displayed **When** the user clicks the checkbox or the todo item **Then** the item is immediately marked as completed via optimistic update (`useUpdateTodo` mutation with `onMutate`), visually dimmed with strikethrough, and logically moves to the completed section (FR12, FR17, NFR1)

2. **Given** a completed todo is displayed **When** the user clicks the checkbox **Then** the item is immediately marked as active (optimistic undo), visual treatment reverts, and the item logically moves back to the active section (FR13)

3. **Given** an optimistic completion toggle **When** the server confirms the update via `onSettled` **Then** the cache is revalidated via `queryClient.invalidateQueries({ queryKey: ["todos"] })` to ensure sync with server state

4. **Given** an optimistic completion toggle **When** the server returns an error via `onError` **Then** the item reverts to its previous state (rollback from cache snapshot) and a toast notification appears (FR18)

5. **Given** any completion toggle **When** it occurs **Then** the UI reflects the change in under 100ms without blocking the main thread (NFR1, NFR4)

## Tasks / Subtasks

- [x] Task 1: Create the `useUpdateTodo` mutation hook (AC: #1, #2, #3, #4)
  - [x] 1.1 In `frontend/src/hooks/use-todos.ts`, add `UpdateTodoRequest` to the existing import from `@/types`. No new imports needed -- `useMutation`, `toast`, `apiFetch`, `queryClient`, and `Todo` are already imported.
  - [x] 1.2 Export `function useUpdateTodo()` returning `useMutation`. The `mutationFn` receives `{ id, ...payload }` where `id: number` and the rest is `UpdateTodoRequest`. Call `apiFetch<Todo>(`/api/todos/${id}`, { method: "PATCH", body: payload })`. The `api.ts` utility automatically transforms `isCompleted` to `is_completed` for the request body.
  - [x] 1.3 Implement the three-step optimistic pattern (architecture.md mandatory pattern -- identical structure to `useCreateTodo` from Story 3.3):
    - `onMutate`: (a) cancel outgoing refetches with `queryClient.cancelQueries({ queryKey: ["todos"] })`, (b) snapshot the current cache with `queryClient.getQueryData<Todo[]>(["todos"])`, (c) optimistically update the toggled todo in the cache via `queryClient.setQueryData<Todo[]>(["todos"], (old) => (old ?? []).map(t => t.id === variables.id ? { ...t, isCompleted: variables.isCompleted ?? t.isCompleted } : t))`, (d) return `{ previousTodos: snapshot }` as the rollback context.
    - `onError`: receive `(_err, _vars, context)`, only roll back if `context?.previousTodos` is truthy (guard against undefined when `onMutate` throws before producing a snapshot -- learned from Story 3.3 review), call `queryClient.setQueryData(["todos"], context.previousTodos)`. Display `toast.error("Failed to update todo. Please try again.")`.
    - `onSettled`: call `queryClient.invalidateQueries({ queryKey: ["todos"] })` to revalidate from server.
  - [x] 1.4 Define the mutation variable type inline: `{ id: number } & UpdateTodoRequest`. This avoids a separate type definition while keeping TypeScript strict.
  - [x] 1.5 Do NOT add `useDeleteTodo` -- that is Story 3.5.

- [x] Task 2: Make `TodoItem` interactive with completion toggle (AC: #1, #2, #5)
  - [x] 2.1 Update `frontend/src/components/todo-item.tsx`. Add an `onToggle` callback prop: `onToggle?: () => void`. This keeps `TodoItem` presentational -- the parent provides the toggle behavior. Import `Button` from `@/components/ui/button` for the checkbox button.
  - [x] 2.2 Wrap the existing circular checkbox indicator `<div>` in a `<button>` (or replace with a `<Button variant="ghost" size="icon">`) that calls `onToggle` on click. Requirements: `type="button"`, `aria-checked={todo.isCompleted}`, `role="checkbox"`, `aria-label={todo.isCompleted ? "Mark as active" : "Mark as complete"}`, minimum `min-h-[44px] min-w-[44px]` touch target (UX-DR16). The entire checkbox area must be the click target, not just the circle.
  - [x] 2.3 Style the interactive checkbox: on hover, the circle border should use `border-foreground/50` (subtle feedback, not the full accent color -- the accent animation is Story 4.3). Cursor: `cursor-pointer`.
  - [x] 2.4 Keyboard accessibility: the `<button>` element natively supports Space and Enter key activation, which satisfies UX-DR16 (Space to toggle completion). No custom `onKeyDown` handler needed.
  - [x] 2.5 Do NOT add animations (check-draw path animation, spring physics, layout reflow) -- those are Story 4.3 (Epic 4). The toggle should produce an instant visual state change (isCompleted styling flip).
  - [x] 2.6 Do NOT add a delete button/affordance -- that is Story 3.5.

- [x] Task 3: Wire `useUpdateTodo` into `TodoList` and `CompletedSection` (AC: #1, #2)
  - [x] 3.1 In `frontend/src/components/todo-list.tsx`, import `useUpdateTodo` from `@/hooks/use-todos`. Call the hook at the component level: `const updateTodo = useUpdateTodo()`.
  - [x] 3.2 Pass an `onToggle` callback to each `<TodoItem>`: `onToggle={() => updateTodo.mutate({ id: todo.id, isCompleted: !todo.isCompleted })}`. This toggles the `isCompleted` state -- works for both completing (active -> completed) and uncompleting (completed -> active).
  - [x] 3.3 In `frontend/src/components/completed-section.tsx`, apply the same pattern: import `useUpdateTodo`, call the hook, and pass `onToggle` to each `<TodoItem>` with `!todo.isCompleted` (which will be `true -> false`, i.e., undo completion).
  - [x] 3.4 Both `TodoList` and `CompletedSection` share the same `useUpdateTodo` hook instance. Since TanStack Query mutations are independent per `useMutation` call, each component gets its own mutation state. This is correct -- no shared state issues.

- [x] Task 4: Verify and test (AC: all)
  - [x] 4.1 Run `pnpm typecheck` from the `frontend/` directory -- 0 errors expected.
  - [x] 4.2 Run `pnpm lint` from the `frontend/` directory -- 0 errors, 0 warnings expected.
  - [x] 4.3 Run backend test suite (`cd backend && python -m pytest tests/ -v`) to verify no regressions -- all existing tests (47) must still pass.
  - [ ] 4.4 Manual smoke test: `docker compose up`, navigate to the app, create a todo, click the checkbox to mark it complete, verify it immediately shows as completed (dimmed, strikethrough) and moves to the completed section.
  - [ ] 4.5 Verify undo: click the checkbox on a completed todo, verify it immediately reverts to active styling and moves back to the active section.
  - [ ] 4.6 Verify error rollback: temporarily stop the backend container, toggle a todo, verify the optimistic change rolls back and a toast appears.
  - [ ] 4.7 Verify keyboard: Tab to a todo checkbox, press Space or Enter, verify the toggle fires.

## Dev Notes

### Critical Architecture Constraints

- **Three-step optimistic mutation pattern is MANDATORY.** Every mutation must follow: `onMutate` (snapshot + optimistic write) -> `onError` (rollback to snapshot) -> `onSettled` (revalidate from server). No exceptions. This is the same pattern used by `useCreateTodo` in Story 3.3 -- follow it identically. [Source: architecture.md#Communication Patterns]
- **TanStack Query for ALL server state.** The `useUpdateTodo` mutation hook is the ONLY way to update todos. Components never call `api.ts` directly. [Source: architecture.md#Enforcement Guidelines]
- **`api.ts` handles all HTTP + key transforms.** `apiFetch<T>()` automatically transforms `isCompleted` to `is_completed` in the request body, and transforms `is_completed` back to `isCompleted` in the response. The developer does NOT need to handle key transforms. [Source: architecture.md#API Boundary Rule]
- **Query key `["todos"]`** is already established and used by `useGetTodos`, `useCreateTodo`, and `useLogout`. All mutations must invalidate via `queryClient.invalidateQueries({ queryKey: ["todos"] })`. [Source: architecture.md#Communication Patterns]
- **No `useEffect` + `useState` for data fetching or mutations.** Anti-pattern. Use TanStack Query's `useMutation` hook. [Source: architecture.md#Anti-Patterns]
- **File naming: kebab-case** for frontend files. **Component naming: PascalCase**. [Source: architecture.md#Naming Patterns]
- **No `any` type in TypeScript.** Use explicit types or `unknown` with type guards. [Source: architecture.md#Anti-Patterns]
- **Guard `onError` rollback against undefined context.** If `onMutate` throws before producing a snapshot, `context?.previousTodos` is undefined. Always check truthiness before calling `setQueryData`. Learned from Story 3.3 code review finding #3. [Source: 3-3-todo-creation-via-fab-with-optimistic-updates.md#Review Findings]

### API Contract (from Story 3.1)

- `PATCH /api/todos/{id}` accepts `{ "is_completed": boolean }` (snake_case; `api.ts` transforms from camelCase `{ isCompleted }` automatically)
- Returns `200` with the updated `TodoRead`: `{ "id": int, "user_id": int, "description": string, "is_completed": bool, "created_at": "ISO8601" }`
- After `api.ts` transforms: `{ id, userId, description, isCompleted, createdAt }` matching the `Todo` type
- Requires at least one field in the body; empty body returns `422` with `{ "detail": "At least one field must be provided", "code": "VALIDATION_ERROR" }`
- Returns `404` with `{ "detail": "Todo not found", "code": "TODO_NOT_FOUND" }` if the todo doesn't exist or belongs to another user
- Auth: httpOnly cookie sent automatically via `credentials: "include"` in `api.ts`
- Error: 401 if not authenticated (intercepted globally by `api.ts` which dispatches `auth:unauthorized` event)

### Optimistic Update Implementation Details

The optimistic update for completion toggle uses `.map()` instead of prepend (as in `useCreateTodo`). The toggled todo's `isCompleted` field is flipped in-place in the cache array. When `onSettled` fires, `invalidateQueries` fetches the fresh list from the server, ensuring the cache matches the server state.

Since `HomePage` splits todos into active/completed by filtering on `isCompleted`, flipping the field in the cache causes React to re-render with the item moving between sections instantly. No explicit list manipulation (splice, push) is needed -- the filter logic in `HomePage` handles the visual separation.

### `UpdateTodoRequest` type already exists

The type `UpdateTodoRequest = { isCompleted?: boolean; description?: string }` was added to `frontend/src/types/index.ts` in Story 3.2 (Task 1). It is ready to import. For the mutation variable, combine it with `{ id: number }` to pass both the todo ID and the update payload.

### Project Structure Notes

Files to modify:
- `frontend/src/hooks/use-todos.ts` -- Add `useUpdateTodo` mutation hook with optimistic update pattern
- `frontend/src/components/todo-item.tsx` -- Add `onToggle` callback prop, make checkbox interactive with button element
- `frontend/src/components/todo-list.tsx` -- Import `useUpdateTodo`, pass `onToggle` to `TodoItem`
- `frontend/src/components/completed-section.tsx` -- Import `useUpdateTodo`, pass `onToggle` to `TodoItem`

No new files. No new npm dependencies. No backend changes.

### Previous Story Intelligence (Stories 3.1, 3.2, and 3.3)

1. **`useCreateTodo` is the pattern to follow exactly.** It implements the three-step optimistic mutation pattern with `onMutate` (cancel queries, snapshot, optimistic write, return context), `onError` (guarded rollback + toast), `onSettled` (invalidate). The `useUpdateTodo` hook follows the same structure but with `.map()` instead of prepend for the optimistic cache write. [Source: frontend/src/hooks/use-todos.ts]

2. **`onError` rollback must guard against undefined context.** Story 3.3 code review found that if `onMutate` throws before producing a snapshot, `context?.previousTodos` is undefined and `setQueryData(["todos"], undefined)` clears the entire cache. Always check `if (context?.previousTodos)` before rolling back. [Source: 3-3-todo-creation-via-fab-with-optimistic-updates.md#Review Findings #3]

3. **Double-submit guard pattern.** Story 3.3 added `if (createTodo.isPending) return` in the FAB submit handler. For the completion toggle, double-submit protection is less critical since the same toggle action is idempotent (toggling twice returns to original state), but the `useMutation` handles concurrent calls gracefully via `cancelQueries` in `onMutate`.

4. **`TodoItem` is currently presentational.** It renders a visual-only checkbox indicator and todo text. It takes `{ todo: Todo }` as props. This story adds an `onToggle` callback prop to make the checkbox interactive while keeping `TodoItem` as a presentational component (the mutation logic lives in the parent). [Source: frontend/src/components/todo-item.tsx]

5. **`TodoList` and `CompletedSection` both render `<TodoItem>`.** Both components iterate over a `todos` array and render `<TodoItem key={todo.id} todo={todo} />`. Both need to import `useUpdateTodo` and pass `onToggle`. [Source: frontend/src/components/todo-list.tsx, completed-section.tsx]

6. **`HomePage` handles active/completed splitting.** `activeTodos = todos.filter(t => !t.isCompleted)` and `completedTodos = todos.filter(t => t.isCompleted)`. When the optimistic cache update flips `isCompleted`, React re-renders and the item naturally moves between sections. No explicit logic needed in the toggle handler. [Source: frontend/src/pages/home.tsx L17-18]

7. **Design tokens use shadcn/ui defaults.** Use Tailwind classes referencing shadcn tokens: `text-muted-foreground`, `border-foreground/30`, `text-foreground`. Do NOT use hex color values directly. The Apple-inspired design token system is Story 4.1. [Source: 3-2-todo-list-view-with-active-and-completed-sections.md#Previous Story Intelligence #6]

8. **No frontend test framework is configured.** Vitest/jest are not installed. Manual testing is sufficient. [Source: 3-2-todo-list-view-with-active-and-completed-sections.md#Completion Notes]

9. **Backend 47 tests all pass.** 26 auth + 21 todos (including health). `PATCH /api/todos/{id}` with `{ "is_completed": true/false }` is already tested and working. No backend changes needed. [Source: 3-3-todo-creation-via-fab-with-optimistic-updates.md#Task 5]

10. **`sonner` toast is already installed and configured.** The `<Toaster position="bottom-center" />` is in `app.tsx`. Import `toast` from `sonner` in `use-todos.ts` (already imported there by `useCreateTodo`). [Source: 3-3-todo-creation-via-fab-with-optimistic-updates.md#Task 3]

### What NOT To Do

- Do NOT add `useDeleteTodo` mutation hook -- that is Story 3.5
- Do NOT add a delete button/affordance to `TodoItem` -- that is Story 3.5
- Do NOT add empty state component -- that is Story 3.6
- Do NOT add skeleton loading states -- that is Story 3.6
- Do NOT add completion animations (check-draw path animation, spring physics slide to completed section, layout reflow animation) -- those are Story 4.3 (Epic 4). The toggle should be an instant visual state change.
- Do NOT add checkbox hover accent color fill at 60% opacity -- that is Story 4.3
- Do NOT modify any backend files -- the PATCH endpoint is already complete and tested
- Do NOT use `useEffect` + `useState` to manage server state -- use TanStack Query `useMutation`
- Do NOT call `fetch` or `apiFetch` directly from components -- always go through hooks
- Do NOT use the `any` type in TypeScript
- Do NOT store server data in React context -- TanStack Query cache is the source of truth
- Do NOT hardcode URLs or configuration values
- Do NOT add additional npm packages -- everything needed is already installed
- Do NOT create separate CSS files for components -- use Tailwind utility classes inline

### References

- [Source: epics.md#Story 3.4 -- story requirements and acceptance criteria]
- [Source: architecture.md#Communication Patterns -- query keys, three-step optimistic pattern]
- [Source: architecture.md#Frontend Architecture -- TanStack Query, useMutation, optimistic updates]
- [Source: architecture.md#Structure Patterns -- frontend directory organization]
- [Source: architecture.md#Naming Patterns -- camelCase TS, PascalCase components, kebab-case files]
- [Source: architecture.md#Enforcement Guidelines -- mandatory patterns, forbidden anti-patterns]
- [Source: architecture.md#Architectural Boundaries -- component boundaries, hooks own data-fetching]
- [Source: architecture.md#API & Communication Patterns -- PATCH /api/todos/{id} endpoint]
- [Source: ux-design-specification.md#Core Interaction Design -- completion toggle interaction spec]
- [Source: ux-design-specification.md#UX Consistency Patterns -- feedback patterns (todo completed: 300ms total)]
- [Source: ux-design-specification.md#Accessibility -- keyboard nav (Space to toggle), touch targets, aria-checked]
- [Source: prd.md#FR12 (mark complete), FR13 (undo complete), FR17 (optimistic UI), FR18 (rollback + notify)]
- [Source: 3-3-todo-creation-via-fab-with-optimistic-updates.md -- three-step optimistic pattern reference, review findings]
- [Source: 3-2-todo-list-view-with-active-and-completed-sections.md -- component patterns, query key convention]
- [Source: frontend/src/hooks/use-todos.ts -- existing useCreateTodo to follow as pattern]
- [Source: frontend/src/components/todo-item.tsx -- component to make interactive]
- [Source: frontend/src/components/todo-list.tsx -- parent to wire onToggle]
- [Source: frontend/src/components/completed-section.tsx -- parent to wire onToggle]
- [Source: frontend/src/types/index.ts -- UpdateTodoRequest type already defined]
- [Source: backend/app/routers/todos.py -- PATCH endpoint contract]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript typecheck: 0 errors
- ESLint: 0 errors, 0 warnings
- Backend pytest: 47/47 passed, 0 failures

### Completion Notes List

- Task 1: Added `useUpdateTodo` mutation hook to `use-todos.ts` following the exact three-step optimistic pattern from `useCreateTodo`. Uses `.map()` to flip `isCompleted` in-place in the cache array. Inline mutation variable type `{ id: number } & UpdateTodoRequest`. `onError` guards against undefined context per Story 3.3 review finding.
- Task 2: Made `TodoItem` interactive by adding `onToggle?: () => void` callback prop. Replaced the non-interactive `<div>` checkbox indicator with a `<button>` element that has `role="checkbox"`, `aria-checked`, `aria-label`, and `min-h-[44px] min-w-[44px]` touch target. Native `<button>` handles Space/Enter keyboard activation. Used plain `<button>` instead of shadcn `<Button>` to avoid unnecessary component import for a simple click target.
- Task 3: Wired `useUpdateTodo` into both `TodoList` and `CompletedSection`. Each component calls the hook independently and passes `onToggle={() => updateTodo.mutate({ id: todo.id, isCompleted: !todo.isCompleted })}` to each `<TodoItem>`.
- Task 4: All automated checks pass. Subtasks 4.4-4.7 are manual smoke tests requiring a running Docker environment; deferred to human reviewer.

### Change Log

- 2026-04-15: Implemented Story 3.4 -- todo completion toggle with optimistic updates. Added `useUpdateTodo` hook, made `TodoItem` checkbox interactive, wired toggle into `TodoList` and `CompletedSection`. All typecheck/lint/backend tests pass.

### File List

- frontend/src/hooks/use-todos.ts (modified) -- Added `useUpdateTodo` mutation hook with three-step optimistic pattern
- frontend/src/components/todo-item.tsx (modified) -- Added `onToggle` callback prop, interactive checkbox button with ARIA attributes and touch target
- frontend/src/components/todo-list.tsx (modified) -- Imported `useUpdateTodo`, passed `onToggle` to each `TodoItem`
- frontend/src/components/completed-section.tsx (modified) -- Imported `useUpdateTodo`, passed `onToggle` to each `TodoItem`

### Review Findings

- [x] [Review][Patch] `group-hover` without `group` ancestor -- checkbox hover effect never triggers [frontend/src/components/todo-item.tsx:46]. Fixed: added `group` class to the wrapping `<button>` element so `group-hover:border-foreground/50` activates on hover.
- [x] [Review][Defer] `aria-controls` references conditionally-rendered element [frontend/src/components/completed-section.tsx:59] -- deferred, pre-existing from Story 3.2. The `aria-controls="completed-todos-list"` attribute points to an element that is not in the DOM when the section is collapsed. Low-severity a11y issue.
- [x] [Review][Defer] `useUpdateTodo` optimistic update only handles `isCompleted` field [frontend/src/hooks/use-todos.ts:98] -- deferred, not in scope. If `description` editing is added later, the `onMutate` optimistic write will need to be extended to include `description`.
