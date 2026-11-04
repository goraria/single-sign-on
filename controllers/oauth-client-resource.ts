import type { Context } from "hono"
import { adminIdParamsSchema } from "@/schemas/admin"
import { oauthClientResourceParamsSchema } from "@/schemas/oauth-client-resource"
import {
  listOAuthClientResources as listOAuthClientResourcesServices,
  linkOAuthClientResource as linkOAuthClientResourceServices,
  unlinkOAuthClientResource as unlinkOAuthClientResourceServices,
} from "@/services/oauth-client-resource"

export async function listOAuthClientResources(context: Context) {
  const { id } = adminIdParamsSchema.parse(context.req.param())
  return context.json({ data: await listOAuthClientResourcesServices(id) })
}
export async function linkOAuthClientResource(context: Context) {
  const { id, resourceId } = oauthClientResourceParamsSchema.parse(
    context.req.param()
  )
  return context.json({
    data: await linkOAuthClientResourceServices(
      id,
      resourceId,
      context.req.raw.headers
    ),
  })
}
export async function unlinkOAuthClientResource(context: Context) {
  const { id, resourceId } = oauthClientResourceParamsSchema.parse(
    context.req.param()
  )
  return context.json({
    data: await unlinkOAuthClientResourceServices(
      id,
      resourceId,
      context.req.raw.headers
    ),
  })
}
