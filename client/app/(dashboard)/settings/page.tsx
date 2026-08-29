import { DashboardOverview } from "@/features/dashboard"
import { getSession } from "@/services/auth"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/")
  }

  return <DashboardOverview />
}
