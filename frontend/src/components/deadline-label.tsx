import { useCallback, useRef, useState } from "react"

import { DeadlineDatePickerPopover } from "@/components/deadline-date-picker-popover"
import { formatDeadline } from "@/lib/utils"
import type { Todo } from "@/types"

type DeadlineLabelProps = {
  todo: Todo
}

/**
 * Smart-formatted deadline display with click-to-edit inline editing.
 *
 * Shows deadline text at caption size (12px), right-aligned, using
 * `--color-text-muted` by default. Overdue deadlines use `--color-overdue-text`
 * (red). "Today" gets font-weight 500 for emphasis.
 *
 * Clicking the label opens a DeadlineDatePickerPopover for inline editing.
 *
 * Returns null when `todo.deadline` is null (no label rendered).
 *
 * Follows the PriorityIndicator pattern for click-to-edit with
 * `closedByMouseDownRef` guard to prevent click-outside race condition.
 */
export function DeadlineLabel({ todo }: DeadlineLabelProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Guard against click-outside race: mousedown closes the popover, then
  // onClick on the trigger would re-open it in the same event cycle.
  const closedByMouseDownRef = useRef(false)

  const handleClose = useCallback(() => {
    closedByMouseDownRef.current = true
    setIsOpen(false)
    // Reset the guard after the current event cycle
    requestAnimationFrame(() => {
      closedByMouseDownRef.current = false
    })
  }, [])

  const formatted = formatDeadline(todo.deadline)

  // AC #9: no deadline -> no label rendered
  if (!formatted) return null

  const ariaLabel = formatted.isOverdue
    ? `Deadline: Overdue, ${todo.deadline}`
    : `Deadline: ${formatted.text}`

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        onClick={() => {
          if (closedByMouseDownRef.current) return
          setIsOpen((prev) => !prev)
        }}
        className="cursor-pointer whitespace-nowrap rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          fontSize: "var(--text-caption)",
          lineHeight: "1.4",
          color: formatted.isOverdue
            ? "var(--color-overdue-text)"
            : formatted.isBold
              ? "var(--foreground)"
              : "var(--muted-foreground)",
          fontWeight: formatted.isBold ? 500 : 400,
        }}
      >
        {formatted.text}
      </button>

      {isOpen && (
        <DeadlineDatePickerPopover
          todoId={todo.id}
          currentDeadline={todo.deadline}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
