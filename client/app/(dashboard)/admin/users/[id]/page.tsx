import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { UserDetails } from "@/features/admin/users/[id]"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = { title: "User details" }

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  const { id } = await params
  return <UserDetails id={id} />
}
