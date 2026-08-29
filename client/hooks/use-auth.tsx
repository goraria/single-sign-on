"use client"

import { createContext, useContext } from "react"
import type { UserRole } from "@/lib/utils/formatter"

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
