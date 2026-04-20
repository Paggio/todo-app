import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright configuration for the bmad_nf_todo_app frontend.
 *
 * The frontend dev/preview server runs on http://localhost:5173 (Vite default).
 * The backend API is expected at http://localhost:8000 (docker-compose).
 *
 * Override via environment variables:
 *   BASE_URL   - frontend base URL (default http://localhost:5173)
 *   API_URL    - backend API URL (default http://localhost:8000)
 *   CI         - when set, enables retries + single worker
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173"

export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail build on CI if test.only is committed */
  forbidOnly: Boolean(process.env.CI),
  /* Retry only on CI */
  retries: process.env.CI ? 2 : 0,
  /* Single worker on CI for determinism, parallel locally */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter: HTML for humans, list for console, JUnit for CI */
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],
  /* Timeouts */
  timeout: 60_000,
  expect: { timeout: 10_000 },
  /* Shared settings for all projects */
  use: {
    baseURL: BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  /* Browser projects */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  /* Auto-start the Vite dev server when running locally.
     Skip when BASE_URL points to an already-running server (e.g., in CI with docker-compose). */
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "pnpm dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  outputDir: "test-results",
})
