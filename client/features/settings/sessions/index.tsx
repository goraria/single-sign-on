"use client"

import { MonitorSmartphone, Trash2 } from "@gorth/primitive/cores/lucide"
import { Button } from "@gorth/primitive/custom/button"
import { Card, CardContent, CardHeader, CardTitle } from "@gorth/primitive/default/card"
import { toast } from "@gorth/primitive/default/toast"
import { formatDateTime } from "@/lib/utils/formatter"
import { useAccountSessionsQuery, useRevokeSessionMutation } from "@/services/account"

export function AccountSessions() {
  const query = useAccountSessionsQuery(undefined)
  const [revokeSession, mutation] = useRevokeSessionMutation()
  const sessions = query.data ?? []

  async function revoke(token: string) {
    try {
      await revokeSession(token).unwrap()
      toast.add({ type: "success", description: "Session revoked." })
    } catch (error) {
      toast.add({ type: "error", description: error instanceof Error ? error.message : "Unable to revoke session.", priority: "high" })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active sessions</h1>
        <p className="text-muted-foreground">Review devices signed in to your Gorth account.</p>
      </div>
      {query.error ? <p className="text-destructive">{query.error.message}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader className="flex-row items-start gap-3">
              <div className="bg-muted flex size-9 items-center justify-center rounded-md"><MonitorSmartphone className="size-4" /></div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">{session.ipAddress ?? "Unknown location"}</CardTitle>
                <p className="text-muted-foreground break-words text-sm">{session.userAgent ?? "Unknown device"}</p>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">Expires {formatDateTime(session.expiresAt)}</p>
              <Button variant="outline" disabled={mutation.isLoading} onClick={() => void revoke(session.token)}>
                <Trash2 className="size-4" /> Revoke
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {!query.isLoading && !sessions.length ? <p className="text-muted-foreground">No active sessions.</p> : null}
    </div>
  )
}
