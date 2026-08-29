import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { NotificationSettingsPage } from "@/features/settings/notification"
import { getSession } from "@/services/auth"

export const metadata: Metadata = {
  title: "Notifications",
}

export default async function NotificationPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")

  return <NotificationSettingsPage />
}
