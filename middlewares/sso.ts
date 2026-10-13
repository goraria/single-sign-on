import type { MiddlewareHandler } from "hono"
import { HTTPException } from "hono/http-exception"

import { authSecret } from "@/utils/environment"

export function requireSsoClient(): MiddlewareHandler {
  return async (context, next) => {
    if (!authSecret) {
      throw new HTTPException(500, {
        message: "gorth_client_secret_not_configured",
      })
    }

    if (context.req.header("x-gorth-client-secret") !== authSecret) {
      throw new HTTPException(403, { message: "forbidden" })
    }

    await next()
  }
}
