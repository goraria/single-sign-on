import { randomUUID } from "node:crypto"
import { type IncomingHttpHeaders } from "node:http"
import jwt from "@gorth/mechanism/cores/jsonwebtoken"

import { auth } from "@/lib/auth"
import { fromNodeHeaders } from "@/lib/structure/auth/server"
import {
  accessTokenExpiresIn,
  accessTokenSecret,
  betterAuthSecret,
  jwtSecret,
  refreshTokenExpiresIn,
  refreshTokenSecret,
} from "@/lib/utils/environment"
import {
  formatSsoUser,
  formatSsoUserFromClaims,
  formatSsoTokenResponse,
  getSessionId,
  normalizeOrigin,
  type SsoUser,
} from "@/lib/utils/formatter"
import {
  type OAuthClientRedirectPolicy,
  type SsoAppContextInput,
  type TokenBundleInput,
  type TokenVerifyInput,
} from "@/schemas/sso"
import { isOAuthClientRedirectAllowed } from "@/services/oauth-client"
import { createServiceError } from "@/services/helper"

interface SsoAppContext {
  id: string
  origin: string
  redirect_uri: string
  next?: string | null
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

function getRequiredSecret(name: string, value: string | undefined) {
  if (!value) {
    throw createServiceError(`missing_${name.toLowerCase()}`, 500)
  }

  return value
}

function getAppContext(app: SsoAppContextInput): SsoAppContext {
  const origin = normalizeOrigin(app.origin ?? app.redirect_uri)

  if (!origin) {
    throw createServiceError("invalid_app_context", 400)
  }

  return {
    id: app.id ?? origin,
    origin,
    redirect_uri: app.redirect_uri,
    next: app.next ?? null,
  }
}

function getAppContextFromToken(
  input: TokenVerifyInput,
  payload: GorthTokenPayload
): SsoAppContext {
  const app = input.app ?? {}
  const origin = normalizeOrigin(
    app.origin ?? app.redirect_uri ?? payload.app_origin
  )

  if (!origin) {
    throw createServiceError("invalid_app_context", 400)
  }

  return {
    id: app.id ?? payload.app ?? origin,
    origin,
    redirect_uri: app.redirect_uri ?? origin,
    next: app.next ?? null,
  }
}

function getTokenSecrets() {
  return {
    accessTokenSecret: getRequiredSecret(
      "SSO_ACCESS_TOKEN_SECRET",
      accessTokenSecret ?? betterAuthSecret ?? jwtSecret
    ),
    refreshTokenSecret: getRequiredSecret(
      "SSO_REFRESH_TOKEN_SECRET",
      refreshTokenSecret ?? betterAuthSecret ?? jwtSecret
    ),
  }
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
  issuer: string,
  user: SsoUser,
  appContext: SsoAppContext,
  sessionId: string | null
) {
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
      { ...tokenBasePayload, typ: "access" },
      accessTokenSecret,
      {
        expiresIn: getExpiresIn("access", "15m"),
        issuer,
        audience: appContext.id,
        jwtid: randomUUID(),
      }
    ),
    refresh_token: jwt.sign(
      { ...tokenBasePayload, typ: "refresh" },
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
    throw createServiceError("invalid_token", 401)
  }

  return payload as GorthTokenPayload
}

function verifyJwt(
  token: string,
  secret: string,
  expectedType: GorthTokenPayload["typ"]
) {
  return assertTokenPayload(jwt.verify(token, secret), expectedType)
}

export async function getOAuthClientRedirectPolicy(
  input: OAuthClientRedirectPolicy
) {
  return isOAuthClientRedirectAllowed(input.url, input.purpose)
}

export async function createTokenBundle(
  input: TokenBundleInput,
  headers: IncomingHttpHeaders,
  issuer: string
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers),
  })

  if (!session?.user?.email) {
    throw createServiceError("unauthorized", 401)
  }

  const appContext = getAppContext(input.app)
  const user = formatSsoUser(session.user)

  return formatSsoTokenResponse(
    user,
    appContext,
    signTokenPair(issuer, user, appContext, getSessionId(session))
  )
}

export async function verifyToken(input: TokenVerifyInput, issuer: string) {
  const accessToken = input.access_token ?? ""
  const refreshToken = input.refresh_token ?? ""
  const { accessTokenSecret, refreshTokenSecret } = getTokenSecrets()

  if (!accessToken && !refreshToken) {
    throw createServiceError("missing_token", 401)
  }

  try {
    const accessPayload = verifyJwt(accessToken, accessTokenSecret, "access")
    const appContext = getAppContextFromToken(input, accessPayload)
    const user = formatSsoUserFromClaims({
      id: accessPayload.sub,
      email: accessPayload.email,
      role: accessPayload.role,
      name: accessPayload.name,
      preferredUsername: accessPayload.preferred_username,
      givenName: accessPayload.given_name,
      familyName: accessPayload.family_name,
      picture: accessPayload.picture,
    })

    return formatSsoTokenResponse(user, appContext, {
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  } catch (error) {
    if (!(error instanceof jwt.TokenExpiredError) || !refreshToken) {
      throw error
    }
  }

  const refreshPayload = verifyJwt(refreshToken, refreshTokenSecret, "refresh")
  const appContext = getAppContextFromToken(input, refreshPayload)
  const user = formatSsoUserFromClaims({
    id: refreshPayload.sub,
    email: refreshPayload.email,
    role: refreshPayload.role,
    name: refreshPayload.name,
    preferredUsername: refreshPayload.preferred_username,
    givenName: refreshPayload.given_name,
    familyName: refreshPayload.family_name,
    picture: refreshPayload.picture,
  })

  return formatSsoTokenResponse(
    user,
    appContext,
    signTokenPair(issuer, user, appContext, refreshPayload.sid ?? null)
  )
}
