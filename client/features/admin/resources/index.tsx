"use client"

import { Database } from "@gorth/primitive/cores/lucide"
import { Badge } from "@gorth/primitive/custom/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@gorth/primitive/default/card"
import { useOAuthResourcesQuery } from "@/services/admin"

export function OAuthResources() {
  const query = useOAuthResourcesQuery(undefined)
  const resources = query.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">OAuth resources</h1>
        <p className="text-muted-foreground">Inspect registered audiences, scopes, and token policies.</p>
      </div>
      {query.error ? <p className="text-destructive">{query.error.message}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader className="flex-row items-start gap-3">
              <div className="bg-muted flex size-9 items-center justify-center rounded-md"><Database className="size-4" /></div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">{resource.name}</CardTitle>
                <p className="text-muted-foreground break-all text-sm">{resource.identifier}</p>
              </div>
              <Badge variant={resource.disabled ? "danger" : "success"}>{resource.disabled ? "Disabled" : "Enabled"}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div className="flex flex-wrap gap-2">
                {(resource.allowedScopes ?? []).map((scope) => <Badge key={scope} variant="outline">{scope}</Badge>)}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="text-muted-foreground">Access TTL:</span> {resource.accessTokenTtl ?? "Default"}</p>
                <p><span className="text-muted-foreground">Refresh TTL:</span> {resource.refreshTokenTtl ?? "Default"}</p>
                <p><span className="text-muted-foreground">Algorithm:</span> {resource.signingAlgorithm ?? "Default"}</p>
                <p><span className="text-muted-foreground">DPoP:</span> {resource.dpopBoundAccessTokensRequired ? "Required" : "Optional"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!query.isLoading && !resources.length ? <p className="text-muted-foreground">No OAuth resources.</p> : null}
    </div>
  )
}
