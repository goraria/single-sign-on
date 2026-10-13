import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { Applications } from "@/features/admin/apps"
import { isAdminRole } from "@/utils/client/formatter"
import { getSession } from "@/services/client/auth"

export const metadata: Metadata = {
  title: "Applications",
}

export default async function AdminAppsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")

  return <Applications />
}
