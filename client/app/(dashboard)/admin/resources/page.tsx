import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { OAuthResources } from "@/features/admin/resources"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = { title: "OAuth resources" }

export default async function OAuthResourcesPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  return <OAuthResources />
}
