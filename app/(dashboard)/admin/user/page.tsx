import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { Users } from "@/features/admin/user"
import { isAdminRole } from "@/utils/client/formatter"
import { getSession } from "@/services/client/auth"

export const metadata: Metadata = {
  title: "User",
}

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")

  return <Users />
}
