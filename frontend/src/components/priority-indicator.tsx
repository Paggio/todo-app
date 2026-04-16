import { useCallback, useRef, useState } from "react"

import { PriorityPickerPopover } from "@/components/priority-picker-popover"
import { cn, getPriorityLabel } from "@/lib/utils"

type PriorityIndicatorProps = {
  /** The todo ID (for the update mutation) */
  todoId: number
  /** Current priority level (1-5, or null for no priority) */
  priority: number | null
}

/**
 * Clickable priority indicator that opens a PriorityPickerPopover.
 *
 * Renders as a small button positioned to the left of the todo content.
 * When the todo has a priority, it shows a colored dot matching the
 * priority level. When no priority is set, it shows an empty circle
 * that appears on hover.
 *
 * Clicking opens the PriorityPickerPopover for inline editing.
 */
export function PriorityIndicator({
  todoId,
  priority,
}: PriorityIndicatorProps) {
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

  const label = priority
    ? `Priority ${priority}, ${getPriorityLabel(priority) ?? "Unknown"}`
    : "Set priority"

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => {
          if (closedByMouseDownRef.current) return
          setIsOpen((prev) => !prev)
        }}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full",
          "cursor-pointer transition-opacity",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          priority
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-60 focus-visible:opacity-60"
        )}
      >
        {priority ? (
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: `var(--color-priority-${priority})` }}
            aria-hidden="true"
          />
        ) : (
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border border-muted-foreground/40"
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen && (
        <PriorityPickerPopover
          todoId={todoId}
          currentPriority={priority}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
