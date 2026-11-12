export interface LocalOAuthApplication {
  clientId: string
  origin: string
  scope: string
  resources: string[]
}

const serviceResources = Array.from(
  { length: 7 },
  (_, i) => `http://localhost:${5052 + i}`
)
export const localOAuthApplications: LocalOAuthApplication[] = [
  {
    clientId: "gorth-interactive-messaging-portal-local",
    origin: "http://localhost:3030",
    scope: "chat",
    resources: serviceResources,
  },
  {
    clientId: "gorth-video-streaming-platform-local",
    origin: "http://localhost:3031",
    scope: "video",
    resources: serviceResources,
  },
  {
    clientId: "gorth-content-reader-platform-local",
    origin: "http://localhost:3032",
    scope: "reader",
    resources: serviceResources,
  },
  {
    clientId: "gorth-social-networking-portal-local",
    origin: "http://localhost:3033",
    scope: "social",
    resources: serviceResources,
  },
  {
    clientId: "gorth-task-productivity-suite-local",
    origin: "http://localhost:3034",
    scope: "task",
    resources: serviceResources,
  },
  {
    clientId: "gorth-online-marketplace-solution-local",
    origin: "http://localhost:3035",
    scope: "marketplace",
    resources: [...serviceResources, "http://localhost:5059"],
  },
]

export interface LocalOAuthClientRecord {
  client_id: string
  redirect_uris: string[]
  scopes: string[] | null
  disabled: boolean | null
  public: boolean | null
  require_pkce: boolean | null
  token_endpoint_auth_method: string | null
  environment: string | null
  has_secret: boolean
}
export interface LocalOAuthResourceRecord {
  identifier: string
  disabled: boolean
  allowed_scopes: string[] | null
}
export interface LocalOAuthLink {
  client_id: string
  resource_id: string
}

// An operator migration manifest, never a runtime client-ID fallback. Client IDs
// remain explicit configuration and production registrations are not modified.
export function planLocalOAuthResources(
  clients: LocalOAuthClientRecord[],
  resources: LocalOAuthResourceRecord[],
  links: LocalOAuthLink[]
) {
  const additions: LocalOAuthLink[] = []
  const policy = new Map<string, Set<string>>()
  for (const app of localOAuthApplications) {
    const client = clients.find((c) => c.client_id === app.clientId)
    if (
      !client ||
      client.disabled ||
      !client.public ||
      !client.require_pkce ||
      client.has_secret ||
      client.token_endpoint_auth_method !== "none" ||
      client.environment !== "local"
    )
      throw new Error(`local_client_requires_review:${app.clientId}`)
    if (
      !client.redirect_uris.includes(app.origin + "/auth/callback/gorth") ||
      client.redirect_uris.some((uri) => new URL(uri).origin !== app.origin)
    )
      throw new Error(`local_callback_requires_review:${app.clientId}`)
    const scopes = [`${app.scope}:read`, `${app.scope}:write`]
    if (!scopes.every((s) => client.scopes?.includes(s)))
      throw new Error(`client_scope_requires_review:${app.clientId}`)
    for (const identifier of [app.origin, ...app.resources]) {
      const resource = resources.find((r) => r.identifier === identifier)
      if (!resource || resource.disabled)
        throw new Error(`resource_requires_review:${identifier}`)
      if (resource.allowed_scopes !== null) {
        const missing = scopes.filter(
          (s) => !resource.allowed_scopes!.includes(s)
        )
        if (missing.length) {
          const extra = policy.get(identifier) ?? new Set<string>()
          missing.forEach((s) => extra.add(s))
          policy.set(identifier, extra)
        }
      }
      if (
        !links.some(
          (l) => l.client_id === app.clientId && l.resource_id === identifier
        )
      )
        additions.push({ client_id: app.clientId, resource_id: identifier })
    }
  }
  return {
    links: additions,
    policies: [...policy].map(([identifier, addedScopes]) => ({
      identifier,
      addedScopes: [...addedScopes].sort(),
    })),
  }
}
