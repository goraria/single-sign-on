import type {
  SsoApplication,
  SsoApplicationPayload,
} from "@/services/client/admin"

export interface SsoApplicationFormState {
  id: string
  clientId: string
  name: string
  description: string
  homepageUrl: string
  icon: string
  redirectUris: string[]
  postLogoutRedirectUris: string[]
  scopes: string[]
  grantTypes: string[]
  responseTypes: string[]
  public: boolean
  requirePKCE: boolean
  tokenEndpointAuthMethod: string
  skipConsent: boolean
  disabled: boolean
}

export function isExternalRedirect(value: string | null) {
  if (!value) {
    return false
  }

  try {
    const target = new URL(value)
    return ["http:", "https:"].includes(target.protocol)
  } catch {
    return false
  }
}

export function buildLegacyDisabledPath() {
  return "/auth/error?error=legacy_sso_issue_disabled"
}

export function hasOAuthQuery(searchParams: URLSearchParams) {
  return Boolean(
    searchParams.get("client_id") &&
    searchParams.get("redirect_uri") &&
    searchParams.get("response_type")
  )
}

export function buildOAuthAuthorizePath(searchParams: URLSearchParams) {
  return `/auth/oauth2/authorize?${searchParams.toString()}`
}

function cleanList(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
}

export function toSsoApplicationFormState(
  application: SsoApplication
): SsoApplicationFormState {
  return {
    id: application.id,
    clientId: application.clientId,
    name: application.name,
    description: application.description ?? "",
    homepageUrl: application.homepageUrl ?? "",
    icon: application.icon ?? "",
    redirectUris: application.redirectUris,
    postLogoutRedirectUris: application.postLogoutRedirectUris,
    scopes: application.scopes,
    grantTypes: application.grantTypes,
    responseTypes: application.responseTypes,
    public: application.public,
    requirePKCE: application.requirePKCE,
    tokenEndpointAuthMethod: application.tokenEndpointAuthMethod,
    skipConsent: application.skipConsent,
    disabled: application.disabled,
  }
}

export function toSsoApplicationPayload(
  form: SsoApplicationFormState
): SsoApplicationPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    homepageUrl: form.homepageUrl.trim() || null,
    icon: form.icon.trim() || null,
    redirectUris: cleanList(form.redirectUris),
    postLogoutRedirectUris: cleanList(form.postLogoutRedirectUris),
    scopes: cleanList(form.scopes),
    grantTypes: cleanList(form.grantTypes),
    responseTypes: cleanList(form.responseTypes),
    public: form.tokenEndpointAuthMethod === "none",
    requirePKCE: form.requirePKCE,
    tokenEndpointAuthMethod: form.tokenEndpointAuthMethod.trim() || "none",
    skipConsent: form.skipConsent,
    disabled: form.disabled,
  }
}
