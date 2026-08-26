import { eq } from "drizzle-orm"

import { database } from "@/database"
import { oauthClients, type OAuthClient } from "@/database/schema"
import { isExpressProduction } from "@/lib/utils/environment"

export interface SsoApplicationContext {
  id: string
  name: string
  homepageUrl: string | null
}

interface DevelopmentOAuthClient {
  clientId: string
  name: string
  description: string
  uri: string
  redirectUris: string[]
  postLogoutRedirectUris: string[]
  scopes: string[]
  grantTypes: NonNullable<OAuthClient["grantTypes"]>
  responseTypes: NonNullable<OAuthClient["responseTypes"]>
  public: boolean
  requirePKCE: boolean
  tokenEndpointAuthMethod: NonNullable<
    OAuthClient["tokenEndpointAuthMethod"]
  >
  skipConsent: boolean
  disabled: boolean
}

const defaultScopes = ["openid", "profile", "email", "offline_access"]
const defaultGrantTypes: DevelopmentOAuthClient["grantTypes"] = [
  "authorization_code",
  "refresh_token",
]
const defaultResponseTypes: DevelopmentOAuthClient["responseTypes"] = ["code"]

const developmentOAuthClients: DevelopmentOAuthClient[] = [
  {
    clientId: "gorth-interactive-messaging-portal",
    name: "Gorth Interactive Messaging Portal",
    description: "Default interactive messaging portal client for local SSO.",
    uri: "http://localhost:3030",
    redirectUris: [
      "http://localhost:3030/auth/exchange",
      "http://localhost:8082/auth/exchange",
    ],
    postLogoutRedirectUris: ["http://localhost:3030", "http://localhost:8082"],
    scopes: defaultScopes,
    grantTypes: defaultGrantTypes,
    responseTypes: defaultResponseTypes,
    public: true,
    requirePKCE: true,
    tokenEndpointAuthMethod: "none",
    skipConsent: true,
    disabled: false,
  },
  {
    clientId: "gorth-video-streaming-platform",
    name: "Gorth Video Streaming Platform",
    description: "Default video streaming platform client for local SSO.",
    uri: "http://localhost:3031",
    redirectUris: ["http://localhost:3031/auth/exchange"],
    postLogoutRedirectUris: ["http://localhost:3031"],
    scopes: defaultScopes,
    grantTypes: defaultGrantTypes,
    responseTypes: defaultResponseTypes,
    public: true,
    requirePKCE: true,
    tokenEndpointAuthMethod: "none",
    skipConsent: true,
    disabled: false,
  },
  {
    clientId: "gorth-content-reader-platform",
    name: "Gorth Content Reader Platform",
    description: "Default content reader platform client for local SSO.",
    uri: "http://localhost:3032",
    redirectUris: ["http://localhost:3032/auth/exchange"],
    postLogoutRedirectUris: ["http://localhost:3032"],
    scopes: defaultScopes,
    grantTypes: defaultGrantTypes,
    responseTypes: defaultResponseTypes,
    public: true,
    requirePKCE: true,
    tokenEndpointAuthMethod: "none",
    skipConsent: true,
    disabled: false,
  },
  {
    clientId: "gorth-social-networking-portal",
    name: "Gorth Social Networking Portal",
    description: "Default social networking portal client for local SSO.",
    uri: "http://localhost:3033",
    redirectUris: ["http://localhost:3033/auth/exchange"],
    postLogoutRedirectUris: ["http://localhost:3033"],
    scopes: defaultScopes,
    grantTypes: defaultGrantTypes,
    responseTypes: defaultResponseTypes,
    public: true,
    requirePKCE: true,
    tokenEndpointAuthMethod: "none",
    skipConsent: true,
    disabled: false,
  },
]

function getAudienceFromRedirectUri(value: string) {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export async function ensureOAuthClients() {
  if (isExpressProduction) return

  const now = new Date()

  for (const client of developmentOAuthClients) {
    const { description, ...values } = client

    await database
      .insert(oauthClients)
      .values({
        ...values,
        enableEndSession: true,
        referenceId: `sso_application:${client.clientId}`,
        metadata: { description },
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: oauthClients.clientId })

    await database
      .update(oauthClients)
      .set({
        uri: client.uri,
        redirectUris: client.redirectUris,
        postLogoutRedirectUris: client.postLogoutRedirectUris,
        updatedAt: now,
      })
      .where(eq(oauthClients.clientId, client.clientId))
  }
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
    .map(getAudienceFromRedirectUri)
    .filter((origin): origin is string => Boolean(origin))
  const developmentAudiences = isExpressProduction
    ? []
    : developmentOAuthClients
      .flatMap((client) => client.redirectUris)
      .map(getAudienceFromRedirectUri)
      .filter((origin): origin is string => Boolean(origin))

  return Array.from(
    new Set([...baseAudiences, ...databaseAudiences, ...developmentAudiences])
  )
}

export async function getTrustedOAuthClientIds() {
  const clients = await database
    .select({
      clientId: oauthClients.clientId,
      disabled: oauthClients.disabled,
    })
    .from(oauthClients)
  const developmentClientIds = isExpressProduction
    ? []
    : developmentOAuthClients.map((client) => client.clientId)

  return new Set([
    ...clients
      .filter((client) => !client.disabled)
      .map((client) => client.clientId),
    ...developmentClientIds,
  ])
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
