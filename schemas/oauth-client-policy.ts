import { HTTPException } from "hono/http-exception"

interface OAuthClientEnvironment {
  requirePKCE?: boolean | null
  clientCredentialsScopes?: string[]
  tokenEndpointAuthMethod?: string | null
  environment?: "local" | "production"
  homepageUrl?: string | null
  redirectUris: string[]
  postLogoutRedirectUris?: string[] | null
  backchannelLogoutUri?: string | null
}

export function assertOAuthClientEnvironment(input: OAuthClientEnvironment) {
  if (input.tokenEndpointAuthMethod === "none" && input.requirePKCE === false)
    throw new HTTPException(400, { message: "public_client_requires_pkce" })
  if (
    input.clientCredentialsScopes?.length &&
    input.tokenEndpointAuthMethod === "none"
  )
    throw new HTTPException(400, {
      message: "machine_scopes_require_confidential_client",
    })
  const environment = input.environment ?? "production"
  const urls = [
    input.homepageUrl,
    ...input.redirectUris,
    ...(input.postLogoutRedirectUris ?? []),
    input.backchannelLogoutUri,
  ].filter((value): value is string => Boolean(value))
  for (const value of urls) {
    const url = new URL(value)
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    if (
      local !== (environment === "local") ||
      (!local && url.protocol !== "https:")
    )
      throw new HTTPException(400, {
        message: "oauth_client_environment_mismatch",
      })
  }
}
