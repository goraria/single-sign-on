import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type { DataTableProps } from "@gorth/primitive/utils/interface"

const state = vi.hoisted(() => ({
  props: null as DataTableProps<{ id: string; title: string }> | null,
  notify: vi.fn(),
}))
vi.mock("@gorth/primitive/custom/data-table", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@gorth/primitive/custom/data-table")
  >()),
  DataTable: (props: DataTableProps<{ id: string; title: string }>) => {
    state.props = props
    return null
  },
  DataTableColumnHeader: () => null,
}))
vi.mock("@gorth/primitive/custom/toast", () => ({
  toast: { add: state.notify },
}))
import { Tasks } from "@/features/settings/tasks"

it("uses the new shared nav and toolbar while retaining demo task filters", () => {
  const html = renderToStaticMarkup(createElement(Tasks))
  expect(html).not.toContain("<h1")
  expect(state.props?.nav?.name).toBe("Tasks")
  expect(state.props?.data).toHaveLength(10)
  expect(state.props?.rowCount).toBe(100)
  expect(state.props?.pagination).toEqual({ pageIndex: 0, pageSize: 10 })
  expect(state.props?.onPaginationChange).toBeTypeOf("function")
  expect(state.props?.onSortingChange).toBeTypeOf("function")
  expect(state.props?.onColumnFiltersChange).toBeTypeOf("function")
  expect(state.props?.labels?.add).toBe("Add Task")
  expect(state.props?.feat).toBe("default")
  expect(state.props?.onToggle).toBeTypeOf("function")
  expect(state.props?.filters?.map((filter) => filter.id)).toEqual([
    "status",
    "priority",
  ])
  expect(state.props?.fluidColumn).toBe("title")
  expect(state.props?.onDownload).toBeTypeOf("function")
  state.props?.onImport?.()
  state.props?.onCreate?.()
  expect(state.notify).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "info",
      description: expect.stringContaining("demo data"),
    })
  )
})
