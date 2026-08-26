"use client"

import type { ReactNode } from "react"
import { AppSidebar } from "@gorth/primitive/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider } from "@gorth/primitive/custom/sidebar"
import { Dashbar } from "@/layouts/dashbar"
import { administratorSidebar } from "@/lib/utils/constant"
import { useAuth } from "@/hooks/use-auth"
import { toNavigationUser } from "@/lib/utils/formatter"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const user = auth.account ? toNavigationUser(auth.account) : null
  const sidebar = {
    ...administratorSidebar,
    user: user ?? administratorSidebar.user,
  }

  return (
    <SidebarProvider>
      <AppSidebar data={sidebar} auth={auth} />
      <SidebarInset>
        <Dashbar auth={auth} />
        <main className="flex flex-1 flex-col">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
