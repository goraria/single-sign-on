import { redirect } from "next/navigation"
import { Apps } from "@/components/preference/apps"
import { getSession } from "@/services/auth"

export default async function AppsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")

  return <Apps />
}
