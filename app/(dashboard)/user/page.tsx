import { RoleDashboard } from "@/features/role-dashboard"

export const metadata = { title: "User dashboard" }
export default function Page() {
  return <RoleDashboard role="user" />
}
