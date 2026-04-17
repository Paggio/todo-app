import * as React from "react"

import { DeadlineGroupHeader } from "@/components/deadline-group-header"
import { EmptyState } from "@/components/empty-state"
import { TodoItem } from "@/components/todo-item"
import { useDeleteTodo, useUpdateTodo, type DeadlineGroup } from "@/hooks/use-todos"
import type { Category } from "@/types"

type ByDeadlineViewProps = {
  /**
   * Pre-grouped, pre-sorted deadline buckets. Callers are expected to apply
   * `selectByDeadline` from `use-todos.ts` before passing in. The view does
   * NOT re-group or re-sort — it is a pure presentation layer.
   */
  groups: DeadlineGroup[]
  /** All categories, used to look up chip labels by id. */
  categories: Category[]
  /** Optional screen reader announcer (same pattern as `TodoList`). */
  announce?: (message: string) => void
}

/**
 * "By Deadline" view — active todos grouped by temporal proximity (Story 7.2).
 *
 * Renders one `DeadlineGroupHeader` per non-empty group in the fixed order
 * delivered by `selectByDeadline`: Overdue → Today → Tomorrow → This Week →
 * Later → No Deadline. Empty groups are not rendered at all — the selector
 * drops them upstream.
 *
 * The `CompletedSection` is NOT mounted inside this view — `HomePage` mounts
 * it as a peer so "All" and "By Deadline" share it (preserving collapse
 * state across view switches).
 */
export function ByDeadlineView({
  groups,
  categories,
  announce,
}: ByDeadlineViewProps) {
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()

  // O(1) lookup from categoryId → categoryName for chip rendering on TodoItem.
  const categoryNameById = React.useMemo(() => {
    const map = new Map<number, string>()
    for (const c of categories) map.set(c.id, c.name)
    return map
  }, [categories])

  if (groups.length === 0) return <EmptyState />

  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <DeadlineGroupHeader
          key={g.bucket}
          bucket={g.bucket}
          label={g.label}
          todoCount={g.todos.length}
        >
          <div role="list">
            {g.todos.map((todo) => (
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
                  updateTodo.mutate({
                    id: todo.id,
                    isCompleted: !todo.isCompleted,
                  })
                }}
                onDelete={() => {
                  announce?.(`${todo.description} deleted`)
                  deleteTodo.mutate({ id: todo.id })
                }}
              />
            ))}
          </div>
        </DeadlineGroupHeader>
      ))}
    </div>
  )
}
