"use client"

import { TableLoading } from "@/features/shared/loading"

import { useState } from "react"
import { DataTable } from "@gorth/primitive/custom/data-table"
import { Badge } from "@gorth/primitive/custom/badge"
import { Button } from "@gorth/primitive/custom/button"
import { Input } from "@gorth/primitive/default/input"
import { NavIdentity } from "@gorth/primitive/dashboard/nav-user"
import type { DataTableProps } from "@gorth/primitive/utils/interface"
import { useAdminTable } from "@/hooks/use-admin-table"
import { formatDateTime } from "@/utils/client/formatter"
import { type AdminAuditLog, useAuditLogsQuery } from "@/services/client/admin"

const columns: DataTableProps<AdminAuditLog>["columns"] = [
  {
    accessorKey: "actorName",
    header: "Actor",
    cell: ({ row }) => (
      <NavIdentity
        user={{
          name: row.original.actorName ?? "Unknown actor",
          email: row.original.actorEmail ?? undefined,
        }}
        description={row.original.actorEmail ?? row.original.actorUserId ?? "—"}
      />
    ),
  },
  { accessorKey: "action", header: "Action" },
  {
    accessorKey: "resourceType",
    header: "Target",
    cell: ({ row }) => (
      <div className="grid gap-1">
        <span>{row.original.resourceType ?? "—"}</span>
        <span className="text-muted-foreground break-all text-xs">
          {row.original.resourceId ?? "—"}
        </span>
        {row.original.subjectUserId && (
          <span className="text-xs break-all">
            User: {row.original.subjectUserId}
          </span>
        )}
        {row.original.clientId && (
          <span className="text-xs break-all">
            Client: {row.original.clientId}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "outcome",
    header: "Result",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.phase === "requested"
          ? "Requested"
          : row.original.outcome}
        {row.original.status ? ` (${row.original.status})` : ""}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    accessorKey: "requestId",
    header: "Correlation ID",
    cell: ({ row }) => (
      <span className="break-all text-xs">{row.original.requestId ?? "—"}</span>
    ),
  },
]

export function AuditLogs() {
  const table = useAdminTable()
  const [outcome, setOutcome] = useState<(string | number | boolean)[]>([])
  const [resourceType, setResourceType] = useState<
    (string | number | boolean)[]
  >([])
  const [dates, setDates] = useState<{ from?: string; to?: string }>({})
  const query = useAuditLogsQuery({
    page: table.pagination.pageIndex + 1,
    limit: table.pagination.pageSize,
    search: table.search || undefined,
    outcome:
      outcome.length === 1 ? (outcome[0] as "success" | "failure") : undefined,
    resourceType: resourceType.length ? resourceType.join(",") : undefined,
    ...dates,
  })
  const dateFilters = (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const from = String(data.get("from") ?? "")
        const to = String(data.get("to") ?? "")
        setDates({
          from: from ? new Date(from).toISOString() : undefined,
          to: to ? new Date(to).toISOString() : undefined,
        })
        table.resetPage()
      }}
      onReset={() => {
        setDates({})
        table.resetPage()
      }}
    >
      <label className="grid gap-1 text-sm">
        From
        <Input name="from" type="datetime-local" />
      </label>
      <label className="grid gap-1 text-sm">
        To
        <Input name="to" type="datetime-local" />
      </label>
      <Button type="submit">Apply dates</Button>
      <Button type="reset" variant="outline">
        Reset dates
      </Button>
    </form>
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {query.error && (
        <p role="alert" className="text-destructive">
          {query.error.message}
        </p>
      )}
      <DataTable
        render={dateFilters}
        columns={columns}
        data={query.data?.items ?? []}
        rowCount={query.data?.total ?? 0}
        pagination={table.pagination}
        onPaginationChange={table.setPagination}
        search={{
          placeholder: "Search actor, action or target...",
          value: table.searchInput,
          onValueChange: table.setSearchInput,
        }}
        filters={[
          {
            id: "outcome",
            title: "Result",
            options: [
              { label: "Success", value: "success" },
              { label: "Failure", value: "failure" },
            ],
            value: outcome,
            onValueChange: (value) => {
              setOutcome(value)
              table.resetPage()
            },
          },
          {
            id: "resourceType",
            title: "Target",
            options: [
              "user",
              "session",
              "oauth-consent",
              "oauth-resource",
              "sso-application",
              "auth-admin",
            ].map((value) => ({ label: value, value })),
            value: resourceType,
            onValueChange: (value) => {
              setResourceType(value)
              table.resetPage()
            },
          },
        ]}
        getRowId={(row) => row.id}
        fluidColumn="actorName"
        enableRowSelection={false}
        loading={query.isLoading || query.isFetching}
        loadingMessage={<TableLoading />}
        emptyMessage="No audit events found."
        onReload={() => void query.refetch()}
      />
    </div>
  )
}
