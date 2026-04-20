import { expect, test } from "@playwright/test"

import { buildTestUser } from "./support/api"
import {
  createCategoryViaPanel,
  createTodoViaFab,
  registerAndLogin,
} from "./support/app"

/**
 * Category journey (Epic 4):
 *   - Create a category via the management panel
 *   - Assign it to a new todo through the FAB's category selector
 *   - Verify the "All" view sections the todo under its category header
 */
test.describe("categories", () => {
  test("create, assign, and see the section header for a category", async ({
    page,
    request,
  }) => {
    const user = buildTestUser("categories")
    await registerAndLogin(page, request, user)

    const categoryName = "Groceries"
    const todoDescription = "Pick up tomatoes"

    // --- create a category -----------------------------------------------
    await createCategoryViaPanel(page, categoryName)

    // --- create a todo assigned to that category -------------------------
    await page.getByRole("button", { name: "Add todo" }).click()
    const input = page.getByLabel("New todo")
    await input.fill(todoDescription)

    // The FAB renders a <select> for category once categories are loaded.
    await page.getByLabel("Category").selectOption({ label: categoryName })

    await input.press("Enter")

    await expect(
      page.getByRole("listitem").filter({ hasText: todoDescription }),
    ).toBeVisible({ timeout: 10_000 })

    // --- verify category header appears in the All view ------------------
    // The CategorySectionHeader renders the category name as a button.
    await expect(
      page.getByRole("button", { name: new RegExp(categoryName, "i") }).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test("creating a todo without a category places it under Uncategorized", async ({
    page,
    request,
  }) => {
    const user = buildTestUser("categories-uncat")
    await registerAndLogin(page, request, user)

    // Create at least one category so the "Uncategorized" grouping is
    // meaningful (otherwise the grouping collapses into a single list).
    await createCategoryViaPanel(page, "Work")

    // Add a todo without any category selected.
    await createTodoViaFab(page, "Standalone todo")

    // The Uncategorized section header should appear since there's an
    // uncategorized active todo.
    await expect(
      page.getByRole("button", { name: /uncategorized/i }).first(),
    ).toBeVisible({ timeout: 10_000 })
  })
})
