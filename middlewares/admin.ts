import type { MiddlewareHandler } from "hono"
import type { IncomingHttpHeaders } from "node:http"

import { requireAdminSession } from "@/services/admin"

export function requireAdmin(): MiddlewareHandler {
  return async (context, next) => {
    await requireAdminSession(context.req.header() as IncomingHttpHeaders)
    await next()
  }
}
