import * as React from "react"

import { cn, type DeadlineBucket } from "@/lib/utils"

type DeadlineGroupHeaderProps = {
  /** Machine bucket key — drives localStorage key and the overdue tint. */
  bucket: DeadlineBucket
  /** Human-readable label rendered on the header button. */
  label: string
  /** Number of active todos inside this group (used for the count badge). */
  todoCount: number
  children: React.ReactNode
}

/**
 * Collapsible section divider for the "By Deadline" view (Story 7.2).
 *
 * Structural clone of `CategorySectionHeader` — deliberately NOT a shared
 * abstraction. Two concrete headers is fine; a third consumer can extract
 * the pattern in a later epic.
 *
 * Key behaviors:
 * - Collapse state persisted per bucket in localStorage under
 *   `deadline-group-collapsed-{bucket}` (distinct namespace from the
 *   category-collapsed keys added by Story 5.3).
 * - When `bucket === "overdue"`, the header button applies a subtle red
 *   background tint via `--color-overdue-bg` (Story 6.2 token) so overdue
 *   urgency is visible at a glance (UX-DR28). The label text stays
 *   foreground — `--color-overdue-text` is reserved for `DeadlineLabel`
 *   on individual items.
 * - Expanded-state body uses `overflow-visible` (Popover Overflow Pattern
 *   from architecture.md) so inline priority/deadline popovers opened on
 *   todos inside the group are NOT clipped by the collapse container.
 */
export function DeadlineGroupHeader({
  bucket,
  label,
  todoCount,
  children,
}: DeadlineGroupHeaderProps) {
  const storageKey = `deadline-group-collapsed-${bucket}`
  const sectionId = `deadline-section-${bucket}`
  const isOverdue = bucket === "overdue"

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

  // Defensive: the `selectByDeadline` selector already drops empty buckets,
  // so this branch is belt-and-braces for callers that bypass the selector.
  if (todoCount === 0) return null

  return (
    <section>
      {/* Header button -- clickable to toggle collapse */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-2 py-3 border-b border-border",
          "cursor-pointer select-none hover:bg-accent/30 transition-colors",
          "rounded-t-md px-2",
          isOverdue && "bg-[color:var(--color-overdue-bg)]"
        )}
        aria-expanded={!collapsed}
        aria-controls={sectionId}
      >
        {/* Group label (heading weight) */}
        <span className="text-label font-semibold text-foreground">
          {label}
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

      {/* Section content -- collapsible with smooth height animation.
          Popover Overflow Pattern: expanded state uses overflow-visible so
          inline priority/deadline popovers rendered inside the group are
          not clipped. Collapsed state keeps overflow-hidden to clip the
          shrinking contents during the height transition. */}
      <div
        id={sectionId}
        className={cn(
          "transition-[max-height,opacity]",
          collapsed
            ? "max-h-0 opacity-0 overflow-hidden"
            : "max-h-[9999px] opacity-100 overflow-visible"
        )}
        style={{ transitionDuration: "var(--duration-normal)" }}
        hidden={collapsed}
      >
        {!collapsed && children}
      </div>
    </section>
  )
}
