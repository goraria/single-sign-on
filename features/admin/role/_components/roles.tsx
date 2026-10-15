"use client"

import { AlertTriangle, ChevronRight } from "@gorth/primitive/cores/lucide"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@gorth/primitive/default/alert"
import { Button } from "@gorth/primitive/custom/button"
import { DataTable } from "@gorth/primitive/custom/data-table"
import { toast } from "@gorth/primitive/custom/toast"
import { useLocalDataTable } from "@/hooks/use-local-data-table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@gorth/primitive/custom/tabs"
import { rolesColumns } from "./roles-table/columns"
import type { Role } from "./roles-table/data"

export function Roles({
  roles,
  readOnly = false,
}: {
  roles: Role[]
  readOnly?: boolean
}) {
  const columns = readOnly
    ? rolesColumns.filter((column) => column.id !== "actions")
    : rolesColumns
  const table = useLocalDataTable({ data: roles, columns, initialPageSize: 12 })

  function explainDemoAction(action: string) {
    toast.add({
      type: "info",
      description: `${action} is not connected yet. This role list is a demo and does not change SSO permissions.`,
    })
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <Tabs className="gap-4" defaultValue="roles">
        <TabsList className="w-full justify-start gap-2 border-b ps-0 *:data-[slot=tabs-trigger]:flex-none">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          {!readOnly && (
            <>
              <TabsTrigger value="permission-sets">Permission sets</TabsTrigger>
              <TabsTrigger value="access-reviews">Access reviews</TabsTrigger>
            </>
          )}
        </TabsList>
        <TabsContent value="roles">
          <div className="flex min-w-0 flex-col gap-4">
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
              <AlertTriangle className="size-4" />
              <AlertTitle>Role preview</AlertTitle>
              <AlertDescription>
                Demo only. This screen does not change SSO access permissions.
              </AlertDescription>
            </Alert>
            <DataTable
              {...table.props}
              nav={{
                name: "Roles & Permissions",
                description: readOnly
                  ? "Preview the role for this dashboard."
                  : "Manage access roles and permissions across your organization.",
              }}
              labels={{ import: "Import JSON", add: "Create role" }}
              onImport={
                readOnly ? undefined : () => explainDemoAction("Import JSON")
              }
              onCreate={
                readOnly ? undefined : () => explainDemoAction("Create role")
              }
              render={
                !readOnly && (
                  <Button
                    variant="outline"
                    onClick={() => explainDemoAction("Review changes")}
                  >
                    Review changes
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                )
              }
              columns={columns}
              search={table.search("role", "Search roles...")}
              filters={[
                table.filter("group", "Type", [
                  { label: "System", value: "System roles" },
                  { label: "Custom", value: "Custom roles" },
                ]),
                table.filter(
                  "owner",
                  "Owner",
                  [...new Set(roles.map((role) => role.owner))].map(
                    (owner) => ({ label: owner, value: owner })
                  )
                ),
                table.filter("status", "Status", [
                  { label: "Active", value: "Active" },
                  { label: "Needs review", value: "Needs review" },
                ]),
              ]}
              pageSizeOptions={[12, 24, 48]}
              fluidColumn="permissionSets"
              getRowId={(role) => role.role}
              enableRowSelection={false}
              emptyMessage="No roles found."
            />
          </div>
        </TabsContent>
        {!readOnly && (
          <>
            <TabsContent value="permission-sets">
              <div className="flex items-center justify-center rounded-md border border-dashed p-6 text-muted-foreground text-sm">
                Permission Sets Coming Soon
              </div>
            </TabsContent>
            <TabsContent value="access-reviews">
              <div className="flex items-center justify-center rounded-md border border-dashed p-6 text-muted-foreground text-sm">
                Access Reviews Coming Soon
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
