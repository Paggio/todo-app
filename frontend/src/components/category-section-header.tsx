import * as React from "react"

import { cn } from "@/lib/utils"

type CategorySectionHeaderProps = {
  /** Display name of the category (or "Uncategorized") */
  categoryName: string
  /** Unique identifier used for localStorage key; use "uncategorized" for the null-category group */
  categoryId: string
  /** Number of active (non-completed) todos in this category section */
  todoCount: number
  children: React.ReactNode
}

/**
 * Collapsible section divider for the All view.
 *
 * Each section header shows:
 * - Category name (heading weight, left)
 * - Todo count badge (right-aligned)
 * - Collapse chevron (far right)
 *
 * Collapse state is persisted per category ID in localStorage
 * using the key pattern `category-collapsed-{categoryId}`.
 *
 * Follows the same localStorage persistence pattern as CompletedSection.
 */
export function CategorySectionHeader({
  categoryName,
  categoryId,
  todoCount,
  children,
}: CategorySectionHeaderProps) {
  const storageKey = `category-collapsed-${categoryId}`
  const sectionId = `category-section-${categoryId}`

  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem(storageKey) === "true"
    } catch {
      return false
    }
  })

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(storageKey, String(next))
      } catch {
        // localStorage unavailable -- fail silently
      }
      return next
    })
  }, [storageKey])

  return (
    <section>
      {/* Section header -- clickable to toggle collapse */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-2 py-3 border-b border-border",
          "cursor-pointer select-none hover:bg-accent/30 transition-colors",
          "rounded-t-md px-2"
        )}
        aria-expanded={!collapsed}
        aria-controls={sectionId}
      >
        {/* Category name (heading weight) */}
        <span className="text-label font-semibold text-foreground">
          {categoryName}
        </span>

        {/* Spacer */}
        <span className="flex-1" />

        {/* Todo count badge */}
        <span className="text-caption text-muted-foreground tabular-nums">
          {todoCount}
        </span>

        {/* Collapse chevron */}
        <svg
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            collapsed && "-rotate-90"
          )}
          style={{ transitionDuration: "var(--duration-normal)" }}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {/* Section content -- collapsible with smooth height animation */}
      <div
        id={sectionId}
        className={cn(
          "transition-[max-height,opacity]",
          collapsed ? "max-h-0 opacity-0 overflow-hidden" : "max-h-[9999px] opacity-100 overflow-visible"
        )}
        style={{ transitionDuration: "var(--duration-normal)" }}
        hidden={collapsed}
      >
        {!collapsed && children}
      </div>
    </section>
  )
}
