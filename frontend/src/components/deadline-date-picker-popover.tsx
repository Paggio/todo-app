import { useCallback, useEffect, useRef } from "react"

import { useUpdateTodo } from "@/hooks/use-todos"
import { cn, toISODate } from "@/lib/utils"

type DeadlineDatePickerPopoverProps = {
  /** The todo ID to update */
  todoId: number
  /** Current deadline of the todo (null = no deadline) */
  currentDeadline: string | null
  /** Called when the popover should close */
  onClose: () => void
}

/**
 * Compact inline date picker popover with quick-select options.
 *
 * Layout:
 *   [Today] [Tomorrow] [Next Week]
 *   [Clear]
 *   [ native date input ]
 *
 * Follows the same pattern as PriorityPickerPopover (Story 6.1):
 * - Click-outside dismissal via `document.addEventListener("mousedown")`
 * - Escape key handling
 * - `requestAnimationFrame` for deferred focus on mount
 * - `role="dialog"` for accessibility
 */
export function DeadlineDatePickerPopover({
  todoId,
  currentDeadline,
  onClose,
}: DeadlineDatePickerPopoverProps) {
  const updateTodo = useUpdateTodo()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSelect = useCallback(
    (deadline: string | null) => {
      if (deadline !== currentDeadline) {
        updateTodo.mutate({ id: todoId, deadline })
      }
      onClose()
    },
    [todoId, currentDeadline, updateTodo, onClose]
  )

  // Click-outside handling (mousedown pattern)
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [onClose])

  // Keyboard: Escape to dismiss
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        onClose()
      }
    },
    [onClose]
  )

  // Focus the container on mount for keyboard navigation
  useEffect(() => {
    requestAnimationFrame(() => {
      containerRef.current?.focus()
    })
  }, [])

  function quickSelect(offsetDays: number) {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    handleSelect(toISODate(d))
  }

  function handleDateInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    if (value) {
      handleSelect(value)
    }
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Select deadline"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute right-0 bottom-full z-50 mb-1 w-56 rounded-md border border-border",
        "bg-background shadow-elevated p-2",
        "focus-visible:outline-none animate-fade-in"
      )}
    >
      {/* Quick-select buttons */}
      <div className="flex flex-wrap gap-1 mb-2">
        <button
          type="button"
          onClick={() => quickSelect(0)}
          className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => quickSelect(1)}
          className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => quickSelect(7)}
          className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
        >
          Next Week
        </button>
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>

      {/* Native date input */}
      <input
        type="date"
        value={currentDeadline ?? ""}
        onChange={handleDateInputChange}
        className={cn(
          "h-8 w-full rounded-md border border-input bg-background px-2",
          "text-sm text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label="Pick a date"
      />
    </div>
  )
}
