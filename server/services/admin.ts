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
  account,
  oauthClient,
  oauthConsent,
  oauthResource,
  session,
  user,
} from "@/database/schema"
import { auth } from "@/lib/auth"
import { fromNodeHeaders } from "@gorth/structure/cores/auth/server/index"
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
        ? isNotNull(user.banExpires)
        : options.state === "verified"
          ? and(eq(user.emailVerified, true), isNull(user.banExpires))
          : options.state === "unverified"
            ? and(eq(user.emailVerified, false), isNull(user.banExpires))
            : undefined
    const role = options.role ? eq(user.role, options.role) : undefined
    const where = and(search, state, role)
    const sortColumns = {
      name: user.name,
      email: user.email,
      role: user.role,
      state: user.banExpires,
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

export async function createUser(input: AdminUserPayload) {
  try {
    const context = await auth.$context
    const password = await context.password.hash(input.password)

    return await database.transaction(async (transaction) => {
      const [createdUser] = await transaction
        .insert(user)
        .values({
          name: input.name,
          username: input.username,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          emailVerified: input.emailVerified,
          image: input.image ?? null,
          role: input.role,
          banExpires: input.banExpires ?? null,
          banReason: input.banReason ?? null,
          updatedAt: new Date(),
        })
        .returning()

      if (!createdUser) throw createServiceError("user_create_failed", 500)

      await transaction.insert(account).values({
        accountId: createdUser.id,
        issuer: credentialIssuer,
        providerId: "credential",
        userId: createdUser.id,
        password,
        updatedAt: new Date(),
      })

      return createdUser
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
    const [updatedUser] = await database
      .update(user)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning()

    if (!updatedUser) throw createServiceError("user_not_found", 404)

    if (nextPassword) {
      const context = await auth.$context
      const password = await context.password.hash(nextPassword)
      const [credential] = await database
        .update(account)
        .set({ password, updatedAt: new Date() })
        .where(
          and(
            eq(account.userId, id),
            eq(account.providerId, "credential"),
            eq(account.issuer, credentialIssuer)
          )
        )
        .returning({ id: account.id })

      if (!credential) {
        await database.insert(account).values({
          accountId: id,
          issuer: credentialIssuer,
          providerId: "credential",
          userId: id,
          password,
          updatedAt: new Date(),
        })
      }
    }

    return updatedUser
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

export async function listOAuthResources() {
  try {
    return await database
      .select({
        id: oauthResource.id,
        identifier: oauthResource.identifier,
        name: oauthResource.name,
        accessTokenTtl: oauthResource.accessTokenTtl,
        refreshTokenTtl: oauthResource.refreshTokenTtl,
        signingAlgorithm: oauthResource.signingAlgorithm,
        allowedScopes: oauthResource.allowedScopes,
        dpopBoundAccessTokensRequired:
          oauthResource.dpopBoundAccessTokensRequired,
        disabled: oauthResource.disabled,
        createdAt: oauthResource.createdAt,
        updatedAt: oauthResource.updatedAt,
      })
      .from(oauthResource)
      .orderBy(asc(oauthResource.name))
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
  const [application] = await database
    .insert(oauthClient)
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
    .update(oauthClient)
    .set(formatSsoApplicationUpdateValues(input, current))
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
