import { redirect } from "next/navigation"
import { ApplicationForm } from "@/components/admin/application-form"
import { getSession } from "@/services/auth"

export default async function CreateApplicationPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (session.user.role !== "administrator") redirect("/settings")

  return <ApplicationForm />
}
