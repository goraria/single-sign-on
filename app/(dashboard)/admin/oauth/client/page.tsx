import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { Applications } from "@/features/admin/oauth/client"
import { isAdminRole } from "@/utils/client/formatter"
import { getSession } from "@/services/client/auth"

export const metadata: Metadata = {
  title: "OAuth client",
}

export default async function AdminAppsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")

  return <Applications />
}
