import express from "express"
import { type NextFunction, type Request, type Response } from "express"
import { morganMiddleware } from "@gorth/mechanism/configs/morgan"
import { Logger } from "@gorth/mechanism/lib/logger"
import z from "@/lib/structure/cores/zod"

import {
  bodyParserConfig,
  cookieParserConfig,
  corsConfig,
  helmetConfig,
} from "@/lib/mechanism/config"
import { isProduction } from "@/lib/utils/environment"
import { getCorsOrigins } from "@/lib/utils/formatter"
import adminRoutes from "@/routes/admin"
import authRoutes from "@/routes/auth"
import jwksRoutes from "@/routes/jwks"
import sharedRoutes from "@/routes/shared"
import ssoRoutes from "@/routes/sso"

const app = express()

if (isProduction) {
  app.set("trust proxy", 1)
}

app.use(
  corsConfig({
    origin: getCorsOrigins(),
  })
)
app.use(helmetConfig())

// In development, Morgan runs in Vite's host process so ANSI colors are
// written directly to the terminal instead of being escaped by SSR transport.
if (isProduction) {
  app.use(morganMiddleware())
}

// Better Auth must receive the raw request before JSON/urlencoded parsers.
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

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const validationError = error instanceof z.ZodError
  const statusCode = validationError
    ? 400
    : error instanceof Error &&
        "statusCode" in error &&
        typeof error.statusCode === "number"
      ? error.statusCode
      : 500
  const message = validationError
    ? "Invalid request"
    : error instanceof Error
      ? error.message
      : "Unknown error"

  console.log(Logger(`Error: ${error}`, "error", "red"))
  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal Server Error" : message,
    message:
      isProduction && statusCode >= 500 ? "Something went wrong" : message,
  })
})

export default app
