"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth-io/primitive/default/card"
import { Textarea } from "@gorth-io/primitive/default/textarea"
import { Button } from "@gorth-io/primitive/custom/button"
import {
  useOAuthScopeRegistryQuery,
  usePublishOAuthScopeMutation,
} from "@/services/client/admin"

export function OAuthScopes({ canPublish }: { canPublish: boolean }) {
  const registry = useOAuthScopeRegistryQuery()
  const [publish, result] = usePublishOAuthScopeMutation()
  const [draft, setDraft] = useState<string | null>(null)
  const latest = registry.data?.revisions[0]
  const value = draft ?? latest?.scopes.join("\n") ?? ""
  return (
    <Card>
      <CardHeader>
        <CardTitle>OAuth scope registry</CardTitle>
        <CardDescription>
          Active revision on this deployment:{" "}
          {registry.data?.active.revision ?? "…"}. Publishing requires master
          access and does not change the running provider.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <label htmlFor="oauth-scope-catalog">
          Supported scopes (one per line)
        </label>
        <Textarea
          id="oauth-scope-catalog"
          rows={16}
          readOnly={!canPublish}
          value={value}
          onChange={(event) => setDraft(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Latest published revision: {latest?.revision ?? "…"}. After
          publication, deploy all SSO instances with NEXT_OAUTH_SCOPE_REVISION
          set to the new revision. Existing scopes cannot be removed here.
        </p>
        {(registry.error ?? result.error) ? (
          <p role="alert">
            Unable to load or publish the registry. Check your role and refresh
            after conflicting changes.
          </p>
        ) : null}
        <Button
          disabled={!canPublish || !latest || result.isLoading}
          onClick={() => {
            if (!latest) return
            void publish({
              baseRevision: latest.revision,
              scopes: value.split(/\s+/).filter(Boolean),
            })
              .unwrap()
              .then(() => setDraft(null))
              .catch(() => undefined)
          }}
        >
          Publish next revision
        </Button>
      </CardContent>
    </Card>
  )
}
