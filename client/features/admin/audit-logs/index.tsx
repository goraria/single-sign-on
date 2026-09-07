import { ClipboardList } from "@gorth/primitive/cores/lucide"
import { Card, CardContent, CardHeader, CardTitle } from "@gorth/primitive/default/card"

export function AuditLogs() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit logs</h1>
        <p className="text-muted-foreground">Track authentication and administrative security events.</p>
      </div>
      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <div className="bg-muted flex size-9 items-center justify-center rounded-md"><ClipboardList className="size-4" /></div>
          <CardTitle className="text-base">Audit storage is not configured</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          This page is ready for event data. Add an append-only audit event store before recording security-sensitive actions.
        </CardContent>
      </Card>
    </div>
  )
}
