# Story 5.2: Category Management Frontend

Status: review

## Story

As an authenticated user,
I want a category management panel where I can create, rename, and delete my categories,
so that I can organize my task structure.

## Acceptance Criteria

1. **Given** the `use-categories` hook **When** it is initialized **Then** it provides useGetCategories (query key `["categories"]`), useCreateCategory, useRenameCategory, and useDeleteCategory -- each mutation following the three-step optimistic pattern (onMutate -> onError -> onSettled)

2. **Given** the app header **When** it renders for an authenticated user **Then** a gear icon is displayed that opens the CategoryManagementPanel (UX-DR23)

3. **Given** the user clicks the gear icon **When** the CategoryManagementPanel opens **Then** it slides in from the right (320px on desktop, full-width sheet on mobile) with a frosted glass backdrop, showing all categories with an "Add category" input at the top (UX-DR23)

4. **Given** the user types a category name and submits in the panel **When** the category is created **Then** it appears immediately in the list (optimistic update), the server syncs in the background, and the input clears (FR31, FR17 expanded)

5. **Given** the user clicks a category name in the panel **When** inline rename activates (click-to-edit) **Then** the name becomes an editable input; on blur or Enter the rename is saved optimistically; empty or duplicate names show inline validation error (FR32, FR37)

6. **Given** the user clicks the delete button on a category **When** the inline confirmation appears ("This will uncategorize X todos. Remove?" with [Cancel][Remove]) **Then** clicking [Remove] deletes the category optimistically, invalidates both `["categories"]` and `["todos"]` query keys, and the affected todo count reflects the server response (FR33)

7. **Given** the CategoryManagementPanel is open **When** the user clicks outside or presses Escape **Then** the panel closes with a reverse slide animation

## Tasks / Subtasks

- [x] Task 1: Create `use-categories.ts` TanStack Query hook (AC: #1)
  - [x] 1.1 Create `frontend/src/hooks/use-categories.ts` with useGetCategories, useCreateCategory, useRenameCategory, useDeleteCategory
  - [x] 1.2 Implement three-step optimistic pattern on useCreateCategory (onMutate: snapshot + prepend optimistic category -> onError: rollback + toast -> onSettled: invalidate `["categories"]`)
  - [x] 1.3 Implement three-step optimistic pattern on useRenameCategory (onMutate: snapshot + update name in cache -> onError: rollback + toast -> onSettled: invalidate `["categories"]`)
  - [x] 1.4 Implement three-step optimistic pattern on useDeleteCategory (onMutate: snapshot + remove from cache -> onError: rollback + toast -> onSettled: invalidate both `["categories"]` AND `["todos"]`)

- [x] Task 2: Create CategoryManagementPanel component (AC: #3, #4, #5, #6, #7)
  - [x] 2.1 Create `frontend/src/components/category-management-panel.tsx`
  - [x] 2.2 Implement slide-in panel (320px desktop, full-width mobile) with frosted glass backdrop (`backdrop-filter: blur()`)
  - [x] 2.3 Implement "Add category" input at top with Enter-to-submit and inline validation
  - [x] 2.4 Implement category list showing each category name with inline rename (click-to-edit) and delete (ghost red icon)
  - [x] 2.5 Implement inline rename: clicking name converts to input, blur/Enter saves optimistically, empty/duplicate shows validation error
  - [x] 2.6 Implement delete: ghost red Trash2 icon, click triggers inline confirmation ("This will uncategorize X todos. Remove?" with [Cancel][Remove])
  - [x] 2.7 Implement panel close: click-outside or Escape key dismisses with reverse slide animation
  - [x] 2.8 Add animation keyframes (slide-in-right, slide-out-right) and utility classes in `index.css`

- [x] Task 3: Integrate gear icon into HomePage header (AC: #2)
  - [x] 3.1 Add gear icon (Settings lucide icon) button to the header in `frontend/src/pages/home.tsx`
  - [x] 3.2 Add state to control panel open/close
  - [x] 3.3 Render CategoryManagementPanel conditionally when open

- [x] Task 4: Install required shadcn/ui components (dependency for Task 2)
  - [x] 4.1 Skipped: panel implemented as custom component with CSS animations per Dev Notes decision (no shadcn Sheet needed)
  - [x] 4.2 Verified: existing button and input primitives are sufficient; custom frosted glass backdrop implemented with CSS

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** There is NO `tailwind.config.ts`. All theme customization goes through CSS custom properties in `src/index.css`.
- **No JS animation libraries.** All animation is CSS transitions + keyframes + JS class toggling. Follow the FAB animation pattern (state machine: idle -> expanding -> expanded -> collapsing -> idle) for the panel.
- **File naming: kebab-case for frontend.** Component naming: PascalCase.
- **No `any` type in TypeScript.**
- **API boundary:** API always returns snake_case JSON. Frontend `api.ts` transforms to camelCase automatically. The category API returns `{ id, user_id, name, created_at }` which becomes `{ id, userId, name, createdAt }` on the frontend.
- **Error contract:** All errors return `{ "detail": "message", "code": "CODE" }`. Use `ApiClientError` from `lib/api.ts` to check error codes in onError handlers (e.g., for `DUPLICATE_CATEGORY_NAME`).
- **Per-user isolation:** Backend handles this. Frontend simply calls the API endpoints.
- **DELETE response:** The `DELETE /api/categories/{id}` endpoint returns `{ "affected_todos": N }` with status 200 (not 204). The `apiFetch` utility will parse this as JSON and transform to `{ affectedTodos: N }`.

### Existing Code Patterns to Follow Exactly

**TanStack Query mutation pattern** (from `frontend/src/hooks/use-todos.ts`):
```typescript
export function useCreateTodo() {
  return useMutation({
    mutationFn: (payload: CreateTodoRequest) =>
      apiFetch<Todo>("/api/todos", { method: "POST", body: payload }),
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] })
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"])
      const optimisticTodo: Todo = { id: -Date.now(), /* ... */ }
      queryClient.setQueryData<Todo[]>(["todos"], (old) => [optimisticTodo, ...(old ?? [])])
      return { previousTodos }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos"], context.previousTodos)
      }
      toast.error("Failed to create todo. Please try again.", { duration: 4000 })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}
```

Follow this EXACT pattern for all four category mutations. Key details:
- Import from `@tanstack/react-query`, not `react-query`
- Import `toast` from `"sonner"`
- Import `apiFetch` from `"@/lib/api"`
- Import `queryClient` from `"@/lib/query-client"`
- Import types from `"@/types"`
- Use `async` onMutate with `await queryClient.cancelQueries()`
- Return the snapshot as `{ previousCategories }` from onMutate
- In onError, guard with `if (context?.previousCategories)` before rollback
- Toast errors use `duration: 4000`

**Component pattern** (from `frontend/src/components/fab.tsx`):
- State machine for animations using CSS keyframes
- `onAnimationEnd` handler to transition state machine
- `useEffect` for focus management
- `useEffect` with `document.addEventListener("mousedown")` for click-outside
- `useCallback` for event handlers used in dependency arrays
- `useRef` for DOM element references (input focus, container)
- `cn()` utility from `@/lib/utils` for conditional class names

**Toast pattern** (from `use-todos.ts`):
```typescript
toast.error("Failed to create category. Please try again.", { duration: 4000 })
```

### Category API Endpoints (Backend Reference)

The backend is already implemented (Story 5.1). These are the endpoints your hooks will call:

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| GET | `/api/categories` | -- | `Category[]` (ordered by name) |
| POST | `/api/categories` | `{ name: string }` | `Category` (201) |
| PATCH | `/api/categories/{id}` | `{ name: string }` | `Category` |
| DELETE | `/api/categories/{id}` | -- | `{ affectedTodos: number }` (200) |

Error responses:
- 409 `DUPLICATE_CATEGORY_NAME` -- name already exists for this user
- 404 `CATEGORY_NOT_FOUND` -- category not found or belongs to another user
- 422 `VALIDATION_ERROR` -- empty name or invalid input

### use-categories.ts Hook Specification

File: `frontend/src/hooks/use-categories.ts`

```typescript
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { queryClient } from "@/lib/query-client"
import type { Category, CreateCategoryRequest, RenameCategoryRequest } from "@/types"
```

Four exported hooks:
1. **useGetCategories** -- `useQuery({ queryKey: ["categories"], queryFn: () => apiFetch<Category[]>("/api/categories") })`
2. **useCreateCategory** -- `useMutation` with `POST /api/categories`, optimistic prepend to cache, negative ID for optimistic item
3. **useRenameCategory** -- `useMutation` taking `{ id: number } & RenameCategoryRequest`, `PATCH /api/categories/{id}`, optimistic name update in cache
4. **useDeleteCategory** -- `useMutation` taking `{ id: number }`, `DELETE /api/categories/{id}`, optimistic remove from cache, onSettled invalidates BOTH `["categories"]` AND `["todos"]`

**CRITICAL for useDeleteCategory:** The `onSettled` must invalidate both query keys:
```typescript
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ["categories"] })
  queryClient.invalidateQueries({ queryKey: ["todos"] })
},
```
This is because deleting a category sets `category_id = NULL` on affected todos (server-side cascade), so the todos cache must also be refreshed.

**Delete mutation response type:** The DELETE endpoint returns `{ affectedTodos: number }`. Define a type:
```typescript
type DeleteCategoryResponse = { affectedTodos: number }
```
The `mutationFn` should be typed as `apiFetch<DeleteCategoryResponse>(...)`. The component needs this count to display the confirmation message. There are two approaches:
- **Approach A (recommended):** Before showing the confirmation dialog, count todos with that categoryId from the existing `["todos"]` cache data. This avoids needing the server response for the confirmation message.
- The server response `affectedTodos` is available in `onSuccess` if needed, but the deletion itself is triggered AFTER the confirmation.

### CategoryManagementPanel Component Specification

File: `frontend/src/components/category-management-panel.tsx`

**Props:**
```typescript
type CategoryManagementPanelProps = {
  open: boolean
  onClose: () => void
}
```

**Animation state machine** (follow FAB pattern):
```
closed -> opening -> open -> closing -> closed
```
- `opening`: `animate-slide-in-right` CSS class
- `closing`: `animate-slide-out-right` CSS class
- `onAnimationEnd`: transitions `opening -> open`, `closing -> closed`

**Layout structure:**
```
| Backdrop (frosted glass) |
|                          | Panel (320px / full-width) |
|                          | [X close button]          |
|                          | "Categories" heading       |
|                          | [Add category input]       |
|                          | Category 1 [rename][delete] |
|                          | Category 2 [rename][delete] |
|                          | ...                         |
```

**Add category input:**
- Visible label "Add category" (`text-label` class)
- Input with Enter-to-submit
- Validation: empty name shows inline error on blur
- On submit: call `createCategory.mutate({ name: trimmed })`, clear input
- Handle `DUPLICATE_CATEGORY_NAME` error from the API -- show inline error (or let the toast handle it)

**Category list item:**
- Default state: category name displayed as text
- Click on name: switch to inline edit mode (input with current name, blur/Enter to save, Escape to cancel)
- Delete button: Trash2 icon (lucide-react), ghost variant, red/destructive color
- Delete flow:
  1. User clicks delete icon
  2. Inline confirmation row expands below: "This will uncategorize X todos. Remove?" + [Cancel] + [Remove]
  3. Count X: read from `["todos"]` cache data -- count todos where `categoryId === category.id`
  4. [Cancel] hides the confirmation
  5. [Remove] calls `deleteCategory.mutate({ id: category.id })`
  6. Auto-dismiss the confirmation after 5 seconds if no action (per UX-DR12 destructive confirmation pattern)

**Accessibility:**
- Panel should trap focus when open (or at minimum, focus the close button / add input on open)
- Escape key closes the panel
- Close button has `aria-label="Close category management"`
- Add input has proper `label` and `aria-describedby` for validation errors
- Edit inputs have `aria-label="Rename category"`
- Delete buttons have `aria-label="Delete category {name}"`

### CSS Animation Additions

Add to `frontend/src/index.css` (following existing animation patterns):

**New keyframes:**
```css
@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
@keyframes slide-out-right {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}
@keyframes backdrop-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes backdrop-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
```

**New utility classes** (in `@layer utilities`):
```css
.animate-slide-in-right {
  animation: slide-in-right var(--duration-slow) var(--ease-spring) both;
}
.animate-slide-out-right {
  animation: slide-out-right var(--duration-fast) ease-in both;
}
.animate-backdrop-fade-in {
  animation: backdrop-fade-in var(--duration-normal) ease-out both;
}
.animate-backdrop-fade-out {
  animation: backdrop-fade-out var(--duration-fast) ease-in both;
}
```

### HomePage Header Integration

In `frontend/src/pages/home.tsx`, add a gear icon button to the header between ThemeToggle and Sign out:

```tsx
import { Settings } from "lucide-react"
import { CategoryManagementPanel } from "@/components/category-management-panel"

// In HomePage component:
const [categoryPanelOpen, setCategoryPanelOpen] = useState(false)

// In header JSX, add between ThemeToggle and Sign out:
<Button
  variant="ghost"
  size="icon"
  onClick={() => setCategoryPanelOpen(true)}
  aria-label="Manage categories"
  title="Manage categories"
  className="min-h-[44px] min-w-[44px]"
>
  <Settings className="size-4" />
</Button>

// At end of component (before closing </div>), add:
<CategoryManagementPanel
  open={categoryPanelOpen}
  onClose={() => setCategoryPanelOpen(false)}
/>
```

### Frontend Types Already Available (from Story 5.1)

These types are already defined in `frontend/src/types/index.ts` -- do NOT recreate them:

```typescript
export type Category = {
  id: number
  userId: number
  name: string
  createdAt: string
}

export type CreateCategoryRequest = {
  name: string
}

export type RenameCategoryRequest = {
  name: string
}
```

### shadcn/ui Components Needed

Currently installed: `button`, `input` only.

For this story, you may need to install additional shadcn/ui primitives:
- **sheet** -- for the mobile full-width panel variant (optional: you can implement the panel manually with CSS as the architecture already uses a custom frosted glass backdrop, not the standard sheet overlay)

**Decision:** Implement the panel as a custom component with CSS animations (matching the FAB pattern), NOT as a shadcn/ui Sheet. Reasons:
1. The UX spec requires a specific frosted glass backdrop (same as auth screen), not the default Sheet overlay
2. The animation state machine pattern is already established in the FAB
3. Avoids installing extra dependencies for a component we'd heavily customize anyway
4. Keeps the implementation consistent with existing patterns

If you DO need to install a shadcn component, run:
```bash
cd frontend && pnpm dlx shadcn@latest add sheet
```

### What NOT to Do

- Do NOT add category assignment to todos (FAB category dropdown, inline edit) -- that is Story 5.3
- Do NOT add CategorySectionHeader or category sections in the todo list -- that is Story 5.3
- Do NOT add ViewSwitcher or view filtering -- that is Epic 7
- Do NOT add PriorityIndicator or DeadlineLabel -- that is Epic 6
- Do NOT modify the backend API -- it is complete from Story 5.1
- Do NOT install JS animation libraries (framer-motion, react-spring, etc.)
- Do NOT use `any` type in TypeScript
- Do NOT store JWT in localStorage or React state
- Do NOT use `useEffect` + `useState` for data fetching -- use TanStack Query
- Do NOT create a `tailwind.config.ts` file
- Do NOT hardcode color values in component files -- use CSS variables / Tailwind classes
- Do NOT create response wrappers -- return data directly from hooks
- Do NOT modify existing test files or break existing functionality
- Do NOT add `use-categories.test.ts` in this story unless explicitly adding unit tests (tests are optional for this story; Story 5.1 has comprehensive backend tests)

### Files to Create

- `frontend/src/hooks/use-categories.ts` -- TanStack Query hooks for category CRUD
- `frontend/src/components/category-management-panel.tsx` -- Slide-in panel component

### Files to Modify

- `frontend/src/pages/home.tsx` -- add gear icon to header, render CategoryManagementPanel
- `frontend/src/index.css` -- add slide-in/out animation keyframes and utility classes

### Files to Verify (no changes expected)

- `frontend/src/types/index.ts` -- Category types already added in Story 5.1
- `frontend/src/hooks/use-todos.ts` -- unchanged, but verify useUpdateTodo handles categoryId (already does from Story 5.1)
- `frontend/src/lib/api.ts` -- unchanged, snake/camel transform handles category fields automatically
- `frontend/src/lib/query-client.ts` -- unchanged
- `frontend/src/app.tsx` -- unchanged (no new routes or providers needed)

### Cross-Story Dependencies

- **Story 5.1 (done):** Provides the category API endpoints and frontend types. All backend work is complete.
- **Story 5.3 (next):** Will consume the `use-categories` hook created here to build category assignment UI (FAB dropdown, inline edit, category section headers in the All view). Story 5.3 depends on this story's hooks and panel being complete.
- **Epic 6 (after Epic 5):** Will build priority indicators and deadline labels. Independent of category management but will coexist in the todo item component.
- **Epic 7 (after Epic 6):** Will build view switcher with client-side filtering. Will use categories from the `["categories"]` query for the All view grouping.

### Previous Story Intelligence (Story 5.1)

Key learnings from Story 5.1:
1. `pnpm typecheck`, `pnpm lint`, and `pnpm build` all pass with 0 errors. Maintain this standard.
2. Backend has 86 passing tests (25 auth + 1 health + 22 category + 38 todo). Do not break them.
3. Frontend types (`Category`, `CreateCategoryRequest`, `RenameCategoryRequest`) are already defined.
4. The `use-todos.ts` hook already handles `categoryId`, `deadline`, `priority` in optimistic updates.
5. The `apiFetch` utility auto-transforms snake_case/camelCase -- no manual key transformation needed.
6. The `api_error()` backend helper returns consistent `{ detail, code }` format which `ApiClientError` captures.
7. The DELETE endpoint returns `{ "affected_todos": N }` as JSON (status 200), not 204.

### Git Intelligence

Recent commit for Story 5.1:
- `d9e0541` feat: story 5.1, category CRUD API and todo metadata expansion
  - Files created: `category.py` model, `categories.py` router, migration, `test_categories.py`
  - Files modified: `todo.py` model (new fields), `todos.py` router (expanded schemas), types, hooks
  - Pattern: comprehensive single commit per story, descriptive message with `feat:` prefix

### Project Structure Notes

- New files go in existing directories: `frontend/src/hooks/`, `frontend/src/components/`
- No new directories needed
- Follow kebab-case file naming: `use-categories.ts`, `category-management-panel.tsx`
- Follow PascalCase component naming: `CategoryManagementPanel`
- Follow camelCase function naming: `useGetCategories`, `useCreateCategory`, etc.

### References

- [Source: epics.md#Story 5.2 -- acceptance criteria, FR31-33, FR37, FR17, UX-DR23]
- [Source: architecture.md#Frontend Architecture -- TanStack Query hooks, optimistic mutation pattern, query keys]
- [Source: architecture.md#API & Communication Patterns -- category endpoints, error codes]
- [Source: architecture.md#Implementation Patterns -- naming conventions, anti-patterns]
- [Source: architecture.md#Project Structure -- frontend organization, file locations]
- [Source: ux-design-specification.md#CategoryManagementPanel -- slide-in panel, frosted glass, inline rename, delete confirmation]
- [Source: ux-design-specification.md#UX Consistency Patterns -- destructive confirmation pattern (inline, 5s auto-dismiss)]
- [Source: ux-design-specification.md#Accessibility -- keyboard nav, focus management, ARIA]
- [Source: prd.md#Category Management FR31-37 -- functional requirements]
- [Source: frontend/src/hooks/use-todos.ts -- TanStack Query optimistic mutation pattern reference]
- [Source: frontend/src/components/fab.tsx -- animation state machine, click-outside, focus management patterns]
- [Source: frontend/src/pages/home.tsx -- header layout, component composition]
- [Source: frontend/src/index.css -- animation keyframes, CSS custom properties, utility classes]
- [Source: frontend/src/types/index.ts -- Category, CreateCategoryRequest, RenameCategoryRequest types]
- [Source: frontend/src/lib/api.ts -- apiFetch, ApiClientError, snake/camel transforms]
- [Source: backend/app/routers/categories.py -- API endpoint implementations and response formats]
- [Source: _bmad-output/implementation-artifacts/5-1-category-and-todo-metadata-backend.md -- previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- ESLint `react-hooks/set-state-in-effect` rule required refactoring the panel state sync from useEffect to in-render derivation using `deriveNextPanelState()` pure function
- ESLint `react-hooks/refs` rule required removing the ref-based category name sync pattern; `startEditing()` already copies `category.name` into `editName`, making the sync unnecessary
- Pre-existing lint errors in `login.tsx` (2 refs-during-render) and pre-existing build errors in `login.test.tsx` (test type mismatches) were not addressed as they are outside story scope

### Completion Notes List

- Created `use-categories.ts` with 4 exported hooks (useGetCategories, useCreateCategory, useRenameCategory, useDeleteCategory) following the exact three-step optimistic pattern from `use-todos.ts`
- Created `category-management-panel.tsx` with animation state machine (closed/opening/open/closing), frosted glass backdrop, inline rename (click-to-edit), inline delete confirmation with 5s auto-dismiss, Escape/click-outside close
- Integrated gear icon (Settings from lucide-react) into HomePage header between ThemeToggle and Sign out button
- Added 4 CSS keyframes (slide-in-right, slide-out-right, backdrop-fade-in, backdrop-fade-out) and 4 utility classes to index.css
- No new dependencies installed; panel uses custom CSS animations per Dev Notes decision
- All 86 backend tests pass, all 6 frontend tests pass, `pnpm typecheck` passes with 0 errors

### Change Log

- 2026-04-16: Story 5.2 implementation complete -- category management frontend with hooks, panel, and header integration

### File List

**Created:**
- `frontend/src/hooks/use-categories.ts`
- `frontend/src/components/category-management-panel.tsx`

**Modified:**
- `frontend/src/pages/home.tsx` (added gear icon button, CategoryManagementPanel render, state)
- `frontend/src/index.css` (added slide-in/out animation keyframes and utility classes)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status: ready-for-dev -> in-progress -> review)
