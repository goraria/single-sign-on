import { adminIdParamsSchema } from "@/schemas/admin"
import { adoptOAuthClient as adoptOAuthClientServices } from "@/services/oauth-management"
import type { Context } from "hono"
import { oauthScopePublicationSchema } from "@/schemas/oauth-registry"
import {
  listOAuthScopeRevisions as listOAuthScopeRevisionsServices,
  publishOAuthScopeRevision as publishOAuthScopeRevisionServices,
} from "@/services/oauth-registry"
import { createServiceError } from "@/services/helper"

export async function listOAuthScopeRevisions(context: Context) {
  return context.json({ data: await listOAuthScopeRevisionsServices() })
}

export async function publishOAuthScopeRevision(context: Context) {
  const actor = context.get("adminActor") as { id: string; role: string }
  if (actor.role !== "master") throw createServiceError("forbidden", 403)
  const input = oauthScopePublicationSchema.parse(await context.req.json())
  return context.json(
    { data: await publishOAuthScopeRevisionServices(input, actor.id) },
    201
  )
}

export async function adoptOAuthClient(context: Context) {
  const actor = context.get("adminActor") as { role: string }
  if (actor.role !== "master") throw createServiceError("forbidden", 403)
  const { id } = adminIdParamsSchema.parse(context.req.param())
  return context.json({ data: await adoptOAuthClientServices(id) })
}
