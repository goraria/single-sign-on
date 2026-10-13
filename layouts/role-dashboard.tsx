import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/layouts/dashboard-shell"
import { getSession } from "@/services/client/auth"
import {
  canAccessDashboard,
  getDashboardPath,
  type DashboardRole,
} from "@/utils/dashboard"

export async function RoleDashboardLayout({
  children,
  role,
}: {
  children: ReactNode
  role: DashboardRole
}) {
  const session = await getSession()
  if (!session?.user) redirect(`/auth/sign-in?redirect=%2F${role}`)
  if (!canAccessDashboard(session.user.role, role))
    redirect(getDashboardPath(session.user.role))
  return <DashboardShell section={role}>{children}</DashboardShell>
}
