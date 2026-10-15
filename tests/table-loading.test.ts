import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { TableLoading } from "@/features/shared/loading"
import Loading from "@/app/(dashboard)/settings/task/loading"
import { ProgressProvider } from "@gorth/primitive/cores/progress/react"
import { DataTable } from "@gorth/primitive/custom/data-table"

it("uses an inline infinite spinner while waiting for the task route", () => {
  expect(Loading().type).toBe(TableLoading)
  const loading = TableLoading()
  expect(loading.props.role).toBe("status")
  expect(loading.props.children.props.variant).toBe("infinite")
  expect(loading.props.className).not.toContain("fixed")
})

it("renders the spinner in the installed table loading row, not visible loading text or empty state", () => {
  const html = renderToStaticMarkup(
    createElement(
      ProgressProvider,
      null,
      createElement(DataTable, {
        columns: [{ accessorKey: "id", header: "Task" }],
        data: [],
        rowCount: 0,
        pagination: { pageIndex: 0, pageSize: 10 },
        onPaginationChange: vi.fn(),
        loading: true,
        loadingMessage: createElement(TableLoading),
        emptyMessage: "No tasks found.",
      })
    )
  )
  expect(html).toContain('role="status"')
  expect(html).toContain('repeatCount="indefinite"')
  expect(html).not.toContain("No tasks found.")
  expect(html).not.toContain(">Loading data<")
  expect(html).not.toContain("fixed inset-0")
})

it.each([
  "user",
  "session",
  "audit-log",
  "oauth/client",
  "oauth/resource",
  "oauth/consent",
])("uses the same infinite loading state in the %s data table", (feature) => {
  const source = readFileSync(
    new URL(`../features/admin/${feature}/index.tsx`, import.meta.url),
    "utf8"
  )
  expect(source).toContain("loadingMessage={<TableLoading />}")
})
