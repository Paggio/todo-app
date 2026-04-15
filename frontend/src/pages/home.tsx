import { Button } from "@/components/ui/button"
import { CompletedSection } from "@/components/completed-section"
import { EmptyState } from "@/components/empty-state"
import { FAB } from "@/components/fab"
import { TodoList } from "@/components/todo-list"
import { useLogout } from "@/hooks/use-auth"
import { useGetTodos } from "@/hooks/use-todos"

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
  const logout = useLogout()
  const { data: todos, isLoading, isError, refetch } = useGetTodos()

  const activeTodos = todos?.filter((t) => !t.isCompleted) ?? []
  const completedTodos = todos?.filter((t) => t.isCompleted) ?? []

  return (
    <div className="min-h-svh">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Todos</h1>
          <Button
            variant="outline"
            size="sm"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Sign out
          </Button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-8" aria-busy={isLoading}>
          {isLoading ? (
            <TodoSkeleton />
          ) : isError ? (
            <div role="status" aria-live="polite" className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Something went wrong loading your todos.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-accent-foreground"
              >
                Try again
              </button>
            </div>
          ) : todos ? (
            <>
              {activeTodos.length > 0 ? (
                <TodoList todos={activeTodos} />
              ) : (
                <EmptyState />
              )}
              <CompletedSection todos={completedTodos} />
            </>
          ) : null}
        </div>
      </div>

      <FAB />
    </div>
  )
}

export default HomePage
