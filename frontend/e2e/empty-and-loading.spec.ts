import { expect, test } from "@playwright/test"

import { buildTestUser } from "./support/api"
import { registerAndLogin } from "./support/app"

/**
 * Empty + loading states:
 *   - A freshly registered user sees the empty-state copy pointing at the FAB.
 *   - During the initial GET /api/todos the skeleton loader is announced to
 *     assistive tech via `role="status" aria-label="Loading todos"`.
 */
test.describe("empty and loading states", () => {
  test("first-login user sees the empty-state hero and the pulsing FAB", async ({
    page,
    request,
  }) => {
    const user = buildTestUser("empty-state")
    await registerAndLogin(page, request, user)

    // Empty-state copy (UX-DR7: single welcoming line + arrow).
    await expect(
      page.getByText(/nothing here yet — press \+ to get started/i),
    ).toBeVisible()

    // The FAB itself should be present and accessible.
    await expect(page.getByRole("button", { name: "Add todo" })).toBeVisible()
  })

  test("skeleton loading state renders before data arrives", async ({
    page,
    request,
  }) => {
    const user = buildTestUser("loading")
    await registerAndLogin(page, request, user)

    // Force a slow network path for the next todos fetch so we can observe
    // the skeleton. We only slow /api/todos — not the whole navigation —
    // and only for this test.
    await page.route("**/api/todos", async (route) => {
      // Hold the request for ~500ms to give the skeleton time to render.
      await new Promise((r) => setTimeout(r, 500))
      await route.continue()
    })

    const loadingPromise = page.waitForSelector(
      'role=status[name="Loading todos"]',
      { state: "visible", timeout: 10_000 },
    )

    // Trigger a refetch by navigating back to home.
    await page.goto("/")

    const skeleton = await loadingPromise
    expect(skeleton).toBeTruthy()
  })
})
