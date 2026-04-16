import { Plus, Send } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGetCategories } from "@/hooks/use-categories"
import { useCreateTodo } from "@/hooks/use-todos"
import { cn, PRIORITY_LEVELS } from "@/lib/utils"

/**
 * FAB visual state machine:
 * idle -> expanding -> expanded -> collapsing -> idle
 */
type FabState = "idle" | "expanding" | "expanded" | "collapsing"

type FABProps = {
  isEmpty?: boolean
}

/**
 * Floating Action Button for todo creation.
 *
 * Idle state: circular FAB in bottom-right corner.
 * Expanded state: input panel for entering a todo description.
 * Uses a state machine to orchestrate CSS entrance/exit animations.
 * Supports keyboard interaction (Enter to submit, Escape to close)
 * and click-outside to dismiss.
 */
export function FAB({ isEmpty = false }: FABProps) {
  const [fabState, setFabState] = useState<FabState>("idle")
  const [description, setDescription] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  // Session memory: last-used categoryId (React state, clears on page refresh per UX-DR29)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  // Session memory: last-used priority (React state, clears on page refresh per UX-DR29)
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const fabButtonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const createTodo = useCreateTodo()
  const { data: categories } = useGetCategories()

  // Guard: reset selectedCategoryId if the referenced category was deleted
  const validSelectedCategoryId =
    selectedCategoryId !== null &&
    categories?.some((c) => c.id === selectedCategoryId)
      ? selectedCategoryId
      : null

  // Track whether the FAB has been expanded at least once, so we don't
  // steal focus on initial mount when fabState starts as "idle".
  const hasExpandedRef = useRef(false)

  const isShowingPanel = fabState !== "idle"
  const isShowingButton = fabState === "idle" || fabState === "collapsing"

  const closeFab = useCallback(() => {
    if (fabState === "idle" || fabState === "collapsing") return
    setFabState("collapsing")
    setDescription("")
    setValidationError(null)
  }, [fabState])

  // Focus management: focus input when expansion animation completes
  useEffect(() => {
    if (fabState === "expanded") {
      inputRef.current?.focus()
    }
  }, [fabState])

  // Focus management: focus FAB button when collapse animation completes
  // (skip on initial mount when fabState starts as "idle")
  useEffect(() => {
    if (fabState === "idle" && hasExpandedRef.current) {
      // Use rAF to ensure the button is rendered before focusing
      requestAnimationFrame(() => {
        fabButtonRef.current?.focus()
      })
    }
  }, [fabState])

  // Click-outside handling
  useEffect(() => {
    if (!isShowingPanel) return

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
  }, [isShowingPanel, closeFab])

  function handleExpand() {
    hasExpandedRef.current = true
    setFabState("expanding")
  }

  function handleSubmit() {
    // Double-submit guard: prevent firing duplicate mutations while one is in-flight
    if (createTodo.isPending) return

    const trimmed = description.trim()
    if (!trimmed) {
      setValidationError("Description cannot be empty")
      return
    }
    createTodo.mutate({
      description: trimmed,
      ...(validSelectedCategoryId !== null && { categoryId: validSelectedCategoryId }),
      ...(selectedPriority !== null && { priority: selectedPriority }),
    })
    setDescription("")
    setValidationError(null)
    setFabState("collapsing")
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSubmit()
    } else if (event.key === "Escape") {
      closeFab()
    }
  }

  function handlePanelAnimationEnd() {
    if (fabState === "expanding") {
      setFabState("expanded")
    } else if (fabState === "collapsing") {
      setFabState("idle")
    }
  }

  return (
    <>
      {/* Idle state: circular FAB */}
      {isShowingButton && (
        <Button
          ref={fabButtonRef}
          size="icon"
          onClick={handleExpand}
          className={cn(
            "fixed bottom-4 right-4 sm:bottom-6 sm:right-6",
            "h-14 w-14 rounded-full shadow-elevated",
            isEmpty && fabState === "idle" && "animate-fab-pulse"
          )}
          aria-label="Add todo"
          title="Add todo"
        >
          <Plus className="size-6" />
        </Button>
      )}

      {/* Expanded state: input panel */}
      {isShowingPanel && (
        <div
          ref={containerRef}
          onAnimationEnd={handlePanelAnimationEnd}
          className={cn(
            "fixed bottom-4 right-4 left-4",
            "sm:bottom-6 sm:left-auto sm:right-6 sm:w-[400px]",
            "rounded-lg border border-border bg-background p-3 shadow-elevated",
            fabState === "expanding" && "animate-fab-expand",
            fabState === "collapsing" && "animate-fab-collapse"
          )}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fab-input" className="text-label text-muted-foreground">
              New todo
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="fab-input"
                ref={inputRef}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setValidationError(null)
                }}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!description.trim()) {
                    setValidationError("Description cannot be empty")
                  }
                }}
                placeholder="What needs to be done?"
                maxLength={500}
                aria-invalid={validationError ? true : undefined}
                aria-describedby={validationError ? "fab-validation-error" : undefined}
              />
              <Button
                size="icon"
                onClick={handleSubmit}
                aria-label="Submit todo"
                title="Submit todo"
                className="min-h-[44px] min-w-[44px]"
              >
                <Send className="size-4" />
              </Button>
            </div>
            {/* Optional selectors row: category & priority dropdowns */}
            <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
              {categories && categories.length > 0 && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:flex-1">
                  <label
                    htmlFor="fab-category-select"
                    className="text-caption text-muted-foreground shrink-0"
                  >
                    Category:
                  </label>
                  <select
                    id="fab-category-select"
                    value={validSelectedCategoryId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedCategoryId(val === "" ? null : Number(val))
                    }}
                    className={cn(
                      "h-8 w-full rounded-md border border-input bg-background px-2",
                      "text-caption text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:flex-1">
                <label
                  htmlFor="fab-priority-select"
                  className="text-caption text-muted-foreground shrink-0"
                >
                  Priority:
                </label>
                <div className="flex items-center gap-1.5 w-full">
                  {selectedPriority !== null && (
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(--color-priority-${selectedPriority})` }}
                      aria-hidden="true"
                    />
                  )}
                  <select
                    id="fab-priority-select"
                    value={selectedPriority ?? ""}
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedPriority(val === "" ? null : Number(val))
                    }}
                    className={cn(
                      "h-8 w-full rounded-md border border-input bg-background px-2",
                      "text-caption text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <option value="">None</option>
                    {PRIORITY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {validationError && (
              <p id="fab-validation-error" className="text-caption text-destructive">
                {validationError}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
