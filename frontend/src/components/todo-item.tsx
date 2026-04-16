import * as React from "react"

import { DeadlineLabel } from "@/components/deadline-label"
import { PriorityIndicator } from "@/components/priority-indicator"
import { Button } from "@/components/ui/button"
import { motionDuration } from "@/lib/motion"
import { cn, getPriorityColor, isOverdue } from "@/lib/utils"
import type { Todo } from "@/types"

/**
 * Visual states for TodoItem animation choreography.
 * - active: unchecked, normal appearance
 * - completing: animation in progress (active -> completed)
 * - completed: resting completed state (dimmed, checked)
 * - deleting: collapse animation in progress before unmount
 */
type VisualState = "active" | "completing" | "completed" | "deleting"

/** Must match --duration-slow in index.css (used for entrance animation timeout) */
const DURATION_SLOW_MS = 300

/** Must match --duration-normal in index.css (used for deletion collapse timeout) */
const DURATION_NORMAL_MS = 200

type TodoItemProps = {
  todo: Todo
  onToggle?: () => void
  onDelete?: () => void
}

/**
 * Presentational component that renders a single todo item with
 * CSS-only animation choreography for completion toggling, creation
 * fade-in, and deletion with inline confirmation.
 *
 * Animation sequence on complete:
 *   1. Checkmark draws in via stroke-dashoffset transition (150ms)
 *   2. Text dims to 50% opacity + strikethrough animates in (150ms)
 *   3. Item appears in completed section with slide-down entrance (300ms spring)
 *
 * On undo (completed -> active):
 *   1. Checkmark un-draws, text restores full opacity (150ms)
 *   2. Item appears in active section with slide-up entrance (300ms spring)
 *
 * Creation animation:
 *   Newly created todos (negative optimistic ID) fade in over 200ms.
 *
 * Deletion flow:
 *   1. User clicks X -> inline confirmation expands below item
 *   2. User clicks "Confirm delete" -> collapse animation (200ms) -> onDelete fires
 *   3. Or user clicks "Cancel" / waits 5s -> confirmation auto-dismisses
 *
 * Uses data-state attribute for CSS targeting: active | completing | completed | deleting
 */
export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const prevCompletedRef = React.useRef(todo.isCompleted)
  const [entranceAnimation, setEntranceAnimation] = React.useState<
    "slide-down" | "slide-up" | "fade-in" | null
  >(null)

  // Deletion state
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false)
  const [isAnimatingDelete, setIsAnimatingDelete] = React.useState(false)
  const deleteTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const confirmButtonRef = React.useRef<HTMLButtonElement>(null)
  const deleteButtonRef = React.useRef<HTMLButtonElement>(null)
  const wasConfirmingRef = React.useRef(false)

  const priorityColor = getPriorityColor(todo.priority)
  // Overdue background only applies to active (non-completed) todos (AC #3, #5.5)
  const overdueActive = !todo.isCompleted && isOverdue(todo.deadline)

  // Derive visual state from todo.isCompleted and deletion state
  const visualState: VisualState = isAnimatingDelete
    ? "deleting"
    : todo.isCompleted
      ? "completed"
      : "active"

  // Creation fade-in: detect optimistic todos by negative ID
  React.useEffect(() => {
    if (todo.id < 0 && !todo.isCompleted) {
      setEntranceAnimation("fade-in")
      const timer = setTimeout(() => {
        setEntranceAnimation(null)
      }, motionDuration(DURATION_NORMAL_MS))
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- intentionally run only on mount

  // Detect when isCompleted changes between renders (item moved between lists)
  // and trigger the appropriate entrance animation
  React.useEffect(() => {
    const prev = prevCompletedRef.current
    if (prev !== todo.isCompleted) {
      // Item transitioned: apply entrance animation
      if (todo.isCompleted) {
        setEntranceAnimation("slide-down")
      } else {
        setEntranceAnimation("slide-up")
      }
      prevCompletedRef.current = todo.isCompleted

      // Remove animation class after one cycle to allow re-trigger
      const timer = setTimeout(() => {
        setEntranceAnimation(null)
      }, motionDuration(DURATION_SLOW_MS))
      return () => clearTimeout(timer)
    }
  }, [todo.isCompleted])

  // Auto-dismiss delete confirmation after 5 seconds
  React.useEffect(() => {
    if (!isConfirmingDelete) return
    const timer = setTimeout(() => {
      setIsConfirmingDelete(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [isConfirmingDelete])

  // Clean up the deletion animation timeout on unmount
  React.useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }
    }
  }, [])

  // Focus the "Confirm delete" button when confirmation row appears
  // (preserves keyboard flow when the delete X button is activated via keyboard)
  React.useEffect(() => {
    if (isConfirmingDelete) {
      requestAnimationFrame(() => {
        confirmButtonRef.current?.focus()
      })
    }
  }, [isConfirmingDelete])

  // Return focus to the delete button when confirmation is dismissed
  // (Escape or Cancel, but not when confirming a delete)
  React.useEffect(() => {
    if (wasConfirmingRef.current && !isConfirmingDelete && !isAnimatingDelete) {
      requestAnimationFrame(() => {
        deleteButtonRef.current?.focus()
      })
    }
    wasConfirmingRef.current = isConfirmingDelete
  }, [isConfirmingDelete, isAnimatingDelete])

  function handleDeleteClick() {
    setIsConfirmingDelete(true)
  }

  function handleConfirmDelete() {
    // Dismiss confirmation UI
    setIsConfirmingDelete(false)
    // Start collapse animation
    setIsAnimatingDelete(true)
    // After animation completes, fire the actual delete
    deleteTimerRef.current = setTimeout(() => {
      deleteTimerRef.current = null
      onDelete?.()
    }, motionDuration(DURATION_NORMAL_MS))
  }

  return (
    <div
      role="listitem"
      data-state={visualState}
      style={{
        borderLeft: `3px solid ${priorityColor ?? "transparent"}`,
        backgroundColor: overdueActive ? "var(--color-overdue-bg)" : undefined,
        transition: "border-color 150ms ease-out, background-color 150ms ease-out",
      }}
      className={cn(
        "group flex flex-col",
        isAnimatingDelete && "animate-collapse-out"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 min-h-[44px] px-2 py-2",
          todo.isCompleted && "text-muted-foreground",
          entranceAnimation === "slide-down" && "animate-slide-down-in",
          entranceAnimation === "slide-up" && "animate-slide-up-in",
          entranceAnimation === "fade-in" && "animate-fade-in"
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
            "group/checkbox flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center",
            "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border-2",
              "transition-[border-color,background-color,transform]",
              todo.isCompleted
                ? "border-muted-foreground bg-muted-foreground"
                : cn(
                    "border-foreground/30",
                    "group-hover/checkbox:border-primary/60 group-hover/checkbox:bg-primary/60",
                    "group-hover/checkbox:scale-105"
                  )
            )}
            style={{
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "ease-out",
            }}
            aria-hidden="true"
          >
            {/* SVG checkmark — always rendered, visibility controlled by stroke-dashoffset */}
            <svg
              className="h-3 w-3 text-background"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M2.5 6.5L5 9L9.5 3.5"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={todo.isCompleted ? 0 : 1}
                style={{
                  transition: `stroke-dashoffset var(--duration-fast) ease-out`,
                }}
              />
            </svg>
          </div>
        </button>

        {/* Priority indicator — clickable dot to open inline priority picker */}
        <PriorityIndicator
          todoId={todo.id}
          priority={todo.priority}
        />

        {/* Todo description — opacity and strikethrough animated via CSS transitions */}
        <span
          className={cn(
            "flex-1 min-w-0 text-sm leading-snug",
            todo.isCompleted && "text-muted-foreground"
          )}
          style={{
            opacity: todo.isCompleted ? 0.5 : 1,
            textDecorationColor: todo.isCompleted ? "currentColor" : "transparent",
            transition: [
              `opacity var(--duration-fast) ease-out`,
              `text-decoration-color var(--duration-fast) ease-out`,
            ].join(", "),
            textDecorationLine: "line-through",
            textDecorationStyle: "solid",
          }}
        >
          {todo.description}
        </span>

        {/* Deadline label — right-aligned, click-to-edit */}
        <DeadlineLabel todo={todo} />

        {/* Delete button — revealed on hover/focus */}
        {onDelete && !isConfirmingDelete && !isAnimatingDelete && (
          <button
            ref={deleteButtonRef}
            type="button"
            aria-label="Delete todo"
            title="Delete todo"
            onClick={handleDeleteClick}
            className={cn(
              "flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center",
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

      {/* Inline delete confirmation row (UX-DR12) */}
      {isConfirmingDelete && (
        <div
          className="animate-expand-in ml-[44px] flex items-center gap-2 pb-1"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsConfirmingDelete(false)
            }
          }}
        >
          <Button
            ref={confirmButtonRef}
            variant="ghost"
            size="sm"
            className="min-h-[44px] text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleConfirmDelete}
          >
            Confirm delete
          </Button>
          <button
            type="button"
            className="min-h-[44px] text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsConfirmingDelete(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
