import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Priority helpers (Story 6.1)
// ---------------------------------------------------------------------------

export type PriorityLevel = {
  value: number
  label: string
  cssVar: string
}

/** The five priority levels with their labels and CSS custom property references. */
export const PRIORITY_LEVELS: PriorityLevel[] = [
  { value: 1, label: "P1 Urgent", cssVar: "var(--color-priority-1)" },
  { value: 2, label: "P2 High", cssVar: "var(--color-priority-2)" },
  { value: 3, label: "P3 Medium", cssVar: "var(--color-priority-3)" },
  { value: 4, label: "P4 Low", cssVar: "var(--color-priority-4)" },
  { value: 5, label: "P5 Minimal", cssVar: "var(--color-priority-5)" },
]

/**
 * Returns the CSS custom property value string for a given priority level,
 * or `undefined` when `priority` is null or out of range.
 */
export function getPriorityColor(priority: number | null): string | undefined {
  if (priority === null || priority < 1 || priority > 5) return undefined
  return `var(--color-priority-${priority})`
}

/**
 * Returns the human-readable label for a given priority level,
 * or `undefined` when `priority` is null or out of range.
 */
export function getPriorityLabel(priority: number | null): string | undefined {
  const level = PRIORITY_LEVELS.find((l) => l.value === priority)
  return level?.label
}
