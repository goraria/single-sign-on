import { type IncomingHttpHeaders } from "node:http"
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
} from "drizzle-orm"

import { database } from "@/database"
import {
  accounts,
  oauthClients,
  oauthConsents,
  oauthResources,
  sessions,
  users,
} from "@/database/schema"
import { auth } from "@/lib/auth"
import { fromNodeHeaders } from "@/lib/structure/auth/server"
import {
  formatSsoApplication,
  formatSsoApplicationCreateValues,
  formatSsoApplicationUpdateValues,
} from "@/lib/utils/formatter"
import {
  adminSsoApplicationSelection,
  adminUserSelection,
  type AdminSsoApplicationListQuery,
  type AdminSsoApplicationPatch,
  type AdminSsoApplicationPayload,
  type AdminUserListQuery,
  type AdminUserPatch,
  type AdminUserPayload,
} from "@/schemas/admin"
import {
  checkSsoApplicationExists,
  createServiceError,
  isServiceError,
  isUniqueViolation,
} from "@/services/helper"

const adminRoles = new Set(["admin", "master"])
const credentialIssuer = "local:credential"

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

export async function listSsoApplications(
  options: AdminSsoApplicationListQuery
) {
  try {
    const offset = (options.page - 1) * options.limit
    const search = options.search
      ? or(
          ilike(oauthClients.name, `%${options.search}%`),
          ilike(oauthClients.clientId, `%${options.search}%`)
        )
      : undefined
    const status =
      options.status === "disabled"
        ? eq(oauthClients.disabled, true)
        : options.status === "enabled"
          ? or(eq(oauthClients.disabled, false), isNull(oauthClients.disabled))
          : undefined
    const where = and(search, status)
    const sortColumns = {
      name: oauthClients.name,
      clientId: oauthClients.clientId,
      homepageUrl: oauthClients.uri,
      state: oauthClients.disabled,
      updatedAt: oauthClients.updatedAt,
    } as const
    const sortColumn = sortColumns[options.sortBy]
    const orderBy =
      options.sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn)

    const [applications, totals] = await Promise.all([
      database
        .select(adminSsoApplicationSelection)
        .from(oauthClients)
        .where(where)
        .orderBy(orderBy, asc(oauthClients.id))
        .limit(options.limit)
        .offset(offset),
      database.select({ total: count() }).from(oauthClients).where(where),
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
          ilike(users.name, `%${options.search}%`),
          ilike(users.email, `%${options.search}%`),
          ilike(users.username, `%${options.search}%`)
        )
      : undefined
    const state =
      options.state === "banned"
        ? isNotNull(users.bannedUntil)
        : options.state === "verified"
          ? and(eq(users.emailVerified, true), isNull(users.bannedUntil))
          : options.state === "unverified"
            ? and(eq(users.emailVerified, false), isNull(users.bannedUntil))
            : undefined
    const role = options.role ? eq(users.role, options.role) : undefined
    const where = and(search, state, role)
    const sortColumns = {
      name: users.name,
      email: users.email,
      role: users.role,
      state: users.bannedUntil,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    } as const
    const sortColumn = sortColumns[options.sortBy]
    const orderBy =
      options.sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn)

    const [items, totals] = await Promise.all([
      database
        .select(adminUserSelection)
        .from(users)
        .where(where)
        .orderBy(orderBy, asc(users.id))
        .limit(options.limit)
        .offset(offset),
      database.select({ total: count() }).from(users).where(where),
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

    const [user] = await database
      .select(adminUserSelection)
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!user) throw createServiceError("user_not_found", 404)
    return user
  } catch (error) {
    if (isServiceError(error)) throw error
    throw createServiceError("user_read_failed", 500)
  }
}

export async function createUser(input: AdminUserPayload) {
  try {
    const context = await auth.$context
    const password = await context.password.hash(input.password)

    return await database.transaction(async (transaction) => {
      const [user] = await transaction
        .insert(users)
        .values({
          name: input.name,
          username: input.username,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          emailVerified: input.emailVerified,
          image: input.image ?? null,
          role: input.role,
          bannedUntil: input.bannedUntil ?? null,
          updatedAt: new Date(),
        })
        .returning()

      if (!user) throw createServiceError("user_create_failed", 500)

      await transaction.insert(accounts).values({
        accountId: user.id,
        issuer: credentialIssuer,
        providerId: "credential",
        userId: user.id,
        password,
        updatedAt: new Date(),
      })

      return user
    })
  } catch (error) {
    if (isServiceError(error)) throw error
    if (isUniqueViolation(error)) {
      throw createServiceError("email_or_username_already_exists", 409)
    }
    throw createServiceError("user_create_failed", 500)
  }
}

export async function updateUser(id: string, input: AdminUserPatch) {
  try {
    if (!id) throw createServiceError("user_id_required", 400)

    if (!Object.keys(input).length) {
      throw createServiceError("user_update_payload_required", 400)
    }

    const { password: nextPassword, ...profile } = input
    const [user] = await database
      .update(users)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()

    if (!user) throw createServiceError("user_not_found", 404)

    if (nextPassword) {
      const context = await auth.$context
      const password = await context.password.hash(nextPassword)
      const [credential] = await database
        .update(accounts)
        .set({ password, updatedAt: new Date() })
        .where(
          and(
            eq(accounts.userId, id),
            eq(accounts.providerId, "credential"),
            eq(accounts.issuer, credentialIssuer)
          )
        )
        .returning({ id: accounts.id })

      if (!credential) {
        await database.insert(accounts).values({
          accountId: id,
          issuer: credentialIssuer,
          providerId: "credential",
          userId: id,
          password,
          updatedAt: new Date(),
        })
      }
    }

    return user
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
        id: sessions.id,
        userId: sessions.userId,
        userName: users.name,
        userEmail: users.email,
        ipAddress: sessions.ipAddress,
        userAgent: sessions.userAgent,
        expiresAt: sessions.expiresAt,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .orderBy(desc(sessions.updatedAt))
  } catch {
    throw createServiceError("sessions_list_failed", 500)
  }
}

export async function listOAuthResources() {
  try {
    return await database
      .select({
        id: oauthResources.id,
        identifier: oauthResources.identifier,
        name: oauthResources.name,
        accessTokenTtl: oauthResources.accessTokenTtl,
        refreshTokenTtl: oauthResources.refreshTokenTtl,
        signingAlgorithm: oauthResources.signingAlgorithm,
        allowedScopes: oauthResources.allowedScopes,
        dpopBoundAccessTokensRequired:
          oauthResources.dpopBoundAccessTokensRequired,
        disabled: oauthResources.disabled,
        createdAt: oauthResources.createdAt,
        updatedAt: oauthResources.updatedAt,
      })
      .from(oauthResources)
      .orderBy(asc(oauthResources.name))
  } catch {
    throw createServiceError("oauth_resources_list_failed", 500)
  }
}

export async function listOAuthConsents() {
  try {
    return await database
      .select({
        id: oauthConsents.id,
        clientId: oauthConsents.clientId,
        clientName: oauthClients.name,
        userId: oauthConsents.userId,
        userName: users.name,
        userEmail: users.email,
        resources: oauthConsents.resources,
        scopes: oauthConsents.scopes,
        createdAt: oauthConsents.createdAt,
        updatedAt: oauthConsents.updatedAt,
      })
      .from(oauthConsents)
      .leftJoin(oauthClients, eq(oauthConsents.clientId, oauthClients.clientId))
      .leftJoin(users, eq(oauthConsents.userId, users.id))
      .orderBy(desc(oauthConsents.updatedAt))
  } catch {
    throw createServiceError("oauth_consents_list_failed", 500)
  }
}

export async function createSsoApplication(input: AdminSsoApplicationPayload) {
  const [application] = await database
    .insert(oauthClients)
    .values(formatSsoApplicationCreateValues(input))
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

  const [application] = await database
    .update(oauthClients)
    .set(formatSsoApplicationUpdateValues(input, current))
    .where(eq(oauthClients.id, id))
    .returning()

  if (!application) {
    throw createServiceError("sso_application_update_failed", 500)
  }

  return formatSsoApplication(application)
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
