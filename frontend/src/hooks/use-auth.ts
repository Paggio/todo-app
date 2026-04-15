import { useMutation } from "@tanstack/react-query"
import { useContext } from "react"

import { apiFetch } from "@/lib/api"
import { queryClient } from "@/lib/query-client"
import type { LoginRequest, RegisterRequest, User } from "@/types"

import { AuthContext, type AuthContextValue } from "./auth-context"

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider>")
  }
  return ctx
}

export function useRegister() {
  const { setUser } = useAuth()
  return useMutation({
    mutationFn: (payload: RegisterRequest) =>
      apiFetch<User>("/api/auth/register", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (user) => {
      setUser(user)
    },
  })
}

export function useLogin() {
  const { setUser } = useAuth()
  return useMutation({
    mutationFn: (payload: LoginRequest) =>
      apiFetch<User>("/api/auth/login", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (user) => {
      setUser(user)
    },
  })
}

export function useLogout() {
  const { setUser } = useAuth()
  return useMutation({
    mutationFn: () =>
      apiFetch<{ status: string }>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      setUser(null)
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      queryClient.removeQueries({ queryKey: ["todos"] })
    },
    onError: () => {
      // If logout fails (e.g., 401 because cookie is already invalid/expired),
      // the frontend should still reflect logged-out state.
      setUser(null)
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      queryClient.removeQueries({ queryKey: ["todos"] })
    },
  })
}
