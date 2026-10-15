import z from "@gorth/structure/cores/zod"
import { sql } from "drizzle-orm"
import {
  auditLog,
  oauthClient,
  oauthConsent,
  session,
  user,
} from "@/database/schema"

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(256).default(""),
})
const optionalId = z.string().uuid().optional()

export const adminSessionQuerySchema = pageQuery.extend({ userId: optionalId })
export const adminConsentQuerySchema = pageQuery.extend({
  userId: optionalId,
  clientId: z.string().trim().min(1).max(256).optional(),
})
export const adminAuditQuerySchema = pageQuery
  .extend({
    actorUserId: optionalId,
    outcome: z.enum(["success", "failure"]).optional(),
    resourceType: z
      .preprocess(
        (value) =>
          typeof value === "string" ? value.split(",").filter(Boolean) : value,
        z
          .array(
            z.enum([
              "user",
              "session",
              "oauth-consent",
              "oauth-resource",
              "sso-application",
              "auth-admin",
            ])
          )
          .min(1)
          .max(6)
      )
      .optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
  })
  .refine(
    (value) =>
      !value.from || !value.to || new Date(value.from) <= new Date(value.to),
    { message: "Invalid date range" }
  )

export const adminSessionSelection = {
  id: session.id,
  userId: session.userId,
  userName: user.name,
  userEmail: user.email,
  ipAddress: session.ipAddress,
  userAgent: session.userAgent,
  expiresAt: session.expiresAt,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
}
export const adminConsentSelection = {
  id: oauthConsent.id,
  clientId: oauthConsent.clientId,
  clientName: oauthClient.name,
  userId: oauthConsent.userId,
  userName: user.name,
  userEmail: user.email,
  referenceId: oauthConsent.referenceId,
  resources: oauthConsent.resources,
  scopes: oauthConsent.scopes,
  createdAt: oauthConsent.createdAt,
  updatedAt: oauthConsent.updatedAt,
}
export const adminAuditSelection = {
  id: auditLog.id,
  actorUserId: auditLog.actorUserId,
  action: auditLog.action,
  outcome: auditLog.outcome,
  resourceType: auditLog.resourceType,
  resourceId: auditLog.resourceId,
  createdAt: auditLog.createdAt,
  actorName: sql<string | null>`${auditLog.metadata}->>'actorName'`,
  actorEmail: sql<string | null>`${auditLog.metadata}->>'actorEmail'`,
  requestId: sql<string | null>`${auditLog.metadata}->>'requestId'`,
  phase: sql<string | null>`${auditLog.metadata}->>'phase'`,
  status: sql<string | null>`${auditLog.metadata}->>'status'`,
  subjectUserId: sql<string | null>`${auditLog.metadata}->>'subjectUserId'`,
  clientId: sql<string | null>`${auditLog.metadata}->>'clientId'`,
}
export type AdminSessionQuery = z.infer<typeof adminSessionQuerySchema>
export type AdminConsentQuery = z.infer<typeof adminConsentQuerySchema>
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>
