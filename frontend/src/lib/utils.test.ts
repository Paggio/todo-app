import { describe, expect, it } from "vitest"

import { formatDeadline, isOverdue, toISODate } from "./utils"

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
