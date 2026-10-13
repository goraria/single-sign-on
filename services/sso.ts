import type { OAuthClientRedirectPolicy } from "@/schemas/sso"
import { isOAuthClientRedirectAllowed } from "@/services/oauth-client"

export async function getOAuthClientRedirectPolicy(input: OAuthClientRedirectPolicy) {
  return isOAuthClientRedirectAllowed(input.url, input.purpose)
}
