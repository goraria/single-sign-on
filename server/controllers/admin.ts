import type { Context } from "hono"

import {
  adminIdParamsSchema,
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
  listOAuthConsents as listOAuthConsentsServices,
  listOAuthResources as listOAuthResourcesServices,
  listSessions as listSessionsServices,
  listSsoApplications as listSsoApplicationsServices,
  listUsers as listUsersServices,
  updateSsoApplication as updateSsoApplicationServices,
  updateUser as updateUserServices,
} from "@/services/admin"

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
    data: await createSsoApplicationServices(input),
    message: "SSO application created",
  })
}

export async function updateSsoApplication(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  const input = adminSsoApplicationPatchSchema.parse(await context.req.json())
  return context.json({
    data: await updateSsoApplicationServices(id, input),
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
    data: await createUserServices(input),
    message: "User created",
  })
}

export async function updateUser(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  const input = adminUserPatchSchema.parse(await context.req.json())
  return context.json({
    data: await updateUserServices(id, input),
    message: "User updated",
  })
}

export async function listSessions(context: Context) {
  return context.json({ data: await listSessionsServices() })
}

export async function listOAuthResources(context: Context) {
  return context.json({ data: await listOAuthResourcesServices() })
}

export async function listOAuthConsents(context: Context) {
  return context.json({ data: await listOAuthConsentsServices() })
}
