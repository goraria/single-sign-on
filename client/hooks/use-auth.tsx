// "use client";
import { createContext, useContext } from 'react';
// import { Session, User } from '@supabase/supabase-js'

export interface User {
  id: string
  email?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

export interface AuthUser extends User {}

export interface AuthContextProps {
  account: AuthUser | null
  loading: boolean
  authenticated: boolean
  refresh: () => Promise<AuthUser | null>
  login: (returnTo?: string) => void
  register: (returnTo?: string) => void
  logout: (returnTo?: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextProps>({
  account: null,
  loading: true,
  authenticated: false,
  refresh: async () => null,
  login: () => undefined,
  register: () => undefined,
  logout: async () => undefined,
})

export const useAuth = () => useContext(AuthContext)
