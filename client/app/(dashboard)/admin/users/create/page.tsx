import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { UserForm } from "@/components/admin/user-form"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = {
  title: "Create User",
}

export default async function CreateUserPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")

  return <UserForm />
}
