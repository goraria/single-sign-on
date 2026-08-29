import type { IncomingHttpHeaders } from "node:http"
import { asc, eq } from "drizzle-orm"
import z from "@/lib/structure/cores/zod"

import { database } from "@/database"
import { oauthClients, users, type OAuthClient } from "@/database/schema"
import { auth } from "@/lib/auth"
import { fromNodeHeaders } from "@/lib/structure/auth/server"
import { isExpressProduction } from "@/lib/utils/environment"
import {
  adminSsoApplicationPatchSchema,
  adminSsoApplicationPayloadSchema,
  type AdminSsoApplicationPatch,
  type AdminSsoApplicationPayload,
} from "@/schemas/admin"
import { oauthClientMetadataSchema } from "@/schemas/database"

const adminRoles = new Set(["admin", "master"])

function createServiceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

function parseAdminPayload(input: unknown) {
  try {
    return adminSsoApplicationPayloadSchema.parse(input)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createServiceError("invalid_payload", 400)
    }

    throw error
  }
}

function parseAdminPatch(input: unknown) {
  try {
    return adminSsoApplicationPatchSchema.parse(input)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createServiceError("invalid_payload", 400)
    }

    throw error
  }
}

function assertHttpUrl(value: string, field: string) {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw createServiceError(`invalid_${field}`, 400)
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw createServiceError(`invalid_${field}_protocol`, 400)
  }

  if (isExpressProduction && url.protocol !== "https:") {
    throw createServiceError(`${field}_must_use_https`, 400)
  }

  return url.toString()
}

function normalizeUrlList(values: string[], field: string) {
  return Array.from(new Set(values.map((value) => assertHttpUrl(value, field))))
}

function assertClientId(value: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,127}$/.test(value)) {
    throw createServiceError("invalid_client_id", 400)
  }

  return value
}

function getMetadata(metadata: unknown) {
  const parsed = oauthClientMetadataSchema.safeParse(metadata)
  return parsed.success ? parsed.data : {}
}

function getDescription(metadata: unknown) {
  return getMetadata(metadata).description ?? null
}

function setDescription(
  metadata: unknown,
  description: string | null | undefined
) {
  return {
    ...getMetadata(metadata),
    description: description ?? null,
  }
}

function getPostLogoutRedirectUris(
  body: AdminSsoApplicationPayload,
  redirectUris: string[]
) {
  if (body.postLogoutRedirectUris?.length) {
    return normalizeUrlList(
      body.postLogoutRedirectUris,
      "post_logout_redirect_uri"
    )
  }

  return redirectUris.map((redirectUri) => new URL(redirectUri).origin)
}

function toApplicationResponse(application: OAuthClient) {
  return {
    id: application.id,
    clientId: application.clientId,
    name: application.name ?? application.clientId,
    description: getDescription(application.metadata),
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

function buildCreateValues(input: unknown) {
  const body = parseAdminPayload(input)
  const redirectUris = normalizeUrlList(body.redirectUris, "redirect_uri")

  if (!redirectUris.length) {
    throw createServiceError("redirect_uris_required", 400)
  }

  const clientId = assertClientId(body.clientId)
  const now = new Date()

  return {
    clientId,
    name: body.name,
    uri: body.homepageUrl ?? null,
    icon: body.icon ?? null,
    redirectUris,
    postLogoutRedirectUris: getPostLogoutRedirectUris(body, redirectUris),
    scopes: body.scopes,
    grantTypes: body.grantTypes,
    responseTypes: body.responseTypes,
    public: body.public,
    requirePKCE: body.requirePKCE,
    tokenEndpointAuthMethod: body.tokenEndpointAuthMethod,
    skipConsent: body.skipConsent,
    enableEndSession: true,
    disabled: body.disabled,
    referenceId: `sso_application:${clientId}`,
    metadata: setDescription(null, body.description),
    updatedAt: now,
    createdAt: now,
  }
}

function buildUpdateValues(input: unknown, current: OAuthClient) {
  const body = parseAdminPatch(input)

  if (body.clientId && body.clientId !== current.clientId) {
    throw createServiceError("client_id_immutable", 400)
  }

  const redirectUris = body.redirectUris
    ? normalizeUrlList(body.redirectUris, "redirect_uri")
    : current.redirectUris

  if (!redirectUris.length) {
    throw createServiceError("redirect_uris_required", 400)
  }

  return {
    name: body.name ?? current.name,
    uri: "homepageUrl" in body ? (body.homepageUrl ?? null) : current.uri,
    icon: "icon" in body ? (body.icon ?? null) : current.icon,
    redirectUris,
    postLogoutRedirectUris: body.postLogoutRedirectUris
      ? normalizeUrlList(
          body.postLogoutRedirectUris,
          "post_logout_redirect_uri"
        )
      : current.postLogoutRedirectUris,
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
        ? setDescription(current.metadata, body.description)
        : current.metadata,
    updatedAt: new Date(),
  }
}

export async function requireAdminSession(headers: IncomingHttpHeaders) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers),
  })

  if (!session?.user?.id) {
    throw createServiceError("unauthorized", 401)
  }

  const [user] = await database
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user || !adminRoles.has(user.role)) {
    throw createServiceError("forbidden", 403)
  }

  return user
}

export async function listSsoApplications() {
  const applications = await database
    .select()
    .from(oauthClients)
    .orderBy(asc(oauthClients.name))

  return applications.map(toApplicationResponse)
}

export async function listUsers() {
  try {
    return await database
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
        bannedUntil: users.bannedUntil,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(asc(users.name), asc(users.email))
  } catch {
    throw createServiceError("users_list_failed", 500)
  }
}

export async function createSsoApplication(input: unknown) {
  const [application] = await database
    .insert(oauthClients)
    .values(buildCreateValues(input))
    .returning()

  if (!application) {
    throw createServiceError("sso_application_create_failed", 500)
  }

  return toApplicationResponse(application)
}

export async function updateSsoApplication(id: string, input: unknown) {
  if (!id) throw createServiceError("sso_application_id_required", 400)

  const [current] = await database
    .select()
    .from(oauthClients)
    .where(eq(oauthClients.id, id))
    .limit(1)

  if (!current) throw createServiceError("sso_application_not_found", 404)

  const [application] = await database
    .update(oauthClients)
    .set(buildUpdateValues(input, current))
    .where(eq(oauthClients.id, id))
    .returning()

  if (!application) {
    throw createServiceError("sso_application_update_failed", 500)
  }

  return toApplicationResponse(application)
}

export async function deleteSsoApplication(id: string) {
  if (!id) throw createServiceError("sso_application_id_required", 400)

  const [application] = await database
    .delete(oauthClients)
    .where(eq(oauthClients.id, id))
    .returning({ id: oauthClients.id })

  if (!application) throw createServiceError("sso_application_not_found", 404)

  return application
}

export type AdminSsoApplication = Awaited<
  ReturnType<typeof listSsoApplications>
>[number]
export type { AdminSsoApplicationPatch, AdminSsoApplicationPayload }
