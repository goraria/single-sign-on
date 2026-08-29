import { Router, type NextFunction, type Request, type Response } from "express"
import { randomUUID } from "node:crypto"
import jwt from "@gorth/mechanism/cores/jsonwebtoken"

import { auth } from "@/lib/auth"
import {
  accessTokenExpiresIn,
  accessTokenSecret,
  betterAuthSecret,
  betterAuthUrl,
  jwtSecret,
  refreshTokenExpiresIn,
  refreshTokenSecret,
  ssoClientInternalSecret,
} from "@/lib/utils/environment"
import { fromNodeHeaders } from "@/lib/structure/auth/server"
import { toSsoUser, toSsoUserFromClaims, type SsoUser } from "@/services/user"

interface SsoAppContext {
  id: string
  origin: string
  redirect_uri: string
  next?: string | null
}

interface TokenBundleRequest {
  app?: Partial<SsoAppContext>
}

interface TokenVerifyRequest extends TokenBundleRequest {
  access_token?: string
  refresh_token?: string
}

type JwtPayloadLike = Record<string, unknown>
type TokenExpiresIn = string | number

interface GorthTokenPayload extends JwtPayloadLike {
  sub: string
  email: string
  sid?: string | null
  app?: string
  app_origin?: string
  role?: string
  name?: string
  preferred_username?: string | null
  given_name?: string | null
  family_name?: string | null
  picture?: string | null
  typ?: "access" | "refresh"
}

function normalizeOrigin(value: string | undefined | null) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function toSsoUserFromToken(payload: GorthTokenPayload): SsoUser {
  return toSsoUserFromClaims({
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    name: payload.name,
    preferredUsername: payload.preferred_username,
    givenName: payload.given_name,
    familyName: payload.family_name,
    picture: payload.picture,
  })
}

function getRequiredSecret(name: string, value: string | undefined) {
  if (!value) {
    throw Object.assign(new Error(`missing_${name.toLowerCase()}`), {
      statusCode: 500,
    })
  }

  return value
}

function getIssuer(req: Request) {
  return betterAuthUrl ?? `${req.protocol}://${req.get("host")}`
}

function getAppContext(req: Request): SsoAppContext {
  const body = req.body as TokenBundleRequest
  const app = body.app ?? {}
  const redirectUri =
    typeof app.redirect_uri === "string" ? app.redirect_uri : ""
  const origin = normalizeOrigin(
    typeof app.origin === "string" ? app.origin : redirectUri
  )

  if (!redirectUri || !origin) {
    throw Object.assign(new Error("invalid_app_context"), { statusCode: 400 })
  }

  return {
    id: typeof app.id === "string" && app.id.trim() ? app.id.trim() : origin,
    origin,
    redirect_uri: redirectUri,
    next: typeof app.next === "string" ? app.next : null,
  }
}

function getAppContextFromToken(
  req: Request,
  payload: GorthTokenPayload
): SsoAppContext {
  const body = req.body as TokenVerifyRequest
  const app = body.app ?? {}
  const bodyRedirectUri =
    typeof app.redirect_uri === "string" ? app.redirect_uri : ""
  const origin =
    normalizeOrigin(
      typeof app.origin === "string" ? app.origin : bodyRedirectUri
    ) ?? normalizeOrigin(payload.app_origin)

  if (!origin) {
    throw Object.assign(new Error("invalid_app_context"), { statusCode: 400 })
  }

  return {
    id:
      typeof app.id === "string" && app.id.trim()
        ? app.id.trim()
        : (payload.app ?? origin),
    origin,
    redirect_uri: bodyRedirectUri || origin,
    next: typeof app.next === "string" ? app.next : null,
  }
}

function getTokenSecrets() {
  return {
    accessTokenSecret: getRequiredSecret(
      "EXPRESS_GORTH_ACCESS_TOKEN_SECRET",
      accessTokenSecret ?? betterAuthSecret ?? jwtSecret
    ),
    refreshTokenSecret: getRequiredSecret(
      "EXPRESS_GORTH_REFRESH_TOKEN_SECRET",
      refreshTokenSecret ?? betterAuthSecret ?? jwtSecret
    ),
  }
}

function assertSsoClient(req: Request) {
  const expected = ssoClientInternalSecret

  if (!expected) {
    return
  }

  if (req.get("x-sso-client-secret") !== expected) {
    throw Object.assign(new Error("forbidden"), { statusCode: 403 })
  }
}

function assertLegacySsoIssueEnabled(req: Request) {
  if (req.get("x-gorth-legacy-sso") === "true") {
    return
  }

  throw Object.assign(new Error("legacy_sso_issue_disabled"), {
    statusCode: 410,
  })
}

function setLegacySsoDeprecationHeaders(res: Response) {
  res.setHeader("Deprecation", "true")
  res.setHeader("Sunset", new Date("2026-12-31T00:00:00.000Z").toUTCString())
  res.setHeader("Link", '</auth/oauth2/authorize>; rel="successor-version"')
}

function getExpiresIn(
  name: "access" | "refresh",
  fallback: TokenExpiresIn
): TokenExpiresIn {
  return (
    (name === "access" ? accessTokenExpiresIn : refreshTokenExpiresIn) ??
    fallback
  )
}

function signTokenPair(
  req: Request,
  user: SsoUser,
  appContext: SsoAppContext,
  sessionId: string | null
) {
  const issuer = getIssuer(req)
  const { accessTokenSecret, refreshTokenSecret } = getTokenSecrets()
  const tokenBasePayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.user_metadata.name,
    preferred_username: user.user_metadata.username,
    given_name: user.user_metadata.first_name,
    family_name: user.user_metadata.last_name,
    picture: user.user_metadata.picture,
    sid: sessionId,
    app: appContext.id,
    app_origin: appContext.origin,
  }

  return {
    access_token: jwt.sign(
      {
        ...tokenBasePayload,
        typ: "access",
      },
      accessTokenSecret,
      {
        expiresIn: getExpiresIn("access", "15m"),
        issuer,
        audience: appContext.id,
        jwtid: randomUUID(),
      }
    ),
    refresh_token: jwt.sign(
      {
        ...tokenBasePayload,
        typ: "refresh",
      },
      refreshTokenSecret,
      {
        expiresIn: getExpiresIn("refresh", "30d"),
        issuer,
        audience: appContext.id,
        jwtid: randomUUID(),
      }
    ),
  }
}

function assertTokenPayload(
  payload: string | JwtPayloadLike,
  expectedType: GorthTokenPayload["typ"]
): GorthTokenPayload {
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    payload.typ !== expectedType
  ) {
    throw Object.assign(new Error("invalid_token"), { statusCode: 401 })
  }

  return payload as GorthTokenPayload
}

function verifyToken(
  token: string,
  secret: string,
  expectedType: GorthTokenPayload["typ"]
) {
  return assertTokenPayload(jwt.verify(token, secret), expectedType)
}

function createTokenResponse(
  req: Request,
  user: SsoUser,
  appContext: SsoAppContext,
  sessionId: string | null
) {
  const tokens = signTokenPair(req, user, appContext, sessionId)

  return {
    user,
    sso_sub: user.id,
    email: user.email,
    ...tokens,
    gorth_app: {
      ...appContext,
      issued_at: Date.now(),
    },
  }
}

function getSessionId(session: unknown) {
  if (
    session &&
    typeof session === "object" &&
    "session" in session &&
    session.session &&
    typeof session.session === "object" &&
    "id" in session.session &&
    typeof session.session.id === "string"
  ) {
    return session.session.id
  }

  return null
}

const router = Router()

router.post(
  "/sso/token-bundle",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      assertSsoClient(req)
      assertLegacySsoIssueEnabled(req)
      setLegacySsoDeprecationHeaders(res)

      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      })

      if (!session?.user?.email) {
        res.status(401).json({ error: "unauthorized" })
        return
      }

      const appContext = getAppContext(req)
      const user = toSsoUser(session.user)

      res
        .status(200)
        .json(createTokenResponse(req, user, appContext, getSessionId(session)))
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  "/sso/verify-token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      assertSsoClient(req)
      setLegacySsoDeprecationHeaders(res)

      const body = req.body as TokenVerifyRequest
      const accessToken =
        typeof body.access_token === "string" ? body.access_token : ""
      const refreshToken =
        typeof body.refresh_token === "string" ? body.refresh_token : ""
      const { accessTokenSecret, refreshTokenSecret } = getTokenSecrets()

      if (!accessToken && !refreshToken) {
        res.status(401).json({ error: "missing_token" })
        return
      }

      try {
        const accessPayload = verifyToken(
          accessToken,
          accessTokenSecret,
          "access"
        )
        const appContext = getAppContextFromToken(req, accessPayload)
        const user = toSsoUserFromToken(accessPayload)

        res.status(200).json({
          user,
          sso_sub: user.id,
          email: user.email,
          access_token: accessToken,
          refresh_token: refreshToken,
          gorth_app: {
            ...appContext,
            issued_at: Date.now(),
          },
        })
        return
      } catch (error) {
        if (!(error instanceof jwt.TokenExpiredError) || !refreshToken) {
          throw error
        }
      }

      const refreshPayload = verifyToken(
        refreshToken,
        refreshTokenSecret,
        "refresh"
      )
      const appContext = getAppContextFromToken(req, refreshPayload)
      const user = toSsoUserFromToken(refreshPayload)

      res
        .status(200)
        .json(
          createTokenResponse(req, user, appContext, refreshPayload.sid ?? null)
        )
    } catch (error) {
      next(error)
    }
  }
)

export default router
