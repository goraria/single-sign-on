import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Ban,
  CheckCircle,
  Circle,
  CircleCheck,
  CircleOff,
  HelpCircle,
  Shield,
  ShieldCheck,
  Timer,
  User,
} from "@gorth/primitive/cores/lucide"
import { Badge } from "@gorth/primitive/custom/badge"
import type { User as SsoUser } from "@/schemas/users"

export interface RenderAuthStateMeta {
  label: string
  className: string
}

export const userRoles = [
  {
    value: "user",
    label: "User",
    icon: User,
    className: "text-professional-primary-1",
  },
  {
    value: "vice",
    label: "Vice",
    icon: ShieldCheck,
    className: "text-professional-primary-2",
  },
  {
    value: "admin",
    label: "Admin",
    icon: Shield,
    className: "text-professional-primary-3",
  },
  {
    value: "master",
    label: "Master",
    icon: Shield,
    className: "text-professional-primary-4",
  },
] as const

export const userStates = [
  { value: "verified", label: "Verified", icon: CheckCircle },
  { value: "unverified", label: "Unverified", icon: User },
  { value: "banned", label: "Banned", icon: Ban },
] as const

export const applicationStates = [
  { value: "enabled", label: "Enabled", icon: CheckCircle },
  { value: "disabled", label: "Disabled", icon: Ban },
] as const

export const taskStatuses = [
  { value: "backlog", label: "Backlog", icon: HelpCircle },
  { value: "todo", label: "Todo", icon: Circle },
  { value: "in progress", label: "In Progress", icon: Timer },
  { value: "done", label: "Done", icon: CircleCheck },
  { value: "canceled", label: "Canceled", icon: CircleOff },
] as const

export const taskPriorities = [
  { value: "low", label: "Low", icon: ArrowDown },
  { value: "medium", label: "Medium", icon: ArrowRight },
  { value: "high", label: "High", icon: ArrowUp },
] as const

export const taskLabels = ["bug", "feature", "documentation"] as const

export function getUserStatusVariant(user: SsoUser) {
  if (user.bannedUntil) return "danger" as const
  return user.emailVerified ? ("success" as const) : ("warning" as const)
}

export function renderUserRole(role: SsoUser["role"]) {
  const item = userRoles.find((candidate) => candidate.value === role)

  if (!item) return null

  const Icon = item.icon

  return (
    <span className="flex items-center gap-2 text-sm font-normal">
      <Icon className={`size-4 ${item.className}`} />
      <span>{item.label}</span>
    </span>
  )
}

export function renderUserStatus(user: SsoUser) {
  return (
    <Badge variant={getUserStatusVariant(user)}>
      {user.bannedUntil
        ? "Banned"
        : user.emailVerified
          ? "Verified"
          : "Unverified"}
    </Badge>
  )
}

export function renderApplicationStatus(disabled: boolean) {
  return (
    <Badge variant={disabled ? "danger" : "success"}>
      {disabled ? "Disabled" : "Enabled"}
    </Badge>
  )
}

export function renderTaskStatus(
  value: (typeof taskStatuses)[number]["value"]
) {
  const item = taskStatuses.find((status) => status.value === value)

  if (!item) return null

  const Icon = item.icon

  return (
    <span className="flex items-center gap-2">
      <Icon className="text-muted-foreground size-4" />
      {item.label}
    </span>
  )
}

export function renderTaskPriority(
  value: (typeof taskPriorities)[number]["value"]
) {
  const item = taskPriorities.find((priority) => priority.value === value)

  if (!item) return null

  const Icon = item.icon

  return (
    <span className="flex items-center gap-2">
      <Icon className="text-muted-foreground size-4" />
      {item.label}
    </span>
  )
}

export function renderAuthStateMeta(
  value: string | null | undefined
): RenderAuthStateMeta {
  switch (value) {
    case "authenticated":
      return {
        label: "Authenticated",
        className: "bg-emerald-50 text-emerald-700",
      }
    case "unauthenticated":
      return {
        label: "Unauthenticated",
        className: "bg-slate-100 text-slate-700",
      }
    case "invalid_redirect":
    case "invalid_token":
      return { label: "Invalid", className: "bg-red-50 text-red-700" }
    default:
      return {
        label: value ? value.replace(/[-_]/g, " ") : "Unknown",
        className: "bg-slate-100 text-slate-700",
      }
  }
}

export function renderAuthProviderLabel(value: string | null | undefined) {
  switch (value) {
    case "google":
      return "Google"
    case "facebook":
      return "Facebook"
    case "microsoft":
      return "Microsoft"
    case "apple":
      return "Apple"
    case "email":
      return "Email"
    case "phone":
      return "Phone"
    default:
      return value ? value.replace(/[-_]/g, " ") : "Unknown"
  }
}
