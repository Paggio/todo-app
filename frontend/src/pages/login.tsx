import { Navigate, useLocation } from "react-router"

import { AuthScreen } from "@/components/auth-screen"
import { useAuth } from "@/hooks/use-auth"

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/"

  if (isLoading) {
    return <div />
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return <AuthScreen />
}

export default LoginPage
