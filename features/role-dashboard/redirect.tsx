import { getSession } from "@/services/client/auth"
import { getDashboardPath } from "@/utils/dashboard"
import { DashboardNavigation } from "@/features/role-dashboard/navigation"

export async function DashboardRedirect() {
  const session = await getSession()
  const href = session?.user
    ? getDashboardPath(session.user.role)
    : "/auth/sign-in?redirect=%2Fdashboard"
  return <DashboardNavigation href={href} />
}
