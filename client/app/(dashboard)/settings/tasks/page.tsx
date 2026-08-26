import { redirect } from "next/navigation"
import { Tasks } from "@/components/preference/tasks"
import { getSession } from "@/services/auth"

export default async function TasksPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  return <Tasks />
}
