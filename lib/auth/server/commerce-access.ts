import "server-only"
import {
  verifyAccessTokenRequest,
  requestToResourceInput,
} from "better-auth/oauth2"
import {
  APIError,
  createAuthEndpoint,
  sessionMiddleware,
} from "better-auth/api"
import { HTTPException } from "hono/http-exception"
import { betterAuthUrl } from "@/utils/environment"
import { createServiceError } from "@/services/helper"
import {
  getCommerceRegistration,
  updateCommerceTeamRole,
} from "@/services/commerce-access"
import { commerceTeamRoleInput } from "@/schemas/commerce-access"
export async function requireCommerceUser(request: Request, mutation = false) {
  if (
    request.headers.has("cookie") ||
    request.headers.has("origin") ||
    request.headers.has("sec-fetch-site")
  )
    throw createServiceError("server_request_required", 403)
  const input = requestToResourceInput(request),
    resource = request.headers.get("x-oauth-resource")
  if (
    !input.authorizationHeader ||
    !/^Bearer [^\s]+$/i.test(input.authorizationHeader)
  )
    throw createServiceError("unauthorized", 401)
  if (!betterAuthUrl || !resource)
    throw createServiceError("commerce_resource_required", 400)
  const clientIdHeader = request.headers.get("x-oauth-client-id")
  if (
    !clientIdHeader ||
    ![
      "gorth-online-marketplace-solution",
      "gorth-restaurant-chain-management-system",
      "gorth-restaurant-chain-management",
    ].includes(clientIdHeader)
  )
    throw createServiceError("commerce_client_required", 403)
  await getCommerceRegistration(resource, clientIdHeader)
  const application =
    clientIdHeader === "gorth-online-marketplace-solution"
      ? "marketplace"
      : "restaurant"
  input.authorizationHeader = "Bearer " + input.authorizationHeader.slice(7)
  const claims = await verifyAccessTokenRequest(input, {
    jwksUrl: new URL("/auth/jwks", betterAuthUrl).href,
    requiredScopes: [application + (mutation ? ":write" : ":read")],
    verifyOptions: {
      issuer: new URL("/auth", betterAuthUrl).href,
      audience: resource,
      typ: "at+jwt",
      algorithms: ["RS256", "ES256", "EdDSA"],
      requiredClaims: ["sub", "iat", "exp", "iss", "aud"],
      maxTokenAge: 600,
      clockTolerance: 0,
    },
  })
  if (
    typeof claims.sub !== "string" ||
    claims.sub === clientIdHeader ||
    (claims.client_id ?? claims.azp) !== clientIdHeader ||
    typeof claims.iat !== "number" ||
    typeof claims.exp !== "number" ||
    claims.exp - claims.iat > 600 ||
    claims.exp <= claims.iat
  )
    throw createServiceError("invalid_user_token", 401)
  return { subject: claims.sub, resource, sessionId: claims.sid }
}
export function commerceTeamAccess() {
  return {
    id: "commerce-team-access",
    schema: {
      teamMember: {
        fields: {
          role: {
            type: "string" as const,
            required: true,
            defaultValue: "member",
            input: false,
          },
        },
      },
    },
    endpoints: {
      updateCommerceTeamRole: createAuthEndpoint(
        "/organization/update-team-member-role",
        {
          method: "POST",
          body: commerceTeamRoleInput,
          use: [sessionMiddleware],
        },
        async (ctx) => {
          try {
            return ctx.json(
              await updateCommerceTeamRole(
                ctx.context.session.user.id,
                ctx.body,
              ),
            )
          } catch (error) {
            if (error instanceof HTTPException) {
              const status =
                error.status === 403
                  ? "FORBIDDEN"
                  : error.status === 404
                    ? "NOT_FOUND"
                    : error.status === 409
                      ? "CONFLICT"
                      : "BAD_REQUEST"
              throw new APIError(status, { message: error.message })
            }
            throw error
          }
        },
      ),
    },
  }
}
