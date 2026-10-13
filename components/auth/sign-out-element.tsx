"use client"

import { useSearchParams } from "next/navigation"
import { useProgress } from "@gorth/primitive/cores/progress/next"

import { logoutCurrentBrowserAccount } from "@/services/client/browser-account"
import { resolveInternalPath } from "@/utils/client/formatter"
import { Button } from "@gorth/primitive/custom/button"

export function LogoutButton() {
  const { start } = useProgress()

  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") as string

  const logout = async () => {
    start()
    await logoutCurrentBrowserAccount()
    window.location.replace(resolveInternalPath(redirect, "/"))
  }

  return <Button onClick={logout}>Logout</Button>
}
