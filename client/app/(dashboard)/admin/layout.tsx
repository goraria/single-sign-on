"use client"

import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AppSidebar } from "@gorth/primitive/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider } from "@gorth/primitive/custom/sidebar"
import { LoadingScreen } from "@/features/shared/loading"
import { Dashbar } from "@/layouts/dashbar"
import { adminSidebar } from "@/lib/utils/constant"
import { isAdminRole } from "@/lib/utils/formatter"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const user = useUser()

  if (auth.loading) return <LoadingScreen />
  if (!auth.account) redirect("/")
  if (!isAdminRole(user.role)) redirect("/settings")

  const sidebar = {
    ...adminSidebar,
    user,
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
