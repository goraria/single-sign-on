import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { Users } from "@/features/admin/users"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = {
  title: "Users",
}

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")

  return <Users />
}
