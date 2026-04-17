import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { DeadlineGroupHeader } from "./deadline-group-header"

describe("DeadlineGroupHeader", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it("renders the label, count, and children when expanded", () => {
    render(
      <DeadlineGroupHeader bucket="today" label="Today" todoCount={3}>
        <div data-testid="body">body content</div>
      </DeadlineGroupHeader>
    )
    expect(screen.getByText("Today")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByTestId("body")).toBeInTheDocument()
  })

  it("renders nothing when todoCount === 0 (defensive guard)", () => {
    const { container } = render(
      <DeadlineGroupHeader bucket="today" label="Today" todoCount={0}>
        <div>should not render</div>
      </DeadlineGroupHeader>
    )
    expect(container.firstChild).toBeNull()
  })

  it("toggles aria-expanded on click and writes to localStorage", () => {
    render(
      <DeadlineGroupHeader bucket="today" label="Today" todoCount={2}>
        <div>body</div>
      </DeadlineGroupHeader>
    )
    const button = screen.getByRole("button", { name: /today/i })
    expect(button).toHaveAttribute("aria-expanded", "true")

    fireEvent.click(button)
    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(localStorage.getItem("deadline-group-collapsed-today")).toBe("true")

    fireEvent.click(button)
    expect(button).toHaveAttribute("aria-expanded", "true")
    expect(localStorage.getItem("deadline-group-collapsed-today")).toBe("false")
  })

  it("hides the body when collapsed", () => {
    render(
      <DeadlineGroupHeader bucket="today" label="Today" todoCount={2}>
        <div data-testid="body">body</div>
      </DeadlineGroupHeader>
    )
    const button = screen.getByRole("button", { name: /today/i })
    const body = document.getElementById("deadline-section-today")
    expect(body).not.toBeNull()
    expect(body).not.toHaveAttribute("hidden")

    fireEvent.click(button)
    expect(body).toHaveAttribute("hidden")
    // Children are not rendered when collapsed so they can't trap focus.
    expect(screen.queryByTestId("body")).toBeNull()
  })

  it("restores collapsed state from localStorage on mount", () => {
    localStorage.setItem("deadline-group-collapsed-overdue", "true")
    render(
      <DeadlineGroupHeader bucket="overdue" label="Overdue" todoCount={1}>
        <div>body</div>
      </DeadlineGroupHeader>
    )
    const button = screen.getByRole("button", { name: /overdue/i })
    expect(button).toHaveAttribute("aria-expanded", "false")
  })

  it("applies the overdue tint class on the overdue bucket only", () => {
    const { unmount } = render(
      <DeadlineGroupHeader bucket="overdue" label="Overdue" todoCount={1}>
        <div>body</div>
      </DeadlineGroupHeader>
    )
    const overdueButton = screen.getByRole("button", { name: /overdue/i })
    expect(overdueButton.className).toContain(
      "bg-[color:var(--color-overdue-bg)]"
    )
    unmount()

    render(
      <DeadlineGroupHeader bucket="today" label="Today" todoCount={1}>
        <div>body</div>
      </DeadlineGroupHeader>
    )
    const todayButton = screen.getByRole("button", { name: /today/i })
    expect(todayButton.className).not.toContain(
      "bg-[color:var(--color-overdue-bg)]"
    )
  })

  it("sets overflow-visible on the expanded body (Popover Overflow Pattern)", () => {
    render(
      <DeadlineGroupHeader bucket="today" label="Today" todoCount={1}>
        <div>body</div>
      </DeadlineGroupHeader>
    )
    const body = document.getElementById("deadline-section-today")!
    expect(body.className).toContain("overflow-visible")
    // When collapsed, overflow switches to hidden so the height transition clips.
    fireEvent.click(screen.getByRole("button", { name: /today/i }))
    expect(body.className).toContain("overflow-hidden")
  })

  it("wires aria-controls to the body id", () => {
    render(
      <DeadlineGroupHeader bucket="later" label="Later" todoCount={1}>
        <div>body</div>
      </DeadlineGroupHeader>
    )
    const button = screen.getByRole("button", { name: /later/i })
    expect(button).toHaveAttribute("aria-controls", "deadline-section-later")
    expect(document.getElementById("deadline-section-later")).not.toBeNull()
  })
})
