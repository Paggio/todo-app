# AI Integration Log

How Claude Code + the BMAD Method drove the todo app from PRD to a released 7-epic scope. Evidence-based — every claim below is traceable to a file in `_bmad-output/` or a commit on `main`.

---

## 1. Agent Usage

BMAD's persona-scoped skills were invoked as discrete `/bmad-*` slash commands. Each phase ran in an isolated subagent context so the previous role's deliberation never leaked into the next role's reasoning.

| BMAD persona | Skill(s) used | Artifact(s) produced |
|---|---|---|
| PM (John) | `/bmad-create-prd`, `/bmad-validate-prd` | `_bmad-output/planning-artifacts/prd.md`, `prd-validation-report.md` |
| Architect (Winston) | `/bmad-create-architecture` | `architecture.md` |
| UX Designer (Sally) | `/bmad-create-ux-design` | `ux-design-specification.md` |
| PM → Architect | `/bmad-create-epics-and-stories`, `/bmad-check-implementation-readiness` | `epics.md`, `implementation-readiness-report-*.md` |
| Scrum Master | `/bmad-create-story`, `/bmad-sprint-planning` | 27 story files in `_bmad-output/implementation-artifacts/` |
| Developer (Amelia) | `/bmad-dev-story` | Feature commits `5de34e4` … `0dd748c` |
| Code Reviewer | `/bmad-code-review` | Inline-patch commits (`ef14548`, `339ae5f`, `a31a901`, `d80f102`) |
| Test Architect (Murat) | `/bmad-testarch-trace`, `/bmad-testarch-nfr`, `/bmad-testarch-test-review`, `/bmad-testarch-framework`, `/bmad-testarch-ci`, `/bmad-qa-generate-e2e-tests` | `_bmad-output/test-artifacts/*`, Playwright scaffold, `.github/workflows/ci.yml` |
| Retrospective | `/bmad-retrospective` | 6 epic retros (`epic-1-retro` … `epic-7-retro`) |
| Tech Writer (Paige) | `/bmad-generate-project-context` | `docs/project-context.md` (`1bddfee`) |

### Prompt patterns that worked

- **Canonical invocation, not paraphrase.** Each phase was invoked with the literal `/bmad-<skill>` slash command; custom prompt rewrites bypassed the skill's built-in guardrails and produced lower-quality output.
- **One skill per subagent.** Running `trace`, `nfr`, and `test-review` as three parallel subagents (each with its own scratch context) produced three independent reports. Sequencing them in a single context caused later analyses to anchor on the first one's verdict.
- **Dev Notes as institutional memory.** Every story file carried `Previous Story Intelligence`, `Carried Debt`, and `Composition Checks` sections. This persistent context made the Dev agent's output noticeably less "amnesiac" from story to story.

---

## 2. MCP Server Usage

| MCP server | Where it helped |
|---|---|
| `plugin_playwright_playwright` | Every story's Composition Checks — the Dev agent drove a real browser to verify cross-feature assembly before marking work done. Eliminated the "unit tests green but UI broken" class of regressions. Epic 6 shipped one post-release polish commit (`bfa0d62`); Epic 7 shipped zero after Composition Checks became mandatory. |
| `plugin_github_github` | PR creation, review threads, merge — one PR per story (#2–#9). |
| Filesystem tools (Read/Edit/Write/Grep/Glob) | Default modality for code work. |

### What the Playwright MCP caught that unit tests missed

- Popover overflow clipping inside a scroll container (→ `bfa0d62`, the only post-release polish commit in the project).
- Roving-tabindex interactions inside the view switcher (→ RTL tests added in Story 7.1 after Playwright exposed the gap).
- FAB spacing + category-discoverability issues at narrow viewports.

---

## 3. Test Generation

### What AI did well

- **Backend pytest scaffolds.** Per-test hermetic SQLite engine, exact `{detail, code}` error-contract assertions, multi-user cookie-swap isolation tests, log-redaction checks. 86 backend tests, 100% of P0 acceptance criteria covered (per `_bmad-output/test-artifacts/traceability-report.md`).
- **Deterministic unit tests for pure helpers.** `getDeadlineBucket` (9 tests), priority utilities, deadline parsing.
- **Accessibility scaffolding.** `aria-*` / `role=` / `htmlFor=` hits: 121 across the frontend. `prefers-reduced-motion` respected in both CSS and JS (`frontend/src/lib/motion.ts`).

### What AI missed (and humans caught in review)

- **Brittle selectors.** Early RTL tests reached into DOM via `document.getElementById(...)` and Tailwind class substrings. Flagged by `/bmad-testarch-test-review` → tracked in `_bmad-output/test-artifacts/test-reviews/`.
- **No data factories.** Hardcoded emails/titles repeated across ~50 test functions. A factory layer would have collapsed ~50 `_register_and_login(client)` calls.
- **Determinism gaps.** `utils.test.ts` called `new Date()` directly — midnight-rollover flake risk until fake timers were introduced.
- **No E2E layer until Phase 4.2.** The unit+integration tiers were strong, but browser-driven journeys only landed via `/bmad-testarch-framework` + `/bmad-qa-generate-e2e-tests` retrospectively.
- **No automated accessibility gate until Phase 4.2.** Intentional a11y work shipped, but without `@axe-core/playwright` evidence the "zero critical WCAG AA" objective could not be asserted. Now gated in CI.

---

## 4. Debugging with AI

Specific wins documented in story Debug Logs and epic retros:

1. **Tailwind v4 `max-[400px]:` silent no-op** (Story 7.1). JIT didn't emit the `@media` rule for the arbitrary modifier. AI identified the symptom via iterative bisection (remove classes → observe no change in DevTools computed styles) and proposed a dedicated-class workaround. Documented as an Architecture Known Gotcha.
2. **Optimistic create/delete race** (`use-todos.ts`, carried from Epic 3 through Epic 7). AI produced a partial fix (`id < 0` guard) and explicitly flagged the residual tail rather than claim completion — exactly the behaviour requested by `deferred-work.md` convention.
3. **Popover Overflow Pattern.** `bfa0d62` (post-release polish) → lifted into `architecture.md` after AI traced the clipping to parent-container `overflow` and proposed a reusable portal-escape pattern.
4. **Auth deep-link search-param drop.** `AuthGuard` only preserved `pathname`, not `search`. AI identified it during composition checks, documented it as pre-existing and out-of-scope for the story touching it, and flagged it for the next auth story.

---

## 5. Limitations Encountered

- **AI over-abstracts given room.** Story 7.2 was tempted to promote `CategorySectionHeader` into a generic `CollapsibleSectionHeader`. The Dev Notes explicitly declined the abstraction until a third concrete consumer arrived. Without the "What NOT to do" section in the story template, AI reliably produced premature abstractions.
- **AI under-reads action items.** Epic 6 retro A6 (*"reuse `formatDeadline` for DeadlineGroupHeader grouping"*) could have been interpreted as "parse `formatDeadline`'s display text back into buckets" — brittle. The correct reading required the retro's rationale body, not just the bullet. **Takeaway:** action items must be written with the *why* co-located.
- **Cross-feature assembly.** Per-story ACs verify the feature in isolation; they don't catch "two features interact badly." Composition Checks + Playwright MCP became mandatory after Epic 6 produced one post-release polish commit. Epic 7 shipped zero.
- **AI does not self-correct security posture.** Rate limiting on auth endpoints was never flagged by the feature-level AI passes. It surfaced only during `/bmad-testarch-nfr`'s dedicated security sweep. **Takeaway:** dedicated NFR passes are not optional.
- **Coverage gates must be wired, not asserted.** "70% meaningful coverage" stated as an objective did not become true until `--cov-fail-under=70` and vitest `thresholds` landed in CI. AI writes the tests, but the **gate** is a separate, explicit deliverable.

### Where human expertise was critical

- Deciding when to abstract (pattern-reuse ceiling).
- Writing retro rationale (the *why*) so future passes read action items correctly.
- Scoping calls: what to defer to `deferred-work.md` vs. what to fix in-story.
- Choosing to run `/bmad-testarch-nfr` and `/bmad-testarch-trace` retrospectively against the final codebase — AI will not self-schedule adversarial reviews of its own output.

---

## 6. Quantitative Recap

| Metric | Value |
|---|---|
| Epics delivered | 7 / 7 |
| Stories delivered | 27 / 27 |
| Retrospectives | 6 (Epics 1, 2, 3, 5, 6, 7) |
| Backend tests | 86 (pytest, 100% P0 AC coverage per trace matrix) |
| Frontend unit tests | 52 (vitest) |
| E2E tests | Added in Phase 4.2 (Playwright + axe-core) |
| Post-release UI polish commits | 1 (`bfa0d62`, Epic 6) — eliminated in Epic 7 |
| New runtime dependencies across Epics 4–7 | 0 |
| Production incidents | 0 (local-only scope) |

---

## 7. Artifact Index

- Planning: `_bmad-output/planning-artifacts/`
- Stories + retros: `_bmad-output/implementation-artifacts/`
- QA reports: `_bmad-output/test-artifacts/` (`traceability-report.md`, `nfr-assessment.md`, `test-reviews/`, `ci-pipeline.md`, `e2e-coverage.md`)
- CI: `.github/workflows/ci.yml`
- Project context for AI agents: `docs/project-context.md`
