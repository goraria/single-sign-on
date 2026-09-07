import { eq } from "drizzle-orm"

import { database } from "@/database"
import { oauthClients } from "@/database/schema"
import { normalizeOrigin, normalizeUrl } from "@/lib/utils/formatter"
import { type OAuthClientRedirectPurpose } from "@/schemas/sso"

export interface SsoApplicationContext {
  id: string
  name: string
  homepageUrl: string | null
}

export async function isOAuthClientRedirectAllowed(
  value: string,
  purpose: OAuthClientRedirectPurpose
) {
  const target = normalizeUrl(value)
  if (!target) return false

  const clients = await database
    .select({
      disabled: oauthClients.disabled,
      redirectUris: oauthClients.redirectUris,
      postLogoutRedirectUris: oauthClients.postLogoutRedirectUris,
    })
    .from(oauthClients)

  const targetUrl = new URL(target)

  return clients.some((client) => {
    if (client.disabled) return false

    const registeredUrls = [
      ...client.redirectUris,
      ...(client.postLogoutRedirectUris ?? []),
    ]
      .map(normalizeUrl)
      .filter((url): url is string => Boolean(url))

    if (purpose === "origin") {
      return registeredUrls.some(
        (registeredUrl) => new URL(registeredUrl).origin === targetUrl.origin
      )
    }

    return (client.postLogoutRedirectUris ?? [])
      .map(normalizeUrl)
      .includes(target)
  })
}

export async function getOAuthClientAudiences(baseAudiences: string[] = []) {
  const clients = await database
    .select({
      disabled: oauthClients.disabled,
      redirectUris: oauthClients.redirectUris,
    })
    .from(oauthClients)

  const databaseAudiences = clients
    .filter((client) => !client.disabled)
    .flatMap((client) => client.redirectUris)
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin))
  return Array.from(new Set([...baseAudiences, ...databaseAudiences]))
}

export async function getTrustedOAuthClientIds() {
  const clients = await database
    .select({
      clientId: oauthClients.clientId,
      disabled: oauthClients.disabled,
    })
    .from(oauthClients)
  return new Set(
    clients
      .filter((client) => !client.disabled)
      .map((client) => client.clientId)
  )
}

export async function getSsoApplicationContext(
  clientId: string
): Promise<SsoApplicationContext | null> {
  const [application] = await database
    .select({
      id: oauthClients.clientId,
      name: oauthClients.name,
      homepageUrl: oauthClients.uri,
    })
    .from(oauthClients)
    .where(eq(oauthClients.clientId, clientId))
    .limit(1)

  if (!application) return null

  return {
    id: application.id,
    name: application.name ?? application.id,
    homepageUrl: application.homepageUrl,
  }
}
