"use client"

import type { ReactNode } from "react"
import { Badge } from "@gorth/primitive/custom/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@gorth/primitive/default/dialog"
import type { OAuthResource, SsoApplication } from "@/services/client/admin"
import { ServiceOverview } from "@/features/admin/oauth/resource/service-overview"
import { getOAuthResourceService } from "@/utils/client/oauth"
import { formatDate } from "@/utils/client/formatter"

function Details({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map(({ label, value }) => (
        <div key={label} className="min-w-0 space-y-1">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm wrap-anywhere">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Scopes({ values }: { values: string[] | null }) {
  return values === null ? (
    <span>No resource-specific restriction</span>
  ) : (
    <div className="flex flex-wrap gap-1">
      {values.length
        ? values.map((scope) => (
            <Badge key={scope} variant="outline">
              {scope}
            </Badge>
          ))
        : "None"}
    </div>
  )
}

export function OAuthClientDetails({
  application,
  onClose,
}: {
  application: SsoApplication | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={Boolean(application)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {application ? (
        <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{application.name}</DialogTitle>
            <DialogDescription className="wrap-anywhere">
              {application.clientId}
            </DialogDescription>
          </DialogHeader>
          <Details
            items={[
              { label: "Description", value: application.description ?? "—" },
              { label: "Homepage", value: application.homepageUrl ?? "—" },
              {
                label: "Status",
                value: application.disabled ? "Disabled" : "Enabled",
              },
              {
                label: "Client type",
                value: application.public ? "Public" : "Confidential",
              },
              {
                label: "Authentication method",
                value: application.tokenEndpointAuthMethod,
              },
              {
                label: "PKCE",
                value: application.requirePKCE ? "Required" : "Optional",
              },
              {
                label: "Consent",
                value: application.skipConsent ? "Skipped" : "Required",
              },
              {
                label: "Scopes",
                value: <Scopes values={application.scopes} />,
              },
              {
                label: "Grant types",
                value: application.grantTypes.join(", "),
              },
              {
                label: "Response types",
                value: application.responseTypes.join(", "),
              },
              {
                label: "Redirect URIs",
                value: application.redirectUris.map((uri) => (
                  <p key={uri}>{uri}</p>
                )),
              },
              {
                label: "Post logout redirect URIs",
                value: application.postLogoutRedirectUris.length
                  ? application.postLogoutRedirectUris.map((uri) => (
                      <p key={uri}>{uri}</p>
                    ))
                  : "None",
              },
              { label: "Created", value: formatDate(application.createdAt) },
              { label: "Updated", value: formatDate(application.updatedAt) },
            ]}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

export function OAuthResourceDetails({
  resource,
  onClose,
}: {
  resource: OAuthResource | null
  onClose: () => void
}) {
  const service = resource ? getOAuthResourceService(resource) : undefined
  return (
    <Dialog
      open={Boolean(resource)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {resource ? (
        <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{resource.name}</DialogTitle>
            <DialogDescription className="wrap-anywhere">
              {resource.identifier}
            </DialogDescription>
          </DialogHeader>
          <Details
            items={[
              {
                label: "Status",
                value: resource.disabled ? "Disabled" : "Enabled",
              },
              {
                label: "Allowed scopes",
                value: <Scopes values={resource.allowedScopes} />,
              },
              {
                label: "Access token TTL",
                value:
                  resource.accessTokenTtl === null
                    ? "Provider default"
                    : `${resource.accessTokenTtl}s`,
              },
              {
                label: "Refresh token TTL",
                value:
                  resource.refreshTokenTtl === null
                    ? "Provider default"
                    : `${resource.refreshTokenTtl}s`,
              },
              {
                label: "Signing algorithm",
                value: resource.signingAlgorithm ?? "Provider default",
              },
              {
                label: "Signing key ID",
                value: resource.signingKeyId ?? "Provider default",
              },
              {
                label: "DPoP",
                value: resource.dpopBoundAccessTokensRequired
                  ? "Required"
                  : "Optional",
              },
              { label: "Policy version", value: resource.policyVersion },
              { label: "Created", value: formatDate(resource.createdAt) },
              { label: "Updated", value: formatDate(resource.updatedAt) },
            ]}
          />
          {service ? <ServiceOverview slug={service.slug} /> : null}
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
