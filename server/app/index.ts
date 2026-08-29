import express from "express"
import type { NextFunction, Request, Response } from "express"
import { Logger } from "@gorth/mechanism/lib/logger"

import {
  bodyParserConfig,
  cookieParserConfig,
  corsConfig,
  helmetConfig,
  morganMiddleware,
} from "@/lib/mechanism/config"
import { isExpressProduction } from "@/lib/utils/environment"
import { getCorsOrigins } from "@/lib/utils/formatter"
import adminRoutes from "@/routes/admin"
import authRoutes from "@/routes/auth"
import jwksRoutes from "@/routes/jwks"
import sharedRoutes from "@/routes/shared"
import ssoRoutes from "@/routes/sso"
import { ensureOAuthClients } from "@/services/oauth-client"

const app = express()

if (isExpressProduction) {
  app.set("trust proxy", 1)
}

app.use(
  corsConfig({
    origin: getCorsOrigins(),
  })
)
app.use(helmetConfig())
app.use(morganMiddleware())

// Better Auth must receive the raw request before JSON/urlencoded parsers.
await ensureOAuthClients()
app.use("/auth", authRoutes)

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

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
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

export default app
