# Story 6.1: Priority System -- Tokens, Indicator & Inline Edit

Status: review

## Story

As an authenticated user,
I want to set priority levels (1-5) on my todos and see expressive color indicators,
so that I can visually distinguish urgency at a glance.

## Acceptance Criteria

1. **Given** the design token system (`src/index.css`) **When** priority color tokens are implemented **Then** CSS custom properties define 5 priority colors for both light and dark modes: `--color-priority-1` (red #FF3B30 / #FF453A), `--color-priority-2` (orange #FF9500 / #FF9F0A), `--color-priority-3` (yellow #FFCC00 / #FFD60A), `--color-priority-4` (blue #0066FF / #4D9FFF), `--color-priority-5` (gray #98989D / #636366) (UX-DR25)

2. **Given** a todo item with a priority level set **When** it renders **Then** a PriorityIndicator displays as a 3px solid left border in the corresponding `--color-priority-{n}` color; todos without a priority have no left border (UX-DR24, FR46)

3. **Given** the FAB creation panel is expanded **When** it renders **Then** a priority dropdown selector appears in the optional selectors row, showing colored dots with labels (e.g. "P1 Urgent", "P2 High"); selection is optional -- submitting without priority creates an unprioritized todo (UX-DR29, FR40, FR42)

4. **Given** the user creates multiple todos with the same priority **When** the FAB re-opens **Then** the priority selector remembers the last-used value within the session (UX-DR29)

5. **Given** a todo item's priority indicator **When** the user clicks it **Then** a compact popover opens anchored to the indicator with the priority dropdown (same as FAB); selecting a new level applies optimistically via useUpdateTodo; Escape or click-outside dismisses without change (UX-DR30, FR41)

6. **Given** a todo with priority set **When** the user selects "None" or clears the priority in the inline edit popover **Then** the priority is removed optimistically, the left border disappears, and the server syncs in the background (FR41, FR42)

7. **Given** any priority change (set, change, or remove) **When** the mutation fires **Then** the three-step optimistic pattern applies: onMutate (snapshot + optimistic cache write), onError (rollback + toast), onSettled (invalidate `["todos"]`) (FR17 expanded)

8. **Given** the priority indicator border color **When** priority changes **Then** the left border color transitions smoothly over 150ms (UX feedback pattern)

## Tasks / Subtasks

- [x] Task 1: Add priority color tokens to design system (AC: #1)
  - [x] 1.1 Add `--color-priority-1` through `--color-priority-5` CSS custom properties to `:root` in `src/index.css`
  - [x] 1.2 Add dark mode overrides for all 5 priority colors in `.dark` block
  - [x] 1.3 Register the priority color variables in the `@theme inline` block so Tailwind can reference them (e.g. `--color-priority-1: var(--color-priority-1)`)

- [x] Task 2: Create PriorityIndicator component (AC: #2, #5, #6, #8)
  - [x] 2.1 Create `frontend/src/components/priority-indicator.tsx`
  - [x] 2.2 Render a 3px solid left border on the parent todo item using the corresponding `--color-priority-{n}` color; no border when `priority` is `null`
  - [x] 2.3 Make the indicator clickable -- clicking opens a PriorityPickerPopover
  - [x] 2.4 Add 150ms CSS transition on border-color for smooth color changes (AC #8)
  - [x] 2.5 Add `aria-label` (e.g. "Priority 1, Urgent" or "Set priority") for accessibility

- [x] Task 3: Create PriorityPickerPopover component (AC: #5, #6)
  - [x] 3.1 Create `frontend/src/components/priority-picker-popover.tsx`
  - [x] 3.2 Show dropdown with colored dots + labels: "P1 Urgent", "P2 High", "P3 Medium", "P4 Low", "P5 Minimal", "None"
  - [x] 3.3 On selection: call `useUpdateTodo.mutate({ id: todo.id, priority: selectedPriority })` optimistically (AC #7)
  - [x] 3.4 Dismiss on Escape or click-outside without change
  - [x] 3.5 Accessible: `aria-label` on trigger, `role="listbox"` / `role="option"` on dropdown, keyboard arrow navigation
  - [x] 3.6 Follow the exact same pattern as `CategoryPickerPopover` (click-outside via mousedown, Escape handling, `useMemo` for options)

- [x] Task 4: Integrate PriorityIndicator into TodoItem (AC: #2, #5, #8)
  - [x] 4.1 Modify `frontend/src/components/todo-item.tsx` to render PriorityIndicator
  - [x] 4.2 Apply the 3px left border as an inline style or CSS class on the todo item's outer container, driven by `todo.priority`
  - [x] 4.3 Ensure the border transitions smoothly over 150ms when priority changes
  - [x] 4.4 Ensure completed todos still show the priority border (priority and completion are independent signals)
  - [x] 4.5 Ensure the delete button, checkbox, and other interactive elements still work correctly alongside the new indicator

- [x] Task 5: Extend FAB with priority dropdown selector (AC: #3, #4)
  - [x] 5.1 Modify `frontend/src/components/fab.tsx` to add priority dropdown in the optional selectors row (alongside existing category dropdown)
  - [x] 5.2 Add `selectedPriority` React state for session memory (same pattern as `selectedCategoryId`)
  - [x] 5.3 Show colored dots next to labels in the dropdown: P1 Urgent, P2 High, P3 Medium, P4 Low, P5 Minimal, None
  - [x] 5.4 Pass selected priority to `createTodo.mutate()` payload
  - [x] 5.5 On mobile (< 400px viewport), priority selector stacks vertically alongside category selector
  - [x] 5.6 Enter still submits the form; priority selection is optional

- [x] Task 6: Create priority helper utilities (AC: #2, #3)
  - [x] 6.1 Add priority label/color mapping to `frontend/src/lib/utils.ts` (or a new `priority-helpers.ts` if cleaner)
  - [x] 6.2 Export constants: `PRIORITY_LEVELS` array with `{ value: number, label: string, cssVar: string }` entries
  - [x] 6.3 Export `getPriorityColor(priority: number | null): string | undefined` helper

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** There is NO `tailwind.config.ts`. All theme customization goes through CSS custom properties in `src/index.css`. Do NOT create a `tailwind.config.ts` file.
- **No JS animation libraries.** All animation is CSS transitions + keyframes + JS class toggling. Follow existing FAB and category panel animation patterns.
- **File naming: kebab-case for frontend.** Component naming: PascalCase.
- **No `any` type in TypeScript.** Use explicit types or `unknown` with type guards.
- **API boundary:** API always returns snake_case JSON. Frontend `api.ts` transforms to camelCase automatically. Todo's `priority` field is already `number | null` in the `Todo` type -- no additional type changes needed.
- **Error contract:** All errors return `{ "detail": "message", "code": "CODE" }`. Use `ApiClientError` from `lib/api.ts` for error checks.
- **Per-user isolation:** Backend handles this. Frontend simply calls the API endpoints.
- **TanStack Query keys:** `["todos"]` for todos. Priority mutations use the existing `useUpdateTodo` hook.
- **No new API endpoints.** The `PATCH /api/todos/{id}` endpoint already accepts `{ priority: number | null }`. The `POST /api/todos` endpoint already accepts `{ priority: number | null }` as an optional field. No backend changes needed for this story.
- **No new types.** The `Todo` type already has `priority: number | null`. `CreateTodoRequest` already has `priority?: number | null`. `UpdateTodoRequest` already has `priority?: number | null`.

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
          t.id === variables.id
            ? { ...t, ...(variables.priority !== undefined && { priority: variables.priority }) }
            : t
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
**The `useUpdateTodo` hook already handles `priority` changes.** You do NOT need to modify `use-todos.ts`. Just call `useUpdateTodo().mutate({ id: todo.id, priority: newPriority })`.

**The `useCreateTodo` hook already handles `priority` in the payload.** The optimistic todo creation already sets `priority: newTodo.priority ?? null`. No changes needed.

**CategoryPickerPopover pattern** (from `frontend/src/components/category-picker-popover.tsx`) -- follow this exactly for PriorityPickerPopover:
- Click-outside dismissal via `document.addEventListener("mousedown")` pattern
- Escape key handling
- Keyboard arrow navigation within dropdown
- `useMemo` for stable options list
- `role="listbox"` / `role="option"` accessibility
- `aria-label` on trigger element

**FAB session memory pattern** (from `frontend/src/components/fab.tsx`):
```typescript
const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
```
Follow the same pattern for priority: `const [selectedPriority, setSelectedPriority] = useState<number | null>(null)`. No localStorage -- React state clears on page refresh per UX-DR29.

**Toast pattern**: `toast.error("message", { duration: 4000 })` imported from `"sonner"`.

### Priority Color Token Values

Light mode:
```css
--color-priority-1: #FF3B30;  /* Apple red -- urgent */
--color-priority-2: #FF9500;  /* Apple orange -- high */
--color-priority-3: #FFCC00;  /* Apple yellow -- medium */
--color-priority-4: #0066FF;  /* accent blue -- low */
--color-priority-5: #98989D;  /* muted gray -- minimal */
```

Dark mode:
```css
--color-priority-1: #FF453A;
--color-priority-2: #FF9F0A;
--color-priority-3: #FFD60A;
--color-priority-4: #4D9FFF;
--color-priority-5: #636366;
```

### Priority Labels and UX

| Priority | Short Label | Full Label | Border Color |
|----------|-------------|------------|--------------|
| 1 | P1 | P1 Urgent | `--color-priority-1` (red) |
| 2 | P2 | P2 High | `--color-priority-2` (orange) |
| 3 | P3 | P3 Medium | `--color-priority-3` (yellow) |
| 4 | P4 | P4 Low | `--color-priority-4` (blue) |
| 5 | P5 | P5 Minimal | `--color-priority-5` (gray) |
| null | None | None | No left border |

In the FAB and inline popover, show a small colored dot (8px circle) before each label for quick visual identification.

### PriorityIndicator Integration with TodoItem

The PriorityIndicator manifests as a left border on the todo item container. Two implementation approaches:

**Approach A (recommended): Inline style on the todo item's outer div.**
```tsx
<div
  role="listitem"
  data-state={visualState}
  style={{
    borderLeft: todo.priority
      ? `3px solid var(--color-priority-${todo.priority})`
      : undefined,
    transition: 'border-color 150ms ease-out',
  }}
  className={cn("group flex flex-col", ...)}
>
```
Then place a clickable priority trigger area (invisible button or the border area) that opens the PriorityPickerPopover.

**Approach B: Wrapper component.**
Create a `PriorityIndicator` wrapper that renders around or beside the todo content. This is cleaner for separation of concerns but adds an extra DOM node.

Choose whichever approach keeps `todo-item.tsx` cleanest. The key requirements are:
- 3px solid left border in the priority color
- Smooth 150ms transition on color change
- Clickable to open the priority picker popover
- No border when `todo.priority === null`
- Border visible on both active and completed todos
- Accessible: `aria-label` announcing the current priority level

### FAB Extension Design

The FAB panel currently has a category dropdown. After this story, it should have BOTH category and priority selectors in the optional row:

```
[ label: "New todo" ]
[ text input | submit button ]
[ Category: v None ] [ Priority: v None ]   <-- extended selectors row
[ validation error ]
```

On mobile (< 400px), both selectors stack vertically:
```
[ Category: v None ]
[ Priority: v None ]
```

The priority dropdown can use the same native `<select>` approach as the category dropdown. Each `<option>` shows the label text (P1 Urgent, P2 High, etc.). Since native `<select>` cannot show colored dots, the colored dot preview can be shown as a small indicator next to the label outside the `<select>`, or accepted as text-only in the dropdown for simplicity. Alternatively, a custom dropdown similar to `CategoryPickerPopover` can be used if richer formatting is desired -- but keep it simple for the FAB (native `<select>` is fine; the inline edit popover will have the richer formatting).

### Files to Create

- `frontend/src/components/priority-indicator.tsx` -- Clickable priority left-border indicator component
- `frontend/src/components/priority-picker-popover.tsx` -- Reusable inline priority dropdown popover (same pattern as CategoryPickerPopover)

### Files to Modify

- `frontend/src/index.css` -- Add priority color tokens (`:root` and `.dark` blocks), register in `@theme inline`
- `frontend/src/components/todo-item.tsx` -- Add priority left-border styling, integrate PriorityIndicator click target for inline edit
- `frontend/src/components/fab.tsx` -- Add priority dropdown selector in the optional selectors row alongside category
- `frontend/src/lib/utils.ts` -- Add priority label/color mapping constants and helper function (or create separate `priority-helpers.ts`)

### Files to Verify (no changes expected)

- `frontend/src/hooks/use-todos.ts` -- Already handles `priority` in `useUpdateTodo` and `useCreateTodo`
- `frontend/src/types/index.ts` -- `Todo.priority`, `CreateTodoRequest.priority`, `UpdateTodoRequest.priority` already defined
- `frontend/src/lib/api.ts` -- snake/camel transform handles `priority` automatically (it's the same name in both cases)
- `backend/` -- No backend changes. The `PATCH /api/todos/{id}` and `POST /api/todos` endpoints already accept priority.
- `frontend/src/components/completed-section.tsx` -- Unchanged. Completed items with priority should still show the left border.
- `frontend/src/components/category-section-header.tsx` -- Unchanged. Priority is orthogonal to category grouping.
- `frontend/src/components/category-management-panel.tsx` -- Unchanged.
- `frontend/src/components/category-picker-popover.tsx` -- Unchanged, but use as the reference pattern for PriorityPickerPopover.

### What NOT to Do

- Do NOT add DeadlineLabel or overdue treatment -- that is Story 6.2
- Do NOT add date picker to the FAB -- that is Story 6.2
- Do NOT add ViewSwitcher or view switching -- that is Epic 7
- Do NOT add DeadlineGroupHeader -- that is Epic 7
- Do NOT modify the backend API -- it is complete from Story 5.1
- Do NOT modify `use-todos.ts` -- the hook already supports priority changes
- Do NOT modify `types/index.ts` -- the types already include priority fields
- Do NOT install JS animation libraries (framer-motion, react-spring, etc.)
- Do NOT use `any` type in TypeScript
- Do NOT store JWT in localStorage or React state
- Do NOT use `useEffect` + `useState` for data fetching -- use TanStack Query
- Do NOT create a `tailwind.config.ts` file
- Do NOT hardcode color values in component files -- use CSS custom properties
- Do NOT create response wrappers -- return data directly from hooks
- Do NOT create dedicated API endpoints for views -- all filtering is client-side
- Do NOT store FAB last-used priority in localStorage -- use React state (clears on page refresh per UX-DR29)
- Do NOT break existing tests -- all backend tests and frontend tests must continue to pass
- Do NOT modify existing hook files unless absolutely necessary

### Previous Story Intelligence (Story 5.3)

Key learnings from the most recent story (5.3):
1. The category dropdown in the FAB uses a native `<select>` styled with Tailwind. The priority dropdown should follow the same approach for consistency.
2. Session memory for selectors uses React `useState` (not localStorage). The category selector uses `selectedCategoryId` state that clears on page refresh. Follow the same pattern for `selectedPriority`.
3. A `validSelectedCategoryId` guard resets to null when the selected category no longer exists. Priority values (1-5) are static, so no equivalent guard is needed -- but validate that the priority is within 1-5 range.
4. The `CategoryPickerPopover` component in `category-picker-popover.tsx` provides the exact pattern for the `PriorityPickerPopover`: click-outside via mousedown, Escape handling, keyboard arrow navigation, `useMemo` for options, `role="listbox"`.
5. ESLint `react-hooks/refs` rule is strict. Do not read refs during render. Use `requestAnimationFrame` for deferred focus.
6. ESLint `react-hooks/set-state-in-effect` rule: avoid setting state in useEffect based on prop changes -- derive state inline instead.
7. Pre-existing lint errors in `login.tsx` (2x refs-during-render) and `login.test.tsx` (type mismatches) are out of scope.
8. `pnpm typecheck`, `pnpm lint`, and `pnpm build` all pass with 0 errors. Maintain this standard.
9. The `cn()` utility from `@/lib/utils` is used for conditional class names.
10. `motionDuration` from `@/lib/motion` wraps durations with `prefers-reduced-motion` respect.

### Git Intelligence

Recent commits:
- `4421ba5` feat: story 5.3, category assignment, display and All view sections
  - Created: `category-section-header.tsx`, `category-chip.tsx`, `category-picker-popover.tsx`
  - Modified: `fab.tsx` (category dropdown), `home.tsx` (category-grouped All view)
- `bbc19c0` feat: story 5.2, category management panel with optimistic mutations
  - Created: `use-categories.ts`, `category-management-panel.tsx`
  - Modified: `home.tsx` (gear icon), `index.css` (slide-in/out animations)
- `d9e0541` feat: story 5.1, category CRUD API and todo metadata expansion
  - Created: `category.py` model, `categories.py` router, migration, `test_categories.py`
  - Modified: `todo.py` model (new fields including priority), `todos.py` router, types, hooks

Pattern: comprehensive single commit per story, descriptive message with `feat:` prefix.

### Cross-Story Dependencies

- **Story 5.1 (done):** Expanded the Todo model with `priority` field (integer 1-5 nullable), updated `PATCH /api/todos/{id}` to accept priority, updated frontend types and hooks.
- **Story 5.3 (done):** Extended the FAB with a category selector row. This story extends that same row with a priority selector.
- **Story 6.2 (next):** Will add DeadlineLabel, overdue treatment, and the date picker to the FAB. Will coexist with priority indicator on todo items.
- **Epic 7 (future):** Will use priority data for sorting in "Due This Week" and "By Deadline" views. The PriorityIndicator created here will be visible in all views.

### Project Structure Notes

- New files go in existing directories: `frontend/src/components/`
- Priority helper utilities go in `frontend/src/lib/utils.ts` or a new `frontend/src/lib/priority-helpers.ts`
- No new directories needed
- Follow kebab-case file naming: `priority-indicator.tsx`, `priority-picker-popover.tsx`
- Follow PascalCase component naming: `PriorityIndicator`, `PriorityPickerPopover`
- Follow camelCase function/variable naming
- Co-locate test files next to source files if adding tests (optional for this story)

### References

- [Source: epics.md#Story 6.1 -- acceptance criteria, FR40, FR41, FR42, FR46, FR17, UX-DR24, UX-DR25, UX-DR29, UX-DR30]
- [Source: architecture.md#Frontend Architecture -- TanStack Query hooks, optimistic mutation pattern, query keys]
- [Source: architecture.md#API & Communication Patterns -- todo PATCH endpoint accepts priority, no dedicated view endpoints]
- [Source: architecture.md#Implementation Patterns -- naming conventions, anti-patterns, localStorage concerns]
- [Source: architecture.md#Project Structure -- frontend organization, file locations, components/priority-indicator.tsx]
- [Source: ux-design-specification.md#Priority System -- 3px left border, 5-level colors, clickable for inline edit, priority picker UI]
- [Source: ux-design-specification.md#Priority colour tokens -- light and dark mode values for P1-P5]
- [Source: ux-design-specification.md#FAB Creation Panel (Extended) -- priority dropdown with colored dot preview, session memory]
- [Source: ux-design-specification.md#Inline Edit -- click trigger, compact popover, optimistic update, Escape/click-outside dismisses]
- [Source: ux-design-specification.md#Feedback Patterns -- priority changed: left border color transitions 150ms]
- [Source: ux-design-specification.md#Accessibility -- aria-label on priority indicators, keyboard nav in dropdowns]
- [Source: prd.md#FR40 -- set priority level (1-5) on a todo at creation or afterward]
- [Source: prd.md#FR41 -- change or remove a todo's priority level]
- [Source: prd.md#FR42 -- priority is optional, todos without are valid]
- [Source: prd.md#FR46 -- todos display priority visually when set]
- [Source: frontend/src/hooks/use-todos.ts -- useUpdateTodo supports priority changes, useCreateTodo supports priority in payload]
- [Source: frontend/src/types/index.ts -- Todo.priority, CreateTodoRequest.priority, UpdateTodoRequest.priority]
- [Source: frontend/src/components/fab.tsx -- current FAB structure with category dropdown, session memory pattern]
- [Source: frontend/src/components/category-picker-popover.tsx -- exact reference pattern for PriorityPickerPopover]
- [Source: frontend/src/components/todo-item.tsx -- current TodoItem structure, visual state machine, animation choreography]
- [Source: frontend/src/index.css -- current CSS custom properties, animation keyframes, utility classes, @theme inline block]
- [Source: frontend/src/lib/utils.ts -- cn() helper]
- [Source: frontend/src/lib/motion.ts -- motionDuration helper for reduced motion]
- [Source: _bmad-output/implementation-artifacts/5-3-category-assignment-display-and-all-view-sections.md -- previous story learnings, ESLint patterns, FAB extension approach]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript typecheck (`pnpm typecheck`): 0 errors
- ESLint (`pnpm lint`): 0 new errors; 2 pre-existing errors in login.tsx (out of scope, documented in Dev Notes)
- Vite build (`npx vite build`): successful, 0 errors
- Backend tests: not runnable outside Docker; no backend changes made

### Completion Notes List

- Added 5 priority color CSS custom properties (light + dark mode) to `index.css` `:root` and `.dark` blocks, plus registered them in `@theme inline` for Tailwind v4 access
- Created `PriorityPickerPopover` component following the exact same pattern as `CategoryPickerPopover`: mousedown click-outside, Escape dismiss, keyboard arrow navigation, `useMemo` options, `role="listbox"`/`role="option"` accessibility, colored dot indicators
- Created `PriorityIndicator` component: clickable dot that opens the popover for inline priority editing
- Integrated priority into `TodoItem`: 3px solid left border with 150ms CSS transition, PriorityIndicator between checkbox and description
- Extended FAB with priority `<select>` dropdown alongside category dropdown, with session memory via React `useState`, colored dot preview, and mobile vertical stacking
- Added `PRIORITY_LEVELS` constant, `getPriorityColor()`, and `getPriorityLabel()` helper utilities to `utils.ts`
- No hooks modified: `useUpdateTodo` and `useCreateTodo` already handle priority
- No types modified: `Todo.priority`, `CreateTodoRequest.priority`, `UpdateTodoRequest.priority` already defined
- No backend changes: `PATCH /api/todos/{id}` and `POST /api/todos` already accept priority

### Change Log

- 2026-04-16: Story 6.1 implemented -- priority color tokens, PriorityIndicator, PriorityPickerPopover, FAB priority dropdown, priority helper utilities

### File List

**Created:**
- `frontend/src/components/priority-indicator.tsx` -- Clickable priority dot + popover trigger
- `frontend/src/components/priority-picker-popover.tsx` -- Inline priority dropdown with colored dots, keyboard nav, accessibility

**Modified:**
- `frontend/src/index.css` -- Priority color tokens in `:root`, `.dark`, and `@theme inline` blocks
- `frontend/src/components/todo-item.tsx` -- 3px left border styling + PriorityIndicator integration
- `frontend/src/components/fab.tsx` -- Priority `<select>` dropdown in selectors row with session memory
- `frontend/src/lib/utils.ts` -- `PRIORITY_LEVELS`, `getPriorityColor()`, `getPriorityLabel()` helpers
