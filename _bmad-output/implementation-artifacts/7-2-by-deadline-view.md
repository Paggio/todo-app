# Story 7.2: By Deadline View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an authenticated user,
I want a "By Deadline" view that groups my todos by temporal proximity,
so that I can see a time-based picture of what's coming up and address overdue items first.

## Acceptance Criteria

1. **Given** the user selects the "By Deadline" tab **When** the view renders **Then** all active (non-completed) todos are displayed under `DeadlineGroupHeader` section dividers with the temporal labels, in this fixed order: `Overdue` → `Today` → `Tomorrow` → `This Week` → `Later` → `No Deadline` (UX-DR28, UX-DR33)

2. **Given** a todo with `deadline !== null` **When** the By Deadline view assigns it to a group **Then** the bucket rule is: `Overdue` = deadline < today; `Today` = deadline === today; `Tomorrow` = deadline === today + 1; `This Week` = today + 2 ≤ deadline ≤ today + 6; `Later` = deadline > today + 6; `No Deadline` = deadline === null. Boundary comparison is at **local midnight** (same rule as Story 6.2 / 7.1 — never `new Date("YYYY-MM-DD")`) (UX-DR33)

3. **Given** the "Overdue" group has one or more todos **When** its `DeadlineGroupHeader` renders **Then** the header has a subtle red background tint using `--color-overdue-bg` so overdue urgency is visible at a glance (UX-DR28)

4. **Given** todos within any single temporal group **When** they are sorted **Then** the order is: priority P1 first → P2 → P3 → P4 → P5 → no priority last; ties within the same priority are broken by `deadline` ascending (earliest first); further ties are broken by `createdAt` ascending for stable order. The "No Deadline" group sorts by priority then `createdAt` ascending only (no deadline to sort by) (UX-DR33)

5. **Given** a todo in the By Deadline view **When** it renders **Then** it uses the same `TodoItem` component as the "This Week" view and shows its priority indicator (3px left border), category chip (between description and deadline label, hidden for uncategorized todos), and full `DeadlineLabel` — reusing Story 7.1's `categoryName` prop on `TodoItem` (UX-DR33, FR46)

6. **Given** a temporal group has zero active todos **When** the By Deadline view renders **Then** that group and its header are NOT mounted at all — no empty section, no hidden marker, no count badge of zero. Only non-empty groups appear (UX-DR33)

7. **Given** the user has no active todos at all **When** the By Deadline view renders **Then** the existing `EmptyState` component is shown (same primary empty-state component as the "All" view) — do NOT add a bespoke "No todos" copy here (UX-DR33 + consistency with Epic 3 emptyState)

8. **Given** the By Deadline view **When** completed todos exist **Then** they appear in the existing `CompletedSection` component rendered at the bottom of the view (same mount as in the "All" view), preserving collapse state via the existing localStorage key `completed-section-collapsed` (UX-DR33, parity with All view)

9. **Given** any `DeadlineGroupHeader` **When** it renders **Then** it uses the same visual language as `CategorySectionHeader`: heading-weight label on the left, count badge in the centre (tabular-nums, muted), collapse chevron on the right, 1px bottom border, 44px min touch target. Collapsed state persists per group in localStorage under `deadline-group-collapsed-{key}` (keys: `overdue`, `today`, `tomorrow`, `this-week`, `later`, `no-deadline`) (UX-DR28)

10. **Given** the `DeadlineGroupHeader` expanded state **When** it renders **Then** the container applies `overflow-visible` (per Popover Overflow Pattern, architecture.md → commit `bfa0d62`) so inline priority/deadline popovers opened inside a group are NOT clipped by the collapse animation container. Inline-edit popovers MUST open upward (`bottom-full`) when rendered inside a group

11. **Given** the user selects the "By Deadline" tab **When** the content-area fade-on-switch plays **Then** it reuses the existing keyed-remount `animate-fade-in` pattern from Story 7.1 (`<div key={view} className="animate-fade-in">` in `home.tsx`) — no new animation library, no new keyframes; respects `prefers-reduced-motion` via the existing global override in `index.css`

12. **Given** the By Deadline view **When** filtering + grouping + sorting run **Then** the work completes in under 500ms (NFR14) — implemented as a pure selector (`selectByDeadline`) memoised in `HomePage` via `useMemo` keyed on `todos`, so the switch between views is a client-side cache lens over `["todos"]`. Zero new API requests, zero new API endpoints

13. **Given** toggling a todo's `isCompleted` or changing its `deadline` inline **When** the mutation settles **Then** the item is re-bucketed correctly (e.g. a todo marked complete moves into `CompletedSection`; a deadline changed from today+3 to null moves into `No Deadline`) — relies on `useUpdateTodo`'s existing optimistic pattern and the memoised selector recomputing on cache change

14. **Given** the `DeadlineGroupHeader` collapse animation **When** the group is collapsing or expanding **Then** the height transition uses the same `max-height + opacity` + `var(--duration-normal)` strategy as `CategorySectionHeader`, and the chevron rotates `-rotate-90` while collapsed — visual parity is mandatory

15. **Given** the By Deadline tab is selected AND a screen reader is active **When** the view updates (groups appear/disappear, counts change) **Then** the same `aria-live="polite"` announcer already wired in `HomePage` covers action announcements (toggle/delete); the view itself exposes `role="list"` regions inside each group and the group header is a `<button aria-expanded ...>` — NO new live region needed

## Tasks / Subtasks

- [ ] Task 1: Add a pure, exported `getDeadlineBucket` helper for temporal classification (AC: #2)
  - [ ] 1.1 Add to `frontend/src/lib/utils.ts` next to `formatDeadline` / `isOverdue`. Signature: `export type DeadlineBucket = "overdue" | "today" | "tomorrow" | "this-week" | "later" | "no-deadline"` + `export function getDeadlineBucket(deadline: string | null): DeadlineBucket`
  - [ ] 1.2 Reuse the existing private `parseDeadlineDate`, `getToday`, `daysDiff` helpers — do NOT duplicate them, do NOT re-implement timezone-safe parsing
  - [ ] 1.3 Rules (exact): `null` → `"no-deadline"`; `diff < 0` → `"overdue"`; `diff === 0` → `"today"`; `diff === 1` → `"tomorrow"`; `2 <= diff <= 6` → `"this-week"`; `diff >= 7` → `"later"`
  - [ ] 1.4 Do NOT route through `formatDeadline` — that helper returns display strings. The bucket is a machine value; composing through display logic is the wrong coupling direction. Both helpers share the parse primitives; that is the correct reuse (retro A6 rationale)
  - [ ] 1.5 Add unit tests in `frontend/src/lib/utils.test.ts`: null, today, tomorrow, +2, +6, +7, past (overdue), far future — mirrors the structure of the existing `formatDeadline` tests

- [ ] Task 2: Add `selectByDeadline` pure selector to `use-todos.ts` (AC: #1, #4, #6, #12)
  - [ ] 2.1 Add to `frontend/src/hooks/use-todos.ts` in the "View selectors" section (already created by Story 7.1, line ~22)
  - [ ] 2.2 Signature: `export function selectByDeadline(todos: Todo[]): Array<{ bucket: DeadlineBucket; label: string; todos: Todo[] }>`
  - [ ] 2.3 Filter: only active todos (`isCompleted === false`) — completed go to `CompletedSection`. DO NOT pre-filter by deadline (null goes to `no-deadline`)
  - [ ] 2.4 Bucket each todo via `getDeadlineBucket(todo.deadline)` from `lib/utils.ts`
  - [ ] 2.5 Group into exactly these buckets in this order: `overdue`, `today`, `tomorrow`, `this-week`, `later`, `no-deadline`. Define `DEADLINE_GROUPS` as a module-local `readonly` array of `{ bucket, label }`: `Overdue / Today / Tomorrow / This Week / Later / No Deadline`
  - [ ] 2.6 Within each bucket, sort using the SAME comparator shape as `selectDueThisWeek`: `PRIORITY_SORT_KEY(priority)` asc → `deadline` asc (ISO lex for same format) → `createdAt` asc. For the `no-deadline` bucket the deadline tier is skipped (all nulls)
  - [ ] 2.7 Drop empty buckets from the returned array — do NOT return placeholder entries. The `By Deadline` view renders exactly what it gets, in order
  - [ ] 2.8 Never mutate `todos`; always `[...todos].filter(...).sort(...)` per Story 7.1 constraint
  - [ ] 2.9 Export as a named function for unit testing; consume via `React.useMemo(() => selectByDeadline(todos ?? []), [todos])` in `HomePage`

- [ ] Task 3: Create `DeadlineGroupHeader` component (AC: #3, #9, #10, #14)
  - [ ] 3.1 Create `frontend/src/components/deadline-group-header.tsx`
  - [ ] 3.2 Clone the shape of `CategorySectionHeader` — DO NOT extend or subclass it (avoid premature abstraction; two concrete headers is fine, a shared abstraction can land in a later epic if a third arrives)
  - [ ] 3.3 Props: `{ bucket: DeadlineBucket; label: string; todoCount: number; children: React.ReactNode }`
  - [ ] 3.4 localStorage key: `deadline-group-collapsed-${bucket}` — matches per-category pattern exactly. Try/catch around `getItem` / `setItem` (fail silently) per `CategorySectionHeader`
  - [ ] 3.5 Header button: `role` button (native), `aria-expanded`, `aria-controls="deadline-section-{bucket}"`. 44px min touch target via `py-3 px-2` rules already used. `text-label font-semibold text-foreground` label + `flex-1` spacer + `tabular-nums text-caption text-muted-foreground` count + chevron SVG
  - [ ] 3.6 Overdue tint: when `bucket === "overdue"`, apply a subtle background tint on the header button — use the existing `--color-overdue-bg` CSS variable with low alpha (e.g. `bg-[color:var(--color-overdue-bg)]` or `className={cn(..., bucket === "overdue" && "bg-[color:var(--color-overdue-bg)]")}`). The label text stays foreground — DO NOT use `--color-overdue-text` on the header text (that is for `DeadlineLabel` on individual items). The tint is a background cue only
  - [ ] 3.7 Collapse body: same `transition-[max-height,opacity]` + `var(--duration-normal)` + `hidden={collapsed}` + `{!collapsed && children}` pattern as `CategorySectionHeader`. Expanded state class set MUST include `overflow-visible` so inline popovers (priority/deadline) opened inside a group are NOT clipped
  - [ ] 3.8 Wrap the whole thing in `<section>` + an `id={`deadline-section-${bucket}`}` body for `aria-controls` correctness
  - [ ] 3.9 DO NOT render when `todoCount === 0` — the selector in Task 2 already drops empty buckets, so this is defensive. Belt-and-braces: if `todoCount === 0`, `return null`

- [ ] Task 4: Create `ByDeadlineView` presentation component (AC: #1, #5, #6, #7, #10, #15)
  - [ ] 4.1 Create `frontend/src/components/by-deadline-view.tsx`
  - [ ] 4.2 Props: `{ groups: Array<{ bucket: DeadlineBucket; label: string; todos: Todo[] }>; categories: Category[]; announce?: (message: string) => void }`
  - [ ] 4.3 Build `categoryNameById = new Map<number, string>()` via `React.useMemo(..., [categories])` — same shape as `DueThisWeekView`. Reuse the chip feature on `TodoItem` already added in Story 7.1 (prop name `categoryName`, null-safe)
  - [ ] 4.4 If `groups.length === 0` (i.e. no active todos at all), render `<EmptyState />` from `@/components/empty-state` — NOT a bespoke "Nothing to do" message. AC #7
  - [ ] 4.5 Otherwise, `groups.map((g) => <DeadlineGroupHeader bucket={g.bucket} label={g.label} todoCount={g.todos.length}>...)` with the inner body as a `<div role="list">` of `<TodoItem ... />`. No wrapping `<div role="list">` AROUND the groups — each group is its own `role="list"` region so screen readers announce counts per group
  - [ ] 4.6 Wire `onToggle` and `onDelete` identically to `DueThisWeekView` — instantiate `useUpdateTodo()` / `useDeleteTodo()` once at the top of the component and pass handlers per item. Identical announce copy (`"marked as active"` / `"marked as complete"` / `"deleted"`)
  - [ ] 4.7 Pass `categoryName` to `TodoItem` only when `todo.categoryId !== null`; pass `null` otherwise
  - [ ] 4.8 Do NOT render `CompletedSection` inside `ByDeadlineView` — the completed section is a peer-level concern rendered by `HomePage`, so both "All" and "By Deadline" views share it. Keeps the view pure-active

- [ ] Task 5: Wire `ByDeadlineView` into `HomePage` (AC: #8, #11, #12, #13)
  - [ ] 5.1 Import `ByDeadlineView` and `selectByDeadline` at the top of `frontend/src/pages/home.tsx`
  - [ ] 5.2 Add a memoised selector next to `weekTodos`: `const deadlineGroups = React.useMemo(() => selectByDeadline(todos ?? []), [todos])`
  - [ ] 5.3 Replace the current `view === "deadline"` placeholder-fallback-to-"all" branch with a dedicated `view === "deadline"` branch. Expected shape after change:
        ```tsx
        view === "week" ? (
          <DueThisWeekView ... />
        ) : view === "deadline" ? (
          <>
            {deadlineGroups.length > 0 ? (
              <ByDeadlineView
                groups={deadlineGroups}
                categories={categories ?? []}
                announce={announce}
              />
            ) : (
              <EmptyState />
            )}
            <CompletedSection todos={completedTodos} announce={announce} />
          </>
        ) : (
          /* view === "all" — unchanged */
        )
        ```
  - [ ] 5.4 The "All" view's category-section layout MUST stay byte-identical (no accidental refactor while nearby). Only the `view === "deadline"` branch changes
  - [ ] 5.5 Remove the `TODO Story 7.2` comment from the Story 7.1 `home.tsx` code, if present
  - [ ] 5.6 `FAB`, `CategoryManagementPanel`, `ViewSwitcher` remain mounted outside the view-switch region (view-agnostic — do NOT move)
  - [ ] 5.7 `isEmpty` logic still uses `activeTodos.length === 0` (existing) — the FAB's "empty hint" is about overall emptiness, NOT current-view emptiness (per Story 7.1 Task 6.5 rationale)

- [ ] Task 6: RTL tests — Story 7.2 follows up on Story 7.1's testing foundation (Retro A1 continued)
  - [ ] 6.1 Create `frontend/src/lib/utils.test.ts` additions (separate `describe("getDeadlineBucket")` block next to the existing `formatDeadline` tests). Cases: null → "no-deadline"; today → "today"; today+1 → "tomorrow"; today+2, today+6 → "this-week"; today+7, today+30 → "later"; today-1, today-365 → "overdue". Use the same `toISODate(new Date(today.getTime() + n*DAY))` fixture strategy as the existing tests
  - [ ] 6.2 Create `frontend/src/components/deadline-group-header.test.tsx` — first header-shape component test. Assert: renders label + count; toggling click flips `aria-expanded`; body `hidden` attribute when collapsed; localStorage `deadline-group-collapsed-{bucket}` is written on toggle; overdue bucket applies the tint class; expanded state exposes `overflow-visible` (assert via `className` contains token, not computed style — jsdom doesn't compute CSS vars)
  - [ ] 6.3 Create `frontend/src/components/by-deadline-view.test.tsx`. Assert: empty `groups` → renders the `EmptyState` component (look up by its visible copy, e.g. `screen.getByText(/let's make something happen/i)` — verify against current `EmptyState` text before writing the assertion); multi-bucket input → renders one `DeadlineGroupHeader` per non-empty bucket in the FIXED ORDER; each rendered `TodoItem` receives the category chip prop when `categoryId !== null`. Mock `useUpdateTodo` / `useDeleteTodo` minimally — no network
  - [ ] 6.4 Do NOT add `@testing-library/user-event` — Story 7.1 established the zero-new-deps posture; `fireEvent.click` / `fireEvent.keyDown` are sufficient for these assertions
  - [ ] 6.5 Co-locate tests beside the source file (Story 7.1 convention). All new tests must pass under `pnpm test` at completion. No new jsdom polyfills

- [ ] Task 7: Verify Popover Overflow Pattern compliance (AC: #10) — Retro A5 consumer
  - [ ] 7.1 Open the app at `/?view=deadline` with seed data spanning Overdue + Today + This Week
  - [ ] 7.2 Click the priority indicator on a todo inside the Overdue group. The `PriorityPickerPopover` MUST render fully visible, opening upward (`bottom-full`) if the group body would otherwise clip it
  - [ ] 7.3 Click the deadline label on a todo inside the Today group. The `DeadlineDatePickerPopover` MUST render fully visible
  - [ ] 7.4 Collapse the Overdue group, re-open — popovers must still work when re-expanded
  - [ ] 7.5 If clipping IS observed, the fix is: add `overflow-visible` to the expanded-state classes in `DeadlineGroupHeader` (Task 3.7). DO NOT add `overflow-hidden` anywhere else trying to work around it — architecture.md § Popover Overflow Pattern explicitly calls out that anti-pattern
  - [ ] 7.6 Use Playwright browser automation (per the CLAUDE.md memory directive) for this verification — do NOT rely on "looks fine on my machine"

- [ ] Task 8: Composition Checks (Retro C4) — verify before marking the story done
  - [ ] 8.1 Create todos spanning EVERY bucket: one overdue, one today, one tomorrow, one today+3 (this-week), one today+10 (later), one with null deadline. Switch to By Deadline. All six groups appear in the fixed order. Counts match
  - [ ] 8.2 Delete every overdue todo. The "Overdue" group AND its header disappear (AC #6). Remaining groups still render in their correct positions (no gap, no blank header)
  - [ ] 8.3 Create a new todo with no deadline while "By Deadline" is active. It appears at the bottom of the "No Deadline" group (sorted by createdAt ascending within the group). UI is optimistic and non-jarring
  - [ ] 8.4 Mark a todo in "Today" complete. It disappears from that group and appears in the `CompletedSection` at the bottom of the view (AC #13)
  - [ ] 8.5 Change a todo's deadline inline from today+3 to null. It moves from "This Week" to "No Deadline" after mutation settles (AC #13)
  - [ ] 8.6 Collapse "This Week" and "Overdue" — the Today / Tomorrow / Later / No Deadline groups stay uncollapsed. Reload the page; collapse state persists
  - [ ] 8.7 At 375px viewport, every group header reads cleanly (label, count, chevron) without truncation, wrapping, or overflow
  - [ ] 8.8 Enable OS Reduce Motion. Switch to By Deadline and back to All — fade collapses to ~0ms (honours existing `@media (prefers-reduced-motion: reduce)` override in `index.css`)
  - [ ] 8.9 Deep-link `/?view=deadline` directly. The By Deadline tab is active on mount; groups render correctly (subject to the pre-existing auth deep-link gotcha documented in Story 7.1 Dev Notes; not a 7.2 regression)

- [ ] Task 9: Carried Debt callout (Retro C5) — audit and close
  - [ ] 9.1 Story 7.1 CLOSED: A1 (first RTL component test), A2 (priority helper unit tests), A3 (`login.tsx` lint + `login.test.tsx` types), A4 (negative-ID DELETE guard), A5 (Popover Overflow Pattern convention in architecture.md). All five retired. Confirm by running `pnpm lint` (must exit 0) and visually scanning `_bmad-output/planning-artifacts/architecture.md` for the `### Popover Overflow Pattern` subsection (should exist; added by 7.1)
  - [ ] 9.2 A6 (Retro A6) — "Reuse `formatDeadline` for DeadlineGroupHeader grouping logic" — this story addresses it via a **corrected** interpretation: we add a sibling helper `getDeadlineBucket` that shares the SAME primitives (`parseDeadlineDate`, `getToday`, `daysDiff`) as `formatDeadline` rather than routing through its display-string output. Task 1 does this. Rationale: `formatDeadline` returns `{ text, isOverdue, isBold }` — a display contract — and parsing a bucket out of display text is brittle. Sharing the parse primitives is the actual reuse; the retro's intent is met. Mark A6 closed in Dev Agent Record
  - [ ] 9.3 New deferred items from Story 7.1 code review (see `deferred-work.md` 2026-04-17 entries) — BOTH are acceptable to keep deferred; do NOT pull either into 7.2 without explicit user direction:
    - Optimistic-create/delete race tail (post-A4 residual) — still low frequency; full fix needs create/delete orchestration (abort pending create or chained delete)
    - `selectDueThisWeek` "today" boundary captured inside memo — self-heals on any mutation; no user-visible impact
  - [ ] 9.4 Backend security debt cluster from Epic 1–3 remains deferred per project scope (local-only). DO NOT promote

- [ ] Task 10: Incidental fixes discovered while implementing above (disclose for reviewer)
  - [ ] 10.1 If ANY lint warning, type error, or test failure exists that blocks `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build`, fix it and note it in the Dev Agent Record — same posture as Story 7.1 Task 10
  - [ ] 10.2 Do NOT fix unrelated polish that was not blocking. Scope creep risk

## Dev Notes

### Carried Debt (Retro C5)

| Ref | Action | Status entering 7.2 | Where to apply in 7.2 |
|---|---|---|---|
| A1 | First RTL component test | ✅ CLOSED by 7.1 (`view-switcher.test.tsx`, 12 tests) | Continue the habit — Tasks 6.2, 6.3 add two more component tests |
| A2 | Priority helper unit tests | ✅ CLOSED by 7.1 (`utils.test.ts`) | N/A |
| A3 | `login.tsx` lint + `login.test.tsx` types | ✅ CLOSED by 7.1 | N/A |
| A4 | Optimistic temp-ID DELETE guard | ✅ CLOSED by 7.1 (`id < 0` early return) | Residual create/delete race remains in deferred-work.md — do NOT expand scope |
| A5 | Popover Overflow Pattern convention | ✅ CLOSED by 7.1 (`architecture.md`) | APPLY the pattern in Task 3.7 / Task 7 |
| A6 | Reuse `formatDeadline` for grouping | ⏳ OPEN — for 7.2 specifically | Task 1 adds `getDeadlineBucket` sharing the SAME parse primitives as `formatDeadline` (correct reuse); closed by Task 9.2 |

All Epic 6 retro items are now on track to close in Epic 7.

### Composition Checks (Retro C4) — required before marking story done

Run all of the following BEFORE flipping status to review. Playwright verification is mandatory per the CLAUDE.md memory directive.

1. **All buckets populated and ordered.** Seed one todo in each of overdue/today/tomorrow/+3/+10/null-deadline. Switch to By Deadline. All six groups appear in the fixed order: Overdue → Today → Tomorrow → This Week → Later → No Deadline. Counts correct.
2. **Empty group disappears.** Delete all overdue todos. The "Overdue" header and body vanish immediately (not hidden — unmounted). No layout gap.
3. **Bucket migration on mutation.** Change a todo's deadline inline from today+3 to null. After the mutation settles, the todo MOVES from "This Week" to "No Deadline" and the animation does not double-render.
4. **Completion moves to `CompletedSection`.** Mark a Today todo complete. It disappears from Today and appears in Completed. CompletedSection collapse state survives the view switch.
5. **Popover inside group body is not clipped.** Open the priority popover on a todo in a mid-list group (e.g. Tomorrow). It renders fully visible. Open the deadline popover on an Overdue todo (that header has the red tint — still must not clip the popover).
6. **Collapse persistence.** Collapse "This Week" and "Overdue". Reload. Both remain collapsed. Collapse "All Todos" view's Category sections — verify that `category-collapsed-*` (Story 5.3) and `deadline-group-collapsed-*` (Story 7.2) do NOT collide in localStorage (different key namespaces; sanity check).
7. **Empty state.** Delete every active todo (keep some completed ones). Switch to By Deadline. The `EmptyState` component renders above the CompletedSection. Switch to All — same EmptyState renders (parity verified).
8. **Deep link.** Load `/?view=deadline` directly. Tab is active on mount; groups render. (The auth redirect gotcha from 7.1 may still drop the search param — that's a pre-existing unrelated bug. If the tab ends up on All after a redirect through /login, note it; do NOT fix in 7.2.)
9. **`prefers-reduced-motion`.** Enable OS Reduce Motion. Switch between All and By Deadline. Fade collapses to ~0ms. Group collapse animation respects it too (the existing `--duration-normal` transitions already honor the media query).
10. **Mobile 375px.** Every group header renders cleanly — label, count badge, chevron, red tint on overdue — no wrap, no truncation, no overflow.

### Critical Architecture Constraints

- **Client-side grouping only.** No new API endpoints. All three views are lenses over `["todos"]` cached by TanStack Query. This is a hard architectural rule (architecture.md § Implementation Patterns: *"Implement view filtering (All/This Week/By Deadline) client-side using TanStack Query selectors — never create dedicated API endpoints per view"*).
- **Single `["todos"]` cache key.** DO NOT fragment into `["todos", "by-deadline"]` etc. All three views must consume the SAME cached array so switching views fires zero network requests.
- **URL query param is the source of truth for view state** — `useView()` already handles `?view=all|week|deadline`. DO NOT mirror into React state or localStorage.
- **React Router v7** (`react-router@^7.1.0`) — `useSearchParams` from `react-router` (no `-dom` suffix in v7). Already in place from Story 7.1.
- **Zero new runtime dependencies.** Epic 6 added zero, Story 7.1 added zero. Keep the streak. No `framer-motion`, no `react-datepicker`, no `@radix-ui/react-collapsible`. The existing `animate-fade-in` + `max-height + opacity` transitions are sufficient.
- **Zero new test dependencies.** `@testing-library/react` + `vitest` + `jsdom` already present. Do NOT add `@testing-library/user-event` (Story 7.1 precedent — `fireEvent` is enough for the assertions).
- **Tailwind v4 CSS-first.** NO `tailwind.config.ts`. All theme tokens are CSS custom properties in `src/index.css`. The overdue background tint uses `var(--color-overdue-bg)` which is already defined (Story 6.2).
- **File naming: kebab-case for frontend. PascalCase components. camelCase functions. No `any` type.**
- **Popover Overflow Pattern** (architecture.md, post-Epic 6): inline-edit popovers rendered inside a collapsible parent MUST open upward (`bottom-full`) and the expanded parent MUST use `overflow-visible`. Story 7.2 is the next consumer of this pattern (architecture.md names this story explicitly).
- **Backend: zero changes.** No new endpoints, no query param changes, no schema changes. The backend's `GET /api/todos` already returns `deadline` and `priority` fields (Story 5.1 metadata expansion).
- **`TodoItem`'s `categoryName` prop was added by Story 7.1.** Reuse it — DO NOT re-implement chip rendering inside `ByDeadlineView`.

### Existing Code Patterns to Follow Exactly

**`getDeadlineBucket` — share primitives with `formatDeadline` (Retro A6 correct interpretation):**
```ts
// in frontend/src/lib/utils.ts, next to formatDeadline

export type DeadlineBucket =
  | "overdue"
  | "today"
  | "tomorrow"
  | "this-week"
  | "later"
  | "no-deadline"

export function getDeadlineBucket(deadline: string | null): DeadlineBucket {
  if (deadline === null) return "no-deadline"
  const diff = daysDiff(parseDeadlineDate(deadline), getToday())
  if (diff < 0) return "overdue"
  if (diff === 0) return "today"
  if (diff === 1) return "tomorrow"
  if (diff <= 6) return "this-week"
  return "later"
}
```
Do NOT route through `formatDeadline(deadline)?.text` — that couples two layers (machine classification and display copy) and breaks if the label table ever localises. Sharing `parseDeadlineDate` / `getToday` / `daysDiff` IS the reuse the retro wanted.

**`selectByDeadline` — sibling of `selectDueThisWeek` in `use-todos.ts`:**
```ts
// in frontend/src/hooks/use-todos.ts, next to selectDueThisWeek

import { getDeadlineBucket, type DeadlineBucket } from "@/lib/utils"

type DeadlineGroup = {
  bucket: DeadlineBucket
  label: string
  todos: Todo[]
}

const DEADLINE_GROUPS: readonly { bucket: DeadlineBucket; label: string }[] = [
  { bucket: "overdue", label: "Overdue" },
  { bucket: "today", label: "Today" },
  { bucket: "tomorrow", label: "Tomorrow" },
  { bucket: "this-week", label: "This Week" },
  { bucket: "later", label: "Later" },
  { bucket: "no-deadline", label: "No Deadline" },
] as const

export function selectByDeadline(todos: Todo[]): DeadlineGroup[] {
  const active = todos.filter((t) => !t.isCompleted)

  const byBucket = new Map<DeadlineBucket, Todo[]>()
  for (const g of DEADLINE_GROUPS) byBucket.set(g.bucket, [])
  for (const t of active) byBucket.get(getDeadlineBucket(t.deadline))!.push(t)

  const cmp = (a: Todo, b: Todo) => {
    const pa = PRIORITY_SORT_KEY(a.priority)
    const pb = PRIORITY_SORT_KEY(b.priority)
    if (pa !== pb) return pa - pb
    // Deadline tier (skipped for no-deadline — both are null, localeCompare
    // on "" yields 0 and we fall through to createdAt).
    const da = a.deadline ?? ""
    const db = b.deadline ?? ""
    if (da !== db) return da.localeCompare(db)
    return a.createdAt.localeCompare(b.createdAt)
  }

  return DEADLINE_GROUPS.flatMap((g) => {
    const items = byBucket.get(g.bucket)!
    if (items.length === 0) return []
    return [{ bucket: g.bucket, label: g.label, todos: [...items].sort(cmp) }]
  })
}
```
Why `flatMap` + drop-empty: `map` then `filter` would allocate an intermediate array for every render; `flatMap` with an empty-array gate does it in one pass AND keeps the fixed order. This pattern is acceptable for the expected data size (≤ 1000 todos in local-only scope).

**`DeadlineGroupHeader` — structural clone of `CategorySectionHeader`:**
```tsx
// frontend/src/components/deadline-group-header.tsx

import * as React from "react"
import { cn } from "@/lib/utils"
import type { DeadlineBucket } from "@/lib/utils"

type DeadlineGroupHeaderProps = {
  bucket: DeadlineBucket
  label: string
  todoCount: number
  children: React.ReactNode
}

export function DeadlineGroupHeader({
  bucket,
  label,
  todoCount,
  children,
}: DeadlineGroupHeaderProps) {
  const storageKey = `deadline-group-collapsed-${bucket}`
  const sectionId = `deadline-section-${bucket}`
  const isOverdue = bucket === "overdue"

  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem(storageKey) === "true"
    } catch {
      return false
    }
  })

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(storageKey, String(next)) } catch {}
      return next
    })
  }, [storageKey])

  if (todoCount === 0) return null

  return (
    <section>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-2 py-3 border-b border-border",
          "cursor-pointer select-none hover:bg-accent/30 transition-colors",
          "rounded-t-md px-2",
          isOverdue && "bg-[color:var(--color-overdue-bg)]"
        )}
        aria-expanded={!collapsed}
        aria-controls={sectionId}
      >
        <span className="text-label font-semibold text-foreground">{label}</span>
        <span className="flex-1" />
        <span className="text-caption text-muted-foreground tabular-nums">{todoCount}</span>
        {/* chevron SVG — same as CategorySectionHeader */}
      </button>

      <div
        id={sectionId}
        className={cn(
          "transition-[max-height,opacity]",
          collapsed
            ? "max-h-0 opacity-0 overflow-hidden"
            : "max-h-[9999px] opacity-100 overflow-visible"
        )}
        style={{ transitionDuration: "var(--duration-normal)" }}
        hidden={collapsed}
      >
        {!collapsed && children}
      </div>
    </section>
  )
}
```
**Why `overflow-visible` in the expanded state:** Popover Overflow Pattern (architecture.md). Without it, `PriorityPickerPopover` / `DeadlineDatePickerPopover` opened on a todo inside the group get clipped by the collapse container's clip bounds.

**`ByDeadlineView` — parallel to `DueThisWeekView`:**
```tsx
// frontend/src/components/by-deadline-view.tsx

import * as React from "react"
import { DeadlineGroupHeader } from "@/components/deadline-group-header"
import { EmptyState } from "@/components/empty-state"
import { TodoItem } from "@/components/todo-item"
import { useDeleteTodo, useUpdateTodo } from "@/hooks/use-todos"
import type { DeadlineBucket } from "@/lib/utils"
import type { Category, Todo } from "@/types"

type Group = { bucket: DeadlineBucket; label: string; todos: Todo[] }
type ByDeadlineViewProps = {
  groups: Group[]
  categories: Category[]
  announce?: (message: string) => void
}

export function ByDeadlineView({ groups, categories, announce }: ByDeadlineViewProps) {
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()

  const categoryNameById = React.useMemo(() => {
    const m = new Map<number, string>()
    for (const c of categories) m.set(c.id, c.name)
    return m
  }, [categories])

  if (groups.length === 0) return <EmptyState />

  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <DeadlineGroupHeader
          key={g.bucket}
          bucket={g.bucket}
          label={g.label}
          todoCount={g.todos.length}
        >
          <div role="list">
            {g.todos.map((t) => (
              <TodoItem
                key={t.id}
                todo={t}
                categoryName={
                  t.categoryId !== null
                    ? (categoryNameById.get(t.categoryId) ?? null)
                    : null
                }
                onToggle={() => {
                  announce?.(
                    t.isCompleted
                      ? `${t.description} marked as active`
                      : `${t.description} marked as complete`
                  )
                  updateTodo.mutate({ id: t.id, isCompleted: !t.isCompleted })
                }}
                onDelete={() => {
                  announce?.(`${t.description} deleted`)
                  deleteTodo.mutate({ id: t.id })
                }}
              />
            ))}
          </div>
        </DeadlineGroupHeader>
      ))}
    </div>
  )
}
```

**Wiring into `HomePage` (replace the placeholder branch from Story 7.1):**
```tsx
// frontend/src/pages/home.tsx — inside the content region rendered body
view === "week" ? (
  <DueThisWeekView ... />
) : view === "deadline" ? (
  <>
    {deadlineGroups.length > 0 ? (
      <ByDeadlineView
        groups={deadlineGroups}
        categories={categories ?? []}
        announce={announce}
      />
    ) : (
      <EmptyState />
    )}
    <CompletedSection todos={completedTodos} announce={announce} />
  </>
) : (
  /* view === "all" — existing branch, NO CHANGES */
)
```
The `deadlineGroups` memo sits next to `weekTodos`:
```tsx
const deadlineGroups = React.useMemo(() => selectByDeadline(todos ?? []), [todos])
```

### Bucketing Semantics (precise)

| deadline | bucket | notes |
|---|---|---|
| `null` | `no-deadline` | Rendered last, labelled "No Deadline" |
| `< today` (local midnight) | `overdue` | Header gets red-tint background |
| `=== today` | `today` | Sort within by priority, createdAt |
| `=== today + 1` | `tomorrow` | |
| `today + 2` .. `today + 6` | `this-week` | The same window as the "This Week" view, but *excluding today and tomorrow* which get their own buckets |
| `>= today + 7` | `later` | |

**Local midnight comparison — absolute rule.** NEVER `new Date("YYYY-MM-DD")` — that creates UTC midnight and can shift the date back by one day in negative-offset timezones. Use `parseDeadlineDate` from `lib/utils.ts` (already private; reused via `getDeadlineBucket`).

**Relationship to Story 7.1's "This Week" view:** that view filters `today ≤ deadline ≤ today+6` in a single flat list. The By Deadline view's `this-week` bucket is a strict subset (`today+2 ≤ deadline ≤ today+6`) because Today and Tomorrow get their own buckets. A user cross-checking "This Week" view against By Deadline should see items spread across Today + Tomorrow + This Week buckets, with the same totals (excluding overdue, which the This Week view deliberately excludes per 7.1 UX-DR32).

### Sort Comparator (precise)

Inside every bucket:

| Tier | Rule |
|---|---|
| 1 | `PRIORITY_SORT_KEY(priority)` asc (1..5, null → 6 → last) |
| 2 | `deadline` asc (ISO "YYYY-MM-DD" lex = chronological). Skipped in `no-deadline` (both nulls → falls to tier 3) |
| 3 | `createdAt` asc (stable tie-break) |

Reuse `PRIORITY_SORT_KEY` — already exported from `use-todos.ts` by Story 7.1.

### localStorage Key Map (avoid collisions)

| Key prefix | Who writes | Added by |
|---|---|---|
| `completed-section-collapsed` | `CompletedSection` | Story 3.2 |
| `category-collapsed-{id|"uncategorized"}` | `CategorySectionHeader` | Story 5.3 |
| `deadline-group-collapsed-{bucket}` | `DeadlineGroupHeader` | Story 7.2 (NEW) |

No collision — different prefixes. Bucket values (`overdue`, `today`, `tomorrow`, `this-week`, `later`, `no-deadline`) are distinct from category IDs (numeric or "uncategorized").

### Files to Create

- `frontend/src/components/deadline-group-header.tsx` — section divider with collapse state, overdue tint, popover-safe overflow
- `frontend/src/components/deadline-group-header.test.tsx` — RTL component test (continuation of Retro A1 habit)
- `frontend/src/components/by-deadline-view.tsx` — grouped view composing `DeadlineGroupHeader` + `TodoItem`
- `frontend/src/components/by-deadline-view.test.tsx` — RTL component test for fixed-order grouping + empty state + chip pass-through

### Files to Modify

- `frontend/src/lib/utils.ts` — add `DeadlineBucket` type and `getDeadlineBucket()` function (next to `formatDeadline`)
- `frontend/src/lib/utils.test.ts` — add `describe("getDeadlineBucket")` block with boundary cases
- `frontend/src/hooks/use-todos.ts` — add `selectByDeadline()` selector in the "View selectors" section
- `frontend/src/pages/home.tsx` — add `deadlineGroups` memo, replace `view === "deadline"` placeholder branch with `<ByDeadlineView />` + `<CompletedSection />`, remove the "Story 7.2 placeholder" comment if present
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions (ready-for-dev → in-progress → review → done) handled via the normal workflow, not manual edit

### Files to Verify (no changes expected)

- `frontend/src/components/todo-item.tsx` — `categoryName` prop already added by 7.1; reuse as-is
- `frontend/src/components/category-chip.tsx` — reuse as-is
- `frontend/src/components/priority-indicator.tsx` / `priority-picker-popover.tsx` — reuse as-is; verify Popover Overflow Pattern holds when opened inside a `DeadlineGroupHeader` body (Task 7)
- `frontend/src/components/deadline-label.tsx` / `deadline-date-picker-popover.tsx` — reuse as-is; verify Popover Overflow Pattern holds (Task 7)
- `frontend/src/components/empty-state.tsx` — reuse for the "no active todos" case in By Deadline (AC #7)
- `frontend/src/components/completed-section.tsx` — rendered by `HomePage`, not by `ByDeadlineView`; no changes
- `frontend/src/components/category-section-header.tsx` — DO NOT modify; `DeadlineGroupHeader` is a sibling, not a subclass
- `frontend/src/components/view-switcher.tsx` / `view-switcher.test.tsx` — no changes
- `frontend/src/components/due-this-week-view.tsx` — no changes; 7.1 pattern is the template
- `frontend/src/hooks/use-view.ts` — no changes; URL state infra is reused
- `frontend/src/types/index.ts` — `ViewType` already includes `"deadline"` from 7.1
- `frontend/src/index.css` — `animate-fade-in` keyframe + `--duration-normal` + `--color-overdue-bg` all present; DO NOT add new keyframes
- `frontend/src/app.tsx` — routing untouched; views are search params, not routes
- `backend/` — ZERO CHANGES. No new endpoints, no query param changes, no migrations

### What NOT to Do

- Do NOT create a `/api/todos/by-deadline` or any view-specific endpoint — architecture.md explicitly forbids it
- Do NOT fragment the TanStack Query cache key (`["todos", "deadline"]` etc.) — all three views read `["todos"]`
- Do NOT reimplement `formatDeadline` or duplicate `parseDeadlineDate`/`getToday`/`daysDiff` inside `getDeadlineBucket` — share the primitives
- Do NOT route `getDeadlineBucket` through `formatDeadline(d)?.text` — coupling machine classification to display string is brittle
- Do NOT install `@testing-library/user-event` — `fireEvent` is enough per 7.1 precedent. Zero new deps
- Do NOT install any JS animation library (`framer-motion`, `react-spring`, etc.) — reuse `animate-fade-in` + `max-height + opacity` + keyed remount
- Do NOT add a new keyframe to `index.css` — existing `animate-fade-in` and the max-height collapse pattern are sufficient
- Do NOT render empty `DeadlineGroupHeader` components — the selector drops empty buckets, and the component has a defensive `if (todoCount === 0) return null` (Task 3.9)
- Do NOT render `CompletedSection` INSIDE `ByDeadlineView` — `HomePage` mounts it as a peer so All and By Deadline share it
- Do NOT mutate the `todos` array returned from TanStack Query — always `[...todos].filter(...).sort(...)`
- Do NOT move the `ViewSwitcher`, `FAB`, or `CategoryManagementPanel` — they mount outside the view-switch region (view-agnostic)
- Do NOT refactor the "All" view branch in `home.tsx` — it must stay byte-identical so Epic 5 behavior is preserved
- Do NOT use `any` in TypeScript — `DeadlineBucket` is a literal union, `unknown` with type guards elsewhere
- Do NOT extend `CategorySectionHeader` via subclass / HOC / prop-inheritance — clone the shape; two concrete headers is fine
- Do NOT mirror view state to localStorage or React Context (URL is source of truth — 7.1 rule)
- Do NOT persist collapse state in TanStack Query — it's a client-only UI concern (localStorage pattern from Story 3.2 / 5.3)
- Do NOT add `overflow-hidden` to any ancestor of the `PriorityPickerPopover` / `DeadlineDatePickerPopover` trying to fix any layout issue — architecture.md § Popover Overflow Pattern explicitly names this as an anti-pattern
- Do NOT pull category chip logic into `ByDeadlineView` — use `TodoItem`'s `categoryName` prop (added by 7.1)
- Do NOT block on the residual optimistic-create/delete race (deferred from 7.1) unless it surfaces during 7.2 dev — it's in `deferred-work.md` with explicit rationale
- Do NOT touch `login.tsx`, `login.test.tsx`, `vite.config.ts` — 7.1 closed those lint/type issues
- Do NOT pull the backend security debt cluster — local-only scope, reaffirmed in Epic 6 retro
- Do NOT break `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, or `backend/ pytest`

### Previous Story Intelligence (Story 7.1 + Epic 6 retro)

Key learnings from Story 7.1 that apply to 7.2:

1. **Pattern reuse compounds — three generations now.** Story 5.3's `CategorySectionHeader` begat Story 7.2's `DeadlineGroupHeader`. Story 7.1's `DueThisWeekView` begat Story 7.2's `ByDeadlineView`. Story 7.1's `selectDueThisWeek` begat Story 7.2's `selectByDeadline`. Every new file has a living twin to clone from — use them, do NOT reinvent.
2. **The `TodoItem` `categoryName` prop is already a real prop** (Story 7.1 Task 5). Reuse it unchanged. Non-"All" views pass it, the "All" view omits it (chip rendering is gated).
3. **`PRIORITY_SORT_KEY` is exported from `use-todos.ts`** (Story 7.1 Task 3.1). Import and reuse — do NOT duplicate.
4. **The keyed-remount fade pattern in `HomePage` already wraps the view-region**. The `key={view}` remount replays `animate-fade-in` every time the URL param changes. Story 7.2 adds nothing here — the infrastructure is already correct.
5. **Popover Overflow Pattern is now documented** in architecture.md (Story 7.1 Task 9). Story 7.2 is the NEXT consumer of that pattern (architecture.md names this story explicitly). Apply the rule: `overflow-visible` on the expanded-state container class set of `DeadlineGroupHeader`.
6. **The Story 7.1 click handler skips history push when clicking the active tab** (code review patch `ef14548`). The `ViewSwitcher` is already fixed — nothing to port.
7. **Tailwind v4 `max-[400px]:` arbitrary modifier did NOT emit in this project** (Story 7.1 Debug Log). For any narrow-viewport CSS in `DeadlineGroupHeader`, either use a standard Tailwind breakpoint (`sm:`, `md:`) or a dedicated `@media` block in `index.css`. Do NOT reach for arbitrary `max-[...]:` — it silently does nothing.
8. **ESLint `react-hooks/refs` is strict**. Do NOT read refs during render (e.g. in `DeadlineGroupHeader` body). Writing to `tabRefs.current` inside a callback is fine; reading `ref.current` during render is not.
9. **ESLint `react-hooks/set-state-in-effect`**. Do NOT call `setCollapsed(...)` inside a `useEffect` that mirrors another state. The lazy-init `useState(() => localStorage.getItem(...))` pattern from `CategorySectionHeader` avoids this — reuse it verbatim.
10. **`useGetTodos` returns via `useQuery`**, so the selector memoisation guard is `[todos]` (the reference changes on cache update → memo recomputes). That is the whole refetch invalidation story — nothing to wire up.
11. **Dev notes > test fixtures for spec authority.** Tables in Dev Notes are source of truth — the "Today color" slip in Story 6.2 was a dev reading code-site instead of the table. Read the bucketing table in this file BEFORE writing selector code.
12. **Composition Checks > Unit Tests for UI bugs.** Retro C4's finding was that `bfa0d62` UI polish bugs were composition bugs, not unit-level bugs. Task 8 exists specifically to catch those BEFORE merge.
13. **`closedByMouseDownRef` race guard** (Story 6.1) is inside `PriorityPickerPopover` / `DeadlineDatePickerPopover` — both components Story 7.2 mounts via `TodoItem`. It's already correct; Task 7 verifies popover behavior inside the new group container but does NOT modify the popovers themselves.
14. **Pre-existing auth deep-link gotcha** (Story 7.1 Debug Log) — `/?view=...` loaded unauthenticated loses the search param through the login redirect. Pre-existing, unrelated to Story 7.2. Do NOT fix here.
15. **Zero new dependencies** — Story 7.1 streak continues. This is cultural now; break it only for a genuine blocker.
16. **Keep backend changes at zero.** Epic 5 Story 5.1's metadata expansion continues to pay off — `deadline` and `priority` fields are already on `GET /api/todos`.

### Cross-Story Dependencies

- **Story 5.3 (done):** `CategorySectionHeader` shape to clone, `CategoryChip` component for reuse via `TodoItem`.
- **Story 6.1 (done):** `PriorityIndicator` + `PriorityPickerPopover` + `PRIORITY_LEVELS` + `getPriorityColor` — all already wired into `TodoItem`; reuse unchanged.
- **Story 6.2 (done):** `DeadlineLabel` + `DeadlineDatePickerPopover` + `formatDeadline`, `isOverdue`, `parseDeadlineDate`, `getToday`, `daysDiff`, `toISODate`, `--color-overdue-bg` / `--color-overdue-text` tokens. `getDeadlineBucket` shares the parse primitives.
- **Story 7.1 (done):** `ViewSwitcher`, `useView`, URL-driven state, `animate-fade-in` keyed remount, `selectDueThisWeek` + `PRIORITY_SORT_KEY`, `DueThisWeekView` (template for `ByDeadlineView`), `TodoItem` `categoryName` prop. All the scaffolding is already in place.
- **Story 7.2 (this story):** completes Epic 7.
- **Epic 7 retrospective (next, optional per sprint-status):** per Retro C3 (Epic 6), retrospectives should not be skipped. Run it even though marked optional.

### Git Intelligence

Recent commits (post-Story 7.1):
- `afb62e6` Merge PR #8 — Story 7.1
- `ef14548` fix(7.1): code review patches — skip history push on active-tab click
- `82e1d5c` feat(7.1): view switcher & due this week view
- `7158aa0` chore: create story 7.1 — view switcher & due this week view
- `7424589` chore: add epic 6 retrospective and mark it done

Pattern observations:
- Workflow per story is: `chore: create story X.Y` → `feat(X.Y): ...` → `fix(X.Y): code review patches ...` → Merge PR. Follow this pattern for 7.2.
- Branch name for this story is `feature/7.2-by-deadline-view` (already created from main per orchestrator context).
- Commit footer convention: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

### Project Structure Notes

- All new files follow the `frontend/src/components/`, `frontend/src/hooks/`, `frontend/src/lib/` directory layout.
- No new directories required.
- Kebab-case filenames; PascalCase component exports; camelCase functions/variables; `DeadlineBucket` type is PascalCase (per type convention).
- Test files co-located beside source: `deadline-group-header.test.tsx` next to `deadline-group-header.tsx`, `by-deadline-view.test.tsx` next to `by-deadline-view.tsx`.
- `types/index.ts` does NOT need changes — `DeadlineBucket` belongs in `lib/utils.ts` (it's a library-internal type coupled to `getDeadlineBucket`), re-exported from there. `ViewType` already includes `"deadline"` from Story 7.1.

### References

- [Source: epics.md#Story 7.2 — acceptance criteria, UX-DR28, UX-DR33, FR46]
- [Source: prd.md#FR45 — view accessible within 1 interaction from main view; FR46 — todos display category/deadline/priority when set; FR47 — overdue visual flagging]
- [Source: prd.md#NFR14 — < 500ms filtering + priority sort under single-user load]
- [Source: ux-design-specification.md#"By Deadline" View — group buckets, overdue tint, flat list inside each group]
- [Source: ux-design-specification.md#DeadlineGroupHeader — same visual style as CategorySectionHeader; overdue header has subtle red background tint]
- [Source: ux-design-specification.md#Category chip on todo items (in non-"All" views) — chip styling already implemented via TodoItem.categoryName prop by 7.1]
- [Source: ux-design-specification.md#Structural regions per view — By Deadline: Temporal group dividers + completed section at bottom]
- [Source: architecture.md#Implementation Patterns — client-side view filtering is hard-ruled; no dedicated API endpoints per view]
- [Source: architecture.md#Popover Overflow Pattern — Story 7.2 is the named next consumer of this pattern]
- [Source: architecture.md#Project Structure & Boundaries — components/ layout; deadline-group-header.tsx explicitly listed]
- [Source: architecture.md#FR Category: Due This Week View (FR43-45) — component ownership; use-todos.ts for selector]
- [Source: _bmad-output/implementation-artifacts/7-1-view-switcher-and-due-this-week-view.md — `ViewSwitcher`, `useView`, `selectDueThisWeek`, `PRIORITY_SORT_KEY`, `DueThisWeekView`, `TodoItem.categoryName` prop; keyed-remount fade; composition checks template; previous-story intelligence template]
- [Source: _bmad-output/implementation-artifacts/6-2-deadline-system-label-overdue-treatment-and-inline-edit.md — `formatDeadline`, `isOverdue`, private `parseDeadlineDate`/`getToday`/`daysDiff`; popover `right-0` overflow fix]
- [Source: _bmad-output/implementation-artifacts/6-1-priority-system-tokens-indicator-and-inline-edit.md — `PriorityIndicator`, `PRIORITY_LEVELS`, `closedByMouseDownRef` race guard]
- [Source: _bmad-output/implementation-artifacts/epic-6-retro-2026-04-17.md — A6 (reuse `formatDeadline` parse primitives for grouping), C4 (Composition Checks), C5 (Carried Debt callout)]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — residual 7.1 items (optimistic-create/delete race tail; `selectDueThisWeek` "today" memo) remain deferred; backend security debt cluster remains deferred]
- [Source: frontend/src/hooks/use-todos.ts — `selectDueThisWeek` + `PRIORITY_SORT_KEY` + mutation hooks; add `selectByDeadline` next to them]
- [Source: frontend/src/lib/utils.ts — private `parseDeadlineDate`/`getToday`/`daysDiff`; `formatDeadline`, `isOverdue`, `toISODate`; add `getDeadlineBucket` + `DeadlineBucket` type]
- [Source: frontend/src/components/category-section-header.tsx — structural template for `DeadlineGroupHeader`]
- [Source: frontend/src/components/due-this-week-view.tsx — structural template for `ByDeadlineView`]
- [Source: frontend/src/components/todo-item.tsx — `categoryName` prop added by 7.1; reuse unchanged]
- [Source: frontend/src/components/completed-section.tsx — rendered by `HomePage` as peer of the view; no changes]
- [Source: frontend/src/components/empty-state.tsx — reused for "no active todos" in By Deadline (parity with All view)]
- [Source: frontend/src/pages/home.tsx — update the `view === "deadline"` branch; preserve "all" branch byte-identical]
- [Source: frontend/src/index.css — `animate-fade-in` keyframe, `--duration-normal`, `--color-overdue-bg` / `--color-overdue-text`, `prefers-reduced-motion` override]
- [Source: commit bfa0d62 — popover overflow pattern; Story 7.2 is explicitly named in architecture.md as the next consumer]
- [Source: commit ef14548 — Story 7.1 code review patch (ViewSwitcher skips history push on active-tab click); already merged, nothing to port]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
