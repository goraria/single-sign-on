import express from "express"
import { corsConfig } from "@/lib/mechanism/config"
import { getCorsOrigins } from "@/lib/utils/formatter"

const bootstrap = express()

// Keep the standalone health check independent from database initialization.
bootstrap.get(
  "/health",
  corsConfig({
    origin: getCorsOrigins(),
  }),
  (_req, res) => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    })
  }
)

bootstrap.use(
  (() => {
    let applicationPromise: ReturnType<
      (typeof import("@/app/module"))["default"]
    > | null = null

    return async (req, res, next) => {
      try {
        applicationPromise ??= import("@/app/module").then(
          ({ default: AppModule }) => AppModule()
        )

        const application = await applicationPromise
        application(req, res, next)
      } catch (error) {
        applicationPromise = null
        next(error)
      }
    }
  })()
)

bootstrap.use(
  (error: unknown, _req: express.Request, res: express.Response) => {
    console.error("[application-bootstrap-error]", error)
    res.status(500).json({
      error: "Internal Server Error",
      message: "Application initialization failed",
    })
  }
)

export default bootstrap
