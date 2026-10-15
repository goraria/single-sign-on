import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { OAuthResourceForm } from "@/components/auth/oauth"
import { getSession } from "@/services/client/auth"
import { isAdminRole } from "@/utils/client/formatter"

export const metadata: Metadata = { title: "Create OAuth resource" }

export default async function CreateOAuthResourcePage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  return <OAuthResourceForm />
}
