"use client"

import { TableLoading } from "@/features/shared/loading"

import { useMemo, useState } from "react"
import { MoreHorizontal } from "@gorth/primitive/cores/lucide"
import { DataTable } from "@gorth/primitive/custom/data-table"
import { Button } from "@gorth/primitive/custom/button"
import { Input } from "@gorth/primitive/default/input"
import { Badge } from "@gorth/primitive/custom/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@gorth/primitive/custom/dropdown"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@gorth/primitive/default/dialog"
import { NavIdentity } from "@gorth/primitive/dashboard/nav-user"
import { toast } from "@gorth/primitive/custom/toast"
import type { DataTableProps } from "@gorth/primitive/utils/interface"
import { useAdminTable } from "@/hooks/use-admin-table"
import { formatDateTime } from "@/utils/client/formatter"
import {
  type OAuthConsent,
  useOAuthConsentsQuery,
  useRevokeOAuthConsentMutation,
} from "@/services/client/admin"

export function OAuthConsents() {
  const table = useAdminTable()
  const [filters, setFilters] = useState<{
    userId?: string
    clientId?: string
  }>({})
  const [selected, setSelected] = useState<OAuthConsent | null>(null)
  const query = useOAuthConsentsQuery({
    page: table.pagination.pageIndex + 1,
    limit: table.pagination.pageSize,
    search: table.search || undefined,
    ...filters,
  })
  const [revoke, mutation] = useRevokeOAuthConsentMutation()
  const error = query.error ?? mutation.error
  const columns = useMemo<DataTableProps<OAuthConsent>["columns"]>(
    () => [
      {
        accessorKey: "clientName",
        header: "Client",
        cell: ({ row }) => (
          <NavIdentity
            user={{ name: row.original.clientName ?? row.original.clientId }}
            description={row.original.clientId}
          />
        ),
      },
      {
        accessorKey: "userName",
        header: "User",
        cell: ({ row }) => (
          <NavIdentity
            user={{
              name: row.original.userName ?? "Unknown user",
              email: row.original.userEmail ?? undefined,
            }}
            description={
              row.original.userEmail ?? row.original.userId ?? "No user"
            }
          />
        ),
        size: 300,
      },
      {
        id: "resources",
        header: "Resources",
        cell: ({ row }) => `${row.original.resources?.length ?? 0} resource(s)`,
      },
      {
        id: "scopes",
        header: "Scopes",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.scopes.map((scope) => (
              <Badge key={scope} variant="outline">
                {scope}
              </Badge>
            ))}
          </div>
        ),
        size: 300,
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) =>
          row.original.updatedAt ? formatDateTime(row.original.updatedAt) : "—",
        size: 180,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Consent actions"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelected(row.original)}>
                Show
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={mutation.isLoading || !row.original.userId}
                variant="destructive"
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Revoke every consent and stored grant for ${row.original.userEmail ?? row.original.userId} and ${row.original.clientName ?? row.original.clientId}? Refresh and stored access tokens will be revoked. Self-contained JWTs may remain valid until expiry. Clients configured to skip consent may obtain new grants after authorization.`
                    )
                  )
                    return
                  try {
                    await revoke(row.original.id).unwrap()
                    setSelected(null)
                    toast.add({
                      type: "success",
                      description:
                        "Consent and stored grants revoked. JWTs may remain valid until expiry.",
                    })
                  } catch {
                    /* Caller reports errors. */
                  }
                }}
              >
                Revoke consent and grant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [mutation.isLoading, revoke]
  )

  const grantFilters = (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setFilters({
          userId: String(data.get("userId") ?? "").trim() || undefined,
          clientId: String(data.get("clientId") ?? "").trim() || undefined,
        })
        table.resetPage()
      }}
      onReset={() => {
        setFilters({})
        table.resetPage()
      }}
    >
      <Input
        name="userId"
        aria-label="Filter by user ID"
        placeholder="User ID"
        pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
        className="w-72"
      />
      <Input
        name="clientId"
        aria-label="Filter by client ID"
        placeholder="Client ID"
        maxLength={256}
        className="w-72"
      />
      <Button type="submit">Apply filters</Button>
      <Button type="reset" variant="outline">
        Reset
      </Button>
    </form>
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {error && (
        <p role="alert" className="text-destructive">
          {error.message}
        </p>
      )}
      <DataTable
        render={grantFilters}
        columns={columns}
        data={query.data?.items ?? []}
        rowCount={query.data?.total ?? 0}
        pagination={table.pagination}
        onPaginationChange={table.setPagination}
        search={{
          placeholder: "Search user or client...",
          value: table.searchInput,
          onValueChange: table.setSearchInput,
        }}
        getRowId={(row) => row.id}
        fluidColumn="clientName"
        enableRowSelection={false}
        loading={query.isLoading || query.isFetching}
        loadingMessage={<TableLoading />}
        emptyMessage="No consents found."
        onReload={() => void query.refetch()}
      />
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        {selected && (
          <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selected.clientName ?? selected.clientId}
              </DialogTitle>
              <DialogDescription>
                {selected.userEmail ?? selected.userId ?? "No user"}
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 text-sm">
              <dt>Consent ID</dt>
              <dd className="break-all">{selected.id}</dd>
              <dt>Client ID</dt>
              <dd className="break-all">{selected.clientId}</dd>
              <dt>User ID</dt>
              <dd>{selected.userId ?? "—"}</dd>
              <dt>Reference ID</dt>
              <dd className="break-all">{selected.referenceId ?? "—"}</dd>
              <dt>Resources</dt>
              <dd className="grid gap-2">
                {selected.resources?.length
                  ? selected.resources.map((resource) => (
                      <span key={resource} className="break-all">
                        {resource}
                      </span>
                    ))
                  : "No explicit resource list"}
              </dd>
              <dt>Scopes</dt>
              <dd className="flex flex-wrap gap-1">
                {selected.scopes.map((scope) => (
                  <Badge key={scope} variant="outline">
                    {scope}
                  </Badge>
                ))}
              </dd>
              <dt>Created</dt>
              <dd>
                {selected.createdAt ? formatDateTime(selected.createdAt) : "—"}
              </dd>
              <dt>Updated</dt>
              <dd>
                {selected.updatedAt ? formatDateTime(selected.updatedAt) : "—"}
              </dd>
            </dl>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
