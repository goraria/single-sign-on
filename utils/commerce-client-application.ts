interface Registration {
  metadata: unknown
  scopes: string[] | null
  referenceId: string | null
}

/** Only centrally managed registry data can establish an application's namespace. */
export function resolveCommerceClientApplication(client: Registration) {
  if (client.referenceId !== "sso-administration") return null
  const metadata = client.metadata && typeof client.metadata === "object" && !Array.isArray(client.metadata)
    ? client.metadata as Record<string, unknown> : {}
  const candidates = (["marketplace", "restaurant"] as const).filter(app =>
    client.scopes?.some(scope => scope === `${app}:read` || scope === `${app}:write`))
  const explicit = metadata.commerceApplication ?? metadata.application
  if (explicit !== undefined && explicit !== null)
    return candidates.find(app => app === explicit) ?? null
  return candidates.length === 1 ? candidates[0]! : null
}
