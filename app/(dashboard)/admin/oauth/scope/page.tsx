import { redirect } from "next/navigation"
import { getSession } from "@/services/client/auth"
import { isAdminRole } from "@/utils/client/formatter"
import { OAuthScopes } from "@/features/admin/oauth/scope"

export default async function OAuthScopePage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")
  return <OAuthScopes canPublish={session.user.role === "master"} />
}
