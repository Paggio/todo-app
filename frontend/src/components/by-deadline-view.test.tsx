import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Motion helper reads window.matchMedia at module init; in jsdom that call
// throws. Stub to the "no reduced motion" branch (same pattern as
// `login.test.tsx`) — this is a module mock, not a jsdom polyfill.
vi.mock("@/lib/motion", () => ({
  prefersReducedMotion: false,
  motionDuration: (ms: number) => ms,
}))

// Mock the mutation hooks to avoid a live QueryClient and network calls.
// `TodoItem` renders real markup; only the hooks that mutate todos are stubbed.
vi.mock("@/hooks/use-todos", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/use-todos")>(
    "@/hooks/use-todos"
  )
  return {
    ...actual,
    useUpdateTodo: () => ({ mutate: vi.fn() }),
    useDeleteTodo: () => ({ mutate: vi.fn() }),
  }
})

import { ByDeadlineView } from "./by-deadline-view"
import type { DeadlineGroup } from "@/hooks/use-todos"
import type { Category, Todo } from "@/types"

function makeTodo(partial: Partial<Todo> & { id: number; description: string }): Todo {
  return {
    id: partial.id,
    userId: 1,
    description: partial.description,
    isCompleted: partial.isCompleted ?? false,
    categoryId: partial.categoryId ?? null,
    deadline: partial.deadline ?? null,
    priority: partial.priority ?? null,
    createdAt: partial.createdAt ?? "2026-04-17T10:00:00Z",
  }
}

const categories: Category[] = [
  { id: 1, userId: 1, name: "Work", createdAt: "2026-04-01T00:00:00Z" },
  { id: 2, userId: 1, name: "Personal", createdAt: "2026-04-01T00:00:00Z" },
]

describe("ByDeadlineView", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it("renders the global EmptyState when groups is empty", () => {
    render(<ByDeadlineView groups={[]} categories={categories} />)
    // EmptyState copy (see empty-state.tsx): "Nothing here yet — press + to get started"
    expect(
      screen.getByText(/nothing here yet/i)
    ).toBeInTheDocument()
  })

  it("renders groups in the fixed order delivered by the selector", () => {
    const groups: DeadlineGroup[] = [
      { bucket: "overdue", label: "Overdue", todos: [makeTodo({ id: 1, description: "A" })] },
      { bucket: "today", label: "Today", todos: [makeTodo({ id: 2, description: "B" })] },
      { bucket: "this-week", label: "This Week", todos: [makeTodo({ id: 3, description: "C" })] },
    ]

    render(<ByDeadlineView groups={groups} categories={categories} />)

    // Look up the group headers by aria-controls (unique to DeadlineGroupHeader);
    // TodoItem renders its own buttons which we don't want to match here.
    const headerButtons = Array.from(
      document.querySelectorAll(
        'button[aria-controls^="deadline-section-"]'
      )
    ) as HTMLButtonElement[]
    expect(headerButtons).toHaveLength(3)
    expect(headerButtons[0].textContent ?? "").toContain("Overdue")
    expect(headerButtons[1].textContent ?? "").toContain("Today")
    expect(headerButtons[2].textContent ?? "").toContain("This Week")
  })

  it("drops empty buckets (only non-empty groups render)", () => {
    // The selector upstream drops empty buckets; this view honors that by
    // simply mapping groups.length -> headers.length.
    const groups: DeadlineGroup[] = [
      { bucket: "today", label: "Today", todos: [makeTodo({ id: 1, description: "A" })] },
      { bucket: "later", label: "Later", todos: [makeTodo({ id: 2, description: "B" })] },
    ]

    render(<ByDeadlineView groups={groups} categories={categories} />)
    expect(screen.queryByText("Overdue")).toBeNull()
    expect(screen.queryByText("Tomorrow")).toBeNull()
    expect(screen.queryByText("No Deadline")).toBeNull()
    expect(screen.getByText("Today")).toBeInTheDocument()
    expect(screen.getByText("Later")).toBeInTheDocument()
  })

  it("renders each group body with role='list' and the todo descriptions", () => {
    const groups: DeadlineGroup[] = [
      {
        bucket: "today",
        label: "Today",
        todos: [
          makeTodo({ id: 1, description: "Finish spec" }),
          makeTodo({ id: 2, description: "Review PR" }),
        ],
      },
    ]

    render(<ByDeadlineView groups={groups} categories={categories} />)

    const todayBody = document.getElementById("deadline-section-today")!
    const lists = within(todayBody).getAllByRole("list")
    expect(lists).toHaveLength(1)
    expect(screen.getByText("Finish spec")).toBeInTheDocument()
    expect(screen.getByText("Review PR")).toBeInTheDocument()
  })

  it("passes the category chip label through to TodoItem for categorized todos", () => {
    const groups: DeadlineGroup[] = [
      {
        bucket: "today",
        label: "Today",
        todos: [
          makeTodo({ id: 1, description: "Task with category", categoryId: 1 }),
          makeTodo({ id: 2, description: "Task without category", categoryId: null }),
        ],
      },
    ]

    render(<ByDeadlineView groups={groups} categories={categories} />)

    // The Work chip renders for the categorized todo, absent for the
    // uncategorized one. `TodoItem` is the real component here.
    expect(screen.getByText("Work")).toBeInTheDocument()
    // "Personal" category exists but no todo references it → no chip rendered.
    expect(screen.queryByText("Personal")).toBeNull()
  })
})
