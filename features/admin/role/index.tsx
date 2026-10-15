import { Roles } from "./_components/roles"
import { roles } from "./_components/roles-table/data"

export function RolesPage({ role }: { role?: "user" | "vice" }) {
  const visibleRoles = role
    ? roles.filter((item) => item.role.toLowerCase() === role)
    : roles

  return <Roles roles={visibleRoles} readOnly={Boolean(role)} />
}
