"use client"

import { useMemo } from "react"
import {
  Ban,
  CheckCircle,
  MoreHorizontal,
  Plus,
  Shield,
  ShieldCheck,
  User,
  UserPlus,
} from "@gorth/primitive/cores/lucide"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@gorth/primitive/custom/avatar"
import { Badge } from "@gorth/primitive/custom/badge"
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
import { fakerUsers, type User as SsoUser } from "@/schemas/users"

const roles = [
  { value: "user", label: "User", icon: User },
  { value: "moderator", label: "Moderator", icon: ShieldCheck },
  { value: "administrator", label: "Administrator", icon: Shield },
] as const
const states = [
  { value: "verified", label: "Verified", icon: CheckCircle },
  { value: "unverified", label: "Unverified", icon: User },
  { value: "banned", label: "Banned", icon: Ban },
] as const

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
          <AvatarFallback>
            {row.original.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
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
    id: "state",
    accessorFn: (user) =>
      user.bannedUntil
        ? "banned"
        : user.emailVerified
          ? "verified"
          : "unverified",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        className={
          row.original.bannedUntil
            ? "text-destructive"
            : row.original.emailVerified
              ? "text-emerald-600"
              : "text-amber-600"
        }
      >
        {row.original.bannedUntil
          ? "Banned"
          : row.original.emailVerified
            ? "Verified"
            : "Unverified"}
      </Badge>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = roles.find((item) => item.value === row.original.role)
      return role ? (
        <span className="flex items-center gap-2">
          <role.icon className="text-muted-foreground size-4" />
          {role.label}
        </span>
      ) : null
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => row.original.createdAt.toLocaleDateString("en-US"),
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
  const data = useMemo(() => fakerUsers, [])

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
      <DataTable
        columns={columns}
        data={data}
        search={{ column: "name", placeholder: "Filter users..." }}
        filters={[
          { column: "state", title: "Status", options: [...states] },
          { column: "role", title: "Role", options: [...roles] },
        ]}
        fluidColumn="name"
        getRowId={(user) => user.id}
        emptyMessage="No results."
      />
    </div>
  )
}
