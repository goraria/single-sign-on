import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm"
import { database } from "@/database"
import {
  auditLog,
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
  session,
  user,
} from "@/database/schema"
import { auth } from "@/lib/auth/server/index"
import { APIError } from "better-auth/api"
import { createServiceError } from "@/services/helper"
import {
  adminAuditSelection,
  adminConsentSelection,
  adminSessionSelection,
  type AdminAuditQuery,
  type AdminConsentQuery,
  type AdminSessionQuery,
} from "@/schemas/admin-security"

export async function listSessions(options: AdminSessionQuery) {
  const where = and(
    options.userId ? eq(session.userId, options.userId) : undefined,
    options.search
      ? or(
          ilike(user.name, `%${options.search}%`),
          ilike(user.email, `%${options.search}%`),
          ilike(session.ipAddress, `%${options.search}%`),
          ilike(session.userAgent, `%${options.search}%`)
        )
      : undefined
  )
  const [items, totals] = await Promise.all([
    database
      .select(adminSessionSelection)
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .where(where)
      .orderBy(desc(session.updatedAt), desc(session.id))
      .limit(options.limit)
      .offset((options.page - 1) * options.limit),
    database
      .select({ total: count() })
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .where(where),
  ])
  return {
    items,
    total: totals[0]?.total ?? 0,
    page: options.page,
    limit: options.limit,
  }
}

export async function revokeAdminSession(id: string, headers: Headers) {
  const [target] = await database
    .select({ token: session.token, userId: session.userId })
    .from(session)
    .where(eq(session.id, id))
    .limit(1)
  if (!target) throw createServiceError("session_not_found", 404)
  try {
    await auth.api.revokeUserSession({
      headers,
      body: { sessionToken: target.token },
    })
  } catch (error) {
    const status =
      error instanceof APIError && error.statusCode === 403
        ? 403
        : error instanceof APIError && error.statusCode === 401
          ? 401
          : 503
    throw createServiceError("session_revoke_failed", status)
  }
  return { id, userId: target.userId }
}

export async function revokeAdminUserSessions(id: string, headers: Headers) {
  const [target] = await database
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, id))
    .limit(1)
  if (!target) throw createServiceError("user_not_found", 404)
  try {
    await auth.api.revokeUserSessions({ headers, body: { userId: id } })
  } catch (error) {
    const status =
      error instanceof APIError && error.statusCode === 403
        ? 403
        : error instanceof APIError && error.statusCode === 401
          ? 401
          : 503
    throw createServiceError("user_sessions_revoke_failed", status)
  }
  return { userId: id }
}

export async function listOAuthConsents(options: AdminConsentQuery) {
  const where = and(
    options.userId ? eq(oauthConsent.userId, options.userId) : undefined,
    options.clientId ? eq(oauthConsent.clientId, options.clientId) : undefined,
    options.search
      ? or(
          ilike(user.name, `%${options.search}%`),
          ilike(user.email, `%${options.search}%`),
          ilike(oauthClient.name, `%${options.search}%`),
          ilike(oauthConsent.clientId, `%${options.search}%`)
        )
      : undefined
  )
  const [items, totals] = await Promise.all([
    database
      .select(adminConsentSelection)
      .from(oauthConsent)
      .leftJoin(oauthClient, eq(oauthConsent.clientId, oauthClient.clientId))
      .leftJoin(user, eq(oauthConsent.userId, user.id))
      .where(where)
      .orderBy(desc(oauthConsent.updatedAt), desc(oauthConsent.id))
      .limit(options.limit)
      .offset((options.page - 1) * options.limit),
    database
      .select({ total: count() })
      .from(oauthConsent)
      .leftJoin(oauthClient, eq(oauthConsent.clientId, oauthClient.clientId))
      .leftJoin(user, eq(oauthConsent.userId, user.id))
      .where(where),
  ])
  return {
    items,
    total: totals[0]?.total ?? 0,
    page: options.page,
    limit: options.limit,
  }
}

// Better Auth 1.7.7 has no admin consent/grant revocation endpoint.
// Revoke the complete user/client grant, not just the visible resource-specific row.
export async function revokeOAuthConsent(id: string) {
  return database.transaction(async (tx) => {
    const [target] = await tx
      .select({ userId: oauthConsent.userId, clientId: oauthConsent.clientId })
      .from(oauthConsent)
      .where(eq(oauthConsent.id, id))
      .limit(1)
      .for("update")
    if (!target) throw createServiceError("oauth_consent_not_found", 404)
    if (!target.userId)
      throw createServiceError("consent_without_user_cannot_revoke_grant", 409)
    const revoked = new Date()
    await tx
      .update(oauthRefreshToken)
      .set({
        revoked,
        rotationReplayResponse: null,
        rotationReplayExpiresAt: null,
      })
      .where(
        and(
          eq(oauthRefreshToken.userId, target.userId),
          eq(oauthRefreshToken.clientId, target.clientId)
        )
      )
    await tx
      .update(oauthAccessToken)
      .set({ revoked })
      .where(
        and(
          eq(oauthAccessToken.userId, target.userId),
          eq(oauthAccessToken.clientId, target.clientId)
        )
      )
    await tx
      .delete(oauthConsent)
      .where(
        and(
          eq(oauthConsent.userId, target.userId),
          eq(oauthConsent.clientId, target.clientId)
        )
      )
    return {
      id,
      userId: target.userId,
      clientId: target.clientId,
      jwtAccessTokensValidUntilExpiry: true,
    }
  })
}

export async function listAuditLogs(options: AdminAuditQuery) {
  const where = and(
    options.actorUserId
      ? eq(auditLog.actorUserId, options.actorUserId)
      : undefined,
    options.outcome ? eq(auditLog.outcome, options.outcome) : undefined,
    options.resourceType
      ? inArray(auditLog.resourceType, options.resourceType)
      : undefined,
    options.from ? gte(auditLog.createdAt, new Date(options.from)) : undefined,
    options.to ? lte(auditLog.createdAt, new Date(options.to)) : undefined,
    options.search
      ? or(
          ilike(auditLog.action, `%${options.search}%`),
          ilike(auditLog.resourceId, `%${options.search}%`),
          ilike(sql`${auditLog.metadata}->>'actorName'`, `%${options.search}%`),
          ilike(sql`${auditLog.metadata}->>'actorEmail'`, `%${options.search}%`)
        )
      : undefined
  )
  // Safe projection only; existing arbitrary metadata is never exposed.
  const [items, totals] = await Promise.all([
    database
      .select(adminAuditSelection)
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(options.limit)
      .offset((options.page - 1) * options.limit),
    database.select({ total: count() }).from(auditLog).where(where),
  ])
  return {
    items,
    total: totals[0]?.total ?? 0,
    page: options.page,
    limit: options.limit,
  }
}
