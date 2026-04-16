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

// ---------------------------------------------------------------------------
// Deadline helpers (Story 6.2)
// ---------------------------------------------------------------------------

export type DeadlineFormat = {
  text: string
  isOverdue: boolean
  isBold: boolean
}

/**
 * Safely parses an ISO date string "YYYY-MM-DD" into a Date at local midnight.
 * Avoids `new Date("YYYY-MM-DD")` which creates UTC midnight and can shift the
 * date back by one day depending on timezone.
 */
function parseDeadlineDate(deadline: string): Date {
  const [year, month, day] = deadline.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/** Returns today's date at local midnight for comparison. */
function getToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Computes the difference in calendar days between two local-midnight dates. */
function daysDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Formats a short date like "Apr 23" using the deadline date's month and day.
 */
function shortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * Returns smart-formatted deadline info, or `null` when deadline is null.
 *
 * | Deadline State          | text                   | isOverdue | isBold |
 * |-------------------------|------------------------|-----------|--------|
 * | Overdue (past)          | "Overdue \u00B7 Apr 10" | true      | false  |
 * | Today                   | "Today"                | false     | true   |
 * | Tomorrow                | "Tomorrow"             | false     | false  |
 * | This week (2-6 days)    | Day name (e.g. "Thu")  | false     | false  |
 * | Beyond                  | Short date "Apr 23"    | false     | false  |
 */
export function formatDeadline(deadline: string | null): DeadlineFormat | null {
  if (deadline === null) return null

  const deadlineDate = parseDeadlineDate(deadline)
  const today = getToday()
  const diff = daysDiff(deadlineDate, today)

  if (diff < 0) {
    return {
      text: `Overdue \u00B7 ${shortDate(deadlineDate)}`,
      isOverdue: true,
      isBold: false,
    }
  }
  if (diff === 0) {
    return { text: "Today", isOverdue: false, isBold: true }
  }
  if (diff === 1) {
    return { text: "Tomorrow", isOverdue: false, isBold: false }
  }
  if (diff <= 6) {
    const dayName = deadlineDate.toLocaleDateString("en-US", { weekday: "long" })
    return { text: dayName, isOverdue: false, isBold: false }
  }
  return { text: shortDate(deadlineDate), isOverdue: false, isBold: false }
}

/**
 * Convenience function: returns `true` when the deadline date is in the past.
 */
export function isOverdue(deadline: string | null): boolean {
  if (deadline === null) return false
  const deadlineDate = parseDeadlineDate(deadline)
  const today = getToday()
  return daysDiff(deadlineDate, today) < 0
}

/**
 * Converts a `Date` to an ISO date string "YYYY-MM-DD" for sending to the API.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
