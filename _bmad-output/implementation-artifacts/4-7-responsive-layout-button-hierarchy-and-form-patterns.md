# Story 4.7: Responsive Layout, Button Hierarchy, and Form Patterns

Status: done

## Story

As a user,
I want the app to look great on any device and have consistent interaction patterns,
so that I can use it comfortably on mobile and desktop.

## Acceptance Criteria

1. **Given** a mobile viewport (< 640px) **When** the layout renders **Then** content is full-width with 16px horizontal padding and the FAB is 16px from viewport edges (UX-DR15)

2. **Given** a tablet viewport (640--1024px) **When** the layout renders **Then** content is centered in a 640px max-width column with 32px padding (UX-DR15)

3. **Given** a desktop viewport (> 1024px) **When** the layout renders **Then** it matches the tablet layout -- the single-column design does not widen further (UX-DR15)

4. **Given** any supported viewport **When** the page renders **Then** there is no horizontal scrolling and the layout is functional and polished (FR23)

5. **Given** the button system **When** buttons are used across the app **Then** four variants are available: Primary (filled accent, white text, max one per view), Secondary (outlined, accent text), Ghost (no border, muted text, for destructive/low-priority), Icon-only (44px target, tooltip on hover) (UX-DR14)

6. **Given** form fields (auth screen, FAB input) **When** they are interacted with **Then** labels are always visible (no placeholder-only labels), validation fires on blur, submit is always enabled, Enter submits single-field forms, Tab navigates between fields in multi-field forms (UX-DR13)

7. **Given** the initial page load for an authenticated user **When** todos are being fetched **Then** skeleton screens (not spinners) are displayed as loading placeholders (UX-DR17)

## Tasks / Subtasks

- [x] Task 1: Implement responsive breakpoint layout (AC: #1, #2, #3, #4)
  - [x] 1.1 Update `home.tsx` main container from `max-w-2xl px-4 sm:px-8` to the UX-spec-aligned responsive classes. The current `max-w-2xl` resolves to 672px (42rem) which is close but not exact to the 640px spec. Change to `max-w-[640px]` for exact spec compliance. Padding: `px-4` (16px) on mobile, `sm:px-8` (32px) on sm+ breakpoint. The current classes are already nearly correct -- just the max-width needs to be exact.
    Current: `className="mx-auto max-w-2xl px-4 py-6 sm:px-8"`
    Target:  `className="mx-auto max-w-[640px] px-4 py-6 sm:px-8"`
  - [x] 1.2 Update FAB positioning for mobile breakpoint. Current: `bottom-6 right-6` (24px). UX spec says mobile FAB should be `16px from viewport edges`. Change the idle FAB to `bottom-4 right-4 sm:bottom-6 sm:right-6` (16px mobile, 24px tablet+). Current expanded panel: `bottom-6 right-6 left-6` and `sm:bottom-8 sm:right-8 sm:w-[400px]`. Change to `bottom-4 right-4 left-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[400px]`.
    In `fab.tsx`, update both the idle button and expanded panel:
    - Idle button: `"fixed bottom-4 right-4 sm:bottom-6 sm:right-6"` (was `bottom-6 right-6 sm:bottom-8 sm:right-8`)
    - Expanded panel: `"fixed bottom-4 right-4 left-4"` and `"sm:bottom-6 sm:left-auto sm:right-6 sm:w-[400px]"` (was `bottom-6 right-6 left-6` and `sm:bottom-8 sm:left-auto sm:right-8 sm:w-[400px]`)
  - [x] 1.3 Verify auth screen is already responsive. The auth card uses `w-full max-w-sm` (384px) with `p-6` (24px) padding and the wrapper has `p-6` viewport padding. This is already responsive -- it naturally narrows on small viewports. No changes needed. Verify visually at 375px.
  - [x] 1.4 Verify OfflineIndicator is responsive. It uses `fixed top-0 inset-x-0` which is already full-width at all breakpoints. No changes needed.
  - [x] 1.5 Verify no horizontal scrollbar appears at 375px viewport width. The main content container, auth card, and FAB panel all use width constraints that work within 375px. Run a quick visual test.

- [x] Task 2: Button hierarchy audit and alignment (AC: #5)
  - [x] 2.1 Document the UX-spec button hierarchy mapping to shadcn/ui variants:
    - **Primary** (filled accent, white text, max one per view) = shadcn `default` variant. Currently used on: auth submit button (correct -- one per view), FAB submit icon button (icon-only variant of primary -- correct), FAB idle button (primary, icon-only -- correct).
    - **Secondary** (outlined, accent text) = shadcn `outline` variant. Currently used on: logout "Sign out" button in home.tsx (correct).
    - **Ghost** (no border, muted text, destructive/low-priority) = shadcn `ghost` variant. Currently used on: theme toggle button (correct), "Confirm delete" button in todo-item.tsx (correct -- ghost with destructive text color).
    - **Icon-only** (44px target, tooltip on hover) = shadcn `size="icon"` variant. Currently used on: FAB idle button (has `h-14 w-14` custom sizing for 56px, exceeds 44px minimum -- correct), FAB submit button (uses `size="icon"` which is 32px -- NEEDS FIX, should be at least 44px), theme toggle (uses `size="icon"` which is 32px but has `min-h-[44px] min-w-[44px]` -- correct).
  - [x] 2.2 Fix FAB submit icon button touch target. In `fab.tsx` line 171, the submit button uses `size="icon"` (32x32px) which is below the 44px minimum. Add `className="min-h-[44px] min-w-[44px]"` to ensure touch target compliance while keeping the icon sizing:
    ```tsx
    <Button
      size="icon"
      onClick={handleSubmit}
      aria-label="Submit todo"
      className="min-h-[44px] min-w-[44px]"
    >
      <Send className="size-4" />
    </Button>
    ```
  - [x] 2.3 Add tooltips to icon-only buttons. The UX spec says icon-only buttons should have "tooltip on hover." Currently none of the icon buttons have tooltips. However, the project does NOT have a Tooltip component installed from shadcn/ui. Two options:
    - **Option A (recommended):** Use the native `title` attribute on icon-only buttons for basic tooltip behavior. This is simple, requires no new dependencies, and meets the spirit of the requirement.
    - **Option B:** Install `@radix-ui/react-tooltip` via shadcn/ui CLI and use the shadcn Tooltip component.
    **Go with Option A** to keep scope minimal. Add `title` attributes to:
    - FAB idle button: `title="Add todo"` (already has `aria-label="Add todo"`)
    - FAB submit button: `title="Submit todo"` (already has `aria-label="Submit todo"`)
    - Theme toggle button in `theme-toggle.tsx`: `title` with the current mode label (already has `aria-label`)
    - Delete button in `todo-item.tsx`: `title="Delete todo"` (already has `aria-label="Delete todo"`)
  - [x] 2.4 Audit the "Try again" link-button in `home.tsx`. Currently uses a raw `<button>` with underline styling. This is semantically a link-styled action trigger. The UX hierarchy says Ghost is for "destructive or low-priority" -- this fits as a low-priority secondary action. However, the current styling (underline, accent color) is closer to the shadcn `link` variant. **Decision:** Keep as-is -- it is a contextual action within an error state, not a primary navigation pattern. The raw `<button>` with link styling is appropriate here and does not violate the button hierarchy. No change needed.
  - [x] 2.5 Audit the mode toggle link in auth-screen.tsx ("Already have an account? Sign in" / "New here? Create an account"). Currently uses a raw `<button>` with `text-sm text-muted-foreground underline-offset-4 hover:underline`. This is a Ghost-tier action (low priority). The current styling is consistent with Ghost behavior (muted text, no border). No change needed.
  - [x] 2.6 Verify "max one Primary per view" rule. Home page: the only Primary button is the FAB (the logout is `outline`/secondary). Auth screen: the only Primary button is the submit. Correct on both views.

- [x] Task 3: Form pattern compliance (AC: #6)
  - [x] 3.1 **Auth screen form patterns audit.** Check against UX-DR13 requirements:
    - Labels always visible: YES -- email and password fields both have `<label>` elements above the input. No placeholder-only labels.
    - Validation fires on blur: YES -- `react-hook-form` is configured with `mode: "onBlur"` in auth-screen.tsx line 46.
    - Submit always enabled: YES -- the submit button is disabled only during `isPending` (mutation in flight), never due to validation state. When fields are empty/invalid, clicking submit triggers validation display. Correct.
    - Enter submits: YES -- this is a `<form>` with `onSubmit`. The browser natively handles Enter on form fields. The multi-field form (email + password) submits on Enter from any field. Correct.
    - Tab navigates between fields: YES -- native browser behavior for `<input>` elements in a form. Tab order is email -> password -> submit button. Correct.
    All auth form patterns are compliant. No changes needed.
  - [x] 3.2 **FAB input form patterns audit.** Check against UX-DR13:
    - Labels always visible: The FAB input uses `placeholder="What needs to be done?"` and `aria-label="Todo description"` but has NO visible `<label>`. This is a placeholder-only label pattern. The UX spec says "labels are always visible (no placeholder-only labels)." However, the FAB is a special case -- it is a single-field inline input panel, not a traditional form. Adding a visible label above the input would increase the panel height and change the compact design. **Decision:** Add a visible label above the input that is compact and does not disrupt the design. Use the `text-label` utility class (13px/500) for a small, unobtrusive label:
    ```tsx
    <div className="flex flex-col gap-1.5">
      <label htmlFor="fab-input" className="text-label text-muted-foreground">
        New todo
      </label>
      <div className="flex items-center gap-2">
        <Input
          id="fab-input"
          ref={inputRef}
          ...
        />
        <Button ...>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
    ```
  - [x] 3.3 **FAB input -- Enter submits:** YES -- `handleKeyDown` on line 108 intercepts Enter and calls `handleSubmit()`. This is a single-field form where Enter submits. Correct.
  - [x] 3.4 **FAB input -- validation fires on blur:** Currently validation only fires on submit (checking for empty trimmed string). Add an `onBlur` handler to the FAB input to show the validation error if the field is empty when the user tabs away:
    ```tsx
    onBlur={() => {
      if (!description.trim()) {
        setValidationError("Description cannot be empty")
      }
    }}
    ```
    Also clear the validation error when the user starts typing (already handled by the `onChange` handler which calls `setValidationError(null)`).
  - [x] 3.5 **FAB input -- submit always enabled:** YES -- the submit button has no `disabled` prop based on validation. It fires handleSubmit which checks and shows the error. Correct.
  - [x] 3.6 **FAB validation error styling.** Currently `text-xs text-destructive` at line 180. Update to `text-caption text-destructive` for typography token consistency (text-caption = 12px/400, close to text-xs but uses the project's token system).
  - [x] 3.7 **Add maxLength to FAB input.** Absorb deferred item from Story 3-3 code review: "No input maxLength constraint." Add `maxLength={500}` to the FAB Input component. This is a reasonable client-side limit that prevents overflow without being restrictive. The server does not enforce a limit, so this is purely a UX guardrail.

- [x] Task 4: Skeleton screen verification (AC: #7)
  - [x] 4.1 Verify TodoSkeleton in home.tsx renders skeleton rows, not spinners. Current implementation (lines 11-26): renders 3 skeleton rows with `animate-pulse` on circular and rectangular elements, mimicking the todo item layout. This IS a skeleton screen pattern (not a spinner). Correct per UX-DR17.
  - [x] 4.2 Verify skeleton rows are responsive. The skeleton uses `flex items-center gap-3 min-h-[44px] px-2 py-2` which matches the TodoItem layout. The width classes (`w-3/4`, `w-1/2`, `w-2/3`) are relative, so they scale with container width. Correct at all breakpoints.
  - [x] 4.3 Minor enhancement: Add `aria-busy="true"` to the skeleton container. The parent `<div>` already has `aria-busy={isLoading}` on the content wrapper (home.tsx line 60), so the skeleton content is already within an aria-busy region. The skeleton itself has `role="status" aria-label="Loading todos"`. Correct. No changes needed.

- [x] Task 5: Verify and test (AC: all)
  - [x] 5.1 Run `pnpm typecheck` from `frontend/` -- 0 errors expected.
  - [x] 5.2 Run `pnpm lint` from `frontend/` -- 0 errors, 0 warnings expected.
  - [x] 5.3 Manual test: Open the app in Chrome, resize to 375px width (mobile). Verify: content is full-width with ~16px padding, no horizontal scrollbar, FAB is 16px from edges. Verify AC #1, #4.
  - [x] 5.4 Manual test: Resize to 768px width (tablet). Verify: content is centered in a ~640px column with 32px padding. Verify AC #2.
  - [x] 5.5 Manual test: Resize to 1440px width (desktop). Verify: layout is identical to tablet -- content does not widen beyond 640px. Verify AC #3.
  - [x] 5.6 Manual test: Open the expanded FAB. Verify the submit button meets 44px touch target. Verify the "New todo" label is visible above the input. Verify AC #5, #6.
  - [x] 5.7 Manual test: In the expanded FAB, type nothing, tab away from the input. Verify validation error appears on blur. Type a description, press Enter. Verify submission. Verify AC #6.
  - [x] 5.8 Manual test: On the auth screen, verify labels ("Email", "Password") are visible. Tab between fields. Submit with empty fields to see validation errors. Submit with valid credentials. Verify AC #6.
  - [x] 5.9 Manual test: Hover over icon-only buttons (FAB, theme toggle, delete X). Verify native tooltip appears. Verify AC #5.
  - [x] 5.10 Manual test: Verify all changes work in BOTH light and dark modes.
  - [x] 5.11 Manual test: Load the app as an authenticated user. Verify skeleton screens appear during initial fetch (not spinners). Verify AC #7.

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** This project uses Tailwind CSS v4 with `@theme inline` in `src/index.css`. There is NO `tailwind.config.ts`. All theme customization goes through CSS custom properties + the `@theme inline` block. [Source: architecture.md#Styling Solution]
- **No JS animation libraries.** Do NOT install framer-motion, react-spring, auto-animate. All animation is CSS transitions + keyframes + JS class toggling. [Source: architecture.md#UX-Driven Architectural Requirements]
- **shadcn/ui v4 with `base-nova` style.** Components consume Tailwind theme variables. [Source: frontend/components.json]
- **`class` strategy for dark mode.** The `@custom-variant dark (&:is(.dark *));` directive enables Tailwind's `dark:` variant. [Source: architecture.md#Styling Solution]
- **File naming: kebab-case. Component naming: PascalCase.** [Source: architecture.md#Naming Patterns]
- **No hardcoded color values in component files.** All colors from CSS variables via Tailwind token classes. [Source: architecture.md#Anti-Patterns]
- **No `any` type in TypeScript.** [Source: architecture.md#Anti-Patterns]

### Canonical Breakpoints

The UX spec defines exactly two meaningful Tailwind breakpoints:

| Breakpoint | Tailwind class | Width threshold | Purpose |
|---|---|---|---|
| `sm` | `sm:` | 640px | Switch from mobile to tablet layout (padding, FAB position) |
| `lg` | `lg:` | 1024px | Desktop -- identical to tablet, no layout change |

The `lg` breakpoint is referenced in the UX spec for completeness but produces no layout change. The only actionable breakpoint is `sm` (640px). Font sizes do NOT change between breakpoints.

Container strategy: `max-w-[640px] mx-auto px-4 sm:px-8` -- this is the canonical responsive container.

### Button Hierarchy Mapping (UX-DR14 to shadcn/ui)

| UX Role | shadcn variant | Max per view | Current usage |
|---|---|---|---|
| Primary | `default` (filled accent) | 1 | Auth submit, FAB idle, FAB submit (icon) |
| Secondary | `outline` | unlimited | Logout "Sign out" |
| Ghost | `ghost` | unlimited | Theme toggle, "Confirm delete" |
| Icon-only | any variant + `size="icon"` | unlimited | FAB (idle + submit), theme toggle, delete X |
| Link-style | raw `<button>` with underline | unlimited | "Try again", auth mode toggle |

The FAB idle button is simultaneously Primary (accent fill) and Icon-only (44px+ target). The FAB submit is Primary + Icon-only. This is correct -- icon-only is a size modifier, not a separate hierarchy tier.

### Form Pattern Checklist (UX-DR13)

| Pattern | Auth Screen | FAB Input |
|---|---|---|
| Visible labels | YES (label elements) | NEEDS FIX (placeholder-only) |
| Validation on blur | YES (mode: "onBlur") | NEEDS FIX (submit-only) |
| Submit always enabled | YES | YES |
| Enter submits | YES (native form) | YES (onKeyDown handler) |
| Tab navigation | YES (native) | N/A (single field) |

### Deferred Items Absorbed by This Story

1. **No input maxLength constraint on FAB** (from 3-3 code review) -- Addressed in Task 3.7.

### Deferred Items NOT Addressed (pushed to 4-8)

- **`aria-controls` references element absent from DOM when collapsed** (from 3-2 code review) -- a11y concern for Story 4-8.
- **Empty `<div role="list">` announced by screen reader when no active todos** (from 3-2 code review) -- a11y concern for Story 4-8.
- **No `aria-live` announcement for deleted items** (from 3-5 code review) -- a11y concern for Story 4-8.
- **No Escape key handling on delete confirmation row** (from 4-4 code review) -- a11y concern for Story 4-8.
- **FAB z-index not set explicitly** (from 3-3 code review) -- no stacking conflict exists currently; monitor during responsive testing. If issues arise, add `z-40` to the FAB.

### Responsive Layout Current vs Target State

**home.tsx container:**
- Current: `mx-auto max-w-2xl px-4 py-6 sm:px-8` (max-w-2xl = 42rem = 672px)
- Target: `mx-auto max-w-[640px] px-4 py-6 sm:px-8` (exact 640px per UX spec)

**FAB idle button positioning:**
- Current: `fixed bottom-6 right-6 sm:bottom-8 sm:right-8` (24px mobile, 32px tablet+)
- Target: `fixed bottom-4 right-4 sm:bottom-6 sm:right-6` (16px mobile, 24px tablet+)

**FAB expanded panel positioning:**
- Current: `fixed bottom-6 right-6 left-6` / `sm:bottom-8 sm:left-auto sm:right-8 sm:w-[400px]`
- Target: `fixed bottom-4 right-4 left-4` / `sm:bottom-6 sm:left-auto sm:right-6 sm:w-[400px]`

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
- `slide-down-strip` (Story 4-6)

### Cross-Story Dependencies

- **Story 4-1 (done):** Design tokens, typography utilities -- this story consumes them.
- **Story 4-2 (done):** Dark mode theming -- all changes must work in both light and dark.
- **Story 4-3 (done):** Completion animations -- not directly affected by this story.
- **Story 4-4 (done):** FAB animations, FAB input panel -- this story modifies FAB positioning and adds a visible label.
- **Story 4-5 (done):** Auth screen -- this story verifies (but likely does not modify) auth form patterns.
- **Story 4-6 (done):** OfflineIndicator, toasts -- this story verifies responsive behavior.
- **Story 4-8 (future):** Accessibility -- will add `prefers-reduced-motion`, aria-live regions. Do NOT add reduced-motion handling in this story.

### Previous Story Intelligence (Story 4-6)

1. `pnpm typecheck` and `pnpm lint` both pass with 0 errors/warnings. Maintain this.
2. Backend has 47 passing tests. No backend changes in this story.
3. No frontend test framework is configured. Manual testing only.
4. The `cn()` utility from `@/lib/utils` is used for conditional class merging.
5. All animation durations reference motion tokens -- no hardcoded values in CSS.
6. `DURATION_SLOW_MS = 300` and `DURATION_NORMAL_MS = 200` constants are established in `todo-item.tsx`.
7. The `onAnimationEnd` event handler pattern was used in FAB (Story 4-4).
8. Sonner toast styling uses CSS variable overrides via `[data-sonner-toaster]` selector in `index.css`.
9. Story 4-6 created `offline-indicator.tsx` with `z-50` positioning. The FAB has no explicit z-index.

### What NOT To Do

- Do NOT install framer-motion, react-spring, @formkit/auto-animate, or any JS animation library
- Do NOT install @radix-ui/react-tooltip or the shadcn Tooltip component -- use native `title` attribute for tooltips
- Do NOT modify the backend
- Do NOT add `prefers-reduced-motion` media queries -- that belongs to Story 4-8
- Do NOT create a `tailwind.config.ts` file
- Do NOT hardcode color values -- use Tailwind semantic tokens and CSS variables
- Do NOT add new keyframes or animation utilities (this story is about layout and patterns, not animations)
- Do NOT modify `use-auth.ts`, `auth-provider.tsx`, or `auth-guard.tsx`
- Do NOT change font sizes between breakpoints -- the UX spec explicitly says "Font sizes do not change between breakpoints"
- Do NOT widen the layout beyond 640px on desktop -- the UX spec says "same as tablet -- layout doesn't benefit from wider columns"

### Project Structure Notes

Files to modify:
- `frontend/src/pages/home.tsx` -- max-width from `max-w-2xl` to `max-w-[640px]`
- `frontend/src/components/fab.tsx` -- FAB positioning (mobile 16px, tablet 24px), submit button touch target, visible label, onBlur validation, maxLength, title attributes
- `frontend/src/components/theme-toggle.tsx` -- add `title` attribute
- `frontend/src/components/todo-item.tsx` -- add `title` attribute to delete button

Files to verify (no changes expected):
- `frontend/src/components/auth-screen.tsx` -- verify form patterns are compliant (likely no changes)
- `frontend/src/components/offline-indicator.tsx` -- verify responsive at 375px
- `frontend/src/components/empty-state.tsx` -- verify responsive
- `frontend/src/components/completed-section.tsx` -- verify responsive
- `frontend/src/index.css` -- no changes expected (no new tokens or keyframes)

No backend changes. No new files. No new npm packages.

### References

- [Source: epics.md#Story 4.7 -- acceptance criteria, UX-DR13, UX-DR14, UX-DR15, UX-DR17, FR23 references]
- [Source: ux-design-specification.md#Responsive Design & Accessibility -- breakpoints, container strategy, breakpoint usage]
- [Source: ux-design-specification.md#UX Consistency Patterns -- Button Hierarchy, Form Patterns]
- [Source: ux-design-specification.md#Spacing & Layout Foundation -- 640px max-width, horizontal padding, FAB positioning]
- [Source: ux-design-specification.md#Additional Patterns -- skeleton screens, destructive confirmation]
- [Source: architecture.md#Structure Patterns -- file organization, naming conventions]
- [Source: architecture.md#Anti-Patterns -- forbidden patterns]
- [Source: deferred-work.md -- "No input maxLength constraint" -- absorbed by this story]
- [Source: 4-6-component-polish-completedsection-emptystate-and-system-feedback.md -- previous story patterns, deferred items]
- [Source: frontend/src/pages/home.tsx -- current container layout]
- [Source: frontend/src/components/fab.tsx -- current FAB positioning and input panel]
- [Source: frontend/src/components/auth-screen.tsx -- current form implementation]
- [Source: frontend/src/components/ui/button.tsx -- available variants and sizes]
- [Source: frontend/src/components/ui/input.tsx -- Input component definition]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `pnpm typecheck` -- 0 errors
- `pnpm lint` -- 0 errors, 0 warnings
- `pnpm build` -- pre-existing TS2554 error in `login.tsx:25` (unrelated to story changes, `useRef` needs initial argument under `tsc -b` strict mode from tsconfig.app.json)

### Completion Notes List

- Container max-width changed from `max-w-2xl` (672px) to exact `max-w-[640px]` per UX spec
- FAB idle button repositioned: 16px (mobile) / 24px (tablet+) from viewport edges
- FAB expanded panel repositioned: same 16px/24px breakpoint pattern
- FAB submit button touch target raised from 32px to 44px via `min-h-[44px] min-w-[44px]`
- Native `title` tooltips added to all 4 icon-only buttons (FAB idle, FAB submit, theme toggle, delete)
- Visible "New todo" label added to FAB input panel using `text-label` typography token and `<label htmlFor>` pattern
- FAB onBlur validation added -- shows error when input is empty and loses focus
- FAB input `maxLength={500}` added (absorbed deferred item from 3-3 code review)
- FAB validation error styling changed from `text-xs` to `text-caption` for typography token consistency
- Removed redundant `aria-label="Todo description"` from FAB input (visible `<label>` now provides accessible name)
- Auth screen, OfflineIndicator, skeleton screens verified compliant -- no changes needed
- Button hierarchy audit confirmed: max one Primary per view, all icon buttons meet 44px minimum
- Updated `deferred-work.md` to mark maxLength item as resolved

### Change Log

- 2026-04-15: Story 4-7 implementation -- responsive layout (640px container, FAB mobile positioning), button hierarchy fixes (FAB submit 44px, tooltips), form pattern compliance (FAB visible label, onBlur validation, maxLength), skeleton verification. Absorbed deferred maxLength from 3-3.

### File List

- `frontend/src/pages/home.tsx` -- max-width from `max-w-2xl` to `max-w-[640px]`
- `frontend/src/components/fab.tsx` -- FAB positioning (16px mobile/24px tablet), submit button 44px touch target, visible label, onBlur validation, maxLength, title tooltips, text-caption styling
- `frontend/src/components/theme-toggle.tsx` -- added `title` attribute
- `frontend/src/components/todo-item.tsx` -- added `title` attribute to delete button
- `_bmad-output/implementation-artifacts/deferred-work.md` -- marked maxLength item as resolved

### Review Findings

- [x] [Review][Patch] `login.tsx:25` useRef missing initial argument breaks `tsc -b` build -- fixed: added `undefined` as initial value [frontend/src/pages/login.tsx:25]
- [x] [Review][Defer] ThemeToggle `window.matchMedia` not SSR-safe [frontend/src/components/theme-toggle.tsx:22] -- deferred, pre-existing (already tracked in deferred-work.md)
- [x] [Review][Defer] FAB `maxLength={500}` paste silently truncates without user feedback [frontend/src/components/fab.tsx:178] -- deferred, standard browser behavior
