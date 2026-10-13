import { type IncomingHttpHeaders } from "node:http"
import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm"

import { database } from "@/database"
import {
  oauthClient,
  oauthConsent,
  oauthResource,
  session,
  user,
} from "@/database/schema"
import { auth } from "@/lib/auth/server/index"
import { fromNodeHeaders } from "better-auth/node"
import { formatSsoApplication } from "@/utils/server/formatter"
import {
  adminSsoApplicationSelection,
  adminOAuthResourceSelection,
  adminUserSelection,
  type AdminSsoApplicationListQuery,
  type AdminSsoApplicationPatch,
  type AdminSsoApplicationPayload,
  type AdminUserListQuery,
  type AdminUserPatch,
  type AdminUserPayload,
  type AdminOAuthResourceListQuery,
} from "@/schemas/admin"
import {
  checkSsoApplicationExists,
  createServiceError,
  isServiceError,
  isUniqueViolation,
} from "@/services/helper"

const adminRoles = new Set(["admin", "master"])

export async function requireAdminSession(headers: IncomingHttpHeaders) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers),
    query: { disableCookieCache: true },
  })

  if (!session?.user?.id) {
    throw createServiceError("unauthorized", 401)
  }

  const [adminUser] = await database
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!adminUser || !adminRoles.has(adminUser.role)) {
    throw createServiceError("forbidden", 403)
  }

  return adminUser
}

export async function listSsoApplications(
  options: AdminSsoApplicationListQuery
) {
  try {
    const offset = (options.page - 1) * options.limit
    const search = options.search
      ? or(
          ilike(oauthClient.name, `%${options.search}%`),
          ilike(oauthClient.clientId, `%${options.search}%`)
        )
      : undefined
    const status =
      options.status === "disabled"
        ? eq(oauthClient.disabled, true)
        : options.status === "enabled"
          ? or(eq(oauthClient.disabled, false), isNull(oauthClient.disabled))
          : undefined
    const where = and(search, status)
    const sortColumns = {
      name: oauthClient.name,
      clientId: oauthClient.clientId,
      homepageUrl: oauthClient.uri,
      state: oauthClient.disabled,
      updatedAt: oauthClient.updatedAt,
    } as const
    const sortColumn = sortColumns[options.sortBy]
    const orderBy =
      options.sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn)

    const [applications, totals] = await Promise.all([
      database
        .select(adminSsoApplicationSelection)
        .from(oauthClient)
        .where(where)
        .orderBy(orderBy, asc(oauthClient.id))
        .limit(options.limit)
        .offset(offset),
      database.select({ total: count() }).from(oauthClient).where(where),
    ])

    return {
      items: applications.map(formatSsoApplication),
      total: totals[0]?.total ?? 0,
      page: options.page,
      limit: options.limit,
    }
  } catch (error) {
    if (isServiceError(error)) throw error
    throw createServiceError("sso_applications_list_failed", 500)
  }
}

export async function getSsoApplication(id: string) {
  try {
    if (!id) throw createServiceError("sso_application_id_required", 400)

    const application = await checkSsoApplicationExists(id)

    return formatSsoApplication(application)
  } catch (error) {
    if (isServiceError(error)) throw error
    throw createServiceError("sso_application_read_failed", 500)
  }
}

export async function listUsers(options: AdminUserListQuery) {
  try {
    const offset = (options.page - 1) * options.limit
    const search = options.search
      ? or(
          ilike(user.name, `%${options.search}%`),
          ilike(user.email, `%${options.search}%`),
          ilike(user.username, `%${options.search}%`)
        )
      : undefined
    const state =
      options.state === "banned"
        ? eq(user.banned, true)
        : options.state === "verified"
          ? and(eq(user.emailVerified, true), eq(user.banned, false))
          : options.state === "unverified"
            ? and(eq(user.emailVerified, false), eq(user.banned, false))
            : undefined
    const role = options.role ? eq(user.role, options.role) : undefined
    const where = and(search, state, role)
    const sortColumns = {
      name: user.name,
      email: user.email,
      role: user.role,
      state: user.banned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as const
    const sortColumn = sortColumns[options.sortBy]
    const orderBy =
      options.sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn)

    const [items, totals] = await Promise.all([
      database
        .select(adminUserSelection)
        .from(user)
        .where(where)
        .orderBy(orderBy, asc(user.id))
        .limit(options.limit)
        .offset(offset),
      database.select({ total: count() }).from(user).where(where),
    ])

    return {
      items,
      total: totals[0]?.total ?? 0,
      page: options.page,
      limit: options.limit,
    }
  } catch (error) {
    if (isServiceError(error)) throw error
    throw createServiceError("users_list_failed", 500)
  }
}

export async function getUserById(id: string) {
  try {
    if (!id) throw createServiceError("user_id_required", 400)

    const [foundUser] = await database
      .select(adminUserSelection)
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (!foundUser) throw createServiceError("user_not_found", 404)
    return foundUser
  } catch (error) {
    if (isServiceError(error)) throw error
    throw createServiceError("user_read_failed", 500)
  }
}

export async function createUser(
  input: AdminUserPayload,
  headers: IncomingHttpHeaders
) {
  try {
    const result = await auth.api.createUser({
      headers: fromNodeHeaders(headers),
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        data: {
          username: input.username,
          firstName: input.firstName,
          lastName: input.lastName,
          emailVerified: input.emailVerified,
          image: input.image ?? null,
        },
      },
    })

    if (input.banned) {
      const banExpiresIn = input.banExpires
        ? Math.max(
            1,
            Math.ceil((input.banExpires.getTime() - Date.now()) / 1000)
          )
        : undefined

      await auth.api.banUser({
        headers: fromNodeHeaders(headers),
        body: {
          userId: result.user.id,
          ...(input.banReason ? { banReason: input.banReason } : {}),
          ...(banExpiresIn ? { banExpiresIn } : {}),
        },
      })
    }

    return getUserById(result.user.id)
  } catch (error) {
    if (isServiceError(error)) throw error
    if (isUniqueViolation(error)) {
      throw createServiceError("email_or_username_already_exists", 409)
    }
    throw createServiceError("user_create_failed", 500)
  }
}

export async function updateUser(
  id: string,
  input: AdminUserPatch,
  headers: IncomingHttpHeaders
) {
  try {
    if (!id) throw createServiceError("user_id_required", 400)

    if (!Object.keys(input).length) {
      throw createServiceError("user_update_payload_required", 400)
    }

    await getUserById(id)

    const authHeaders = fromNodeHeaders(headers)
    const {
      password: nextPassword,
      role: nextRole,
      banned: nextBanned,
      banExpires,
      banReason,
      ...profile
    } = input

    if (Object.keys(profile).length) {
      await auth.api.adminUpdateUser({
        headers: authHeaders,
        body: {
          userId: id,
          data: profile,
        },
      })
    }

    if (nextRole) {
      await auth.api.setRole({
        headers: authHeaders,
        body: { userId: id, role: nextRole },
      })
    }

    if (nextPassword) {
      await auth.api.setUserPassword({
        headers: authHeaders,
        body: { userId: id, newPassword: nextPassword },
      })
    }

    if (nextBanned === false) {
      await auth.api.unbanUser({
        headers: authHeaders,
        body: { userId: id },
      })
    } else if (nextBanned === true) {
      const banExpiresIn = banExpires
        ? Math.max(1, Math.ceil((banExpires.getTime() - Date.now()) / 1000))
        : undefined

      await auth.api.banUser({
        headers: authHeaders,
        body: {
          userId: id,
          ...(banReason ? { banReason } : {}),
          ...(banExpiresIn ? { banExpiresIn } : {}),
        },
      })
    }

    return getUserById(id)
  } catch (error) {
    if (isServiceError(error)) throw error
    if (isUniqueViolation(error)) {
      throw createServiceError("email_or_username_already_exists", 409)
    }
    throw createServiceError("user_update_failed", 500)
  }
}

export async function listSessions() {
  try {
    return await database
      .select({
        id: session.id,
        userId: session.userId,
        userName: user.name,
        userEmail: user.email,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .orderBy(desc(session.updatedAt))
  } catch {
    throw createServiceError("sessions_list_failed", 500)
  }
}

export async function listOAuthResources(options: AdminOAuthResourceListQuery) {
  try {
    const offset = (options.page - 1) * options.limit
    const search = options.search
      ? or(
          ilike(oauthResource.name, `%${options.search}%`),
          ilike(oauthResource.identifier, `%${options.search}%`)
        )
      : undefined
    const status =
      options.status === "disabled"
        ? eq(oauthResource.disabled, true)
        : options.status === "enabled"
          ? eq(oauthResource.disabled, false)
          : undefined
    const where = and(search, status)
    const sortColumns = {
      name: oauthResource.name,
      identifier: oauthResource.identifier,
      accessTokenTtl: oauthResource.accessTokenTtl,
      state: oauthResource.disabled,
      updatedAt: oauthResource.updatedAt,
    } as const
    const sortColumn = sortColumns[options.sortBy]
    const orderBy =
      options.sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn)

    const [items, totals] = await Promise.all([
      database
        .select(adminOAuthResourceSelection)
        .from(oauthResource)
        .where(where)
        .orderBy(orderBy, asc(oauthResource.id))
        .limit(options.limit)
        .offset(offset),
      database.select({ total: count() }).from(oauthResource).where(where),
    ])

    return {
      items,
      total: totals[0]?.total ?? 0,
      page: options.page,
      limit: options.limit,
    }
  } catch {
    throw createServiceError("oauth_resources_list_failed", 500)
  }
}

export async function listOAuthConsents() {
  try {
    return await database
      .select({
        id: oauthConsent.id,
        clientId: oauthConsent.clientId,
        clientName: oauthClient.name,
        userId: oauthConsent.userId,
        userName: user.name,
        userEmail: user.email,
        resources: oauthConsent.resources,
        scopes: oauthConsent.scopes,
        createdAt: oauthConsent.createdAt,
        updatedAt: oauthConsent.updatedAt,
      })
      .from(oauthConsent)
      .leftJoin(oauthClient, eq(oauthConsent.clientId, oauthClient.clientId))
      .leftJoin(user, eq(oauthConsent.userId, user.id))
      .orderBy(desc(oauthConsent.updatedAt))
  } catch {
    throw createServiceError("oauth_consents_list_failed", 500)
  }
}

export async function createSsoApplication(input: AdminSsoApplicationPayload) {
  const created = await auth.api.adminCreateOAuthClient({
    body: {
      redirect_uris: input.redirectUris,
      scope: input.scopes.join(" "),
      client_name: input.name,
      ...(input.homepageUrl ? { client_uri: input.homepageUrl } : {}),
      ...(input.icon ? { logo_uri: input.icon } : {}),
      ...(input.postLogoutRedirectUris?.length
        ? { post_logout_redirect_uris: input.postLogoutRedirectUris }
        : {}),
      token_endpoint_auth_method: input.tokenEndpointAuthMethod,
      grant_types: input.grantTypes,
      response_types: input.responseTypes,
      skip_consent: input.skipConsent,
      enable_end_session: true,
      require_pkce: input.requirePKCE,
      metadata: { description: input.description ?? null },
    },
  })

  const [application] = await database
    .update(oauthClient)
    .set({
      disabled: input.disabled,
      public: input.tokenEndpointAuthMethod === "none",
      updatedAt: new Date(),
    })
    .where(eq(oauthClient.clientId, created.client_id))
    .returning()

  if (!application) {
    throw createServiceError("sso_application_create_failed", 500)
  }

  return formatSsoApplication(application)
}

export async function updateSsoApplication(
  id: string,
  input: AdminSsoApplicationPatch
) {
  if (!id) throw createServiceError("sso_application_id_required", 400)

  const current = await checkSsoApplicationExists(id)

  if (input.clientId && input.clientId !== current.clientId) {
    throw createServiceError("client_id_immutable", 400)
  }

  const currentTokenEndpointAuthMethod =
    current.tokenEndpointAuthMethod ??
    (current.public ? "none" : "client_secret_basic")
  const currentRequirePKCE = current.requirePKCE ?? true

  if (
    input.tokenEndpointAuthMethod !== undefined &&
    input.tokenEndpointAuthMethod !== currentTokenEndpointAuthMethod
  ) {
    throw createServiceError("token_endpoint_auth_method_immutable", 400)
  }

  if (
    input.requirePKCE !== undefined &&
    input.requirePKCE !== currentRequirePKCE
  ) {
    throw createServiceError("require_pkce_immutable", 400)
  }

  await auth.api.adminUpdateOAuthClient({
    body: {
      client_id: current.clientId,
      update: {
        ...(input.redirectUris ? { redirect_uris: input.redirectUris } : {}),
        ...(input.scopes ? { scope: input.scopes.join(" ") } : {}),
        ...(input.name ? { client_name: input.name } : {}),
        ...(input.homepageUrl ? { client_uri: input.homepageUrl } : {}),
        ...(input.icon ? { logo_uri: input.icon } : {}),
        ...(input.postLogoutRedirectUris?.length
          ? { post_logout_redirect_uris: input.postLogoutRedirectUris }
          : {}),
        ...(input.grantTypes ? { grant_types: input.grantTypes } : {}),
        ...(input.responseTypes ? { response_types: input.responseTypes } : {}),
        ...(input.skipConsent !== undefined
          ? { skip_consent: input.skipConsent }
          : {}),
        ...(input.description !== undefined
          ? {
              metadata: {
                ...(current.metadata && typeof current.metadata === "object"
                  ? current.metadata
                  : {}),
                description: input.description,
              },
            }
          : {}),
      },
    },
  })

  const [application] = await database
    .update(oauthClient)
    .set({
      ...(input.homepageUrl === null ? { uri: null } : {}),
      ...(input.icon === null ? { icon: null } : {}),
      ...(input.postLogoutRedirectUris?.length === 0
        ? { postLogoutRedirectUris: [] }
        : {}),
      ...(input.disabled !== undefined ? { disabled: input.disabled } : {}),
      updatedAt: new Date(),
    })
    .where(eq(oauthClient.id, id))
    .returning()

  if (!application) {
    throw createServiceError("sso_application_update_failed", 500)
  }

  return formatSsoApplication(application)
}

export async function deleteSsoApplication(id: string) {
  if (!id) throw createServiceError("sso_application_id_required", 400)

  const [application] = await database
    .delete(oauthClient)
    .where(eq(oauthClient.id, id))
    .returning({ id: oauthClient.id })

  if (!application) throw createServiceError("sso_application_not_found", 404)

  return application
}
