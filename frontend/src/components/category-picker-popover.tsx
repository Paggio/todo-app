import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useGetCategories } from "@/hooks/use-categories"
import { useUpdateTodo } from "@/hooks/use-todos"
import { cn } from "@/lib/utils"

type CategoryPickerPopoverProps = {
  /** The todo ID to update */
  todoId: number
  /** Current category ID of the todo (null = uncategorized) */
  currentCategoryId: number | null
  /** Called when the popover should close */
  onClose: () => void
}

/**
 * Reusable inline category dropdown popover.
 *
 * Shows a dropdown with the full category list plus a "None" option.
 * On selection, optimistically updates the todo's category via useUpdateTodo.
 * Dismisses on Escape or click-outside without change.
 *
 * Follows the FAB click-outside pattern (mousedown event).
 */
export function CategoryPickerPopover({
  todoId,
  currentCategoryId,
  onClose,
}: CategoryPickerPopoverProps) {
  const { data: categories } = useGetCategories()
  const updateTodo = useUpdateTodo()
  const containerRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  // Build the options list: "None" + all categories
  const options = useMemo<Array<{ id: number | null; name: string }>>(
    () => [
      { id: null, name: "None" },
      ...(categories ?? []).map((c) => ({ id: c.id, name: c.name })),
    ],
    [categories]
  )

  const handleSelect = useCallback(
    (categoryId: number | null) => {
      if (categoryId !== currentCategoryId) {
        updateTodo.mutate({ id: todoId, categoryId })
      }
      onClose()
    },
    [todoId, currentCategoryId, updateTodo, onClose]
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
        handleSelect(options[focusedIndex].id)
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
      aria-label="Select category"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute z-50 mt-1 w-48 rounded-md border border-border",
        "bg-background shadow-elevated py-1",
        "focus-visible:outline-none animate-fade-in"
      )}
    >
      {options.map((option, index) => {
        const isSelected = option.id === currentCategoryId
        const isFocused = index === focusedIndex
        return (
          <button
            key={option.id ?? "none"}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => handleSelect(option.id)}
            onMouseEnter={() => setFocusedIndex(index)}
            className={cn(
              "flex w-full items-center px-3 py-1.5 text-sm text-left",
              "hover:bg-accent transition-colors cursor-pointer",
              isFocused && "bg-accent",
              isSelected && "font-medium text-primary"
            )}
          >
            {option.name}
          </button>
        )
      })}
    </div>
  )
}
