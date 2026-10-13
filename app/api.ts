import "server-only"
import { Hono } from "hono"
import { configureHono } from "@gorth/principle/configs/hono"
import { HTTPException } from "hono/http-exception"
import z from "@gorth/structure/cores/zod"

import { isDevelopment, isProduction } from "@/utils/environment"
import { getCorsOrigins } from "@/utils/server/formatter"
import { DatabaseRateLimitStore } from "@/lib/rate-limit/database-store"
import { getOAuthClientOrigins } from "@/services/oauth-client"
import adminRoutes from "@/routes/admin"
import authRoutes from "@/routes/auth"
import jwksRoutes from "@/routes/jwks"
import sharedRoutes from "@/routes/shared"
import ssoRoutes from "@/routes/sso"

export default async function AppModule() {
  const app = new Hono()
  const corsOrigins = getCorsOrigins()
  const isAuthPath = (path: string) =>
    path === "/auth" || path.startsWith("/auth/")
  const isCorsOriginAllowed = async (origin: string) =>
    Boolean(origin) &&
    (corsOrigins.includes(origin) ||
      (await getOAuthClientOrigins(corsOrigins)).includes(origin))

  configureHono(app, {
    development: isDevelopment,
    logger: false,
    cors: {
      origin: async (origin) =>
        (await isCorsOriginAllowed(origin)) ? origin : null,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-Gorth-Client-Secret",
        "X-Gorth-Legacy-Sso",
        "X-Request-Id",
        "DPoP",
      ],
      exposeHeaders: [
        "Content-Length",
        "Deprecation",
        "Sunset",
        "Link",
        "X-Request-Id",
        "Server-Timing",
        "RateLimit-Limit",
        "RateLimit-Remaining",
        "RateLimit-Reset",
        "Retry-After",
        "WWW-Authenticate",
        "DPoP-Nonce",
      ],
      credentials: true,
      maxAge: 86400,
    },
    csrf: {
      origin: async (origin) => await isCorsOriginAllowed(origin),
      // Better Auth owns CSRF and origin validation for its protocol endpoints.
      skip: (context) => isAuthPath(context.req.path),
    },
    rateLimit: {
      store: new DatabaseRateLimitStore(),
      keyGenerator: (context) =>
        context.req.header("x-real-ip") ??
        context.req.header("x-forwarded-for")?.split(",").at(-1)?.trim() ??
        "unknown",
      // Better Auth limits native endpoints. Our timeout preparation endpoint
      // is outside its handler and must use the application's persistent limiter.
      skip: (context) =>
        (isAuthPath(context.req.path) &&
          context.req.path !== "/auth/oauth-timeout") ||
        context.req.path === "/health",
    },
    bodyLimit: { maxSize: 10 * 1024 * 1024 },
    compress: false,
  })

  app.route("/auth", authRoutes)
  app.route("/internal", ssoRoutes)
  app.route("/.well-known", jwksRoutes)
  app.route("/admin", adminRoutes)
  app.route("/", sharedRoutes)

  app.notFound((context) =>
    context.json(
      {
        error: "Not Found",
        message: `Route ${context.req.method} ${context.req.path} not found`,
      },
      404
    )
  )

  app.onError((error, context) => {
    if (error instanceof HTTPException) {
      return error.getResponse()
    }

    if (error instanceof z.ZodError) {
      return context.json(
        {
          error: "Bad Request",
          message: "Invalid request",
        },
        400
      )
    }

    console.error("[single-sign-on-error]", error)

    return context.json(
      {
        error: "Internal Server Error",
        message: isProduction ? "Something went wrong" : error.message,
      },
      500
    )
  })

  return app
}
