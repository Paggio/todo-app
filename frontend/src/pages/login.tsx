import * as React from "react"
import { useLocation, useNavigate } from "react-router"

import { AuthScreen } from "@/components/auth-screen"
import { useAuth } from "@/hooks/use-auth"
import { motionDuration } from "@/lib/motion"

/** Matches --duration-slow CSS token (300ms). */
const DURATION_SLOW_MS = 300

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/"

  // Track whether the auth screen was shown (user was unauthenticated after
  // loading resolved). This distinguishes fresh logins from returning users
  // who manually navigated to /login with a valid session.
  const initialAuthResolved = React.useRef(false)
  const showedAuthScreen = React.useRef(false)
  const hasStartedExit = React.useRef(false)
  const exitTimerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const navigateRef = React.useRef(navigate)
  const fromRef = React.useRef(from)
  navigateRef.current = navigate
  fromRef.current = from

  React.useEffect(() => {
    if (!isLoading && !initialAuthResolved.current) {
      initialAuthResolved.current = true
      if (!isAuthenticated) {
        showedAuthScreen.current = true
      }
    }
  }, [isLoading, isAuthenticated])

  React.useEffect(() => {
    if (isAuthenticated && initialAuthResolved.current) {
      if (showedAuthScreen.current && !hasStartedExit.current) {
        // Fresh login — play exit animation then navigate
        hasStartedExit.current = true
        setIsTransitioning(true)
        exitTimerRef.current = setTimeout(() => {
          navigateRef.current(fromRef.current, { replace: true })
        }, motionDuration(DURATION_SLOW_MS))
      } else if (!showedAuthScreen.current) {
        // Returning user with valid session — navigate immediately
        navigateRef.current(fromRef.current, { replace: true })
      }
    }
    return () => {
      clearTimeout(exitTimerRef.current)
    }
  }, [isAuthenticated])

  if (isLoading) {
    return <div />
  }

  return <AuthScreen isExiting={isTransitioning} />
}

export default LoginPage
