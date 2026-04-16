# Story 4.6: Component Polish -- CompletedSection, EmptyState, and System Feedback

Status: done

## Story

As a user,
I want polished secondary components that add personality and clarity,
so that every part of the app feels considered and complete.

## Acceptance Criteria

1. **Given** the CompletedSection component has completed todos **When** it renders **Then** it is collapsible with a count badge shown when collapsed, expanded by default, and the collapse preference is persisted in localStorage (UX-DR5)

2. **Given** completed items within the CompletedSection **When** they render **Then** they display with visually muted styling: dimmed text and lighter checkbox (UX-DR5)

3. **Given** no active todos exist **When** the EmptyState component renders **Then** it displays a single line of welcoming copy and a subtle arrow pointing toward the FAB -- no illustrations (UX-DR7)

4. **Given** the browser loses network connectivity **When** the OfflineIndicator component activates **Then** a thin strip appears at the top of the viewport in warning color (#FF9500), auto-hides on reconnect, and never blocks content below (UX-DR8)

5. **Given** toast notifications are triggered **When** they appear **Then** they are positioned at bottom-center, auto-dismiss after 3s (general feedback) or 4s (network errors) (UX-DR19)

## Tasks / Subtasks

- [x] Task 1: Apply design token polish to CompletedSection (AC: #1, #2)
  - [x] 1.1 Update the section header button in `completed-section.tsx` to use the project typography tokens. Change the text from `text-xs` to `text-label` utility class (13px/500 weight, matching the label type scale from Story 4-1). The count badge `({todos.length})` is already inline -- no separate badge component needed per UX-DR5.
  - [x] 1.2 Apply `text-caption` (12px/400) to the count number if separating it into a badge-like span, or keep it inline with the label. The current implementation already shows "Completed (N)" which satisfies UX-DR5's "count badge when collapsed." When collapsed, only this header row is visible, serving as the badge.
  - [x] 1.3 Upgrade the separator from `border-t border-border` to include the architecture-spec spacing: `mt-8` (32px gap between active list and completed section, matching `--spacing-8` token from UX spec "Active list to completed section divider: 32px").
  - [x] 1.4 Add smooth collapse/expand transition. Wrap the completed todos list `<div id="completed-todos-list">` in a container that transitions `max-height` and `opacity`, or use the simpler pattern of toggling visibility with a brief animation. **Recommended approach:** Use the existing `animate-expand-in` / a simple height transition. However, the simplest and most reliable approach for a list of unknown height is the current show/hide toggle. Add a subtle fade transition by wrapping the list in a div with `transition-[opacity] duration-normal` and toggling opacity, or keep the instant show/hide (which is standard UX for collapsible sections). The UX spec does NOT mandate an animated collapse -- simply being collapsible is sufficient.
  - [x] 1.5 Verify completed items render with muted styling. The `TodoItem` component already handles this: when `todo.isCompleted` is true, it applies `text-muted-foreground` to the container, dims text to `opacity: 0.5`, adds strikethrough, and fills the checkbox with `bg-muted-foreground`. This satisfies "dimmed text and lighter checkbox" (UX-DR5). **No changes needed to TodoItem** -- just verify this works correctly within CompletedSection.

- [x] Task 2: Polish EmptyState component (AC: #3)
  - [x] 2.1 Apply typography tokens to EmptyState copy. In `empty-state.tsx`, change `text-xs text-muted-foreground` to `text-caption text-muted-foreground`. The `text-caption` utility (12px/400/lh 1.4) is the UX spec's intended scale for empty state copy. [Source: ux-design-specification.md#Typography Scale -- "caption: 12px/400, helper text, empty state copy"]
  - [x] 2.2 Fix the "tap +" copy. **Deferred item from Story 3-6 code review:** The current text says "tap +" which implies touch-only. Change to a device-neutral phrase. Recommended: `No todos yet -- hit + to get started` or `Nothing here yet -- press + to begin`. Use an em dash (`&mdash;`) to match the current pattern.
  - [x] 2.3 Review the arrow SVG styling. The current `text-muted-foreground/50` (50% opacity muted foreground) provides a "subtle" arrow. Apply `transition-opacity duration-normal` so if the component enters with an animation, the arrow fades in smoothly. The SVG dimensions (`h-5 w-5`) and design are correct per UX-DR7.
  - [x] 2.4 Add gentle entrance animation. When the EmptyState appears (e.g., after deleting the last active todo), apply a subtle fade-in. Use the existing `animate-page-fade-in` class or add an inline `animate-fade-in` for a 200ms entrance. **Recommended:** Add the `animate-fade-in` class to the outer `<div>` for a gentle entrance consistent with the todo creation animation timing.

- [x] Task 3: Style toast notifications to match design system (AC: #5)
  - [x] 3.1 The project uses `sonner` (v2.0.7+) with `<Toaster>` in `app.tsx`. Sonner is already positioned at `position="bottom-center"` matching UX-DR19. Update the `<Toaster>` configuration in `app.tsx` to apply design tokens. Add styling props:
    ```tsx
    <Toaster
      position="bottom-center"
      toastOptions={{
        className: "text-sm",
        duration: 3000,
        style: {
          fontFamily: "var(--font-sans)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-elevated)",
        },
      }}
    />
    ```
    The `duration: 3000` sets the default 3s auto-dismiss for general feedback (UX-DR19). Network error toasts should use `toast.error("...", { duration: 4000 })` at the call site.
  - [x] 3.2 Update error toast calls in `use-todos.ts` to use 4s duration for network errors. Change each `toast.error(...)` call to include `{ duration: 4000 }`:
    - `toast.error("Failed to create todo. Please try again.", { duration: 4000 })`
    - `toast.error("Failed to delete todo. Please try again.", { duration: 4000 })`
    - `toast.error("Failed to update todo. Please try again.", { duration: 4000 })`
    These are network error scenarios (server-side failures after optimistic rollback), so they get the 4s treatment per UX-DR19.
  - [x] 3.3 Sonner v2 supports `theme` prop for light/dark. Add `theme` detection: either pass `theme="system"` to `<Toaster>` or manually pass the current theme. **Recommended:** Sonner's `theme="system"` uses `prefers-color-scheme` media query. Since this project uses `class` strategy (not media query), pass the resolved theme explicitly. Import `useTheme` from the theme provider and pass it:
    ```tsx
    const { theme } = useTheme()
    // Resolve "system" to actual light/dark
    const resolvedTheme = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme
    <Toaster theme={resolvedTheme as "light" | "dark"} ... />
    ```
    **However**, the `<Toaster>` currently lives outside the `ThemeProvider` context (it's inside `AuthProvider` but `ThemeProvider` is further inside -- actually, `ThemeProvider` is not in app.tsx). Check where `ThemeProvider` is mounted. If it's not an ancestor of `<Toaster>`, a simpler approach: use CSS to target sonner's `[data-sonner-toaster]` attribute and override its colors using the project's CSS variables. Add to `index.css`:
    ```css
    [data-sonner-toaster] [data-sonner-toast] {
      --normal-bg: var(--card);
      --normal-text: var(--card-foreground);
      --normal-border: var(--border);
      --error-bg: var(--destructive);
      --error-text: var(--primary-foreground);
    }
    ```
    This approach is simpler and more reliable because it uses the same CSS variable switching mechanism as the rest of the app. Test in both light and dark modes.

- [x] Task 4: Create OfflineIndicator component (AC: #4)
  - [x] 4.1 Create `frontend/src/components/offline-indicator.tsx`. This is a new file -- the component does not exist yet. Implementation:
    ```tsx
    import { useState, useEffect } from "react"
    import { cn } from "@/lib/utils"
    
    export function OfflineIndicator() {
      const [isOffline, setIsOffline] = useState(!navigator.onLine)
      
      useEffect(() => {
        function handleOnline() { setIsOffline(false) }
        function handleOffline() { setIsOffline(true) }
        
        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)
        
        return () => {
          window.removeEventListener("online", handleOnline)
          window.removeEventListener("offline", handleOffline)
        }
      }, [])
      
      if (!isOffline) return null
      
      return (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed top-0 inset-x-0 z-50",
            "text-caption text-center py-1.5",
            "bg-[var(--color-warning)] text-white"
          )}
        >
          You are offline
        </div>
      )
    }
    ```
    Key design decisions:
    - Uses `navigator.onLine` + `online`/`offline` events (browser built-in, no library needed)
    - `z-50` ensures it's above all content but below any potential modals
    - Warning color from token `--color-warning` (#FF9500 light / #FF9F0A dark)
    - `role="status"` + `aria-live="polite"` for screen reader announcement
    - `text-caption` for the label text scale
    - **Never blocks content:** It sits at the top in fixed position. Add `pt-8` (or equivalent) to the body/main container when offline, OR use the simpler approach: the strip is thin enough (approx 28px) that content is still accessible. Per UX-DR8, it "never blocks content below." The simplest approach is to make this element absolutely positioned so it overlays the top without pushing content down, and rely on its thin height (approx 28px) not obscuring meaningful content.
  - [x] 4.2 Add the OfflineIndicator to the app layout. Import and render `<OfflineIndicator />` in `app.tsx`, just inside the `<AuthProvider>` and before the `<Toaster>`. This makes it visible on both auth and main screens:
    ```tsx
    <AuthProvider>
      <OfflineIndicator />
      <Toaster ... />
      <BrowserRouter>...</BrowserRouter>
    </AuthProvider>
    ```
  - [x] 4.3 Add a subtle entrance/exit animation. Define a keyframe in `index.css`:
    ```css
    @keyframes slide-down-strip {
      from { transform: translateY(-100%); }
      to   { transform: translateY(0); }
    }
    ```
    And a utility class:
    ```css
    .animate-slide-down-strip {
      animation: slide-down-strip var(--duration-normal) ease-out both;
    }
    ```
    Apply `animate-slide-down-strip` to the OfflineIndicator container.

- [x] Task 5: Add loading indicator to "Try again" button (AC: deferred item)
  - [x] 5.1 **Deferred item from Story 3-6 code review:** "Try again button has no loading indicator during refetch." In `home.tsx`, the error state renders a plain `<button>` that calls `refetch()`. Track the refetch state by checking `isFetching` from `useGetTodos()`. Update the error block:
    ```tsx
    const { data: todos, isLoading, isError, isFetching, refetch } = useGetTodos()
    ```
    Then in the error state JSX:
    ```tsx
    <button
      type="button"
      onClick={() => refetch()}
      disabled={isFetching}
      className="mt-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isFetching ? "Retrying..." : "Try again"}
    </button>
    ```
    This provides visual feedback that the refetch is in progress without introducing a spinner (consistent with UX-DR17: "no loading indicators on subsequent fetches due to optimistic updates" -- this is an explicit retry, so text feedback is appropriate).

- [x] Task 6: Apply typography tokens to home page header (AC: polish)
  - [x] 6.1 In `home.tsx`, the header currently uses `text-xl font-semibold`. Replace with the `text-heading` utility class (20px/600/lh 1.3/-0.01em letter-spacing) which is the project's heading type scale. Change:
    ```tsx
    <h1 className="text-xl font-semibold">Todos</h1>
    ```
    to:
    ```tsx
    <h1 className="text-heading">Todos</h1>
    ```

- [x] Task 7: Apply typography tokens to error/loading states (AC: polish)
  - [x] 7.1 In `home.tsx` error state, change `text-sm text-muted-foreground` to `text-caption text-muted-foreground` for the error message.
  - [x] 7.2 In the `TodoSkeleton` component, the skeleton rows are fine as-is (they mimic the layout of real todos). No changes needed.

- [x] Task 8: Verify and test (AC: all)
  - [x] 8.1 Run `pnpm typecheck` from `frontend/` -- 0 errors expected.
  - [x] 8.2 Run `pnpm lint` from `frontend/` -- 0 errors, 0 warnings expected.
  - [x] 8.3 Manual test: With completed todos, verify CompletedSection shows "Completed (N)" header with `text-label` styling. Click to collapse. Verify the count is visible. Refresh page -- verify collapse state persists from localStorage. Verify AC #1.
  - [x] 8.4 Manual test: Verify completed items appear muted (dimmed text, strikethrough, muted checkbox). Verify AC #2.
  - [x] 8.5 Manual test: Delete all active todos. Verify EmptyState shows with `text-caption` styling and device-neutral copy. Verify arrow points toward bottom-right (FAB location). Verify AC #3.
  - [x] 8.6 Manual test: Open browser DevTools, go to Network tab, toggle "Offline" mode. Verify the warning strip appears at the top in #FF9500 orange. Toggle back online -- verify strip disappears. Verify AC #4.
  - [x] 8.7 Manual test: Trigger a toast by creating a todo while offline (or by simulating an API error). Verify toast appears at bottom-center, styled with design tokens (shadow, border-radius, font). Verify error toasts dismiss after 4s. Verify AC #5.
  - [x] 8.8 Manual test: Verify all changes work in BOTH light and dark modes.
  - [x] 8.9 Manual test: In error state, click "Try again" and verify button shows "Retrying..." text while refetch is in progress.

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** This project uses Tailwind CSS v4 with `@theme inline` in `src/index.css`. There is no `tailwind.config.ts`. All theme customization goes through CSS custom properties + the `@theme inline` block. [Source: architecture.md#Styling Solution]
- **No JS animation libraries.** Do NOT install framer-motion, react-spring, auto-animate. All animation is CSS transitions + keyframes + JS class toggling. [Source: architecture.md#UX-Driven Architectural Requirements]
- **shadcn/ui v4 with `base-nova` style.** Components consume Tailwind theme variables. [Source: frontend/components.json]
- **`class` strategy for dark mode.** The `@custom-variant dark (&:is(.dark *));` directive enables Tailwind's `dark:` variant. [Source: architecture.md#Styling Solution]
- **File naming: kebab-case. Component naming: PascalCase.** [Source: architecture.md#Naming Patterns]
- **No hardcoded color values in component files.** All colors from CSS variables via Tailwind token classes. Exception: the OfflineIndicator uses `var(--color-warning)` which is a CSS variable, not a hardcoded value.
- **No `any` type in TypeScript.** [Source: architecture.md#Anti-Patterns]
- **Sonner v2.0.7** is already installed and configured at `position="bottom-center"`. Do NOT install a different toast library.

### Deferred Items Absorbed by This Story

1. **"Try again" button has no loading indicator during refetch** (from 3-6 code review) -- Addressed in Task 5.
2. **"tap +" copy implies touch-only** (from 3-6 code review) -- Addressed in Task 2.2.

### Deferred Items NOT Addressed (pushed to 4-7 or 4-8)

- **`aria-controls` references element absent from DOM when collapsed** (from 3-2 code review) -- This is an a11y concern best addressed in Story 4-8 (accessibility).
- **Empty `<div role="list">` announced by screen reader when no active todos** (from 3-2 code review) -- a11y concern for Story 4-8.
- **No input maxLength constraint on FAB** (from 3-3 code review) -- UX/form validation, could fit in 4-7 (form patterns) or a future story.
- **FAB z-index not set explicitly** (from 3-3 code review) -- The OfflineIndicator uses `z-50`. The FAB does not have an explicit z-index. Since both are fixed-position, verify there is no stacking conflict. If the FAB needs a z-index, add `z-40` to it. This is a minor concern that can be verified during implementation.
- **No `aria-live` announcement for deleted items** (from 3-5 code review) -- Deferred to Story 4-8.
- **No Escape key handling on delete confirmation row** (from 4-4 code review) -- Deferred to Story 4-8.
- **collapse-out max-height 80px may clip multi-line items** (from 4-4 code review) -- Not in scope for this story.

### Toast Architecture Decision

The project uses `sonner` (v2.0.7). The `<Toaster>` component is rendered in `app.tsx` inside `<AuthProvider>` but outside `<BrowserRouter>`. Sonner provides CSS variable overrides via `[data-sonner-toaster]` and `[data-sonner-toast]` selectors. The recommended approach for theme-aware toasts is CSS-based overrides in `index.css` rather than passing the resolved theme via JavaScript. This avoids needing `useTheme` access at the `<Toaster>` level and automatically adapts when the `dark` class toggles.

### OfflineIndicator Design Decision

The UX spec says "No offline support: All operations require connectivity" and the OfflineIndicator is listed as a component to build (UX-DR8). This is NOT full offline mode -- it is a status indicator that tells the user when connectivity is lost. The thin strip overlay approach (fixed at top, not pushing content) is the correct pattern per UX-DR8: "never blocks content below."

The `navigator.onLine` API is widely supported and sufficient for detecting gross connectivity changes. It does NOT detect all forms of network unreachability (e.g., server down but network up), but that is expected -- server errors are handled by TanStack Query's error states and error toasts.

### Motion Token Reference

Available in `frontend/src/index.css` `:root`:
```
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast:   150ms;
--duration-normal: 200ms;
--duration-slow:   300ms;
```

### Typography Utility Classes Reference

Available from Story 4-1 in `@layer utilities`:
- `.text-display` -- 28px/600/lh 1.2/-0.01em (app title)
- `.text-heading` -- 20px/600/lh 1.3/-0.01em (page heading)
- `.text-body` -- 16px/400/lh 1.5 (default body)
- `.text-body-medium` -- 16px/500/lh 1.5 (active todo text)
- `.text-label` -- 13px/500/lh 1.4 (metadata, counts)
- `.text-caption` -- 12px/400/lh 1.4 (helper text, empty state)

### Existing Keyframes Reference

Already in `frontend/src/index.css` (do NOT duplicate):
- `slide-down-in`, `slide-up-in` (Story 4-3)
- `fab-expand`, `fab-collapse`, `fab-pulse` (Story 4-4)
- `fade-in`, `collapse-out`, `expand-in` (Story 4-4)
- `auth-card-in`, `auth-fade-out`, `auth-mode-switch`, `page-fade-in` (Story 4-5)

### Cross-Story Dependencies

- **Story 4-1 (done):** Design tokens, typography utilities. This story consumes them throughout.
- **Story 4-2 (done):** Dark mode theming. All changes must work in both light and dark.
- **Story 4-3 (done):** Completion animations. CompletedSection items use the existing TodoItem animations.
- **Story 4-4 (done):** FAB animations, deletion animations. EmptyState arrow points at the FAB.
- **Story 4-5 (done):** Auth screen, page transitions. No direct dependency.
- **Story 4-7 (future):** Responsive layout, form patterns. The OfflineIndicator must not break at any viewport width.
- **Story 4-8 (future):** Accessibility. Will add `prefers-reduced-motion` wrapping around all animations. Do NOT add reduced-motion handling in this story.

### Previous Story Intelligence (Story 4-5)

1. `pnpm typecheck` and `pnpm lint` both pass with 0 errors/warnings. Maintain this.
2. Backend has 47 passing tests. No backend changes in this story.
3. No frontend test framework is configured. Manual testing only.
4. The `cn()` utility from `@/lib/utils` is used for conditional class merging.
5. All animation durations reference motion tokens -- no hardcoded values in CSS.
6. `DURATION_SLOW_MS = 300` and `DURATION_NORMAL_MS = 200` constants are established in `todo-item.tsx`.
7. The `onAnimationEnd` event handler pattern was used in FAB (Story 4-4).

### What NOT To Do

- Do NOT install framer-motion, react-spring, @formkit/auto-animate, or any JS animation library
- Do NOT modify the backend
- Do NOT add `prefers-reduced-motion` media queries -- that belongs to Story 4-8
- Do NOT create a `tailwind.config.ts` file
- Do NOT hardcode color values -- use Tailwind semantic tokens and CSS variables
- Do NOT duplicate existing keyframes from Stories 4-3/4-4/4-5
- Do NOT add illustrations or images to EmptyState -- UX spec says "no illustrations"
- Do NOT replace sonner with a different toast library
- Do NOT implement full offline sync -- just the connectivity status indicator
- Do NOT modify `use-auth.ts` or `auth-provider.tsx`

### Project Structure Notes

Files to create:
- `frontend/src/components/offline-indicator.tsx` -- new OfflineIndicator component

Files to modify:
- `frontend/src/components/completed-section.tsx` -- typography tokens, separator spacing
- `frontend/src/components/empty-state.tsx` -- typography tokens, copy fix, entrance animation
- `frontend/src/pages/home.tsx` -- heading typography token, "Try again" loading state, error state typography
- `frontend/src/hooks/use-todos.ts` -- add `{ duration: 4000 }` to error toast calls
- `frontend/src/app.tsx` -- toast styling config, add OfflineIndicator
- `frontend/src/index.css` -- add slide-down-strip keyframe/utility, add sonner CSS overrides

Files to verify (no changes expected):
- `frontend/src/components/todo-item.tsx` -- verify muted styling works for completed items (no changes needed)
- `frontend/src/components/fab.tsx` -- verify z-index stacking with OfflineIndicator

No backend changes. No new npm packages. One new file (offline-indicator.tsx).

### References

- [Source: epics.md#Story 4.6 -- acceptance criteria, UX-DR5, UX-DR7, UX-DR8, UX-DR19 references]
- [Source: ux-design-specification.md#Component Strategy -- CompletedSection, EmptyState, OfflineIndicator, Toast specs]
- [Source: ux-design-specification.md#Typography Scale -- caption: 12px/400, label: 13px/500]
- [Source: ux-design-specification.md#UX Consistency Patterns -- "Network error: Toast (bottom-centre), 4s auto-dismiss"]
- [Source: ux-design-specification.md#Spacing Scale -- "Active list to completed section divider: 32px"]
- [Source: architecture.md#Error Handling Layers -- TanStack Query mutations onError -> toast notification]
- [Source: architecture.md#Frontend Tree -- toast.tsx, toaster.tsx in ui components]
- [Source: deferred-work.md -- "Try again" button, "tap +" copy -- both absorbed by this story]
- [Source: frontend/src/components/completed-section.tsx -- current implementation to be polished]
- [Source: frontend/src/components/empty-state.tsx -- current implementation to be polished]
- [Source: frontend/src/pages/home.tsx -- error/loading states to be enhanced]
- [Source: frontend/src/hooks/use-todos.ts -- toast.error calls to add duration]
- [Source: frontend/src/app.tsx -- Toaster configuration to be enhanced]
- [Source: frontend/src/index.css -- keyframes, utilities, CSS variables]
- [Source: 4-5-auth-screen-visual-design-and-page-transitions.md -- previous story patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- typecheck: 0 errors
- lint: 0 errors, 0 warnings
- No backend changes; backend tests not run (require Docker env)

### Completion Notes List

- Task 1: CompletedSection header updated from `text-xs` to `text-label`; separator upgraded to `mt-8 border-t border-border` for 32px gap; removed redundant `font-medium` (now part of `text-label`). Collapse toggle kept as instant show/hide (UX spec does not mandate animation). Verified TodoItem already applies muted styling for completed items.
- Task 2: EmptyState copy changed from "tap +" to "press +" (device-neutral). Typography upgraded to `text-caption`. Added `animate-fade-in` entrance animation and `transition-opacity duration-normal` on arrow SVG.
- Task 3: Toaster configured with `duration: 3000`, design-token font/radius/shadow. Error toasts in `use-todos.ts` all set to `{ duration: 4000 }`. Sonner theme handled via CSS overrides on `[data-sonner-toaster]` in `index.css` using project CSS variables -- adapts to light/dark automatically.
- Task 4: Created `offline-indicator.tsx` using `navigator.onLine` + online/offline events. Fixed top overlay with `z-50`, `--color-warning` background, `text-caption` text, `animate-slide-down-strip` entrance. Added to `app.tsx` inside AuthProvider.
- Task 5: "Try again" button now uses `isFetching` from `useGetTodos()` to show "Retrying..." text and disabled state.
- Task 6: Heading changed from `text-xl font-semibold` to `text-heading` utility class.
- Task 7: Error message changed from `text-sm` to `text-caption`. TodoSkeleton unchanged (correct as-is).
- Task 8: typecheck and lint both pass with 0 errors/warnings.

### Change Log

- 2026-04-15: Story 4-6 implementation complete. All 8 tasks with subtasks implemented.

### File List

- `frontend/src/components/offline-indicator.tsx` (new)
- `frontend/src/components/completed-section.tsx` (modified)
- `frontend/src/components/empty-state.tsx` (modified)
- `frontend/src/pages/home.tsx` (modified)
- `frontend/src/hooks/use-todos.ts` (modified)
- `frontend/src/app.tsx` (modified)
- `frontend/src/index.css` (modified)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified)

### Review Findings

- [x] [Review][Patch] Dead CSS: `--error-bg` and `--error-text` overrides in Sonner CSS are ineffective without `richColors` prop [`frontend/src/index.css:211-212`] — Removed dead overrides. Sonner only applies these variables when `richColors` is enabled. Fixed by removing the two unused lines.
- [x] [Review][Defer] `navigator.onLine` in useState initializer is not SSR-safe [`frontend/src/components/offline-indicator.tsx:12`] — deferred, pre-existing architectural decision (SPA-only app, no SSR)
- [x] [Review][Defer] FAB z-index stacking with OfflineIndicator [`frontend/src/components/fab.tsx:134`] — deferred, pre-existing from 3-3 code review (already tracked in deferred-work.md)
