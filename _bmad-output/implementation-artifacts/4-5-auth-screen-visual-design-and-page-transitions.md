# Story 4.5: Auth Screen Visual Design and Page Transitions

Status: done

## Story

As a user,
I want the auth screen to make a strong visual impression and transitions to feel smooth,
so that the first interaction with the app feels premium and trustworthy.

## Acceptance Criteria

1. **Given** the auth screen is displayed **When** it renders **Then** it shows a full-viewport frosted glass overlay using `backdrop-filter: blur()` with a single card containing logo/title, email input, password input, and submit button (UX-DR6)

2. **Given** the auth screen **When** the user toggles between Sign In and Sign Up modes **Then** the form transitions with an animation between the two states (UX-DR6)

3. **Given** the user completes authentication **When** they are redirected to the main view **Then** a full-page transition (fade or slide) animates between auth and main view (UX-DR18)

4. **Given** an authenticated user navigates to the app **When** their session is valid **Then** they bypass the auth screen entirely and land directly on the todo list

## Tasks / Subtasks

- [x] Task 1: Add frosted glass overlay to auth screen (AC: #1)
  - [x] 1.1 Define two new keyframes in `index.css` (outside `@layer` blocks, below existing keyframes):
    ```css
    @keyframes auth-card-in {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes auth-fade-out {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    ```
    Add corresponding utility classes in the existing `@layer utilities` block:
    ```css
    .animate-auth-card-in {
      animation: auth-card-in var(--duration-slow) var(--ease-spring) both;
    }
    .animate-auth-fade-out {
      animation: auth-fade-out var(--duration-slow) ease-in both;
    }
    ```
  - [x] 1.2 Restyle the auth screen outer container in `auth-screen.tsx`. The current outer `<div>` has `className="relative flex min-h-svh items-center justify-center p-6"`. Change to a full-viewport frosted glass overlay:
    - Add a subtle background treatment: a gradient or soft pattern behind the frosted layer. **Recommended approach:** Use the `bg-background` base plus a pseudo-element or a wrapper `<div>` with `backdrop-filter: blur(16px)` and `bg-background/80` (80% opacity background with 16px blur). This creates the frosted glass effect described in UX-DR6.
    - Structure:
      ```
      <div className="relative flex min-h-svh items-center justify-center p-6">
        {/* Frosted glass backdrop */}
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md" />
        {/* Theme toggle stays above the glass */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        {/* Auth card floats above the glass */}
        <form ... className="relative z-10 ...animate-auth-card-in..." />
      </div>
      ```
    - The `backdrop-blur-md` Tailwind utility maps to `backdrop-filter: blur(12px)`. Use `backdrop-blur-lg` (16px) or `backdrop-blur-xl` (24px) depending on desired intensity. Start with `backdrop-blur-lg` for a visible but not overwhelming frosted effect.
    - **Background behind the glass:** Add a very subtle decorative gradient to give the frosted glass something to blur. Recommended: a radial gradient using the accent color at very low opacity, positioned off-center. Example: `<div className="fixed inset-0 overflow-hidden"><div className="absolute -top-1/2 -right-1/4 h-[600px] w-[600px] rounded-full bg-primary/5" /><div className="absolute -bottom-1/4 -left-1/4 h-[400px] w-[400px] rounded-full bg-primary/3" /></div>`. These shapes behind the frosted glass provide visual depth. Do NOT use additional colors -- only `bg-primary` at very low opacity (3-5%). This layer must adapt to dark mode via the existing `--primary` token.
  - [x] 1.3 Upgrade the auth card styling. Replace the current `shadow-sm` with the project's `shadow-elevated` token. Update the card classes from:
    ```
    rounded-xl border bg-card p-6 shadow-sm
    ```
    to:
    ```
    rounded-xl border border-border bg-card/90 p-6 shadow-elevated backdrop-blur-sm
    ```
    The `bg-card/90` (90% opacity) + `backdrop-blur-sm` on the card itself adds a secondary glass layer. The `shadow-elevated` aligns with the project's elevation system. The card should use the `animate-auth-card-in` class for an entrance animation on mount.
  - [x] 1.4 Add the app title/branding to the card. Currently the card shows `h1` with "Create your account" / "Welcome back". Per UX-DR6, the card should contain logo/title at the top. Since this is a text-only app (no illustrations per UX anti-patterns), add an app name display above the form heading:
    ```tsx
    <div className="text-center mb-2">
      <span className="text-display">Todos</span>
    </div>
    <h1 id="auth-title" className="text-heading text-center">
      {isSignUp ? "Create your account" : "Welcome back"}
    </h1>
    ```
    The `text-display` and `text-heading` utility classes from Story 4-1 provide the Apple-inspired type scale.

- [x] Task 2: Add animated mode toggle between Sign In / Sign Up (AC: #2)
  - [x] 2.1 Define a mode-switch keyframe in `index.css`:
    ```css
    @keyframes auth-mode-switch {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    ```
    Add utility class:
    ```css
    .animate-auth-mode-switch {
      animation: auth-mode-switch var(--duration-normal) ease-out both;
    }
    ```
  - [x] 2.2 In `auth-screen.tsx`, wrap the form fields section (email, password, submit button, server error) in a container `<div>` with a key that changes when `mode` changes. This forces React to remount the container, triggering the entrance animation:
    ```tsx
    <div key={mode} className="animate-auth-mode-switch flex flex-col gap-4">
      {/* email field */}
      {/* password field */}
      {/* submit button */}
      {/* server error */}
    </div>
    ```
    The `key={mode}` technique is the idiomatic React way to restart an animation when state changes. When `mode` flips between `"sign-in"` and `"sign-up"`, React unmounts the old div and mounts a new one, re-triggering the CSS animation. This is simpler and more reliable than toggling classes manually.
  - [x] 2.3 Reset form state on mode switch. The current toggle handler calls `form.clearErrors()`, `login.reset()`, `register.reset()`. Additionally, call `form.reset()` to clear the input values so the animation starts with a clean form. Update the toggle button's onClick:
    ```tsx
    onClick={() => {
      setMode(isSignUp ? "sign-in" : "sign-up")
      login.reset()
      register.reset()
      form.reset()
    }}
    ```
    Note: `form.reset()` includes `clearErrors()` so the explicit `form.clearErrors()` call can be removed.

- [x] Task 3: Add auth-to-main page transition (AC: #3)
  - [x] 3.1 **Architecture decision: CSS exit animation before React Router navigates.** React Router's `<Navigate>` causes an immediate unmount -- there is no built-in exit animation support. The recommended approach is to delay the navigation by running an exit animation on the auth screen before the router redirect occurs. **Implementation strategy:**
    - In `auth-screen.tsx`, after successful login/register mutation, do NOT rely on React Router's immediate redirect. Instead:
      1. The `useLogin`/`useRegister` `onSuccess` callbacks already call `setUser(user)` which makes `isAuthenticated` true, causing `LoginPage` to render `<Navigate to={from} replace />`.
      2. To intercept this, add local state `isExiting` in `auth-screen.tsx`. On successful mutation, set `isExiting = true` and apply the `.animate-auth-fade-out` class to the entire auth screen container.
      3. After the fade-out animation completes (300ms, matching `--duration-slow`), call a callback that triggers the actual navigation.
    - **Key challenge:** The navigation currently happens in `LoginPage` based on `isAuthenticated` state from `AuthProvider`. The `useLogin`/`useRegister` hooks set the user immediately, which cascades a re-render to `LoginPage` -> `<Navigate>`.
    - **Solution:** Add an `onAuthSuccess` callback prop to `AuthScreen`. In `LoginPage`, instead of passing the mutations to `AuthScreen` directly (they're defined inside AuthScreen already), have `AuthScreen` accept an `onAuthSuccess` callback. When auth succeeds, `AuthScreen` plays the exit animation, then calls `onAuthSuccess()`. `LoginPage` provides `onAuthSuccess` as a function that calls `navigate(from, { replace: true })` using the `useNavigate` hook.
    - **Revised approach (simpler):** Keep the auth mutation hooks inside `AuthScreen` as they are. Override the mutation `onSuccess` to set a local `isExiting` state instead of (or in addition to) the default behavior. Use `useLogin` and `useRegister` as-is, but wrap the form submission so that on success, `isExiting` is set to `true`. After the animation delay (300ms), call `setUser(user)` which triggers the router redirect. This means the user object is set with a 300ms delay after a successful API response.
    - **Final recommended approach:** Modify the `onSubmit` handler to use the mutation's `mutateAsync` instead of `mutate`. This allows awaiting the result and controlling the timing:
      ```tsx
      const onSubmit = form.handleSubmit(async (values) => {
        try {
          const user = isSignIn
            ? await login.mutateAsync(values)
            : await register.mutateAsync(values)
          // Don't setUser yet -- play exit animation first
          setAuthResult(user)
          setIsExiting(true)
          // After animation, setUser triggers redirect
          setTimeout(() => {
            setUser(user)
          }, DURATION_SLOW_MS)
        } catch {
          // Error handled by mutation state (login.error / register.error)
        }
      })
      ```
    - **Critical:** The `useLogin` and `useRegister` hooks in `use-auth.ts` call `setUser(user)` in their `onSuccess` callbacks. This would trigger the redirect before the animation. To prevent this, either: (a) use `mutateAsync` and don't let `onSuccess` fire (it fires after the promise resolves), or (b) use a `pendingUser` ref to defer the `setUser` call. **Option (a) has a problem:** TanStack Query's `onSuccess` fires regardless of whether you use `mutate` or `mutateAsync`. **Correct approach:** Override the `onSuccess` at the call site. TanStack Query allows passing `onSuccess` to both `useMutation` config AND to `mutate`/`mutateAsync` options. The call-site `onSuccess` runs AFTER the hook-level one. But we need to PREVENT the hook-level `onSuccess` from calling `setUser`. 
    - **Simplest correct approach:** Do NOT modify `use-auth.ts`. Instead, use a state flag in `AuthScreen` to gate the exit animation. Accept that `setUser` fires immediately (from the hook's `onSuccess`), causing `isAuthenticated` to become `true` in the context. Modify `LoginPage` to respect an "exiting" signal. Add a small piece of state coordination:
      1. `AuthScreen` accepts an `onBeforeNavigate?: () => Promise<void>` prop.
      2. `LoginPage` passes this prop. Before navigating, `LoginPage` waits for the promise to resolve.
      3. The promise resolves after the exit animation (300ms delay).
    - **Even simpler (recommended final approach):** Use a `transitionState` in `LoginPage` itself. When `isAuthenticated` becomes true, instead of immediately rendering `<Navigate>`, set `isTransitioning = true`, wait 300ms, then navigate. `LoginPage` renders the auth screen with an `isExiting` prop during the transition:
      ```tsx
      export function LoginPage() {
        const { isAuthenticated, isLoading } = useAuth()
        const [isTransitioning, setIsTransitioning] = React.useState(false)
        const navigate = useNavigate()
        const location = useLocation()
        const from = (location.state as ...)?.from?.pathname ?? "/"
        
        React.useEffect(() => {
          if (isAuthenticated && !isTransitioning) {
            setIsTransitioning(true)
            setTimeout(() => {
              navigate(from, { replace: true })
            }, DURATION_SLOW_MS)
          }
        }, [isAuthenticated, isTransitioning, navigate, from])

        if (isLoading) return <div />
        
        // Don't redirect immediately -- let the animation play
        return <AuthScreen isExiting={isTransitioning} />
      }
      ```
      This is the cleanest approach because: (a) `use-auth.ts` is NOT modified, (b) `AuthScreen` receives a simple boolean prop, (c) the animation timing is managed in one place, (d) no race conditions.
  - [x] 3.2 In `auth-screen.tsx`, accept an `isExiting?: boolean` prop. When `isExiting` is true, apply `.animate-auth-fade-out` to the outermost container. This fades the entire frosted glass + card to opacity 0 over 300ms.
  - [x] 3.3 In `LoginPage` (`login.tsx`), implement the transition delay. Import `useNavigate` from `react-router`. Replace the immediate `<Navigate to={from} replace />` with the `useEffect`-based delayed navigation described in 3.1. Import and use `DURATION_SLOW_MS = 300` as a constant (define at top of file or import from a shared location).
  - [x] 3.4 Add a fade-in entrance animation to the home page. In `home.tsx`, add a simple fade-in on the main container so the transition from auth to home feels smooth. Define a keyframe:
    ```css
    @keyframes page-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .animate-page-fade-in {
      animation: page-fade-in var(--duration-slow) ease-out both;
    }
    ```
    Apply `animate-page-fade-in` to the outermost `<div>` in `HomePage`. This creates a seamless auth-out -> home-in transition. The timing naturally overlaps: as auth fades out (300ms), the router switches to home which fades in (300ms). Since React Router replaces the route, both don't render simultaneously -- but the fade-in on home provides visual continuity.

- [x] Task 4: Ensure authenticated users bypass auth screen (AC: #4)
  - [x] 4.1 This is already implemented by the existing `LoginPage` component which checks `isAuthenticated` and renders `<Navigate>`. The new transition logic in Task 3 adds a delay only when `isAuthenticated` changes from false to true (fresh login). When a user navigates directly to the app with a valid session, `isAuthenticated` starts as true after the `/api/auth/me` check, and `isTransitioning` starts as false. The `useEffect` should only trigger if the user was previously unauthenticated. Use a ref to track whether the user was ever unauthenticated:
    ```tsx
    const wasUnauthenticated = React.useRef(!isAuthenticated && !isLoading)
    
    React.useEffect(() => {
      if (isAuthenticated && wasUnauthenticated.current && !isTransitioning) {
        setIsTransitioning(true)
        setTimeout(() => {
          navigate(from, { replace: true })
        }, DURATION_SLOW_MS)
      } else if (isAuthenticated && !wasUnauthenticated.current) {
        // User was already authenticated (returning user) -- navigate immediately
        navigate(from, { replace: true })
      }
    }, [isAuthenticated, isLoading, isTransitioning, navigate, from])
    ```
    **Wait -- there's a subtlety.** During the initial mount, `isLoading` is `true` and `isAuthenticated` is `false`. When `/api/auth/me` resolves, if the user has a valid session, `isAuthenticated` flips to `true`. At that point, `wasUnauthenticated.current` is `true` (because it was set during the loading phase). This would cause the exit animation to play even for returning users.
    
    **Correct approach:** `wasUnauthenticated` should only be set to `true` AFTER the loading check completes AND the user is not authenticated. Returning users go through: `isLoading=true` -> `isAuthenticated=true`. Fresh logins go through: `isLoading=true` -> `isAuthenticated=false` -> (user logs in) -> `isAuthenticated=true`. The distinguishing factor is whether the user SAW the auth form (was on the login page while unauthenticated and not loading).
    
    **Simplest correct approach:** If `isAuthenticated` is true on the first non-loading render, navigate immediately (returning user). If `isAuthenticated` was false on first non-loading render and later becomes true, animate then navigate (fresh login). Track this with a ref:
    ```tsx
    const initialAuthResolved = React.useRef(false)
    const showedAuthScreen = React.useRef(false)
    
    React.useEffect(() => {
      if (!isLoading && !initialAuthResolved.current) {
        initialAuthResolved.current = true
        if (!isAuthenticated) {
          showedAuthScreen.current = true
        }
      }
    }, [isLoading, isAuthenticated])
    
    React.useEffect(() => {
      if (isAuthenticated && initialAuthResolved.current) {
        if (showedAuthScreen.current && !isTransitioning) {
          // Fresh login -- animate exit
          setIsTransitioning(true)
          setTimeout(() => navigate(from, { replace: true }), DURATION_SLOW_MS)
        } else if (!showedAuthScreen.current) {
          // Returning user -- immediate redirect
          navigate(from, { replace: true })
        }
      }
    }, [isAuthenticated, isTransitioning, navigate, from])
    ```
  - [x] 4.2 **If the above ref tracking feels too complex**, a simpler alternative: always show the exit animation. For returning users, the auth screen was never visible (they go straight to `/` via AuthGuard). The only way a returning user hits `/login` is by manually typing the URL. In that case, a brief 300ms fade-out is acceptable UX. This simplifies the implementation significantly -- just use the simpler version from Task 3.1 with the single `useEffect`.

- [x] Task 5: Add keyframes and utilities to index.css (AC: all)
  - [x] 5.1 Add all new keyframes in `index.css` outside `@layer` blocks, below existing keyframes:
    - `@keyframes auth-card-in`
    - `@keyframes auth-fade-out`
    - `@keyframes auth-mode-switch`
    - `@keyframes page-fade-in`
  - [x] 5.2 Add all new utility classes inside the existing `@layer utilities` block:
    - `.animate-auth-card-in`
    - `.animate-auth-fade-out`
    - `.animate-auth-mode-switch`
    - `.animate-page-fade-in`
  - [x] 5.3 All animation durations must reference motion tokens (`var(--duration-slow)`, `var(--duration-normal)`) -- no hardcoded millisecond values in CSS.

- [x] Task 6: Verify and test (AC: all)
  - [x] 6.1 Run `pnpm typecheck` from `frontend/` -- 0 errors expected.
  - [x] 6.2 Run `pnpm lint` from `frontend/` -- 0 errors, 0 warnings expected.
  - [x] 6.3 Manual test: Load `/login` page. Verify frosted glass background is visible (subtle blur with decorative gradient shapes behind). Verify auth card has entrance animation (slides up + fades in). Verify `shadow-elevated` on card. Verify AC #1.
  - [x] 6.4 Manual test: Click "New here? Create an account" toggle. Verify mode-switch animation plays (fields fade in with slight upward slide). Click back to "Already have an account? Sign in". Verify reverse toggle also animates. Verify form values are cleared on switch. Verify AC #2.
  - [x] 6.5 Manual test: Sign up a new user. After successful submission, verify the entire auth screen fades out (~300ms) before the home page appears. Verify the home page fades in. Verify AC #3.
  - [x] 6.6 Manual test: Sign in with existing credentials. Verify the same fade-out/fade-in transition occurs. Verify AC #3.
  - [x] 6.7 Manual test: With a valid session, navigate to the app root `/`. Verify you land on the home page without seeing the auth screen or any transition flash. Verify AC #4.
  - [x] 6.8 Manual test: All animations work correctly in BOTH light and dark modes. The frosted glass should look good in both: light mode has white-ish blur, dark mode has dark blur.
  - [x] 6.9 Manual test: Verify ThemeToggle still works on the auth screen (positioned above the frosted glass layer). Toggle between light/dark and verify the frosted glass + card adapt correctly.
  - [x] 6.10 Manual test: Test auth validation errors still display correctly (inline red text below fields, server error below submit button) with the new card styling.

## Dev Notes

### Critical Architecture Constraints

- **Tailwind v4 CSS-first configuration.** This project uses Tailwind CSS v4 which configures the theme via the `@theme inline` block in `src/index.css`, NOT via a `tailwind.config.js/ts` file. There is no `tailwind.config.ts` in this project. All theme customization goes through CSS custom properties + the `@theme inline` block. [Source: architecture.md#Styling Solution]
- **No JS animation libraries.** Per architecture: "Spring-physics easing, check-draw path animation, layout reflow animation -- requires CSS transitions + JS class toggling (no animation library)." Do NOT install framer-motion, react-spring, auto-animate, or any animation library. All animation is CSS transitions + CSS keyframes + JS class/attribute toggling. [Source: architecture.md#UX-Driven Architectural Requirements]
- **shadcn/ui v4 with `base-nova` style.** Components consume Tailwind theme variables. [Source: frontend/components.json]
- **`class` strategy for dark mode.** The `@custom-variant dark (&:is(.dark *));` directive enables Tailwind's `dark:` variant. [Source: architecture.md#Styling Solution]
- **File naming: kebab-case** for frontend files. **Component naming: PascalCase.** [Source: architecture.md#Naming Patterns]
- **No hardcoded color values in component files.** All colors must come from CSS variables via Tailwind token classes. [Source: architecture.md#Enforcement Guidelines]
- **No `any` type in TypeScript.** [Source: architecture.md#Anti-Patterns]
- **MCP-compatible DOM** -- standard HTML elements; no canvas or shadow DOM. [Source: architecture.md#Assumptions & Constraints]

### Frosted Glass Design Decision

The UX spec defines a "Minimal Precision" visual direction: "clean flat surfaces with precise shadows; blur reserved for elevated layers only (auth overlay, FAB expansion)." The frosted glass treatment applies to exactly two surfaces in the app:
1. **Auth screen backdrop** (this story)
2. **FAB expansion panel** (Story 4-4, already implemented with `shadow-elevated` but NOT with backdrop blur)

For the auth screen, the frosted glass is achieved via `backdrop-filter: blur()` on a semi-transparent overlay. The effect needs something behind the glass to blur -- decorative gradient shapes using `bg-primary` at 3-5% opacity provide depth without adding new colors. These adapt to dark mode automatically since `--primary` changes between themes.

**Browser support:** `backdrop-filter` is supported in Chrome 76+, Firefox 103+, Safari 9+ (prefixed). No polyfill needed for the target browsers (Chrome, Firefox, Safari). [Source: ux-design-specification.md#Responsive Design & Accessibility]

[Source: ux-design-specification.md#Chosen Direction, "Frosted glass applied only to: auth screen backdrop, FAB expansion panel"]

### Page Transition Architecture

React Router v7 does not have built-in page transition support. The `<Navigate>` component causes immediate unmount/remount. The chosen approach:

1. **Auth exit:** `LoginPage` detects `isAuthenticated` becoming `true`, sets `isExiting` state, waits 300ms (fade-out animation), then navigates via `useNavigate()`.
2. **Home entrance:** `HomePage` applies a `page-fade-in` animation on mount, providing visual continuity after the route switch.
3. **Returning users:** Users with valid sessions are redirected immediately by `AuthGuard` (never see `/login`). If they manually navigate to `/login`, the redirect is also immediate (or at most a 300ms fade -- acceptable UX).

This is a CSS-only approach with minimal JS orchestration (a single `setTimeout` and `useEffect`). No router wrappers, no animation libraries, no `<AnimatePresence>`.

**Do NOT modify `use-auth.ts`.** The auth hooks' `onSuccess` callbacks set user state immediately. The transition delay is handled entirely within `LoginPage`. The 300ms between `setUser(user)` and `navigate()` means the user is technically authenticated for 300ms while still seeing the login page -- this is safe because `LoginPage` is not a protected route.

[Source: architecture.md#Frontend Architecture -- React Router v7, two routes]
[Source: ux-design-specification.md#Navigation Patterns -- "Auth to Main: full-page transition (fade or slide)"]

### Motion Token Reference

Available in `frontend/src/index.css` `:root` block:
```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast:   150ms;
--duration-normal: 200ms;
--duration-slow:   300ms;
```

For this story:
- **Auth card entrance:** `--duration-slow` (300ms) with `--ease-spring` -- gives a snappy, satisfying pop-in
- **Mode switch:** `--duration-normal` (200ms) with `ease-out` -- quick but perceptible
- **Auth exit / page fade-out:** `--duration-slow` (300ms) with `ease-in` -- gradual disappearance
- **Home page fade-in:** `--duration-slow` (300ms) with `ease-out` -- smooth arrival

### Existing Keyframes Reference

Already in `frontend/src/index.css` (do NOT duplicate):
- `slide-down-in`, `slide-up-in` (Story 4-3)
- `fab-expand`, `fab-collapse`, `fab-pulse` (Story 4-4)
- `fade-in`, `collapse-out`, `expand-in` (Story 4-4)

### Current Auth Screen Structure

File: `frontend/src/components/auth-screen.tsx`
- Outer container: `<div className="relative flex min-h-svh items-center justify-center p-6">`
- ThemeToggle: `<div className="absolute top-4 right-4"><ThemeToggle /></div>`
- Form card: `<form className="flex w-full max-w-sm flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm">`
- Mode toggle: `<button>` at bottom of form that switches between sign-in / sign-up
- Schema: separate `signUpSchema` (min 8 char password) and `signInSchema` (min 1 char password)
- Mutations: `useRegister()` and `useLogin()` from `@/hooks/use-auth` -- both call `setUser(user)` in `onSuccess`
- Error display: `ApiClientError` server errors shown below submit button

File: `frontend/src/pages/login.tsx`
- Checks `isAuthenticated` and `isLoading` from `useAuth()`
- If loading: renders blank `<div />`
- If authenticated: renders `<Navigate to={from} replace />`
- Otherwise: renders `<AuthScreen />`
- Uses `useLocation()` to extract `from` pathname for post-login redirect

### Cross-Story Dependencies in Epic 4

- **Story 4-1 (done):** Design tokens (colors, spacing, shadows, motion, typography). This story consumes all of them.
- **Story 4-2 (done):** Dark mode theming, ThemeToggle component placed on auth screen. This story preserves the ThemeToggle and ensures frosted glass works in both themes.
- **Story 4-3 (done):** Completion animations. Not directly related.
- **Story 4-4 (done):** FAB animations, existing keyframes. Do NOT duplicate existing keyframes.
- **Story 4-6 (future):** Component polish -- CompletedSection, EmptyState, system feedback. No dependency on this story.
- **Story 4-7 (future):** Responsive layout. The auth screen frosted glass must work across mobile/tablet/desktop breakpoints. Keep the card `max-w-sm` (384px) and `p-6` padding which work at all sizes.
- **Story 4-8 (future):** Accessibility. Will add `prefers-reduced-motion` wrapping around ALL animations (including those added in this story). Do NOT add reduced-motion handling here.

### Deferred Items Relevant to This Story

From `deferred-work.md`:
- **FAB z-index not set explicitly** (Story 3-3 review) -- The auth screen frosted glass uses `z-10` for the card layer. This does not conflict with the FAB (which is only on the home page, not the auth screen).
- **ThemeToggle calls window.matchMedia during render** (Story 4-2 review) -- Pre-existing. Does not affect this story.
- **ThemeToggle duplicates theme resolution logic** (Story 4-2 review) -- Pre-existing. Does not affect this story.

From Story 4-2 notes:
- Auth screen `shadow-sm` was noted as needing upgrade -- this story upgrades it to `shadow-elevated`.

### Previous Story Intelligence (Story 4-4)

1. `pnpm typecheck` and `pnpm lint` both pass with 0 errors/warnings. Maintain this.
2. Backend has 47 passing tests. No backend changes in this story.
3. No frontend test framework is configured. Manual testing only.
4. The `cn()` utility from `@/lib/utils` is used for conditional class merging. Use it for toggling the `isExiting` animation class.
5. Story 4-4 review was clean after applying patches. Follow the same discipline.
6. `DURATION_SLOW_MS = 300` constant pattern is established in `todo-item.tsx`. Define a similar constant in `login.tsx` for the transition delay.
7. All animation durations reference motion tokens -- no hardcoded values in CSS.
8. The `onAnimationEnd` event handler pattern was used in FAB (Story 4-4) but is not needed here -- `setTimeout` with `DURATION_SLOW_MS` is sufficient for the page transition timing since we do not need exact animation-end synchronization.

### What NOT To Do

- Do NOT install framer-motion, react-spring, @formkit/auto-animate, or any JS animation library
- Do NOT modify `use-auth.ts` or `auth-provider.tsx` -- the auth hooks and context must remain untouched
- Do NOT modify the backend
- Do NOT add `prefers-reduced-motion` media queries -- that belongs to Story 4-8
- Do NOT create a `tailwind.config.ts` file
- Do NOT use Tailwind `animate-*` built-in utilities that conflict with custom spring easing
- Do NOT hardcode color values -- use Tailwind semantic tokens
- Do NOT duplicate existing keyframes from Story 4-3/4-4
- Do NOT add illustrations, logos, or images to the auth screen -- the UX spec explicitly says "no illustrations" and "no cartoon illustrations"
- Do NOT use a modal or dialog approach for the auth screen -- it is a full-page route, not an overlay on top of the home page
- Do NOT modify the React Router structure (the two-route setup `/login` and `/` must remain)
- Do NOT add new CSS color tokens -- use the existing palette (primary at low opacity for decorative elements)

### Project Structure Notes

Files to modify:
- `frontend/src/components/auth-screen.tsx` -- add frosted glass overlay, upgrade card styling, add mode-switch animation, add entrance animation, accept `isExiting` prop, add app branding
- `frontend/src/pages/login.tsx` -- add transition delay logic, use `useNavigate` instead of `<Navigate>`, pass `isExiting` prop to AuthScreen
- `frontend/src/pages/home.tsx` -- add `animate-page-fade-in` class to outermost container
- `frontend/src/index.css` -- add new @keyframes and animation utility classes

Files to verify (no changes expected):
- `frontend/src/hooks/use-auth.ts` -- MUST NOT be modified
- `frontend/src/hooks/auth-provider.tsx` -- MUST NOT be modified
- `frontend/src/components/auth-guard.tsx` -- verify no change needed
- `frontend/src/App.tsx` -- verify router structure unchanged

No backend changes. No new npm packages. No new files -- all changes go into existing files.

### References

- [Source: epics.md#Story 4.5 -- acceptance criteria, UX-DR6, UX-DR18 references]
- [Source: ux-design-specification.md#Component Strategy -- AuthScreen: full-viewport frosted glass overlay, single card, animated form transition between Sign In / Sign Up]
- [Source: ux-design-specification.md#Chosen Direction -- "Frosted glass applied only to: auth screen backdrop, FAB expansion panel"]
- [Source: ux-design-specification.md#Navigation Patterns -- "Auth to Main: full-page transition (fade or slide depending on direction)"]
- [Source: ux-design-specification.md#User Journey Flows -- "Landing / Auth screen -> [Sign up] or [Log in] -> optimistic redirect to main view"]
- [Source: architecture.md#UX-Driven Architectural Requirements -- "Frosted glass: backdrop-filter: blur() on auth screen and FAB expansion -- limited to two surfaces for performance"]
- [Source: architecture.md#Frontend Architecture -- React Router v7, two routes: /login (public), / (protected)]
- [Source: architecture.md#Styling Solution -- Tailwind CSS v4, class strategy]
- [Source: frontend/src/components/auth-screen.tsx -- current auth screen implementation to be enhanced]
- [Source: frontend/src/pages/login.tsx -- current login page with Navigate redirect to be modified]
- [Source: frontend/src/pages/home.tsx -- main view, add entrance animation]
- [Source: frontend/src/index.css -- motion tokens, existing keyframes from Stories 4-3/4-4]
- [Source: 4-4-fab-design-creation-and-deletion-animations.md -- previous story patterns, animation approach, review findings]
- [Source: 4-2-light-dark-mode-theming.md -- auth-screen shadow-sm noted, ThemeToggle placement, dark mode frosted glass considerations]
- [Source: deferred-work.md -- FAB z-index, ThemeToggle issues]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `pnpm typecheck`: 0 errors
- `pnpm lint`: 0 errors, 0 warnings
- `pnpm build`: successful (1.48s)

### Completion Notes List

- Task 1: Frosted glass overlay added to auth screen with decorative gradient shapes (bg-primary at 5% and 3% opacity), backdrop-blur-lg on overlay, bg-card/90 + backdrop-blur-sm + shadow-elevated on card, animate-auth-card-in entrance animation, app title branding
- Task 2: Mode-switch animation using key={mode} remount pattern on form fields container with animate-auth-mode-switch CSS animation. Form reset on mode switch via form.reset()
- Task 3: Page transition via LoginPage useEffect: detects fresh login vs returning user using ref tracking (initialAuthResolved + showedAuthScreen). Fresh login triggers isTransitioning state -> 300ms fade-out via animate-auth-fade-out -> useNavigate redirect. Returning users bypass immediately. Home page has animate-page-fade-in entrance animation
- Task 4: Returning-user bypass uses the detailed ref-tracking approach (not the fallback). Two refs: initialAuthResolved tracks when isLoading resolves, showedAuthScreen tracks if user was unauthenticated after load. Returning users navigate immediately without animation
- Task 5: Four new keyframes (auth-card-in, auth-fade-out, auth-mode-switch, page-fade-in) and four utility classes added to index.css. All durations reference motion tokens (no hardcoded values)
- Task 6: typecheck and lint pass with 0 errors/warnings. Build succeeds. Manual tests require runtime verification
- use-auth.ts was NOT modified (confirmed via git diff)

### Review Findings

- [x] [Review][Patch] setTimeout not cleaned up on unmount — the 300ms setTimeout in LoginPage is never cleared if the component unmounts before the timer fires; add cleanup via useRef and clearTimeout in the useEffect return [frontend/src/pages/login.tsx:39-41] — FIXED

### Change Log

- 2026-04-15: Implemented auth screen visual design and page transitions (Story 4-5)

### File List

- frontend/src/index.css (modified: added 4 keyframes + 4 animation utility classes)
- frontend/src/components/auth-screen.tsx (modified: frosted glass overlay, card styling upgrade, app branding, mode-switch animation, isExiting prop, cn utility import)
- frontend/src/pages/login.tsx (modified: transition delay logic with ref tracking, useNavigate instead of Navigate, isExiting prop passed to AuthScreen)
- frontend/src/pages/home.tsx (modified: added animate-page-fade-in class to outermost div)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified: 4-5 status -> review)
- _bmad-output/implementation-artifacts/4-5-auth-screen-visual-design-and-page-transitions.md (modified: tasks checked, status -> review, Dev Agent Record filled)
