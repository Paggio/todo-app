# Story 4.2: Light/Dark Mode Theming

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the app to support light and dark modes based on my system preference,
so that it's comfortable to use in any lighting condition.

## Acceptance Criteria

1. **Given** the theme-provider component **When** it initializes on app mount **Then** it detects the system preference via `prefers-color-scheme` and applies the matching theme (UX-DR2)

2. **Given** the `class` strategy for dark mode **When** dark mode is active **Then** a `dark` class is applied to the root element and a `data-theme` attribute is set for future user-preference override (UX-DR2)

3. **Given** dark mode is active **When** CSS custom properties resolve **Then** they switch to the dark palette: --background: #000000, --foreground: #F5F5F7, --card: #1C1C1E, --primary: #4D9FFF, --muted-foreground: #98989D, --border: #38383A, --ring: #4D9FFF, --color-accent-blue: #4D9FFF, --color-accent-soft: #4D9FFF1A, --color-warning: #FF9F0A (UX-DR2)

4. **Given** any text/background combination in either mode **When** contrast is measured **Then** it meets WCAG AA minimum (4.5:1 ratio for normal text, 3:1 for large text)

## Tasks / Subtasks

- [x] Task 1: Audit and fix dark mode color contrast to WCAG AA (AC: #4)
  - [x] 1.1 Compute contrast ratios for all foreground/background pairings in light mode. Key pairings: `--foreground` (#1D1D1F) on `--background` (#FFFFFF), `--muted-foreground` (#6E6E73) on `--background` (#FFFFFF), `--muted-foreground` (#6E6E73) on `--muted` (#F5F5F7), `--primary` (#0066FF) on `--background` (#FFFFFF), `--primary-foreground` (#FFFFFF) on `--primary` (#0066FF), `--destructive` (#FF3B30) on `--background` (#FFFFFF), `--foreground` (#1D1D1F) on `--card` (#FFFFFF). Document each ratio.
  - [x] 1.2 Compute contrast ratios for all foreground/background pairings in dark mode. Key pairings: `--foreground` (#F5F5F7) on `--background` (#000000), `--muted-foreground` (#98989D) on `--background` (#000000), `--muted-foreground` (#98989D) on `--muted` (#1C1C1E), `--primary` (#4D9FFF) on `--background` (#000000), `--primary-foreground` (#000000) on `--primary` (#4D9FFF), `--destructive` (#FF453A) on `--background` (#000000), `--foreground` (#F5F5F7) on `--card` (#1C1C1E). Document each ratio.
  - [x] 1.3 Identify any pairings that fail WCAG AA (< 4.5:1 for normal text or < 3:1 for large text/UI components). Adjust the failing token values in `frontend/src/index.css` in both `:root` and `.dark` blocks. **Critical constraint:** Do NOT change the shadcn semantic variable names -- only adjust hex values. Prefer nudging the failing color toward higher/lower luminance by the minimum needed to pass. Document the before/after values and ratios.
  - [x] 1.4 If `--muted-foreground` fails contrast on `--muted` background in either mode, adjust `--muted-foreground` value. This is the most likely failure point: #6E6E73 on #F5F5F7 in light mode and #98989D on #1C1C1E in dark mode.

- [x] Task 2: Audit all components for dark mode visual correctness (AC: #3)
  - [x] 2.1 Review every component file (`todo-item.tsx`, `fab.tsx`, `completed-section.tsx`, `auth-screen.tsx`, `empty-state.tsx`, `todo-list.tsx`) and every page file (`home.tsx`, `login.tsx`) for hardcoded colors. **There should be none** -- Story 4-1 established that all colors come from CSS variables via Tailwind semantic classes. Verify this is the case.
  - [x] 2.2 Review shadcn/ui components (`button.tsx`, `input.tsx`) for any dark mode issues. The button component already uses `dark:` variant classes (e.g., `dark:border-input`, `dark:bg-input/30`). Verify these map correctly to the Apple-inspired dark palette.
  - [x] 2.3 Check inline SVGs in `todo-item.tsx` (the checkmark and delete icon). They use `text-background` and `text-muted-foreground` / `text-destructive` classes. Verify these resolve correctly in dark mode -- `text-background` should be dark (#000000) for the checkmark fill on the dark accent circle.
  - [x] 2.4 Check the FAB component (`fab.tsx`) -- it uses `bg-background`, `border-border`, `text-destructive`, `shadow-lg`. Verify the expansion panel renders correctly in dark mode. The `shadow-lg` is a default Tailwind shadow; consider whether it needs to be replaced with the custom `shadow-elevated` token for visual consistency.
  - [x] 2.5 Check the auth-screen component (`auth-screen.tsx`) -- it uses `bg-card`, `border`, `text-destructive`, `text-muted-foreground`. Verify card surface reads correctly against dark background.
  - [x] 2.6 If any component needs `dark:` variant overrides to look correct, add them. Prefer using existing semantic token classes over adding new CSS variables. **Do NOT add new color tokens** -- use the existing palette.

- [x] Task 3: Verify ThemeProvider system preference detection (AC: #1, #2)
  - [x] 3.1 The ThemeProvider already detects `prefers-color-scheme` via `window.matchMedia("(prefers-color-scheme: dark)")` and applies the correct class + `data-theme` attribute. This was implemented in Story 4-1. **No code changes needed** -- verify the existing implementation.
  - [x] 3.2 Verify that when theme is "system" and OS preference changes at runtime, the ThemeProvider's `handleChange` listener fires and calls `applyTheme("system")` which re-resolves the system theme. Existing code already does this (lines 131-138 of `theme-provider.tsx`).
  - [x] 3.3 Verify that localStorage persistence works: theme choice survives page refresh. Existing code stores in `localStorage.getItem("theme")` / `localStorage.setItem("theme", ...)`.
  - [x] 3.4 Verify the keyboard toggle ('d' key) works: pressing 'd' cycles through themes (light -> dark -> light, or resolves system to the opposite). Existing code handles this (lines 143-181 of `theme-provider.tsx`).

- [x] Task 4: Add a visible theme toggle UI control (AC: #1, #2)
  - [x] 4.1 Create a new component `frontend/src/components/theme-toggle.tsx`. It should render an icon button (Sun/Moon icons from `lucide-react`) that toggles between light and dark mode by calling `setTheme()` from the `useTheme` hook. Spec: Ghost variant button, 44x44px minimum touch target, positioned in the top-right corner of the authenticated view (header area). When theme is "light" show Moon icon; when "dark" show Sun icon; when "system" show the icon matching current resolved theme.
  - [x] 4.2 Place the theme toggle in the header area of `frontend/src/pages/home.tsx`, next to the existing logout button. Use a flex row layout: app title left, toggle + logout right.
  - [x] 4.3 Also place the theme toggle on the auth screen (`frontend/src/pages/login.tsx` or `frontend/src/components/auth-screen.tsx`) -- position it in the top-right corner of the viewport so users can switch theme before authenticating.
  - [x] 4.4 The toggle should use `useTheme()` from `@/components/theme-provider`. When clicked: if current theme is "light" set to "dark"; if "dark" set to "light"; if "system" resolve current and set to opposite. This mirrors the keyboard 'd' shortcut logic.
  - [x] 4.5 Use the `disableTransitionOnChange` feature (already enabled by default in ThemeProvider) to prevent a flash of transitioning elements when toggling.

- [x] Task 5: Verify dark mode shadow and elevation tokens (AC: #3)
  - [x] 5.1 The shadow tokens (`--shadow-subtle`, `--shadow-resting`, `--shadow-elevated`) use `rgba(0, 0, 0, ...)` which works in light mode but is barely visible on dark backgrounds. Add dark mode shadow variants in the `.dark` block in `frontend/src/index.css`:
    ```css
    --shadow-subtle:   0 1px 2px rgba(0, 0, 0, 0.20);
    --shadow-resting:  0 1px 3px rgba(0, 0, 0, 0.30), 0 1px 2px rgba(0, 0, 0, 0.25);
    --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.40), 0 1px 4px rgba(0, 0, 0, 0.30);
    ```
    Dark mode shadows need higher opacity because black shadows on dark backgrounds have almost no contrast. Alternatively, use a subtle light glow approach (`rgba(255, 255, 255, 0.05)`) -- choose based on visual testing. The Apple approach is to increase shadow opacity on dark.
  - [x] 5.2 Verify the `shadow-lg` default Tailwind class used by the FAB expansion panel. If it looks wrong in dark mode, replace with `shadow-elevated` to use the token system.

- [x] Task 6: Verify and test (AC: all)
  - [x] 6.1 Run `pnpm typecheck` from `frontend/` -- 0 errors expected.
  - [x] 6.2 Run `pnpm lint` from `frontend/` -- 0 errors, 0 warnings expected.
  - [x] 6.3 Run backend test suite (`cd backend && python -m pytest tests/ -v`) -- all 47 tests must pass. No backend changes in this story.
  - [x] 6.4 Manual smoke test in light mode: `docker compose up`, verify the app loads. Check all screens: login, register (toggle), todo list (active + completed items), empty state, FAB expanded, error state. All should render correctly with the light palette.
  - [x] 6.5 Manual smoke test in dark mode: press 'd' key to toggle. Verify all the same screens render correctly with the dark palette. Specifically check:
    - Background is pure black (#000000)
    - Text is near-white (#F5F5F7)
    - Card surfaces (auth card, FAB panel) are dark gray (#1C1C1E)
    - Borders are visible (#38383A)
    - Accent blue is lighter (#4D9FFF)
    - Focus rings are visible in accent blue
    - Checkmark icon is visible against its background in both completed and active states
    - Delete button (destructive) text is visible (#FF453A)
    - Muted text is readable against both `--background` and `--muted`/`--card` surfaces
  - [x] 6.6 Test the new theme toggle button: click to toggle between light and dark. Verify it persists across page refresh.
  - [x] 6.7 Test system preference detection: in browser devtools, emulate `prefers-color-scheme: dark` and `prefers-color-scheme: light`. With theme set to "system", verify the app follows the emulated preference.
  - [x] 6.8 Verify `data-theme` attribute changes: inspect `<html>` element, confirm it reads `data-theme="light"` or `data-theme="dark"` matching the active theme.

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** This project uses Tailwind CSS v4 which configures the theme via the `@theme inline` block in `src/index.css`, NOT via a `tailwind.config.js/ts` file. There is no `tailwind.config.ts` in this project. All theme customization goes through CSS custom properties + the `@theme inline` block. [Source: architecture.md#Styling Solution, frontend/src/index.css]
- **shadcn/ui v4 with `base-nova` style.** Components consume Tailwind theme variables (`bg-background`, `text-foreground`, `bg-primary`, etc.) -- changing CSS custom properties re-themes all shadcn components automatically. [Source: frontend/components.json]
- **`class` strategy for dark mode.** The `@custom-variant dark (&:is(.dark *));` directive in `src/index.css` enables Tailwind's `dark:` variant via a `.dark` class on the root element, NOT via `prefers-color-scheme` media query. The ThemeProvider manages the class. [Source: architecture.md#Styling Solution]
- **File naming: kebab-case** for frontend files. **Component naming: PascalCase.** [Source: architecture.md#Naming Patterns]
- **No hardcoded color values in component files.** All colors must come from CSS variables via Tailwind token classes. [Source: architecture.md#Enforcement Guidelines]
- **No `any` type in TypeScript.** [Source: architecture.md#Anti-Patterns]
- **lucide-react** is already installed and used for icons (Plus, Send in FAB). Use `Sun` and `Moon` icons from lucide-react for the theme toggle. [Source: frontend/src/components/fab.tsx]

### What Already Works (from Story 4-1)

The entire design token infrastructure is in place. Specifically:
- Light mode palette defined in `:root` with Apple-inspired hex values
- Dark mode palette defined in `.dark` with Apple-inspired dark hex values
- Custom color tokens (`--color-accent-blue`, `--color-accent-soft`, `--color-warning`) for both modes
- Shadow, spacing, motion, and typography tokens defined
- ThemeProvider already detects `prefers-color-scheme`, applies `.dark` class + `data-theme` attribute, persists in localStorage, and supports 'd' key toggle
- All existing components use semantic Tailwind classes (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, etc.) -- no hardcoded colors

**This story's job is NOT to build the dark mode infrastructure -- it is already built. This story's job is to:**
1. Audit and fix WCAG AA contrast compliance for all token pairings
2. Audit components for dark mode visual correctness (edge cases, SVG icons, shadows)
3. Add a visible theme toggle UI (the 'd' shortcut exists but is not discoverable)
4. Add dark mode shadow variants (current shadows are invisible on dark backgrounds)
5. Verify everything works end-to-end

### Contrast Ratio Reference

Pre-computed ratios (verify these during Task 1):

**Light mode (likely passing):**
- #1D1D1F on #FFFFFF = ~16.7:1 (passes)
- #6E6E73 on #FFFFFF = ~5.0:1 (passes AA for normal text)
- #6E6E73 on #F5F5F7 = ~4.7:1 (borderline -- verify and fix if < 4.5:1)
- #0066FF on #FFFFFF = ~4.7:1 (borderline for normal text -- verify)
- #FFFFFF on #0066FF = ~4.7:1 (same as inverse)
- #FF3B30 on #FFFFFF = ~4.0:1 (fails AA for normal text -- passes for large text/UI components only)

**Dark mode (more risk of failures):**
- #F5F5F7 on #000000 = ~17.4:1 (passes)
- #98989D on #000000 = ~5.6:1 (passes)
- #98989D on #1C1C1E = ~4.6:1 (borderline -- verify)
- #4D9FFF on #000000 = ~6.5:1 (passes)
- #000000 on #4D9FFF = ~6.5:1 (passes)
- #FF453A on #000000 = ~4.7:1 (borderline -- verify)

**Known risk areas:**
- `--muted-foreground` on `--muted` (both modes) -- the combination of muted text on muted surface is the tightest
- `--destructive` on `--background` in light mode (#FF3B30 on #FFFFFF) -- may fail AA normal text. This is used for form validation errors which are typically small text. Consider darkening the red slightly (e.g., #E53528) or accept the ratio if only used on large text/UI elements.
- `--primary` on `--background` in light mode (#0066FF on #FFFFFF) -- borderline. This is used for links and primary buttons. Button text is `--primary-foreground` (white) ON `--primary` (blue), not blue on white, so the critical pairing is white-on-blue which should pass.

### Deferred Items Relevant to This Story

From `deferred-work.md`:
- **"tap +" copy implies touch-only** (Story 3.6 review) -- copy refinement deferred to Story 4.6 (EmptyState polish). Not addressed here.
- **"Try again" button has no loading indicator during refetch** (Story 3.6 review) -- UX polish deferred to Story 4.6 or 4.7. Not addressed here.

### Cross-Story Dependencies in Epic 4

- **Story 4.1 (done):** Established all design tokens. This story builds directly on that infrastructure.
- **Story 4.3 (Completion Animation):** Will use motion tokens and may add dark: variant animation tweaks. This story should NOT add completion animations -- only verify existing static states look correct in dark mode.
- **Story 4.5 (Auth Screen):** Will add frosted glass overlay. This story should verify auth-screen card renders correctly in dark mode with existing styles.
- **Story 4.8 (Accessibility):** Will add `prefers-reduced-motion` wrapping. Do NOT add reduced-motion support in this story.

### Previous Story Intelligence (Story 4-1)

1. **pnpm typecheck and pnpm lint both pass** with 0 errors/warnings after Story 4-1. Maintain this.
2. **Backend has 47 passing tests.** No backend changes in this story. Backend suite should remain untouched.
3. **No frontend test framework is configured.** Manual testing only (typecheck + lint + Docker smoke test).
4. **The `cn()` utility** from `@/lib/utils` is used for conditional class merging. Use it for any conditional dark mode classes.
5. **Story 4-1 review was clean** -- all three review layers passed. The token infrastructure is solid.
6. **ThemeProvider `disableTransitionOnChange` is ON by default.** This prevents flash of transitioning elements when theme changes. Keep this behavior for the new toggle button.
7. **The `@theme inline` block maps CSS vars to Tailwind tokens.** Shadow tokens are already registered there. No new `@theme inline` entries needed unless adding entirely new tokens.

### Project Structure Notes

Files to modify:
- `frontend/src/index.css` -- add dark mode shadow overrides in `.dark` block, potentially adjust contrast-failing color values
- `frontend/src/pages/home.tsx` -- add theme toggle button in header area
- `frontend/src/pages/login.tsx` or `frontend/src/components/auth-screen.tsx` -- add theme toggle on auth screen

Files to create:
- `frontend/src/components/theme-toggle.tsx` -- new theme toggle button component

Files to verify (no changes expected):
- `frontend/src/components/theme-provider.tsx` -- already complete from Story 4-1
- `frontend/src/components/todo-item.tsx` -- verify dark mode rendering
- `frontend/src/components/fab.tsx` -- verify dark mode rendering
- `frontend/src/components/completed-section.tsx` -- verify dark mode rendering
- `frontend/src/components/auth-screen.tsx` -- verify dark mode rendering
- `frontend/src/components/empty-state.tsx` -- verify dark mode rendering

No backend changes. No new npm packages needed (lucide-react already installed).

### What NOT To Do

- Do NOT create a `tailwind.config.ts` file -- Tailwind v4 uses CSS-based configuration
- Do NOT change any backend files
- Do NOT add new npm packages -- `lucide-react` is already installed for icons
- Do NOT add `prefers-reduced-motion` wrapping -- that belongs to Story 4.8 (Accessibility)
- Do NOT add completion/creation/deletion animations -- that belongs to Stories 4.3 and 4.4
- Do NOT add frosted glass overlay to auth screen -- that belongs to Story 4.5
- Do NOT modify the typography scale or spacing tokens -- those are finalized from Story 4.1
- Do NOT apply typography utility classes to components -- that belongs to Story 4.6
- Do NOT change the `@custom-variant dark` directive -- it is correct as-is
- Do NOT change the ThemeProvider's detection/toggle logic -- it is already correct from Story 4.1
- Do NOT add a `color-scheme: dark` CSS property -- the `class` strategy handles everything via the `.dark` class on root
- Do NOT remove existing `dark:` variant classes from shadcn button.tsx -- they are correct

### References

- [Source: epics.md#Story 4.2 -- acceptance criteria and requirements]
- [Source: ux-design-specification.md#Visual Design Foundation -- color system (light/dark), accessibility considerations]
- [Source: ux-design-specification.md#Design System Foundation -- class strategy for dark mode, CSS custom property tokens]
- [Source: ux-design-specification.md#Responsive Design & Accessibility -- WCAG AA targets, focus ring requirements]
- [Source: architecture.md#Styling Solution -- Tailwind CSS v4, class strategy for dark mode]
- [Source: architecture.md#Naming Patterns -- kebab-case files, PascalCase components]
- [Source: architecture.md#Anti-Patterns -- no hardcoded colors, no `any` type]
- [Source: frontend/src/index.css -- current token infrastructure with light/dark palettes]
- [Source: frontend/src/components/theme-provider.tsx -- current ThemeProvider with system detection, class toggle, data-theme, localStorage, keyboard shortcut]
- [Source: frontend/src/components/fab.tsx -- lucide-react icons already in use (Plus, Send)]
- [Source: 4-1-design-token-system-and-typography.md -- previous story completion notes, file list, review findings]
- [Source: deferred-work.md -- Epic 4 deferred items from previous stories]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- WCAG AA contrast audit complete. Light mode: only `--destructive` (#FF3B30) failed at 3.55:1 on white -- adjusted to #DC3528 (4.58:1). All other light pairings pass. Dark mode: all pairings pass without changes.
- `--muted-foreground` on `--muted` passes in both modes (light: 4.66:1, dark: 5.93:1). No adjustment needed.
- All components verified: no hardcoded colors found. All use semantic Tailwind token classes. No `dark:` variant overrides needed.
- shadcn button/input components already have correct `dark:` variant classes from base-nova style.
- ThemeProvider system detection, localStorage persistence, data-theme attribute, and 'd' keyboard shortcut all verified working from Story 4-1. No changes needed.
- Created ThemeToggle component using lucide-react Sun/Moon icons, ghost variant, 44x44px touch target.
- Placed theme toggle in home.tsx header (next to Sign out button) and auth-screen.tsx (absolute top-right corner).
- Added dark mode shadow overrides in `.dark` block with increased opacity (Apple approach).
- Replaced Tailwind `shadow-lg` with `shadow-elevated` token on FAB (both idle and expanded states) for consistent dark mode shadows.
- TypeScript: 0 errors. ESLint: 0 errors/warnings. Backend: 47/47 tests pass. Frontend build: success.

### Change Log

- 2026-04-15: Story 4-2 implementation complete. Contrast fix (--destructive), theme toggle component, dark mode shadow overrides, FAB shadow token migration.

### File List

- frontend/src/index.css (modified) -- adjusted --destructive from #FF3B30 to #DC3528 in :root; added dark mode shadow overrides in .dark block
- frontend/src/components/theme-toggle.tsx (created) -- new theme toggle button component with Sun/Moon icons
- frontend/src/pages/home.tsx (modified) -- added ThemeToggle import and placed in header next to logout button
- frontend/src/components/auth-screen.tsx (modified) -- added ThemeToggle import and placed in top-right corner
- frontend/src/components/fab.tsx (modified) -- replaced shadow-lg with shadow-elevated on both idle and expanded states

### Review Findings

- [x] [Review][Defer] ThemeToggle calls window.matchMedia during render (minor SSR/reactivity concern) [frontend/src/components/theme-toggle.tsx:22] -- deferred, pre-existing pattern
- [x] [Review][Defer] ThemeToggle duplicates theme resolution logic instead of consuming resolvedTheme from useTheme hook [frontend/src/components/theme-toggle.tsx:20-25] -- deferred, pre-existing design from Story 4-1

Review summary: 0 decision-needed, 0 patch, 2 defer, 4 dismissed as noise. All acceptance criteria verified and passing. WCAG AA contrast confirmed for both modes. Reviewed 2026-04-15.
