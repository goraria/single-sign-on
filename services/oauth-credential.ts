import "server-only"
import { and, eq, isNull, sql } from "drizzle-orm"
import { database } from "@/database"
import { oauthClient, oauthClientResource } from "@/database/schema"
import { getAuth } from "@/lib/auth/server"
import {
  checkSsoApplicationExists,
  createServiceError,
} from "@/services/helper"
import { oauthManagementReference } from "@/utils/oauth-management"

export async function rotateSsoApplicationCredential(
  id: string,
  headers: Headers
) {
  const current = await checkSsoApplicationExists(id)
  const replacingPost = current.tokenEndpointAuthMethod === "client_secret_post"
  if (
    current.referenceId !== oauthManagementReference ||
    current.public ||
    (!replacingPost && current.tokenEndpointAuthMethod !== "client_secret_basic")
  )
    throw createServiceError("managed_confidential_client_required", 403)
  const auth = await getAuth()
  const [credential] = await database
    .select({
      present: sql<boolean>`${oauthClient.clientSecret} IS NOT NULL AND ${oauthClient.clientSecret}<>''`,
    })
    .from(oauthClient)
    .where(eq(oauthClient.id, id))
    .limit(1)
  if (!credential) throw createServiceError("client_not_found", 404)
  if (credential.present && !replacingPost) {
    const result = await auth.api.rotateClientSecret({
      headers,
      body: { client_id: current.clientId },
    })
    return {
      id,
      clientId: result.client_id,
      clientSecret: result.client_secret,
    }
  }
  // Register a disabled draft through the provider. Never invent a secret/hash
  // to make a registry draft look like an already provisioned OAuth client.
  if (!replacingPost && !current.disabled)
    throw createServiceError("disable_unprovisioned_client_first", 409)
  if (
    !replacingPost && ((current.clientId !== "gorth-media-storage" &&
      !(current.metadata && typeof current.metadata === "object" &&
        (current.metadata as Record<string, unknown>).registryDraft === true)) ||
    current.grantTypes?.length !== 1 ||
    current.grantTypes[0] !== "client_credentials")
  )
    throw createServiceError("native_machine_registration_draft_required", 409)
  const links = await database
    .select({ identifier: oauthClientResource.resourceId })
    .from(oauthClientResource)
    .where(eq(oauthClientResource.clientId, current.clientId))
  const claimed = await database
    .update(oauthClient)
    .set({
      metadata: sql`coalesce(${oauthClient.metadata},'{}'::jsonb)||'{"credentialProvisioning":true}'::jsonb`,
    })
    .where(
      and(
        eq(oauthClient.id, id),
        ...(!replacingPost ? [eq(oauthClient.disabled, true), isNull(oauthClient.clientSecret)] : []),
        sql`coalesce(${oauthClient.metadata}->>'credentialProvisioning','false')<>'true'`
      )
    )
    .returning({ id: oauthClient.id })
  if (!claimed.length)
    throw createServiceError("credential_provisioning_in_progress", 409)
  let created:
    Awaited<ReturnType<typeof auth.api.adminCreateOAuthClient>> | undefined
  try {
    created = await auth.api.adminCreateOAuthClient({
      headers,
      body: {
        client_name: current.name ?? current.clientId,
        token_endpoint_auth_method: "client_secret_basic",
        grant_types: current.grantTypes ?? ["client_credentials"],
        response_types: current.responseTypes ?? [],
        scope: (current.scopes ?? []).join(" "),
        client_credentials_scopes: current.clientCredentialsScopes,
        resources: links.map((r) => r.identifier),
        require_pkce: current.requirePKCE ?? true,
        ...(current.uri ? { client_uri: current.uri } : {}),
        ...(current.icon ? { logo_uri: current.icon } : {}),
        ...(current.postLogoutRedirectUris?.length
          ? { post_logout_redirect_uris: current.postLogoutRedirectUris } : {}),
        ...(current.backchannelLogoutUri ? {
          backchannel_logout_uri: current.backchannelLogoutUri,
          backchannel_logout_session_required: true,
        } : {}),
        ...(current.redirectUris.length
          ? { redirect_uris: current.redirectUris }
          : {}),
        metadata: {
          ...(current.metadata &&
          typeof current.metadata === "object" &&
          !Array.isArray(current.metadata)
            ? (current.metadata as Record<string, unknown>)
            : {}),
          credentialProvisioning: false,
          registryRole: current.metadata && typeof current.metadata === "object" &&
            typeof (current.metadata as Record<string, unknown>).registryRole === "string"
              ? (current.metadata as Record<string, unknown>).registryRole : current.clientId,
        },
      },
    })
    const [registered] = await database
      .update(oauthClient)
      .set({ disabled: true })
      .where(eq(oauthClient.clientId, created.client_id))
      .returning({ id: oauthClient.id })
    if (!registered || !created.client_secret)
      throw createServiceError("credential_provisioning_failed", 503)
    // Never change a registered Post client's auth method/secret in place.
    // Keep it working until the operator configures and verifies the Basic replacement.
    if (replacingPost) {
      await database.update(oauthClient)
        .set({ metadata: sql`${oauthClient.metadata}-'credentialProvisioning'` })
        .where(eq(oauthClient.id, id))
    } else {
      await auth.api.deleteOAuthClient({ headers, body: { client_id: current.clientId } })
    }
    return {
      id: registered.id,
      clientId: created.client_id,
      clientSecret: created.client_secret,
    }
  } catch (error) {
    if (created)
      await auth.api
        .deleteOAuthClient({ headers, body: { client_id: created.client_id } })
        .catch(() => undefined)
    await database
      .update(oauthClient)
      .set({ metadata: sql`${oauthClient.metadata}-'credentialProvisioning'` })
      .where(eq(oauthClient.id, id))
    throw error
  }
}
