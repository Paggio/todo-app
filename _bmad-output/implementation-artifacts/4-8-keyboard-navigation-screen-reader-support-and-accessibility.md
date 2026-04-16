# Story 4.8: Keyboard Navigation, Screen Reader Support, and Accessibility

Status: done

## Story

As a user with accessibility needs,
I want to navigate and use the app entirely via keyboard and screen reader,
so that the app is inclusive and usable regardless of input method.

## Acceptance Criteria

1. **Given** the todo list **When** a user navigates with Tab **Then** focus moves through interactive elements in a logical order: todo checkboxes, delete affordances, FAB, logout action (FR24)

2. **Given** a focused todo item checkbox **When** the user presses Space **Then** the completion state toggles (same as clicking the checkbox) (FR24)

3. **Given** the FAB is expanded **When** focus management activates **Then** focus moves to the text input field; when the FAB closes, focus returns to the FAB button (UX-DR16)

4. **Given** the FAB input is focused **When** the user presses Enter **Then** the todo is created; pressing Escape closes the FAB without creating (UX-DR16)

5. **Given** a todo is completed or uncompleted **When** the state change occurs **Then** an `aria-live="polite"` region announces the change to screen readers (UX-DR16)

6. **Given** custom checkboxes on todo items **When** they render **Then** they include `aria-checked` reflecting the current completion state (UX-DR16)

7. **Given** all interactive elements **When** they render **Then** they have a minimum touch target of 44x44px and visible focus rings (2px solid accent with 2px offset) in both light and dark modes (UX-DR16)

8. **Given** the user has `prefers-reduced-motion` enabled **When** animations would normally play **Then** all spring and transition animations are disabled and state changes are instant (UX-DR16)

9. **Given** a todo is deleted **When** the item is removed from the DOM **Then** an `aria-live` region announces the deletion to screen readers (deferred from 3-5, 4-6)

10. **Given** the delete confirmation row is visible **When** the user presses Escape **Then** the confirmation row is dismissed (deferred from 4-4)

11. **Given** the CompletedSection is collapsed **When** the toggle button has `aria-controls="completed-todos-list"` **Then** the controlled element remains in the DOM (hidden via CSS `display:none` or `hidden` attribute) so the `aria-controls` reference is always valid (deferred from 3-2)

12. **Given** all active todos are completed **When** the active list section is empty **Then** the empty `role="list"` div is not rendered (or rendered with an accessible empty-list announcement) to avoid screen reader announcing "list, 0 items" (deferred from 3-2)

## Tasks / Subtasks

- [x] Task 1: `prefers-reduced-motion` -- CSS animations (AC: #8)
  - [x] 1.1 Add a `@media (prefers-reduced-motion: reduce)` block at the end of `frontend/src/index.css` (inside `@layer utilities` or after the animation utility classes) that sets `animation: none !important` on ALL `.animate-*` utility classes. Target these 12 classes:
    - `.animate-slide-down-in`
    - `.animate-slide-up-in`
    - `.animate-fab-expand`
    - `.animate-fab-collapse`
    - `.animate-fab-pulse`
    - `.animate-fade-in`
    - `.animate-collapse-out`
    - `.animate-expand-in`
    - `.animate-auth-card-in`
    - `.animate-auth-fade-out`
    - `.animate-auth-mode-switch`
    - `.animate-page-fade-in`
    - `.animate-slide-down-strip`
  - [x] 1.2 Also disable the CSS `transition` properties on the checkbox circle (`.group\/checkbox div`) and text strikethrough by adding a general transition override: `*, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }` inside the reduced-motion media query. Use `0.01ms` rather than `0` so that `transitionend` and `animationend` events still fire (the FAB uses `onAnimationEnd` to transition states).
  - [x] 1.3 Also suppress the `animate-pulse` class from shadcn/tw-animate-css (used on skeleton loaders). The `0.01ms` global rule from 1.2 covers this automatically.

- [x] Task 2: `prefers-reduced-motion` -- JS animation timeouts (AC: #8)
  - [x] 2.1 Create a utility `frontend/src/lib/motion.ts` that exports:
    ```ts
    /** True when the user prefers reduced motion. Evaluated once at module load. */
    export const prefersReducedMotion: boolean =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    /** Returns 0 when reduced motion is preferred, otherwise the given duration. */
    export function motionDuration(ms: number): number {
      return prefersReducedMotion ? 0 : ms
    }
    ```
  - [x] 2.2 In `frontend/src/components/todo-item.tsx`, import `motionDuration` and wrap all `setTimeout` duration arguments:
    - Line ~77: `setTimeout(() => { setEntranceAnimation(null) }, motionDuration(DURATION_NORMAL_MS))` (creation fade-in cleanup)
    - Line ~98: `setTimeout(() => { setEntranceAnimation(null) }, motionDuration(DURATION_SLOW_MS))` (completion entrance cleanup)
    - Line ~141-144: `setTimeout(() => { ... onDelete?.() }, motionDuration(DURATION_NORMAL_MS))` (deletion collapse before firing delete)
    Note: The 5-second auto-dismiss timer for delete confirmation (line ~106) should NOT be wrapped -- it is a UX timeout, not an animation.
  - [x] 2.3 In `frontend/src/pages/login.tsx`, import `motionDuration` and wrap the exit animation timer:
    - Line ~41-43: `setTimeout(() => { navigate(from, { replace: true }) }, motionDuration(DURATION_SLOW_MS))`

- [x] Task 3: Completion/deletion `aria-live` announcements (AC: #5, #9)
  - [x] 3.1 Add an `aria-live="polite"` visually-hidden announcement region in `frontend/src/pages/home.tsx`. Place it inside the main content container, before the todo list:
    ```tsx
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
    ```
    Manage `announcement` state in `HomePage`. Pass a `setAnnouncement` callback (or use a shared ref/context) down to `TodoList` and `CompletedSection`.
  - [x] 3.2 When a todo is toggled complete, announce: `"[description] marked as complete"`. When toggled back: `"[description] marked as active"`. Trigger the announcement from the `onToggle` handler in `TodoList` and `CompletedSection` by calling the announcement setter before firing the mutation.
  - [x] 3.3 When a todo is deleted (after confirm), announce: `"[description] deleted"`. Trigger from the `onDelete` handler path.
  - [x] 3.4 Clear the announcement after a short delay (~3s) to avoid stale content. Use a timeout inside a `useEffect` watching the announcement string.
  - [x] 3.5 Use the Tailwind utility `sr-only` class for the live region container (it is available from Tailwind's built-in utilities: `position: absolute; width: 1px; height: 1px; ...`).

- [x] Task 4: Escape key on delete confirmation row (AC: #10)
  - [x] 4.1 In `frontend/src/components/todo-item.tsx`, add an `onKeyDown` handler to the delete confirmation `<div>` (line ~272). When `event.key === "Escape"`, call `setIsConfirmingDelete(false)`.
  - [x] 4.2 The confirmation row container already focuses the "Confirm delete" button when it appears (line ~124-128). The `onKeyDown` should be on the wrapping div so both the "Confirm delete" button and the "Cancel" button can trigger it.

- [x] Task 5: Fix `aria-controls` on CompletedSection collapse (AC: #11)
  - [x] 5.1 In `frontend/src/components/completed-section.tsx`, change the conditional render from:
    ```tsx
    {!collapsed && (
      <div id="completed-todos-list" role="list">...</div>
    )}
    ```
    to always-rendered with CSS hiding:
    ```tsx
    <div
      id="completed-todos-list"
      role="list"
      hidden={collapsed}
    >
      {todos.map(...)}
    </div>
    ```
    The `hidden` attribute produces `display: none` and keeps the element in the DOM so `aria-controls="completed-todos-list"` always points to a valid target. The list items are still not rendered by React's virtual DOM, but the container is present in the real DOM.
    **Important:** With `hidden`, React still renders the children. This is fine -- completed lists are typically small. If performance is a concern, wrap the children in `{!collapsed && ...}` while keeping the outer div always-rendered.

- [x] Task 6: Fix empty `role="list"` announcement (AC: #12)
  - [x] 6.1 In `frontend/src/components/todo-list.tsx`, conditionally render the list container. When `todos.length === 0`, do NOT render the `<div role="list">`:
    ```tsx
    export function TodoList({ todos }: TodoListProps) {
      if (todos.length === 0) return null
      return (
        <div role="list">
          {todos.map(...)}
        </div>
      )
    }
    ```
    Note: The parent `home.tsx` already handles the empty case by rendering `<EmptyState />` instead of `<TodoList>`, so this early return is a safety net.

- [x] Task 7: Focus ring and tab order audit (AC: #1, #2, #6, #7)
  - [x] 7.1 Verify all interactive elements already have visible focus rings. The existing code uses `focus-visible:ring-2 focus-visible:ring-ring` on checkboxes and delete buttons. The shadcn/ui `<Button>` and `<Input>` components include focus-visible styling by default. Verify that the ring color resolves to `--color-accent` (or close) in both light and dark modes.
  - [x] 7.2 Verify that checkboxes have `role="checkbox"` and `aria-checked`. Currently in `todo-item.tsx` line ~167-169. Already correct. No changes needed.
  - [x] 7.3 Verify the tab order is logical. The natural DOM order in `home.tsx` is: header (h1, ThemeToggle, Sign out) -> active todo list (checkbox, delete per item) -> completed section toggle -> completed items -> FAB. This is a sensible tab order. No `tabindex` manipulation needed.
  - [x] 7.4 Verify Space key toggles checkboxes. The `<button role="checkbox">` natively responds to Space (and Enter) because it is a `<button>`. Already correct. No changes needed.
  - [x] 7.5 Verify 44x44px minimum touch targets. All interactive buttons and checkboxes already use `min-h-[44px] min-w-[44px]`. Verify the "Cancel" button in the delete confirmation row and the auth mode toggle link have adequate touch targets. If they are below 44px, add `min-h-[44px]` styling.

- [x] Task 8: Verify and test (AC: all)
  - [x] 8.1 Run `pnpm typecheck` from `frontend/` -- 0 errors expected.
  - [x] 8.2 Run `pnpm lint` from `frontend/` -- 0 errors, 0 warnings expected.
  - [ ] 8.3 Manual test: Enable "Reduce motion" in macOS System Settings > Accessibility > Display (or Chrome devtools > Rendering > Emulate prefers-reduced-motion). Verify: all CSS animations are instant (no visible motion), FAB expand/collapse transitions instantly, todo creation/deletion/completion happens without animation, auth screen card appears without spring animation, page transition has no fade.
  - [ ] 8.4 Manual test (reduced motion JS): With reduced motion enabled, verify login->home transition is instant (no 300ms delay). Verify deletion collapse fires `onDelete` immediately. Verify completion entrance animations clear immediately.
  - [ ] 8.5 Manual test (screen reader): Use VoiceOver (Cmd+F5 on macOS). Navigate to a todo with Tab. Toggle completion with Space. Verify VoiceOver announces "marked as complete" (or similar) from the aria-live region. Delete a todo. Verify VoiceOver announces "deleted."
  - [ ] 8.6 Manual test (keyboard): Navigate the entire app using only Tab, Space, Enter, and Escape. Verify: Tab moves through header -> todos -> FAB logically. Space toggles checkboxes. FAB opens on Enter/Space, Escape closes it. Delete confirmation row dismisses on Escape.
  - [ ] 8.7 Manual test: Collapse the completed section. Inspect the DOM -- verify `<div id="completed-todos-list">` is still present with `hidden` attribute.
  - [ ] 8.8 Manual test: Complete all active todos so the active list is empty. Verify no "list, 0 items" announcement in VoiceOver. Verify EmptyState appears correctly.
  - [ ] 8.9 Verify all tests work in BOTH light and dark modes. Focus rings should be visible in both.

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** This project uses Tailwind CSS v4 with `@theme inline` in `src/index.css`. There is NO `tailwind.config.ts`. All theme customization goes through CSS custom properties + the `@theme inline` block. [Source: architecture.md#Styling Solution]
- **No JS animation libraries.** Do NOT install framer-motion, react-spring, auto-animate. All animation is CSS transitions + keyframes + JS class toggling. [Source: architecture.md#UX-Driven Architectural Requirements]
- **shadcn/ui v4 with `base-nova` style.** Components consume Tailwind theme variables. [Source: frontend/components.json]
- **`class` strategy for dark mode.** The `@custom-variant dark (&:is(.dark *));` directive enables Tailwind's `dark:` variant. [Source: architecture.md#Styling Solution]
- **File naming: kebab-case. Component naming: PascalCase.** [Source: architecture.md#Naming Patterns]
- **No hardcoded color values in component files.** All colors from CSS variables via Tailwind token classes. [Source: architecture.md#Anti-Patterns]
- **No `any` type in TypeScript.** [Source: architecture.md#Anti-Patterns]

### Reduced Motion Strategy

**CSS approach:** A single `@media (prefers-reduced-motion: reduce)` block at the end of `index.css` disables ALL animations/transitions globally using the `0.01ms` duration trick. This is preferred over individual overrides because:
- The project has 13 custom `.animate-*` classes plus shadcn/tw-animate-css classes
- A global rule catches all of them with one declaration
- Using `0.01ms` (not `0`) ensures `animationend` and `transitionend` events still fire -- critical because the FAB uses `onAnimationEnd` to transition its state machine from `expanding` to `expanded` and from `collapsing` to `idle`

**JS approach:** A lightweight `motion.ts` utility reads `matchMedia` once at module load and exports `motionDuration(ms)`. JS timeouts that mirror CSS animation durations wrap their values with this helper. The 5-second UX timeout for delete confirmation auto-dismiss is intentionally NOT wrapped (it is a behavioral timeout, not an animation). Evaluated once (not reactive) -- if the user changes the OS preference mid-session, the JS side will not update. This is acceptable for an SPA that is typically reloaded.

### Live Region Strategy

A single `aria-live="polite"` visually-hidden `<div>` lives in `home.tsx` (the parent of all todo interactions). State-driven: when the `announcement` string changes, the browser's accessibility tree picks up the change and the screen reader speaks it. The region uses `aria-atomic="true"` so the entire content is announced each time.

Announcements:
- Toggle complete: `"{description} marked as complete"`
- Toggle active: `"{description} marked as active"`
- Delete: `"{description} deleted"`
- Cleared after ~3 seconds to prevent stale content on next focus

The announcement callback is passed down from `HomePage` to `TodoList` and `CompletedSection` via props. No context/provider needed -- the prop chain is shallow (one level).

### Deferred Items Absorbed by This Story

1. **`prefers-reduced-motion` wrapping for ALL animations** (deferred from stories 4-2, 4-3, 4-4, 4-5, 4-6) -- Task 1 + Task 2
2. **`aria-controls` on CompletedSection collapse references absent DOM element** (deferred from 3-2 code review) -- Task 5
3. **Empty `role="list"` announcement when no active todos** (deferred from 3-2 code review) -- Task 6
4. **`aria-live` for deletion announcements** (deferred from 3-5, 4-6 code reviews) -- Task 3
5. **Escape key handling on delete confirmation row** (deferred from 4-4 code review) -- Task 4

### Items NOT Addressed (remain deferred or out of scope)

- **FAB z-index not set explicitly** (from 3-3 code review) -- No stacking conflict exists; OfflineIndicator is z-50 and FAB has no explicit z-index. Revisit if overlays are added.
- **`navigator.onLine` not SSR-safe in OfflineIndicator** (from 4-6 code review) -- SPA-only, no SSR. Revisit if SSR framework adopted.
- **ThemeToggle `window.matchMedia` during render** (from 4-2 code review) -- No functional issue in SPA context.
- **`collapse-out` max-height 80px may clip multi-line items** (from 4-4 code review) -- Now mitigated by maxLength=500 (added in 4-7). Very long single-word strings could still overflow but this is extremely rare.
- **FAB maxLength paste truncation without feedback** (from 4-7 code review) -- Standard browser behavior; out of scope.

### Existing Animation Inventory

All CSS animations defined in `frontend/src/index.css`:

| Utility class | Keyframe | Duration | Used in |
|---|---|---|---|
| `.animate-slide-down-in` | `slide-down-in` | `--duration-slow` (300ms) | `todo-item.tsx` (completion entrance) |
| `.animate-slide-up-in` | `slide-up-in` | `--duration-slow` (300ms) | `todo-item.tsx` (undo-completion entrance) |
| `.animate-fab-expand` | `fab-expand` | `--duration-slow` (300ms) | `fab.tsx` (panel expand) |
| `.animate-fab-collapse` | `fab-collapse` | `--duration-fast` (150ms) | `fab.tsx` (panel collapse) |
| `.animate-fab-pulse` | `fab-pulse` | `2.5s infinite` | `fab.tsx` (empty state attention) |
| `.animate-fade-in` | `fade-in` | `--duration-normal` (200ms) | `todo-item.tsx` (creation), `empty-state.tsx` |
| `.animate-collapse-out` | `collapse-out` | `--duration-normal` (200ms) | `todo-item.tsx` (deletion) |
| `.animate-expand-in` | `expand-in` | `--duration-normal` (200ms) | `todo-item.tsx` (delete confirm row) |
| `.animate-auth-card-in` | `auth-card-in` | `--duration-slow` (300ms) | `auth-screen.tsx` |
| `.animate-auth-fade-out` | `auth-fade-out` | `--duration-slow` (300ms) | `auth-screen.tsx` |
| `.animate-auth-mode-switch` | `auth-mode-switch` | `--duration-normal` (200ms) | `auth-screen.tsx` |
| `.animate-page-fade-in` | `page-fade-in` | `--duration-slow` (300ms) | `home.tsx` |
| `.animate-slide-down-strip` | `slide-down-strip` | `--duration-normal` (200ms) | `offline-indicator.tsx` |

Additionally: `animate-pulse` from tw-animate-css is used on skeleton loaders in `home.tsx`.

CSS transitions (inline `style` prop, not classes):
- Checkbox border/bg/scale: `transition-duration: var(--duration-fast)` in `todo-item.tsx`
- Text opacity/strikethrough: `transition: opacity var(--duration-fast), text-decoration-color var(--duration-fast)` in `todo-item.tsx`
- Chevron rotation on CompletedSection toggle: `transition-transform` class in `completed-section.tsx`

JS timeouts mirroring CSS durations:
- `todo-item.tsx`: `DURATION_SLOW_MS = 300` (entrance animation cleanup), `DURATION_NORMAL_MS = 200` (fade-in cleanup, deletion collapse delay)
- `login.tsx`: `DURATION_SLOW_MS = 300` (auth exit animation delay before navigate)

### Motion Token Reference

Available in `frontend/src/index.css` `:root`:
```
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast:   150ms;
--duration-normal: 200ms;
--duration-slow:   300ms;
```

### Previous Story Intelligence (Story 4-7)

1. `pnpm typecheck` and `pnpm lint` both pass with 0 errors/warnings. Maintain this.
2. Backend has 47 passing tests. No backend changes in this story.
3. No frontend test framework is configured. Manual testing only.
4. The `cn()` utility from `@/lib/utils` is used for conditional class merging.
5. All animation durations reference motion tokens -- no hardcoded values in CSS.
6. `DURATION_SLOW_MS = 300` and `DURATION_NORMAL_MS = 200` constants are established in `todo-item.tsx`. `DURATION_SLOW_MS = 300` also in `login.tsx`.
7. The `onAnimationEnd` event handler pattern is used in FAB (`fab.tsx` line 149) to transition the state machine. This MUST keep firing under reduced motion.
8. Sonner toast styling uses CSS variable overrides via `[data-sonner-toaster]` selector in `index.css`.
9. Story 4-7 fixed `login.tsx:25` useRef initial argument issue (`pnpm build` now succeeds).
10. The delete button is hidden by default (`opacity-0`) and revealed on `group-hover:opacity-100 focus-visible:opacity-100`. Keyboard users can Tab to it and it becomes visible via `focus-visible`.

### What NOT To Do

- Do NOT install framer-motion, react-spring, @formkit/auto-animate, or any JS animation library
- Do NOT install @radix-ui/react-tooltip or the shadcn Tooltip component
- Do NOT create a `tailwind.config.ts` file
- Do NOT modify the backend
- Do NOT add `tabindex` attributes to override natural DOM tab order (the current order is correct)
- Do NOT use `animation: none` with duration `0` -- use `0.01ms` so that `animationend`/`transitionend` events still fire
- Do NOT make `prefersReducedMotion` reactive (listening for changes via `matchMedia.addEventListener`) -- overkill for this SPA
- Do NOT wrap the 5-second delete confirmation auto-dismiss timer with `motionDuration` -- it is a UX timeout, not an animation
- Do NOT hardcode color values -- use Tailwind semantic tokens and CSS variables
- Do NOT use `any` type in TypeScript

### Project Structure Notes

Files to create:
- `frontend/src/lib/motion.ts` -- reduced motion utility (2 exports: `prefersReducedMotion`, `motionDuration`)

Files to modify:
- `frontend/src/index.css` -- add `@media (prefers-reduced-motion: reduce)` block
- `frontend/src/components/todo-item.tsx` -- wrap animation timeouts with `motionDuration`, add Escape key on delete confirmation row
- `frontend/src/pages/login.tsx` -- wrap exit animation timeout with `motionDuration`
- `frontend/src/pages/home.tsx` -- add aria-live announcement region, pass announcement callbacks
- `frontend/src/components/todo-list.tsx` -- accept announcement callback prop, guard empty list render, pass to TodoItem
- `frontend/src/components/completed-section.tsx` -- always render list container (use `hidden` attr), accept announcement callback
- `frontend/src/components/empty-state.tsx` -- no changes expected (already has `aria-live="polite"`)

Files to verify (no changes expected):
- `frontend/src/components/fab.tsx` -- focus management already correct (expand->focus input, collapse->focus button)
- `frontend/src/components/auth-screen.tsx` -- animations already CSS-only, covered by global reduced-motion override
- `frontend/src/components/offline-indicator.tsx` -- animation covered by global override
- `frontend/src/components/theme-toggle.tsx` -- no animation concerns

No backend changes. No new npm packages.

### Cross-Story Dependencies

- **Story 4-1 (done):** Design tokens -- focus ring colors consume `--ring` token.
- **Story 4-2 (done):** Dark mode -- focus rings must be visible in both modes.
- **Story 4-3 (done):** Completion animations -- this story wraps them with reduced-motion.
- **Story 4-4 (done):** FAB + deletion animations -- this story wraps them + adds Escape key.
- **Story 4-5 (done):** Auth animations -- this story wraps them with reduced-motion.
- **Story 4-6 (done):** OfflineIndicator animation + CompletedSection `aria-controls` -- both addressed here.
- **Story 4-7 (done):** Responsive layout, form patterns, touch targets -- all prerequisites complete.
- **This is the final story of Epic 4 and the project.**

### References

- [Source: epics.md#Story 4.8 -- acceptance criteria, FR24, UX-DR16]
- [Source: ux-design-specification.md#Accessibility Considerations -- reduced motion, focus rings, touch targets]
- [Source: ux-design-specification.md#Accessibility Strategy -- keyboard nav, screen reader, focus management, ARIA]
- [Source: architecture.md#UX-Driven Architectural Requirements -- prefers-reduced-motion support]
- [Source: deferred-work.md -- all 5 deferred a11y items absorbed]
- [Source: 4-7-responsive-layout-button-hierarchy-and-form-patterns.md -- previous story patterns, deferred items pushed to 4-8]
- [Source: frontend/src/index.css -- all keyframe + animation utility class definitions]
- [Source: frontend/src/components/todo-item.tsx -- checkbox ARIA, animation timeouts, delete confirmation]
- [Source: frontend/src/components/completed-section.tsx -- aria-controls, conditional render]
- [Source: frontend/src/components/todo-list.tsx -- role="list" container]
- [Source: frontend/src/components/fab.tsx -- onAnimationEnd handler, focus management]
- [Source: frontend/src/pages/login.tsx -- exit animation timeout]
- [Source: frontend/src/pages/home.tsx -- page structure, aria-busy]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `pnpm typecheck`: 0 errors
- `pnpm lint`: 0 errors, 0 warnings
- `pnpm build`: success (1.53s)

### Completion Notes List

- **Task 1 (CSS reduced motion):** Added global `@media (prefers-reduced-motion: reduce)` block at end of `index.css` with `*, *::before, *::after` rule using `0.01ms` durations. Covers all 13 custom `.animate-*` classes, shadcn `animate-pulse`, and all inline CSS transitions. Used `animation-iteration-count: 1 !important` to stop infinite animations (fab-pulse). Used `0.01ms` not `0` to preserve `animationend`/`transitionend` events for FAB state machine.
- **Task 2 (JS reduced motion):** Created `frontend/src/lib/motion.ts` with `prefersReducedMotion` boolean and `motionDuration(ms)` helper. Wrapped 3 animation timeouts in `todo-item.tsx` and 1 in `login.tsx`. Intentionally did NOT wrap the 5-second delete auto-dismiss (UX timeout).
- **Task 3 (aria-live announcements):** Added `announcement` state and `aria-live="polite"` visually-hidden region in `home.tsx`. Passed `announce` callback to `TodoList` and `CompletedSection` via props. Announcements: toggle complete/active, delete. Auto-clears after 3s.
- **Task 4 (Escape key):** Added `onKeyDown` handler on delete confirmation row div in `todo-item.tsx`. Escape dismisses the confirmation.
- **Task 5 (aria-controls fix):** Changed CompletedSection to always render the list container div with `hidden={collapsed}`. Children conditionally rendered with `{!collapsed && ...}` to avoid unnecessary React renders while keeping the DOM element present for `aria-controls`.
- **Task 6 (empty list fix):** Added early `return null` when `todos.length === 0` in `TodoList` to prevent empty `role="list"` announcement.
- **Task 7 (focus/touch audit):** Verified all focus rings, ARIA attributes, tab order, Space key behavior. Added `min-h-[44px]` to Cancel button in delete confirmation row and auth mode toggle button.
- **Task 8 (validation):** typecheck, lint, build all pass. Manual tests (8.3-8.9) require user execution.
- **Deferred items resolved:** 5 deferred a11y items marked resolved in `deferred-work.md` (aria-controls x2, empty role="list", aria-live for deletions, Escape key on delete confirmation).

### Review Findings

- [x] [Review][Patch] Confirm delete button below 44px touch target — `size="sm"` gives `h-7` (28px), missing `min-h-[44px]` override [frontend/src/components/todo-item.tsx:282] — **FIXED**
- [x] [Review][Patch] No focus return after Escape dismisses delete confirmation — focus lost to body when confirmation row unmounts [frontend/src/components/todo-item.tsx:276] — **FIXED**
- [x] [Review][Defer] `motion.ts` non-reactive design — `prefersReducedMotion` evaluated once at module load; users who toggle OS reduced-motion mid-session won't see JS-side changes until reload. Documented design decision, acceptable for SPA. — deferred, pre-existing design choice
- [x] [Review][Defer] Rapid aria-live announcements may overlap — rapid toggle/delete actions produce announcements that replace each other; aria-live="polite" queues but very fast actions may drop announcements. Standard behavior, not a bug. — deferred, inherent to aria-live spec

### Change Log

- 2026-04-15: Story 4-8 implementation — keyboard navigation, screen reader support, and accessibility (Tasks 1-8)

### File List

- `frontend/src/index.css` (modified) — added `@media (prefers-reduced-motion: reduce)` block
- `frontend/src/lib/motion.ts` (new) — reduced motion utility
- `frontend/src/components/todo-item.tsx` (modified) — motionDuration wrapping, Escape key handler, Cancel button touch target
- `frontend/src/pages/login.tsx` (modified) — motionDuration wrapping for exit animation
- `frontend/src/pages/home.tsx` (modified) — aria-live announcement region, announce callback
- `frontend/src/components/todo-list.tsx` (modified) — announce prop, empty list guard
- `frontend/src/components/completed-section.tsx` (modified) — announce prop, always-rendered list container with hidden attr
- `frontend/src/components/auth-screen.tsx` (modified) — auth toggle button min-h touch target
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified) — 5 deferred items marked resolved
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — story 4-8 status updated to review
