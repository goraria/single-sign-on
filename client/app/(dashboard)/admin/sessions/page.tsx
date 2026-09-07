import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { AdminSessions } from "@/features/admin/sessions"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = { title: "Sessions" }

export default async function AdminSessionsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  return <AdminSessions />
}
