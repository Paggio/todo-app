import type * as React from "react"
import { Navigate, useLocation } from "react-router"

import { useAuth } from "@/hooks/use-auth"

/**
 * Route-level auth guard. Wraps protected route elements in `app.tsx`.
 *
 * - While the `/api/auth/me` hydration query is in flight → renders blank
 *   (prevents flash of protected content).
 * - If not authenticated → redirects to `/login`, passing the current
 *   location in `state.from` so `LoginPage` can redirect back after re-auth.
 * - Otherwise → renders children.
 *
 * This component does NOT fetch data or call mutations — its sole
 * responsibility is reading auth context and deciding render vs redirect.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default AuthGuard
