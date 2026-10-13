import { redirect } from "next/navigation"
import { getSession } from "@/services/client/auth"
import { getDashboardPath } from "@/utils/dashboard"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) redirect("/auth/sign-in?redirect=%2Fdashboard")
  redirect(getDashboardPath(session.user.role))
}
