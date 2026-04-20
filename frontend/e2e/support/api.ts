import type { APIRequestContext } from "@playwright/test"

/**
 * Backend base URL. Defaults to the docker-compose port used by the project.
 * Override via the `API_URL` env var when running the suite against a
 * different host (e.g. a CI staging backend).
 */
export const API_BASE_URL: string =
  process.env.API_URL ?? "http://localhost:8000"

export type TestUser = {
  email: string
  password: string
}

/**
 * Create a deterministic-but-unique user for a single test. We embed the
 * worker index, test id, and a random nonce so each test gets an isolated
 * account — no cross-test pollution and no need to reset the DB between
 * suites.
 */
export function buildTestUser(tag: string): TestUser {
  const nonce = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
  // Using `example.com` (IANA reserved for examples) rather than the
  // `.test` TLD because `pydantic[email]` / `email-validator` rejects
  // `.test` as a "special-use or reserved name". We still get full test
  // isolation via the `Date.now()` + random nonce.
  return {
    email: `e2e-${tag}-${nonce}@example.com`,
    password: "Passw0rd!-e2e",
  }
}

/**
 * Register a fresh user via the real backend. Returns the credentials so
 * the caller can subsequently log in through the UI (which exercises the
 * auth cookie + session hydration path).
 *
 * We deliberately register via the API rather than the UI because:
 *   1. It makes setup ~5× faster than driving the auth form each test
 *   2. UI-level auth tests still run register-through-the-screen in
 *      `auth.spec.ts` — we just don't duplicate that for every other test.
 */
export async function registerUserViaApi(
  request: APIRequestContext,
  user: TestUser,
): Promise<void> {
  const res = await request.post(`${API_BASE_URL}/api/auth/register`, {
    data: { email: user.email, password: user.password },
    headers: { "Content-Type": "application/json" },
    // We don't need the set-cookie here — the browser will issue its own
    // cookie when the test logs in through the UI.
    failOnStatusCode: false,
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(
      `registerUserViaApi failed (${res.status()}): ${body.slice(0, 300)}`,
    )
  }
}
