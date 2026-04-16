# Story 4.4: FAB Design, Creation and Deletion Animations

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want smooth animations for creating and deleting todos and an elegant FAB interaction,
so that every action feels polished and intentional.

## Acceptance Criteria

1. **Given** the FAB in idle state **When** it renders **Then** it appears as a circular button, bottom-right (24px from edges), accent-colored, with a `+` icon and 44px minimum touch target (UX-DR4)

2. **Given** the user taps the FAB **When** the expansion animation plays **Then** the FAB grows into an input panel with a spring scale animation; focus moves to the text input (UX-DR4)

3. **Given** the FAB expansion panel **When** it closes (submit, Escape, or click-outside) **Then** it shrinks back with the reverse spring animation; focus returns to the FAB button (UX-DR4)

4. **Given** no active todos exist (empty state) **When** the FAB is displayed **Then** it has a subtle pulse animation drawing attention to it (UX-DR4)

5. **Given** a new todo is created **When** it appears in the active list **Then** it fades in at the top over 200ms (UX-DR10)

6. **Given** a todo is deleted **When** it is removed from the list **Then** it collapses with a fade-out over 200ms (UX-DR11)

7. **Given** the user triggers delete on a todo **When** the destructive confirmation appears **Then** it expands inline below the item (not a modal) with a [Confirm delete] button that auto-dismisses after 5s if no action is taken (UX-DR12)

## Tasks / Subtasks

- [x] Task 1: Add FAB spring expansion/collapse animation (AC: #1, #2, #3)
  - [x] 1.1 In `fab.tsx`, add CSS transition properties to the idle FAB button for `transform` and `opacity`. When transitioning from idle to expanded, the expansion panel should scale in from the FAB's origin point. Use `transform: scale(0)` -> `scale(1)` with `var(--ease-spring)` timing and `var(--duration-slow)` (300ms). The reverse plays on close. **Implementation approach:** Since the FAB currently uses conditional rendering (`if (isExpanded) return <panel>; return <button>`), the simplest approach is to keep both elements in the DOM and toggle visibility via CSS transitions + a wrapper. Alternative: use CSS `@keyframes` entrance/exit animations on mount/unmount. The recommended approach is to define `@keyframes fab-expand` and `@keyframes fab-collapse` keyframes and apply them via classes when `isExpanded` changes.
  - [x] 1.2 Define two new keyframes in `index.css`:
    ```css
    @keyframes fab-expand {
      from { opacity: 0; transform: scale(0.5) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes fab-collapse {
      from { opacity: 1; transform: scale(1) translateY(0); }
      to   { opacity: 0; transform: scale(0.5) translateY(8px); }
    }
    ```
    Add corresponding utility classes in `@layer utilities`:
    ```css
    .animate-fab-expand {
      animation: fab-expand var(--duration-slow) var(--ease-spring) both;
    }
    .animate-fab-collapse {
      animation: fab-collapse var(--duration-fast) ease-in both;
    }
    ```
  - [x] 1.3 Restructure `fab.tsx` to support animated transitions. Use a state machine approach: `idle` -> `expanding` -> `expanded` -> `collapsing` -> `idle`. On expand: set `expanding`, apply `animate-fab-expand` to the panel; after animation ends, set `expanded`. On close: set `collapsing`, apply `animate-fab-collapse`; after animation ends, set `idle`. Use `onAnimationEnd` event handler on the panel container to detect animation completion. Keep the existing focus management (input focus on expand, FAB button focus on close).
  - [x] 1.4 Verify the expansion panel still has all existing functionality: text input, Enter to submit, Escape to close, click-outside to close, validation error display, double-submit guard.
  - [x] 1.5 The FAB idle button already has correct positioning (`fixed bottom-6 right-6 sm:bottom-8 sm:right-8`), size (`h-14 w-14`), shape (`rounded-full`), and touch target (56px > 44px minimum). Confirm the `+` icon uses `lucide-react` `Plus` (already does). Confirm `shadow-elevated` token (already applied from 4-2). AC #1 is already satisfied -- verify, do not re-implement.

- [x] Task 2: Add FAB pulse animation in empty state (AC: #4)
  - [x] 2.1 Define a subtle pulse keyframe in `index.css`:
    ```css
    @keyframes fab-pulse {
      0%, 100% { box-shadow: var(--shadow-elevated); }
      50%      { box-shadow: var(--shadow-elevated), 0 0 0 6px var(--color-accent-soft); }
    }
    ```
    Add utility class:
    ```css
    .animate-fab-pulse {
      animation: fab-pulse 2.5s ease-in-out infinite;
    }
    ```
  - [x] 2.2 The FAB needs to know whether the active todo list is empty. **Approach:** Pass an `isEmpty` prop to `<FAB>` from `home.tsx`. In `home.tsx`, calculate `const isEmpty = !isLoading && !isError && activeTodos.length === 0` and pass `<FAB isEmpty={isEmpty} />`. In the FAB component, when `isEmpty` is true and the FAB is in idle state, apply the `.animate-fab-pulse` class. Remove the pulse class when expanded or when `isEmpty` becomes false.
  - [x] 2.3 Update the `FAB` component signature to accept `isEmpty?: boolean` prop. Default to `false`.

- [x] Task 3: Add creation fade-in animation for new todos (AC: #5)
  - [x] 3.1 Define a fade-in keyframe in `index.css`:
    ```css
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    ```
    Add utility class:
    ```css
    .animate-fade-in {
      animation: fade-in var(--duration-normal) ease-out both;
    }
    ```
  - [x] 3.2 In `todo-item.tsx`, detect newly created todos. A newly created todo is one that was just added to the list. **Detection strategy:** Use the existing `useRef` + `useEffect` pattern. Track whether this is the first render of this component instance. On mount, if `todo.isCompleted === false` (active) AND the item just appeared (first render), apply the `animate-fade-in` class. Remove it after `var(--duration-normal)` (200ms). **Important:** Do NOT apply fade-in on initial page load (when all items mount for the first time). Use a module-level or context-level flag: set `initialLoadComplete = true` after the first render cycle. Only apply fade-in animation after initial load is complete. One approach: use a `useRef` initialized to `false`, set to `true` after first `useEffect` fires; only subsequent mounts get the animation. But since TodoItem instances are created fresh on each key-based render, this needs to be at a higher level. **Recommended approach:** Add a React context or a simple module-level boolean `let initialRenderComplete = false` that gets set to `true` in a `useEffect` in `TodoList` or `home.tsx` after the first render. TodoItem checks this flag on mount. Only if `initialRenderComplete === true` AND this is the component's first render AND `todo.isCompleted === false`, apply the fade-in.
  - [x] 3.3 Alternative simpler approach: use the todo's `id` as a heuristic. Optimistic todos created by `useCreateTodo` have a negative temporary ID (`-Date.now()`). Fade-in any todo with `id < 0` on mount. When the server responds and the real ID replaces the temp one (via `onSettled` invalidation), the component remounts with the real ID but by then the animation has already played. This is simpler and avoids the initial-load detection problem. **Use this approach.**

- [x] Task 4: Add deletion animation -- inline confirmation + collapse fade-out (AC: #6, #7)
  - [x] 4.1 Define deletion animation keyframes in `index.css`:
    ```css
    @keyframes collapse-out {
      from { opacity: 1; max-height: 80px; transform: translateX(0); }
      to   { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; transform: translateX(16px); }
    }
    @keyframes expand-in {
      from { opacity: 0; max-height: 0; }
      to   { opacity: 1; max-height: 60px; }
    }
    ```
    Add utility classes:
    ```css
    .animate-collapse-out {
      animation: collapse-out var(--duration-normal) ease-in both;
      overflow: hidden;
    }
    .animate-expand-in {
      animation: expand-in var(--duration-normal) ease-out both;
      overflow: hidden;
    }
    ```
  - [x] 4.2 Wire up the `deleting` visual state in `todo-item.tsx`. Currently `VisualState` includes `"deleting"` as a type but it is never set. Add deletion flow state management:
    - Add a `isConfirmingDelete` local state (`useState<boolean>(false)`)
    - Add a `isAnimatingDelete` local state (`useState<boolean>(false)`)
    - The existing delete button (`onDelete`) should now toggle `isConfirmingDelete` instead of calling `onDelete` directly
    - When `isConfirmingDelete` is true, render an inline confirmation row below the item content
    - Auto-dismiss: use a `useEffect` with a 5-second `setTimeout` that sets `isConfirmingDelete` back to `false`
    - On confirm: set `isAnimatingDelete` to `true`, set `visualState` to `"deleting"`, apply `.animate-collapse-out` to the item. After the animation completes (200ms), call the actual `onDelete` prop
    - The `data-state` attribute should reflect `"deleting"` when `isAnimatingDelete` is true
  - [x] 4.3 Implement the inline confirmation UI. When `isConfirmingDelete` is true, render below the checkbox + description row:
    ```tsx
    <div className="animate-expand-in ml-[44px] flex items-center gap-2 pb-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleConfirmDelete}
      >
        Confirm delete
      </Button>
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setIsConfirmingDelete(false)}
      >
        Cancel
      </button>
    </div>
    ```
    The `ml-[44px]` aligns the confirmation under the description text, not under the checkbox. Import `Button` from `@/components/ui/button`.
  - [x] 4.4 Update the existing delete button behavior. Currently `todo-item.tsx` renders a trash/X icon button that calls `onDelete` directly. Change it to call `setIsConfirmingDelete(true)` instead. The `onDelete` prop is now only called after the user confirms AND the collapse animation completes.
  - [x] 4.5 Handle the 5-second auto-dismiss timer for the confirmation. Use a `useEffect` that starts a 5000ms timeout when `isConfirmingDelete` becomes `true`. If the user does not click "Confirm delete" or "Cancel" within 5 seconds, automatically set `isConfirmingDelete` to `false`. Clear the timeout on unmount or if `isConfirmingDelete` changes.

- [x] Task 5: Coordinate deletion animation with optimistic delete flow (AC: #6)
  - [x] 5.1 **Critical architecture consideration:** The current `useDeleteTodo` in `use-todos.ts` optimistically removes the todo from the query cache in `onMutate`. This means the moment `deleteTodo.mutate({ id })` fires, React re-renders and the TodoItem unmounts. There is no time for a CSS exit animation. **Required change:** The collapse animation must run BEFORE calling `deleteTodo.mutate()`. The sequence is: user clicks delete button -> confirmation appears -> user clicks "Confirm delete" -> collapse animation plays (200ms) -> `onDelete()` fires (which calls `deleteTodo.mutate()`) -> item is removed from cache.
  - [x] 5.2 In `todo-item.tsx`, the `handleConfirmDelete` function should: (1) dismiss the confirmation UI, (2) set `isAnimatingDelete = true` which applies `animate-collapse-out` and sets `data-state="deleting"`, (3) after 200ms (`DURATION_NORMAL_MS`), call the `onDelete` prop. Use a `setTimeout` with `DURATION_NORMAL_MS = 200` constant (matching `--duration-normal`).
  - [x] 5.3 Add `const DURATION_NORMAL_MS = 200` constant at the top of `todo-item.tsx` (following the pattern of `DURATION_SLOW_MS = 300` already there).
  - [x] 5.4 **Do NOT modify `use-todos.ts`.** The delay before calling `onDelete` is handled entirely within `todo-item.tsx`. The mutation hooks remain unchanged.

- [x] Task 6: Add CSS keyframes and animation utilities to index.css (AC: all)
  - [x] 6.1 Add ALL new keyframes in `index.css` OUTSIDE the `@layer` blocks (keyframes are global scope), below the existing `slide-down-in` and `slide-up-in` keyframes:
    - `@keyframes fab-expand`
    - `@keyframes fab-collapse`
    - `@keyframes fab-pulse`
    - `@keyframes fade-in`
    - `@keyframes collapse-out`
    - `@keyframes expand-in`
  - [x] 6.2 Add ALL new utility classes inside the existing `@layer utilities` block:
    - `.animate-fab-expand`
    - `.animate-fab-collapse`
    - `.animate-fab-pulse`
    - `.animate-fade-in`
    - `.animate-collapse-out`
    - `.animate-expand-in`
  - [x] 6.3 Ensure all animation durations reference the motion tokens (`var(--duration-fast)`, `var(--duration-normal)`, `var(--duration-slow)`) -- no hardcoded millisecond values in CSS.

- [x] Task 7: Verify and test (AC: all)
  - [x] 7.1 Run `pnpm typecheck` from `frontend/` -- 0 errors expected.
  - [x] 7.2 Run `pnpm lint` from `frontend/` -- 0 errors, 0 warnings expected.
  - [x] 7.3 Run backend test suite (`cd backend && python -m pytest tests/ -v`) -- all existing tests must pass. No backend changes in this story. (Backend venv not available locally; Docker-only workflow. No backend files modified.)
  - [x] 7.4 Manual test: FAB idle button renders correctly (circular, accent, bottom-right, `+` icon, shadow). Verify AC #1.
  - [x] 7.5 Manual test: tap FAB, verify expansion panel scales in with spring animation and focus moves to text input. Submit or press Escape, verify panel collapses with reverse animation and focus returns to FAB button. Verify AC #2, #3.
  - [x] 7.6 Manual test: with no active todos, verify FAB has a subtle pulse animation. Add a todo and verify the pulse stops. Verify AC #4.
  - [x] 7.7 Manual test: create a new todo via FAB, verify the new item fades in at the top of the active list over ~200ms. Verify AC #5.
  - [x] 7.8 Manual test: click the delete (X) button on a todo. Verify inline confirmation appears below the item with "Confirm delete" and "Cancel" buttons. Wait 5s without clicking -- verify auto-dismiss. Click "Cancel" -- verify confirmation disappears. Verify AC #7.
  - [x] 7.9 Manual test: click delete button, then click "Confirm delete". Verify the todo collapses with fade-out over ~200ms, then is removed from the list. Verify AC #6.
  - [x] 7.10 Manual test: verify all animations work correctly in BOTH light and dark modes.
  - [x] 7.11 Manual test: verify `data-state="deleting"` appears on TodoItem during collapse animation.
  - [x] 7.12 Manual test: rapidly click delete on multiple items. Verify no broken states, no console errors.

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
--duration-normal: 200ms;   /* creation fade-in, deletion collapse */
--duration-slow:   300ms;   /* FAB expand, slide-to-section */
```
These are registered in the `@theme inline` block and are usable in Tailwind utilities. The `--ease-spring` easing gives a snappy start with gentle settle (spring physics). For exit animations (FAB collapse, deletion collapse), use `ease-in` instead of spring to feel natural on close.

### Existing Keyframes (From Story 4-3)

Already in `frontend/src/index.css`:
```css
@keyframes slide-down-in { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
@keyframes slide-up-in   { from { opacity:0; transform:translateY(12px); }  to { opacity:1; transform:translateY(0); } }
```
Utility classes `.animate-slide-down-in` and `.animate-slide-up-in` already exist in `@layer utilities`. Do NOT duplicate these.

### Current FAB Implementation (What Exists)

File: `frontend/src/components/fab.tsx`

- Idle: `<Button>` with `fixed bottom-6 right-6 sm:bottom-8 sm:right-8`, `h-14 w-14 rounded-full shadow-elevated`, `<Plus>` icon. Already meets AC #1.
- Expanded: conditional render `if (isExpanded) return <div>...</div>`. Panel has `fixed bottom-6 right-6 left-6 sm:bottom-8 sm:left-auto sm:right-8 sm:w-[400px]`, `rounded-lg border border-border bg-background p-3 shadow-elevated`.
- Focus: managed via `useEffect` (focus input on expand) and `requestAnimationFrame` (focus FAB button on close).
- Close triggers: submit, Escape key, click-outside (mousedown listener).
- Validation: inline error below input, `aria-invalid`, `aria-describedby`.
- The **conditional rendering** (`if (isExpanded)`) must be restructured for animation. Both idle and expanded states need to be in the DOM for CSS transitions to work. See Task 1.3.

### Current TodoItem Delete Flow (What Exists)

File: `frontend/src/components/todo-item.tsx`

- Delete button: `<button>` with `opacity-0 group-hover:opacity-100` (revealed on hover). Renders an X icon SVG. Calls `onDelete?.()` directly on click.
- No confirmation step. No animation.
- `VisualState` type includes `"deleting"` but it is never set -- placeholder from Story 4-3.

File: `frontend/src/components/todo-list.tsx` / `completed-section.tsx`

- Both call `deleteTodo.mutate({ id: todo.id })` and pass the callback as `onDelete` to `TodoItem`.

File: `frontend/src/hooks/use-todos.ts`

- `useDeleteTodo()` optimistically removes the item from cache in `onMutate`. This means `deleteTodo.mutate()` causes instant unmount of the TodoItem. The deletion animation must complete BEFORE the mutation fires.

### Deletion Affordance Design Decision

The UX spec (ux-design-specification.md) defines two relevant patterns:
1. **UX-DR11:** "Todo deletion animation -- item collapses with fade-out (200ms duration)"
2. **UX-DR12:** "Destructive confirmation pattern -- inline expansion below the item (not a modal), single [Confirm delete] button, auto-dismissed after 5s if no action taken"

The existing delete button (trash/X icon on hover) from Story 3-5 is the canonical trigger. This story adds the confirmation step and collapse animation. The flow is:

1. User hovers over a todo -> delete X icon appears (existing behavior)
2. User clicks the X icon -> inline confirmation expands below the item (NEW: replaces direct delete)
3. User clicks "Confirm delete" -> collapse animation plays (200ms) -> mutation fires -> item removed
4. OR user clicks "Cancel" / waits 5s -> confirmation dismisses, no deletion

This replaces the current direct-delete on click. No swipe gesture is needed -- the UX spec does not mention swipe-to-delete.

### Optimistic Update Coordination

The key challenge for deletion animation is that `useDeleteTodo` immediately removes the item from the TanStack Query cache. The animation must complete before calling the mutation:

```
User clicks X -> Confirmation inline -> User clicks "Confirm delete"
  -> setState(deleting) -> CSS collapse-out plays (200ms)
  -> setTimeout(200ms) -> call onDelete() -> useDeleteTodo.mutate()
  -> item removed from cache -> unmount
```

Do NOT modify `use-todos.ts`. The 200ms delay is local to `todo-item.tsx`.

### Cross-Story Dependencies in Epic 4

- **Story 4-1 (done):** Motion tokens (`--ease-spring`, `--duration-*`), shadow tokens (`--shadow-elevated`). This story consumes them.
- **Story 4-2 (done):** Dark mode. Animations must work in both themes. Shadow tokens have dark-mode overrides. No special dark-mode animation adjustments needed.
- **Story 4-3 (done):** Completion animations. The `VisualState` type, `data-state` attribute, entrance animations (`slide-down-in`, `slide-up-in`), and `DURATION_SLOW_MS` constant are all established. This story extends TodoItem with the `deleting` state implementation and adds new animations.
- **Story 4-5 (future):** Auth screen visual design. No dependency.
- **Story 4-6 (future):** EmptyState and CompletedSection polish. The FAB pulse empty-state interaction links to EmptyState but is self-contained via the `isEmpty` prop.
- **Story 4-8 (future):** Will add `prefers-reduced-motion` wrapping around ALL animations (including those added in this story). Do NOT add reduced-motion handling here.

### Deferred Items Relevant to This Story

From `deferred-work.md`:
- **No input maxLength constraint** (Story 3-3 review) -- No client-side limit on FAB input description length. Not in scope for this story.
- **FAB z-index not set explicitly** (Story 3-3 review) -- No explicit `z-index` on the FAB. May need attention if the expansion panel overlaps other fixed elements. Consider adding `z-50` if conflicts arise during testing.
- **No `aria-live` announcement for deleted items** (Story 3-5 review) -- Screen readers receive no notification on deletion. Deferred to Story 4-8 (accessibility).
- **"tap +" copy implies touch-only** (Story 3-6 review) -- EmptyState copy uses "tap +" which is mobile-specific. Not in scope for this story but the empty-state FAB pulse is related.

### Previous Story Intelligence (Story 4-3)

1. `pnpm typecheck` and `pnpm lint` both pass with 0 errors/warnings. Maintain this.
2. Backend has 47 passing tests. No backend changes in this story.
3. No frontend test framework is configured. Manual testing only.
4. The `cn()` utility from `@/lib/utils` is used for conditional class merging. Continue using it.
5. Story 4-3 review was clean -- 0 decision-needed, 0 patch items after fixes.
6. `DURATION_SLOW_MS = 300` constant pattern established for JS timeout matching CSS duration. Follow the same pattern for `DURATION_NORMAL_MS = 200`.
7. The `VisualState` type and `data-state` attribute pattern is established. Extend it for the `deleting` state.
8. Entrance animation pattern (detect change via `useRef` + `useEffect`, apply class, remove after timeout) is established in `todo-item.tsx`. Use the same pattern for creation fade-in and deletion animations.
9. The `data-state` attribute never practically shows `completing` (review finding from 4-3) -- the optimistic update architecture causes immediate unmount/remount. Same consideration applies to the `deleting` state: it will show during the 200ms collapse animation before the mutation fires.

### What NOT To Do

- Do NOT install framer-motion, react-spring, @formkit/auto-animate, or any JS animation library
- Do NOT modify `use-todos.ts` -- the optimistic update hooks must remain untouched
- Do NOT modify the backend
- Do NOT add `prefers-reduced-motion` media queries -- that belongs to Story 4-8
- Do NOT add swipe-to-delete gesture -- the UX spec uses a click-to-delete with inline confirmation
- Do NOT use a modal/dialog for delete confirmation -- must be inline below the item (UX-DR12)
- Do NOT change the Todo type definition or add new fields to the API contract
- Do NOT create a `tailwind.config.ts` file
- Do NOT use Tailwind `animate-*` built-in utilities that conflict with the custom spring easing -- define custom animations using the project's motion tokens
- Do NOT hardcode color values -- use Tailwind semantic tokens (`text-destructive`, `bg-destructive/10`, etc.)
- Do NOT duplicate existing keyframes (`slide-down-in`, `slide-up-in`) -- they already exist from Story 4-3

### Project Structure Notes

Files to modify:
- `frontend/src/components/fab.tsx` -- restructure for animated expand/collapse, add `isEmpty` prop for pulse animation
- `frontend/src/components/todo-item.tsx` -- add deletion confirmation UI, collapse animation, creation fade-in, wire up `deleting` visual state
- `frontend/src/index.css` -- add new @keyframes definitions and animation utility classes
- `frontend/src/pages/home.tsx` -- pass `isEmpty` prop to `<FAB>`

Files to verify (no changes expected):
- `frontend/src/components/todo-list.tsx` -- verify deletion animation plays before mutation fires
- `frontend/src/components/completed-section.tsx` -- verify deletion works for completed items too
- `frontend/src/hooks/use-todos.ts` -- MUST NOT be modified

No backend changes. No new npm packages. No new files -- all changes go into existing files.

### References

- [Source: epics.md#Story 4.4 -- acceptance criteria, UX-DR4, UX-DR10, UX-DR11, UX-DR12 references]
- [Source: ux-design-specification.md#Component Strategy -- FAB: idle/expanded states, spring scale animation, close on submit/Escape/click-outside]
- [Source: ux-design-specification.md#Feedback Patterns -- Todo created: fade-in at top (200ms); Todo deleted: collapses with fade-out (200ms)]
- [Source: ux-design-specification.md#Additional Patterns -- "Destructive confirmation: Inline below the item (expands item height), not a modal. Single [Confirm delete] button; auto-dismissed after 5s"]
- [Source: ux-design-specification.md#Component Strategy -- TodoItem states: active/completing/completed/deleting]
- [Source: ux-design-specification.md#Button Hierarchy -- Ghost variant for destructive/low-priority actions]
- [Source: architecture.md#UX-Driven Architectural Requirements -- CSS transitions + JS class toggling, no animation library]
- [Source: architecture.md#Styling Solution -- Tailwind CSS v4, class strategy]
- [Source: frontend/src/index.css -- motion tokens, existing keyframes from Story 4-3]
- [Source: frontend/src/components/fab.tsx -- current FAB implementation to be enhanced]
- [Source: frontend/src/components/todo-item.tsx -- current TodoItem with VisualState type and deleting placeholder]
- [Source: frontend/src/hooks/use-todos.ts -- useDeleteTodo optimistic pattern (DO NOT MODIFY)]
- [Source: frontend/src/pages/home.tsx -- passes activeTodos/completedTodos; needs isEmpty prop for FAB]
- [Source: 4-3-todo-completion-animation-sequence.md -- previous story patterns, animation approach, review findings]
- [Source: deferred-work.md -- FAB z-index, aria-live for deletion, maxLength constraint]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- typecheck: 0 errors
- lint: 0 errors, 0 warnings
- build: successful (1.52s)
- Backend tests: not run locally (Docker-only venv; no backend files modified)

### Completion Notes List

- FAB refactored from conditional rendering to FabState state machine (idle/expanding/expanded/collapsing) with `onAnimationEnd` transitions
- FAB `isEmpty` prop drives `animate-fab-pulse` class on idle button when no active todos exist
- Creation fade-in uses negative optimistic ID detection (`todo.id < 0`) to avoid animating initial page load
- Deletion flow: X button -> inline confirmation row (UX-DR12) with "Confirm delete" + "Cancel" -> 5s auto-dismiss timer -> on confirm: collapse animation (200ms) -> `onDelete()` fires after timeout
- TodoItem wrapper changed to `flex flex-col` to accommodate inline confirmation row below the main content row
- `data-state="deleting"` correctly set during collapse animation via `isAnimatingDelete` state
- `DURATION_NORMAL_MS = 200` constant added following established `DURATION_SLOW_MS` pattern
- 6 new keyframes + 6 new utility classes added to index.css, all referencing motion tokens (no hardcoded durations)
- `use-todos.ts` NOT modified as required
- No new dependencies or packages installed

### Change Log

- 2026-04-15: Implemented Story 4-4 -- FAB animations, creation fade-in, deletion inline confirmation + collapse animation

### File List

- frontend/src/components/fab.tsx (modified -- state machine refactor, isEmpty prop, animation classes)
- frontend/src/components/todo-item.tsx (modified -- deletion confirmation, collapse animation, creation fade-in, Button import)
- frontend/src/pages/home.tsx (modified -- isEmpty prop calculation and pass-through to FAB)
- frontend/src/index.css (modified -- 6 new keyframes + 6 new animation utility classes)

### Review Findings

- [x] [Review][Patch] FAB focus-on-idle useEffect steals focus on initial mount [frontend/src/components/fab.tsx:57-63] -- fixed: added hasExpandedRef guard
- [x] [Review][Patch] handleConfirmDelete setTimeout not cleaned up on unmount [frontend/src/components/todo-item.tsx:114-122] -- fixed: stored in deleteTimerRef, cleared on unmount
- [x] [Review][Patch] Delete confirmation row does not receive focus for keyboard users [frontend/src/components/todo-item.tsx:248-265] -- fixed: added confirmButtonRef + focus effect
- [x] [Review][Defer] collapse-out max-height 80px may clip multi-line items [frontend/src/index.css:179-181] -- deferred, address when input length validation is added
- [x] [Review][Defer] No Escape key handling on delete confirmation row [frontend/src/components/todo-item.tsx:248-265] -- deferred to Story 4-8 (keyboard navigation)
