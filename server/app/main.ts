import express from "express"
import { corsConfig } from "@/lib/mechanism/config"
import { getCorsOrigins } from "@/lib/utils/formatter"

const bootstrap = express()

// CORS must run before the standalone health check and before the lazily
// initialized application. Otherwise /health bypasses AppModule's CORS layer.
bootstrap.use(
  corsConfig({
    origin: getCorsOrigins(),
  })
)

let applicationPromise: ReturnType<
  typeof import("@/app/module")["default"]
> | null = null

function getApplication() {
  applicationPromise ??= import("@/app/module").then(({ default: AppModule }) =>
    AppModule()
  )

  return applicationPromise
}

// Health checks must not depend on database or Better Auth initialization.
// This also keeps cold-start configuration errors visible in Vercel logs.
bootstrap.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  })
})

bootstrap.use(async (req, res, next) => {
  try {
    const application = await getApplication()
    application(req, res, next)
  } catch (error) {
    applicationPromise = null
    next(error)
  }
})

bootstrap.use((error: unknown, _req: express.Request, res: express.Response) => {
  console.error("[application-bootstrap-error]", error)
  res.status(500).json({
    error: "Internal Server Error",
    message: "Application initialization failed",
  })
})

export default bootstrap
