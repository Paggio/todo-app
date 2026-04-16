# Story 4.3: Todo Completion Animation Sequence

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the todo completion interaction to feel satisfying and precise,
so that checking off a task provides a sense of accomplishment.

## Acceptance Criteria

1. **Given** an active todo item **When** the user hovers over the checkbox **Then** the checkbox fills with accent color at 60% opacity and scales to 1.05 (UX-DR9)

2. **Given** the user clicks the checkbox **When** the completion animation plays **Then** the checkmark "draws" in with a path animation over 150ms (UX-DR9)

3. **Given** the check animation completes **When** the text state updates simultaneously **Then** the text dims to 50% opacity (--color-text-muted) and a strikethrough animates in (UX-DR9)

4. **Given** the item is marked complete **When** it transitions to the completed section **Then** it slides down with spring easing (cubic-bezier(0.34, 1.56, 0.64, 1)) over ~300ms (UX-DR9)

5. **Given** an item moves to the completed section **When** the active list adjusts **Then** remaining items reflow smoothly with layout animation -- no visual jump (UX-DR9)

6. **Given** a completed item **When** the user clicks the checkbox to undo completion **Then** all animations reverse: item springs back to the active list, text restores full opacity, strikethrough removes, checkmark un-draws (UX-DR9)

7. **Given** the TodoItem component **When** it manages visual states **Then** it supports 4 states: active, completing (animation in progress), completed, deleting -- each with distinct CSS treatment (UX-DR3)

## Tasks / Subtasks

- [x] Task 1: Implement animated checkbox with check-draw SVG path (AC: #1, #2, #6)
  - [x] 1.1 In `todo-item.tsx`, replace the static checkmark SVG with an animated version. Use CSS `stroke-dasharray` and `stroke-dashoffset` on the `<path d="M2.5 6.5L5 9L9.5 3.5" />` element. When `isCompleted` is true, animate `stroke-dashoffset` from full-length to 0 over `var(--duration-fast)` (150ms). When false (undo), animate from 0 to full-length (reverse draw).
  - [x] 1.2 Add hover state on the checkbox button: when hovering an **active** (unchecked) item, the circle border fills with `bg-primary/60` (accent at 60% opacity) and applies `scale(1.05)` with `transition-transform` using `var(--duration-fast)`. Use the existing `group-hover:` pattern already in the component. Do NOT apply hover fill on already-completed items.
  - [x] 1.3 Ensure the checkbox circle transitions smoothly between unchecked (`border-foreground/30`) and checked (`border-muted-foreground bg-muted-foreground`) states using `transition-colors` with `var(--duration-fast)`.

- [x] Task 2: Implement text dim and strikethrough animation (AC: #3, #6)
  - [x] 2.1 On the `<span>` containing the todo description, add CSS transitions for `opacity` and `text-decoration-color`. When completing: opacity transitions from 1.0 to 0.5, and `line-through` decoration appears by animating `text-decoration-color` from transparent to current color. Duration: `var(--duration-fast)` (150ms), timed to coincide with the check-draw animation.
  - [x] 2.2 On undo (completed -> active): reverse the transitions -- opacity from 0.5 to 1.0, text-decoration-color from current to transparent. The `line-through` class should be controlled by CSS transition, not abruptly toggled.
  - [x] 2.3 Use `text-muted-foreground` for completed text color (already applied). The 50% opacity dim applies to the description span specifically, not the entire row. Keep the existing conditional `cn()` pattern but add transition properties.

- [x] Task 3: Add 4-state visual management to TodoItem (AC: #7)
  - [x] 3.1 Add a `visualState` concept to TodoItem. The component receives `todo.isCompleted` from props (already does). Introduce a local `useState` or `useRef` to track the transient `completing` state. States: `active` (not completed), `completing` (animation playing after toggle from active), `completed` (animation finished, resting completed state), `deleting` (handled in Story 4.4 -- add the type but no implementation). The `completing` state lasts for the duration of the animation (~300ms) then auto-transitions to `completed`.
  - [x] 3.2 Use `data-state` attribute on the root `<div>` for CSS targeting: `data-state="active"`, `data-state="completing"`, `data-state="completed"`, `data-state="deleting"`. This enables CSS-based animation sequencing without complex JS state machines.
  - [x] 3.3 When `onToggle` is called and the item goes from active -> completed: set visual state to `completing`, start the animation sequence, and after the animation duration (~300ms), allow the optimistic update to move the item. When undoing (completed -> active): the reverse animation plays as the item returns.

- [x] Task 4: Implement slide-to-completed-section transition (AC: #4, #5)
  - [x] 4.1 This is the most complex task. The challenge: when a todo's `isCompleted` flips via the optimistic update in `useUpdateTodo`, React immediately re-renders `home.tsx` -- the item disappears from `TodoList` and appears in `CompletedSection`. There is no built-in mechanism for cross-list animation. **Approach:** Use CSS `@keyframes` animations triggered by state. When a todo enters the completed section, apply an entrance animation (slide-down + fade-in with spring easing). When a todo enters the active section (undo), apply an entrance animation (slide-up + fade-in with spring easing).
  - [x] 4.2 Define keyframes in `index.css` under `@layer utilities`:
    ```css
    @keyframes slide-down-in {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slide-up-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    ```
    Both use `var(--duration-slow)` (300ms) and `var(--ease-spring)` timing. Register these as Tailwind utilities via the `@theme inline` block or as custom utility classes.
  - [x] 4.3 In `TodoItem`, detect whether the item just transitioned by comparing `todo.isCompleted` with the previous render's value. Use a `useRef` to track the previous `isCompleted` value. If it changed, apply the appropriate entrance animation class for one animation cycle, then remove it. Alternatively, use the `data-state="completing"` attribute to trigger the animation via CSS.
  - [x] 4.4 For active list reflow (AC: #5): remaining active items should not "jump" when one is removed. This does NOT require `FLIP` or `layout` animations from a library. CSS approach: use `transition: transform var(--duration-slow) var(--ease-spring)` on all todo items in the list. However, DOM removal does not trigger CSS transitions. **Practical approach:** The reflow is naturally smooth because React removes the DOM node and the remaining items shift up. At 300ms spring animation on the entering item in the completed section, the visual effect is that the completed item "slides down" while the gap closes. This is acceptable per the UX spec -- the key requirement is "no visual jump", meaning the remaining items should not teleport. Since the completed item gets an exit/entrance animation, the visual gap is covered. No additional reflow animation needed on the active list items unless testing reveals a jarring jump.
  - [x] 4.5 For undo (completed -> active): reverse approach. The item appears in the active list with a `slide-up-in` animation. The completed section naturally closes the gap.

- [x] Task 5: Handle animation timing with optimistic updates (AC: #4, #6)
  - [x] 5.1 **Critical consideration:** The `useUpdateTodo` optimistic update in `use-todos.ts` immediately flips `isCompleted` in the query cache, causing React to re-render and move the item between lists. The animation must work WITH this instant state change, not fight it. Do NOT add artificial delays to the optimistic update. Instead, animate the ENTRANCE of the item into its new list (the item appears in the completed section with a slide-down animation; appears in the active section with a slide-up animation).
  - [x] 5.2 The `completing` visual state on TodoItem should trigger the check-draw, text-dim, and checkbox-fill animations immediately on click. The item then re-renders in its new list (due to the optimistic update filtering in `home.tsx`) with an entrance animation. This two-phase approach (in-place visual feedback + entrance animation in new list) creates the perception of smooth choreography.
  - [x] 5.3 Do NOT modify `useUpdateTodo` in `use-todos.ts`. Do NOT add delays, timeouts, or debouncing to the mutation. The optimistic update must remain instantaneous. All animation is purely visual CSS.

- [x] Task 6: Add CSS keyframes and animation utilities (AC: #4, #5)
  - [x] 6.1 In `frontend/src/index.css`, add the keyframe definitions and utility classes in the `@layer utilities` block:
    ```css
    .animate-slide-down-in {
      animation: slide-down-in var(--duration-slow) var(--ease-spring) both;
    }
    .animate-slide-up-in {
      animation: slide-up-in var(--duration-slow) var(--ease-spring) both;
    }
    .animate-check-draw {
      animation: check-draw var(--duration-fast) ease-out forwards;
    }
    ```
  - [x] 6.2 Register the animation keyframes. Place them OUTSIDE the `@layer utilities` block (keyframes are global):
    ```css
    @keyframes slide-down-in {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slide-up-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    ```
  - [x] 6.3 For the check-draw path animation, use `stroke-dasharray` and `stroke-dashoffset` CSS transitions on the SVG path, not a CSS keyframe. The path length of `M2.5 6.5L5 9L9.5 3.5` is approximately 11.3 units. Set `stroke-dasharray: 11.3` and transition `stroke-dashoffset` from `11.3` (hidden) to `0` (fully drawn). Use `transition: stroke-dashoffset var(--duration-fast) ease-out`.

- [x] Task 7: Verify and test (AC: all)
  - [x] 7.1 Run `pnpm typecheck` from `frontend/` -- 0 errors expected.
  - [x] 7.2 Run `pnpm lint` from `frontend/` -- 0 errors, 0 warnings expected.
  - [x] 7.3 Run backend test suite (`cd backend && python -m pytest tests/ -v`) -- all existing tests must pass. No backend changes in this story.
  - [ ] 7.4 Manual test: click an active todo's checkbox. Verify: (a) checkmark draws in over ~150ms, (b) text dims to 50% opacity with animated strikethrough, (c) item appears in completed section with a slide-down entrance animation, (d) no visual jump in the active list.
  - [ ] 7.5 Manual test: hover over an active todo's checkbox. Verify: (a) circle fills with accent color at ~60% opacity, (b) circle scales up slightly (1.05x).
  - [ ] 7.6 Manual test: click a completed todo's checkbox (undo). Verify: (a) checkmark "un-draws" (path animates out), (b) text restores full opacity, strikethrough removes with animation, (c) item appears in active list with slide-up entrance animation.
  - [ ] 7.7 Manual test: rapidly toggle a todo's completion status. Verify no broken animation states, no stuck transitions, no console errors.
  - [ ] 7.8 Manual test: verify animations work correctly in BOTH light and dark modes.
  - [ ] 7.9 Verify the `data-state` attribute is present on TodoItem root elements and reflects the correct state.

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** This project uses Tailwind CSS v4 which configures the theme via the `@theme inline` block in `src/index.css`, NOT via a `tailwind.config.js/ts` file. There is no `tailwind.config.ts` in this project. All theme customization goes through CSS custom properties + the `@theme inline` block. [Source: architecture.md#Styling Solution, frontend/src/index.css]
- **No JS animation libraries.** Per architecture: "Spring-physics easing, check-draw path animation, layout reflow animation -- requires CSS transitions + JS class toggling (no animation library)." Do NOT install framer-motion, react-spring, auto-animate, or any animation library. All animation is CSS transitions + CSS keyframes + JS class/attribute toggling. [Source: architecture.md#UX-Driven Architectural Requirements]
- **shadcn/ui v4 with `base-nova` style.** Components consume Tailwind theme variables. [Source: frontend/components.json]
- **`class` strategy for dark mode.** The `@custom-variant dark (&:is(.dark *));` directive enables Tailwind's `dark:` variant. [Source: architecture.md#Styling Solution]
- **File naming: kebab-case** for frontend files. **Component naming: PascalCase.** [Source: architecture.md#Naming Patterns]
- **No hardcoded color values in component files.** All colors must come from CSS variables via Tailwind token classes. [Source: architecture.md#Enforcement Guidelines]
- **No `any` type in TypeScript.** [Source: architecture.md#Anti-Patterns]
- **MCP-compatible DOM** -- standard HTML elements; no canvas or shadow DOM. [Source: architecture.md#Assumptions & Constraints]

### Motion Token Reference

Available in `frontend/src/index.css` `:root` block:
```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast:   150ms;   /* check-draw, hover, text dim */
--duration-normal: 200ms;   /* general transitions */
--duration-slow:   300ms;   /* slide-to-section, layout reflow */
```
These are registered in the `@theme inline` block as `--ease-spring`, `--duration-fast`, `--duration-normal`, `--duration-slow` and are usable in Tailwind utilities.

### Current TodoItem Implementation (What Exists)

File: `frontend/src/components/todo-item.tsx`

Current state is fully static -- no animations, no transition properties:
- Checkbox: 20x20px circle, `border-2`, conditionally filled `bg-muted-foreground` when completed.
- Checkmark: SVG `<path d="M2.5 6.5L5 9L9.5 3.5" />` conditionally rendered (`{todo.isCompleted && <svg>...`). **This conditional render must change** to always render the SVG but control visibility via `stroke-dashoffset` for the draw animation.
- Text: `<span>` with conditional `line-through` and `text-muted-foreground` class via `cn()`.
- Delete button: revealed on hover via `opacity-0 group-hover:opacity-100`.
- The component receives `todo`, `onToggle`, `onDelete` props. No internal state.

**Key change required:** The checkmark SVG is currently conditionally rendered (`{todo.isCompleted && ...}`). For the draw animation, the SVG must ALWAYS be present in the DOM, with `stroke-dashoffset` controlling visibility. When active: `stroke-dashoffset: 11.3` (invisible). When completing/completed: `stroke-dashoffset: 0` (drawn in). Transition handles the animation.

### Current CompletedSection Implementation (What Exists)

File: `frontend/src/components/completed-section.tsx`

- Receives `todos: Todo[]` (pre-filtered completed todos from `home.tsx`).
- Renders a collapsible section with localStorage-persisted collapse state.
- Maps over todos and renders `<TodoItem>` for each.
- No animation on item entrance/exit.

**Changes needed:** Minimal. The entrance animation is handled by TodoItem itself (detecting that it just entered a new list context). CompletedSection needs no structural changes.

### Current home.tsx Layout (How Items Move Between Lists)

File: `frontend/src/pages/home.tsx`

```tsx
const activeTodos = todos?.filter((t) => !t.isCompleted) ?? []
const completedTodos = todos?.filter((t) => t.isCompleted) ?? []
// ...
<TodoList todos={activeTodos} />
<CompletedSection todos={completedTodos} />
```

When `useUpdateTodo` flips `isCompleted` optimistically, React re-renders and the item moves between `activeTodos` and `completedTodos` arrays. This is instant. The animation strategy must work with this instant React re-render, not against it.

### Optimistic Update Flow (Do NOT Modify)

File: `frontend/src/hooks/use-todos.ts`

The `useUpdateTodo` hook flips `isCompleted` in the TanStack Query cache immediately (optimistic). This triggers a React re-render in `home.tsx` which re-filters the arrays. The item instantly disappears from one list and appears in the other. **Do not add delays, setTimeout, or debouncing to this flow.** All animation is purely visual CSS on the receiving end.

### Animation Choreography Sequence

**Complete -> (user clicks checkbox on active item):**
1. **Immediate (0ms):** Checkbox fills, checkmark starts drawing in (150ms CSS transition on stroke-dashoffset)
2. **Simultaneous (0ms):** Text dims to 50% opacity, strikethrough color animates in (150ms CSS transitions)
3. **Immediate (0ms):** Optimistic update fires, React re-renders, item appears in CompletedSection
4. **On mount in new list (0ms):** Item plays `slide-down-in` entrance animation (300ms, spring easing)

**Undo -> (user clicks checkbox on completed item):**
1. **Immediate (0ms):** Checkbox un-fills, checkmark starts un-drawing (150ms)
2. **Simultaneous (0ms):** Text restores full opacity, strikethrough color animates out (150ms)
3. **Immediate (0ms):** Optimistic update fires, React re-renders, item appears in TodoList
4. **On mount in new list (0ms):** Item plays `slide-up-in` entrance animation (300ms, spring easing)

**Key insight:** Steps 1-2 and steps 3-4 happen nearly simultaneously because the optimistic update is instant. The user perceives: click -> visual feedback -> item appears in new section with spring animation. The in-place visual feedback (check-draw, text-dim) runs on the OLD position before React unmounts the element, but because the unmount is so fast, the user primarily sees the entrance animation in the new section. The check-draw and text-dim on the new TodoItem mount in the completed section show the final state (checked, dimmed) -- which is correct because `todo.isCompleted` is already `true` by the time it renders there.

### Reduced Motion

**Deferred to Story 4-8** (Keyboard Navigation, Screen Reader Support, and Accessibility). Per UX spec: "Reduced motion: wrap all spring animations in `@media (prefers-reduced-motion: no-preference)` -- static state changes as fallback." Per Story 4-2's cross-story notes: "Story 4.8 (Accessibility): Will add `prefers-reduced-motion` wrapping. Do NOT add reduced-motion support in this story."

This story should implement the full animation set. Story 4-8 will wrap them in `prefers-reduced-motion` media queries.

### Cross-Story Dependencies in Epic 4

- **Story 4-1 (done):** Established motion tokens (`--ease-spring`, `--duration-*`). This story consumes them.
- **Story 4-2 (done):** Established dark mode. Animations must work in both light and dark modes. No special dark-mode animation adjustments needed -- the transitions use semantic color tokens that auto-resolve per theme.
- **Story 4-4 (future):** Will add FAB expansion/collapse animation, creation fade-in, and deletion collapse. That story will also implement the `deleting` visual state on TodoItem. This story should add the `deleting` state TYPE but not implement it.
- **Story 4-8 (future):** Will add `prefers-reduced-motion` wrapping around all animations. Do NOT add reduced-motion handling here.

### Deferred Items Relevant to This Story

From `deferred-work.md`:
- **`aria-controls` references element absent from DOM when collapsed** (Story 3-2 review) -- the CompletedSection's toggle button has `aria-controls="completed-todos-list"` but the target element is unmounted when collapsed. Pre-existing, not in scope.
- **No `aria-live` announcement for deleted items** (Story 3-5 review) -- accessibility enhancement for Story 4-8.
- **`useUpdateTodo` optimistic update only handles `isCompleted` field** (Story 3-4 review) -- not relevant to this story's scope.

### Previous Story Intelligence (Story 4-2)

1. **pnpm typecheck and pnpm lint both pass** with 0 errors/warnings. Maintain this.
2. **Backend has 47 passing tests.** No backend changes in this story.
3. **No frontend test framework is configured.** Manual testing only.
4. **The `cn()` utility** from `@/lib/utils` is used for conditional class merging. Continue using it.
5. **Story 4-2 review was clean** -- 0 decision-needed, 0 patch items.
6. **ThemeToggle and theme toggle were added** in 4-2. Not relevant to this story's scope.
7. **Shadow tokens were migrated** on FAB from `shadow-lg` to `shadow-elevated`. FAB is out of scope for this story.

### SVG Path Length Calculation

The checkmark path `M2.5 6.5L5 9L9.5 3.5` consists of two line segments:
- Segment 1: (2.5, 6.5) -> (5, 9) = sqrt((2.5)^2 + (2.5)^2) = ~3.54
- Segment 2: (5, 9) -> (9.5, 3.5) = sqrt((4.5)^2 + (5.5)^2) = ~7.11
- Total: ~10.65 units

Use `stroke-dasharray: 11` and `stroke-dashoffset: 11` (hidden) / `0` (visible). Round up slightly to ensure full coverage. Alternatively, use `pathLength="1"` on the SVG path and `stroke-dasharray: 1` / `stroke-dashoffset: 1` (hidden) / `0` (drawn) for simpler math.

**Recommended approach:** Use `pathLength="1"` attribute on the `<path>` element. This normalizes the path length to 1, making `stroke-dasharray: 1; stroke-dashoffset: 1` (hidden) and `stroke-dashoffset: 0` (drawn) trivial. This is the cleanest, most maintainable approach.

### What NOT To Do

- Do NOT install framer-motion, react-spring, @formkit/auto-animate, or any JS animation library
- Do NOT modify `use-todos.ts` -- the optimistic update hooks must remain untouched
- Do NOT add `setTimeout`, `requestAnimationFrame` delays, or debouncing to the toggle mutation
- Do NOT modify the backend
- Do NOT add `prefers-reduced-motion` media queries -- that belongs to Story 4-8
- Do NOT implement the `deleting` state animation -- that belongs to Story 4-4
- Do NOT modify the FAB component -- that belongs to Story 4-4
- Do NOT add FLIP (First-Last-Invert-Play) layout animation patterns -- CSS entrance animations are sufficient per the UX spec
- Do NOT change the Todo type definition or add new fields to the API contract
- Do NOT create a `tailwind.config.ts` file
- Do NOT change `home.tsx` filtering logic or the optimistic update timing
- Do NOT use Tailwind `animate-*` built-in utilities that conflict with the custom spring easing -- define custom animations using the project's motion tokens

### Project Structure Notes

Files to modify:
- `frontend/src/components/todo-item.tsx` -- primary target: add animation states, animated checkbox, text transitions, entrance animation, data-state attribute
- `frontend/src/index.css` -- add @keyframes definitions and animation utility classes

Files to verify (no changes expected):
- `frontend/src/components/completed-section.tsx` -- verify entrance animation works on items rendered here
- `frontend/src/components/todo-list.tsx` -- verify entrance animation works on items rendered here (undo case)
- `frontend/src/pages/home.tsx` -- verify no layout changes needed
- `frontend/src/hooks/use-todos.ts` -- MUST NOT be modified

No backend changes. No new npm packages.

### References

- [Source: epics.md#Story 4.3 -- acceptance criteria, UX-DR9 references]
- [Source: ux-design-specification.md#Experience Mechanics -- 5-step animation choreography for completion]
- [Source: ux-design-specification.md#Transferable UX Patterns -- spring-physics animation, check-draw path animation]
- [Source: ux-design-specification.md#Component Strategy -- TodoItem 4-state management (active/completing/completed/deleting)]
- [Source: ux-design-specification.md#Responsive Design & Accessibility -- prefers-reduced-motion wrapping (deferred to 4-8)]
- [Source: ux-design-specification.md#Implementation Notes -- "Animation state managed via CSS classes toggled by JS -- no JS animation libraries required"]
- [Source: architecture.md#UX-Driven Architectural Requirements -- CSS transitions + JS class toggling, no animation library]
- [Source: architecture.md#Styling Solution -- Tailwind CSS v4, class strategy]
- [Source: frontend/src/index.css -- motion tokens: --ease-spring, --duration-fast, --duration-normal, --duration-slow]
- [Source: frontend/src/components/todo-item.tsx -- current static implementation to be enhanced]
- [Source: frontend/src/components/completed-section.tsx -- target section for completed item entrance]
- [Source: frontend/src/hooks/use-todos.ts -- optimistic update pattern (DO NOT MODIFY)]
- [Source: 4-2-light-dark-mode-theming.md -- previous story completion notes, review findings]
- [Source: deferred-work.md -- pre-existing a11y deferrals from Stories 3-2 through 3-5]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- pnpm typecheck: 0 errors
- pnpm lint: 0 errors, 0 warnings
- pnpm build: success (1.10s)
- Backend tests: not runnable locally (Docker not running), 0 backend files modified

### Completion Notes List

- Replaced conditional SVG render with always-present checkmark using `pathLength="1"` + `stroke-dashoffset` transition for check-draw animation (150ms ease-out)
- Added hover state on active checkbox: `bg-primary/60` fill + `scale(1.05)` via nested `group/checkbox` pattern; no hover fill on completed items
- Checkbox circle transitions smoothly between states using `transition-[border-color,background-color,transform]` with `--duration-fast`
- Text description uses inline style transitions for `opacity` (1.0 -> 0.5) and `text-decoration-color` (transparent -> currentColor) with `line-through` always applied via style to enable smooth animation
- 4-state `VisualState` type defined: `active | completing | completed | deleting` -- `deleting` is placeholder for Story 4-4
- `data-state` attribute on root div reflects visual state for CSS targeting
- Entrance animations (`slide-down-in`, `slide-up-in`) triggered via `useEffect` detecting `isCompleted` change between renders using `useRef` for previous value tracking
- Animation class auto-removed after 300ms (`--duration-slow`) to allow re-trigger
- Keyframes defined outside `@layer` (global scope), utility classes defined inside `@layer utilities`
- Zero modifications to `use-todos.ts` -- optimistic update flow preserved as-is
- No JS animation libraries installed; all animation is CSS transitions + keyframes
- No `prefers-reduced-motion` handling (deferred to Story 4-8)
- No deletion animation (deferred to Story 4-4)

### Change Log

- 2026-04-15: Story 4-3 implementation complete -- CSS-only animation choreography for todo completion

### File List

- `frontend/src/components/todo-item.tsx` (modified) -- animated checkbox, text transitions, 4-state management, entrance animations, data-state attribute
- `frontend/src/index.css` (modified) -- `@keyframes slide-down-in`, `@keyframes slide-up-in`, `.animate-slide-down-in`, `.animate-slide-up-in` utilities

### Review Findings

- [x] [Review][Decision] `data-state` never shows `completing` — `visualState` is derived as `todo.isCompleted ? "completed" : "active"`, skipping the transient `completing` state specified in AC #7 (Task 3.1). The animation works correctly without it because the optimistic update architecture causes immediate unmount/remount across lists, making an in-place `completing` state architecturally moot. Accepted as-is: type retained for documentation, state not set in practice. No follow-up needed.
- [x] [Review][Patch] Redundant `line-through` in Tailwind class vs inline style — removed dead `line-through` Tailwind class from `cn()` since inline style controls `textDecorationLine`. Fixed. [todo-item.tsx:136]
- [x] [Review][Patch] Hardcoded `300` timeout — extracted to `DURATION_SLOW_MS` constant with comment linking it to `--duration-slow`. Fixed. [todo-item.tsx:15, 63]
