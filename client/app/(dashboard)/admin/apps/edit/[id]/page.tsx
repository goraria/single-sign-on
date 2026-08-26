import { redirect } from "next/navigation"
import { ApplicationEditor } from "@/components/admin/application-form"
import { getSession } from "@/services/auth"

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/")
  if (session.user.role !== "administrator") redirect("/settings")

  const { id } = await params
  return <ApplicationEditor id={id} />
}
