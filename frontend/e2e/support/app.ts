import { expect, type Page } from "@playwright/test"

import { registerUserViaApi, type TestUser } from "./api"

/**
 * Drive the auth screen to sign in as an existing user. Asserts we land on
 * the home page (Todos heading visible). This is the happy path shared by
 * most feature tests.
 */
export async function loginViaUi(page: Page, user: TestUser): Promise<void> {
  await page.goto("/login")

  // Wait for the auth form before typing to avoid races with initial auth
  // hydration (/api/auth/me 401 → unauthenticated → auth screen renders).
  const emailInput = page.getByLabel("Email")
  await expect(emailInput).toBeVisible()

  await emailInput.fill(user.email)
  await page.getByLabel("Password").fill(user.password)
  await page.getByRole("button", { name: "Sign in" }).click()

  // Successful login plays the exit animation then navigates home. The
  // "Todos" heading is the unambiguous landmark.
  await expect(
    page.getByRole("heading", { name: "Todos", level: 1 }),
  ).toBeVisible({ timeout: 15_000 })
}

/**
 * Register + sign in a fresh user. Preferred setup for feature tests — the
 * user starts with a clean, empty todo list.
 */
export async function registerAndLogin(
  page: Page,
  request: Parameters<typeof registerUserViaApi>[0],
  user: TestUser,
): Promise<void> {
  await registerUserViaApi(request, user)
  await loginViaUi(page, user)
}

/**
 * Open the FAB panel, type a description, and submit with Enter. Waits for
 * the todo to appear in the active list by its visible text.
 *
 * We do not fill priority/category/deadline here — individual tests handle
 * those interactions explicitly when they are the subject under test.
 */
export async function createTodoViaFab(
  page: Page,
  description: string,
): Promise<void> {
  await page.getByRole("button", { name: "Add todo" }).click()

  const input = page.getByLabel("New todo")
  await expect(input).toBeVisible()
  await input.fill(description)
  await input.press("Enter")

  // The optimistic item is rendered immediately by TanStack Query before
  // the server confirms — assert on visible text, which is stable across
  // both the optimistic and confirmed renders.
  await expect(
    page.getByRole("listitem").filter({ hasText: description }).first(),
  ).toBeVisible()
}

/**
 * Open the category management panel and create a category by name. Asserts
 * the chip appears in the category list.
 */
export async function createCategoryViaPanel(
  page: Page,
  name: string,
): Promise<void> {
  await page.getByRole("button", { name: "Add category" }).click()

  const dialog = page.getByRole("dialog", { name: "Category management" })
  await expect(dialog).toBeVisible()

  const input = dialog.getByLabel("Add category")
  await input.fill(name)
  await input.press("Enter")

  // New category appears in the list — the rename "button" renders with
  // its plain name as the accessible name. The delete button is
  // `aria-label="Delete category <name>"`, so match exactly to avoid
  // strict-mode locator collisions.
  await expect(dialog.getByRole("button", { name, exact: true })).toBeVisible()

  // Close the panel so the test can interact with the home screen again.
  await dialog.getByRole("button", { name: "Close category management" }).click()
  await expect(dialog).toBeHidden()
}
