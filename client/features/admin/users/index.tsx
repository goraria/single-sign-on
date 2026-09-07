"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "@gorth/primitive/cores/lucide"
import type {
  PaginationState,
  SortingState,
} from "@gorth/primitive/cores/tanstack/table"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@gorth/primitive/custom/avatar"
import { Button } from "@gorth/primitive/custom/button"
import { Checkbox } from "@gorth/primitive/default/checkbox"
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
import type { DataTableProps } from "@gorth/primitive/lib/utils/interface"
import { type AdminUser, useUsersQuery } from "@/services/admin"
import { formatDate, getInitials } from "@/lib/utils/formatter"
import {
  renderUserRole,
  renderUserStatus,
  userRoles,
  userStates,
} from "@/lib/utils/renderer"

const columns: DataTableProps<AdminUser>["columns"] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()
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
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage
            src={row.original.image ?? undefined}
            alt={row.original.name}
          />
          <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.name}</p>
          <p className="text-muted-foreground truncate text-xs">
            {row.original.email}
            {/* {row.original.id} */}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => renderUserRole(row.original.role),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: "state",
    accessorFn: (user) =>
      user.bannedUntil
        ? "banned"
        : user.emailVerified
          ? "verified"
          : "unverified",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => renderUserStatus(row.original),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => formatDate(row.original.createdAt),
    size: 120,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Modified" />
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
            <Button variant="ghost" size="icon" aria-label="User actions" />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={<Link href={`/admin/users/edit/${row.original.id}`} />}
          >
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50, // 64
  },
]

export function Users() {
  const router = useRouter()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ])
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [states, setStates] = useState<(string | number | boolean)[]>([])
  const [roles, setRoles] = useState<(string | number | boolean)[]>([])

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 }
    )
  }, [search, states, roles])

  const activeSort = sorting[0]
  const usersQuery = useUsersQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    state:
      states.length === 1
        ? (states[0] as "verified" | "unverified" | "banned")
        : undefined,
    role: roles.length === 1 ? (roles[0] as AdminUser["role"]) : undefined,
    sortBy: activeSort?.id as
      | "name"
      | "email"
      | "role"
      | "state"
      | "createdAt"
      | "updatedAt"
      | undefined,
    sortOrder: activeSort?.desc ? "desc" : "asc",
  })
  const data = usersQuery.data?.items ?? []
  const createUser = useCallback(() => {
    router.push("/admin/users/create")
  }, [router])
  const downloadUsers = useCallback(() => undefined, [])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 sm:gap-6">
      {usersQuery.error ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {usersQuery.error.message}
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={data}
        rowCount={usersQuery.data?.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        search={{
          placeholder: "Filter users...",
          value: searchInput,
          onValueChange: setSearchInput,
        }}
        filters={[
          {
            id: "state",
            title: "Status",
            options: [...userStates],
            value: states,
            onValueChange: setStates,
          },
          {
            id: "role",
            title: "Role",
            options: [...userRoles],
            value: roles,
            onValueChange: setRoles,
          },
        ]}
        fluidColumn="name"
        getRowId={(user) => user.id}
        loading={usersQuery.isLoading || usersQuery.isFetching}
        loadingMessage="Loading users..."
        emptyMessage="No results."
        onReload={() => void usersQuery.refetch()}
        onDownload={downloadUsers}
        onCreate={createUser}
      />
    </div>
  )
}
