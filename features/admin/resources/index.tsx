"use client"

import { useEffect, useMemo, useState } from "react"
import { Database } from "@gorth/primitive/cores/lucide"
import type {
  PaginationState,
  SortingState,
} from "@gorth/primitive/cores/tanstack/table"
import { Badge } from "@gorth/primitive/custom/badge"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import {
  DataTable,
  DataTableColumnHeader,
} from "@gorth/primitive/custom/data-table"
import type { DataTableProps } from "@gorth/primitive/utils/interface"
import { formatDate } from "@/utils/client/formatter"
import {
  type OAuthResource,
  useOAuthResourcesQuery,
} from "@/services/client/admin"

const resourceStates = [
  { label: "Enabled", value: "enabled" },
  { label: "Disabled", value: "disabled" },
] as const

export function OAuthResources() {
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
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPagination((current) =>
        current.pageIndex === 0 ? current : { ...current, pageIndex: 0 }
      )
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [searchInput])

  const activeSort = sorting[0]
  const resourcesQuery = useOAuthResourcesQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    status:
      status.length === 1 ? (status[0] as "enabled" | "disabled") : undefined,
    sortBy: activeSort?.id as
      | "name"
      | "identifier"
      | "accessTokenTtl"
      | "state"
      | "updatedAt"
      | undefined,
    sortOrder: activeSort?.desc ? "desc" : "asc",
  })
  const resources = resourcesQuery.data?.items ?? []

  const columns = useMemo<DataTableProps<OAuthResource>["columns"]>(
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
            aria-label="Select resource"
            className="ml-2 size-4"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Resource" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <Database className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {row.original.identifier}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "scope",
        header: "Scopes",
        cell: ({ row }) => {
          const scopes = row.original.allowedScopes ?? []

          return (
            <div className="flex max-w-80 flex-wrap gap-1">
              {scopes.slice(0, 3).map((scope) => (
                <Badge key={scope} variant="outline">
                  {scope}
                </Badge>
              ))}
              {scopes.length > 3 ? (
                <Badge variant="outline">+{scopes.length - 3}</Badge>
              ) : null}
            </div>
          )
        },
        enableSorting: false,
        size: 280,
      },
      {
        accessorKey: "accessTokenTtl",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Access TTL" />
        ),
        cell: ({ row }) =>
          row.original.accessTokenTtl
            ? `${row.original.accessTokenTtl}s`
            : "Default",
        size: 120,
      },
      {
        accessorKey: "refreshTokenTtl",
        header: "Refresh TTL",
        cell: ({ row }) =>
          row.original.refreshTokenTtl
            ? `${row.original.refreshTokenTtl}s`
            : "Default",
        enableSorting: false,
        size: 120,
      },
      {
        accessorKey: "signingAlgorithm",
        header: "Algorithm",
        cell: ({ row }) => row.original.signingAlgorithm ?? "Default",
        enableSorting: false,
        size: 110,
      },
      {
        id: "dpop",
        header: "DPoP",
        cell: ({ row }) =>
          row.original.dpopBoundAccessTokensRequired ? "Required" : "Optional",
        enableSorting: false,
        size: 100,
      },
      {
        id: "state",
        accessorFn: (resource) => (resource.disabled ? "disabled" : "enabled"),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.disabled ? "danger" : "success"}>
            {row.original.disabled ? "Disabled" : "Enabled"}
          </Badge>
        ),
        size: 110,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        cell: ({ row }) => formatDate(row.original.updatedAt),
        size: 120,
      },
    ],
    []
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 sm:gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">OAuth resources</h1>
        <p className="text-muted-foreground">
          Inspect registered audiences, scopes, and token policies.
        </p>
      </div>
      {resourcesQuery.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {resourcesQuery.error.message}
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={resources}
        rowCount={resourcesQuery.data?.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        search={{
          placeholder: "Filter resources...",
          value: searchInput,
          onValueChange: setSearchInput,
        }}
        filters={[
          {
            id: "state",
            title: "Status",
            options: [...resourceStates],
            value: status,
            onValueChange: setStatus,
          },
        ]}
        fluidColumn="name"
        getRowId={(resource) => resource.id}
        loading={resourcesQuery.isLoading || resourcesQuery.isFetching}
        loadingMessage="Loading OAuth resources..."
        emptyMessage="No OAuth resources."
        onReload={() => void resourcesQuery.refetch()}
      />
    </div>
  )
}
