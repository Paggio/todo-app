import { expect, test } from "@playwright/test"

import { buildTestUser } from "./support/api"
import { createTodoViaFab, registerAndLogin } from "./support/app"

/**
 * Todo CRUD journey:
 *   - Create via the FAB (Enter submits, Escape cancels, empty submit prevented)
 *   - Toggle completion (optimistic move into Completed section)
 *   - Delete (inline confirmation → optimistic removal)
 *
 * Covers Epic 3 stories 3.3 (create), 3.4 (toggle) and 3.5 (delete).
 */
test.describe("todo CRUD", () => {
  test.beforeEach(async ({ page, request }) => {
    const user = buildTestUser("todo-crud")
    await registerAndLogin(page, request, user)
  })

  test("create, toggle, and delete a single todo", async ({ page }) => {
    const description = "Buy oat milk"

    // --- create -----------------------------------------------------------
    await createTodoViaFab(page, description)

    const item = page
      .getByRole("listitem")
      .filter({ hasText: description })
      .first()
    await expect(item).toBeVisible()

    // --- toggle to completed ---------------------------------------------
    await item.getByRole("checkbox", { name: /mark as complete/i }).click()

    // Completed section header appears (only rendered when ≥1 completed todo).
    await expect(page.getByRole("button", { name: /completed/i })).toBeVisible({
      timeout: 10_000,
    })

    // The checkbox's aria-checked flips to true.
    await expect(
      item.getByRole("checkbox", { name: /mark as active/i }),
    ).toHaveAttribute("aria-checked", "true")

    // --- delete via the inline-confirm flow ------------------------------
    // Hover over the row so the X button becomes visible (opacity transition
    // only exposes it on hover/focus).
    await item.hover()
    await item.getByRole("button", { name: "Delete todo" }).click()

    // Inline confirmation row appears with a destructive primary action.
    const confirm = page.getByRole("button", { name: /confirm delete/i })
    await expect(confirm).toBeVisible()
    await confirm.click()

    // After the 200ms collapse animation + server DELETE, the item is gone.
    await expect(
      page.getByRole("listitem").filter({ hasText: description }),
    ).toHaveCount(0, { timeout: 10_000 })
  })

  test("Enter submits, Escape closes, and empty titles are blocked", async ({
    page,
  }) => {
    // Expand the FAB.
    await page.getByRole("button", { name: "Add todo" }).click()
    const input = page.getByLabel("New todo")
    await expect(input).toBeVisible()
    await expect(input).toBeFocused()

    // Attempt to submit empty — shows inline validation, no listitem is created.
    await input.press("Enter")
    await expect(
      page.getByText("Description cannot be empty").first(),
    ).toBeVisible()
    await expect(page.getByRole("listitem")).toHaveCount(0)

    // Type a real todo and submit with Enter.
    await input.fill("Write tests")
    await input.press("Enter")
    await expect(
      page.getByRole("listitem").filter({ hasText: "Write tests" }),
    ).toBeVisible()

    // Open the FAB again and verify Escape collapses it without submitting.
    await page.getByRole("button", { name: "Add todo" }).click()
    const reopened = page.getByLabel("New todo")
    await expect(reopened).toBeVisible()
    await reopened.fill("Should not be saved")
    await reopened.press("Escape")

    // The panel label is gone — we're back to idle.
    await expect(page.getByLabel("New todo")).toHaveCount(0)
    await expect(
      page.getByRole("listitem").filter({ hasText: "Should not be saved" }),
    ).toHaveCount(0)
  })

  test("creating multiple todos keeps them all in the list", async ({ page }) => {
    const todos = ["Alpha task", "Beta task", "Gamma task"]

    for (const t of todos) {
      await createTodoViaFab(page, t)
    }

    for (const t of todos) {
      await expect(
        page.getByRole("listitem").filter({ hasText: t }).first(),
      ).toBeVisible()
    }
  })
})
