import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"

import { ViewSwitcher } from "./view-switcher"

// Helper that exposes the current URL (pathname + search) to the test so
// we can assert that clicking a tab writes the expected `?view=...`.
function LocationProbe() {
  const location = useLocation()
  return (
    <div data-testid="location-probe">
      {location.pathname}
      {location.search}
    </div>
  )
}

/** Mounts `<ViewSwitcher controlsId="region" />` inside a MemoryRouter at `initialUrl`. */
function renderAt(initialUrl: string) {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <ViewSwitcher controlsId="region" />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe("ViewSwitcher", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders three tabs with tablist role", () => {
    renderAt("/")
    const tablist = screen.getByRole("tablist", { name: "Switch view" })
    expect(tablist).toBeInTheDocument()
    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(3)
  })

  it("reflects ?view=week via aria-selected", () => {
    renderAt("/?view=week")
    const tabs = screen.getAllByRole("tab")
    const [allTab, weekTab, deadlineTab] = tabs
    expect(allTab).toHaveAttribute("aria-selected", "false")
    expect(weekTab).toHaveAttribute("aria-selected", "true")
    expect(deadlineTab).toHaveAttribute("aria-selected", "false")
  })

  it("reflects ?view=deadline via aria-selected", () => {
    renderAt("/?view=deadline")
    const tabs = screen.getAllByRole("tab")
    expect(tabs[0]).toHaveAttribute("aria-selected", "false")
    expect(tabs[1]).toHaveAttribute("aria-selected", "false")
    expect(tabs[2]).toHaveAttribute("aria-selected", "true")
  })

  it("falls back to the All tab for an unknown ?view value", () => {
    renderAt("/?view=bogus")
    const [allTab] = screen.getAllByRole("tab")
    expect(allTab).toHaveAttribute("aria-selected", "true")
    // The URL is NOT rewritten — it should stay as-is (no feedback loop).
    expect(screen.getByTestId("location-probe").textContent).toBe("/?view=bogus")
  })

  it("falls back to the All tab when ?view param is missing", () => {
    renderAt("/")
    const [allTab] = screen.getAllByRole("tab")
    expect(allTab).toHaveAttribute("aria-selected", "true")
  })

  it("updates the URL search param when a tab is clicked", () => {
    renderAt("/")
    const [, weekTab] = screen.getAllByRole("tab")
    fireEvent.click(weekTab)
    expect(screen.getByTestId("location-probe").textContent).toBe("/?view=week")
  })

  it("strips the view param when switching back to All", () => {
    renderAt("/?view=week")
    const [allTab] = screen.getAllByRole("tab")
    fireEvent.click(allTab)
    // The default view clears the query string for a canonical URL.
    expect(screen.getByTestId("location-probe").textContent).toBe("/")
  })

  it("sets aria-controls on every tab", () => {
    renderAt("/")
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveAttribute("aria-controls", "region")
    }
  })

  it("gives the active tab tabIndex 0 and inactive tabs tabIndex -1 (roving)", () => {
    renderAt("/?view=week")
    const [allTab, weekTab, deadlineTab] = screen.getAllByRole("tab")
    expect(weekTab).toHaveAttribute("tabindex", "0")
    expect(allTab).toHaveAttribute("tabindex", "-1")
    expect(deadlineTab).toHaveAttribute("tabindex", "-1")
  })

  it("ArrowRight moves focus to the next tab", () => {
    renderAt("/")
    const tabs = screen.getAllByRole("tab")
    tabs[0].focus()
    expect(document.activeElement).toBe(tabs[0])
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" })
    expect(document.activeElement).toBe(tabs[1])
  })

  it("ArrowLeft moves focus to the previous tab (with wrap)", () => {
    renderAt("/")
    const tabs = screen.getAllByRole("tab")
    tabs[0].focus()
    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" })
    // Wraps around to the last tab.
    expect(document.activeElement).toBe(tabs[2])
  })

  it("Home jumps focus to the first tab, End to the last", () => {
    renderAt("/")
    const tabs = screen.getAllByRole("tab")
    tabs[1].focus()
    fireEvent.keyDown(tabs[1], { key: "End" })
    expect(document.activeElement).toBe(tabs[2])
    fireEvent.keyDown(tabs[2], { key: "Home" })
    expect(document.activeElement).toBe(tabs[0])
  })
})
