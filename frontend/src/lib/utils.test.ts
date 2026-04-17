import { describe, expect, it } from "vitest"

import {
  formatDeadline,
  getPriorityColor,
  getPriorityLabel,
  isOverdue,
  PRIORITY_LEVELS,
  toISODate,
} from "./utils"

// ---------------------------------------------------------------------------
// Priority helpers (Story 6.1 — tests added in 7.1 for retro action A2)
// ---------------------------------------------------------------------------

describe("getPriorityColor", () => {
  it("returns the matching CSS custom property for priorities 1..5", () => {
    for (let p = 1; p <= 5; p++) {
      expect(getPriorityColor(p)).toBe(`var(--color-priority-${p})`)
    }
  })

  it("returns undefined for null", () => {
    expect(getPriorityColor(null)).toBeUndefined()
  })

  it("returns undefined for out-of-range values (0, 6, -1)", () => {
    expect(getPriorityColor(0)).toBeUndefined()
    expect(getPriorityColor(6)).toBeUndefined()
    expect(getPriorityColor(-1)).toBeUndefined()
  })
})

describe("getPriorityLabel", () => {
  it("returns the label for priorities 1..5", () => {
    expect(getPriorityLabel(1)).toBe("P1 Urgent")
    expect(getPriorityLabel(5)).toBe("P5 Minimal")
  })

  it("returns undefined for null and out-of-range values", () => {
    expect(getPriorityLabel(null)).toBeUndefined()
    expect(getPriorityLabel(0)).toBeUndefined()
    expect(getPriorityLabel(6)).toBeUndefined()
  })
})

describe("PRIORITY_LEVELS", () => {
  it("has exactly five entries", () => {
    expect(PRIORITY_LEVELS).toHaveLength(5)
  })

  it("has values 1..5 in order with distinct non-empty labels", () => {
    const values = PRIORITY_LEVELS.map((l) => l.value)
    expect(values).toEqual([1, 2, 3, 4, 5])
    const labels = PRIORITY_LEVELS.map((l) => l.label)
    for (const label of labels) {
      expect(label).toMatch(/.+/)
    }
    expect(new Set(labels).size).toBe(labels.length)
  })

  it("references the correct CSS custom property on each entry", () => {
    for (const level of PRIORITY_LEVELS) {
      expect(level.cssVar).toBe(`var(--color-priority-${level.value})`)
    }
  })
})

// ---------------------------------------------------------------------------
// toISODate
// ---------------------------------------------------------------------------

describe("toISODate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(toISODate(new Date(2026, 3, 16))).toBe("2026-04-16")
  })

  it("zero-pads single-digit months and days", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05")
  })
})

// ---------------------------------------------------------------------------
// isOverdue
// ---------------------------------------------------------------------------

describe("isOverdue", () => {
  it("returns false for null deadline", () => {
    expect(isOverdue(null)).toBe(false)
  })

  it("returns true for a date in the past", () => {
    expect(isOverdue("2020-01-01")).toBe(true)
  })

  it("returns false for today", () => {
    const today = toISODate(new Date())
    expect(isOverdue(today)).toBe(false)
  })

  it("returns false for a future date", () => {
    expect(isOverdue("2099-12-31")).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// formatDeadline
// ---------------------------------------------------------------------------

describe("formatDeadline", () => {
  it("returns null for null deadline", () => {
    expect(formatDeadline(null)).toBeNull()
  })

  it('returns "Today" with isBold for today\'s date', () => {
    const today = toISODate(new Date())
    const result = formatDeadline(today)
    expect(result).toEqual({ text: "Today", isOverdue: false, isBold: true })
  })

  it('returns "Tomorrow" for tomorrow\'s date', () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const result = formatDeadline(toISODate(d))
    expect(result).toEqual({ text: "Tomorrow", isOverdue: false, isBold: false })
  })

  it("returns day name for dates 2-6 days in the future", () => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    const result = formatDeadline(toISODate(d))
    expect(result).not.toBeNull()
    expect(result!.isOverdue).toBe(false)
    expect(result!.isBold).toBe(false)
    // Should be a day name like "Monday", "Tuesday", etc.
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]
    expect(dayNames).toContain(result!.text)
  })

  it("returns short date for dates beyond 6 days", () => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    const result = formatDeadline(toISODate(d))
    expect(result).not.toBeNull()
    expect(result!.isOverdue).toBe(false)
    expect(result!.isBold).toBe(false)
    // Should match pattern like "Apr 23" or "May 16"
    expect(result!.text).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/)
  })

  it("returns overdue format for past dates", () => {
    const result = formatDeadline("2020-04-10")
    expect(result).not.toBeNull()
    expect(result!.isOverdue).toBe(true)
    expect(result!.isBold).toBe(false)
    expect(result!.text).toContain("Overdue")
    expect(result!.text).toContain("\u00B7") // middle dot
    expect(result!.text).toContain("Apr 10")
  })
})
