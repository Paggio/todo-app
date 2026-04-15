---
stepsCompleted: [step-01-init, step-02-discovery, step-03-core-experience, step-04-emotional-response, step-05-inspiration, step-06-design-system, step-07-defining-experience, step-08-visual-foundation, step-09-design-directions, step-10-user-journeys, step-11-component-strategy, step-12-ux-patterns, step-13-responsive-accessibility, step-14-complete]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md']
---

# UX Design Specification — bmad_nf_todo_app

**Author:** Mattiapagetti
**Date:** 2026-04-14

---

## Executive Summary

### Project Vision

A personal Todo SPA built as a portfolio showcase — minimal in features, crafted with deliberate aesthetic intent. The "cool, tech-forward feel" is not an afterthought; it *is* the product. Auth is included from day one, making this fully production-ready and publicly deployable.

### Target Users

- **Primary — The Builder:** Daily use by the owner; wants an app that feels genuinely satisfying to use
- **Portfolio Audience:** Developers and recruiters encountering the live link or repo — evaluating visual polish, technical depth, and code quality

### Key Design Challenges

1. **Making a todo list feel genuinely cool** — the interaction model is trivially simple; design craft must do the heavy lifting
2. **Auth that doesn't feel like a wall** — login/register must feel like a natural, polished entry point, not friction
3. **The completion micro-interaction** — the single moment with highest emotional impact; must feel satisfying, not just functional
4. **Optimistic updates + error rollback** — instant feedback must feel confident; errors must recover gracefully without jarring the user

### Design Opportunities

1. **Typography as design** — in a minimal app, type, spacing, and hierarchy *are* the visual design
2. **Auth as a showcase piece** — beautiful login/register screens are rare and memorable; opportunity to make a strong first impression
3. **Empty state as a welcome** — first impression of the todo view; opportunity for personality and warmth
4. **Micro-interactions as the differentiator** — completion toggle, add animation, delete — these elevate the experience from functional to crafted

## Core User Experience

### Defining Experience

The core loop is: **add a todo → work → mark complete**. Everything else is secondary. The interaction model is intentionally simple — the UX ambition lives in how that loop *feels*, not how many things it can do. The app should feel closer to a precision tool than a feature-rich platform.

### Platform Strategy

- **Platform:** Web SPA, browser-only, no native app or PWA in v1
- **Input modes:** Mouse + keyboard (desktop primary), touch (mobile supported)
- **Viewport range:** 375px–unlimited; mobile-first layout
- **No offline support:** All operations require connectivity; graceful error states handle failures
- **Rendering:** Client-side only (no SSR); standard DOM for MCP/Playwright compatibility

### Effortless Interactions

- **Todo creation:** A floating action button (FAB) expands inline — type and submit; no modal, no page navigation, no friction
- **Todo completion:** Single click/tap on the item or a checkbox — immediate visual response, item animates to the completed section at the bottom
- **Login/return:** If session is valid, user lands directly on their list — zero clicks to get to work
- **Deletion:** One action, no confirmation dialog required (undo pattern preferred over "are you sure?")

### Critical Success Moments

1. **First completion** — the moment a todo moves to the completed section for the first time; highest emotional peak; must feel satisfying and deliberate
2. **First add** — typing into the expanded FAB and seeing the item appear instantly; sets the expectation for the whole app
3. **Return visit** — opening the app and finding the list exactly as left; builds trust
4. **Empty state → first item** — the transition from empty to populated; first real interaction with the product

### Experience Principles

1. **Speed over safety** — optimistic updates everywhere; never make the user wait for confirmation of their own actions
2. **Calm precision** — no unnecessary animation, no visual noise; every element earns its place
3. **Completion as reward** — the visual treatment of completing a task should feel like a micro-celebration, not just a state change
4. **Invisible structure** — the two-section layout (active / completed) should feel natural and obvious, never like a feature the user had to discover

## Desired Emotional Response

### Primary Emotional Goals

- **Cool efficiency** — the dominant feeling throughout; using the app should feel effortless and slick, like a tool built by someone who sweated the details
- **Playful moments** — personality lives in the edges: empty state copy, micro-interaction flourishes, error messages that feel human; never in the core flow
- **Reassurance under stress** — when things go wrong (network failure, session expiry, rollback), the user should feel handled, not abandoned

### Emotional Journey Mapping

| Stage | Target Emotion | Design Response |
|---|---|---|
| First arrival (login screen) | Intrigue, "this looks different" | Strong visual identity, confident layout |
| Registration / Login | Trust, ease | Clean form, no noise, clear feedback |
| Empty state (no todos yet) | Welcome, slight delight | Playful copy or illustration, warm not cold |
| Adding first todo | Confidence, "this works" | Instant appearance, satisfying input UX |
| Marking complete | Quiet satisfaction, reward | Deliberate animation, visual distinction |
| Error / 401 / network fail | Reassured, "it's handled" | Clear but calm messaging, no alarm |
| Return visit | Familiarity, calm | Instant load, list exactly as left |

### Micro-Emotions

- **Confidence** over confusion — every interaction should have an obvious outcome
- **Satisfaction** over excitement — completion feels earned, not celebrated with confetti
- **Delight** in the unexpected — playful copy in empty/error states creates warmth without breaking the cool register
- **Trust** over skepticism — auth state is always clear; no ambiguity about who is logged in or what's persisted

### Design Implications

- **Cool efficiency →** dense but airy layout; minimal chrome; fast transitions (not slow "beautiful" animations); monochromatic or restrained palette
- **Playful personality →** copy-driven: empty state message, error states, loading skeletons that hint at character; not icon-heavy or illustrative overload
- **Reassurance →** error states are informative but calm — no red banners, no alarming icons; inline, subtle, explanatory
- **Completion as reward →** the todo-to-completed transition gets the most design attention of any interaction; smooth, directional, deliberate

### Emotional Design Principles

1. **Cool is quiet** — confidence comes from restraint; avoid visual noise, decorative elements, and feature creep in the UI
2. **Personality lives in words** — the playful character is expressed through copy, not visuals; tone of voice is the differentiator
3. **Errors are conversations** — failure states speak to the user like a calm colleague, not a system alert
4. **The list is the product** — the todo list view should feel like the natural resting state of the app; auth and error screens are transitions, not destinations

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**Apple / macOS ecosystem** is the primary reference. Key characteristics to extract:

- **Typography-first hierarchy** — SF Pro achieves legibility and elegance through weight contrast and generous spacing, not color or decoration. On web: Inter or similar geometric sans-serif applied with the same discipline
- **Whitespace as structure** — Apple layouts breathe; padding is generous and consistent; nothing is cramped; content doesn't compete with chrome
- **Reductive philosophy** — every UI element either serves a purpose or is removed; the result feels inevitable, not designed
- **One accent color** — neutral monochromatic base (grays, whites, near-blacks) with a single system accent color for actions and focus states
- **Tactile depth** — frosted glass / backdrop blur for layered surfaces (modals, auth overlays, FAB expansion); subtle shadows convey elevation without heaviness
- **Precise motion** — spring physics: snappy start, gentle settle; not linear, not slow, not decorative

**Secondary references:**
- **Things 3** — canonical Apple-aesthetic todo app; completion animations, calm hierarchy, satisfying micro-interactions
- **Reminders (Apple)** — system-native effortlessness; completion checkmark animation is the gold standard
- **Linear** — shares "cool efficiency" DNA on the web; dark mode, monospace details, precise type scale

### Transferable UX Patterns

**Visual patterns:**
- Frosted glass (`backdrop-filter: blur()`) for auth screen, FAB expansion overlay, and elevated surfaces
- Monochromatic palette (near-white or near-black base) + one accent color for interactive elements
- 4px or 8px border-radius on cards/inputs — precise, not bubbly
- 2–3 level shadow system (subtle, medium, elevated)

**Interaction patterns:**
- Spring-physics animation on todo completion (item slides/fades to completed section with natural deceleration)
- FAB expands with scale + fade transition
- Completion toggle uses a brief "check draw" animation — the mark appears as if drawn
- Hover states: subtle background fill shift, no border flash

**Typography patterns:**
- 2–3 weight levels max (regular, medium, semibold) from a single typeface
- Clear size hierarchy: page title → section label → todo text → metadata
- Slightly loosened letter-spacing on labels/caps for polish

### Anti-Patterns to Avoid

- **Rounded pill buttons** — too friendly; prefer slightly rounded rectangles
- **Bright multi-color palettes** — breaks the Apple monochromatic register
- **Cartoon illustrations** — empty states use copy + minimal iconography, not characters
- **Bounce/elastic over-animation** — Apple spring physics are subtle; avoid anything toy-like
- **Dense information at small sizes** — scale down gracefully; don't cram the mobile view

### Design Inspiration Strategy

**Adopt directly:**
- Inter (or equivalent) as typeface; SF Pro-inspired type scale
- Frosted glass treatment for auth screen and FAB expansion
- Spring easing for completion animation
- Single accent color system with CSS custom property tokens

**Adapt for web:**
- Things 3 completion interaction → CSS transition + JS class toggle
- Apple color system → custom CSS variables with light/dark mode support

**Avoid:**
- Literal Apple UI component copies (inspired by, not copied from)
- Overusing blur on mobile (performance cost); reserve for elevated surfaces only

## Design System Foundation

### Design System Choice

**Tailwind CSS + shadcn/ui**

### Rationale for Selection

- **Full visual control** — Tailwind's utility-first approach imposes no design opinions; the Apple-inspired aesthetic is authored entirely through custom design tokens, not overridden from a framework's defaults
- **Owned components** — shadcn/ui components are copy-pasted into the project, not imported from a locked library; fully customisable and never fight the intended look
- **Accessible by default** — shadcn/ui is built on Radix UI primitives, providing keyboard navigation, ARIA, and focus management without extra work
- **Token-first architecture** — aligns naturally with light/dark mode support via CSS custom properties
- **Portfolio-recognised stack** — current gold standard for precision-designed showcase projects; familiar to developers reviewing the code

### Implementation Approach

- Design tokens defined as CSS custom properties (`--color-accent`, `--radius-sm`, `--shadow-md`, `--font-sans`, etc.)
- Tailwind config extends theme using those CSS variables as the single source of truth
- shadcn/ui components installed selectively — only what the app actually uses
- `class` strategy for dark mode (toggled via a root class), not `media` strategy, to allow future user preference override

### Customisation Strategy

- **Colour:** Monochromatic neutral palette (near-white or near-black base) + one accent colour — all CSS variables; no hardcoded colour values in component files
- **Typography:** Inter applied as `--font-sans`; 3-weight scale (400, 500, 600); sizes follow a clean modular scale
- **Spacing/Radius:** 4px base unit; `--radius` token set to ~6–8px for cards, ~4px for inputs; precise, not bubbly
- **Elevation:** 3-level shadow system (subtle hover, card resting, elevated surface) defined as Tailwind shadow tokens
- **Motion:** Spring-physics easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) applied consistently across interactive state changes

## Core Interaction Design

### Defining Experience

**"Mark it done"** — the completion interaction is the emotional core of the app. Everything else (auth, creation, editing) is infrastructure. The check-off moment is where the app earns its character.

> *"Capture a thought → check it off"* — the full lifecycle of a todo, from FAB tap to completion animation, must feel instant and satisfying.

### User Mental Model

Users arrive with an iOS Reminders / Things 3 mental model: list → tap checkbox → item moves or disappears → feel accomplished. Key expectations:

- No friction between intent and action
- Immediate visual confirmation — no loading states on a checkbox
- Completion feels *final* but reversible without anxiety
- The list is always the ground truth; nothing feels out of sync

### Success Criteria

- Completion registers instantaneously (optimistic update — no server round-trip wait)
- The check animation conveys finality without drama — a quiet "done" feeling
- The item migrates to the completed section with natural spring motion
- Zero doubt about whether the action registered
- Reversal (un-complete) works identically in reverse — same confidence, same animation

### Pattern Analysis

**Type:** Established (checkbox + list reorder) — elevated through animation precision and the explicit spatial separation of the completed section. No novel patterns requiring user education; the interaction is immediately familiar, but the *quality* of execution is what differentiates it.

### Experience Mechanics

1. **Initiation** — checkbox hover fills with accent colour at 60% opacity; cursor becomes pointer; subtle scale(1.05) on the checkbox
2. **Interaction** — single click; checkmark "draws" in with a 150ms path animation; no delay, no loading state
3. **Feedback** — item text dims to 50% opacity + strikethrough animates in simultaneously with the check draw
4. **Completion** — item slides down to the completed section with spring easing (~300ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`); list above reflows smoothly with layout animation
5. **Reversal** — clicking the checkbox again reverses all animations; item springs back to active list position; optimistic update applies in both directions

## Visual Design Foundation

### Colour System

**Mode:** Light and dark, driven by system preference (`prefers-color-scheme`) via Tailwind's `class` strategy. A root `data-theme` attribute allows future user override.

**Palette approach:** Monochromatic neutral base + one blue accent. No decorative secondary palette.

```
Light mode:
  --color-bg:          #FFFFFF
  --color-bg-subtle:   #F5F5F7   (Apple-gray surface)
  --color-border:      #E0E0E5
  --color-text:        #1D1D1F   (Apple near-black)
  --color-text-muted:  #6E6E73
  --color-accent:      #0066FF   (vibrant blue, full opacity)
  --color-accent-soft: #0066FF1A (10% opacity tint for hover/focus rings)

Dark mode:
  --color-bg:          #000000
  --color-bg-subtle:   #1C1C1E   (Apple system background)
  --color-border:      #38383A
  --color-text:        #F5F5F7
  --color-text-muted:  #98989D
  --color-accent:      #4D9FFF   (slightly lighter blue for contrast on dark)
  --color-accent-soft: #4D9FFF1A
```

**Semantic mappings:**
- Success: `--color-accent` (completion is a positive, use the brand colour)
- Destructive: `#FF3B30` (Apple red — used only for delete confirmation)
- Warning: `#FF9500` (Apple orange — used only for offline/sync states)
- All semantic colours defined as CSS variables following the same pattern

**Accessibility:** All text/background combinations target WCAG AA (4.5:1 minimum). Accent blue checked against both light and dark backgrounds.

### Typography System

**Typeface:** Inter — self-hosted via `@fontsource/inter` for performance; fallback `system-ui, -apple-system, sans-serif`.

**Weight scale:** 400 (Regular), 500 (Medium), 600 (SemiBold). No other weights loaded.

**Type scale:**

| Role | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `display` | 28px / 1.75rem | 600 | 1.2 | Page title (authenticated view) |
| `heading` | 20px / 1.25rem | 600 | 1.3 | Section headers |
| `body` | 16px / 1rem | 400 | 1.5 | Todo item text |
| `body-medium` | 16px / 1rem | 500 | 1.5 | Todo item (active/focus) |
| `label` | 13px / 0.8125rem | 500 | 1.4 | Metadata, counts, timestamps |
| `caption` | 12px / 0.75rem | 400 | 1.4 | Helper text, empty state copy |

**Letter spacing:** `-0.01em` on display/heading; `0` on body; `+0.02em` on all-caps labels.

**Completed item text:** `body` + `line-through` + `--color-text-muted` (50% dimmed)

### Spacing & Layout Foundation

**Base unit:** 4px. All spacing values are multiples: 4, 8, 12, 16, 20, 24, 32, 48, 64.

**Layout:**
- Single-column centred content; max-width `640px` on desktop
- Horizontal padding: `24px` mobile → `32px` tablet+
- Vertical rhythm: consistent `16px` between todo items; `32px` between sections

**Component spacing:**
- Todo item internal padding: `12px 16px`
- FAB from viewport edges: `24px` bottom, `24px` right
- Section label to first item: `12px`
- Active list to completed section divider: `32px`

**Grid:** No complex grid needed — single-column list layout throughout the authenticated view.

### Accessibility Considerations

- All interactive elements ≥ 44×44px touch target (Apple HIG minimum)
- Focus rings: `2px solid --color-accent` with `2px offset` — visible in both modes
- Reduced motion: wrap all spring animations in `@media (prefers-reduced-motion: no-preference)` — static state changes as fallback
- Colour never used as the sole information carrier (checkmark always visible, not colour-only)

---

## Design Direction Decision

### Design Directions Explored

Given the Apple-inspired brief, only one direction was meaningfully viable. Two variants were considered:

1. **"Frosted"** — light base, heavy use of backdrop blur, translucent surfaces
2. **"Minimal"** (chosen) — clean flat surfaces with precise shadows; blur reserved for elevated layers only (auth overlay, FAB expansion). Performs better on mid-range devices; feels more considered.

### Chosen Direction

**Minimal Precision** — clean neutral surfaces, one accent colour, Inter typeface, elevation conveyed through shadow not blur (except for the two designated elevated surfaces).

### Design Rationale

- Performs on all target browsers without GPU-intensive blur everywhere
- Closer to Apple's current direction (macOS Sonoma / iOS 17 native apps use blur sparingly)
- Easier to maintain consistency as the component count grows
- Feels "designed" not "over-designed"

### Implementation Approach

- Tailwind CSS custom theme tokens map directly to the CSS variables above
- shadcn/ui base components (Button, Input, Dialog, Checkbox) styled via Tailwind classes only — no component-level CSS overrides
- Frosted glass applied only to: auth screen backdrop, FAB expansion panel

---

## User Journey Flows

### Journey 1 — New User (First Use)

```
Landing / Auth screen
  → [Sign up] or [Log in]
  → Credentials input (email + password)
  → Submit → optimistic redirect to main view
  → Empty state: friendly prompt with FAB pulsing subtly
  → User taps FAB → expansion panel opens
  → Types first todo → presses Enter or [Add]
  → Panel closes → item appears in list with fade-in
  → User sees their first todo → task complete
```

**Key moments:** Empty state must feel welcoming not sterile. FAB pulse is the only animation that runs unprompted.

### Journey 2 — Returning User (Daily Use)

```
App load → auth check → redirect to main view
  → List of active todos visible immediately (cached/optimistic)
  → User scans list → clicks checkbox on a completed item
  → Check draws in (150ms) → item slides to completed section (300ms)
  → List reflows smoothly → next item takes focus naturally
  → User adds new todo via FAB if needed
  → User closes tab
```

**Key moments:** This journey must feel zero-friction. No loading spinners visible after first load.

### Journey 3 — Error / Offline State

```
User completes a todo while offline
  → Optimistic update applies immediately (UI responds)
  → Subtle offline indicator appears (status bar, not modal)
  → On reconnect: sync runs silently
  → If conflict: server state wins; item reverts with brief shake animation + toast "Synced with latest"
```

**Key moments:** Offline must not feel broken. Error states speak calmly.

### Journey Patterns

- All destructive actions (delete) require a single confirmation step — inline, not a modal dialog
- All form submissions use Enter key as primary confirm; Escape as cancel
- Navigation between auth ↔ main view is always a full-page transition (no partial updates)

### Flow Optimization Principles

1. **Default path is always one tap/click ahead** — the next obvious action is always visible
2. **No dead ends** — every error state offers a clear recovery action
3. **Optimistic first** — UI updates before server confirms; rollback is the exception not the rule

---

## Component Strategy

### Design System Components (from shadcn/ui)

| Component | Usage | Customisation |
|---|---|---|
| `Button` | Primary CTA, form submit, FAB trigger | Accent fill, icon-only variant |
| `Input` | Auth forms, todo creation field | Minimal border, focus ring token |
| `Checkbox` | Todo completion toggle | Custom check-draw animation |
| `Dialog` | Delete confirmation | Frosted glass backdrop |
| `Toast` | Sync feedback, error messages | Bottom-center position, 3s auto-dismiss |
| `Separator` | Active / completed section divider | Muted colour, 1px |

### Custom Components

**`TodoItem`**
- State: `active` / `completing` (animation in progress) / `completed` / `deleting`
- Contains: Checkbox, text, delete affordance (revealed on hover)
- Transition: completion drives all visual state changes in sequence

**`FloatingActionButton (FAB)`**
- State: `idle` / `expanded`
- Idle: circular button, bottom-right, accent colour, `+` icon
- Expanded: grows into an input panel with text field and submit; spring scale animation
- Closes on: submit, Escape, click-outside

**`CompletedSection`**
- Collapsible; shows count badge when collapsed
- Expanded by default; user preference persisted in localStorage
- Items within are visually muted (dimmed text, lighter checkbox)

**`AuthScreen`**
- Full-viewport frosted glass overlay on a blurred background
- Single card: logo / title → email input → password input → submit
- Switches between Sign In / Sign Up modes with animated form transition

**`EmptyState`**
- Shown when active list is empty
- Minimal: single line of copy + subtle arrow pointing to FAB
- No illustrations

**`OfflineIndicator`**
- Thin strip at top of viewport, warning colour, auto-hides on reconnect
- Never blocks content

### Component Implementation Strategy

- Components built feature-first: TodoItem first, then FAB, then Auth, then edge-case components
- Each component co-located with its styles (Tailwind classes inline, no separate CSS files)
- Animation state managed via CSS classes toggled by JS — no JS animation libraries required
- Storybook or equivalent: not needed for this scale; manual testing sufficient per PRD

### Implementation Roadmap

1. Design tokens (CSS variables + Tailwind config)
2. `TodoItem` + `Checkbox` (core interaction)
3. `CompletedSection` (list split)
4. `FloatingActionButton` (creation flow)
5. `AuthScreen` (auth flow)
6. `Toast` + `OfflineIndicator` (system feedback)
7. `EmptyState` + `Dialog` (edge cases)

---

## UX Consistency Patterns

### Button Hierarchy

- **Primary:** Filled accent background, white text — used once per view maximum (form submit)
- **Secondary:** Outlined border, accent text — supporting actions
- **Ghost:** No border, muted text — destructive or low-priority (delete, cancel)
- **Icon-only:** 44px tap target, tooltip on hover — FAB, inline delete

### Feedback Patterns

| Trigger | Feedback | Duration |
|---|---|---|
| Todo completed | Check draw + text dim + spring to completed section | 300ms total |
| Todo created | Item fades in at top of list | 200ms |
| Todo deleted | Item collapses with fade-out | 200ms |
| Form error | Inline error text below field, red border | Persistent until corrected |
| Network error | Toast (bottom-centre) | 4s auto-dismiss |
| Sync complete | No visible feedback (silent success) | — |
| Offline detected | Top strip indicator | Until reconnect |

### Form Patterns

- Labels are always visible (no placeholder-only labels)
- Validation fires on blur, not on every keystroke
- Submit enabled at all times; validation errors shown on submit if fields untouched
- Enter submits all single-field forms; Tab moves between fields in multi-field forms

### Navigation Patterns

- No sidebar, no bottom nav — this is a single-view app
- Auth ↔ Main: full-page transition (fade or slide depending on direction)
- The active todos list and completed section are the only two structural regions on the main view

### Additional Patterns

**Loading states:** Skeleton screens (not spinners) for initial list load. Subsequent updates are optimistic — no loading state shown.

**Empty states:** Active list empty → welcoming prompt. Completed section empty → no message (section simply absent).

**Destructive confirmation:** Inline below the item (expands item height), not a modal. Single [Confirm delete] button; auto-dismissed after 5s if no action.

---

## Responsive Design & Accessibility

### Responsive Strategy

SPA targeting Chrome, Firefox, Safari only. Three meaningful breakpoints:

| Breakpoint | Width | Layout change |
|---|---|---|
| Mobile | < 640px | Full-width, 16px horizontal padding, FAB 16px from edges |
| Tablet | 640–1024px | Centred column, 32px padding, max-width 640px |
| Desktop | > 1024px | Same as tablet — layout doesn't benefit from wider columns |

No layout rearchitecting between breakpoints. The single-column list scales naturally. FAB position and size are constant.

### Breakpoint Strategy

- Tailwind breakpoints: `sm` (640px) and `lg` (1024px) are the only two used
- Container: `max-w-2xl mx-auto px-4 sm:px-8`
- Font sizes do not change between breakpoints — Inter at 16px is legible at all sizes

### Accessibility Strategy

**Level:** Best-effort (as per PRD NFR-10) — targets WCAG AA on critical paths, best-effort elsewhere.

**Critical path accessibility (must work):**
- Keyboard-only: Tab to navigate todos, Space to toggle completion, Enter to confirm FAB input, Escape to cancel
- Screen reader: all interactive elements have accessible labels; live region announces completion events
- Focus management: after FAB expansion, focus moves to input; after close, returns to FAB

**Best-effort:**
- ARIA roles on list and list items (`role="list"`, `role="listitem"`)
- `aria-checked` on custom checkboxes
- `aria-live="polite"` region for completion announcements
- `prefers-reduced-motion` media query wrapping all animations

### Testing Strategy

- Manual keyboard navigation test on each feature before commit
- Browser testing: Chrome (primary), Firefox, Safari (secondary)
- Colour contrast checked with browser devtools on each new colour pairing
- No automated a11y test suite (out of scope per PRD)

### Implementation Guidelines

- Never remove focus outlines — style them with the accent colour ring instead
- All click handlers also respond to keyboard events (handled automatically by native elements; verify on custom components)
- Touch targets: minimum 44×44px on all interactive elements, enforced via Tailwind `min-h-[44px] min-w-[44px]`
- Avoid `outline: none` without a custom focus indicator replacement

---

## UX Design Specification — Complete

This document captures the full UX design intent for the todo application. It is the authoritative reference for all visual and interaction implementation decisions.

**Status:** ✅ Complete  
**Next step:** Architecture design and technical stack selection
