import { createElement, isValidElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import type { DataTableProps } from "@gorth/primitive/utils/interface"

const state = vi.hoisted(() => ({
  props: null as DataTableProps<Record<string, unknown>> | null,
  notify: vi.fn(),
  refetch: vi.fn(),
}))
vi.mock("@gorth/primitive/custom/data-table", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@gorth/primitive/custom/data-table")
  >()),
  DataTable: (props: DataTableProps<Record<string, unknown>>) => {
    state.props = props
    return null
  },
}))
vi.mock("@gorth/primitive/custom/toast", () => ({
  toast: { add: state.notify },
}))
vi.mock("@/services/client/admin", () => {
  const query = () => ({
    data: { items: [], total: 0 },
    refetch: state.refetch,
  })
  return {
    useAuditLogsQuery: query,
    useOAuthConsentsQuery: query,
    useRevokeOAuthConsentMutation: () => [vi.fn(), {}],
  }
})
import { Roles } from "@/features/admin/role/_components/roles"
import { roles } from "@/features/admin/role/_components/roles-table/data"
import { AuditLogs } from "@/features/admin/audit-log"
import { OAuthConsents } from "@/features/admin/oauth/consent"

beforeEach(() => {
  state.props = null
  state.notify.mockClear()
})

it("puts role title and demo actions inside DataTable rather than beside it", () => {
  const html = renderToStaticMarkup(createElement(Roles, { roles }))
  expect(html).not.toContain("Create role")
  expect(html).not.toContain("Import JSON")
  expect(html).not.toContain("Review changes")
  expect(html).not.toContain("<h1")
  expect(state.props?.nav?.name).toBe("Roles & Permissions")
  expect(state.props?.labels).toEqual({
    import: "Import JSON",
    add: "Create role",
  })
  state.props?.onImport?.()
  state.props?.onCreate?.()
  expect(state.notify).toHaveBeenCalledTimes(2)
  expect(state.notify).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "info",
      description: expect.stringContaining("demo"),
    })
  )
  expect(
    renderToStaticMarkup(createElement("div", null, state.props?.render))
  ).toContain("Review changes")
})

it("keeps user and vice role previews read-only", () => {
  renderToStaticMarkup(createElement(Roles, { roles, readOnly: true }))
  expect(state.props?.onCreate).toBeUndefined()
  expect(state.props?.onImport).toBeUndefined()
  expect(state.props?.render).toBe(false)
})

it.each([
  ["Audit log", AuditLogs, "Apply dates", "Reset dates"],
  ["Consent", OAuthConsents, "Apply filters", "Reset"],
] as const)(
  "puts %s filter forms and their actions inside the table toolbar",
  (_name, Component, apply, reset) => {
    const html = renderToStaticMarkup(createElement(Component))
    expect(html).not.toContain("<form")
    expect(html).not.toContain(apply)
    const form = state.props?.render
    expect(isValidElement(form)).toBe(true)
    if (!isValidElement<{ onSubmit: unknown; onReset: unknown }>(form))
      throw new Error("Missing filter form")
    expect(form.type).toBe("form")
    expect(form.props.onSubmit).toBeTypeOf("function")
    expect(form.props.onReset).toBeTypeOf("function")
    const toolbar = renderToStaticMarkup(form)
    expect(toolbar).toContain(apply)
    expect(toolbar).toContain(reset)
    expect(state.props?.onReload).toBeTypeOf("function")
  }
)
