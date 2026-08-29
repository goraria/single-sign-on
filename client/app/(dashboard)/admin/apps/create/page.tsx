import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { ApplicationForm } from "@/components/admin/application-form"
import { isAdminRole } from "@/lib/utils/formatter"
import { getSession } from "@/services/auth"

export const metadata: Metadata = {
  title: "Create Application",
}

export default async function CreateApplicationPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (!isAdminRole(session.user.role)) redirect("/settings")

  return <ApplicationForm />
}
