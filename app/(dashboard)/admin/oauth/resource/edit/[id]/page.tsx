import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { OAuthResourceEditor } from "@/components/auth/oauth"
import { getSession } from "@/services/client/auth"
import { isAdminRole } from "@/utils/client/formatter"

export const metadata: Metadata = { title: "Edit OAuth resource" }

export default async function EditOAuthResourcePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  const { id } = await params
  return <OAuthResourceEditor id={id} />
}
