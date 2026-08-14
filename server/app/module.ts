import express from "express"
import type { NextFunction, Request, Response } from "express"
import session from "express-session"
import { createServer } from "http"
import { Logger } from "@gorth/mechanism/lib/logger"
import {
  expressJwtSecret,
  expressPort,
  isExpressProduction,
} from "@/lib/utils/environment"
import { getCorsOrigins } from "@/lib/utils/formatter"
import jwksRoutes from "@/routes/jwks"
import authRoutes from "@/routes/auth"
import administratorRoutes from "@/routes/administrator"
import sharedRoutes from "@/routes/shared"
import { registerSsoRoutes } from "@/routes/sso"
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

  // ================================
  // 🌐 EXPRESS SERVER CONFIGURATION
  // ================================

  // CORS must run before sessions, parsers, routes, and authentication so
  // credentialed OPTIONS preflight requests always receive the correct headers.
  app.use(
    corsConfig({
      origin: [
        // "http://localhost:3000",
        // "http://localhost:8083",
        ...getCorsOrigins(),
      ],
    })
  )

  app.use(
    express.urlencoded({
      extended: true,
      limit: "50mb",
    })
  )

  app.use(helmetConfig())
  app.use(morganMiddleware())

  //   res.on('finish', () => {
  //     const duration = Date.now() - startTime;
  //     const method = req.method;
  //     const url = req.url;
  //     const status = res.statusCode;
  //     const durationMs = `${duration}ms`;

  //     console.log(`${method} ${url} ${status} in ${durationMs}`);
  //   });

  //   next();
  // });

  // app.use(
  //   express.urlencoded({
  //     extended: true,
  //     limit: "50mb",
  //   })
  // )

  app.use(bodyParserConfig())
  app.use(cookieParserConfig())
  app.use(
    session({
      secret: expressJwtSecret!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isExpressProduction,
        httpOnly: true,
        maxAge: 30 * 60 * 60 * 24,
        sameSite: "lax",
        // expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // Thời gian hết hạn cookie
        // secure: true, // Chỉ gửi cookie qua HTTPS
        // sameSite: 'Lax' // Hoặc 'Strict'. 'None' cần secure: true
        // path: '/', // Phạm vi cookie (thường là gốc)
      },
    })
  )

  /* ROUTES */
  await ensureOAuthClients()
  registerSsoRoutes(app)
  app.use("/.well-known", jwksRoutes)
  app.use("/auth", authRoutes)
  app.use("/administrator", administratorRoutes)
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
  // app.use(createRealtime);

  return app
}

export async function AppModuleX(): Promise<{
  app: ReturnType<typeof express>
  listen: (port?: number | string) => Promise<void>
}> {
  const timer = Date.now()
  const app = express()

  // ================================
  // 🌐 EXPRESS SERVER CONFIGURATION
  // ================================

  app.use(helmetConfig())
  app.use(morganMiddleware())

  //   res.on('finish', () => {
  //     const duration = Date.now() - startTime;
  //     const method = req.method;
  //     const url = req.url;
  //     const status = res.statusCode;
  //     const durationMs = `${duration}ms`;

  //     console.log(`${method} ${url} ${status} in ${durationMs}`);
  //   });

  //   next();
  // });

  // app.use(
  //   express.urlencoded({
  //     extended: true,
  //     limit: "50mb",
  //   })
  // )

  app.use(bodyParserConfig())
  app.use(cookieParserConfig())
  app.use(
    session({
      secret: expressJwtSecret!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isExpressProduction,
        httpOnly: true,
        maxAge: 30 * 60 * 60 * 24,
        sameSite: "lax",
        // expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // Thời gian hết hạn cookie
        // secure: true, // Chỉ gửi cookie qua HTTPS
        // sameSite: 'Lax' // Hoặc 'Strict'. 'None' cần secure: true
        // path: '/', // Phạm vi cookie (thường là gốc)
      },
    })
  )

  app.use(
    corsConfig({
      origin: ["http://localhost:3000", "http://localhost:8083"],
    })
  )

  /* ROUTES */
  await ensureOAuthClients()
  app.use(jwksRoutes)
  registerSsoRoutes(app)
  app.use("/administrator", administratorRoutes)
  app.use("/auth", authRoutes)
  app.use(sharedRoutes)

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

  const server = createServer(app)
  const defaultPort = Number(expressPort || 8080)
  // app.use(createRealtime);

  const start = async (port: number = defaultPort) => {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject)
      server.listen(port, () => {
        server.off("error", reject)
        const readyTime = Date.now() - timer
        const formattedTime =
          readyTime < 1000
            ? `${readyTime}ms`
            : `${(readyTime / 1000).toFixed(2)}s`
        console.log(Logger(`Ready in ${formattedTime}`, "success", "green"))
        resolve()
      })
    })
  }

  const shutdown = async () => {
    console.log("\b")
    server.close(() => {
      process.exit(0)
    })
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
  process.on("SIGUSR2", shutdown)

  return {
    app,
    listen: async (port?: number | string) => {
      const resolvedPort = Number(port ?? defaultPort)
      await start(resolvedPort)
    },
  }
}
