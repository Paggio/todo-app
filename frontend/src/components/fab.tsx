import { Plus, Send } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreateTodo } from "@/hooks/use-todos"
import { cn } from "@/lib/utils"

/**
 * Floating Action Button for todo creation.
 *
 * Idle state: circular FAB in bottom-right corner.
 * Expanded state: input panel for entering a todo description.
 * Supports keyboard interaction (Enter to submit, Escape to close)
 * and click-outside to dismiss.
 */
export function FAB() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [description, setDescription] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const fabButtonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const createTodo = useCreateTodo()

  const closeFab = useCallback(() => {
    setIsExpanded(false)
    setDescription("")
    setValidationError(null)
    // Defer focus until after re-render so the idle button is back in the DOM
    requestAnimationFrame(() => {
      fabButtonRef.current?.focus()
    })
  }, [])

  // Focus management: focus input when expanded
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus()
    }
  }, [isExpanded])

  // Click-outside handling
  useEffect(() => {
    if (!isExpanded) return

    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeFab()
      }
    }

    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [isExpanded, closeFab])

  function handleSubmit() {
    // Double-submit guard: prevent firing duplicate mutations while one is in-flight
    if (createTodo.isPending) return

    const trimmed = description.trim()
    if (!trimmed) {
      setValidationError("Description cannot be empty")
      return
    }
    createTodo.mutate({ description: trimmed })
    setDescription("")
    setValidationError(null)
    setIsExpanded(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSubmit()
    } else if (event.key === "Escape") {
      closeFab()
    }
  }

  // Expanded state: input panel
  if (isExpanded) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "fixed bottom-6 right-6 left-6",
          "sm:bottom-8 sm:left-auto sm:right-8 sm:w-[400px]",
          "rounded-lg border border-border bg-background p-3 shadow-lg"
        )}
      >
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setValidationError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            aria-label="Todo description"
            aria-invalid={validationError ? true : undefined}
            aria-describedby={validationError ? "fab-validation-error" : undefined}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            aria-label="Submit todo"
          >
            <Send className="size-4" />
          </Button>
        </div>
        {validationError && (
          <p id="fab-validation-error" className="mt-1 text-xs text-destructive">
            {validationError}
          </p>
        )}
      </div>
    )
  }

  // Idle state: circular FAB using shadcn Button (spec Task 2.3)
  return (
    <Button
      ref={fabButtonRef}
      size="icon"
      onClick={() => setIsExpanded(true)}
      className={cn(
        "fixed bottom-6 right-6 sm:bottom-8 sm:right-8",
        "h-14 w-14 rounded-full shadow-lg"
      )}
      aria-label="Add todo"
    >
      <Plus className="size-6" />
    </Button>
  )
}
