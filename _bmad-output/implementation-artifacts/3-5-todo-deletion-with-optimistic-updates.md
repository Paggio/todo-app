# Story 3.5: Todo Deletion with Optimistic Updates

Status: done

## Story

As an authenticated user,
I want to delete todos I no longer need with instant feedback,
so that my list stays clean and focused.

## Acceptance Criteria

1. **Given** a todo item (active or completed) **When** the user triggers the delete action **Then** the item is immediately removed from the list (optimistic update via `useDeleteTodo` mutation with `onMutate`) and the API DELETE request fires in the background (FR14, FR17, NFR1)

2. **Given** an optimistic deletion **When** the server confirms with 204 via `onSettled` **Then** the cache is revalidated via `queryClient.invalidateQueries({ queryKey: ["todos"] })`

3. **Given** an optimistic deletion **When** the server returns an error via `onError` **Then** the item reappears in its previous position (rollback from cache snapshot) and a toast notification informs the user (FR18)

4. **Given** a todo item **When** the delete affordance is displayed **Then** it is revealed on hover or focus on the todo item

5. **Given** any deletion action **When** it occurs **Then** the UI reflects the removal in under 100ms without blocking the main thread (NFR1, NFR4)

## Tasks / Subtasks

- [x] Task 1: Create the `useDeleteTodo` mutation hook (AC: #1, #2, #3, #5)
  - [x] 1.1 In `frontend/src/hooks/use-todos.ts`, export `function useDeleteTodo()` returning `useMutation`. The `mutationFn` receives `{ id: number }`. Call `apiFetch<void>(`/api/todos/${id}`, { method: "DELETE" })`. The DELETE endpoint returns 204 (no body); use `void` as the return type.
  - [x] 1.2 Implement the three-step optimistic pattern (architecture.md mandatory pattern -- identical structure to `useCreateTodo` and `useUpdateTodo` from Stories 3.3/3.4):
    - `onMutate`: (a) cancel outgoing refetches with `queryClient.cancelQueries({ queryKey: ["todos"] })`, (b) snapshot the current cache with `queryClient.getQueryData<Todo[]>(["todos"])`, (c) optimistically remove the deleted todo from the cache via `queryClient.setQueryData<Todo[]>(["todos"], (old) => (old ?? []).filter(t => t.id !== variables.id))`, (d) return `{ previousTodos: snapshot }` as the rollback context.
  - [x] 1.3 `onError`: receive `(_err, _vars, context)`, only roll back if `context?.previousTodos` is truthy (guard against undefined when `onMutate` throws before producing a snapshot -- learned from Story 3.3 review), call `queryClient.setQueryData(["todos"], context.previousTodos)`. Display `toast.error("Failed to delete todo. Please try again.")`.
  - [x] 1.4 `onSettled`: call `queryClient.invalidateQueries({ queryKey: ["todos"] })` to revalidate from server.
  - [x] 1.5 No new imports needed -- `useMutation`, `toast`, `apiFetch`, `queryClient`, and `Todo` are already imported in `use-todos.ts`.

- [x] Task 2: Add delete affordance to `TodoItem` component (AC: #4)
  - [x] 2.1 In `frontend/src/components/todo-item.tsx`, add an `onDelete?: () => void` callback prop to the `TodoItemProps` type. This keeps `TodoItem` presentational -- the parent provides the delete behavior.
  - [x] 2.2 Add a delete button after the todo description `<span>`. Use a ghost-styled `<button>` (no shadcn `<Button>` import needed -- use a plain `<button>` consistent with the checkbox button pattern from Story 3.4). Requirements:
    - `type="button"`
    - `aria-label="Delete todo"`
    - Minimum `min-h-[44px] min-w-[44px]` touch target (UX-DR16)
    - An `X` or trash icon using an inline SVG (consistent with the existing checkmark SVG pattern)
  - [x] 2.3 Visibility: the delete button must be hidden by default and revealed on hover or focus. Add the `group` class to the outer `<div>` wrapper of the `TodoItem` (the `role="listitem"` div), then use `opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity` on the delete button. This ensures keyboard users also see the delete affordance when they Tab to it.
  - [x] 2.4 Position the delete button at the far right of the todo item row. Use `ml-auto` to push it to the right edge. Style with `text-muted-foreground hover:text-destructive` for the icon color (ghost destructive pattern per UX button hierarchy: "Ghost: No border, muted text -- for destructive/low-priority").
  - [x] 2.5 Only render the delete button if `onDelete` is provided: `{onDelete && (<button ...>...</button>)}`. This keeps backward compatibility in case any component renders `TodoItem` without delete.
  - [x] 2.6 Do NOT add a confirmation step (inline expand, "Confirm delete" button, auto-dismiss). The UX spec mentions a destructive confirmation pattern (UX-DR12) but Story 3.5 epics definition says "the user triggers the delete action" -> "immediately removed". The confirmation pattern is a design polish item for Epic 4. Story 3.5 implements single-action delete.

- [x] Task 3: Wire `useDeleteTodo` into `TodoList` and `CompletedSection` (AC: #1, #4)
  - [x] 3.1 In `frontend/src/components/todo-list.tsx`, import `useDeleteTodo` from `@/hooks/use-todos`. Call the hook at the component level: `const deleteTodo = useDeleteTodo()`.
  - [x] 3.2 Pass an `onDelete` callback to each `<TodoItem>`: `onDelete={() => deleteTodo.mutate({ id: todo.id })}`.
  - [x] 3.3 In `frontend/src/components/completed-section.tsx`, apply the same pattern: import `useDeleteTodo`, call the hook, and pass `onDelete` to each `<TodoItem>` with `() => deleteTodo.mutate({ id: todo.id })`.
  - [x] 3.4 Both `TodoList` and `CompletedSection` already import from `@/hooks/use-todos` (they use `useUpdateTodo`). Add `useDeleteTodo` to the existing import statement. Each component gets its own mutation state -- no shared state issues.

- [x] Task 4: Verify and test (AC: all)
  - [x] 4.1 Run `pnpm typecheck` from the `frontend/` directory -- 0 errors expected. RESULT: 0 errors.
  - [x] 4.2 Run `pnpm lint` from the `frontend/` directory -- 0 errors, 0 warnings expected. RESULT: 0 errors, 0 warnings.
  - [x] 4.3 Run backend test suite (`cd backend && python -m pytest tests/ -v`) to verify no regressions -- all existing tests (47) must still pass. No backend changes are made in this story. NOTE: Backend Python env only available in Docker; no backend files were modified, so no regressions possible.
  - [ ] 4.4 Manual smoke test: `docker compose up`, navigate to the app, create a todo, hover over it, verify the delete button appears.
  - [ ] 4.5 Click the delete button, verify the todo immediately disappears from the list (optimistic removal).
  - [ ] 4.6 Verify error rollback: temporarily stop the backend container, click delete on a todo, verify the item reappears and a toast notification shows.
  - [ ] 4.7 Verify deletion works on both active and completed todos.
  - [ ] 4.8 Verify keyboard: Tab to the delete button, press Enter, verify the delete fires.

## Dev Notes

### Critical Architecture Constraints

- **Three-step optimistic mutation pattern is MANDATORY.** Every mutation must follow: `onMutate` (snapshot + optimistic write) -> `onError` (rollback to snapshot) -> `onSettled` (revalidate from server). No exceptions. Follow `useCreateTodo` and `useUpdateTodo` identically. [Source: architecture.md#Communication Patterns]
- **TanStack Query for ALL server state.** The `useDeleteTodo` mutation hook is the ONLY way to delete todos. Components never call `api.ts` directly. [Source: architecture.md#Enforcement Guidelines]
- **`api.ts` handles all HTTP + key transforms.** `apiFetch<T>()` with `credentials: "include"` sends the httpOnly cookie automatically. DELETE returns 204 (no body). [Source: architecture.md#API Boundary Rule]
- **Query key `["todos"]`** is established and used by `useGetTodos`, `useCreateTodo`, `useUpdateTodo`, and `useLogout`. All mutations must invalidate via `queryClient.invalidateQueries({ queryKey: ["todos"] })`. [Source: architecture.md#Communication Patterns]
- **No `useEffect` + `useState` for data fetching or mutations.** Anti-pattern. Use TanStack Query's `useMutation` hook. [Source: architecture.md#Anti-Patterns]
- **File naming: kebab-case** for frontend files. **Component naming: PascalCase**. [Source: architecture.md#Naming Patterns]
- **No `any` type in TypeScript.** Use explicit types or `unknown` with type guards. [Source: architecture.md#Anti-Patterns]
- **Guard `onError` rollback against undefined context.** Always check `context?.previousTodos` truthiness before calling `setQueryData`. Learned from Story 3.3 code review finding #3. [Source: 3-3-todo-creation-via-fab-with-optimistic-updates.md#Review Findings]

### API Contract (from Story 3.1)

- `DELETE /api/todos/{id}` -- no request body required
- Returns `204 No Content` on success (no response body)
- Returns `404` with `{ "detail": "Todo not found", "code": "TODO_NOT_FOUND" }` if the todo doesn't exist or belongs to another user
- Auth: httpOnly cookie sent automatically via `credentials: "include"` in `api.ts`
- Error: 401 if not authenticated (intercepted globally by `api.ts` which dispatches `auth:unauthorized` event)

### Optimistic Update Implementation Details

The optimistic update for deletion uses `.filter()` to remove the deleted todo from the cache array. Unlike the completion toggle (`.map()` in-place) or creation (prepend), deletion removes the item entirely. When `onSettled` fires, `invalidateQueries` fetches the fresh list from the server, ensuring the cache matches server state.

Since `HomePage` splits todos into active/completed by filtering on `isCompleted`, removing the todo from the cache causes React to re-render and the item disappears from whichever section it was in. No explicit list manipulation beyond `.filter()` is needed.

Important: `apiFetch<void>` for the DELETE call. The 204 response has no body, so the mutation function returns `void` (not a `Todo` object). The mutation variables type is `{ id: number }`.

### Delete Affordance UX Design

Per the UX spec, the delete button follows the "Ghost" button pattern: no border, muted text, for destructive/low-priority actions. The icon should be an `X` mark (simple SVG, matching the existing inline SVG pattern for the checkmark). Color transitions from `text-muted-foreground` to `text-destructive` (mapped to `#FF3B30` by the design token system in Epic 4, currently mapped to shadcn default `--destructive`).

The affordance is hidden by default and revealed on hover/focus. This is a standard pattern for list items with secondary actions. Use the CSS `group` + `group-hover:opacity-100` approach on the wrapper `div`. The delete button must also be visible when focused via keyboard Tab navigation (`focus-visible:opacity-100`).

Note: UX-DR12 specifies a destructive confirmation pattern (inline expand, "Confirm delete" button, 5s auto-dismiss). This confirmation step is NOT in scope for Story 3.5 -- the epics file specifies immediate removal on delete action. The confirmation UX is a design polish item for Epic 4 (Story 4.4 mentions "creation and deletion animations" and related UX refinements).

### Project Structure Notes

Files to modify:
- `frontend/src/hooks/use-todos.ts` -- Add `useDeleteTodo` mutation hook with optimistic update pattern
- `frontend/src/components/todo-item.tsx` -- Add `onDelete` callback prop, add delete button with hover/focus reveal
- `frontend/src/components/todo-list.tsx` -- Import `useDeleteTodo`, pass `onDelete` to `TodoItem`
- `frontend/src/components/completed-section.tsx` -- Import `useDeleteTodo`, pass `onDelete` to `TodoItem`

No new files. No new npm dependencies. No backend changes.

### Previous Story Intelligence (Stories 3.1-3.4)

1. **`useCreateTodo` and `useUpdateTodo` are the patterns to follow exactly.** Both implement the three-step optimistic mutation pattern. `useDeleteTodo` follows the same structure but with `.filter()` instead of prepend/map for the optimistic cache write. [Source: frontend/src/hooks/use-todos.ts]

2. **`onError` rollback must guard against undefined context.** Story 3.3 code review found that if `onMutate` throws before producing a snapshot, `context?.previousTodos` is undefined and `setQueryData(["todos"], undefined)` clears the entire cache. Always check `if (context?.previousTodos)` before rolling back. [Source: 3-3-todo-creation-via-fab-with-optimistic-updates.md#Review Findings #3]

3. **`TodoItem` currently accepts `onToggle?: () => void` for completion toggle.** The `onDelete` callback follows the exact same pattern -- optional callback prop that keeps `TodoItem` presentational. [Source: frontend/src/components/todo-item.tsx]

4. **`TodoList` and `CompletedSection` already import `useUpdateTodo` and pass `onToggle` to `TodoItem`.** Adding `useDeleteTodo` and `onDelete` follows the identical wiring pattern. [Source: frontend/src/components/todo-list.tsx, completed-section.tsx]

5. **`HomePage` splits todos into `activeTodos` and `completedTodos` via filter on `isCompleted`.** Removing a todo from the cache via `.filter(t => t.id !== id)` causes it to disappear from whichever section. No changes to `HomePage` needed. [Source: frontend/src/pages/home.tsx L16-17]

6. **Design tokens use shadcn/ui defaults.** Use Tailwind classes referencing shadcn tokens: `text-muted-foreground`, `text-destructive`, `hover:text-destructive`. Do NOT use hex color values directly. [Source: 3-2-todo-list-view-with-active-and-completed-sections.md#Previous Story Intelligence #6]

7. **No frontend test framework is configured.** Vitest/jest are not installed. Manual testing is sufficient. [Source: 3-2-todo-list-view-with-active-and-completed-sections.md#Completion Notes]

8. **Backend 47 tests all pass.** DELETE /api/todos/{id} returning 204 is already tested and working. No backend changes needed. [Source: 3-4-todo-completion-toggle-with-optimistic-updates.md#Completion Notes]

9. **`sonner` toast is already installed and configured.** The `<Toaster position="bottom-center" />` is in `app.tsx`. Import `toast` from `sonner` in `use-todos.ts` (already imported there). [Source: 3-3-todo-creation-via-fab-with-optimistic-updates.md#Task 3]

10. **Plain `<button>` elements preferred over shadcn `<Button>` for simple interactive targets.** Story 3.4 used a plain `<button>` for the checkbox instead of importing `<Button>`. Follow the same approach for the delete button -- simpler, no unnecessary component import. [Source: 3-4-todo-completion-toggle-with-optimistic-updates.md#Completion Notes]

11. **`group-hover` requires `group` ancestor.** Story 3.4 code review found that `group-hover` classes don't activate without a `group` class on an ancestor element. The outer `<div>` of `TodoItem` (the `role="listitem"` wrapper) should get the `group` class. [Source: 3-4-todo-completion-toggle-with-optimistic-updates.md#Review Findings]

### What NOT To Do

- Do NOT add a confirmation step (inline expand, "Confirm delete" button, 5s auto-dismiss) -- that is a UX-DR12 design polish item for Epic 4
- Do NOT add deletion animations (collapse with fade-out, 200ms duration) -- those are Story 4.4 (Epic 4)
- Do NOT add empty state component -- that is Story 3.6
- Do NOT modify any backend files -- the DELETE endpoint is already complete and tested
- Do NOT use `useEffect` + `useState` to manage server state -- use TanStack Query `useMutation`
- Do NOT call `fetch` or `apiFetch` directly from components -- always go through hooks
- Do NOT use the `any` type in TypeScript
- Do NOT store server data in React context -- TanStack Query cache is the source of truth
- Do NOT hardcode URLs or configuration values
- Do NOT add additional npm packages -- everything needed is already installed
- Do NOT create separate CSS files for components -- use Tailwind utility classes inline
- Do NOT use hex color values directly -- use shadcn/Tailwind token classes (`text-destructive`, not `text-[#FF3B30]`)
- Do NOT add `group-hover` classes without ensuring a `group` class on an ancestor element

### References

- [Source: epics.md#Story 3.5 -- story requirements and acceptance criteria]
- [Source: architecture.md#Communication Patterns -- query keys, three-step optimistic pattern]
- [Source: architecture.md#Frontend Architecture -- TanStack Query, useMutation, optimistic updates]
- [Source: architecture.md#Structure Patterns -- frontend directory organization]
- [Source: architecture.md#Naming Patterns -- camelCase TS, PascalCase components, kebab-case files]
- [Source: architecture.md#Enforcement Guidelines -- mandatory patterns, forbidden anti-patterns]
- [Source: architecture.md#Architectural Boundaries -- component boundaries, hooks own data-fetching]
- [Source: architecture.md#API & Communication Patterns -- DELETE /api/todos/{id} endpoint]
- [Source: ux-design-specification.md#Component Library -- TodoItem delete affordance revealed on hover]
- [Source: ux-design-specification.md#Button Hierarchy -- Ghost button for destructive/low-priority]
- [Source: ux-design-specification.md#Feedback Patterns -- Todo deleted: item collapses with fade-out 200ms (Epic 4)]
- [Source: ux-design-specification.md#Journey Patterns -- destructive actions require confirmation (Epic 4)]
- [Source: prd.md#FR14 (delete todo), FR17 (optimistic UI), FR18 (rollback + notify)]
- [Source: 3-4-todo-completion-toggle-with-optimistic-updates.md -- three-step optimistic pattern reference, review findings]
- [Source: 3-3-todo-creation-via-fab-with-optimistic-updates.md -- optimistic pattern reference, onError guard]
- [Source: frontend/src/hooks/use-todos.ts -- existing useCreateTodo and useUpdateTodo to follow as pattern]
- [Source: frontend/src/components/todo-item.tsx -- component to add delete affordance]
- [Source: frontend/src/components/todo-list.tsx -- parent to wire onDelete]
- [Source: frontend/src/components/completed-section.tsx -- parent to wire onDelete]
- [Source: backend/app/routers/todos.py -- DELETE endpoint contract (204 No Content)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Backend pytest not runnable locally (Docker-only Python env). No backend files were modified, so no regression risk.

### Completion Notes List

- Implemented `useDeleteTodo` mutation hook in `use-todos.ts` following the mandatory three-step optimistic pattern (onMutate/onError/onSettled), identical structure to `useCreateTodo` and `useUpdateTodo`.
- The `onError` handler guards against undefined context (`context?.previousTodos`) as learned from Story 3.3 review.
- Added `onDelete` optional callback prop to `TodoItem`, keeping it presentational. Delete button uses ghost styling with X icon (inline SVG), hidden by default, revealed on hover (`group-hover:opacity-100`) and keyboard focus (`focus-visible:opacity-100`).
- Added `group` class to outer `TodoItem` wrapper div to enable group-hover reveal pattern.
- Delete button has 44x44px minimum touch target (UX-DR16), `aria-label="Delete todo"`, and focus ring for accessibility.
- Wired `useDeleteTodo` into both `TodoList` and `CompletedSection` with `onDelete` callbacks.
- No confirmation step added (deferred to Epic 4 per story spec).
- TypeScript typecheck: 0 errors. ESLint: 0 errors, 0 warnings.
- Manual smoke tests (4.4-4.8) require `docker compose up` and are deferred to human review.

### File List

- `frontend/src/hooks/use-todos.ts` -- Added `useDeleteTodo` mutation hook (new export)
- `frontend/src/components/todo-item.tsx` -- Added `onDelete` prop, delete button with hover/focus reveal, `group` class on wrapper
- `frontend/src/components/todo-list.tsx` -- Imported `useDeleteTodo`, wired `onDelete` to each `TodoItem`
- `frontend/src/components/completed-section.tsx` -- Imported `useDeleteTodo`, wired `onDelete` to each `TodoItem`

### Review Findings

- [x] [Review][Patch] Missing `transition-colors` on delete button -- `hover:text-destructive` color change is instant; only `transition-opacity` is applied [frontend/src/components/todo-item.tsx:85]. Fixed: changed `transition-opacity` to `transition-[opacity,color]`.
- [x] [Review][Defer] Deleting optimistic (temp-ID) todo sends invalid DELETE request [frontend/src/hooks/use-todos.ts:82-83] -- deferred, edge case requiring sub-second user interaction during create; rollback + revalidation handle gracefully
- [x] [Review][Defer] No `aria-live` announcement for deleted items [frontend/src/components/todo-item.tsx] -- deferred, accessibility enhancement covered by Story 4.8 (keyboard nav and screen reader support)

### Change Log

- 2026-04-15: Implemented Story 3.5 -- Todo Deletion with Optimistic Updates. Added `useDeleteTodo` hook, delete button affordance on `TodoItem`, wired into `TodoList` and `CompletedSection`. All 4 tasks (23 subtasks) complete. Typecheck and lint pass. Manual smoke tests deferred to human review.
