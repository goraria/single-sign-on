import { describe, expect, it, vi } from "vitest"
import { roleSidebars } from "@/utils/constant"

vi.mock("@/features/admin/role/_components/roles", () => ({
  Roles: () => null,
}))

import { RolesPage } from "@/features/admin/role"
import UserRolePage from "@/app/(dashboard)/user/role/page"
import ViceRolePage from "@/app/(dashboard)/vice/role/page"

describe("role previews", () => {
  it.each([
    ["user", UserRolePage],
    ["vice", ViceRolePage],
  ] as const)("%s uses its own read-only role preview", (role, Page) => {
    expect(Page().props.role).toBe(role)
    const preview = RolesPage({ role })
    expect(preview.props.readOnly).toBe(true)
    expect(preview.props.roles).toHaveLength(1)
    expect(preview.props.roles[0].role.toLowerCase()).toBe(role)
    expect(roleSidebars[role].navMain).toContainEqual(
      expect.objectContaining({ title: "Role", url: `/${role}/role` })
    )
  })

  it("preserves the full admin template", () => {
    const preview = RolesPage({})
    expect(preview.props.readOnly).toBe(false)
    expect(preview.props.roles).toHaveLength(4)
  })
})
