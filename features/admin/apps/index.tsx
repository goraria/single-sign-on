"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "@gorth/primitive/cores/lucide"
import {
  DataTable,
  DataTableColumnHeader,
} from "@gorth/primitive/custom/data-table"
import type { DataTableProps } from "@gorth/primitive/utils/interface"
import type {
  PaginationState,
  SortingState,
} from "@gorth/primitive/cores/tanstack/table"
import { NavIdentity } from "@gorth/primitive/dashboard/nav-user"
import { Button } from "@gorth/primitive/custom/button"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@gorth/primitive/custom/dropdown"
import {
  type SsoApplication,
  useDeleteSsoApplicationMutation,
  useSsoApplicationsQuery,
} from "@/services/client/admin"
import { formatDate } from "@/utils/client/formatter"
import { applicationStates, renderApplicationStatus } from "@/utils/renderer"

export function Applications() {
  const router = useRouter()
  const createApplication = useCallback(() => {
    router.push("/admin/apps/create")
  }, [router])
  const downloadApplications = useCallback(() => undefined, [])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ])
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<(string | number | boolean)[]>([])

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timeout)
  }, [searchInput])

  const activeSort = sorting[0]
  const applicationsQuery = useSsoApplicationsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    status:
      status.length === 1 ? (status[0] as "enabled" | "disabled") : undefined,
    sortBy: activeSort?.id as
      "name" | "clientId" | "homepageUrl" | "state" | "updatedAt" | undefined,
    sortOrder: activeSort?.desc ? "desc" : "asc",
  })
  const [deleteApplication, deleteResult] = useDeleteSsoApplicationMutation()
  const applications = applicationsQuery.data?.items ?? []
  const error = applicationsQuery.error ?? deleteResult.error

  const remove = useCallback(
    async (application: SsoApplication) => {
      if (
        !window.confirm(
          `Delete ${application.name}? Existing grants will be revoked.`
        )
      ) {
        return
      }

      try {
        await deleteApplication(application.id).unwrap()
      } catch {
        // Caller exposes the normalized error through the mutation result.
      }
    },
    [deleteApplication]
  )

  const columns = useMemo<DataTableProps<SsoApplication>["columns"]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              table.getIsSomePageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(Boolean(value))
            }
            aria-label="Select all"
            className="ml-2 size-4"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label="Select row"
            className="ml-2 size-4"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50, // 64
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <NavIdentity
            user={{ name: row.original.name, avatar: row.original.icon }}
            description={row.original.clientId}
            href={`/admin/apps/edit/${row.original.id}`}
            hover
            tooltip
          />
        ),
      },
      {
        accessorKey: "homepageUrl",
        header: "Homepage",
        cell: ({ row }) => (
          <span className="block max-w-64 truncate">
            {row.original.homepageUrl ?? "No homepage"}
          </span>
        ),
        size: 200,
      },
      {
        id: "state",
        accessorFn: (application) =>
          application.disabled ? "disabled" : "enabled",
        header: ({ column }) => (
          <div className="flex items-center justify-center">
            <DataTableColumnHeader column={column} title="Status" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            {renderApplicationStatus(row.original.disabled)}
          </div>
        ),
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
        size: 120,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            {formatDate(row.original.updatedAt)}
          </div>
        ),
        size: 120,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Actions for ${row.original.name}`}
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/admin/apps/edit/${row.original.id}`)
                }
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void remove(row.original)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50, // 64
      },
    ],
    [remove, router]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={applications}
        rowCount={applicationsQuery.data?.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        search={{
          placeholder: "Filter applications...",
          value: searchInput,
          onValueChange: setSearchInput,
        }}
        filters={[
          {
            id: "state",
            title: "Status",
            options: [...applicationStates],
            value: status,
            onValueChange: setStatus,
          },
        ]}
        fluidColumn="name"
        getRowId={(application) => application.id}
        loading={applicationsQuery.isLoading || applicationsQuery.isFetching}
        loadingMessage="Loading applications..."
        emptyMessage="No results."
        onReload={() => void applicationsQuery.refetch()}
        onDownload={downloadApplications}
        onCreate={createApplication}
      />
    </div>
  )
}
