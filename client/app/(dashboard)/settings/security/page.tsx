import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { SecuritySettingsPage } from "@/features/settings/security"
import { getSession } from "@/services/auth"

export const metadata: Metadata = {
  title: "Security",
}

export default async function SecurityPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")

  return <SecuritySettingsPage />
}
