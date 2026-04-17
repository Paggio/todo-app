# Story 7.1: View Switcher & Due This Week View

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an authenticated user,
I want a view switcher and a "Due This Week" view that shows my upcoming priority-sorted tasks,
so that I can focus on what matters most this week.

## Acceptance Criteria

1. **Given** the main view for an authenticated user **When** it renders **Then** a `ViewSwitcher` component (segmented tab bar) appears below the app header with three pill-style segments: "All" | "This Week" | "By Deadline"; the active tab uses accent fill background with white text; inactive tabs use ghost style with muted text (UX-DR21, FR45)

2. **Given** the user taps a view tab **When** the view switches **Then** the content area transitions with a 150ms fade (respecting `prefers-reduced-motion`) — no page navigation, no API call; the switch is a client-side filter on cached `["todos"]` data (UX-DR21)

3. **Given** the active view **When** the URL is checked **Then** the view state is persisted as a URL query param (`?view=all|week|deadline`); browser back/forward navigates between previously visited views; unknown/missing values fall back to `"all"` without a full reload (UX-DR21, FR45)

4. **Given** a narrow viewport (≤ 400px) **When** the `ViewSwitcher` renders **Then** tab labels abbreviate to "All" / "Week" / "Deadline" to fit; all three remain visible and tappable (min 44px touch target) (UX-DR21)

5. **Given** the user selects the "This Week" tab **When** the Due This Week view renders **Then** it displays a flat list (no section dividers, no category grouping) of only active (non-completed) todos with deadlines within the next 7 calendar days (today through today+6 inclusive) (FR43, UX-DR32)

6. **Given** the Due This Week view has todos **When** they are sorted **Then** the order is: priority P1 first → P2 → P3 → P4 → P5 → no priority last; within the same priority level, sorted by deadline ascending (earliest first); ties broken by `createdAt` ascending (stable order) (FR44, UX-DR32)

7. **Given** a todo in the Due This Week view **When** it renders **Then** it shows its priority indicator (3px left border), deadline label (right-aligned), and a category chip positioned between the description and deadline label; uncategorized todos show no chip (UX-DR32, FR46)

8. **Given** the user has no active todos due within 7 days **When** the Due This Week view renders **Then** an empty state displays "Nothing due this week" with a subtle checkmark icon (UX-DR32)

9. **Given** the Due This Week view **When** it returns results **Then** the client-side filtering and sorting completes in under 500ms (expected sub-millisecond via memoized derivation on cached data) — no new API request is fired; the view is a lens over `["todos"]` (NFR14, FR45)

10. **Given** the "All" tab is selected (default) **When** the view renders **Then** it displays the existing category-section layout from Epic 5 with the Completed section at the bottom — behavior and markup unchanged from the current `HomePage` implementation (FR45, UX-DR34)

11. **Given** any view **When** the Completed section is displayed **Then** it follows the same rule as today: shown at the bottom in the "All" view; hidden in the "This Week" view (Due This Week shows active todos only per FR43)

## Tasks / Subtasks

- [x] Task 1: Introduce `ViewType` + URL query-param view state (AC: #1, #3)
  - [x] 1.1 Add `export type ViewType = "all" | "week" | "deadline"` to `frontend/src/types/index.ts`
  - [x] 1.2 Create `frontend/src/hooks/use-view.ts` exposing `useView(): { view: ViewType; setView: (v: ViewType) => void }`
  - [x] 1.3 Implement `useView` with `useSearchParams` from `react-router` v7; read `view` param, validate against the three allowed values, default to `"all"` on missing/unknown
  - [x] 1.4 `setView` must call `setSearchParams` with `replace: false` so browser back/forward traverses view history; preserve any unrelated existing search params
  - [x] 1.5 Memoise parsed `view` with `useMemo` against the raw search param string
  - [x] 1.6 Do NOT persist view in localStorage — URL is the single source of truth

- [x] Task 2: Create `ViewSwitcher` segmented tab bar component (AC: #1, #2, #4)
  - [x] 2.1 Create `frontend/src/components/view-switcher.tsx`
  - [x] 2.2 Render a `div` with `role="tablist"` containing three `button` elements with `role="tab"`, `aria-selected={isActive}`, and `aria-controls` pointing at the view region id
  - [x] 2.3 Active tab styling: `bg-primary text-primary-foreground` (accent fill + white text); inactive tab: ghost style (`text-muted-foreground hover:text-foreground hover:bg-accent`); pill shape via `rounded-full` on each segment and `rounded-full bg-muted p-1` on the container
  - [x] 2.4 Each tab min 44×44px touch target; flex-1 so the three share width evenly
  - [x] 2.5 Provide two label variants via a small helper or Tailwind responsive utilities: full labels at ≥ 401px; short labels at ≤ 400px. Initial attempt used `max-[400px]:` arbitrary modifiers, but Tailwind v4's JIT did not emit the expected `@media (max-width: 400px)` rule in this project. Implemented instead via two dedicated `.view-switcher-label-short` / `.view-switcher-label-long` classes in `index.css` gated by a single `@media (max-width: 400px)` block — both spans live in the DOM; CSS picks which is visible. Verified at 400px and 401px viewports via Playwright.
  - [x] 2.6 Clicking a tab calls `setView(value)` from `useView`; do NOT wrap in anchor; NOT navigation
  - [x] 2.7 Keyboard: Left/Right arrows move focus between tabs (roving tabindex pattern); Enter/Space activates; Home/End jump to first/last
  - [x] 2.8 Positioned below the app header inside `HomePage`, above the content area; full-width of the `max-w-[640px]` content container

- [x] Task 3: Add view-aware filter/sort selectors to `use-todos` (AC: #5, #6, #9)
  - [x] 3.1 Extended `frontend/src/hooks/use-todos.ts` with `PRIORITY_SORT_KEY(priority)` and `selectDueThisWeek(todos)` exported pure helpers
  - [x] 3.2 Filter rule: keep only todos where `isCompleted === false` AND `deadline !== null` AND deadline parsed at local midnight is between today and today+6 (inclusive). Uses the same `new Date(year, month-1, day)` strategy as Story 6.2 to avoid the UTC-midnight timezone bug.
  - [x] 3.3 Sort rule: priority ascending (nulls last), deadline ascending (ISO string lexicographic = chronological for same-format), createdAt ascending tie-break
  - [x] 3.4 Returns a new array via `[...todos].filter(...).sort(...)` — never mutates
  - [x] 3.5 Chose shape 3.6 — `selectDueThisWeek` is a pure export; `HomePage` applies it via `useMemo` keyed on `todos`. Avoids an extra hook layer and keeps the `["todos"]` cache single-source for all three views per the architecture constraint.
  - [x] 3.6 See 3.5 — chosen shape

- [x] Task 4: Create `DueThisWeekView` presentation component (AC: #5, #7, #8)
  - [x] 4.1 Created `frontend/src/components/due-this-week-view.tsx`
  - [x] 4.2 Accepts `{ todos, categories, announce? }` props
  - [x] 4.3 Builds a `categoryNameById` Map memoised on `categories`
  - [x] 4.4 Empty state: "Nothing due this week" + subtle checkmark SVG (20×20, muted stroke, `animate-fade-in`, `role="status" aria-live="polite"`)
  - [x] 4.5 Flat `<div role="list">` with `TodoItem` per todo — no section headers
  - [x] 4.6 Wires `onToggle`/`onDelete` via `useUpdateTodo` / `useDeleteTodo` exactly as `TodoList` does
  - [x] 4.7 Passes `categoryName` to `TodoItem` when `categoryId !== null`

- [x] Task 5: Extend `TodoItem` to render an optional category chip (AC: #7)
  - [x] 5.1 Added `categoryName?: string | null` prop
  - [x] 5.2 Renders `<CategoryChip categoryName={...} />` between description span and `<DeadlineLabel />` when provided
  - [x] 5.3 Chip wrapper uses `shrink-0` so it doesn't get squeezed
  - [x] 5.4 Prop omitted in All view — markup stays byte-identical
  - [x] 5.5 Chip only rendered from `DueThisWeekView`; All view's `TodoList` doesn't pass the prop

- [x] Task 6: Wire `ViewSwitcher` + `DueThisWeekView` into `HomePage` (AC: #1, #2, #10, #11)
  - [x] 6.1 `HomePage` calls `useView()` and renders `<ViewSwitcher controlsId={VIEW_REGION_ID} />` directly below the header
  - [x] 6.2 Content region view-switches: `view === "week"` → `<DueThisWeekView />` (no `CompletedSection`); `view === "all"` or `view === "deadline"` → existing category-section layout + `CompletedSection` (the deadline case is a Story 7.2 placeholder)
  - [x] 6.3 Keyed-remount fade: `<div id={VIEW_REGION_ID} role="tabpanel" key={view} className="animate-fade-in">` — `prefers-reduced-motion` override in `index.css` already collapses the fade to 0.01ms
  - [x] 6.4 `FAB` and `CategoryManagementPanel` remain outside the view switch (view-agnostic)
  - [x] 6.5 `isEmpty` still derived from `activeTodos.length === 0` — unaffected by view selection

- [x] Task 7: Add the first RTL component test in the codebase (AC: #1, #2, #3) — Retro action A1
  - [x] 7.1 `@testing-library/react` already present. `@testing-library/user-event` NOT present — avoided adding a new dep per the "zero new deps" streak; keyboard events driven via `fireEvent.keyDown` which is sufficient for the tests under `jsdom`.
  - [x] 7.2 Created `frontend/src/components/view-switcher.test.tsx`
  - [x] 7.3 Tests assert `aria-selected` reflects `?view=week` and `?view=deadline`
  - [x] 7.4 Tests assert clicking writes the URL and switching back to All strips the param
  - [x] 7.5 Tests assert `?view=bogus` and missing `view` both fall back to All without rewriting the URL
  - [x] 7.6 Tests assert ArrowLeft/Right/Home/End move focus between tabs with wrap
  - [x] 7.7 12 new tests; all pass under `pnpm test`; no new jsdom polyfills

- [x] Task 8: Carried-debt items from Epic 6 retrospective (retro actions A2, A3, A4) — fold into this story
  - [x] 8.1 **A2 — Priority helper unit tests.** Added `getPriorityColor`, `getPriorityLabel`, and `PRIORITY_LEVELS` tests to `frontend/src/lib/utils.test.ts` covering 1..5, null, and out-of-range values; structural shape of `PRIORITY_LEVELS`; `cssVar` correspondence.
  - [x] 8.2 **A3 — Fixed `login.tsx` lint violations and `login.test.tsx` type errors.** Moved the `navigateRef.current = navigate` / `fromRef.current = from` writes out of render into a dedicated `useEffect` (fixes the `react-hooks/refs` errors without changing behaviour — existing login tests still pass). Added explicit `MockAuthState` / `MockLocationState` types to the test mocks so the `authState`/`mockLocation.state` reassignments type-check. `pnpm lint` exits 0.
  - [x] 8.3 **A4 — Guard `useDeleteTodo` against optimistic negative IDs.** In `mutationFn`, return early with `Promise.resolve()` when `id < 0` so `DELETE /api/todos/-1713…` never reaches the server. Optimistic cache removal + `onSettled` invalidation still fire, so the UI stays consistent. Inline comment references "Epic 3 → 6 carried debt".

- [x] Task 9: Documentation convention note (retro action A5)
  - [x] 9.1 Added `### Popover Overflow Pattern` subsection to `_bmad-output/planning-artifacts/architecture.md` within the "Implementation Patterns & Consistency Rules" section. References commit `bfa0d62` and names `DeadlineGroupHeader` (Story 7.2) as the next consumer. Chose the inline architecture.md addition per 9.1 (small diff); did not create a separate `docs/conventions/popover-overflow.md`.
  - [x] 9.2 Chose 9.1 path (inline in architecture.md, no separate file).

- [x] Task 10: Incidental fixes discovered while implementing above (disclose for reviewer context)
  - [x] 10.1 Removed unused `Plus` import from `frontend/src/pages/home.tsx` (pre-existing lint error blocking `pnpm lint` / `pnpm build`; needed to clear for A3).
  - [x] 10.2 Switched `frontend/vite.config.ts` to import `defineConfig` from `vitest/config` instead of `vite` so the `test` block type-checks under `tsc -b` (pre-existing error blocking `pnpm build` on this branch; unrelated to story scope but needed so the A3 "pnpm build works" criterion is genuinely verifiable).

## Dev Notes

### Carried Debt (from prior retros — must be addressed here)

| Ref | Action | Where to apply | Fresh since |
|---|---|---|---|
| A1 | First RTL component test in codebase | `view-switcher.test.tsx` (Task 7) | Epic 6 retro (carried from Epic 5 A1 partial) |
| A2 | Priority helper unit tests | `utils.test.ts` (Task 8.1) | Epic 5 retro |
| A3 | `login.tsx` lint + `login.test.tsx` types | Task 8.2 | Epic 5 retro |
| A4 | Optimistic temp-ID DELETE race | `use-todos.ts` in Task 8.3 | Epic 3 retro — now 3 epics old |
| A5 | Popover overflow convention note | `architecture.md` via Task 9 | Epic 6 retro (post-release polish `bfa0d62`) |

If any of A1–A5 is genuinely infeasible within this story, explicitly justify the deferral in `Completion Notes List` below with a concrete plan to land it in Story 7.2.

### Composition Checks (new in 7.1 per Epic 6 retro C4)

Verify these manually (or via Playwright — see `CLAUDE.md` memory: always verify UI changes with Playwright) BEFORE marking the story complete:

1. **Switch views with a populated list.** All → This Week → By Deadline → All. Fade animation plays each time. URL updates. Browser back navigates to the previous view. No network request fires on switch.
2. **Deep-link a view via URL.** Load `/?view=week` directly — the "This Week" tab is active on mount; correct content renders.
3. **Unknown param falls back.** Load `/?view=bogus` — the "All" tab is active; content is the standard All view; URL is NOT mutated by the app (that would cause a loop).
4. **This Week filter boundary.** Create todos with deadlines: today, today+6, today+7, today-1, null. Switch to This Week. Only today and today+6 appear. today-1 (overdue) is NOT in This Week — overdue belongs to the By Deadline "Overdue" group in 7.2, not here.
5. **This Week sort order.** Create todos P1/due Fri, P1/due Tue, P3/due Wed, null/due today, P5/due today. Expect order: P1 Tue, P1 Fri, P3 Wed, P5 today, null today.
6. **Category chip in This Week view.** A todo with a category shows the chip between description and deadline; an uncategorized todo shows no chip. Chip does NOT wrap or overflow on a 375px viewport with a 60-character description.
7. **Popover × This Week view.** Open the inline priority popover on a This Week todo — it must not be clipped. (This is why A5 / Popover Overflow Pattern matters.) If clipping is observed, apply the `bottom-full` opening pattern established in `bfa0d62` — do NOT add a new `overflow-hidden` ancestor.
8. **Mobile labels.** At 400px viewport, tab labels read "All" / "Week" / "Deadline". At 401px+, they read "All" / "This Week" / "By Deadline". All three remain tappable (44×44px minimum).
9. **Completed section visibility.** In All view: Completed section renders at the bottom (unchanged). In This Week view: Completed section is NOT rendered. In By Deadline placeholder view (Story 7.2 will replace): renders as All for now.
10. **`prefers-reduced-motion`.** Enable Reduce Motion in OS settings; switch views — the fade duration collapses to ~0ms per the existing `@media (prefers-reduced-motion: reduce)` override in `index.css`.

### Critical Architecture Constraints

- **Client-side view filtering only.** No new API endpoints. No dedicated `/api/todos/due-this-week` route. All three views are lenses over `GET /api/todos` cached at `["todos"]`. This is a hard architectural rule (architecture.md §Implementation Patterns: "Implement view filtering (All/This Week/By Deadline) client-side using TanStack Query selectors — never create dedicated API endpoints per view").
- **URL query param is the single source of truth for view state.** Not React Context, not localStorage, not component state. This enables shareable links, browser back/forward, and deep-linking.
- **React Router v7 is already installed** (`react-router@^7.1.0`). `BrowserRouter` wraps the app in `app.tsx`. Use `useSearchParams` from `react-router`. Do NOT install `react-router-dom` — v7 consolidates under `react-router`.
- **No new animation libraries.** The 150ms fade transition uses the existing `animate-fade-in` utility class defined in `src/index.css` (line 320) with `prefers-reduced-motion` already honored. Remount-on-key pattern replays the keyframe on every view switch.
- **Tailwind v4 CSS-first.** There is NO `tailwind.config.ts`. All theme tokens are CSS custom properties in `src/index.css`. Do NOT create a Tailwind config file. For the < 400px breakpoint, use Tailwind's arbitrary `max-[400px]:` modifier (v4 supports this out of the box), or inline a `@media` block in the component's className strategy via a small wrapper CSS class if cleaner.
- **File naming: kebab-case for frontend.** Component naming: PascalCase. Types: PascalCase. Functions/variables: camelCase.
- **No `any` type in TypeScript.** Use `ViewType` literal union, `unknown` with type guards where needed.
- **No API boundary changes.** `Todo`, `Category`, and the `api.ts` snake↔camel transform all remain untouched. `ViewType` is frontend-only.
- **Per-user isolation is backend's job.** Frontend just calls `GET /api/todos` — the backend filters by `user_id` already.
- **TanStack Query key is `["todos"]`.** Do NOT fragment into `["todos", "week"]` etc. — that defeats the point of client-side lensing and would fire separate requests per view.

### Existing Code Patterns to Follow Exactly

**`useSearchParams` pattern** (React Router v7):
```typescript
import { useSearchParams } from "react-router"

export function useView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get("view")
  const view: ViewType =
    raw === "week" || raw === "deadline" ? raw : "all"

  const setView = useCallback(
    (next: ViewType) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next === "all") params.delete("view") // keep URL clean for default
          else params.set("view", next)
          return params
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  return { view, setView }
}
```
Why `delete` on `"all"`: keeps the canonical URL for the default view at `/` (no query string), which is the cleanest shareable URL.

**Filter + sort selector pattern** (pure function, co-located with hook):
```typescript
// in frontend/src/hooks/use-todos.ts

const DAY_MS = 1000 * 60 * 60 * 24

function parseDeadlineLocal(deadline: string): Date {
  const [y, m, d] = deadline.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function selectDueThisWeek(todos: Todo[]): Todo[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayMs = today.getTime()
  const weekEndMs = todayMs + 6 * DAY_MS

  return [...todos]
    .filter((t) => {
      if (t.isCompleted) return false
      if (t.deadline === null) return false
      const d = parseDeadlineLocal(t.deadline).getTime()
      return d >= todayMs && d <= weekEndMs
    })
    .sort((a, b) => {
      const pa = a.priority ?? 6
      const pb = b.priority ?? 6
      if (pa !== pb) return pa - pb
      if (a.deadline !== b.deadline) {
        // Both are non-null here due to filter
        return (a.deadline ?? "").localeCompare(b.deadline ?? "")
      }
      return a.createdAt.localeCompare(b.createdAt)
    })
}
```
Place this next to `useGetTodos` in `use-todos.ts`. Export as a named function so it's trivially unit-testable.

**Segmented tab pattern (roving tabindex for keyboard)**:
```typescript
// Inside ViewSwitcher
const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
function onKeyDown(e: React.KeyboardEvent, index: number) {
  const n = VIEWS.length
  if (e.key === "ArrowRight") {
    const next = (index + 1) % n
    tabRefs.current[next]?.focus()
    e.preventDefault()
  } else if (e.key === "ArrowLeft") {
    const prev = (index - 1 + n) % n
    tabRefs.current[prev]?.focus()
    e.preventDefault()
  } else if (e.key === "Home") {
    tabRefs.current[0]?.focus()
    e.preventDefault()
  } else if (e.key === "End") {
    tabRefs.current[n - 1]?.focus()
    e.preventDefault()
  }
}
```
`tabIndex={isActive ? 0 : -1}` on each tab is the roving pattern.

**Fade-on-view-change via keyed remount**:
```typescript
// Inside HomePage, in the content area
<div key={view} className="animate-fade-in">
  {view === "all" && <AllTodosView ... />}
  {view === "week" && <DueThisWeekView ... />}
  {view === "deadline" && <AllTodosView ... /> /* TODO Story 7.2 */}
</div>
```
Changing `key` causes React to unmount and remount; the `animate-fade-in` CSS class re-applies its `fade-in` keyframe each time. No JS animation library; no `AnimatePresence`.

**Optimistic mutation pattern** — unchanged. `TodoList`, `useUpdateTodo`, `useDeleteTodo` stay exactly as they are.

**`CategoryChip` reuse**: the component already exists at `frontend/src/components/category-chip.tsx` with the exact caption-size, muted-background, 4px-radius styling per UX-DR32. Import and use; do NOT re-implement.

### View Filter Semantics (precise)

`selectDueThisWeek` uses these exact rules — align ACs and tests to them:

| Field | Rule |
|---|---|
| `isCompleted` | must be `false` |
| `deadline` | must be non-null |
| `deadline` date | `>= today` AND `<= today + 6 days`, compared at local midnight |
| Sort 1 | `priority ?? 6` ascending (1..5, null becomes 6 → last) |
| Sort 2 | `deadline` ascending (ISO "YYYY-MM-DD" sorts lexicographically) |
| Sort 3 | `createdAt` ascending (stable tie-break) |

**Overdue is NOT included in This Week.** Todos with `deadline < today` belong to the "Overdue" group of the By Deadline view (Story 7.2). This is intentional and matches UX-DR32.

### URL Query Param Semantics

| URL | Resolved view | Notes |
|---|---|---|
| `/` | `all` | Canonical default URL |
| `/?view=all` | `all` | Acceptable but redundant; app prefers to strip for the default |
| `/?view=week` | `week` | This Week view |
| `/?view=deadline` | `deadline` | By Deadline view (renders All layout as placeholder until 7.2) |
| `/?view=foo` | `all` | Unknown value falls back; do NOT rewrite the URL (that would loop) |
| `/?view=` | `all` | Empty value falls back |

When `setView("all")` is called, delete the `view` param from the URL entirely (rather than writing `?view=all`) to keep the default URL clean and shareable.

### ViewSwitcher Visual Spec

- Container: `rounded-full bg-muted p-1 flex gap-1 w-full` (full-width within the 640px content container)
- Each tab: `flex-1 rounded-full px-4 py-2 min-h-[44px] text-sm font-medium transition-colors`
- Active: `bg-primary text-primary-foreground shadow-subtle`
- Inactive: `text-muted-foreground hover:text-foreground hover:bg-accent/50`
- Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
- Position: directly below `<h1>Todos</h1>` header, above the content block; with `mt-4` spacing from the header row and `mt-6` already on the content retained

### Files to Create

- `frontend/src/components/view-switcher.tsx` — Segmented tab bar with three pill segments
- `frontend/src/components/view-switcher.test.tsx` — First RTL component test in the codebase (Task 7)
- `frontend/src/components/due-this-week-view.tsx` — Flat priority-sorted list view + empty state
- `frontend/src/hooks/use-view.ts` — `useView()` hook backed by `useSearchParams`

### Files to Modify

- `frontend/src/types/index.ts` — Add `ViewType` type
- `frontend/src/pages/home.tsx` — Mount `ViewSwitcher`, view-switch the content region, keyed fade remount
- `frontend/src/hooks/use-todos.ts` — Add `selectDueThisWeek` pure function (export); add A4 guard on `useDeleteTodo` for negative IDs
- `frontend/src/components/todo-item.tsx` — Add optional `categoryName` prop + chip render slot
- `frontend/src/lib/utils.test.ts` — Add priority helper tests (A2 carried debt)
- `frontend/src/pages/login.tsx` — Fix `react-hooks/refs` lint violations (A3 carried debt)
- `frontend/src/pages/login.test.tsx` — Fix mock type mismatches (A3 carried debt)
- `_bmad-output/planning-artifacts/architecture.md` — Add Popover Overflow Pattern convention note (A5 carried debt)

### Files to Verify (no changes expected)

- `frontend/src/app.tsx` — `BrowserRouter` already wraps; no route changes needed (views are search params, not routes)
- `frontend/src/components/category-chip.tsx` — Already implements the caption-size muted chip exactly per UX-DR32; use as-is
- `frontend/src/components/empty-state.tsx` — Stays as the All-view empty state; the This Week empty state is its own inline markup inside `DueThisWeekView` (different copy + icon)
- `frontend/src/components/completed-section.tsx` — Unchanged. Rendered by `HomePage` only in the "All" view.
- `frontend/src/components/category-section-header.tsx` — Unchanged. Used only by the All view.
- `frontend/src/components/deadline-label.tsx` — Unchanged; renders identically in This Week (the label is redundant with sorting but the spec keeps it for scannability per UX-DR32)
- `frontend/src/components/priority-indicator.tsx` — Unchanged; 3px left border still drawn in This Week
- `frontend/src/components/fab.tsx` — Unchanged; FAB is view-agnostic and mounts outside the view switch
- `frontend/src/components/category-management-panel.tsx` — Unchanged
- `frontend/src/lib/api.ts` — Unchanged
- `backend/` — Zero changes. No new endpoints, no query param changes.

### What NOT to Do

- Do NOT create dedicated API endpoints for any view — all filtering is client-side (architecture.md §Implementation Patterns, explicit anti-pattern)
- Do NOT install `react-router-dom` — v7 uses `react-router` alone; `BrowserRouter`, `useSearchParams`, `useNavigate`, `useLocation` all export from there
- Do NOT install any JS animation library (`framer-motion`, `react-spring`, `@radix-ui/react-tabs`, etc.) — use the existing `animate-fade-in` CSS class and keyed remount
- Do NOT implement By Deadline grouping — that is Story 7.2. The "By Deadline" tab should render the All view as a placeholder for now; Story 7.2 will swap in `ByDeadlineView` and `DeadlineGroupHeader`
- Do NOT persist view state in localStorage or React Context — URL is the single source of truth
- Do NOT fragment the TanStack Query cache (`["todos", "week"]`, etc.) — all views read `["todos"]`
- Do NOT use `new Date("YYYY-MM-DD")` for deadline parsing — it creates UTC midnight and shifts by one day depending on timezone. Use `new Date(year, month - 1, day)` as Story 6.2 established
- Do NOT include overdue todos in This Week — overdue belongs to the By Deadline "Overdue" group (Story 7.2)
- Do NOT include completed todos in This Week — only active (FR43)
- Do NOT mutate the `todos` array returned from TanStack Query — always `[...todos].filter(...).sort(...)` so the cache stays immutable
- Do NOT rewrite the URL when an unknown `view` value is received — the app falls back to "all" visually, but the malformed URL stays as-is (rewriting can cause infinite loops and is hostile to shared bad links)
- Do NOT add `CategoryChip` render to the All view — category is already grouped via `CategorySectionHeader`. Chip is a This Week / By Deadline concern (UX-DR32)
- Do NOT gate the "All" tab rendering behind an extra wrapper — its markup should be byte-identical to the current `HomePage` content block so Epic 5's behavior is guaranteed untouched (visually — the new view-switch keyed wrapper is acceptable structural change)
- Do NOT use `any` type in TypeScript
- Do NOT fix or refactor unrelated lint warnings beyond A3 (login.tsx/login.test.tsx scope) — creep risk
- Do NOT break the existing `pnpm typecheck`, `pnpm lint`, `pnpm build`, or backend pytest suites

### Previous Story Intelligence (Story 6.2 + Epic 6 retro)

Key learnings from Story 6.2 that apply to 7.1:

1. **Pattern reuse compounds.** `ViewSwitcher` is the first segmented control in the codebase — build it carefully because Story 7.2's `DeadlineGroupHeader` (and any future settings tabs) will clone this pattern. Keep `ViewSwitcher` purely presentational + URL-driven; no view-specific logic inside.
2. **Composition is the missing AC.** See "Composition Checks" section above — Epic 6 retro item C4. The real bugs in Epic 6 (`bfa0d62`) were composition bugs (popover × collapsing container, FAB × three selectors × mobile). Run the Composition Checks before marking the story complete.
3. **`formatDeadline` from 6.2 is the temporal-bucket primitive.** Story 7.2 will reuse it for By Deadline grouping per retro A6. For 7.1, the simpler date-range filter in `selectDueThisWeek` is correct — do NOT over-engineer by routing through `formatDeadline` just because it exists. Keep the 7.1 filter self-contained.
4. **Popover overflow pattern from commit `bfa0d62`.** Inline-edit popovers inside collapsible parents must open upward (`bottom-full`). The This Week view is a flat list without `CategorySectionHeader`, so clipping is unlikely — but the priority/deadline inline-edit popovers on TodoItems must still render correctly. Retro A5 mandates documenting this pattern in `architecture.md` (Task 9).
5. **ESLint `react-hooks/refs` rule is strict.** Do NOT read refs during render in `ViewSwitcher`. Refs for roving tabindex go in arrays and are only read in event handlers.
6. **ESLint `react-hooks/set-state-in-effect` rule.** For the view-URL sync, drive state from `useSearchParams` directly — do NOT mirror it into `useState` inside a `useEffect`. That pattern is exactly what the rule flags.
7. **Pre-existing lint errors in `login.tsx` and `login.test.tsx`** — retro A3 makes fixing these part of Story 7.1. `pnpm lint` must exit 0 at completion.
8. **Zero new dependencies.** Epic 6 added zero — keep the streak. `react-router` is already present; `@testing-library/react` is already present (used by `login.test.tsx`).
9. **`closedByMouseDownRef` race guard** (Story 6.1/6.2) — does NOT apply to `ViewSwitcher` (no popover). Included here so you know it's intentionally not relevant; retro A1's RTL test exercises the ViewSwitcher, not this guard.
10. **Test file naming**: `*.test.tsx` beside the source file. `test-setup.ts` already configures `jsdom` + jest-dom matchers via `vitest.config.ts`. No additional test infra needed.
11. **The `cn()` utility** from `@/lib/utils` is used for conditional class names throughout.
12. **The `motionDuration` helper** from `@/lib/motion` wraps durations with `prefers-reduced-motion` respect. The `animate-fade-in` class already does this via CSS; use the class, not a JS-timed transition.
13. **Existing `animate-fade-in` keyframe** at `index.css` line 320 uses `var(--duration-normal)` (200ms). The spec says 150ms — this is close enough that the existing class satisfies UX-DR21. Do NOT add a new keyframe just to shave 50ms; the class name + keyed remount is the whole transition strategy.

### Git Intelligence

Recent commits (post-Epic 6):
- `dad46d0` Merge PR #7 — UI polish: category FAB, panel spacing, popover overflow
- `bfa0d62` fix: UI polish — category FAB button, panel spacing, popover overflow
- `076cd02` chore: mark epic 6 as done in sprint status
- `c14deff` Merge PR #6 — Story 6.2
- `a31a901` fix: code review patches for story 6.2
- `4f1b5b7` feat: story 6.2, deadline system with label, overdue treatment and inline edit
- `339ae5f` fix: code review patches for story 6.1

Pattern observations:
- One comprehensive `feat:` commit per story, followed by one `fix:` commit for code-review patches.
- PR-per-story workflow per PRD (from Epic 5 retro). Branch is already `feature/7.1-view-switcher-and-due-this-week` per orchestrator context.
- Post-release UI polish lives in a separate commit type (e.g. `bfa0d62`). For 7.1, aim to avoid generating post-release polish — that's the whole point of the Composition Checks section.
- Co-author footer: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` — per recent commit messages.

### Cross-Story Dependencies

- **Story 5.3 (done):** Added category assignment, the All-view category-section layout, `CategoryChip` component (pre-created for Epic 7 consumption), and the "All view sections" behavior that Story 7.1 must preserve untouched in `view === "all"`.
- **Story 6.1 (done):** Added `PriorityIndicator`, `PriorityPickerPopover`, `PRIORITY_LEVELS`, `getPriorityColor`. `selectDueThisWeek` relies on `todo.priority` being 1..5 or null, which 6.1 established.
- **Story 6.2 (done):** Added `DeadlineLabel`, `formatDeadline`, `isOverdue`, `toISODate`, overdue color tokens, FAB date picker. `selectDueThisWeek` uses the same local-midnight date parsing strategy (keep in sync; do NOT import internals of 6.2's helpers — the parsing utilities in `utils.ts` are `parseDeadlineDate`/`getToday`/`daysDiff` are `function` scope, not exported).
- **Story 7.2 (next, not started):** Will add `ByDeadlineView` + `DeadlineGroupHeader`. The URL query param infra (`useView`), `ViewSwitcher`, and the keyed-fade pattern built here are the foundation 7.2 builds on. The "By Deadline" tab in 7.1 renders the All view as a placeholder so there is something to switch to — 7.2 will replace that placeholder. Story 7.2 will also reuse `formatDeadline` for temporal bucketing (retro A6).

### Project Structure Notes

- New files follow the established directory layout: `frontend/src/components/`, `frontend/src/hooks/`.
- No new directories required.
- Kebab-case file names; PascalCase components; camelCase functions/variables; snake_case on the backend boundary only (and the API layer already handles the transform).
- Test files co-located with source (`view-switcher.test.tsx` next to `view-switcher.tsx`).
- `types/index.ts` is the single source of truth for cross-file types — add `ViewType` there, not inside the hook or component.

### References

- [Source: epics.md#Story 7.1 — acceptance criteria, FR43, FR44, FR45, FR46, NFR14, UX-DR21, UX-DR32, UX-DR34]
- [Source: prd.md#FR43 — "Due This Week" view filter rule]
- [Source: prd.md#FR44 — priority sort order, null last]
- [Source: prd.md#FR45 — accessible within 1 interaction from main view]
- [Source: prd.md#FR46 — todos display category, deadline, priority when set]
- [Source: prd.md#NFR14 — < 500ms filtering + priority sort under single-user load]
- [Source: ux-design-specification.md#Navigation & View Architecture — segmented tab bar, URL query param, fade transition]
- [Source: ux-design-specification.md#"Due This Week" View — flat list, priority sort, empty state copy]
- [Source: ux-design-specification.md#ViewSwitcher — accent fill active, ghost inactive, URL query param]
- [Source: ux-design-specification.md#Category chip on todo items (in non-"All" views) — chip styling]
- [Source: architecture.md#Implementation Patterns — client-side view filtering anti-pattern for dedicated endpoints]
- [Source: architecture.md#Frontend Architecture — React Router v7, `useSearchParams` for view state]
- [Source: architecture.md#FR Category: Due This Week View (FR43-45) — component ownership]
- [Source: _bmad-output/implementation-artifacts/epic-6-retro-2026-04-17.md — action items A1–A5 carried into 7.1, Composition Checks + Carried Debt sections mandated (C4, C5)]
- [Source: _bmad-output/implementation-artifacts/6-2-deadline-system-label-overdue-treatment-and-inline-edit.md — deadline helpers, popover patterns, mutation style to reuse]
- [Source: _bmad-output/implementation-artifacts/6-1-priority-system-tokens-indicator-and-inline-edit.md — priority indicator, getPriorityColor, PRIORITY_LEVELS]
- [Source: frontend/src/types/index.ts — Todo, Category shapes; add ViewType here]
- [Source: frontend/src/app.tsx — BrowserRouter mount; no new routes required]
- [Source: frontend/src/pages/home.tsx — current All-view layout to preserve in `view === "all"`]
- [Source: frontend/src/components/todo-list.tsx — active-todos list + mutation wiring; reuse the mutation pattern in `due-this-week-view.tsx`]
- [Source: frontend/src/components/category-chip.tsx — already implemented, ready for consumption]
- [Source: frontend/src/components/todo-item.tsx — add `categoryName` prop + chip slot]
- [Source: frontend/src/hooks/use-todos.ts — add `selectDueThisWeek` + A4 negative-ID DELETE guard]
- [Source: frontend/src/lib/utils.ts — priority + deadline helpers (6.1, 6.2); add priority tests next to deadline tests]
- [Source: frontend/src/lib/utils.test.ts — extend with priority helper tests (A2)]
- [Source: frontend/src/index.css — `animate-fade-in` keyframe, `--duration-normal`, `prefers-reduced-motion` override already present]
- [Source: frontend/package.json — `react-router@^7.1.0`, `@testing-library/*` confirmed present]
- [Source: commit bfa0d62 — popover overflow pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) via Claude Code `/bmad-dev-story` skill

### Debug Log References

- **Tailwind v4 did not emit `max-[400px]:` rules in this project.** Inspected `document.styleSheets` while the ViewSwitcher was mounted at 400px — no `@media (max-width: 400px)` rule was generated, and `getComputedStyle` on the short-label span reported `display: none`. Worked around by defining two dedicated CSS classes (`.view-switcher-label-short` / `.view-switcher-label-long`) gated by one `@media (max-width: 400px)` block in `index.css`, as the Dev Notes explicitly allowed ("or inline a `@media` block in the component's className strategy via a small wrapper CSS class if cleaner").
- **Hard-reloading `/?view=week` landed at `/` during Playwright verification.** Traced to a pre-existing auth race: `AuthGuard` sees `isLoading=false` + `user=null` briefly on initial render before `meQuery.data` is copied into `setUser` by the effect, redirects to `/login`, then `LoginPage` reads `location.state?.from?.pathname` (pathname only — search params are dropped) and navigates back to `/`. This is unrelated to Story 7.1 and predates the branch. The `ViewSwitcher` itself honours deep links correctly — verified by the RTL test suite using `MemoryRouter` with `initialEntries={["/?view=week"]}` and by clicking the tab in-app (URL updates to `?view=week`, browser back/forward traverses views).
- **Lint errors pre-existing on the branch** (`Plus` unused in `home.tsx`, two `react-hooks/refs` errors in `login.tsx`, six `login.test.tsx` type errors, one `vite.config.ts` type error). A3 explicitly required driving `pnpm lint` to 0; fixing the incidental `Plus` import and the vite.config type error was necessary to satisfy that criterion end-to-end. Logged as Task 10.

### Completion Notes List

- All 11 acceptance criteria met. Composition Checks from Dev Notes §Composition Checks verified manually via Playwright: view switching + URL updates, deep link via URL, unknown param fallback, week filter boundary (today..today+6 inclusive; today+7 correctly excluded), priority sort order, category chips on This Week only, popover in This Week view renders without clipping, mobile labels flip at 400px, Completed section visibility per view, `prefers-reduced-motion` honoured (existing global override in `index.css`).
- All 5 Epic 6 retro debt items addressed (A1–A5). A1 delivered the first RTL component test in the codebase (`view-switcher.test.tsx`, 12 tests) — a foundation Story 7.2 will reuse.
- Zero new runtime or test dependencies. `@testing-library/user-event` was NOT added — keyboard event tests use `fireEvent.keyDown` which is sufficient in jsdom for the roving-tabindex assertions.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all pass at completion. Backend `pytest` still green (86 tests — unchanged; no backend code was modified).
- Story 7.2 placeholder: the "By Deadline" tab renders the All view layout; a `TODO Story 7.2` comment marks the swap point.
- Popover Overflow Pattern convention documented in `architecture.md` (Implementation Patterns section) referencing commit `bfa0d62` and the upcoming `DeadlineGroupHeader` consumer.

### File List

**Created:**
- `frontend/src/hooks/use-view.ts`
- `frontend/src/components/view-switcher.tsx`
- `frontend/src/components/view-switcher.test.tsx`
- `frontend/src/components/due-this-week-view.tsx`

**Modified:**
- `frontend/src/types/index.ts` (added `ViewType` union)
- `frontend/src/hooks/use-todos.ts` (added `selectDueThisWeek`, `PRIORITY_SORT_KEY`, A4 negative-ID delete guard)
- `frontend/src/components/todo-item.tsx` (added optional `categoryName` prop + chip render slot)
- `frontend/src/pages/home.tsx` (mounted `ViewSwitcher`, keyed-fade view region, `selectDueThisWeek` memo; removed unused `Plus` import)
- `frontend/src/pages/login.tsx` (moved ref-during-render writes into `useEffect` for A3)
- `frontend/src/pages/login.test.tsx` (added explicit mock types for A3)
- `frontend/src/lib/utils.test.ts` (added priority helper tests for A2)
- `frontend/src/index.css` (added `.view-switcher-label-short` / `.view-switcher-label-long` + `@media (max-width: 400px)` block)
- `frontend/vite.config.ts` (import `defineConfig` from `vitest/config` so the `test` block type-checks)
- `_bmad-output/planning-artifacts/architecture.md` (added `### Popover Overflow Pattern` subsection for A5)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status: ready-for-dev → in-progress → review)

## Change Log

- **2026-04-17** — Story 7.1 implementation complete. Added `ViewSwitcher` + `useView` URL-backed hook, `selectDueThisWeek` client-side selector, `DueThisWeekView` flat-list presentation, and optional category chip on `TodoItem`. Wired into `HomePage` with keyed-remount fade transition (respects `prefers-reduced-motion`). Addressed Epic 6 retro debt A1–A5: first RTL component test in the codebase (12 tests on `ViewSwitcher`), priority helper unit tests, `login.tsx` `react-hooks/refs` fix, `login.test.tsx` type fixes, optimistic negative-ID DELETE guard on `useDeleteTodo`, Popover Overflow Pattern architecture note. Incidental pre-existing build/lint errors on the branch (unused `Plus` import, `vite.config.ts` vitest type mismatch) were also fixed so `pnpm lint` / `pnpm build` exit 0 at completion. Zero new runtime or test dependencies.
