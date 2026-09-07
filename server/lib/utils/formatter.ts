import { AuthProvider } from "@/lib/utils/interface"
import {
  type AdminSsoApplicationRecord,
  type AdminSsoApplicationPatch,
  type AdminSsoApplicationPayload,
} from "@/schemas/admin"
import { oauthClientMetadataSchema } from "@/schemas/database"
import {
  clientUrl,
  localUrl,
  mobileUrl,
  allowedRedirectOrigins,
  betterAuthUrl,
  serverUrl,
  googleClientId,
  googleClientSecret,
  isProduction,
} from "@/lib/utils/environment"
export { formatCodeDate, formatDate } from "@/lib/utils/temp"

export function stringifyQuery(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(
      ([key, value]) =>
        encodeURIComponent(key) + "=" + encodeURIComponent(String(value))
    )
    .join("&")
}

export function mapProvider(provider?: string): AuthProvider | null {
  if (!provider) {
    return null
  }

  const value = provider.toLowerCase()
  if (value.includes("google")) return AuthProvider.google
  if (value.includes("facebook")) return AuthProvider.facebook
  if (value.includes("microsoft") || value === "azure")
    return AuthProvider.microsoft
  if (value.includes("apple")) return AuthProvider.apple
  if (value === "email") return AuthProvider.email
  if (value === "phone") return AuthProvider.phone
  return null
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function getCorsOrigins(): string[] {
  return Array.from(
    new Set(
      [
        "https://gorth-single-sign-on-client.vercel.app",
        clientUrl,
        mobileUrl,
        localUrl,
        allowedRedirectOrigins,
      ].flatMap(splitOrigins)
    )
  )
}

export function getStringClaim(value: unknown) {
  return typeof value === "string" && value ? value : null
}

export function getAudienceClaim(value: unknown) {
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    return (
      value.find(
        (audience): audience is string => typeof audience === "string"
      ) ?? null
    )
  }

  return null
}

export function normalizeOrigin(value: string | undefined | null) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function normalizeUrl(value: string) {
  try {
    const url = new URL(value)
    url.hash = ""
    return url.toString()
  } catch {
    return null
  }
}

export function splitOrigins(value: string | undefined | null) {
  return (
    value
      ?.split(",")
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter((origin): origin is string => Boolean(origin)) ?? []
  )
}

export function getTrustedOrigins() {
  return Array.from(
    new Set([
      ...splitOrigins(betterAuthUrl),
      ...splitOrigins(clientUrl),
      ...splitOrigins(localUrl),
      ...splitOrigins(mobileUrl),
      ...splitOrigins(serverUrl),
      ...splitOrigins(allowedRedirectOrigins),
      ...getCorsOrigins(),
      ...(!isProduction
        ? ["http://localhost:3000", "http://127.0.0.1:3000"]
        : []),
    ])
  )
}

function getOAuthClientMetadata(metadata: unknown) {
  const parsed = oauthClientMetadataSchema.safeParse(metadata)
  return parsed.success ? parsed.data : {}
}

function getSsoApplicationDescription(metadata: unknown) {
  return getOAuthClientMetadata(metadata).description ?? null
}

function setSsoApplicationDescription(
  metadata: unknown,
  description: string | null | undefined
) {
  return {
    ...getOAuthClientMetadata(metadata),
    description: description ?? null,
  }
}

export function formatSsoApplication(application: AdminSsoApplicationRecord) {
  return {
    id: application.id,
    clientId: application.clientId,
    name: application.name ?? application.clientId,
    description: getSsoApplicationDescription(application.metadata),
    homepageUrl: application.uri,
    icon: application.icon,
    redirectUris: application.redirectUris,
    postLogoutRedirectUris: application.postLogoutRedirectUris ?? [],
    scopes: application.scopes ?? [],
    grantTypes: application.grantTypes ?? [],
    responseTypes: application.responseTypes ?? [],
    public: application.public ?? false,
    requirePKCE: application.requirePKCE ?? true,
    tokenEndpointAuthMethod:
      application.tokenEndpointAuthMethod ??
      (application.public ? "none" : "client_secret_basic"),
    skipConsent: application.skipConsent ?? false,
    disabled: application.disabled ?? false,
    createdAt: application.createdAt ?? new Date(0),
    updatedAt: application.updatedAt ?? application.createdAt ?? new Date(0),
  }
}

export function formatSsoApplicationCreateValues(
  body: AdminSsoApplicationPayload
) {
  const now = new Date()
  const postLogoutRedirectUris = body.postLogoutRedirectUris?.length
    ? body.postLogoutRedirectUris
    : body.redirectUris.map((redirectUri) => new URL(redirectUri).origin)

  return {
    clientId: body.clientId,
    name: body.name,
    uri: body.homepageUrl ?? null,
    icon: body.icon ?? null,
    redirectUris: body.redirectUris,
    postLogoutRedirectUris,
    scopes: body.scopes,
    grantTypes: body.grantTypes,
    responseTypes: body.responseTypes,
    public: body.public,
    requirePKCE: body.requirePKCE,
    tokenEndpointAuthMethod: body.tokenEndpointAuthMethod,
    skipConsent: body.skipConsent,
    enableEndSession: true,
    disabled: body.disabled,
    referenceId: `sso_application:${body.clientId}`,
    metadata: setSsoApplicationDescription(null, body.description),
    updatedAt: now,
    createdAt: now,
  }
}

export function formatSsoApplicationUpdateValues(
  body: AdminSsoApplicationPatch,
  current: AdminSsoApplicationRecord
) {
  return {
    name: body.name ?? current.name,
    uri: "homepageUrl" in body ? (body.homepageUrl ?? null) : current.uri,
    icon: "icon" in body ? (body.icon ?? null) : current.icon,
    redirectUris: body.redirectUris ?? current.redirectUris,
    postLogoutRedirectUris:
      body.postLogoutRedirectUris ?? current.postLogoutRedirectUris,
    scopes: body.scopes ?? current.scopes,
    grantTypes: body.grantTypes ?? current.grantTypes,
    responseTypes: body.responseTypes ?? current.responseTypes,
    public: body.public ?? current.public,
    requirePKCE: body.requirePKCE ?? current.requirePKCE,
    tokenEndpointAuthMethod:
      body.tokenEndpointAuthMethod ?? current.tokenEndpointAuthMethod,
    skipConsent: body.skipConsent ?? current.skipConsent,
    disabled: body.disabled ?? current.disabled,
    metadata:
      "description" in body
        ? setSsoApplicationDescription(current.metadata, body.description)
        : current.metadata,
    updatedAt: new Date(),
  }
}

export interface BetterAuthUser {
  id: string
  email: string
  name: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  image?: string | null
  role?: string | null
  emailVerified?: boolean
  updatedAt?: Date | string | null
  createdAt?: Date | string | null
}

export interface SsoUserMetadata {
  username: string | null
  first_name: string | null
  last_name: string | null
  name: string
  full_name: string
  avatar_url: string | null
  picture: string | null
}

export interface SsoUser {
  id: string
  aud: "authenticated"
  email: string
  email_confirmed_at: string | null
  confirmed_at: string | null
  phone: null
  role: string
  updated_at: string | null
  created_at: string | null
  app_metadata: Record<string, unknown>
  user_metadata: SsoUserMetadata
}

export interface SsoUserClaims {
  id: string
  email: string
  role?: string | null
  name?: string | null
  preferredUsername?: string | null
  givenName?: string | null
  familyName?: string | null
  picture?: string | null
}

function toIsoString(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString()
  return typeof value === "string" ? value : null
}

function getSsoDisplayName(user: {
  email: string
  name?: string | null
  username?: string | null
  firstName?: string | null
  lastName?: string | null
}) {
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username?.trim() ||
    user.email
  )
}

function getSsoUserMetadata(user: {
  email: string
  name?: string | null
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  image?: string | null
}): SsoUserMetadata {
  const name = getSsoDisplayName(user)

  return {
    username: user.username ?? null,
    first_name: user.firstName ?? null,
    last_name: user.lastName ?? null,
    name,
    full_name: name,
    avatar_url: user.image ?? null,
    picture: user.image ?? null,
  }
}

export function formatSsoUser(user: BetterAuthUser): SsoUser {
  const updatedAt = toIsoString(user.updatedAt)
  const createdAt = toIsoString(user.createdAt)
  const emailVerifiedAt = user.emailVerified ? (updatedAt ?? createdAt) : null
  const role = user.role ?? "user"

  return {
    id: user.id,
    aud: "authenticated",
    email: user.email,
    email_confirmed_at: emailVerifiedAt,
    confirmed_at: emailVerifiedAt,
    phone: null,
    role,
    updated_at: updatedAt,
    created_at: createdAt,
    app_metadata: {
      provider: "better-auth",
      role,
    },
    user_metadata: getSsoUserMetadata(user),
  }
}

export function formatSsoUserFromClaims(claims: SsoUserClaims): SsoUser {
  const role = claims.role ?? "user"

  return {
    id: claims.id,
    aud: "authenticated",
    email: claims.email,
    email_confirmed_at: null,
    confirmed_at: null,
    phone: null,
    role,
    updated_at: null,
    created_at: null,
    app_metadata: {
      provider: "better-auth",
      role,
    },
    user_metadata: getSsoUserMetadata({
      email: claims.email,
      name: claims.name,
      username: claims.preferredUsername,
      firstName: claims.givenName,
      lastName: claims.familyName,
      image: claims.picture,
    }),
  }
}

export function getSessionId(session: unknown) {
  if (
    session &&
    typeof session === "object" &&
    "session" in session &&
    session.session &&
    typeof session.session === "object" &&
    "id" in session.session &&
    typeof session.session.id === "string"
  ) {
    return session.session.id
  }

  return null
}

export function formatSsoTokenResponse(
  user: SsoUser,
  appContext: {
    id: string
    origin: string
    redirect_uri: string
    next?: string | null
  },
  tokens: {
    access_token: string
    refresh_token: string
  }
) {
  return {
    user,
    sso_sub: user.id,
    email: user.email,
    ...tokens,
    gorth_app: {
      ...appContext,
      issued_at: Date.now(),
    },
  }
}
