import * as React from "react"

import { ByDeadlineView } from "@/components/by-deadline-view"
import { CategoryManagementPanel } from "@/components/category-management-panel"
import { CategorySectionHeader } from "@/components/category-section-header"
import { Button } from "@/components/ui/button"
import { CompletedSection } from "@/components/completed-section"
import { DueThisWeekView } from "@/components/due-this-week-view"
import { EmptyState } from "@/components/empty-state"
import { FAB } from "@/components/fab"
import { ThemeToggle } from "@/components/theme-toggle"
import { TodoList } from "@/components/todo-list"
import { ViewSwitcher } from "@/components/view-switcher"
import { useLogout } from "@/hooks/use-auth"
import { useGetCategories } from "@/hooks/use-categories"
import {
  selectByDeadline,
  selectDueThisWeek,
  useGetTodos,
} from "@/hooks/use-todos"
import { useView } from "@/hooks/use-view"

/** DOM id shared between `ViewSwitcher` (`aria-controls`) and the content region. */
const VIEW_REGION_ID = "view-region"

/** Skeleton rows shown during the initial todo list fetch. */
function TodoSkeleton() {
  const widths = ["w-3/4", "w-1/2", "w-2/3"]
  return (
    <div role="status" aria-label="Loading todos">
      {widths.map((w, i) => (
        <div
          key={i}
          className="flex items-center gap-3 min-h-[44px] px-2 py-2"
        >
          <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className={`h-4 ${w} animate-pulse rounded bg-muted`} />
        </div>
      ))}
    </div>
  )
}

/**
 * Main authenticated view — displays the user's todos organized into
 * active and completed sections. Replaces the placeholder from Epic 2.
 */
export function HomePage() {
  const [categoryPanelOpen, setCategoryPanelOpen] = React.useState(false)
  const logout = useLogout()
  const { data: todos, isLoading, isError, isFetching, refetch } = useGetTodos()
  const { data: categories } = useGetCategories()
  const { view } = useView()

  const activeTodos = todos?.filter((t) => !t.isCompleted) ?? []
  const completedTodos = todos?.filter((t) => t.isCompleted) ?? []
  // "All view" emptiness — the FAB's empty-state hint is about the user
  // having no todos at all, NOT whether the currently-selected view is empty
  // (e.g. week view can be empty even when the user has plenty of future-dated
  // or completed todos). See Task 6.5.
  const isEmpty = !isLoading && !isError && activeTodos.length === 0

  // Group active todos by category for the "all" view.
  const uncategorizedTodos = activeTodos.filter((t) => t.categoryId === null)
  const categorizedGroups = (categories ?? [])
    .map((cat) => ({
      category: cat,
      todos: activeTodos.filter((t) => t.categoryId === cat.id),
    }))
    .filter((group) => group.todos.length > 0)

  // "This Week" view — client-side selector over the same ["todos"] cache.
  // Memoised on `todos` so sorting only re-runs when the cache changes.
  const weekTodos = React.useMemo(
    () => selectDueThisWeek(todos ?? []),
    [todos]
  )

  // "By Deadline" view — same cache, grouped by temporal bucket (Story 7.2).
  // Zero network; pure lens over ["todos"].
  const deadlineGroups = React.useMemo(
    () => selectByDeadline(todos ?? []),
    [todos]
  )

  // Accessibility: live region announcements for screen readers.
  const [announcement, setAnnouncement] = React.useState("")

  const announce = React.useCallback((message: string) => {
    setAnnouncement(message)
  }, [])

  // Clear announcement after ~3s to avoid stale content.
  React.useEffect(() => {
    if (!announcement) return
    const timer = setTimeout(() => {
      setAnnouncement("")
    }, 3000)
    return () => clearTimeout(timer)
  }, [announcement])

  return (
    <div className="min-h-svh animate-page-fade-in">
      <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-heading">Todos</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              Sign out
            </Button>
          </div>
        </div>

        {/* View switcher — below header, above the content region */}
        <ViewSwitcher controlsId={VIEW_REGION_ID} />

        {/* Screen reader live region for action announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>

        {/* Content region — keyed on `view` so switching remounts and replays
            the `animate-fade-in` keyframe (150ms, honours prefers-reduced-motion
            via the global media query in index.css). */}
        <div
          id={VIEW_REGION_ID}
          role="tabpanel"
          key={view}
          className="mt-6 space-y-8 animate-fade-in"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <TodoSkeleton />
          ) : isError ? (
            <div role="status" aria-live="polite" className="py-8 text-center">
              <p className="text-caption text-muted-foreground">
                Something went wrong loading your todos.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? "Retrying..." : "Try again"}
              </button>
            </div>
          ) : todos ? (
            view === "week" ? (
              <DueThisWeekView
                todos={weekTodos}
                categories={categories ?? []}
                announce={announce}
              />
            ) : view === "deadline" ? (
              /* "By Deadline" view — temporal group dividers with the
                 CompletedSection rendered as a peer so both "All" and
                 "By Deadline" share it (preserving collapse state). */
              <>
                <ByDeadlineView
                  groups={deadlineGroups}
                  categories={categories ?? []}
                  announce={announce}
                />
                <CompletedSection todos={completedTodos} announce={announce} />
              </>
            ) : (
              /* "all" view — byte-identical to Epic 5 / 7.1 behavior. */
              <>
                {activeTodos.length > 0 ? (
                  <div className="space-y-2">
                    {/* Uncategorized section (appears first when there are uncategorized todos) */}
                    {uncategorizedTodos.length > 0 && (
                      <CategorySectionHeader
                        categoryName="Uncategorized"
                        categoryId="uncategorized"
                        todoCount={uncategorizedTodos.length}
                      >
                        <TodoList todos={uncategorizedTodos} announce={announce} />
                      </CategorySectionHeader>
                    )}

                    {/* Category sections (alphabetically by category name) */}
                    {categorizedGroups.map((group) => (
                      <CategorySectionHeader
                        key={group.category.id}
                        categoryName={group.category.name}
                        categoryId={String(group.category.id)}
                        todoCount={group.todos.length}
                      >
                        <TodoList todos={group.todos} announce={announce} />
                      </CategorySectionHeader>
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}
                <CompletedSection todos={completedTodos} announce={announce} />
              </>
            )
          ) : null}
        </div>
      </div>

      <FAB isEmpty={isEmpty} onOpenCategories={() => setCategoryPanelOpen(true)} />

      <CategoryManagementPanel
        open={categoryPanelOpen}
        onClose={() => setCategoryPanelOpen(false)}
      />
    </div>
  )
}

export default HomePage
