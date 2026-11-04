"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gorth-io/primitive/default/card"
import { Input } from "@gorth-io/primitive/default/input"
import { Button } from "@gorth-io/primitive/custom/button"
import {
  useOAuthResourcesQuery,
  useOAuthClientResourcesQuery,
  useChangeOAuthClientResourceMutation,
} from "@/services/client/admin"

export function OAuthClientResources({ id }: { id: string }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const resources = useOAuthResourcesQuery({ page, limit: 10, search })
  const links = useOAuthClientResourcesQuery(id)
  const [change, result] = useChangeOAuthClientResourceMutation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Protected resources</CardTitle>
        <CardDescription>
          Link only the audiences this client needs. A link does not grant
          scopes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Input
          aria-label="Search resources"
          placeholder="Search resources"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
        {(resources.error ?? links.error ?? result.error) ? (
          <p role="alert">Unable to load or change resource access.</p>
        ) : null}
        {resources.data?.items.map((resource) => {
          const linked =
            links.data?.some(
              (link) => link.resourceIdentifier === resource.identifier
            ) ?? false
          return (
            <div
              key={resource.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p>{resource.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {resource.identifier}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={
                  !links.data ||
                  result.isLoading ||
                  (!linked && resource.disabled)
                }
                onClick={() => {
                  void change({ id, resourceId: resource.id, linked: !linked })
                    .unwrap()
                    .catch(() => undefined)
                }}
              >
                {linked ? "Unlink" : "Link"}
              </Button>
            </div>
          )
        })}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!resources.data || page * 10 >= resources.data.total}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
