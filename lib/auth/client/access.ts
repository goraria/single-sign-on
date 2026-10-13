import { createAccessControl } from "better-auth/plugins/access"

const adminStatements = {
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
} as const

export const adminAccessControl = createAccessControl(adminStatements)

const userRole = adminAccessControl.newRole({ user: [], session: [] })
const administratorRole = adminAccessControl.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
})
const masterRole = adminAccessControl.newRole(adminStatements)

export const adminRoles = {
  user: userRole,
  vice: userRole,
  admin: administratorRole,
  master: masterRole,
}
