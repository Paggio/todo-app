import { createContext } from "react"

import type { User } from "@/types"

export type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
