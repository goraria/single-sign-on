import { redirect } from "next/navigation"
import { Applications } from "@/components/admin/applications"
import { getSession } from "@/services/auth"

export default async function AdminAppsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (session.user.role !== "administrator") redirect("/settings")

  return <Applications />
}
