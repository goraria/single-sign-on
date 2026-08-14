import { getSession } from "@/services/auth"
import { redirect } from "next/navigation"
import { AdministratorApplications } from "./index"

export default async function SettingPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/")
  }

  if (session.user.role !== "administrator") {
    return <div>Access Denied</div>
  }

  return (
    <AdministratorApplications />
  )
}
