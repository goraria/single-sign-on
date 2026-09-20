import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { cache } from "hono/cache"
import { compress } from "hono/compress"
import { cors } from "hono/cors"
import { csrf } from "hono/csrf"
import { etag } from "hono/etag"
import { HTTPException } from "hono/http-exception"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { requestId } from "hono/request-id"
import { secureHeaders } from "hono/secure-headers"
import { timeout } from "hono/timeout"
import { timing } from "hono/timing"
import { rateLimiter } from "hono-rate-limiter"
import z from "@gorth/structure/cores/zod"

import { isDevelopment, isProduction } from "@/lib/utils/environment"
import { getCorsOrigins } from "@/lib/utils/formatter"
import { getOAuthClientOrigins } from "@/services/oauth-client"
import adminRoutes from "@/routes/admin"
import authRoutes from "@/routes/auth"
import jwksRoutes from "@/routes/jwks"
import sharedRoutes from "@/routes/shared"
import ssoRoutes from "@/routes/sso"

const app = new Hono()
const corsOrigins = await getOAuthClientOrigins(getCorsOrigins())

app.use("*", requestId())
app.use("*", logger())
app.use("*", timing())
app.use("*", secureHeaders())

app.use(
  "*",
  cors({
    origin: (origin) => corsOrigins.includes(origin) ? origin : null,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Gorth-Client-Secret",
      "X-Gorth-Legacy-Sso",
      "X-Request-Id",
    ],
    exposeHeaders: [
      "Content-Length",
      "Deprecation",
      "Sunset",
      "Link",
      "X-Request-Id",
      "Server-Timing",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    credentials: true,
    maxAge: 86400,
  }),
)

app.use(
  "*",
  csrf({
    origin: (origin, context) =>
      origin === new URL(context.req.url).origin ||
      corsOrigins.includes(origin),
  }),
)

app.use(
  "*",
  rateLimiter({
    windowMs: 60_000,
    limit: 100,
    standardHeaders: "draft-6",
    keyGenerator: (context) =>
      context.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      context.req.header("x-real-ip") ??
      "unknown",
  }),
)

app.use(
  "*",
  bodyLimit({
    maxSize: 10 * 1024 * 1024,
    onError: (context) =>
      context.json({ error: "Payload Too Large" }, 413),
  }),
)

app.use(
  "*",
  timeout(
    30_000,
    () =>
      new HTTPException(408, {
        message: "Request Timeout",
      }),
  ),
)

app.use("*", compress())
app.use("*", etag())

// Authentication, sessions, and user-specific data must not be cached.
// Enable cache only for an explicitly public route namespace.
// app.use(
//   "/public/*",
//   cache({
//     cacheName: "single-sign-on-public",
//     cacheControl: "public, max-age=60",
//   }),
// )

if (isDevelopment) {
  app.use("*", prettyJSON())
}

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
    404,
  ),
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
      400,
    )
  }

  console.error("[single-sign-on-error]", error)

  return context.json(
    {
      error: "Internal Server Error",
      message: isProduction ? "Something went wrong" : error.message,
    },
    500,
  )
})

export default app
