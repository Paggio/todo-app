# Story 3.2: Todo List View with Active and Completed Sections

Status: done

## Story

As an authenticated user,
I want to see all my todos organized into active and completed sections,
so that I can quickly scan what needs doing and what's done.

## Acceptance Criteria

1. **Given** the user has todos **When** they land on the main view **Then** a TanStack Query hook (`useGetTodos` with query key `["todos"]`) fetches todos from `GET /api/todos` and displays them in two sections: active todos at the top, completed todos below a separator (FR11)

2. **Given** completed todos are displayed **When** they render in the completed section **Then** they are visually distinguished from active todos with dimmed text (`text-muted-foreground`) and strikethrough (FR19)

3. **Given** the `api.ts` fetch utility receives API responses **When** it processes the response **Then** it transforms snake_case keys to camelCase before returning data to frontend hooks (already implemented in `lib/api.ts`)

4. **Given** the TanStack Query client configuration **When** query keys are structured **Then** `["todos"]` supports targeted invalidation via `queryClient.invalidateQueries({ queryKey: ["todos"] })` after any mutation

## Tasks / Subtasks

- [x] Task 1: Add Todo types to the shared types file (AC: #1, #3)
  - [x] 1.1 In `frontend/src/types/index.ts`, add a `Todo` type with fields: `id: number`, `userId: number`, `description: string`, `isCompleted: boolean`, `createdAt: string` (ISO 8601 UTC). These are the camelCase equivalents of the backend `TodoRead` schema (`id`, `user_id`, `description`, `is_completed`, `created_at`). The `api.ts` `toCamel` transform handles the conversion automatically.
  - [x] 1.2 Add a `CreateTodoRequest` type: `{ description: string }`. Add an `UpdateTodoRequest` type: `{ isCompleted?: boolean; description?: string }`. These will be used by later stories (3.3, 3.4) but defining them now prevents type churn.

- [x] Task 2: Create the `use-todos.ts` hook with `useGetTodos` (AC: #1, #4)
  - [x] 2.1 Create `frontend/src/hooks/use-todos.ts`. Import `useQuery` from `@tanstack/react-query`, `apiFetch` from `@/lib/api`, and `Todo` from `@/types`.
  - [x] 2.2 Export `function useGetTodos()` that returns `useQuery({ queryKey: ["todos"], queryFn: () => apiFetch<Todo[]>("/api/todos") })`. The query key `["todos"]` enables targeted invalidation from mutation hooks in Stories 3.3-3.5.
  - [x] 2.3 Do NOT add mutation hooks (`useCreateTodo`, `useUpdateTodo`, `useDeleteTodo`) in this story. Those belong to Stories 3.3, 3.4, 3.5 respectively. Only the read hook is needed here.

- [x] Task 3: Create the `TodoItem` component (AC: #2)
  - [x] 3.1 Create `frontend/src/components/todo-item.tsx`. This is a presentational component that renders a single todo.
  - [x] 3.2 Props: `todo: Todo`. No callbacks yet (toggle/delete are Stories 3.4/3.5).
  - [x] 3.3 Render: a `div` with `role="listitem"` containing a visual checkbox indicator (a `div` styled as a circle/check, not an interactive `<input>` yet since toggle is Story 3.4) and the todo description text.
  - [x] 3.4 Active state: normal text color (`text-foreground`), unchecked indicator.
  - [x] 3.5 Completed state: text uses `text-muted-foreground` class + `line-through` decoration. The checkbox indicator shows a filled/checked state. These classes map to the existing shadcn/ui design token `--muted-foreground` in `index.css`.
  - [x] 3.6 Use `cn()` from `@/lib/utils` for conditional class merging (same pattern as existing components like `auth-screen.tsx`).
  - [x] 3.7 Ensure 44px minimum touch target height (`min-h-[44px]`) per UX accessibility requirement (UX-DR16).

- [x] Task 4: Create the `TodoList` component (AC: #1)
  - [x] 4.1 Create `frontend/src/components/todo-list.tsx`. This component renders the active todos section.
  - [x] 4.2 Props: `todos: Todo[]` (pre-filtered to active only by parent).
  - [x] 4.3 Render: a `div` with `role="list"` wrapping `TodoItem` components for each active todo.
  - [x] 4.4 Use `todo.id` as the React `key` prop (stable, unique integer from the database).

- [x] Task 5: Create the `CompletedSection` component (AC: #1, #2)
  - [x] 5.1 Create `frontend/src/components/completed-section.tsx`. This component renders the completed todos section below a separator.
  - [x] 5.2 Props: `todos: Todo[]` (pre-filtered to completed only by parent).
  - [x] 5.3 Render only if `todos.length > 0` (per UX spec: "Completed section empty -> no message, section simply absent").
  - [x] 5.4 Include a section header showing "Completed" label with a count badge (e.g., "Completed (3)") using `text-muted-foreground` and `label` text size (~13px / `text-xs`).
  - [x] 5.5 Add a visual separator between active and completed sections. Use a `div` with `border-t border-border` (maps to the `--border` token in `index.css`). The separator goes above the header.
  - [x] 5.6 Render completed todos using `TodoItem` within a `div` with `role="list"`.
  - [x] 5.7 Collapsible behavior: use React `useState` to track expanded/collapsed state. Default to expanded. Store preference in `localStorage` under key `"completed-section-collapsed"` and restore on mount (UX-DR5). Toggle via clicking the section header.
  - [x] 5.8 When collapsed, show only the header with count badge; hide the todo items.

- [x] Task 6: Update `HomePage` to render the todo list (AC: #1, #2)
  - [x] 6.1 Replace the placeholder content in `frontend/src/pages/home.tsx` with the real todo list view.
  - [x] 6.2 Call `useGetTodos()` to fetch todos. While loading (`isLoading`), render a simple "Loading..." text placeholder (skeleton screens are Story 3.6). On error (`isError`), render a simple error message placeholder (full error states are Story 3.6).
  - [x] 6.3 Split the todo data into two arrays: `activeTodos = todos.filter(t => !t.isCompleted)` and `completedTodos = todos.filter(t => t.isCompleted)`.
  - [x] 6.4 Render layout: a centered single-column container (`max-w-2xl mx-auto px-4 sm:px-8`) per UX-DR15 responsive spec.
  - [x] 6.5 Render a page title ("Todos" or similar) using `text-xl font-semibold` (heading role per UX typography scale).
  - [x] 6.6 Include the sign-out button (keep `useLogout` from existing code) in the header area.
  - [x] 6.7 Render `TodoList` with `activeTodos`, then `CompletedSection` with `completedTodos`.
  - [x] 6.8 Spacing between sections: `space-y-8` or `gap-8` (32px per UX spacing spec: "Active list to completed section divider: 32px").

## Dev Notes

### Critical Architecture Constraints

- **TanStack Query for ALL server state.** Never store server data in React `useState` or context. The `useGetTodos` hook is the single source of truth for todo list data. [Source: architecture.md#Frontend Architecture L210-215]
- **Query key `["todos"]`** enables hierarchical invalidation. Stories 3.3-3.5 will use `queryClient.invalidateQueries({ queryKey: ["todos"] })` in `onSettled` of their mutations. The key must be exactly `["todos"]` (array-based). [Source: architecture.md#Communication Patterns L315-316]
- **`api.ts` handles all HTTP + key transforms.** Components and hooks never call `fetch` directly. `apiFetch<T>()` automatically includes credentials and transforms snake_case response keys to camelCase. The `Todo` type uses camelCase fields (`isCompleted`, `userId`, `createdAt`). [Source: architecture.md#Enforcement Guidelines L354, L358]
- **No `useEffect` + `useState` for data fetching.** This is an explicitly forbidden anti-pattern. Use TanStack Query's `useQuery` hook. [Source: architecture.md#Anti-Patterns L363]
- **File naming: kebab-case** for all frontend files (`todo-item.tsx`, `use-todos.ts`, `completed-section.tsx`). [Source: architecture.md#Naming Patterns L274]
- **Component naming: PascalCase** (`TodoItem`, `TodoList`, `CompletedSection`). [Source: architecture.md#Naming Patterns L272]
- **No response wrappers.** The API returns a direct array for `GET /api/todos`. The `Todo[]` type maps directly to the response. [Source: architecture.md#Anti-Patterns L363]

### API Contract (from Story 3.1)

- `GET /api/todos` returns `Todo[]` (array of `TodoRead` objects), ordered by `created_at` descending (most recent first)
- Response fields (snake_case from API, transformed to camelCase by `api.ts`): `id` (int), `user_id` (int), `description` (string), `is_completed` (bool), `created_at` (ISO 8601 UTC string)
- Auth: httpOnly cookie sent automatically via `credentials: "include"` in `api.ts`
- Error: 401 if not authenticated (intercepted globally by `api.ts` which dispatches `auth:unauthorized` event)

### Project Structure Notes

Files to create:
- `frontend/src/hooks/use-todos.ts` -- TanStack Query hook for fetching todos (mirrors `use-auth.ts` pattern)
- `frontend/src/components/todo-item.tsx` -- Single todo item presentation component
- `frontend/src/components/todo-list.tsx` -- Active todos list container
- `frontend/src/components/completed-section.tsx` -- Collapsible completed todos section

Files to modify:
- `frontend/src/types/index.ts` -- Add `Todo`, `CreateTodoRequest`, `UpdateTodoRequest` types
- `frontend/src/pages/home.tsx` -- Replace placeholder with real todo list view

No backend changes in this story. No new npm dependencies required -- `@tanstack/react-query`, `react-router`, `clsx`, `tailwind-merge` are all already installed.

### Previous Story Intelligence (Story 3.1)

1. **Backend API is production-ready.** All 44 tests pass (26 auth + 18 todos). `GET /api/todos` returns a sorted array filtered by the authenticated user's `user_id`. The endpoint is mounted at `/api/todos` with `Depends(get_current_user)`. [Source: 3-1-todo-crud-api-endpoints.md#Completion Notes]

2. **`TodoRead` response shape:** `{ "id": int, "user_id": int, "description": str, "is_completed": bool, "created_at": "ISO8601" }`. After `api.ts` transforms: `{ id, userId, description, isCompleted, createdAt }`. [Source: backend/app/routers/todos.py#TodoRead L37-43]

3. **Auth cookie flow works end-to-end.** Registration/login sets an httpOnly cookie; `api.ts` includes it via `credentials: "include"`. The `AuthProvider` hydrates on mount via `GET /api/auth/me`. The `AuthGuard` redirects to `/login` if not authenticated. No changes needed to the auth flow. [Source: 3-1-todo-crud-api-endpoints.md#Previous Story Intelligence]

4. **`useLogout` already references `["todos"]` query key.** The existing `useLogout` mutation in `use-auth.ts` calls `queryClient.removeQueries({ queryKey: ["todos"] })` on success/error. This confirms the `["todos"]` key is already the expected convention. [Source: frontend/src/hooks/use-auth.ts L53-54]

5. **Existing frontend patterns to follow:**
   - `use-auth.ts` for hook patterns (imports `apiFetch`, `queryClient`, types from `@/types`)
   - `auth-screen.tsx` for component patterns (imports `cn` from `@/lib/utils`, uses Tailwind classes)
   - `home.tsx` currently has placeholder content that must be replaced
   - `app.tsx` wraps `HomePage` in `AuthGuard` -- no routing changes needed

6. **Design token system uses shadcn/ui defaults.** The `index.css` defines tokens like `--foreground`, `--muted-foreground`, `--border` in oklch format with both light and dark variants. Use Tailwind classes that reference these tokens: `text-foreground`, `text-muted-foreground`, `border-border`. Do NOT use the UX spec's hex color values directly -- use the existing shadcn/ui token classes. The full Apple-inspired design token system (UX-DR1) is Story 4.1.

### What NOT To Do

- Do NOT add mutation hooks (`useCreateTodo`, `useUpdateTodo`, `useDeleteTodo`) -- those are Stories 3.3, 3.4, 3.5
- Do NOT add the FAB (floating action button) -- that is Story 3.3
- Do NOT add interactive checkbox toggle behavior -- that is Story 3.4
- Do NOT add delete button/action -- that is Story 3.5
- Do NOT add skeleton loading states or full error handling UI -- that is Story 3.6
- Do NOT add animations (completion animation, spring physics, fade-in) -- those are Epic 4 stories
- Do NOT add the empty state component -- that is Story 3.6
- Do NOT install new npm packages -- all dependencies are already in `package.json`
- Do NOT create a separate CSS file for components -- use Tailwind utility classes inline (per architecture)
- Do NOT use `useEffect` + `useState` to fetch todos -- use TanStack Query `useQuery`
- Do NOT store todo data in React context or global state -- TanStack Query cache is the source of truth
- Do NOT modify any backend files
- Do NOT use the `any` type in TypeScript

### References

- [Source: epics.md#Story 3.2 L428-451 -- story requirements and acceptance criteria]
- [Source: architecture.md#Frontend Architecture L209-215 -- TanStack Query, React Router, fetch wrapper]
- [Source: architecture.md#Communication Patterns L315-324 -- query keys, optimistic pattern, auth state]
- [Source: architecture.md#Structure Patterns L280-286 -- frontend directory organization]
- [Source: architecture.md#Naming Patterns L252-275 -- camelCase TS, PascalCase components, kebab-case files]
- [Source: architecture.md#Enforcement Guidelines L352-366 -- mandatory patterns, forbidden anti-patterns]
- [Source: architecture.md#Architectural Boundaries L476-487 -- component boundaries, hooks own data-fetching]
- [Source: ux-design-specification.md#Component Strategy L410-470 -- TodoItem, CompletedSection, EmptyState specs]
- [Source: ux-design-specification.md#UX Consistency Patterns L471-515 -- feedback patterns, navigation patterns]
- [Source: ux-design-specification.md#Responsive Design L520-537 -- breakpoints, container sizing]
- [Source: ux-design-specification.md#Accessibility L539-565 -- keyboard nav, ARIA roles, touch targets]
- [Source: prd.md#FR11 (view active + completed), FR19 (visual distinction)]
- [Source: 3-1-todo-crud-api-endpoints.md -- previous story learnings, API contract, test patterns]
- [Source: frontend/src/lib/api.ts -- apiFetch, snake/camel transforms, 401 interception]
- [Source: frontend/src/hooks/use-auth.ts -- hook pattern, ["todos"] query key usage]
- [Source: frontend/src/types/index.ts -- existing type definitions to extend]
- [Source: frontend/src/pages/home.tsx -- placeholder to replace]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript typecheck: 0 errors
- ESLint: 0 errors, 0 warnings
- Backend regression suite: 47/47 passed (26 auth + 21 todos including health)
- No frontend test framework configured (vitest/jest not installed); tests deferred to when framework is set up

### Completion Notes List

- **Task 1:** Added `Todo`, `CreateTodoRequest`, and `UpdateTodoRequest` types to `frontend/src/types/index.ts`. All fields use camelCase matching `api.ts` transform output.
- **Task 2:** Created `useGetTodos` hook in `frontend/src/hooks/use-todos.ts` using TanStack Query with `queryKey: ["todos"]` and `apiFetch<Todo[]>("/api/todos")`. No mutation hooks added per scope constraints.
- **Task 3:** Created `TodoItem` presentational component with visual checkbox indicator (circle/check SVG), conditional `text-muted-foreground` + `line-through` for completed state, `role="listitem"`, `min-h-[44px]` touch target, and `cn()` for class merging.
- **Task 4:** Created `TodoList` component rendering active todos in a `role="list"` container with `todo.id` as React key.
- **Task 5:** Created `CompletedSection` with collapsible behavior (localStorage persistence under `"completed-section-collapsed"`), count badge header, `border-t border-border` separator, conditional rendering when empty. Includes `aria-expanded` and `aria-controls` for accessibility.
- **Task 6:** Replaced `HomePage` placeholder with full todo list view: `useGetTodos()` hook, loading/error placeholders, active/completed todo filtering, centered responsive layout (`max-w-2xl mx-auto px-4 sm:px-8`), "Todos" heading, sign-out button, `space-y-8` section spacing.
- **Deferrals:** No frontend unit tests written — project has no vitest/jest configured. Skeleton loading and full error states deferred to Story 3.6 per spec.

### File List

New files:
- `frontend/src/hooks/use-todos.ts`
- `frontend/src/components/todo-item.tsx`
- `frontend/src/components/todo-list.tsx`
- `frontend/src/components/completed-section.tsx`

Modified files:
- `frontend/src/types/index.ts`
- `frontend/src/pages/home.tsx`

### Change Log

- 2026-04-15: Implemented Story 3.2 — Todo list view with active and completed sections. Added Todo types, useGetTodos hook, TodoItem/TodoList/CompletedSection components, and updated HomePage. All 4 ACs satisfied. 6 tasks / 32 subtasks completed.
- 2026-04-15: Code review completed — 1 patch applied (empty active list gap), 2 deferred, 3 dismissed. All 4 ACs pass. Status → done.

### Review Findings

- [x] [Review][Patch] Empty active list creates invisible `space-y-8` gap when all todos are completed [frontend/src/pages/home.tsx:35] — When `activeTodos` is empty but `completedTodos` is non-empty, the empty `<TodoList>` renders an empty `<div role="list">` that still participates in `space-y-8` layout, producing a spurious 32px gap above the completed section separator. Fix: conditionally render `<TodoList>` only when `activeTodos.length > 0`.
- [x] [Review][Defer] `aria-controls` references element absent from DOM when collapsed [frontend/src/components/completed-section.tsx:58] — deferred, pre-existing accessibility pattern; valid per WAI-ARIA but ideally the controlled element should remain in DOM with hidden attribute
- [x] [Review][Defer] Empty `<div role="list">` announced by screen reader when no active todos [frontend/src/components/todo-list.tsx:14] — deferred, can be addressed when empty state component is added in Story 3.6
