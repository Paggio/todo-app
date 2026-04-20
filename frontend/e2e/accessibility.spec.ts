import { expect, test } from "@playwright/test"

import { expectNoSeriousAxeViolations } from "./support/a11y"
import { buildTestUser } from "./support/api"
import {
  createCategoryViaPanel,
  createTodoViaFab,
  registerAndLogin,
} from "./support/app"

/**
 * WCAG 2.1 A/AA accessibility audit with axe-core across the critical
 * pages and states of the app. The assertion is: zero `critical` or
 * `serious` violations per state. Moderate/minor issues are surfaced in
 * the HTML report but do not fail the suite.
 */
test.describe("accessibility (axe-core, WCAG 2.1 A/AA)", () => {
  test("/login renders without critical/serious violations", async ({
    page,
  }) => {
    await page.goto("/login")
    await expect(page.getByRole("form")).toBeVisible()
    await expectNoSeriousAxeViolations(page, "/login")
  })

  test("home empty state is accessible", async ({ page, request }) => {
    const user = buildTestUser("a11y-empty")
    await registerAndLogin(page, request, user)

    await expect(
      page.getByRole("heading", { name: "Todos", level: 1 }),
    ).toBeVisible()
    await expectNoSeriousAxeViolations(page, "/ (empty state)")
  })

  test("home with data and a category is accessible across all three views", async ({
    page,
    request,
  }) => {
    const user = buildTestUser("a11y-loaded")
    await registerAndLogin(page, request, user)

    await createCategoryViaPanel(page, "Reading")
    await createTodoViaFab(page, "Finish the book")

    // All view (default)
    await expectNoSeriousAxeViolations(page, "/ view=all (with data)")

    // Week view
    await page
      .getByRole("tablist", { name: "Switch view" })
      .getByRole("tab", { name: /this week|week/i })
      .click()
    await expect(page).toHaveURL(/view=week/)
    await expectNoSeriousAxeViolations(page, "/ view=week")

    // By Deadline view
    await page
      .getByRole("tablist", { name: "Switch view" })
      .getByRole("tab", { name: /deadline/i })
      .click()
    await expect(page).toHaveURL(/view=deadline/)
    await expectNoSeriousAxeViolations(page, "/ view=deadline")
  })
})
