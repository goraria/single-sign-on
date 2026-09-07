import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { AuditLogs } from "@/features/admin/audit-logs"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = { title: "Audit logs" }

export default async function AuditLogsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  return <AuditLogs />
}
