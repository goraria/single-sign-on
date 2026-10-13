"use client"

import { createContext, useContext } from "react"
import type { UserRole } from "@/utils/client/formatter"

export interface User {
  id: string
  name: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  email: string
  image?: string | null
  role: UserRole
  emailVerified?: boolean
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
}

export type AuthUser = User

export interface AuthContextProps {
  account: AuthUser | null
  sessionCreatedAt: Date | string | null
  loading: boolean
  error: Error | null
  authenticated: boolean
  refresh: () => Promise<void>
  login: (returnTo?: string) => void
  register: (returnTo?: string) => void
  logout: (returnTo?: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextProps>({
  account: null,
  sessionCreatedAt: null,
  loading: true,
  error: null,
  authenticated: false,
  refresh: async () => undefined,
  login: () => undefined,
  register: () => undefined,
  logout: async () => undefined,
})

export function useAuth() {
  return useContext(AuthContext)
}
