import "server-only"
import {
  verifyAccessTokenRequest,
  requestToResourceInput,
} from "better-auth/oauth2"
import { betterAuthUrl, isProduction } from "@/utils/environment"
import { createServiceError } from "@/services/helper"
import { authorizeStorageClient } from "@/services/storage-credential"

export function storageCredentialAudience() {
  if (!betterAuthUrl) throw createServiceError("auth_not_configured", 503)
  const origin = new URL(betterAuthUrl)
  if (
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== "/" ||
    !(
      origin.protocol === "https:" ||
      (!isProduction &&
        origin.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))
    )
  ) {
    throw createServiceError("invalid_auth_configuration", 503)
  }
  return new URL("/internal/storage/credential", origin).href
}

export function requireMediaStorageClient() {
  return async (request: Request) => {
    // This endpoint is not a browser API, even for an administrator's session.
    if (
      request.headers.has("cookie") ||
      request.headers.has("origin") ||
      request.headers.has("sec-fetch-site")
    )
      throw createServiceError("forbidden_browser_request", 403)
    const input = requestToResourceInput(request)
    if (
      !input.authorizationHeader ||
      !/^Bearer [^\s]+$/i.test(input.authorizationHeader)
    ) {
      throw createServiceError("unauthorized", 401)
    }
    input.authorizationHeader = "Bearer " + input.authorizationHeader.slice(7)
    const audience = storageCredentialAudience()
    const claims = await verifyAccessTokenRequest(input, {
      jwksUrl: new URL("/auth/jwks", audience).href,
      requiredScopes: ["storage:sso:credential"],
      verifyOptions: {
        issuer: new URL("/auth", audience).href,
        audience,
        typ: "at+jwt",
        algorithms: ["RS256", "ES256", "EdDSA"],
        requiredClaims: ["iss", "aud", "sub", "client_id", "iat", "exp"],
        maxTokenAge: 120,
        clockTolerance: 0,
      },
    })
    if (
      typeof claims.client_id !== "string" ||
      claims.sub !== claims.client_id ||
      claims.sid !== undefined ||
      typeof claims.exp !== "number" ||
      typeof claims.iat !== "number" ||
      claims.exp - claims.iat > 120
    )
      throw createServiceError("forbidden_storage_client", 403)
    await authorizeStorageClient(claims.client_id, audience)
  }
}
