import { Button } from "@/components/ui/button"
import { useLogout } from "@/hooks/use-auth"

/**
 * Placeholder home page. The real todo UI lands in Epic 3.
 * Kept deliberately minimal — the `AuthGuard` wrapper in `app.tsx`
 * ensures only authenticated users reach this page.
 */
export function HomePage() {
  const logout = useLogout()

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">You&apos;re signed in.</h1>
          <p>Todo UI lands in Epic 3.</p>
          <Button
            variant="outline"
            className="mt-2"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Sign out
          </Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}

export default HomePage
