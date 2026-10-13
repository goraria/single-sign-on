import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/services/client/auth"
import { DashboardShell } from "@/layouts/dashboard-shell"
import { SettingsContent } from "@/components/preference/settings-content"

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session?.user) redirect("/auth/sign-in?redirect=%2Fsettings")
  return (
    <DashboardShell section="settings">
      <SettingsContent>{children}</SettingsContent>
    </DashboardShell>
  )
}
