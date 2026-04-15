/**
 * Empty state displayed when the user has no active todos.
 *
 * Shows welcoming copy with a subtle arrow pointing toward the FAB
 * (bottom-right) to guide the user. Follows UX-DR7: "single line of
 * welcoming copy + subtle arrow pointing to FAB, no illustrations."
 */
export function EmptyState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-16"
    >
      <p className="text-xs text-muted-foreground">
        No todos yet &mdash; tap + to get started
      </p>

      {/* Subtle arrow pointing toward the FAB (bottom-right) */}
      <svg
        className="mt-3 h-5 w-5 text-muted-foreground/50"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 6L14 14M14 14V7M14 14H7" />
      </svg>
    </div>
  )
}
