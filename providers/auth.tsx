"use client"

import { type PropsWithChildren, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useProgress } from "@gorth/primitive/cores/progress/next"
import {
  AuthContext,
  type AuthContextProps,
  type AuthUser,
} from "@/hooks/use-auth"
import { auth } from "@/lib/auth/client"
import { logoutCurrentBrowserAccount } from "@/services/client/browser-account"
import { resolveInternalPath } from "@/utils/client/formatter"

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter()
  const { start } = useProgress()
  const session = auth.useSession()
  const account = (session.data?.user as AuthUser | undefined) ?? null
  const sessionCreatedAt = session.data?.session.createdAt ?? null

  const refresh = useCallback(async () => {
    await session.refetch()
  }, [session])

  const login = useCallback(
    (returnTo = "/settings") => {
      const target = resolveInternalPath(returnTo, "/settings")
      router.push(`/auth/sign-in?redirect=${encodeURIComponent(target)}`)
    },
    [router]
  )

  const register = useCallback(
    (returnTo = "/settings") => {
      const target = resolveInternalPath(returnTo, "/settings")
      router.push(`/auth/sign-up?redirect=${encodeURIComponent(target)}`)
    },
    [router]
  )

  const logout = useCallback(
    async (returnTo = "/") => {
      start()
      await logoutCurrentBrowserAccount()
      window.location.replace(resolveInternalPath(returnTo, "/"))
    },
    [start]
  )

  const value = useMemo<AuthContextProps>(
    () => ({
      account,
      sessionCreatedAt,
      loading: session.isPending,
      error: session.error ?? null,
      authenticated: Boolean(account),
      refresh,
      login,
      register,
      logout,
    }),
    [
      account,
      login,
      logout,
      refresh,
      register,
      sessionCreatedAt,
      session.error,
      session.isPending,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function Auth({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>
}
