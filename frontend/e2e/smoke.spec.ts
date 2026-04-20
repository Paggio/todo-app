import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

/**
 * Lightweight smoke test.
 *
 * Verifies that the frontend shell loads successfully and that the initial
 * rendered page has no critical accessibility (WCAG 2.1 A / AA) violations.
 *
 * The full E2E suite (CRUD flows, auth, deadline views, etc.) will be produced
 * by a later `/bmad-qa-generate-e2e-tests` run.
 */
test.describe("app shell - smoke", () => {
  test("loads the frontend and renders without critical a11y violations", async ({
    page,
  }) => {
    // Given the user navigates to the app root
    const response = await page.goto("/")

    // When the page finishes loading
    // Then the HTTP response is successful
    expect(response?.ok(), "root request should succeed").toBe(true)

    // And a document <title> is rendered (Vite templates inject one)
    await expect(page).toHaveTitle(/.+/)

    // And the React root has mounted some content
    const root = page.locator("#root")
    await expect(root).toBeVisible()

    // And axe finds no critical WCAG 2.1 A/AA violations
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze()

    expect(
      accessibilityScanResults.violations,
      `axe found accessibility violations:\n${JSON.stringify(
        accessibilityScanResults.violations,
        null,
        2,
      )}`,
    ).toEqual([])
  })
})
