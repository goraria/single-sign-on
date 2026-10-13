import type { UserRole } from "@/utils/client/formatter"

export type DashboardRole = Exclude<UserRole, "master">

export function getDashboardPath(role: unknown) {
  switch (role) {
    case "user":
      return "/user"
    case "vice":
      return "/vice"
    case "admin":
    case "master":
      return "/admin"
    default:
      return "/settings"
  }
}

export function canAccessDashboard(role: unknown, target: DashboardRole) {
  return role === "master" || role === target
}
