import { Trash2, X } from "lucide-react"
import { forwardRef, useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useCreateCategory,
  useDeleteCategory,
  useGetCategories,
  useRenameCategory,
} from "@/hooks/use-categories"
import { useGetTodos } from "@/hooks/use-todos"
import { cn } from "@/lib/utils"
import type { Category } from "@/types"

/**
 * Panel visual state machine (mirrors FAB pattern):
 * closed -> opening -> open -> closing -> closed
 */
type PanelState = "closed" | "opening" | "open" | "closing"

type CategoryManagementPanelProps = {
  open: boolean
  onClose: () => void
}

/**
 * Derive the next panel state from the current state and the open prop.
 * This avoids calling setState inside useEffect (lint: set-state-in-effect).
 */
function deriveNextPanelState(
  currentState: PanelState,
  open: boolean
): PanelState | null {
  if (open && (currentState === "closed" || currentState === "closing")) {
    return "opening"
  }
  if (!open && (currentState === "open" || currentState === "opening")) {
    return "closing"
  }
  return null
}

/**
 * Slide-in panel for managing categories: create, rename, delete.
 *
 * Uses a state machine to orchestrate CSS entrance/exit animations.
 * Supports keyboard interaction (Escape to close) and click-outside
 * to dismiss. Follows the same animation pattern as the FAB component.
 */
export function CategoryManagementPanel({
  open,
  onClose,
}: CategoryManagementPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>("closed")

  // Derive state transitions during render (no useEffect needed).
  // React batches state updates, so this is safe and avoids the
  // "setState in effect" lint warning.
  const nextState = deriveNextPanelState(panelState, open)
  if (nextState !== null) {
    setPanelState(nextState)
  }

  const handleAnimationEnd = useCallback(() => {
    if (panelState === "opening") {
      setPanelState("open")
    } else if (panelState === "closing") {
      setPanelState("closed")
    }
  }, [panelState])

  const handleClose = useCallback(() => {
    if (panelState === "closed" || panelState === "closing") return
    onClose()
  }, [panelState, onClose])

  // Don't render anything when fully closed
  if (panelState === "closed" && !open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop (frosted glass) */}
      <div
        className={cn(
          "absolute inset-0 bg-black/30 backdrop-blur-sm",
          panelState === "opening" && "animate-backdrop-fade-in",
          panelState === "closing" && "animate-backdrop-fade-out"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-full sm:w-[320px]",
          "bg-background border-l border-border shadow-elevated",
          "flex flex-col",
          panelState === "opening" && "animate-slide-in-right",
          panelState === "closing" && "animate-slide-out-right"
        )}
        onAnimationEnd={handleAnimationEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Category management"
      >
        <PanelContent onClose={handleClose} panelState={panelState} />
      </div>
    </div>
  )
}

/**
 * Inner content of the panel, extracted to keep the animation wrapper clean.
 */
function PanelContent({
  onClose,
  panelState,
}: {
  onClose: () => void
  panelState: PanelState
}) {
  const { data: categories } = useGetCategories()
  const { data: todos } = useGetTodos()

  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  // Focus management: focus the add input when panel opens
  useEffect(() => {
    if (panelState === "open") {
      addInputRef.current?.focus()
    }
  }, [panelState])

  // Escape key closes the panel
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-heading">Categories</h2>
        <Button
          ref={closeButtonRef}
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close category management"
          className="min-h-[44px] min-w-[44px]"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Add category input */}
      <AddCategoryInput ref={addInputRef} />

      {/* Category list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {categories && categories.length > 0 ? (
          <ul className="space-y-1">
            {categories.map((category) => (
              <CategoryListItem
                key={category.id}
                category={category}
                todoCount={
                  todos?.filter((t) => t.categoryId === category.id).length ?? 0
                }
              />
            ))}
          </ul>
        ) : (
          <p className="text-caption text-muted-foreground py-4 text-center">
            No categories yet. Add one above.
          </p>
        )}
      </div>
    </>
  )
}

/**
 * Input for creating a new category.
 */
const AddCategoryInput = forwardRef<HTMLInputElement>(function AddCategoryInput(
  _props,
  ref
) {
  const [name, setName] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const createCategory = useCreateCategory()

  function handleSubmit() {
    if (createCategory.isPending) return

    const trimmed = name.trim()
    if (!trimmed) {
      setValidationError("Category name cannot be empty")
      return
    }

    createCategory.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setName("")
          setValidationError(null)
        },
      }
    )
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="px-4 pb-3">
      <label htmlFor="add-category-input" className="text-label text-muted-foreground">
        Add category
      </label>
      <Input
        id="add-category-input"
        ref={ref}
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setValidationError(null)
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (name.trim() === "" && name.length > 0) {
            setValidationError("Category name cannot be empty")
          }
        }}
        placeholder="New category name"
        maxLength={100}
        aria-invalid={validationError ? true : undefined}
        aria-describedby={validationError ? "add-category-error" : undefined}
        className="mt-1"
      />
      {validationError && (
        <p id="add-category-error" className="text-caption text-destructive mt-1">
          {validationError}
        </p>
      )}
    </div>
  )
})

/**
 * A single category in the list, with inline rename and delete functionality.
 */
function CategoryListItem({
  category,
  todoCount,
}: {
  category: Category
  todoCount: number
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const [editError, setEditError] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const editInputRef = useRef<HTMLInputElement>(null)
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const renameCategory = useRenameCategory()
  const deleteCategory = useDeleteCategory()
  const { data: categories } = useGetCategories()

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [isEditing])

  // Auto-dismiss delete confirmation after 5s (UX-DR12)
  useEffect(() => {
    if (isConfirmingDelete) {
      confirmTimerRef.current = setTimeout(() => {
        setIsConfirmingDelete(false)
      }, 5000)
      return () => {
        if (confirmTimerRef.current) {
          clearTimeout(confirmTimerRef.current)
        }
      }
    }
  }, [isConfirmingDelete])

  function startEditing() {
    setEditName(category.name)
    setEditError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setEditName(category.name)
    setEditError(null)
    setIsEditing(false)
  }

  function saveRename() {
    const trimmed = editName.trim()

    if (!trimmed) {
      setEditError("Name cannot be empty")
      return
    }

    // Check for duplicate names (case-insensitive, excluding current category)
    const isDuplicate = categories?.some(
      (c) => c.id !== category.id && c.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (isDuplicate) {
      setEditError("A category with this name already exists")
      return
    }

    // No change -- just close edit mode
    if (trimmed === category.name) {
      setIsEditing(false)
      return
    }

    renameCategory.mutate({ id: category.id, name: trimmed })
    setIsEditing(false)
    setEditError(null)
  }

  // Guard: prevents onBlur from triggering a duplicate save after Enter
  const isSavingRef = useRef(false)

  function handleEditKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      isSavingRef.current = true
      saveRename()
    } else if (event.key === "Escape") {
      event.stopPropagation() // prevent document-level Escape from closing the panel
      isSavingRef.current = true
      cancelEditing()
    }
  }

  function handleEditBlur() {
    // Skip if Enter/Escape already handled this edit cycle
    if (isSavingRef.current) {
      isSavingRef.current = false
      return
    }
    saveRename()
  }

  function handleDelete() {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current)
    }
    setIsConfirmingDelete(false)
    deleteCategory.mutate({ id: category.id })
  }

  return (
    <li className="group">
      {/* Main row */}
      <div className="flex items-center gap-2 min-h-[44px] rounded-md px-2 hover:bg-accent/50">
        {isEditing ? (
          <div className="flex-1">
            <Input
              ref={editInputRef}
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value)
                setEditError(null)
              }}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditBlur}
              maxLength={100}
              aria-label="Rename category"
              aria-invalid={editError ? true : undefined}
              aria-describedby={editError ? `edit-error-${category.id}` : undefined}
              className="h-8"
            />
            {editError && (
              <p
                id={`edit-error-${category.id}`}
                className="text-caption text-destructive mt-0.5"
              >
                {editError}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="flex-1 text-left text-body cursor-pointer truncate py-1"
            onClick={startEditing}
            title={`Rename "${category.name}"`}
          >
            {category.name}
          </button>
        )}

        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsConfirmingDelete(true)}
            aria-label={`Delete category ${category.name}`}
            className="min-h-[36px] min-w-[36px] text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {/* Delete confirmation row */}
      {isConfirmingDelete && (
        <div className="flex items-center gap-2 px-2 py-2 bg-accent/30 rounded-md mt-1 animate-fade-in">
          <p className="text-caption text-muted-foreground flex-1">
            This will uncategorize {todoCount} todo{todoCount !== 1 ? "s" : ""}. Remove?
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfirmingDelete(false)}
            className="h-7 text-caption"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="h-7 text-caption"
          >
            Remove
          </Button>
        </div>
      )}
    </li>
  )
}
