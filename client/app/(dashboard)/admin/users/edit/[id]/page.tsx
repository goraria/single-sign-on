import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { UserEditor } from "@/components/admin/user-form"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = {
  title: "Edit User",
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")

  const { id } = await params
  return <UserEditor id={id} />
}
