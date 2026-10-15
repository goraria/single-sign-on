import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { OAuthResources } from "@/features/admin/oauth/resource"
import { isAdminRole } from "@/utils/client/formatter"
import { getSession } from "@/services/client/auth"

export const metadata: Metadata = { title: "OAuth resource" }

export default async function OAuthResourcesPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  return <OAuthResources />
}
