import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { Apps } from "@/features/settings/apps"
import { getSession } from "@/services/auth"

export const metadata: Metadata = {
  title: "Applications",
}

export default async function AppsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")

  return <Apps />
}
