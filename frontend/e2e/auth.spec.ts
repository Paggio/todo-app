import { expect, test } from "@playwright/test"

import { expectNoSeriousAxeViolations } from "./support/a11y"
import { buildTestUser } from "./support/api"
import { loginViaUi } from "./support/app"

/**
 * Auth journey end-to-end:
 *   1. User registers from the UI → auto-login redirects to home
 *   2. User signs out → redirects back to /login
 *   3. User signs back in with the same credentials → lands on home again
 *
 * Covers Epic 2 stories 2.1 (register), 2.2 (login + me) and 2.3 (logout),
 * including the acceptance criterion that the login screen has no
 * WCAG 2.1 A/AA critical accessibility violations.
 */
test.describe("auth", () => {
  test("register, logout and login again all flow through the real UI", async ({
    page,
  }) => {
    const user = buildTestUser("auth-full")

    // --- register via the UI ----------------------------------------------
    await page.goto("/login")

    // Accessibility pass on the Sign-in screen (form is the landmark).
    await expect(page.getByRole("form")).toBeVisible()
    await expectNoSeriousAxeViolations(page, "/login (sign-in mode)")

    // Switch to sign-up mode.
    await page.getByRole("button", { name: /new here\? create an account/i }).click()
    await expect(
      page.getByRole("heading", { name: /create your account/i }),
    ).toBeVisible()

    // Fill and submit the registration form.
    await page.getByLabel("Email").fill(user.email)
    await page.getByLabel("Password").fill(user.password)
    await page.getByRole("button", { name: "Sign up" }).click()

    // Server responds 201 + cookie → auth hook sets user → LoginPage plays
    // the exit animation and navigates to "/". The Todos heading is our
    // "logged in" assertion.
    await expect(
      page.getByRole("heading", { name: "Todos", level: 1 }),
    ).toBeVisible({ timeout: 15_000 })

    // Quick home-page axe pass (empty state, logged in).
    await expectNoSeriousAxeViolations(page, "/ (home, empty, authed)")

    // --- log out ----------------------------------------------------------
    await page.getByRole("button", { name: "Sign out" }).click()

    // AuthGuard kicks us back to /login on the next render.
    await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 })
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible()

    // --- log back in with the same account -------------------------------
    await loginViaUi(page, user)
    await expect(
      page.getByRole("heading", { name: "Todos", level: 1 }),
    ).toBeVisible()
  })

  test("rejects obviously-bad credentials with an inline error", async ({
    page,
  }) => {
    await page.goto("/login")

    await page.getByLabel("Email").fill("nobody-nowhere@example.com")
    await page.getByLabel("Password").fill("definitely-wrong")
    await page.getByRole("button", { name: "Sign in" }).click()

    // Backend returns 401 with `detail: "Invalid email or password"` — the
    // AuthScreen surfaces it via role="alert".
    await expect(page.getByRole("alert").first()).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole("alert").first()).toContainText(
      /invalid email or password/i,
    )

    // Still on /login.
    await expect(page).toHaveURL(/\/login$/)
  })
})
