import * as React from "react"
import { useSearchParams } from "react-router"

import type { ViewType } from "@/types"

/**
 * Hook that exposes the current {@link ViewType} derived from the URL
 * `view` search param, plus a setter that mutates the URL.
 *
 * Rules (Story 7.1):
 * - URL is the single source of truth; no mirroring to state or localStorage
 * - `view=all|week|deadline` → that view; anything else → "all" fallback
 * - `setView("all")` deletes the `view` param so the default URL stays clean
 *   (`/` rather than `/?view=all`) — canonical, shareable default
 * - `setView(next)` uses `replace: false` so browser back/forward traverses
 *   view history as the PRD requires
 * - Unrelated query params are preserved across `setView` calls
 * - Does NOT rewrite the URL on bogus values — that would loop the app
 */
export function useView(): {
  view: ViewType
  setView: (next: ViewType) => void
} {
  const [searchParams, setSearchParams] = useSearchParams()

  // The params object is a new reference on every render in react-router v7;
  // memoise the parsed view against the serialised search string so
  // downstream memos keyed on `view` stay stable when an unrelated param changes.
  const raw = searchParams.get("view")
  const view: ViewType = React.useMemo(() => {
    if (raw === "week" || raw === "deadline" || raw === "all") return raw
    return "all"
  }, [raw])

  const setView = React.useCallback(
    (next: ViewType) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next === "all") {
            // Strip the param so the default URL stays canonical.
            params.delete("view")
          } else {
            params.set("view", next)
          }
          return params
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  return { view, setView }
}
