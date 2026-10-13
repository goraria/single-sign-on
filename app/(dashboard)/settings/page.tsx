import { redirect } from "next/navigation"
import { getSession } from "@/services/client/auth"
import { ProfilePage } from "@/features/settings/profile-template"
import { profile as demoProfile } from "@/features/settings/profile-template/_components/profile-data"

export const metadata = { title: "Settings" }

export default async function Page() {
  const session = await getSession()
  if (!session?.user) redirect("/auth/sign-in?redirect=%2Fsettings")
  const user = session.user
  const profile = {
    ...demoProfile,
    name: user.name,
    emailVerified: user.emailVerified,
    legalName: user.name,
    preferredName: user.name,
    avatar: user.image ?? "",
    workEmail: user.email,
    personalEmail: user.email,
    jobTitle: user.role ?? "User",
    bio: "This profile uses your SSO identity. Employment, leave and document sections are template demo data.",
  }
  return <ProfilePage profile={profile} />
}
