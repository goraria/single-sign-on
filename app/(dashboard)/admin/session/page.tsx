import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { AdminSessions } from "@/features/admin/session"
import { isAdminRole } from "@/utils/client/formatter"
import { getSession } from "@/services/client/auth"

export const metadata: Metadata = { title: "Session" }

export default async function AdminSessionsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  return <AdminSessions />
}
