"use client"

import type { ColumnDef } from "@gorth/primitive/cores/tanstack/table"
import { Subscribe } from "@gorth/primitive/cores/tanstack/table"
import {
  addMinutes,
  differenceInCalendarDays,
  endOfToday,
  format,
  parseISO,
} from "date-fns"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  Clock3Icon,
  LoaderIcon,
} from "@gorth/primitive/cores/lucide"

import { NavIdentity } from "@gorth/primitive/dashboard/nav-user"
import { Badge } from "@gorth/primitive/custom/badge"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import type { DataTableFeatures } from "@/utils/data-table-features"

import type { RecentCustomerRow } from "./schema"

function billingIcon(billing: string) {
  switch (billing) {
    case "Paid":
      return (
        <CircleCheckIcon className="fill-green-500 stroke-primary-foreground dark:fill-green-600" />
      )
    case "Pending":
      return <LoaderIcon />
    case "Overdue":
      return <CircleAlertIcon className="text-amber-600 dark:text-amber-500" />
    case "Trial":
      return <Clock3Icon className="text-muted-foreground" />
    default:
      return null
  }
}

export const recentCustomersColumns: ColumnDef<
  DataTableFeatures,
  RecentCustomerRow
>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Subscribe source={table.atoms.rowSelection}>
          {() => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={
                !table.getIsAllPageRowsSelected() &&
                table.getIsSomePageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(value)
              }
              aria-label="Select all customers on this page"
            />
          )}
        </Subscribe>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Subscribe
          source={row.table.atoms.rowSelection}
          selector={(selection) => Boolean(selection?.[row.id])}
        >
          {(checked) => (
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => row.toggleSelected(value)}
              aria-label={`Select ${row.original.name}`}
            />
          )}
        </Subscribe>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => (
      <NavIdentity
        user={{ name: row.original.name }}
        description={`#${row.original.id}`}
        hover
        tooltip
      />
    ),
    enableHiding: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.id} ${row.name} ${row.email}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "billing",
    header: "Billing",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {billingIcon(row.original.billing)}
        {row.original.billing}
      </Badge>
    ),
  },
  {
    accessorKey: "plan",
    header: "Plan",
    cell: ({ row }) => <span className="text-sm">{row.original.plan}</span>,
  },
  {
    id: "joinedWindow",
    accessorFn: (row) => {
      const daysSinceJoined = differenceInCalendarDays(
        endOfToday(),
        parseISO(row.joined)
      )

      if (daysSinceJoined <= 30) return ["30", "90"]
      if (daysSinceJoined <= 90) return ["90"]
      return []
    },
    filterFn: "arrIncludes",
    enableHiding: true,
  },
  {
    accessorKey: "joined",
    header: "Joined",
    cell: ({ row }) => {
      const baseDate = parseISO(row.original.joined)
      const joinedAt = addMinutes(
        baseDate,
        9 * 60 + (Number(row.original.id) % 12) * 17
      )

      return (
        <div className="grid gap-0.5">
          <span className="text-sm">{format(joinedAt, "do MMMM yyyy")}</span>
          <span className="text-muted-foreground text-xs">
            at {format(joinedAt, "h:mm a")}
          </span>
        </div>
      )
    },
  },
]
