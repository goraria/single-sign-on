import "server-only"
import { randomUUID } from "node:crypto"
import {
  APIError,
  createAuthEndpoint,
  getAuthoritativeSessionFromCtx,
} from "better-auth/api"
import { signJWT, type JwtOptions } from "better-auth/plugins/jwt"
import { getSsoMediaRegistration } from "@/services/media-registration"
import { getUserProfileClaims } from "@/services/user"

export const ssoMediaClientId = "gorth-single-sign-on"

// No HTTP endpoint: only the SSO server may delegate its verified session.
// Uses Better Auth's persisted, encrypted JWKS and current key rotation policy.
export function mediaAccess(jwtOptions: JwtOptions) {
  return {
    id: "sso-media-access",
    endpoints: {
      issueMediaAccessToken: createAuthEndpoint.serverOnly(
        { method: "POST", requireHeaders: true },
        async (ctx) => {
          const session = await getAuthoritativeSessionFromCtx(ctx)
          if (!session)
            throw new APIError("UNAUTHORIZED", { message: "unauthorized" })
          const profile = await getUserProfileClaims(session.user.id)
          if (profile.status !== "active")
            throw new APIError("FORBIDDEN", { message: "inactive_user" })
          const policy = await getSsoMediaRegistration().catch(() => {
            throw new APIError("SERVICE_UNAVAILABLE", {
              message: "sso_media_registration_required",
            })
          })
          const now = Math.floor(Date.now() / 1000)
          const issuer = ctx.context.baseURL.replace(/\/$/, "")
          const token = await signJWT(ctx, {
            options: jwtOptions,
            header: { typ: "at+jwt" },
            signingAlgorithm: policy.algorithm ?? undefined,
            signingKeyId: policy.keyId ?? undefined,
            payload: {
              iss: issuer,
              aud: [policy.identifier, `${issuer}/oauth2/userinfo`],
              sub: session.user.id,
              sid: session.session.id,
              client_id: ssoMediaClientId,
              azp: ssoMediaClientId,
              scope: "openid profile email sso:read sso:write",
              status: "active",
              iat: now,
              exp: now + policy.ttl,
              jti: randomUUID(),
            },
          })
          // The upload must use the same registry snapshot as the signed audience.
          return { token, resourceIdentifier: policy.identifier }
        }
      ),
    },
  } as const
}
