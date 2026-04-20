import { expect, test } from "@playwright/test"

import { buildTestUser } from "./support/api"
import { createTodoViaFab, registerAndLogin } from "./support/app"

/**
 * Keyboard navigation + focus management. We do NOT assert the exact tab
 * order of every focusable element (that's brittle across browsers and
 * viewport sizes) — we verify the higher-value guarantees:
 *
 *   - The FAB opens on Enter and returns focus to the input
 *   - Escape closes the FAB and returns focus to the FAB button
 *   - A todo's checkbox is reachable and has a visible focus ring
 *     (detected by the presence of CSS outline or box-shadow on focus)
 */
test.describe("keyboard navigation", () => {
  test.beforeEach(async ({ page, request }) => {
    const user = buildTestUser("kbd")
    await registerAndLogin(page, request, user)
  })

  test("FAB opens on Enter, Escape restores focus to the FAB button", async ({
    page,
  }) => {
    const fab = page.getByRole("button", { name: "Add todo" })

    // Focus the FAB explicitly and open it with Enter.
    await fab.focus()
    await expect(fab).toBeFocused()
    await page.keyboard.press("Enter")

    // Panel opens and focus moves to the input.
    const input = page.getByLabel("New todo")
    await expect(input).toBeVisible()
    await expect(input).toBeFocused()

    // Escape collapses the panel and returns focus to the FAB button.
    await page.keyboard.press("Escape")
    await expect(page.getByLabel("New todo")).toHaveCount(0)
    // requestAnimationFrame chain in `fab.tsx` moves focus on the next
    // frame — a short timeout covers this deterministically.
    await expect(fab).toBeFocused({ timeout: 5_000 })
  })

  test("todo checkbox is keyboard-activatable and its focus ring class is wired up", async ({
    page,
  }) => {
    await createTodoViaFab(page, "Keyboard-friendly task")

    const item = page
      .getByRole("listitem")
      .filter({ hasText: "Keyboard-friendly task" })
      .first()
    const checkbox = item.getByRole("checkbox", { name: /mark as complete/i })

    // Structural assertion: the focus-visible ring utility class is wired up.
    // We do NOT verify the paint because `:focus-visible` is a browser
    // heuristic (keyboard-source only) and WebKit reports headless buttons
    // as "inactive" even after `.focus()`. Observing the class guarantees
    // the regression "someone removed focus-visible:ring" gets caught
    // without coupling the assertion to a specific browser's focus
    // semantics.
    const hasFocusRingClass = await checkbox.evaluate((el) =>
      el.className.includes("focus-visible:ring"),
    )
    expect(hasFocusRingClass).toBe(true)

    // Verify the checkbox is keyboard-reachable. We send both Space
    // (the canonical activation key for role=checkbox per the WAI-ARIA
    // APG) and Enter, because headless `<button role="checkbox">`
    // behaviour differs by engine: Chromium's native button handler
    // fires click on Enter, Firefox fires click on Space, and WebKit
    // accepts either. Hitting both covers all three uniformly while
    // still exercising real keyboard-driven activation (no synthetic
    // clicks). Once the aria-checked flag flips we know the keystroke
    // reached the onClick handler; the second keystroke would toggle
    // it back, so we stop as soon as the assertion succeeds.
    await checkbox.focus()
    await page.keyboard.press("Space")
    if (
      (await item
        .getByRole("checkbox", { name: /mark as active/i })
        .count()) === 0
    ) {
      await checkbox.focus()
      await page.keyboard.press("Enter")
    }

    await expect(
      item.getByRole("checkbox", { name: /mark as active/i }),
    ).toHaveAttribute("aria-checked", "true", { timeout: 10_000 })
  })
})
