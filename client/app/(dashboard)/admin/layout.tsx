"use client"

import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AppSidebar } from "@gorth/primitive/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider } from "@gorth/primitive/custom/sidebar"
import { Footer } from "@gorth/primitive/layouts/footer"
import { LoadingScreen } from "@/features/shared/loading"
import { Copyright } from "@/layouts/copyright"
import { Dashbar } from "@/layouts/dashbar"
import { adminSidebar, mainFooter } from "@/lib/utils/constant"
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
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar data={sidebar} auth={auth} />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        <Dashbar auth={auth} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto flex min-h-0 w-full flex-1 flex-col p-6">
            {children}
          </div>
        </main>
        <Footer
          mode="dashboard"
          nav={{ main: mainFooter.navDropdown, secondary: [] }}
          bottom={<Copyright />}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
