import { expect, test } from "@playwright/test"

import { buildTestUser } from "./support/api"
import { createTodoViaFab, registerAndLogin } from "./support/app"

/**
 * View switcher journey (Epic 7):
 *   - All (default)
 *   - This Week (filtered by deadline <= today+6)
 *   - By Deadline (grouped by temporal bucket)
 *
 * The switcher is an accessible tablist — we assert `aria-selected` and
 * that the URL query param (`?view=...`) updates. We deliberately don't
 * set up deadlines here: the goal is to verify the navigation contract,
 * not the selector logic (that's covered by unit tests in
 * `by-deadline-view.test.tsx` + `view-switcher.test.tsx`).
 */
test.describe("views", () => {
  test.beforeEach(async ({ page, request }) => {
    const user = buildTestUser("views")
    await registerAndLogin(page, request, user)
    // Seed a single active todo so the tabpanel has content to render and
    // the default "All" view isn't in its empty-state path.
    await createTodoViaFab(page, "A todo with no deadline")
  })

  test("switches between All, This Week and By Deadline tabs", async ({
    page,
  }) => {
    const tablist = page.getByRole("tablist", { name: "Switch view" })
    await expect(tablist).toBeVisible()

    const allTab = tablist.getByRole("tab", { name: /^all$/i })
    const weekTab = tablist.getByRole("tab", { name: /this week|week/i })
    const deadlineTab = tablist.getByRole("tab", { name: /deadline/i })

    // Default: "All" is selected.
    await expect(allTab).toHaveAttribute("aria-selected", "true")

    // Click "This Week".
    await weekTab.click()
    await expect(weekTab).toHaveAttribute("aria-selected", "true")
    await expect(allTab).toHaveAttribute("aria-selected", "false")
    await expect(page).toHaveURL(/[?&]view=week/)

    // The todo we seeded has no deadline → empty state for this view.
    await expect(page.getByText(/nothing due this week/i)).toBeVisible()

    // Click "By Deadline".
    await deadlineTab.click()
    await expect(deadlineTab).toHaveAttribute("aria-selected", "true")
    await expect(page).toHaveURL(/[?&]view=deadline/)

    // "No Deadline" group header should appear (todo without a deadline
    // falls into the last bucket per `selectByDeadline`).
    await expect(
      page.getByRole("button", { name: /no deadline/i }).first(),
    ).toBeVisible()

    // Back to All.
    await allTab.click()
    await expect(allTab).toHaveAttribute("aria-selected", "true")
  })

  test("arrow keys move focus through the tablist (roving tabindex)", async ({
    page,
  }) => {
    const tablist = page.getByRole("tablist", { name: "Switch view" })
    const tabs = tablist.getByRole("tab")

    await tabs.nth(0).focus()
    await expect(tabs.nth(0)).toBeFocused()

    await page.keyboard.press("ArrowRight")
    await expect(tabs.nth(1)).toBeFocused()

    await page.keyboard.press("ArrowRight")
    await expect(tabs.nth(2)).toBeFocused()

    await page.keyboard.press("Home")
    await expect(tabs.nth(0)).toBeFocused()

    await page.keyboard.press("End")
    await expect(tabs.nth(2)).toBeFocused()
  })
})
