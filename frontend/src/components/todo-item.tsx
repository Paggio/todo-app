import { cn } from "@/lib/utils"
import type { Todo } from "@/types"

type TodoItemProps = {
  todo: Todo
  onToggle?: () => void
  onDelete?: () => void
}

/**
 * Presentational component that renders a single todo item.
 *
 * - Active: normal text, unchecked circle indicator.
 * - Completed: dimmed text with strikethrough, filled circle indicator.
 *
 * The `onToggle` callback is provided by the parent to handle completion
 * toggling via the `useUpdateTodo` mutation hook.
 */
export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div
      role="listitem"
      className={cn(
        "group flex items-center gap-3 min-h-[44px] px-2 py-2",
        todo.isCompleted && "text-muted-foreground"
      )}
    >
      {/* Interactive checkbox button */}
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.isCompleted}
        aria-label={
          todo.isCompleted ? "Mark as active" : "Mark as complete"
        }
        onClick={onToggle}
        className={cn(
          "group flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center",
          "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
            todo.isCompleted
              ? "border-muted-foreground bg-muted-foreground"
              : "border-foreground/30 group-hover:border-foreground/50"
          )}
          aria-hidden="true"
        >
          {todo.isCompleted && (
            <svg
              className="h-3 w-3 text-background"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 6.5L5 9L9.5 3.5" />
            </svg>
          )}
        </div>
      </button>

      {/* Todo description */}
      <span
        className={cn(
          "text-sm leading-snug",
          todo.isCompleted && "line-through"
        )}
      >
        {todo.description}
      </span>

      {/* Delete button — revealed on hover/focus */}
      {onDelete && (
        <button
          type="button"
          aria-label="Delete todo"
          onClick={onDelete}
          className={cn(
            "ml-auto flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center",
            "rounded-md text-muted-foreground hover:text-destructive transition-[opacity,color]",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" />
          </svg>
        </button>
      )}
    </div>
  )
}
