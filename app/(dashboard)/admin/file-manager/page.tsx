import Dashboard from "@/features/admin-dashboards/file-manager"
import { isAdminRole } from "@/utils/client/formatter"
import { getSession } from "@/services/client/auth"
import { redirect } from "next/navigation"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/dashboard")
  return <Dashboard searchParams={searchParams} />
}
