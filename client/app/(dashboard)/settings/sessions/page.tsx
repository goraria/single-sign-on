import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { AccountSessions } from "@/features/settings/sessions"
import { getSession } from "@/services/auth"

export const metadata: Metadata = { title: "Active sessions" }

export default async function AccountSessionsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  return <AccountSessions />
}
