"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "@gorth/primitive/cores/lucide"
import { NavIdentity } from "@gorth/primitive/dashboard/nav-user"
import type {
  PaginationState,
  SortingState,
} from "@gorth/primitive/cores/tanstack/table"
import { Badge } from "@gorth/primitive/custom/badge"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import { Button } from "@gorth/primitive/custom/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@gorth/primitive/custom/dropdown"
import {
  DataTable,
  DataTableColumnHeader,
} from "@gorth/primitive/custom/data-table"
import type { DataTableProps } from "@gorth/primitive/utils/interface"
import { formatDate } from "@/utils/client/formatter"
import {
  type OAuthResource,
  useOAuthResourcesQuery,
  useDeleteOAuthResourceMutation,
} from "@/services/client/admin"
import { OAuthResourceDetails } from "@/components/admin/oauth-details"
import { oauthAdminPaths } from "@/utils/constant"
import { TableLoading } from "@/features/shared/loading"

const resourceStates = [
  { label: "Enabled", value: "enabled" },
  { label: "Disabled", value: "disabled" },
] as const

export function OAuthResources() {
  const router = useRouter()
  const [selectedResource, setSelectedResource] =
    useState<OAuthResource | null>(null)
  const [deleteResource, deleteResult] = useDeleteOAuthResourceMutation()
  const remove = useCallback(
    async (resource: OAuthResource) => {
      if (
        !window.confirm(
          `Delete ${resource.name} (${resource.identifier})? Client links will be removed and new tokens cannot target this resource. Existing JWTs may remain valid until expiry.`
        )
      )
        return
      try {
        await deleteResource(resource.id).unwrap()
        setSelectedResource(null)
      } catch {
        // Caller exposes the normalized error through the mutation result.
      }
    },
    [deleteResource]
  )
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
  const error = resourcesQuery.error ?? deleteResult.error

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
          <NavIdentity
            user={{ name: row.original.name }}
            description={row.original.identifier}
            href={`${oauthAdminPaths.resource}/edit/${row.original.id}`}
          />
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
        header: "Access TTL",
        // header: ({ column }) => (
        //   <DataTableColumnHeader column={column} title="Access TTL" />
        // ),
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
                onClick={() => setSelectedResource(row.original)}
              >
                Show
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `${oauthAdminPaths.resource}/edit/${row.original.id}`
                  )
                }
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={deleteResult.isLoading}
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
        size: 50,
      },
    ],
    [router, remove, deleteResult.isLoading]
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 sm:gap-6">
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}
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
        loadingMessage={<TableLoading />}
        emptyMessage="No OAuth resources."
        onReload={() => void resourcesQuery.refetch()}
        onCreate={() => router.push(`${oauthAdminPaths.resource}/create`)}
      />
      <OAuthResourceDetails
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
      />
    </div>
  )
}
