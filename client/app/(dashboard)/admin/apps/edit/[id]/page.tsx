import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { ApplicationEditor } from "@/components/admin/application-form"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = {
  title: "Edit Application",
}

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")

  const { id } = await params
  return <ApplicationEditor id={id} />
}
