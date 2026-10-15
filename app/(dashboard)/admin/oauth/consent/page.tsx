import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { OAuthConsents } from "@/features/admin/oauth/consent"
import { isAdminRole } from "@/utils/client/formatter"
import { getSession } from "@/services/client/auth"

export const metadata: Metadata = { title: "OAuth consent" }

export default async function OAuthConsentsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  return <OAuthConsents />
}
