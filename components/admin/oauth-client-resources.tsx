"use client"
import { useState } from "react"
import { DataTable } from "@gorth-io/primitive/custom/data-table"
import { Badge } from "@gorth-io/primitive/custom/badge"
import { Button } from "@gorth-io/primitive/custom/button"
import { MoreHorizontal } from "@gorth-io/primitive/cores/lucide"
import type { PaginationState } from "@gorth-io/primitive/cores/tanstack/table"
import type { DataTableProps } from "@gorth-io/primitive/utils/interface"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@gorth-io/primitive/custom/dropdown"
import {
  type OAuthResource,
  useOAuthResourcesQuery,
  useOAuthClientResourcesQuery,
  useChangeOAuthClientResourceMutation,
} from "@/services/client/admin"

export function OAuthClientResources({ id }: { id: string }) {
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const resources = useOAuthResourcesQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search,
  })
  const links = useOAuthClientResourcesQuery(id)
  const [change, result] = useChangeOAuthClientResourceMutation()
  const linked = (resource: OAuthResource) =>
    links.data?.some(
      (link) => link.resourceIdentifier === resource.identifier
    ) ?? false
  const columns: DataTableProps<OAuthResource>["columns"] = [
    {
      accessorKey: "name",
      header: "Resource",
      cell: ({ row }) => (
        <div>
          <p>{row.original.name}</p>
          <p className="text-sm text-muted-foreground break-all">
            {row.original.identifier}
          </p>
        </div>
      ),
    },
    {
      id: "linked",
      header: "Status",
      size: 120,
      cell: ({ row }) => (
        <Badge variant={linked(row.original) ? "success" : "outline"}>
          {linked(row.original) ? "Linked" : "Not linked"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 50,
      cell: ({ row }) => {
        const resource = row.original,
          active = linked(resource)
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={"Resource actions: " + resource.name}
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={
                  !links.data ||
                  result.isLoading ||
                  (!active && resource.disabled)
                }
                onClick={() => {
                  void change({ id, resourceId: resource.id, linked: !active })
                    .unwrap()
                    .catch(() => undefined)
                }}
              >
                {active ? "Unlink" : "Link"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  return (
    <div className="space-y-3 [&_tr>th:first-child]:pl-6 [&_tr>td:first-child]:pl-6 [&_tr>th:last-child]:pr-6 [&_tr>td:last-child]:pr-6">
      {(resources.error ?? links.error ?? result.error) && (
        <p role="alert">Unable to load or change resource access.</p>
      )}
      <DataTable
        columns={columns}
        fluidColumn="name"
        data={resources.data?.items ?? []}
        rowCount={resources.data?.total ?? 0}
        nav={{
          name: "Protected resources",
          description:
            "Link only the audiences this client needs. A link does not grant scopes.",
        }}
        pagination={pagination}
        onPaginationChange={setPagination}
        getRowId={(resource) => resource.id}
        search={{
          placeholder: "Search resources...",
          value: search,
          onValueChange: (value) => {
            setSearch(value)
            setPagination((current) => ({ ...current, pageIndex: 0 }))
          },
        }}
        loading={resources.isLoading || links.isLoading}
        onReload={() => {
          void resources.refetch()
          void links.refetch()
        }}
      />
    </div>
  )
}
