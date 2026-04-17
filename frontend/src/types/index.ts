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
// Todo types (Story 3.2+, expanded Story 5.1)
// ---------------------------------------------------------------------------

export type Todo = {
  id: number
  userId: number
  description: string
  isCompleted: boolean
  categoryId: number | null
  deadline: string | null // ISO 8601 date string "2026-04-20"
  priority: number | null // 1-5, null = no priority
  createdAt: string // ISO 8601 UTC
}

export type CreateTodoRequest = {
  description: string
  categoryId?: number | null
  deadline?: string | null
  priority?: number | null
}

export type UpdateTodoRequest = {
  isCompleted?: boolean
  description?: string
  categoryId?: number | null
  deadline?: string | null
  priority?: number | null
}

// ---------------------------------------------------------------------------
// Category types (Story 5.1)
// ---------------------------------------------------------------------------

export type Category = {
  id: number
  userId: number
  name: string
  createdAt: string
}

export type CreateCategoryRequest = {
  name: string
}

export type RenameCategoryRequest = {
  name: string
}

// ---------------------------------------------------------------------------
// View types (Story 7.1 — Multi-View Navigation)
// ---------------------------------------------------------------------------

/**
 * One of the three user-facing views in the main app.
 * - "all": existing category-section layout + Completed section (Epic 5 behavior)
 * - "week": flat priority-sorted list of todos due today through today + 6 days
 * - "deadline": grouped-by-deadline view (Story 7.2 — placeholder renders "all" until then)
 */
export type ViewType = "all" | "week" | "deadline"
