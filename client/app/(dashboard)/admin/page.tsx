import { redirect } from "next/navigation"
import { DashboardOverview } from "@/components/dashboard-overview"
import { getSession } from "@/services/auth"

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (session.user.role !== "administrator") redirect("/settings")

  return <DashboardOverview />
}
