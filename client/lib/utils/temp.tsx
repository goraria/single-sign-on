import type { SsoApplication, SsoApplicationPayload } from "@/services/admin"

export interface SsoApplicationFormState {
  id: string
  clientId: string
  name: string
  description: string
  homepageUrl: string
  icon: string
  redirectUris: string
  postLogoutRedirectUris: string
  scopes: string
  grantTypes: string
  responseTypes: string
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

export function joinLines(values: string[]) {
  return values.join("\n")
}

export function splitLines(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
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
    redirectUris: joinLines(application.redirectUris),
    postLogoutRedirectUris: joinLines(application.postLogoutRedirectUris),
    scopes: joinLines(application.scopes),
    grantTypes: joinLines(application.grantTypes),
    responseTypes: joinLines(application.responseTypes),
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
    clientId: form.clientId.trim(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    homepageUrl: form.homepageUrl.trim() || null,
    icon: form.icon.trim() || null,
    redirectUris: splitLines(form.redirectUris),
    postLogoutRedirectUris: splitLines(form.postLogoutRedirectUris),
    scopes: splitLines(form.scopes),
    grantTypes: splitLines(form.grantTypes),
    responseTypes: splitLines(form.responseTypes),
    public: form.public,
    requirePKCE: form.requirePKCE,
    tokenEndpointAuthMethod: form.tokenEndpointAuthMethod.trim() || "none",
    skipConsent: form.skipConsent,
    disabled: form.disabled,
  }
}
