import { type NextFunction, type Request, type Response } from "express"

import { authSecret } from "@/lib/utils/environment"

export function requireSsoClient() {
  return function requireSsoClientMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    if (!authSecret) {
      next(
        Object.assign(new Error("gorth_client_secret_not_configured"), {
          statusCode: 500,
        })
      )
      return
    }

    if (req.get("x-gorth-client-secret") !== authSecret) {
      next(Object.assign(new Error("forbidden"), { statusCode: 403 }))
      return
    }

    next()
  }
}

export function requireLegacySso() {
  return function requireLegacySsoMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    if (req.get("x-gorth-legacy-sso") !== "true") {
      next(
        Object.assign(new Error("legacy_sso_issue_disabled"), {
          statusCode: 410,
        })
      )
      return
    }

    next()
  }
}

export function deprecateLegacySso() {
  return function deprecateLegacySsoMiddleware(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    res.setHeader("Deprecation", "true")
    res.setHeader("Sunset", new Date("2026-12-31T00:00:00.000Z").toUTCString())
    res.setHeader("Link", '</auth/oauth2/authorize>; rel="successor-version"')
    next()
  }
}
