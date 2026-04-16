# Story 6.2: Deadline System -- Label, Overdue Treatment & Inline Edit

Status: review

## Story

As an authenticated user,
I want to set deadlines on my todos, see smart date labels, and have overdue items visually flagged,
so that I can track time-sensitive work and never miss a due date.

## Acceptance Criteria

1. **Given** the design token system (`src/index.css`) **When** overdue tokens are implemented **Then** CSS custom properties define `--color-overdue-text` (#FF3B30 / #FF453A) and `--color-overdue-bg` (#FF3B300D / #FF453A0D, 5% opacity) for both light and dark modes (UX-DR27)

2. **Given** a todo item with a deadline set **When** it renders **Then** a DeadlineLabel displays right-aligned within the todo item at caption size (12px, `--color-text-muted`), with smart formatting: "Today" (slightly bold), "Tomorrow", day name for this week (e.g. "Thursday"), short date for beyond (e.g. "Apr 23"), or "Overdue . Apr 10" in red for past deadlines (UX-DR26, FR46)

3. **Given** a todo with a deadline in the past (overdue) **When** it renders **Then** the deadline label uses `--color-overdue-text` (red), the todo item background is tinted with `--color-overdue-bg` (5% opacity red), and the priority left-border indicator remains unchanged -- overdue and priority are independent visual signals (UX-DR27, FR47)

4. **Given** the FAB creation panel is expanded **When** it renders **Then** a date picker selector appears in the optional selectors row; selection is optional -- submitting without a deadline creates a todo with no deadline (UX-DR29, FR38, FR42)

5. **Given** the user selects a date in the FAB date picker **When** quick-select options are displayed above the calendar **Then** "Today", "Tomorrow", "Next Week", and "Clear" options are available for fast selection (UX-DR26)

6. **Given** a todo item's deadline label **When** the user clicks it **Then** a compact popover opens anchored to the label with the same date picker as the FAB panel; selecting a new date applies optimistically; Escape or click-outside dismisses without change (UX-DR30, FR39)

7. **Given** a todo with a deadline set **When** the user selects "Clear" in the inline date picker or removes the deadline **Then** the deadline is removed optimistically, the label disappears, and any overdue treatment is cleared (FR39, FR42)

8. **Given** any deadline change (set, change, or remove) **When** the mutation fires **Then** the three-step optimistic pattern applies: onMutate (snapshot + optimistic cache write), onError (rollback + toast), onSettled (invalidate `["todos"]`) (FR17 expanded)

9. **Given** a todo without a deadline **When** it renders **Then** no deadline label is shown -- the todo is a first-class citizen without metadata (FR42)

## Tasks / Subtasks

- [x] Task 1: Add overdue color tokens to design system (AC: #1)
  - [x] 1.1 Add `--color-overdue-text` and `--color-overdue-bg` CSS custom properties to `:root` in `src/index.css`
  - [x] 1.2 Add dark mode overrides for both overdue tokens in `.dark` block
  - [x] 1.3 Register the overdue color variables in the `@theme inline` block so Tailwind can reference them

- [x] Task 2: Create deadline formatting helper utilities (AC: #2, #3)
  - [x] 2.1 Add deadline helpers to `frontend/src/lib/utils.ts` (or a new `deadline-helpers.ts` if cleaner)
  - [x] 2.2 Export `formatDeadline(deadline: string | null): { text: string; isOverdue: boolean; isBold: boolean } | null` -- returns null when deadline is null
  - [x] 2.3 Formatting logic: compare deadline date (midnight local time) to today's date:
    - Past: `{ text: "Overdue . <short date>", isOverdue: true, isBold: false }`
    - Today: `{ text: "Today", isOverdue: false, isBold: true }`
    - Tomorrow: `{ text: "Tomorrow", isOverdue: false, isBold: false }`
    - This week (2-6 days out): `{ text: "<day name>", isOverdue: false, isBold: false }`
    - Beyond: `{ text: "<short date>", isOverdue: false, isBold: false }` (e.g. "Apr 23")
  - [x] 2.4 Export `isOverdue(deadline: string | null): boolean` convenience function
  - [x] 2.5 Export `toISODate(date: Date): string` that returns "YYYY-MM-DD" format (for sending to API)

- [x] Task 3: Create DeadlineLabel component (AC: #2, #3, #6, #7, #9)
  - [x] 3.1 Create `frontend/src/components/deadline-label.tsx`
  - [x] 3.2 Render formatted deadline text at caption size (12px), right-aligned, `--color-text-muted` by default
  - [x] 3.3 When overdue: use `--color-overdue-text` (red) on the label text
  - [x] 3.4 When "Today": apply font-weight 500 (slightly bold) for emphasis
  - [x] 3.5 Make the label clickable -- clicking opens a DeadlineDatePickerPopover for inline editing
  - [x] 3.6 Return null when `todo.deadline` is null (no label rendered)
  - [x] 3.7 Add `aria-label` (e.g. "Deadline: Today" or "Deadline: Overdue, April 10") for accessibility

- [x] Task 4: Create DeadlineDatePickerPopover component (AC: #5, #6, #7)
  - [x] 4.1 Create `frontend/src/components/deadline-date-picker-popover.tsx`
  - [x] 4.2 Render a compact popover with quick-select buttons at the top: "Today", "Tomorrow", "Next Week", "Clear"
  - [x] 4.3 Below quick-select: a native `<input type="date">` for manual date selection
  - [x] 4.4 On selection (quick-select or date input change): call `useUpdateTodo.mutate({ id: todo.id, deadline: selectedDate })` optimistically (AC #8)
  - [x] 4.5 "Clear" button sends `deadline: null` to remove the deadline
  - [x] 4.6 Dismiss on Escape or click-outside without change
  - [x] 4.7 Follow the exact same pattern as `PriorityPickerPopover`: click-outside via mousedown, Escape handling, `requestAnimationFrame` focus on mount
  - [x] 4.8 Accessible: `aria-label` on trigger, keyboard navigation (Tab between quick-select buttons and date input, Enter to confirm, Escape to dismiss)

- [x] Task 5: Integrate DeadlineLabel and overdue treatment into TodoItem (AC: #2, #3, #9)
  - [x] 5.1 Modify `frontend/src/components/todo-item.tsx` to render DeadlineLabel after the description text, before the delete button
  - [x] 5.2 Position DeadlineLabel with `ml-auto` to push it right-aligned
  - [x] 5.3 When todo is overdue: add `--color-overdue-bg` background tint to the todo item's outer container
  - [x] 5.4 The priority left border must remain unchanged -- overdue and priority are independent signals
  - [x] 5.5 Completed todos with deadlines still show the DeadlineLabel (but overdue background tint should NOT apply to completed items -- they are done)
  - [x] 5.6 Handle the layout: description should flex-shrink, DeadlineLabel should not wrap

- [x] Task 6: Extend FAB with date picker selector (AC: #4, #5)
  - [x] 6.1 Modify `frontend/src/components/fab.tsx` to add a date picker in the optional selectors row (alongside category and priority)
  - [x] 6.2 Add `selectedDeadline` React state for session memory (same pattern as `selectedCategoryId` and `selectedPriority`)
  - [x] 6.3 Use a native `<input type="date">` for the date selector (simple, accessible, consistent with existing native `<select>` approach for category/priority)
  - [x] 6.4 Add quick-select buttons above/beside the date input: "Today", "Tomorrow", "Next Week", "Clear"
  - [x] 6.5 Pass selected deadline to `createTodo.mutate()` payload as ISO date string ("YYYY-MM-DD")
  - [x] 6.6 On mobile (< 400px viewport), date selector stacks vertically alongside category and priority selectors
  - [x] 6.7 Enter still submits the form; deadline selection is optional

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** There is NO `tailwind.config.ts`. All theme customization goes through CSS custom properties in `src/index.css`. Do NOT create a `tailwind.config.ts` file.
- **No JS animation libraries.** All animation is CSS transitions + keyframes + JS class toggling. Follow existing patterns.
- **File naming: kebab-case for frontend.** Component naming: PascalCase.
- **No `any` type in TypeScript.** Use explicit types or `unknown` with type guards.
- **API boundary:** API always returns snake_case JSON. Frontend `api.ts` transforms to camelCase automatically. Todo's `deadline` field is already `string | null` (ISO date string "YYYY-MM-DD") in the `Todo` type -- no additional type changes needed.
- **Error contract:** All errors return `{ "detail": "message", "code": "CODE" }`. Use `ApiClientError` from `lib/api.ts` for error checks.
- **Per-user isolation:** Backend handles this. Frontend simply calls the API endpoints.
- **TanStack Query keys:** `["todos"]` for todos. Deadline mutations use the existing `useUpdateTodo` hook.
- **No new API endpoints.** The `PATCH /api/todos/{id}` endpoint already accepts `{ deadline: string | null }`. The `POST /api/todos` endpoint already accepts `{ deadline: string | null }` as an optional field. No backend changes needed for this story.
- **No new types.** The `Todo` type already has `deadline: string | null`. `CreateTodoRequest` already has `deadline?: string | null`. `UpdateTodoRequest` already has `deadline?: string | null`.
- **Date handling:** The API sends/receives deadline as an ISO date string `"YYYY-MM-DD"`. The frontend should parse this for display formatting but always send it back in the same format. Use `new Date(deadline + "T00:00:00")` to avoid timezone shifts when parsing, or compare date strings directly.

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
            ? {
                ...t,
                ...(variables.deadline !== undefined && { deadline: variables.deadline }),
              }
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
**The `useUpdateTodo` hook already handles `deadline` changes.** You do NOT need to modify `use-todos.ts`. Just call `useUpdateTodo().mutate({ id: todo.id, deadline: newDeadline })`.

**The `useCreateTodo` hook already handles `deadline` in the payload.** The optimistic todo creation already sets `deadline: newTodo.deadline ?? null`. No changes needed.

**PriorityPickerPopover pattern** (from `frontend/src/components/priority-picker-popover.tsx`) -- follow this for DeadlineDatePickerPopover:
- Click-outside dismissal via `document.addEventListener("mousedown")` pattern
- Escape key handling via `onKeyDown` on the container
- `requestAnimationFrame` for deferred focus on mount
- `role="dialog"` or `role="listbox"` for accessibility
- `aria-label` on the container

**PriorityIndicator pattern** (from `frontend/src/components/priority-indicator.tsx`) -- follow this for DeadlineLabel click-to-edit:
- `closedByMouseDownRef` guard to prevent click-outside race condition (mousedown closes popover, then onClick on trigger would re-open)
- `useState(false)` for `isOpen`
- `useCallback` for `handleClose`
- Conditional rendering of the popover when `isOpen === true`

**FAB session memory pattern** (from `frontend/src/components/fab.tsx`):
```typescript
const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
const [selectedPriority, setSelectedPriority] = useState<number | null>(null)
```
Follow the same pattern for deadline: `const [selectedDeadline, setSelectedDeadline] = useState<string | null>(null)`. No localStorage -- React state clears on page refresh per UX-DR29.

**Toast pattern**: `toast.error("message", { duration: 4000 })` imported from `"sonner"`.

### Overdue Color Token Values

Light mode:
```css
--color-overdue-text: #FF3B30;  /* Same as priority-1 red, used on deadline label */
--color-overdue-bg: #FF3B300D;  /* 5% opacity tint on todo item background */
```

Dark mode:
```css
--color-overdue-text: #FF453A;
--color-overdue-bg: #FF453A0D;
```

### Deadline Label Smart Formatting

| Deadline State | Label Text | Color | Bold |
|---|---|---|---|
| Today | "Today" | `--color-text` (standard) | Yes (font-weight 500) |
| Tomorrow | "Tomorrow" | `--color-text-muted` | No |
| This week (2-6 days out) | Day name (e.g. "Thursday") | `--color-text-muted` | No |
| Beyond this week | Short date (e.g. "Apr 23") | `--color-text-muted` | No |
| Overdue (past) | "Overdue . Apr 10" | `--color-overdue-text` (red) | No |
| No deadline | No label rendered | N/A | N/A |

The dot separator in "Overdue . Apr 10" uses a middle dot character (U+00B7: `\u00B7`) for clean typography.

### Date Comparison Strategy

**CRITICAL:** Date comparisons must use local calendar dates, not UTC timestamps. The `deadline` field from the API is a plain date string "YYYY-MM-DD" without time or timezone.

```typescript
// Safe parsing: avoid timezone offset issues
function parseDeadlineDate(deadline: string): Date {
  // "2026-04-20" -> local midnight on April 20
  const [year, month, day] = deadline.split("-").map(Number)
  return new Date(year, month - 1, day)
}

// Get today's date at local midnight for comparison
function getToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// Difference in calendar days
function daysDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}
```

Do NOT use `new Date("2026-04-20")` directly -- in some browsers this parses as UTC midnight which can shift the date back by one day depending on timezone.

### Overdue Treatment on TodoItem

The overdue background tint is applied to the todo item's outer container `<div>`:

```tsx
const overdueActive = !todo.isCompleted && isOverdue(todo.deadline)

<div
  role="listitem"
  data-state={visualState}
  style={{
    borderLeft: `3px solid ${priorityColor ?? "transparent"}`,
    transition: "border-color 150ms ease-out",
    backgroundColor: overdueActive ? "var(--color-overdue-bg)" : undefined,
  }}
  className={cn(
    "group flex flex-col",
    isAnimatingDelete && "animate-collapse-out"
  )}
>
```

Key points:
- Overdue background only applies to **active** (non-completed) todos
- The priority left border remains unchanged (independent signals per UX-DR27)
- Use inline style for `backgroundColor` to leverage CSS custom properties directly
- The `transition` property already exists on this element for `border-color`; add `background-color` to the transition shorthand

### DeadlineLabel Layout in TodoItem

The DeadlineLabel should be positioned between the todo description and the delete button:

```
[checkbox] [priority dot] [description text ...] [deadline label] [delete X]
```

The description text should `flex-1` to fill available space, and the DeadlineLabel uses `shrink-0 ml-auto` to stay right-aligned without wrapping. The delete button already uses `ml-auto`, so the layout needs adjustment: description gets `flex-1 min-w-0` (allows text truncation), DeadlineLabel gets `shrink-0`, and the delete button keeps its existing styling but drops `ml-auto`.

### FAB Date Picker Design

The FAB panel currently has category and priority dropdowns. After this story, it should have all three selectors:

```
[ label: "New todo" ]
[ text input | submit button ]
[ Category: v None ] [ Priority: v None ] [ Date: input ]  <-- extended selectors row
[ validation error ]
```

The date picker uses a native `<input type="date">` for maximum simplicity and accessibility. Quick-select buttons ("Today", "Tomorrow", "Next Week", "Clear") appear as small text buttons above or beside the date input.

On mobile (< 400px), all three selectors stack vertically:
```
[ Category: v None ]
[ Priority: v None ]
[ Date: input + quick-select ]
```

### DeadlineDatePickerPopover Design

For the inline edit popover, use a simple layout:

```
+----------------------------------+
| [Today] [Tomorrow] [Next Week]   |
| [Clear]                          |
| +--------------------------+     |
| | native date input        |     |
| +--------------------------+     |
+----------------------------------+
```

The popover follows the same absolute positioning pattern as `PriorityPickerPopover`:
- `absolute z-50 mt-1` positioned relative to the parent DeadlineLabel
- `rounded-md border border-border bg-background shadow-elevated`
- `animate-fade-in` for entrance animation

Quick-select buttons use the ghost button style (`text-sm text-muted-foreground hover:text-foreground`).

### Files to Create

- `frontend/src/components/deadline-label.tsx` -- Smart-formatted deadline display with click-to-edit
- `frontend/src/components/deadline-date-picker-popover.tsx` -- Inline date picker popover with quick-select options

### Files to Modify

- `frontend/src/index.css` -- Add overdue color tokens (`:root` and `.dark` blocks), register in `@theme inline`
- `frontend/src/components/todo-item.tsx` -- Integrate DeadlineLabel, add overdue background tint
- `frontend/src/components/fab.tsx` -- Add date picker selector in the optional selectors row alongside category and priority
- `frontend/src/lib/utils.ts` -- Add deadline formatting helpers (`formatDeadline`, `isOverdue`, `toISODate`)

### Files to Verify (no changes expected)

- `frontend/src/hooks/use-todos.ts` -- Already handles `deadline` in `useUpdateTodo` and `useCreateTodo`
- `frontend/src/types/index.ts` -- `Todo.deadline`, `CreateTodoRequest.deadline`, `UpdateTodoRequest.deadline` already defined
- `frontend/src/lib/api.ts` -- snake/camel transform handles `deadline` automatically (same name in both cases)
- `backend/` -- No backend changes. The `PATCH /api/todos/{id}` and `POST /api/todos` endpoints already accept deadline.
- `frontend/src/components/completed-section.tsx` -- Unchanged. Completed items with deadlines should still show the label (but no overdue tint).
- `frontend/src/components/category-section-header.tsx` -- Unchanged. Deadline is orthogonal to category grouping.
- `frontend/src/components/category-management-panel.tsx` -- Unchanged.
- `frontend/src/components/priority-indicator.tsx` -- Unchanged. Priority and deadline are independent visual signals.
- `frontend/src/components/priority-picker-popover.tsx` -- Unchanged, but use as the reference pattern for DeadlineDatePickerPopover.
- `frontend/src/components/category-picker-popover.tsx` -- Unchanged, but use as the reference pattern for DeadlineDatePickerPopover.

### What NOT to Do

- Do NOT add ViewSwitcher or view switching -- that is Epic 7
- Do NOT add DeadlineGroupHeader -- that is Epic 7
- Do NOT add "Due This Week" view filtering -- that is Epic 7
- Do NOT modify the backend API -- it is complete from Story 5.1
- Do NOT modify `use-todos.ts` -- the hook already supports deadline changes
- Do NOT modify `types/index.ts` -- the types already include deadline fields
- Do NOT install JS animation libraries (framer-motion, react-spring, etc.)
- Do NOT install a heavy date picker library (react-datepicker, date-fns-picker, etc.) -- use native `<input type="date">` for the FAB and inline edit
- Do NOT use `any` type in TypeScript
- Do NOT store JWT in localStorage or React state
- Do NOT use `useEffect` + `useState` for data fetching -- use TanStack Query
- Do NOT create a `tailwind.config.ts` file
- Do NOT hardcode color values in component files -- use CSS custom properties
- Do NOT create response wrappers -- return data directly from hooks
- Do NOT create dedicated API endpoints for views -- all filtering is client-side
- Do NOT store FAB last-used deadline in localStorage -- use React state (clears on page refresh per UX-DR29)
- Do NOT break existing tests -- all backend tests and frontend tests must continue to pass
- Do NOT modify existing hook files unless absolutely necessary
- Do NOT use `new Date("YYYY-MM-DD")` for parsing dates -- it creates UTC midnight which causes timezone issues. Parse components manually or use `new Date(year, month - 1, day)`.
- Do NOT apply overdue background tint to completed todos -- they are done, the urgency signal is irrelevant
- Do NOT change the priority left border when a todo is overdue -- priority and overdue are independent visual signals (UX-DR27)

### Previous Story Intelligence (Story 6.1)

Key learnings from the most recent story (6.1 -- Priority System):
1. The priority dropdown in the FAB uses a native `<select>` styled with Tailwind. The date picker should use a native `<input type="date">` for the same reason: simplicity, accessibility, cross-browser support.
2. Session memory for selectors uses React `useState` (not localStorage). Priority uses `selectedPriority` state that clears on page refresh. Follow the same pattern for `selectedDeadline`.
3. The `PriorityPickerPopover` component provides the exact pattern for the `DeadlineDatePickerPopover`: click-outside via mousedown, Escape handling, keyboard navigation, `requestAnimationFrame` focus.
4. The `PriorityIndicator` component provides the exact pattern for `DeadlineLabel` click-to-edit: `closedByMouseDownRef` guard, `isOpen` state, conditional popover rendering.
5. ESLint `react-hooks/refs` rule is strict. Do not read refs during render. Use `requestAnimationFrame` for deferred focus.
6. ESLint `react-hooks/set-state-in-effect` rule: avoid setting state in useEffect based on prop changes -- derive state inline instead.
7. Pre-existing lint errors in `login.tsx` (2x refs-during-render) and `login.test.tsx` (type mismatches) are out of scope.
8. `pnpm typecheck`, `pnpm lint`, and `pnpm build` all pass with 0 errors. Maintain this standard.
9. The `cn()` utility from `@/lib/utils` is used for conditional class names.
10. `motionDuration` from `@/lib/motion` wraps durations with `prefers-reduced-motion` respect.
11. Story 6.1 code review patches (commit `339ae5f`) fixed: (a) always render 3px transparent left border for consistent layout; (b) extract `getPriorityColor` to local const to avoid double call; (c) fix click-outside race condition in PriorityIndicator using `closedByMouseDownRef`. Apply the same race condition fix to the DeadlineLabel component.
12. The TodoItem outer div uses inline `style` for `borderLeft` and `transition`. The overdue background tint should be added to the same inline style object for consistency.

### Git Intelligence

Recent commits:
- `339ae5f` fix: code review patches for story 6.1
  - Modified: `priority-indicator.tsx` (click-outside race fix), `todo-item.tsx` (transparent border), `fab.tsx` (removed redundant class)
- `e11506f` feat: story 6.1, priority system with tokens, indicator and inline edit
  - Created: `priority-indicator.tsx`, `priority-picker-popover.tsx`
  - Modified: `fab.tsx` (priority dropdown), `todo-item.tsx` (left border), `index.css` (tokens), `utils.ts` (helpers)
- `0afb3f4` chore: add epic 5 retrospective and update sprint status

Pattern: comprehensive single commit per story, descriptive message with `feat:` prefix. Code review patches use `fix:` prefix.

### Cross-Story Dependencies

- **Story 5.1 (done):** Expanded the Todo model with `deadline` field (date nullable), updated `PATCH /api/todos/{id}` to accept deadline, updated frontend types and hooks.
- **Story 6.1 (done):** Added priority color tokens, PriorityIndicator, PriorityPickerPopover, FAB priority dropdown. This story coexists with all priority features -- DeadlineLabel appears alongside the priority left border and indicator on each todo item.
- **Epic 7 (future):** Will use deadline data for "Due This Week" filtering and "By Deadline" view grouping. The DeadlineLabel created here will be visible in all views. The `formatDeadline` helper will be reusable for DeadlineGroupHeader in Story 7.2.

### Project Structure Notes

- New files go in existing directories: `frontend/src/components/`
- Deadline helper utilities go in `frontend/src/lib/utils.ts` alongside the existing priority helpers
- No new directories needed
- Follow kebab-case file naming: `deadline-label.tsx`, `deadline-date-picker-popover.tsx`
- Follow PascalCase component naming: `DeadlineLabel`, `DeadlineDatePickerPopover`
- Follow camelCase function/variable naming
- Co-locate test files next to source files if adding tests (optional for this story)

### References

- [Source: epics.md#Story 6.2 -- acceptance criteria, FR38, FR39, FR42, FR46, FR47, FR17, UX-DR26, UX-DR27, UX-DR29, UX-DR30]
- [Source: architecture.md#Frontend Architecture -- TanStack Query hooks, optimistic mutation pattern, query keys]
- [Source: architecture.md#API & Communication Patterns -- todo PATCH endpoint accepts deadline, no dedicated view endpoints]
- [Source: architecture.md#Implementation Patterns -- naming conventions, anti-patterns, localStorage concerns]
- [Source: architecture.md#Project Structure -- frontend organization, file locations, components/deadline-label.tsx]
- [Source: ux-design-specification.md#Deadline System -- inline display, smart formatting, overdue treatment, date picker UI]
- [Source: ux-design-specification.md#Overdue tokens -- light and dark mode values for overdue-text and overdue-bg]
- [Source: ux-design-specification.md#FAB Creation Panel (Extended) -- date picker with quick-select options, session memory]
- [Source: ux-design-specification.md#Inline Edit -- click trigger, compact popover, optimistic update, Escape/click-outside dismisses]
- [Source: ux-design-specification.md#Feedback Patterns -- deadline changed: label text updates inline (instant)]
- [Source: ux-design-specification.md#Accessibility -- aria-label on deadline labels, keyboard nav in popovers]
- [Source: prd.md#FR38 -- set deadline (date) on a todo at creation or afterward]
- [Source: prd.md#FR39 -- change or remove a todo's deadline]
- [Source: prd.md#FR42 -- deadline is optional, todos without are valid]
- [Source: prd.md#FR46 -- todos display deadline visually when set]
- [Source: prd.md#FR47 -- todos with deadlines in the past (overdue) are visually flagged]
- [Source: frontend/src/hooks/use-todos.ts -- useUpdateTodo supports deadline changes, useCreateTodo supports deadline in payload]
- [Source: frontend/src/types/index.ts -- Todo.deadline, CreateTodoRequest.deadline, UpdateTodoRequest.deadline]
- [Source: frontend/src/components/fab.tsx -- current FAB structure with category/priority dropdowns, session memory pattern]
- [Source: frontend/src/components/priority-picker-popover.tsx -- exact reference pattern for DeadlineDatePickerPopover]
- [Source: frontend/src/components/priority-indicator.tsx -- exact reference pattern for DeadlineLabel click-to-edit (closedByMouseDownRef)]
- [Source: frontend/src/components/todo-item.tsx -- current TodoItem structure, visual state machine, inline style for borderLeft]
- [Source: frontend/src/index.css -- current CSS custom properties, animation keyframes, @theme inline block]
- [Source: frontend/src/lib/utils.ts -- cn() helper, PRIORITY_LEVELS, getPriorityColor, getPriorityLabel]
- [Source: frontend/src/lib/motion.ts -- motionDuration helper for reduced motion]
- [Source: _bmad-output/implementation-artifacts/6-1-priority-system-tokens-indicator-and-inline-edit.md -- previous story learnings, ESLint patterns, FAB extension approach, code review patches]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- No issues encountered during implementation.

### Completion Notes List

- Task 1: Added `--color-overdue-text` and `--color-overdue-bg` CSS custom properties to `:root`, `.dark`, and `@theme inline` in `index.css`. Light: #FF3B30 / #FF3B300D, Dark: #FF453A / #FF453A0D.
- Task 2: Added `formatDeadline`, `isOverdue`, and `toISODate` helper functions to `utils.ts`. Safe local-time date parsing avoids UTC timezone shift issues.
- Task 3: Created `DeadlineLabel` component with smart formatting, overdue red styling, "Today" bold emphasis, click-to-edit via popover, and `closedByMouseDownRef` race condition guard (matching PriorityIndicator pattern). Returns null for no deadline.
- Task 4: Created `DeadlineDatePickerPopover` with quick-select buttons (Today, Tomorrow, Next Week, Clear) and native `<input type="date">`. Follows PriorityPickerPopover pattern: mousedown click-outside, Escape, rAF focus. Optimistic updates via `useUpdateTodo`.
- Task 5: Integrated `DeadlineLabel` into `TodoItem` between description and delete button. Added overdue background tint via inline style. Description gets `flex-1 min-w-0`, DeadlineLabel gets `shrink-0`. Overdue tint only on active (non-completed) todos. Priority border unchanged.
- Task 6: Extended FAB with deadline date picker: `selectedDeadline` session state, native `<input type="date">`, quick-select buttons. Deadline passed to `createTodo.mutate()` payload. Mobile stacking via existing `flex-col sm:flex-row` pattern.
- Tests: 18 tests pass (10 new unit tests for `formatDeadline`, `isOverdue`, `toISODate` + 8 existing). 86 backend tests pass. `pnpm typecheck` passes with 0 errors. Pre-existing lint/build errors in `login.tsx`/`login.test.tsx` are out of scope.
- Change: Implemented all 9 acceptance criteria for Story 6.2 (2026-04-16).

### File List

- `frontend/src/index.css` (modified) -- Added overdue color tokens to `:root`, `.dark`, and `@theme inline`
- `frontend/src/lib/utils.ts` (modified) -- Added `formatDeadline`, `isOverdue`, `toISODate` deadline helpers
- `frontend/src/lib/utils.test.ts` (created) -- Unit tests for deadline helper functions
- `frontend/src/components/deadline-label.tsx` (created) -- Smart-formatted deadline display with click-to-edit
- `frontend/src/components/deadline-date-picker-popover.tsx` (created) -- Inline date picker popover with quick-select options
- `frontend/src/components/todo-item.tsx` (modified) -- Integrated DeadlineLabel, added overdue background tint
- `frontend/src/components/fab.tsx` (modified) -- Added date picker selector with quick-select buttons
