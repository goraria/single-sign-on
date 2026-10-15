import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { AuditLogs } from "@/features/admin/audit-log"
import { isAdminRole } from "@/utils/client/formatter"
import { getSession } from "@/services/client/auth"

export const metadata: Metadata = { title: "Audit log" }

export default async function AuditLogsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  return <AuditLogs />
}
