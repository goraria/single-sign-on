import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import {
  AccountSettings,
  AppearanceSettings,
  DisplaySettings,
  ProfileSettings,
} from "@/features/settings/[section]"
import { getSession } from "@/services/auth"

const sections = {
  profile: ProfileSettings,
  account: AccountSettings,
  appearance: AppearanceSettings,
  display: DisplaySettings,
}

const sectionTitles = {
  profile: "Profile",
  account: "Account",
  appearance: "Appearance",
  display: "Display",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>
}): Promise<Metadata> {
  const { section } = await params

  return {
    title: sectionTitles[section as keyof typeof sectionTitles] ?? "Settings",
  }
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
