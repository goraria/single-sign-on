import Dashboard from "@/features/admin-dashboards/analytics"
import { isAdminRole } from "@/utils/client/formatter"
import { getSession } from "@/services/client/auth"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/dashboard")

  return <Dashboard />
}
