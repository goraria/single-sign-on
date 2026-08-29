import express from "express"
import type { NextFunction, Request, Response } from "express"
import { Logger } from "@gorth/mechanism/lib/logger"
import { isExpressProduction } from "@/lib/utils/environment"
import { getCorsOrigins } from "@/lib/utils/formatter"
import jwksRoutes from "@/routes/jwks"
import authRoutes from "@/routes/auth"
import adminRoutes from "@/routes/admin"
import sharedRoutes from "@/routes/shared"
import ssoRoutes from "@/routes/sso"
import {
  corsConfig,
  helmetConfig,
  morganMiddleware,
  bodyParserConfig,
  cookieParserConfig,
} from "@/lib/mechanism/config"
import { ensureOAuthClients } from "@/services/oauth-client"

export default async function AppModule() {
  const app = express()

  if (isExpressProduction) {
    app.set("trust proxy", 1)
  }

  // CORS must run before parsers, routes, and authentication so
  // credentialed OPTIONS preflight requests always receive the correct headers.
  app.use(
    corsConfig({
      origin: getCorsOrigins(),
    })
  )

  app.use(helmetConfig())
  app.use(morganMiddleware())

  // Better Auth must receive the raw request before JSON/urlencoded parsers.
  // Mounting bodyParserConfig before this route can leave client calls pending.
  await ensureOAuthClients()
  app.use("/auth", authRoutes)

  // Parsers are only needed by application-owned routes below.
  app.use(bodyParserConfig())
  app.use(cookieParserConfig())

  app.use("/internal", ssoRoutes)
  app.use("/.well-known", jwksRoutes)
  app.use("/admin", adminRoutes)
  app.use("/", sharedRoutes)

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: "Not Found",
      message: `Route ${req.method} ${req.url} not found`,
    })
  })

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode =
      "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : 500
    console.log(Logger(`Error: ${error}`, "error", "red"))
    res.status(statusCode).json({
      error: statusCode >= 500 ? "Internal Server Error" : error.message,
      message:
        isExpressProduction && statusCode >= 500
          ? "Something went wrong"
          : error.message,
    })
  })
  return app
}
