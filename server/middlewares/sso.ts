import type { MiddlewareHandler } from "hono"
import { HTTPException } from "hono/http-exception"

import { authSecret } from "@/lib/utils/environment"

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

export function requireLegacySso(): MiddlewareHandler {
  return async (context, next) => {
    if (context.req.header("x-gorth-legacy-sso") !== "true") {
      throw new HTTPException(410, {
        message: "legacy_sso_issue_disabled",
      })
    }

    await next()
  }
}

export function deprecateLegacySso(): MiddlewareHandler {
  return async (context, next) => {
    context.header("Deprecation", "true")
    context.header(
      "Sunset",
      new Date("2026-12-31T00:00:00.000Z").toUTCString(),
    )
    context.header("Link", '</auth/oauth2/authorize>; rel="successor-version"')
    await next()
  }
}
