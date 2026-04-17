import * as React from "react"

import { useView } from "@/hooks/use-view"
import { cn } from "@/lib/utils"
import type { ViewType } from "@/types"

/** Long + short labels for each tab. Short labels render at ≤ 400px. */
type TabDef = {
  value: ViewType
  longLabel: string
  shortLabel: string
}

const VIEWS: readonly TabDef[] = [
  { value: "all", longLabel: "All", shortLabel: "All" },
  { value: "week", longLabel: "This Week", shortLabel: "Week" },
  { value: "deadline", longLabel: "By Deadline", shortLabel: "Deadline" },
] as const

type ViewSwitcherProps = {
  /**
   * DOM id of the content region that the tablist controls. Used for
   * `aria-controls` so screen readers announce the relationship between
   * the tab and the content below it.
   */
  controlsId: string
}

/**
 * Segmented tab bar for switching between the three main views (Story 7.1).
 *
 * Visual spec (UX-DR21):
 * - Pill-shaped container (`rounded-full bg-muted p-1`) holding three segments
 * - Active segment: accent fill + contrast text (`bg-primary text-primary-foreground`)
 * - Inactive segment: ghost style (`text-muted-foreground hover:bg-accent/50`)
 * - Each segment is at least 44×44px (touch target), `flex-1` so all three share width evenly
 * - At viewport ≤ 400px the labels abbreviate to "All" / "Week" / "Deadline"
 *
 * Accessibility:
 * - `role="tablist"` + `role="tab"` + `aria-selected`
 * - Roving tabindex: active tab is `tabIndex={0}`; the other two are `-1`
 * - Arrow Left/Right moves focus between tabs; Home/End jump to first/last
 * - Enter/Space activates a focused tab (native button behaviour)
 *
 * URL-driven — reads and writes `?view=...` via {@link useView}. Does NOT
 * fire any network requests or navigate; switching views is purely a
 * client-side cache lens.
 */
export function ViewSwitcher({ controlsId }: ViewSwitcherProps) {
  const { view, setView } = useView()
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    const n = VIEWS.length
    if (e.key === "ArrowRight") {
      const next = (index + 1) % n
      tabRefs.current[next]?.focus()
      e.preventDefault()
    } else if (e.key === "ArrowLeft") {
      const prev = (index - 1 + n) % n
      tabRefs.current[prev]?.focus()
      e.preventDefault()
    } else if (e.key === "Home") {
      tabRefs.current[0]?.focus()
      e.preventDefault()
    } else if (e.key === "End") {
      tabRefs.current[n - 1]?.focus()
      e.preventDefault()
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Switch view"
      className="mt-4 flex w-full gap-1 rounded-full bg-muted p-1"
    >
      {VIEWS.map((tab, index) => {
        const isActive = tab.value === view
        return (
          <button
            key={tab.value}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={controlsId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => {
              // No-op when the clicked tab is already active — avoids
              // pushing a redundant entry onto the history stack (which
              // would make the browser back button land on the same view).
              if (tab.value === view) return
              setView(tab.value)
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "flex-1 rounded-full px-4 py-2 min-h-[44px]",
              "text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary text-primary-foreground shadow-subtle"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            {/* Both labels live in the DOM; the `.view-switcher-label-*`
                classes (defined in `index.css`) swap visibility at the
                400px breakpoint. See UX-DR21. */}
            <span className="view-switcher-label-short">{tab.shortLabel}</span>
            <span className="view-switcher-label-long">{tab.longLabel}</span>
          </button>
        )
      })}
    </div>
  )
}
