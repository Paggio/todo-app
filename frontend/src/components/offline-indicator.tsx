import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"

/**
 * Thin strip at the top of the viewport that appears when the browser
 * loses network connectivity. Uses `navigator.onLine` + online/offline
 * events for detection. Auto-hides on reconnect. Never blocks content
 * below (fixed overlay, not in document flow). UX-DR8.
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
    }
    function handleOffline() {
      setIsOffline(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-0 inset-x-0 z-50",
        "text-caption text-center py-1.5",
        "bg-[var(--color-warning)] text-white",
        "animate-slide-down-strip"
      )}
    >
      You are offline
    </div>
  )
}
