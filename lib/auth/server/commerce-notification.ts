import "server-only"
import { requestToResourceInput, verifyAccessTokenRequest } from "better-auth/oauth2"
import { betterAuthUrl } from "@/utils/environment"
import { createServiceError } from "@/services/helper"
import { checkCommerceNotificationClient } from "@/services/commerce-notification"

export async function requireCommerceNotificationClient(request: Request, application: string) {
  if (["cookie", "origin", "sec-fetch-site"].some(header => request.headers.has(header)))
    throw createServiceError("machine_request_required", 403)
  const input = requestToResourceInput(request)
  if (!input.authorizationHeader || !/^Bearer [^\s]+$/i.test(input.authorizationHeader))
    throw createServiceError("unauthorized", 401)
  if (!betterAuthUrl) throw createServiceError("sso_not_configured", 503)
  input.authorizationHeader = "Bearer " + input.authorizationHeader.slice(7)
  const audience = new URL("/auth/commerce/notification-recipient", betterAuthUrl).href
  const claims = await verifyAccessTokenRequest(input, {
    jwksUrl: new URL("/auth/jwks", betterAuthUrl).href,
    requiredScopes: ["commerce:notification:recipient"],
    verifyOptions: {
      issuer: new URL("/auth", betterAuthUrl).href, audience, typ: "at+jwt",
      algorithms: ["RS256", "ES256", "EdDSA"],
      requiredClaims: ["iss", "aud", "sub", "client_id", "iat", "exp"],
      maxTokenAge: 120, clockTolerance: 0,
    },
  })
  if (typeof claims.client_id !== "string" || !claims.client_id || claims.sub !== claims.client_id ||
    claims.sid !== undefined || typeof claims.iat !== "number" || typeof claims.exp !== "number" ||
    claims.exp <= claims.iat || claims.exp - claims.iat > 120 ||
    (claims.status !== undefined && claims.status !== "active"))
    throw createServiceError("machine_request_required", 403)
  await checkCommerceNotificationClient(claims.client_id, application, audience)
}
