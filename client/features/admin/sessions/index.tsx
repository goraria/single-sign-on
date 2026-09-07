"use client"

import { MonitorSmartphone } from "@gorth/primitive/cores/lucide"
import { Card, CardContent, CardHeader, CardTitle } from "@gorth/primitive/default/card"
import { formatDateTime } from "@/lib/utils/formatter"
import { useAdminSessionsQuery } from "@/services/admin"

export function AdminSessions() {
  const query = useAdminSessionsQuery(undefined)
  const sessions = query.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground">Review active sessions across the identity service.</p>
      </div>
      {query.error ? <p className="text-destructive">{query.error.message}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader className="flex-row items-start gap-3">
              <div className="bg-muted flex size-9 items-center justify-center rounded-md">
                <MonitorSmartphone className="size-4" />
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{session.userName}</CardTitle>
                <p className="text-muted-foreground truncate text-sm">{session.userEmail}</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <p><span className="text-muted-foreground">IP:</span> {session.ipAddress ?? "Unknown"}</p>
              <p><span className="text-muted-foreground">Expires:</span> {formatDateTime(session.expiresAt)}</p>
              <p className="sm:col-span-2 break-words"><span className="text-muted-foreground">Agent:</span> {session.userAgent ?? "Unknown"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!query.isLoading && !sessions.length ? <p className="text-muted-foreground">No active sessions.</p> : null}
    </div>
  )
}
