"use client"

import { apiBaseUrl } from "@/lib/utils/environment"

const fallbackApiBaseUrl = "http://localhost:8080"

export interface SsoApplication {
  id: string
  clientId: string
  name: string
  description: string | null
  homepageUrl: string | null
  icon: string | null
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
  createdAt: string
  updatedAt: string
}

export interface SsoApplicationPayload {
  clientId: string
  name: string
  description?: string | null
  homepageUrl?: string | null
  icon?: string | null
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

interface ApiEnvelope<TData> {
  data?: TData
  message?: string
  error?: string
}

function getApiUrl(path: string) {
  return `${apiBaseUrl ?? fallbackApiBaseUrl}${path}`
}

async function requestAdministrator<TData>(path: string, init?: RequestInit) {
  const response = await fetch(getApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  })
  const payload = (await response.json()) as ApiEnvelope<TData>

  if (!response.ok) {
    throw new Error(
      payload.error ?? payload.message ?? "Administrator request failed"
    )
  }

  return payload.data as TData
}

export function listSsoApplications() {
  return requestAdministrator<SsoApplication[]>(
    "/administrator/sso-applications"
  )
}

export function createSsoApplication(payload: SsoApplicationPayload) {
  return requestAdministrator<SsoApplication>(
    "/administrator/sso-applications",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export function updateSsoApplication(
  id: string,
  payload: SsoApplicationPayload
) {
  return requestAdministrator<SsoApplication>(
    `/administrator/sso-applications/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )
}

export function deleteSsoApplication(id: string) {
  return requestAdministrator<{ id: string }>(
    `/administrator/sso-applications/${id}`,
    { method: "DELETE" }
  )
}
