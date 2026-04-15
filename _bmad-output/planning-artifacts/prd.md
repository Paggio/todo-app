---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments: ['_bmad-output/PRD.md']
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - bmad_nf_todo_app

**Author:** Mattiapagetti
**Date:** 2026-04-14

## Executive Summary

A full-stack, single-user Todo web application built with deliberate craft — minimal in scope, precise in execution, and aesthetically intentional. The application solves the core personal task management need: capturing, tracking, and completing tasks with zero friction. Target user is a single individual (the builder/owner) who values a sharp, tech-forward interface over feature breadth. The v1 is a self-contained, complete product — not a prototype — with a backend that is architecturally extensible without over-engineering the present.

### What Makes This Special

Not differentiation by feature — differentiation by quality of execution. The aesthetic and technical sensibility is the product. Every element is considered: smooth interactions, instant feedback, clear visual hierarchy, and a UI that feels smart and crafted. The deliberate scoping (no collaboration, no priorities, no notifications in v1) is a design decision, not a limitation — resulting in an experience that feels complete and purposeful within its defined scope. Auth is included from day one, making this a fully deployable, production-ready application.

## Project Classification

- **Project Type:** Web Application (SPA + REST API backend)
- **Domain:** General / Personal Productivity
- **Complexity:** Low-Medium — CRUD + secure auth, containerized, no regulated domain
- **Project Context:** Greenfield

## Success Criteria

### User Success

- A new user can register, log in, and manage their todos without any guidance or documentation
- All core actions (create, complete, delete todo) are reachable within 2 interactions from the main view
- Completed tasks are visually distinct from active ones at a glance
- Auth flow (register/login/logout) feels seamless and trustworthy — no confusion about state
- App handles empty, loading, and error states without visual breakage on desktop and mobile

### Business Success

- Application is publicly deployed and shareable via URL
- Codebase serves as a portfolio piece demonstrating production-grade full-stack skills: auth, API design, containerization, clean UI
- Code quality, structure, and documentation reflect professional standards a recruiter or peer engineer could evaluate

### Technical Success

- Auth is secure: hashed passwords (bcrypt), JWT or session tokens, HTTPS in production
- Per-user data isolation — users can only access their own todos
- Frontend and backend each containerized (separate Dockerfiles)
- `docker-compose.yml` enables full local stack with a single command
- Data persists across sessions and container restarts
- No unhandled errors surface to the user under normal use

### Measurable Outcomes

- Zero auth/data leakage between users
- App boots locally via `docker-compose up` with no manual setup steps
- All core user flows completable on Chrome/Firefox/Safari, desktop and mobile

## User Journeys

### Journey 1 — The First-Timer (New User, Happy Path)

**Meet Marco.** He's a developer who just heard about this app from a portfolio link. He lands on the homepage with no prior context.

- **Opening:** Marco sees a clean login screen. No noise, no marketing copy — just a crisp sign-up prompt. He registers with email and password in under 30 seconds.
- **Rising Action:** He's redirected to an empty todo list. A tasteful empty state guides him — he creates his first task. The item appears instantly, no page reload. He adds two more.
- **Climax:** He marks one complete. It fades or strikes through — visually satisfying. The list reorders cleanly. It *feels* good.
- **Resolution:** Marco closes the tab. Hours later he reopens the URL — he's still logged in, his todos are all there. He bookmarks it.

**Reveals requirements:** registration form, JWT/session auth, protected routes, todo CRUD, optimistic UI updates, persistent sessions, empty state UI.

---

### Journey 2 — The Daily Driver (Returning User)

**Meet Giulia.** She uses the app every morning to plan her day.

- **Opening:** She navigates to the app — the browser remembers her session. She's dropped straight into her todo list, no login friction.
- **Rising Action:** She scans her list, completes two tasks from yesterday, adds three new ones for today.
- **Climax:** She accidentally tries to submit an empty todo. The UI catches it gracefully — a subtle inline error, no crash, no confusion.
- **Resolution:** She logs out before leaving her desk. The next person on her laptop sees the login screen, not her data.

**Reveals requirements:** persistent auth tokens, logout, client-side validation, error feedback, mobile responsiveness.

---

### Journey 3 — The Edge Caser (Session Expired / Unauthenticated)

**Meet Luca.** He left the app open on his laptop overnight.

- **Opening:** He comes back and tries to add a new todo. His session has expired server-side.
- **Rising Action:** The API returns a 401. The frontend catches it and redirects him to login — no blank screen, no crash, no lost context.
- **Climax:** He logs back in and is returned to his list, intact.
- **Resolution:** He briefly wonders if anything was lost — nothing was. Trust maintained.

**Reveals requirements:** 401 handling, token expiry, graceful redirect to login, no data loss on re-auth.

---

### Journey 4 — The Developer (Local Setup & UI Inspection)

**Meet the next contributor** — or the author, revisiting this project in six months.

- **Opening:** Clones the repo. Reads the README. Runs `docker-compose up`. All three containers (frontend, backend, DB) start. No manual env wiring needed.
- **Rising Action:** Opens `localhost:3000`. App is live. Makes a UI change — hot reload reflects it instantly.
- **Climax:** Uses an **MCP server** (e.g. a browser-use or Playwright MCP) to programmatically inspect the UI during development — asserting layout, component states, and interaction flows without leaving the terminal. This serves both as a dev tool and a showcase of modern AI-assisted development workflow.
- **Resolution:** The contributor ships a change confidently, having validated it visually and functionally. The docker-compose teardown leaves no residue.

**Reveals requirements:** `docker-compose.yml` with hot reload support, documented env vars, README with setup instructions, MCP-compatible frontend (standard DOM), seed data or easy first-run experience.

---

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| Secure registration & login | Journey 1, 3 |
| Protected routes / auth middleware | Journey 1, 3 |
| JWT/session management + expiry handling | Journey 2, 3 |
| Todo CRUD (per user) | Journey 1, 2 |
| Optimistic / instant UI updates | Journey 1 |
| Client-side validation + error states | Journey 2 |
| Responsive layout (mobile + desktop) | Journey 2 |
| Empty, loading, error UI states | Journey 1, 2, 3 |
| Docker: frontend + backend + DB | Journey 4 |
| `docker-compose up` single-command start | Journey 4 |
| MCP-compatible UI (standard DOM) | Journey 4 |
| README + setup documentation | Journey 4 |

## Web Application Specific Requirements

### Project-Type Overview

A Single Page Application (SPA) with a REST API backend. All UI state is managed client-side; the server is stateless per request (auth via token). Frontend and backend are independently containerized and communicate via HTTP.

### Browser Matrix

| Browser | Support Level |
|---|---|
| Chrome (latest) | Full |
| Firefox (latest) | Full |
| Safari (latest) | Full |
| Edge, IE, others | Not supported |

Mobile browser support via Chrome/Safari on iOS and Android — responsive layout required.

### Responsive Design

- Mobile-first layout, functional and polished on viewports from 375px up
- No horizontal scrolling on any supported viewport
- Touch targets appropriately sized for mobile interaction

### Performance Targets

- **Optimistic UI updates**: all write operations (create, complete, delete) reflect instantly in the UI before server confirmation; errors roll back gracefully
- Client-side rendering only — no SSR, no static generation
- Specific latency targets defined in Non-Functional Requirements (NFR1–NFR3)

### SEO Strategy

Not applicable — app is fully behind authentication; no public-facing indexable content.

### Accessibility Level

Best-effort: semantic HTML, keyboard navigability for core flows, sufficient color contrast for completed vs. active states. No formal WCAG audit required.

### Implementation Considerations

- **Version control:** Full project managed via Git from day one
- **Commit discipline:** A clean, atomic commit is produced at the end of every completed task or story (depending on size) — no work-in-progress commits on main
- **Commit messages:** Descriptive, scoped to the change (e.g. `feat: add todo creation endpoint`, `fix: redirect on 401`)

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — deliver a complete, polished product that feels finished within its defined scope. Every included feature is done well; nothing is left half-built.
**Resource Requirements:** Solo developer. No external dependencies or team coordination needed.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:** Journey 1 (New User), Journey 2 (Returning User), Journey 3 (Edge Cases), Journey 4 (Developer Setup)

**Must-Have Capabilities:**
- User registration and login (email + password, bcrypt, JWT)
- Protected routes — unauthenticated users redirected to login
- Per-user todo isolation (users see only their own data)
- Create todo (text input, inline submission)
- View all todos (active and completed, clearly distinguished)
- Complete todo (toggle)
- Delete todo
- Graceful 401 handling with redirect and session recovery
- Empty state, loading state, and error state UI
- Responsive layout (mobile + desktop, Chrome/Firefox/Safari)
- Aesthetic polish — smart, tech-forward visual design
- Dockerized frontend + backend + relational or document database
- `docker-compose.yml` for single-command local start with hot reload
- README with setup instructions
- Git history with clean atomic commits per task/story

### Post-MVP Features

**Phase 2 (Growth):**
- Edit todo description
- Task priorities or labels
- Filter/sort todos (by status, date, priority)
- Due dates

**Phase 3 (Expansion):**
- Shared todo lists / collaboration
- Notifications or reminders
- Mobile app (React Native or PWA)

### Risk Mitigation Strategy

**Technical Risks:** Auth implementation (JWT expiry, refresh tokens) is the most complex piece — mitigate by using a well-tested library (e.g. `jsonwebtoken`, Passport.js) rather than rolling custom. Docker hot-reload config can be finicky — validate early in setup.
**Portfolio Risks:** Design quality is the main risk for a showcase project — mitigate by choosing a proven component library or design system baseline, then customising for the "smart, tech-forward" aesthetic.
**Resource Risks:** Solo project — if scope pressure arises, Phase 2 features are fully deferrable with zero impact on MVP completeness.

## Functional Requirements

### User Account Management

- **FR1:** A visitor can register a new account using an email address and password
- **FR2:** A registered user can log in with their email and password
- **FR3:** An authenticated user can log out, terminating their session
- **FR4:** The system prevents access to todo data for unauthenticated users
- **FR5:** The system stores each user's todos in isolation — no user can access another user's data

### Authentication & Session Handling

- **FR6:** The system issues a token upon successful login that authenticates subsequent requests
- **FR7:** When a user's session expires or token is invalid, the system redirects them to the login screen without data loss
- **FR8:** After re-authenticating from an expired session, the user is returned to their todo list
- **FR9:** The system rejects requests to protected API endpoints that lack valid authentication

### Todo Management

- **FR10:** An authenticated user can create a new todo by providing a text description
- **FR11:** An authenticated user can view all their todos — both active and completed
- **FR12:** An authenticated user can mark a todo as complete
- **FR13:** An authenticated user can mark a completed todo as active (undo completion)
- **FR14:** An authenticated user can delete a todo permanently
- **FR15:** The system prevents creation of a todo with an empty description
- **FR16:** Todo creation time is recorded and associated with each item

### User Interface & Experience

- **FR17:** The UI reflects write operations (create, complete, delete) immediately, before server confirmation
- **FR18:** If a write operation fails server-side, the UI rolls back to the previous state and notifies the user
- **FR19:** Completed todos are visually distinguished from active todos at a glance
- **FR20:** The application displays a purposeful empty state when the user has no todos
- **FR21:** The application displays a loading state while data is being fetched
- **FR22:** The application displays an error state when a data operation fails unrecoverably
- **FR23:** The application layout is functional and polished on mobile and desktop viewports
- **FR24:** Core flows are operable via keyboard navigation

### Developer Operations

- **FR25:** The frontend is buildable and runnable as a standalone Docker container
- **FR26:** The backend is buildable and runnable as a standalone Docker container
- **FR27:** A `docker-compose.yml` starts the full stack (frontend, backend, database) with a single command
- **FR28:** The local development setup supports hot reload for frontend and backend changes
- **FR29:** The frontend renders using standard DOM elements compatible with MCP-based browser inspection tools
- **FR30:** The repository includes a README with setup instructions, environment variable documentation, and local development steps

## Non-Functional Requirements

### Performance

- **NFR1:** All UI write operations (create, complete, delete) must reflect optimistically in under 100ms from user action
- **NFR2:** Initial page load (authenticated user landing on todo list) must complete within 3 seconds on a standard broadband connection
- **NFR3:** API responses for all CRUD operations must complete within 500ms under normal single-user load
- **NFR4:** The application must remain responsive and not block the UI thread during any network operation

### Security

- **NFR5:** Passwords must be hashed using bcrypt with a minimum cost factor of 10 before storage — plaintext passwords must never be persisted
- **NFR6:** Auth tokens (JWT) must be signed with a secret key and include an expiry; expired tokens must be rejected server-side
- **NFR7:** All API endpoints that return or modify user data must validate the auth token and enforce per-user data isolation
- **NFR8:** The application must be served over HTTPS in production
- **NFR9:** No sensitive data (tokens, passwords) must be logged in application logs
- **NFR10:** CORS must be configured to allow only the expected frontend origin in production

### Reliability

- **NFR11:** Todo data must persist across user sessions, browser restarts, and container restarts
- **NFR12:** The database must use a persistent volume in the Docker setup — no data loss on `docker-compose down`
- **NFR13:** The application must handle backend unavailability gracefully — the frontend must display an error state rather than crashing
