import type {
  OAuthResource,
  OAuthResourcePayload,
} from "@/services/client/admin"
import { adminServices } from "@/utils/constant"

export interface OAuthResourceFormState {
  identifier: string
  name: string
  accessTokenTtl: string
  refreshTokenTtl: string
  signingAlgorithm: NonNullable<OAuthResourcePayload["signingAlgorithm"]> | ""
  signingKeyId: string
  allowedScopes: string[]
  restrictScopes: boolean
  dpopBoundAccessTokensRequired: boolean
  disabled: boolean
}

export const oauthSigningAlgorithms = [
  "RS256",
  "PS256",
  "ES256",
  "ES512",
  "EdDSA",
] as const

export function toOAuthResourceFormState(
  resource?: OAuthResource
): OAuthResourceFormState {
  return {
    identifier: resource?.identifier ?? "",
    name: resource?.name ?? "",
    accessTokenTtl: resource?.accessTokenTtl?.toString() ?? "",
    refreshTokenTtl: resource?.refreshTokenTtl?.toString() ?? "",
    signingAlgorithm:
      oauthSigningAlgorithms.find(
        (algorithm) => algorithm === resource?.signingAlgorithm
      ) ?? "",
    signingKeyId: resource?.signingKeyId ?? "",
    allowedScopes: resource?.allowedScopes ?? [
      "openid",
      "profile",
      "email",
      "offline_access",
    ],
    restrictScopes: resource ? resource.allowedScopes !== null : true,
    dpopBoundAccessTokensRequired:
      resource?.dpopBoundAccessTokensRequired ?? false,
    disabled: resource?.disabled ?? false,
  }
}

export function toOAuthResourcePayload(
  form: OAuthResourceFormState
): OAuthResourcePayload {
  return {
    identifier: form.identifier.trim(),
    name: form.name.trim(),
    accessTokenTtl: form.accessTokenTtl.trim()
      ? Number(form.accessTokenTtl)
      : null,
    refreshTokenTtl: form.refreshTokenTtl.trim()
      ? Number(form.refreshTokenTtl)
      : null,
    signingAlgorithm: form.signingAlgorithm || null,
    signingKeyId: form.signingKeyId.trim() || null,
    allowedScopes: form.restrictScopes
      ? [
          ...new Set(
            form.allowedScopes.map((scope) => scope.trim()).filter(Boolean)
          ),
        ]
      : null,
    dpopBoundAccessTokensRequired: form.dpopBoundAccessTokensRequired,
    disabled: form.disabled,
  }
}

export function getOAuthResourceService(
  resource: Pick<OAuthResource, "application">
) {
  return adminServices.find(
    (service) => resource.application === `shared-${service.repository}`
  )
}
