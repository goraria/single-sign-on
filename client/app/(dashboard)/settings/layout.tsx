"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@gorth/primitive/custom/sidebar"
import { AppSidebar } from "@gorth/primitive/dashboard/app-sidebar"
import { SettingsShell } from "@/components/preference/settings-shell"
import { Dashbar } from "@/layouts/dashbar"
import { settingSidebar } from "@/lib/utils/constant"
import { useAuth } from "@/hooks/use-auth"
import { toNavigationUser } from "@/lib/utils/formatter"

const preferencePaths = new Set([
  "/settings/profile",
  "/settings/account",
  "/settings/appearance",
  "/settings/notifications",
  "/settings/display",
])

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const auth = useAuth()
  const user = auth.account ? toNavigationUser(auth.account) : null
  const sidebar = {
    ...settingSidebar,
    user: user ?? settingSidebar.user,
  }

  return (
    <SidebarProvider>
      <AppSidebar data={sidebar} auth={auth} />
      <SidebarInset>
        <Dashbar auth={auth} />
        <main className="flex flex-1 flex-col">
          <div className="container mx-auto p-6">
            {preferencePaths.has(pathname) ? (
              <SettingsShell>{children}</SettingsShell>
            ) : (
              children
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
