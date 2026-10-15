import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { rolesColumns } from "@/features/admin/role/_components/roles-table/columns"

describe("shared role data-table", () => {
  it("uses plain headers without sorting for every role column", () => {
    for (const column of rolesColumns) {
      expect(typeof column.header).toBe("string")
      expect(column.enableSorting).toBe(false)
    }
  })
  it("uses Primitive for table rendering instead of the old local table", () => {
    const source = readFileSync(
      fileURLToPath(
        new URL("../features/admin/role/_components/roles.tsx", import.meta.url)
      ),
      "utf8"
    )
    expect(source).toContain('from "@gorth/primitive/custom/data-table"')
    expect(source).toContain("<DataTable")
    expect(source).toContain("{...table.props}")
    expect(source).not.toContain("RolesTable")
    expect(source).not.toContain("useTable")
    expect(source).toContain('column.id !== "actions"')
    expect(
      existsSync(
        fileURLToPath(
          new URL(
            "../features/admin/role/_components/roles-table/table.tsx",
            import.meta.url
          )
        )
      )
    ).toBe(false)
  })

  it("uses multi-value faceted filters and excludes actions from sorting", () => {
    for (const id of ["group", "owner", "status"]) {
      const filter = rolesColumns.find((column) => column.id === id)?.filterFn
      expect(typeof filter).toBe("function")
      if (typeof filter === "function") {
        const row = { getValue: () => "System" } as unknown as Parameters<
          typeof filter
        >[0]
        expect(filter(row, id, ["System", "Custom"], () => {})).toBe(true)
        expect(filter(row, id, ["Custom"], () => {})).toBe(false)
      }
    }
    expect(
      rolesColumns.find((column) => column.id === "actions")?.enableSorting
    ).toBe(false)
    expect(rolesColumns.some((column) => column.id === "search")).toBe(false)
  })
})
