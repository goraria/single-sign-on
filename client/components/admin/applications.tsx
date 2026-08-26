"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Ban,
  CheckCircle,
  MoreHorizontal,
  Plus,
} from "@gorth/primitive/cores/lucide"
import {
  DataTable,
  DataTableColumnHeader,
} from "@gorth/primitive/custom/data-table"
import type { DataTableProps } from "@gorth/primitive/lib/utils/interface"
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
  deleteSsoApplication,
  listSsoApplications,
  type SsoApplication,
} from "@/services/administrator"

const applicationStates = [
  { value: "enabled", label: "Enabled", icon: CheckCircle },
  { value: "disabled", label: "Disabled", icon: Ban },
]

export function Applications() {
  const router = useRouter()
  const [applications, setApplications] = useState<SsoApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listSsoApplications()
      .then((items) => {
        if (active) setApplications(items)
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load applications"
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const remove = async (application: SsoApplication) => {
    if (
      !window.confirm(
        `Delete ${application.name}? Existing grants will be revoked.`
      )
    )
      return
    try {
      await deleteSsoApplication(application.id)
      setApplications((current) =>
        current.filter((item) => item.id !== application.id)
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to delete application"
      )
    }
  }

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
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => router.push(`/admin/apps/edit/${row.original.id}`)}
            className="text-left font-medium hover:underline"
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: "clientId",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Client ID" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.clientId}</span>
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
      },
      {
        id: "state",
        accessorFn: (application) =>
          application.disabled ? "disabled" : "enabled",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.disabled ? "text-destructive" : "text-emerald-600"
            }
          >
            {row.original.disabled ? "Disabled" : "Enabled"}
          </Badge>
        ),
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        cell: ({ row }) =>
          new Date(row.original.updatedAt).toLocaleDateString("en-US"),
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
      },
    ],
    [router]
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
          {error}
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={applications}
        search={{ column: "name", placeholder: "Filter applications..." }}
        filters={[
          { column: "state", title: "Status", options: applicationStates },
        ]}
        fluidColumn="name"
        getRowId={(application) => application.id}
        emptyMessage={loading ? "Loading applications..." : "No results."}
      />
    </div>
  )
}
