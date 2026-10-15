"use client"

import { useState } from "react"
import {
  useTable,
  filterFns,
  sortFns,
  tableFeatures,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@gorth/primitive/cores/tanstack/table"
import { dataTableFeatures } from "@gorth/primitive/custom/data-table"
import type {
  DataTableFilter,
  DataTableFilterOption,
  DataTableProps,
  DataTableSearch,
} from "@gorth/primitive/utils/interface"

const localFeatures = tableFeatures({
  ...dataTableFeatures,
  filterFns,
  sortFns,
})

// Prepare local/demo rows for the same controlled DataTable used by API lists.
// Filtering and sorting must happen before slicing the current page.
export function useLocalDataTable<TData extends RowData>({
  data,
  columns,
  initialPageSize = 10,
}: {
  data: TData[]
  columns: DataTableProps<TData>["columns"]
  initialPageSize?: number
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const resetPage = () =>
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting(updater)
    resetPage()
  }
  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    setColumnFilters(updater)
    resetPage()
  }
  const table = useTable({
    features: localFeatures,
    data,
    columns,
    state: { pagination, sorting, columnFilters },
    onPaginationChange: setPagination,
    onSortingChange,
    onColumnFiltersChange,
  })

  function search(columnId: string, placeholder: string): DataTableSearch {
    const column = table.getColumn(columnId)
    return {
      placeholder,
      value: (column?.getFilterValue() as string | undefined) ?? "",
      onValueChange: (value) => column?.setFilterValue(value),
    }
  }

  function filter(
    id: string,
    title: string,
    options: DataTableFilterOption[]
  ): DataTableFilter {
    const column = table.getColumn(id)
    return {
      id,
      title,
      options,
      value: (column?.getFilterValue() as DataTableFilter["value"]) ?? [],
      // Custom membership filters treat [] as "match nothing", not "disabled".
      onValueChange: (value) =>
        column?.setFilterValue(value.length ? value : undefined),
      getCount: (value) => column?.getFacetedUniqueValues().get(value),
    }
  }

  return {
    search,
    filter,
    props: {
      data: table.getRowModel().rows.map((row) => row.original),
      rowCount: table.getFilteredRowModel().rows.length,
      pagination,
      onPaginationChange: setPagination,
      sorting,
      onSortingChange,
      columnFilters,
      onColumnFiltersChange,
    },
  }
}
