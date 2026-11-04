export interface OAuthClientMigrationRecord {
  id: string
  client_id: string
  name: string | null
  uri: string | null
  redirect_uris: string[]
  post_logout_redirect_uris: string[] | null
  backchannel_logout_uri: string | null
  reference_id: string | null
  user_id: string | null
  public: boolean | null
  require_pkce: boolean | null
  token_endpoint_auth_method: string | null
  client_discovery_id: string | null
  scopes: string[] | null
  client_credentials_scopes: string[]
  metadata: Record<string, unknown> | null
}

export interface OAuthClientEnvironmentPatch {
  uri: string | null
  redirect_uris: string[]
  post_logout_redirect_uris: string[] | null
  backchannel_logout_uri: string | null
  reference_id: string
  metadata: Record<string, unknown>
}

export interface OAuthClientMigrationPlan {
  clientId: string
  patch: OAuthClientEnvironmentPatch
  local:
    (OAuthClientEnvironmentPatch & { client_id: string; name: string }) | null
}

function isLoopback(value: string) {
  const url = new URL(value)
  if (url.username || url.password || url.hash || value.includes("#"))
    throw new Error("unsafe_registered_url")
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    throw new Error("unsupported_registered_url")
  return local
}

export function planOAuthClientMigration(
  source: OAuthClientMigrationRecord,
  hasSecret: boolean,
  managementReference: string
): OAuthClientMigrationPlan | null {
  if (
    source.user_id ||
    !(
      source.reference_id === managementReference ||
      source.reference_id === `sso_application:${source.client_id}`
    )
  )
    return null
  if (!source.redirect_uris.length) throw new Error("client_redirect_required")
  const localRedirects = source.redirect_uris.filter(isLoopback)
  const productionRedirects = source.redirect_uris.filter(
    (url) => !isLoopback(url)
  )
  const mixed = localRedirects.length > 0 && productionRedirects.length > 0
  if (
    mixed &&
    (hasSecret ||
      !source.public ||
      !source.require_pkce ||
      source.token_endpoint_auth_method !== "none" ||
      source.client_discovery_id ||
      source.client_credentials_scopes.length)
  )
    throw new Error(
      "confidential_or_discovered_client_requires_separate_registration"
    )
  if (!source.scopes) throw new Error("explicit_scope_ceiling_required")

  function project(local: boolean): OAuthClientEnvironmentPatch {
    const redirects = local ? localRedirects : productionRedirects
    const origin = new URL(redirects[0]).origin
    if (!mixed && source.uri && isLoopback(source.uri) !== local)
      throw new Error("homepage_environment_mismatch")
    if (
      !mixed &&
      source.post_logout_redirect_uris?.some((url) => isLoopback(url) !== local)
    )
      throw new Error("logout_environment_mismatch")
    const uri =
      source.uri && isLoopback(source.uri) === local
        ? source.uri
        : mixed
          ? origin
          : source.uri
    let backchannel = source.backchannel_logout_uri
    if (backchannel && isLoopback(backchannel) !== local) {
      if (!mixed) throw new Error("backchannel_environment_mismatch")
      const old = new URL(backchannel)
      backchannel = new URL(old.pathname + old.search, origin).href
    }
    return {
      uri,
      redirect_uris: redirects,
      post_logout_redirect_uris:
        source.post_logout_redirect_uris?.filter(
          (url) => isLoopback(url) === local
        ) ?? null,
      backchannel_logout_uri: backchannel,
      reference_id: managementReference,
      metadata: {
        ...source.metadata,
        environment: local ? "local" : "production",
      },
    }
  }

  const patch = project(productionRedirects.length === 0)
  const local = mixed
    ? {
        ...project(true),
        client_id: source.client_id + "-local",
        name: `${source.name ?? source.client_id} (Local)`,
      }
    : null
  return { clientId: source.client_id, patch, local }
}
