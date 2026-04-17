import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiFetch } from "@/lib/api"
import { queryClient } from "@/lib/query-client"
import { getDeadlineBucket, type DeadlineBucket } from "@/lib/utils"
import type { CreateTodoRequest, Todo, UpdateTodoRequest } from "@/types"

/**
 * Fetches the authenticated user's todos via `GET /api/todos`.
 *
 * Query key `["todos"]` enables targeted invalidation from mutation hooks
 * in Stories 3.3-3.5 via `queryClient.invalidateQueries({ queryKey: ["todos"] })`.
 */
export function useGetTodos() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: () => apiFetch<Todo[]>("/api/todos"),
  })
}

// ---------------------------------------------------------------------------
// View selectors (Story 7.1) — pure, memoisable, co-located with useGetTodos
// ---------------------------------------------------------------------------

const DAY_MS = 1000 * 60 * 60 * 24

/**
 * Parses a `YYYY-MM-DD` deadline into a Date at *local* midnight. We do NOT
 * use `new Date("YYYY-MM-DD")` because that is parsed as UTC midnight and
 * can shift the date back by one day in negative-offset timezones. This
 * matches the parsing convention established by Story 6.2 (`isOverdue`,
 * `formatDeadline` in `lib/utils.ts`).
 */
function parseDeadlineLocal(deadline: string): Date {
  const [y, m, d] = deadline.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Sort-key for a priority level. `null` priority sorts last (6) so that
 * P1..P5 come first in ascending order.
 */
export function PRIORITY_SORT_KEY(priority: number | null): number {
  return priority ?? 6
}

/**
 * Client-side selector for the "This Week" view (Story 7.1, FR43 + FR44).
 *
 * Filter:
 *   - `isCompleted === false`
 *   - `deadline !== null`
 *   - today ≤ deadline ≤ today + 6 days (at local midnight)
 *   - Overdue (deadline < today) is NOT included — that belongs to the
 *     By Deadline "Overdue" group in Story 7.2
 *
 * Sort (stable):
 *   1. `priority ?? 6` ascending (P1..P5, null last)
 *   2. `deadline` ascending (ISO "YYYY-MM-DD" sorts lexicographically,
 *      which is also chronologically correct for same-format dates)
 *   3. `createdAt` ascending (tie-break)
 *
 * Returns a new array — never mutates the input (TanStack Query cache must
 * stay immutable for structural-sharing correctness).
 */
export function selectDueThisWeek(todos: Todo[]): Todo[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayMs = today.getTime()
  const weekEndMs = todayMs + 6 * DAY_MS

  return [...todos]
    .filter((t) => {
      if (t.isCompleted) return false
      if (t.deadline === null) return false
      const d = parseDeadlineLocal(t.deadline).getTime()
      return d >= todayMs && d <= weekEndMs
    })
    .sort((a, b) => {
      const pa = PRIORITY_SORT_KEY(a.priority)
      const pb = PRIORITY_SORT_KEY(b.priority)
      if (pa !== pb) return pa - pb
      // Both deadlines are non-null after the filter above.
      if (a.deadline !== b.deadline) {
        return (a.deadline ?? "").localeCompare(b.deadline ?? "")
      }
      return a.createdAt.localeCompare(b.createdAt)
    })
}

// ---------------------------------------------------------------------------
// By Deadline selector (Story 7.2, UX-DR33)
// ---------------------------------------------------------------------------

/**
 * A single grouped bucket returned by `selectByDeadline`. Each group carries
 * its machine `bucket` identifier, the display `label`, and the sorted todos
 * that fall into it. Empty buckets are dropped entirely — never include a
 * `todos: []` placeholder.
 */
export type DeadlineGroup = {
  bucket: DeadlineBucket
  label: string
  todos: Todo[]
}

/**
 * Fixed bucket order for the "By Deadline" view: Overdue → Today → Tomorrow
 * → This Week → Later → No Deadline. The label text is the user-facing copy;
 * the bucket key is the machine value shared with `getDeadlineBucket` and
 * `DeadlineGroupHeader`'s localStorage key.
 */
const DEADLINE_GROUPS: readonly { bucket: DeadlineBucket; label: string }[] = [
  { bucket: "overdue", label: "Overdue" },
  { bucket: "today", label: "Today" },
  { bucket: "tomorrow", label: "Tomorrow" },
  { bucket: "this-week", label: "This Week" },
  { bucket: "later", label: "Later" },
  { bucket: "no-deadline", label: "No Deadline" },
] as const

/**
 * Client-side selector for the "By Deadline" view (Story 7.2, UX-DR33, FR46).
 *
 * Filter:
 *   - `isCompleted === false` — completed todos render in `CompletedSection`
 *   - Includes every deadline value (null → "no-deadline" bucket)
 *
 * Group:
 *   - Classified via `getDeadlineBucket(todo.deadline)`; returned buckets
 *     appear in the fixed order defined by `DEADLINE_GROUPS`
 *   - Empty buckets are dropped entirely so the view renders only non-empty
 *     groups
 *
 * Sort (within each bucket, stable):
 *   1. `PRIORITY_SORT_KEY(priority)` ascending (P1..P5, null last)
 *   2. `deadline` ascending (ISO "YYYY-MM-DD" lex = chronological). For the
 *      "no-deadline" bucket every value is null, so this tier is a no-op
 *      and sorting falls through to tier 3.
 *   3. `createdAt` ascending (stable tie-break)
 *
 * Never mutates the input array — always `[...items].sort(...)`.
 */
export function selectByDeadline(todos: Todo[]): DeadlineGroup[] {
  const byBucket = new Map<DeadlineBucket, Todo[]>()
  for (const g of DEADLINE_GROUPS) byBucket.set(g.bucket, [])

  for (const t of todos) {
    if (t.isCompleted) continue
    const bucket = getDeadlineBucket(t.deadline)
    byBucket.get(bucket)!.push(t)
  }

  const cmp = (a: Todo, b: Todo) => {
    const pa = PRIORITY_SORT_KEY(a.priority)
    const pb = PRIORITY_SORT_KEY(b.priority)
    if (pa !== pb) return pa - pb
    // Deadline tier — for no-deadline both values are null → localeCompare
    // on "" returns 0 and we fall through to createdAt. For other buckets
    // the same ISO "YYYY-MM-DD" format sorts chronologically under lex.
    const da = a.deadline ?? ""
    const db = b.deadline ?? ""
    if (da !== db) return da.localeCompare(db)
    return a.createdAt.localeCompare(b.createdAt)
  }

  return DEADLINE_GROUPS.flatMap((g) => {
    const items = byBucket.get(g.bucket)!
    if (items.length === 0) return []
    return [{ bucket: g.bucket, label: g.label, todos: [...items].sort(cmp) }]
  })
}

/**
 * Creates a new todo via `POST /api/todos` with the mandatory three-step
 * optimistic update pattern: onMutate (snapshot + optimistic write) →
 * onError (rollback) → onSettled (revalidate from server).
 */
export function useCreateTodo() {
  return useMutation({
    mutationFn: (payload: CreateTodoRequest) =>
      apiFetch<Todo>("/api/todos", { method: "POST", body: payload }),

    onMutate: async (newTodo) => {
      // (a) Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ["todos"] })

      // (b) Snapshot current cache for rollback
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"])

      // (c) Create temporary optimistic todo (negative ID avoids collision with real IDs)
      const optimisticTodo: Todo = {
        id: -Date.now(),
        userId: 0,
        description: newTodo.description,
        isCompleted: false,
        categoryId: newTodo.categoryId ?? null,
        deadline: newTodo.deadline ?? null,
        priority: newTodo.priority ?? null,
        createdAt: new Date().toISOString(),
      }

      // (d) Prepend optimistic item to cache (most recent first, matching API sort order)
      queryClient.setQueryData<Todo[]>(["todos"], (old) => [
        optimisticTodo,
        ...(old ?? []),
      ])

      // (e) Return rollback context
      return { previousTodos }
    },

    onError: (_err, _vars, context) => {
      // Only roll back if we have a valid snapshot; avoids clearing the cache
      // when onMutate threw before producing a snapshot
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos"], context.previousTodos)
      }
      toast.error("Failed to create todo. Please try again.", { duration: 4000 })
    },

    onSettled: () => {
      // Revalidate from server (replaces temp todo with real server response)
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}

/**
 * Deletes a todo via `DELETE /api/todos/{id}` with the mandatory three-step
 * optimistic update pattern: onMutate (snapshot + optimistic remove) →
 * onError (rollback) → onSettled (revalidate from server).
 *
 * The DELETE endpoint returns 204 No Content (no response body).
 */
export function useDeleteTodo() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => {
      // A4 (Epic 3 → 6 carried debt): optimistic todos use a negative
      // timestamp ID until the server responds with the real id. If the
      // user deletes the todo before the create round-trip resolves, do
      // NOT fire `DELETE /api/todos/-1713...` — the server has never
      // heard of it and would return 404. The optimistic cache removal
      // and the `onSettled` invalidate keep the UI consistent; the real
      // created todo (if it already landed) will still get cleaned up
      // by the next invalidation cycle.
      if (id < 0) {
        return Promise.resolve()
      }
      return apiFetch<void>(`/api/todos/${id}`, { method: "DELETE" })
    },

    onMutate: async (variables) => {
      // (a) Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ["todos"] })

      // (b) Snapshot current cache for rollback
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"])

      // (c) Optimistically remove the deleted todo from the cache
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        (old ?? []).filter((t) => t.id !== variables.id)
      )

      // (d) Return rollback context
      return { previousTodos }
    },

    onError: (_err, _vars, context) => {
      // Only roll back if we have a valid snapshot; avoids clearing the cache
      // when onMutate threw before producing a snapshot
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos"], context.previousTodos)
      }
      toast.error("Failed to delete todo. Please try again.", { duration: 4000 })
    },

    onSettled: () => {
      // Revalidate from server to ensure cache matches server state
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}

/**
 * Updates an existing todo via `PATCH /api/todos/{id}` with the mandatory
 * three-step optimistic update pattern: onMutate (snapshot + optimistic write)
 * → onError (rollback) → onSettled (revalidate from server).
 *
 * Used for toggling completion status (Stories 3.4) and potentially
 * description edits in the future. The `api.ts` utility automatically
 * transforms camelCase keys to snake_case for the request body.
 */
export function useUpdateTodo() {
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateTodoRequest) =>
      apiFetch<Todo>(`/api/todos/${id}`, { method: "PATCH", body: payload }),

    onMutate: async (variables) => {
      // (a) Cancel outgoing refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ["todos"] })

      // (b) Snapshot current cache for rollback
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"])

      // (c) Optimistically update the todo in the cache
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        (old ?? []).map((t) =>
          t.id === variables.id
            ? {
                ...t,
                ...(variables.isCompleted !== undefined && { isCompleted: variables.isCompleted }),
                ...(variables.description !== undefined && { description: variables.description }),
                ...(variables.categoryId !== undefined && { categoryId: variables.categoryId }),
                ...(variables.deadline !== undefined && { deadline: variables.deadline }),
                ...(variables.priority !== undefined && { priority: variables.priority }),
              }
            : t
        )
      )

      // (d) Return rollback context
      return { previousTodos }
    },

    onError: (_err, _vars, context) => {
      // Only roll back if we have a valid snapshot; avoids clearing the cache
      // when onMutate threw before producing a snapshot
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos"], context.previousTodos)
      }
      toast.error("Failed to update todo. Please try again.", { duration: 4000 })
    },

    onSettled: () => {
      // Revalidate from server to ensure cache matches server state
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}
