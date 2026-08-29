"use client"

import { MoreHorizontal, Plus, UserPlus } from "@gorth/primitive/cores/lucide"
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
import type { User as SsoUser } from "@/schemas/users"
import { useUsersQuery } from "@/services/admin"
import { formatDate, getInitials } from "@/lib/utils/formatter"
import {
  renderUserRole,
  renderUserStatus,
  userRoles,
  userStates,
} from "@/lib/utils/renderer"

const columns: DataTableProps<SsoUser>["columns"] = [
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
    header: "Role",
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
    header: "Status",
    cell: ({ row }) => renderUserStatus(row.original),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="User actions" />
          }
        >
          <MoreHorizontal className="mr-2 size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Ban user</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50, // 64
  },
]

export function Users() {
  const usersQuery = useUsersQuery(undefined)
  const data = usersQuery.data ?? []

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User List</h1>
          <p className="text-muted-foreground">
            Manage your users and their roles here.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <UserPlus className="size-4" />
            Invite User
          </Button>
          <Button>
            <Plus className="size-4" />
            Add User
          </Button>
        </div>
      </div>
      {usersQuery.error ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {usersQuery.error.message}
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={data}
        search={{ column: "name", placeholder: "Filter users..." }}
        filters={[
          { column: "state", title: "Status", options: [...userStates] },
          { column: "role", title: "Role", options: [...userRoles] },
        ]}
        fluidColumn="name"
        getRowId={(user) => user.id}
        emptyMessage={usersQuery.isLoading ? "Loading users..." : "No results."}
      />
    </div>
  )
}
