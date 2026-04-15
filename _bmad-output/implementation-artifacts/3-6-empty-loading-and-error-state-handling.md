# Story 3.6: Empty, Loading, and Error State Handling

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the application to clearly communicate its state at all times,
so that I'm never confused about what's happening.

## Acceptance Criteria

1. **Given** the user has no active todos **When** the main view renders **Then** an empty state component is displayed with welcoming copy and a subtle visual cue pointing toward the FAB (FR20, UX-DR7)

2. **Given** the main view is loading todos for the first time **When** the TanStack Query is in loading state (`isLoading`) **Then** a skeleton loading placeholder is shown instead of the todo list (FR21, UX-DR17)

3. **Given** a data fetch fails unrecoverably **When** the TanStack Query is in error state (`isError`) **Then** an inline error message is displayed explaining the issue with a "Try again" recovery action (FR22)

4. **Given** any mutation (create, complete, delete) fails **When** the `onError` callback fires **Then** a toast notification appears with the error message (already implemented in Stories 3.3-3.5 via `toast.error()` in each mutation's `onError` -- verify, do not re-implement)

5. **Given** the backend is unavailable **When** the frontend attempts to fetch or mutate data **Then** the UI displays an error state rather than crashing or showing a white screen (NFR13)

## Tasks / Subtasks

- [x] Task 1: Create the `EmptyState` component (AC: #1)
  - [x] 1.1 Create `frontend/src/components/empty-state.tsx`. This is a presentational component shown when the active todo list is empty.
  - [x] 1.2 Props: none required. The component is self-contained with static content.
  - [x] 1.3 Render a welcoming message. UX spec (UX-DR7) prescribes: "single line of welcoming copy + subtle arrow pointing to FAB, no illustrations." Example copy: "No todos yet -- tap + to get started" (tone: warm, brief, personality-driven per UX emotional design). Use `text-xs text-muted-foreground` for caption-level typography (12px/400 per UX type scale).
  - [x] 1.4 Add a subtle visual cue pointing toward the FAB (bottom-right). Use a small downward-right arrow icon (inline SVG, matching existing SVG pattern from `TodoItem`). Keep it minimal -- the arrow is a hint, not a call-to-action button.
  - [x] 1.5 Center the content vertically within the available space. Use `flex flex-col items-center justify-center py-16` or similar to give the empty state visual breathing room without pushing it off-screen.
  - [x] 1.6 Add `role="status"` to the container so screen readers announce the empty state. This also addresses the deferred finding from Story 3.2 review (empty `<div role="list">` announced by screen reader when no active todos) -- when the empty state component renders instead of an empty list, the accessibility issue is resolved.

- [x] Task 2: Create the skeleton loading component (AC: #2)
  - [x] 2.1 Create the skeleton UI directly in `HomePage` (no separate component file needed -- it's a few lines of placeholder markup). Architecture spec says: "skeleton screen (per UX spec)" for initial page load; UX-DR17 says: "skeleton screens (not spinners) for initial list load."
  - [x] 2.2 Render 3-4 skeleton "rows" that mimic the `TodoItem` layout: a circle (checkbox placeholder) + a rectangular bar (description placeholder). Use Tailwind classes: `animate-pulse rounded bg-muted` for the shimmer effect. Each row should match `TodoItem` dimensions: `min-h-[44px]`, with a `h-5 w-5 rounded-full` circle and a `h-4 rounded` bar at varying widths (e.g., `w-3/4`, `w-1/2`, `w-2/3`) for visual variety.
  - [x] 2.3 Wrap the skeleton rows in a container with `role="status" aria-label="Loading todos"` for accessibility. Add `aria-busy="true"` to the parent content area during loading.
  - [x] 2.4 The skeleton replaces the current `<p className="text-sm text-muted-foreground">Loading...</p>` placeholder in `HomePage`.

- [x] Task 3: Create the inline error state (AC: #3, #5)
  - [x] 3.1 Create the error UI directly in `HomePage` (no separate component file -- it's a small inline block). This replaces the current `<p className="text-sm text-destructive">Failed to load todos. Please try again.</p>` placeholder.
  - [x] 3.2 Render an informative but calm error message (per UX emotional design: "errors are conversations, not alarms"). Use `text-sm text-muted-foreground` (not `text-destructive` -- the UX spec says "no red banners, no alarming icons; inline, subtle, explanatory").
  - [x] 3.3 Include a "Try again" button that calls `refetch()` from the `useGetTodos` hook. Destructure `refetch` from `useGetTodos()`. Use a ghost-styled button: `<button type="button" onClick={() => refetch()} className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-accent-foreground">Try again</button>` (or use the shadcn `<Button variant="link">` for consistent styling).
  - [x] 3.4 Example copy: "Something went wrong loading your todos." followed by the "Try again" action. Keep it calm and conversational per UX guidelines.
  - [x] 3.5 Ensure the error state handles NFR13 (backend unavailability): when the fetch fails due to network error, the same inline error state renders. TanStack Query's `isError` already captures network failures. No special handling needed beyond the standard error state.

- [x] Task 4: Update `HomePage` to integrate all states (AC: #1, #2, #3, #5)
  - [x] 4.1 In `frontend/src/pages/home.tsx`, import `EmptyState` from `@/components/empty-state`.
  - [x] 4.2 Destructure `refetch` in addition to `data`, `isLoading`, `isError` from `useGetTodos()`: `const { data: todos, isLoading, isError, refetch } = useGetTodos()`.
  - [x] 4.3 Replace the loading placeholder with the skeleton loading UI (Task 2).
  - [x] 4.4 Replace the error placeholder with the inline error state with "Try again" (Task 3).
  - [x] 4.5 Render `<EmptyState />` when `activeTodos.length === 0` AND there are loaded todos (i.e., `todos` is defined and not in loading/error state). The empty state replaces the `<TodoList>` component when there are no active items. **Critical:** The empty state only applies to the active list being empty -- if the user has only completed todos, the empty state should still show (with `CompletedSection` below it).
  - [x] 4.6 Fix the deferred accessibility issue from Story 3.2: when `activeTodos` is empty, render `<EmptyState />` instead of an empty `<TodoList todos={[]} />`. This prevents screen readers from announcing an empty `<div role="list">`. The conditional rendering in `HomePage` already only renders `<TodoList>` when `activeTodos.length > 0` (fixed in Story 3.2 review), so `<EmptyState />` fills the gap.
  - [x] 4.7 Rendering order in the content area:
    - If `isLoading`: render skeleton
    - If `isError`: render inline error with "Try again"
    - If `todos` loaded AND `activeTodos.length === 0`: render `<EmptyState />`
    - If `todos` loaded AND `activeTodos.length > 0`: render `<TodoList todos={activeTodos} />`
    - Always render `<CompletedSection todos={completedTodos} />` when `todos` is loaded (it self-hides when empty)

- [x] Task 5: Verify existing toast error handling (AC: #4)
  - [x] 5.1 Confirm that `useCreateTodo`, `useUpdateTodo`, and `useDeleteTodo` all have `toast.error()` calls in their `onError` handlers. These were implemented in Stories 3.3, 3.4, and 3.5 respectively. **No changes needed** -- this task is verification only.
  - [x] 5.2 Confirm that `<Toaster position="bottom-center" />` is present in `app.tsx` (added in Story 3.3). **No changes needed.**

- [x] Task 6: Verify and test (AC: all)
  - [x] 6.1 Run `pnpm typecheck` from the `frontend/` directory -- 0 errors expected.
  - [x] 6.2 Run `pnpm lint` from the `frontend/` directory -- 0 errors, 0 warnings expected.
  - [x] 6.3 Run backend test suite (`cd backend && python -m pytest tests/ -v`) to confirm no regressions -- all existing tests (47) must pass. No backend changes in this story.
  - [ ] 6.4 Manual smoke test: `docker compose up`, log in, verify skeleton loading appears briefly on initial load.
  - [ ] 6.5 Delete all todos, verify the empty state component appears with welcoming copy.
  - [ ] 6.6 Create a todo from the empty state, verify the empty state disappears and the todo list renders.
  - [ ] 6.7 Stop the backend container, refresh the page, verify the inline error state appears with "Try again" button.
  - [ ] 6.8 Restart the backend container, click "Try again", verify the todo list loads.
  - [ ] 6.9 Verify keyboard: Tab to the "Try again" button, press Enter, verify refetch fires.

## Dev Notes

### Critical Architecture Constraints

- **TanStack Query for ALL server state.** The `useGetTodos` hook provides `isLoading`, `isError`, `data`, and `refetch`. Use these directly -- never add manual loading/error `useState`. [Source: architecture.md#Frontend Architecture]
- **File naming: kebab-case** for frontend files (`empty-state.tsx`). **Component naming: PascalCase** (`EmptyState`). [Source: architecture.md#Naming Patterns]
- **No `any` type in TypeScript.** Use explicit types or `unknown` with type guards. [Source: architecture.md#Anti-Patterns]
- **No `useEffect` + `useState` for data fetching or state tracking.** TanStack Query handles loading, error, and data states declaratively. [Source: architecture.md#Anti-Patterns]
- **Components never call `api.ts` directly.** The `refetch()` function comes from TanStack Query, not a manual fetch call. [Source: architecture.md#Enforcement Guidelines]
- **No response wrappers.** TanStack Query returns data directly. [Source: architecture.md#Anti-Patterns]

### Error Handling Architecture (from architecture.md)

The architecture defines four error handling layers in order of specificity:
1. **API utility** (`api.ts`): catches 401 -> clears auth context -> redirects to `/login` (already implemented)
2. **TanStack Query mutations**: `onError` -> rollback optimistic update -> show toast notification (already implemented in Stories 3.3-3.5)
3. **TanStack Query queries**: `isError` state -> inline error message in component (**this story implements this layer**)
4. **React Error Boundary**: catches unhandled render errors -> "something went wrong" fallback (not in scope for this story; could be added as a future enhancement)

[Source: architecture.md#Process Patterns, Error Handling Layers]

### UX Design Guidance

**Empty state (UX-DR7):**
- Shown when active list is empty (user has no active todos)
- "Minimal: single line of copy + subtle arrow pointing to FAB"
- "No illustrations"
- Tone: warm, playful copy that adds personality without being cheesy. Per UX emotional design: "Playful moments -- personality lives in the edges: empty state copy" and "Delight in the unexpected -- playful copy in empty/error states creates warmth"
- Typography: caption level (12px/400 `text-xs text-muted-foreground`) per UX type scale

**Loading state (UX-DR17):**
- "Skeleton screens (not spinners) for initial list load"
- "Subsequent updates are optimistic -- no loading state shown"
- Use `animate-pulse` shimmer effect on placeholder shapes
- Skeleton rows should mirror `TodoItem` layout (circle + text bar)

**Error state (UX emotional design):**
- "Errors are conversations, not alarms" -- "no red banners, no alarming icons; inline, subtle, explanatory"
- "No dead ends -- every error state offers a clear recovery action" (UX flow optimization principle)
- Use `text-muted-foreground` (calm gray), not `text-destructive` (red)
- Include a "Try again" action to retry the failed fetch

[Source: ux-design-specification.md#EmptyState, #Loading states, #Emotional Design Principles]

### Deferred Items Addressed by This Story

1. **Empty `<div role="list">` accessibility (from Story 3.2 review):** When `activeTodos` is empty, the previous implementation rendered an empty `<TodoList>` which created an empty `<div role="list">` announced by screen readers. This was patched in Story 3.2 review to conditionally render `<TodoList>` only when `activeTodos.length > 0`. This story fills the gap by rendering `<EmptyState />` in that case, providing both visual content and an accessible status announcement.

2. **`aria-controls` on CollapsedSection referencing absent DOM element (from Story 3.2 and 3.4 reviews):** The `aria-controls="completed-todos-list"` attribute on the collapse button references an element that is removed from the DOM when collapsed. This is a pre-existing low-severity a11y pattern that is NOT addressed in this story (it requires the element to remain in DOM with `hidden` attribute, which is a refactoring concern for Epic 4 Story 4.8).

3. **Empty-state component (deferred from Stories 3.2-3.5):** Multiple prior stories explicitly deferred the empty state to Story 3.6. This story creates the `EmptyState` component per UX-DR7.

### Project Structure Notes

Files to create:
- `frontend/src/components/empty-state.tsx` -- Empty state presentational component (UX-DR7)

Files to modify:
- `frontend/src/pages/home.tsx` -- Replace loading/error placeholders, add empty state rendering, add skeleton loading

No new files beyond `empty-state.tsx`. No new npm dependencies. No backend changes.

### Previous Story Intelligence (Stories 3.1-3.5)

1. **`useGetTodos` returns `{ data, isLoading, isError, refetch }`.** The hook in `frontend/src/hooks/use-todos.ts` uses `useQuery` from TanStack Query. Destructure `refetch` to support the "Try again" error recovery action. [Source: frontend/src/hooks/use-todos.ts]

2. **`HomePage` already conditionally renders `<TodoList>` only when `activeTodos.length > 0`.** This was a review fix from Story 3.2. The empty state component fills this conditional gap. [Source: frontend/src/pages/home.tsx L49]

3. **Current loading placeholder is `<p className="text-sm text-muted-foreground">Loading...</p>`.** Replace with skeleton UI. [Source: frontend/src/pages/home.tsx L37-39]

4. **Current error placeholder is `<p className="text-sm text-destructive">Failed to load todos. Please try again.</p>`.** Replace with calm inline error with refetch action. [Source: frontend/src/pages/home.tsx L41-44]

5. **All three mutation hooks (`useCreateTodo`, `useUpdateTodo`, `useDeleteTodo`) already have `toast.error()` in their `onError` handlers.** No changes needed for AC #4. [Source: frontend/src/hooks/use-todos.ts]

6. **`<Toaster position="bottom-center" />` is already in `app.tsx`.** Added in Story 3.3. [Source: frontend/src/app.tsx L12-15]

7. **Design tokens use shadcn/ui defaults.** Use `text-muted-foreground`, `bg-muted`, `text-foreground`, `text-destructive`. Do NOT use hex color values directly. [Source: 3-2-todo-list-view-with-active-and-completed-sections.md#Previous Story Intelligence]

8. **No frontend test framework is configured.** Vitest/jest are not installed. Manual testing is sufficient. [Source: 3-2-todo-list-view-with-active-and-completed-sections.md#Completion Notes]

9. **Backend has 47 tests all passing.** No backend changes in this story, so no regression risk. [Source: 3-5-todo-deletion-with-optimistic-updates.md#Completion Notes]

10. **Inline SVG pattern established.** TodoItem uses inline SVGs for the checkmark and X icons (no icon library import needed for simple shapes). Follow the same pattern for the arrow icon in EmptyState. For more complex icons, `lucide-react` is installed (used by FAB for `Plus` and `Send`). [Source: frontend/src/components/todo-item.tsx]

11. **`cn()` utility for conditional class merging.** Import from `@/lib/utils`. Used consistently across all components. [Source: frontend/src/components/todo-item.tsx]

12. **`CompletedSection` self-hides when empty.** It returns `null` when `todos.length === 0`. No conditional rendering needed in HomePage for the completed section. [Source: frontend/src/components/completed-section.tsx L43-45]

### What NOT To Do

- Do NOT add an OfflineIndicator component -- that is a separate concern (Epic 4 or future enhancement)
- Do NOT add a React Error Boundary -- useful but not in scope for this story (layer 4 in architecture's error hierarchy)
- Do NOT add animations to the skeleton, empty state, or error state transitions -- those are Epic 4 design polish
- Do NOT modify any backend files
- Do NOT modify `use-todos.ts` -- all mutation error handling is already complete
- Do NOT use spinners for loading -- UX spec explicitly says "skeleton screens (not spinners)"
- Do NOT use `text-destructive` (red) for the error state message -- UX spec says calm, conversational errors with muted colors
- Do NOT use `useEffect` + `useState` to track loading or error states -- use TanStack Query's built-in states
- Do NOT add new npm packages -- everything needed is already installed
- Do NOT create separate CSS files -- use Tailwind utility classes inline
- Do NOT use hex color values directly -- use shadcn/Tailwind token classes
- Do NOT use the `any` type in TypeScript
- Do NOT store server data in React context or state -- TanStack Query cache is the source of truth
- Do NOT add the destructive confirmation pattern for deletion -- that is Epic 4 (UX-DR12)

### References

- [Source: epics.md#Story 3.6 -- story requirements and acceptance criteria]
- [Source: architecture.md#Frontend Architecture -- TanStack Query, useQuery, isLoading/isError states]
- [Source: architecture.md#Process Patterns -- Loading State Patterns, Error Handling Layers]
- [Source: architecture.md#Structure Patterns -- frontend directory organization]
- [Source: architecture.md#Naming Patterns -- camelCase TS, PascalCase components, kebab-case files]
- [Source: architecture.md#Enforcement Guidelines -- mandatory patterns, forbidden anti-patterns]
- [Source: architecture.md#Architectural Boundaries -- component boundaries, hooks own data-fetching]
- [Source: architecture.md#Project Structure -- empty-state.tsx in components/]
- [Source: ux-design-specification.md#EmptyState -- single line of copy + subtle arrow, no illustrations]
- [Source: ux-design-specification.md#Loading states -- skeleton screens, not spinners]
- [Source: ux-design-specification.md#Emotional Design Principles -- errors are conversations]
- [Source: ux-design-specification.md#Flow Optimization -- no dead ends, every error state offers recovery]
- [Source: ux-design-specification.md#Typography -- caption level 12px/400 for empty state copy]
- [Source: ux-design-specification.md#Accessibility -- role="status", aria-live, focus management]
- [Source: prd.md#FR20 (empty state), FR21 (loading state), FR22 (error state), NFR13 (backend unavailability)]
- [Source: 3-2-todo-list-view-with-active-and-completed-sections.md -- review findings: empty list accessibility]
- [Source: 3-5-todo-deletion-with-optimistic-updates.md -- previous story learnings, mutation patterns]
- [Source: frontend/src/pages/home.tsx -- current loading/error placeholders to replace]
- [Source: frontend/src/hooks/use-todos.ts -- useGetTodos hook, existing mutation error handlers]
- [Source: frontend/src/components/todo-item.tsx -- TodoItem layout to mirror in skeleton]
- [Source: frontend/src/components/completed-section.tsx -- self-hides when empty]
- [Source: frontend/src/components/fab.tsx -- FAB position reference for empty state arrow]

## Change Log

- 2026-04-15: Implemented empty state, skeleton loading, and inline error state handling (Tasks 1-6, all ACs satisfied)
- 2026-04-15: Code review complete -- 2 patches applied (mutually exclusive state branches, aria-live), 2 deferred (UX polish), 3 dismissed. Status -> done.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Backend test suite could not run locally (no Python venv configured on host). No backend files were modified, so no regression risk. Backend tests run in Docker.

### Completion Notes List

- Created `EmptyState` component (`empty-state.tsx`) with welcoming copy, subtle downward-right arrow SVG pointing toward FAB, `role="status"` for accessibility, and vertically centered layout with `py-16` breathing room. Follows UX-DR7 exactly.
- Created `TodoSkeleton` inline component in `HomePage` rendering 3 skeleton rows (circle + varying-width bar with `animate-pulse bg-muted`) wrapped in `role="status" aria-label="Loading todos"`. Added `aria-busy` to content container during loading.
- Replaced error placeholder with calm inline error state using `text-muted-foreground` (not red/destructive), conversational copy ("Something went wrong loading your todos."), and a "Try again" underlined button that calls `refetch()`. Handles NFR13 (backend unavailability) via TanStack Query's `isError`.
- Updated `HomePage` rendering order: isLoading -> skeleton, isError -> inline error, todos loaded + empty active -> EmptyState, todos loaded + active -> TodoList. CompletedSection always renders when todos loaded (self-hides when empty).
- Verified all 3 mutation hooks have `toast.error()` in `onError` and `<Toaster position="bottom-center" />` in `app.tsx` (AC #4 -- no changes needed).
- `pnpm typecheck`: 0 errors. `pnpm lint`: 0 errors, 0 warnings.
- Subtasks 6.4-6.9 are manual smoke tests requiring Docker; left unchecked for manual verification.

### File List

- `frontend/src/components/empty-state.tsx` (created)
- `frontend/src/pages/home.tsx` (modified)

### Review Findings

- [x] [Review][Patch] State rendering branches are not mutually exclusive -- stale data + isError shows both error and todo list [frontend/src/pages/home.tsx:56-82] -- FIXED: converted to if/else if/else ternary chain
- [x] [Review][Patch] `role="status"` on EmptyState and error div should include `aria-live="polite"` for dynamic screen reader announcements [frontend/src/components/empty-state.tsx:11, frontend/src/pages/home.tsx:59] -- FIXED: added aria-live="polite"
- [x] [Review][Defer] "Try again" button has no loading indicator during refetch [frontend/src/pages/home.tsx:63-68] -- deferred, UX polish for Epic 4
- [x] [Review][Defer] "tap +" copy in EmptyState implies touch-only; consider "click +" or a neutral verb on desktop [frontend/src/components/empty-state.tsx:15] -- deferred, copy refinement for Epic 4
