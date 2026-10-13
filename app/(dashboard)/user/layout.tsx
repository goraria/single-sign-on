import type { ReactNode } from "react"
import { RoleDashboardLayout } from "@/layouts/role-dashboard"

export default function Layout({ children }: { children: ReactNode }) {
  return <RoleDashboardLayout role="user">{children}</RoleDashboardLayout>
}
