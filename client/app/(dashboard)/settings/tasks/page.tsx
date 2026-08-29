import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { Tasks } from "@/features/settings/tasks"
import { getSession } from "@/services/auth"

export const metadata: Metadata = {
  title: "Tasks",
}

export default async function TasksPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  return <Tasks />
}
