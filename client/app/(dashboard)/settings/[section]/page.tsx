import { notFound, redirect } from "next/navigation"
import {
  AccountSettings,
  AppearanceSettings,
  DisplaySettings,
  NotificationSettings,
  ProfileSettings,
} from "@/components/preference/settings-pages"
import { getSession } from "@/services/auth"

const sections = {
  profile: ProfileSettings,
  account: AccountSettings,
  appearance: AppearanceSettings,
  notifications: NotificationSettings,
  display: DisplaySettings,
}

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/")

  const { section } = await params
  const Section = sections[section as keyof typeof sections]
  if (!Section) notFound()

  return <Section />
}
