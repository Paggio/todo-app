import { useQuery } from "@tanstack/react-query"
import * as React from "react"

import { apiFetch } from "@/lib/api"
import { queryClient } from "@/lib/query-client"
import type { User } from "@/types"

import { AuthContext, type AuthContextValue } from "./auth-context"

/**
 * Top-level auth state. Story 2.1 seeds `user` in-memory on successful
 * registration (via `useRegister().onSuccess`). Story 2.2 hydrates
 * from `GET /api/auth/me` on mount.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<User>("/api/auth/me"),
    retry: false,
    staleTime: Infinity,
  })

  // Sync query result into local state
  React.useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data)
    }
  }, [meQuery.data])

  // Listens for 401 responses from api.ts. On session expiry, clears auth
  // state so AuthGuard redirects to /login. Safe on initial mount —
  // setUser(null) is a no-op when user is already null, and the guard
  // `if (user !== null)` prevents action when we were never authenticated.
  React.useEffect(() => {
    const handleUnauthorized = () => {
      // Only react to 401s that happen AFTER we thought we were
      // authenticated. On initial mount `user` is null, so the hydration
      // /me 401 is a harmless no-op — no invalidation loop.
      setUser((current) => {
        if (current !== null) {
          queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
          queryClient.removeQueries({ queryKey: ["todos"] })
        }
        return null
      })
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized)
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized)
  }, [])

  const isLoading = meQuery.isLoading

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, setUser }),
    [user, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
