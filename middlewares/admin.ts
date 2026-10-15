import type { MiddlewareHandler } from "hono"
import type { IncomingHttpHeaders } from "node:http"

import { requireAdminSession } from "@/services/admin"

export function requireAdmin(): MiddlewareHandler {
  return async (context, next) => {
    context.header("Cache-Control", "no-store")
    const actor = await requireAdminSession(
      context.req.header() as IncomingHttpHeaders
    )
    context.set("adminActor", actor)
    await next()
  }
}
