import { redirect } from "next/navigation"
import Dashboard from "@/features/admin-dashboards/default"
import { getSession } from "@/services/client/auth"
import { isAdminRole } from "@/utils/client/formatter"

export const metadata = { title: "Default" }

export default async function Page() {
  const session = await getSession()
  if (!session?.user) redirect("/auth/sign-in?redirect=%2Fadmin")
  if (!isAdminRole(session.user.role)) redirect("/dashboard")
  return <Dashboard />
}
