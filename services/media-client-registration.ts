import "server-only"
import { eq, sql } from "drizzle-orm"
import { auth } from "@/lib/auth/server/index"
import { storageCredentialAudience } from "@/lib/auth/server/storage-access"
import { database } from "@/database"
import { oauthClient, oauthResource } from "@/database/schema"
import { createServiceError } from "@/services/helper"

// Operator-only provisioning. Better Auth creates/hashes the secret; never hand-roll it.
export async function registerMediaStorageClient(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  })
  if (!session?.user) throw createServiceError("unauthorized", 401)
  if (session.user.role !== "master") throw createServiceError("forbidden", 403)
  const existing = await database
    .select({ id: oauthClient.clientId })
    .from(oauthClient)
    .where(
      sql`${oauthClient.metadata}->>'purpose' = 'media-storage-credential-reader'`
    )
    .limit(1)
  if (existing.length)
    throw createServiceError("media_client_already_registered", 409)
  const identifier = storageCredentialAudience()
  const [resource] = await database
    .select({ identifier: oauthResource.identifier })
    .from(oauthResource)
    .where(eq(oauthResource.identifier, identifier))
    .limit(1)
  if (resource) {
    await auth.api.adminUpdateOAuthResource({
      headers,
      params: { identifier },
      body: {
        allowedScopes: ["storage:sso:credential"],
        accessTokenTtl: 120,
        disabled: false,
        dpopBoundAccessTokensRequired: false,
      },
    })
  } else {
    await auth.api.adminCreateOAuthResource({
      headers,
      body: {
        identifier,
        name: "SSO backend storage credentials",
        allowedScopes: ["storage:sso:credential"],
        accessTokenTtl: 120,
        metadata: { application: "sso", purpose: "storage-credential" },
      },
    })
  }
  const client = await auth.api.adminCreateOAuthClient({
    headers,
    body: {
      client_name: "Media storage credential reader",
      token_endpoint_auth_method: "client_secret_post",
      grant_types: ["client_credentials"],
      client_credentials_scopes: ["storage:sso:credential"],
      metadata: { purpose: "media-storage-credential-reader" },
    },
  })
  try {
    if (!client.client_secret)
      throw createServiceError("media_client_secret_missing", 503)
    await auth.api.adminLinkClientResource({
      headers,
      params: { identifier, client_id: client.client_id },
    })
  } catch {
    // A secret is not recoverable from its hash. Clean up failed provisioning
    // through Better Auth itself so a subsequent operator retry can succeed.
    try {
      await auth.api.deleteOAuthClient({
        headers,
        body: { client_id: client.client_id },
      })
    } catch {
      console.error("[media-client-registration]", { code: "cleanup_failed" })
    }
    throw createServiceError("media_client_registration_failed", 503)
  }
  // Returned once to the master operator, not to an upload/browser session.
  return {
    clientId: client.client_id,
    clientSecret: client.client_secret,
    resource: identifier,
  }
}
