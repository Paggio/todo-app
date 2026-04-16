import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useUpdateTodo } from "@/hooks/use-todos"
import { cn, PRIORITY_LEVELS } from "@/lib/utils"

type PriorityPickerPopoverProps = {
  /** The todo ID to update */
  todoId: number
  /** Current priority of the todo (null = no priority) */
  currentPriority: number | null
  /** Called when the popover should close */
  onClose: () => void
}

/**
 * Reusable inline priority dropdown popover.
 *
 * Shows a dropdown with colored dots + labels for each priority level,
 * plus a "None" option. On selection, optimistically updates the todo's
 * priority via useUpdateTodo. Dismisses on Escape or click-outside
 * without change.
 *
 * Follows the exact same pattern as CategoryPickerPopover (Story 5.3):
 * - Click-outside dismissal via `document.addEventListener("mousedown")`
 * - Escape key handling
 * - Keyboard arrow navigation within dropdown
 * - `useMemo` for stable options list
 * - `role="listbox"` / `role="option"` accessibility
 */
export function PriorityPickerPopover({
  todoId,
  currentPriority,
  onClose,
}: PriorityPickerPopoverProps) {
  const updateTodo = useUpdateTodo()
  const containerRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  // Build the options list: all priority levels + "None"
  const options = useMemo<
    Array<{ value: number | null; label: string; cssVar: string | null }>
  >(
    () => [
      ...PRIORITY_LEVELS.map((l) => ({
        value: l.value,
        label: l.label,
        cssVar: l.cssVar,
      })),
      { value: null, label: "None", cssVar: null },
    ],
    []
  )

  const handleSelect = useCallback(
    (priority: number | null) => {
      if (priority !== currentPriority) {
        updateTodo.mutate({ id: todoId, priority })
      }
      onClose()
    },
    [todoId, currentPriority, updateTodo, onClose]
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

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        onClose()
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1))
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
      } else if (event.key === "Enter" && focusedIndex >= 0) {
        event.preventDefault()
        handleSelect(options[focusedIndex].value)
      }
    },
    [onClose, options, focusedIndex, handleSelect]
  )

  // Focus the container on mount for keyboard navigation
  useEffect(() => {
    requestAnimationFrame(() => {
      containerRef.current?.focus()
    })
  }, [])

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label="Select priority"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute z-50 mt-1 w-48 rounded-md border border-border",
        "bg-background shadow-elevated py-1",
        "focus-visible:outline-none animate-fade-in"
      )}
    >
      {options.map((option, index) => {
        const isSelected = option.value === currentPriority
        const isFocused = index === focusedIndex
        return (
          <button
            key={option.value ?? "none"}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => handleSelect(option.value)}
            onMouseEnter={() => setFocusedIndex(index)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left",
              "hover:bg-accent transition-colors cursor-pointer",
              isFocused && "bg-accent",
              isSelected && "font-medium text-primary"
            )}
          >
            {/* Colored dot indicator (8px circle) */}
            {option.cssVar ? (
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: option.cssVar }}
                aria-hidden="true"
              />
            ) : (
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full border border-muted-foreground/40"
                aria-hidden="true"
              />
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
