/**
 * Shared TypeScript types — the single source of truth for shapes the
 * frontend exchanges with the API. All keys are camelCase; the API
 * boundary in `lib/api.ts` handles snake_case ↔ camelCase transforms.
 */

export type User = {
  id: number
  email: string
  createdAt: string // ISO 8601 UTC, e.g. "2026-04-15T10:30:00Z"
}

export type RegisterRequest = {
  email: string
  password: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type ApiError = {
  detail: string
  code: string
}

// ---------------------------------------------------------------------------
// Todo types (Story 3.2+)
// ---------------------------------------------------------------------------

export type Todo = {
  id: number
  userId: number
  description: string
  isCompleted: boolean
  createdAt: string // ISO 8601 UTC
}

export type CreateTodoRequest = {
  description: string
}

export type UpdateTodoRequest = {
  isCompleted?: boolean
  description?: string
}
