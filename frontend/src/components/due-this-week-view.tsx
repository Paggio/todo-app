import * as React from "react"

import { TodoItem } from "@/components/todo-item"
import { useDeleteTodo, useUpdateTodo } from "@/hooks/use-todos"
import type { Category, Todo } from "@/types"

type DueThisWeekViewProps = {
  /**
   * The pre-filtered + pre-sorted list of todos due this week. Callers are
   * expected to apply `selectDueThisWeek` from `use-todos.ts` before passing
   * in. The view does NOT re-filter — it is a pure presentation layer.
   */
  todos: Todo[]
  /** All categories, used to look up chip labels by id. */
  categories: Category[]
  /** Optional screen reader announcer (same pattern as `TodoList`). */
  announce?: (message: string) => void
}

/**
 * "This Week" view — flat priority-sorted list of active todos due within
 * the next 7 days (Story 7.1, UX-DR32).
 *
 * Differences from the `TodoList` used by the "All" view:
 *   - No `CategorySectionHeader` — items are flat, sorted by priority then deadline
 *   - Each item renders its category as a small inline chip (when categorized)
 *   - Empty state shows "Nothing due this week" with a subtle checkmark
 */
export function DueThisWeekView({
  todos,
  categories,
  announce,
}: DueThisWeekViewProps) {
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()

  // O(1) lookup from categoryId → categoryName for chip rendering.
  const categoryNameById = React.useMemo(() => {
    const map = new Map<number, string>()
    for (const c of categories) map.set(c.id, c.name)
    return map
  }, [categories])

  if (todos.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center py-16 animate-fade-in"
      >
        <p className="text-caption text-muted-foreground">
          Nothing due this week
        </p>
        {/* Subtle checkmark icon — 20×20, muted stroke (UX-DR32). */}
        <svg
          className="mt-3 h-5 w-5 text-muted-foreground/50"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 10.5L8 14.5L16 6.5" />
        </svg>
      </div>
    )
  }

  return (
    <div role="list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          categoryName={
            todo.categoryId !== null
              ? (categoryNameById.get(todo.categoryId) ?? null)
              : null
          }
          onToggle={() => {
            announce?.(
              todo.isCompleted
                ? `${todo.description} marked as active`
                : `${todo.description} marked as complete`
            )
            updateTodo.mutate({ id: todo.id, isCompleted: !todo.isCompleted })
          }}
          onDelete={() => {
            announce?.(`${todo.description} deleted`)
            deleteTodo.mutate({ id: todo.id })
          }}
        />
      ))}
    </div>
  )
}
