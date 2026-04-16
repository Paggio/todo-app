# Story 5.3: Category Assignment, Display & All View Sections

Status: done

## Story

As an authenticated user,
I want to assign categories to todos and see my list organized into collapsible category sections,
so that I can visually group and manage related tasks.

## Acceptance Criteria

1. **Given** the FAB creation panel is expanded **When** it renders **Then** a category dropdown selector appears in the optional selectors row below the text input; selecting a category is optional -- submitting with only text creates an uncategorized todo (UX-DR29, FR34)

2. **Given** the user creates a todo with a category selected in the FAB **When** the todo is created **Then** it appears in the correct category section in the All view (FR34, FR10 expanded)

3. **Given** the FAB selectors **When** the user creates multiple todos with the same category **Then** the category selector remembers the last-used value within the session; the memory is cleared on page refresh (UX-DR29)

4. **Given** a todo item in a non-"All" view (Due This Week or By Deadline) **When** it has a category assigned **Then** a category chip is displayed (caption size, `--color-bg-subtle` background, `--color-text-muted` text, 4px border-radius); no chip for uncategorized todos (UX-DR31, FR46)

5. **Given** a todo item's category chip (in non-"All" views) or category assignment **When** the user clicks it **Then** a compact popover opens anchored to the element with a category dropdown (same as FAB), selection applies optimistically, Escape or click-outside dismisses without change (UX-DR30, FR35)

6. **Given** the All Todos view **When** it renders with categorized todos **Then** todos are grouped under collapsible CategorySectionHeader dividers: each header shows category name (heading weight), todo count badge (right-aligned), and collapse chevron (far right); uncategorized todos appear in an "Uncategorized" section at the top; completed todos remain in the "Completed" section at the bottom regardless of category; empty categories are hidden (UX-DR22, UX-DR34)

7. **Given** a CategorySectionHeader **When** the user clicks the collapse chevron **Then** the section collapses/expands with a smooth 200ms height animation; collapse state is persisted in localStorage per category ID (UX-DR22)

8. **Given** a category is deleted (via management panel) **When** affected todos lose their category_id **Then** they animate to the "Uncategorized" section in the All view (UX-DR34)

## Tasks / Subtasks

- [x] Task 1: Create CategorySectionHeader component (AC: #6, #7)
  - [x] 1.1 Create `frontend/src/components/category-section-header.tsx`
  - [x] 1.2 Implement collapsible section header: category name (heading weight), todo count badge (right-aligned), collapse chevron (far right)
  - [x] 1.3 Implement smooth 200ms height collapse/expand animation
  - [x] 1.4 Implement localStorage persistence of collapse state keyed by category ID (`category-collapsed-{id}`)
  - [x] 1.5 Implement `aria-expanded` on the header button, `aria-controls` pointing to the section content
  - [x] 1.6 Add 1px bottom border using `--color-border`

- [x] Task 2: Refactor HomePage to render category-grouped All view (AC: #6, #8)
  - [x] 2.1 Import `useGetCategories` from `use-categories.ts` into `home.tsx`
  - [x] 2.2 Group active (non-completed) todos by `categoryId`: uncategorized (`null`) first, then by category name alphabetically
  - [x] 2.3 Render each group under a CategorySectionHeader with the category name and count
  - [x] 2.4 Render an "Uncategorized" section header for todos with `categoryId === null`
  - [x] 2.5 Hide category sections that have zero active todos (empty categories hidden)
  - [x] 2.6 Keep CompletedSection at the bottom, unchanged, across all categories

- [x] Task 3: Extend FAB with category dropdown selector (AC: #1, #2, #3)
  - [x] 3.1 Import `useGetCategories` into `fab.tsx`
  - [x] 3.2 Add a category dropdown below the text input (optional selectors row)
  - [x] 3.3 Implement session memory: store last-used `categoryId` in component state (React state, not localStorage -- clears on page refresh per UX-DR29)
  - [x] 3.4 Pass selected `categoryId` to `createTodo.mutate()` payload
  - [x] 3.5 Style the dropdown row: compact, below input, above submit button
  - [x] 3.6 Ensure Enter still submits the form; category selection is optional -- empty text still blocked, but no category is fine
  - [x] 3.7 On mobile (< 400px viewport), stack the selectors row vertically

- [x] Task 4: Create CategoryChip component for non-"All" views (AC: #4) -- NOTE: this component will not be rendered until Epic 7 (ViewSwitcher). Create it now so it is ready.
  - [x] 4.1 Create `frontend/src/components/category-chip.tsx`
  - [x] 4.2 Style: caption size, `--color-bg-subtle` background (use `bg-muted` or `bg-secondary`), `--color-text-muted` text (use `text-muted-foreground`), 4px border-radius, 4px 8px padding
  - [x] 4.3 Accept `categoryName: string` and optional `onClick` for inline edit trigger
  - [x] 4.4 Render nothing when no category is assigned (uncategorized todos show no chip)

- [x] Task 5: Implement inline category edit popover on todo items (AC: #5) -- NOTE: this is for the category chip in non-"All" views (future) and for a click target in the "All" view (category name in the todo row, if needed). For now, ensure the `useUpdateTodo` hook already supports `categoryId` changes (it does from Story 5.1). The popover can be implemented as a minimal custom dropdown (no shadcn Popover dependency needed -- follow the FAB click-outside pattern).
  - [x] 5.1 Create a `CategoryPickerPopover` inline component (or integrate into `todo-item.tsx` as needed)
  - [x] 5.2 Show dropdown with category list + "None" option, anchored to the trigger element
  - [x] 5.3 On selection: call `useUpdateTodo.mutate({ id: todo.id, categoryId: selectedId })` optimistically
  - [x] 5.4 Dismiss on Escape or click-outside without change
  - [x] 5.5 Accessible: `aria-label` on trigger, keyboard navigation within dropdown

- [x] Task 6: Install shadcn Select component if needed for dropdowns
  - [x] 6.1 Evaluate: can the category dropdown in the FAB and the inline popover use a native `<select>` element styled with Tailwind, or does the UX require a custom dropdown? The UX spec says "Category dropdown" -- a simple native select or a custom dropdown that matches the existing design language. Decision: use a simple custom dropdown (same pattern as the category management panel) to maintain visual consistency. No shadcn Select needed for MVP.

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** There is NO `tailwind.config.ts`. All theme customization goes through CSS custom properties in `src/index.css`. Do NOT create a tailwind.config.ts file.
- **No JS animation libraries.** All animation is CSS transitions + keyframes + JS class toggling. Follow the existing FAB and category panel animation patterns.
- **File naming: kebab-case for frontend.** Component naming: PascalCase.
- **No `any` type in TypeScript.** Use explicit types or `unknown` with type guards.
- **API boundary:** API always returns snake_case JSON. Frontend `api.ts` transforms to camelCase automatically. Todo's `category_id` becomes `categoryId` on the frontend.
- **Error contract:** All errors return `{ "detail": "message", "code": "CODE" }`. Use `ApiClientError` from `lib/api.ts` for error checks.
- **Per-user isolation:** Backend handles this. Frontend simply calls the API endpoints.
- **No dedicated API endpoints for views.** All filtering and sorting is client-side using TanStack Query cache data.
- **TanStack Query keys:** `["todos"]` for todos, `["categories"]` for categories. Category deletion invalidates both.
- **localStorage keys:** Use `category-collapsed-{categoryId}` pattern for collapse state persistence. Match existing pattern from `completed-section.tsx` which uses `completed-section-collapsed`.

### Existing Code Patterns to Follow Exactly

**TanStack Query mutation pattern** (from `frontend/src/hooks/use-todos.ts` -- useUpdateTodo):
```typescript
export function useUpdateTodo() {
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateTodoRequest) =>
      apiFetch<Todo>(`/api/todos/${id}`, { method: "PATCH", body: payload }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] })
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"])
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        (old ?? []).map((t) =>
          t.id === variables.id ? { ...t, ...(variables.categoryId !== undefined && { categoryId: variables.categoryId }) } : t
        )
      )
      return { previousTodos }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTodos) { queryClient.setQueryData(["todos"], context.previousTodos) }
      toast.error("Failed to update todo. Please try again.", { duration: 4000 })
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["todos"] }) },
  })
}
```
**The `useUpdateTodo` hook already handles `categoryId` changes.** You do NOT need to modify `use-todos.ts`. Just call `useUpdateTodo().mutate({ id: todo.id, categoryId: newCategoryId })`.

**CompletedSection collapse pattern** (from `frontend/src/components/completed-section.tsx`):
```typescript
const STORAGE_KEY = "completed-section-collapsed"
const [collapsed, setCollapsed] = React.useState(() => {
  try { return localStorage.getItem(STORAGE_KEY) === "true" } catch { return false }
})
const toggle = React.useCallback(() => {
  setCollapsed((prev) => {
    const next = !prev
    try { localStorage.setItem(STORAGE_KEY, String(next)) } catch {}
    return next
  })
}, [])
```
Follow this EXACT pattern for CategorySectionHeader localStorage persistence, using key `category-collapsed-{categoryId}`.

**FAB component structure** (from `frontend/src/components/fab.tsx`):
- State machine for animations
- `useRef` for DOM refs (input focus, container)
- `useCallback` for event handlers
- `cn()` utility from `@/lib/utils` for conditional class names
- Click-outside via `document.addEventListener("mousedown")`
- Keyboard handling: Enter submits, Escape closes

**Toast pattern**: `toast.error("message", { duration: 4000 })` and `toast` imported from `"sonner"`

### Category API Already Complete (Backend Reference from Story 5.1)

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| GET | `/api/categories` | -- | `Category[]` (ordered by name) |
| POST | `/api/categories` | `{ name: string }` | `Category` (201) |
| PATCH | `/api/categories/{id}` | `{ name: string }` | `Category` |
| DELETE | `/api/categories/{id}` | -- | `{ affectedTodos: number }` (200) |

The `PATCH /api/todos/{id}` endpoint already accepts `{ category_id: number | null }` to change or remove a todo's category assignment. The frontend `useUpdateTodo` hook already supports this.

### Category Grouping Logic for the All View

In `home.tsx`, transform the flat `activeTodos` array into grouped sections:

```typescript
// 1. Get categories from cache
const { data: categories } = useGetCategories()

// 2. Group active todos by categoryId
const uncategorized = activeTodos.filter(t => t.categoryId === null)
const categorizedGroups = (categories ?? [])
  .map(cat => ({
    category: cat,
    todos: activeTodos.filter(t => t.categoryId === cat.id),
  }))
  .filter(group => group.todos.length > 0) // hide empty categories

// 3. Render: Uncategorized section (if any) -> Category sections -> CompletedSection
```

This is a client-side grouping operation on already-cached data. No API calls needed.

### FAB Extension Design

The FAB panel currently has:
```
[ label: "New todo" ]
[ text input | submit button ]
[ validation error ]
```

After this story, it should be:
```
[ label: "New todo" ]
[ text input | submit button ]
[ Category: ▾ None    ]         <-- new optional selectors row
[ validation error ]
```

The category dropdown is a simple `<select>` or custom dropdown showing:
- "None" (default, creates uncategorized todo)
- Each user category by name

Implementation approach: use a native `<select>` element styled with Tailwind for simplicity and accessibility. This avoids needing to install shadcn Select/Popover. A native select handles keyboard navigation, focus, and ARIA automatically.

### Inline Category Edit (AC #5) -- Scope Clarification

AC #5 describes clicking a category chip in non-"All" views to open an inline edit popover. Since the ViewSwitcher (non-"All" views) is Epic 7, the inline edit popover on category chips has no visible surface to trigger it yet in the "All" view (where todos are already grouped by category section, not showing a chip).

**Implementation strategy for this story:**
1. Create the `CategoryChip` component (ready for Epic 7)
2. Create a reusable `CategoryPickerPopover` component that can be attached to any trigger
3. In the "All" view, category assignment is handled via the FAB (creating new todos) or by providing an inline edit target on the todo item itself
4. The inline category edit popover will become fully usable when Epic 7 adds non-"All" views that render the category chip

For now, the primary category assignment flow is: FAB creation panel category dropdown + the management panel for bulk organization. The inline edit popover should be created as a standalone component ready for integration.

### Files to Create

- `frontend/src/components/category-section-header.tsx` -- Collapsible category section divider for the All view
- `frontend/src/components/category-chip.tsx` -- Small category label chip for non-"All" views (ready for Epic 7)
- `frontend/src/components/category-picker-popover.tsx` -- Reusable inline category dropdown popover

### Files to Modify

- `frontend/src/components/fab.tsx` -- Add category dropdown selector row below text input
- `frontend/src/pages/home.tsx` -- Import categories, group active todos by category, render CategorySectionHeaders
- `frontend/src/index.css` -- Add section collapse/expand animation keyframes if not already present

### Files to Verify (no changes expected)

- `frontend/src/hooks/use-todos.ts` -- Already handles `categoryId` in `useUpdateTodo` and `useCreateTodo`
- `frontend/src/hooks/use-categories.ts` -- Already provides `useGetCategories` for loading categories
- `frontend/src/types/index.ts` -- `Category`, `Todo` (with `categoryId`), `CreateTodoRequest` (with `categoryId`) already defined
- `frontend/src/lib/api.ts` -- snake/camel transform handles `category_id` automatically
- `frontend/src/components/completed-section.tsx` -- Unchanged, stays at bottom
- `frontend/src/components/todo-item.tsx` -- Unchanged for this story (priority indicator and deadline label are Epic 6)
- `frontend/src/components/todo-list.tsx` -- May need minor changes if TodoList is refactored to accept grouped data, or the grouping can happen in home.tsx with TodoList rendered per section
- `frontend/src/components/category-management-panel.tsx` -- Unchanged

### What NOT to Do

- Do NOT add ViewSwitcher or view switching tabs -- that is Epic 7
- Do NOT add PriorityIndicator or priority left-border -- that is Epic 6
- Do NOT add DeadlineLabel or overdue treatment -- that is Epic 6
- Do NOT add DeadlineGroupHeader -- that is Epic 7
- Do NOT modify the backend API -- it is complete from Story 5.1
- Do NOT install JS animation libraries (framer-motion, react-spring, etc.)
- Do NOT use `any` type in TypeScript
- Do NOT store JWT in localStorage or React state
- Do NOT use `useEffect` + `useState` for data fetching -- use TanStack Query
- Do NOT create a `tailwind.config.ts` file
- Do NOT hardcode color values in component files -- use CSS variables / Tailwind classes
- Do NOT create response wrappers -- return data directly from hooks
- Do NOT create dedicated API endpoints for views -- all filtering is client-side
- Do NOT store category collapse state in server state or TanStack Query -- use localStorage
- Do NOT store FAB last-used selector values in localStorage -- use React state (clears on page refresh per UX-DR29)
- Do NOT break existing tests -- all 86 backend tests and 6 frontend tests must continue to pass
- Do NOT modify existing hook files unless absolutely necessary

### Previous Story Intelligence (Story 5.2)

Key learnings from Story 5.2:
1. The category management panel uses an animation state machine (closed/opening/open/closing) with CSS keyframes -- follow this pattern for any new animated components.
2. ESLint `react-hooks/set-state-in-effect` rule required refactoring panel state sync from useEffect to in-render derivation. Avoid setting state in useEffect based on prop changes -- derive state inline instead.
3. ESLint `react-hooks/refs` rule is strict. Do not read refs during render.
4. Pre-existing lint errors exist in `login.tsx` (2 refs-during-render) and `login.test.tsx` (test type mismatches) -- these are outside scope, do not fix.
5. `pnpm typecheck`, `pnpm lint`, and `pnpm build` all pass with 0 errors after Story 5.2. Maintain this standard.
6. The `use-categories.ts` hook provides `useGetCategories`, `useCreateCategory`, `useRenameCategory`, `useDeleteCategory` -- all with optimistic patterns.
7. The toast pattern uses `toast.error("message", { duration: 4000 })` from `"sonner"`.
8. Click-outside dismissal uses `document.addEventListener("mousedown")` pattern (not "click").
9. Focus management: use `requestAnimationFrame(() => ref.current?.focus())` for deferred focus.

### Git Intelligence

Recent commits:
- `bbc19c0` feat: story 5.2, category management panel with optimistic mutations (Story 5.2)
  - Created: `use-categories.ts`, `category-management-panel.tsx`
  - Modified: `home.tsx` (gear icon), `index.css` (slide-in/out animations)
- `d9e0541` feat: story 5.1, category CRUD API and todo metadata expansion (Story 5.1)
  - Created: `category.py` model, `categories.py` router, migration, `test_categories.py`
  - Modified: `todo.py` model (new fields), `todos.py` router, types, hooks

Pattern: comprehensive single commit per story, descriptive message with `feat:` prefix.

### Cross-Story Dependencies

- **Story 5.1 (done):** Provides category API, expanded Todo model, frontend types, `useUpdateTodo` with `categoryId` support.
- **Story 5.2 (done):** Provides `use-categories.ts` hooks, `CategoryManagementPanel`. This story depends on `useGetCategories` from 5.2.
- **Epic 6 (after Epic 5):** Will add PriorityIndicator and DeadlineLabel to todo items. Will extend the FAB selectors row with priority dropdown and date picker. Independent of this story but will coexist.
- **Epic 7 (after Epic 6):** Will add ViewSwitcher, Due This Week view, and By Deadline view. Will use the CategoryChip and CategoryPickerPopover created in this story. The category-grouped "All" view created here becomes the default view in Epic 7.

### Project Structure Notes

- New files go in existing directories: `frontend/src/components/`
- No new directories needed
- Follow kebab-case file naming: `category-section-header.tsx`, `category-chip.tsx`, `category-picker-popover.tsx`
- Follow PascalCase component naming: `CategorySectionHeader`, `CategoryChip`, `CategoryPickerPopover`
- Follow camelCase function/variable naming
- Co-locate test files next to source files if adding tests (optional for this story)

### References

- [Source: epics.md#Story 5.3 -- acceptance criteria, FR34, FR35, FR46, FR10, FR17, UX-DR22, UX-DR29, UX-DR30, UX-DR31, UX-DR34]
- [Source: architecture.md#Frontend Architecture -- TanStack Query hooks, optimistic mutation pattern, query keys, client-side view filtering]
- [Source: architecture.md#API & Communication Patterns -- todo PATCH endpoint accepts categoryId, no dedicated view endpoints]
- [Source: architecture.md#Implementation Patterns -- naming conventions, anti-patterns, localStorage concerns]
- [Source: architecture.md#Project Structure -- frontend organization, file locations]
- [Source: ux-design-specification.md#CategorySectionHeader -- collapsible section dividers, heading weight, count badge, collapse chevron, 200ms animation, localStorage persistence]
- [Source: ux-design-specification.md#FAB Creation Panel (Extended) -- optional selectors row below text input, category dropdown, session memory, mobile stacking]
- [Source: ux-design-specification.md#Category chip on todo items -- caption size, bg-subtle, text-muted, 4px radius, no chip for uncategorized]
- [Source: ux-design-specification.md#Inline Edit -- click trigger, compact popover, optimistic update, Escape/click-outside dismisses]
- [Source: ux-design-specification.md#"All Todos" View -- category section dividers, uncategorized at top, completed at bottom, empty categories hidden]
- [Source: ux-design-specification.md#Accessibility -- aria-expanded on collapsible headers, keyboard nav]
- [Source: prd.md#Category Management FR34-FR35 -- assign/change/remove todo category]
- [Source: prd.md#FR46 -- todos display category visually when set]
- [Source: frontend/src/hooks/use-todos.ts -- useUpdateTodo supports categoryId changes]
- [Source: frontend/src/hooks/use-categories.ts -- useGetCategories returns Category[]]
- [Source: frontend/src/components/fab.tsx -- current FAB structure, state machine, animation pattern]
- [Source: frontend/src/components/completed-section.tsx -- localStorage collapse pattern to follow]
- [Source: frontend/src/components/category-management-panel.tsx -- click-outside, animation state machine patterns]
- [Source: frontend/src/pages/home.tsx -- current layout structure, todo filtering]
- [Source: frontend/src/index.css -- animation keyframes, CSS custom properties, utility classes]
- [Source: frontend/src/types/index.ts -- Todo.categoryId, Category, CreateTodoRequest.categoryId]
- [Source: frontend/src/lib/api.ts -- apiFetch, ApiClientError, snake/camel transforms]
- [Source: frontend/src/lib/motion.ts -- motionDuration helper for reduced motion]
- [Source: _bmad-output/implementation-artifacts/5-2-category-management-frontend.md -- previous story learnings, ESLint patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- ESLint warning in `category-picker-popover.tsx`: `options` array recreated on every render caused `useCallback` dependency issue. Fixed by wrapping `options` in `useMemo`.
- Pre-existing lint errors in `login.tsx` (2x refs-during-render) and build errors in `login.test.tsx` (type mismatches) -- out of scope per Story 5.2 notes.

### Completion Notes List

- Task 1: Created `CategorySectionHeader` component with collapsible sections, localStorage persistence (key pattern `category-collapsed-{categoryId}`), `aria-expanded`/`aria-controls` accessibility, heading weight name, count badge, collapse chevron, 1px bottom border, and smooth 200ms CSS transition animation.
- Task 2: Refactored `home.tsx` to import `useGetCategories`, group active todos by `categoryId` (uncategorized first, then alphabetically by category name), render each group under a `CategorySectionHeader`, hide empty categories, and keep `CompletedSection` at the bottom unchanged.
- Task 3: Extended FAB with category dropdown (`<select>`) below the text input. Session memory via React state (clears on page refresh per UX-DR29). Passes `categoryId` to `createTodo.mutate()`. Mobile-responsive with vertical stacking on small screens via `flex-col` + `sm:flex-row`. Enter still submits, category is optional.
- Task 4: Created `CategoryChip` component (caption size, `bg-muted`, `text-muted-foreground`, 4px border-radius, 4px 8px padding). Renders nothing when no `categoryName`. Supports optional `onClick` for inline edit trigger. Ready for Epic 7 integration.
- Task 5: Created `CategoryPickerPopover` component with category list + "None" option, optimistic `useUpdateTodo` integration, click-outside dismissal (mousedown pattern), Escape key handling, keyboard arrow navigation, `aria-label`/`role="listbox"`/`role="option"` accessibility, and `useMemo` for stable options list.
- Task 6: Decision -- native `<select>` for FAB (simplicity, built-in accessibility) and custom dropdown for `CategoryPickerPopover` (visual consistency with management panel). No shadcn Select installed.

### Review Findings

- [x] [Review][Patch] Stale selectedCategoryId after category deletion in FAB [fab.tsx:34] -- FIXED: added derived `validSelectedCategoryId` guard that resets to null when selected category no longer exists in the categories list

### Change Log

- 2026-04-16: Story 5.3 implementation complete. Created 3 new components, modified 2 existing files.
- 2026-04-16: Code review complete. 1 patch applied (stale category guard in FAB), 3 dismissed as noise.

### File List

- `frontend/src/components/category-section-header.tsx` (NEW) -- Collapsible category section divider for the All view
- `frontend/src/components/category-chip.tsx` (NEW) -- Small category label chip for non-"All" views (ready for Epic 7)
- `frontend/src/components/category-picker-popover.tsx` (NEW) -- Reusable inline category dropdown popover
- `frontend/src/components/fab.tsx` (MODIFIED) -- Added category dropdown selector row with session memory
- `frontend/src/pages/home.tsx` (MODIFIED) -- Category-grouped All view with CategorySectionHeaders
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED) -- Story status updated to review
- `_bmad-output/implementation-artifacts/5-3-category-assignment-display-and-all-view-sections.md` (MODIFIED) -- Tasks marked complete, status updated
