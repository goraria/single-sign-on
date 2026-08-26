"use client"

import { createContext, useContext } from "react"

export interface User {
  id: string
  name?: string
  email?: string
  image?: string | null
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

export interface AuthUser extends User {}

export interface AuthContextProps {
  account: AuthUser | null
  loading: boolean
  error: Error | null
  authenticated: boolean
  refresh: () => Promise<AuthUser | null>
  login: (returnTo?: string) => void
  register: (returnTo?: string) => void
  logout: (returnTo?: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextProps>({
  account: null,
  loading: true,
  error: null,
  authenticated: false,
  refresh: async () => null,
  login: () => undefined,
  register: () => undefined,
  logout: async () => undefined,
})

export function useAuth() {
  return useContext(AuthContext)
}
