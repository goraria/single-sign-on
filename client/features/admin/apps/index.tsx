"use client"

import { useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Plus } from "@gorth/primitive/cores/lucide"
import {
  DataTable,
  DataTableColumnHeader,
} from "@gorth/primitive/custom/data-table"
import type { DataTableProps } from "@gorth/primitive/lib/utils/interface"
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
  type SsoApplication,
  useDeleteSsoApplicationMutation,
  useSsoApplicationsQuery,
} from "@/services/admin"
import { formatDate, getInitials } from "@/lib/utils/formatter"
import {
  applicationStates,
  renderApplicationStatus,
} from "@/lib/utils/renderer"

export function Applications() {
  const router = useRouter()
  const applicationsQuery = useSsoApplicationsQuery(undefined)
  const [deleteApplication, deleteResult] = useDeleteSsoApplicationMutation()
  const applications = applicationsQuery.data ?? []
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
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label="Select row"
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
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="rounded-md">
              <AvatarImage
                alt={`${row.original.name} logo`}
                className="rounded-md object-cover"
                src={row.original.icon ?? undefined}
              />
              <AvatarFallback className="rounded-md">
                {getInitials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() =>
                  router.push(`/admin/apps/edit/${row.original.id}`)
                }
                className="block max-w-full truncate text-left font-medium hover:underline"
              >
                {row.original.name}
              </button>
              <p className="text-muted-foreground truncate font-mono text-xs">
                {row.original.clientId}
              </p>
            </div>
          </div>
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
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">
            Manage the apps allowed to authenticate through Gorth SSO.
          </p>
        </div>
        <Button
          render={<Link href="/admin/apps/create" />}
          nativeButton={false}
        >
          <Plus className="size-4" />
          Create application
        </Button>
      </div>
      {error ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error.message}
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={applications}
        search={{ column: "name", placeholder: "Filter applications..." }}
        filters={[
          {
            column: "state",
            title: "Status",
            options: [...applicationStates],
          },
        ]}
        fluidColumn="name"
        getRowId={(application) => application.id}
        emptyMessage={
          applicationsQuery.isLoading
            ? "Loading applications..."
            : "No results."
        }
      />
    </div>
  )
}
