import { redirect } from "next/navigation"
import { Users } from "@/components/admin/users"
import { getSession } from "@/services/auth"

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (session.user.role !== "administrator") redirect("/settings")

  return <Users />
}
