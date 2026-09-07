import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { OAuthConsents } from "@/features/admin/consents"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = { title: "OAuth consents" }

export default async function OAuthConsentsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  return <OAuthConsents />
}
