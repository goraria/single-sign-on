"use client"

import { TableLoading } from "@/features/shared/loading"

import { useMemo } from "react"
import { MoreHorizontal } from "@gorth/primitive/cores/lucide"
import { DataTable } from "@gorth/primitive/custom/data-table"
import { Button } from "@gorth/primitive/custom/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@gorth/primitive/custom/dropdown"
import { NavIdentity } from "@gorth/primitive/dashboard/nav-user"
import { toast } from "@gorth/primitive/custom/toast"
import type { DataTableProps } from "@gorth/primitive/utils/interface"
import { useAdminTable } from "@/hooks/use-admin-table"
import { formatDateTime } from "@/utils/client/formatter"
import {
  type AdminSession,
  useAdminSessionsQuery,
  useRevokeAdminSessionMutation,
  useRevokeAdminUserSessionsMutation,
} from "@/services/client/admin"

export function AdminSessions() {
  const table = useAdminTable()
  const query = useAdminSessionsQuery({
    page: table.pagination.pageIndex + 1,
    limit: table.pagination.pageSize,
    search: table.search || undefined,
  })
  const [revokeSession, sessionMutation] = useRevokeAdminSessionMutation()
  const [revokeUserSessions, userMutation] =
    useRevokeAdminUserSessionsMutation()
  const pending = sessionMutation.isLoading || userMutation.isLoading
  const error = query.error ?? sessionMutation.error ?? userMutation.error
  const columns = useMemo<DataTableProps<AdminSession>["columns"]>(
    () => [
      {
        accessorKey: "userName",
        header: "User",
        cell: ({ row }) => (
          <NavIdentity
            user={{
              name: row.original.userName,
              email: row.original.userEmail,
            }}
            description={row.original.userEmail}
          />
        ),
      },
      {
        accessorKey: "ipAddress",
        header: "IP address",
        cell: ({ row }) => row.original.ipAddress ?? "Unknown",
      },
      {
        accessorKey: "userAgent",
        header: "Device",
        cell: ({ row }) => (
          <span className="block max-w-80 break-words whitespace-normal">
            {row.original.userAgent ?? "Unknown"}
          </span>
        ),
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => formatDateTime(row.original.expiresAt),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => formatDateTime(row.original.updatedAt),
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
                  disabled={pending}
                  aria-label="Session actions"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                disabled={pending}
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Revoke this session for ${row.original.userEmail}? If this is your current session, you will be signed out.`
                    )
                  )
                    return
                  try {
                    await revokeSession(row.original.id).unwrap()
                    toast.add({
                      type: "success",
                      description: "Session revoked.",
                    })
                  } catch {
                    /* Caller reports errors. */
                  }
                }}
              >
                Revoke session
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={pending}
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Revoke ALL SSO sessions for ${row.original.userEmail}? This includes the current session if this is your account. Offline OAuth grants are not revoked by this action.`
                    )
                  )
                    return
                  try {
                    await revokeUserSessions(row.original.userId).unwrap()
                    toast.add({
                      type: "success",
                      description: "All SSO sessions revoked.",
                    })
                  } catch {
                    /* Caller reports errors. */
                  }
                }}
              >
                Revoke all user sessions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [pending, revokeSession, revokeUserSessions]
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {error && (
        <p role="alert" className="text-destructive">
          {error.message}
        </p>
      )}
      <DataTable
        columns={columns}
        data={query.data?.items ?? []}
        rowCount={query.data?.total ?? 0}
        pagination={table.pagination}
        onPaginationChange={table.setPagination}
        search={{
          placeholder: "Search user, email, IP or device...",
          value: table.searchInput,
          onValueChange: table.setSearchInput,
        }}
        getRowId={(row) => row.id}
        fluidColumn="userName"
        enableRowSelection={false}
        loading={query.isLoading || query.isFetching}
        loadingMessage={<TableLoading />}
        emptyMessage="No sessions found."
        onReload={() => void query.refetch()}
      />
    </div>
  )
}
