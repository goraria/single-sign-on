"use client"

import { type PropsWithChildren, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  AuthContext,
  type AuthContextProps,
  type AuthUser,
} from "@/hooks/use-auth"
import { auth } from "@/lib/auth"

function resolveInternalPath(value: unknown, fallback: string) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : fallback
}

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter()
  const session = auth.useSession()
  const account = (session.data?.user as AuthUser | undefined) ?? null

  const refresh = useCallback(async () => {
    const result = await auth.getSession()
    await session.refetch()
    return (result.data?.user as AuthUser | undefined) ?? null
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
      try {
        await auth.signOut()
      } catch (error: unknown) {
        throw new Error((error as string) || "Unable to sign out")
      } finally {
        await session.refetch()
        window.location.replace(resolveInternalPath(returnTo, "/"))
      }
    },
    [session]
  )

  const value = useMemo<AuthContextProps>(
    () => ({
      account,
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
      session.error,
      session.isPending,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function Auth({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>
}
