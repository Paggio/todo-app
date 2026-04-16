---
stepsCompleted: [step-01-init, step-02-discovery, step-03-core-experience, step-04-emotional-response, step-05-inspiration, step-06-design-system, step-07-defining-experience, step-08-visual-foundation, step-09-design-directions, step-10-user-journeys, step-11-component-strategy, step-12-ux-patterns, step-13-responsive-accessibility, step-14-complete, extension-organizational-features]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md']
lastEdited: '2026-04-16'
editHistory:
  - date: '2026-04-16'
    changes: 'Extended UX spec for PRD v2 features: categories (section dividers), expressive priority system (P1-P5 colored left borders), deadlines (inline labels + overdue treatment), three-view navigation (All/This Week/By Deadline), extended FAB panel with selectors, category management panel, inline editing, Journey 5 (The Organizer), 7 new custom components, updated patterns and accessibility.'
---

# UX Design Specification — bmad_nf_todo_app

**Author:** Mattiapagetti
**Date:** 2026-04-14

---

## Executive Summary

### Project Vision

A personal Todo SPA built as a portfolio showcase — focused in scope, crafted with deliberate aesthetic intent. The "cool, tech-forward feel" is not an afterthought; it *is* the product. Auth is included from day one, and an organizational layer — user-created categories, priority levels (1–5), deadlines, and a "Due This Week" view — elevates the app from basic CRUD to a genuinely useful personal productivity tool. Fully production-ready and publicly deployable.

### Target Users

- **Primary — The Builder:** Daily use by the owner; wants an app that feels genuinely satisfying to use
- **Portfolio Audience:** Developers and recruiters encountering the live link or repo — evaluating visual polish, technical depth, and code quality

### Key Design Challenges

1. **Making a todo list feel genuinely cool** — the interaction model is trivially simple; design craft must do the heavy lifting
2. **Auth that doesn't feel like a wall** — login/register must feel like a natural, polished entry point, not friction
3. **The completion micro-interaction** — the single moment with highest emotional impact; must feel satisfying, not just functional
4. **Optimistic updates + error rollback** — instant feedback must feel confident; errors must recover gracefully without jarring the user
5. **Organization without overhead** — categories, priorities, and deadlines must feel lightweight and optional, never bureaucratic; the app should feel just as fast with all fields filled as with none
6. **Multi-view navigation that stays minimal** — introducing view switching (All, This Week, By Deadline) without breaking the single-purpose calm of the original design

### Design Opportunities

1. **Typography as design** — in a minimal app, type, spacing, and hierarchy *are* the visual design
2. **Auth as a showcase piece** — beautiful login/register screens are rare and memorable; opportunity to make a strong first impression
3. **Empty state as a welcome** — first impression of the todo view; opportunity for personality and warmth
4. **Micro-interactions as the differentiator** — completion toggle, add animation, delete — these elevate the experience from functional to crafted
5. **Priority color as visual energy** — the expressive left-border priority indicators inject color into an otherwise monochromatic interface; the contrast between calm base and vivid priority edges is a signature design moment
6. **View switching as progressive disclosure** — "All" view is the comfortable default; "This Week" and "By Deadline" reveal the organizational depth only when the user seeks it

## Core User Experience

### Defining Experience

The core loop is: **add a todo → organize → work → mark complete**. The organizational step (category, priority, deadline) is optional and lightweight — it enriches without interrupting. The UX ambition lives in how the loop *feels*, not how many things it can do. Three views (All, This Week, By Deadline) give the user different lenses on the same data without adding complexity to the core interaction. The app should feel closer to a precision tool than a feature-rich platform.

### Platform Strategy

- **Platform:** Web SPA, browser-only, no native app or PWA in v1
- **Input modes:** Mouse + keyboard (desktop primary), touch (mobile supported)
- **Viewport range:** 375px–unlimited; mobile-first layout
- **No offline support:** All operations require connectivity; graceful error states handle failures
- **Rendering:** Client-side only (no SSR); standard DOM for MCP/Playwright compatibility
- **Navigation:** Three-view architecture (All Todos, Due This Week, By Deadline) via top-bar segmented tabs; no sidebar, no hamburger menu

### Effortless Interactions

- **Todo creation:** A floating action button (FAB) expands inline — type and submit; no modal, no page navigation, no friction
- **Todo completion:** Single click/tap on the item or a checkbox — immediate visual response, item animates to the completed section at the bottom
- **Login/return:** If session is valid, user lands directly on their list — zero clicks to get to work
- **Deletion:** One action, no confirmation dialog required (undo pattern preferred over "are you sure?")
- **Category assignment:** Dropdown in the FAB creation panel; change category via inline edit on existing todos
- **Priority setting:** Dropdown in the FAB creation panel (P1–P5 with color preview); change via inline edit
- **Deadline setting:** Date picker in the FAB creation panel; change via inline edit
- **View switching:** Single tap on a segmented tab — All | This Week | By Deadline; instant transition, no page reload
- **Category management:** Gear icon in the top bar opens a category management panel — create, rename, delete categories

### Critical Success Moments

1. **First completion** — the moment a todo moves to the completed section for the first time; highest emotional peak; must feel satisfying and deliberate
2. **First add** — typing into the expanded FAB and seeing the item appear instantly; sets the expectation for the whole app
3. **Return visit** — opening the app and finding the list exactly as left; builds trust
4. **Empty state → first item** — the transition from empty to populated; first real interaction with the product
5. **First organization** — assigning a category or priority for the first time; the moment the user realizes the app has depth beyond basic CRUD
6. **Due This Week clarity** — switching to the "This Week" view and seeing a focused, priority-sorted list; the moment the app proves its utility as a real tool

### Experience Principles

1. **Speed over safety** — optimistic updates everywhere; never make the user wait for confirmation of their own actions
2. **Calm precision** — no unnecessary animation, no visual noise; every element earns its place
3. **Completion as reward** — the visual treatment of completing a task should feel like a micro-celebration, not just a state change
4. **Invisible structure** — the two-section layout (active / completed) should feel natural and obvious, never like a feature the user had to discover
5. **Optional depth** — every organizational feature (category, priority, deadline) adds value when used but never demands attention when ignored; a todo with no metadata is a first-class citizen

## Navigation & View Architecture

### View Model

The application uses a three-view architecture. All views operate on the same underlying data — they are lenses, not separate pages. View switching is instant (client-side filter/sort, no API call).

| View | Content | Sort Order | Grouping |
|---|---|---|---|
| **All Todos** | All active todos + completed section | By category section dividers; within each section, creation order | Category sections (collapsible dividers) |
| **Due This Week** | Active todos with deadlines within 7 days | Priority (P1 first → P5 last → no priority last) | Flat list, no grouping |
| **By Deadline** | All active todos | Grouped by deadline proximity | Today, Tomorrow, This Week, Later, No Deadline |

### Navigation UI

**Segmented tab bar** — positioned at the top of the main content area, below the app header. Three pill-style segments: `All` | `This Week` | `By Deadline`.

**Behaviour:**
- Active tab uses accent fill background with white text; inactive tabs are ghost-style (muted text, no fill)
- Switching tabs is a fade transition (150ms) — no slide, no page navigation
- Active tab state persisted in URL query param (`?view=all|week|deadline`) for shareability and browser back support
- On mobile, all three tabs remain visible (text truncation if needed: "All" / "Week" / "Deadline")

**Header layout:**
```
[ App Title          ] [ ⚙️ ] [ Logout ]
[ All | This Week | By Deadline        ]
─────────────────────────────────────────
```

The gear icon (⚙️) opens category management. It sits in the header, not in the tab bar, because category management is configuration, not a view.

### "All Todos" View — Category Section Dividers

- Each user-created category gets a collapsible section divider
- Section header: category name (heading weight) + todo count badge + collapse/expand chevron
- Uncategorized todos appear in an "Uncategorized" section at the top
- Completed todos appear in a final "Completed" section at the bottom (as before), regardless of category
- Sections default to expanded; collapse state persisted in localStorage
- Empty categories are hidden (no empty section headers cluttering the view)

### "Due This Week" View

- Flat list — no section dividers, no category grouping
- Only active (non-completed) todos with deadlines within the next 7 calendar days
- Sorted by priority: P1 → P2 → P3 → P4 → P5 → no priority
- Within the same priority level, sorted by deadline (earliest first)
- Each todo shows its priority indicator (left border), deadline label, and category chip
- Empty state: "Nothing due this week" with a subtle checkmark illustration

### "By Deadline" View

- Grouped by temporal proximity with section dividers:
  - **Overdue** — past deadline, red-tinted section header
  - **Today** — due today
  - **Tomorrow** — due tomorrow
  - **This Week** — due within 7 days (excluding today/tomorrow)
  - **Later** — due beyond 7 days
  - **No Deadline** — todos without a deadline
- Within each group, sorted by priority (P1 first)
- Each todo shows its priority indicator, category chip, and full date
- Empty groups are hidden

---

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
| Organizing (categories/priority) | Empowerment, control | Lightweight inline controls, instant feedback |
| Due This Week view | Focus, clarity | Clean priority-sorted list, no distractions |
| Overdue item spotted | Gentle urgency, not panic | Red tint is warm, not alarming; deadline label is informative |

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

**Priority colour tokens:**
```
--color-priority-1:    #FF3B30   (Apple red — urgent)
--color-priority-2:    #FF9500   (Apple orange — high)
--color-priority-3:    #FFCC00   (Apple yellow — medium)
--color-priority-4:    #0066FF   (accent blue — low)
--color-priority-5:    #98989D   (muted gray — minimal)

Dark mode adjustments:
--color-priority-1:    #FF453A
--color-priority-2:    #FF9F0A
--color-priority-3:    #FFD60A
--color-priority-4:    #4D9FFF
--color-priority-5:    #636366
```

**Overdue tokens:**
```
--color-overdue-text:  #FF3B30   (same as priority-1, used on deadline label)
--color-overdue-bg:    #FF3B300D (5% opacity tint on todo item background)

Dark mode:
--color-overdue-text:  #FF453A
--color-overdue-bg:    #FF453A0D
```

**Semantic mappings:**
- Success: `--color-accent` (completion is a positive, use the brand colour)
- Destructive: `#FF3B30` (Apple red — used for delete confirmation and overdue indicators)
- Warning: `#FF9500` (Apple orange — used for offline/sync states)
- Priority: `--color-priority-{1-5}` (expressive left-border indicators on todo items)
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

## Organizational Features Design

### Priority System

**Visual treatment:** Expressive left-border accent on the todo item card — a 3px solid left border in the priority colour. This is the primary visual differentiator between priority levels and injects color energy into the otherwise monochromatic interface.

| Priority | Label | Border Colour | Meaning |
|---|---|---|---|
| P1 | Urgent | `--color-priority-1` (red) | Must do immediately |
| P2 | High | `--color-priority-2` (orange) | Important, do soon |
| P3 | Medium | `--color-priority-3` (yellow) | Normal importance |
| P4 | Low | `--color-priority-4` (blue) | Can wait |
| P5 | Minimal | `--color-priority-5` (gray) | Backlog / someday |
| None | — | No left border | Unpriorized — first-class citizen |

**Priority picker UI:**
- In the FAB creation panel: compact dropdown showing coloured dots + label (e.g. `🔴 P1 Urgent`)
- In inline edit: same dropdown, triggered by clicking the priority indicator
- Dropdown dismisses on selection, Escape, or click-outside

### Deadline System

**Inline display:** A small label to the right of the todo text, styled at `caption` size (`12px`, `--color-text-muted`).

| Deadline State | Label Format | Colour |
|---|---|---|
| Today | "Today" | `--color-text` (standard, slightly bold) |
| Tomorrow | "Tomorrow" | `--color-text-muted` |
| This week | Day name (e.g. "Thursday") | `--color-text-muted` |
| Beyond this week | Short date (e.g. "Apr 23") | `--color-text-muted` |
| Overdue | "Overdue · Apr 10" | `--color-overdue-text` (red) |
| No deadline | No label shown | — |

**Overdue treatment:**
- Deadline label turns red (`--color-overdue-text`)
- Todo item background gets a subtle red tint (`--color-overdue-bg`, 5% opacity)
- The left-border priority indicator remains unchanged (priority and overdue are independent signals)

**Date picker UI:**
- In the FAB creation panel: compact date input that opens a native date picker or a minimal calendar popover (shadcn/ui `DatePicker`)
- In inline edit: clicking the deadline label opens the same picker
- Quick-select options above the calendar: "Today", "Tomorrow", "Next Week", "Clear"

### Category System

**Section dividers in "All Todos" view:**
- Each category is a collapsible section with a header bar
- Header: `heading` size, `600` weight, category name left-aligned, todo count badge right-aligned, collapse chevron at far right
- Divider line (`--color-border`, 1px) below the header
- Section content: todo items belonging to that category, ordered by creation time
- Collapsed state: header only, count badge shows how many items are hidden
- Animation: smooth height collapse/expand (200ms ease-out)

**Category chip on todo items (in non-"All" views):**
- When viewing "Due This Week" or "By Deadline", todos show a small category chip next to the deadline label
- Chip: `caption` size, `--color-bg-subtle` background, `--color-text-muted` text, 4px border-radius, 4px 8px padding
- No chip shown for uncategorized todos

**Category management panel:**
- Opened via gear icon in the header
- Slide-in panel from the right (320px wide on desktop, full-width sheet on mobile)
- Lists all categories with inline rename (click-to-edit) and delete (ghost button with red icon)
- "Add category" input at the top of the list
- Delete confirmation: inline "This will uncategorize X todos. Remove?" with [Cancel] [Remove] — no modal
- Max categories: no enforced limit in v1 (practical UX limit ~10–15 before the All view becomes unwieldy)

### FAB Creation Panel (Extended)

The FAB expansion panel grows from a single text input to a compact creation form:

```
┌─────────────────────────────────────┐
│  What needs doing?                  │
│                                     │
│  [ Category ▾ ] [ P ▾ ] [ 📅 Date ]│
│                           [ Add ✓ ] │
└─────────────────────────────────────┘
```

**Layout:**
- Line 1: Text input (full width), same as before
- Line 2: Compact row of optional selectors — Category dropdown, Priority dropdown (shows coloured dot), Date picker
- Line 3: Submit button right-aligned

**Behaviour:**
- All selectors are optional — pressing Enter or tapping Add with only text creates an uncategorized, unprioritized, no-deadline todo (identical to the original flow)
- Selectors remember the last-used values within the session (if user creates 3 "Work" P2 todos in a row, the next FAB open pre-selects "Work" and P2) — cleared on page refresh
- FAB panel height animates smoothly to accommodate the extra row
- On mobile: selectors stack vertically if viewport < 400px

### Inline Edit

Editing priority, deadline, or category on an existing todo:

- **Trigger:** Click/tap on the priority indicator, deadline label, or category chip (in non-"All" views)
- **Interaction:** A compact popover appears anchored to the clicked element — same dropdown/picker as in the FAB panel
- **Optimistic update:** Selection applies immediately; server sync in background
- **Escape or click-outside:** Dismisses without change

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

### Journey 4 — Error / Offline State

*(Unchanged — see above)*

### Journey 5 — The Organizer (Categories, Priorities & Deadlines)

```
Returning user with 15+ todos → flat list feels overwhelming
  → Opens category management (gear icon)
  → Creates three categories: "Work", "Personal", "Side Project"
  → Returns to All view → assigns each todo to a category via inline edit
  → List re-groups into category sections → immediate visual clarity
  → Creates a new todo via FAB: "Ship feature X" + Work + P1 + Tomorrow
  → Todo appears at top of "Work" section with red left border
  → Switches to "Due This Week" tab
  → Sees priority-sorted list: P1 at top, P5 at bottom
  → Completes the P1 item → satisfying animation → item gone from This Week
  → Switches to "By Deadline" tab to see the full temporal picture
  → Overdue item from last week visible with red tint → addresses it
  → Returns to "All" tab as the daily default
```

**Key moments:** The transition from flat list to organized sections must feel like an upgrade, not a chore. Category assignment via inline edit should take < 2 seconds per item.

### Journey Patterns

- All destructive actions (delete todo, delete category) require a single confirmation step — inline, not a modal dialog
- All form submissions use Enter key as primary confirm; Escape as cancel
- Navigation between auth ↔ main view is always a full-page transition (no partial updates)
- View switching (All / This Week / By Deadline) is a client-side filter — no page transition, fade only

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
| `Separator` | Active / completed section divider, category section divider | Muted colour, 1px |
| `Select` | Category picker, priority picker in FAB and inline edit | Compact dropdown, accent ring on focus |
| `Popover` | Inline edit popovers for priority/category/deadline | Anchored to trigger element, 8px radius |
| `DatePicker` | Deadline selection in FAB and inline edit | Minimal calendar with quick-select options |
| `Sheet` | Category management panel (mobile) | Full-width bottom sheet on mobile |
| `Badge` | Todo count in category headers, priority labels | Muted variant for counts, coloured for priority |
| `Tabs` | View switcher (All / This Week / By Deadline) | Pill-style segmented control, accent fill on active |

### Custom Components

**`TodoItem`**
- State: `active` / `completing` (animation in progress) / `completed` / `deleting`
- Contains: Checkbox, text, priority left-border, deadline label, category chip (in non-"All" views), delete affordance (revealed on hover)
- Priority indicator: 3px solid left border in `--color-priority-{n}` colour; no border when unpriorized
- Deadline label: right-aligned, `caption` size; red when overdue
- Overdue: item background tinted with `--color-overdue-bg`
- Transition: completion drives all visual state changes in sequence
- Inline edit: clicking priority indicator, deadline label, or category chip opens an anchored popover for editing that field

**`FloatingActionButton (FAB)`**
- State: `idle` / `expanded`
- Idle: circular button, bottom-right, accent colour, `+` icon
- Expanded: grows into a compact creation form — text input (top), optional selectors row (Category dropdown, Priority dropdown with coloured dot, Date picker), and Add button (bottom-right)
- Selectors row: all optional; pressing Enter with only text creates a plain todo
- Session memory: selectors remember last-used values within the session
- Mobile adaptation: selectors stack vertically below 400px viewport width
- Spring scale animation on expand/collapse
- Closes on: submit, Escape, click-outside

**`CompletedSection`**
- Collapsible; shows count badge when collapsed
- Expanded by default; user preference persisted in localStorage
- Items within are visually muted (dimmed text, lighter checkbox)
- In "All Todos" view: appears as the final section after all category sections
- In other views: appears at the bottom (completed items with deadlines still show in "By Deadline" within the Completed section)

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

**`ViewSwitcher`**
- Segmented tab bar: `All` | `This Week` | `By Deadline`
- Active tab: accent fill background, white text
- Inactive tabs: ghost style, muted text
- Positioned below the app header, above the content area
- Fade transition (150ms) on view switch
- Active view stored in URL query param (`?view=all|week|deadline`)

**`CategorySectionHeader`**
- Used in "All Todos" view as section dividers
- Contains: category name (`heading` weight), count badge (right-aligned), collapse chevron (far right)
- Collapsible with smooth height animation (200ms)
- Bottom border: `--color-border`, 1px
- Collapse state persisted in localStorage per category

**`CategoryManagementPanel`**
- Slide-in panel from the right (320px desktop, full-width sheet on mobile)
- Triggered by gear icon in app header
- List of categories with: inline rename (click-to-edit), delete button (ghost, red icon)
- "Add category" input at top
- Delete shows inline confirmation: "This will uncategorize X todos. Remove?" with [Cancel] [Remove]
- Frosted glass backdrop (same treatment as auth screen)

**`PriorityIndicator`**
- 3px solid left border on the todo item in the priority colour
- No border when todo has no priority
- Clickable: opens priority picker popover for inline editing

**`DeadlineLabel`**
- Right-aligned within the todo item, `caption` size
- Smart formatting: "Today", "Tomorrow", day name, or short date
- Overdue: red text (`--color-overdue-text`)
- Clickable: opens date picker popover for inline editing

**`DeadlineGroupHeader`**
- Used in "By Deadline" view as section dividers
- Groups: Overdue (red tint), Today, Tomorrow, This Week, Later, No Deadline
- Same visual style as `CategorySectionHeader` but with temporal labels
- Overdue header has a subtle red background tint

### Component Implementation Strategy

- Components built feature-first: TodoItem first, then FAB, then views, then organizational features, then Auth, then edge-case components
- Each component co-located with its styles (Tailwind classes inline, no separate CSS files)
- Animation state managed via CSS classes toggled by JS — no JS animation libraries required
- Storybook or equivalent: not needed for this scale; manual testing sufficient per PRD

### Implementation Roadmap

1. Design tokens (CSS variables + Tailwind config) — including priority colours and overdue tokens
2. `TodoItem` + `Checkbox` + `PriorityIndicator` + `DeadlineLabel` (core interaction with organizational features)
3. `CategorySectionHeader` + `CompletedSection` (list structure)
4. `ViewSwitcher` + `DeadlineGroupHeader` (view architecture)
5. `FloatingActionButton` (extended creation flow with selectors)
6. `CategoryManagementPanel` (category CRUD)
7. `AuthScreen` (auth flow)
8. `Toast` + `OfflineIndicator` (system feedback)
9. `EmptyState` + `Dialog` (edge cases)

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
| Todo created | Item fades in at top of its category section (or top of list) | 200ms |
| Todo deleted | Item collapses with fade-out | 200ms |
| Priority changed | Left border colour transitions smoothly | 150ms |
| Deadline changed | Label text updates inline | Instant |
| Category changed | Item animates to new category section (in "All" view) | 250ms |
| Category created | Appears in management panel with fade-in | 150ms |
| Category deleted | Affected todos animate to "Uncategorized" section | 250ms |
| View switched | Content area fades to new view | 150ms |
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

- No sidebar, no bottom nav, no hamburger menu — navigation is a top-bar segmented tab control
- Auth ↔ Main: full-page transition (fade or slide depending on direction)
- View switching (All / This Week / By Deadline): client-side fade transition (150ms), no page reload
- Active view persisted in URL query param for browser back/forward support
- Category management: slide-in panel from right (not a navigation destination)
- The structural regions depend on the active view:
  - **All:** Category section dividers + completed section at bottom
  - **This Week:** Flat priority-sorted list
  - **By Deadline:** Temporal group dividers + completed section at bottom

### Additional Patterns

**Loading states:** Skeleton screens (not spinners) for initial list load. Subsequent updates are optimistic — no loading state shown.

**Empty states:** Active list empty → welcoming prompt. Completed section empty → no message (section simply absent). "Due This Week" empty → "Nothing due this week" with subtle checkmark. Category section empty → section hidden. "By Deadline" group empty → group hidden.

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

No layout rearchitecting between breakpoints. The single-column list scales naturally. FAB position and size are constant. View switcher tabs remain visible at all breakpoints (abbreviated labels on narrow viewports: "All" / "Week" / "Deadline"). Category management panel goes full-width sheet on mobile. FAB selectors row stacks vertically below 400px.

### Breakpoint Strategy

- Tailwind breakpoints: `sm` (640px) and `lg` (1024px) are the only two used
- Container: `max-w-2xl mx-auto px-4 sm:px-8`
- Font sizes do not change between breakpoints — Inter at 16px is legible at all sizes

### Accessibility Strategy

**Level:** Best-effort (as per PRD NFR-10) — targets WCAG AA on critical paths, best-effort elsewhere.

**Critical path accessibility (must work):**
- Keyboard-only: Tab to navigate todos and view tabs, Space to toggle completion, Enter to confirm FAB input, Escape to cancel/close popovers, Arrow keys to navigate within dropdowns (priority, category)
- Screen reader: all interactive elements have accessible labels; live region announces completion events and view changes; priority level announced on todo focus; overdue state announced
- Focus management: after FAB expansion, focus moves to text input; after close, returns to FAB; after view switch, focus moves to first item in the new view; after inline edit popover close, focus returns to trigger element

**Best-effort:**
- ARIA roles on list and list items (`role="list"`, `role="listitem"`)
- `aria-checked` on custom checkboxes
- `aria-live="polite"` region for completion announcements and view change announcements
- `aria-selected` on active view tab; `role="tablist"` on view switcher
- `aria-expanded` on collapsible category section headers
- `aria-label` on priority indicators (e.g. "Priority 1, Urgent") and deadline labels
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

This document captures the full UX design intent for the todo application, including the organizational features extension (categories, priorities, deadlines, multi-view navigation). It is the authoritative reference for all visual and interaction implementation decisions.

**Status:** ✅ Complete (extended 2026-04-16 for organizational features)  
**Next step:** Architecture design and technical stack selection
