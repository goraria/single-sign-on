import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { DashboardOverview } from "@/features/dashboard"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = {
  title: "Admin",
}

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")

  return <DashboardOverview />
}
