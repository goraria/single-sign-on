"use client"

import { useMemo } from "react"
import { faker } from "@faker-js/faker"
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Circle,
  CircleCheck,
  CircleOff,
  Download,
  HelpCircle,
  MoreHorizontal,
  Plus,
  Timer,
} from "@gorth/primitive/cores/lucide"
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

const statuses = [
  { value: "backlog", label: "Backlog", icon: HelpCircle },
  { value: "todo", label: "Todo", icon: Circle },
  { value: "in progress", label: "In Progress", icon: Timer },
  { value: "done", label: "Done", icon: CircleCheck },
  { value: "canceled", label: "Canceled", icon: CircleOff },
] as const
const priorities = [
  { value: "low", label: "Low", icon: ArrowDown },
  { value: "medium", label: "Medium", icon: ArrowRight },
  { value: "high", label: "High", icon: ArrowUp },
] as const
const labels = ["bug", "feature", "documentation"] as const

type Task = {
  id: string
  title: string
  status: (typeof statuses)[number]["value"]
  priority: (typeof priorities)[number]["value"]
  label: (typeof labels)[number]
}

faker.seed(12345)
const tasks: Task[] = Array.from({ length: 100 }, () => ({
  id: `TASK-${faker.number.int({ min: 1000, max: 9999 })}`,
  title: faker.lorem.sentence({ min: 5, max: 15 }),
  status: faker.helpers.arrayElement(statuses).value,
  priority: faker.helpers.arrayElement(priorities).value,
  label: faker.helpers.arrayElement(labels),
}))

const columns: DataTableProps<Task>["columns"] = [
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
    accessorKey: "id",
    header: "Task",
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <Badge>{row.original.label}</Badge>
        <span className="truncate font-medium">{row.original.title}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const item = statuses.find(
        (status) => status.value === row.original.status
      )
      return item ? (
        <span className="flex items-center gap-2">
          <item.icon className="text-muted-foreground size-4" />
          {item.label}
        </span>
      ) : null
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const item = priorities.find(
        (priority) => priority.value === row.original.priority
      )
      return item ? (
        <span className="flex items-center gap-2">
          <item.icon className="text-muted-foreground size-4" />
          {item.label}
        </span>
      ) : null
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Task actions" />
          }
        >
          <MoreHorizontal className="mr-2 size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50, // 64
  },
]

export function Tasks() {
  const data = useMemo(() => tasks, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Here&apos;s a list of your tasks for this month!
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <span>Import</span>
            <Download className="size-4" />
          </Button>
          <Button>
            <span>Create</span>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data}
        search={{
          column: "title",
          placeholder: "Filter by title or ID...",
        }}
        filters={[
          { column: "status", title: "Status", options: [...statuses] },
          { column: "priority", title: "Priority", options: [...priorities] },
        ]}
        fluidColumn="title"
        getRowId={(task) => task.id}
        emptyMessage="No results."
      />
    </div>
  )
}
