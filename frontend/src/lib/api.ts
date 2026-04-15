/**
 * HTTP boundary with the backend.
 *
 * Responsibilities:
 *  - Always include the httpOnly auth cookie (`credentials: "include"`)
 *  - Transform camelCase → snake_case on outgoing bodies
 *  - Transform snake_case → camelCase on incoming bodies
 *  - Throw a typed `ApiClientError` on non-2xx so callers can branch on status/code
 *  - Global 401 interceptor: dispatches `auth:unauthorized` event on any 401
 *    response, then throws `ApiClientError` as usual.
 */

import type { ApiError } from "@/types"

// ---------------------------------------------------------------------------
// Key-case transforms
// ---------------------------------------------------------------------------

const CAMEL_RE = /([A-Z])/g
const SNAKE_RE = /_([a-z])/g

function toSnakeKey(key: string): string {
  return key.replace(CAMEL_RE, (_, ch: string) => `_${ch.toLowerCase()}`)
}

function toCamelKey(key: string): string {
  return key.replace(SNAKE_RE, (_, ch: string) => ch.toUpperCase())
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  )
}

function transformKeys(
  value: unknown,
  transform: (key: string) => string
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => transformKeys(item, transform))
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[transform(k)] = transformKeys(v, transform)
    }
    return out
  }
  return value
}

export function toSnake<T>(value: T): unknown {
  return transformKeys(value, toSnakeKey)
}

export function toCamel<T>(value: unknown): T {
  return transformKeys(value, toCamelKey) as T
}

// ---------------------------------------------------------------------------
// Error surface
// ---------------------------------------------------------------------------

export class ApiClientError extends Error {
  readonly status: number
  readonly payload: ApiError

  constructor(status: number, payload: ApiError) {
    super(payload.detail || `Request failed (${status})`)
    this.name = "ApiClientError"
    this.status = status
    this.payload = payload
  }
}

// ---------------------------------------------------------------------------
// Fetch wrapper
// ---------------------------------------------------------------------------

type ApiFetchInit = Omit<RequestInit, "body"> & {
  body?: unknown
}

const BASE_URL: string = (import.meta.env.VITE_API_URL as string) ?? ""

export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`

  const headers = new Headers(init.headers)
  const hasBody = init.body !== undefined && init.body !== null

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
    body: hasBody ? JSON.stringify(toSnake(init.body)) : undefined,
  })

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"))
  }

  const text = await response.text()
  const parsed: unknown = text ? (JSON.parse(text) as unknown) : null

  if (!response.ok) {
    const errorPayload: ApiError =
      isPlainObject(parsed) &&
      typeof parsed.detail === "string" &&
      typeof parsed.code === "string"
        ? { detail: parsed.detail, code: parsed.code }
        : { detail: response.statusText, code: "UNKNOWN_ERROR" }
    throw new ApiClientError(response.status, errorPayload)
  }

  return toCamel<T>(parsed)
}
