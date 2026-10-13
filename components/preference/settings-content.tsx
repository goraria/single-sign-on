"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { SettingsShell } from "@/components/preference/settings-shell"

const preferencePaths = new Set([
  "/settings/profile",
  "/settings/account",
  "/settings/appearance",
  "/settings/display",
])

export function SettingsContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return preferencePaths.has(pathname) ? (
    <SettingsShell>{children}</SettingsShell>
  ) : (
    children
  )
}
