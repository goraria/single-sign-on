import { ssoServerUrl } from "@/lib/utils/environment"
import {
  fetcher,
  toWebResponse,
  type FetcherOptions,
} from "@/lib/utils/fetcher"
import { encodePathSegments, requireUrl } from "@/lib/utils/formatter"
import type { SsoExchangeResponse } from "@/lib/utils/interface"

export interface RouteSession {
  user?: {
    id?: string
    role?: string
  }
}

export interface VerifyTokenPayload {
  access_token: string
  refresh_token: string
  app?: object
}

export interface AvatarUploadRequest {
  url: string
  bucket: string
  path: string
  secretKey: string
  file: File
}

export interface SignOutRouteRequest {
  cookie?: string | null
  origin: string
}

export interface ForwardAuthRouteRequest {
  url: URL
  method: string
  headers: Headers
  body?: string
}

export interface ForwardAdminRouteRequest {
  path: readonly string[]
  requestUrl: URL
  method: string
  headers: Headers
  body?: string
}

function getSsoServerBaseUrl() {
  return requireUrl(ssoServerUrl, "SSO_SERVER_INTERNAL_URL")
}

function getInternalHeaders() {
  const secret = process.env.SSO_CLIENT_INTERNAL_SECRET
  return secret ? { "x-sso-client-secret": secret } : {}
}

export async function getRouteSession(cookie: string) {
  const response = await fetcher<RouteSession | null>({
    url: new URL("/auth/get-session", getSsoServerBaseUrl()),
    method: "GET",
    headers: { cookie },
    cache: "no-store",
    validateStatus: () => true,
  })

  return response.status >= 200 && response.status < 300 ? response.data : null
}

export function verifyRouteToken(body: VerifyTokenPayload) {
  return fetcher<SsoExchangeResponse, VerifyTokenPayload>({
    url: new URL("/internal/sso/verify-token", getSsoServerBaseUrl()),
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      ...getInternalHeaders(),
    },
    cache: "no-store",
    validateStatus: () => true,
  })
}

export async function uploadRouteAvatar({
  url,
  bucket,
  path,
  secretKey,
  file,
}: AvatarUploadRequest) {
  const encodedBucket = encodeURIComponent(bucket)
  const encodedPath = encodePathSegments(path)
  const response = await fetcher<unknown, ArrayBuffer>({
    url: `${url}/storage/v1/object/${encodedBucket}/${encodedPath}`,
    method: "POST",
    body: await file.arrayBuffer(),
    headers: {
      apikey: secretKey,
      "Content-Type": file.type,
      "x-upsert": "false",
      ...(secretKey.startsWith("eyJ")
        ? { Authorization: `Bearer ${secretKey}` }
        : {}),
    },
    validateStatus: () => true,
  })

  return {
    encodedBucket,
    encodedPath,
    response: toWebResponse(response),
  }
}

export async function signOutRouteSession({
  cookie,
  origin,
}: SignOutRouteRequest) {
  const response = await fetcher({
    url: new URL("/auth/sign-out", getSsoServerBaseUrl()),
    method: "POST",
    body: {},
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...getInternalHeaders(),
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: origin,
      Referer: `${origin}/auth/sign-out`,
    },
    cache: "no-store",
    validateStatus: () => true,
  })

  return toWebResponse(response)
}

export async function forwardAuthRoute({
  url,
  method,
  headers,
  body,
}: ForwardAuthRouteRequest) {
  const response = await fetcher<ArrayBuffer, string | undefined>({
    url,
    method: method as FetcherOptions["method"],
    body,
    headers: Object.fromEntries(headers),
    redirect: "manual",
    cache: "no-store",
    responseType: "arraybuffer",
    validateStatus: () => true,
  })

  return toWebResponse(response)
}

export async function forwardAdminRoute({
  path,
  requestUrl,
  method,
  headers,
  body,
}: ForwardAdminRouteRequest) {
  const encodedPath = path.map(encodeURIComponent).join("/")
  const url = new URL(`/admin/${encodedPath}`, getSsoServerBaseUrl())
  url.search = requestUrl.search

  const forwardedHeaders = Object.fromEntries(headers)

  for (const name of [
    "host",
    "content-length",
    "accept-encoding",
    "connection",
    "transfer-encoding",
  ]) {
    delete forwardedHeaders[name]
  }

  const response = await fetcher<ArrayBuffer, string | undefined>({
    url,
    method: method as FetcherOptions["method"],
    body,
    headers: {
      ...forwardedHeaders,
      ...getInternalHeaders(),
    },
    cache: "no-store",
    responseType: "arraybuffer",
    validateStatus: () => true,
  })

  return toWebResponse(response)
}
