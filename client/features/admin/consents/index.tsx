"use client"

import { ShieldCheck } from "@gorth/primitive/cores/lucide"
import { Badge } from "@gorth/primitive/custom/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@gorth/primitive/default/card"
import { formatDateTime } from "@/lib/utils/formatter"
import { useOAuthConsentsQuery } from "@/services/admin"

export function OAuthConsents() {
  const query = useOAuthConsentsQuery(undefined)
  const consents = query.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">OAuth consents</h1>
        <p className="text-muted-foreground">Review permissions granted by users to applications.</p>
      </div>
      {query.error ? <p className="text-destructive">{query.error.message}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {consents.map((consent) => (
          <Card key={consent.id}>
            <CardHeader className="flex-row items-start gap-3">
              <div className="bg-muted flex size-9 items-center justify-center rounded-md"><ShieldCheck className="size-4" /></div>
              <div className="min-w-0">
                <CardTitle className="text-base">{consent.clientName ?? consent.clientId}</CardTitle>
                <p className="text-muted-foreground truncate text-sm">{consent.userName ?? consent.userEmail ?? "Unknown user"}</p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">{consent.scopes.map((scope) => <Badge key={scope} variant="outline">{scope}</Badge>)}</div>
              <p className="text-muted-foreground text-sm">Updated {consent.updatedAt ? formatDateTime(consent.updatedAt) : "Unknown"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!query.isLoading && !consents.length ? <p className="text-muted-foreground">No OAuth consents.</p> : null}
    </div>
  )
}
