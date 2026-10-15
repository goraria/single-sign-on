import "server-only"
import { and, eq, sql } from "drizzle-orm"
import { database } from "@/database"
import { isProduction } from "@/utils/environment"
import {
  oauthClient,
  oauthClientResource,
  oauthResource,
} from "@/database/schema"

// Registry decisions are persisted. Never silently create clients/resources
// or grant scopes from environment during a request.
export async function getSsoMediaRegistration() {
  const registrations = await database
    .select({
      identifier: oauthResource.identifier,
      clientDisabled: oauthClient.disabled,
      scopes: oauthClient.scopes,
      resourceDisabled: oauthResource.disabled,
      allowedScopes: oauthResource.allowedScopes,
      ttl: oauthResource.accessTokenTtl,
      algorithm: oauthResource.signingAlgorithm,
      keyId: oauthResource.signingKeyId,
      dpopRequired: oauthResource.dpopBoundAccessTokensRequired,
    })
    .from(oauthClient)
    .innerJoin(
      oauthClientResource,
      eq(oauthClientResource.clientId, oauthClient.clientId)
    )
    .innerJoin(
      oauthResource,
      eq(oauthResource.identifier, oauthClientResource.resourceId)
    )
    .where(
      and(
        eq(oauthClient.clientId, "gorth-single-sign-on"),
        sql`${oauthResource.metadata}->>'application' = 'shared-media-storage'`
      )
    )
    .limit(2)
  const [registration] = registrations
  if (
    registrations.length !== 1 ||
    !registration ||
    registration.clientDisabled ||
    registration.resourceDisabled ||
    registration.dpopRequired ||
    !["openid", "profile", "email", "sso:read", "sso:write"].every((scope) =>
      registration.scopes?.includes(scope)
    ) ||
    !["sso:read", "sso:write"].every((scope) =>
      registration.allowedScopes?.includes(scope)
    )
  ) {
    throw new Error("sso_media_registration_required")
  }
  // The resource identifier is both the destination and exact JWT audience.
  // Never select by display name, first matching row or an environment fallback.
  const endpoint = new URL(registration.identifier)
  if (
    registration.identifier !== endpoint.origin ||
    !(
      endpoint.protocol === "https:" ||
      (!isProduction &&
        endpoint.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname))
    )
  )
    throw new Error("invalid_media_resource_identifier")
  const algorithm = registration.algorithm
  if (
    algorithm !== null &&
    algorithm !== "RS256" &&
    algorithm !== "ES256" &&
    algorithm !== "EdDSA"
  ) {
    throw new Error("unsupported_media_signing_policy")
  }
  const ttl = registration.ttl === null ? 120 : Math.min(120, registration.ttl)
  if (ttl < 1) throw new Error("invalid_media_token_lifetime")
  return {
    identifier: registration.identifier,
    ttl,
    algorithm,
    keyId: registration.keyId,
  } as const
}
