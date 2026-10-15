import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, expect, it, vi } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import type { DataTableProps } from "@gorth/primitive/utils/interface"

// A synchronous state driver lets us exercise controlled updates and row models
// without introducing a DOM/test-renderer dependency.
const state = vi.hoisted(() => ({ values: [] as unknown[], index: 0 }))
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useState: (initial: unknown) => {
    const index = state.index++
    if (!(index in state.values))
      state.values[index] = typeof initial === "function" ? initial() : initial
    return [
      state.values[index],
      (updater: unknown) => {
        state.values[index] =
          typeof updater === "function" ? updater(state.values[index]) : updater
      },
    ]
  },
}))
import { useLocalDataTable } from "@/hooks/use-local-data-table"

interface Item {
  id: string
  name: string
  status: string
}
const rows: Item[] = [
  { id: "1", name: "Charlie", status: "open" },
  { id: "2", name: "Alice", status: "closed" },
  { id: "3", name: "Bob", status: "open" },
  { id: "4", name: "David", status: "closed" },
  { id: "5", name: "Eve", status: "open" },
]
const columns: DataTableProps<Item>["columns"] = [
  { accessorKey: "name" },
  {
    accessorKey: "status",
    filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)),
  },
]
function render() {
  state.index = 0
  let result!: ReturnType<typeof useLocalDataTable<Item>>
  function Harness() {
    result = useLocalDataTable({ data: rows, columns, initialPageSize: 2 })
    return null
  }
  renderToStaticMarkup(createElement(Harness))
  return result
}
beforeEach(() => {
  state.values = []
  state.index = 0
})

it("passes only the current page to DataTable and counts all matching rows", () => {
  const table = render()
  expect(table.props.rowCount).toBe(5)
  expect(table.props.data.map((row) => row.id)).toEqual(["1", "2"])
  table.props.onPaginationChange({ pageIndex: 1, pageSize: 2 })
  expect(render().props.data.map((row) => row.id)).toEqual(["3", "4"])
})

it("filters before paginating and resets the page on search and facet changes", () => {
  render().props.onPaginationChange({ pageIndex: 2, pageSize: 2 })
  render().filter("status", "Status", []).onValueChange(["open"])
  const filtered = render()
  expect(filtered.props.pagination.pageIndex).toBe(0)
  expect(filtered.props.rowCount).toBe(3)
  expect(filtered.props.data.map((row) => row.id)).toEqual(["1", "3"])
  filtered.search("name", "Search").onValueChange("Eve")
  expect(render().props.data.map((row) => row.id)).toEqual(["5"])
  expect(render().props.rowCount).toBe(1)
  render().props.onColumnFiltersChange([])
  expect(render().props.rowCount).toBe(5)
})

it("sorts the entire dataset before slicing a page and supports updater callbacks", () => {
  render().props.onPaginationChange((current) => ({ ...current, pageIndex: 1 }))
  render().props.onSortingChange([{ id: "name", desc: false }])
  expect(render().props.pagination.pageIndex).toBe(0)
  expect(render().props.data.map((row) => row.name)).toEqual(["Alice", "Bob"])
  render().props.onSortingChange(() => [{ id: "name", desc: true }])
  expect(render().props.data.map((row) => row.name)).toEqual(["Eve", "David"])
})

it("removes the facet after deselecting its last option and preserves sorting", () => {
  render().props.onSortingChange([{ id: "name", desc: false }])
  render().filter("status", "Status", []).onValueChange(["open"])
  expect(render().props.rowCount).toBe(3)
  render().props.onPaginationChange({ pageIndex: 1, pageSize: 2 })
  render().filter("status", "Status", []).onValueChange([])
  const cleared = render()
  expect(cleared.props.columnFilters).toEqual([])
  expect(cleared.props.rowCount).toBe(5)
  expect(cleared.props.pagination.pageIndex).toBe(0)
  expect(cleared.props.sorting).toEqual([{ id: "name", desc: false }])
  expect(cleared.props.data.map((row) => row.name)).toEqual(["Alice", "Bob"])
})

it("clears only the empty facet and retains the search and other selected values", () => {
  render().search("name", "Search").onValueChange("a")
  render().filter("status", "Status", []).onValueChange(["open", "closed"])
  render().filter("status", "Status", []).onValueChange(["open"])
  expect(render().props.rowCount).toBe(1)
  render().filter("status", "Status", []).onValueChange([])
  expect(render().props.rowCount).toBe(3)
  expect(render().props.columnFilters).toEqual([{ id: "name", value: "a" }])
})

it("does not use the all-data table component or its props anywhere in SSO source", () => {
  function inspect(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) inspect(path)
      else if (/\.(ts|tsx)$/.test(path)) {
        expect(readFileSync(path, "utf8"), path).not.toContain(
          ["DataTable", "All"].join("")
        )
      }
    }
  }
  for (const directory of ["app", "components", "features", "hooks", "utils"]) {
    inspect(new URL(`../${directory}`, import.meta.url).pathname)
  }
})
