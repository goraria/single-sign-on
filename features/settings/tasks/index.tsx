"use client"

import { faker } from "@faker-js/faker"
import { MoreHorizontal } from "@gorth/primitive/cores/lucide"
import { toast } from "@gorth/primitive/custom/toast"
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
import type { DataTableProps } from "@gorth/primitive/utils/interface"
import { useLocalDataTable } from "@/hooks/use-local-data-table"
import {
  renderTaskPriority,
  renderTaskStatus,
  taskLabels,
  taskPriorities,
  taskStatuses,
} from "@/utils/renderer"

type Task = {
  id: string
  title: string
  status: (typeof taskStatuses)[number]["value"]
  priority: (typeof taskPriorities)[number]["value"]
  label: (typeof taskLabels)[number]
}

faker.seed(12345)
const tasks: Task[] = Array.from({ length: 100 }, () => ({
  id: `TASK-${faker.number.int({ min: 1000, max: 9999 })}`,
  title: faker.lorem.sentence({ min: 5, max: 15 }),
  status: faker.helpers.arrayElement(taskStatuses).value,
  priority: faker.helpers.arrayElement(taskPriorities).value,
  label: faker.helpers.arrayElement(taskLabels),
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
    filterFn: (row, _id, value) =>
      `${row.original.id} ${row.original.title}`
        .toLowerCase()
        .includes(String(value).trim().toLowerCase()),
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
    cell: ({ row }) => renderTaskStatus(row.original.status),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => renderTaskPriority(row.original.priority),
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
  const table = useLocalDataTable({ data: tasks, columns })

  function explainDemoAction(action: string) {
    toast.add({
      type: "info",
      description: `${action} is not connected yet. This task list uses demo data.`,
    })
  }

  function exportTasks() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" })
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "demo-tasks.json"
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
      <DataTable
        {...table.props}
        feat="default"
        nav={{
          name: "Tasks",
          description: "Here's a list of your tasks for this month!",
        }}
        labels={{ add: "Add Task" }}
        // Primitive owns the column menu; this callback enables its trigger.
        onToggle={() => undefined}
        onImport={() => explainDemoAction("Import")}
        onDownload={exportTasks}
        onCreate={() => explainDemoAction("Add Task")}
        columns={columns}
        search={table.search("title", "Filter by title or ID...")}
        filters={[
          table.filter("status", "Status", [...taskStatuses]),
          table.filter("priority", "Priority", [...taskPriorities]),
        ]}
        fluidColumn="title"
        getRowId={(task) => task.id}
        emptyMessage="No results."
      />
    </div>
  )
}
