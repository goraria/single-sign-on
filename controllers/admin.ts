import type { Context } from "hono"

import {
  adminIdParamsSchema,
  adminOAuthResourceListQuerySchema,
  adminOAuthResourcePayloadSchema,
  adminSsoApplicationListQuerySchema,
  adminSsoApplicationPatchSchema,
  adminSsoApplicationPayloadSchema,
  adminUserListQuerySchema,
  adminUserPatchSchema,
  adminUserPayloadSchema,
} from "@/schemas/admin"
import {
  createSsoApplication as createSsoApplicationServices,
  createUser as createUserServices,
  deleteSsoApplication as deleteSsoApplicationServices,
  getSsoApplication as getSsoApplicationServices,
  getUserById as getUserByIdServices,
  listOAuthResources as listOAuthResourcesServices,
  listSsoApplications as listSsoApplicationsServices,
  listUsers as listUsersServices,
  updateSsoApplication as updateSsoApplicationServices,
  updateUser as updateUserServices,
  getOAuthResource as getOAuthResourceServices,
  createOAuthResource as createOAuthResourceServices,
  updateOAuthResource as updateOAuthResourceServices,
  deleteOAuthResource as deleteOAuthResourceServices,
} from "@/services/admin"
import {
  adminAuditQuerySchema,
  adminConsentQuerySchema,
  adminSessionQuerySchema,
} from "@/schemas/admin-security"
import {
  listAuditLogs as listAuditLogsServices,
  listSessions as listSessionsServices,
  listOAuthConsents as listOAuthConsentsServices,
  revokeAdminSession as revokeAdminSessionServices,
  revokeAdminUserSessions as revokeAdminUserSessionsServices,
  revokeOAuthConsent as revokeOAuthConsentServices,
} from "@/services/admin-security"

export async function listSsoApplications(context: Context) {
  const options = adminSsoApplicationListQuerySchema.parse(context.req.query())
  return context.json({ data: await listSsoApplicationsServices(options) })
}

export async function getSsoApplication(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  return context.json({ data: await getSsoApplicationServices(id) })
}

export async function createSsoApplication(context: Context) {
  const input = adminSsoApplicationPayloadSchema.parse(await context.req.json())
  return context.json({
    data: await createSsoApplicationServices(input, context.req.raw.headers),
    message: "SSO application created",
  })
}

export async function updateSsoApplication(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  const input = adminSsoApplicationPatchSchema.parse(await context.req.json())
  return context.json({
    data: await updateSsoApplicationServices(
      id,
      input,
      context.req.raw.headers
    ),
    message: "SSO application updated",
  })
}

export async function deleteSsoApplication(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  return context.json({
    data: await deleteSsoApplicationServices(id),
    message: "SSO application deleted",
  })
}

export async function listUsers(context: Context) {
  const options = adminUserListQuerySchema.parse(context.req.query())
  return context.json({ data: await listUsersServices(options) })
}

export async function getUserById(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  return context.json({ data: await getUserByIdServices(id) })
}

export async function createUser(context: Context) {
  const input = adminUserPayloadSchema.parse(await context.req.json())
  return context.json({
    data: await createUserServices(input, context.req.header()),
    message: "User created",
  })
}

export async function updateUser(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  const input = adminUserPatchSchema.parse(await context.req.json())
  return context.json({
    data: await updateUserServices(id, input, context.req.header()),
    message: "User updated",
  })
}

export async function listSessions(context: Context) {
  const options = adminSessionQuerySchema.parse(context.req.query())
  return context.json({ data: await listSessionsServices(options) })
}

export async function listOAuthResources(context: Context) {
  const options = adminOAuthResourceListQuerySchema.parse(context.req.query())
  return context.json({ data: await listOAuthResourcesServices(options) })
}

export async function getOAuthResource(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  return context.json({ data: await getOAuthResourceServices(id) })
}

export async function createOAuthResource(context: Context) {
  const input = adminOAuthResourcePayloadSchema.parse(await context.req.json())
  return context.json(
    {
      data: await createOAuthResourceServices(input, context.req.raw.headers),
      message: "OAuth resource created",
    },
    201
  )
}

export async function updateOAuthResource(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  const input = adminOAuthResourcePayloadSchema.parse(await context.req.json())
  return context.json({
    data: await updateOAuthResourceServices(id, input, context.req.raw.headers),
    message: "OAuth resource updated",
  })
}

export async function deleteOAuthResource(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  return context.json({
    data: await deleteOAuthResourceServices(id, context.req.raw.headers),
    message: "OAuth resource deleted",
  })
}

export async function listOAuthConsents(context: Context) {
  const options = adminConsentQuerySchema.parse(context.req.query())
  return context.json({ data: await listOAuthConsentsServices(options) })
}

export async function listAuditLogs(context: Context) {
  const options = adminAuditQuerySchema.parse(context.req.query())
  return context.json({ data: await listAuditLogsServices(options) })
}

export async function revokeAdminSession(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  return context.json({
    data: await revokeAdminSessionServices(id, context.req.raw.headers),
  })
}

export async function revokeAdminUserSessions(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  return context.json({
    data: await revokeAdminUserSessionsServices(id, context.req.raw.headers),
  })
}

export async function revokeOAuthConsent(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  return context.json({ data: await revokeOAuthConsentServices(id) })
}
