import * as React from "react"

import { TodoItem } from "@/components/todo-item"
import { useDeleteTodo, useUpdateTodo } from "@/hooks/use-todos"
import { cn } from "@/lib/utils"
import type { Todo } from "@/types"

const STORAGE_KEY = "completed-section-collapsed"

type CompletedSectionProps = {
  todos: Todo[]
  announce?: (message: string) => void
}

/**
 * Collapsible section that displays completed todos below a separator.
 *
 * - Hidden entirely when there are no completed todos.
 * - Persists collapsed/expanded preference to localStorage.
 */
export function CompletedSection({ todos, announce }: CompletedSectionProps) {
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true"
    } catch {
      return false
    }
  })

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // localStorage unavailable — fail silently
      }
      return next
    })
  }, [])

  if (todos.length === 0) {
    return null
  }

  return (
    <section>
      {/* Separator between active and completed sections — 32px gap per UX spec */}
      <div className="mt-8 border-t border-border" />

      {/* Section header — clickable to toggle collapse */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-2 py-3 text-label text-muted-foreground",
          "cursor-pointer select-none hover:text-foreground transition-colors"
        )}
        aria-expanded={!collapsed}
        aria-controls="completed-todos-list"
      >
        <span>Completed ({todos.length})</span>
        <svg
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            collapsed && "-rotate-90"
          )}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {/* Completed todo items — always rendered so aria-controls reference is valid */}
      <div
        id="completed-todos-list"
        role="list"
        hidden={collapsed}
      >
        {!collapsed &&
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
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
    </section>
  )
}
